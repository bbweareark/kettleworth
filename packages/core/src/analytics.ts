import type { LoggedSet } from "@kettleworth/types";
import { estimate1RM } from "./metrics";

export type SetRecord = { exerciseId: string; date: string; set: LoggedSet; primaryMuscles: string[]; /** 2 when a pair of dumbbells was lifted; the logged weight is one handle. */ loadMultiplier?: number };

export function bestE1RM(sets: SetRecord[]): number | null {
  let best: number | null = null;
  for (const r of sets) {
    if (!r.set.completed || r.set.weightKg == null || !r.set.reps) continue;
    const e = estimate1RM(r.set.weightKg, r.set.reps);
    if (best == null || e > best) best = e;
  }
  return best;
}

/** e1RM per calendar week for an exercise. */
export function e1rmSeries(sets: SetRecord[], exerciseId: string): { week: string; e1rm: number }[] {
  const byWeek = new Map<string, number>();
  for (const r of sets) {
    if (r.exerciseId !== exerciseId || !r.set.completed || r.set.weightKg == null || !r.set.reps) continue;
    const wk = isoWeek(r.date);
    const e = estimate1RM(r.set.weightKg, r.set.reps);
    byWeek.set(wk, Math.max(byWeek.get(wk) ?? 0, e));
  }
  return [...byWeek.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([week, e1rm]) => ({ week, e1rm }));
}

/** Working sets per primary muscle per week. */
export function volumeByMuscle(sets: SetRecord[]): Record<string, number> {
  const out: Record<string, number> = {};
  for (const r of sets) if (r.set.completed) for (const m of r.primaryMuscles) out[m] = (out[m] ?? 0) + 1;
  return out;
}

export function tonnage(sets: SetRecord[]): number {
  return sets.reduce((a, r) => a + (r.set.completed ? (r.set.weightKg ?? 0) * (r.loadMultiplier ?? 1) * (r.set.reps ?? 0) : 0), 0);
}

/** Streak = consecutive weeks (ending this week) with >= 1 completed session. */
export function weeklyStreak(sessionDates: string[], today = new Date()): number {
  const weeks = new Set(sessionDates.map(isoWeek));
  let streak = 0;
  const d = new Date(today);
  for (let i = 0; i < 104; i++) {
    if (weeks.has(isoWeek(d.toISOString()))) streak++;
    else if (i > 0) break;
    d.setDate(d.getDate() - 7);
  }
  return streak;
}

export function isoWeek(dateIso: string): string {
  const d = new Date(dateIso);
  const t = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const day = t.getUTCDay() || 7;
  t.setUTCDate(t.getUTCDate() + 4 - day);
  const y0 = new Date(Date.UTC(t.getUTCFullYear(), 0, 1));
  const w = Math.ceil(((t.getTime() - y0.getTime()) / 86400000 + 1) / 7);
  return `${t.getUTCFullYear()}-W${String(w).padStart(2, "0")}`;
}

export type PRKind = "weight" | "e1rm" | "reps";
export type PRResult = { kinds: PRKind[]; e1rm: number; headline: string; detail: string };

/** Sets that may count toward, or against, a record: completed, loaded, with reps, and not an outlier the lifter confirmed. */
function countable(s: LoggedSet): boolean {
  return !!s.completed && s.weightKg != null && s.weightKg > 0 && !!s.reps && s.reps > 0 && !s.confirmed;
}

/**
 * A personal best is judged against every earlier set of the same exercise, including earlier sets in this session.
 * Three honest kinds, reported by what actually improved:
 *  - weight: heavier than any set before, at any reps
 *  - e1rm:   a higher estimated max, only from sets of 10 reps or fewer (where the estimate holds up) and by at least
 *            1% and 1 kg, so a lighter set with an extra rep never masquerades as a record
 *  - reps:   more reps than ever at exactly this weight
 * The very first time an exercise is logged sets the baseline and is not a record: there is nothing to beat yet.
 */
export function detectPR(history: SetRecord[], candidate: LoggedSet, units: "metric" | "imperial" = "metric"): PRResult | null {
  if (!countable(candidate)) return null;
  const prev = history.map((h) => h.set).filter(countable);
  if (!prev.length) return null;
  const w = candidate.weightKg!, r = candidate.reps!;
  const kinds: PRKind[] = [];
  const maxW = Math.max(...prev.map((s) => s.weightKg!));
  if (w > maxW + 0.01) kinds.push("weight");
  const e1rm = estimate1RM(w, r);
  const reliable = prev.filter((s) => s.reps! <= 10);
  const bestE = reliable.length ? Math.max(...reliable.map((s) => estimate1RM(s.weightKg!, s.reps!))) : null;
  if (r <= 10 && bestE != null && e1rm >= bestE * 1.01 && e1rm - bestE >= 1) kinds.push("e1rm");
  const sameWeight = prev.filter((s) => Math.abs(s.weightKg! - w) < 0.01);
  const bestRepsHere = sameWeight.length ? Math.max(...sameWeight.map((s) => s.reps!)) : null;
  if (bestRepsHere != null && r > bestRepsHere) kinds.push("reps");
  if (!kinds.length) return null;
  const show = (kg: number) => (units === "metric" ? `${Math.round(kg * 10) / 10} kg` : `${Math.round(kg * 2.20462)} lb`);
  const headline = kinds.includes("weight") ? "Heaviest set yet" : kinds.includes("reps") ? `Most reps at ${show(w)}` : "New estimated max";
  const detail = kinds.includes("weight") ? `${show(w)} × ${r}, up from ${show(maxW)}.`
    : kinds.includes("reps") ? `${r} reps at ${show(w)}, beating your best of ${bestRepsHere}.`
    : `${show(w)} × ${r} puts your estimated max at ${show(e1rm)}, up from ${show(bestE!)}.`;
  return { kinds, e1rm, headline, detail };
}

/** Kept for existing callers: true when detectPR finds any kind of record. */
export function isPR(history: SetRecord[], exerciseId: string, candidate: LoggedSet): boolean {
  return detectPR(history.filter((h) => h.exerciseId === exerciseId), candidate) != null;
}
