import type { Style } from "@kettleworth/types";
import { audible, landingTones, restTones, type SoundMoment, type Tone } from "@kettleworth/core";
import { soundMode } from "./sound-pref";

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
 *
 * The setting in `lib/sound-pref.ts` is read at the moment of playing rather than held, so
 * turning the sound off in one tab is obeyed by a session already open in another.
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
const EVENTS = ["pointerdown", "touchstart", "keydown"] as const;

export function armAudio() {
  if (armed || typeof window === "undefined") return;
  armed = true;
  const open = () => {
    // Nothing to open if nothing may be heard: a silenced app should not hold an audio device.
    // The listeners stay on until one of them actually opens a context, so turning the sound
    // back on mid-session still gets a context built inside a real gesture.
    if (soundMode() === "off") return;
    const c = audio();
    if (!c) return;
    if (c.state === "suspended") c.resume().catch(() => {});
    for (const ev of EVENTS) window.removeEventListener(ev, open);
  };
  for (const ev of EVENTS) window.addEventListener(ev, open, { passive: true });
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

function sound(moment: SoundMoment, tones: Tone[]) {
  try {
    if (!audible(soundMode(), moment)) return;
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
  sound("landing", landingTones(style, last));
}

/** Rest is over. */
export function restChime(style: Style) {
  sound("rest", restTones(style));
}

/**
 * Play a moment once, so the setting can be heard while it is being chosen. It goes through
 * the same gate as everything else, so picking "rest only" previews the rest chime and hears
 * nothing from a landing, which is exactly what that setting means.
 */
export function sampleChime(style: Style, moment: SoundMoment) {
  sound(moment, moment === "rest" ? restTones(style) : landingTones(style));
}
