import type { Style } from "@kettleworth/types";
import { landingTones, restTones, type Tone } from "@kettleworth/core";

/**
 * The player. What the app sounds like is written in `packages/core/src/sound.ts`; this file
 * is only the few lines that turn those numbers into air.
 *
 * Synthesised rather than loaded. Six audio files would be 100 to 300KB, would need a decode
 * and a cache, and would still be wrong on a phone speaker; an oscillator is a few hundred
 * bytes of code and is identical on every device.
 *
 * Two things here are worth knowing.
 *
 * **One context, unlocked by the first touch.** A browser will not start audio until the
 * person has interacted with the page, and on iOS that permission attaches to the context,
 * not to the page: a context created later, in a timer callback or after an await, stays
 * silent. So a single context is created on the first pointer or key event and reused for the
 * session. The earlier version built a fresh one per sound, which is why a rest timer that
 * ran out while the phone was in a pocket could finish in silence.
 *
 * **Nothing here may throw.** Every call is wrapped. A browser with no AudioContext, a device
 * that refuses to resume one, a tab that has been suspended: none of that is allowed to reach
 * the caller, because the callers are a timer people rely on and a set they have just lifted.
 */
let ctx: AudioContext | null = null;
let armed = false;

/** The one context, built on demand and kept. Null when this browser has no audio at all. */
function audio(): AudioContext | null {
  if (ctx) return ctx;
  try {
    const Ctor = typeof AudioContext !== "undefined" ? AudioContext : undefined;
    if (!Ctor) return null;
    ctx = new Ctor();
    return ctx;
  } catch {
    return null;
  }
}

/**
 * Open the gate on the first gesture.
 *
 * Called once from the session screen. The listeners are passive, fire once, and cover the
 * three ways a person can touch this app: a finger, a mouse, a keyboard.
 */
export function armAudio() {
  if (armed || typeof window === "undefined") return;
  armed = true;
  const open = () => {
    const c = audio();
    if (c && c.state === "suspended") c.resume().catch(() => {});
  };
  for (const ev of ["pointerdown", "touchstart", "keydown"] as const) {
    window.addEventListener(ev, open, { once: true, passive: true });
  }
}

/** One oscillator shaped by an envelope, which is all of these sounds are made of. */
function play(c: AudioContext, t: Tone) {
  const o = c.createOscillator();
  const g = c.createGain();
  o.type = t.type;
  o.frequency.setValueAtTime(t.from, c.currentTime + t.at);
  if (t.to != null) o.frequency.exponentialRampToValueAtTime(t.to, c.currentTime + t.at + t.dur);
  // A hard zero in an exponential ramp is invalid, so the tail goes to silence-adjacent.
  g.gain.setValueAtTime(0.0001, c.currentTime + t.at);
  g.gain.exponentialRampToValueAtTime(t.gain, c.currentTime + t.at + 0.012);
  g.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + t.at + t.dur);
  o.connect(g);
  g.connect(c.destination);
  o.start(c.currentTime + t.at);
  o.stop(c.currentTime + t.at + t.dur + 0.02);
}

function sound(tones: Tone[]) {
  try {
    const c = audio();
    if (!c) return;
    // A context can be suspended again by the browser at any point - backgrounding the tab is
    // enough - so this is asked on every sound rather than only at the start.
    if (c.state === "suspended") c.resume().catch(() => {});
    for (const t of tones) play(c, t);
  } catch {}
}

/** A set has just been logged. `last` means it finished the movement. */
export function setChime(style: Style, last = false) {
  sound(landingTones(style, last));
}

/** Rest is over. */
export function restChime(style: Style) {
  sound(restTones(style));
}
