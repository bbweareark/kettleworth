"use client";
import { SOUND_MODES, type SoundMode } from "@kettleworth/core";

/**
 * Whether this app is allowed to make a noise, and how much of one.
 *
 * Kept in a cookie, the way the theme and the world already are, for the same two reasons.
 * It has to apply the instant it is chosen - a person reaching for this is usually reaching
 * for it because the app just made a sound they did not want - and it is a property of the
 * device rather than of the account: the phone that goes to the gym is not the laptop.
 *
 * Deliberately not on the training profile. A profile change asks to be saved and then asks
 * the programme to be regenerated, which is the wrong weight entirely for turning a sound
 * off, and nothing on the server needs to know this.
 *
 * Anything unreadable means on. A corrupted cookie must not be able to silence a rest timer
 * somebody is relying on.
 */
const COOKIE = "kw-sound";

/** A year, in seconds. */
const YEAR = 60 * 60 * 24 * 365;

export function soundMode(): SoundMode {
  if (typeof document === "undefined") return "on";
  const m = document.cookie.match(/(?:^|;\s*)kw-sound=([^;]*)/);
  const v = m?.[1] as SoundMode | undefined;
  return v && (SOUND_MODES as readonly string[]).includes(v) ? v : "on";
}

export function applySoundMode(mode: SoundMode) {
  document.cookie = `${COOKIE}=${mode}; path=/; max-age=${YEAR}; samesite=lax`;
}
