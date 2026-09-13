import type { HealthMetric, HealthProvider, HealthSample } from "@kettleworth/types";

export const DEFAULT_PRIORITY: Record<HealthMetric, HealthProvider[]> = {
  steps: ["apple_health", "health_connect", "garmin", "fitbit", "oura", "whoop", "polar", "samsung_health", "coros", "strava", "manual"],
  resting_hr: ["whoop", "oura", "garmin", "polar", "fitbit", "apple_health", "health_connect", "coros", "samsung_health", "strava", "manual"],
  hrv: ["whoop", "oura", "garmin", "polar", "fitbit", "apple_health", "health_connect", "coros", "samsung_health", "strava", "manual"],
  sleep_duration: ["oura", "whoop", "garmin", "fitbit", "polar", "apple_health", "health_connect", "coros", "samsung_health", "strava", "manual"],
  sleep_stages: ["oura", "whoop", "garmin", "fitbit", "polar", "apple_health", "health_connect", "coros", "samsung_health", "strava", "manual"],
  readiness: ["whoop", "oura", "garmin", "polar", "fitbit", "coros", "apple_health", "health_connect", "samsung_health", "strava", "manual"],
  strain: ["whoop", "garmin", "polar", "oura", "fitbit", "coros", "apple_health", "health_connect", "samsung_health", "strava", "manual"],
  active_calories: ["garmin", "apple_health", "whoop", "fitbit", "polar", "oura", "coros", "health_connect", "samsung_health", "strava", "manual"],
  workout: ["strava", "garmin", "apple_health", "polar", "coros", "whoop", "fitbit", "health_connect", "samsung_health", "oura", "manual"],
  body_weight: ["manual", "fitbit", "garmin", "apple_health", "health_connect", "samsung_health", "oura", "whoop", "polar", "coros", "strava"],
  body_fat: ["manual", "fitbit", "garmin", "apple_health", "health_connect", "samsung_health", "oura", "whoop", "polar", "coros", "strava"],
  vo2max: ["garmin", "apple_health", "polar", "coros", "fitbit", "oura", "whoop", "health_connect", "samsung_health", "strava", "manual"],
  spo2: ["oura", "garmin", "whoop", "fitbit", "apple_health", "polar", "coros", "health_connect", "samsung_health", "strava", "manual"],
  body_temperature: ["oura", "whoop", "garmin", "fitbit", "apple_health", "polar", "coros", "health_connect", "samsung_health", "strava", "manual"],
};

/** For each metric+day keep the sample from the highest-priority provider present (workouts are kept from all sources, deduped by time overlap). */
export function resolveSamples(samples: HealthSample[], priority: Partial<Record<HealthMetric, HealthProvider[]>> = {}): HealthSample[] {
  const out: HealthSample[] = [];
  const groups = new Map<string, HealthSample[]>();
  for (const s of samples) {
    if (s.metric === "workout") { out.push(s); continue; }
    const key = `${s.metric}|${s.startAt.slice(0, 10)}`;
    (groups.get(key) ?? groups.set(key, []).get(key)!).push(s);
  }
  for (const [key, list] of groups) {
    const metric = key.split("|")[0] as HealthMetric;
    const order = priority[metric] ?? DEFAULT_PRIORITY[metric];
    list.sort((a, b) => order.indexOf(a.provider) - order.indexOf(b.provider) || b.confidence - a.confidence);
    out.push(list[0]!);
  }
  const workouts = out.filter((s) => s.metric === "workout").sort((a, b) => a.startAt.localeCompare(b.startAt));
  const deduped: HealthSample[] = [];
  for (const w of workouts) {
    const prev = deduped[deduped.length - 1];
    if (prev && overlaps(prev, w)) {
      const order = priority.workout ?? DEFAULT_PRIORITY.workout;
      if (order.indexOf(w.provider) < order.indexOf(prev.provider)) deduped[deduped.length - 1] = w;
    } else deduped.push(w);
  }
  return [...out.filter((s) => s.metric !== "workout"), ...deduped];
}
function overlaps(a: HealthSample, b: HealthSample): boolean {
  const aEnd = new Date(a.endAt ?? a.startAt).getTime(), bStart = new Date(b.startAt).getTime();
  return bStart < aEnd - 5 * 60 * 1000 || Math.abs(bStart - new Date(a.startAt).getTime()) < 10 * 60 * 1000;
}
