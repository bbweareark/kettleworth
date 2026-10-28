"use client";
import { useCallback, useRef, useSyncExternalStore } from "react";

/**
 * The phone's clock, or null until the page has mounted. Anything that depends on "now" (elapsed timers, today's
 * date, days left) must not be computed on the server, which runs in another time zone and a second or two earlier,
 * or React sees different text on the phone and rebuilds the tree.
 */
export function useNow(intervalMs = 0): number | null {
  /*
   * null on the server and during hydration, the real clock from the moment the browser
   * subscribes. Reading the time is a subscription to something outside React, so it is
   * modelled as one: copying it into state from an effect costs an extra render and is what
   * `react-hooks/set-state-in-effect` is pointing at.
   */
  /*
   * The latest reading lives in a ref, which is the one thing React allows to be written
   * after render; a variable captured from a `useMemo` closure is not.
   */
  const latest = useRef<number | null>(null);
  const subscribe = useCallback((onChange: () => void) => {
    latest.current = Date.now();
    onChange();
    if (!intervalMs) return () => {};
    const t = setInterval(() => { latest.current = Date.now(); onChange(); }, intervalMs);
    return () => clearInterval(t);
  }, [intervalMs]);
  const snapshot = useCallback(() => latest.current, []);
  return useSyncExternalStore(subscribe, snapshot, () => null);
}

/** Local calendar date (YYYY-MM-DD) on the phone, not UTC. */
export function localIsoDate(ms: number): string {
  const d = new Date(ms);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
