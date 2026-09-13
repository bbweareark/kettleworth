import { z } from "zod";
import { Equipment, BodyRegion } from "./profile";

export const Muscle = z.enum([
  "chest",
  "front_delts",
  "side_delts",
  "rear_delts",
  "lats",
  "upper_back",
  "traps",
  "lower_back",
  "biceps",
  "triceps",
  "forearms",
  "abs",
  "obliques",
  "quads",
  "hamstrings",
  "glutes",
  "adductors",
  "abductors",
  "calves",
  "hip_flexors",
  "neck",
  "full_body",
  "cardio",
]);
export type Muscle = z.infer<typeof Muscle>;

export const MovementPattern = z.enum([
  "squat",
  "hinge",
  "lunge",
  "horizontal_push",
  "vertical_push",
  "horizontal_pull",
  "vertical_pull",
  "carry",
  "core",
  "isolation",
  "cardio",
  "mobility",
  "plyometric",
]);
export type MovementPattern = z.infer<typeof MovementPattern>;

export const Difficulty = z.enum(["beginner", "intermediate", "advanced"]);
export const Mechanics = z.enum(["compound", "isolation"]);
export const ExerciseCategory = z.enum([
  "strength",
  "cardio",
  "mobility",
  "plyometric",
  "warmup",
  "stretch",
]);

export const ExerciseSummary = z.object({
  id: z.string(),
  slug: z.string(),
  name: z.string(),
  aliases: z.array(z.string()),
  primaryMuscles: z.array(Muscle),
  secondaryMuscles: z.array(Muscle),
  equipment: z.array(Equipment),
  pattern: MovementPattern,
  mechanics: Mechanics,
  difficulty: Difficulty,
  category: ExerciseCategory,
  contraindicatedRegions: z.array(BodyRegion),
  unilateral: z.boolean(),
  imageUrls: z.array(z.string()),
  hasVideo: z.boolean(),
  /** 0-100 editorial weight: curated core lifts ~80-100, common movements ~40, rare/odd ~10 */
  popularity: z.number().default(10),
});
export type ExerciseSummary = z.infer<typeof ExerciseSummary>;
