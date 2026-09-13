import type { TrainingProfile, NutritionTargets, WeeklyMealPlan, MealPlanItem, RecipeMacros, GroceryLine, MealSlot, DietType, Allergen } from "@kettleworth/types";
import { seededRandom, hashString } from "../rng";

export type RecipeInput = {
  id: string;
  name: string;
  slots: MealSlot[];
  dietTypes: DietType[];
  allergens: Allergen[];
  prepMinutes: number;
  costTier: "low" | "medium" | "high";
  macros: RecipeMacros; // per serving
  ingredients: { name: string; quantity: number; unit: string; aisle: string; costPerUnit: number }[];
  tags: string[];
};

const SLOT_SHARE: Record<MealSlot, number> = { breakfast: 0.25, lunch: 0.3, dinner: 0.35, snack: 0.1, pre_workout: 0.08, post_workout: 0.12 };
const TIER_RANK = { low: 0, medium: 1, high: 2 } as const;

export function recipeAllowed(r: RecipeInput, profile: TrainingProfile): boolean {
  if (!r.dietTypes.includes(profile.dietType)) return false;
  if (r.allergens.some((a) => profile.allergens.includes(a))) return false;
  if (r.prepMinutes > profile.cookingMinutes) return false;
  if (TIER_RANK[r.costTier] > TIER_RANK[profile.budgetTier]) return false;
  const lower = profile.dislikedFoods.map((f) => f.toLowerCase());
  if (lower.some((f) => r.name.toLowerCase().includes(f) || r.ingredients.some((i) => i.name.toLowerCase().includes(f)))) return false;
  return true;
}

export function buildWeeklyMealPlan(profile: TrainingProfile, targets: NutritionTargets, recipes: RecipeInput[], opts: { seed?: string; currency?: string; trainingDays?: number[] } = {}): WeeklyMealPlan {
  const rnd = seededRandom(hashString(opts.seed ?? "meals"));
  const allowed = recipes.filter((r) => recipeAllowed(r, profile));
  const rationale: string[] = [];
  const slots: MealSlot[] = ["breakfast", "lunch", "dinner", "snack"];
  const items: MealPlanItem[] = [];
  const dailyTotals: RecipeMacros[] = [];
  const recentUse = new Map<string, number>();
  const trainingDays = new Set(opts.trainingDays ?? []);

  for (let day = 0; day < 7; day++) {
    const dayTarget = trainingDays.has(day) ? targets.trainingDayCalories : targets.restDayCalories;
    const chosen: { slot: MealSlot; r: RecipeInput }[] = [];
    for (const slot of slots) {
      const pool = allowed.filter((r) => r.slots.includes(slot));
      if (!pool.length) continue;
      // Prefer recipes whose macro split resembles the target split, so scaling by calories doesn't overshoot protein or fat.
      const tCarb = (targets.carbsG * 4) / Math.max(1, targets.calories), tFat = (targets.fatG * 9) / Math.max(1, targets.calories);
      const fit = (r: RecipeInput) => { const c = (r.macros.carbsG * 4) / Math.max(1, r.macros.calories), f = (r.macros.fatG * 9) / Math.max(1, r.macros.calories); return -6 * (Math.abs(c - tCarb) + Math.abs(f - tFat)); };
      const scored = pool.map((r) => ({ r, s: rnd() * 2 - (recentUse.get(r.id) ?? 0) * 3 + (r.tags.includes("high_protein") ? 0.5 : 0) + fit(r) }));
      scored.sort((a, b) => b.s - a.s);
      const r = scored[0]!.r;
      chosen.push({ slot, r });
      recentUse.set(r.id, day + 1);
    }
    for (const [id, d] of recentUse) if (day + 1 - d > 2) recentUse.delete(id);
    // Scale main meals so the day lands within ±5% of target after a fixed snack; add an extra snack if still short.
    const snacks = chosen.filter((c) => c.slot === "snack");
    const mains = chosen.filter((c) => c.slot !== "snack");
    const snackCals = snacks.reduce((a, c) => a + c.r.macros.calories, 0);
    const mainBase = mains.reduce((a, c) => a + c.r.macros.calories, 0);
    const scalar = mainBase ? Math.max(0.6, Math.min(2.5, (dayTarget - snackCals) / mainBase)) : 1;
    const tot: RecipeMacros = { calories: 0, proteinG: 0, carbsG: 0, fatG: 0, fibreG: 0 };
    const push = (slot: MealSlot, r: RecipeInput, servings: number) => {
      const m = scale(r.macros, servings);
      items.push({ day, slot, recipeId: r.id, servings, macros: m });
      tot.calories += m.calories; tot.proteinG += m.proteinG; tot.carbsG += m.carbsG; tot.fatG += m.fatG; tot.fibreG += m.fibreG;
    };
    for (const c of mains) push(c.slot, c.r, Math.round(scalar * 4) / 4);
    for (const c of snacks) push(c.slot, c.r, 1);
    const shortfall = dayTarget - tot.calories;
    if (shortfall / dayTarget > 0.06) {
      const pool = allowed.filter((r) => r.slots.includes("snack") || r.slots.includes("post_workout"));
      if (pool.length) {
        const extra = pool[Math.floor(rnd() * pool.length)]!;
        push(trainingDays.has(day) ? "post_workout" : "snack", extra, Math.max(0.5, Math.min(3, Math.round((shortfall / extra.macros.calories) * 4) / 4)));
      }
    }
    dailyTotals.push(roundMacros(tot));
  }

  const grocery = aggregateGrocery(items, recipes);
  const estimatedWeeklyCost = Math.round(grocery.reduce((a, g) => a + g.estimatedCost, 0) * 100) / 100;
  rationale.push(`${allowed.length} of ${recipes.length} recipes fit your ${profile.dietType} diet, allergies, ${profile.cookingMinutes}-minute cooking limit and ${profile.budgetTier} budget.`);
  rationale.push(`Portions are scaled so each day lands near ${targets.calories} kcal (${targets.trainingDayCalories} on training days) with protein first.`);
  if (allowed.length < 8) rationale.push("Your constraints are tight, so meals repeat more often. Loosening cooking time or budget adds variety.");
  return { items, dailyTotals, grocery, estimatedWeeklyCost, currency: opts.currency ?? "GBP", rationale };
}

function scale(m: RecipeMacros, s: number): RecipeMacros {
  return roundMacros({ calories: m.calories * s, proteinG: m.proteinG * s, carbsG: m.carbsG * s, fatG: m.fatG * s, fibreG: m.fibreG * s });
}
function roundMacros(m: RecipeMacros): RecipeMacros {
  return { calories: Math.round(m.calories), proteinG: Math.round(m.proteinG), carbsG: Math.round(m.carbsG), fatG: Math.round(m.fatG), fibreG: Math.round(m.fibreG) };
}

export function aggregateGrocery(items: MealPlanItem[], recipes: RecipeInput[]): GroceryLine[] {
  const byId = new Map(recipes.map((r) => [r.id, r]));
  const agg = new Map<string, GroceryLine>();
  for (const it of items) {
    const r = byId.get(it.recipeId);
    if (!r) continue;
    for (const ing of r.ingredients) {
      const key = `${ing.name}|${ing.unit}`;
      const q = ing.quantity * it.servings;
      const line = agg.get(key) ?? { ingredient: ing.name, quantity: 0, unit: ing.unit, estimatedCost: 0, aisle: ing.aisle };
      line.quantity += q;
      line.estimatedCost += q * ing.costPerUnit;
      agg.set(key, line);
    }
  }
  return [...agg.values()].map((l) => ({ ...l, quantity: Math.round(l.quantity * 10) / 10, estimatedCost: Math.round(l.estimatedCost * 100) / 100 })).sort((a, b) => a.aisle.localeCompare(b.aisle) || a.ingredient.localeCompare(b.ingredient));
}
