import { and, desc, eq, gte, inArray } from "drizzle-orm";
import { db, connectedProvider, healthSample, providerPriority, syncJob, verification, encryptJson, decryptJson, encryptField, auditLog } from "@kettleworth/db";
import { getProvider, listProviders, pkcePair, randomState, isExpired, resolveSamples, usesPkce, type Credentials } from "@kettleworth/integrations";
import { computeReadiness } from "@kettleworth/core";
import type { HealthMetric, HealthProvider, HealthSample, Readiness } from "@kettleworth/types";

export function providerCatalogue() {
  return listProviders();
}

export async function connectedProviders(userId: string) {
  return db().select({ id: connectedProvider.id, provider: connectedProvider.provider, status: connectedProvider.status, enabledMetrics: connectedProvider.enabledMetrics, lastSyncAt: connectedProvider.lastSyncAt, lastError: connectedProvider.lastError, consentGivenAt: connectedProvider.consentGivenAt }).from(connectedProvider).where(eq(connectedProvider.userId, userId));
}

/** Step 1 of OAuth: build the authorize URL and persist state (+PKCE verifier) for 10 minutes. */
export async function beginConnect(userId: string, providerId: string, redirectUri: string, metrics: HealthMetric[]): Promise<string> {
  const p = getProvider(providerId);
  if (!p) throw new Error("Unknown provider");
  if (!p.configured()) throw new Error(`${p.info.displayName} is not configured on this server yet`);
  const state = randomState();
  const pkce = usesPkce(p.info.id) ? pkcePair() : null;
  await db().insert(verification).values({ id: `oauth_${state}`, identifier: `oauth:${providerId}`, value: JSON.stringify({ userId, verifier: pkce?.verifier ?? null, metrics }), expiresAt: new Date(Date.now() + 10 * 60 * 1000) });
  return p.authUrl({ redirectUri, state, codeChallenge: pkce?.challenge });
}

/** Step 2: exchange the code, store encrypted credentials with explicit consent record, kick off the first sync. */
export async function completeConnect(providerId: string, code: string, state: string, redirectUri: string): Promise<{ userId: string }> {
  const p = getProvider(providerId);
  if (!p) throw new Error("Unknown provider");
  const [v] = await db().select().from(verification).where(eq(verification.id, `oauth_${state}`)).limit(1);
  if (!v || v.expiresAt < new Date()) throw new Error("Connection request expired. Please try again.");
  await db().delete(verification).where(eq(verification.id, v.id));
  const { userId, verifier, metrics } = JSON.parse(v.value) as { userId: string; verifier: string | null; metrics: HealthMetric[] };
  const creds = await p.exchangeCode({ code, redirectUri, codeVerifier: verifier ?? undefined });
  const enabled = metrics.length ? metrics.filter((m) => p.info.metrics.includes(m)) : p.info.metrics;
  await db().insert(connectedProvider).values({ userId, provider: p.info.id, providerUserId: creds.providerUserId ?? null, credentials: encryptJson(creds), status: "connected", enabledMetrics: enabled, consentGivenAt: new Date() }).onConflictDoUpdate({ target: [connectedProvider.userId, connectedProvider.provider], set: { credentials: encryptJson(creds), status: "connected", enabledMetrics: enabled, providerUserId: creds.providerUserId ?? null, consentGivenAt: new Date(), lastError: null } });
  await db().insert(auditLog).values({ userId, action: "integration.connected", target: p.info.id, meta: { metrics: enabled } });
  syncProvider(userId, p.info.id).catch((e) => console.warn("initial sync failed", e));
  return { userId };
}

export async function setEnabledMetrics(userId: string, providerId: HealthProvider, metrics: HealthMetric[]) {
  await db().update(connectedProvider).set({ enabledMetrics: metrics }).where(and(eq(connectedProvider.userId, userId), eq(connectedProvider.provider, providerId)));
  // Data for toggled-off metrics is deleted immediately (data minimisation).
  const p = getProvider(providerId);
  const off = (p?.info.metrics ?? []).filter((m) => !metrics.includes(m));
  if (off.length) await db().delete(healthSample).where(and(eq(healthSample.userId, userId), eq(healthSample.provider, providerId), inArray(healthSample.metric, off)));
}

/** One-tap disconnect: revoke upstream, delete credentials and every synced sample. */
export async function disconnectProvider(userId: string, providerId: HealthProvider) {
  const [row] = await db().select().from(connectedProvider).where(and(eq(connectedProvider.userId, userId), eq(connectedProvider.provider, providerId))).limit(1);
  if (!row) return;
  const p = getProvider(providerId);
  const creds = decryptJson<Credentials>(row.credentials);
  if (p?.revoke && creds) await p.revoke(creds).catch(() => {});
  await db().delete(healthSample).where(and(eq(healthSample.userId, userId), eq(healthSample.provider, providerId)));
  await db().delete(connectedProvider).where(eq(connectedProvider.id, row.id));
  await db().insert(auditLog).values({ userId, action: "integration.disconnected", target: providerId });
}

export async function syncProvider(userId: string, providerId: HealthProvider): Promise<{ written: number }> {
  const p = getProvider(providerId);
  const [row] = await db().select().from(connectedProvider).where(and(eq(connectedProvider.userId, userId), eq(connectedProvider.provider, providerId))).limit(1);
  if (!p || !row) throw new Error("Not connected");
  const [job] = await db().insert(syncJob).values({ userId, provider: providerId, status: "running", startedAt: new Date() }).returning();
  try {
    let creds = decryptJson<Credentials>(row.credentials);
    if (!creds) throw new Error("Missing credentials");
    if (isExpired(creds)) { creds = { ...creds, ...(await p.refresh(creds)) }; await db().update(connectedProvider).set({ credentials: encryptJson(creds) }).where(eq(connectedProvider.id, row.id)); }
    const since = row.lastSyncAt ? new Date(row.lastSyncAt.getTime() - 2 * 86400000) : new Date(Date.now() - 30 * 86400000);
    const { samples, creds: newCreds } = await p.fetchSamples(creds, since, row.enabledMetrics);
    if (newCreds !== creds) await db().update(connectedProvider).set({ credentials: encryptJson(newCreds) }).where(eq(connectedProvider.id, row.id));
    let written = 0;
    for (let i = 0; i < samples.length; i += 200) {
      const chunk = samples.slice(i, i + 200).map((s) => ({ userId, provider: s.provider, metric: s.metric, startAt: new Date(s.startAt), endAt: s.endAt ? new Date(s.endAt) : null, value: s.value, unit: s.unit, payload: s.payload, raw: encryptField(JSON.stringify(s.raw)), confidence: s.confidence, providerRecordId: s.providerRecordId }));
      const res = await db().insert(healthSample).values(chunk).onConflictDoNothing().returning({ id: healthSample.id });
      written += res.length;
    }
    await db().update(connectedProvider).set({ lastSyncAt: new Date(), status: "connected", lastError: null }).where(eq(connectedProvider.id, row.id));
    await db().update(syncJob).set({ status: "done", samplesWritten: written, finishedAt: new Date() }).where(eq(syncJob.id, job!.id));
    return { written };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    await db().update(connectedProvider).set({ status: /401|403|invalid_grant/.test(msg) ? "expired" : "error", lastError: msg.slice(0, 500) }).where(eq(connectedProvider.id, row.id));
    await db().update(syncJob).set({ status: "failed", error: msg.slice(0, 500), finishedAt: new Date() }).where(eq(syncJob.id, job!.id));
    throw e;
  }
}

export async function recentSamples(userId: string, days = 8): Promise<HealthSample[]> {
  const rows = await db().select().from(healthSample).where(and(eq(healthSample.userId, userId), gte(healthSample.startAt, new Date(Date.now() - days * 86400000)))).orderBy(desc(healthSample.startAt));
  const prio = await db().select().from(providerPriority).where(eq(providerPriority.userId, userId));
  const priority = Object.fromEntries(prio.map((p) => [p.metric, p.order])) as Partial<Record<HealthMetric, HealthProvider[]>>;
  return resolveSamples(rows.map((r) => ({ provider: r.provider, metric: r.metric, startAt: r.startAt.toISOString(), endAt: r.endAt?.toISOString() ?? null, value: r.value, unit: r.unit, payload: r.payload as HealthSample["payload"], confidence: r.confidence, providerRecordId: r.providerRecordId })), priority);
}

export async function getReadiness(userId: string): Promise<Readiness> {
  return computeReadiness(await recentSamples(userId));
}

export async function setPriority(userId: string, metric: HealthMetric, order: HealthProvider[]) {
  await db().insert(providerPriority).values({ userId, metric, order }).onConflictDoUpdate({ target: [providerPriority.userId, providerPriority.metric], set: { order } });
}

/** Manual entries (sleep, weight) use the same pipeline so readiness works before any wearable is connected. */
export async function addManualSample(userId: string, metric: HealthMetric, value: number, unit: string, at = new Date()) {
  await db().insert(healthSample).values({ userId, provider: "manual", metric, startAt: at, endAt: null, value, unit, payload: null, raw: null, confidence: 0.9, providerRecordId: `manual:${metric}:${at.toISOString().slice(0, 10)}` }).onConflictDoUpdate({ target: [healthSample.userId, healthSample.provider, healthSample.metric, healthSample.providerRecordId], set: { value, startAt: at } });
}

/** MET-based estimate for manually logged activity, so it refines calorie targets like wearable data does. */
const MET: Record<string, number> = { running: 9.8, cycling: 7.5, swimming: 8, walking: 3.5, hiking: 6, rowing: 7, hiit: 8.5, class: 6.5, football: 8, basketball: 7.5, tennis: 7.3, climbing: 7.5, yoga: 3, martial_arts: 9, dance: 5.5, other: 6 };
export type ManualActivity = { type: string; durationMin: number; intensity: number; distanceKm?: number | null; at?: string; note?: string | null };
export async function logManualActivity(userId: string, a: ManualActivity, weightKg = 75) {
  const at = a.at ? new Date(a.at) : new Date();
  const met = (MET[a.type] ?? MET.other!) * (0.7 + a.intensity * 0.12);
  const kcal = Math.round((met * 3.5 * weightKg) / 200 * a.durationMin);
  const id = `manual:workout:${at.toISOString()}`;
  await db().insert(healthSample).values({ userId, provider: "manual", metric: "workout", startAt: at, endAt: new Date(at.getTime() + a.durationMin * 60000), value: a.durationMin, unit: "min", payload: { type: a.type, durationMin: a.durationMin, distanceKm: a.distanceKm ?? null, avgHr: null, maxHr: null, calories: kcal, hrZonesMin: null, intensity: a.intensity, note: a.note ?? null }, raw: null, confidence: 0.8, providerRecordId: id });
  await db().insert(healthSample).values({ userId, provider: "manual", metric: "active_calories", startAt: at, endAt: null, value: kcal, unit: "kcal", payload: null, raw: null, confidence: 0.6, providerRecordId: `${id}:kcal` }).onConflictDoNothing();
  return { kcal };
}
export async function activitiesForDay(userId: string, day = new Date()) {
  const start = new Date(day); start.setHours(0, 0, 0, 0);
  const end = new Date(start); end.setDate(end.getDate() + 1);
  const rows = await db().select().from(healthSample).where(and(eq(healthSample.userId, userId), eq(healthSample.metric, "workout"), gte(healthSample.startAt, start))).orderBy(desc(healthSample.startAt));
  return rows.filter((r) => r.startAt < end).map((r) => ({ id: r.id, provider: r.provider, startAt: r.startAt.toISOString(), durationMin: r.value ?? 0, payload: r.payload as { type?: string; distanceKm?: number | null; calories?: number | null; intensity?: number } | null }));
}
