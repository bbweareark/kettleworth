import type { Style } from "@kettleworth/types";

/**
 * What this app sounds like, written as numbers rather than as audio files.
 *
 * Two moments make a sound: a set landing, and a rest period ending. They are not the same
 * event and must not be the same noise. Rest ending is a summons - it has to reach someone
 * who has put the phone down and is looking at the ceiling - so it is loud, long and
 * unmistakable. A set landing is an acknowledgement, and it happens twenty to thirty times in
 * a session, so it is short, quiet and easy to stop noticing. A confirmation that is as loud
 * as an alarm is how an app gets muted, and a muted app cannot call you back to the bar.
 *
 * The sounds live here, as plain data, for two reasons. They can be tested - a tone that is
 * too loud or too long is a defect you can catch without ears - and the three worlds can be
 * compared side by side rather than being buried in a browser-only file. The player that
 * turns these into sound is `apps/web/lib/chime.ts`; nothing in this module touches an
 * AudioContext or any other browser API.
 *
 * Each world keeps its own voice, for the same reason it keeps its own palette:
 *
 *   Carbon      an instrument reporting. A dry click and a clean tone, nothing else.
 *   Arc         a hit. Low body under a bright edge, like something landing on a drum.
 *   Sanctuary   a struck block of wood. Warm, round, gone almost at once.
 */
export type Tone = {
  /** Oscillator shape. */
  type: "sine" | "square" | "triangle" | "sawtooth";
  /** Starting frequency in Hz. */
  from: number;
  /** Optional end frequency; the tone slides from `from` to `to` across its length. */
  to?: number;
  /** Seconds after the trigger that this tone starts, so layers can be offset. */
  at: number;
  /** Seconds from the start of this tone to silence. */
  dur: number;
  /** Peak gain, 0 to 1. */
  gain: number;
};

/**
 * The limits every sound in the app is held to, so a change to one of them cannot quietly
 * turn a confirmation into an alarm. These are asserted in the tests rather than being
 * advice in a comment.
 */
export const SOUND_LIMITS = {
  /** A landing is an acknowledgement; past this it starts to dominate the room. */
  landingPeakGain: 0.3,
  /** Past this a landing starts to overlap the next rep rather than mark the last one. */
  landingSeconds: 0.5,
  /** Rest ending has to carry across a gym, but it is still not a ringtone. */
  restPeakGain: 0.4,
  restSeconds: 2,
} as const;

/** The sum of a tone's offset and its length: when the last of it is heard. */
export const toneEnd = (t: Tone) => t.at + t.dur;

/** How long a whole sound lasts, in seconds. */
export const soundSeconds = (tones: Tone[]) => tones.reduce((m, t) => Math.max(m, toneEnd(t)), 0);

/** The loudest layer in a sound. Layers overlap, so this is a floor on what is heard, not a sum. */
export const soundPeakGain = (tones: Tone[]) => tones.reduce((m, t) => Math.max(m, t.gain), 0);

/**
 * A set has been logged.
 *
 * `last` is true when that set finished the movement, and adds one note above the others
 * rather than a different sound: finishing a movement should feel like the same event with
 * something extra, the way a drummer marks a bar's end on the same kit.
 */
export function landingTones(style: Style, last = false): Tone[] {
  if (style === "arc") {
    // The body of the hit, then the edge of it. Shorter and a third the gain of rest's clang.
    const tones: Tone[] = [
      { type: "sine", from: 150, to: 54, at: 0, dur: 0.16, gain: 0.26 },
      { type: "square", from: 1760, to: 880, at: 0, dur: 0.09, gain: 0.045 },
    ];
    if (last) tones.push({ type: "triangle", from: 660, at: 0.1, dur: 0.3, gain: 0.08 });
    return tones;
  }
  if (style === "sanctuary") {
    // A struck block: a warm fundamental with a quiet third above it, and a short decay.
    const tones: Tone[] = [
      { type: "sine", from: 330, at: 0, dur: 0.26, gain: 0.1 },
      { type: "sine", from: 495, at: 0.01, dur: 0.18, gain: 0.05 },
    ];
    if (last) tones.push({ type: "sine", from: 660, at: 0.14, dur: 0.34, gain: 0.06 });
    return tones;
  }
  // Carbon: the click of a mechanism, then the tone that says it registered.
  const tones: Tone[] = [
    { type: "square", from: 2400, at: 0, dur: 0.012, gain: 0.03 },
    { type: "sine", from: 660, at: 0.012, dur: 0.1, gain: 0.07 },
  ];
  if (last) tones.push({ type: "sine", from: 990, at: 0.1, dur: 0.14, gain: 0.05 });
  return tones;
}

/**
 * Rest is over.
 *
 * Unchanged in character from the first version of this app: these are the sounds the owner
 * signed off on, moved here so they sit beside the landings they must not be confused with.
 */
export function restTones(style: Style): Tone[] {
  if (style === "arc") {
    // The hit, then the ring. Two layers so it reads as an impact rather than as a beep.
    return [
      { type: "sine", from: 180, to: 60, at: 0, dur: 0.22, gain: 0.32 },
      { type: "square", from: 1320, to: 660, at: 0.01, dur: 0.5, gain: 0.07 },
      { type: "triangle", from: 880, at: 0.02, dur: 0.75, gain: 0.1 },
    ];
  }
  if (style === "sanctuary") {
    // A bowl: the fundamental and its fifth, struck together and left alone.
    return [
      { type: "sine", from: 396, at: 0, dur: 1.5, gain: 0.12 },
      { type: "sine", from: 594, at: 0.02, dur: 1.2, gain: 0.07 },
    ];
  }
  return [{ type: "sine", from: 880, at: 0, dur: 0.2, gain: 0.08 }];
}
