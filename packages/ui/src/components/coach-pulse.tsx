"use client";
import * as React from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { cn } from "../lib/cn";

export type PulseItem = { text: string; tone?: "ember" | "signal" | "amber" | "sky" | "neutral" };

/**
 * The coach's live status line. Cycles through real, computed facts (never fabricated) with a breathing indicator,
 * so the app reads as continuously analysing rather than a static report. Respects reduced motion (no cycling).
 */
export function CoachPulse({ items, interval = 4200, className, label = "Coach" }: { items: PulseItem[]; interval?: number; className?: string; label?: string }) {
  const reduce = useReducedMotion();
  const [i, setI] = React.useState(0);
  React.useEffect(() => { if (reduce || items.length < 2) return; const t = setInterval(() => setI((x) => (x + 1) % items.length), interval); return () => clearInterval(t); }, [items.length, interval, reduce]);
  const cur = items[i % Math.max(1, items.length)];
  if (!cur) return null;
  const dot = { ember: "bg-ember", signal: "bg-signal", amber: "bg-amber", sky: "bg-sky", neutral: "bg-fg-subtle" }[cur.tone ?? "ember"];
  return (
    <div className={cn("flex items-center gap-3 rounded-full border border-border bg-surface/60 py-2 pl-3 pr-4 text-sm backdrop-blur", className)} role="status" aria-live="polite">
      <span className="relative flex size-2.5 shrink-0"><span className={cn("absolute inline-flex size-full animate-ping rounded-full opacity-60", dot)} /><span className={cn("relative inline-flex size-2.5 rounded-full", dot)} /></span>
      <span className="text-2xs font-semibold uppercase tracking-[0.14em] text-fg-subtle">{label}</span>
      <div className="relative min-h-5 flex-1 overflow-hidden">
        <AnimatePresence mode="wait" initial={false}>
          <motion.span key={i} initial={reduce ? false : { opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={reduce ? undefined : { opacity: 0, y: -6 }} transition={{ duration: 0.28, ease: [0.25, 1, 0.5, 1] }} className="block truncate text-fg">{cur.text}</motion.span>
        </AnimatePresence>
      </div>
      {items.length > 1 && <span className="hidden gap-1 sm:flex" aria-hidden>{items.map((_, k) => <span key={k} className={cn("size-1 rounded-full transition-colors", k === i ? "bg-fg" : "bg-surface-3")} />)}</span>}
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
