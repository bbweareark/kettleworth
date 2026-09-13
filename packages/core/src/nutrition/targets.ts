import type { TrainingProfile, NutritionTargets } from "@kettleworth/types";
import { computeBaseline } from "../metrics";

export type TargetInputs = { measuredActiveKcalPerDay?: number | null; weightTrendKgPerWeek?: number | null; adherencePct?: number | null };

export function nutritionTargets(profile: TrainingProfile, inputs: TargetInputs = {}): NutritionTargets {
  const b = computeBaseline(profile);
  const warnings: string[] = [];
  const rationale = [...b.explanations];
  if (!b.targetCalories || !b.proteinG || !b.fatG || b.carbsG == null) {
    return { calories: 0, proteinG: 0, carbsG: 0, fatG: 0, fibreG: 0, waterMl: 0, trainingDayCalories: 0, restDayCalories: 0, rationale, warnings: ["Add your height, weight, age and sex to get nutrition targets."] };
  }
  let calories = b.targetCalories;
  if (inputs.measuredActiveKcalPerDay != null && b.bmr) {
    const measured = Math.round(b.bmr * 1.15 + inputs.measuredActiveKcalPerDay);
    const goalDelta = profile.primaryGoal === "fat_loss" ? -0.18 : profile.primaryGoal === "muscle" ? 0.1 : 0;
    const refined = Math.round(measured * (1 + goalDelta));
    if (Math.abs(refined - calories) > 100) {
      rationale.push(`Your wearable shows about ${inputs.measuredActiveKcalPerDay} active kcal a day, so we refined the target from ${calories} to ${refined} kcal.`);
      calories = refined;
    }
  }
  if (inputs.weightTrendKgPerWeek != null && (inputs.adherencePct ?? 100) >= 70) {
    const goal = profile.primaryGoal;
    if (goal === "fat_loss" && inputs.weightTrendKgPerWeek > -0.2) { calories -= 100; rationale.push("Weight has been flat for two weeks with good adherence, so calories drop 100."); }
    if (goal === "fat_loss" && inputs.weightTrendKgPerWeek < -1.0) { calories += 150; warnings.push("You are losing faster than 1 kg a week. We added 150 kcal to protect muscle and energy."); }
    if (goal === "muscle" && inputs.weightTrendKgPerWeek < 0.1) { calories += 100; rationale.push("Weight hasn't moved in a surplus phase, so calories rise 100."); }
  }
  const floor = Math.max(profile.sex === "female" ? 1200 : 1500, Math.round((b.bmr ?? 1400) * 1.05));
  if (calories < floor) { calories = floor; warnings.push(`Calories are held at the safe floor of ${floor} kcal.`); }
  const proteinG = b.proteinG;
  const fatG = Math.round(Math.max((profile.weightKg ?? 70) * 0.7, (calories * 0.25) / 9));
  const carbsG = Math.max(0, Math.round((calories - proteinG * 4 - fatG * 9) / 4));
  const fibreG = Math.round(Math.min(40, Math.max(25, calories / 80)));
  const waterMl = Math.round((profile.weightKg ?? 70) * 35 + profile.sessionMinutes * 8);
  const swing = Math.round(calories * 0.08);
  const trainingDayCalories = calories + swing;
  const restDayCalories = calories - swing;
  rationale.push(`Training days get ${swing} kcal more (mostly carbs around your session) and rest days ${swing} less, so the weekly average still lands on ${calories}.`);
  if (profile.medicalFlags.length) warnings.push("You flagged a medical condition. These targets are general guidance, not medical advice. Please confirm them with your doctor or a registered dietitian.");
  return { calories, proteinG, carbsG, fatG, fibreG, waterMl, trainingDayCalories, restDayCalories, rationale, warnings };
}
