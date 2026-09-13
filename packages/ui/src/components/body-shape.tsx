"use client";
import * as React from "react";
import { cn } from "../lib/cn";

/**
 * Parametric body silhouette. One SVG, shaped by body-fat level (0..1) and sex, so the picker shows a consistent,
 * respectful icon set rather than photos. Widths are eased so steps look natural; nothing is drawn as "bad".
 */
export function BodySilhouette({ level, sex = "male", size = 120, active, className }: { level: number; sex?: "male" | "female" | "other"; size?: number; active?: boolean; className?: string }) {
  const t = Math.max(0, Math.min(1, level));
  const f = sex === "female";
  // base widths (half-widths) in a 100x200 box
  const shoulder = (f ? 26 : 31) + (f ? 3 : 2) * t;
  const chest = (f ? 22 : 24) + 9 * t;
  const waist = (f ? 15 : 19) + 17 * t;
  const hip = (f ? 26 : 22) + 10 * t;
  const thigh = (f ? 13 : 12) + 6 * t;
  const calf = 8 + 3 * t;
  const arm = 6.5 + 3 * t;
  const neck = 6 + 1.5 * t;
  const head = 12;
  const cx = 50;
  const torso = `M${cx - shoulder},56 C${cx - shoulder - 2},74 ${cx - chest},84 ${cx - waist},104 C${cx - waist - 1},118 ${cx - hip},126 ${cx - hip},136 L${cx + hip},136 C${cx + hip},126 ${cx + waist + 1},118 ${cx + waist},104 C${cx + chest},84 ${cx + shoulder + 2},74 ${cx + shoulder},56 Z`;
  const leg = (dir: 1 | -1) => { const x = cx + dir * (hip * 0.55); return `M${x - thigh},134 C${x - thigh - 1},152 ${x - calf - 2},166 ${x - calf},192 L${x + calf},192 C${x + calf + 2},166 ${x + thigh + 1},152 ${x + thigh},134 Z`; };
  const armPath = (dir: 1 | -1) => { const x = cx + dir * (shoulder + arm + 1); return `M${x - arm},58 C${x - arm - 2},80 ${x - arm},100 ${x - arm + 1},122 L${x + arm - 1},122 C${x + arm},100 ${x + arm + 2},80 ${x + arm},58 Z`; };
  const fill = active ? "url(#kw-body-grad)" : "var(--color-surface-3)";
  return (
    <svg viewBox="0 0 100 200" width={size * 0.5} height={size} className={cn("transition-all duration-300", className)} aria-hidden>
      <defs><linearGradient id="kw-body-grad" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="var(--color-ember)" /><stop offset="100%" stopColor="color-mix(in oklch, var(--color-ember) 55%, var(--color-bg))" /></linearGradient></defs>
      <g fill={fill} stroke={active ? "var(--color-ember)" : "var(--color-border-strong)"} strokeWidth="1.2" strokeLinejoin="round">
        <circle cx={cx} cy={30} r={head} />
        <rect x={cx - neck} y={40} width={neck * 2} height={18} rx={neck} />
        <path d={torso} />
        <path d={armPath(-1)} /><path d={armPath(1)} />
        <path d={leg(-1)} /><path d={leg(1)} />
      </g>
    </svg>
  );
}

export type BodyShapeOption = { pct: number; label: string; hint: string };
export const BODY_SHAPES: BodyShapeOption[] = [
  { pct: 10, label: "Very lean", hint: "Visible abs, veins, sharp lines" },
  { pct: 15, label: "Lean", hint: "Some definition, flat stomach" },
  { pct: 20, label: "Athletic", hint: "Solid, little definition" },
  { pct: 25, label: "Average", hint: "Soft midsection, healthy" },
  { pct: 30, label: "Carrying extra", hint: "Rounder waist and hips" },
  { pct: 38, label: "Carrying more", hint: "Noticeably higher body fat" },
];

/** Visual body-shape picker: silhouettes that change with the estimate. Returns the mid body-fat % for the choice. */
export function BodyShapePicker({ value, onChange, sex = "male", className }: { value: number | undefined; onChange: (pct: number | undefined) => void; sex?: "male" | "female" | "other"; className?: string }) {
  return (
    <div role="radiogroup" aria-label="Body shape estimate" className={cn("grid grid-cols-3 gap-2 sm:grid-cols-6", className)}>
      {BODY_SHAPES.map((o, i) => {
        const active = value === o.pct;
        return (
          <button key={o.pct} type="button" role="radio" aria-checked={active} onClick={() => onChange(active ? undefined : o.pct)} className={cn("group flex flex-col items-center gap-1.5 rounded-xl border p-3 text-center transition-all", active ? "border-ember bg-ember-soft shadow-glow" : "border-border bg-surface-2 hover:border-border-strong")}>
            <BodySilhouette level={i / (BODY_SHAPES.length - 1)} sex={sex} size={96} active={active} className="group-hover:scale-[1.04]" />
            <span className="text-xs font-medium">{o.label}</span>
            <span className="text-2xs text-fg-subtle">{o.hint}</span>
          </button>
        );
      })}
    </div>
  );
}

export const BUILD_ICONS: Record<string, number> = { lean: 0.2, athletic: 0.4, average: 0.6, carrying_extra: 0.8, unclear: 0.5 };
