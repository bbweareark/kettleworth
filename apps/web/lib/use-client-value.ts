"use client";
import { useSyncExternalStore } from "react";

/**
 * A value that only the browser knows, read without a second render.
 *
 * Several screens need something the server cannot know - the hour where the reader is, a
 * flag in localStorage, whether hydration has finished - and the safe way to use one is to
 * render a server-safe default first and correct it on the client. Doing that with
 * `useState` plus a `setState` inside `useEffect` works, but it costs an extra render and a
 * visible flash, and it is what `react-hooks/set-state-in-effect` is warning about.
 *
 * `useSyncExternalStore` is the sanctioned way to say the same thing: `serverValue` is what
 * is rendered on the server and during hydration, `read` is what the browser sees from then
 * on, and React handles the handover.
 *
 * `read` must return a **stable** value - the same result each call until something actually
 * changes - because React calls it on every render and compares. That makes it right for an
 * hour, a stored string or a boolean, and wrong for anything that moves on its own like
 * `Date.now()`; a ticking clock needs a subscription, which is what `useNow` has.
 */
const neverChanges = () => () => {};

export function useClientValue<T>(read: () => T, serverValue: T): T {
  return useSyncExternalStore(neverChanges, read, () => serverValue);
}
