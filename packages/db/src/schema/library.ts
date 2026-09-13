import { pgTable, text, timestamp, jsonb, boolean, index, integer } from "drizzle-orm/pg-core";
import type { Muscle, MovementPattern, Equipment, BodyRegion } from "@kettleworth/types";

export const exercise = pgTable("exercise", {
  id: text("id").primaryKey(), // slug
  slug: text("slug").notNull().unique(),
  name: text("name").notNull(),
  aliases: jsonb("aliases").$type<string[]>().notNull().default([]),
  primaryMuscles: jsonb("primary_muscles").$type<Muscle[]>().notNull().default([]),
  secondaryMuscles: jsonb("secondary_muscles").$type<Muscle[]>().notNull().default([]),
  equipment: jsonb("equipment").$type<Equipment[]>().notNull().default([]),
  pattern: text("pattern").$type<MovementPattern>().notNull(),
  mechanics: text("mechanics").$type<"compound" | "isolation">().notNull(),
  difficulty: text("difficulty").$type<"beginner" | "intermediate" | "advanced">().notNull(),
  category: text("category").$type<"strength" | "cardio" | "mobility" | "plyometric" | "warmup" | "stretch">().notNull(),
  contraindicatedRegions: jsonb("contraindicated_regions").$type<BodyRegion[]>().notNull().default([]),
  unilateral: boolean("unilateral").notNull().default(false),
  instructions: jsonb("instructions").$type<string[]>().notNull().default([]),
  cues: jsonb("cues").$type<string[]>().notNull().default([]),
  commonMistakes: jsonb("common_mistakes").$type<string[]>().notNull().default([]),
  safetyNotes: jsonb("safety_notes").$type<string[]>().notNull().default([]),
  variations: jsonb("variations").$type<string[]>().notNull().default([]),
  imageUrls: jsonb("image_urls").$type<string[]>().notNull().default([]),
  source: text("source").notNull().default("kettleworth"),
  sourceLicense: text("source_license"),
  searchText: text("search_text").notNull().default(""),
  popularity: integer("popularity").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (t) => [index("exercise_pattern_idx").on(t.pattern), index("exercise_category_idx").on(t.category)]);

export const exerciseVideo = pgTable("exercise_video", {
  id: text("id").primaryKey(),
  exerciseId: text("exercise_id").notNull().references(() => exercise.id, { onDelete: "cascade" }),
  provider: text("provider").$type<"mux" | "cloudflare" | "youtube" | "placeholder">().notNull(),
  playbackId: text("playback_id"),
  assetId: text("asset_id"),
  status: text("status").$type<"ready" | "processing" | "errored" | "placeholder">().notNull(),
  angle: text("angle").notNull().default("front"),
  durationSeconds: integer("duration_seconds"),
  thumbnailUrl: text("thumbnail_url"),
  previewGifUrl: text("preview_gif_url"),
  license: text("license"),
  isPlaceholder: boolean("is_placeholder").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (t) => [index("exercise_video_exercise_idx").on(t.exerciseId)]);
