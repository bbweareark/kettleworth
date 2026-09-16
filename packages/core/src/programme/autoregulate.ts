import { kgToLb, lbToKg } from "../units";

/**
 * Adjusting the next set from the one just lifted. This is autoregulation: the plan is a starting point, and how the
 * set actually went (reps against the target range, and effort against the target RPE) moves the load for the sets
 * that remain. Autoregulated loading matched or beat fixed loading for strength in trained lifters (Mann 2010 APRE;
 * Graham and Cleather 2019), and RPE with reps in reserve is a practical way to steer it (Helms et al. 2018).
 *
 * Deliberately conservative: one small step for a mild signal, a bigger step only when reps and effort agree, never
 * more than 10% in one go, and always rounded to weights that exist in a gym.
 */
export type AutoregTarget = { repRange: [number, number] | null; reps: number | null; targetRpe: number | null; weightKg: number | null };
export type AutoregSet = { weightKg: number | null; reps: number | null; rpe: number | null };
export type AutoregResult = { action: "up" | "down" | "hold"; nextWeightKg: number | null; change: number; reason: string };

/** The smallest jump that exists for this kit, in the lifter's own units. */
export function loadStep(kind: "bar" | "handheld" | "stack" | "added" | "plain", units: "metric" | "imperial", implement?: "dumbbell" | "kettlebell"): number {
  if (units === "imperial") return kind === "stack" ? 10 : implement === "kettlebell" ? 5 : 5;
  return kind === "stack" ? 5 : implement === "kettlebell" ? 4 : 2.5;
}

export function autoregulate(set: AutoregSet, target: AutoregTarget, opts: { step: number; units: "metric" | "imperial" }): AutoregResult {
  const hold = (reason: string): AutoregResult => ({ action: "hold", nextWeightKg: set.weightKg, change: 0, reason });
  if (!set.weightKg || set.weightKg <= 0 || set.reps == null) return hold("");
  const range: [number, number] | null = target.repRange ?? (target.reps != null ? [target.reps, target.reps] : null);
  if (!range) return hold("");
  const [lo, hi] = range;
  const rpeGoal = target.targetRpe ?? 8;
  const easy = set.rpe != null && set.rpe <= rpeGoal - 1;
  const veryEasy = set.rpe != null && set.rpe <= rpeGoal - 1.5;
  const hard = set.rpe != null && set.rpe >= rpeGoal + 1.5;

  let pct = 0; let why = "";
  const rpeText = set.rpe != null ? ` at RPE ${set.rpe}` : "";
  if (set.reps > hi) { pct = easy ? 0.05 : 0.025; why = `${set.reps} reps${rpeText}, above your ${lo} to ${hi} range`; }
  else if (set.reps < lo) { pct = lo - set.reps >= 3 || (set.rpe != null && set.rpe >= 9.5) ? -0.1 : -0.05; why = `${set.reps} reps${rpeText}, under your ${lo} to ${hi} range`; }
  else if (veryEasy) { pct = 0.025; why = `RPE ${set.rpe} says there was more in the tank`; }
  else if (hard) { pct = -0.05; why = `RPE ${set.rpe} is harder than the ${rpeGoal} this set was aiming for`; }
  if (pct === 0) return hold(`${set.reps} reps${rpeText}: right on target, same weight next set.`);

  // Work in the lifter's units so the result is a weight that exists on their rack.
  const toU = (kg: number) => (opts.units === "metric" ? kg : kgToLb(kg));
  const fromU = (u: number) => (opts.units === "metric" ? u : lbToKg(u));
  const current = toU(set.weightKg);
  const raw = current * (1 + Math.max(-0.1, Math.min(0.1, pct)));
  let next = Math.round(raw / opts.step) * opts.step;
  if (next === current) next = current + Math.sign(pct) * opts.step;
  next = Math.max(opts.step, next);
  const change = Math.round((next - current) * 100) / 100;
  const unit = opts.units === "metric" ? "kg" : "lb";
  const show = (n: number) => `${Math.round(n * 100) / 100} ${unit}`;
  return {
    action: change > 0 ? "up" : "down", nextWeightKg: Math.round(fromU(next) * 1000) / 1000, change,
    reason: `${why}: next set ${show(next)} (${change > 0 ? "+" : ""}${show(change)}).`,
  };
}
