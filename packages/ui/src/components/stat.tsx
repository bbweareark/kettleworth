import * as React from "react";
import { cn } from "../lib/cn";

/**
 * A labelled number, one step below Readout. Kept for the dozen screens that want a plain
 * figure in a row; anything that is *the* number on its screen uses Figure instead.
 */
export function Stat({ label, value, unit, delta, tone, className, hint }: { label: string; value: React.ReactNode; unit?: string; delta?: string; tone?: "signal" | "rose" | "amber" | "neutral"; className?: string; hint?: string }) {
  const toneClass = tone === "signal" ? "text-fg" : tone === "amber" ? "text-volt" : "text-fg-muted";
  return (
    <div className={cn("min-w-0 space-y-1", className)}>
      <div className="meta truncate">{label}</div>
      <div className="flex items-baseline gap-1.5">
        <span className="font-display text-2xl tabular">{value}</span>
        {unit ? <span className="font-mono text-xs text-fg-subtle">{unit}</span> : null}
      </div>
      {delta ? <div className={cn("text-xs tabular", toneClass)}>{delta}</div> : hint ? <div className="text-xs text-fg-subtle">{hint}</div> : null}
    </div>
  );
}
