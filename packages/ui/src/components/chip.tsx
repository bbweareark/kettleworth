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
        "inline-flex h-10 items-center gap-2 rounded-full border px-4 text-sm font-medium transition-all duration-150 ease-out-quart active:scale-[0.97]",
        selected ? "border-ember bg-ember-soft text-fg shadow-[0_0_0_1px_var(--kw-ember)]" : "border-border bg-surface-2 text-fg-muted hover:border-border-strong hover:text-fg",
        className,
      )}
      {...p}
    >
      {selected ? <Check className="size-3.5 text-ember" aria-hidden /> : icon}
      {children}
    </button>
  );
}
export function ChipGroup({ className, ...p }: React.HTMLAttributes<HTMLDivElement>) {
  return <div role="group" className={cn("flex flex-wrap gap-2", className)} {...p} />;
}
