"use client";
import { Trophy, TrendingUp, Calendar } from "lucide-react";
import { kgToLb, loadModel } from "@kettleworth/core";
import { cn } from "@kettleworth/ui";
import { dayMonth, fmtKg } from "@/lib/dates";

export type LiftSet = { weightKg: number | null; reps: number | null; rpe: number | null; barKg?: number | null };
export type LiftSession = { sessionId: string; name: string; date: string; sets: LiftSet[]; top: LiftSet | null; e1rm: number | null; volumeKg: number };
export type LiftHistoryData = {
  exercise: { id: string; name: string; slug: string; equipment: string[]; unilateral: boolean };
  last: LiftSession | null; bestWeight: { weightKg: number; reps: number; date: string } | null; bestE1rm: { e1rm: number; weightKg: number; reps: number; date: string } | null;
  sessions: number; records: number; history: LiftSession[];
};

export { fmtKg };

/**
 * Estimated max over time, drawn as an SVG that stretches to any width without distortion: the line is scaled by
 * viewBox but strokes stay one pixel thick, and labels are HTML so they never squash on a narrow phone.
 */
export function TrendChart({ points, units, className }: { points: { date: string; value: number }[]; units: "metric" | "imperial"; className?: string }) {
  if (points.length < 2) return <p className={cn("rounded-2xl bg-black/20 px-4 py-6 text-center text-sm text-fg-subtle", className)}>{points.length ? "One session so far. The trend appears after the next." : "No sets with 10 reps or fewer yet."}</p>;
  const vals = points.map((p) => (units === "metric" ? p.value : kgToLb(p.value)));
  const min = Math.min(...vals), max = Math.max(...vals), span = Math.max(1, max - min);
  const W = 300, H = 100, pad = 8;
  const xy = vals.map((v, i) => [pad + (i / (vals.length - 1)) * (W - pad * 2), H - pad - ((v - min) / span) * (H - pad * 2)] as const);
  const line = xy.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(" ");
  const area = `${pad},${H - pad} ${line} ${W - pad},${H - pad}`;
  const unit = units === "metric" ? "kg" : "lb";
  const change = vals[vals.length - 1]! - vals[0]!;
  return (
    <figure className={cn("rounded-2xl bg-black/20 p-3 ring-1 ring-white/[0.05]", className)}>
      <figcaption className="mb-2 flex items-baseline justify-between gap-2 px-1">
        <span className="text-2xs uppercase tracking-[0.16em] text-fg-subtle">Estimated max</span>
        <span className={cn("text-xs tabular", change >= 0 ? "text-signal" : "text-amber")}>{change >= 0 ? "+" : "\u2212"}{Math.abs(Math.round(change * 10) / 10)} {unit} over {points.length} sessions</span>
      </figcaption>
      <div className="flex gap-2">
        <div className="flex w-8 shrink-0 flex-col justify-between py-0.5 text-right text-2xs tabular text-fg-subtle"><span>{Math.round(max)}</span><span>{Math.round(min)}</span></div>
        <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" className="block h-28 min-w-0 flex-1" role="img" aria-label={`Estimated max from ${Math.round(vals[0]!)} to ${Math.round(vals[vals.length - 1]!)} ${unit}`}>
          <defs><linearGradient id="lift-area" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="var(--color-ember)" stopOpacity="0.35" /><stop offset="1" stopColor="var(--color-ember)" stopOpacity="0" /></linearGradient></defs>
          <polygon points={area} fill="url(#lift-area)" />
          <polyline points={line} fill="none" stroke="var(--color-ember)" strokeWidth="2" vectorEffect="non-scaling-stroke" strokeLinejoin="round" strokeLinecap="round" />
        </svg>
      </div>
      <div className="mt-1 flex justify-between pl-10 pr-1 text-2xs text-fg-subtle"><span>{dayMonth(points[0]!.date)}</span><span>{dayMonth(points[points.length - 1]!.date)}</span></div>
    </figure>
  );
}

/** The whole story of one lift: bests, the trend, and every session's sets with the top set marked. */
export function LiftHistory({ data, units }: { data: LiftHistoryData; units: "metric" | "imperial" }) {
  const unit = units === "metric" ? "kg" : "lb";
  const model = loadModel({ name: data.exercise.name, equipment: data.exercise.equipment as never, unilateral: data.exercise.unilateral });
  const note = model.kind === "bar" ? "Weights are the total, bar included." : model.kind === "handheld" ? `Weights are ${model.hint}.` : model.kind === "added" ? "Weights are the weight added to your bodyweight." : null;
  const points = [...data.history].reverse().filter((h) => h.e1rm != null).map((h) => ({ date: h.date, value: h.e1rm! }));
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-2">
        <Stat icon={<Trophy className="size-3.5 text-ember" />} label="Heaviest" value={data.bestWeight ? `${fmtKg(data.bestWeight.weightKg, units)} × ${data.bestWeight.reps}` : "-"} sub={data.bestWeight ? dayMonth(data.bestWeight.date) : ""} />
        <Stat icon={<TrendingUp className="size-3.5 text-signal" />} label="Best max" value={data.bestE1rm ? `${fmtKg(data.bestE1rm.e1rm, units)} ${unit}` : "-"} sub={data.bestE1rm ? `${fmtKg(data.bestE1rm.weightKg, units)} × ${data.bestE1rm.reps}` : ""} />
        <Stat icon={<Calendar className="size-3.5 text-sky" />} label="Sessions" value={String(data.sessions)} sub={data.records ? `${data.records} record${data.records === 1 ? "" : "s"}` : ""} />
      </div>
      <TrendChart points={points} units={units} />
      {note ? <p className="px-1 text-xs text-fg-subtle">{note}</p> : null}
      <ol className="space-y-2">
        {data.history.map((h) => (
          <li key={h.sessionId} className="rounded-2xl bg-white/[0.03] p-3 ring-1 ring-white/[0.05]">
            <div className="flex items-baseline justify-between gap-2"><span className="text-sm font-medium">{dayMonth(h.date)}<span className="ml-2 text-xs font-normal text-fg-subtle">{h.name}</span></span><span className="shrink-0 text-2xs tabular text-fg-subtle">{h.e1rm ? `est. ${fmtKg(h.e1rm, units)} ${unit}` : ""}</span></div>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {h.sets.map((s, i) => { const isTop = !!h.top && s.weightKg === h.top.weightKg && s.reps === h.top.reps; return (
                <span key={i} className={cn("inline-flex h-7 items-center rounded-full px-2.5 text-xs tabular ring-1", isTop ? "bg-ember-soft text-fg ring-ember/40" : "text-fg-muted ring-white/10")}>{fmtKg(s.weightKg, units)} × {s.reps}{s.rpe ? <span className="ml-1 text-fg-subtle">@{s.rpe}</span> : null}</span>); })}
            </div>
          </li>
        ))}
        {!data.history.length ? <li className="rounded-2xl bg-black/20 px-4 py-6 text-center text-sm text-fg-subtle">Nothing logged for this lift yet.</li> : null}
      </ol>
    </div>
  );
}

function Stat({ icon, label, value, sub }: { icon: React.ReactNode; label: string; value: string; sub: string }) {
  return (
    <div className="min-w-0 rounded-2xl bg-black/25 px-2.5 py-2.5 ring-1 ring-white/[0.06]">
      <div className="flex items-center gap-1 text-[10px] uppercase tracking-[0.12em] text-fg-subtle">{icon}<span className="truncate">{label}</span></div>
      <div className="mt-1 truncate font-display text-base font-semibold tabular tracking-tight sm:text-lg">{value}</div>
      <div className="truncate text-2xs text-fg-subtle">{sub || " "}</div>
    </div>
  );
}
