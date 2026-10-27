import * as React from "react";
import { cn } from "../lib/cn";

export function Progress({ value, max = 100, className, tone = "ember", label }: { value: number; max?: number; className?: string; tone?: "ember" | "signal" | "amber" | "rose"; label?: string }) {
  const pct = Math.max(0, Math.min(100, (value / max) * 100));
  // One rationed accent: tone survives as an API but resolves to fill weight, not to new hues.
  const color = { ember: "bg-volt", signal: "bg-fg", amber: "bg-volt", rose: "bg-volt" }[tone];
  return (
    <div role="progressbar" aria-valuenow={value} aria-valuemin={0} aria-valuemax={max} aria-label={label} className={cn("h-1.5 w-full overflow-hidden rounded-full bg-rule", className)}>
      <div className={cn("h-full rounded-full transition-[width] duration-500 ease-out-quart", color)} style={{ width: `${pct}%` }} />
    </div>
  );
}
