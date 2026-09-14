"use client";
import * as React from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { cn } from "../lib/cn";
import { BrandSeal } from "./logo";

export type PulseItem = { text: string; tone?: "ember" | "signal" | "amber" | "sky" | "neutral" };

/**
 * The coach's line. The brand seal (or a supplied avatar), one sentence in the display face, and a thin
 * arc around the mark that fills over the interval so the reader feels the cadence without a blinking light. Cycles
 * through real, computed facts (never fabricated). Respects reduced motion (no cycling, no arc).
 */
export function CoachPulse({ items, interval = 5200, className, label = "Coach", avatar }: { items: PulseItem[]; interval?: number; className?: string; label?: string; avatar?: string }) {
  const reduce = useReducedMotion();
  const [i, setI] = React.useState(0);
  React.useEffect(() => { if (reduce || items.length < 2) return; const t = setInterval(() => setI((x) => (x + 1) % items.length), interval); return () => clearInterval(t); }, [items.length, interval, reduce]);
  const cur = items[i % Math.max(1, items.length)];
  if (!cur) return null;
  const stroke = { ember: "var(--color-ember)", signal: "var(--color-signal)", amber: "var(--color-amber)", sky: "var(--color-sky)", neutral: "var(--color-fg-subtle)" }[cur.tone ?? "ember"];
  const size = 44, r = 20, c = 2 * Math.PI * r;
  return (
    <div className={cn("flex min-w-0 items-center gap-4 py-2", className)} role="status" aria-live="polite">
      <span aria-hidden className="relative grid shrink-0 place-items-center" style={{ width: size, height: size }}>
        {avatar ? <img src={avatar} alt="" className="size-9 rounded-full object-cover ring-1 ring-white/[0.08]" /> : <BrandSeal size={36} />}
        {items.length > 1 && !reduce ? (
          <svg className="absolute inset-0 -rotate-90" viewBox={`0 0 ${size} ${size}`} width={size} height={size}>
            <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="currentColor" strokeWidth="1" className="text-white/[0.07]" />
            <motion.circle key={i} cx={size / 2} cy={size / 2} r={r} fill="none" stroke={stroke} strokeWidth="1.25" strokeLinecap="round" strokeDasharray={c} initial={{ strokeDashoffset: c }} animate={{ strokeDashoffset: 0 }} transition={{ duration: interval / 1000, ease: "linear" }} style={{ opacity: 0.85 }} />
          </svg>
        ) : null}
      </span>
      <div className="relative min-h-6 min-w-0 flex-1">
        <AnimatePresence mode="wait" initial={false}>
          <motion.p key={i} initial={reduce ? false : { opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} exit={reduce ? undefined : { opacity: 0, y: -5 }} transition={{ duration: 0.32, ease: [0.25, 1, 0.5, 1] }} className="line-clamp-2 font-display text-base leading-snug tracking-tight text-fg md:line-clamp-1 md:text-lg"><span className="sr-only">{label}: </span>{cur.text}</motion.p>
        </AnimatePresence>
      </div>
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
