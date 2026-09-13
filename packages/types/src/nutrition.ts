import { z } from "zod";

export const MealSlot = z.enum(["breakfast", "lunch", "dinner", "snack", "pre_workout", "post_workout"]);
export type MealSlot = z.infer<typeof MealSlot>;

export const NutritionTargets = z.object({
  calories: z.number().int(),
  proteinG: z.number().int(),
  carbsG: z.number().int(),
  fatG: z.number().int(),
  fibreG: z.number().int(),
  waterMl: z.number().int(),
  trainingDayCalories: z.number().int(),
  restDayCalories: z.number().int(),
  rationale: z.array(z.string()),
  warnings: z.array(z.string()),
});
export type NutritionTargets = z.infer<typeof NutritionTargets>;

export const RecipeMacros = z.object({
  calories: z.number(),
  proteinG: z.number(),
  carbsG: z.number(),
  fatG: z.number(),
  fibreG: z.number(),
});
export type RecipeMacros = z.infer<typeof RecipeMacros>;

export const MealPlanItem = z.object({
  day: z.number().int().min(0).max(6),
  slot: MealSlot,
  recipeId: z.string(),
  servings: z.number(),
  macros: RecipeMacros,
});
export type MealPlanItem = z.infer<typeof MealPlanItem>;

export const GroceryLine = z.object({
  ingredient: z.string(),
  quantity: z.number(),
  unit: z.string(),
  estimatedCost: z.number(),
  aisle: z.string(),
});
export type GroceryLine = z.infer<typeof GroceryLine>;

export const WeeklyMealPlan = z.object({
  items: z.array(MealPlanItem),
  dailyTotals: z.array(RecipeMacros),
  grocery: z.array(GroceryLine),
  estimatedWeeklyCost: z.number(),
  currency: z.string(),
  rationale: z.array(z.string()),
});
export type WeeklyMealPlan = z.infer<typeof WeeklyMealPlan>;
