import { z } from "zod";

export const Sex = z.enum(["male", "female", "other"]);
export const Units = z.enum(["metric", "imperial"]);
export const Experience = z.enum(["beginner", "novice", "intermediate", "advanced"]);
export const Goal = z.enum([
  "fat_loss",
  "muscle",
  "strength",
  "endurance",
  "general_health",
  "sport",
]);
export const Environment = z.enum(["gym", "home", "both"]);
export const TimeOfDay = z.enum(["early_morning", "morning", "midday", "afternoon", "evening", "late"]);
export const TrainingStyle = z.enum([
  "bodybuilding",
  "powerlifting",
  "hiit",
  "calisthenics",
  "yoga_mobility",
  "running",
  "crossfit",
  "kettlebell",
]);
export const DietType = z.enum([
  "omnivore",
  "pescatarian",
  "vegetarian",
  "vegan",
  "halal",
  "kosher",
  "keto",
  "mediterranean",
]);
export const Allergen = z.enum([
  "gluten",
  "dairy",
  "eggs",
  "nuts",
  "peanuts",
  "soy",
  "shellfish",
  "fish",
  "sesame",
]);
export const BudgetTier = z.enum(["low", "medium", "high"]);
export const BodyRegion = z.enum([
  "neck",
  "shoulder",
  "elbow",
  "wrist",
  "upper_back",
  "lower_back",
  "hip",
  "knee",
  "ankle",
  "other",
]);
export const Severity = z.enum(["mild", "moderate", "severe"]);

export const Injury = z.object({
  region: BodyRegion,
  side: z.enum(["left", "right", "both"]).optional(),
  severity: Severity,
  note: z.string().max(300).optional(),
});

export const Equipment = z.enum([
  "barbell",
  "dumbbell",
  "kettlebell",
  "cable",
  "machine",
  "smith_machine",
  "bench",
  "squat_rack",
  "pull_up_bar",
  "dip_station",
  "bands",
  "trx",
  "medicine_ball",
  "ez_bar",
  "trap_bar",
  "leg_press",
  "rowing_machine",
  "bike",
  "treadmill",
  "foam_roller",
  "bodyweight",
]);

export const TrainingProfile = z.object({
  units: Units.default("metric"),
  dateOfBirth: z.string().date().optional(),
  age: z.number().int().min(13).max(100).optional(),
  sex: Sex.optional(),
  heightCm: z.number().min(120).max(230).optional(),
  weightKg: z.number().min(30).max(300).optional(),
  bodyFatPct: z.number().min(3).max(60).optional(),
  experience: Experience.default("beginner"),
  goals: z.array(Goal).default([]),
  primaryGoal: Goal.default("general_health"),
  timelineWeeks: z.number().int().min(4).max(52).default(12),
  daysPerWeek: z.number().int().min(1).max(7).default(3),
  sessionMinutes: z.number().int().min(15).max(150).default(60),
  preferredTime: TimeOfDay.optional(),
  environment: Environment.default("gym"),
  equipment: z.array(Equipment).default([]),
  lovedExerciseIds: z.array(z.string()).default([]),
  hatedExerciseIds: z.array(z.string()).default([]),
  styles: z.array(TrainingStyle).default([]),
  vibe: z.string().max(200).optional(),
  /** steady = same exercises all block; balanced = anchors fixed, accessories rotate each mesocycle; high = accessories rotate every 2 weeks and main-lift variations change per block */
  varietyPreference: z.enum(["steady", "balanced", "high"]).default("balanced"),
  /** Muscles the user (or the body-photo analysis, once confirmed) wants prioritised. Muscle ids from the exercise taxonomy. */
  priorityMuscles: z.array(z.string()).default([]),
  /** Rituals: the moments the app shows up. Times are local HH:MM; days are 0 (Mon) to 6 (Sun). */
  rituals: z.object({
    wakeTime: z.string().regex(/^\d{2}:\d{2}$/).optional(),
    trainingWindow: z.object({ start: z.string().regex(/^\d{2}:\d{2}$/), end: z.string().regex(/^\d{2}:\d{2}$/) }).optional(),
    weighInDay: z.number().int().min(0).max(6).optional(),
    photoDay: z.number().int().min(0).max(6).optional(),
    reflectionTime: z.string().regex(/^\d{2}:\d{2}$/).optional(),
    timezone: z.string().optional(),
  }).default({}),
  /** Life mode: a temporary situation the plan flexes around. */
  lifeMode: z.object({ mode: z.enum(["normal", "travel", "ill", "injured", "busy", "newborn"]), since: z.string(), until: z.string().nullable(), note: z.string().max(200).optional() }).default({ mode: "normal", since: "2026-01-01", until: null }),
  /** Bar weights in kg, set once. Defaults: 20 kg barbell (45 lb imperial), 10 kg EZ bar, 25 kg trap bar, Smith machine not counted. */
  barWeights: z.object({ barbell: z.number().min(0).max(40).optional(), ez_bar: z.number().min(0).max(30).optional(), trap_bar: z.number().min(0).max(45).optional(), smith_machine: z.number().min(0).max(40).optional() }).optional(),
  injuries: z.array(Injury).default([]),
  medicalFlags: z.array(z.string()).default([]),
  sleepHours: z.number().min(3).max(12).optional(),
  stressLevel: z.number().int().min(1).max(5).optional(),
  dietType: DietType.default("omnivore"),
  allergens: z.array(Allergen).default([]),
  dislikedFoods: z.array(z.string()).default([]),
  cookingMinutes: z.number().int().min(5).max(120).default(30),
  budgetTier: BudgetTier.default("medium"),
  knownLifts: z
    .array(z.object({ exerciseId: z.string(), weightKg: z.number().positive(), reps: z.number().int().min(1).max(30) }))
    .default([]),
  notes: z.string().max(2000).optional(),
});
export type TrainingProfile = z.infer<typeof TrainingProfile>;
export type Injury = z.infer<typeof Injury>;
export type Goal = z.infer<typeof Goal>;
export type Equipment = z.infer<typeof Equipment>;
export type Experience = z.infer<typeof Experience>;
export type DietType = z.infer<typeof DietType>;
export type Allergen = z.infer<typeof Allergen>;
export type TrainingStyle = z.infer<typeof TrainingStyle>;
export type BodyRegion = z.infer<typeof BodyRegion>;
export type Sex = z.infer<typeof Sex>;

export const BaselineMetrics = z.object({
  bmi: z.number().nullable(),
  bmr: z.number().nullable(),
  tdee: z.number().nullable(),
  targetCalories: z.number().nullable(),
  proteinG: z.number().nullable(),
  carbsG: z.number().nullable(),
  fatG: z.number().nullable(),
  estimatedMaxes: z.array(z.object({ exerciseId: z.string(), e1rmKg: z.number() })),
  explanations: z.array(z.string()),
});
export type BaselineMetrics = z.infer<typeof BaselineMetrics>;
