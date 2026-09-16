"use client";
import { useMemo, useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import { Coffee, CupSoda, Wine, Milk, Minus, Plus, Leaf, Beer, GlassWater, Dumbbell } from "lucide-react";
import { DRINKS, MILKS, drinkDef, drinkMacros, type DrinkGroup, type DrinkId, type DrinkOrder, type MilkId } from "@kettleworth/core";
import { Button, CountUp, cn } from "@kettleworth/ui";

const GROUPS: { id: DrinkGroup; label: string; Icon: typeof Coffee }[] = [
  { id: "tea", label: "Tea", Icon: Leaf }, { id: "coffee", label: "Coffee", Icon: Coffee }, { id: "cold", label: "Cold", Icon: CupSoda }, { id: "shake", label: "Shakes", Icon: Dumbbell }, { id: "alcohol", label: "Alcohol", Icon: Wine },
];
const ICON: Partial<Record<DrinkId, typeof Coffee>> = { beer: Beer, cider: Beer, water: GlassWater, milk: Milk };

export function defaultOrder(id: DrinkId): DrinkOrder {
  const d = drinkDef(id);
  return { drink: id, sizeMl: d.sizes[Math.min(1, d.sizes.length - 1)]!.ml, milk: d.defaultMilk, sugarTsp: 0, syrupPumps: 0, count: 1 };
}

/**
 * Build a drink the way you would order it. The calorie meter moves as you choose, and the breakdown shows where the
 * calories are, which is usually the milk and sugar rather than the drink.
 */
export function DrinkBuilder({ initial, dailyTarget, busy, onLog }: { initial?: DrinkOrder; dailyTarget: number; busy: boolean; onLog: (order: DrinkOrder) => void }) {
  const reduce = useReducedMotion();
  const [order, setOrder] = useState<DrinkOrder>(initial ?? defaultOrder("tea"));
  const [group, setGroup] = useState<DrinkGroup>(drinkDef(order.drink).group);
  const d = drinkDef(order.drink);
  const result = useMemo(() => drinkMacros(order), [order]);
  const set = (patch: Partial<DrinkOrder>) => setOrder((o) => ({ ...o, ...patch }));
  const pick = (id: DrinkId) => setOrder((o) => ({ ...defaultOrder(id), sugarTsp: drinkDef(id).sugar ? o.sugarTsp : 0, count: o.count }));
  const share = Math.min(1, result.calories / Math.max(1, dailyTarget));

  return (
    <div className="space-y-4">
      <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none" role="tablist" aria-label="Drink type">
        {GROUPS.map(({ id, label, Icon }) => (
          <button key={id} type="button" role="tab" aria-selected={group === id} onClick={() => { setGroup(id); pick(DRINKS.find((x) => x.group === id)!.id); }} className={cn("inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full px-3.5 text-sm transition-colors", group === id ? "bg-fg text-bg" : "bg-white/[0.05] text-fg-muted hover:bg-white/10")}><Icon className="size-4" />{label}</button>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {DRINKS.filter((x) => x.group === group).map((x) => { const Icon = ICON[x.id] ?? GROUPS.find((g) => g.id === x.group)!.Icon; const on = x.id === order.drink; return (
          <button key={x.id} type="button" aria-pressed={on} onClick={() => pick(x.id)} className={cn("flex items-center gap-2 rounded-xl px-3 py-2.5 text-left text-sm ring-1 transition-all active:scale-[0.98]", on ? "bg-ember-soft ring-ember/40 text-fg" : "bg-white/[0.03] ring-white/[0.06] text-fg-muted hover:text-fg")}><Icon className={cn("size-4 shrink-0", on && "text-ember")} /><span className="truncate">{x.name}</span></button>); })}
      </div>

      <div className="grid gap-4 md:grid-cols-[1fr_auto]">
        <div className="space-y-3">
          <Row label="Size">{d.sizes.map((s) => <Chip key={s.ml} on={order.sizeMl === s.ml} onClick={() => set({ sizeMl: s.ml })}>{s.label}<span className="ml-1 text-2xs opacity-60">{s.ml} ml</span></Chip>)}</Row>
          {d.milk.kind !== "none" ? (
            <Row label="Milk">
              {d.id !== "milk" && d.id !== "protein_shake" ? <Chip on={order.milk === "none"} onClick={() => set({ milk: "none" })}>None</Chip> : null}
              {d.id === "protein_shake" ? <Chip on={order.milk === "none"} onClick={() => set({ milk: "none" })}>Water</Chip> : null}
              {(Object.keys(MILKS) as Exclude<MilkId, "none">[]).map((m) => <Chip key={m} on={order.milk === m} onClick={() => set({ milk: m })}>{MILKS[m].name}</Chip>)}
            </Row>
          ) : null}
          <div className="flex flex-wrap gap-4">
            {d.sugar ? <Stepper label="Sugar" unit="tsp" value={order.sugarTsp} min={0} max={8} onChange={(v) => set({ sugarTsp: v })} /> : null}
            {d.syrup ? <Stepper label="Syrup" unit="pumps" value={order.syrupPumps} min={0} max={6} onChange={(v) => set({ syrupPumps: v })} /> : null}
            <Stepper label="How many" unit="" value={order.count} min={1} max={10} onChange={(v) => set({ count: v })} />
          </div>
        </div>

        {/* The meter */}
        <div className="hidden min-w-[13rem] flex-col justify-between rounded-2xl bg-black/30 p-4 ring-1 ring-white/[0.06] md:flex">
          <div>
            <div className="text-2xs uppercase tracking-[0.16em] text-fg-subtle">Calories</div>
            <div className="flex items-baseline gap-1"><CountUp key={result.calories} value={result.calories} duration={reduce ? 0 : 450} className="font-display text-5xl font-semibold tracking-tightest" /><span className="text-sm text-fg-subtle">kcal</span></div>
            <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/10"><motion.div className="h-full rounded-full bg-ember" animate={{ width: `${share * 100}%` }} transition={{ duration: reduce ? 0 : 0.35 }} /></div>
            <div className="mt-1 text-2xs text-fg-subtle">{Math.round(share * 100)}% of today's {dailyTarget} kcal</div>
            <div className="mt-3 grid grid-cols-3 gap-2 text-center">{[["P", result.proteinG], ["C", result.carbsG], ["F", result.fatG]].map(([k, v]) => <div key={k as string} className="rounded-lg bg-white/[0.04] py-1.5"><div className="font-display text-sm font-semibold tabular">{v}</div><div className="text-[10px] uppercase tracking-wider text-fg-subtle">{k === "P" ? "protein" : k === "C" ? "carbs" : "fat"}</div></div>)}</div>
            {result.breakdown.length ? <ul className="mt-3 space-y-1 text-xs text-fg-muted">{result.breakdown.map((b) => <li key={b.label} className="flex justify-between gap-3"><span className="truncate">{b.label}</span><span className="tabular">{b.calories}</span></li>)}</ul> : <p className="mt-3 text-xs text-fg-subtle">Next to nothing. Hydration counts.</p>}
          </div>
          <Button className="mt-4 w-full" loading={busy} onClick={() => onLog(order)}>Log {result.calories} kcal</Button>
        </div>
      </div>

      {/* Phones: one meter that follows you down the builder, with where the calories come from */}
      <div className="sticky bottom-[calc(4rem+env(safe-area-inset-bottom))] z-10 rounded-2xl bg-surface/95 p-3 ring-1 ring-white/10 backdrop-blur md:hidden">
        <div className="flex items-center gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex items-baseline gap-1.5"><CountUp key={result.calories} value={result.calories} duration={reduce ? 0 : 350} className="font-display text-3xl font-semibold tracking-tightest" /><span className="text-xs text-fg-subtle">kcal · {Math.round(share * 100)}% of today</span></div>
            <div className="truncate text-2xs text-fg-subtle">{result.breakdown.length ? result.breakdown.map((b) => `${b.label.split(",")[0]} ${b.calories}`).join(" · ") : "Next to nothing"}</div>
          </div>
          <Button loading={busy} onClick={() => onLog(order)}>Log</Button>
        </div>
        <div className="mt-2 h-1 overflow-hidden rounded-full bg-white/10"><motion.div className="h-full rounded-full bg-ember" animate={{ width: `${share * 100}%` }} transition={{ duration: reduce ? 0 : 0.3 }} /></div>
      </div>
    </div>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return <div><div className="mb-1.5 text-2xs uppercase tracking-[0.16em] text-fg-subtle">{label}</div><div className="flex flex-wrap gap-1.5">{children}</div></div>;
}
function Chip({ on, onClick, children }: { on: boolean; onClick: () => void; children: React.ReactNode }) {
  return <button type="button" aria-pressed={on} onClick={onClick} className={cn("inline-flex h-9 items-center rounded-full px-3 text-sm ring-1 transition-colors", on ? "bg-ember text-ember-fg ring-ember" : "bg-white/[0.04] text-fg-muted ring-white/[0.07] hover:text-fg")}>{children}</button>;
}
function Stepper({ label, unit, value, min, max, onChange }: { label: string; unit: string; value: number; min: number; max: number; onChange: (v: number) => void }) {
  return (
    <div>
      <div className="mb-1.5 text-2xs uppercase tracking-[0.16em] text-fg-subtle">{label}</div>
      <div className="inline-flex items-center gap-1 rounded-full bg-white/[0.04] p-1 ring-1 ring-white/[0.07]">
        <button type="button" aria-label={`Less ${label.toLowerCase()}`} disabled={value <= min} onClick={() => onChange(Math.max(min, value - 1))} className="grid size-8 place-items-center rounded-full text-fg-muted hover:bg-white/10 disabled:opacity-30"><Minus className="size-3.5" /></button>
        <span className="min-w-[3.5rem] text-center font-display text-sm font-semibold tabular">{value}{unit ? <span className="ml-1 text-2xs font-normal text-fg-subtle">{unit}</span> : null}</span>
        <button type="button" aria-label={`More ${label.toLowerCase()}`} disabled={value >= max} onClick={() => onChange(Math.min(max, value + 1))} className="grid size-8 place-items-center rounded-full text-fg-muted hover:bg-white/10 disabled:opacity-30"><Plus className="size-3.5" /></button>
      </div>
    </div>
  );
}
