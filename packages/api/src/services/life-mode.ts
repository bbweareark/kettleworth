import { and, asc, eq, gte } from "drizzle-orm";
import { db, trainingSession, exerciseInstance, programme, week, auditLog } from "@kettleworth/db";
import { substitutesFor } from "@kettleworth/core";
import type { TrainingProfile, ProgrammePlan } from "@kettleworth/types";
import { getProfile, upsertProfile } from "./profile";
import { libraryForEngine } from "./library";

type Mode = TrainingProfile["lifeMode"]["mode"];
const DAY_OFFSETS: Record<number, number[]> = { 1: [0], 2: [0, 3], 3: [0, 2, 4], 4: [0, 1, 3, 4], 5: [0, 1, 2, 4, 5], 6: [0, 1, 2, 3, 4, 5], 7: [0, 1, 2, 3, 4, 5, 6] };
const addDays = (d: string, n: number) => { const x = new Date(d + "T00:00:00Z"); x.setUTCDate(x.getUTCDate() + n); return x.toISOString().slice(0, 10); };

/**
 * Life mode flexes the next two weeks of planned sessions in place; clearing it re-materialises those sessions from the stored plan.
 * travel: bodyweight/band substitutes. ill: sessions paused (skipped, streak untouched, explained). injured: handled via the injury list + swaps.
 * busy: main lifts only, ~30 min. newborn: two shortest sessions a week.
 */
export async function setLifeMode(userId: string, mode: Mode, until: string | null, note?: string) {
  const rec = await getProfile(userId);
  if (!rec) throw new Error("No profile");
  const today = new Date().toISOString().slice(0, 10);
  if (rec.profile.lifeMode.mode !== "normal") await restoreUpcoming(userId); // start from the plan, not from a previous flex
  await upsertProfile(userId, { lifeMode: { mode, since: today, until, note } });
  if (mode === "normal") { await db().insert(auditLog).values({ userId, action: "life_mode.cleared" }); return; }
  const horizon = until ?? addDays(today, 14);
  const upcoming = await db().select().from(trainingSession).where(and(eq(trainingSession.userId, userId), eq(trainingSession.status, "planned"), gte(trainingSession.scheduledOn, today))).orderBy(asc(trainingSession.scheduledOn));
  const inWindow = upcoming.filter((s) => s.scheduledOn <= horizon);
  const lib = await libraryForEngine();
  const profile = rec.profile;
  if (mode === "ill") {
    for (const s of inWindow) await db().update(trainingSession).set({ status: "skipped", notes: "Paused: illness mode. Does not count against your streak." }).where(eq(trainingSession.id, s.id));
  }
  if (mode === "travel") {
    const travelProfile: TrainingProfile = { ...profile, environment: "home", equipment: ["bands"] };
    for (const s of inWindow) {
      const insts = await db().select().from(exerciseInstance).where(eq(exerciseInstance.sessionId, s.id));
      for (const i of insts) {
        const cur = lib.find((e) => e.id === i.exerciseId); if (!cur) continue;
        if (cur.equipment.every((q) => q === "bodyweight" || q === "bands")) continue;
        const sub = substitutesFor(lib, cur, travelProfile, 1)[0];
        if (sub) await db().update(exerciseInstance).set({ originalExerciseId: i.originalExerciseId ?? i.exerciseId, exerciseId: sub.exercise.id, plannedSets: i.plannedSets.map((ps) => ({ ...ps, weightKg: null })), swappedReason: "travel mode" }).where(eq(exerciseInstance.id, i.id));
        else await db().delete(exerciseInstance).where(eq(exerciseInstance.id, i.id));
      }
      await db().update(trainingSession).set({ name: `${s.name} · Travel`, notes: "Travel mode: bodyweight and band versions. Loads reset; go by reps in reserve." }).where(eq(trainingSession.id, s.id));
    }
  }
  if (mode === "busy" || mode === "newborn") {
    let keep = inWindow;
    if (mode === "newborn") { const byWeek = new Map<string, typeof inWindow>(); for (const s of inWindow) { const k = s.scheduledOn.slice(0, 7) + ":" + Math.floor(new Date(s.scheduledOn).getTime() / (7 * 86400000)); (byWeek.get(k) ?? byWeek.set(k, []).get(k)!).push(s); } keep = [...byWeek.values()].flatMap((ws) => ws.slice(0, 2)); for (const s of inWindow) if (!keep.includes(s)) await db().update(trainingSession).set({ status: "skipped", notes: "New parent mode: this session is dropped so two a week is the whole plan." }).where(eq(trainingSession.id, s.id)); }
    for (const s of keep) {
      const insts = await db().select().from(exerciseInstance).where(eq(exerciseInstance.sessionId, s.id)).orderBy(asc(exerciseInstance.order));
      for (const i of insts) if (i.role !== "primary" && i.role !== "secondary") await db().delete(exerciseInstance).where(eq(exerciseInstance.id, i.id));
      await db().update(trainingSession).set({ name: `${s.name.replace(/ · .*$/, "")} · Short`, estimatedMinutes: 30, notes: mode === "busy" ? "Busy mode: main lifts only. Thirty focused minutes keeps everything you've built." : "New parent mode: main lifts only, thirty minutes, sleep first." }).where(eq(trainingSession.id, s.id));
    }
  }
  await db().insert(auditLog).values({ userId, action: "life_mode.set", meta: { mode, until, sessions: inWindow.length } });
}

/** Rebuild planned sessions from today onward from the stored plan (undoes any life-mode flex). */
export async function restoreUpcoming(userId: string) {
  const [p] = await db().select().from(programme).where(and(eq(programme.userId, userId), eq(programme.status, "active"))).limit(1);
  if (!p) return;
  const today = new Date().toISOString().slice(0, 10);
  const plan = p.plan as ProgrammePlan;
  const weeks = await db().select().from(week).where(eq(week.programmeId, p.id)).orderBy(asc(week.weekNumber));
  const offsets = DAY_OFFSETS[plan.daysPerWeek] ?? DAY_OFFSETS[3]!;
  const existing = await db().select().from(trainingSession).where(and(eq(trainingSession.programmeId, p.id), gte(trainingSession.scheduledOn, today)));
  for (const s of existing) if (s.status === "planned" || (s.status === "skipped" && /mode/.test(s.notes ?? ""))) await db().delete(trainingSession).where(eq(trainingSession.id, s.id));
  const planWeeks = plan.mesocycles.flatMap((m) => m.weeks);
  for (const w of weeks) {
    const pw = planWeeks.find((x) => x.weekNumber === w.weekNumber); if (!pw) continue;
    for (const s of pw.sessions) {
      const on = addDays(w.startsOn, offsets[s.dayIndex] ?? s.dayIndex);
      if (on < today) continue;
      if (existing.some((e) => e.scheduledOn === on && e.dayIndex === s.dayIndex && e.status === "completed")) continue;
      const [row] = await db().insert(trainingSession).values({ userId, programmeId: p.id, weekId: w.id, dayIndex: s.dayIndex, scheduledOn: on, name: w.isDeload ? `${s.name} · Deload` : s.name, focus: s.focus, warmup: s.warmup, estimatedMinutes: s.estimatedMinutes }).returning();
      if (s.exercises.length) await db().insert(exerciseInstance).values(s.exercises.map((e) => ({ sessionId: row!.id, exerciseId: e.exerciseId, order: e.order, role: e.role, plannedSets: e.sets, rationale: e.rationale, supersetGroup: e.supersetGroup })));
    }
  }
}
