import type { TrainingProfile, SplitType, Muscle, MovementPattern } from "@kettleworth/types";

export type SlotSpec = {
  pattern: MovementPattern;
  muscles?: Muscle[];
  role: "primary" | "secondary" | "accessory" | "finisher" | "mobility";
  optional?: boolean;
};
export type SessionTemplate = { name: string; focus: Muscle[]; slots: SlotSpec[] };

const FULL_A: SessionTemplate = {
  name: "Full Body A",
  focus: ["quads", "chest", "upper_back"],
  slots: [
    { pattern: "squat", role: "primary" },
    { pattern: "horizontal_push", role: "primary" },
    { pattern: "horizontal_pull", role: "secondary" },
    { pattern: "hinge", role: "secondary" },
    { pattern: "isolation", muscles: ["side_delts", "rear_delts"], role: "accessory", optional: true },
    { pattern: "core", role: "finisher", optional: true },
  ],
};
const FULL_B: SessionTemplate = {
  name: "Full Body B",
  focus: ["hamstrings", "glutes", "lats", "front_delts"],
  slots: [
    { pattern: "hinge", role: "primary" },
    { pattern: "vertical_pull", role: "primary" },
    { pattern: "vertical_push", role: "secondary" },
    { pattern: "lunge", role: "secondary" },
    { pattern: "isolation", muscles: ["biceps", "triceps"], role: "accessory", optional: true },
    { pattern: "carry", role: "finisher", optional: true },
  ],
};
const FULL_C: SessionTemplate = {
  name: "Full Body C",
  focus: ["quads", "chest", "lats"],
  slots: [
    { pattern: "squat", role: "primary" },
    { pattern: "vertical_pull", role: "primary" },
    { pattern: "horizontal_push", role: "secondary" },
    { pattern: "hinge", role: "secondary" },
    { pattern: "isolation", muscles: ["calves", "abs"], role: "accessory", optional: true },
    { pattern: "core", role: "finisher", optional: true },
  ],
};
const UPPER_A: SessionTemplate = {
  name: "Upper A",
  focus: ["chest", "upper_back", "front_delts"],
  slots: [
    { pattern: "horizontal_push", role: "primary" },
    { pattern: "horizontal_pull", role: "primary" },
    { pattern: "vertical_push", role: "secondary" },
    { pattern: "vertical_pull", role: "secondary" },
    { pattern: "isolation", muscles: ["triceps"], role: "accessory" },
    { pattern: "isolation", muscles: ["biceps"], role: "accessory", optional: true },
  ],
};
const UPPER_B: SessionTemplate = {
  name: "Upper B",
  focus: ["lats", "side_delts", "chest"],
  slots: [
    { pattern: "vertical_pull", role: "primary" },
    { pattern: "vertical_push", role: "primary" },
    { pattern: "horizontal_push", role: "secondary" },
    { pattern: "horizontal_pull", role: "secondary" },
    { pattern: "isolation", muscles: ["side_delts", "rear_delts"], role: "accessory" },
    { pattern: "isolation", muscles: ["biceps", "forearms"], role: "accessory", optional: true },
  ],
};
const LOWER_A: SessionTemplate = {
  name: "Lower A",
  focus: ["quads", "glutes", "abs"],
  slots: [
    { pattern: "squat", role: "primary" },
    { pattern: "hinge", role: "secondary" },
    { pattern: "lunge", role: "secondary" },
    { pattern: "isolation", muscles: ["hamstrings"], role: "accessory" },
    { pattern: "isolation", muscles: ["calves"], role: "accessory", optional: true },
    { pattern: "core", role: "finisher" },
  ],
};
const LOWER_B: SessionTemplate = {
  name: "Lower B",
  focus: ["hamstrings", "glutes", "quads"],
  slots: [
    { pattern: "hinge", role: "primary" },
    { pattern: "squat", role: "secondary" },
    { pattern: "lunge", role: "secondary" },
    { pattern: "isolation", muscles: ["quads"], role: "accessory" },
    { pattern: "isolation", muscles: ["glutes", "adductors", "abductors"], role: "accessory", optional: true },
    { pattern: "core", role: "finisher" },
  ],
};
const PUSH: SessionTemplate = {
  name: "Push",
  focus: ["chest", "front_delts", "triceps"],
  slots: [
    { pattern: "horizontal_push", role: "primary" },
    { pattern: "vertical_push", role: "secondary" },
    { pattern: "horizontal_push", role: "secondary" },
    { pattern: "isolation", muscles: ["side_delts"], role: "accessory" },
    { pattern: "isolation", muscles: ["triceps"], role: "accessory" },
    { pattern: "isolation", muscles: ["chest"], role: "accessory", optional: true },
  ],
};
const PULL: SessionTemplate = {
  name: "Pull",
  focus: ["lats", "upper_back", "biceps"],
  slots: [
    { pattern: "vertical_pull", role: "primary" },
    { pattern: "horizontal_pull", role: "primary" },
    { pattern: "hinge", role: "secondary" },
    { pattern: "isolation", muscles: ["rear_delts", "traps"], role: "accessory" },
    { pattern: "isolation", muscles: ["biceps"], role: "accessory" },
    { pattern: "isolation", muscles: ["forearms"], role: "accessory", optional: true },
  ],
};
const LEGS: SessionTemplate = {
  name: "Legs",
  focus: ["quads", "hamstrings", "glutes", "calves"],
  slots: [
    { pattern: "squat", role: "primary" },
    { pattern: "hinge", role: "secondary" },
    { pattern: "lunge", role: "secondary" },
    { pattern: "isolation", muscles: ["hamstrings", "quads"], role: "accessory" },
    { pattern: "isolation", muscles: ["calves"], role: "accessory" },
    { pattern: "core", role: "finisher" },
  ],
};
export const MOBILITY_TEMPLATE: SessionTemplate = {
  name: "Mobility & Conditioning",
  focus: ["full_body", "cardio"],
  slots: [
    { pattern: "cardio", role: "primary" },
    { pattern: "mobility", role: "mobility" },
    { pattern: "mobility", role: "mobility" },
    { pattern: "core", role: "finisher", optional: true },
  ],
};

export function chooseSplit(profile: TrainingProfile): { split: SplitType; templates: SessionTemplate[]; reason: string } {
  const d = profile.daysPerWeek;
  const goal = profile.primaryGoal;
  const bodybuilding = profile.styles.includes("bodybuilding") || goal === "muscle";
  const adv = profile.experience === "intermediate" || profile.experience === "advanced";
  if (d <= 2) return { split: "full_body", templates: [FULL_A, FULL_B].slice(0, Math.max(1, d)), reason: `${d} day${d > 1 ? "s" : ""} a week: full-body sessions hit every muscle twice as often as a split would.` };
  if (d === 3) {
    if (bodybuilding && adv) return { split: "ppl", templates: [PUSH, PULL, LEGS], reason: "3 days with a muscle focus and solid experience: push/pull/legs gives each session enough volume to matter." };
    return { split: "full_body", templates: [FULL_A, FULL_B, FULL_C], reason: "3 days a week: three full-body sessions train every muscle three times, which the frequency evidence favours for strength when volume is matched." };
  }
  if (d === 4) return { split: "upper_lower", templates: [UPPER_A, LOWER_A, UPPER_B, LOWER_B], reason: "4 days: upper/lower trains every muscle twice a week, the frequency that meta-analyses link to better strength gains, with recovery between similar sessions." };
  if (d === 5) return { split: "ppl_ul", templates: [PUSH, PULL, LEGS, UPPER_A, LOWER_A], reason: "5 days: push/pull/legs plus an upper/lower pair balances frequency and recovery." };
  if (d === 6) return { split: "ppl", templates: [PUSH, PULL, LEGS, PUSH, PULL, LEGS], reason: "6 days: push/pull/legs twice through gives high frequency with each muscle rested 48 hours." };
  return { split: "ppl", templates: [PUSH, PULL, LEGS, PUSH, PULL, LEGS, MOBILITY_TEMPLATE], reason: "7 days: push/pull/legs twice with a mobility and conditioning day so there is still a real recovery session." };
}
