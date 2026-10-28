"use client";
import { useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import { TrendingUp } from "lucide-react";
import { CountUp, Progress, cn } from "@kettleworth/ui";
import { levelAt } from "@kettleworth/core";

type Growth = { total: number; breakdown: { label: string; points: number }[]; level: number; nextLevelAt: number };

export function GrowthPanel({ growth }: { growth: Growth }) {
  // The total this level started at, from the engine rather than a second copy of the sums.
  const prev = levelAt(growth.level);
  const pct = ((growth.total - prev) / Math.max(1, growth.nextLevelAt - prev)) * 100;
  const reduce = useReducedMotion();
  return (
    <section className="relative overflow-hidden rounded-lg border border-rule p-6">
      <div className="relative flex flex-wrap items-end justify-between gap-6">
        <div>
          <div className="eyebrow">Growth</div>
          <div className="mt-1 flex items-baseline gap-2"><span className="font-display text-6xl tracking-tightest"><CountUp value={growth.total} /></span><span className="text-sm text-fg-muted">points · level {growth.level}</span></div>
          <p className="mt-2 max-w-md text-sm text-fg-muted">Every session, set, weigh-in, PR and body check adds. It never goes down. {growth.nextLevelAt - growth.total} to level {growth.level + 1}.</p>
        </div>
        <ul className="grid grid-cols-2 gap-x-6 gap-y-1 text-xs text-fg-muted sm:grid-cols-3">{growth.breakdown.filter((b) => b.points > 0).map((b) => <li key={b.label} className="flex justify-between gap-3"><span>{b.label}</span><span className="tabular text-fg">{b.points}</span></li>)}</ul>
      </div>
      <motion.div initial={reduce ? false : { scaleX: 0 }} animate={{ scaleX: 1 }} transition={{ duration: 0.8, ease: [0.25, 1, 0.5, 1] }} className="relative mt-5 origin-left"><Progress value={pct} /></motion.div>
    </section>
  );
}

/** Before/after slider: drag to reveal. Same pose, same light, and the change is impossible to argue with. */
export function CompareSlider({ before, after }: { before: { id: string; date: string }; after: { id: string; date: string } }) {
  const [x, setX] = useState(50);
  return (
    <div className="space-y-2">
      <div className="relative aspect-[3/4] max-h-[520px] w-full overflow-hidden bg-bg select-none" style={{ maxWidth: 390 }}>
        <img src={`/api/photos/${after.id}`} alt={`After, ${after.date}`} className="absolute inset-0 size-full object-cover" draggable={false} />
        <div className="absolute inset-0 overflow-hidden" style={{ width: `${x}%` }}><img src={`/api/photos/${before.id}`} alt={`Before, ${before.date}`} className="absolute inset-0 size-full max-w-none object-cover" style={{ width: `${10000 / x}%` }} draggable={false} /></div>
        <div className="absolute inset-y-0" style={{ left: `calc(${x}% - 1px)` }}><div className="h-full w-0.5 bg-rule" /><div className="absolute top-1/2 -translate-x-1/2 -translate-y-1/2 border border-white/60 bg-black/60 px-2 py-1 text-2xs font-semibold text-white">⇆</div></div>
        <span className="absolute left-3 top-3 bg-black/60 px-2 py-0.5 text-2xs font-semibold text-white">{before.date}</span>
        <span className="absolute right-3 top-3 bg-volt px-2 py-0.5 text-2xs font-semibold text-volt-fg">{after.date}</span>
        <input type="range" min={2} max={98} value={x} onChange={(e) => setX(Number(e.target.value))} aria-label="Compare before and after" className="absolute inset-0 h-full w-full cursor-ew-resize opacity-0" />
      </div>
      <p className="text-xs text-fg-subtle"><TrendingUp className="mr-1 inline size-3" /> Drag to compare your first and latest front photos.</p>
    </div>
  );
}
export const cnx = cn;
