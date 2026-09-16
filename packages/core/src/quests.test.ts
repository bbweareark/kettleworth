import { describe, expect, it } from "vitest";
import { buildSideQuest, shouldAskAboutSession, SIDE_QUEST_POINTS, MAIN_QUEST_POINTS } from "./quests";
import type { ExerciseSummary } from "@kettleworth/types";

const ex = (id: string, primary: string[], equipment: string[], extra: Partial<ExerciseSummary> = {}): ExerciseSummary => ({
  id, slug: id, name: id.replace(/-/g, " "), aliases: [], primaryMuscles: primary as never, secondaryMuscles: [], equipment: equipment as never,
  pattern: "squat" as never, mechanics: "compound", difficulty: "beginner", category: "strength" as never, contraindicatedRegions: [],
  unilateral: false, imageUrls: [], hasVideo: false, popularity: 50, ...extra,
});
const LIB: ExerciseSummary[] = [
  ex("bodyweight-squat", ["quads", "glutes"], ["bodyweight"]),
  ex("walking-lunge", ["quads", "glutes"], ["bodyweight"]),
  ex("glute-bridge", ["glutes"], ["bodyweight"]),
  ex("push-up", ["chest", "triceps"], ["bodyweight"]),
  ex("pike-push-up", ["front_delts"], ["bodyweight"]),
  ex("inverted-row", ["lats", "upper_back"], ["bodyweight"]),
  ex("band-pull-apart", ["rear_delts"], ["bands"]),
  ex("plank", ["abs"], ["bodyweight"]),
  ex("hamstring-stretch", ["hamstrings"], ["bodyweight"], { category: "stretch" as never }),
  ex("gorilla-chin", ["lats"], ["bodyweight"]),
  ex("parallel-bar-dip", ["chest"], ["bodyweight"]),
  ex("bottoms-up", ["abs"], ["bodyweight"], { popularity: 8 }),
  ex("dead-bug", ["abs"], ["bodyweight"]),
  ex("barbell-squat", ["quads"], ["barbell"]),
  ex("pistol-squat", ["quads"], ["bodyweight"], { difficulty: "advanced" }),
  ex("bodyweight-squat-knee", ["quads"], ["bodyweight"], { contraindicatedRegions: ["knee"] as never }),
];

describe("shouldAskAboutSession", () => {
  const base = { status: "planned", scheduledOn: "2026-09-16", todayIso: "2026-09-16", localHour: 9, alreadyAsked: false };
  it("waits until the evening on the day itself", () => {
    expect(shouldAskAboutSession(base)).toBe(false);
    expect(shouldAskAboutSession({ ...base, localHour: 18 })).toBe(true);
  });
  it("asks straight away once the day has passed", () => {
    expect(shouldAskAboutSession({ ...base, scheduledOn: "2026-09-15", localHour: 8 })).toBe(true);
  });
  it("never asks about a finished session, a future day, or twice", () => {
    expect(shouldAskAboutSession({ ...base, status: "completed", localHour: 20 })).toBe(false);
    expect(shouldAskAboutSession({ ...base, scheduledOn: "2026-09-17", localHour: 20 })).toBe(false);
    expect(shouldAskAboutSession({ ...base, localHour: 20, alreadyAsked: true })).toBe(false);
  });
});

describe("buildSideQuest", () => {
  it("uses only home kit, and never advanced or injured movements", () => {
    const q = buildSideQuest("u1:2026-09-16", LIB, { focusMuscles: ["quads", "glutes"], injuries: [{ region: "knee", severity: "moderate", notes: null }] as never });
    expect(q).not.toBeNull();
    const ids = q!.moves.map((m) => m.exerciseId);
    expect(ids).not.toContain("barbell-squat");
    expect(ids).not.toContain("pistol-squat");
    expect(ids.length).toBeGreaterThan(2);
  });
  it("follows the missed session's family and is worth less than the session", () => {
    const legs = buildSideQuest("seed-a", LIB, { focusMuscles: ["quads", "glutes"] })!;
    expect(legs.title).toMatch(/legs/);
    expect(legs.points).toBe(SIDE_QUEST_POINTS);
    expect(legs.points).toBeLessThan(MAIN_QUEST_POINTS);
    const push = buildSideQuest("seed-a", LIB, { focusMuscles: ["chest", "triceps"] })!;
    expect(push.title).toMatch(/push/);
  });
  it("is stable for the same day and gives every move a target", () => {
    const a = buildSideQuest("same-seed", LIB, { focusMuscles: ["lats"] })!;
    const b = buildSideQuest("same-seed", LIB, { focusMuscles: ["lats"] })!;
    expect(a.moves.map((m) => m.exerciseId)).toEqual(b.moves.map((m) => m.exerciseId));
    for (const m of a.moves) expect(m.reps ?? m.seconds).toBeGreaterThan(0);
    expect(a.moves.map((m) => m.exerciseId)).not.toContain("bottoms-up");
    for (const m of a.moves) expect(m.name).toMatch(/squat|lunge|push|row|plank|bridge|crunch|raise|bug/i);
  });
  it("leaves out stretches and bar work unless a bar was declared", () => {
    const q = buildSideQuest("seed-b", LIB, { focusMuscles: ["hamstrings", "glutes"] })!;
    const ids = q.moves.map((m) => m.exerciseId);
    expect(ids).not.toContain("hamstring-stretch");
    expect(ids).not.toContain("gorilla-chin");
    expect(ids).not.toContain("parallel-bar-dip");
    expect(ids).not.toContain("pull-up");
    const withBar = buildSideQuest("seed-b", LIB, { focusMuscles: ["lats"], equipment: ["bodyweight", "pull_up_bar"] })!;
    expect(withBar.moves.length).toBeGreaterThan(2);
  });
  it("returns nothing when there is no usable movement", () => {
    expect(buildSideQuest("x", [ex("barbell-squat", ["quads"], ["barbell"])], { focusMuscles: ["quads"] })).toBeNull();
  });
});
