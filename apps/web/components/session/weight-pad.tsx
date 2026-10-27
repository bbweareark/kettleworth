"use client";
import { cn } from "@kettleworth/ui";
import { Delete } from "lucide-react";

/**
 * Type the weight. Any weight.
 *
 * This is the real port of 21st.dev's Number Pad by Bankk roll
 * (design/refs/components-21st-numberpad): one dominant readout, a hard grid of equal keys,
 * one commit. The first attempt took the *shape* of that reference and wired it to plus and
 * minus nudges, and the second replaced the nudges with a ladder of common gym loads. Both
 * could fail to reach a number the lifter actually wanted:
 *
 *   - the nudges could not land on 0.5 or 2.5 from an odd starting point without many taps;
 *   - the ladder could only ever offer what its table listed, so 0, 1 and anything ending in
 *     .5 that the table omitted were simply unreachable.
 *
 * A keypad has no such ceiling. Every value is three taps away, including 0, 0.5, 1, 2.5 and
 * 137.5, and the ladder survives beside it as an accelerator rather than as the only route.
 */
const KEYS = ["7", "8", "9", "4", "5", "6", "1", "2", "3", ".", "0"] as const;

/** Appends a keystroke, keeping the string a number a lifter could mean. */
export function press(current: string, key: string): string {
  if (key === "back") return current.length <= 1 ? "" : current.slice(0, -1);
  if (key === ".") return current.includes(".") ? current : (current === "" ? "0." : current + ".");
  // One decimal place is all any plate, bell or stack needs.
  if (current.includes(".") && current.split(".")[1]!.length >= 1) return current;
  if (current === "0") return key;
  const next = current + key;
  return Number(next) > 9999 ? current : next;
}

export function WeightPad({
  value,
  unit,
  quick,
  quickNote,
  onChange,
}: {
  value: string;
  unit: string;
  /** Common loads for this equipment: an accelerator, never the only way in. */
  quick: number[];
  quickNote: string;
  onChange: (next: string) => void;
}) {
  return (
    <div className="border-b border-rule">
      {quick.length ? (
        <div className="border-b border-rule">
          <div className="flex items-baseline justify-between gap-3 px-3 pt-2">
            <span className="meta">{quickNote}</span>
            <span className="meta">or type it</span>
          </div>
          <div className="scrollbar-none flex gap-px overflow-x-auto px-3 pb-2 pt-1.5" role="group" aria-label="Common loads">
            {quick.map((v) => {
              const on = Math.abs(Number(value) - v) < 0.001 && value !== "";
              return (
                <button
                  key={v}
                  type="button"
                  aria-label={`${v} ${unit}`}
                  aria-pressed={on}
                  onClick={() => onChange(String(v))}
                  className={cn(
                    "h-11 shrink-0 touch-manipulation px-3 text-sm tabular transition-colors",
                    on ? "bg-fg text-bg" : "bg-bg text-fg-muted hover:bg-fg hover:text-bg",
                  )}
                >
                  {v}
                </button>
              );
            })}
          </div>
        </div>
      ) : null}

      <div className="grid grid-cols-3 gap-px bg-rule" role="group" aria-label={`Enter the weight in ${unit}`}>
        {KEYS.map((k) => (
          <button
            key={k}
            type="button"
            onClick={() => onChange(press(value, k))}
            className="h-14 touch-manipulation bg-bg font-display text-xl tabular transition-colors hover:bg-fg hover:text-bg active:bg-fg active:text-bg"
          >
            {k}
          </button>
        ))}
        <button
          type="button"
          aria-label="Delete the last digit"
          onClick={() => onChange(press(value, "back"))}
          className="flex h-14 touch-manipulation items-center justify-center bg-bg transition-colors hover:bg-fg hover:text-bg active:bg-fg active:text-bg"
        >
          <Delete className="size-5" aria-hidden />
        </button>
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
