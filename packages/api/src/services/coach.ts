import { and, asc, desc, eq, gte, lt, sql } from "drizzle-orm";
import { z } from "zod";
import { db, coachLetter, coachMessage, trainingSession, exerciseInstance, personalRecord, bodyMeasurement, healthSample, user } from "@kettleworth/db";
import { adaptWeek, detectStaleness, isoWeek } from "@kettleworth/core";
import type { TrainingProfile } from "@kettleworth/types";
import { structured, aiAvailable, AI_MODEL } from "../ai/client";
import { COACH_SYSTEM } from "../ai/prompts";
import { cleanText } from "../ai/tasks";
import { getProfile, upsertProfile } from "./profile";
import { getActiveProgramme, getProgrammeOverview } from "./programme";
import { getReadiness, activitiesForDay } from "./integrations";
import { skipSession } from "./session";
import { sendEmail } from "../email";
import { setLifeMode } from "./life-mode";

const mondayOf = (d: Date) => { const x = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate())); const day = x.getUTCDay() || 7; x.setUTCDate(x.getUTCDate() - day + 1); return x.toISOString().slice(0, 10); };
const addDays = (d: string, n: number) => { const x = new Date(d + "T00:00:00Z"); x.setUTCDate(x.getUTCDate() + n); return x.toISOString().slice(0, 10); };

/** Week in numbers: the raw material for the letter and the chat context. */
export async function weekStats(userId: string, weekStartsOn: string) {
  const end = addDays(weekStartsOn, 7);
  const sessions = await db().select().from(trainingSession).where(and(eq(trainingSession.userId, userId), gte(trainingSession.scheduledOn, weekStartsOn), lt(trainingSession.scheduledOn, end)));
  const done = sessions.filter((s) => s.status === "completed");
  const ids = sessions.map((s) => s.id);
  const inst = ids.length ? await db().select().from(exerciseInstance).where(sql`${exerciseInstance.sessionId} = any(${sql.raw(`array[${ids.map((i) => `'${i}'::uuid`).join(",")}]`)})`) : [];
  const tonnage = inst.reduce((a, i) => a + i.loggedSets.reduce((b, s) => b + (s.completed ? (s.weightKg ?? 0) * (s.reps ?? 0) : 0), 0), 0);
  const prevEnd = weekStartsOn; const prevStart = addDays(weekStartsOn, -7);
  const prevSessions = await db().select({ id: trainingSession.id }).from(trainingSession).where(and(eq(trainingSession.userId, userId), eq(trainingSession.status, "completed"), gte(trainingSession.scheduledOn, prevStart), lt(trainingSession.scheduledOn, prevEnd)));
  const prevInst = prevSessions.length ? await db().select().from(exerciseInstance).where(sql`${exerciseInstance.sessionId} = any(${sql.raw(`array[${prevSessions.map((i) => `'${i.id}'::uuid`).join(",")}]`)})`) : [];
  const prevTonnage = prevInst.reduce((a, i) => a + i.loggedSets.reduce((b, s) => b + (s.completed ? (s.weightKg ?? 0) * (s.reps ?? 0) : 0), 0), 0);
  const prs = await db().select().from(personalRecord).where(and(eq(personalRecord.userId, userId), gte(personalRecord.achievedAt, new Date(weekStartsOn)), lt(personalRecord.achievedAt, new Date(end))));
  const weights = await db().select().from(bodyMeasurement).where(and(eq(bodyMeasurement.userId, userId), gte(bodyMeasurement.measuredOn, addDays(weekStartsOn, -14)), lt(bodyMeasurement.measuredOn, end))).orderBy(asc(bodyMeasurement.measuredOn));
  const sleep = await db().select({ v: healthSample.value }).from(healthSample).where(and(eq(healthSample.userId, userId), eq(healthSample.metric, "sleep_duration"), gte(healthSample.startAt, new Date(weekStartsOn)), lt(healthSample.startAt, new Date(end))));
  const readiness = await db().select({ v: trainingSession.readinessScore }).from(trainingSession).where(and(eq(trainingSession.userId, userId), gte(trainingSession.scheduledOn, weekStartsOn), lt(trainingSession.scheduledOn, end), sql`${trainingSession.readinessScore} is not null`));
  const avg = (xs: (number | null)[]) => { const v = xs.filter((x): x is number => x != null); return v.length ? v.reduce((a, b) => a + b, 0) / v.length : null; };
  const w = weights.filter((x) => x.weightKg != null);
  const weightTrend = w.length >= 2 ? ((w[w.length - 1]!.weightKg! - w[0]!.weightKg!) / Math.max(1, (new Date(w[w.length - 1]!.measuredOn).getTime() - new Date(w[0]!.measuredOn).getTime()) / 86400000)) * 7 : null;
  const feedback = { plannedSessions: sessions.length, completedSessions: done.length, avgSoreness: avg(done.map((s) => s.soreness)), avgFatigue: avg(done.map((s) => s.fatigue)), avgSessionRpe: avg(done.map((s) => s.sessionRpe)), avgSleepHours: sleep.length ? avg(sleep.map((s) => (s.v ?? 0) / 60)) : null, readinessAvg: avg(readiness.map((r) => r.v)), weightTrendKgPerWeek: weightTrend };
  // Staleness: per exercise e1RM change over the last 4 weeks (from PR table + logs is expensive; approximate with logged working weights)
  const trends: Parameters<typeof detectStaleness>[0] = [];
  return { weekStartsOn, sessions: sessions.map((s) => ({ name: s.name, date: s.scheduledOn, status: s.status, rpe: s.sessionRpe, mood: s.mood })), completed: done.length, planned: sessions.length, tonnage: Math.round(tonnage), prevTonnage: Math.round(prevTonnage), prs: prs.map((p) => ({ exerciseId: p.exerciseId, e1rm: p.value })), feedback, weightTrendKgPerWeek: weightTrend, adaptations: [...adaptWeek(feedback), ...detectStaleness(trends)] };
}

const Letter = z.object({ headline: z.string().max(80), body: z.string().max(1800) });

/** Sunday letter: what moved, what stalled, what changes and why, one thing to try. Idempotent per week. */
export async function generateWeeklyLetter(userId: string, weekStartsOn = mondayOf(new Date()), opts: { email?: boolean; force?: boolean } = {}) {
  const [existing] = await db().select().from(coachLetter).where(and(eq(coachLetter.userId, userId), eq(coachLetter.weekStartsOn, weekStartsOn))).limit(1);
  if (existing && !opts.force) return existing;
  const rec = await getProfile(userId);
  if (!rec) throw new Error("No profile");
  const stats = await weekStats(userId, weekStartsOn);
  const prog = await getActiveProgramme(userId);
  const name = (await db().select({ name: user.name, email: user.email }).from(user).where(eq(user.id, userId)))[0]!;
  const first = name.name.split(" ")[0];
  const vol = stats.prevTonnage ? Math.round(((stats.tonnage - stats.prevTonnage) / stats.prevTonnage) * 100) : null;
  const fallback = {
    headline: stats.completed === 0 ? "A quiet week. Next one starts Monday." : stats.completed >= stats.planned ? "Every session done." : `${stats.completed} of ${stats.planned} sessions in the book.`,
    body: [
      `${first}, ${stats.completed === 0 ? "nothing was logged this week" : `you completed ${stats.completed} of ${stats.planned} planned sessions`}${vol != null ? `, and total volume was ${vol >= 0 ? "up" : "down"} ${Math.abs(vol)}% on last week` : ""}.`,
      stats.prs.length ? `${stats.prs.length} personal record${stats.prs.length > 1 ? "s" : ""} landed. That is the plan working.` : "No new records this week, which is normal inside a block: the reps and sets are the work, the records are the receipt.",
      ...stats.adaptations.map((a) => `Next week: ${a.reason}`),
      stats.weightTrendKgPerWeek != null ? `Weight is moving ${Math.abs(stats.weightTrendKgPerWeek).toFixed(2)} kg a week ${stats.weightTrendKgPerWeek < 0 ? "down" : "up"}.` : "Log a weigh-in so nutrition can recalibrate.",
      "One thing to try: log RPE on every working set. It is the signal the engine trusts most.",
    ].join("\n\n"),
  };
  const out = aiAvailable() ? await structured({ task: "weekly_letter", userId, schema: Letter, effort: "medium", maxTokens: 1500, system: `${COACH_SYSTEM}\n\nWrite the Sunday letter: 3 short paragraphs, under 170 words, addressed to ${first}. Paragraph 1: what moved this week (use the numbers). Paragraph 2: what the engine changes next week and why (use the adaptations verbatim in meaning). Paragraph 3: one specific thing to try. No lists, no headings, no dashes.`, user: JSON.stringify({ profile: { goal: rec.profile.primaryGoal, experience: rec.profile.experience, lifeMode: rec.profile.lifeMode.mode }, programme: prog ? { name: prog.name, week: null } : null, stats }, null, 1) }) : null;
  const letter = out ? { headline: cleanText(out.headline), body: cleanText(out.body) } : fallback;
  const values = { userId, weekStartsOn, headline: letter.headline, body: letter.body, stats: stats as unknown as Record<string, unknown>, adaptations: stats.adaptations, generatedBy: out ? AI_MODEL : "rules" };
  const [row] = await db().insert(coachLetter).values(values).onConflictDoUpdate({ target: [coachLetter.userId, coachLetter.weekStartsOn], set: values }).returning();
  if (opts.email && name.email) { await sendEmail({ to: name.email, subject: `Your week: ${letter.headline}`, text: `${letter.body}\n\nOpen Kettleworth: ${process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"}/app/coach` }); await db().update(coachLetter).set({ emailedAt: new Date() }).where(eq(coachLetter.id, row!.id)); }
  return row!;
}
export async function listLetters(userId: string) { return db().select().from(coachLetter).where(eq(coachLetter.userId, userId)).orderBy(desc(coachLetter.weekStartsOn)).limit(12); }
export async function markLetterRead(userId: string, id: string) { await db().update(coachLetter).set({ readAt: new Date() }).where(and(eq(coachLetter.id, id), eq(coachLetter.userId, userId))); }
export async function hasUnreadLetter(userId: string) { const [r] = await db().select({ id: coachLetter.id }).from(coachLetter).where(and(eq(coachLetter.userId, userId), sql`${coachLetter.readAt} is null`)).limit(1); return !!r; }

// ---------- Talk to the coach ----------
const Action = z.discriminatedUnion("type", [
  z.object({ type: z.literal("move_session"), sessionId: z.string(), newDate: z.string() }),
  z.object({ type: z.literal("skip_session"), sessionId: z.string(), reason: z.string() }),
  z.object({ type: z.literal("ease_next_session"), percent: z.number().int().min(5).max(30), reason: z.string() }),
  z.object({ type: z.literal("set_life_mode"), mode: z.enum(["normal", "travel", "ill", "injured", "busy", "newborn"]), until: z.string().nullable() }),
  z.object({ type: z.literal("set_ritual"), field: z.enum(["weighInDay", "photoDay", "wakeTime", "reflectionTime"]), value: z.string() }),
]);
const ChatOut = z.object({ reply: z.string().max(1200), actions: z.array(Action).max(3) });

async function chatContext(userId: string) {
  const rec = (await getProfile(userId))!;
  const o = await getProgrammeOverview(userId);
  const readiness = await getReadiness(userId);
  const activitiesToday = (await activitiesForDay(userId)).map((a) => ({ type: a.payload?.type ?? "workout", minutes: Math.round(a.durationMin), intensity: a.payload?.intensity ?? null, source: a.provider }));
  const today = new Date().toISOString().slice(0, 10);
  const upcoming = (o?.sessions ?? []).filter((s) => s.status === "planned" && s.scheduledOn >= today).slice(0, 6).map((s) => ({ id: s.id, name: s.name, date: s.scheduledOn }));
  const recent = (o?.sessions ?? []).filter((s) => s.status === "completed").slice(-6).map((s) => ({ name: s.name, date: s.scheduledOn, rpe: s.sessionRpe, soreness: s.soreness, notes: s.notes }));
  return { profile: { goal: rec.profile.primaryGoal, experience: rec.profile.experience, days: rec.profile.daysPerWeek, minutes: rec.profile.sessionMinutes, injuries: rec.profile.injuries, medicalFlags: rec.profile.medicalFlags, lifeMode: rec.profile.lifeMode, rituals: rec.profile.rituals, priorityMuscles: rec.profile.priorityMuscles }, programme: o ? { name: o.programme.name, currentWeek: o.currentWeek?.weekNumber ?? null, completed: o.completedSessions, total: o.totalSessions } : null, readiness, activitiesToday, upcoming, recent, today };
}

export async function coachChat(userId: string, message: string) {
  await db().insert(coachMessage).values({ userId, role: "user", content: message });
  const history = await db().select().from(coachMessage).where(eq(coachMessage.userId, userId)).orderBy(desc(coachMessage.createdAt)).limit(12);
  const ctx = await chatContext(userId);
  let reply: string; let actions: z.infer<typeof Action>[] = []; let generatedBy = "rules";
  const out = aiAvailable() ? await structured({ task: "coach_chat", userId, schema: ChatOut, effort: "medium", maxTokens: 1200, system: `${COACH_SYSTEM}\n\nYou are talking directly with the user. Answer from the context only; if the data isn't there, say so. Keep replies under 120 words. When the user asks to change something you can act on, include an action; otherwise return none. Never invent session ids: only use ids from "upcoming". When you move a session, state the exact newDate you chose in the reply. "today" in the context is the current date. Do not diagnose injuries; suggest a professional when pain is new, sharp or worsening.`, user: `Context:\n${JSON.stringify(ctx, null, 1)}\n\nConversation (oldest first):\n${history.reverse().map((m) => `${m.role}: ${m.content}`).join("\n")}` , validate: (o) => o.actions.filter((a) => (a.type === "move_session" || a.type === "skip_session") && !ctx.upcoming.some((u) => u.id === a.sessionId)).map((a) => `unknown session ${"sessionId" in a ? a.sessionId : ""}`) }) : null;
  if (out) { reply = cleanText(out.reply); actions = out.actions; generatedBy = AI_MODEL; }
  else {
    const m = message.toLowerCase();
    reply = /readiness|tired|sleep|sore/.test(m) ? `${ctx.readiness.reasons.join(" ")} ${ctx.readiness.band === "low" ? "Today is a lighter day; the loads are already eased." : "You're good to train as planned."}` : /next|when|upcoming/.test(m) ? (ctx.upcoming[0] ? `Next up: ${ctx.upcoming[0].name} on ${ctx.upcoming[0].date}.` : "Nothing scheduled. Generate or extend a programme.") : "Right now I can report your data: readiness, upcoming sessions and recent performance. Ask about any of those.";
  }
  const applied: { type: string; summary: string; applied: boolean }[] = [];
  for (const a of actions) {
    try {
      if (a.type === "move_session") { await db().update(trainingSession).set({ scheduledOn: a.newDate }).where(and(eq(trainingSession.id, a.sessionId), eq(trainingSession.userId, userId), eq(trainingSession.status, "planned"))); applied.push({ type: a.type, summary: `Moved a session to ${a.newDate}`, applied: true }); }
      else if (a.type === "skip_session") { await skipSession(userId, a.sessionId); applied.push({ type: a.type, summary: `Skipped a session (${a.reason})`, applied: true }); }
      else if (a.type === "ease_next_session") { const [n] = ctx.upcoming; if (n) { const insts = await db().select().from(exerciseInstance).where(eq(exerciseInstance.sessionId, n.id)); for (const i of insts) await db().update(exerciseInstance).set({ plannedSets: i.plannedSets.map((s) => s.weightKg != null && s.type === "working" ? { ...s, weightKg: Math.round((s.weightKg * (1 - a.percent / 100)) / 1.25) * 1.25 } : s), notes: `Loads eased ${a.percent}%: ${a.reason}` }).where(eq(exerciseInstance.id, i.id)); applied.push({ type: a.type, summary: `Eased ${n.name} by ${a.percent}%`, applied: true }); } }
      else if (a.type === "set_life_mode") { await setLifeMode(userId, a.mode, a.until); applied.push({ type: a.type, summary: `Life mode: ${a.mode}`, applied: true }); }
      else if (a.type === "set_ritual") { const rec = (await getProfile(userId))!; const v = a.field === "weighInDay" || a.field === "photoDay" ? Number(a.value) : a.value; await upsertProfile(userId, { rituals: { ...rec.profile.rituals, [a.field]: v } }); applied.push({ type: a.type, summary: `Ritual updated: ${a.field}`, applied: true }); }
    } catch (e) { applied.push({ type: a.type, summary: `Couldn't apply: ${e instanceof Error ? e.message : "error"}`, applied: false }); }
  }
  const [row] = await db().insert(coachMessage).values({ userId, role: "coach", content: reply, actions: applied }).returning();
  return { ...row!, generatedBy };
}
export async function coachHistory(userId: string, limit = 40) { return (await db().select().from(coachMessage).where(eq(coachMessage.userId, userId)).orderBy(desc(coachMessage.createdAt)).limit(limit)).reverse(); }
export { mondayOf as coachMondayOf, isoWeek };
