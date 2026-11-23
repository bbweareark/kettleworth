/**
 * Effort in plain words.
 *
 * The scale lives here rather than in the console because the rest screen states the next
 * set's effort too, and two copies of a five stop scale is two chances for them to disagree.
 * The RPE numbers stay in the data and in accessible names; the face of the app never shows
 * them, because "RPE 9" is jargon.
 */
export const EFFORT = [["Easy", 6], ["Light", 7], ["Right", 8], ["Hard", 9], ["Max", 10]] as const;

/** Nearest plain word for a target RPE, so a planned 8.5 reads as a word and not a decimal. */
export function effortWord(rpe: number): string {
  let best: readonly [string, number] = EFFORT[0];
  for (const e of EFFORT) if (Math.abs(e[1] - rpe) < Math.abs(best[1] - rpe)) best = e;
  return best[0];
}
