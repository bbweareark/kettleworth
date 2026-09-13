import * as React from "react";
import { cn } from "../lib/cn";
/** Kettleworth mark: a kettlebell silhouette reduced to a ring and a block. */
export function Logo({ className, withWordmark = true, size = 28 }: { className?: string; withWordmark?: boolean; size?: number }) {
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <svg width={size} height={size} viewBox="0 0 32 32" fill="none" aria-hidden className="shrink-0">
        <path d="M11 11.5a5 5 0 0 1 10 0V13h-2.6v-1.5a2.4 2.4 0 0 0-4.8 0V13H11v-1.5Z" fill="currentColor" />
        <rect x="6" y="13" width="20" height="14" rx="6" fill="var(--color-ember)" />
        <rect x="6" y="13" width="20" height="14" rx="6" fill="url(#kw-g)" />
        <defs><linearGradient id="kw-g" x1="6" y1="13" x2="26" y2="27" gradientUnits="userSpaceOnUse"><stop stopColor="#fff" stopOpacity="0.25" /><stop offset="1" stopColor="#000" stopOpacity="0.15" /></linearGradient></defs>
      </svg>
      {withWordmark ? <span className="font-display text-lg font-semibold tracking-tighter">Kettleworth</span> : null}
    </span>
  );
}
