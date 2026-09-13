import * as React from "react";
import { cn } from "../lib/cn";

export function Stat({ label, value, unit, delta, tone, className, hint }: { label: string; value: React.ReactNode; unit?: string; delta?: string; tone?: "signal" | "rose" | "amber" | "neutral"; className?: string; hint?: string }) {
  const toneClass = { signal: "text-signal", rose: "text-rose", amber: "text-amber", neutral: "text-fg-muted" }[tone ?? "neutral"];
  return (
    <div className={cn("space-y-1", className)}>
      <div className="text-xs font-medium uppercase tracking-wide text-fg-subtle">{label}</div>
      <div className="flex items-baseline gap-1.5">
        <span className="font-display text-2xl font-semibold tabular tracking-tighter">{value}</span>
        {unit ? <span className="text-sm text-fg-muted">{unit}</span> : null}
      </div>
      {delta ? <div className={cn("text-xs font-medium tabular", toneClass)}>{delta}</div> : hint ? <div className="text-xs text-fg-subtle">{hint}</div> : null}
    </div>
  );
}
