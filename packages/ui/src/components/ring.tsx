import * as React from "react";
import { cn } from "../lib/cn";

/** Activity-style ring. value 0..1 */
export function Ring({ value, size = 96, stroke = 10, tone = "ember", children, className, label }: { value: number; size?: number; stroke?: number; tone?: "ember" | "signal" | "amber" | "rose" | "sky"; children?: React.ReactNode; className?: string; label?: string }) {
  const r = (size - stroke) / 2;
  const len = 2 * Math.PI * r;
  const v = Math.max(0, Math.min(1, value));
  const color = { ember: "var(--color-ember)", signal: "var(--color-signal)", amber: "var(--color-amber)", rose: "var(--color-rose)", sky: "var(--color-sky)" }[tone];
  return (
    <div className={cn("relative inline-grid place-items-center", className)} style={{ width: size, height: size }} role="img" aria-label={label ?? `${Math.round(v * 100)}%`}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--color-surface-3)" strokeWidth={stroke} />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={stroke} strokeLinecap="round" strokeDasharray={len} strokeDashoffset={len * (1 - v)} className="animate-ring" style={{ ["--ring-len" as string]: len, ["--ring-offset" as string]: len * (1 - v) }} />
      </svg>
      <div className="absolute inset-0 grid place-items-center">{children}</div>
    </div>
  );
}
