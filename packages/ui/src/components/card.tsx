import * as React from "react";
import { cn } from "../lib/cn";

/*
 * Not a card.
 *
 * The DNA reference (teenage.engineering) measures **0 card-like surfaces** on the whole
 * page, and the skill's rule is that our card count may not exceed the reference's. So these
 * render as ruled blocks: a hairline above, content set directly on the ground, no fill, no
 * radius, no shadow. The component name stays so every existing call site keeps working.
 */
export function Card({ className, ...p }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("border-t border-rule bg-transparent", className)} {...p} />;
}
export function CardHeader({ className, ...p }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("flex items-start justify-between gap-4 pt-4", className)} {...p} />;
}
export function CardTitle({ className, ...p }: React.HTMLAttributes<HTMLHeadingElement>) {
  return <h3 className={cn("font-display text-lg", className)} {...p} />;
}
export function CardDescription({ className, ...p }: React.HTMLAttributes<HTMLParagraphElement>) {
  return <p className={cn("text-sm text-fg-muted", className)} {...p} />;
}
export function CardContent({ className, ...p }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("py-4", className)} {...p} />;
}
export function CardFooter({ className, ...p }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("flex items-center gap-3 pb-4", className)} {...p} />;
}
