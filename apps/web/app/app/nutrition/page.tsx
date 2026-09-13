import { redirect } from "next/navigation";
import { AlertTriangle } from "lucide-react";
import { requireUser } from "@/lib/session";
import { getProfile, ensureNutritionPlan, getOrBuildMealPlan, foodLogForDay } from "@kettleworth/api";
import { Card, CardContent, Stat } from "@kettleworth/ui";
import { MealPlanView } from "@/components/nutrition/meal-plan";
import { FoodLogView } from "@/components/nutrition/food-log";

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
    <div className="space-y-6">
      <div><p className="eyebrow">Nutrition</p><h1 className="font-display text-3xl font-semibold tracking-tighter md:text-4xl">Fuel that matches the training.</h1></div>
      {t.warnings.length ? <div className="flex items-start gap-2 rounded-lg border border-amber/40 bg-amber-soft p-3 text-sm"><AlertTriangle className="mt-0.5 size-4 shrink-0 text-amber" /><div>{t.warnings.map((w) => <p key={w}>{w}</p>)}</div></div> : null}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <Card><CardContent><Stat label="Calories" value={t.calories} unit="kcal" hint={`${t.trainingDayCalories} train · ${t.restDayCalories} rest`} /></CardContent></Card>
        <Card><CardContent><Stat label="Protein" value={t.proteinG} unit="g" /></CardContent></Card>
        <Card><CardContent><Stat label="Carbs" value={t.carbsG} unit="g" /></CardContent></Card>
        <Card><CardContent><Stat label="Fat" value={t.fatG} unit="g" /></CardContent></Card>
        <Card><CardContent><Stat label="Water" value={(t.waterMl / 1000).toFixed(1)} unit="L" hint={`${t.fibreG} g fibre`} /></CardContent></Card>
      </div>
      <details className="rounded-lg bg-surface-2 p-4"><summary className="cursor-pointer text-sm font-medium text-ember">Why these numbers?</summary><ul className="mt-2 space-y-1.5 text-sm text-fg-muted">{t.rationale.map((r) => <li key={r} className="flex gap-2"><span className="mt-2 size-1 shrink-0 rounded-full bg-ember" />{r}</li>)}</ul></details>
      <MealPlanView initial={{ weekStartsOn: mp.weekStartsOn, plan: mp.plan, coachNote: mp.coachNote }} recipes={Object.fromEntries(Object.values(mp.recipes).map((r) => [r.id, { id: r.id, name: r.name, description: r.description, prepMinutes: r.prepMinutes, steps: r.steps, ingredients: r.ingredients, macros: r.macros, tags: r.tags }]))} targets={t} />
      <FoodLogView date={today} initial={log.map((l) => ({ id: l.id, slot: l.slot, label: l.label, macros: l.macros, servings: l.servings }))} targets={t} recipes={Object.values(mp.recipes).map((r) => ({ id: r.id, name: r.name, macros: r.macros }))} />
      <p className="text-xs text-fg-subtle">Kettleworth gives general nutrition guidance, not medical advice. If you have a medical condition, are pregnant, or have a history of disordered eating, please work with a registered dietitian.</p>
    </div>
  );
}
