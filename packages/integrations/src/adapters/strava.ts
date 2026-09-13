import type { HealthSample } from "@kettleworth/types";
import { env, type ProviderAdapter } from "../adapter";
import { getJson, tokenRequest } from "../oauth";

export const strava: ProviderAdapter = {
  info: { id: "strava", displayName: "Strava", kind: "cloud", brandColor: "#fc4c02", docsUrl: "https://developers.strava.com", metrics: ["workout", "active_calories"], consentCopy: "We read your activities (type, duration, distance, heart rate) so cardio you already did is logged automatically and counted toward your energy needs." },
  configured: () => !!env("STRAVA_CLIENT_ID") && !!env("STRAVA_CLIENT_SECRET"),
  authUrl: ({ redirectUri, state }) => `https://www.strava.com/oauth/authorize?${new URLSearchParams({ response_type: "code", client_id: env("STRAVA_CLIENT_ID"), redirect_uri: redirectUri, state, approval_prompt: "auto", scope: "read,activity:read_all" })}`,
  exchangeCode: ({ code }) => tokenRequest("https://www.strava.com/oauth/token", { grant_type: "authorization_code", code, client_id: env("STRAVA_CLIENT_ID"), client_secret: env("STRAVA_CLIENT_SECRET") }),
  refresh: (c) => tokenRequest("https://www.strava.com/oauth/token", { grant_type: "refresh_token", refresh_token: c.refreshToken ?? "", client_id: env("STRAVA_CLIENT_ID"), client_secret: env("STRAVA_CLIENT_SECRET") }),
  async revoke(c) { await fetch("https://www.strava.com/oauth/deauthorize", { method: "POST", headers: { Authorization: `Bearer ${c.accessToken}` } }).catch(() => {}); },
  async fetchSamples(creds, since, metrics) {
    const out: (HealthSample & { raw: unknown })[] = [];
    const acts = await getJson<{ id: number; name: string; sport_type: string; start_date: string; elapsed_time: number; moving_time: number; distance: number; average_heartrate?: number; max_heartrate?: number; kilojoules?: number; calories?: number }[]>(`https://www.strava.com/api/v3/athlete/activities?after=${Math.floor(since.getTime() / 1000)}&per_page=100`, creds.accessToken);
    for (const a of acts) {
      const end = new Date(new Date(a.start_date).getTime() + a.elapsed_time * 1000).toISOString();
      const kcal = a.calories ?? (a.kilojoules != null ? Math.round(a.kilojoules) : null);
      if (metrics.includes("workout")) out.push({ provider: "strava", metric: "workout", startAt: a.start_date, endAt: end, value: a.moving_time / 60, unit: "min", payload: { type: a.sport_type, durationMin: a.moving_time / 60, distanceKm: a.distance / 1000, avgHr: a.average_heartrate ?? null, maxHr: a.max_heartrate ?? null, calories: kcal, hrZonesMin: null }, confidence: 1, providerRecordId: String(a.id), raw: a });
      if (metrics.includes("active_calories") && kcal != null) out.push({ provider: "strava", metric: "active_calories", startAt: a.start_date, endAt: end, value: kcal, unit: "kcal", payload: null, confidence: 0.7, providerRecordId: `${a.id}:kcal`, raw: a });
    }
    return { samples: out, creds };
  },
  parseWebhook(_headers, body) {
    try { const j = JSON.parse(body) as { owner_id: number; object_type: string }; return j.object_type === "activity" ? { userRef: String(j.owner_id), metrics: ["workout", "active_calories"] } : null; } catch { return null; }
  },
};
