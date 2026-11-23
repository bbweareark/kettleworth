"use client";
import { useEffect, useRef, useState } from "react";
import { useReducedMotion } from "motion/react";
import { useStyle } from "@/lib/style";
import { Burst } from "@/components/style/arc-fx";

/**
 * Arc's signature: a set lands.
 *
 * Completing a set is the only moment in this app that hits back, and a flat red slide was
 * not enough of one. It is now a cut: a white flash, thirty-six speed lines thrown out of the
 * middle, an expanding ring in the charge colour and the red field, with the screen itself
 * shaking under it. The grammar is a manga impact frame, where the panel breaks rather than
 * the picture changing.
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
  return <Burst fire={hit} />;
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
