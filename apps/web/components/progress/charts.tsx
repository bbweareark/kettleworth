"use client";
import { useMemo, useState } from "react";
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { cn } from "@kettleworth/ui";
import { dayMonth } from "@/lib/dates";
import { compact, weekStart, NotYet } from "./charts-plain";

/** Re-exported so existing imports from this module keep working. */
export { compact, weekStart, NotYet, VolumeCompare } from "./charts-plain";

/**
 * Progress charts, built for a phone first: compact axes that never steal a third of the width, date labels a person
 * reads ("8 Sep", not "W37" or "09-13"), no chart at all until there are two points to connect, and a legend you can
 * tap rather than a paragraph of coloured names.
 */
export const chartTip = { contentStyle: { background: "var(--color-bg-elevated)", border: "1px solid var(--color-border)", borderRadius: 12, fontSize: 12 }, labelStyle: { color: "var(--color-fg-muted)" } };
export const chartAxis = { tick: { fill: "var(--color-fg-subtle)", fontSize: 11 }, axisLine: false, tickLine: false } as const;
const SERIES = ["var(--color-ember)", "var(--color-sky)", "var(--color-signal)", "var(--color-amber)", "var(--color-series-5)", "var(--color-series-6)"];


const Y = (props: Record<string, unknown>) => <YAxis {...chartAxis} width={34} tickCount={4} tickFormatter={compact} {...props} />;

export function E1RMChart({ series, unit }: { series: { name: string; points: { week: string; value: number }[] }[]; unit: string }) {
  const ranked = useMemo(() => [...series].sort((a, b) => b.points.length - a.points.length), [series]);
  const [shown, setShown] = useState<string[]>(() => ranked.slice(0, 3).map((s) => s.name));
  const weeks = [...new Set(series.flatMap((s) => s.points.map((p) => p.week)))].sort();
  if (weeks.length < 2) {
    const best = ranked[0]?.points.at(-1);
    return <NotYet value={best ? `${Math.round(best.value)} ${unit}` : null} label={best ? `${ranked[0]!.name}, estimated max` : "Estimated max"} hint="Your strength line appears after a second week of training." />;
  }
  const data = weeks.map((wk) => Object.fromEntries([["week", dayMonth(weekStart(wk))], ...series.map((s) => [s.name, s.points.find((p) => p.week === wk)?.value ?? null])]));
  return (
    <div>
      <div className="h-56"><ResponsiveContainer><LineChart data={data} margin={{ left: 0, right: 8, top: 8, bottom: 0 }}><CartesianGrid stroke="var(--color-border)" vertical={false} /><XAxis dataKey="week" {...chartAxis} minTickGap={24} interval="preserveStartEnd" /><Y /><Tooltip {...chartTip} formatter={(v, n) => [`${v} ${unit}`, n]} />
        {ranked.map((s, i) => shown.includes(s.name) ? <Line key={s.name} type="monotone" dataKey={s.name} stroke={SERIES[i % SERIES.length]} strokeWidth={2.25} dot={{ r: 3 }} connectNulls /> : null)}
      </LineChart></ResponsiveContainer></div>
      <div className="mt-2 flex flex-wrap gap-1.5" role="group" aria-label="Lifts shown">
        {ranked.map((s, i) => { const on = shown.includes(s.name); return (
          <button key={s.name} type="button" aria-pressed={on} onClick={() => setShown((x) => (on ? x.filter((n) => n !== s.name) : [...x, s.name]))} className={cn("inline-flex h-7 max-w-full items-center gap-1.5  px-2.5 text-xs border transition-colors", on ? "bg-rule text-fg border-rule-strong" : "text-fg-subtle border-rule")}>
            <span className="size-2 shrink-0 rounded-full" style={{ background: on ? SERIES[i % SERIES.length] : "var(--color-surface-3)" }} /><span className="truncate">{s.name}</span>
          </button>); })}
      </div>
    </div>
  );
}

export function TonnageChart({ data, unit }: { data: { week: string; kg: number }[]; unit: string }) {
  if (data.length < 2) return <NotYet value={data[0] ? `${compact(data[0].kg)} ${unit}` : null} label="Moved this week" hint="Weekly bars appear once you have two weeks to compare." />;
  const rows = data.map((d) => ({ week: dayMonth(weekStart(d.week)), kg: d.kg }));
  return (<div className="h-52"><ResponsiveContainer><BarChart data={rows} margin={{ left: 0, right: 8, top: 8, bottom: 0 }}><CartesianGrid stroke="var(--color-border)" vertical={false} /><XAxis dataKey="week" {...chartAxis} minTickGap={16} interval="preserveStartEnd" /><Y /><Tooltip {...chartTip} cursor={{ fill: "var(--color-surface-2)" }} formatter={(v) => [`${Number(v).toLocaleString("en-GB")} ${unit}`, "Moved"]} /><Bar dataKey="kg" fill="var(--color-ember)" radius={[6, 6, 0, 0]} maxBarSize={28} /></BarChart></ResponsiveContainer></div>);
}

export function WeightChart({ data, unit }: { data: { date: string; value: number }[]; unit: string }) {
  const byDay = [...new Map(data.map((d) => [d.date.slice(0, 10), d])).values()];
  if (byDay.length < 2) return <NotYet value={byDay[0] ? `${byDay[0].value} ${unit}` : null} label={byDay[0] ? `Weighed ${dayMonth(byDay[0].date)}` : "Bodyweight"} hint="Weigh in again next week, same time of day, and the trend line starts." />;
  const rows = byDay.map((d) => ({ date: dayMonth(d.date), value: d.value }));
  return (<div className="h-48"><ResponsiveContainer><AreaChart data={rows} margin={{ left: 0, right: 8, top: 8, bottom: 0 }}><defs><linearGradient id="wg" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="var(--color-sky)" stopOpacity={0.4} /><stop offset="100%" stopColor="var(--color-sky)" stopOpacity={0} /></linearGradient></defs><CartesianGrid stroke="var(--color-border)" vertical={false} /><XAxis dataKey="date" {...chartAxis} minTickGap={24} interval="preserveStartEnd" /><Y domain={["dataMin - 1", "dataMax + 1"]} /><Tooltip {...chartTip} formatter={(v) => [`${v} ${unit}`, "Weight"]} /><Area type="monotone" dataKey="value" stroke="var(--color-sky)" strokeWidth={2} fill="url(#wg)" dot={{ r: 3 }} /></AreaChart></ResponsiveContainer></div>);
}
