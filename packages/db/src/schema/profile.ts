import { pgTable, text, timestamp, jsonb, real, uuid, integer, index, date, customType } from "drizzle-orm/pg-core";

/** Raw bytes column, used when body photos are stored in Postgres rather than on disk. */
const bytea = customType<{ data: Buffer; driverData: Buffer }>({ dataType() { return "bytea"; } });
import { user } from "./auth";
import type { TrainingProfile, BaselineMetrics } from "@kettleworth/types";

export const profile = pgTable("profile", {
  userId: text("user_id").primaryKey().references(() => user.id, { onDelete: "cascade" }),
  /** Full TrainingProfile JSON (non-sensitive parts). */
  data: jsonb("data").$type<TrainingProfile>().notNull(),
  /** Encrypted JSON: injuries, medicalFlags, notes. */
  sensitive: text("sensitive"),
  baseline: jsonb("baseline").$type<BaselineMetrics>(),
  aiSummary: text("ai_summary"),
  onboardingStep: integer("onboarding_step").notNull().default(0),
  onboardingCompletedAt: timestamp("onboarding_completed_at"),
  intakeTranscript: jsonb("intake_transcript").$type<{ role: "coach" | "user"; text: string; at: string }[]>().notNull().default([]),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const bodyMeasurement = pgTable("body_measurement", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
  measuredOn: date("measured_on").notNull(),
  weightKg: real("weight_kg"),
  bodyFatPct: real("body_fat_pct"),
  waistCm: real("waist_cm"),
  hipCm: real("hip_cm"),
  chestCm: real("chest_cm"),
  armCm: real("arm_cm"),
  thighCm: real("thigh_cm"),
  source: text("source").notNull().default("manual"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (t) => [index("body_measurement_user_date_idx").on(t.userId, t.measuredOn)]);

export const progressPhoto = pgTable("progress_photo", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
  takenOn: date("taken_on").notNull(),
  storageKey: text("storage_key").notNull(),
  contentType: text("content_type").notNull().default("image/jpeg"),
  bytes: integer("bytes").notNull().default(0),
  pose: text("pose").notNull().default("front"),
  analysis: jsonb("analysis").$type<BodyAnalysis>(),
  /** Image bytes when PHOTO_STORAGE=db (serverless hosts have no durable disk); null when the file lives at storageKey on disk. */
  data: bytea("data"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (t) => [index("progress_photo_user_idx").on(t.userId)]);

export type BodyAnalysis = { summary: string; build: "lean" | "athletic" | "average" | "carrying_extra" | "unclear"; bodyFatRangePct: [number, number] | null; strengths: string[]; focusAreas: { muscle: string; reason: string }[]; posture: string[]; caveats: string[]; analysedAt: string; model: string };

export const estimatedMax = pgTable("estimated_max", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
  exerciseId: text("exercise_id").notNull(),
  e1rmKg: real("e1rm_kg").notNull(),
  source: text("source").notNull(), // intake | logged
  recordedAt: timestamp("recorded_at").notNull().defaultNow(),
}, (t) => [index("estimated_max_user_ex_idx").on(t.userId, t.exerciseId)]);
