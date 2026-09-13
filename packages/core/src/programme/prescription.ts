import type { TrainingProfile, PlannedSet, Goal, Experience } from "@kettleworth/types";
import { loadForReps, pctOf1RM } from "../metrics";
import { roundToPlate } from "../units";

export type Role = "primary" | "secondary" | "accessory" | "finisher" | "mobility" | "warmup";

export type Prescription = { sets: number; repRange: [number, number]; rpe: number; rir: number; restSeconds: number; tempo: string | null };

export function prescribe(goal: Goal, role: Role, experience: Experience, isCompound: boolean): Prescription {
  const adv = experience === "intermediate" || experience === "advanced";
  if (role === "mobility") return { sets: 2, repRange: [8, 12], rpe: 6, rir: 4, restSeconds: 30, tempo: "slow" };
  if (role === "finisher") return { sets: 3, repRange: [10, 15], rpe: 8, rir: 2, restSeconds: 45, tempo: null };
  switch (goal) {
    case "strength":
      if (role === "primary") return { sets: adv ? 5 : 4, repRange: [3, 5], rpe: 8, rir: 2, restSeconds: 180, tempo: null };
      if (role === "secondary") return { sets: 3, repRange: [5, 8], rpe: 8, rir: 2, restSeconds: 120, tempo: null };
      return { sets: 3, repRange: [8, 12], rpe: 8, rir: 2, restSeconds: 75, tempo: null };
    case "muscle":
      if (role === "primary") return { sets: adv ? 4 : 3, repRange: [6, 10], rpe: 8, rir: 2, restSeconds: 150, tempo: "3-0-1" };
      if (role === "secondary") return { sets: 3, repRange: [8, 12], rpe: 8.5, rir: 1, restSeconds: 90, tempo: "3-0-1" };
      return { sets: 3, repRange: [12, 15], rpe: 9, rir: 1, restSeconds: 60, tempo: "2-1-1" };
    case "endurance":
      if (role === "primary") return { sets: 3, repRange: [12, 15], rpe: 7.5, rir: 2, restSeconds: 60, tempo: null };
      return { sets: 3, repRange: [15, 20], rpe: 8, rir: 2, restSeconds: 45, tempo: null };
    case "fat_loss":
      if (role === "primary") return { sets: 3, repRange: [6, 10], rpe: 8, rir: 2, restSeconds: 120, tempo: null };
      if (role === "secondary") return { sets: 3, repRange: [10, 12], rpe: 8, rir: 2, restSeconds: 75, tempo: null };
      return { sets: 2, repRange: [12, 15], rpe: 8.5, rir: 1, restSeconds: 45, tempo: null };
    case "sport":
      if (role === "primary") return { sets: 4, repRange: [4, 6], rpe: 8, rir: 2, restSeconds: 150, tempo: null };
      if (role === "secondary") return { sets: 3, repRange: [6, 10], rpe: 8, rir: 2, restSeconds: 90, tempo: null };
      return { sets: 3, repRange: [10, 15], rpe: 8, rir: 2, restSeconds: 60, tempo: null };
    default: // general_health
      if (role === "primary") return { sets: 3, repRange: [6, 10], rpe: 7.5, rir: 2, restSeconds: 120, tempo: isCompound ? null : "2-0-2" };
      if (role === "secondary") return { sets: 3, repRange: [8, 12], rpe: 7.5, rir: 2, restSeconds: 90, tempo: null };
      return { sets: 2, repRange: [10, 15], rpe: 8, rir: 2, restSeconds: 60, tempo: null };
  }
}

export function buildSets(p: Prescription, opts: { e1rmKg?: number; volumeScalar: number; intensityScalar: number; isDeload: boolean; lowerBody: boolean; includeWarmup: boolean }): PlannedSet[] {
  const sets: PlannedSet[] = [];
  const workingCount = Math.max(1, Math.round(p.sets * opts.volumeScalar));
  const topReps = p.repRange[1];
  const targetRpe = opts.isDeload ? Math.max(5, p.rpe - 2) : p.rpe;
  const rir = opts.isDeload ? p.rir + 2 : p.rir;
  let workKg: number | null = null;
  if (opts.e1rmKg) {
    const pct = pctOf1RM(topReps, targetRpe) * opts.intensityScalar;
    workKg = roundToPlate(opts.e1rmKg * pct, opts.lowerBody ? 2.5 : 1.25);
  }
  let n = 1;
  if (opts.includeWarmup && workKg) {
    for (const f of [0.5, 0.75]) {
      sets.push({ setNumber: n++, type: "warmup", reps: f === 0.5 ? 8 : 5, repRange: null, targetRpe: null, targetRir: null, weightKg: roundToPlate(workKg * f, opts.lowerBody ? 2.5 : 1.25), restSeconds: 60, tempo: null, durationSeconds: null });
    }
  }
  for (let i = 0; i < workingCount; i++) {
    sets.push({ setNumber: n++, type: "working", reps: null, repRange: [p.repRange[0], p.repRange[1]], targetRpe, targetRir: rir, weightKg: workKg, restSeconds: p.restSeconds, tempo: p.tempo, durationSeconds: null });
  }
  return sets;
}

export function loadForRange(e1rmKg: number, reps: number): number {
  return loadForReps(e1rmKg, reps);
}

export function estimateSetMinutes(sets: PlannedSet[]): number {
  return sets.reduce((acc, s) => acc + (s.restSeconds + (s.durationSeconds ?? 40)) / 60, 0);
}

export function prescriptionSummary(profile: TrainingProfile): string {
  switch (profile.primaryGoal) {
    case "strength": return "Heavy compound work for 3 to 5 reps at RPE 8 with long rests: strength gains do not need failure, they need heavy, well-practised reps.";
    case "muscle": return "Moderate loads for 6 to 12 reps stopping 1 to 2 reps short of failure: meta-analyses show that is nearly as effective as failure for growth with far less fatigue.";
    case "fat_loss": return "Strength work to keep muscle in a deficit (lifting plus 2 g/kg protein is what preserves lean mass), with shorter rests for density.";
    case "endurance": return "Higher reps and shorter rests to build work capacity, with strength maintained on the main lifts.";
    case "sport": return "Power and strength on the big patterns, moderate accessory volume so you stay fresh for your sport.";
    default: return "Balanced strength and hypertrophy work at a comfortable intensity so you keep showing up.";
  }
}
