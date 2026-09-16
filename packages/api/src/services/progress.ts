import { and, asc, desc, eq, gte } from "drizzle-orm";
import { db, trainingSession, exerciseInstance, exercise, bodyMeasurement, personalRecord } from "@kettleworth/db";
import { e1rmSeries, volumeByMuscle, tonnage, weeklyStreak, bestE1RM, isoWeek, type SetRecord , loadMultiplier } from "@kettleworth/core";

export async function getProgress(userId: string) {
  const since = new Date(Date.now() - 120 * 86400000).toISOString().slice(0, 10);
  const rows = await db().select({ exerciseId: exerciseInstance.exerciseId, loggedSets: exerciseInstance.loggedSets, date: trainingSession.scheduledOn, name: exercise.name, primary: exercise.primaryMuscles, equipment: exercise.equipment, unilateral: exercise.unilateral }).from(exerciseInstance).innerJoin(trainingSession, eq(exerciseInstance.sessionId, trainingSession.id)).innerJoin(exercise, eq(exerciseInstance.exerciseId, exercise.id)).where(and(eq(trainingSession.userId, userId), eq(trainingSession.status, "completed"), gte(trainingSession.scheduledOn, since)));
  const records: SetRecord[] = [];
  const names: Record<string, string> = {};
  for (const r of rows) { names[r.exerciseId] = r.name; const mult = loadMultiplier({ name: r.name, equipment: r.equipment, unilateral: r.unilateral }); for (const s of r.loggedSets) records.push({ exerciseId: r.exerciseId, date: r.date, set: s, primaryMuscles: r.primary, loadMultiplier: mult }); }
  const sessions = await db().select({ scheduledOn: trainingSession.scheduledOn, completedAt: trainingSession.completedAt, name: trainingSession.name, sessionRpe: trainingSession.sessionRpe }).from(trainingSession).where(and(eq(trainingSession.userId, userId), eq(trainingSession.status, "completed"))).orderBy(desc(trainingSession.completedAt));
  const thisWeek = isoWeek(new Date().toISOString());
  const lastWeek = isoWeek(new Date(Date.now() - 7 * 86400000).toISOString());
  const byEx = new Map<string, SetRecord[]>();
  for (const r of records) (byEx.get(r.exerciseId) ?? byEx.set(r.exerciseId, []).get(r.exerciseId)!).push(r);
  const strength = [...byEx.entries()].map(([id, recs]) => ({ exerciseId: id, name: names[id]!, best: bestE1RM(recs), series: e1rmSeries(recs, id), sets: recs.filter((r) => r.set.completed).length })).filter((x) => x.best != null).sort((a, b) => b.sets - a.sets).slice(0, 6);
  const measurements = await db().select().from(bodyMeasurement).where(eq(bodyMeasurement.userId, userId)).orderBy(asc(bodyMeasurement.measuredOn));
  const prs = await db().select().from(personalRecord).where(eq(personalRecord.userId, userId)).orderBy(desc(personalRecord.achievedAt)).limit(10);
  const weeklyTonnage: Record<string, number> = {};
  for (const r of records) if (r.set.completed) weeklyTonnage[isoWeek(r.date)] = (weeklyTonnage[isoWeek(r.date)] ?? 0) + (r.set.weightKg ?? 0) * (r.loadMultiplier ?? 1) * (r.set.reps ?? 0);
  return {
    completedSessions: sessions.length,
    streakWeeks: weeklyStreak(sessions.map((s) => s.scheduledOn)),
    tonnageThisWeek: tonnage(records.filter((r) => isoWeek(r.date) === thisWeek)),
    tonnageLastWeek: tonnage(records.filter((r) => isoWeek(r.date) === lastWeek)),
    weeklyTonnage: Object.entries(weeklyTonnage).sort(([a], [b]) => a.localeCompare(b)).map(([week, kg]) => ({ week, kg })),
    volumeThisWeek: volumeByMuscle(records.filter((r) => isoWeek(r.date) === thisWeek)),
    volumeLastWeek: volumeByMuscle(records.filter((r) => isoWeek(r.date) === lastWeek)),
    strength,
    measurements,
    prs: prs.map((p) => ({ ...p, name: names[p.exerciseId] ?? p.exerciseId })),
    recentSessions: sessions.slice(0, 8),
  };
}

export async function addMeasurement(userId: string, m: { measuredOn: string; weightKg?: number | null; bodyFatPct?: number | null; waistCm?: number | null; hipCm?: number | null; chestCm?: number | null; armCm?: number | null; thighCm?: number | null }) {
  const [row] = await db().insert(bodyMeasurement).values({ userId, ...m, source: "manual" }).returning();
  return row!;
}
