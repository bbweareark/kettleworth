"use client";
import { useEffect, useRef, useState } from "react";
import { useReducedMotion } from "motion/react";
import { useStyle } from "@/lib/style";

/**
 * Arc's signature: a set lands.
 *
 * Completing a set is the only moment in this app that hits back. The screen takes a
 * full-bleed slide of Alarm Red for 280ms and the figure behind it is struck, which is how
 * Locomotive uses a red field and exactly how Charlie uses this colour: as an event, never as
 * a fill and never as a border.
 *
 * It renders in Arc only. Carbon marks a set with a toast and Sanctuary fills a segment of the
 * arch, so all three say "that counted" in their own language rather than sharing one.
 *
 * `count` is the number of completed sets. A change is the event; the value itself is unused.
 */
export function ImpactFrame({ count }: { count: number }) {
  const style = useStyle();
  const reduce = useReducedMotion();
  const [hit, setHit] = useState(0);
  const seen = useRef(count);

  useEffect(() => {
    if (count === seen.current) return;
    const up = count > seen.current;
    seen.current = count;
    // Only a set being completed lands. Clearing an exercise must not reward anyone.
    if (up) setHit((n) => n + 1);
  }, [count]);

  if (style !== "arc" || reduce || hit === 0) return null;
  return (
    <div
      key={hit}
      aria-hidden
      className="pointer-events-none fixed inset-0 z-50 animate-impact-frame bg-impact"
    />
  );
}

/**
 * The figure that takes the blow. Wraps whatever is given it and strikes it on the same beat
 * as the frame, so the number and the screen move together.
 */
export function Struck({ count, children, className }: { count: number; children: React.ReactNode; className?: string }) {
  const style = useStyle();
  const reduce = useReducedMotion();
  const [hit, setHit] = useState(0);
  const seen = useRef(count);

  useEffect(() => {
    if (count === seen.current) return;
    const up = count > seen.current;
    seen.current = count;
    if (up) setHit((n) => n + 1);
  }, [count]);

  if (style !== "arc" || reduce) return <>{children}</>;
  return <div key={hit} className={hit ? `animate-impact-strike ${className ?? ""}` : className}>{children}</div>;
}
