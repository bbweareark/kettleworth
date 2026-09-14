import { and, asc, desc, eq, gte, lt, lte, sql } from "drizzle-orm";
import { db, week, trainingSession, exerciseInstance, substitution, auditLog } from "@kettleworth/db";
import { adaptWeek, detectStaleness, applyAdaptations, checkInToAdaptations, substitutesFor, estimate1RM, type CheckInChoice, type ExerciseTrend } from "@kettleworth/core";
import type { Adaptation } from "@kettleworth/types";
import { getProfile } from "./profile";
import { getActiveProgramme } from "./programme";
import { libraryForEngine } from "./library";
import { weekStats } from "./coach";

const addDays = (d: string, n: number) => { const x = new Date(d + "T00:00:00Z"); x.setUTCDate(x.getUTCDate() + n); return x.toISOString().slice(0, 10); };

/** Per-exercise trend over the last 4 weeks: e1RM change and how often the user swapped it out. Feeds staleness detection. */
async function exerciseTrends(userId: string, role: Record<string, string>): Promise<ExerciseTrend[]> {
  const since = addDays(new Date().toISOString().slice(0, 10), -28);
  const rows = await db().select({ exerciseId: exerciseInstance.exerciseId, logged: exerciseInstance.loggedSets, date: trainingSession.scheduledOn }).from(exerciseInstance).innerJoin(trainingSession, eq(exerciseInstance.sessionId, trainingSession.id)).where(and(eq(trainingSession.userId, userId), eq(trainingSession.status, "completed"), gte(trainingSession.scheduledOn, since))).orderBy(asc(trainingSession.scheduledOn));
  const by = new Map<string, { date: string; e1rm: number }[]>();
  for (const r of rows) { const best = Math.max(0, ...r.logged.filter((s) => s.completed && s.weightKg && s.reps).map((s) => estimate1RM(s.weightKg!, s.reps!))); if (best > 0) (by.get(r.exerciseId) ?? by.set(r.exerciseId, []).get(r.exerciseId)!).push({ date: r.date, e1rm: best }); }
  const swaps = await db().select({ from: substitution.fromExerciseId, n: sql<number>`count(*)::int` }).from(substitution).where(and(eq(substitution.userId, userId), gte(substitution.createdAt, new Date(since)))).groupBy(substitution.fromExerciseId);
  const swapCount = Object.fromEntries(swaps.map((s) => [s.from, s.n]));
  const lib = await libraryForEngine();
  const out: ExerciseTrend[] = [];
  for (const [id, pts] of by) {
    const weeks = new Set(pts.map((p) => p.date.slice(0, 7) + Math.floor(new Date(p.date).getTime() / (7 * 86400000)))).size;
    const first = pts[0]!.e1rm, last = pts[pts.length - 1]!.e1rm;
    out.push({ exerciseId: id, name: lib.find((e) => e.id === id)?.name ?? id, weeksTracked: weeks, e1rmChangePct: first ? ((last - first) / first) * 100 : 0, swapsRequested: swapCount[id] ?? 0, role: role[id] ?? "accessory" });
  }
  for (const [id, n] of Object.entries(swapCount)) if (!by.has(id)) out.push({ exerciseId: id, name: lib.find((e) => e.id === id)?.name ?? id, weeksTracked: 0, e1rmChangePct: 0, swapsRequested: n, role: role[id] ?? "accessory" });
  return out;
}

/**
 * Weekly adaptation, applied. Idempotent per week: looks at last week's feedback and 4-week trends, writes adaptations to the
 * week row and rewrites this week's planned sets (and swaps stale exercises) so the plan actually changes, not just the letter.
 */
export async function runWeeklyAdaptation(userId: string, weekStartsOn?: string, extra: Adaptation[] = []): Promise<{ applied: Adaptation[]; changed: number } | null> {
  const prog = await getActiveProgramme(userId);
  const rec = await getProfile(userId);
  if (!prog || !rec) return null;
  const today = new Date().toISOString().slice(0, 10);
  const weeks = await db().select().from(week).where(eq(week.programmeId, prog.id)).orderBy(asc(week.weekNumber));
  const target = weekStartsOn ? weeks.find((w) => w.startsOn === weekStartsOn) : weeks.find((w) => w.startsOn <= today && addDays(w.startsOn, 7) > today);
  if (!target) return null;
  if (target.adaptedAt && !extra.length) return { applied: target.adaptations, changed: 0 };
  const prev = weeks.find((w) => w.weekNumber === target.weekNumber - 1);
  let adaptations: Adaptation[] = [...extra];
  if (!target.adaptedAt) {
    if (prev) {
      const stats = await weekStats(userId, prev.startsOn);
      if (stats.planned > 0) adaptations.push(...adaptWeek(stats.feedback));
    }
    const sessions = await db().select({ id: trainingSession.id }).from(trainingSession).where(and(eq(trainingSession.weekId, target.id), eq(trainingSession.status, "planned")));
    const insts = sessions.length ? await db().select().from(exerciseInstance).where(sql`${exerciseInstance.sessionId} in ${sql.raw(`(${sessions.map((s) => `'${s.id}'`).join(",")})`)}`) : [];
    const role = Object.fromEntries(insts.map((i) => [i.exerciseId, i.role]));
    adaptations.push(...detectStaleness(await exerciseTrends(userId, role), rec.profile.varietyPreference));
    if (target.isDeload) adaptations = adaptations.filter((a) => a.kind === "swap" || a.kind === "hold"); // planned deload already handles fatigue
  }
  const sessions = await db().select({ id: trainingSession.id }).from(trainingSession).where(and(eq(trainingSession.weekId, target.id), eq(trainingSession.status, "planned")));
  const insts = sessions.length ? await db().select().from(exerciseInstance).where(sql`${exerciseInstance.sessionId} in ${sql.raw(`(${sessions.map((s) => `'${s.id}'`).join(",")})`)}`) : [];
  // "fresh": rotate every accessory this week
  if (adaptations.some((a) => a.kind === "swap" && a.exerciseId === null)) for (const i of insts) if (i.role === "accessory" || i.role === "finisher") adaptations.push({ exerciseId: i.exerciseId, kind: "swap", magnitude: null, reason: "Rotated for a fresh stimulus this week." });
  const changes = applyAdaptations(insts.map((i) => ({ id: i.id, exerciseId: i.exerciseId, role: i.role, plannedSets: i.plannedSets })), adaptations);
  const lib = await libraryForEngine();
  let changed = 0;
  for (const c of changes) {
    if (c.swapTo) {
      const inst = insts.find((i) => i.id === c.instanceId)!; const cur = lib.find((e) => e.id === inst.exerciseId); if (!cur) continue;
      const sub = substitutesFor(lib, cur, rec.profile, 3).find((s) => !insts.some((x) => x.exerciseId === s.exercise.id));
      if (!sub) continue;
      await db().update(exerciseInstance).set({ originalExerciseId: inst.originalExerciseId ?? inst.exerciseId, exerciseId: sub.exercise.id, plannedSets: inst.plannedSets.map((s) => ({ ...s, weightKg: null })), loggedSets: [], swappedReason: "weekly adaptation", notes: c.note, rationale: sub.reason }).where(eq(exerciseInstance.id, c.instanceId));
    } else await db().update(exerciseInstance).set({ plannedSets: c.plannedSets, notes: c.note }).where(eq(exerciseInstance.id, c.instanceId));
    changed++;
  }
  const all = [...(target.adaptedAt ? target.adaptations : []), ...adaptations];
  await db().update(week).set({ adaptations: all, adaptedAt: new Date() }).where(eq(week.id, target.id));
  await db().insert(auditLog).values({ userId, action: "week.adapted", target: target.id, meta: { week: target.weekNumber, adaptations: adaptations.map((a) => a.kind), changed } });
  return { applied: all, changed };
}

/** Monday check-in: the user's own read on the week, applied through the same engine. */
export async function weeklyCheckIn(userId: string, choice: CheckInChoice) {
  const prog = await getActiveProgramme(userId);
  if (!prog) throw new Error("No active programme");
  const today = new Date().toISOString().slice(0, 10);
  const [w] = await db().select().from(week).where(and(eq(week.programmeId, prog.id), lte(week.startsOn, today), sql`${week.startsOn} > ${addDays(today, -7)}`)).orderBy(desc(week.startsOn)).limit(1);
  if (!w) throw new Error("No current week");
  if (w.checkin) return { applied: w.adaptations, changed: 0, already: true };
  await db().update(week).set({ checkin: choice, checkinAt: new Date() }).where(eq(week.id, w.id));
  const r = await runWeeklyAdaptation(userId, w.startsOn, checkInToAdaptations(choice));
  return { ...(r ?? { applied: [], changed: 0 }), already: false };
}

export async function currentWeekState(userId: string) {
  const prog = await getActiveProgramme(userId);
  if (!prog) return null;
  const today = new Date().toISOString().slice(0, 10);
  const [w] = await db().select().from(week).where(and(eq(week.programmeId, prog.id), lte(week.startsOn, today), sql`${week.startsOn} > ${addDays(today, -7)}`)).orderBy(desc(week.startsOn)).limit(1);
  if (!w) return null;
  const [prev] = await db().select({ id: week.id }).from(week).where(and(eq(week.programmeId, prog.id), lt(week.weekNumber, w.weekNumber))).limit(1);
  return { week: w, hasPrevious: !!prev };
}
