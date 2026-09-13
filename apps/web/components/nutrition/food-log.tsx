"use client";
import { useState } from "react";
import { Plus } from "lucide-react";
import type { MealSlot, NutritionTargets, RecipeMacros } from "@kettleworth/types";
import { Button, Card, CardContent, Input, Progress, Segmented, toast } from "@kettleworth/ui";

type Entry = { id: string; slot: MealSlot; label: string; macros: RecipeMacros; servings: number };
export function FoodLogView({ date, initial, targets, recipes }: { date: string; initial: Entry[]; targets: NutritionTargets; recipes: { id: string; name: string; macros: RecipeMacros }[] }) {
  const [entries, setEntries] = useState(initial);
  const [slot, setSlot] = useState<MealSlot>("lunch");
  const [q, setQ] = useState("");
  const [custom, setCustom] = useState({ label: "", calories: "", proteinG: "", carbsG: "", fatG: "" });
  const tot = entries.reduce((a, e) => ({ calories: a.calories + e.macros.calories, proteinG: a.proteinG + e.macros.proteinG, carbsG: a.carbsG + e.macros.carbsG, fatG: a.fatG + e.macros.fatG }), { calories: 0, proteinG: 0, carbsG: 0, fatG: 0 });
  const matches = q.length > 1 ? recipes.filter((r) => r.name.toLowerCase().includes(q.toLowerCase())).slice(0, 5) : [];
  async function add(label: string, macros: RecipeMacros, recipeId?: string) {
    const r = await fetch("/api/nutrition/log", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ loggedOn: date, slot, label, recipeId: recipeId ?? null, servings: 1, macros }) });
    if (!r.ok) return toast.error("Couldn't log");
    const row = await r.json();
    setEntries((e) => [...e, { id: row.id, slot, label, macros, servings: 1 }]); setQ(""); setCustom({ label: "", calories: "", proteinG: "", carbsG: "", fatG: "" });
  }
  return (
    <Card><CardContent className="space-y-4">
      <div className="flex items-center justify-between"><h2 className="font-display text-lg font-semibold">Today's food log</h2><span className="text-xs text-fg-subtle">{date}</span></div>
      <div className="grid gap-3 sm:grid-cols-4">{([["Calories", tot.calories, targets.calories, "kcal"], ["Protein", tot.proteinG, targets.proteinG, "g"], ["Carbs", tot.carbsG, targets.carbsG, "g"], ["Fat", tot.fatG, targets.fatG, "g"]] as const).map(([l, v, t, u]) => (<div key={l}><div className="mb-1 flex justify-between text-xs"><span className="text-fg-subtle">{l}</span><span className="tabular">{Math.round(v)} / {t} {u}</span></div><Progress value={t ? Math.min(100, (v / t) * 100) : 0} tone={v > t * 1.1 ? "amber" : "ember"} /></div>))}</div>
      {entries.length ? <ul className="divide-y divide-border">{entries.map((e) => <li key={e.id} className="flex items-center justify-between py-2 text-sm"><span><span className="mr-2 text-2xs uppercase tracking-wide text-fg-subtle">{e.slot.replace("_", " ")}</span>{e.label}</span><span className="tabular text-fg-muted">{e.macros.calories} kcal · {e.macros.proteinG}P</span></li>)}</ul> : <p className="text-sm text-fg-subtle">Nothing logged yet today.</p>}
      <div className="space-y-3 rounded-lg bg-surface-2 p-3">
        <Segmented value={slot} onChange={setSlot} options={[{ value: "breakfast", label: "Breakfast" }, { value: "lunch", label: "Lunch" }, { value: "dinner", label: "Dinner" }, { value: "snack", label: "Snack" }]} label="Meal slot" className="flex-wrap" />
        <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search your recipes to quick-add…" aria-label="Search recipes" />
        {matches.length ? <ul className="space-y-1">{matches.map((m) => <li key={m.id}><button type="button" onClick={() => add(m.name, m.macros, m.id)} className="flex w-full items-center justify-between rounded-md px-2 py-1.5 text-left text-sm hover:bg-surface-3"><span>{m.name}</span><span className="text-xs text-fg-subtle">{m.macros.calories} kcal</span></button></li>)}</ul> : null}
        <div className="grid grid-cols-[2fr_1fr_1fr_1fr_1fr_auto] items-end gap-2">
          <label className="text-2xs text-fg-subtle">Custom item<Input value={custom.label} onChange={(e) => setCustom({ ...custom, label: e.target.value })} className="mt-1 h-9" placeholder="e.g. flat white" /></label>
          {(["calories", "proteinG", "carbsG", "fatG"] as const).map((k) => <label key={k} className="text-2xs text-fg-subtle">{k === "calories" ? "kcal" : k.replace("G", " g")}<Input inputMode="decimal" value={custom[k]} onChange={(e) => setCustom({ ...custom, [k]: e.target.value })} className="mt-1 h-9" /></label>)}
          <Button size="sm" aria-label="Add custom item" disabled={!custom.label || !custom.calories} onClick={() => add(custom.label, { calories: Number(custom.calories), proteinG: Number(custom.proteinG || 0), carbsG: Number(custom.carbsG || 0), fatG: Number(custom.fatG || 0), fibreG: 0 })}><Plus /></Button>
        </div>
        <p className="text-2xs text-fg-subtle">Barcode scanning and photo estimation arrive with the mobile app.</p>
      </div>
    </CardContent></Card>
  );
}
