"use client";
import { useState } from "react";
import { Area, AreaChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { motion, useReducedMotion } from "motion/react";
import { Sparkles, TrendingUp } from "lucide-react";
import { CountUp, Progress, cn } from "@kettleworth/ui";
import { dayMonth } from "@/lib/dates";
import { NotYet, compact } from "./charts";

type Point = { date: string; bodyFatPct: number | null; bodyFatLow: number | null; bodyFatHigh: number | null; weightKg: number | null; leanMassKg: number | null; fatMassKg: number | null; waistCm: number | null; confidence: number; note: string | null };
type Growth = { total: number; breakdown: { label: string; points: number }[]; level: number; nextLevelAt: number };
type Trend = { perWeek: number | null; sentence: string };
const tip = { contentStyle: { background: "var(--color-bg-elevated)", border: "1px solid var(--color-border)", borderRadius: 12, fontSize: 12 }, labelStyle: { color: "var(--color-fg-muted)" } };
const axis = { tick: { fill: "var(--color-fg-subtle)", fontSize: 11 }, axisLine: false, tickLine: false } as const;

export function GrowthPanel({ growth }: { growth: Growth }) {
  const prev = growth.level === 0 ? 0 : growth.level * growth.level * 100 + 400 * growth.level;
  const pct = ((growth.total - prev) / Math.max(1, growth.nextLevelAt - prev)) * 100;
  const reduce = useReducedMotion();
  return (
    <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-surface via-bg-elevated to-bg p-6 ring-1 ring-white/[0.05]">
      <div aria-hidden className="pointer-events-none absolute -left-20 -top-24 size-72 rounded-full bg-ember/20 blur-3xl" />
      <div className="relative flex flex-wrap items-end justify-between gap-6">
        <div>
          <div className="eyebrow">Growth</div>
          <div className="mt-1 flex items-baseline gap-2"><span className="font-display text-6xl font-semibold tracking-tightest"><CountUp value={growth.total} /></span><span className="text-sm text-fg-muted">points · level {growth.level}</span></div>
          <p className="mt-2 max-w-md text-sm text-fg-muted">Every session, set, weigh-in, PR and body check adds. It never goes down. {growth.nextLevelAt - growth.total} to level {growth.level + 1}.</p>
        </div>
        <ul className="grid grid-cols-2 gap-x-6 gap-y-1 text-xs text-fg-muted sm:grid-cols-3">{growth.breakdown.filter((b) => b.points > 0).map((b) => <li key={b.label} className="flex justify-between gap-3"><span>{b.label}</span><span className="tabular text-fg">{b.points}</span></li>)}</ul>
      </div>
      <motion.div initial={reduce ? false : { scaleX: 0 }} animate={{ scaleX: 1 }} transition={{ duration: 0.8, ease: [0.25, 1, 0.5, 1] }} className="relative mt-5 origin-left"><Progress value={pct} /></motion.div>
    </section>
  );
}

export function PhysiqueCharts({ timeline, trends, unit }: { timeline: Point[]; trends: { bodyFat: Trend; leanMass: Trend; weight: Trend; waist: Trend }; unit: "kg" | "lb" }) {
  const k = unit === "lb" ? 2.2046 : 1;
  // One point per day: several readings on the same date (a weigh-in and a photo read) collapse to the latest.
  const perDay = [...new Map(timeline.map((t) => [t.date.slice(0, 10), t])).values()];
  const data = perDay.map((t) => ({ date: dayMonth(t.date), bf: t.bodyFatPct, lo: t.bodyFatLow, hi: t.bodyFatHigh, lean: t.leanMassKg != null ? Math.round(t.leanMassKg * k * 10) / 10 : null, fat: t.fatMassKg != null ? Math.round(t.fatMassKg * k * 10) / 10 : null, weight: t.weightKg != null ? Math.round(t.weightKg * k * 10) / 10 : null }));
  const hasBf = data.filter((d) => d.bf != null).length >= 2, hasLean = data.filter((d) => d.lean != null).length >= 2;
  const lastLean = [...data].reverse().find((d) => d.lean != null), lastBf = [...data].reverse().find((d) => d.bf != null);
  if (!data.length) return <p className="text-sm text-fg-muted">Log a weigh-in and take a body check and the physique timeline starts here.</p>;
  return (
    <div className="grid gap-8 lg:grid-cols-2">
      <div>
        <div className="mb-2 flex flex-col gap-0.5 sm:flex-row sm:items-center sm:justify-between"><h3 className="font-display text-base font-semibold">Body composition</h3><span className="text-xs text-fg-subtle">{trends.leanMass.sentence}</span></div>
        {hasLean ? (<div className="h-56"><ResponsiveContainer><AreaChart data={data} margin={{ left: 0, right: 8, top: 8, bottom: 0 }}><defs><linearGradient id="lean" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="var(--color-signal)" stopOpacity={0.5} /><stop offset="100%" stopColor="var(--color-signal)" stopOpacity={0} /></linearGradient><linearGradient id="fat" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="var(--color-amber)" stopOpacity={0.4} /><stop offset="100%" stopColor="var(--color-amber)" stopOpacity={0} /></linearGradient></defs><CartesianGrid stroke="var(--color-border)" vertical={false} /><XAxis dataKey="date" {...axis} minTickGap={24} interval="preserveStartEnd" /><YAxis {...axis} width={34} tickCount={4} tickFormatter={compact} /><Tooltip {...tip} formatter={(v, n) => [`${v} ${unit}`, n === "lean" ? "Lean mass" : "Fat mass"]} /><Area type="monotone" dataKey="lean" stackId="1" stroke="var(--color-signal)" fill="url(#lean)" connectNulls /><Area type="monotone" dataKey="fat" stackId="1" stroke="var(--color-amber)" fill="url(#fat)" connectNulls /></AreaChart></ResponsiveContainer></div>) : <NotYet value={lastLean ? `${lastLean.lean} ${unit} lean` : null} label={lastLean ? "Latest estimate" : "Lean and fat mass"} hint={lastLean ? "The composition line appears after a second weigh-in with a body check." : "Needs a weigh-in plus a body check to estimate lean and fat mass."} />}
      </div>
      <div>
        <div className="mb-2 flex flex-col gap-0.5 sm:flex-row sm:items-center sm:justify-between"><h3 className="font-display text-base font-semibold">Body fat estimate</h3><span className="text-xs text-fg-subtle">{trends.bodyFat.sentence}</span></div>
        {hasBf ? (<div className="h-56"><ResponsiveContainer><LineChart data={data} margin={{ left: 0, right: 8, top: 8, bottom: 0 }}><CartesianGrid stroke="var(--color-border)" vertical={false} /><XAxis dataKey="date" {...axis} minTickGap={24} interval="preserveStartEnd" /><YAxis {...axis} width={30} tickCount={4} domain={["dataMin - 3", "dataMax + 3"]} /><Tooltip {...tip} formatter={(v, n) => [`${v}%`, n === "bf" ? "Estimate" : n === "lo" ? "Low" : "High"]} /><Line type="monotone" dataKey="hi" stroke="var(--color-border-strong)" strokeDasharray="3 3" dot={false} connectNulls /><Line type="monotone" dataKey="lo" stroke="var(--color-border-strong)" strokeDasharray="3 3" dot={false} connectNulls /><Line type="monotone" dataKey="bf" stroke="var(--color-ember)" strokeWidth={2.5} dot={{ r: 4 }} connectNulls /></LineChart></ResponsiveContainer></div>) : <NotYet value={lastBf ? `${lastBf.bf}%` : null} label={lastBf ? "Latest estimate" : "Body fat"} hint={lastBf ? "Take another body check in a few weeks and the line starts. Dashed lines will show the range." : "Take a body check to start the estimate line."} />}
        {timeline.filter((t) => t.note).slice(-1).map((t) => <p key={t.date} className="mt-2 text-xs text-fg-subtle"><Sparkles className="mr-1 inline size-3 text-ember" />{t.note}</p>)}
      </div>
    </div>
  );
}

/** Before/after slider: drag to reveal. Same pose, same light, and the change is impossible to argue with. */
export function CompareSlider({ before, after }: { before: { id: string; date: string }; after: { id: string; date: string } }) {
  const [x, setX] = useState(50);
  return (
    <div className="space-y-2">
      <div className="relative aspect-[3/4] max-h-[520px] w-full overflow-hidden rounded-3xl bg-surface-2 select-none" style={{ maxWidth: 390 }}>
        <img src={`/api/photos/${after.id}`} alt={`After, ${after.date}`} className="absolute inset-0 size-full object-cover" draggable={false} />
        <div className="absolute inset-0 overflow-hidden" style={{ width: `${x}%` }}><img src={`/api/photos/${before.id}`} alt={`Before, ${before.date}`} className="absolute inset-0 size-full max-w-none object-cover" style={{ width: `${10000 / x}%` }} draggable={false} /></div>
        <div className="absolute inset-y-0" style={{ left: `calc(${x}% - 1px)` }}><div className="h-full w-0.5 bg-white/80 shadow-[0_0_12px_rgba(0,0,0,0.6)]" /><div className="absolute top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/60 bg-black/60 px-2 py-1 text-2xs font-semibold text-white backdrop-blur">⇆</div></div>
        <span className="absolute left-3 top-3 rounded-full bg-black/60 px-2 py-0.5 text-2xs font-semibold text-white backdrop-blur">{before.date}</span>
        <span className="absolute right-3 top-3 rounded-full bg-ember px-2 py-0.5 text-2xs font-semibold text-ember-fg">{after.date}</span>
        <input type="range" min={2} max={98} value={x} onChange={(e) => setX(Number(e.target.value))} aria-label="Compare before and after" className="absolute inset-0 h-full w-full cursor-ew-resize opacity-0" />
      </div>
      <p className="text-xs text-fg-subtle"><TrendingUp className="mr-1 inline size-3" /> Drag to compare your first and latest front photos.</p>
    </div>
  );
}
export const cnx = cn;
