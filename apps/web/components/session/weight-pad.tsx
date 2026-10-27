"use client";
import { cn } from "@kettleworth/ui";
import { Delete } from "lucide-react";

/**
 * Type the number. Any number.
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
 * design/SECTION-MAP.md carries it over unchanged for exactly that reason; what the revamp
 * changed is the readout it drives, which is now the 96px figure above it.
 */
const KEYS = ["7", "8", "9", "4", "5", "6", "1", "2", "3"] as const;

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

export function Keypad({
  value,
  unit,
  label,
  quick,
  quickNote,
  decimal = true,
  pristine,
  onChange,
}: {
  value: string;
  unit: string;
  /** Names the quantity the keys drive, for anyone using a screen reader. */
  label: string;
  /** Common values for this equipment: an accelerator, never the only way in. */
  quick?: number[];
  quickNote?: string;
  decimal?: boolean;
  /**
   * True while the figure still shows what the plan prescribed rather than something the
   * lifter typed. The first digit then replaces it instead of appending to it: reps arrive
   * prefilled with the target, so tapping 8 after a target of 10 produced 108.
   */
  pristine?: boolean;
  onChange: (next: string) => void;
}) {
  // Backspace always works on what is shown; a digit on a pristine figure starts over.
  const from = (k: string) => (pristine && k !== "back" ? "" : value);
  return (
    <div>
      {quick?.length ? (
        <div className="border-b border-rule pb-3">
          <div className="flex items-baseline justify-between gap-3">
            <span className="meta">{quickNote}</span>
            <span className="meta">or type it</span>
          </div>
          <div className="scrollbar-none mt-2 flex gap-1.5 overflow-x-auto pb-0.5" role="group" aria-label={`Common ${label}`}>
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
                    "h-11 shrink-0 touch-manipulation rounded-full border px-4 text-sm tabular transition-colors",
                    on ? "border-fg bg-fg text-bg" : "border-rule text-fg-muted hover:border-rule-strong hover:text-fg",
                  )}
                >
                  {v}
                </button>
              );
            })}
          </div>
        </div>
      ) : null}

      {/* 3 x 4, keys 56px, as measured on the reference's mobile capture. */}
      <div className="mt-3 grid grid-cols-3 gap-1.5" role="group" aria-label={`Enter the ${label} in ${unit}`}>
        {KEYS.map((k) => (
          <Key key={k} onClick={() => onChange(press(from(k), k))}>{k}</Key>
        ))}
        {decimal ? (
          <Key onClick={() => onChange(press(from("."), "."))} label="Decimal point">.</Key>
        ) : (
          <Key onClick={() => onChange("")} label={`Clear the ${label}`}>
            <span className="font-mono text-meta uppercase tracking-label">clr</span>
          </Key>
        )}
        <Key onClick={() => onChange(press(from("0"), "0"))}>0</Key>
        <Key onClick={() => onChange(press(value, "back"))} label="Delete the last digit">
          <Delete className="size-5" aria-hidden />
        </Key>
      </div>
    </div>
  );
}

function Key({ children, onClick, label }: { children: React.ReactNode; onClick: () => void; label?: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className="flex h-14 touch-manipulation items-center justify-center rounded-md border border-rule bg-surface font-display text-2xl tabular transition-colors hover:border-rule-strong hover:bg-bg active:bg-fg active:text-bg"
    >
      {children}
    </button>
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
          className="w-1.5 rounded-sm bg-fg"
        />
      ))}
      <span className="meta ml-1.5">a side</span>
    </span>
  );
}
