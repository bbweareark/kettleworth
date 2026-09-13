import { and, desc, eq } from "drizzle-orm";
import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { db, progressPhoto, auditLog, type BodyAnalysis } from "@kettleworth/db";
import { AI_MODEL, aiAvailable } from "../ai/client";
import { analyseBodyPhotos } from "../ai/tasks";
import { getProfile, upsertProfile } from "./profile";

/** Local disk in dev (STORAGE_DIR, default ./.uploads at the repo root); swap for S3/R2 by replacing these three functions. */
const root = () => process.env.STORAGE_DIR ?? path.resolve(process.cwd(), "../../.uploads");
const MAX_BYTES = 8 * 1024 * 1024;
const TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

export async function savePhoto(userId: string, file: { bytes: Buffer; contentType: string; pose: string; takenOn?: string }) {
  if (!TYPES.has(file.contentType)) throw new Error("Use a JPEG, PNG or WebP image");
  if (file.bytes.length > MAX_BYTES) throw new Error("Image is over 8 MB");
  const id = randomUUID();
  const ext = file.contentType === "image/png" ? "png" : file.contentType === "image/webp" ? "webp" : "jpg";
  const key = `${userId}/${id}.${ext}`;
  await mkdir(path.join(root(), userId), { recursive: true });
  await writeFile(path.join(root(), key), file.bytes);
  const [row] = await db().insert(progressPhoto).values({ id, userId, takenOn: file.takenOn ?? new Date().toISOString().slice(0, 10), storageKey: key, contentType: file.contentType, bytes: file.bytes.length, pose: file.pose }).returning();
  return row!;
}
export async function listPhotos(userId: string) {
  return db().select().from(progressPhoto).where(eq(progressPhoto.userId, userId)).orderBy(desc(progressPhoto.takenOn), desc(progressPhoto.createdAt));
}
export async function readPhoto(userId: string, id: string) {
  const [row] = await db().select().from(progressPhoto).where(and(eq(progressPhoto.id, id), eq(progressPhoto.userId, userId))).limit(1);
  if (!row) return null;
  return { row, bytes: await readFile(path.join(root(), row.storageKey)) };
}
export async function deletePhoto(userId: string, id: string) {
  const [row] = await db().select().from(progressPhoto).where(and(eq(progressPhoto.id, id), eq(progressPhoto.userId, userId))).limit(1);
  if (!row) return;
  await rm(path.join(root(), row.storageKey), { force: true });
  await db().delete(progressPhoto).where(eq(progressPhoto.id, id));
}
export async function deleteAllPhotos(userId: string) {
  await rm(path.join(root(), userId), { recursive: true, force: true });
}

/** Analyse up to three photos taken on the same day (front/side/back). Stores the result on each photo. */
export async function analysePhotos(userId: string, ids: string[]): Promise<BodyAnalysis> {
  if (!aiAvailable()) throw new Error("The AI coach is not configured on this server, so photos can be stored but not analysed yet.");
  const rec = await getProfile(userId);
  if (!rec) throw new Error("No profile");
  const photos = [];
  for (const id of ids.slice(0, 3)) { const p = await readPhoto(userId, id); if (p) photos.push(p); }
  if (!photos.length) throw new Error("No photos found");
  const read = await analyseBodyPhotos(userId, photos.map((p) => ({ data: p.bytes.toString("base64"), mediaType: p.row.contentType as "image/jpeg", pose: p.row.pose })), rec.profile);
  if (!read) throw new Error("The coach couldn't read these photos. Try clearer lighting, a plain background and fitted clothing.");
  const analysis: BodyAnalysis = { ...read, analysedAt: new Date().toISOString(), model: AI_MODEL };
  for (const p of photos) await db().update(progressPhoto).set({ analysis }).where(eq(progressPhoto.id, p.row.id));
  await db().insert(auditLog).values({ userId, action: "photo.analysed", meta: { count: photos.length } });
  return analysis;
}

/** User-confirmed application of an analysis: priority muscles into the profile, body-fat midpoint as the estimate. */
export async function applyAnalysis(userId: string, photoId: string, opts: { priorityMuscles: boolean; bodyFat: boolean }) {
  const [row] = await db().select().from(progressPhoto).where(and(eq(progressPhoto.id, photoId), eq(progressPhoto.userId, userId))).limit(1);
  if (!row?.analysis) throw new Error("No analysis to apply");
  const patch: Record<string, unknown> = {};
  if (opts.priorityMuscles) patch.priorityMuscles = row.analysis.focusAreas.map((f) => f.muscle);
  if (opts.bodyFat && row.analysis.bodyFatRangePct) patch.bodyFatPct = Math.round((row.analysis.bodyFatRangePct[0] + row.analysis.bodyFatRangePct[1]) / 2);
  return upsertProfile(userId, patch);
}

import { physiqueTimeline, growthPoints, trend } from "@kettleworth/core";
import { bodyMeasurement, trainingSession, personalRecord, exerciseInstance, healthSample } from "@kettleworth/db";
import { asc, sql } from "drizzle-orm";
import { weeklyStreak } from "@kettleworth/core";

/** Everything the Progress page needs to show physique change and Growth. */
export async function physiqueProgress(userId: string) {
  const photos = await listPhotos(userId);
  const measurements = await db().select().from(bodyMeasurement).where(eq(bodyMeasurement.userId, userId)).orderBy(asc(bodyMeasurement.measuredOn));
  const entries = [
    ...measurements.map((m) => ({ date: m.measuredOn, weightKg: m.weightKg, waistCm: m.waistCm, source: "measurement" as const })),
    ...photos.filter((p) => p.analysis?.bodyFatRangePct).map((p) => ({ date: p.takenOn, bfLow: p.analysis!.bodyFatRangePct![0], bfHigh: p.analysis!.bodyFatRangePct![1], source: "photo" as const })),
  ];
  const timeline = physiqueTimeline(entries);
  const sessions = await db().select({ d: trainingSession.scheduledOn }).from(trainingSession).where(and(eq(trainingSession.userId, userId), eq(trainingSession.status, "completed")));
  const [prs] = await db().select({ n: sql<number>`count(*)::int` }).from(personalRecord).where(eq(personalRecord.userId, userId));
  const [sets] = await db().select({ n: sql<number>`coalesce(sum(jsonb_array_length(${exerciseInstance.loggedSets})),0)::int` }).from(exerciseInstance).innerJoin(trainingSession, eq(exerciseInstance.sessionId, trainingSession.id)).where(eq(trainingSession.userId, userId));
  const [acts] = await db().select({ n: sql<number>`count(*)::int` }).from(healthSample).where(and(eq(healthSample.userId, userId), eq(healthSample.metric, "workout"), eq(healthSample.provider, "manual")));
  const photoSets = new Set(photos.filter((p) => p.analysis).map((p) => p.takenOn)).size;
  const growth = growthPoints({ sessionsCompleted: sessions.length, prs: prs?.n ?? 0, weighIns: measurements.filter((m) => m.weightKg != null).length, photoSets, streakWeeks: weeklyStreak(sessions.map((s) => s.d)), setsLogged: sets?.n ?? 0, activitiesLogged: acts?.n ?? 0 });
  const byDate = photos.reduce<Record<string, typeof photos>>((a, p) => { (a[p.takenOn] ??= []).push(p); return a; }, {});
  const dates = Object.keys(byDate).sort();
  const compare = dates.length >= 2 ? { before: byDate[dates[0]!]!.find((p) => p.pose === "front") ?? byDate[dates[0]!]![0]!, after: byDate[dates[dates.length - 1]!]!.find((p) => p.pose === "front") ?? byDate[dates[dates.length - 1]!]![0]! } : null;
  return {
    timeline,
    growth,
    trends: {
      bodyFat: trend(timeline.filter((t) => t.bodyFatLow != null).map((t) => ({ date: t.date, value: t.bodyFatPct })), "%", true),
      leanMass: trend(timeline.filter((t) => t.leanMassKg != null).map((t) => ({ date: t.date, value: t.leanMassKg })), " kg"),
      weight: trend(timeline.filter((t) => t.weightKg != null).map((t) => ({ date: t.date, value: t.weightKg })), " kg"),
      waist: trend(measurements.filter((m) => m.waistCm != null).map((m) => ({ date: m.measuredOn, value: m.waistCm })), " cm", true),
    },
    compare: compare ? { before: { id: compare.before.id, date: compare.before.takenOn }, after: { id: compare.after.id, date: compare.after.takenOn } } : null,
    photoDates: dates,
  };
}
