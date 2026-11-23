import type { Style } from "@kettleworth/types";

/**
 * What each world says when something goes right.
 *
 * The owner asked for the experience to differ by style, not just the paint. The numbers,
 * the plan and the engine are identical in all three; the words around them are not, because
 * the reason a person opens the app is not the same reason for everyone. Carbon reports,
 * Arc narrates a fight, Sanctuary speaks of keeping something.
 *
 * Kept deliberately small. These are the few places a member is addressed directly: a set
 * landing, an exercise finishing, a session finishing, and what rest is called. Everything
 * factual, every number and every coaching reason, is written once and shared.
 */
export type Voice = {
  /** Prefixes the line the coach reads back after a set is logged. */
  setLanded: string;
  /** When every set of an exercise is done. */
  exerciseDone: string;
  /** The word for the gap between sets. */
  rest: string;
  /** Sits under the session title while training. */
  underway: (done: number, total: number) => string;
};

const VOICES: Record<Style, Voice> = {
  carbon: {
    setLanded: "Logged.",
    exerciseDone: "That exercise is done.",
    rest: "Rest",
    underway: (d, t) => `Watching every set. ${d} of ${t} done.`,
  },
  arc: {
    setLanded: "That landed.",
    exerciseDone: "Chapter closed.",
    rest: "Between rounds",
    underway: (d, t) => `${d} of ${t} landed. Keep going.`,
  },
  sanctuary: {
    setLanded: "Kept.",
    exerciseDone: "One more stone set.",
    rest: "Rest",
    underway: (d, t) => `${d} of ${t} kept today.`,
  },
};

export const voiceFor = (style: Style): Voice => VOICES[style];
