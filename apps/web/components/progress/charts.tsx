"use client";
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis, Legend } from "recharts";
const tip = { contentStyle: { background: "var(--color-bg-elevated)", border: "1px solid var(--color-border)", borderRadius: 10, fontSize: 12 }, labelStyle: { color: "var(--color-fg-muted)" } };
const axis = { tick: { fill: "var(--color-fg-subtle)", fontSize: 11 }, axisLine: false, tickLine: false } as const;
const SERIES = ["var(--color-series-1)", "var(--color-series-2)", "var(--color-series-3)", "var(--color-series-4)", "var(--color-series-5)", "var(--color-series-6)"];

export function E1RMChart({ series, unit }: { series: { name: string; points: { week: string; value: number }[] }[]; unit: string }) {
  const weeks = [...new Set(series.flatMap((s) => s.points.map((p) => p.week)))].sort();
  const data = weeks.map((wk) => Object.fromEntries([["week", wk.slice(5)], ...series.map((s) => [s.name, s.points.find((p) => p.week === wk)?.value ?? null])]));
  return (<div className="h-64"><ResponsiveContainer><LineChart data={data} margin={{ left: -10, right: 8, top: 8 }}><CartesianGrid stroke="var(--color-border)" vertical={false} /><XAxis dataKey="week" {...axis} /><YAxis {...axis} unit="" /><Tooltip {...tip} formatter={(v) => [`${v} ${unit}`, ""]} /><Legend wrapperStyle={{ fontSize: 11 }} />{series.map((s, i) => <Line key={s.name} type="monotone" dataKey={s.name} stroke={SERIES[i % SERIES.length]} strokeWidth={2} dot={{ r: 3 }} connectNulls />)}</LineChart></ResponsiveContainer></div>);
}
export function TonnageChart({ data, unit }: { data: { week: string; kg: number }[]; unit: string }) {
  return (<div className="h-56"><ResponsiveContainer><BarChart data={data.map((d) => ({ ...d, week: d.week.slice(5) }))} margin={{ left: -10, right: 8, top: 8 }}><CartesianGrid stroke="var(--color-border)" vertical={false} /><XAxis dataKey="week" {...axis} /><YAxis {...axis} /><Tooltip {...tip} cursor={{ fill: "var(--color-surface-2)" }} formatter={(v) => [`${Number(v).toLocaleString()} ${unit}`, "Tonnage"]} /><Bar dataKey="kg" fill="var(--color-ember)" radius={[6, 6, 0, 0]} /></BarChart></ResponsiveContainer></div>);
}
export function WeightChart({ data, unit }: { data: { date: string; value: number }[]; unit: string }) {
  return (<div className="h-48"><ResponsiveContainer><AreaChart data={data.map((d) => ({ ...d, date: d.date.slice(5) }))} margin={{ left: -10, right: 8, top: 8 }}><defs><linearGradient id="wg" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="var(--color-sky)" stopOpacity={0.4} /><stop offset="100%" stopColor="var(--color-sky)" stopOpacity={0} /></linearGradient></defs><CartesianGrid stroke="var(--color-border)" vertical={false} /><XAxis dataKey="date" {...axis} /><YAxis {...axis} domain={["dataMin - 2", "dataMax + 2"]} /><Tooltip {...tip} formatter={(v) => [`${v} ${unit}`, "Weight"]} /><Area type="monotone" dataKey="value" stroke="var(--color-sky)" strokeWidth={2} fill="url(#wg)" /></AreaChart></ResponsiveContainer></div>);
}
export function VolumeCompare({ thisWeek, lastWeek }: { thisWeek: Record<string, number>; lastWeek: Record<string, number> }) {
  const muscles = [...new Set([...Object.keys(thisWeek), ...Object.keys(lastWeek)])].sort((a, b) => (thisWeek[b] ?? 0) - (thisWeek[a] ?? 0)).slice(0, 10);
  if (!muscles.length) return <p className="text-sm text-fg-subtle">No sets logged in the last two weeks.</p>;
  const data = muscles.map((m) => ({ muscle: m.replace(/_/g, " "), "This week": thisWeek[m] ?? 0, "Last week": lastWeek[m] ?? 0 }));
  return (<div className="h-64"><ResponsiveContainer><BarChart data={data} layout="vertical" margin={{ left: 8, right: 8 }}><XAxis type="number" hide /><YAxis type="category" dataKey="muscle" width={84} {...axis} /><Tooltip {...tip} cursor={{ fill: "var(--color-surface-2)" }} /><Legend wrapperStyle={{ fontSize: 11 }} /><Bar dataKey="This week" fill="var(--color-ember)" radius={[0, 4, 4, 0]} /><Bar dataKey="Last week" fill="var(--color-surface-3)" radius={[0, 4, 4, 0]} /></BarChart></ResponsiveContainer></div>);
}
