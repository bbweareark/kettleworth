import type { ExerciseSummary, TrainingProfile, Equipment, BodyRegion, Muscle } from "@kettleworth/types";
import type { SlotSpec } from "./split";

const GYM_EQUIPMENT: Equipment[] = [
  "barbell", "dumbbell", "kettlebell", "cable", "machine", "smith_machine", "bench", "squat_rack", "pull_up_bar",
  "dip_station", "bands", "ez_bar", "trap_bar", "leg_press", "rowing_machine", "bike", "treadmill", "foam_roller", "bodyweight",
];
const DIFFICULTY_RANK = { beginner: 0, intermediate: 1, advanced: 2 } as const;
const EXPERIENCE_RANK = { beginner: 0, novice: 0, intermediate: 1, advanced: 2 } as const;

export function availableEquipment(profile: TrainingProfile): Set<Equipment> {
  const set = new Set<Equipment>(profile.environment === "home" ? profile.equipment : [...GYM_EQUIPMENT, ...profile.equipment]);
  set.add("bodyweight");
  return set;
}

/** Hard constraints. Returns a reason string when excluded, null when allowed. */
export function exclusionReason(ex: ExerciseSummary, profile: TrainingProfile, equipment: Set<Equipment>): string | null {
  if (profile.hatedExerciseIds.includes(ex.id)) return "you said you dislike it";
  for (const e of ex.equipment) if (!equipment.has(e)) return `needs ${e.replace("_", " ")}`;
  // Severe injuries exclude the movement outright. Moderate/mild ones are penalised in scoring and surfaced as in-session cautions with swaps.
  const severe = new Set<BodyRegion>(profile.injuries.filter((i) => i.severity === "severe").map((i) => i.region));
  for (const r of ex.contraindicatedRegions) if (severe.has(r)) return `loads your ${r.replace("_", " ")}`;
  if (DIFFICULTY_RANK[ex.difficulty] > EXPERIENCE_RANK[profile.experience] + 1) return "too advanced for now";
  return null;
}

export function scoreCandidate(ex: ExerciseSummary, slot: SlotSpec, profile: TrainingProfile, usedIds: Set<string>, rnd: () => number): number {
  let s = 0;
  // Editorial weight: well-known, well-coached movements win ties by a wide margin so plans look like a coach wrote them.
  s += Math.min(10, ex.popularity / 10);
  if (profile.lovedExerciseIds.includes(ex.id)) s += 6;
  if (profile.knownLifts.some((l) => l.exerciseId === ex.id)) s += 3; // user already trains it and we can prescribe a load
  if (slot.role !== "primary") s += ex.primaryMuscles.filter((m) => profile.priorityMuscles.includes(m)).length * 3; // priority areas win accessory slots
  if (slot.role === "primary" && ex.mechanics === "compound") s += 3;
  if (slot.role === "accessory" && ex.mechanics === "isolation") s += 2;
  if (slot.muscles?.length) {
    const p = ex.primaryMuscles.filter((m) => slot.muscles!.includes(m)).length;
    s += p * 3;
  }
  const styles = profile.styles;
  if (styles.includes("powerlifting") && ex.equipment.includes("barbell")) s += 2;
  if (styles.includes("kettlebell") && ex.equipment.includes("kettlebell")) s += 2;
  if (styles.includes("calisthenics") && ex.equipment.length === 1 && ex.equipment[0] === "bodyweight") s += 2;
  if (styles.includes("bodybuilding") && (ex.equipment.includes("cable") || ex.equipment.includes("machine"))) s += 1;
  if (profile.experience === "beginner" && ex.difficulty === "beginner") s += 1;
  if (profile.experience === "advanced" && ex.difficulty === "advanced") s += 1;
  if (ex.hasVideo) s += 0.5;
  if (ex.imageUrls.length) s += 0.25;
  if (usedIds.has(ex.id)) s -= 4; // diversity across the week
  // Non-severe injuries: penalty scaled by severity so a safer variant wins when one exists.
  for (const inj of profile.injuries) if (ex.contraindicatedRegions.includes(inj.region)) s -= inj.severity === "moderate" ? 7 : 2.5;
  s += rnd() * 0.5; // seeded tie-break
  return s;
}

export function candidatesForSlot(library: ExerciseSummary[], slot: SlotSpec): ExerciseSummary[] {
  if (slot.pattern === "isolation" && slot.muscles) {
    return library.filter((e) => e.category === "strength" && e.primaryMuscles.some((m) => slot.muscles!.includes(m)) && e.pattern !== "cardio");
  }
  if (slot.pattern === "core") return library.filter((e) => e.pattern === "core");
  if (slot.pattern === "cardio") return library.filter((e) => e.category === "cardio");
  if (slot.pattern === "mobility") return library.filter((e) => e.category === "mobility" || e.category === "stretch");
  return library.filter((e) => e.pattern === slot.pattern && e.category === "strength");
}

export type Selection = { exercise: ExerciseSummary; rationale: string } | null;

export function selectForSlot(library: ExerciseSummary[], slot: SlotSpec, profile: TrainingProfile, usedIds: Set<string>, rnd: () => number): Selection {
  const equipment = availableEquipment(profile);
  const cands = candidatesForSlot(library, slot);
  let best: { ex: ExerciseSummary; score: number } | null = null;
  for (const ex of cands) {
    if (exclusionReason(ex, profile, equipment)) continue;
    const score = scoreCandidate(ex, slot, profile, usedIds, rnd);
    if (!best || score > best.score) best = { ex, score };
  }
  if (!best) return null;
  const why: string[] = [];
  if (profile.lovedExerciseIds.includes(best.ex.id)) why.push("one of your favourites");
  else if (slot.role === "primary") why.push(`the best ${slot.pattern.replace("_", " ")} you can do with your equipment`);
  else if (slot.muscles?.length) why.push(`targets ${slot.muscles.map((m) => m.replace("_", " ")).join(" and ")}`);
  else why.push(`covers the ${slot.pattern.replace("_", " ")} pattern`);
  return { exercise: best.ex, rationale: `${best.ex.name}: ${why.join(", ")}.` };
}

/** Ranked substitutes for an exercise the user wants to swap: same pattern, same primary muscle overlap, respecting constraints. */
export function substitutesFor(library: ExerciseSummary[], current: ExerciseSummary, profile: TrainingProfile, limit = 6): { exercise: ExerciseSummary; reason: string }[] {
  const equipment = availableEquipment(profile);
  const scored: { exercise: ExerciseSummary; score: number }[] = [];
  for (const ex of library) {
    if (ex.id === current.id || ex.category !== current.category) continue;
    if (exclusionReason(ex, profile, equipment)) continue;
    let s = 0;
    if (ex.pattern === current.pattern) s += 4;
    s += ex.primaryMuscles.filter((m: Muscle) => current.primaryMuscles.includes(m)).length * 3;
    s += ex.secondaryMuscles.filter((m: Muscle) => current.primaryMuscles.includes(m)).length;
    if (ex.mechanics === current.mechanics) s += 1;
    if (profile.lovedExerciseIds.includes(ex.id)) s += 3;
    s += Math.min(5, ex.popularity / 20);
    if (s >= 3) scored.push({ exercise: ex, score: s });
  }
  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, limit).map(({ exercise }) => ({
    exercise,
    reason: exercise.pattern === current.pattern ? `Same ${current.pattern.replace("_", " ")} pattern, same muscles.` : `Hits ${exercise.primaryMuscles.map((m) => m.replace("_", " ")).join(", ")} like the original.`,
  }));
}
