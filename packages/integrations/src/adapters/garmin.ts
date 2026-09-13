import type { HealthSample } from "@kettleworth/types";
import { env, type ProviderAdapter } from "../adapter";
import { getJson, tokenRequest } from "../oauth";

/** Garmin Health API (OAuth 2.0 + PKCE, 2024+). Data is primarily push-based; we support pull of summaries for backfill windows. */
const API = "https://apis.garmin.com/wellness-api/rest";
export const garmin: ProviderAdapter = {
  info: { id: "garmin", displayName: "Garmin", kind: "cloud", brandColor: "#007cc3", docsUrl: "https://developer.garmin.com/gc-developer-program/health-api/", metrics: ["steps", "resting_hr", "hrv", "sleep_duration", "sleep_stages", "readiness", "active_calories", "workout", "vo2max", "spo2", "body_weight"], consentCopy: "We read daily summaries (steps, heart rate, HRV, sleep, Body Battery, activities, VO2 max) so your plan adapts to your recovery." },
  configured: () => !!env("GARMIN_CLIENT_ID") && !!env("GARMIN_CLIENT_SECRET"),
  authUrl: ({ redirectUri, state, codeChallenge }) => `https://connect.garmin.com/oauth2Confirm?${new URLSearchParams({ response_type: "code", client_id: env("GARMIN_CLIENT_ID"), redirect_uri: redirectUri, state, code_challenge: codeChallenge ?? "", code_challenge_method: "S256" })}`,
  exchangeCode: ({ code, redirectUri, codeVerifier }) => tokenRequest("https://diauth.garmin.com/di-oauth2-service/oauth/token", { grant_type: "authorization_code", code, redirect_uri: redirectUri, client_id: env("GARMIN_CLIENT_ID"), client_secret: env("GARMIN_CLIENT_SECRET"), code_verifier: codeVerifier ?? "" }),
  refresh: (c) => tokenRequest("https://diauth.garmin.com/di-oauth2-service/oauth/token", { grant_type: "refresh_token", refresh_token: c.refreshToken ?? "", client_id: env("GARMIN_CLIENT_ID"), client_secret: env("GARMIN_CLIENT_SECRET") }),
  async revoke(c) { await fetch(`${API}/user/registration`, { method: "DELETE", headers: { Authorization: `Bearer ${c.accessToken}` } }).catch(() => {}); },
  async fetchSamples(creds, since, metrics) {
    const out: (HealthSample & { raw: unknown })[] = [];
    const start = Math.floor(since.getTime() / 1000), end = Math.floor(Date.now() / 1000);
    const chunk = 86400; // Garmin limits pull windows to 24h
    for (let s = start; s < end; s += chunk) {
      const e = Math.min(end, s + chunk);
      if (metrics.some((m) => ["steps", "resting_hr", "active_calories", "readiness"].includes(m))) {
        const dailies = await getJson<{ summaryId: string; calendarDate: string; steps: number; restingHeartRateInBeatsPerMinute?: number; activeKilocalories?: number; bodyBatteryChargedValue?: number }[]>(`${API}/dailies?uploadStartTimeInSeconds=${s}&uploadEndTimeInSeconds=${e}`, creds.accessToken);
        for (const d of dailies) {
          const at = `${d.calendarDate}T00:00:00.000Z`;
          if (metrics.includes("steps")) out.push({ provider: "garmin", metric: "steps", startAt: at, endAt: null, value: d.steps, unit: "steps", payload: null, confidence: 1, providerRecordId: `${d.summaryId}:steps`, raw: d });
          if (metrics.includes("resting_hr") && d.restingHeartRateInBeatsPerMinute) out.push({ provider: "garmin", metric: "resting_hr", startAt: at, endAt: null, value: d.restingHeartRateInBeatsPerMinute, unit: "bpm", payload: null, confidence: 1, providerRecordId: `${d.summaryId}:rhr`, raw: d });
          if (metrics.includes("active_calories") && d.activeKilocalories != null) out.push({ provider: "garmin", metric: "active_calories", startAt: at, endAt: null, value: d.activeKilocalories, unit: "kcal", payload: null, confidence: 0.9, providerRecordId: `${d.summaryId}:kcal`, raw: d });
        }
      }
      if (metrics.includes("sleep_duration") || metrics.includes("sleep_stages") || metrics.includes("hrv")) {
        const sleeps = await getJson<{ summaryId: string; startTimeInSeconds: number; durationInSeconds: number; deepSleepDurationInSeconds?: number; lightSleepDurationInSeconds?: number; remSleepInSeconds?: number; awakeDurationInSeconds?: number; avgOvernightHrv?: number }[]>(`${API}/sleeps?uploadStartTimeInSeconds=${s}&uploadEndTimeInSeconds=${e}`, creds.accessToken);
        for (const x of sleeps) {
          const startAt = new Date(x.startTimeInSeconds * 1000).toISOString(), endAt = new Date((x.startTimeInSeconds + x.durationInSeconds) * 1000).toISOString();
          if (metrics.includes("sleep_duration")) out.push({ provider: "garmin", metric: "sleep_duration", startAt, endAt, value: (x.durationInSeconds - (x.awakeDurationInSeconds ?? 0)) / 60, unit: "min", payload: null, confidence: 1, providerRecordId: `${x.summaryId}:dur`, raw: x });
          if (metrics.includes("sleep_stages")) out.push({ provider: "garmin", metric: "sleep_stages", startAt, endAt, value: null, unit: "min", payload: { deepMin: (x.deepSleepDurationInSeconds ?? 0) / 60, remMin: (x.remSleepInSeconds ?? 0) / 60, lightMin: (x.lightSleepDurationInSeconds ?? 0) / 60, awakeMin: (x.awakeDurationInSeconds ?? 0) / 60 }, confidence: 1, providerRecordId: `${x.summaryId}:stages`, raw: x });
          if (metrics.includes("hrv") && x.avgOvernightHrv) out.push({ provider: "garmin", metric: "hrv", startAt, endAt, value: x.avgOvernightHrv, unit: "ms", payload: null, confidence: 1, providerRecordId: `${x.summaryId}:hrv`, raw: x });
        }
      }
      if (metrics.includes("workout")) {
        const acts = await getJson<{ summaryId: string; activityType: string; startTimeInSeconds: number; durationInSeconds: number; distanceInMeters?: number; averageHeartRateInBeatsPerMinute?: number; maxHeartRateInBeatsPerMinute?: number; activeKilocalories?: number }[]>(`${API}/activities?uploadStartTimeInSeconds=${s}&uploadEndTimeInSeconds=${e}`, creds.accessToken);
        for (const a of acts) out.push({ provider: "garmin", metric: "workout", startAt: new Date(a.startTimeInSeconds * 1000).toISOString(), endAt: new Date((a.startTimeInSeconds + a.durationInSeconds) * 1000).toISOString(), value: a.durationInSeconds / 60, unit: "min", payload: { type: a.activityType, durationMin: a.durationInSeconds / 60, distanceKm: a.distanceInMeters != null ? a.distanceInMeters / 1000 : null, avgHr: a.averageHeartRateInBeatsPerMinute ?? null, maxHr: a.maxHeartRateInBeatsPerMinute ?? null, calories: a.activeKilocalories ?? null, hrZonesMin: null }, confidence: 1, providerRecordId: a.summaryId, raw: a });
      }
    }
    return { samples: out, creds };
  },
};
