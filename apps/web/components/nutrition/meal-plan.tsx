"use client";
import { useMemo, useState } from "react";
import { RefreshCw, Repeat, ShoppingBasket, Clock } from "lucide-react";
import type { WeeklyMealPlan, NutritionTargets, MealSlot, RecipeMacros } from "@kettleworth/types";
import { Badge, Button, Card, CardContent, Chip, ChipGroup, Progress, Sheet, SheetContent, toast, cn } from "@kettleworth/ui";

type Recipe = { id: string; name: string; description: string; prepMinutes: number; steps: string[]; ingredients: { name: string; quantity: number; unit: string }[]; macros: RecipeMacros; tags: string[] };
const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const SLOT_ORDER: MealSlot[] = ["breakfast", "pre_workout", "lunch", "post_workout", "snack", "dinner"];

export function MealPlanView({ initial, recipes, targets }: { initial: { weekStartsOn: string; plan: WeeklyMealPlan; coachNote: string | null }; recipes: Record<string, Recipe>; targets: NutritionTargets }) {
  const [state, setState] = useState(initial);
  const [day, setDay] = useState(Math.min(6, (new Date().getDay() + 6) % 7));
  const [open, setOpen] = useState<Recipe | null>(null);
  const [swap, setSwap] = useState<{ day: number; slot: MealSlot } | null>(null);
  const [grocery, setGrocery] = useState(false);
  const [busy, setBusy] = useState(false);
  const items = useMemo(() => state.plan.items.filter((i) => i.day === day).sort((a, b) => SLOT_ORDER.indexOf(a.slot) - SLOT_ORDER.indexOf(b.slot)), [state, day]);
  const tot = state.plan.dailyTotals[day]!;
  async function regenerate() { setBusy(true); const r = await fetch("/api/nutrition/mealplan", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ weekStartsOn: state.weekStartsOn, force: true }) }); setBusy(false); if (!r.ok) return toast.error("Couldn't rebuild"); setState(await r.json()); toast.success("New week planned"); }
  return (
    <Card><CardContent className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3"><div><h2 className="font-display text-lg font-semibold">This week's meals</h2><p className="text-xs text-fg-subtle">Week of {new Date(state.weekStartsOn).toLocaleDateString("en-GB", { day: "numeric", month: "short" })} · est. £{state.plan.estimatedWeeklyCost.toFixed(2)} groceries</p></div><div className="flex gap-2"><Button variant="secondary" size="sm" onClick={() => setGrocery(true)}><ShoppingBasket /> Grocery list</Button><Button variant="ghost" size="sm" onClick={regenerate} loading={busy}><RefreshCw /> Rebuild</Button></div></div>
      {state.coachNote ? <details className="text-sm text-fg-muted"><summary className="cursor-pointer text-xs uppercase tracking-[0.16em] text-fg-subtle">Coach note</summary><p className="mt-2">{state.coachNote}</p></details> : null}
      <ChipGroup role="tablist">{DAYS.map((d, i) => <Chip key={d} role="tab" aria-selected={day === i} selected={day === i} onClick={() => setDay(i)} className="h-8 px-3 text-xs">{d}</Chip>)}</ChipGroup>
      <div className="grid gap-3 sm:grid-cols-4"><MacroBar label="kcal" value={tot.calories} target={targets.calories} /><MacroBar label="protein" value={tot.proteinG} target={targets.proteinG} unit="g" /><MacroBar label="carbs" value={tot.carbsG} target={targets.carbsG} unit="g" /><MacroBar label="fat" value={tot.fatG} target={targets.fatG} unit="g" /></div>
      <ul className="space-y-2">{items.map((it) => { const r = recipes[it.recipeId]; if (!r) return null; return (
        <li key={`${it.day}-${it.slot}-${it.recipeId}`} className="flex items-center gap-4 border-b border-border py-3 last:border-0">
          <span className={cn("size-10 shrink-0 rounded-lg", { breakfast: "bg-amber/40", lunch: "bg-sky/40", dinner: "bg-ember/40", snack: "bg-signal/40", pre_workout: "bg-signal/30", post_workout: "bg-ember/30" }[it.slot])} aria-hidden />
          <div className="min-w-0 flex-1"><div className="text-2xs uppercase tracking-[0.16em] text-fg-subtle">{it.slot.replace("_", " ")}{it.servings !== 1 ? ` · ${it.servings}×` : ""}</div><button type="button" onClick={() => setOpen(r)} className="truncate text-left text-base font-medium hover:text-ember">{r.name}</button></div>
          <div className="text-right"><div className="font-display text-xl font-semibold tabular tracking-tighter">{it.macros.calories}</div><div className="text-2xs uppercase tracking-[0.16em] text-fg-subtle">{it.macros.proteinG}P · {r.prepMinutes}m</div></div>
          <Button size="icon-sm" variant="ghost" aria-label={`Swap ${r.name}`} onClick={() => setSwap({ day: it.day, slot: it.slot })}><Repeat /></Button>
        </li>); })}</ul>
      <details><summary className="cursor-pointer text-sm text-fg-muted">Why this plan?</summary><ul className="mt-2 space-y-1 text-sm text-fg-muted">{state.plan.rationale.map((r) => <li key={r}>{r}</li>)}</ul></details>
      <Sheet open={!!open} onOpenChange={(o) => !o && setOpen(null)}><SheetContent title={open?.name ?? ""} description={open?.description}>{open && (<div className="space-y-4 text-sm"><div className="flex flex-wrap gap-1.5">{open.tags.map((t) => <Badge key={t} tone="outline">{t.replace("_", " ")}</Badge>)}<Badge tone="ember">{open.macros.calories} kcal</Badge><Badge tone="outline">{open.macros.proteinG}P · {open.macros.carbsG}C · {open.macros.fatG}F</Badge></div><div><div className="eyebrow mb-1">Ingredients (per serving)</div><ul className="space-y-1 text-fg-muted">{open.ingredients.map((i) => <li key={i.name}>{i.quantity} {i.unit} {i.name}</li>)}</ul></div><div><div className="eyebrow mb-1">Method</div><ol className="list-decimal space-y-1 pl-5 text-fg-muted">{open.steps.map((s, i) => <li key={i}>{s}</li>)}</ol></div></div>)}</SheetContent></Sheet>
      <Sheet open={!!swap} onOpenChange={(o) => !o && setSwap(null)}><SheetContent title="Swap meal" description="Options that fit your diet, allergies, budget and cooking time.">{swap && <SwapList slot={swap.slot} onPick={async (id) => { const r = await fetch("/api/nutrition/swap", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ weekStartsOn: state.weekStartsOn, day: swap.day, slot: swap.slot, toRecipeId: id }) }); if (!r.ok) return toast.error("Couldn't swap"); const plan: WeeklyMealPlan = await r.json(); setState((s) => ({ ...s, plan })); setSwap(null); }} />}</SheetContent></Sheet>
      <Sheet open={grocery} onOpenChange={setGrocery}><SheetContent title="Grocery list" description={`Everything for the week · est. £${state.plan.estimatedWeeklyCost.toFixed(2)}`}><GroceryList lines={state.plan.grocery} /></SheetContent></Sheet>
    </CardContent></Card>
  );
}
function MacroBar({ label, value, target, unit = "" }: { label: string; value: number; target: number; unit?: string }) {
  const pct = target ? (value / target) * 100 : 0;
  return (<div><div className="mb-1 flex justify-between text-xs"><span className="capitalize text-fg-subtle">{label}</span><span className="tabular">{value}{unit} <span className="text-fg-subtle">/ {target}{unit}</span></span></div><Progress value={Math.min(100, pct)} tone={pct > 110 ? "amber" : pct < 85 ? "amber" : "signal"} /></div>);
}
function SwapList({ slot, onPick }: { slot: MealSlot; onPick: (id: string) => void }) {
  const [list, setList] = useState<{ id: string; name: string; prepMinutes: number; macros: RecipeMacros }[] | null>(null);
  useMemo(() => { fetch(`/api/nutrition/recipes?slot=${slot}`).then((r) => r.json()).then(setList).catch(() => setList([])); }, [slot]);
  if (!list) return <p className="text-sm text-fg-subtle">Loading…</p>;
  return <ul className="space-y-2">{list.map((r) => <li key={r.id}><button type="button" onClick={() => onPick(r.id)} className="flex w-full items-center justify-between rounded-lg border border-border p-3 text-left hover:border-border-strong"><span><span className="block font-medium">{r.name}</span><span className="text-xs text-fg-subtle">{r.macros.calories} kcal · {r.macros.proteinG} g protein · {r.prepMinutes} min</span></span></button></li>)}</ul>;
}
function GroceryList({ lines }: { lines: WeeklyMealPlan["grocery"] }) {
  const [checked, setChecked] = useState<Set<string>>(new Set());
  const byAisle = lines.reduce<Record<string, typeof lines>>((a, l) => { (a[l.aisle] ??= []).push(l); return a; }, {});
  return (<div className="space-y-4">{Object.entries(byAisle).map(([aisle, ls]) => (<div key={aisle}><div className="eyebrow mb-1 capitalize">{aisle}</div><ul className="space-y-1">{ls.map((l) => { const k = `${l.ingredient}|${l.unit}`; const on = checked.has(k); return (<li key={k}><label className={cn("flex cursor-pointer items-center gap-3 rounded-md px-2 py-1.5 text-sm hover:bg-surface-2", on && "text-fg-subtle line-through")}><input type="checkbox" checked={on} onChange={() => setChecked((s) => { const n = new Set(s); n.has(k) ? n.delete(k) : n.add(k); return n; })} className="size-4 accent-[var(--color-ember)]" /><span className="flex-1">{l.ingredient}</span><span className="tabular text-fg-subtle">{l.quantity} {l.unit}</span><span className="w-14 text-right tabular text-fg-subtle">£{l.estimatedCost.toFixed(2)}</span></label></li>); })}</ul></div>))}</div>);
}
