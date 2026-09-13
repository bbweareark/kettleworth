import type { LoggedSet, PlannedSet } from "@kettleworth/types";
import { roundToPlate } from "../units";

export type ProgressionDecision = { nextWeightKg: number | null; change: "up" | "down" | "hold"; reason: string };

/**
 * Double progression: when every working set hits the top of the rep range at or under the target RPE, add load.
 * If reps fall below the bottom of the range on 2+ sets, or RPE overshoots by 1.5+, reduce.
 */
export function decideProgression(planned: PlannedSet[], logged: LoggedSet[], lowerBody: boolean): ProgressionDecision {
  const working = planned.filter((s) => s.type === "working");
  const done = logged.filter((l) => l.completed && working.some((w) => w.setNumber === l.setNumber));
  if (!working.length || !done.length) return { nextWeightKg: null, change: "hold", reason: "No completed working sets logged." };
  const range = working[0]!.repRange ?? [working[0]!.reps ?? 8, working[0]!.reps ?? 8];
  const targetRpe = working[0]!.targetRpe ?? 8;
  const weight = done.map((d) => d.weightKg).find((w) => w != null) ?? working[0]!.weightKg;
  const increment = lowerBody ? 2.5 : 1.25;
  const allTop = done.length >= working.length && done.every((d) => (d.reps ?? 0) >= range[1]);
  const easy = done.every((d) => d.rpe == null || d.rpe <= targetRpe);
  const missed = done.filter((d) => (d.reps ?? 0) < range[0]).length;
  const overRpe = done.some((d) => d.rpe != null && d.rpe >= targetRpe + 1.5);
  if (weight == null) return { nextWeightKg: null, change: "hold", reason: "Log a weight so we can progress it." };
  if (allTop && easy) {
    const bump = done.every((d) => d.rpe != null && d.rpe <= targetRpe - 1.5) ? increment * 2 : increment;
    return { nextWeightKg: roundToPlate(weight + bump, increment), change: "up", reason: `You hit ${range[1]} reps on every set at RPE ${targetRpe} or under, so the load goes up ${bump} kg.` };
  }
  if (missed >= 2 || overRpe) {
    return { nextWeightKg: roundToPlate(Math.max(0, weight * 0.925), increment), change: "down", reason: missed >= 2 ? `You missed the bottom of the range on ${missed} sets, so we drop 7.5% and rebuild.` : `RPE ran well over target, so we drop 7.5% to keep technique sharp.` };
  }
  return { nextWeightKg: weight, change: "hold", reason: `Keep ${weight} kg and aim for ${range[1]} reps on every set before adding load.` };
}
