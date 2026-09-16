"use client";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { Coffee, ScanBarcode, Sparkles, Search, Camera, UtensilsCrossed, X, Plus, CupSoda, ChefHat } from "lucide-react";
import type { MealSlot, NutritionTargets, RecipeMacros } from "@kettleworth/types";
import { drinkMacros, type DrinkOrder } from "@kettleworth/core";
import { Button, Input, Textarea, cn, toast } from "@kettleworth/ui";
import { DrinkBuilder } from "./drink-builder";
import { EstimateCard, type EstItem } from "./estimate-card";
import { BarcodeScanner, ProductCard, PhotoButton, preparePhoto, type Product } from "./food-scanner";

type Source = "manual" | "recipe" | "drink" | "barcode" | "photo" | "estimate";
type Entry = { id: string; slot: MealSlot; label: string; macros: RecipeMacros; servings: number; source?: Source };
type Mode = "drinks" | "scan" | "describe" | "search";
const SLOTS: { v: MealSlot; l: string }[] = [{ v: "breakfast", l: "Breakfast" }, { v: "lunch", l: "Lunch" }, { v: "dinner", l: "Dinner" }, { v: "snack", l: "Snacks & drinks" }];
const SOURCE_ICON: Record<Source, typeof Coffee> = { manual: UtensilsCrossed, recipe: ChefHat, drink: CupSoda, barcode: ScanBarcode, photo: Camera, estimate: Sparkles };

function slotForNow(d = new Date()): MealSlot {
  const h = d.getHours() + d.getMinutes() / 60;
  return h < 10.5 ? "breakfast" : h < 15 ? "lunch" : h < 17 ? "snack" : h < 21.5 ? "dinner" : "snack";
}

export function FoodLogView({ date, initial, targets, recipes }: { date: string; initial: Entry[]; targets: NutritionTargets; recipes: { id: string; name: string; macros: RecipeMacros }[] }) {
  const router = useRouter();
  const reduce = useReducedMotion();
  const [entries, setEntries] = useState(initial);
  const [slot, setSlot] = useState<MealSlot>(() => slotForNow());
  const [mode, setMode] = useState<Mode>("drinks");
  const [busy, setBusy] = useState<string | null>(null);
  // Scan and describe state
  const [scanning, setScanning] = useState(false);
  const [product, setProduct] = useState<Product | null>(null);
  const [estimate, setEstimate] = useState<{ items: EstItem[]; note: string | null; source: "photo" | "estimate" | "drink"; portionsVisible: number } | null>(null);
  const [drinkPrefill, setDrinkPrefill] = useState<DrinkOrder | undefined>(undefined);
  const [text, setText] = useState("");
  const [q, setQ] = useState("");
  const [custom, setCustom] = useState({ label: "", calories: "" });

  const tot = useMemo(() => entries.reduce((a, e) => ({ calories: a.calories + e.macros.calories, proteinG: a.proteinG + e.macros.proteinG, carbsG: a.carbsG + e.macros.carbsG, fatG: a.fatG + e.macros.fatG }), { calories: 0, proteinG: 0, carbsG: 0, fatG: 0 }), [entries]);
  const left = Math.round(targets.calories - tot.calories);
  const matches = q.length > 1 ? recipes.filter((r) => r.name.toLowerCase().includes(q.toLowerCase())).slice(0, 6) : [];

  async function log(label: string, macros: RecipeMacros, source: Source, detail?: Record<string, unknown>, recipeId?: string, quiet = false): Promise<boolean> {
    const r = await fetch("/api/nutrition/log", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ loggedOn: date, slot, label: label.slice(0, 200), recipeId: recipeId ?? null, servings: 1, macros, source, detail: detail ?? null }) });
    if (!r.ok) { toast.error("Couldn't log that"); return false; }
    const row = await r.json();
    setEntries((e) => [...e, { id: row.id, slot, label, macros, servings: 1, source }]);
    if (!quiet) toast.success(`${Math.round(macros.calories)} kcal logged`);
    return true;
  }
  const done = () => { setEstimate(null); setProduct(null); setScanning(false); setText(""); router.refresh(); };

  async function logDrink(order: DrinkOrder) {
    setBusy("drink"); const r = drinkMacros(order);
    await log(r.label, { calories: r.calories, proteinG: r.proteinG, carbsG: r.carbsG, fatG: r.fatG, fibreG: 0 }, "drink", { order, breakdown: r.breakdown });
    setBusy(null); setDrinkPrefill(undefined); router.refresh();
  }
  async function runEstimate(body: Record<string, unknown>, key: string) {
    setBusy(key); setEstimate(null);
    try {
      const r = await fetch("/api/nutrition/estimate", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      const j = await r.json();
      if (!r.ok) { toast.error(j.issues?.[0]?.message ?? j.error ?? "Couldn't estimate that"); return; }
      if (j.source === "drink" && j.drink) { setDrinkPrefill(j.drink); setMode("drinks"); toast.message("Opened in the drink builder", { description: "Adjust the milk, sugar or size, then log." }); return; }
      setEstimate({ items: j.items, note: j.note, source: j.source, portionsVisible: j.portionsVisible ?? 1 });
    } finally { setBusy(null); }
  }
  async function logEstimate(items: (EstItem & { scale: number })[]) {
    setBusy("log-est");
    for (const i of items) {
      const s = i.scale;
      await log(s === 1 ? i.name : `${i.name} (${s}×)`, { calories: Math.round(i.calories * s), proteinG: Math.round(i.proteinG * s * 10) / 10, carbsG: Math.round(i.carbsG * s * 10) / 10, fatG: Math.round(i.fatG * s * 10) / 10, fibreG: Math.round(i.fibreG * s) }, estimate?.source === "photo" ? "photo" : "estimate", { portion: i.portion, scale: s, confidence: i.confidence }, undefined, true);
    }
    toast.success(`${items.length} item${items.length === 1 ? "" : "s"} logged`);
    setBusy(null); done();
  }
  async function remove(id: string) {
    const prev = entries; setEntries((e) => e.filter((x) => x.id !== id));
    const r = await fetch(`/api/nutrition/log/${id}`, { method: "DELETE" });
    if (!r.ok) { setEntries(prev); toast.error("Couldn't remove that"); } else router.refresh();
  }

  const modes: { id: Mode; label: string; Icon: typeof Coffee }[] = [{ id: "drinks", label: "Drinks", Icon: Coffee }, { id: "scan", label: "Scan", Icon: ScanBarcode }, { id: "describe", label: "Describe", Icon: Sparkles }, { id: "search", label: "Recipes", Icon: Search }];
  const pct = Math.min(1, tot.calories / Math.max(1, targets.calories));

  return (
    <section className="space-y-4 rounded-3xl bg-surface/40 p-5 ring-1 ring-white/[0.06] md:p-6" aria-label="Food log">
      {/* Today's meter */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="eyebrow">Today's log</div>
          <div className="mt-1 flex items-baseline gap-2"><span className="font-display text-4xl font-semibold tracking-tightest tabular">{Math.round(tot.calories)}</span><span className="text-sm text-fg-subtle">of {targets.calories} kcal</span></div>
        </div>
        <div className={cn("rounded-full px-3 py-1 text-sm tabular", left >= 0 ? "bg-signal-soft text-signal" : "bg-amber-soft text-amber")}>{left >= 0 ? `${left} kcal left` : `${-left} kcal over`}</div>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-white/10"><motion.div className={cn("h-full rounded-full", left >= 0 ? "bg-ember" : "bg-amber")} animate={{ width: `${pct * 100}%` }} transition={{ duration: reduce ? 0 : 0.5 }} /></div>
      <div className="grid grid-cols-3 gap-2">
        {([["Protein", tot.proteinG, targets.proteinG, "bg-ember"], ["Carbs", tot.carbsG, targets.carbsG, "bg-sky"], ["Fat", tot.fatG, targets.fatG, "bg-amber"]] as const).map(([l, v, t, c]) => (
          <div key={l} className="rounded-xl bg-black/20 p-2.5"><div className="flex items-baseline justify-between text-xs"><span className="text-fg-subtle">{l}</span><span className="tabular text-fg-muted">{Math.round(v)} / {t} g</span></div><div className="mt-1.5 h-1 overflow-hidden rounded-full bg-white/10"><div className={cn("h-full rounded-full", c)} style={{ width: `${Math.min(100, (v / Math.max(1, t)) * 100)}%` }} /></div></div>
        ))}
      </div>

      {/* Entries by meal */}
      {entries.length ? (
        <div className="space-y-3">
          {SLOTS.map(({ v, l }) => { const rows = entries.filter((e) => e.slot === v); if (!rows.length) return null; return (
            <div key={v}>
              <div className="mb-1 flex justify-between text-2xs uppercase tracking-[0.16em] text-fg-subtle"><span>{l}</span><span className="tabular">{Math.round(rows.reduce((a, r) => a + r.macros.calories, 0))} kcal</span></div>
              <ul className="space-y-1">
                <AnimatePresence initial={false}>
                  {rows.map((e) => { const Icon = SOURCE_ICON[e.source ?? "manual"]; return (
                    <motion.li key={e.id} layout={!reduce} initial={reduce ? false : { opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, x: -12 }} className="group flex items-center gap-3 rounded-xl bg-white/[0.03] px-3 py-2 text-sm">
                      <Icon className="size-4 shrink-0 text-fg-subtle" aria-hidden />
                      <span className="min-w-0 flex-1 truncate">{e.label}</span>
                      <span className="shrink-0 tabular text-fg-muted">{Math.round(e.macros.calories)}</span>
                      <button type="button" onClick={() => remove(e.id)} aria-label={`Remove ${e.label}`} className="shrink-0 text-fg-subtle opacity-60 hover:text-fg group-hover:opacity-100"><X className="size-4" /></button>
                    </motion.li>); })}
                </AnimatePresence>
              </ul>
            </div>); })}
        </div>
      ) : <p className="text-sm text-fg-muted">Nothing logged yet. Start with what you're drinking.</p>}

      {/* Add */}
      <div className="space-y-4 rounded-2xl bg-black/20 p-4 ring-1 ring-white/[0.05]">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-2xs uppercase tracking-[0.16em] text-fg-subtle">Add to</span>
          <div className="flex flex-wrap gap-1">{SLOTS.map((s) => <button key={s.v} type="button" aria-pressed={slot === s.v} onClick={() => setSlot(s.v)} className={cn("h-8 rounded-full px-3 text-xs ring-1", slot === s.v ? "bg-fg text-bg ring-fg" : "text-fg-muted ring-white/10 hover:text-fg")}>{s.l}</button>)}</div>
        </div>
        <div className="grid grid-cols-4 gap-1 rounded-2xl bg-white/[0.03] p-1" role="tablist" aria-label="How to add">
          {modes.map(({ id, label, Icon }) => (
            <button key={id} type="button" role="tab" aria-selected={mode === id} onClick={() => { setMode(id); setEstimate(null); setProduct(null); setScanning(false); }} className={cn("flex h-11 flex-col items-center justify-center gap-0.5 rounded-xl text-xs transition-colors sm:flex-row sm:gap-2 sm:text-sm", mode === id ? "bg-surface text-fg shadow-sm ring-1 ring-white/10" : "text-fg-muted hover:text-fg")}><Icon className={cn("size-4", mode === id && "text-ember")} />{label}</button>
          ))}
        </div>

        <AnimatePresence mode="wait" initial={false}>
          <motion.div key={mode} initial={reduce ? false : { opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={reduce ? undefined : { opacity: 0 }} transition={{ duration: 0.18 }}>
            {mode === "drinks" ? <DrinkBuilder key={JSON.stringify(drinkPrefill ?? null)} initial={drinkPrefill} dailyTarget={targets.calories} busy={busy === "drink"} onLog={logDrink} /> : null}

            {mode === "scan" ? (
              estimate ? <EstimateCard items={estimate.items} note={estimate.note} source={estimate.source} portionsVisible={estimate.portionsVisible} busy={busy === "log-est"} onLog={logEstimate} onCancel={() => setEstimate(null)} />
              : product ? <ProductCard product={product} busy={busy === "product"} onCancel={() => { setProduct(null); setScanning(true); }} onLog={async (amount, m, label) => { setBusy("product"); await log(label, m, "barcode", { barcode: product.barcode, amount, unit: product.unit }); setBusy(null); done(); }} />
              : scanning ? <BarcodeScanner onProduct={(p) => { setScanning(false); setProduct(p); }} onClose={() => setScanning(false)} />
              : (
                <div className="grid gap-3 sm:grid-cols-2">
                  <button type="button" onClick={() => setScanning(true)} className="group relative flex min-h-36 flex-col items-start justify-end overflow-hidden rounded-2xl bg-[linear-gradient(140deg,color-mix(in_oklch,var(--color-signal)_18%,transparent),transparent_70%)] p-4 text-left ring-1 ring-signal/25 transition-transform active:scale-[0.99]">
                    <div className="mb-auto grid size-11 place-items-center rounded-xl bg-signal-soft"><ScanBarcode className="size-5 text-signal" /></div>
                    <div className="mt-4 font-display text-lg font-semibold tracking-tight">Scan a barcode</div>
                    <div className="text-xs text-fg-muted">Exact values from the label, for anything packaged</div>
                  </button>
                  <PhotoButton busy={busy === "photo"} onPhoto={async (f) => { try { const img = await preparePhoto(f); await runEstimate({ image: img }, "photo"); } catch { toast.error("Couldn't read that photo"); setBusy(null); } }} />
                  <p className="text-2xs text-fg-subtle sm:col-span-2">Photos are read once to estimate portions and are not stored. Barcode data comes from Open Food Facts.</p>
                </div>
              )
            ) : null}

            {mode === "describe" ? (
              estimate ? <EstimateCard items={estimate.items} note={estimate.note} source={estimate.source} portionsVisible={estimate.portionsVisible} busy={busy === "log-est"} onLog={logEstimate} onCancel={() => setEstimate(null)} />
              : (
                <form className="space-y-3" onSubmit={(e) => { e.preventDefault(); if (text.trim().length > 1) runEstimate({ text }, "describe"); }}>
                  <Textarea value={text} onChange={(e) => setText(e.target.value)} placeholder="What did you have? Say it the way you'd tell a friend." className="min-h-20" aria-label="Describe what you had" onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); if (text.trim().length > 1) runEstimate({ text }, "describe"); } }} />
                  <div className="flex flex-wrap gap-1.5">{["Flat white with oat milk", "Two slices of toast with butter", "Chicken caesar wrap", "Bowl of porridge with banana"].map((ex) => <button key={ex} type="button" onClick={() => setText(ex)} className="h-8 rounded-full px-3 text-xs text-fg-muted ring-1 ring-white/10 hover:text-fg">{ex}</button>)}</div>
                  <div className="flex justify-end"><Button type="submit" loading={busy === "describe"} disabled={text.trim().length < 2}><Sparkles className="size-4" />Work it out</Button></div>
                </form>
              )
            ) : null}

            {mode === "search" ? (
              <div className="space-y-3">
                <div className="relative"><Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-fg-subtle" /><Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search your meal plan recipes" aria-label="Search recipes" className="pl-9" /></div>
                {matches.length ? <ul className="space-y-1">{matches.map((m) => <li key={m.id}><button type="button" onClick={async () => { setBusy(m.id); await log(m.name, m.macros, "recipe", undefined, m.id); setBusy(null); setQ(""); router.refresh(); }} className="flex w-full items-center justify-between rounded-xl bg-white/[0.03] px-3 py-2 text-left text-sm hover:bg-white/[0.06]"><span className="truncate">{m.name}</span><span className="flex shrink-0 items-center gap-2 tabular text-fg-muted">{m.macros.calories} kcal<Plus className="size-4" /></span></button></li>)}</ul> : null}
                <div className="flex items-end gap-2 border-t border-white/5 pt-3">
                  <label className="flex-1 text-2xs uppercase tracking-[0.14em] text-fg-subtle">Quick add<Input value={custom.label} onChange={(e) => setCustom({ ...custom, label: e.target.value })} className="mt-1" placeholder="Name" /></label>
                  <label className="w-24 text-2xs uppercase tracking-[0.14em] text-fg-subtle">kcal<Input inputMode="numeric" value={custom.calories} onChange={(e) => setCustom({ ...custom, calories: e.target.value.replace(/[^0-9]/g, "") })} className="mt-1" placeholder="0" /></label>
                  <Button disabled={!custom.label || !custom.calories} loading={busy === "custom"} onClick={async () => { setBusy("custom"); await log(custom.label, { calories: Number(custom.calories), proteinG: 0, carbsG: 0, fatG: 0, fibreG: 0 }, "manual"); setBusy(null); setCustom({ label: "", calories: "" }); router.refresh(); }} aria-label="Quick add">Add</Button>
                </div>
              </div>
            ) : null}
          </motion.div>
        </AnimatePresence>
      </div>
    </section>
  );
}
