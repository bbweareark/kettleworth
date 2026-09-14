"use client";
import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { Loader2 } from "lucide-react";
import { cn } from "../lib/cn";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md font-medium transition-[background,transform,box-shadow,color] duration-150 ease-out-quart select-none disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98] [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        primary: "bg-ember text-ember-fg hover:bg-ember-hover",
        secondary: "bg-surface-2 text-fg hover:bg-surface-3 border border-border",
        ghost: "text-fg-muted hover:text-fg hover:bg-surface-2",
        outline: "border border-border-strong text-fg hover:bg-surface-2",
        danger: "bg-rose-soft text-rose hover:bg-rose hover:text-white",
        link: "text-ember underline-offset-4 hover:underline p-0 h-auto",
      },
      size: {
        sm: "h-8 px-3 text-sm rounded-sm",
        md: "h-10 px-4 text-sm",
        lg: "h-12 px-6 text-base rounded-lg",
        xl: "h-14 px-8 text-lg rounded-xl",
        icon: "size-10",
        "icon-sm": "size-8 rounded-sm",
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
