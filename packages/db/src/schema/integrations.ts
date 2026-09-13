import { pgTable, text, timestamp, jsonb, real, uuid, integer, boolean, index, uniqueIndex } from "drizzle-orm/pg-core";
import { user } from "./auth";
import type { HealthProvider, HealthMetric } from "@kettleworth/types";

export const connectedProvider = pgTable("connected_provider", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
  provider: text("provider").$type<HealthProvider>().notNull(),
  providerUserId: text("provider_user_id"),
  /** Encrypted JSON: { accessToken, refreshToken, expiresAt, scope } */
  credentials: text("credentials"),
  status: text("status").$type<"connected" | "expired" | "revoked" | "error">().notNull().default("connected"),
  enabledMetrics: jsonb("enabled_metrics").$type<HealthMetric[]>().notNull().default([]),
  consentGivenAt: timestamp("consent_given_at").notNull().defaultNow(),
  lastSyncAt: timestamp("last_sync_at"),
  lastError: text("last_error"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (t) => [uniqueIndex("connected_provider_user_provider_idx").on(t.userId, t.provider)]);

export const healthSample = pgTable("health_sample", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
  provider: text("provider").$type<HealthProvider>().notNull(),
  metric: text("metric").$type<HealthMetric>().notNull(),
  startAt: timestamp("start_at", { withTimezone: true }).notNull(),
  endAt: timestamp("end_at", { withTimezone: true }),
  value: real("value"),
  unit: text("unit").notNull(),
  payload: jsonb("payload"),
  /** Encrypted raw provider payload, kept for conflict resolution / re-normalisation. */
  raw: text("raw"),
  confidence: real("confidence").notNull().default(1),
  providerRecordId: text("provider_record_id"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (t) => [
  index("health_sample_user_metric_time_idx").on(t.userId, t.metric, t.startAt),
  uniqueIndex("health_sample_dedupe_idx").on(t.userId, t.provider, t.metric, t.providerRecordId),
]);

export const providerPriority = pgTable("provider_priority", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
  metric: text("metric").$type<HealthMetric>().notNull(),
  order: jsonb("order").$type<HealthProvider[]>().notNull(),
}, (t) => [uniqueIndex("provider_priority_user_metric_idx").on(t.userId, t.metric)]);

export const syncJob = pgTable("sync_job", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
  provider: text("provider").$type<HealthProvider>().notNull(),
  status: text("status").$type<"queued" | "running" | "done" | "failed">().notNull().default("queued"),
  samplesWritten: integer("samples_written").notNull().default(0),
  error: text("error"),
  startedAt: timestamp("started_at"),
  finishedAt: timestamp("finished_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});
export const _unusedBool = boolean;
