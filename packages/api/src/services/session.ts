import { and, asc, desc, eq, gte, inArray, lte, sql } from "drizzle-orm";
import { db, trainingSession, exerciseInstance, exercise, exerciseVideo, personalRecord, estimatedMax, substitution, week } from "@kettleworth/db";
import { LoggedSet, type PlannedSet } from "@kettleworth/types";
import { decideProgression, estimate1RM, substitutesFor, isPR, type SetRecord } from "@kettleworth/core";
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
  const injuries = rec?.profile.injuries ?? [];
  const flags = rec?.profile.medicalFlags ?? [];
  return { session: s, week: wk, instances: instances.map((i) => { const ex = byId[i.exerciseId]!; return { ...i, exercise: ex, video: videoById[i.exerciseId] ?? null, lastTime: lastById[i.exerciseId] ?? null, cautions: cautionsFor(ex, injuries, flags) }; }) };
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
    return { session: existing, readiness: { ...readiness, intensityScalar: existing.intensityScalar, score: existing.readinessScore }, instances: await instancesOf(), applied: false };
  }
  if (existing.status !== "planned") throw new Error("Session already finished");
  const readiness = await getReadiness(userId);
  const scalar = readiness.intensityScalar;
  const [s] = await db().update(trainingSession).set({ status: "in_progress", startedAt: new Date(), readinessScore: readiness.score, intensityScalar: scalar }).where(and(eq(trainingSession.id, sessionId), eq(trainingSession.status, "planned"))).returning();
  if (!s) return startSession(userId, sessionId); // raced with another tab; fall through to the idempotent path
  if (scalar !== 1) {
    // Apply readiness to this session's planned loads once, and explain it on each exercise.
    for (const i of await instancesOf()) {
      const sets = i.plannedSets.map((ps: PlannedSet) => ps.weightKg != null && ps.type === "working" ? { ...ps, weightKg: Math.round((ps.weightKg * scalar) / 1.25) * 1.25 } : ps);
      await db().update(exerciseInstance).set({ plannedSets: sets, notes: `${i.notes ? i.notes + " " : ""}Loads eased ${Math.round((1 - scalar) * 100)}% for today's readiness.` }).where(eq(exerciseInstance.id, i.id));
    }
  }
  return { session: s, readiness, instances: await instancesOf(), applied: scalar !== 1 };
}

export async function logSet(userId: string, instanceId: string, set: LoggedSet) {
  const parsed = LoggedSet.parse(set);
  const [inst] = await db().select({ inst: exerciseInstance, sessionUser: trainingSession.userId }).from(exerciseInstance).innerJoin(trainingSession, eq(exerciseInstance.sessionId, trainingSession.id)).where(eq(exerciseInstance.id, instanceId)).limit(1);
  if (!inst || inst.sessionUser !== userId) throw new Error("Not found");
  const logged = inst.inst.loggedSets.filter((l) => l.setNumber !== parsed.setNumber).concat(parsed).sort((a, b) => a.setNumber - b.setNumber);
  const working = inst.inst.plannedSets.filter((p) => p.type !== "warmup").length;
  const allDone = logged.filter((l) => l.completed).length >= working;
  await db().update(exerciseInstance).set({ loggedSets: logged, completedAt: allDone ? new Date() : null }).where(eq(exerciseInstance.id, instanceId));
  // PR detection against history (excluding this instance)
  let pr: { kind: "e1rm"; value: number } | null = null;
  if (parsed.completed && parsed.weightKg && parsed.reps) {
    const hist = await historyFor(userId, inst.inst.exerciseId, instanceId);
    if (isPR(hist, inst.inst.exerciseId, parsed)) {
      const e = estimate1RM(parsed.weightKg, parsed.reps);
      pr = { kind: "e1rm", value: e };
      // One PR row per exercise per session: a later, bigger set in the same session updates it rather than stacking.
      const [samePr] = await db().select({ id: personalRecord.id }).from(personalRecord).where(and(eq(personalRecord.userId, userId), eq(personalRecord.exerciseId, inst.inst.exerciseId), eq(personalRecord.sessionId, inst.inst.sessionId))).limit(1);
      if (samePr) await db().update(personalRecord).set({ value: e, reps: parsed.reps, weightKg: parsed.weightKg, achievedAt: new Date() }).where(eq(personalRecord.id, samePr.id));
      else await db().insert(personalRecord).values({ userId, exerciseId: inst.inst.exerciseId, kind: "e1rm", value: e, reps: parsed.reps, weightKg: parsed.weightKg, sessionId: inst.inst.sessionId });
      await db().insert(estimatedMax).values({ userId, exerciseId: inst.inst.exerciseId, e1rmKg: e, source: "logged" });
    }
  }
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
