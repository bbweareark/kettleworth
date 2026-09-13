import { pgTable, text, timestamp, jsonb, real, uuid, integer, index, date } from "drizzle-orm/pg-core";
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
  pose: text("pose").notNull().default("front"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (t) => [index("progress_photo_user_idx").on(t.userId)]);

export const estimatedMax = pgTable("estimated_max", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
  exerciseId: text("exercise_id").notNull(),
  e1rmKg: real("e1rm_kg").notNull(),
  source: text("source").notNull(), // intake | logged
  recordedAt: timestamp("recorded_at").notNull().defaultNow(),
}, (t) => [index("estimated_max_user_ex_idx").on(t.userId, t.exerciseId)]);
