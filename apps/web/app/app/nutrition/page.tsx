import { redirect } from "next/navigation";
import { AlertTriangle } from "lucide-react";
import { requireUser } from "@/lib/session";
import { getProfile, ensureNutritionPlan, getOrBuildMealPlan, foodLogForDay } from "@kettleworth/api";
import { Readout, ReadoutRow } from "@kettleworth/ui";
import { MealPlanView } from "@/components/nutrition/meal-plan";
import { FoodLogView } from "@/components/nutrition/food-log";
import { MacroRings } from "@/components/nutrition/macro-rings";
import { Screen } from "@/components/app/screen";
import { ScreenHero } from "@/components/app/hero";
import { ART } from "@/lib/art";

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
  const eaten = log.reduce(
    (a, l) => ({ calories: a.calories + l.macros.calories, proteinG: a.proteinG + l.macros.proteinG, carbsG: a.carbsG + l.macros.carbsG, fatG: a.fatG + l.macros.fatG }),
    { calories: 0, proteinG: 0, carbsG: 0, fatG: 0 },
  );

  /*
   * The one number here, from design/SECTION-MAP.md: calories remaining today. Not the target
   * - the target is a fact you can read once and forget. What you want at 6pm is how much is
   * left, and it is the only figure on this screen that changes during the day.
   */
  const left = t.calories - eaten.calories;
  const proteinLeft = Math.max(0, t.proteinG - eaten.proteinG);
  const second =
    log.length === 0
      ? "Nothing logged yet today."
      : left >= 0
        ? `${Math.round(proteinLeft)} g of protein still to go.`
        : `${Math.abs(Math.round(left))} kcal over. Tomorrow is a new day.`;

  return (
    <Screen flush>
      <ScreenHero
        art={ART.nutrition}
        priority
        eyebrow="Nutrition · today"
        label="Calories remaining"
        value={left}
        unit="kcal"
        second={second}
      />

      {t.warnings.length ? (
        <div className="flex items-start gap-2.5 rounded-lg border border-rule-strong bg-surface p-4 text-sm">
          <AlertTriangle className="mt-0.5 size-4 shrink-0 text-volt" aria-hidden />
          <div className="measure">{t.warnings.map((w) => <p key={w}>{w}</p>)}</div>
        </div>
      ) : null}

      <ReadoutRow className="border-t-0 pt-0">
        <Readout label="Target" value={t.calories} unit="kcal" note={`${t.proteinG} g protein`} />
        <Readout label="Train day" value={t.trainingDayCalories} unit="kcal" />
        <Readout label="Rest day" value={t.restDayCalories} unit="kcal" />
        <Readout label="Water" value={(t.waterMl / 1000).toFixed(1)} unit="L" />
      </ReadoutRow>

      <section className="border-t border-rule pt-4">
        <h2 className="font-display text-xl">Where today stands.</h2>
        <div className="mt-4">
          <MacroRings targets={t} logged={eaten} />
        </div>
        <details className="mt-4 text-xs">
          <summary className="cursor-pointer text-fg-muted transition-colors hover:text-fg">Why these numbers</summary>
          <ul className="measure mt-2 space-y-1 text-fg-subtle">{t.rationale.map((r) => <li key={r}>{r}</li>)}</ul>
        </details>
      </section>

      <FoodLogView date={today} initial={log.map((l) => ({ id: l.id, slot: l.slot, label: l.label, macros: l.macros, servings: l.servings, source: l.source as "manual" }))} targets={t} recipes={Object.values(mp.recipes).map((r) => ({ id: r.id, name: r.name, macros: r.macros }))} />

      <MealPlanView initial={{ weekStartsOn: mp.weekStartsOn, plan: mp.plan, coachNote: mp.coachNote }} recipes={Object.fromEntries(Object.values(mp.recipes).map((r) => [r.id, { id: r.id, name: r.name, description: r.description, prepMinutes: r.prepMinutes, steps: r.steps, ingredients: r.ingredients, macros: r.macros, tags: r.tags }]))} targets={t} />

      <p className="measure text-xs text-fg-subtle">Kettleworth gives general nutrition guidance, not medical advice. If you have a medical condition, are pregnant, or have a history of disordered eating, please work with a registered dietitian.</p>
    </Screen>
  );
}
