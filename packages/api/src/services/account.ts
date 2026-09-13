import { eq } from "drizzle-orm";
import { db, user, profile, bodyMeasurement, programme, trainingSession, exerciseInstance, personalRecord, nutritionPlan, mealPlan, foodLog, connectedProvider, healthSample, auditLog, decryptJson } from "@kettleworth/db";
import { disconnectProvider } from "./integrations";
import { getProfile } from "./profile";

/** GDPR export: everything we hold about the user, decrypted, as one JSON document. */
export async function exportAccount(userId: string) {
  const [u] = await db().select({ id: user.id, name: user.name, email: user.email, createdAt: user.createdAt }).from(user).where(eq(user.id, userId));
  const prof = await getProfile(userId);
  const [measurements, programmes, sessions, prs, nutrition, meals, food, providers, samples] = await Promise.all([
    db().select().from(bodyMeasurement).where(eq(bodyMeasurement.userId, userId)),
    db().select().from(programme).where(eq(programme.userId, userId)),
    db().select().from(trainingSession).where(eq(trainingSession.userId, userId)),
    db().select().from(personalRecord).where(eq(personalRecord.userId, userId)),
    db().select().from(nutritionPlan).where(eq(nutritionPlan.userId, userId)),
    db().select().from(mealPlan).where(eq(mealPlan.userId, userId)),
    db().select().from(foodLog).where(eq(foodLog.userId, userId)),
    db().select({ provider: connectedProvider.provider, enabledMetrics: connectedProvider.enabledMetrics, consentGivenAt: connectedProvider.consentGivenAt, lastSyncAt: connectedProvider.lastSyncAt }).from(connectedProvider).where(eq(connectedProvider.userId, userId)),
    db().select().from(healthSample).where(eq(healthSample.userId, userId)),
  ]);
  const sessionIds = sessions.map((s) => s.id);
  const instances = sessionIds.length ? await db().select().from(exerciseInstance).where(eq(exerciseInstance.sessionId, sessionIds[0]!)).then(async () => { const all = []; for (const id of sessionIds) all.push(...(await db().select().from(exerciseInstance).where(eq(exerciseInstance.sessionId, id)))); return all; }) : [];
  await db().insert(auditLog).values({ userId, action: "account.exported" });
  return { exportedAt: new Date().toISOString(), user: u, profile: prof ? { ...prof.profile, aiSummary: prof.aiSummary, baseline: prof.baseline } : null, measurements, programmes, sessions, exerciseInstances: instances, personalRecords: prs, nutritionPlans: nutrition, mealPlans: meals, foodLog: food, connectedProviders: providers, healthSamples: samples.map((s) => ({ ...s, raw: decryptJson(s.raw) })) };
}

/** Hard delete: revoke every provider, then delete the user row (everything cascades). */
export async function deleteAccount(userId: string) {
  const providers = await db().select({ provider: connectedProvider.provider }).from(connectedProvider).where(eq(connectedProvider.userId, userId));
  for (const p of providers) await disconnectProvider(userId, p.provider).catch(() => {});
  await db().insert(auditLog).values({ userId: null, action: "account.deleted", meta: { userHash: userId.slice(0, 6) } });
  await db().delete(user).where(eq(user.id, userId));
}
