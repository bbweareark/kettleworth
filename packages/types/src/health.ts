import { z } from "zod";

/** Provider-agnostic normalised health data model. Every adapter maps into this. */
export const HealthProvider = z.enum([
  "apple_health",
  "health_connect",
  "whoop",
  "garmin",
  "fitbit",
  "oura",
  "polar",
  "samsung_health",
  "strava",
  "coros",
  "manual",
]);
export type HealthProvider = z.infer<typeof HealthProvider>;

export const HealthMetric = z.enum([
  "steps",
  "resting_hr",
  "hrv",
  "sleep_duration",
  "sleep_stages",
  "readiness",
  "strain",
  "active_calories",
  "workout",
  "body_weight",
  "body_fat",
  "vo2max",
  "spo2",
  "body_temperature",
]);
export type HealthMetric = z.infer<typeof HealthMetric>;

export const SleepStages = z.object({
  deepMin: z.number(),
  remMin: z.number(),
  lightMin: z.number(),
  awakeMin: z.number(),
});

export const WorkoutSummary = z.object({
  type: z.string(),
  durationMin: z.number(),
  distanceKm: z.number().nullable(),
  avgHr: z.number().nullable(),
  maxHr: z.number().nullable(),
  calories: z.number().nullable(),
  hrZonesMin: z.array(z.number()).nullable(),
});

export const HealthSample = z.object({
  provider: HealthProvider,
  metric: HealthMetric,
  /** ISO timestamp of the sample start */
  startAt: z.string(),
  endAt: z.string().nullable(),
  /** Numeric value in canonical units: steps, bpm, ms (hrv rmssd), minutes, score 0-100, kcal, kg, %, ml/kg/min, °C */
  value: z.number().nullable(),
  unit: z.string(),
  payload: z.union([SleepStages, WorkoutSummary, z.record(z.string(), z.unknown())]).nullable(),
  confidence: z.number().min(0).max(1).default(1),
  providerRecordId: z.string().nullable(),
});
export type HealthSample = z.infer<typeof HealthSample>;

export const Readiness = z.object({
  score: z.number().min(0).max(100).nullable(),
  band: z.enum(["low", "moderate", "high", "unknown"]),
  intensityScalar: z.number(),
  reasons: z.array(z.string()),
  sources: z.array(HealthProvider),
});
export type Readiness = z.infer<typeof Readiness>;
