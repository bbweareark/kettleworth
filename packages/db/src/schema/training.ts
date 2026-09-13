import { pgTable, text, timestamp, jsonb, real, uuid, integer, boolean, index, date } from "drizzle-orm/pg-core";
import { user } from "./auth";
import { exercise } from "./library";
import type { PlannedSet, LoggedSet, ProgrammePlan, Adaptation, Muscle } from "@kettleworth/types";

export const programme = pgTable("programme", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  split: text("split").notNull(),
  goal: text("goal").notNull(),
  daysPerWeek: integer("days_per_week").notNull(),
  totalWeeks: integer("total_weeks").notNull(),
  status: text("status").$type<"active" | "completed" | "archived" | "draft">().notNull().default("active"),
  startDate: date("start_date").notNull(),
  summary: text("summary").notNull(),
  coachNote: text("coach_note"),
  rationale: jsonb("rationale").$type<string[]>().notNull().default([]),
  plan: jsonb("plan").$type<ProgrammePlan>().notNull(),
  seed: text("seed").notNull(),
  generatedBy: text("generated_by").$type<"rules" | "rules+ai">().notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (t) => [index("programme_user_status_idx").on(t.userId, t.status)]);

export const mesocycle = pgTable("mesocycle", {
  id: uuid("id").primaryKey().defaultRandom(),
  programmeId: uuid("programme_id").notNull().references(() => programme.id, { onDelete: "cascade" }),
  index: integer("index").notNull(),
  name: text("name").notNull(),
  focus: text("focus").notNull(),
});

export const week = pgTable("week", {
  id: uuid("id").primaryKey().defaultRandom(),
  programmeId: uuid("programme_id").notNull().references(() => programme.id, { onDelete: "cascade" }),
  mesocycleId: uuid("mesocycle_id").notNull().references(() => mesocycle.id, { onDelete: "cascade" }),
  weekNumber: integer("week_number").notNull(),
  isDeload: boolean("is_deload").notNull().default(false),
  intensityScalar: real("intensity_scalar").notNull().default(1),
  volumeScalar: real("volume_scalar").notNull().default(1),
  startsOn: date("starts_on").notNull(),
  adaptations: jsonb("adaptations").$type<Adaptation[]>().notNull().default([]),
}, (t) => [index("week_programme_idx").on(t.programmeId, t.weekNumber)]);

export const trainingSession = pgTable("training_session", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
  programmeId: uuid("programme_id").references(() => programme.id, { onDelete: "cascade" }),
  weekId: uuid("week_id").references(() => week.id, { onDelete: "cascade" }),
  dayIndex: integer("day_index").notNull(),
  scheduledOn: date("scheduled_on").notNull(),
  name: text("name").notNull(),
  focus: jsonb("focus").$type<Muscle[]>().notNull().default([]),
  warmup: jsonb("warmup").$type<string[]>().notNull().default([]),
  estimatedMinutes: integer("estimated_minutes").notNull().default(60),
  status: text("status").$type<"planned" | "in_progress" | "completed" | "skipped">().notNull().default("planned"),
  startedAt: timestamp("started_at"),
  completedAt: timestamp("completed_at"),
  readinessScore: integer("readiness_score"),
  intensityScalar: real("intensity_scalar").notNull().default(1),
  sessionRpe: real("session_rpe"),
  soreness: integer("soreness"),
  fatigue: integer("fatigue"),
  mood: integer("mood"),
  notes: text("notes"),
  source: text("source").notNull().default("programme"),
}, (t) => [index("training_session_user_date_idx").on(t.userId, t.scheduledOn), index("training_session_week_idx").on(t.weekId)]);

export const exerciseInstance = pgTable("exercise_instance", {
  id: uuid("id").primaryKey().defaultRandom(),
  sessionId: uuid("session_id").notNull().references(() => trainingSession.id, { onDelete: "cascade" }),
  exerciseId: text("exercise_id").notNull().references(() => exercise.id),
  originalExerciseId: text("original_exercise_id"),
  order: integer("order").notNull(),
  role: text("role").notNull(),
  plannedSets: jsonb("planned_sets").$type<PlannedSet[]>().notNull(),
  loggedSets: jsonb("logged_sets").$type<LoggedSet[]>().notNull().default([]),
  rationale: text("rationale").notNull().default(""),
  notes: text("notes"),
  supersetGroup: text("superset_group"),
  swappedReason: text("swapped_reason"),
  completedAt: timestamp("completed_at"),
}, (t) => [index("exercise_instance_session_idx").on(t.sessionId), index("exercise_instance_exercise_idx").on(t.exerciseId)]);

export const substitution = pgTable("substitution", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
  fromExerciseId: text("from_exercise_id").notNull(),
  toExerciseId: text("to_exercise_id").notNull(),
  reason: text("reason"),
  permanent: boolean("permanent").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (t) => [index("substitution_user_idx").on(t.userId)]);

export const personalRecord = pgTable("personal_record", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
  exerciseId: text("exercise_id").notNull(),
  kind: text("kind").$type<"e1rm" | "weight" | "reps" | "volume">().notNull(),
  value: real("value").notNull(),
  reps: integer("reps"),
  weightKg: real("weight_kg"),
  achievedAt: timestamp("achieved_at").notNull().defaultNow(),
  sessionId: uuid("session_id"),
}, (t) => [index("personal_record_user_ex_idx").on(t.userId, t.exerciseId)]);
