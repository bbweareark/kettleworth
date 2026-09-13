import { eq } from "drizzle-orm";
import { db, profile, estimatedMax, bodyMeasurement, encryptJson, decryptJson, auditLog } from "@kettleworth/db";
import { TrainingProfile, type BaselineMetrics } from "@kettleworth/types";
import { computeBaseline } from "@kettleworth/core";
import { summariseProfile } from "../ai/tasks";

type Sensitive = Pick<TrainingProfile, "injuries" | "medicalFlags" | "notes">;
const SENSITIVE_KEYS: (keyof Sensitive)[] = ["injuries", "medicalFlags", "notes"];

export type ProfileRecord = { userId: string; profile: TrainingProfile; baseline: BaselineMetrics | null; aiSummary: string | null; onboardingStep: number; onboardingCompletedAt: Date | null; intakeTranscript: { role: "coach" | "user"; text: string; at: string }[] };

function split(p: TrainingProfile): { pub: TrainingProfile; sens: Sensitive } {
  const pub = { ...p, injuries: [], medicalFlags: [], notes: undefined } as TrainingProfile;
  return { pub, sens: { injuries: p.injuries, medicalFlags: p.medicalFlags, notes: p.notes } };
}
function merge(pub: TrainingProfile, sens: Sensitive | null): TrainingProfile {
  return TrainingProfile.parse({ ...pub, ...(sens ?? {}) });
}

export async function getProfile(userId: string): Promise<ProfileRecord | null> {
  const [row] = await db().select().from(profile).where(eq(profile.userId, userId)).limit(1);
  if (!row) return null;
  return { userId, profile: merge(row.data, decryptJson<Sensitive>(row.sensitive)), baseline: row.baseline ?? null, aiSummary: row.aiSummary, onboardingStep: row.onboardingStep, onboardingCompletedAt: row.onboardingCompletedAt, intakeTranscript: row.intakeTranscript };
}

export async function upsertProfile(userId: string, patch: Partial<TrainingProfile>, opts: { step?: number; transcript?: ProfileRecord["intakeTranscript"] } = {}): Promise<ProfileRecord> {
  const existing = await getProfile(userId);
  const next = TrainingProfile.parse({ ...(existing?.profile ?? {}), ...patch });
  if (patch.goals?.length && !patch.primaryGoal) next.primaryGoal = patch.goals.includes(next.primaryGoal) ? next.primaryGoal : patch.goals[0]!;
  if (!next.goals.length) next.goals = [next.primaryGoal];
  const baseline = computeBaseline(next);
  const { pub, sens } = split(next);
  const values = { data: pub, sensitive: encryptJson(sens), baseline, onboardingStep: opts.step ?? existing?.onboardingStep ?? 0, intakeTranscript: opts.transcript ?? existing?.intakeTranscript ?? [], updatedAt: new Date() };
  await db().insert(profile).values({ userId, ...values }).onConflictDoUpdate({ target: profile.userId, set: values });
  return (await getProfile(userId))!;
}

export async function completeOnboarding(userId: string): Promise<ProfileRecord> {
  const rec = await getProfile(userId);
  if (!rec) throw new Error("No profile");
  const summary = await summariseProfile(userId, rec.profile, rec.baseline ?? computeBaseline(rec.profile));
  await db().update(profile).set({ aiSummary: summary.summary, onboardingCompletedAt: new Date(), updatedAt: new Date() }).where(eq(profile.userId, userId));
  for (const m of rec.baseline?.estimatedMaxes ?? []) await db().insert(estimatedMax).values({ userId, exerciseId: m.exerciseId, e1rmKg: m.e1rmKg, source: "intake" });
  if (rec.profile.weightKg) await db().insert(bodyMeasurement).values({ userId, measuredOn: new Date().toISOString().slice(0, 10), weightKg: rec.profile.weightKg, bodyFatPct: rec.profile.bodyFatPct ?? null, source: "intake" });
  await db().insert(auditLog).values({ userId, action: "onboarding.completed" });
  return (await getProfile(userId))!;
}

export async function updateAiSummary(userId: string, summary: string) {
  await db().update(profile).set({ aiSummary: summary, updatedAt: new Date() }).where(eq(profile.userId, userId));
}
