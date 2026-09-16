import type { ExerciseSummary, Injury } from "@kettleworth/types";
import { seededRandom, hashString } from "./rng";

/**
 * Quests turn the week into something you can win. The main quest is the session the engine assigned: full Growth.
 * The side quest is the fallback on a day that got away from you: ten minutes at home, fewer points, streak intact.
 * The point of the smaller reward is honesty, not punishment. A side quest is worth doing and is never worth as much
 * as the session you planned, so the incentive always points back at the main quest.
 */
export const MAIN_QUEST_POINTS = 100;
export const SIDE_QUEST_POINTS = 40;

export type SideQuestMove = { exerciseId: string; name: string; reps: number | null; seconds: number | null; cue: string };
export type SideQuest = { title: string; minutes: number; rounds: number; moves: SideQuestMove[]; focus: string[]; points: number; why: string };

/** Answer to "did you train today?" */
export type QuestAnswer = "done" | "not_yet" | "swap";

/**
 * Should we ask whether today's session happened? Only when it is still unfinished and either the day is running out
 * (local evening) or the day has already passed. Never on a rest day, never twice.
 */
export function shouldAskAboutSession(o: { status: string; scheduledOn: string; todayIso: string; localHour: number; alreadyAsked: boolean; eveningHour?: number }): boolean {
  if (o.alreadyAsked) return false;
  if (o.status === "completed" || o.status === "skipped") return false;
  if (o.scheduledOn < o.todayIso) return true;
  if (o.scheduledOn > o.todayIso) return false;
  return o.localHour >= (o.eveningHour ?? 17);
}

const BODYWEIGHT_OK = new Set(["bodyweight", "bands", "dumbbell", "kettlebell", "foam_roller"]);
/**
 * The movements a side quest may use. Curated rather than inferred, because a floor circuit has to be obvious: nobody
 * should have to look up what a Svend press is at nine in the evening. Ids are matched against the real library, so a
 * movement that is missing, hated or ruled out by an injury simply drops and the next one takes its place.
 * `needs` names the kit beyond a floor and a wall, so a pull-up bar movement only appears for someone who has one.
 */
export const HOME_MOVES: { id: string; slot: "legs" | "push" | "pull" | "core"; needs?: string }[] = [
  { id: "bodyweight-squat", slot: "legs" },
  { id: "bodyweight-walking-lunge", slot: "legs" },
  { id: "step-up-with-knee-raise", slot: "legs" },
  { id: "single-leg-glute-bridge", slot: "legs" },
  { id: "butt-lift-bridge", slot: "legs" },
  { id: "glute-kickback", slot: "legs" },
  { id: "donkey-calf-raises", slot: "legs" },
  { id: "push-up", slot: "push" },
  { id: "incline-push-up", slot: "push" },
  { id: "decline-push-up", slot: "push" },
  { id: "close-grip-push-up-off-of-a-dumbbell", slot: "push", needs: "dumbbell" },
  { id: "push-up-to-side-plank", slot: "push" },
  { id: "inverted-row", slot: "pull" },
  { id: "bodyweight-mid-row", slot: "pull" },
  { id: "pull-up", slot: "pull", needs: "pull_up_bar" },
  { id: "one-arm-dumbbell-row", slot: "pull", needs: "dumbbell" },
  { id: "plank", slot: "core" },
  { id: "dead-bug", slot: "core" },
  { id: "reverse-crunch", slot: "core" },
  { id: "russian-twist", slot: "core" },
  { id: "crunch", slot: "core" },
  { id: "flutter-kicks", slot: "core" },
];

const PUSH = new Set(["chest", "front_delts", "side_delts", "triceps"]);
const PULL = new Set(["lats", "upper_back", "rear_delts", "biceps", "traps"]);
const LEGS = new Set(["quads", "glutes", "hamstrings", "calves", "adductors", "abductors"]);

/** Same family as the missed session, so the side quest keeps the week's shape rather than cutting across it. */
function familyOf(muscles: string[]): "push" | "pull" | "legs" | "full" {
  const p = muscles.filter((m) => PUSH.has(m)).length, u = muscles.filter((m) => PULL.has(m)).length, l = muscles.filter((m) => LEGS.has(m)).length;
  const top = Math.max(p, u, l);
  if (top === 0) return "full";
  return top === l ? "legs" : top === p ? "push" : "pull";
}

/**
 * Build a ten-minute circuit from what the lifter can do at home. Deterministic for a given day, so refreshing the
 * page never reshuffles the quest, and injury regions are excluded exactly as they are in the main programme.
 */
export function buildSideQuest(seedKey: string, library: ExerciseSummary[], o: { focusMuscles: string[]; minutes?: number; injuries?: Injury[]; hatedExerciseIds?: string[]; equipment?: string[] }): SideQuest | null {
  const minutes = Math.max(5, Math.min(20, o.minutes ?? 10));
  const blocked = new Set((o.injuries ?? []).filter((i) => i.severity !== "mild").map((i) => i.region));
  const hated = new Set(o.hatedExerciseIds ?? []);
  const kit = new Set([...(o.equipment ?? []), "bodyweight"]);
  // Strength work only: a stretch or a jump does not earn the same credit as the session it replaces, and a pull-up
  // bar is not a given at home, so bar-hanging movements are excluded unless the lifter said they have one.
  const hasBar = (o.equipment ?? []).includes("pull_up_bar");
  const pool = library.filter((e) =>
    !hated.has(e.id) &&
    e.difficulty !== "advanced" &&
    e.category === "strength" &&
    (hasBar || !/\b(chin|pull-?up|hang|muscle-?up|leg raise)\b/i.test(e.name)) &&
    ((o.equipment ?? []).includes("dip_station") || !/\b(dip|parallel bar)\b/i.test(e.name)) &&
    e.equipment.length > 0 && e.equipment.every((q) => BODYWEIGHT_OK.has(q) && kit.has(q)) &&
    !e.contraindicatedRegions.some((r) => blocked.has(r as Injury["region"])),
  );
  if (pool.length < 3) return null;
  const family = familyOf(o.focusMuscles);
  const rnd = seededRandom(hashString(seedKey));
  const byId = new Map(pool.map((e) => [e.id, e]));
  const slots: ("legs" | "push" | "pull" | "core")[] = family === "legs" ? ["legs", "legs", "core", "push"]
    : family === "push" ? ["push", "push", "core", "legs"]
    : family === "pull" ? ["pull", "pull", "core", "legs"]
    : ["legs", "push", "pull", "core"];
  const picked: ExerciseSummary[] = [];
  for (const slot of slots) {
    // Curated order is priority order: the squat leads a legs circuit, not a calf raise. Rotate among the top few so
    // two missed days in a week do not produce the same four moves.
    const options = HOME_MOVES.filter((m) => m.slot === slot && (!m.needs || kit.has(m.needs))).map((m) => byId.get(m.id)).filter((e): e is ExerciseSummary => !!e && !picked.includes(e));
    const choice = options.length ? options[Math.floor(rnd() * Math.min(3, options.length))]! : null;
    if (choice) picked.push(choice);
  }
  if (picked.length < 3) return null;
  const rounds = minutes <= 8 ? 2 : minutes >= 15 ? 4 : 3;
  const moves: SideQuestMove[] = picked.map((e, i) => {
    const isCore = e.primaryMuscles.some((m) => m === "abs" || m === "obliques");
    const isHold = /\b(plank|hold|wall sit|hollow|dead ?bug)\b/i.test(e.name);
    return {
      exerciseId: e.id, name: e.name,
      reps: isHold ? null : e.mechanics === "compound" ? 12 : 15,
      seconds: isHold ? 30 : null,
      cue: i === 0 ? "Set the pace here, you have three more moves." : isCore ? "Brace, breathe, no rushing." : "Controlled down, honest range.",
    };
  });
  const title = family === "legs" ? "Ten minutes, legs" : family === "push" ? "Ten minutes, push" : family === "pull" ? "Ten minutes, pull" : "Ten minutes, full body";
  return {
    title, minutes, rounds, moves, points: SIDE_QUEST_POINTS,
    focus: [...new Set(picked.flatMap((e) => e.primaryMuscles))].slice(0, 3),
    why: `Same muscles as the session you missed, no kit needed. It keeps the week alive and is worth ${SIDE_QUEST_POINTS} Growth against the session's ${MAIN_QUEST_POINTS}.`,
  };
}
