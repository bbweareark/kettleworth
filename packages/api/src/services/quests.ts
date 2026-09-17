import { and, desc, eq, gte, inArray, lte, sql } from "drizzle-orm";
import { db, questLog, trainingSession, exerciseInstance, exercise, auditLog } from "@kettleworth/db";
import { buildSideQuest, weeklyStreak, MAIN_QUEST_POINTS, SIDE_QUEST_POINTS, type SideQuest } from "@kettleworth/core";
import { getProfile } from "./profile";
import { libraryForEngine } from "./library";
import { todayState } from "./session";

const iso = (d: Date) => d.toISOString().slice(0, 10);
/** Monday and Sunday of the week a date falls in, so "this week" means the same thing everywhere in the app. */
function weekBounds(todayIso: string): { from: string; to: string } {
  const d = new Date(`${todayIso}T00:00:00Z`);
  const monday = new Date(d); monday.setUTCDate(d.getUTCDate() - ((d.getUTCDay() + 6) % 7));
  const sunday = new Date(monday); sunday.setUTCDate(monday.getUTCDate() + 6);
  return { from: iso(monday), to: iso(sunday) };
}

export type QuestBoard = {
  main: { sessionId: string; name: string; scheduledOn: string; status: string; points: number; overdue: boolean } | null;
  /** True once the day is the session's day or later and it is still unfinished. The client decides the hour. */
  canAsk: boolean;
  asked: boolean;
  side: { id: string; quest: SideQuest; status: "asked" | "completed" | "declined" } | null;
  streakWeeks: number;
  weekDone: number;
  weekPlanned: number;
  sideQuestsThisWeek: number;
};

/** The day's quest board: the assigned session, whether to ask about it, and any side quest already offered. */
export async function questBoard(userId: string, todayIso = iso(new Date()), tz?: string): Promise<QuestBoard> {
  const weekAgo = iso(new Date(Date.now() - 6 * 86400000));
  // The main quest is whatever the day plan says today is about, so the board and the hero never disagree.
  const plan = await todayState(userId, todayIso, tz);
  const open = plan.kind === "in_progress" || plan.kind === "today" || plan.kind === "catch_up" || plan.kind === "done" ? plan.session : null;
  const logs = await db().select().from(questLog).where(and(eq(questLog.userId, userId), gte(questLog.onDate, weekAgo)));
  const todayLogs = logs.filter((l) => l.onDate === todayIso);
  const sideRow = todayLogs.find((l) => l.kind === "side");
  const done = await db().select({ d: trainingSession.scheduledOn }).from(trainingSession).where(and(eq(trainingSession.userId, userId), eq(trainingSession.status, "completed")));
  const sideDates = logs.filter((l) => l.kind === "side" && l.status === "completed").map((l) => l.onDate);
  const wk = weekBounds(todayIso);
  const weekSessions = await db().select({ d: trainingSession.scheduledOn, s: trainingSession.status }).from(trainingSession).where(and(eq(trainingSession.userId, userId), gte(trainingSession.scheduledOn, wk.from), lte(trainingSession.scheduledOn, wk.to)));
  return {
    main: open ? { sessionId: open.id, name: open.name, scheduledOn: open.scheduledOn, status: open.status, points: MAIN_QUEST_POINTS, overdue: open.scheduledOn < todayIso } : null,
    canAsk: !!open && open.status !== "completed",
    asked: todayLogs.some((l) => l.kind === "main"),
    side: sideRow ? { id: sideRow.id, quest: sideRow.payload as unknown as SideQuest, status: sideRow.status } : null,
    streakWeeks: weeklyStreak([...done.map((d) => d.d), ...sideDates]),
    weekDone: weekSessions.filter((s) => s.s === "completed").length,
    weekPlanned: weekSessions.length,
    sideQuestsThisWeek: sideDates.length,
  };
}

/**
 * Answer the evening question. "done" closes the session honestly, "swap" offers a ten minute side quest built from the
 * same muscles, and "not_yet" simply leaves the day open. Every answer is recorded so we never ask twice.
 */
export async function answerSessionQuest(userId: string, answer: "done" | "not_yet" | "swap", todayIso = iso(new Date()), tz?: string): Promise<{ answer: string; side?: { id: string; quest: SideQuest } }> {
  const board = await questBoard(userId, todayIso, tz);
  if (!board.main) throw new Error("No open session to answer for");
  const sessionId = board.main.sessionId;
  await db().insert(questLog).values({ userId, onDate: todayIso, kind: "main", status: answer === "done" ? "completed" : "declined", sessionId, points: answer === "done" ? MAIN_QUEST_POINTS : 0, completedAt: answer === "done" ? new Date() : null });
  if (answer === "done") {
    await db().update(trainingSession).set({ status: "completed", completedAt: new Date(), notes: "Marked complete from the quest board." }).where(and(eq(trainingSession.id, sessionId), eq(trainingSession.userId, userId)));
    await db().insert(auditLog).values({ userId, action: "quest.main.completed", target: sessionId });
    return { answer };
  }
  if (answer !== "swap") return { answer };
  if (board.side) return { answer, side: { id: board.side.id, quest: board.side.quest } };
  const rec = await getProfile(userId);
  const focus = await db().select({ m: exercise.primaryMuscles }).from(exerciseInstance).innerJoin(exercise, eq(exercise.id, exerciseInstance.exerciseId)).where(eq(exerciseInstance.sessionId, sessionId));
  const quest = buildSideQuest(`${userId}:${todayIso}`, await libraryForEngine(), {
    focusMuscles: focus.flatMap((f) => f.m),
    minutes: Math.min(15, Math.max(8, Math.round((rec?.profile.sessionMinutes ?? 60) / 5))),
    injuries: rec?.profile.injuries ?? [],
    hatedExerciseIds: rec?.profile.hatedExerciseIds ?? [],
    equipment: rec?.profile.equipment ?? [],
  });
  if (!quest) throw new Error("No home movements available for your profile");
  const [row] = await db().insert(questLog).values({ userId, onDate: todayIso, kind: "side", status: "asked", sessionId, payload: quest as unknown as Record<string, unknown>, points: 0 }).returning();
  return { answer, side: { id: row!.id, quest } };
}

/** Claim a finished side quest: fewer points than the session, and the week stays alive. */
export async function completeSideQuest(userId: string, id: string) {
  const [row] = await db().select().from(questLog).where(and(eq(questLog.id, id), eq(questLog.userId, userId), eq(questLog.kind, "side"))).limit(1);
  if (!row) throw new Error("Quest not found");
  if (row.status === "completed") return { points: row.points, alreadyClaimed: true };
  await db().update(questLog).set({ status: "completed", points: SIDE_QUEST_POINTS, completedAt: new Date() }).where(eq(questLog.id, id));
  await db().insert(auditLog).values({ userId, action: "quest.side.completed", target: id });
  return { points: SIDE_QUEST_POINTS, alreadyClaimed: false };
}

/** Completed side-quest dates, for streaks and Growth. */
export async function sideQuestDates(userIds: string[]): Promise<Record<string, string[]>> {
  if (!userIds.length) return {};
  const rows = await db().select({ u: questLog.userId, d: questLog.onDate }).from(questLog).where(and(inArray(questLog.userId, userIds), eq(questLog.kind, "side"), eq(questLog.status, "completed")));
  const out: Record<string, string[]> = {};
  for (const r of rows) (out[r.u] ??= []).push(r.d);
  return out;
}
