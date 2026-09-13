import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../lib/cn";

const badge = cva("inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-2xs font-semibold uppercase tracking-wide", {
  variants: {
    tone: {
      neutral: "bg-surface-3 text-fg-muted",
      ember: "bg-ember-soft text-ember",
      signal: "bg-signal-soft text-signal",
      amber: "bg-amber-soft text-amber",
      rose: "bg-rose-soft text-rose",
      outline: "border border-border text-fg-muted",
    },
  },
  defaultVariants: { tone: "neutral" },
});
export function Badge({ className, tone, ...p }: React.HTMLAttributes<HTMLSpanElement> & VariantProps<typeof badge>) {
  return <span className={cn(badge({ tone }), className)} {...p} />;
}
