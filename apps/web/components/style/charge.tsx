"use client";
import { useReducedMotion } from "motion/react";
import { cn } from "@kettleworth/ui";
import { useStyle } from "@/lib/style";
import type { Style } from "@kettleworth/types";

/**
 * The charge rail: rest, drawn as something filling back up.
 *
 * The owner asked for rest in Arc to read "like life charging in a game", and he is right that
 * a thin progress line draining to nothing is the wrong metaphor for the one part of training
 * that is restorative. So the rail is inverted from every progress bar in the app: it starts
 * empty and **fills** while the clock runs down, and it is full at the moment the member is
 * meant to lift again. Waiting stops looking like loss and starts looking like gain.
 *
 * Ported from 8bitcn's health bar, retro variant (design/refs/components-21st-healthbar, found
 * through 21st.dev): a one-pixel frame, no radius anywhere, discrete cells with two pixel gaps,
 * and the label and the percentage set at the same size above it. The front edge comes from
 * Scrolltide's Fuse loader (design/refs/motion-scrolltide-fuse), which burns a jagged glowing
 * front inward through a note; this drives the same front outward instead.
 *
 * Three worlds, three rails, because a segmented arcade bar in a gallery would be costume:
 *
 *   Arc        sixteen cells, the leading one flickering, embers coming off the front, and a
 *              white flash across the whole rail when it tops out
 *   Carbon     one three-pixel hairline with quarter ticks and no glow. An instrument reports
 *   Sanctuary  a six-pixel rail in bronze with a brighter two-pixel leading edge, breathing
 *
 * Nothing here animates under reduced motion beyond the width itself, which is information.
 */

/** What this world calls the thing that is filling. */
export function chargeWord(style: Style): string {
  return style === "arc" ? "Charge" : style === "sanctuary" ? "Restoring" : "Recovery";
}

export function ChargeRail({
  /** 0 to 1: how much of the rest period has passed, which is how charged the member is. */
  charged,
  /** True once the clock has hit zero, which is the one moment the rail is allowed to shout. */
  full,
  className,
}: {
  charged: number;
  full: boolean;
  className?: string;
}) {
  const style = useStyle();
  const reduce = useReducedMotion();
  const pct = Math.max(0, Math.min(1, charged)) * 100;

  if (style === "arc") {
    const cells = 16;
    const lit = Math.round((pct / 100) * cells);
    return (
      <div aria-hidden className={cn("relative flex h-2.5 w-full gap-[2px] bg-bg px-[2px] py-[2px]", full && !reduce && "arc-flash", className)}>
        {Array.from({ length: cells }, (_, i) => (
          <span
            key={i}
            className={cn(
              "flex-1 transition-colors duration-200",
              i < lit ? "bg-charge" : "bg-rule",
              // The cell at the front is the one being filled, so it is the one that flickers.
              !reduce && !full && i === lit - 1 && "arc-crackle",
            )}
          />
        ))}
        {/* Embers off the front edge, the way the fuse throws flakes off its burn line. */}
        {!reduce && !full && pct > 4 && pct < 99 ? (
          <span className="pointer-events-none absolute bottom-0 top-0" style={{ left: `calc(${pct}% - 3px)` }}>
            <span className="arc-ember absolute bottom-0 size-[3px] bg-charge" style={{ ["--dx" as string]: "6px", animationDuration: "1.1s" }} />
            <span className="arc-ember absolute bottom-0 size-[2px] bg-charge" style={{ ["--dx" as string]: "-8px", animationDelay: "-0.6s", animationDuration: "1.4s" }} />
          </span>
        ) : null}
      </div>
    );
  }

  if (style === "sanctuary") {
    return (
      <div aria-hidden className={cn("relative h-1.5 w-full overflow-hidden bg-surface-2", className)}>
        <div className="absolute inset-y-0 left-0 bg-gold/55 transition-[width] duration-200" style={{ width: `${pct}%` }}>
          {/* The leading edge, brighter: a single ember at the front of the line. */}
          <span className={cn("absolute inset-y-0 right-0 w-[2px] bg-gold", !reduce && !full && "animate-pulse-soft")} />
        </div>
      </div>
    );
  }

  // Carbon. A gauge on a plinth: one hairline, quarter ticks cut out of it, nothing moving.
  return (
    <div aria-hidden className={cn("relative h-[3px] w-full bg-rule", className)}>
      <div className="absolute inset-y-0 left-0 bg-volt transition-[width] duration-200" style={{ width: `${pct}%` }} />
      {[25, 50, 75].map((p) => (
        <span key={p} className="absolute inset-y-0 w-px bg-bg" style={{ left: `${p}%` }} />
      ))}
    </div>
  );
}
