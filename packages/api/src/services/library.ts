import { and, desc, eq, ilike, inArray, sql } from "drizzle-orm";
import { db, exercise, exerciseVideo } from "@kettleworth/db";
import type { ExerciseSummary } from "@kettleworth/types";

let cache: { at: number; rows: ExerciseSummary[] } | null = null;
const TTL = 5 * 60 * 1000;

export function toSummary(e: typeof exercise.$inferSelect, hasVideo = false): ExerciseSummary {
  return { id: e.id, slug: e.slug, name: e.name, aliases: e.aliases, primaryMuscles: e.primaryMuscles, secondaryMuscles: e.secondaryMuscles, equipment: e.equipment, pattern: e.pattern, mechanics: e.mechanics, difficulty: e.difficulty, category: e.category, contraindicatedRegions: e.contraindicatedRegions, unilateral: e.unilateral, imageUrls: e.imageUrls, hasVideo, popularity: e.popularity };
}

/** Whole library as summaries for the programme engine. Cached in-process. */
export async function libraryForEngine(): Promise<ExerciseSummary[]> {
  if (cache && Date.now() - cache.at < TTL) return cache.rows;
  const rows = await db().select().from(exercise);
  const videos = await db().select({ exerciseId: exerciseVideo.exerciseId }).from(exerciseVideo).where(eq(exerciseVideo.isPlaceholder, false));
  const withVideo = new Set(videos.map((v) => v.exerciseId));
  cache = { at: Date.now(), rows: rows.map((r) => toSummary(r, withVideo.has(r.id))) };
  return cache.rows;
}

export type SearchParams = { q?: string; muscle?: string; equipment?: string; pattern?: string; difficulty?: string; category?: string; limit?: number; offset?: number };
export async function searchExercises(p: SearchParams) {
  const conds = [];
  if (p.q) conds.push(ilike(exercise.searchText, `%${p.q.toLowerCase()}%`));
  if (p.muscle) conds.push(sql`${exercise.primaryMuscles} @> ${JSON.stringify([p.muscle])}::jsonb`);
  if (p.equipment) conds.push(sql`${exercise.equipment} @> ${JSON.stringify([p.equipment])}::jsonb`);
  if (p.pattern) conds.push(eq(exercise.pattern, p.pattern as typeof exercise.$inferSelect.pattern));
  if (p.difficulty) conds.push(eq(exercise.difficulty, p.difficulty as typeof exercise.$inferSelect.difficulty));
  if (p.category) conds.push(eq(exercise.category, p.category as typeof exercise.$inferSelect.category));
  const limit = Math.min(p.limit ?? 40, 100);
  const where = conds.length ? and(...conds) : undefined;
  const [rows, counted] = await Promise.all([
    db().select().from(exercise).where(where).orderBy(desc(exercise.popularity), exercise.name).limit(limit).offset(p.offset ?? 0),
    db().select({ count: sql<number>`count(*)::int` }).from(exercise).where(where),
  ]);
  return { items: rows.map((r) => toSummary(r)), total: counted[0]?.count ?? 0, limit, offset: p.offset ?? 0 };
}

export async function getExercise(slug: string) {
  const [row] = await db().select().from(exercise).where(eq(exercise.slug, slug)).limit(1);
  if (!row) return null;
  const videos = await db().select().from(exerciseVideo).where(eq(exerciseVideo.exerciseId, row.id));
  return { ...row, videos };
}
export async function getExercisesByIds(ids: string[]) {
  if (!ids.length) return [];
  return db().select().from(exercise).where(inArray(exercise.id, ids));
}
