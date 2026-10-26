import type { ExerciseSummary } from "@kettleworth/types";

/**
 * What the weight field means for an exercise, in the words a lifter would use.
 *
 * - Bars: the total on the bar, bar included. That is what the loads, maxes and research all use, and the app can
 *   show which plates to put on each side.
 * - Dumbbells and kettlebells: the number on one handle. It is what is printed on the rack and how people say it
 *   ("24s on the incline"). A pair counts twice toward volume, and the screen says "each" so nobody wonders.
 * - Machines and cables: the stack setting.
 * - Bodyweight moves: only the weight you add. Zero is a perfectly good answer.
 */
export type BarKind = "barbell" | "ez_bar" | "trap_bar" | "smith_machine";
export type LoadModel =
  | { kind: "bar"; bar: BarKind; label: string; hint: string }
  | { kind: "handheld"; implement: "dumbbell" | "kettlebell"; count: 1 | 2; label: string; hint: string }
  | { kind: "stack"; label: string; hint: string }
  | { kind: "added"; label: string; hint: string }
  | { kind: "plain"; label: string; hint: string };

type Ex = Pick<ExerciseSummary, "name" | "equipment" | "unilateral">;

const ONE_HANDHELD = /\b(goblet|pullover|single|one[- ]arm|one[- ]hand|suitcase|swing|windmill|turkish|halo|around the world|tate)\b/i;
const TWO_KETTLEBELLS = /\b(double|two[- ]kettlebell|2 kettlebell)\b/i;

export function loadModel(ex: Ex): LoadModel {
  const eq = new Set(ex.equipment);
  const bar: BarKind | null = eq.has("trap_bar") ? "trap_bar" : eq.has("ez_bar") ? "ez_bar" : eq.has("smith_machine") ? "smith_machine" : eq.has("barbell") ? "barbell" : null;
  if (bar) return { kind: "bar", bar, label: "Weight", hint: bar === "smith_machine" ? "total on the bar" : "total, bar included" };
  if (eq.has("dumbbell")) {
    const count: 1 | 2 = ex.unilateral || ONE_HANDHELD.test(ex.name) ? 1 : 2;
    return { kind: "handheld", implement: "dumbbell", count, label: "Weight", hint: count === 2 ? "per dumbbell" : "one dumbbell" };
  }
  if (eq.has("kettlebell")) {
    const count: 1 | 2 = TWO_KETTLEBELLS.test(ex.name) ? 2 : 1;
    return { kind: "handheld", implement: "kettlebell", count, label: "Weight", hint: count === 2 ? "per kettlebell" : "one kettlebell" };
  }
  if (eq.has("machine") || eq.has("cable") || eq.has("leg_press")) return { kind: "stack", label: "Weight", hint: eq.has("leg_press") ? "plates on the sled" : "stack setting" };
  if (eq.has("bodyweight") || eq.has("pull_up_bar") || eq.has("dip_station")) return { kind: "added", label: "Added weight", hint: "0 if none" };
  return { kind: "plain", label: "Weight", hint: "" };
}

/** How many of the logged weight were actually moved: two dumbbells count twice toward volume. */
export function loadMultiplier(ex: Ex): number {
  const m = loadModel(ex);
  return m.kind === "handheld" ? m.count : 1;
}

/** Bar weights in kilograms. Imperial lifters get the 45 lb bar, stored in kg like every other weight. */
export const DEFAULT_BARS_KG: Record<"metric" | "imperial", Record<BarKind, number>> = {
  metric: { barbell: 20, ez_bar: 10, trap_bar: 25, smith_machine: 0 },
  imperial: { barbell: 20.41, ez_bar: 11.34, trap_bar: 20.41, smith_machine: 0 },
};
export const BAR_NAMES: Record<BarKind, string> = { barbell: "Barbell", ez_bar: "EZ bar", trap_bar: "Trap bar", smith_machine: "Smith machine" };
export const BAR_CHOICES_KG: Record<BarKind, number[]> = { barbell: [20, 15, 10, 7.5], ez_bar: [7.5, 10, 12], trap_bar: [20, 25, 30], smith_machine: [0, 5, 10, 15] };
export const BAR_CHOICES_LB: Record<BarKind, number[]> = { barbell: [45, 35, 25, 15], ez_bar: [15, 20, 25], trap_bar: [45, 55, 65], smith_machine: [0, 10, 15, 25] };

const PLATES = { metric: [25, 20, 15, 10, 5, 2.5, 1.25], imperial: [45, 35, 25, 10, 5, 2.5] };

/**
 * Plates to load on each side for a total, in the lifter's own units. Greedy works because standard plate sets are
 * canonical. When the total cannot be built exactly, the nearest lighter load is shown and flagged.
 */
export function platesPerSide(total: number, bar: number, units: "metric" | "imperial"): { perSide: number; plates: number[]; exact: boolean; loadable: number } {
  const side = (total - bar) / 2;
  if (side <= 0) return { perSide: Math.max(0, side), plates: [], exact: Math.abs(side) < 0.01, loadable: bar };
  const plates: number[] = [];
  let left = Math.round(side * 100) / 100;
  for (const p of PLATES[units]) { while (left + 1e-9 >= p) { plates.push(p); left = Math.round((left - p) * 100) / 100; } }
  const built = plates.reduce((a, b) => a + b, 0);
  return { perSide: side, plates, exact: left < 0.01, loadable: bar + built * 2 };
}

/** "20 + 10 + 2.5" rather than a list of numbers. */
export function describePlates(plates: number[]): string {
  if (!plates.length) return "no plates";
  const counts: [number, number][] = [];
  for (const p of plates) { const last = counts[counts.length - 1]; if (last && last[0] === p) last[1]++; else counts.push([p, 1]); }
  return counts.map(([p, n]) => (n > 1 ? `${n}×${p}` : `${p}`)).join(" + ");
}

/**
 * The loads a lifter can actually select, for one piece of equipment.
 *
 * The console used to offer the current weight plus or minus a fixed step, which cannot reach
 * most real loads: a rack jumps 22.5 to 25 with nothing between, a barbell can only make totals
 * its plates can build, and a stack moves in whole pin increments. Stepping by 5 from 22.5
 * produced 27.5, a dumbbell that does not exist in most gyms.
 *
 * So the control offers the ladder the equipment actually has, and the lifter picks a rung.
 */

/** Dumbbells as racks are actually built: 1 kg steps to 10, then 2.5 to 30, then 5 to 60. */
const DUMBBELL_KG = [1, 1.5, 2, 2.5, 3, 4, 5, 6, 7.5, 8, 9, 10, 12, 12.5, 14, 15, 16, 17.5, 18, 20, 22.5, 25, 27.5, 30, 32.5, 35, 37.5, 40, 42.5, 45, 50, 55, 60];
const DUMBBELL_LB = [2.5, 5, 7.5, 10, 12.5, 15, 17.5, 20, 25, 30, 35, 40, 45, 50, 55, 60, 65, 70, 75, 80, 85, 90, 95, 100, 110, 120, 130];
/** Competition kettlebells come in fixed sizes, not a continuum. */
const KETTLEBELL_KG = [4, 6, 8, 10, 12, 14, 16, 20, 24, 28, 32, 36, 40, 44, 48];
const KETTLEBELL_LB = [9, 13, 18, 26, 35, 44, 53, 62, 70, 79, 88, 97, 106];

/** Every total a bar can be loaded to, since plates go on in pairs. Capped so the list stays a list. */
function barLadder(bar: number, units: "metric" | "imperial", max: number): number[] {
  const step = units === "metric" ? 1.25 : 2.5; // the smallest plate, one per side
  const out: number[] = [bar];
  for (let side = step; bar + side * 2 <= max; side = Math.round((side + step) * 100) / 100) {
    const built = platesPerSide(bar + side * 2, bar, units);
    if (built.exact) out.push(Math.round((bar + side * 2) * 100) / 100);
  }
  return out;
}

export type Ladder = { values: number[]; note: string };

/**
 * Selectable loads for a model, in the lifter's own units, as display numbers.
 * An empty list means the quantity is continuous and the keys should step it freely.
 */
export function loadLadder(
  model: LoadModel,
  units: "metric" | "imperial",
  barWeightDisplay = 0,
): Ladder {
  const metric = units === "metric";
  switch (model.kind) {
    case "handheld":
      return model.implement === "kettlebell"
        ? { values: metric ? KETTLEBELL_KG : KETTLEBELL_LB, note: "kettlebell sizes" }
        : { values: metric ? DUMBBELL_KG : DUMBBELL_LB, note: "dumbbell rack" };
    case "bar":
      return { values: barLadder(barWeightDisplay, units, barWeightDisplay + (metric ? 260 : 580)), note: "loadable totals" };
    case "stack":
      // Pin stacks move in whole plates. Most are 5 kg or 10 lb, and the list stops where gyms do.
      return { values: Array.from({ length: metric ? 40 : 30 }, (_, i) => (i + 1) * (metric ? 5 : 10)), note: "stack settings" };
    case "added":
      // What you can actually hang on a belt: plates, including none at all.
      return { values: metric ? [0, 1.25, 2.5, 5, 7.5, 10, 12.5, 15, 20, 25, 30, 35, 40] : [0, 2.5, 5, 10, 15, 20, 25, 35, 45, 55, 70, 90], note: "added plates" };
    default:
      return { values: [], note: "" };
  }
}

/** The rung at or just below a value, so the control can open on the lifter's current load. */
export function nearestRung(values: number[], v: number): number | null {
  if (!values.length) return null;
  let best = values[0]!;
  for (const x of values) if (Math.abs(x - v) < Math.abs(best - v)) best = x;
  return best;
}
