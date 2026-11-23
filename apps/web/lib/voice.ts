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

/*
 * Arc's narration.
 *
 * The owner's note was that the member should feel like the main character, so in this world
 * the app stops describing what it did and starts narrating what they are doing. Every line
 * below is addressed to them, uses their name where it has one, and is about effort rather
 * than about the app.
 *
 * The lines are deterministic per occasion rather than random: the same set, reopened, says
 * the same thing. A screen whose encouragement reshuffles while you look at it is a slot
 * machine, and nobody believes a slot machine.
 */
const OPENING = [
  "takes the floor.",
  "steps up again.",
  "is here, on time, unbothered.",
  "came back. That is the whole trick.",
  "starts where yesterday stopped.",
];

const DURING = [
  "The bar does not care how you feel. Go anyway.",
  "This is the part nobody films.",
  "One rep better than last time is the entire plot.",
  "Shaking is not failing.",
  "Everyone strong was once exactly here.",
  "The set is won before the last rep, not during it.",
];

const CLEARED = [
  "Episode cleared.",
  "That is another one in the record.",
  "Logged, banked, yours.",
  "The arc moves.",
];

/** Stable pick: the same index for the same occasion. */
function pick<T>(bank: T[], seed: number): T {
  return bank[Math.abs(Math.trunc(seed)) % bank.length]!;
}

/** The line under a title card, naming the protagonist. */
export const arcOpening = (name: string, episode: number) => `${name} ${pick(OPENING, episode)}`;

/** The line beside the character while a session is under way. */
export const arcDuring = (setsDone: number) => pick(DURING, setsDone);

/** The line on the card when the last set of a session lands. */
export const arcCleared = (episode: number) => pick(CLEARED, episode);
