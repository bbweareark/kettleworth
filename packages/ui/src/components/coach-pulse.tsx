"use client";
import * as React from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { cn } from "../lib/cn";

export type PulseItem = { text: string; tone?: "ember" | "signal" | "amber" | "sky" | "neutral" };

/**
 * The coach's line. Reads like a note from a person: a monogram, one sentence in the display face, and a hairline that
 * fills over the interval so the reader can feel the cadence without a blinking light. Cycles through real, computed
 * facts (never fabricated). Respects reduced motion (no cycling, no hairline).
 */
export function CoachPulse({ items, interval = 5200, className, label = "Coach" }: { items: PulseItem[]; interval?: number; className?: string; label?: string }) {
  const reduce = useReducedMotion();
  const [i, setI] = React.useState(0);
  React.useEffect(() => { if (reduce || items.length < 2) return; const t = setInterval(() => setI((x) => (x + 1) % items.length), interval); return () => clearInterval(t); }, [items.length, interval, reduce]);
  const cur = items[i % Math.max(1, items.length)];
  if (!cur) return null;
  const line = { ember: "bg-ember", signal: "bg-signal", amber: "bg-amber", sky: "bg-sky", neutral: "bg-fg-subtle" }[cur.tone ?? "ember"];
  return (
    <div className={cn("relative flex items-center gap-3.5 py-2.5", className)} role="status" aria-live="polite">
      <span aria-hidden className="grid size-8 shrink-0 place-items-center rounded-full bg-[linear-gradient(145deg,color-mix(in_oklch,var(--color-ember)_55%,var(--color-surface-2)),var(--color-surface-2))] font-display text-sm font-semibold text-fg ring-1 ring-white/[0.08]">{label.slice(0, 1)}</span>
      <div className="relative min-h-6 min-w-0 flex-1 overflow-hidden">
        <AnimatePresence mode="wait" initial={false}>
          <motion.p key={i} initial={reduce ? false : { opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} exit={reduce ? undefined : { opacity: 0, y: -5 }} transition={{ duration: 0.32, ease: [0.25, 1, 0.5, 1] }} className="truncate font-display text-base tracking-tight text-fg md:text-lg"><span className="sr-only">{label}: </span>{cur.text}</motion.p>
        </AnimatePresence>
      </div>
      {items.length > 1 ? <span aria-hidden className="shrink-0 text-2xs tabular text-fg-subtle">{i + 1}<span className="mx-0.5 opacity-50">/</span>{items.length}</span> : null}
      {items.length > 1 && !reduce ? <span aria-hidden className="absolute inset-x-0 bottom-0 left-[2.9rem] h-px overflow-hidden bg-white/[0.06]"><motion.span key={i} initial={{ scaleX: 0 }} animate={{ scaleX: 1 }} transition={{ duration: interval / 1000, ease: "linear" }} className={cn("block h-full origin-left opacity-70", line)} /></span> : null}
    </div>
  );
}

/** Animated count-up for headline numbers. */
export function CountUp({ value, duration = 900, className, decimals = 0 }: { value: number; duration?: number; className?: string; decimals?: number }) {
  const reduce = useReducedMotion();
  const [v, setV] = React.useState(reduce ? value : 0);
  React.useEffect(() => {
    if (reduce) return setV(value);
    let raf = 0; const start = performance.now(); const from = 0;
    const tick = (t: number) => { const p = Math.min(1, (t - start) / duration); const e = 1 - Math.pow(1 - p, 3); setV(from + (value - from) * e); if (p < 1) raf = requestAnimationFrame(tick); };
    raf = requestAnimationFrame(tick); return () => cancelAnimationFrame(raf);
  }, [value, duration, reduce]);
  return <span className={cn("tabular", className)}>{v.toFixed(decimals)}</span>;
}

/** Tiny inline sparkline for stat tiles. */
export function Sparkline({ points, className, tone = "ember" }: { points: number[]; className?: string; tone?: "ember" | "signal" | "sky" | "amber" }) {
  if (points.length < 2) return null;
  const w = 96, h = 28, max = Math.max(...points), min = Math.min(...points);
  const d = points.map((p, i) => `${(i / (points.length - 1)) * w},${h - ((p - min) / Math.max(1e-6, max - min)) * (h - 4) - 2}`).join(" ");
  const color = { ember: "var(--color-ember)", signal: "var(--color-signal)", sky: "var(--color-sky)", amber: "var(--color-amber)" }[tone];
  return (<svg viewBox={`0 0 ${w} ${h}`} width={w} height={h} className={cn("overflow-visible", className)} aria-hidden><polyline points={d} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /><circle cx={w} cy={h - ((points[points.length - 1]! - min) / Math.max(1e-6, max - min)) * (h - 4) - 2} r="2.5" fill={color} /></svg>);
}
