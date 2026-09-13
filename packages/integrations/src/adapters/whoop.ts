import type { HealthMetric, HealthSample } from "@kettleworth/types";
import { env, type ProviderAdapter } from "../adapter";
import { getJson, tokenRequest } from "../oauth";

const API = "https://api.prod.whoop.com/developer/v2";
type Page<T> = { records: T[]; next_token?: string | null };

export const whoop: ProviderAdapter = {
  info: { id: "whoop", displayName: "Whoop", kind: "cloud", brandColor: "#00f19f", docsUrl: "https://developer.whoop.com", metrics: ["readiness", "strain", "hrv", "resting_hr", "sleep_duration", "sleep_stages", "workout", "active_calories", "spo2", "body_temperature"], consentCopy: "We read your recovery score, strain, HRV, resting heart rate, sleep and workouts so today's session matches how recovered you are." },
  configured: () => !!env("WHOOP_CLIENT_ID") && !!env("WHOOP_CLIENT_SECRET"),
  authUrl: ({ redirectUri, state }) => `https://api.prod.whoop.com/oauth/oauth2/auth?${new URLSearchParams({ response_type: "code", client_id: env("WHOOP_CLIENT_ID"), redirect_uri: redirectUri, state, scope: "offline read:recovery read:cycles read:sleep read:workout read:profile read:body_measurement" })}`,
  exchangeCode: ({ code, redirectUri }) => tokenRequest("https://api.prod.whoop.com/oauth/oauth2/token", { grant_type: "authorization_code", code, redirect_uri: redirectUri, client_id: env("WHOOP_CLIENT_ID"), client_secret: env("WHOOP_CLIENT_SECRET") }),
  refresh: (c) => tokenRequest("https://api.prod.whoop.com/oauth/oauth2/token", { grant_type: "refresh_token", refresh_token: c.refreshToken ?? "", client_id: env("WHOOP_CLIENT_ID"), client_secret: env("WHOOP_CLIENT_SECRET"), scope: "offline" }),
  async revoke(c) { await fetch(`${API}/user/access`, { method: "DELETE", headers: { Authorization: `Bearer ${c.accessToken}` } }).catch(() => {}); },
  async fetchSamples(creds, since, metrics) {
    const q = `start=${since.toISOString()}&limit=25`;
    const out: (HealthSample & { raw: unknown })[] = [];
    const want = (m: HealthMetric) => metrics.includes(m);
    if (want("readiness") || want("hrv") || want("resting_hr") || want("spo2") || want("body_temperature")) {
      const r = await getJson<Page<{ cycle_id: number; sleep_id: string; created_at: string; score_state: string; score: { recovery_score: number; resting_heart_rate: number; hrv_rmssd_milli: number; spo2_percentage: number | null; skin_temp_celsius: number | null } | null }>>(`${API}/recovery?${q}`, creds.accessToken);
      for (const x of r.records) {
        if (x.score_state !== "SCORED" || !x.score) continue;
        const base = { provider: "whoop" as const, startAt: x.created_at, endAt: null, confidence: 1, raw: x };
        if (want("readiness")) out.push({ ...base, metric: "readiness", value: x.score.recovery_score, unit: "score", payload: null, providerRecordId: `${x.cycle_id}:rec` });
        if (want("hrv")) out.push({ ...base, metric: "hrv", value: x.score.hrv_rmssd_milli, unit: "ms", payload: null, providerRecordId: `${x.cycle_id}:hrv` });
        if (want("resting_hr")) out.push({ ...base, metric: "resting_hr", value: x.score.resting_heart_rate, unit: "bpm", payload: null, providerRecordId: `${x.cycle_id}:rhr` });
        if (want("spo2") && x.score.spo2_percentage != null) out.push({ ...base, metric: "spo2", value: x.score.spo2_percentage, unit: "%", payload: null, providerRecordId: `${x.cycle_id}:spo2` });
        if (want("body_temperature") && x.score.skin_temp_celsius != null) out.push({ ...base, metric: "body_temperature", value: x.score.skin_temp_celsius, unit: "°C", payload: null, providerRecordId: `${x.cycle_id}:temp` });
      }
    }
    if (want("strain") || want("active_calories")) {
      const c = await getJson<Page<{ id: number; start: string; end: string | null; score_state: string; score: { strain: number; kilojoule: number } | null }>>(`${API}/cycle?${q}`, creds.accessToken);
      for (const x of c.records) {
        if (!x.score) continue;
        if (want("strain")) out.push({ provider: "whoop", metric: "strain", startAt: x.start, endAt: x.end, value: x.score.strain, unit: "strain", payload: null, confidence: 1, providerRecordId: `${x.id}:strain`, raw: x });
        if (want("active_calories")) out.push({ provider: "whoop", metric: "active_calories", startAt: x.start, endAt: x.end, value: Math.round(x.score.kilojoule / 4.184), unit: "kcal", payload: null, confidence: 0.85, providerRecordId: `${x.id}:kcal`, raw: x });
      }
    }
    if (want("sleep_duration") || want("sleep_stages")) {
      const s = await getJson<Page<{ id: string; start: string; end: string; nap: boolean; score_state: string; score: { stage_summary: { total_in_bed_time_milli: number; total_awake_time_milli: number; total_light_sleep_time_milli: number; total_slow_wave_sleep_time_milli: number; total_rem_sleep_time_milli: number } } | null }>>(`${API}/activity/sleep?${q}`, creds.accessToken);
      for (const x of s.records) {
        if (!x.score || x.nap) continue;
        const st = x.score.stage_summary;
        const total = (st.total_light_sleep_time_milli + st.total_slow_wave_sleep_time_milli + st.total_rem_sleep_time_milli) / 60000;
        if (want("sleep_duration")) out.push({ provider: "whoop", metric: "sleep_duration", startAt: x.start, endAt: x.end, value: total, unit: "min", payload: null, confidence: 1, providerRecordId: `${x.id}:dur`, raw: x });
        if (want("sleep_stages")) out.push({ provider: "whoop", metric: "sleep_stages", startAt: x.start, endAt: x.end, value: null, unit: "min", payload: { deepMin: st.total_slow_wave_sleep_time_milli / 60000, remMin: st.total_rem_sleep_time_milli / 60000, lightMin: st.total_light_sleep_time_milli / 60000, awakeMin: st.total_awake_time_milli / 60000 }, confidence: 1, providerRecordId: `${x.id}:stages`, raw: x });
      }
    }
    if (want("workout")) {
      const w = await getJson<Page<{ id: string; start: string; end: string; sport_name?: string; sport_id?: number; score: { average_heart_rate: number; max_heart_rate: number; kilojoule: number; distance_meter: number | null; zone_durations?: Record<string, number> } | null }>>(`${API}/activity/workout?${q}`, creds.accessToken);
      for (const x of w.records) {
        if (!x.score) continue;
        const dur = (new Date(x.end).getTime() - new Date(x.start).getTime()) / 60000;
        const zones = x.score.zone_durations ? Object.values(x.score.zone_durations).map((ms) => ms / 60000) : null;
        out.push({ provider: "whoop", metric: "workout", startAt: x.start, endAt: x.end, value: dur, unit: "min", payload: { type: x.sport_name ?? `sport_${x.sport_id}`, durationMin: dur, distanceKm: x.score.distance_meter != null ? x.score.distance_meter / 1000 : null, avgHr: x.score.average_heart_rate, maxHr: x.score.max_heart_rate, calories: Math.round(x.score.kilojoule / 4.184), hrZonesMin: zones }, confidence: 0.9, providerRecordId: x.id, raw: x });
      }
    }
    return { samples: out, creds };
  },
};
