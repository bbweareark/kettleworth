import { redirect } from "next/navigation";
import { AlertTriangle } from "lucide-react";
import { requireUser } from "@/lib/session";
import { getProfile, ensureNutritionPlan, getOrBuildMealPlan, foodLogForDay } from "@kettleworth/api";
import { Card, CardContent, Stat } from "@kettleworth/ui";
import { MealPlanView } from "@/components/nutrition/meal-plan";
import { FoodLogView } from "@/components/nutrition/food-log";
import { MacroRings } from "@/components/nutrition/macro-rings";
import { AppStack } from "@/components/app/stack";

export const metadata = { title: "Nutrition" };
export const dynamic = "force-dynamic";

export default async function Nutrition() {
  const user = await requireUser();
  const rec = await getProfile(user.id);
  if (!rec?.onboardingCompletedAt) redirect("/app/onboarding");
  const { targets } = await ensureNutritionPlan(user.id);
  const today = new Date().toISOString().slice(0, 10);
  const [mp, log] = await Promise.all([getOrBuildMealPlan(user.id), foodLogForDay(user.id, today)]);
  const t = targets;
  return (
    <AppStack>
      <div><p className="eyebrow">Nutrition</p><h1 className="font-display text-3xl tracking-tighter md:text-4xl">Fuel that matches the training.</h1></div>
      {t.warnings.length ? <div className="flex items-start gap-2 border border-ember/40 p-3 text-sm"><AlertTriangle className="mt-0.5 size-4 shrink-0 text-ember" /><div>{t.warnings.map((w) => <p key={w}>{w}</p>)}</div></div> : null}
      {/*
        The photograph is its own 1:1 cell, not a backdrop for the figures. Laying small grey
        type over it measured 3.7:1 at the scrim's weakest point even after strengthening it,
        under the 4.5 the gate requires, and the DNA frames images 1:1 and unframed anyway.
      */}
      <section className="grid gap-6 md:grid-cols-[1fr_16rem] md:items-start">
        <div className="min-w-0">
          <MacroRings targets={t} logged={log.reduce((a, l) => ({ calories: a.calories + l.macros.calories, proteinG: a.proteinG + l.macros.proteinG, carbsG: a.carbsG + l.macros.carbsG, fatG: a.fatG + l.macros.fatG }), { calories: 0, proteinG: 0, carbsG: 0, fatG: 0 })} />
          <div className="mt-4 grid grid-cols-3 gap-3 sm:gap-4">
            {[["Train day", t.trainingDayCalories, "kcal"], ["Rest day", t.restDayCalories, "kcal"], ["Water", (t.waterMl / 1000).toFixed(1), "L"]].map(([l, v, u]) => (<div key={l as string}><div className="meta">{l as string}</div><div className="whitespace-nowrap font-display text-2xl tabular sm:text-3xl">{v as number}<span className="ml-0.5 text-xs font-normal tracking-normal text-fg-muted sm:text-sm">{u as string}</span></div></div>))}
          </div>
          <details className="mt-3 text-xs text-fg-muted"><summary className="cursor-pointer text-ember">Why these numbers</summary><ul className="mt-2 space-y-1 text-fg-muted">{t.rationale.map((r) => <li key={r}>{r}</li>)}</ul></details>
        </div>
        <img src="/art/nutrition.jpg" alt="" aria-hidden className="aspect-square w-full object-cover" />
      </section>
      <FoodLogView date={today} initial={log.map((l) => ({ id: l.id, slot: l.slot, label: l.label, macros: l.macros, servings: l.servings, source: l.source as "manual" }))} targets={t} recipes={Object.values(mp.recipes).map((r) => ({ id: r.id, name: r.name, macros: r.macros }))} />
      <MealPlanView initial={{ weekStartsOn: mp.weekStartsOn, plan: mp.plan, coachNote: mp.coachNote }} recipes={Object.fromEntries(Object.values(mp.recipes).map((r) => [r.id, { id: r.id, name: r.name, description: r.description, prepMinutes: r.prepMinutes, steps: r.steps, ingredients: r.ingredients, macros: r.macros, tags: r.tags }]))} targets={t} />
      <p className="text-xs text-fg-subtle">Kettleworth gives general nutrition guidance, not medical advice. If you have a medical condition, are pregnant, or have a history of disordered eating, please work with a registered dietitian.</p>
    </AppStack>
  );
}
