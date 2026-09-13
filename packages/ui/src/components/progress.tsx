import * as React from "react";
import { cn } from "../lib/cn";

export function Progress({ value, max = 100, className, tone = "ember", label }: { value: number; max?: number; className?: string; tone?: "ember" | "signal" | "amber" | "rose"; label?: string }) {
  const pct = Math.max(0, Math.min(100, (value / max) * 100));
  const color = { ember: "bg-ember", signal: "bg-signal", amber: "bg-amber", rose: "bg-rose" }[tone];
  return (
    <div role="progressbar" aria-valuenow={value} aria-valuemin={0} aria-valuemax={max} aria-label={label} className={cn("h-1.5 w-full overflow-hidden rounded-full bg-surface-3", className)}>
      <div className={cn("h-full rounded-full transition-[width] duration-500 ease-out-quart", color)} style={{ width: `${pct}%` }} />
    </div>
  );
}
