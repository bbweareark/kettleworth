"use client";
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
export function VolumeChart({ data }: { data: Record<string, number> }) {
  const rows = Object.entries(data).map(([m, sets]) => ({ muscle: m.replace(/_/g, " "), sets })).sort((a, b) => b.sets - a.sets).slice(0, 10);
  if (!rows.length) return <p className="text-sm text-fg-subtle">No volume data.</p>;
  return (
    <div className="h-56">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={rows} layout="vertical" margin={{ left: 8, right: 8, top: 4, bottom: 4 }}>
          <XAxis type="number" hide />
          <YAxis type="category" dataKey="muscle" width={84} tick={{ fill: "var(--color-fg-muted)", fontSize: 11 }} axisLine={false} tickLine={false} />
          <Tooltip cursor={{ fill: "var(--color-surface-2)" }} contentStyle={{ background: "var(--color-bg-elevated)", border: "1px solid var(--color-border)", borderRadius: 10, fontSize: 12 }} formatter={(v) => [`${v} sets`, ""]} />
          <Bar dataKey="sets" fill="var(--color-ember)" radius={[0, 6, 6, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
