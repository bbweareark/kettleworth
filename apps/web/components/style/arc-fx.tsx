"use client";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { useReducedMotion } from "motion/react";
import { cn } from "@kettleworth/ui";

/**
 * Arc's effects.
 *
 * The owner's verdict on the first cut was that the anime world was "just images" that hide
 * and disappear, and that they should behave like someone charging up. He is right that a
 * cross fade is not animation. What follows is the small vocabulary that makes a figure feel
 * powered rather than placed:
 *
 *   Aura     an energy field that breathes behind a character, with embers rising out of it
 *   Crackle  short lightning strokes that flicker around the edge of that field
 *   Burst    a one-shot: white flash, radial speed lines, a ring, a red field
 *   Shake    the screen itself taking the hit
 *
 * All of it is CSS keyframes on the compositor (transform and opacity only, no layout, no
 * filters), so it runs at 60fps on a phone that has been in a gym bag all day, and all of it
 * is neutralised by the reduced-motion rule. Nothing here loops above the fold on a screen
 * where someone is trying to read a number: the aura only runs while the character is on
 * screen during a session.
 *
 * Deliberately not a library: every effect is twenty lines of divs, because a particle engine
 * for twelve embers would be the kind of over-engineering this project keeps out.
 */

/** Stable pseudo-random, so the embers are scattered but never re-scatter on a render. */
const rand = (i: number, seed = 1) => {
  const x = Math.sin((i + 1) * 12.9898 * seed) * 43758.5453;
  return x - Math.floor(x);
};

export type Charge = "idle" | "charging" | "peak";

/**
 * The energy field. `level` is how hard it is working: idle breathes slowly, charging doubles
 * the rate and the ember count, peak is white hot.
 */
export function Aura({ level = "idle", className }: { level?: Charge; className?: string }) {
  const reduce = useReducedMotion();
  const embers = level === "idle" ? 6 : 12;
  return (
    <div aria-hidden className={cn("pointer-events-none absolute inset-0 overflow-hidden", className)}>
      {/* Two fields, one wide and soft, one tight and hot, breathing out of phase. */}
      <div
        className={cn(
          "absolute left-1/2 top-1/2 size-[130%] -translate-x-1/2 -translate-y-1/2 rounded-full",
          !reduce && (level === "idle" ? "arc-aura" : "arc-aura-fast"),
        )}
        style={{
          background: `radial-gradient(circle, color-mix(in srgb, var(--color-impact) ${level === "peak" ? 55 : 38}%, transparent) 0%, transparent 62%)`,
        }}
      />
      <div
        className={cn(
          "absolute left-1/2 top-[58%] size-[62%] -translate-x-1/2 -translate-y-1/2 rounded-full",
          !reduce && (level === "idle" ? "arc-aura" : "arc-aura-fast"),
        )}
        style={{
          animationDelay: "-1.1s",
          background: `radial-gradient(circle, color-mix(in srgb, var(--color-charge) ${level === "peak" ? 70 : 42}%, transparent) 0%, transparent 58%)`,
        }}
      />

      {/* Embers, rising and burning out. Square, because this world has no round corners. */}
      {!reduce &&
        Array.from({ length: embers }, (_, i) => (
          <span
            key={i}
            className="arc-ember absolute bottom-0 bg-charge"
            style={{
              left: `${8 + rand(i) * 84}%`,
              width: 2 + Math.round(rand(i, 3) * 3),
              height: 2 + Math.round(rand(i, 5) * 4),
              ["--dx" as string]: `${(rand(i, 7) - 0.5) * 38}px`,
              animationDelay: `${rand(i, 11) * 1.9}s`,
              animationDuration: `${1.4 + rand(i, 13)}s`,
            }}
          />
        ))}

      {/* Crackle: four strokes of lightning around the field, flickering on their own clocks. */}
      {!reduce && level !== "idle" ? (
        <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="absolute inset-0 size-full text-charge">
          {[
            { d: "M18 76 L26 54 L19 52 L29 28", delay: "0s" },
            { d: "M82 72 L74 52 L81 49 L72 26", delay: "-0.5s" },
            { d: "M50 92 L56 74 L48 71 L54 56", delay: "-1.1s" },
            { d: "M30 92 L24 78 L31 74 L26 62", delay: "-0.8s" },
          ].map((l) => (
            <path
              key={l.d}
              d={l.d}
              fill="none"
              stroke="currentColor"
              strokeWidth={1.4}
              vectorEffect="non-scaling-stroke"
              className="arc-crackle"
              style={{ animationDelay: l.delay }}
            />
          ))}
        </svg>
      ) : null}
    </div>
  );
}

/**
 * The hit. Mounted with a changing `fire` key, it plays once: a white flash, radial speed
 * lines thrown outward, an expanding ring and a red field.
 */
export function Burst({ fire }: { fire: number }) {
  const reduce = useReducedMotion();
  if (reduce || fire === 0) return null;
  return (
    <div key={fire} aria-hidden className="pointer-events-none fixed inset-0 z-[55] overflow-hidden">
      {/* The red field, which is Arc's impact colour and appears nowhere else as a surface. */}
      <div className="arc-flash absolute inset-0 bg-impact" />

      {/* Speed lines: a radial burst drawn as wedges, thrown out from the middle. */}
      <svg viewBox="0 0 100 100" className="arc-rays absolute left-1/2 top-1/2 size-[180vmax] -translate-x-1/2 -translate-y-1/2 text-fg">
        {Array.from({ length: 36 }, (_, i) => {
          const a = (i / 36) * Math.PI * 2;
          const w = 0.5 + rand(i, 17) * 1.6;
          const x = 50 + Math.cos(a) * 60;
          const y = 50 + Math.sin(a) * 60;
          const x2 = 50 + Math.cos(a) * (14 + rand(i, 19) * 12);
          const y2 = 50 + Math.sin(a) * (14 + rand(i, 19) * 12);
          return <line key={i} x1={x2} y1={y2} x2={x} y2={y} stroke="currentColor" strokeWidth={w} opacity={0.9} />;
        })}
      </svg>

      <div className="arc-ring absolute left-1/2 top-1/2 size-[60vmin] -translate-x-1/2 -translate-y-1/2 border-[6px] border-charge" />
    </div>
  );
}

/**
 * Wraps the screen so it can take the hit. Shakes once whenever `fire` changes, and is
 * otherwise an ordinary div, so nothing below it knows this exists.
 */
export function Shake({ fire, children }: { fire: number; children: ReactNode }) {
  const reduce = useReducedMotion();
  const [on, setOn] = useState(false);
  const seen = useRef(fire);

  useEffect(() => {
    if (fire === seen.current) return;
    seen.current = fire;
    const start = setTimeout(() => setOn(true), 0);
    const stop = setTimeout(() => setOn(false), 440);
    return () => { clearTimeout(start); clearTimeout(stop); };
  }, [fire]);

  return <div className={cn(!reduce && on && "arc-shake")}>{children}</div>;
}
