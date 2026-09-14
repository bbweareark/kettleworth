import { pgTable, text, timestamp, jsonb, uuid, integer, index, date, uniqueIndex } from "drizzle-orm/pg-core";
import { user } from "./auth";

export const aiLog = pgTable("ai_log", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: text("user_id"),
  task: text("task").notNull(),
  model: text("model").notNull(),
  system: text("system"),
  input: jsonb("input").notNull(),
  output: jsonb("output"),
  valid: integer("valid").notNull().default(1),
  validationErrors: jsonb("validation_errors").$type<string[]>(),
  inputTokens: integer("input_tokens"),
  outputTokens: integer("output_tokens"),
  latencyMs: integer("latency_ms"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (t) => [index("ai_log_task_idx").on(t.task, t.createdAt)]);

export const auditLog = pgTable("audit_log", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: text("user_id"),
  action: text("action").notNull(),
  target: text("target"),
  meta: jsonb("meta"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const coachLetter = pgTable("coach_letter", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
  weekStartsOn: date("week_starts_on").notNull(),
  headline: text("headline").notNull(),
  body: text("body").notNull(),
  stats: jsonb("stats").$type<Record<string, unknown>>().notNull(),
  adaptations: jsonb("adaptations").$type<{ kind: string; reason: string; exerciseId: string | null; magnitude: number | null }[]>().notNull().default([]),
  generatedBy: text("generated_by").notNull(),
  emailedAt: timestamp("emailed_at"),
  readAt: timestamp("read_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (t) => [uniqueIndex("coach_letter_user_week_idx").on(t.userId, t.weekStartsOn)]);

export const coachMessage = pgTable("coach_message", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
  role: text("role").$type<"user" | "coach">().notNull(),
  content: text("content").notNull(),
  actions: jsonb("actions").$type<{ type: string; summary: string; applied: boolean }[]>().notNull().default([]),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (t) => [index("coach_message_user_idx").on(t.userId, t.createdAt)]);
