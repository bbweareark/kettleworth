import { describe, it, expect } from "vitest";
import { TrainingProfile } from "@kettleworth/types";
import { nutritionTargets } from "./targets";
import { buildWeeklyMealPlan, type RecipeInput } from "./mealplan";

const r = (id: string, o: Partial<RecipeInput>): RecipeInput => ({
  id, name: id, slots: ["lunch", "dinner"], dietTypes: ["omnivore", "vegetarian", "vegan"], allergens: [], prepMinutes: 20, costTier: "low",
  macros: { calories: 500, proteinG: 35, carbsG: 50, fatG: 15, fibreG: 8 }, ingredients: [{ name: "rice", quantity: 100, unit: "g", aisle: "grains", costPerUnit: 0.002 }], tags: [], ...o,
});
const recipes = [
  r("oats", { slots: ["breakfast"], macros: { calories: 400, proteinG: 20, carbsG: 60, fatG: 8, fibreG: 9 } }),
  r("eggs", { slots: ["breakfast"], dietTypes: ["omnivore", "vegetarian"], allergens: ["eggs"] }),
  r("chicken_rice", { dietTypes: ["omnivore", "halal"] }),
  r("tofu_bowl", { allergens: ["soy"] }),
  r("lentil_curry", {}),
  r("salmon", { dietTypes: ["omnivore", "pescatarian"], allergens: ["fish"], costTier: "high" }),
  r("yoghurt", { slots: ["snack"], dietTypes: ["omnivore", "vegetarian"], allergens: ["dairy"], macros: { calories: 150, proteinG: 15, carbsG: 10, fatG: 4, fibreG: 0 } }),
  r("nuts", { slots: ["snack"], allergens: ["nuts"], macros: { calories: 200, proteinG: 6, carbsG: 6, fatG: 18, fibreG: 3 } }),
  r("fruit", { slots: ["snack"], macros: { calories: 100, proteinG: 1, carbsG: 25, fatG: 0, fibreG: 4 } }),
];
const profile = TrainingProfile.parse({ sex: "male", age: 30, heightCm: 180, weightKg: 80, primaryGoal: "muscle", goals: ["muscle"], daysPerWeek: 4, sessionMinutes: 60, dietType: "vegan", allergens: ["soy"], budgetTier: "medium" });

describe("nutrition", () => {
  it("produces targets with training/rest day swing", () => {
    const t = nutritionTargets(profile);
    expect(t.calories).toBeGreaterThan(2500);
    expect(t.trainingDayCalories).toBeGreaterThan(t.restDayCalories);
    expect(t.proteinG).toBe(144);
  });
  it("meal plan respects diet, allergens and lands near target", () => {
    const t = nutritionTargets(profile);
    const plan = buildWeeklyMealPlan(profile, t, recipes, { trainingDays: [0, 2, 4, 5] });
    const ids = new Set(plan.items.map((i) => i.recipeId));
    for (const bad of ["eggs", "chicken_rice", "tofu_bowl", "salmon", "yoghurt"]) expect(ids.has(bad)).toBe(false);
    expect(plan.items.length).toBeGreaterThanOrEqual(7 * 4); // breakfast, lunch, dinner, snack every day (+ extra when short)
    for (let d = 0; d < 7; d++) {
      const target = [0, 2, 4, 5].includes(d) ? t.trainingDayCalories : t.restDayCalories;
      expect(Math.abs(plan.dailyTotals[d]!.calories - target) / target).toBeLessThan(0.08);
    }
    expect(plan.grocery.length).toBeGreaterThan(0);
    expect(plan.estimatedWeeklyCost).toBeGreaterThan(0);
  });
  it("refuses to drop below safe floor", () => {
    const small = TrainingProfile.parse({ sex: "female", age: 40, heightCm: 150, weightKg: 45, primaryGoal: "fat_loss", goals: ["fat_loss"], daysPerWeek: 1, sessionMinutes: 20 });
    const t = nutritionTargets(small, { weightTrendKgPerWeek: 0, adherencePct: 100 });
    expect(t.calories).toBeGreaterThanOrEqual(1200);
  });
});
