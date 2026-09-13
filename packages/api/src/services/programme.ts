import { and, asc, desc, eq, inArray } from "drizzle-orm";
import { db, programme, mesocycle, week, trainingSession, exerciseInstance, auditLog } from "@kettleworth/db";
import { generateProgramme, validatePlanAgainstLibrary } from "@kettleworth/core";
import type { ProgrammePlan } from "@kettleworth/types";
import { getProfile } from "./profile";
import { libraryForEngine, getExercisesByIds } from "./library";
import { programmeCoachNote, aiAvailable } from "../ai/tasks";

const DAY_OFFSETS: Record<number, number[]> = { 1: [0], 2: [0, 3], 3: [0, 2, 4], 4: [0, 1, 3, 4], 5: [0, 1, 2, 4, 5], 6: [0, 1, 2, 3, 4, 5], 7: [0, 1, 2, 3, 4, 5, 6] };
const addDays = (d: string, n: number) => { const x = new Date(d + "T00:00:00Z"); x.setUTCDate(x.getUTCDate() + n); return x.toISOString().slice(0, 10); };

export async function generateAndSaveProgramme(userId: string, opts: { startDate?: string } = {}) {
  const rec = await getProfile(userId);
  if (!rec) throw new Error("Complete onboarding first");
  const library = await libraryForEngine();
  const seed = `${userId}:${Date.now()}`;
  const plan = generateProgramme(rec.profile, library, { seed });
  const errors = validatePlanAgainstLibrary(plan, library);
  if (errors.length) throw new Error(`Plan failed validation: ${errors.join("; ")}`);
  const startDate = opts.startDate ?? new Date().toISOString().slice(0, 10);
  const ids = [...new Set(plan.mesocycles.flatMap((m) => m.weeks.flatMap((w) => w.sessions.flatMap((s) => s.exercises.map((e) => e.exerciseId)))))];
  const names = Object.fromEntries((await getExercisesByIds(ids)).map((e) => [e.id, e.name]));
  const note = await programmeCoachNote(userId, rec.profile, plan, names);

  return db().transaction(async (tx) => {
    await tx.update(programme).set({ status: "archived" }).where(and(eq(programme.userId, userId), eq(programme.status, "active")));
    await tx.update(trainingSession).set({ status: "skipped" }).where(and(eq(trainingSession.userId, userId), eq(trainingSession.status, "planned")));
    const [p] = await tx.insert(programme).values({ userId, name: plan.name, split: plan.split, goal: rec.profile.primaryGoal, daysPerWeek: plan.daysPerWeek, totalWeeks: plan.totalWeeks, startDate, summary: plan.summary, coachNote: `${note.note}\n\nWeek one focus: ${note.weekOneFocus}`, rationale: plan.rationale, plan, seed, generatedBy: aiAvailable() ? "rules+ai" : "rules" }).returning();
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
    await tx.insert(auditLog).values({ userId, action: "programme.generated", target: p!.id, meta: { seed, generatedBy: aiAvailable() ? "rules+ai" : "rules" } });
    return p!;
  });
}

export async function getActiveProgramme(userId: string) {
  const [p] = await db().select().from(programme).where(and(eq(programme.userId, userId), eq(programme.status, "active"))).orderBy(desc(programme.createdAt)).limit(1);
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
