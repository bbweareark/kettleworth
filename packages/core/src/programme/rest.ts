import type { Experience, Goal } from "@kettleworth/types";
import type { Role } from "./prescription";

/** The subset of an exercise the rest rule needs. */
export type RestExercise = { mechanics: "compound" | "isolation"; pattern: string; category?: string; equipment: string[]; primaryMuscles: string[]; unilateral?: boolean };
export type RestAdvice = { seconds: number; reason: string; evidence: string };

const BIG_LOWER = new Set(["squat", "hinge", "lunge"]);
const HEAVY_LOWER_MUSCLES = new Set(["quads", "glutes", "hamstrings", "lower_back", "erectors"]);

/**
 * Rest between working sets, set per exercise from the evidence rather than per goal:
 *  - Multi-joint lifts need 2 to 3+ minutes to keep reps and load across sets (Schoenfeld 2016 RCT: 3 min beat 1 min for
 *    strength and size; Grgic 2017 review: >2 min for maximal strength in multi-joint lifts; de Salles 2009: 3 to 5 min at 50 to 90% 1RM).
 *  - Big lower-body lifts fatigue more than upper-body lifts at the same relative load, so they get longer (Willardson & Burkett 2006;
 *    Senna 2016: repetitions fall faster across sets in multi-joint than single-joint exercises).
 *  - Single-joint work recovers faster: 60 to 90 s preserves performance and growth (Grgic 2018 hypertrophy review).
 *  - Explosive work (Olympic lifts, jumps) needs the longest rest to keep output (Abdessemed 1999; ACSM 2009: 3 to 5 min for power).
 *  - Endurance and finisher work uses short rest on purpose, because the metabolic stress is the stimulus (ACSM 2009).
 * Rest is a floor for quality, not a stopwatch: the timer can be extended, and self-selected rest close to these values performs the same (Ibbott 2019).
 */
export function restFor(ex: RestExercise, opts: { role: Role; goal: Goal; topReps: number; experience: Experience }): RestAdvice {
  const { role, goal, topReps, experience } = opts;
  const adv = experience === "advanced";
  const beginner = experience === "beginner";
  if (role === "mobility") return { seconds: 30, reason: "Mobility work: move on as soon as you feel ready.", evidence: "Low-load positional work does not need recovery between sets." };
  if (role === "finisher") return { seconds: 45, reason: "Finisher: short rest on purpose, the burn is the point.", evidence: "ACSM 2009: rest of 60 s or less for muscular endurance and metabolic stress." };
  const explosive = ex.category === "olympic weightlifting" || ex.category === "plyometrics" || ex.pattern === "power";
  if (explosive) return { seconds: adv ? 240 : 180, reason: `${adv ? 4 : 3} min: explosive work needs full recovery so every rep stays fast.`, evidence: "Abdessemed 1999; ACSM 2009: 3 to 5 min between power sets." };

  const bigLower = ex.mechanics === "compound" && (BIG_LOWER.has(ex.pattern) || ex.primaryMuscles.some((m) => HEAVY_LOWER_MUSCLES.has(m))) && !ex.equipment.includes("bodyweight");
  let s: number; let reason: string; let evidence: string;
  if (ex.mechanics === "compound") {
    if (topReps <= 5) { s = bigLower ? 210 : 180; reason = `${bigLower ? "3.5" : "3"} min: heavy multi-joint work, ${bigLower ? "big muscle mass" : "so reps and load hold across sets"}.`; evidence = "Schoenfeld 2016: 3 min beat 1 min for strength and size. Grgic 2017: over 2 min for maximal strength in multi-joint lifts."; }
    else if (topReps <= 10) { s = bigLower ? 180 : 150; reason = `${bigLower ? "3" : "2.5"} min: moderate load compound, enough to repeat the set at full quality.`; evidence = "Grgic 2018: 2 to 3 min for hypertrophy on multi-joint lifts. Willardson & Burkett 2006: lower-body lifts need longer than upper-body."; }
    else if (topReps <= 15) { s = bigLower ? 150 : 120; reason = "2 to 2.5 min: higher-rep compound, reps fall fast with short rest.", evidence = "Senna 2016: repetition loss across sets is largest in multi-joint exercises with short rest."; }
    else { s = 90; reason = "90 s: light compound, density is part of the stimulus."; evidence = "ACSM 2009: 1 to 2 min for assistance and endurance ranges."; }
    if (adv) s += 15; if (beginner) s -= 15;
  } else {
    if (topReps <= 8) { s = 90; reason = "90 s: heavier single-joint work."; evidence = "Grgic 2017: single-joint lifts recover in 1 to 2 min."; }
    else if (topReps <= 15) { s = 75; reason = "75 s: single-joint work recovers quickly, keep the pace."; evidence = "Grgic 2018: 60 to 90 s preserves growth on isolation exercises."; }
    else { s = 60; reason = "60 s: light isolation, short rest keeps the burn."; evidence = "ACSM 2009: 60 s or less for endurance ranges."; }
  }
  if (goal === "endurance") s = Math.min(s, 90);
  if (goal === "fat_loss" && role !== "primary") s = Math.min(s, 90);
  s = Math.max(30, Math.min(300, Math.round(s / 15) * 15));
  return { seconds: s, reason, evidence };
}
