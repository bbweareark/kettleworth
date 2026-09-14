import type { Adaptation, PlannedSet } from "@kettleworth/types";

export type PlannedInstance = { id: string; exerciseId: string; role: string; plannedSets: PlannedSet[] };
export type AppliedChange = { instanceId: string; plannedSets: PlannedSet[]; note: string; swapTo?: string };

/**
 * Turn weekly adaptations into concrete set changes for the coming week. Pure and explainable:
 * volume scales working-set count (min 2), intensity scales working loads, deload does both, swap flags the instance.
 */
export function applyAdaptations(instances: PlannedInstance[], adaptations: Adaptation[]): AppliedChange[] {
  let volume = 1, intensity = 1; const notes: string[] = []; const swaps = new Map<string, string>();
  for (const a of adaptations) {
    if (a.kind === "volume_up" || a.kind === "volume_down") { volume *= a.magnitude ?? 1; notes.push(a.reason); }
    else if (a.kind === "intensity_down") { intensity *= a.magnitude ?? 1; notes.push(a.reason); }
    else if (a.kind === "deload") { volume *= a.magnitude ?? 0.6; intensity *= 0.9; notes.push(a.reason); }
    else if (a.kind === "swap" && a.exerciseId) swaps.set(a.exerciseId, a.reason);
  }
  const out: AppliedChange[] = [];
  for (const i of instances) {
    const swap = swaps.get(i.exerciseId);
    if (swap) { out.push({ instanceId: i.id, plannedSets: i.plannedSets, note: swap, swapTo: "auto" }); continue; }
    if (volume === 1 && intensity === 1) continue;
    const working = i.plannedSets.filter((s) => s.type === "working");
    const keep = Math.max(2, Math.round(working.length * volume));
    let n = 0;
    const sets = i.plannedSets.filter((s) => s.type !== "working" || n++ < keep).map((s) => s.type === "working" && s.weightKg != null ? { ...s, weightKg: Math.round((s.weightKg * intensity) / 1.25) * 1.25 } : s);
    // If volume went up, add sets by cloning the last working set.
    const last = working[working.length - 1];
    for (let k = working.length; k < keep && last; k++) sets.push({ ...last, setNumber: sets.length + 1, weightKg: last.weightKg != null ? Math.round((last.weightKg * intensity) / 1.25) * 1.25 : null });
    out.push({ instanceId: i.id, plannedSets: sets.map((s, idx) => ({ ...s, setNumber: idx + 1 })), note: notes.join(" ") });
  }
  return out;
}

export type CheckInChoice = "keep" | "fresh" | "ease";
/** The Monday question. Turned into adaptations so the same engine applies it. */
export function checkInToAdaptations(choice: CheckInChoice): Adaptation[] {
  if (choice === "ease") return [{ exerciseId: null, kind: "intensity_down", magnitude: 0.92, reason: "You asked to ease off this week, so target loads drop 8% and the plan otherwise stands." }];
  if (choice === "fresh") return [{ exerciseId: null, kind: "swap", magnitude: null, reason: "You asked for something fresh, so this week's accessories rotate to new movements for the same muscles; the main lifts stay so progress isn't lost." }];
  return [{ exerciseId: null, kind: "hold", magnitude: null, reason: "You chose to stay the course. Consistency compounds; the planned progression continues." }];
}
