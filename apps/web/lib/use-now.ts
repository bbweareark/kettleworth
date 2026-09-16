"use client";
import { useEffect, useState } from "react";

/**
 * The phone's clock, or null until the page has mounted. Anything that depends on "now" (elapsed timers, today's
 * date, days left) must not be computed on the server, which runs in another time zone and a second or two earlier,
 * or React sees different text on the phone and rebuilds the tree.
 */
export function useNow(intervalMs = 0): number | null {
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => {
    setNow(Date.now());
    if (!intervalMs) return;
    const t = setInterval(() => setNow(Date.now()), intervalMs);
    return () => clearInterval(t);
  }, [intervalMs]);
  return now;
}

/** Local calendar date (YYYY-MM-DD) on the phone, not UTC. */
export function localIsoDate(ms: number): string {
  const d = new Date(ms);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
