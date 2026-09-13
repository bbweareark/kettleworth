import type { Adaptation } from "@kettleworth/types";

export type WeekFeedback = {
  plannedSessions: number;
  completedSessions: number;
  avgSoreness: number | null; // 1-5
  avgFatigue: number | null; // 1-5
  avgSessionRpe: number | null; // 5-10
  avgSleepHours: number | null;
  readinessAvg: number | null; // 0-100
  weightTrendKgPerWeek: number | null;
};

/** Weekly adaptation rules. Deterministic; each decision explains itself in one sentence. */
export function adaptWeek(f: WeekFeedback): Adaptation[] {
  const out: Adaptation[] = [];
  const adherence = f.plannedSessions ? f.completedSessions / f.plannedSessions : 1;
  if (adherence < 0.5) {
    out.push({ exerciseId: null, kind: "hold", magnitude: null, reason: `You completed ${f.completedSessions} of ${f.plannedSessions} sessions, so we repeat this week rather than progress.` });
    return out;
  }
  const highFatigue = (f.avgFatigue ?? 0) >= 4 || (f.avgSoreness ?? 0) >= 4;
  const poorSleep = f.avgSleepHours != null && f.avgSleepHours < 6;
  const lowReadiness = f.readinessAvg != null && f.readinessAvg < 40;
  if (highFatigue && (poorSleep || lowReadiness)) {
    out.push({ exerciseId: null, kind: "deload", magnitude: 0.6, reason: "Fatigue and soreness were high alongside poor sleep or recovery, so next week is a light deload at 60% volume." });
    return out;
  }
  if (highFatigue) out.push({ exerciseId: null, kind: "volume_down", magnitude: 0.85, reason: "Soreness or fatigue averaged 4+/5, so we trim volume 15% while keeping intensity." });
  else if (poorSleep || lowReadiness) out.push({ exerciseId: null, kind: "intensity_down", magnitude: 0.95, reason: poorSleep ? "Sleep averaged under 6 hours, so target loads ease 5% this week." : "Readiness was low most days, so target loads ease 5% this week." });
  else if (adherence >= 0.9 && (f.avgSessionRpe ?? 8) <= 7.5) out.push({ exerciseId: null, kind: "volume_up", magnitude: 1.1, reason: "You completed nearly every session and rated them RPE 7.5 or easier, so volume rises 10%." });
  else out.push({ exerciseId: null, kind: "hold", magnitude: null, reason: "Solid week: the planned progression continues as written." });
  return out;
}

export type ExerciseTrend = { exerciseId: string; name: string; weeksTracked: number; e1rmChangePct: number; swapsRequested: number; role: string };
/**
 * Boredom and staleness. A lift that has not moved in 3+ weeks of honest attempts is a plateau: rotate to a sibling variation.
 * An exercise the user keeps swapping out is one they dislike in practice: retire it. Both produce one-sentence explanations.
 */
export function detectStaleness(trends: ExerciseTrend[], variety: "steady" | "balanced" | "high" = "balanced"): Adaptation[] {
  const out: Adaptation[] = [];
  for (const t of trends) {
    if (t.swapsRequested >= 2) { out.push({ exerciseId: t.exerciseId, kind: "swap", magnitude: null, reason: `You've swapped ${t.name} out ${t.swapsRequested} times, so we're replacing it with an alternative you'll actually do.` }); continue; }
    const plateauWeeks = variety === "steady" ? 5 : variety === "high" ? 3 : 4;
    if (t.role !== "primary" && t.weeksTracked >= plateauWeeks && Math.abs(t.e1rmChangePct) < 1.5) out.push({ exerciseId: t.exerciseId, kind: "swap", magnitude: null, reason: `${t.name} has been flat for ${t.weeksTracked} weeks, so we rotate to a variation that trains the same muscles from a fresh angle.` });
    if (t.role === "primary" && t.weeksTracked >= plateauWeeks + 2 && Math.abs(t.e1rmChangePct) < 1.0) out.push({ exerciseId: t.exerciseId, kind: "swap", magnitude: null, reason: `${t.name} has stalled for ${t.weeksTracked} weeks; next block switches to a close variation so you keep the skill but break the plateau.` });
  }
  return out;
}
