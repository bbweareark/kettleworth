import * as React from "react";
import { cn } from "../lib/cn";

/*
 * A real surface again.
 *
 * The previous DNA measured zero card-like surfaces on its reference, so these rendered as a
 * hairline and nothing else. Integrated Biosciences does the opposite: content sits on a raised
 * near-black panel with a hairline edge and a 16-20px radius, and separation comes from the
 * value step plus the rule - never from a shadow or a blur, both of which that reference
 * states outright it does not use.
 *
 * Still not a card grid. The skill's rule holds: the number of panels on a screen may not
 * exceed the number in the reference capture.
 */
export function Card({ className, ...p }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("rounded-lg border border-rule bg-surface", className)} {...p} />;
}
export function CardHeader({ className, ...p }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("flex items-start justify-between gap-4 px-4 pt-4", className)} {...p} />;
}
export function CardTitle({ className, ...p }: React.HTMLAttributes<HTMLHeadingElement>) {
  return <h3 className={cn("font-display text-lg", className)} {...p} />;
}
export function CardDescription({ className, ...p }: React.HTMLAttributes<HTMLParagraphElement>) {
  return <p className={cn("text-sm text-fg-muted", className)} {...p} />;
}
export function CardContent({ className, ...p }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("p-4", className)} {...p} />;
}
export function CardFooter({ className, ...p }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("flex items-center gap-3 px-4 pb-4", className)} {...p} />;
}

/**
 * A ruled block: the thing the old Card actually was, kept because several screens genuinely
 * want a hairline and the bare ground rather than a panel.
 */
export function Ruled({ className, ...p }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("border-t border-rule pt-4", className)} {...p} />;
}
