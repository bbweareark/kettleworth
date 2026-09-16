"use client";
import { useMemo, useState } from "react";
import { X, Info } from "lucide-react";
import { Button, cn } from "@kettleworth/ui";

export type EstItem = { name: string; portion: string; grams: number | null; calories: number; proteinG: number; carbsG: number; fatG: number; fibreG: number; confidence: "high" | "medium" | "low"; breakdown?: { label: string; calories: number }[] };
const SCALES = [0.25, 0.5, 1, 1.5, 2];

/** Review before logging: every item can be resized or removed, and the totals follow. Nothing is saved until you confirm. */
export function EstimateCard({ items: initial, note, source, busy, onLog, onCancel, portionsVisible = 1 }: { items: EstItem[]; note: string | null; source: "photo" | "estimate" | "drink"; busy: boolean; onLog: (items: (EstItem & { scale: number })[]) => void; onCancel: () => void; portionsVisible?: number }) {
  const [rows, setRows] = useState(initial.map((i) => ({ ...i, scale: 1, keep: true })));
  const kept = rows.filter((r) => r.keep);
  const total = useMemo(() => kept.reduce((a, r) => ({ calories: a.calories + r.calories * r.scale, p: a.p + r.proteinG * r.scale, c: a.c + r.carbsG * r.scale, f: a.f + r.fatG * r.scale }), { calories: 0, p: 0, c: 0, f: 0 }), [kept]);
  return (
    <div className="space-y-3 rounded-2xl bg-black/25 p-4 ring-1 ring-white/[0.07]">
      <div className="flex items-baseline justify-between gap-3">
        <div className="text-2xs uppercase tracking-[0.16em] text-fg-subtle">{source === "photo" ? "Read from your photo" : source === "drink" ? "Calculated" : "Smart estimate"}</div>
        <div className="font-display text-2xl font-semibold tabular">{Math.round(total.calories)}<span className="ml-1 text-sm font-normal text-fg-subtle">kcal</span></div>
      </div>
      {portionsVisible > 1 ? <p className="rounded-xl bg-sky-soft px-3 py-2 text-sm text-fg">{portionsVisible} identical portions in the photo. These numbers are for one of them.</p> : null}
      <ul className="space-y-2">
        {rows.map((r, i) => (
          <li key={`${r.name}-${i}`} className={cn("rounded-xl bg-surface/50 p-3 ring-1 ring-white/[0.05] transition-opacity", !r.keep && "opacity-40")}>
            <div className="flex items-start gap-2">
              <span className={cn("mt-1.5 size-2 shrink-0 rounded-full", r.confidence === "high" ? "bg-signal" : r.confidence === "medium" ? "bg-amber" : "bg-rose")} title={`${r.confidence} confidence`} aria-label={`${r.confidence} confidence`} />
              <div className="min-w-0 flex-1">
                <div className="flex items-baseline justify-between gap-2"><span className="truncate text-sm font-medium">{r.name}</span><span className="shrink-0 font-display text-sm font-semibold tabular">{Math.round(r.calories * r.scale)}</span></div>
                <div className="text-xs text-fg-subtle">{r.portion} · P {Math.round(r.proteinG * r.scale)} · C {Math.round(r.carbsG * r.scale)} · F {Math.round(r.fatG * r.scale)}</div>
                {r.breakdown?.length ? <div className="mt-1 text-xs text-fg-muted">{r.breakdown.map((b) => `${b.label} ${b.calories}`).join(" · ")}</div> : null}
                {r.keep ? <div className="mt-2 flex gap-1" role="radiogroup" aria-label={`Portion of ${r.name}`}>{SCALES.map((s) => <button key={s} type="button" role="radio" aria-checked={r.scale === s} onClick={() => setRows((x) => x.map((y, k) => (k === i ? { ...y, scale: s } : y)))} className={cn("h-7 rounded-full px-2.5 text-xs tabular ring-1", r.scale === s ? "bg-fg text-bg ring-fg" : "text-fg-muted ring-white/10 hover:text-fg")}>{s === 1 ? (portionsVisible > 1 ? "One portion" : "As shown") : s === 0.25 ? "¼" : s === 0.5 ? "½" : `${s}×`}</button>)}</div> : null}
              </div>
              <button type="button" aria-label={r.keep ? `Remove ${r.name}` : `Keep ${r.name}`} onClick={() => setRows((x) => x.map((y, k) => (k === i ? { ...y, keep: !y.keep } : y)))} className="text-fg-subtle hover:text-fg"><X className="size-4" /></button>
            </div>
          </li>
        ))}
      </ul>
      {note ? <p className="flex gap-2 text-xs text-fg-muted"><Info className="mt-0.5 size-3.5 shrink-0" />{note}</p> : null}
      <div className="flex items-center justify-between gap-2 pt-1">
        <Button variant="ghost" onClick={onCancel}>Discard</Button>
        <Button loading={busy} disabled={!kept.length} onClick={() => onLog(kept)}>Log {kept.length} item{kept.length === 1 ? "" : "s"} · {Math.round(total.calories)} kcal</Button>
      </div>
    </div>
  );
}
