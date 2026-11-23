"use client";
import { useSyncExternalStore } from "react";
import { STYLES, type Style } from "@kettleworth/types";

/**
 * Which world the app is being lived in, on the client.
 *
 * The style is almost entirely tokens, so nearly every component changes world without
 * knowing the style exists. This is for the few places where the composition itself differs:
 * Arc's impact frame on a committed set, Sanctuary's arch. Those are all reactions to
 * something the member did, so reading the attribute the server already wrote is enough and
 * no provider has to thread through the tree.
 */
const EVENT = "kw-style-change";

function current(): Style {
  const v = document.documentElement.dataset.style as Style | undefined;
  return v && STYLES.includes(v) ? v : "carbon";
}

function subscribe(cb: () => void) {
  window.addEventListener(EVENT, cb);
  return () => window.removeEventListener(EVENT, cb);
}

export function useStyle(): Style {
  // Carbon on the server and in the first client render, which is what the markup was built
  // against; anything that must be right in the first paint belongs in CSS, not here.
  return useSyncExternalStore(subscribe, current, () => "carbon" as Style);
}

/** A year, in seconds. The style is a commitment, not a session preference. */
const YEAR = 60 * 60 * 24 * 365;

/**
 * Switch world now and record it. The cookie is what the next first byte reads, so the server
 * renders the right surface with no flash; the profile is the record of record, written by
 * the caller.
 */
export function applyStyle(style: Style) {
  document.cookie = `kw-style=${style}; path=/; max-age=${YEAR}; samesite=lax`;
  document.documentElement.dataset.style = style;
  window.dispatchEvent(new Event(EVENT));
}
