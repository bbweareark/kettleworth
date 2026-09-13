import type { HealthSample, Readiness, HealthProvider } from "@kettleworth/types";

/**
 * Compute today's readiness from normalised samples. Prefers a provider's own readiness/recovery score,
 * else derives from HRV vs 7-day baseline, resting HR vs baseline, and sleep duration.
 */
export function computeReadiness(samples: HealthSample[], today = new Date()): Readiness {
  const dayStart = new Date(today); dayStart.setHours(0, 0, 0, 0);
  const since = new Date(dayStart); since.setDate(since.getDate() - 7);
  const recent = samples.filter((s) => new Date(s.startAt) >= since);
  const todayS = recent.filter((s) => new Date(s.startAt) >= dayStart || (s.metric === "sleep_duration" && new Date(s.endAt ?? s.startAt) >= dayStart));
  const sources = new Set<HealthProvider>();
  const reasons: string[] = [];

  // Work already done today (runs, rides, classes, from a wearable or logged by hand) counts against tonight's session.
  const todayWork = todayS.filter((s) => s.metric === "workout" && s.value != null);
  const loadToday = todayWork.reduce((a, w) => { const p = w.payload as { durationMin?: number; intensity?: number; avgHr?: number } | null; const mins = p?.durationMin ?? w.value ?? 0; const intensity = p?.intensity ?? (p?.avgHr ? Math.min(5, Math.max(1, Math.round((p.avgHr - 90) / 20))) : 3); return a + mins * intensity; }, 0);
  const priorPenalty = loadToday >= 300 ? 28 : loadToday >= 150 ? 16 : loadToday >= 90 ? 8 : 0; // 50 min hard ride (200) => moderate band; 60 min all-out (300) => low band from a fresh 80
  if (priorPenalty) { for (const w of todayWork) sources.add(w.provider); reasons.push(`You've already done ${Math.round(todayWork.reduce((a, w) => a + ((w.payload as { durationMin?: number } | null)?.durationMin ?? w.value ?? 0), 0))} min of ${todayWork.map((w) => (w.payload as { type?: string } | null)?.type ?? "training").join(", ")} today.`); }

  const provScore = todayS.find((s) => s.metric === "readiness" && s.value != null);
  if (provScore) {
    sources.add(provScore.provider);
    const score = Math.round(provScore.value!) - priorPenalty;
    reasons.push(`${label(provScore.provider)} recovery score ${Math.round(provScore.value!)}.`);
    return finalise(Math.max(0, score), reasons, sources);
  }

  let score = 70;
  let signals = 0;
  const hrvToday = todayS.find((s) => s.metric === "hrv" && s.value != null);
  const hrvBase = avg(recent.filter((s) => s.metric === "hrv" && s.value != null && s !== hrvToday).map((s) => s.value!));
  if (hrvToday && hrvBase) {
    sources.add(hrvToday.provider);
    const ratio = hrvToday.value! / hrvBase;
    const delta = clamp((ratio - 1) * 100, -25, 20);
    score += delta; signals++;
    reasons.push(`HRV ${ratio >= 1 ? "up" : "down"} ${Math.abs(Math.round((ratio - 1) * 100))}% vs your 7-day average.`);
  }
  const rhrToday = todayS.find((s) => s.metric === "resting_hr" && s.value != null);
  const rhrBase = avg(recent.filter((s) => s.metric === "resting_hr" && s.value != null && s !== rhrToday).map((s) => s.value!));
  if (rhrToday && rhrBase) {
    sources.add(rhrToday.provider);
    const diff = rhrToday.value! - rhrBase;
    score -= clamp(diff * 3, -10, 20); signals++;
    if (Math.abs(diff) >= 2) reasons.push(`Resting heart rate ${diff > 0 ? "up" : "down"} ${Math.abs(Math.round(diff))} bpm.`);
  }
  const sleep = todayS.find((s) => s.metric === "sleep_duration" && s.value != null);
  if (sleep) {
    sources.add(sleep.provider);
    const h = sleep.value! / 60;
    score += clamp((h - 7) * 8, -25, 12); signals++;
    reasons.push(`${h.toFixed(1)} h sleep.`);
  }
  if (!signals && !priorPenalty) return { score: null, band: "unknown", intensityScalar: 1, reasons: ["No recovery data yet. Connect a wearable or log sleep to personalise intensity."], sources: [] };
  if (!signals) return finalise(Math.round(clamp(80 - priorPenalty, 0, 100)), reasons, sources);
  return finalise(Math.round(clamp(score - priorPenalty, 0, 100)), reasons, sources);
}

function finalise(score: number, reasons: string[], sources: Set<HealthProvider>): Readiness {
  const band = score >= 67 ? "high" : score >= 40 ? "moderate" : "low";
  const intensityScalar = band === "high" ? 1 : band === "moderate" ? 0.95 : 0.85;
  if (band === "low") reasons.push("Today's target loads ease 15%. Move well, don't chase PRs.");
  else if (band === "moderate") reasons.push("Target loads ease 5%. Solid work, leave a rep in the tank.");
  else reasons.push("Green light: train as planned.");
  return { score, band, intensityScalar, reasons, sources: [...sources] };
}
const avg = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : null);
const clamp = (n: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, n));
const label = (p: string) => ({ whoop: "Whoop", oura: "Oura", garmin: "Garmin", fitbit: "Fitbit", polar: "Polar", apple_health: "Apple Health", health_connect: "Health Connect", strava: "Strava", coros: "Coros", samsung_health: "Samsung Health", manual: "Manual" })[p] ?? p;
