import type { ExerciseSummary, TrainingProfile, ProgrammePlan, PlannedSession, PlannedWeek, PlannedMesocycle, PlannedExercise, Muscle } from "@kettleworth/types";
import { chooseSplit } from "./split";
import { selectForSlot } from "./selection";
import { prescribe, buildSets, estimateSetMinutes, prescriptionSummary } from "./prescription";
import { seededRandom, hashString } from "../rng";
import { estimate1RM } from "../metrics";

export type GenerateOptions = { seed?: string; startDate?: string; /** Extend: the plan just finished. Anchors carry over, accessories rotate, block numbering continues. */ previousPlan?: ProgrammePlan | null; /** Latest estimated 1RMs from logged sets (exerciseId -> kg); overrides intake numbers. */ e1rmOverrides?: Record<string, number> };

const LOWER_PATTERNS = new Set(["squat", "hinge", "lunge"]);
const WARMUP_LINES: Record<string, string[]> = {
  default: ["5 min easy cardio (bike, row or brisk walk)", "Leg swings, hip circles, arm circles: 10 each", "Bodyweight squats × 10, push-ups × 8, band pull-aparts × 15"],
  upper: ["5 min easy cardio", "Arm circles and band pull-aparts: 2 × 15", "Scapular push-ups × 10, cat-cow × 8"],
  lower: ["5 min easy cardio", "Leg swings front/side: 10 each leg", "Bodyweight squats × 12, glute bridges × 12, walking lunges × 8/leg"],
};

function mesocycleLayout(totalWeeks: number): { build: number; deload: boolean }[] {
  // 4-week blocks (3 build + 1 deload) where possible; final block always ends on a deload.
  const blocks: { build: number; deload: boolean }[] = [];
  let remaining = Math.max(4, Math.min(16, totalWeeks));
  while (remaining > 0) {
    if (remaining >= 6 && remaining < 8) { blocks.push({ build: remaining - 1, deload: true }); break; }
    const len = Math.min(4, remaining);
    blocks.push({ build: len - 1, deload: true });
    remaining -= len;
  }
  return blocks;
}

export function generateProgramme(profile: TrainingProfile, library: ExerciseSummary[], opts: GenerateOptions = {}): ProgrammePlan {
  const rnd = seededRandom(hashString(opts.seed ?? "kettleworth"));
  const { split, templates, reason } = chooseSplit(profile);
  const e1rm = new Map<string, number>();
  for (const l of profile.knownLifts) e1rm.set(l.exerciseId, estimate1RM(l.weightKg, l.reps));
  for (const [id, kg] of Object.entries(opts.e1rmOverrides ?? {})) e1rm.set(id, kg);
  const prevMeso = opts.previousPlan?.mesocycles.at(-1);
  const prevSessions = prevMeso ? (prevMeso.weeks.filter((w) => !w.isDeload).at(-1) ?? prevMeso.weeks.at(-1))?.sessions ?? null : null;
  const blockOffset = opts.previousPlan ? opts.previousPlan.mesocycles.length : 0;

  const rationale: string[] = [reason, prescriptionSummary(profile)];
  const volumeBySet: Record<string, number> = {};
  const layout = mesocycleLayout(profile.timelineWeeks);
  const variety = profile.varietyPreference;

  /**
   * Anchor + rotate. Primary lifts are anchors: repeated every week of a block so the skill and the load can progress.
   * Secondary/accessory slots rotate between blocks (balanced) or every two weeks (high), so the same muscles are trained
   * through different movements. "steady" keeps every exercise for the whole programme.
   */
  // Weekly working-set ceiling per primary muscle. Dose-response evidence shows diminishing returns past ~20 sets and rising
  // injury/recovery cost; beginners get a lower cap because they grow on less and recover slower from novelty.
  const MAX_SETS = profile.experience === "beginner" ? 14 : profile.experience === "novice" ? 16 : 20;
  const buildBlock = (blockIndex: number, rotation: number, previous: PlannedSession[] | null): PlannedSession[] => {
    const usedIds = new Set<string>();
    const weekSets: Record<string, number> = {};
    const avoid = new Set<string>();
    if (previous && variety !== "steady") {
      const anchors = new Set(previous.flatMap((s) => s.exercises.filter((e) => e.role === "primary").map((e) => e.exerciseId)));
      const rotatePrimaries = variety === "high" && blockIndex > 0 && rotation === 0;
      for (const s of previous) for (const e of s.exercises) if ((e.role !== "primary" && !anchors.has(e.exerciseId)) || (rotatePrimaries && e.role === "primary")) avoid.add(e.exerciseId);
    }
    const sessions: PlannedSession[] = [];
    templates.forEach((t, dayIndex) => {
      const exercises: PlannedExercise[] = [];
      let minutes = 8;
      const isUpper = t.name.startsWith("Upper") || t.name === "Push" || t.name === "Pull";
      const isLower = t.name.startsWith("Lower") || t.name === "Legs";
      t.slots.forEach((slot, i) => {
        const keep = previous?.[dayIndex]?.exercises.find((e) => e.order === i);
        let sel = keep && !avoid.has(keep.exerciseId) ? { exercise: library.find((e) => e.id === keep.exerciseId)!, rationale: keep.rationale } : null;
        if (!sel || !sel.exercise) {
          const penalised = new Set([...usedIds, ...avoid]);
          sel = selectForSlot(library, slot, profile, penalised, rnd);
          // If avoiding leaves nothing, fall back to the previous choice rather than dropping the slot.
          if (!sel && keep) sel = { exercise: library.find((e) => e.id === keep.exerciseId)!, rationale: keep.rationale };
          if (sel && avoid.has(sel.exercise.id) === false && keep && sel.exercise.id !== keep.exerciseId) sel = { ...sel, rationale: `${sel.rationale} Rotated in this block to train the same muscles a new way.` };
        }
        if (!sel) return;
        const ex = sel.exercise;
        const p = prescribe(profile.primaryGoal, slot.role, profile.experience, ex.mechanics === "compound");
        const lower = LOWER_PATTERNS.has(ex.pattern) || ex.primaryMuscles.some((m) => ["quads", "hamstrings", "glutes"].includes(m));
        let sets = buildSets(p, { e1rmKg: e1rm.get(ex.id), volumeScalar: 1, intensityScalar: 1, isDeload: false, lowerBody: lower, includeWarmup: slot.role === "primary" });
        // Volume ceiling: trim this slot's working sets so no primary muscle exceeds MAX_SETS in the week; drop optional slots entirely.
        const working = sets.filter((x) => x.type === "working").length;
        const headroom = Math.min(...ex.primaryMuscles.map((m) => MAX_SETS - (weekSets[m] ?? 0)), working);
        if (headroom < working) {
          if (slot.optional || headroom < 2) { if (blockIndex === blockOffset && rotation === 0) rationale.push(`Left out an extra ${ex.primaryMuscles[0]?.replace("_", " ") ?? slot.pattern} exercise in ${t.name}: that muscle already has enough weekly sets for your level.`); return; }
          let keep = headroom; sets = sets.filter((x) => x.type !== "working" || keep-- > 0);
        }
        const est = estimateSetMinutes(sets);
        if (slot.optional && minutes + est > profile.sessionMinutes) {
          if (blockIndex === blockOffset) rationale.push(`Skipped an optional ${slot.pattern.replace("_", " ")} slot in ${t.name} to fit your ${profile.sessionMinutes}-minute sessions.`);
          return;
        }
        for (const m of ex.primaryMuscles) weekSets[m] = (weekSets[m] ?? 0) + sets.filter((x) => x.type === "working").length;
        minutes += est;
        usedIds.add(ex.id);
        exercises.push({ exerciseId: ex.id, order: i, role: slot.role === "mobility" ? "mobility" : slot.role, sets, notes: null, rationale: sel.rationale, supersetGroup: null });
        if (blockIndex === blockOffset && rotation === 0) for (const m of ex.primaryMuscles) volumeBySet[m] = (volumeBySet[m] ?? 0) + sets.filter((s) => s.type === "working").length;
      });
      sessions.push({ dayIndex, name: t.name, focus: t.focus as Muscle[], estimatedMinutes: Math.round(minutes), warmup: WARMUP_LINES[isUpper ? "upper" : isLower ? "lower" : "default"]!, exercises });
    });
    return sessions;
  };

  const mesocycles: PlannedMesocycle[] = [];
  let weekNumber = 1;
  const mesoNames = ["Foundation", "Build", "Peak", "Consolidate"];
  let previous: PlannedSession[] | null = prevSessions && prevSessions.length === templates.length ? prevSessions : null;
  if (opts.previousPlan) rationale.push(previous ? "This block continues your last one: the main lifts carry over with loads set from what you actually lifted, and accessories rotate so nothing goes stale." : "New block after your last programme: the split changed with your schedule, so exercises were re-selected; loads still start from your logged strength.");
  layout.forEach((block, mi) => {
    let blockSessions = buildBlock(mi + blockOffset, 0, previous);
    let midSessions = variety === "high" && block.build >= 3 ? buildBlock(mi, 1, blockSessions) : null;
    const weeks: PlannedWeek[] = [];
    for (let w = 0; w < block.build; w++) {
      const volumeScalar = 1 + w * 0.1 + mi * 0.05;
      const intensityScalar = 1 + w * 0.02 + mi * 0.03;
      const base = midSessions && w >= 2 ? midSessions : blockSessions;
      weeks.push({ weekNumber: weekNumber++, isDeload: false, intensityScalar: round2(intensityScalar), volumeScalar: round2(volumeScalar), sessions: scaleSessions(base, volumeScalar, intensityScalar, false, e1rm, library, profile) });
    }
    if (block.deload) weeks.push({ weekNumber: weekNumber++, isDeload: true, intensityScalar: 0.9, volumeScalar: 0.5, sessions: scaleSessions(midSessions ?? blockSessions, 0.5, 0.9, true, e1rm, library, profile) });
    mesocycles.push({ index: mi, name: opts.previousPlan ? `Block ${mi + 1 + blockOffset}` : (mesoNames[mi] ?? `Block ${mi + 1}`), focus: mi === 0 ? "Learn the movements and find your working weights." : mi === 1 ? "Add sets and load week over week." : "Push intensity, then consolidate with a deload.", weeks });
    previous = midSessions ?? blockSessions;
  });
  if (variety === "steady") rationale.push("You asked for a steady programme, so every exercise stays the same for the whole plan and progress is easy to track.");
  else if (variety === "high") rationale.push("Main lifts stay fixed inside each block so you can practise and progress them; accessories rotate every two weeks and main-lift variations change between blocks to keep it fresh.");
  else rationale.push("Main lifts repeat all block so the skill and the load can build; accessories rotate each block so the same muscles get trained through new movements.");
  rationale.push(`Volume ramps about 10% a week inside each block, then a deload at half volume and 10% lighter: the dose-response evidence rewards more volume with diminishing returns, and a light week (not a week off) keeps strength while fatigue clears.`);
  if (profile.injuries.length) rationale.push(`Exercises that load your ${profile.injuries.map((i) => i.region.replace("_", " ")).join(", ")} were excluded or down-weighted.`);
  if (profile.hatedExerciseIds.length) rationale.push(`${profile.hatedExerciseIds.length} exercise${profile.hatedExerciseIds.length > 1 ? "s" : ""} you dislike were never considered.`);

  const totalWeeks = mesocycles.reduce((a, m) => a + m.weeks.length, 0);
  return {
    name: `${capitalise(profile.primaryGoal.replace("_", " "))} · ${splitLabel(split)} · ${totalWeeks} weeks`,
    split,
    daysPerWeek: profile.daysPerWeek,
    totalWeeks,
    summary: `${profile.daysPerWeek} sessions a week for ${totalWeeks} weeks, built around ${splitLabel(split).toLowerCase()} training for ${profile.primaryGoal.replace("_", " ")}.`,
    rationale,
    mesocycles,
    weeklyVolumeBySet: volumeBySet,
  };
}

function scaleSessions(base: PlannedSession[], volumeScalar: number, intensityScalar: number, isDeload: boolean, e1rm: Map<string, number>, library: ExerciseSummary[], profile: TrainingProfile): PlannedSession[] {
  const byId = new Map(library.map((e) => [e.id, e]));
  return base.map((s) => ({
    ...s,
    exercises: s.exercises.map((pe) => {
      const ex = byId.get(pe.exerciseId)!;
      const p = prescribe(profile.primaryGoal, pe.role, profile.experience, ex.mechanics === "compound");
      const lower = LOWER_PATTERNS.has(ex.pattern) || ex.primaryMuscles.some((m) => ["quads", "hamstrings", "glutes"].includes(m));
      const baseWorking = pe.sets.filter((x) => x.type === "working").length;
      const sets = buildSets({ ...p, sets: baseWorking }, { e1rmKg: e1rm.get(ex.id), volumeScalar, intensityScalar, isDeload, lowerBody: lower, includeWarmup: pe.role === "primary" });
      return { ...pe, sets };
    }),
  }));
}

const round2 = (n: number) => Math.round(n * 100) / 100;
const capitalise = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
export function splitLabel(split: string): string {
  return { full_body: "Full Body", upper_lower: "Upper / Lower", ppl: "Push / Pull / Legs", ppl_ul: "PPL + Upper / Lower", bro: "Body Part", custom: "Custom" }[split] ?? split;
}

/** Guard: every exercise id in a plan must exist in the library and pass constraints. Used to validate AI-proposed edits. */
export function validatePlanAgainstLibrary(plan: ProgrammePlan, library: ExerciseSummary[]): string[] {
  const ids = new Set(library.map((e) => e.id));
  const errors: string[] = [];
  for (const m of plan.mesocycles) for (const w of m.weeks) for (const s of w.sessions) for (const e of s.exercises) if (!ids.has(e.exerciseId)) errors.push(`Unknown exercise ${e.exerciseId} in ${s.name} week ${w.weekNumber}`);
  return errors;
}
