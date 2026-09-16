import { and, asc, desc, eq, inArray, sql } from "drizzle-orm";
import { db, programme, mesocycle, week, trainingSession, exerciseInstance, auditLog, estimatedMax } from "@kettleworth/db";
import { generateProgramme, validatePlanAgainstLibrary, substitutesFor, undulate, restFor } from "@kettleworth/core";
import type { ProgrammePlan } from "@kettleworth/types";
import { getProfile } from "./profile";
import { libraryForEngine, getExercisesByIds } from "./library";
import { programmeCoachNote, aiAvailable } from "../ai/tasks";

const DAY_OFFSETS: Record<number, number[]> = { 1: [0], 2: [0, 3], 3: [0, 2, 4], 4: [0, 1, 3, 4], 5: [0, 1, 2, 4, 5], 6: [0, 1, 2, 3, 4, 5], 7: [0, 1, 2, 3, 4, 5, 6] };
const addDays = (d: string, n: number) => { const x = new Date(d + "T00:00:00Z"); x.setUTCDate(x.getUTCDate() + n); return x.toISOString().slice(0, 10); };

export async function generateAndSaveProgramme(userId: string, opts: { startDate?: string; weeks?: number; continueFrom?: boolean } = {}) {
  const rec = await getProfile(userId);
  if (!rec) throw new Error("Complete onboarding first");
  const library = await libraryForEngine();
  const seed = `${userId}:${Date.now()}`;
  // Latest logged strength per exercise beats the intake numbers.
  const maxes = await db().select().from(estimatedMax).where(eq(estimatedMax.userId, userId)).orderBy(desc(estimatedMax.recordedAt));
  const e1rmOverrides: Record<string, number> = {};
  for (const m of maxes) if (!(m.exerciseId in e1rmOverrides)) e1rmOverrides[m.exerciseId] = m.e1rmKg;
  const prev = opts.continueFrom ? await getActiveProgramme(userId) ?? (await db().select().from(programme).where(eq(programme.userId, userId)).orderBy(desc(programme.createdAt)).limit(1))[0] ?? null : null;
  const profileForPlan = opts.weeks ? { ...rec.profile, timelineWeeks: opts.weeks } : rec.profile;
  const plan = generateProgramme(profileForPlan, library, { seed, previousPlan: prev?.plan ?? null, e1rmOverrides });
  const errors = validatePlanAgainstLibrary(plan, library);
  if (errors.length) throw new Error(`Plan failed validation: ${errors.join("; ")}`);
  let startDate = opts.startDate ?? new Date().toISOString().slice(0, 10);
  if (prev && !opts.startDate) {
    const [last] = await db().select({ d: trainingSession.scheduledOn }).from(trainingSession).where(eq(trainingSession.programmeId, prev.id)).orderBy(desc(trainingSession.scheduledOn)).limit(1);
    if (last && last.d >= startDate) startDate = addDays(last.d, 1);
  }
  const ids = [...new Set(plan.mesocycles.flatMap((m) => m.weeks.flatMap((w) => w.sessions.flatMap((s) => s.exercises.map((e) => e.exerciseId)))))];
  const names = Object.fromEntries((await getExercisesByIds(ids)).map((e) => [e.id, e.name]));
  const note = await programmeCoachNote(userId, rec.profile, plan, names);

  // Extending queues the next block behind the current one; starting over replaces it.
  const queue = !!prev && (await db().select({ id: trainingSession.id }).from(trainingSession).where(and(eq(trainingSession.programmeId, prev.id), eq(trainingSession.status, "planned"))).limit(1)).length > 0;
  return db().transaction(async (tx) => {
    if (!queue) {
      await tx.update(programme).set({ status: "archived" }).where(and(eq(programme.userId, userId), inArray(programme.status, ["active", "scheduled"])));
      await tx.update(trainingSession).set({ status: "skipped" }).where(and(eq(trainingSession.userId, userId), eq(trainingSession.status, "planned")));
    } else {
      await tx.update(programme).set({ status: "archived" }).where(and(eq(programme.userId, userId), eq(programme.status, "scheduled"))); // one queued block at a time
      const queuedIds = await tx.select({ id: programme.id }).from(programme).where(and(eq(programme.userId, userId), eq(programme.status, "archived"), sql`${programme.createdAt} > now() - interval '1 second'`));
      if (queuedIds.length) await tx.delete(trainingSession).where(and(inArray(trainingSession.programmeId, queuedIds.map((q) => q.id)), eq(trainingSession.status, "planned")));
    }
    const [p] = await tx.insert(programme).values({ userId, name: plan.name, split: plan.split, goal: rec.profile.primaryGoal, daysPerWeek: plan.daysPerWeek, totalWeeks: plan.totalWeeks, startDate, summary: plan.summary, coachNote: `${note.note}\n\nWeek one focus: ${note.weekOneFocus}`, rationale: plan.rationale, plan, seed, generatedBy: aiAvailable() ? "rules+ai" : "rules", status: queue ? "scheduled" : "active" }).returning();
    const offsets = DAY_OFFSETS[plan.daysPerWeek] ?? DAY_OFFSETS[3]!;
    let weekIdx = 0;
    for (const m of plan.mesocycles) {
      const [mrow] = await tx.insert(mesocycle).values({ programmeId: p!.id, index: m.index, name: m.name, focus: m.focus }).returning();
      for (const w of m.weeks) {
        const startsOn = addDays(startDate, weekIdx * 7);
        const [wrow] = await tx.insert(week).values({ programmeId: p!.id, mesocycleId: mrow!.id, weekNumber: w.weekNumber, isDeload: w.isDeload, intensityScalar: w.intensityScalar, volumeScalar: w.volumeScalar, startsOn }).returning();
        for (const s of w.sessions) {
          const [srow] = await tx.insert(trainingSession).values({ userId, programmeId: p!.id, weekId: wrow!.id, dayIndex: s.dayIndex, scheduledOn: addDays(startsOn, offsets[s.dayIndex] ?? s.dayIndex), name: w.isDeload ? `${s.name} · Deload` : s.name, focus: s.focus, warmup: s.warmup, estimatedMinutes: s.estimatedMinutes }).returning();
          if (s.exercises.length) await tx.insert(exerciseInstance).values(s.exercises.map((e) => ({ sessionId: srow!.id, exerciseId: e.exerciseId, order: e.order, role: e.role, plannedSets: e.sets, rationale: e.rationale, supersetGroup: e.supersetGroup })));
        }
        weekIdx++;
      }
    }
    await tx.insert(auditLog).values({ userId, action: prev ? "programme.extended" : "programme.generated", target: p!.id, meta: { seed, from: prev?.id ?? null, generatedBy: aiAvailable() ? "rules+ai" : "rules" } });
    // Built with week-to-week variety already, so the one-time catch-up pass must leave it alone.
    await tx.insert(auditLog).values({ userId, action: "programme.diversified", target: p!.id, meta: { swapped: 0, deduped: 0, builtIn: true } });
    return p!;
  });
}

export async function getActiveProgramme(userId: string) {
  const [p] = await db().select().from(programme).where(and(eq(programme.userId, userId), eq(programme.status, "active"))).orderBy(desc(programme.createdAt)).limit(1);
  if (!p) return null;
  // Promote the queued block once the current one has no planned sessions left.
  const [left] = await db().select({ id: trainingSession.id }).from(trainingSession).where(and(eq(trainingSession.programmeId, p.id), eq(trainingSession.status, "planned"))).limit(1);
  if (left) return p;
  const [next] = await db().select().from(programme).where(and(eq(programme.userId, userId), eq(programme.status, "scheduled"))).orderBy(asc(programme.createdAt)).limit(1);
  if (!next) return p;
  await db().update(programme).set({ status: "completed" }).where(eq(programme.id, p.id));
  await db().update(programme).set({ status: "active" }).where(eq(programme.id, next.id));
  return next;
}
export async function getQueuedProgramme(userId: string) {
  const [p] = await db().select().from(programme).where(and(eq(programme.userId, userId), eq(programme.status, "scheduled"))).orderBy(asc(programme.createdAt)).limit(1);
  return p ?? null;
}

export async function getProgrammeOverview(userId: string) {
  const p = await getActiveProgramme(userId);
  if (!p) return null;
  const weeks = await db().select().from(week).where(eq(week.programmeId, p.id)).orderBy(asc(week.weekNumber));
  const sessions = await db().select().from(trainingSession).where(eq(trainingSession.programmeId, p.id)).orderBy(asc(trainingSession.scheduledOn));
  const mesos = await db().select().from(mesocycle).where(eq(mesocycle.programmeId, p.id)).orderBy(asc(mesocycle.index));
  const ids = [...new Set((p.plan as ProgrammePlan).mesocycles.flatMap((m) => m.weeks.flatMap((w) => w.sessions.flatMap((s) => s.exercises.map((e) => e.exerciseId)))))];
  const exercises = await getExercisesByIds(ids);
  const today = new Date().toISOString().slice(0, 10);
  const currentWeek = weeks.find((w) => w.startsOn <= today && addDays(w.startsOn, 7) > today) ?? weeks[0] ?? null;
  const done = sessions.filter((s) => s.status === "completed").length;
  return { programme: p, mesocycles: mesos, weeks, sessions, exercises: Object.fromEntries(exercises.map((e) => [e.id, e])), currentWeek, completedSessions: done, totalSessions: sessions.length };
}

export async function getWeekSessions(userId: string, weekId: string) {
  return db().select().from(trainingSession).where(and(eq(trainingSession.userId, userId), eq(trainingSession.weekId, weekId))).orderBy(asc(trainingSession.scheduledOn));
}
export async function getSessionsByIds(ids: string[]) {
  return ids.length ? db().select().from(trainingSession).where(inArray(trainingSession.id, ids)) : [];
}

/**
 * Bring a programme built under the old rules up to the current variety rules, for sessions that have not happened:
 *  - B weeks (every second week of a block, deloads excluded) swap each secondary and accessory exercise for a close
 *    substitute that trains the same muscles, at the B-week rep range; anchor lifts stay exactly as they are.
 *  - Any session that lists the same exercise twice gets the second one replaced.
 * Idempotent per programme (recorded in the audit log) and never touches a started or finished session.
 */
export async function diversifyProgramme(userId: string, todayIso = new Date().toISOString().slice(0, 10)): Promise<{ swapped: number; deduped: number; skipped?: string }> {
  const prog = await getActiveProgramme(userId);
  if (!prog) return { swapped: 0, deduped: 0, skipped: "no active programme" };
  const programmeId = prog.id;
  const [done] = await db().select({ id: auditLog.id }).from(auditLog).where(and(eq(auditLog.userId, userId), eq(auditLog.action, "programme.diversified"), eq(auditLog.target, programmeId))).limit(1);
  if (done) return { swapped: 0, deduped: 0, skipped: "already diversified" };
  const rec = await getProfile(userId);
  if (!rec) return { swapped: 0, deduped: 0, skipped: "no profile" };
  const profile = rec.profile;
  const library = await libraryForEngine();
  const byId = new Map(library.map((e) => [e.id, e]));
  const weeks = await db().select().from(week).where(eq(week.programmeId, programmeId)).orderBy(asc(week.weekNumber));
  const firstWeekOfMeso = new Map<string, number>();
  for (const w of weeks) if (!firstWeekOfMeso.has(w.mesocycleId)) firstWeekOfMeso.set(w.mesocycleId, w.weekNumber);
  const isBWeek = (w: typeof weeks[number]) => !w.isDeload && (w.weekNumber - firstWeekOfMeso.get(w.mesocycleId)!) % 2 === 1;
  const sessions = await db().select().from(trainingSession).where(and(eq(trainingSession.userId, userId), eq(trainingSession.programmeId, programmeId), eq(trainingSession.status, "planned"), sql`${trainingSession.scheduledOn} > ${todayIso}`));
  let swapped = 0, deduped = 0;
  for (const sess of sessions) {
    const wk = weeks.find((w) => w.id === sess.weekId);
    const insts = await db().select().from(exerciseInstance).where(eq(exerciseInstance.sessionId, sess.id)).orderBy(asc(exerciseInstance.order));
    const inSession = new Set<string>();
    for (const inst of insts) {
      const current = byId.get(inst.exerciseId);
      const dup = inSession.has(inst.exerciseId);
      const rotate = !!wk && isBWeek(wk) && (inst.role === "secondary" || inst.role === "accessory");
      if (!current || (!dup && !rotate)) { inSession.add(inst.exerciseId); continue; }
      const pick = substitutesFor(library, current, profile, 12).map((x) => x.exercise).find((e) => !inSession.has(e.id) && !insts.some((o) => o.exerciseId === e.id));
      if (!pick) { inSession.add(inst.exerciseId); continue; }
      const planned = inst.plannedSets.map((ps) => {
        if (ps.type !== "working") return ps;
        const range = rotate && ps.repRange ? undulate(ps.repRange) : ps.repRange;
        const rest = restFor(pick, { role: inst.role as never, goal: profile.primaryGoal, topReps: range?.[1] ?? ps.reps ?? 10, experience: profile.experience }).seconds;
        return { ...ps, repRange: range, weightKg: null, restSeconds: rest };
      }).filter((ps) => ps.type === "working" || !rotate);
      const reason = dup ? `${pick.name}: replaces a repeat of ${current.name} in this session.` : `${pick.name}: this week's variation for ${current.primaryMuscles.map((m) => m.replace("_", " ")).join(" and ")}, at a different rep range so the same muscles get a fresh stimulus.`;
      await db().update(exerciseInstance).set({ exerciseId: pick.id, originalExerciseId: inst.originalExerciseId ?? inst.exerciseId, plannedSets: planned as never, rationale: reason }).where(eq(exerciseInstance.id, inst.id));
      inSession.add(pick.id);
      if (dup) deduped++; else swapped++;
    }
  }
  await db().insert(auditLog).values({ userId, action: "programme.diversified", target: programmeId, meta: { swapped, deduped } });
  return { swapped, deduped };
}
