import { and, asc, desc, eq, gte } from "drizzle-orm";
import { db, nutritionPlan, mealPlan, recipe, bodyMeasurement, foodLog, healthSample, foodProduct } from "@kettleworth/db";
import { nutritionTargets, buildWeeklyMealPlan, parseDrink, drinkMacros, type RecipeInput, type DrinkOrder } from "@kettleworth/core";
import type { NutritionTargets, WeeklyMealPlan, MealSlot } from "@kettleworth/types";
import { getProfile } from "./profile";
import { getActiveProgramme } from "./programme";
import { mealPlanNote, estimateMeal, type FoodEstimateItem } from "../ai/tasks";
import { aiAvailable } from "../ai/client";

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

export type FoodSource = "manual" | "recipe" | "drink" | "barcode" | "photo" | "estimate";
export async function logFood(userId: string, entry: { loggedOn: string; slot: MealSlot; label: string; recipeId?: string | null; servings?: number; macros: { calories: number; proteinG: number; carbsG: number; fatG: number; fibreG: number }; source?: FoodSource; detail?: Record<string, unknown> | null }) {
  const [row] = await db().insert(foodLog).values({ userId, loggedOn: entry.loggedOn, slot: entry.slot, label: entry.label, recipeId: entry.recipeId ?? null, servings: entry.servings ?? 1, macros: entry.macros, source: entry.source ?? (entry.recipeId ? "recipe" : "manual"), detail: entry.detail ?? null }).returning();
  return row!;
}
export async function deleteFoodEntry(userId: string, id: string) {
  await db().delete(foodLog).where(and(eq(foodLog.id, id), eq(foodLog.userId, userId)));
}

export type EstimateResult = {
  source: "drink" | "estimate" | "photo";
  items: (FoodEstimateItem & { breakdown?: { label: string; calories: number }[] })[];
  note: string | null;
  /** More than 1 when the photo shows several identical portions; values are for one. */
  portionsVisible: number;
  drink?: DrinkOrder;
};

/**
 * The smart calorie meter. A clearly typed drink is calculated exactly and instantly from reference values. Anything
 * else, and every photo, goes to the itemised estimate. Nothing is logged here: the person confirms first.
 */
export async function estimateFood(userId: string, input: { text?: string; image?: { data: string; mediaType: "image/jpeg" | "image/png" | "image/webp" } }): Promise<EstimateResult> {
  if (!input.image && input.text) {
    const order = parseDrink(input.text);
    if (order) {
      const r = drinkMacros(order);
      return { source: "drink", drink: order, note: null, portionsVisible: 1, items: [{ name: r.label, portion: `${r.volumeMl} ml`, grams: null, calories: r.calories, proteinG: r.proteinG, carbsG: r.carbsG, fatG: r.fatG, fibreG: 0, confidence: "high", breakdown: r.breakdown }] };
    }
  }
  if (!aiAvailable()) throw new Error(input.image ? "Photo scanning is not available on this server. Try a barcode or describe it." : "Couldn't read that as a drink. Add it with calories below.");
  const out = await estimateMeal(userId, input);
  if (!out) throw new Error("Couldn't estimate that. Try describing it with a portion, like \"bowl of pasta with pesto\".");
  if (!out.recognised || !out.items.length) throw new Error(input.image ? "That doesn't look like food or drink. Try another angle, closer and in good light." : "Couldn't find food or drink in that.");
  return { source: input.image ? "photo" : "estimate", items: out.items, note: out.note, portionsVisible: out.portionsVisible ?? 1 };
}

export type BarcodeProduct = { barcode: string; name: string; brand: string | null; per100: { calories: number; proteinG: number; carbsG: number; fatG: number; fibreG: number; sugarG: number | null; saltG: number | null }; unit: "g" | "ml"; servingSize: number | null; servingLabel: string | null; imageUrl: string | null };
const DAY = 86400000;

/** Packaged food by barcode, from Open Food Facts, cached for 30 days (7 days for a miss). Label values, not estimates. */
export async function lookupBarcode(code: string): Promise<BarcodeProduct | null> {
  const barcode = code.replace(/\D/g, "");
  if (barcode.length < 8 || barcode.length > 14) throw new Error("That barcode doesn't look right");
  const [cached] = await db().select().from(foodProduct).where(eq(foodProduct.barcode, barcode)).limit(1);
  if (cached && Date.now() - cached.fetchedAt.getTime() < (cached.found ? 30 : 7) * DAY) return cached.found && cached.per100 ? toProduct(cached) : null;
  const res = await fetch(`https://world.openfoodfacts.org/api/v2/product/${barcode}.json?fields=product_name,product_name_en,brands,nutriments,serving_size,serving_quantity,serving_quantity_unit,product_quantity_unit,image_front_small_url`, { headers: { "User-Agent": "Kettleworth/1.0 (https://kettleworth.vercel.app)" }, signal: AbortSignal.timeout(8000) }).catch(() => null);
  if (!res || !res.ok) { if (cached) return cached.found && cached.per100 ? toProduct(cached) : null; throw new Error("The product database is unreachable right now. Try again in a moment."); }
  const j = (await res.json()) as { status: number; product?: Record<string, unknown> };
  const p = j.product; const n = (p?.nutriments ?? {}) as Record<string, number | undefined>;
  const kcal = n["energy-kcal_100g"] ?? (n["energy_100g"] != null ? n["energy_100g"]! / 4.184 : undefined);
  if (j.status !== 1 || !p || kcal == null) {
    await db().insert(foodProduct).values({ barcode, found: 0 }).onConflictDoUpdate({ target: foodProduct.barcode, set: { found: 0, fetchedAt: new Date() } });
    return null;
  }
  const servingLabel = (p.serving_size as string | undefined) ?? null;
  const unit: "g" | "ml" = (p.serving_quantity_unit as string | undefined)?.toLowerCase() === "ml" || (p.product_quantity_unit as string | undefined)?.toLowerCase() === "ml" || /\bml\b/i.test(servingLabel ?? "") ? "ml" : "g";
  const row = {
    barcode, found: 1, name: String(p.product_name_en || p.product_name || "Unnamed product").slice(0, 120), brand: p.brands ? String(p.brands).split(",")[0]!.trim().slice(0, 80) : null,
    per100: { calories: Math.round(kcal), proteinG: n.proteins_100g ?? 0, carbsG: n.carbohydrates_100g ?? 0, fatG: n.fat_100g ?? 0, fibreG: n.fiber_100g ?? 0, sugarG: n.sugars_100g ?? null, saltG: n.salt_100g ?? null },
    unit, servingSize: typeof p.serving_quantity === "number" ? p.serving_quantity : Number(p.serving_quantity) || null, servingLabel, imageUrl: (p.image_front_small_url as string | undefined) ?? null, fetchedAt: new Date(),
  };
  await db().insert(foodProduct).values(row).onConflictDoUpdate({ target: foodProduct.barcode, set: row });
  return toProduct(row);
}
function toProduct(r: { barcode: string; name: string | null; brand: string | null; per100: BarcodeProduct["per100"] | null; unit: "g" | "ml"; servingSize: number | null; servingLabel: string | null; imageUrl: string | null }): BarcodeProduct {
  return { barcode: r.barcode, name: r.name ?? "Unnamed product", brand: r.brand, per100: r.per100!, unit: r.unit, servingSize: r.servingSize, servingLabel: r.servingLabel, imageUrl: r.imageUrl };
}
export async function foodLogForDay(userId: string, loggedOn: string) {
  return db().select().from(foodLog).where(and(eq(foodLog.userId, userId), eq(foodLog.loggedOn, loggedOn))).orderBy(asc(foodLog.createdAt));
}
