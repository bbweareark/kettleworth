import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../lib/cn";

/*
 * A tag at 9999px radius, which is what the DNA reference measures for its own tags, in the
 * mono face at label size. Tone is carried by fill weight rather than by inventing hues: this
 * system has exactly one accent and it is rationed.
 */
const badge = cva("inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 font-mono text-meta uppercase tracking-label", {
  variants: {
    tone: {
      neutral: "border border-rule text-fg-muted",
      ember: "bg-volt text-volt-fg",
      volt: "bg-volt text-volt-fg",
      signal: "bg-fg text-bg",
      amber: "border border-volt text-volt",
      rose: "border border-rule-strong text-fg",
      sky: "border border-rule text-fg-muted",
      outline: "border border-rule text-fg-muted",
    },
  },
  defaultVariants: { tone: "neutral" },
});
export function Badge({ className, tone, ...p }: React.HTMLAttributes<HTMLSpanElement> & VariantProps<typeof badge>) {
  return <span className={cn(badge({ tone }), className)} {...p} />;
}
