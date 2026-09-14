import * as React from "react";
import { cn } from "../lib/cn";

/**
 * The Kettleworth mark. A K built from two parts that describe the method:
 *  - the stem is the anchor: the lifts that stay in the plan block after block;
 *  - the chevron is the rotation that keys into it each week: its apex seats into the notch with a hairline gap;
 *  - the lower leg runs longer than the upper arm, because a block ends further along than it started.
 * Reads at 16 px, cuts in one colour, and needs no kettlebell.
 */
export function BrandMark({ size = 28, className, tone = "bronze", title }: { size?: number; className?: string; tone?: "bronze" | "current"; title?: string }) {
  const id = React.useId();
  const fill = tone === "bronze" ? `url(#${id}-br)` : "currentColor";
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" className={cn("shrink-0", className)} aria-hidden={title ? undefined : true} role={title ? "img" : undefined}>
      {title ? <title>{title}</title> : null}
      {tone === "bronze" ? <defs><linearGradient id={`${id}-br`} x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#e2b384" /><stop offset="0.55" stopColor="#b8804f" /><stop offset="1" stopColor="#7a5232" /></linearGradient></defs> : null}
      <path d="M18 16h16v26l-8 8 8 8v26H18z" fill={fill} />
      <polyline points="65,24 39,50 71,82" fill="none" stroke={fill} strokeWidth="16" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/** The mark set in a small cast seal: used where the coach speaks. */
export function BrandSeal({ size = 36, className }: { size?: number; className?: string }) {
  const id = React.useId();
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" className={cn("shrink-0", className)} aria-hidden>
      <defs>
        <radialGradient id={`${id}-d`} cx="0.35" cy="0.3" r="0.9"><stop offset="0" stopColor="#2a2420" /><stop offset="1" stopColor="#141110" /></radialGradient>
        <linearGradient id={`${id}-br`} x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#e2b384" /><stop offset="0.55" stopColor="#b8804f" /><stop offset="1" stopColor="#7a5232" /></linearGradient>
      </defs>
      <circle cx="50" cy="50" r="48" fill={`url(#${id}-d)`} stroke="#3a312b" strokeWidth="1.5" />
      <circle cx="50" cy="50" r="40" fill="none" stroke="#c9905d" strokeOpacity="0.3" strokeWidth="1" />
      <g transform="translate(50 50) scale(0.6) translate(-50 -50)"><path d="M18 16h16v26l-8 8 8 8v26H18z" fill={`url(#${id}-br)`} /><polyline points="65,24 39,50 71,82" fill="none" stroke={`url(#${id}-br)`} strokeWidth="16" strokeLinecap="round" strokeLinejoin="round" /></g>
    </svg>
  );
}

export function Logo({ className, withWordmark = true, size = 26 }: { className?: string; withWordmark?: boolean; size?: number }) {
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <BrandMark size={size} />
      {withWordmark ? <span className="font-display text-lg font-semibold tracking-tighter">Kettleworth</span> : null}
    </span>
  );
}
