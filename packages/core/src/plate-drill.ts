/**
 * Plate Drill: the rest-period game.
 *
 * Design constraints, in order of importance:
 *
 * 1. **It must not compete with training.** A game you can farm instead of lifting is a bug,
 *    not a feature. So the drill only exists inside a real rest timer, it stops the moment
 *    rest ends, and `DRILL_POINTS_CAP` limits a whole session's winnings to less than a
 *    third of what finishing the session itself is worth.
 * 2. **It must calm, not spike.** Between heavy sets you want arithmetic, not adrenaline.
 *    There is no countdown on a round and no penalty for a wrong answer; the only clock is
 *    the rest clock you already had.
 * 3. **It should make you better at the thing.** Loading a bar quickly and correctly is a
 *    real gym skill, so the drill is: here is a target and a bar, pick the plates for one
 *    side. People who play it rack up faster.
 */

export const DRILL_POINTS_PER_SOLVE = 5;
/** Per session, not per rest: six solves, then the drill stops paying and says so. */
export const DRILL_MAX_SOLVES = 6;
export const DRILL_POINTS_CAP = DRILL_POINTS_PER_SOLVE * DRILL_MAX_SOLVES;

/** Plates on a normal gym rack, heaviest first. Kilograms. */
export const PLATES_KG = [25, 20, 15, 10, 5, 2.5, 1.25] as const;
export const PLATES_LB = [45, 35, 25, 10, 5, 2.5] as const;
export const BARS_KG = [20, 15, 10] as const;
export const BARS_LB = [45, 35, 25] as const;

export type DrillUnits = "metric" | "imperial";
export type DrillRound = {
  id: string;
  /** Total the bar must weigh, bar included. */
  target: number;
  bar: number;
  units: DrillUnits;
  plates: readonly number[];
  /** The fewest plates per side that reach the target. Used to score efficiency, never shown up front. */
  solution: number[];
};

/** Deterministic PRNG so a seed replays the same round (tests, and "same rest, same puzzle"). */
function rng(seed: string): () => number {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return () => {
    h ^= h << 13; h ^= h >>> 17; h ^= h << 5;
    return ((h >>> 0) % 100000) / 100000;
  };
}

/**
 * Greedy is optimal here because every plate divides the next one up in both the kg and lb
 * racks, so there is never a case where taking a smaller plate first does better.
 */
export function fewestPlates(perSide: number, plates: readonly number[]): number[] | null {
  let left = Math.round(perSide * 100) / 100;
  const out: number[] = [];
  for (const p of plates) {
    while (left >= p - 1e-9) {
      left = Math.round((left - p) * 100) / 100;
      out.push(p);
      if (out.length > 12) return null;
    }
  }
  return Math.abs(left) < 1e-9 ? out : null;
}

export function totalFor(bar: number, side: number[]): number {
  return Math.round((bar + side.reduce((a, b) => a + b, 0) * 2) * 100) / 100;
}

/**
 * Difficulty ramps with the streak, and only in ways that are still gym-real: more plates
 * per side first, then the awkward small plates, then a bar that is not the standard 20.
 */
export function makeRound(seed: string, streak: number, units: DrillUnits = "metric"): DrillRound {
  const r = rng(seed + ":" + streak);
  const plates = units === "metric" ? PLATES_KG : PLATES_LB;
  const bars = units === "metric" ? BARS_KG : BARS_LB;

  const bar = streak >= 4 ? bars[Math.floor(r() * bars.length)]! : bars[0]!;
  const maxPairs = streak < 2 ? 2 : streak < 4 ? 3 : 4;
  const allowSmall = streak >= 2;
  const pool = allowSmall ? plates : plates.filter((p) => p >= (units === "metric" ? 5 : 10));

  const side: number[] = [];
  const pairs = 1 + Math.floor(r() * maxPairs);
  for (let i = 0; i < pairs; i++) side.push(pool[Math.floor(r() * pool.length)]!);

  const target = totalFor(bar, side);
  const solution = fewestPlates((target - bar) / 2, plates) ?? side;
  return { id: `${seed}:${streak}`, target, bar, units, plates, solution };
}

export type DrillVerdict = {
  correct: boolean;
  total: number;
  /** Positive means the bar is over the target. */
  delta: number;
  /** True when the answer is right *and* uses the fewest plates possible. */
  optimal: boolean;
  points: number;
  message: string;
};

export function checkRound(round: DrillRound, picked: number[], solvedThisSession: number): DrillVerdict {
  const total = totalFor(round.bar, picked);
  const delta = Math.round((total - round.target) * 100) / 100;
  const correct = Math.abs(delta) < 1e-9;
  const optimal = correct && picked.length <= round.solution.length;
  const unit = round.units === "metric" ? "kg" : "lb";

  const capped = solvedThisSession >= DRILL_MAX_SOLVES;
  const points = correct && !capped ? DRILL_POINTS_PER_SOLVE : 0;

  const message = !correct
    ? delta > 0
      ? `${delta} ${unit} over. Take something off.`
      : `${Math.abs(delta)} ${unit} short.`
    : capped
      ? "Right. You have earned the session's limit, so this one is just for the hands."
      : optimal
        ? "Right, and with the fewest plates."
        : `Right, though ${round.solution.length} plate${round.solution.length === 1 ? "" : "s"} a side would do it.`;

  return { correct, total, delta, optimal, points, message };
}
