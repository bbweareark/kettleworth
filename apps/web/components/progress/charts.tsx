"use client";
import { useMemo, useState } from "react";
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { cn } from "@kettleworth/ui";
import { dayMonth } from "@/lib/dates";

/**
 * Progress charts, built for a phone first: compact axes that never steal a third of the width, date labels a person
 * reads ("8 Sep", not "W37" or "09-13"), no chart at all until there are two points to connect, and a legend you can
 * tap rather than a paragraph of coloured names.
 */
export const chartTip = { contentStyle: { background: "var(--color-bg-elevated)", border: "1px solid var(--color-border)", borderRadius: 12, fontSize: 12 }, labelStyle: { color: "var(--color-fg-muted)" } };
export const chartAxis = { tick: { fill: "var(--color-fg-subtle)", fontSize: 11 }, axisLine: false, tickLine: false } as const;
const SERIES = ["var(--color-ember)", "var(--color-sky)", "var(--color-signal)", "var(--color-amber)", "var(--color-series-5)", "var(--color-series-6)"];

/** "2026-W37" to the date of that week's Monday, so a week reads as "8 Sep". */
export function weekStart(isoWeekKey: string): string {
  const m = isoWeekKey.match(/^(\d{4})-W(\d{1,2})$/);
  if (!m) return isoWeekKey;
  const year = Number(m[1]), wk = Number(m[2]);
  const jan4 = new Date(Date.UTC(year, 0, 4));
  const monday = new Date(jan4); monday.setUTCDate(jan4.getUTCDate() - ((jan4.getUTCDay() + 6) % 7) + (wk - 1) * 7);
  return monday.toISOString().slice(0, 10);
}
/** 14000 as "14k", so the axis stays narrow. */
export const compact = (n: number) => (Math.abs(n) >= 10000 ? `${Math.round(n / 1000)}k` : Math.abs(n) >= 1000 ? `${Math.round(n / 100) / 10}k` : String(Math.round(n * 10) / 10));

/** What to show before there are two points: the number that exists, and when the line will appear. */
export function NotYet({ value, label, hint }: { value?: string | null; label: string; hint: string }) {
  return (
    <div className="flex min-h-32 flex-col justify-center rounded-2xl bg-black/20 px-4 py-5 ring-1 ring-white/[0.05]">
      {value ? <div className="font-display text-3xl font-semibold tabular tracking-tight">{value}</div> : null}
      <div className="text-2xs uppercase tracking-[0.14em] text-fg-subtle">{label}</div>
      <p className="mt-1.5 text-sm text-fg-muted">{hint}</p>
    </div>
  );
}

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
          <button key={s.name} type="button" aria-pressed={on} onClick={() => setShown((x) => (on ? x.filter((n) => n !== s.name) : [...x, s.name]))} className={cn("inline-flex h-7 max-w-full items-center gap-1.5 rounded-full px-2.5 text-xs ring-1 transition-colors", on ? "bg-white/[0.06] text-fg ring-white/15" : "text-fg-subtle ring-white/[0.06]")}>
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

export function VolumeCompare({ thisWeek, lastWeek }: { thisWeek: Record<string, number>; lastWeek: Record<string, number> }) {
  const muscles = [...new Set([...Object.keys(thisWeek), ...Object.keys(lastWeek)])].sort((a, b) => (thisWeek[b] ?? 0) - (thisWeek[a] ?? 0)).slice(0, 8);
  if (!muscles.length) return <p className="text-sm text-fg-subtle">No sets logged in the last two weeks.</p>;
  const max = Math.max(1, ...muscles.map((m) => Math.max(thisWeek[m] ?? 0, lastWeek[m] ?? 0)));
  // Plain bars instead of a chart library: labels never truncate, and it reads cleanly at any width.
  return (
    <div className="space-y-2.5">
      <div className="flex justify-end gap-3 text-2xs text-fg-subtle"><span className="inline-flex items-center gap-1"><span className="size-2 rounded-full bg-ember" />This week</span><span className="inline-flex items-center gap-1"><span className="size-2 rounded-full bg-white/25" />Last week</span></div>
      {muscles.map((m) => { const t = thisWeek[m] ?? 0, l = lastWeek[m] ?? 0; return (
        <div key={m} className="grid grid-cols-[5.5rem_1fr_2rem] items-center gap-2">
          <span className="truncate text-xs capitalize text-fg-muted">{m.replace(/_/g, " ")}</span>
          <div className="space-y-1"><div className="h-2 overflow-hidden rounded-full bg-white/[0.05]"><div className="h-full rounded-full bg-ember" style={{ width: `${(t / max) * 100}%` }} /></div><div className="h-1.5 overflow-hidden rounded-full bg-white/[0.04]"><div className="h-full rounded-full bg-white/25" style={{ width: `${(l / max) * 100}%` }} /></div></div>
          <span className="text-right text-xs tabular text-fg">{t}</span>
        </div>); })}
    </div>
  );
}
