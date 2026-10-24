import * as React from "react";
import { cn } from "../lib/cn";

/**
 * The Kettleworth mark: one plate, split by a line of light, the right half lifted by exactly
 * one increment.
 *
 * That is the whole product in a single move. The load goes up in the smallest honest step,
 * and the gap is where the engine decides. It reads left to right as progress, it survives
 * 16px, it cuts in one colour, and it is not a kettlebell, a barbell, a flame or a letter.
 *
 * Geometry lives in /brand. Two half-discs of radius 96 on a 256 grid: the left seated 16
 * below centre, the right 16 above, with a 14 unit gap on the centre line.
 */
export function BrandMark({ size = 28, className, tone = "current", title }: { size?: number; className?: string; tone?: "current" | "ember"; title?: string }) {
  const fill = tone === "ember" ? "var(--color-ember)" : "currentColor";
  return (
    <svg width={size} height={size} viewBox="0 0 256 256" className={cn("shrink-0", className)} aria-hidden={title ? undefined : true} role={title ? "img" : undefined}>
      {title ? <title>{title}</title> : null}
      <g fill={fill}>
        <path d="M121 48 A96 96 0 0 0 121 240 Z" />
        <path d="M135 16 A96 96 0 0 1 135 208 Z" />
      </g>
    </svg>
  );
}

/** The mark seated in a dark disc: used where the coach speaks. */
export function BrandSeal({ size = 36, className }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 256 256" className={cn("shrink-0", className)} aria-hidden>
      <circle cx="128" cy="128" r="126" fill="var(--color-surface-2)" stroke="var(--color-border-strong)" strokeWidth="2" />
      <g transform="translate(128 128) scale(0.58) translate(-128 -128)" fill="var(--color-ember)">
        <path d="M121 48 A96 96 0 0 0 121 240 Z" />
        <path d="M135 16 A96 96 0 0 1 135 208 Z" />
      </g>
    </svg>
  );
}

export function Logo({ className, withWordmark = true, size = 24 }: { className?: string; withWordmark?: boolean; size?: number }) {
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <BrandMark size={size} />
      {withWordmark ? <span className="font-display text-lg tracking-tighter">Kettleworth</span> : null}
    </span>
  );
}
