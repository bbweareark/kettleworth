"use client";
import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { Loader2 } from "lucide-react";
import { cn } from "../lib/cn";

/*
 * Hard rectangle, no radius, no shadow (DNA: teenage engineering measures radius 0 and
 * shadows none). The label treatment is measured from tines.com: uppercase, small, heavy,
 * letterspaced. Tines wraps it in a 990px pill; that is rejected here, and so is the pill
 * generally, since four of this owner's six apps already use one.
 */
const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-none uppercase tracking-label font-semibold transition-colors duration-(--dur-fast) ease-out select-none disabled:pointer-events-none disabled:opacity-40 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        primary: "bg-ember text-ember-fg hover:bg-ember-hover",
        secondary: "border border-rule-strong text-fg hover:bg-fg hover:text-bg",
        ghost: "text-fg-muted hover:text-fg",
        outline: "border border-rule-strong text-fg hover:bg-fg hover:text-bg",
        danger: "border border-rose text-rose hover:bg-rose hover:text-fg-on-fill",
        link: "text-fg underline underline-offset-4 decoration-1 hover:text-ember p-0 h-auto normal-case tracking-normal font-normal",
      },
      size: {
        sm: "h-9 px-4 text-[0.6875rem] [&_svg]:size-3.5",
        md: "h-11 px-5 text-meta [&_svg]:size-4",
        lg: "h-13 px-7 text-meta [&_svg]:size-4",
        xl: "h-14 px-8 text-sm [&_svg]:size-4",
        icon: "size-11 px-0 [&_svg]:size-4",
        "icon-sm": "size-9 px-0 [&_svg]:size-3.5",
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
