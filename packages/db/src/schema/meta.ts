import { pgTable, text, timestamp, jsonb, uuid, integer, index } from "drizzle-orm/pg-core";

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
