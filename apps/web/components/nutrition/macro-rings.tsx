"use client";
import { CountUp } from "@kettleworth/ui";

/**
 * Calories as the one dominant figure, macros as hard ruled bars beneath it.
 *
 * This replaced three concentric arcs in three different hues. The arcs were the soft-UI
 * motif the DNA exists to avoid, they put low-contrast strokes over a photograph, and three
 * hues broke the rule of one rationed accent. Bars read at a glance, carry the same ratio,
 * and are told apart by their label rather than by colour.
 *
 * The component name and props are unchanged so every call site keeps working.
 */
type Macros = { calories: number; proteinG: number; carbsG: number; fatG: number };

export function MacroRings({ targets, logged }: { targets: Macros; logged: Macros; size?: number }) {
  const rows: [string, number, number, string][] = [
    ["Protein", logged.proteinG, targets.proteinG, "g"],
    ["Carbs", logged.carbsG, targets.carbsG, "g"],
    ["Fat", logged.fatG, targets.fatG, "g"],
  ];
  return (
    <div className="w-full">
      <div
        className="flex items-end justify-between gap-4 border-b border-rule pb-3"
        role="img"
        aria-label={`Calories ${Math.round(logged.calories)} of ${targets.calories}`}
      >
        <div className="min-w-0">
          <span className="meta block">Calories</span>
          <span className="font-display block text-5xl leading-none tabular">
            <CountUp value={logged.calories} />
          </span>
        </div>
        <span className="meta shrink-0">of {targets.calories}</span>
      </div>

      <dl>
        {rows.map(([label, v, t, unit]) => {
          const pct = Math.min(100, (v / Math.max(1, t)) * 100);
          return (
            <div key={label} className="border-b border-rule py-3">
              <div className="flex items-baseline justify-between gap-3">
                <dt className="meta">{label}</dt>
                <dd className="font-display whitespace-nowrap text-lg tabular">
                  {Math.round(v)}
                  <span className="text-sm text-fg-subtle"> / {t} {unit}</span>
                </dd>
              </div>
              <div aria-hidden className="mt-2 h-1 w-full overflow-hidden bg-rule">
                <div
                  className="h-full bg-ember transition-[width] duration-700 ease-out-quart"
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          );
        })}
      </dl>
    </div>
  );
}
