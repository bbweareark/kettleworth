"use client";
import * as React from "react";
import { useReducedMotion } from "motion/react";
import { cn } from "../lib/cn";

/**
 * The one number.
 *
 * This is the signature of the whole design: every screen answers one question with one
 * figure, rendered larger than anything else on it, and everything else is support type
 * arranged around it. The DNA was chosen for exactly this reason - Integrated Biosciences
 * carves hierarchy by size and tightening negative tracking rather than by weight, which is
 * what lets a load read as architecture instead of as a shouting headline.
 *
 * Motion signature 1 lives here: the figure counts to its value rather than snapping, because
 * the number is the subject of the design, so it is the thing that moves. useReducedMotion
 * turns that into a plain render.
 */
function useCount(value: number, decimals: number) {
  const reduce = useReducedMotion();
  const [v, setV] = React.useState(value);
  const from = React.useRef(value);
  React.useEffect(() => {
    if (reduce) { setV(value); from.current = value; return; }
    const start = performance.now();
    const a = from.current;
    // Short enough that a lifter mid-set is not waiting on an animation to read their weight.
    const dur = Math.abs(value - a) > 0 ? 620 : 0;
    let raf = 0;
    const tick = (t: number) => {
      const p = dur ? Math.min(1, (t - start) / dur) : 1;
      const e = 1 - Math.pow(1 - p, 3);
      setV(a + (value - a) * e);
      if (p < 1) raf = requestAnimationFrame(tick);
      else from.current = value;
    };
    raf = requestAnimationFrame(tick);
    return () => { cancelAnimationFrame(raf); from.current = value; };
  }, [value, reduce]);
  return v.toLocaleString("en-GB", { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
}

export function Figure({
  label,
  value,
  unit,
  note,
  decimals = 0,
  size = "md",
  accent,
  className,
  children,
}: {
  label: string;
  /** A number counts. A string is rendered as given, for a figure that is not a quantity. */
  value: number | string;
  unit?: string;
  note?: React.ReactNode;
  decimals?: number;
  size?: "md" | "xl" | "sm";
  accent?: boolean;
  className?: string;
  children?: React.ReactNode;
}) {
  const counted = useCount(typeof value === "number" ? value : 0, decimals);
  const shown = typeof value === "number" ? counted : value;
  const text = size === "xl" ? "text-figure-xl" : size === "sm" ? "text-4xl" : "text-figure";
  return (
    <div className={cn("min-w-0", className)}>
      <p className="meta">{label}</p>
      <p className={cn("font-display mt-1 flex items-baseline gap-2 leading-none", text, accent && "text-volt")}>
        <span className="tabular">{shown}</span>
        {unit ? <span className="font-mono text-base tracking-normal text-fg-subtle">{unit}</span> : null}
      </p>
      {note ? <p className="mt-2 text-sm text-fg-muted">{note}</p> : null}
      {children}
    </div>
  );
}

/**
 * A support figure: the same treatment two steps down the ramp, for the three or four numbers
 * that sit around the one number without competing with it.
 */
export function Readout({ label, value, unit, note, className, accent }: { label: string; value: React.ReactNode; unit?: string; note?: React.ReactNode; className?: string; accent?: boolean }) {
  return (
    <div className={cn("min-w-0", className)}>
      <p className="meta truncate">{label}</p>
      <p className={cn("font-display mt-1 flex items-baseline gap-1.5 text-2xl leading-none", accent && "text-volt")}>
        <span className="tabular">{value}</span>
        {unit ? <span className="font-mono text-xs tracking-normal text-fg-subtle">{unit}</span> : null}
      </p>
      {note ? <p className="mt-1 truncate text-xs text-fg-subtle">{note}</p> : null}
    </div>
  );
}

/** A row of Readouts under a hairline, which is how the reference arranges its own metadata. */
export function ReadoutRow({ className, ...p }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("grid grid-cols-2 gap-x-4 gap-y-5 border-t border-rule pt-4 sm:grid-cols-4", className)} {...p} />;
}
