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
