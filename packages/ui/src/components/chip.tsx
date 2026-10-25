"use client";
import * as React from "react";
import { Check } from "lucide-react";
import { cn } from "../lib/cn";

export function Chip({ selected, className, children, icon, ...p }: React.ButtonHTMLAttributes<HTMLButtonElement> & { selected?: boolean; icon?: React.ReactNode }) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      className={cn(
        // Hard rectangle. Selected inverts rather than tinting, the same signal the set track and
        // the rest-deck keys use, so one reading of "chosen" works everywhere in the app.
        "inline-flex h-10 items-center gap-2 border px-4 text-sm font-medium transition-colors",
        selected ? "border-fg bg-fg text-bg" : "border-rule text-fg-muted hover:border-rule-strong hover:text-fg",
        className,
      )}
      {...p}
    >
      {selected ? <Check className="size-3.5" aria-hidden /> : icon}
      {children}
    </button>
  );
}
export function ChipGroup({ className, ...p }: React.HTMLAttributes<HTMLDivElement>) {
  return <div role="group" className={cn("flex flex-wrap gap-2", className)} {...p} />;
}
