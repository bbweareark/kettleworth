import type { HealthMetric, HealthSample } from "@kettleworth/types";
import { env, type Credentials, type ProviderAdapter } from "../adapter";
import { dateOnly, getJson, tokenRequest } from "../oauth";

const API = "https://api.ouraring.com/v2/usercollection";
type Page<T> = { data: T[]; next_token?: string | null };

export const oura: ProviderAdapter = {
  info: { id: "oura", displayName: "Oura", kind: "cloud", brandColor: "#5b6cff", docsUrl: "https://cloud.ouraring.com/v2/docs", metrics: ["sleep_duration", "sleep_stages", "readiness", "hrv", "resting_hr", "steps", "active_calories", "workout", "spo2", "body_temperature"], consentCopy: "We read your sleep, readiness, heart-rate variability, resting heart rate, activity and workouts to adjust each day's training intensity." },
  configured: () => !!env("OURA_CLIENT_ID") && !!env("OURA_CLIENT_SECRET"),
  authUrl: ({ redirectUri, state }) => `https://cloud.ouraring.com/oauth/authorize?${new URLSearchParams({ response_type: "code", client_id: env("OURA_CLIENT_ID"), redirect_uri: redirectUri, state, scope: "daily heartrate workout personal spo2 tag" })}`,
  exchangeCode: ({ code, redirectUri }) => tokenRequest("https://api.ouraring.com/oauth/token", { grant_type: "authorization_code", code, redirect_uri: redirectUri, client_id: env("OURA_CLIENT_ID"), client_secret: env("OURA_CLIENT_SECRET") }),
  refresh: (c) => tokenRequest("https://api.ouraring.com/oauth/token", { grant_type: "refresh_token", refresh_token: c.refreshToken ?? "", client_id: env("OURA_CLIENT_ID"), client_secret: env("OURA_CLIENT_SECRET") }),
  async revoke(c) { await fetch(`https://api.ouraring.com/oauth/revoke?access_token=${encodeURIComponent(c.accessToken)}`, { method: "POST" }).catch(() => {}); },
  async fetchSamples(creds, since, metrics) {
    const q = `start_date=${dateOnly(since)}&end_date=${dateOnly(new Date(Date.now() + 86400000))}`;
    const out: (HealthSample & { raw: unknown })[] = [];
    const want = (m: HealthMetric) => metrics.includes(m);
    if (want("sleep_duration") || want("sleep_stages") || want("hrv") || want("resting_hr")) {
      const sleep = await getJson<Page<{ id: string; day: string; bedtime_start: string; bedtime_end: string; total_sleep_duration: number; deep_sleep_duration: number; rem_sleep_duration: number; light_sleep_duration: number; awake_time: number; average_hrv: number | null; lowest_heart_rate: number | null; type: string }>>(`${API}/sleep?${q}`, creds.accessToken);
      for (const s of sleep.data.filter((x) => x.type === "long_sleep")) {
        const base = { provider: "oura" as const, startAt: s.bedtime_start, endAt: s.bedtime_end, confidence: 1, raw: s };
        if (want("sleep_duration")) out.push({ ...base, metric: "sleep_duration", value: s.total_sleep_duration / 60, unit: "min", payload: null, providerRecordId: `${s.id}:dur` });
        if (want("sleep_stages")) out.push({ ...base, metric: "sleep_stages", value: null, unit: "min", payload: { deepMin: s.deep_sleep_duration / 60, remMin: s.rem_sleep_duration / 60, lightMin: s.light_sleep_duration / 60, awakeMin: s.awake_time / 60 }, providerRecordId: `${s.id}:stages` });
        if (want("hrv") && s.average_hrv != null) out.push({ ...base, metric: "hrv", value: s.average_hrv, unit: "ms", payload: null, providerRecordId: `${s.id}:hrv` });
        if (want("resting_hr") && s.lowest_heart_rate != null) out.push({ ...base, metric: "resting_hr", value: s.lowest_heart_rate, unit: "bpm", payload: null, providerRecordId: `${s.id}:rhr` });
      }
    }
    if (want("readiness")) {
      const r = await getJson<Page<{ id: string; day: string; score: number | null; temperature_deviation: number | null }>>(`${API}/daily_readiness?${q}`, creds.accessToken);
      for (const d of r.data) {
        if (d.score != null) out.push({ provider: "oura", metric: "readiness", startAt: `${d.day}T00:00:00.000Z`, endAt: null, value: d.score, unit: "score", payload: null, confidence: 1, providerRecordId: d.id, raw: d });
        if (want("body_temperature") && d.temperature_deviation != null) out.push({ provider: "oura", metric: "body_temperature", startAt: `${d.day}T00:00:00.000Z`, endAt: null, value: d.temperature_deviation, unit: "°C deviation", payload: null, confidence: 0.8, providerRecordId: `${d.id}:temp`, raw: d });
      }
    }
    if (want("steps") || want("active_calories")) {
      const a = await getJson<Page<{ id: string; day: string; steps: number; active_calories: number }>>(`${API}/daily_activity?${q}`, creds.accessToken);
      for (const d of a.data) {
        if (want("steps")) out.push({ provider: "oura", metric: "steps", startAt: `${d.day}T00:00:00.000Z`, endAt: null, value: d.steps, unit: "steps", payload: null, confidence: 0.9, providerRecordId: `${d.id}:steps`, raw: d });
        if (want("active_calories")) out.push({ provider: "oura", metric: "active_calories", startAt: `${d.day}T00:00:00.000Z`, endAt: null, value: d.active_calories, unit: "kcal", payload: null, confidence: 0.8, providerRecordId: `${d.id}:kcal`, raw: d });
      }
    }
    if (want("workout")) {
      const w = await getJson<Page<{ id: string; activity: string; start_datetime: string; end_datetime: string; calories: number | null; distance: number | null }>>(`${API}/workout?${q}`, creds.accessToken);
      for (const x of w.data) out.push({ provider: "oura", metric: "workout", startAt: x.start_datetime, endAt: x.end_datetime, value: (new Date(x.end_datetime).getTime() - new Date(x.start_datetime).getTime()) / 60000, unit: "min", payload: { type: x.activity, durationMin: (new Date(x.end_datetime).getTime() - new Date(x.start_datetime).getTime()) / 60000, distanceKm: x.distance != null ? x.distance / 1000 : null, avgHr: null, maxHr: null, calories: x.calories, hrZonesMin: null }, confidence: 0.8, providerRecordId: x.id, raw: x });
    }
    if (want("spo2")) {
      const s = await getJson<Page<{ id: string; day: string; spo2_percentage: { average: number } | null }>>(`${API}/daily_spo2?${q}`, creds.accessToken);
      for (const d of s.data) if (d.spo2_percentage?.average != null) out.push({ provider: "oura", metric: "spo2", startAt: `${d.day}T00:00:00.000Z`, endAt: null, value: d.spo2_percentage.average, unit: "%", payload: null, confidence: 1, providerRecordId: d.id, raw: d });
    }
    return { samples: out, creds };
  },
};
