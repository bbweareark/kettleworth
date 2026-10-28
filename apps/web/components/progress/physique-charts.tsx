"use client";
import { Area, AreaChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Sparkles } from "lucide-react";
import { dayMonth } from "@/lib/dates";
import { NotYet, compact } from "./charts-plain";

/**
 * The physique timeline, kept apart from the rest of the Progress panels on purpose.
 *
 * It is the only thing on this screen that needs Recharts - 361KB - and GrowthPanel and
 * CompareSlider sit above it. While they lived in the same module, importing either of them
 * pulled the whole charting library into the first load for a pair of charts you have to
 * scroll twice to reach.
 */
type Point = { date: string; bodyFatPct: number | null; bodyFatLow: number | null; bodyFatHigh: number | null; weightKg: number | null; leanMassKg: number | null; fatMassKg: number | null; note?: string | null };
type Trend = { perWeek: number | null; sentence: string };
const tip = { contentStyle: { background: "var(--color-bg-elevated)", border: "1px solid var(--color-border)", borderRadius: 12, fontSize: 12 }, labelStyle: { color: "var(--color-fg-muted)" } } as const;
const axis = { tick: { fill: "var(--color-fg-subtle)", fontSize: 11 }, axisLine: false, tickLine: false } as const;

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
        <div className="mb-2 flex flex-col gap-0.5 sm:flex-row sm:items-center sm:justify-between"><h3 className="font-display text-base">Body composition</h3><span className="text-xs text-fg-subtle">{trends.leanMass.sentence}</span></div>
        {hasLean ? (<div className="h-56"><ResponsiveContainer><AreaChart data={data} margin={{ left: 0, right: 8, top: 8, bottom: 0 }}><defs><linearGradient id="lean" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="var(--color-signal)" stopOpacity={0.5} /><stop offset="100%" stopColor="var(--color-signal)" stopOpacity={0} /></linearGradient><linearGradient id="fat" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="var(--color-amber)" stopOpacity={0.4} /><stop offset="100%" stopColor="var(--color-amber)" stopOpacity={0} /></linearGradient></defs><CartesianGrid stroke="var(--color-border)" vertical={false} /><XAxis dataKey="date" {...axis} minTickGap={24} interval="preserveStartEnd" /><YAxis {...axis} width={34} tickCount={4} tickFormatter={compact} /><Tooltip {...tip} formatter={(v, n) => [`${v} ${unit}`, n === "lean" ? "Lean mass" : "Fat mass"]} /><Area type="monotone" dataKey="lean" stackId="1" stroke="var(--color-signal)" fill="url(#lean)" connectNulls /><Area type="monotone" dataKey="fat" stackId="1" stroke="var(--color-amber)" fill="url(#fat)" connectNulls /></AreaChart></ResponsiveContainer></div>) : <NotYet value={lastLean ? `${lastLean.lean} ${unit} lean` : null} label={lastLean ? "Latest estimate" : "Lean and fat mass"} hint={lastLean ? "The composition line appears after a second weigh-in with a body check." : "Needs a weigh-in plus a body check to estimate lean and fat mass."} />}
      </div>
      <div>
        <div className="mb-2 flex flex-col gap-0.5 sm:flex-row sm:items-center sm:justify-between"><h3 className="font-display text-base">Body fat estimate</h3><span className="text-xs text-fg-subtle">{trends.bodyFat.sentence}</span></div>
        {hasBf ? (<div className="h-56"><ResponsiveContainer><LineChart data={data} margin={{ left: 0, right: 8, top: 8, bottom: 0 }}><CartesianGrid stroke="var(--color-border)" vertical={false} /><XAxis dataKey="date" {...axis} minTickGap={24} interval="preserveStartEnd" /><YAxis {...axis} width={30} tickCount={4} domain={["dataMin - 3", "dataMax + 3"]} /><Tooltip {...tip} formatter={(v, n) => [`${v}%`, n === "bf" ? "Estimate" : n === "lo" ? "Low" : "High"]} /><Line type="monotone" dataKey="hi" stroke="var(--color-border-strong)" strokeDasharray="3 3" dot={false} connectNulls /><Line type="monotone" dataKey="lo" stroke="var(--color-border-strong)" strokeDasharray="3 3" dot={false} connectNulls /><Line type="monotone" dataKey="bf" stroke="var(--color-ember)" strokeWidth={2.5} dot={{ r: 4 }} connectNulls /></LineChart></ResponsiveContainer></div>) : <NotYet value={lastBf ? `${lastBf.bf}%` : null} label={lastBf ? "Latest estimate" : "Body fat"} hint={lastBf ? "Take another body check in a few weeks and the line starts. Dashed lines will show the range." : "Take a body check to start the estimate line."} />}
        {timeline.filter((t) => t.note).slice(-1).map((t) => <p key={t.date} className="mt-2 text-xs text-fg-subtle"><Sparkles className="mr-1 inline size-3 text-volt" />{t.note}</p>)}
      </div>
    </div>
  );
}
