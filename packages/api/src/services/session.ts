import { and, asc, desc, eq, gte, inArray, lte, sql } from "drizzle-orm";
import { db, trainingSession, exerciseInstance, exercise, exerciseVideo, personalRecord, estimatedMax, substitution, week, restActivity } from "@kettleworth/db";
import { restFor } from "@kettleworth/core";
import { LoggedSet, type PlannedSet } from "@kettleworth/types";
import { decideProgression, estimate1RM, substitutesFor, detectPR, type SetRecord, type PRKind } from "@kettleworth/core";
import { getProfile } from "./profile";
import { libraryForEngine, toSummary } from "./library";
import { getReadiness } from "./integrations";

export async function getTodaySession(userId: string) {
  const today = new Date().toISOString().slice(0, 10);
  const [inProgress] = await db().select().from(trainingSession).where(and(eq(trainingSession.userId, userId), eq(trainingSession.status, "in_progress"))).limit(1);
  if (inProgress) return inProgress;
  const [next] = await db().select().from(trainingSession).where(and(eq(trainingSession.userId, userId), eq(trainingSession.status, "planned"))).orderBy(asc(trainingSession.scheduledOn)).limit(1);
  if (!next) return null;
  return { ...next, isToday: next.scheduledOn === today, isOverdue: next.scheduledOn < today };
}

export async function getSessionDetail(userId: string, sessionId: string) {
  const [s] = await db().select().from(trainingSession).where(and(eq(trainingSession.id, sessionId), eq(trainingSession.userId, userId))).limit(1);
  if (!s) return null;
  const instances = await db().select().from(exerciseInstance).where(eq(exerciseInstance.sessionId, sessionId)).orderBy(asc(exerciseInstance.order));
  const ids = instances.map((i) => i.exerciseId);
  const exs = ids.length ? await db().select().from(exercise).where(inArray(exercise.id, ids)) : [];
  const byId = Object.fromEntries(exs.map((e) => [e.id, e]));
  const vids = ids.length ? await db().select().from(exerciseVideo).where(and(inArray(exerciseVideo.exerciseId, ids), eq(exerciseVideo.isPlaceholder, false), eq(exerciseVideo.status, "ready"))) : [];
  const videoById = Object.fromEntries(vids.map((v) => [v.exerciseId, { provider: v.provider, playbackId: v.playbackId, isPlaceholder: v.isPlaceholder, status: v.status }]));
  // previous performance per exercise for "last time" hints
  const prev = await db().select({ exerciseId: exerciseInstance.exerciseId, loggedSets: exerciseInstance.loggedSets, completedAt: exerciseInstance.completedAt }).from(exerciseInstance).innerJoin(trainingSession, eq(exerciseInstance.sessionId, trainingSession.id)).where(and(eq(trainingSession.userId, userId), eq(trainingSession.status, "completed"), ids.length ? inArray(exerciseInstance.exerciseId, ids) : sql`false`)).orderBy(desc(exerciseInstance.completedAt)).limit(200);
  const lastById: Record<string, LoggedSet[]> = {};
  for (const p of prev) if (!lastById[p.exerciseId] && p.loggedSets.length) lastById[p.exerciseId] = p.loggedSets;
  const wk = s.weekId ? (await db().select().from(week).where(eq(week.id, s.weekId)).limit(1))[0] : null;
  const rec = await getProfile(userId);
  const seenRest = await seenRestItems(userId);
  const injuries = rec?.profile.injuries ?? [];
  const flags = rec?.profile.medicalFlags ?? [];
  return { session: s, week: wk, seenRest, instances: instances.map((i) => { const ex = byId[i.exerciseId]!; return { ...i, exercise: ex, video: videoById[i.exerciseId] ?? null, lastTime: lastById[i.exerciseId] ?? null, cautions: cautionsFor(ex, injuries, flags) }; }) };
}

/** Person-specific cautions for one exercise: which of their injuries it loads, what to do, and general safety notes. */
export function cautionsFor(ex: { contraindicatedRegions: string[]; safetyNotes: string[]; name: string }, injuries: { region: string; severity: string; note?: string }[], medicalFlags: string[]): { level: "info" | "warn" | "stop"; text: string }[] {
  const out: { level: "info" | "warn" | "stop"; text: string }[] = [];
  for (const inj of injuries) {
    if (!ex.contraindicatedRegions.includes(inj.region)) continue;
    const region = inj.region.replace("_", " ");
    if (inj.severity === "severe") out.push({ level: "stop", text: `This loads your ${region}, which you rated severe. It was kept only because nothing else fit; swap it or skip it if there's any pain.` });
    else if (inj.severity === "moderate") out.push({ level: "warn", text: `Loads your ${region}. Use a shorter range of motion, go lighter than the target, and stop at the first sharp twinge. Tap Swap for alternatives that don't load it.` });
    else out.push({ level: "info", text: `Your ${region} is a little sensitive: warm it up thoroughly and keep 2 reps in reserve on this one.${inj.note ? ` (You noted: "${inj.note}")` : ""}` });
  }
  if (medicalFlags.some((f) => /heart|blood pressure/i.test(f))) out.push({ level: "warn", text: "You flagged a cardiovascular condition: breathe through every rep (no breath-holding), rest fully between sets, and stop if you feel dizzy or chest discomfort." });
  if (medicalFlags.some((f) => /pregnan/i.test(f)) && /crunch|sit-up|plank|leg raise/i.test(ex.name)) out.push({ level: "warn", text: "Pregnancy or postpartum: front-loading core work is best replaced with a side plank or dead bug; check with your midwife or physio." });
  for (const n of ex.safetyNotes) out.push({ level: "info", text: n });
  return out;
}

export async function startSession(userId: string, sessionId: string) {
  const [existing] = await db().select().from(trainingSession).where(and(eq(trainingSession.id, sessionId), eq(trainingSession.userId, userId))).limit(1);
  if (!existing) throw new Error("Session not found");
  const instancesOf = async () => (await db().select({ id: exerciseInstance.id, plannedSets: exerciseInstance.plannedSets, notes: exerciseInstance.notes }).from(exerciseInstance).where(eq(exerciseInstance.sessionId, sessionId)));
  // Idempotent: a session already in progress keeps its readiness snapshot and its (already eased) loads.
  if (existing.status === "in_progress") {
    const readiness = await getReadiness(userId);
    await refreshRest(userId, sessionId);
    return { session: existing, readiness: { ...readiness, intensityScalar: existing.intensityScalar, score: existing.readinessScore }, instances: await instancesOf(), applied: false };
  }
  if (existing.status !== "planned") throw new Error("Session already finished");
  const readiness = await getReadiness(userId);
  const scalar = readiness.intensityScalar;
  const [s] = await db().update(trainingSession).set({ status: "in_progress", startedAt: new Date(), readinessScore: readiness.score, intensityScalar: scalar }).where(and(eq(trainingSession.id, sessionId), eq(trainingSession.status, "planned"))).returning();
  if (!s) return startSession(userId, sessionId); // raced with another tab; fall through to the idempotent path
  // Apply readiness to this session's planned loads once, and refresh rest from the per-exercise evidence rule so older programmes benefit too.
  const rec = await getProfile(userId);
  const rows = await db().select({ inst: exerciseInstance, ex: exercise }).from(exerciseInstance).innerJoin(exercise, eq(exercise.id, exerciseInstance.exerciseId)).where(eq(exerciseInstance.sessionId, sessionId));
  for (const { inst: i, ex } of rows) {
    const sets = i.plannedSets.map((ps: PlannedSet) => {
      const eased = ps.weightKg != null && ps.type === "working" && scalar !== 1 ? Math.round((ps.weightKg * scalar) / 1.25) * 1.25 : ps.weightKg;
      const rest = ps.type === "working" && rec ? restFor(ex, { role: i.role as never, goal: rec.profile.primaryGoal, topReps: ps.repRange?.[1] ?? ps.reps ?? 10, experience: rec.profile.experience }).seconds : ps.restSeconds;
      return { ...ps, weightKg: eased, restSeconds: rest };
    });
    await db().update(exerciseInstance).set({ plannedSets: sets, notes: scalar !== 1 ? `${i.notes ? i.notes + " " : ""}Loads eased ${Math.round((1 - scalar) * 100)}% for today's readiness.` : i.notes }).where(eq(exerciseInstance.id, i.id));
  }
  return { session: s, readiness, instances: await instancesOf(), applied: scalar !== 1 };
}

/**
 * Plausibility gate for a logged set. Values are checked against the lifter's own history for the exercise and the planned
 * set, not against population tables: a set is "unusual" when it implies an e1RM more than 35% above their best (or, with no
 * history, more than 60% above the planned load), or reps land far outside the planned range. Unusual sets need explicit
 * confirmation; they still count, but a PR from an unconfirmed outlier is never recorded.
 */
export function checkPlausibility(set: LoggedSet, planned: PlannedSet | undefined, bestE1rmKg: number | null): { ok: true } | { ok: false; reason: string } {
  if (!set.completed) return { ok: true };
  if (set.reps != null && set.reps > 60) return { ok: false, reason: `${set.reps} reps in one set is far beyond any planned range.` };
  const range = planned?.repRange ?? (planned?.reps != null ? [planned.reps, planned.reps] as [number, number] : null);
  if (range && set.reps != null && set.reps > range[1] + 12) return { ok: false, reason: `${set.reps} reps is well past the ${range[0]} to ${range[1]} target.` };
  if (set.weightKg != null && set.reps != null && set.reps > 0) {
    const e = estimate1RM(set.weightKg, set.reps);
    if (bestE1rmKg && e > bestE1rmKg * 1.35) return { ok: false, reason: `That implies a max ${Math.round(((e / bestE1rmKg) - 1) * 100)}% above your best on this lift.` };
    if (!bestE1rmKg && planned?.weightKg && set.weightKg > planned.weightKg * 1.6) return { ok: false, reason: `${set.weightKg} kg is ${Math.round(((set.weightKg / planned.weightKg) - 1) * 100)}% above the planned ${planned.weightKg} kg.` };
  }
  return { ok: true };
}

export async function logSet(userId: string, instanceId: string, set: LoggedSet) {
  const parsed = LoggedSet.parse(set);
  const [inst] = await db().select({ inst: exerciseInstance, sessionUser: trainingSession.userId }).from(exerciseInstance).innerJoin(trainingSession, eq(exerciseInstance.sessionId, trainingSession.id)).where(eq(exerciseInstance.id, instanceId)).limit(1);
  if (!inst || inst.sessionUser !== userId) throw new Error("Not found");
  const plannedSet = inst.inst.plannedSets.find((p) => p.setNumber === parsed.setNumber);
  const [best] = await db().select({ e: estimatedMax.e1rmKg }).from(estimatedMax).where(and(eq(estimatedMax.userId, userId), eq(estimatedMax.exerciseId, inst.inst.exerciseId))).orderBy(desc(estimatedMax.e1rmKg)).limit(1);
  const check = checkPlausibility(parsed, plannedSet, best?.e ?? null);
  if (!check.ok && !parsed.confirmed) { const err = new Error(check.reason) as Error & { code: string }; err.code = "needs_confirmation"; throw err; }
  const unusual = !check.ok;
  const logged = inst.inst.loggedSets.filter((l) => l.setNumber !== parsed.setNumber).concat(parsed).sort((a, b) => a.setNumber - b.setNumber);
  const working = inst.inst.plannedSets.filter((p) => p.type !== "warmup").length;
  const allDone = logged.filter((l) => l.completed).length >= working;
  await db().update(exerciseInstance).set({ loggedSets: logged, completedAt: allDone ? new Date() : null }).where(eq(exerciseInstance.id, instanceId));
  // Records: a set is judged against every earlier session of this exercise and the rest of today's sets. A first session
  // is the baseline, warm-ups never count, and re-saving a set that was already this good does not celebrate twice.
  let pr: { kinds: PRKind[]; headline: string; detail: string; value: number } | null = null;
  const prior = await historyFor(userId, inst.inst.exerciseId, instanceId);
  const isWarmup = plannedSet?.type === "warmup";
  const hasBaseline = prior.some((h) => h.set.completed && (h.set.weightKg ?? 0) > 0 && (h.set.reps ?? 0) > 0 && !h.set.confirmed);
  if (!unusual && !isWarmup && hasBaseline) {
    const today = logged.filter((l) => l.setNumber !== parsed.setNumber).map((l) => ({ exerciseId: inst.inst.exerciseId, date: "today", set: l, primaryMuscles: [] }));
    const before = inst.inst.loggedSets.find((l) => l.setNumber === parsed.setNumber && l.completed);
    const unchanged = !!before && before.weightKg === parsed.weightKg && before.reps === parsed.reps;
    const units = (await getProfile(userId))?.profile.units ?? "metric";
    const found = detectPR([...prior, ...today], parsed, units);
    if (found && !unchanged) {
      pr = { kinds: found.kinds, headline: found.headline, detail: found.detail, value: found.e1rm };
      if (found.kinds.includes("e1rm")) await db().insert(estimatedMax).values({ userId, exerciseId: inst.inst.exerciseId, e1rmKg: found.e1rm, source: "logged" });
    }
  }
  await syncSessionRecord(userId, inst.inst.exerciseId, inst.inst.sessionId, prior, logged, inst.inst.plannedSets);
  return { loggedSets: logged, completed: allDone, pr };
}

async function historyFor(userId: string, exerciseId: string, excludeInstanceId?: string): Promise<SetRecord[]> {
  const rows = await db().select({ id: exerciseInstance.id, loggedSets: exerciseInstance.loggedSets, date: trainingSession.scheduledOn }).from(exerciseInstance).innerJoin(trainingSession, eq(exerciseInstance.sessionId, trainingSession.id)).where(and(eq(trainingSession.userId, userId), eq(exerciseInstance.exerciseId, exerciseId)));
  const out: SetRecord[] = [];
  for (const r of rows) if (r.id !== excludeInstanceId) for (const s of r.loggedSets) out.push({ exerciseId, date: r.date, set: s, primaryMuscles: [] });
  return out;
}

export async function swapExercise(userId: string, instanceId: string, toExerciseId: string, reason: string | null, permanent = false) {
  const [inst] = await db().select({ inst: exerciseInstance, sessionUser: trainingSession.userId }).from(exerciseInstance).innerJoin(trainingSession, eq(exerciseInstance.sessionId, trainingSession.id)).where(eq(exerciseInstance.id, instanceId)).limit(1);
  if (!inst || inst.sessionUser !== userId) throw new Error("Not found");
  const [target] = await db().select().from(exercise).where(eq(exercise.id, toExerciseId)).limit(1);
  if (!target) throw new Error("Unknown exercise");
  const sets = inst.inst.plannedSets.map((s) => ({ ...s, weightKg: null })); // load is unknown for the new movement
  await db().update(exerciseInstance).set({ originalExerciseId: inst.inst.originalExerciseId ?? inst.inst.exerciseId, exerciseId: toExerciseId, plannedSets: sets, loggedSets: [], swappedReason: reason }).where(eq(exerciseInstance.id, instanceId));
  await db().insert(substitution).values({ userId, fromExerciseId: inst.inst.exerciseId, toExerciseId, reason, permanent });
  if (permanent) {
    // Apply to all future planned sessions
    const future = await db().select({ id: exerciseInstance.id, plannedSets: exerciseInstance.plannedSets }).from(exerciseInstance).innerJoin(trainingSession, eq(exerciseInstance.sessionId, trainingSession.id)).where(and(eq(trainingSession.userId, userId), eq(trainingSession.status, "planned"), eq(exerciseInstance.exerciseId, inst.inst.exerciseId)));
    for (const f of future) await db().update(exerciseInstance).set({ originalExerciseId: inst.inst.exerciseId, exerciseId: toExerciseId, plannedSets: f.plannedSets.map((s) => ({ ...s, weightKg: null })), swappedReason: reason }).where(eq(exerciseInstance.id, f.id));
  }
  return target;
}

export async function substitutesForInstance(userId: string, instanceId: string) {
  const [inst] = await db().select({ exerciseId: exerciseInstance.exerciseId }).from(exerciseInstance).where(eq(exerciseInstance.id, instanceId)).limit(1);
  const rec = await getProfile(userId);
  if (!inst || !rec) return [];
  const lib = await libraryForEngine();
  const current = lib.find((e) => e.id === inst.exerciseId);
  return current ? substitutesFor(lib, current, rec.profile, 8) : [];
}

export async function completeSession(userId: string, sessionId: string, feedback: { sessionRpe?: number | null; soreness?: number | null; fatigue?: number | null; mood?: number | null; notes?: string | null }) {
  const [s] = await db().update(trainingSession).set({ status: "completed", completedAt: new Date(), sessionRpe: feedback.sessionRpe ?? null, soreness: feedback.soreness ?? null, fatigue: feedback.fatigue ?? null, mood: feedback.mood ?? null, notes: feedback.notes ?? null }).where(and(eq(trainingSession.id, sessionId), eq(trainingSession.userId, userId))).returning();
  if (!s) throw new Error("Not found");
  // Progression: for each instance, decide next load and write it into the next planned instance of the same exercise.
  const instances = await db().select().from(exerciseInstance).where(eq(exerciseInstance.sessionId, sessionId));
  const lib = await libraryForEngine();
  const changes: { exerciseId: string; name: string; change: "up" | "down" | "hold"; nextWeightKg: number | null; reason: string }[] = [];
  for (const i of instances) {
    if (!i.loggedSets.length) continue;
    const ex = lib.find((e) => e.id === i.exerciseId);
    const lower = !!ex && (["squat", "hinge", "lunge"].includes(ex.pattern) || ex.primaryMuscles.some((m) => ["quads", "hamstrings", "glutes"].includes(m)));
    const d = decideProgression(i.plannedSets, i.loggedSets, lower);
    changes.push({ exerciseId: i.exerciseId, name: ex?.name ?? i.exerciseId, ...d });
    if (d.nextWeightKg == null) continue;
    const [next] = await db().select({ id: exerciseInstance.id, plannedSets: exerciseInstance.plannedSets }).from(exerciseInstance).innerJoin(trainingSession, eq(exerciseInstance.sessionId, trainingSession.id)).where(and(eq(trainingSession.userId, userId), eq(trainingSession.status, "planned"), eq(exerciseInstance.exerciseId, i.exerciseId), gte(trainingSession.scheduledOn, s.scheduledOn))).orderBy(asc(trainingSession.scheduledOn)).limit(1);
    if (next) {
      const topKg = d.nextWeightKg;
      const sets = next.plannedSets.map((ps) => ps.type === "working" ? { ...ps, weightKg: topKg } : ps.type === "warmup" && ps.weightKg != null ? { ...ps, weightKg: Math.round((topKg * (ps.setNumber === 1 ? 0.5 : 0.75)) / 1.25) * 1.25 } : ps);
      await db().update(exerciseInstance).set({ plannedSets: sets, notes: d.reason }).where(eq(exerciseInstance.id, next.id));
    }
  }
  return { session: s, changes };
}

export async function skipSession(userId: string, sessionId: string) {
  await db().update(trainingSession).set({ status: "skipped" }).where(and(eq(trainingSession.id, sessionId), eq(trainingSession.userId, userId)));
}

export async function recentSessions(userId: string, limit = 10) {
  return db().select().from(trainingSession).where(and(eq(trainingSession.userId, userId), eq(trainingSession.status, "completed"))).orderBy(desc(trainingSession.completedAt)).limit(limit);
}
export async function upcomingSessions(userId: string, days = 14) {
  const today = new Date().toISOString().slice(0, 10);
  const until = new Date(Date.now() + days * 86400000).toISOString().slice(0, 10);
  return db().select().from(trainingSession).where(and(eq(trainingSession.userId, userId), eq(trainingSession.status, "planned"), lte(trainingSession.scheduledOn, until))).orderBy(asc(trainingSession.scheduledOn));
}
export { toSummary };

/** Rest Deck: record what the user did during a rest (quiz answer, breathing cycle, prediction) so it counts toward Growth and never repeats. */
export async function recordRestActivity(userId: string, a: { sessionId?: string | null; kind: "quiz" | "fact" | "breathe" | "predict"; itemId?: string | null; correct?: boolean | null; detail?: Record<string, unknown> | null }) {
  const [row] = await db().insert(restActivity).values({ userId, sessionId: a.sessionId ?? null, kind: a.kind, itemId: a.itemId ?? null, correct: a.correct ?? null, detail: a.detail ?? null }).returning();
  return row!;
}
export async function seenRestItems(userId: string) {
  const rows = await db().select({ itemId: restActivity.itemId }).from(restActivity).where(eq(restActivity.userId, userId));
  return rows.map((r) => r.itemId).filter((x): x is string => !!x);
}

/** Start the session over: every logged set is cleared, planned sets stay as prescribed for today. */
export async function resetSession(userId: string, sessionId: string) {
  const [s] = await db().select().from(trainingSession).where(and(eq(trainingSession.id, sessionId), eq(trainingSession.userId, userId))).limit(1);
  if (!s) throw new Error("Session not found");
  if (s.status === "completed") throw new Error("A completed session cannot be reset");
  await db().update(exerciseInstance).set({ loggedSets: [], completedAt: null }).where(eq(exerciseInstance.sessionId, sessionId));
  await db().delete(personalRecord).where(and(eq(personalRecord.userId, userId), eq(personalRecord.sessionId, sessionId)));
  const [row] = await db().update(trainingSession).set({ startedAt: new Date() }).where(eq(trainingSession.id, sessionId)).returning();
  return row!;
}
/** Clear one exercise's logged sets so it can be redone. */
export async function resetInstance(userId: string, instanceId: string) {
  const [inst] = await db().select({ inst: exerciseInstance, sessionUser: trainingSession.userId, sessionId: trainingSession.id }).from(exerciseInstance).innerJoin(trainingSession, eq(exerciseInstance.sessionId, trainingSession.id)).where(eq(exerciseInstance.id, instanceId)).limit(1);
  if (!inst || inst.sessionUser !== userId) throw new Error("Not found");
  await db().update(exerciseInstance).set({ loggedSets: [], completedAt: null }).where(eq(exerciseInstance.id, instanceId));
  await db().delete(personalRecord).where(and(eq(personalRecord.userId, userId), eq(personalRecord.exerciseId, inst.inst.exerciseId), eq(personalRecord.sessionId, inst.sessionId)));
  return { ok: true };
}

/** Re-derive rest for every working set from the per-exercise evidence rule, so sessions planned before a rule change still get the right clock. */
async function refreshRest(userId: string, sessionId: string) {
  const rec = await getProfile(userId);
  if (!rec) return;
  const rows = await db().select({ inst: exerciseInstance, ex: exercise }).from(exerciseInstance).innerJoin(exercise, eq(exercise.id, exerciseInstance.exerciseId)).where(eq(exerciseInstance.sessionId, sessionId));
  for (const { inst: i, ex } of rows) {
    const sets = i.plannedSets.map((ps: PlannedSet) => ps.type === "working" ? { ...ps, restSeconds: restFor(ex, { role: i.role as never, goal: rec.profile.primaryGoal, topReps: ps.repRange?.[1] ?? ps.reps ?? 10, experience: rec.profile.experience }).seconds } : ps);
    if (JSON.stringify(sets) !== JSON.stringify(i.plannedSets)) await db().update(exerciseInstance).set({ plannedSets: sets }).where(eq(exerciseInstance.id, i.id));
  }
}

/**
 * Keep one record row per exercise per session, always describing the best working set of that session, and only
 * when that set beat every earlier session. Editing a set down, or a first session, removes the row, so the record
 * count on Progress can never be inflated by a mistake.
 */
async function syncSessionRecord(userId: string, exerciseId: string, sessionId: string, prior: SetRecord[], logged: LoggedSet[], planned: PlannedSet[]) {
  const working = new Set(planned.filter((p) => p.type !== "warmup").map((p) => p.setNumber));
  const sets = logged.filter((l) => working.has(l.setNumber) && l.completed && (l.weightKg ?? 0) > 0 && (l.reps ?? 0) > 0 && !l.confirmed);
  const best = sets.sort((a, b) => estimate1RM(b.weightKg!, b.reps!) - estimate1RM(a.weightKg!, a.reps!) || b.weightKg! - a.weightKg!)[0];
  const found = best ? detectPR(prior, best) : null;
  const [row] = await db().select({ id: personalRecord.id }).from(personalRecord).where(and(eq(personalRecord.userId, userId), eq(personalRecord.exerciseId, exerciseId), eq(personalRecord.sessionId, sessionId))).limit(1);
  if (!found || !best) { if (row) await db().delete(personalRecord).where(eq(personalRecord.id, row.id)); return; }
  const kind = found.kinds.includes("weight") ? "weight" : found.kinds.includes("e1rm") ? "e1rm" : "reps";
  const values = { kind: kind as "weight" | "e1rm" | "reps", value: found.e1rm, reps: best.reps!, weightKg: best.weightKg! };
  if (row) await db().update(personalRecord).set(values).where(eq(personalRecord.id, row.id));
  else await db().insert(personalRecord).values({ userId, exerciseId, sessionId, ...values });
}

/**
 * Rebuild every stored record from the logged sets, session by session in date order, with the current rules.
 * Used once to correct records written by the old rule, and safe to run again at any time.
 */
export async function rebuildPersonalRecords(userId?: string): Promise<{ users: number; records: number }> {
  const users = userId ? [userId] : (await db().selectDistinct({ u: trainingSession.userId }).from(trainingSession)).map((r) => r.u);
  let records = 0;
  for (const u of users) {
    const rows = await db().select({ exerciseId: exerciseInstance.exerciseId, sessionId: exerciseInstance.sessionId, loggedSets: exerciseInstance.loggedSets, plannedSets: exerciseInstance.plannedSets, date: trainingSession.scheduledOn, startedAt: trainingSession.startedAt })
      .from(exerciseInstance).innerJoin(trainingSession, eq(exerciseInstance.sessionId, trainingSession.id)).where(eq(trainingSession.userId, u));
    await db().delete(personalRecord).where(eq(personalRecord.userId, u));
    const byExercise = new Map<string, typeof rows>();
    for (const r of rows) if (r.loggedSets.length) (byExercise.get(r.exerciseId) ?? byExercise.set(r.exerciseId, []).get(r.exerciseId)!).push(r);
    for (const [exerciseId, list] of byExercise) {
      list.sort((a, b) => a.date.localeCompare(b.date) || (a.startedAt?.getTime() ?? 0) - (b.startedAt?.getTime() ?? 0));
      const prior: SetRecord[] = [];
      for (const r of list) {
        await syncSessionRecord(u, exerciseId, r.sessionId, [...prior], r.loggedSets, r.plannedSets);
        for (const l of r.loggedSets) prior.push({ exerciseId, date: r.date, set: l, primaryMuscles: [] });
      }
    }
    const [cnt] = await db().select({ n: sql<number>`count(*)::int` }).from(personalRecord).where(eq(personalRecord.userId, u));
    records += cnt?.n ?? 0;
  }
  return { users: users.length, records };
}
