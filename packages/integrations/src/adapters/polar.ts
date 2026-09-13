import type { HealthSample } from "@kettleworth/types";
import { env, type ProviderAdapter } from "../adapter";
import { getJson, tokenRequest } from "../oauth";

const API = "https://www.polaraccesslink.com/v3";
export const polar: ProviderAdapter = {
  info: { id: "polar", displayName: "Polar", kind: "cloud", brandColor: "#d10a11", docsUrl: "https://www.polar.com/accesslink-api/", metrics: ["sleep_duration", "sleep_stages", "readiness", "hrv", "resting_hr", "steps", "active_calories", "workout"], consentCopy: "We read Nightly Recharge, sleep, heart rate, activity and training sessions to tune each day's intensity." },
  configured: () => !!env("POLAR_CLIENT_ID") && !!env("POLAR_CLIENT_SECRET"),
  authUrl: ({ redirectUri, state }) => `https://flow.polar.com/oauth2/authorization?${new URLSearchParams({ response_type: "code", client_id: env("POLAR_CLIENT_ID"), redirect_uri: redirectUri, state, scope: "accesslink.read_all" })}`,
  async exchangeCode({ code, redirectUri }) {
    const c = await tokenRequest("https://polarremote.com/v2/oauth2/token", { grant_type: "authorization_code", code, redirect_uri: redirectUri }, { basicAuth: [env("POLAR_CLIENT_ID"), env("POLAR_CLIENT_SECRET")] });
    // Polar requires registering the user with the client before data access.
    await fetch(`${API}/users`, { method: "POST", headers: { Authorization: `Bearer ${c.accessToken}`, "Content-Type": "application/json", Accept: "application/json" }, body: JSON.stringify({ "member-id": c.providerUserId ?? "kettleworth" }) }).catch(() => {});
    return c;
  },
  refresh: async (c) => c, // Polar access tokens don't expire
  async revoke(c) { if (c.providerUserId) await fetch(`${API}/users/${c.providerUserId}`, { method: "DELETE", headers: { Authorization: `Bearer ${c.accessToken}` } }).catch(() => {}); },
  async fetchSamples(creds, since, metrics) {
    const out: (HealthSample & { raw: unknown })[] = [];
    const from = since.toISOString().slice(0, 10), to = new Date().toISOString().slice(0, 10);
    if (metrics.includes("sleep_duration") || metrics.includes("sleep_stages")) {
      const j = await getJson<{ nights: { date: string; sleep_start_time: string; sleep_end_time: string; light_sleep: number; deep_sleep: number; rem_sleep: number; total_interruption_duration: number }[] }>(`${API}/users/sleep?from=${from}&to=${to}`, creds.accessToken);
      for (const n of j.nights ?? []) {
        const total = (n.light_sleep + n.deep_sleep + n.rem_sleep) / 60;
        if (metrics.includes("sleep_duration")) out.push({ provider: "polar", metric: "sleep_duration", startAt: n.sleep_start_time, endAt: n.sleep_end_time, value: total, unit: "min", payload: null, confidence: 1, providerRecordId: `${n.date}:dur`, raw: n });
        if (metrics.includes("sleep_stages")) out.push({ provider: "polar", metric: "sleep_stages", startAt: n.sleep_start_time, endAt: n.sleep_end_time, value: null, unit: "min", payload: { deepMin: n.deep_sleep / 60, remMin: n.rem_sleep / 60, lightMin: n.light_sleep / 60, awakeMin: n.total_interruption_duration / 60 }, confidence: 1, providerRecordId: `${n.date}:stages`, raw: n });
      }
    }
    if (metrics.includes("readiness") || metrics.includes("hrv") || metrics.includes("resting_hr")) {
      const j = await getJson<{ recharges: { date: string; nightly_recharge_status: number; heart_rate_avg: number; heart_rate_variability_avg: number }[] }>(`${API}/users/nightly-recharge?from=${from}&to=${to}`, creds.accessToken);
      for (const r of j.recharges ?? []) {
        const at = `${r.date}T00:00:00.000Z`;
        if (metrics.includes("readiness")) out.push({ provider: "polar", metric: "readiness", startAt: at, endAt: null, value: Math.round(((r.nightly_recharge_status + 3) / 6) * 100), unit: "score", payload: null, confidence: 0.8, providerRecordId: `${r.date}:nr`, raw: r });
        if (metrics.includes("hrv")) out.push({ provider: "polar", metric: "hrv", startAt: at, endAt: null, value: r.heart_rate_variability_avg, unit: "ms", payload: null, confidence: 1, providerRecordId: `${r.date}:hrv`, raw: r });
        if (metrics.includes("resting_hr")) out.push({ provider: "polar", metric: "resting_hr", startAt: at, endAt: null, value: r.heart_rate_avg, unit: "bpm", payload: null, confidence: 0.9, providerRecordId: `${r.date}:rhr`, raw: r });
      }
    }
    if (metrics.includes("workout")) {
      const j = await getJson<{ id: string; sport: string; start_time: string; duration: string; distance?: number; heart_rate?: { average?: number; maximum?: number }; calories?: number }[]>(`${API}/exercises`, creds.accessToken);
      for (const e of j ?? []) {
        const mins = isoDurationToMin(e.duration);
        if (new Date(e.start_time) < since) continue;
        out.push({ provider: "polar", metric: "workout", startAt: e.start_time, endAt: new Date(new Date(e.start_time).getTime() + mins * 60000).toISOString(), value: mins, unit: "min", payload: { type: e.sport, durationMin: mins, distanceKm: e.distance != null ? e.distance / 1000 : null, avgHr: e.heart_rate?.average ?? null, maxHr: e.heart_rate?.maximum ?? null, calories: e.calories ?? null, hrZonesMin: null }, confidence: 1, providerRecordId: e.id, raw: e });
      }
    }
    return { samples: out, creds };
  },
};
function isoDurationToMin(d: string): number {
  const m = /PT(?:(\d+)H)?(?:(\d+)M)?(?:([\d.]+)S)?/.exec(d);
  if (!m) return 0;
  return (Number(m[1] ?? 0) * 60) + Number(m[2] ?? 0) + Number(m[3] ?? 0) / 60;
}
