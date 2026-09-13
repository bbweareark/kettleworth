import type { TrainingProfile, BaselineMetrics } from "@kettleworth/types";
import { round } from "./units";

export function bmi(weightKg: number, heightCm: number): number {
  const m = heightCm / 100;
  return round(weightKg / (m * m), 1);
}

export function bmiCategory(v: number): string {
  if (v < 18.5) return "underweight";
  if (v < 25) return "healthy range";
  if (v < 30) return "overweight";
  return "obese range";
}

/** Mifflin-St Jeor. For "other" we average the male/female constants. */
export function bmr(weightKg: number, heightCm: number, age: number, sex: "male" | "female" | "other"): number {
  const base = 10 * weightKg + 6.25 * heightCm - 5 * age;
  const c = sex === "male" ? 5 : sex === "female" ? -161 : -78;
  return Math.round(base + c);
}

/** Katch-McArdle when body-fat is known (more accurate for lean/muscular users). */
export function bmrKatch(weightKg: number, bodyFatPct: number): number {
  const lbm = weightKg * (1 - bodyFatPct / 100);
  return Math.round(370 + 21.6 * lbm);
}

export function activityMultiplier(daysPerWeek: number, sessionMinutes: number, stressLevel?: number): number {
  const weeklyMin = daysPerWeek * sessionMinutes;
  let m = 1.2;
  if (weeklyMin >= 60) m = 1.375;
  if (weeklyMin >= 180) m = 1.465;
  if (weeklyMin >= 300) m = 1.55;
  if (weeklyMin >= 420) m = 1.65;
  if (stressLevel && stressLevel >= 4) m -= 0.02; // high stress users typically move less outside training
  return round(m, 3);
}

export function tdee(bmrKcal: number, multiplier: number): number {
  return Math.round(bmrKcal * multiplier);
}

/** Epley and Brzycki averaged; clamps to sane rep ranges. */
export function estimate1RM(weightKg: number, reps: number): number {
  if (reps <= 1) return weightKg;
  const r = Math.min(reps, 12);
  const epley = weightKg * (1 + r / 30);
  const brzycki = weightKg * (36 / (37 - r));
  return round((epley + brzycki) / 2, 1);
}

/** Inverse: what load for N reps at a given 1RM (Epley). */
export function loadForReps(e1rm: number, reps: number): number {
  return e1rm / (1 + reps / 30);
}

/** Convert RPE + reps to % of 1RM (Helms/RTS style table approximation). */
export function pctOf1RM(reps: number, rpe: number): number {
  const rir = Math.max(0, 10 - rpe);
  const effectiveReps = reps + rir;
  return 1 / (1 + effectiveReps / 30);
}

export function ageFromDob(dob: string, today = new Date()): number {
  const d = new Date(dob);
  let age = today.getFullYear() - d.getFullYear();
  const m = today.getMonth() - d.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < d.getDate())) age--;
  return age;
}

export function computeBaseline(profile: TrainingProfile): BaselineMetrics {
  const explanations: string[] = [];
  const age = profile.age ?? (profile.dateOfBirth ? ageFromDob(profile.dateOfBirth) : undefined);
  const { weightKg, heightCm, sex } = profile;
  let bmiV: number | null = null;
  let bmrV: number | null = null;
  let tdeeV: number | null = null;
  let target: number | null = null;
  let proteinG: number | null = null;
  let carbsG: number | null = null;
  let fatG: number | null = null;

  if (weightKg && heightCm) {
    bmiV = bmi(weightKg, heightCm);
    explanations.push(
      `Your BMI is ${bmiV} (${bmiCategory(bmiV)}). BMI ignores muscle, so we lean on body-fat and measurements as they come in.`,
    );
  }
  if (weightKg && heightCm && age && sex) {
    bmrV = profile.bodyFatPct ? bmrKatch(weightKg, profile.bodyFatPct) : bmr(weightKg, heightCm, age, sex);
    const mult = activityMultiplier(profile.daysPerWeek, profile.sessionMinutes, profile.stressLevel);
    tdeeV = tdee(bmrV, mult);
    explanations.push(
      `At rest you burn about ${bmrV} kcal a day. With ${profile.daysPerWeek} sessions a week your maintenance is roughly ${tdeeV} kcal.`,
    );
    const goal = profile.primaryGoal;
    const delta = goal === "fat_loss" ? -0.18 : goal === "muscle" ? 0.1 : goal === "strength" ? 0.05 : 0;
    target = Math.round(tdeeV * (1 + delta));
    const floor = Math.max(sex === "female" ? 1200 : 1500, Math.round(bmrV * 1.05));
    if (target < floor) {
      target = floor;
      explanations.push(`We won't go below ${floor} kcal: eating under your resting needs costs muscle and recovery.`);
    }
    proteinG = Math.round(weightKg * (goal === "fat_loss" ? 2.0 : goal === "muscle" ? 1.8 : 1.6));
    fatG = Math.round(Math.max(weightKg * 0.7, (target * 0.25) / 9));
    carbsG = Math.max(0, Math.round((target - proteinG * 4 - fatG * 9) / 4));
    explanations.push(
      goal === "fat_loss"
        ? `Fat loss: a ${Math.abs(Math.round(delta * 100))}% deficit (${target} kcal) loses about 0.5 kg a week while protein at ${proteinG} g protects muscle.`
        : goal === "muscle"
          ? `Building muscle: a ${Math.round(delta * 100)}% surplus (${target} kcal) with ${proteinG} g protein supports growth without excess fat gain.`
          : `Maintenance at ${target} kcal with ${proteinG} g protein keeps you fuelled for training.`,
    );
  }
  const estimatedMaxes = profile.knownLifts.map((l) => ({ exerciseId: l.exerciseId, e1rmKg: estimate1RM(l.weightKg, l.reps) }));
  if (estimatedMaxes.length) explanations.push("Estimated 1RMs use the average of the Epley and Brzycki formulas from the lifts you told us about.");
  return { bmi: bmiV, bmr: bmrV, tdee: tdeeV, targetCalories: target, proteinG, carbsG, fatG, estimatedMaxes, explanations };
}
