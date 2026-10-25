/**
 * Word Rush: the rest-period game.
 *
 * The brief was "something like Flappy Bird or Temple Run — really addictive, but also good
 * for cognitive skill or learning a language". So this is the Flappy loop with vocabulary as
 * the content. What actually makes that loop addictive, and what each maps to here:
 *
 * | Flappy Bird                   | Word Rush                                        |
 * |-------------------------------|--------------------------------------------------|
 * | One input                     | Two targets, left or right. One thumb, no aiming. |
 * | Instant restart, no menu      | The run-over screen *is* the start button.        |
 * | A visible best to beat        | Your best is on screen during the run.            |
 * | Difficulty rises every moment | The answer window shrinks with every correct word.|
 * | Death in one mistake          | One wrong answer, or one timeout, ends the run.   |
 * | "So close"                    | Ending one short of your best is called out.      |
 *
 * The vocabulary is deliberately gym, body and food Spanish, so the thing it teaches is the
 * thing the user is already doing. Learning compounds instead of being a distraction.
 *
 * The training guard from the previous game is kept: a run only exists inside a rest timer,
 * and Growth is capped per session.
 */

export const GAME_POINTS_PER_RUN = 5;
/** Per session, not per rest. Six scoring runs, then it plays on and says it has stopped paying. */
export const GAME_MAX_RUNS = 6;
export const GAME_POINTS_CAP = GAME_POINTS_PER_RUN * GAME_MAX_RUNS;

/** A run must clear this many words before it is worth anything, so a lucky tap pays nothing. */
export const SCORING_THRESHOLD = 5;

export const START_MS = 3200;
export const FLOOR_MS = 1150;
export const SPEEDUP_MS = 85;

export type Word = { es: string; en: string; group: "body" | "move" | "food" | "effort" | "time" };

/** Gym, body and food Spanish: what a lifter would actually want to carry into a gym abroad. */
export const WORDS: Word[] = [
  { es: "el pecho", en: "chest", group: "body" },
  { es: "la espalda", en: "back", group: "body" },
  { es: "la pierna", en: "leg", group: "body" },
  { es: "el hombro", en: "shoulder", group: "body" },
  { es: "el brazo", en: "arm", group: "body" },
  { es: "la rodilla", en: "knee", group: "body" },
  { es: "la cadera", en: "hip", group: "body" },
  { es: "el tobillo", en: "ankle", group: "body" },
  { es: "la muñeca", en: "wrist", group: "body" },
  { es: "el cuello", en: "neck", group: "body" },
  { es: "la mano", en: "hand", group: "body" },
  { es: "el pie", en: "foot", group: "body" },
  { es: "el músculo", en: "muscle", group: "body" },
  { es: "el hueso", en: "bone", group: "body" },
  { es: "la sangre", en: "blood", group: "body" },

  { es: "levantar", en: "to lift", group: "move" },
  { es: "empujar", en: "to push", group: "move" },
  { es: "tirar", en: "to pull", group: "move" },
  { es: "correr", en: "to run", group: "move" },
  { es: "caminar", en: "to walk", group: "move" },
  { es: "saltar", en: "to jump", group: "move" },
  { es: "estirar", en: "to stretch", group: "move" },
  { es: "respirar", en: "to breathe", group: "move" },
  { es: "sentarse", en: "to sit down", group: "move" },
  { es: "agacharse", en: "to squat", group: "move" },
  { es: "la pesa", en: "the weight", group: "move" },
  { es: "la barra", en: "the bar", group: "move" },
  { es: "la serie", en: "the set", group: "move" },
  { es: "la repetición", en: "the rep", group: "move" },
  { es: "el entrenamiento", en: "the workout", group: "move" },

  { es: "el huevo", en: "egg", group: "food" },
  { es: "el pollo", en: "chicken", group: "food" },
  { es: "la carne", en: "meat", group: "food" },
  { es: "el pescado", en: "fish", group: "food" },
  { es: "el arroz", en: "rice", group: "food" },
  { es: "la leche", en: "milk", group: "food" },
  { es: "el queso", en: "cheese", group: "food" },
  { es: "el pan", en: "bread", group: "food" },
  { es: "la manzana", en: "apple", group: "food" },
  { es: "el plátano", en: "banana", group: "food" },
  { es: "el agua", en: "water", group: "food" },
  { es: "la verdura", en: "vegetable", group: "food" },
  { es: "la comida", en: "meal", group: "food" },
  { es: "el desayuno", en: "breakfast", group: "food" },
  { es: "la cena", en: "dinner", group: "food" },

  { es: "fuerte", en: "strong", group: "effort" },
  { es: "cansado", en: "tired", group: "effort" },
  { es: "pesado", en: "heavy", group: "effort" },
  { es: "ligero", en: "light", group: "effort" },
  { es: "duro", en: "hard", group: "effort" },
  { es: "fácil", en: "easy", group: "effort" },
  { es: "rápido", en: "fast", group: "effort" },
  { es: "lento", en: "slow", group: "effort" },
  { es: "el dolor", en: "pain", group: "effort" },
  { es: "el descanso", en: "rest", group: "effort" },

  { es: "hoy", en: "today", group: "time" },
  { es: "mañana", en: "tomorrow", group: "time" },
  { es: "ayer", en: "yesterday", group: "time" },
  { es: "la semana", en: "week", group: "time" },
  { es: "el día", en: "day", group: "time" },
  { es: "siempre", en: "always", group: "time" },
];

/** Deterministic PRNG, so a seed replays the same run (tests, and a fair shared challenge). */
function rng(seed: string): () => number {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) { h ^= seed.charCodeAt(i); h = Math.imul(h, 16777619); }
  return () => { h ^= h << 13; h ^= h >>> 17; h ^= h << 5; return ((h >>> 0) % 100000) / 100000; };
}

export type Question = {
  word: Word;
  /** Exactly two, because two big targets can be hit one-handed without looking. */
  options: [string, string];
  correct: 0 | 1;
  /** How long this question allows, in ms. Shrinks as the run goes on. */
  ms: number;
};

export function windowMs(index: number): number {
  return Math.max(FLOOR_MS, START_MS - index * SPEEDUP_MS);
}

/**
 * The decoy is drawn from the *same* group where possible ("chest" against "back", not
 * against "tomorrow"), which is what makes the game teach rather than test pattern-matching.
 */
export function makeQuestion(seed: string, index: number, words: Word[] = WORDS): Question {
  const r = rng(`${seed}:${index}`);
  const word = words[Math.floor(r() * words.length)]!;
  const sameGroup = words.filter((w) => w.group === word.group && w.en !== word.en);
  const pool = sameGroup.length >= 1 ? sameGroup : words.filter((w) => w.en !== word.en);
  const decoy = pool[Math.floor(r() * pool.length)]!;
  const correct: 0 | 1 = r() < 0.5 ? 0 : 1;
  const options: [string, string] = correct === 0 ? [word.en, decoy.en] : [decoy.en, word.en];
  return { word, options, correct, ms: windowMs(index) };
}

export type RunResult = {
  score: number;
  best: number;
  beatBest: boolean;
  /** Within one of the best, which is the "so close" that makes people tap again. */
  soClose: boolean;
  points: number;
  message: string;
};

export function finishRun(score: number, previousBest: number, scoringRunsThisSession: number): RunResult {
  const beatBest = score > previousBest;
  const best = Math.max(score, previousBest);
  const soClose = !beatBest && previousBest > 0 && previousBest - score <= 1;
  const capped = scoringRunsThisSession >= GAME_MAX_RUNS;
  const earned = score >= SCORING_THRESHOLD && !capped;
  const points = earned ? GAME_POINTS_PER_RUN : 0;

  // The cap note is appended rather than replacing the result, because beating your best
  // while capped should still say both: the score stands, the points do not.
  const base = beatBest
    ? score === 0 ? "Off the mark. Go again." : `New best: ${score}.`
    : soClose
      ? `${score}. One short of your best.`
      : score < SCORING_THRESHOLD
        ? `${score}. ${SCORING_THRESHOLD} clears it for a point.`
        : `${score}. Best is ${previousBest}.`;
  const message = capped
    ? `${base} Session limit reached, so this one is for the Spanish.`
    : base;

  return { score, best, beatBest, soClose, points, message };
}
