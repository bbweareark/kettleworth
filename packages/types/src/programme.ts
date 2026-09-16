import { z } from "zod";
import { Muscle } from "./exercise";

export const SplitType = z.enum(["full_body", "upper_lower", "ppl", "ppl_ul", "bro", "custom"]);
export type SplitType = z.infer<typeof SplitType>;

export const PlannedSet = z.object({
  setNumber: z.number().int().min(1),
  type: z.enum(["warmup", "working", "backoff", "amrap", "drop"]).default("working"),
  reps: z.number().int().min(1).max(50).nullable(),
  repRange: z.tuple([z.number().int(), z.number().int()]).nullable(),
  targetRpe: z.number().min(5).max(10).nullable(),
  targetRir: z.number().int().min(0).max(5).nullable(),
  weightKg: z.number().nullable(),
  restSeconds: z.number().int().min(0).max(600),
  tempo: z.string().nullable(),
  durationSeconds: z.number().int().nullable(),
});
export type PlannedSet = z.infer<typeof PlannedSet>;

export const LoggedSet = z.object({
  setNumber: z.number().int().min(1),
  reps: z.number().int().min(0).max(100).nullable(),
  weightKg: z.number().min(0).max(500).nullable(),
  rpe: z.number().min(5).max(10).nullable(),
  durationSeconds: z.number().int().nullable(),
  completed: z.boolean(),
  loggedAt: z.string(),
  /** Set when the lifter confirmed a value the engine flagged as implausible; unconfirmed outliers are rejected. */
  confirmed: z.boolean().optional(),
  /** Bar weight used when this set was logged, so a total can always be explained as bar plus plates. */
  barKg: z.number().min(0).max(45).nullable().optional(),
});
export type LoggedSet = z.infer<typeof LoggedSet>;

export const PlannedExercise = z.object({
  exerciseId: z.string(),
  order: z.number().int(),
  role: z.enum(["primary", "secondary", "accessory", "warmup", "finisher", "mobility"]),
  sets: z.array(PlannedSet),
  notes: z.string().nullable(),
  rationale: z.string(),
  supersetGroup: z.string().nullable(),
});
export type PlannedExercise = z.infer<typeof PlannedExercise>;

export const PlannedSession = z.object({
  dayIndex: z.number().int().min(0).max(6),
  name: z.string(),
  focus: z.array(Muscle),
  estimatedMinutes: z.number().int(),
  warmup: z.array(z.string()),
  exercises: z.array(PlannedExercise),
});
export type PlannedSession = z.infer<typeof PlannedSession>;

export const PlannedWeek = z.object({
  weekNumber: z.number().int().min(1),
  isDeload: z.boolean(),
  intensityScalar: z.number(),
  volumeScalar: z.number(),
  sessions: z.array(PlannedSession),
});
export type PlannedWeek = z.infer<typeof PlannedWeek>;

export const PlannedMesocycle = z.object({
  index: z.number().int(),
  name: z.string(),
  focus: z.string(),
  weeks: z.array(PlannedWeek),
});
export type PlannedMesocycle = z.infer<typeof PlannedMesocycle>;

export const ProgrammePlan = z.object({
  name: z.string(),
  split: SplitType,
  daysPerWeek: z.number().int(),
  totalWeeks: z.number().int(),
  summary: z.string(),
  rationale: z.array(z.string()),
  mesocycles: z.array(PlannedMesocycle),
  weeklyVolumeBySet: z.record(z.string(), z.number()),
});
export type ProgrammePlan = z.infer<typeof ProgrammePlan>;

export const Adaptation = z.object({
  exerciseId: z.string().nullable(),
  kind: z.enum(["load_up", "load_down", "volume_up", "volume_down", "swap", "deload", "hold", "intensity_down"]),
  magnitude: z.number().nullable(),
  reason: z.string(),
});
export type Adaptation = z.infer<typeof Adaptation>;
