import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../lib/cn";

// Hard rectangle, hairline rule. The DNA allows one chromatic note, so tone is carried by
// fill weight (outline / solid / inverted) rather than by inventing five more hues.
const badge = cva("inline-flex items-center gap-1 px-2 py-0.5 text-2xs font-semibold uppercase tracking-label", {
  variants: {
    tone: {
      neutral: "border border-rule text-fg-muted",
      ember: "bg-ember text-ember-fg",
      signal: "bg-fg text-bg",
      amber: "border border-ember text-ember",
      rose: "border-2 border-ember text-ember",
      sky: "border border-rule text-fg",
      outline: "border border-rule text-fg-muted",
    },
  },
  defaultVariants: { tone: "neutral" },
});
export function Badge({ className, tone, ...p }: React.HTMLAttributes<HTMLSpanElement> & VariantProps<typeof badge>) {
  return <span className={cn(badge({ tone }), className)} {...p} />;
}
