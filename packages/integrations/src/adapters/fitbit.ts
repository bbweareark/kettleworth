import type { HealthMetric, HealthSample } from "@kettleworth/types";
import { env, type ProviderAdapter } from "../adapter";
import { dateOnly, getJson, tokenRequest } from "../oauth";

const API = "https://api.fitbit.com";
export const fitbit: ProviderAdapter = {
  info: { id: "fitbit", displayName: "Fitbit", kind: "cloud", brandColor: "#00b0b9", docsUrl: "https://dev.fitbit.com", metrics: ["steps", "resting_hr", "hrv", "sleep_duration", "sleep_stages", "active_calories", "workout", "body_weight", "body_fat", "spo2", "vo2max"], consentCopy: "We read steps, heart rate, HRV, sleep, activity, weight and SpO2 to personalise your training load and calorie targets." },
  configured: () => !!env("FITBIT_CLIENT_ID") && !!env("FITBIT_CLIENT_SECRET"),
  authUrl: ({ redirectUri, state, codeChallenge }) => `https://www.fitbit.com/oauth2/authorize?${new URLSearchParams({ response_type: "code", client_id: env("FITBIT_CLIENT_ID"), redirect_uri: redirectUri, state, scope: "activity heartrate sleep weight oxygen_saturation cardio_fitness profile", code_challenge: codeChallenge ?? "", code_challenge_method: "S256" })}`,
  exchangeCode: ({ code, redirectUri, codeVerifier }) => tokenRequest(`${API}/oauth2/token`, { grant_type: "authorization_code", code, redirect_uri: redirectUri, client_id: env("FITBIT_CLIENT_ID"), code_verifier: codeVerifier ?? "" }, { basicAuth: [env("FITBIT_CLIENT_ID"), env("FITBIT_CLIENT_SECRET")] }),
  refresh: (c) => tokenRequest(`${API}/oauth2/token`, { grant_type: "refresh_token", refresh_token: c.refreshToken ?? "" }, { basicAuth: [env("FITBIT_CLIENT_ID"), env("FITBIT_CLIENT_SECRET")] }),
  async revoke(c) { await fetch(`${API}/oauth2/revoke`, { method: "POST", headers: { Authorization: "Basic " + Buffer.from(`${env("FITBIT_CLIENT_ID")}:${env("FITBIT_CLIENT_SECRET")}`).toString("base64"), "Content-Type": "application/x-www-form-urlencoded" }, body: new URLSearchParams({ token: c.accessToken }) }).catch(() => {}); },
  async fetchSamples(creds, since, metrics) {
    const out: (HealthSample & { raw: unknown })[] = [];
    const want = (m: HealthMetric) => metrics.includes(m);
    const from = dateOnly(since), to = dateOnly(new Date());
    const tok = creds.accessToken;
    if (want("steps")) {
      const j = await getJson<{ "activities-steps": { dateTime: string; value: string }[] }>(`${API}/1/user/-/activities/steps/date/${from}/${to}.json`, tok);
      for (const d of j["activities-steps"]) out.push({ provider: "fitbit", metric: "steps", startAt: `${d.dateTime}T00:00:00.000Z`, endAt: null, value: Number(d.value), unit: "steps", payload: null, confidence: 1, providerRecordId: `steps:${d.dateTime}`, raw: d });
    }
    if (want("resting_hr")) {
      const j = await getJson<{ "activities-heart": { dateTime: string; value: { restingHeartRate?: number } }[] }>(`${API}/1/user/-/activities/heart/date/${from}/${to}.json`, tok);
      for (const d of j["activities-heart"]) if (d.value.restingHeartRate) out.push({ provider: "fitbit", metric: "resting_hr", startAt: `${d.dateTime}T00:00:00.000Z`, endAt: null, value: d.value.restingHeartRate, unit: "bpm", payload: null, confidence: 1, providerRecordId: `rhr:${d.dateTime}`, raw: d });
    }
    if (want("hrv")) {
      const j = await getJson<{ hrv: { dateTime: string; value: { dailyRmssd: number } }[] }>(`${API}/1/user/-/hrv/date/${from}/${to}.json`, tok);
      for (const d of j.hrv) out.push({ provider: "fitbit", metric: "hrv", startAt: `${d.dateTime}T00:00:00.000Z`, endAt: null, value: d.value.dailyRmssd, unit: "ms", payload: null, confidence: 1, providerRecordId: `hrv:${d.dateTime}`, raw: d });
    }
    if (want("sleep_duration") || want("sleep_stages")) {
      const j = await getJson<{ sleep: { logId: number; startTime: string; endTime: string; isMainSleep: boolean; minutesAsleep: number; levels?: { summary?: Record<string, { minutes: number }> } }[] }>(`${API}/1.2/user/-/sleep/date/${from}/${to}.json`, tok);
      for (const s of j.sleep.filter((x) => x.isMainSleep)) {
        if (want("sleep_duration")) out.push({ provider: "fitbit", metric: "sleep_duration", startAt: s.startTime, endAt: s.endTime, value: s.minutesAsleep, unit: "min", payload: null, confidence: 1, providerRecordId: `${s.logId}:dur`, raw: s });
        const sum = s.levels?.summary;
        if (want("sleep_stages") && sum?.deep) out.push({ provider: "fitbit", metric: "sleep_stages", startAt: s.startTime, endAt: s.endTime, value: null, unit: "min", payload: { deepMin: sum.deep?.minutes ?? 0, remMin: sum.rem?.minutes ?? 0, lightMin: sum.light?.minutes ?? 0, awakeMin: sum.wake?.minutes ?? 0 }, confidence: 1, providerRecordId: `${s.logId}:stages`, raw: s });
      }
    }
    if (want("body_weight") || want("body_fat")) {
      const j = await getJson<{ weight: { logId: number; date: string; time: string; weight: number; fat?: number }[] }>(`${API}/1/user/-/body/log/weight/date/${from}/${to}.json`, tok);
      for (const w of j.weight) {
        const at = `${w.date}T${w.time}Z`;
        if (want("body_weight")) out.push({ provider: "fitbit", metric: "body_weight", startAt: at, endAt: null, value: w.weight, unit: "kg", payload: null, confidence: 1, providerRecordId: `${w.logId}:kg`, raw: w });
        if (want("body_fat") && w.fat != null) out.push({ provider: "fitbit", metric: "body_fat", startAt: at, endAt: null, value: w.fat, unit: "%", payload: null, confidence: 0.8, providerRecordId: `${w.logId}:fat`, raw: w });
      }
    }
    if (want("workout") || want("active_calories")) {
      const j = await getJson<{ activities: { logId: number; activityName: string; startTime: string; duration: number; distance?: number; averageHeartRate?: number; calories: number }[] }>(`${API}/1/user/-/activities/list.json?afterDate=${from}&sort=asc&offset=0&limit=100`, tok);
      for (const a of j.activities) {
        const end = new Date(new Date(a.startTime).getTime() + a.duration).toISOString();
        if (want("workout")) out.push({ provider: "fitbit", metric: "workout", startAt: a.startTime, endAt: end, value: a.duration / 60000, unit: "min", payload: { type: a.activityName, durationMin: a.duration / 60000, distanceKm: a.distance ?? null, avgHr: a.averageHeartRate ?? null, maxHr: null, calories: a.calories, hrZonesMin: null }, confidence: 0.9, providerRecordId: String(a.logId), raw: a });
      }
    }
    if (want("spo2")) {
      const j = await getJson<{ dateTime: string; value: { avg: number } }[]>(`${API}/1/user/-/spo2/date/${from}/${to}.json`, tok);
      for (const d of j) out.push({ provider: "fitbit", metric: "spo2", startAt: `${d.dateTime}T00:00:00.000Z`, endAt: null, value: d.value.avg, unit: "%", payload: null, confidence: 1, providerRecordId: `spo2:${d.dateTime}`, raw: d });
    }
    if (want("vo2max")) {
      const j = await getJson<{ cardioScore: { dateTime: string; value: { vo2Max: string } }[] }>(`${API}/1/user/-/cardioscore/date/${from}/${to}.json`, tok);
      for (const d of j.cardioScore) { const v = parseFloat(d.value.vo2Max.split("-")[0]!); if (!isNaN(v)) out.push({ provider: "fitbit", metric: "vo2max", startAt: `${d.dateTime}T00:00:00.000Z`, endAt: null, value: v, unit: "ml/kg/min", payload: null, confidence: 0.7, providerRecordId: `vo2:${d.dateTime}`, raw: d }); }
    }
    return { samples: out, creds };
  },
};
