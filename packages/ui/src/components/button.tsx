"use client";
import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { Loader2 } from "lucide-react";
import { cn } from "../lib/cn";

/*
 * A pill, in sentence case.
 *
 * Ported from Get Ripe (design/refs/cta-get-ripe) and Lando Norris (design/refs/hero-lando-norris):
 * both use a filled pill for the action and a hairline pill for the alternative, with the label
 * set in the text face at a normal weight. Integrated Biosciences' own CTA is a pill pair too,
 * which is why the DNA's 8px button radius is deviated from on purpose (recorded in SECTION-MAP).
 *
 * The previous system's uppercase letterspaced label is gone. In this DNA that treatment belongs
 * only to `meta` — the small mono label that names a figure — and using it on buttons as well
 * made every piece of small text look like the same component.
 */
const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full font-medium transition-colors duration-150 ease-out select-none disabled:pointer-events-none disabled:opacity-40 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        // Volt is rationed: one filled pill per viewport, and it is the thing to do next.
        primary: "bg-volt text-volt-fg hover:bg-volt-hover",
        secondary: "border border-rule-strong text-fg hover:border-fg hover:bg-surface",
        ghost: "text-fg-muted hover:bg-surface hover:text-fg",
        outline: "border border-rule-strong text-fg hover:border-fg hover:bg-surface",
        danger: "border border-rule-strong text-fg-muted hover:border-fg hover:bg-fg hover:text-bg",
        link: "text-fg underline underline-offset-4 decoration-1 hover:text-volt p-0 h-auto rounded-none font-normal",
      },
      size: {
        sm: "h-10 px-4 text-sm [&_svg]:size-3.5",
        md: "h-11 px-5 text-sm [&_svg]:size-4",
        lg: "h-13 px-7 text-base [&_svg]:size-4",
        // 56px: the sticky bottom action, measured from Get Ripe's mobile capture.
        xl: "h-14 px-8 text-base [&_svg]:size-5",
        icon: "size-11 px-0 [&_svg]:size-4",
        "icon-sm": "size-10 px-0 [&_svg]:size-3.5",
      },
    },
    defaultVariants: { variant: "primary", size: "md" },
  },
);

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  loading?: boolean;
}
export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(({ className, variant, size, asChild, loading, children, disabled, ...props }, ref) => {
  const cls = cn(buttonVariants({ variant, size }), className);
  if (asChild) return <Slot ref={ref} className={cls} aria-disabled={disabled || loading || undefined} {...props}>{children}</Slot>;
  return (
    <button ref={ref} className={cls} disabled={disabled || loading} aria-busy={loading || undefined} {...props}>
      {loading ? <Loader2 className="animate-spin" aria-hidden /> : null}
      {children}
    </button>
  );
});
Button.displayName = "Button";
export { buttonVariants };
