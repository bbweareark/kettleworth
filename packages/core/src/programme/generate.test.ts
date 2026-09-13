import { describe, it, expect } from "vitest";
import { TrainingProfile, type ExerciseSummary } from "@kettleworth/types";
import { generateProgramme, validatePlanAgainstLibrary } from "./generate";
import { substitutesFor } from "./selection";
import { decideProgression } from "./progression";
import { adaptWeek, detectStaleness } from "./adaptation";

const ex = (id: string, o: Partial<ExerciseSummary>): ExerciseSummary => ({
  id, slug: id, name: id.replace(/_/g, " "), aliases: [], primaryMuscles: [], secondaryMuscles: [], equipment: ["barbell"], pattern: "squat",
  mechanics: "compound", difficulty: "beginner", category: "strength", contraindicatedRegions: [], unilateral: false, imageUrls: [], hasVideo: false, popularity: 40, ...o,
});
const lib: ExerciseSummary[] = [
  ex("back_squat", { primaryMuscles: ["quads", "glutes"], contraindicatedRegions: ["knee", "lower_back"] }),
  ex("goblet_squat", { primaryMuscles: ["quads"], equipment: ["dumbbell"] }),
  ex("leg_press", { primaryMuscles: ["quads"], equipment: ["leg_press"], contraindicatedRegions: ["knee"] }),
  ex("deadlift", { pattern: "hinge", primaryMuscles: ["hamstrings", "glutes", "lower_back"], contraindicatedRegions: ["lower_back"] }),
  ex("hip_thrust", { pattern: "hinge", primaryMuscles: ["glutes"], equipment: ["barbell", "bench"] }),
  ex("kb_swing", { pattern: "hinge", primaryMuscles: ["glutes", "hamstrings"], equipment: ["kettlebell"] }),
  ex("bench_press", { pattern: "horizontal_push", primaryMuscles: ["chest"], equipment: ["barbell", "bench"], contraindicatedRegions: ["shoulder"] }),
  ex("push_up", { pattern: "horizontal_push", primaryMuscles: ["chest"], equipment: ["bodyweight"] }),
  ex("db_row", { pattern: "horizontal_pull", primaryMuscles: ["lats", "upper_back"], equipment: ["dumbbell"] }),
  ex("pull_up", { pattern: "vertical_pull", primaryMuscles: ["lats"], equipment: ["pull_up_bar"], difficulty: "intermediate" }),
  ex("lat_pulldown", { pattern: "vertical_pull", primaryMuscles: ["lats"], equipment: ["cable"] }),
  ex("ohp", { pattern: "vertical_push", primaryMuscles: ["front_delts"], equipment: ["barbell"], contraindicatedRegions: ["shoulder"] }),
  ex("db_shoulder_press", { pattern: "vertical_push", primaryMuscles: ["front_delts"], equipment: ["dumbbell"] }),
  ex("lunge", { pattern: "lunge", primaryMuscles: ["quads", "glutes"], equipment: ["bodyweight"] }),
  ex("lateral_raise", { pattern: "isolation", mechanics: "isolation", primaryMuscles: ["side_delts"], equipment: ["dumbbell"] }),
  ex("curl", { pattern: "isolation", mechanics: "isolation", primaryMuscles: ["biceps"], equipment: ["dumbbell"] }),
  ex("pushdown", { pattern: "isolation", mechanics: "isolation", primaryMuscles: ["triceps"], equipment: ["cable"] }),
  ex("plank", { pattern: "core", primaryMuscles: ["abs"], equipment: ["bodyweight"] }),
  ex("farmer_carry", { pattern: "carry", primaryMuscles: ["forearms", "traps"], equipment: ["dumbbell"] }),
  ex("leg_curl", { pattern: "isolation", mechanics: "isolation", primaryMuscles: ["hamstrings"], equipment: ["machine"] }),
  ex("calf_raise", { pattern: "isolation", mechanics: "isolation", primaryMuscles: ["calves"], equipment: ["bodyweight"] }),
];

describe("generateProgramme", () => {
  it("never programs equipment the user lacks (home, dumbbells only)", () => {
    const p = TrainingProfile.parse({ environment: "home", equipment: ["dumbbell"], daysPerWeek: 3, goals: ["muscle"], primaryGoal: "muscle" });
    const plan = generateProgramme(p, lib);
    const byId = new Map(lib.map((e) => [e.id, e]));
    for (const m of plan.mesocycles) for (const w of m.weeks) for (const s of w.sessions) for (const e of s.exercises) {
      const eq = byId.get(e.exerciseId)!.equipment;
      expect(eq.every((q) => q === "dumbbell" || q === "bodyweight")).toBe(true);
    }
    expect(plan.mesocycles[0]!.weeks[0]!.sessions.length).toBe(3);
  });
  it("excludes hated and severe-injury-contraindicated exercises", () => {
    const p = TrainingProfile.parse({ daysPerWeek: 4, hatedExerciseIds: ["leg_press"], injuries: [{ region: "lower_back", severity: "severe" }], goals: ["strength"], primaryGoal: "strength" });
    const plan = generateProgramme(p, lib);
    const ids = new Set<string>();
    for (const m of plan.mesocycles) for (const w of m.weeks) for (const s of w.sessions) for (const e of s.exercises) ids.add(e.exerciseId);
    expect(ids.has("leg_press")).toBe(false);
    expect(ids.has("deadlift")).toBe(false);
    expect(ids.has("back_squat")).toBe(false);
    expect(plan.split).toBe("upper_lower");
  });
  it("steers moderate injuries toward safer variants without dropping the pattern", () => {
    const p = TrainingProfile.parse({ daysPerWeek: 3, injuries: [{ region: "lower_back", severity: "moderate" }], goals: ["muscle"], primaryGoal: "muscle" });
    const plan = generateProgramme(p, lib, { seed: "inj" });
    const ids = plan.mesocycles[0]!.weeks[0]!.sessions.flatMap((s) => s.exercises.map((e) => e.exerciseId));
    expect(ids.some((id) => ["kb_swing", "hip_thrust"].includes(id))).toBe(true); // hinge pattern kept via a back-friendly variant
    expect(ids).not.toContain("deadlift");
  });
  it("is deterministic for the same seed and builds deloads", () => {
    const p = TrainingProfile.parse({ daysPerWeek: 3, timelineWeeks: 12 });
    const a = generateProgramme(p, lib, { seed: "u1" });
    const b = generateProgramme(p, lib, { seed: "u1" });
    expect(JSON.stringify(a)).toBe(JSON.stringify(b));
    expect(a.totalWeeks).toBe(12);
    const deloads = a.mesocycles.flatMap((m) => m.weeks).filter((w) => w.isDeload).length;
    expect(deloads).toBe(3);
    expect(validatePlanAgainstLibrary(a, lib)).toEqual([]);
  });
  it("prescribes starting loads from known lifts", () => {
    const p = TrainingProfile.parse({ daysPerWeek: 3, goals: ["strength"], primaryGoal: "strength", knownLifts: [{ exerciseId: "back_squat", weightKg: 100, reps: 5 }] });
    const plan = generateProgramme(p, lib);
    const squat = plan.mesocycles[0]!.weeks[0]!.sessions.flatMap((s) => s.exercises).find((e) => e.exerciseId === "back_squat")!;
    const work = squat.sets.find((s) => s.type === "working")!;
    expect(work.weightKg).toBeGreaterThan(80);
    expect(work.weightKg).toBeLessThan(105);
    expect(squat.sets.some((s) => s.type === "warmup")).toBe(true);
  });
  it("every exercise carries a rationale", () => {
    const plan = generateProgramme(TrainingProfile.parse({ daysPerWeek: 2 }), lib);
    for (const e of plan.mesocycles[0]!.weeks[0]!.sessions.flatMap((s) => s.exercises)) expect(e.rationale.length).toBeGreaterThan(5);
  });
});

describe("variety", () => {
  it("keeps primaries and rotates accessories between blocks (balanced)", () => {
    const p = TrainingProfile.parse({ daysPerWeek: 4, timelineWeeks: 12, varietyPreference: "balanced", goals: ["muscle"], primaryGoal: "muscle" });
    const plan = generateProgramme(p, lib, { seed: "v" });
    const b0 = plan.mesocycles[0]!.weeks[0]!.sessions, b1 = plan.mesocycles[1]!.weeks[0]!.sessions;
    for (let d = 0; d < b0.length; d++) {
      const prim0 = b0[d]!.exercises.filter((e) => e.role === "primary").map((e) => e.exerciseId);
      const prim1 = b1[d]!.exercises.filter((e) => e.role === "primary").map((e) => e.exerciseId);
      expect(prim1).toEqual(prim0);
    }
    const acc0 = new Set(b0.flatMap((s) => s.exercises.filter((e) => e.role === "accessory").map((e) => e.exerciseId)));
    const acc1 = b1.flatMap((s) => s.exercises.filter((e) => e.role === "accessory").map((e) => e.exerciseId));
    expect(acc1.some((id) => !acc0.has(id))).toBe(true);
    expect(plan.rationale.join(" ")).toMatch(/accessories rotate/);
  });
  it("steady keeps everything identical across blocks", () => {
    const p = TrainingProfile.parse({ daysPerWeek: 3, timelineWeeks: 8, varietyPreference: "steady" });
    const plan = generateProgramme(p, lib, { seed: "s" });
    const ids = (m: number) => plan.mesocycles[m]!.weeks[0]!.sessions.map((s) => s.exercises.map((e) => e.exerciseId));
    expect(ids(1)).toEqual(ids(0));
  });
  it("flags plateaus and repeatedly swapped exercises", () => {
    const a = detectStaleness([{ exerciseId: "curl", name: "Curl", weeksTracked: 4, e1rmChangePct: 0.5, swapsRequested: 0, role: "accessory" }, { exerciseId: "db_row", name: "Row", weeksTracked: 2, e1rmChangePct: 0.2, swapsRequested: 2, role: "secondary" }, { exerciseId: "back_squat", name: "Squat", weeksTracked: 4, e1rmChangePct: 6, swapsRequested: 0, role: "primary" }]);
    expect(a.map((x) => x.exerciseId).sort()).toEqual(["curl", "db_row"]);
    expect(a.every((x) => x.reason.length > 20)).toBe(true);
  });
});

describe("substitutes", () => {
  it("offers same-pattern swaps respecting equipment", () => {
    const p = TrainingProfile.parse({ environment: "home", equipment: ["dumbbell", "kettlebell"] });
    const subs = substitutesFor(lib, lib.find((e) => e.id === "deadlift")!, p);
    expect(subs.map((s) => s.exercise.id)).toContain("kb_swing");
    expect(subs.map((s) => s.exercise.id)).not.toContain("hip_thrust");
  });
});

describe("progression", () => {
  const planned = [1, 2, 3].map((n) => ({ setNumber: n, type: "working" as const, reps: null, repRange: [8, 12] as [number, number], targetRpe: 8, targetRir: 2, weightKg: 40, restSeconds: 90, tempo: null, durationSeconds: null }));
  const log = (reps: number[], rpe: number) => reps.map((r, i) => ({ setNumber: i + 1, reps: r, weightKg: 40, rpe, durationSeconds: null, completed: true, loggedAt: "2026-09-01" }));
  it("adds load when all sets hit the top of the range", () => {
    const d = decideProgression(planned, log([12, 12, 12], 7.5), false);
    expect(d.change).toBe("up");
    expect(d.nextWeightKg).toBe(41.25);
    expect(d.reason).toMatch(/goes up/);
  });
  it("holds when mid-range", () => expect(decideProgression(planned, log([10, 9, 9], 8), false).change).toBe("hold"));
  it("drops when missing reps", () => expect(decideProgression(planned, log([7, 6, 6], 9), true).change).toBe("down"));
});

describe("adaptWeek", () => {
  it("deloads under fatigue + poor sleep", () => expect(adaptWeek({ plannedSessions: 4, completedSessions: 4, avgSoreness: 4.5, avgFatigue: 4, avgSessionRpe: 9, avgSleepHours: 5.5, readinessAvg: null, weightTrendKgPerWeek: null })[0]!.kind).toBe("deload"));
  it("repeats the week on poor adherence", () => expect(adaptWeek({ plannedSessions: 4, completedSessions: 1, avgSoreness: null, avgFatigue: null, avgSessionRpe: null, avgSleepHours: null, readinessAvg: null, weightTrendKgPerWeek: null })[0]!.kind).toBe("hold"));
  it("adds volume on an easy, complete week", () => expect(adaptWeek({ plannedSessions: 4, completedSessions: 4, avgSoreness: 2, avgFatigue: 2, avgSessionRpe: 7, avgSleepHours: 7.5, readinessAvg: 75, weightTrendKgPerWeek: null })[0]!.kind).toBe("volume_up"));
});
