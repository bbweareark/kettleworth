"use client";
import * as React from "react";
import { cn } from "../lib/cn";

/** The same pill group as Tabs, driven by state rather than by Radix. */
export function Segmented<T extends string>({ value, onChange, options, className, label }: { value: T; onChange: (v: T) => void; options: { value: T; label: React.ReactNode }[]; className?: string; label?: string }) {
  return (
    <div role="radiogroup" aria-label={label} className={cn("inline-flex h-12 items-center gap-1 rounded-md border border-rule bg-surface p-1", className)}>
      {options.map((o) => (
        <button key={o.value} type="button" role="radio" aria-checked={value === o.value} onClick={() => onChange(o.value)} className={cn("h-full rounded-full px-4 text-sm transition-colors", value === o.value ? "bg-fg text-bg" : "text-fg-muted hover:text-fg")}>
          {o.label}
        </button>
      ))}
    </div>
  );
}
