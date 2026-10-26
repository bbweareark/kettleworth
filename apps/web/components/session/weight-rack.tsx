"use client";
import { useEffect, useRef } from "react";
import { cn } from "@kettleworth/ui";

/**
 * The rack: every load this equipment can actually be set to, as a detented ladder.
 *
 * Ported from 21st.dev's Iso Fader by Daiwiik Harihar
 * (design/refs/components-21st-isofader), which is a mixing-desk fader: a ladder of discrete
 * detents beside a digital readout. ISO values are a non-linear ladder (100, 200, 400) and so
 * is a dumbbell rack (20, 22.5, 25), which is why the composition transfers.
 *
 * Taken: the detented ladder, the tick-height hierarchy, and the exact value read separately
 * as a figure. Not taken: its dark chrome and LED colour ramp, its vertical travel (a thumb
 * works across a phone, not up it), and its inertial physics, because a flick with momentum
 * inside a scrolling page is a good way to set the wrong weight.
 *
 * Why it exists: the console offered the current weight plus or minus a fixed step, which
 * cannot reach most real loads. Stepping 22.5 kg by 5 gave 27.5, a dumbbell most racks do not
 * carry, and no sequence of steps builds a barbell total the plates cannot make.
 */
export function WeightRack({
  values,
  value,
  unit,
  note,
  onPick,
}: {
  values: number[];
  value: number;
  unit: string;
  note: string;
  onPick: (v: number) => void;
}) {
  const strip = useRef<HTMLDivElement>(null);
  const current = useRef<HTMLButtonElement>(null);
  // Highlight only an exact match. Scrolling to the nearest rung is helpful; marking it as
  // chosen is a lie, and it read as "0 kg" above a rack claiming 5 was selected.
  const nearest = values.length
    ? values.reduce((a, b) => (Math.abs(b - value) < Math.abs(a - value) ? b : a), values[0]!)
    : null;

  // Open on the load the lifter is already using, rather than at the light end.
  useEffect(() => {
    const el = current.current, box = strip.current;
    if (!el || !box) return;
    box.scrollLeft = el.offsetLeft - box.clientWidth / 2 + el.clientWidth / 2;
  }, [value, values]);

  if (!values.length) return null;
  const max = Math.max(...values);

  return (
    <div className="border-b border-rule">
      <div className="flex items-baseline justify-between gap-3 px-3 pt-2">
        <span className="meta">{note}</span>
        <span className="meta">tap to set</span>
      </div>
      <div
        ref={strip}
        role="radiogroup"
        aria-label={`Load in ${unit}`}
        className="scrollbar-none flex snap-x items-end gap-px overflow-x-auto px-3 pb-2 pt-1.5"
      >
        {values.map((v) => {
          const on = Math.abs(v - value) < 0.001;
          const scrollTo = v === nearest;
          // Tick height reads the load itself, so the strip takes the shape of a rack.
          const h = 10 + Math.round((v / max) * 22);
          return (
            <button
              key={v}
              ref={scrollTo ? current : undefined}
              type="button"
              role="radio"
              aria-checked={on}
              aria-label={`${v} ${unit}`}
              onClick={() => onPick(v)}
              className={cn(
                "flex min-h-11 w-11 shrink-0 snap-center touch-manipulation flex-col items-center justify-end gap-1 pt-2 transition-colors",
                on ? "text-fg" : "text-fg-muted hover:text-fg",
              )}
            >
              <span
                aria-hidden
                style={{ height: on ? 34 : h }}
                className={cn("w-0.5 transition-all", on ? "bg-ember" : "bg-rule-strong")}
              />
              <span className={cn("text-xs tabular", on && "font-semibold")}>{v}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

/**
 * What to actually put on the bar, drawn rather than spelled out.
 *
 * The console already said "20 + 10 + 2.5" in words. A lifter reads plates by size, so each
 * plate is a bar whose height is its weight: the shape of the loaded sleeve, heaviest first.
 */
export function PlateDiagram({ plates, unit }: { plates: number[]; unit: string }) {
  if (!plates.length) return <span className="meta">empty bar</span>;
  const max = Math.max(...plates);
  return (
    <span className="flex items-end gap-0.5" role="img" aria-label={`Per side: ${plates.join(", ")} ${unit}`}>
      {plates.map((p, i) => (
        <span
          key={`${p}-${i}`}
          aria-hidden
          style={{ height: 8 + Math.round((p / max) * 18) }}
          className="w-1.5 bg-fg"
        />
      ))}
      <span className="meta ml-1.5">a side</span>
    </span>
  );
}
