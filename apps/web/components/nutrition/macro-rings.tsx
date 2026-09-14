"use client";
import { CountUp } from "@kettleworth/ui";

/** Calories in the centre, protein / carbs / fat as concentric arcs. Progress = logged today vs target. */
export function MacroRings({ targets, logged, size = 200 }: { targets: { calories: number; proteinG: number; carbsG: number; fatG: number }; logged: { calories: number; proteinG: number; carbsG: number; fatG: number }; size?: number }) {
  const rings = [
    { key: "protein", v: logged.proteinG / Math.max(1, targets.proteinG), color: "var(--color-ember)", r: size / 2 - 10 },
    { key: "carbs", v: logged.carbsG / Math.max(1, targets.carbsG), color: "var(--color-sky)", r: size / 2 - 26 },
    { key: "fat", v: logged.fatG / Math.max(1, targets.fatG), color: "var(--color-amber)", r: size / 2 - 42 },
  ];
  return (
    <div className="flex items-center gap-6">
      <div className="relative shrink-0" style={{ width: size, height: size }} role="img" aria-label={`Calories ${logged.calories} of ${targets.calories}`}>
        <svg width={size} height={size} className="-rotate-90">
          {rings.map((r) => { const len = 2 * Math.PI * r.r; const v = Math.min(1, r.v); return (<g key={r.key}><circle cx={size / 2} cy={size / 2} r={r.r} fill="none" stroke="var(--color-surface-3)" strokeWidth={10} /><circle cx={size / 2} cy={size / 2} r={r.r} fill="none" stroke={r.color} strokeWidth={10} strokeLinecap="round" strokeDasharray={len} strokeDashoffset={len * (1 - v)} className="transition-[stroke-dashoffset] duration-700 ease-out-quart" /></g>); })}
        </svg>
        <div className="absolute inset-0 grid place-items-center text-center"><div><div className="font-display text-3xl font-semibold tracking-tightest"><CountUp value={logged.calories} /></div><div className="text-2xs uppercase tracking-[0.16em] text-fg-subtle">of {targets.calories}</div></div></div>
      </div>
      <dl className="grid gap-3">
        {[["Protein", logged.proteinG, targets.proteinG, "var(--color-ember)"], ["Carbs", logged.carbsG, targets.carbsG, "var(--color-sky)"], ["Fat", logged.fatG, targets.fatG, "var(--color-amber)"]].map(([l, v, t, c]) => (
          <div key={l as string} className="flex items-center gap-3"><span className="size-2.5 rounded-full" style={{ background: c as string }} /><dt className="w-14 text-2xs uppercase tracking-[0.16em] text-fg-subtle">{l as string}</dt><dd className="font-display text-xl font-semibold tabular tracking-tighter">{Math.round(v as number)}<span className="text-sm text-fg-subtle"> / {t as number} g</span></dd></div>))}
      </dl>
    </div>
  );
}
