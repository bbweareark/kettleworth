import type { LoggedSet } from "@kettleworth/types";
import { estimate1RM } from "./metrics";

export type SetRecord = { exerciseId: string; date: string; set: LoggedSet; primaryMuscles: string[] };

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
  return sets.reduce((a, r) => a + (r.set.completed ? (r.set.weightKg ?? 0) * (r.set.reps ?? 0) : 0), 0);
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

/** Detects whether a logged set beats the previous best e1RM for the exercise. */
export function isPR(history: SetRecord[], exerciseId: string, candidate: LoggedSet): boolean {
  if (!candidate.completed || candidate.weightKg == null || !candidate.reps) return false;
  const prev = bestE1RM(history.filter((h) => h.exerciseId === exerciseId));
  const now = estimate1RM(candidate.weightKg, candidate.reps);
  return prev == null ? candidate.weightKg > 0 : now > prev + 0.05;
}
