import type { Style } from "@kettleworth/types";

/**
 * What the end of a rest period sounds like, per world.
 *
 * The owner asked for the timer to sound like the theme it is in, and he is right that one
 * beep for three worlds is the same mistake as one palette for three worlds. A gym is loud and
 * a phone is usually in a pocket, so each of these is short, mid-range and percussive rather
 * than a melody: you need to feel it through fabric, not appreciate it.
 *
 * Synthesised rather than loaded. Three audio files would be 60 to 150KB, would need a
 * decode and a cache, and would still be wrong on a phone speaker; an oscillator is a few
 * hundred bytes of code and is identical on every device. Nothing here runs unless a rest
 * period actually finishes.
 *
 *   Carbon      one clean 880Hz tone. An instrument reports; it does not perform.
 *   Arc         an impact: a low body hit under a bright metal clang, like a bell taking a
 *               punch, pitched to carry over gym noise.
 *   Sanctuary   a struck bowl: a warm fundamental with its fifth above it, left to decay.
 *
 * Every one is wrapped: a browser that refuses an AudioContext before a gesture, or has none,
 * must never break the timer, which is the thing people are actually relying on.
 */
type Ctx = typeof AudioContext extends new () => infer C ? C : never;

/** One oscillator shaped by an envelope, which is all three of these are made of. */
function tone(ctx: Ctx, opts: { type: OscillatorType; from: number; to?: number; at: number; dur: number; gain: number; }) {
  const o = ctx.createOscillator();
  const g = ctx.createGain();
  o.type = opts.type;
  o.frequency.setValueAtTime(opts.from, ctx.currentTime + opts.at);
  if (opts.to != null) o.frequency.exponentialRampToValueAtTime(opts.to, ctx.currentTime + opts.at + opts.dur);
  // A hard zero in an exponential ramp is invalid, so the tail goes to silence-adjacent.
  g.gain.setValueAtTime(0.0001, ctx.currentTime + opts.at);
  g.gain.exponentialRampToValueAtTime(opts.gain, ctx.currentTime + opts.at + 0.012);
  g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + opts.at + opts.dur);
  o.connect(g);
  g.connect(ctx.destination);
  o.start(ctx.currentTime + opts.at);
  o.stop(ctx.currentTime + opts.at + opts.dur + 0.02);
}

export function restChime(style: Style) {
  try {
    const ctx = new AudioContext();
    if (style === "arc") {
      // The hit, then the ring. Two layers so it reads as an impact rather than as a beep.
      tone(ctx, { type: "sine", from: 180, to: 60, at: 0, dur: 0.22, gain: 0.32 });
      tone(ctx, { type: "square", from: 1320, to: 660, at: 0.01, dur: 0.5, gain: 0.07 });
      tone(ctx, { type: "triangle", from: 880, at: 0.02, dur: 0.75, gain: 0.1 });
    } else if (style === "sanctuary") {
      // A bowl: the fundamental and its fifth, struck together and left alone.
      tone(ctx, { type: "sine", from: 396, at: 0, dur: 1.5, gain: 0.12 });
      tone(ctx, { type: "sine", from: 594, at: 0.02, dur: 1.2, gain: 0.07 });
    } else {
      tone(ctx, { type: "sine", from: 880, at: 0, dur: 0.2, gain: 0.08 });
    }
    // Hand the hardware back rather than holding a context open for the rest of the session.
    setTimeout(() => ctx.close().catch(() => {}), 2200);
  } catch {}
}
