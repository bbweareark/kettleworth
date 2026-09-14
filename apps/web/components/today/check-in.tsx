"use client";
import { useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import { Sparkles, Flame, Wind, RefreshCw } from "lucide-react";
import { toast, cn } from "@kettleworth/ui";

type Applied = { kind: string; reason: string }[];
/** Collapse repeated reasons ("Rotated..." once per swapped accessory) into one line with a count. */
function summarise(a: Applied): string[] {
  const counts = new Map<string, number>();
  for (const x of a) counts.set(x.reason, (counts.get(x.reason) ?? 0) + 1);
  return [...counts.entries()].slice(-4).map(([r, n]) => (n > 1 ? `${r} (${n} exercises)` : r));
}
/** The Monday question. Three answers, each applied through the adaptation engine and explained back. */
export function WeeklyCheckIn({ weekNumber, applied }: { weekNumber: number; applied: Applied }) {
  const reduce = useReducedMotion();
  const [busy, setBusy] = useState<string | null>(null);
  const [result, setResult] = useState<Applied | null>(null);
  async function choose(choice: "keep" | "fresh" | "ease") {
    setBusy(choice);
    const r = await fetch("/api/adapt/checkin", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ choice }) });
    const j = await r.json(); setBusy(null);
    if (!r.ok) return toast.error(j.error ?? "Couldn't apply");
    setResult(j.applied ?? []);
  }
  const opts = [
    { k: "keep" as const, I: Flame, t: "Stay the course", d: "The plan progresses as written." },
    { k: "fresh" as const, I: RefreshCw, t: "Something fresh", d: "Accessories rotate; main lifts stay." },
    { k: "ease" as const, I: Wind, t: "Ease off", d: "Loads drop 8% this week." },
  ];
  return (
    <motion.section initial={reduce ? false : { opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="relative overflow-hidden rounded-2xl bg-surface/50 p-5 ring-1 ring-white/[0.06]">
      <div className="mb-3 flex items-center gap-2"><Sparkles className="size-4 text-ember" /><span className="eyebrow">Week {weekNumber} check-in</span></div>
      {result ? (
        <div><h3 className="font-display text-xl font-semibold tracking-tighter">Applied.</h3><ul className="mt-2 space-y-1.5 text-sm text-fg-muted">{summarise(result).map((t, i) => <li key={i} className="flex gap-2"><span className="mt-2 size-1 shrink-0 rounded-full bg-ember" />{t}</li>)}</ul></div>
      ) : (
        <>
          <h3 className="font-display text-xl font-semibold tracking-tighter">How do you want this week to feel?</h3>
          {applied.length ? <p className="mt-1 text-sm text-fg-muted">From last week the engine already decided: {applied[applied.length - 1]!.reason}</p> : <p className="mt-1 text-sm text-fg-muted">Your call shapes the week; the engine keeps it safe.</p>}
          <div className="mt-4 grid gap-2 sm:grid-cols-3">{opts.map((o) => (
            <button key={o.k} type="button" disabled={!!busy} onClick={() => choose(o.k)} className={cn("flex items-start gap-3 rounded-xl border border-border p-3 text-left transition-colors hover:border-ember hover:bg-ember-soft", busy === o.k && "border-ember bg-ember-soft")}><o.I className="mt-0.5 size-4 shrink-0 text-ember" /><span><span className="block text-sm font-medium">{o.t}</span><span className="text-xs text-fg-muted">{o.d}</span></span></button>))}</div>
        </>
      )}
    </motion.section>
  );
}
