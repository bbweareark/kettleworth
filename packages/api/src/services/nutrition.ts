import { and, asc, desc, eq, gte } from "drizzle-orm";
import { db, nutritionPlan, mealPlan, recipe, bodyMeasurement, foodLog, healthSample } from "@kettleworth/db";
import { nutritionTargets, buildWeeklyMealPlan, type RecipeInput } from "@kettleworth/core";
import type { NutritionTargets, WeeklyMealPlan, MealSlot } from "@kettleworth/types";
import { getProfile } from "./profile";
import { getActiveProgramme } from "./programme";
import { mealPlanNote } from "../ai/tasks";

const mondayOf = (d = new Date()) => { const x = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate())); const day = x.getUTCDay() || 7; x.setUTCDate(x.getUTCDate() - day + 1); return x.toISOString().slice(0, 10); };

async function measuredInputs(userId: string) {
  const since = new Date(Date.now() - 14 * 86400000);
  const kcal = await db().select({ v: healthSample.value }).from(healthSample).where(and(eq(healthSample.userId, userId), eq(healthSample.metric, "active_calories"), gte(healthSample.startAt, since)));
  const measuredActiveKcalPerDay = kcal.length >= 5 ? Math.round(kcal.reduce((a, r) => a + (r.v ?? 0), 0) / kcal.length) : null;
  const weights = await db().select().from(bodyMeasurement).where(and(eq(bodyMeasurement.userId, userId), gte(bodyMeasurement.measuredOn, since.toISOString().slice(0, 10)))).orderBy(asc(bodyMeasurement.measuredOn));
  let weightTrendKgPerWeek: number | null = null;
  const w = weights.filter((x) => x.weightKg != null);
  if (w.length >= 3) {
    const first = w[0]!, last = w[w.length - 1]!;
    const days = (new Date(last.measuredOn).getTime() - new Date(first.measuredOn).getTime()) / 86400000;
    if (days >= 7) weightTrendKgPerWeek = ((last.weightKg! - first.weightKg!) / days) * 7;
  }
  return { measuredActiveKcalPerDay, weightTrendKgPerWeek, adherencePct: null };
}

export async function ensureNutritionPlan(userId: string, opts: { force?: boolean; reason?: string } = {}): Promise<{ targets: NutritionTargets; createdAt: Date }> {
  const [existing] = await db().select().from(nutritionPlan).where(and(eq(nutritionPlan.userId, userId), eq(nutritionPlan.status, "active"))).orderBy(desc(nutritionPlan.createdAt)).limit(1);
  if (existing && !opts.force) return { targets: existing.targets, createdAt: existing.createdAt };
  const rec = await getProfile(userId);
  if (!rec) throw new Error("No profile");
  const targets = nutritionTargets(rec.profile, await measuredInputs(userId));
  await db().update(nutritionPlan).set({ status: "superseded" }).where(and(eq(nutritionPlan.userId, userId), eq(nutritionPlan.status, "active")));
  const [row] = await db().insert(nutritionPlan).values({ userId, targets, reason: opts.reason ?? (existing ? "recalculated" : "initial") }).returning();
  return { targets, createdAt: row!.createdAt };
}

export async function getOrBuildMealPlan(userId: string, weekStartsOn = mondayOf(), opts: { force?: boolean } = {}): Promise<{ plan: WeeklyMealPlan; coachNote: string | null; weekStartsOn: string; recipes: Record<string, typeof recipe.$inferSelect> }> {
  const [existing] = await db().select().from(mealPlan).where(and(eq(mealPlan.userId, userId), eq(mealPlan.weekStartsOn, weekStartsOn))).limit(1);
  const allRecipes = await db().select().from(recipe);
  const byId = Object.fromEntries(allRecipes.map((r) => [r.id, r]));
  if (existing && !opts.force) return { plan: existing.plan, coachNote: existing.coachNote, weekStartsOn, recipes: byId };
  const rec = await getProfile(userId);
  if (!rec) throw new Error("No profile");
  const { targets } = await ensureNutritionPlan(userId);
  const prog = await getActiveProgramme(userId);
  const trainingDays = prog ? ({ 1: [0], 2: [0, 3], 3: [0, 2, 4], 4: [0, 1, 3, 4], 5: [0, 1, 2, 4, 5], 6: [0, 1, 2, 3, 4, 5], 7: [0, 1, 2, 3, 4, 5, 6] } as Record<number, number[]>)[prog.daysPerWeek] : [];
  const inputs: RecipeInput[] = allRecipes.map((r) => ({ id: r.id, name: r.name, slots: r.slots, dietTypes: r.dietTypes, allergens: r.allergens, prepMinutes: r.prepMinutes, costTier: r.costTier, macros: r.macros, ingredients: r.ingredients, tags: r.tags }));
  const plan = buildWeeklyMealPlan(rec.profile, targets, inputs, { seed: `${userId}:${weekStartsOn}`, currency: "GBP", trainingDays });
  const note = await mealPlanNote(userId, rec.profile, targets, plan, Object.fromEntries(allRecipes.map((r) => [r.id, r.name])));
  if (existing) await db().update(mealPlan).set({ plan, coachNote: note }).where(eq(mealPlan.id, existing.id));
  else await db().insert(mealPlan).values({ userId, weekStartsOn, plan, coachNote: note });
  return { plan, coachNote: note, weekStartsOn, recipes: byId };
}

export async function swapMeal(userId: string, weekStartsOn: string, day: number, slot: MealSlot, toRecipeId: string) {
  const [existing] = await db().select().from(mealPlan).where(and(eq(mealPlan.userId, userId), eq(mealPlan.weekStartsOn, weekStartsOn))).limit(1);
  if (!existing) throw new Error("No meal plan");
  const [r] = await db().select().from(recipe).where(eq(recipe.id, toRecipeId)).limit(1);
  if (!r) throw new Error("Unknown recipe");
  const items = existing.plan.items.map((it) => (it.day === day && it.slot === slot ? { ...it, recipeId: r.id, macros: scale(r.macros, it.servings) } : it));
  const allRecipes = await db().select().from(recipe);
  const { aggregateGrocery } = await import("@kettleworth/core");
  const grocery = aggregateGrocery(items, allRecipes.map((x) => ({ id: x.id, name: x.name, slots: x.slots, dietTypes: x.dietTypes, allergens: x.allergens, prepMinutes: x.prepMinutes, costTier: x.costTier, macros: x.macros, ingredients: x.ingredients, tags: x.tags })));
  const dailyTotals = Array.from({ length: 7 }, (_, d) => items.filter((i) => i.day === d).reduce((a, i) => ({ calories: a.calories + i.macros.calories, proteinG: a.proteinG + i.macros.proteinG, carbsG: a.carbsG + i.macros.carbsG, fatG: a.fatG + i.macros.fatG, fibreG: a.fibreG + i.macros.fibreG }), { calories: 0, proteinG: 0, carbsG: 0, fatG: 0, fibreG: 0 }));
  const plan: WeeklyMealPlan = { ...existing.plan, items, grocery, dailyTotals, estimatedWeeklyCost: Math.round(grocery.reduce((a, g) => a + g.estimatedCost, 0) * 100) / 100 };
  await db().update(mealPlan).set({ plan }).where(eq(mealPlan.id, existing.id));
  return plan;
}
const scale = (m: { calories: number; proteinG: number; carbsG: number; fatG: number; fibreG: number }, s: number) => ({ calories: Math.round(m.calories * s), proteinG: Math.round(m.proteinG * s), carbsG: Math.round(m.carbsG * s), fatG: Math.round(m.fatG * s), fibreG: Math.round(m.fibreG * s) });

export async function listRecipesFor(userId: string, slot?: MealSlot) {
  const rec = await getProfile(userId);
  const all = await db().select().from(recipe);
  if (!rec) return all;
  const { recipeAllowed } = await import("@kettleworth/core");
  return all.filter((r) => recipeAllowed({ id: r.id, name: r.name, slots: r.slots, dietTypes: r.dietTypes, allergens: r.allergens, prepMinutes: r.prepMinutes, costTier: r.costTier, macros: r.macros, ingredients: r.ingredients, tags: r.tags }, rec.profile) && (!slot || r.slots.includes(slot)));
}

export async function logFood(userId: string, entry: { loggedOn: string; slot: MealSlot; label: string; recipeId?: string | null; servings?: number; macros: { calories: number; proteinG: number; carbsG: number; fatG: number; fibreG: number } }) {
  const [row] = await db().insert(foodLog).values({ userId, loggedOn: entry.loggedOn, slot: entry.slot, label: entry.label, recipeId: entry.recipeId ?? null, servings: entry.servings ?? 1, macros: entry.macros }).returning();
  return row!;
}
export async function foodLogForDay(userId: string, loggedOn: string) {
  return db().select().from(foodLog).where(and(eq(foodLog.userId, userId), eq(foodLog.loggedOn, loggedOn))).orderBy(asc(foodLog.createdAt));
}
