/**
 * What a movement is counted in.
 *
 * The app was asking for reps on a plank, because nothing anywhere knew that some movements
 * are held rather than repeated: `PlannedSet` has had a `durationSeconds` field all along and
 * the prescription builder never set it, so every exercise in the library came out as
 * "8 to 12 reps" whether it was a bench press or a dead hang.
 *
 * There is no "isometric" column in the library to read, so this works it out from what the
 * exercise actually is - its category, its movement pattern, its equipment and its name, in
 * that order of trust. Deterministic on purpose: it runs for every set of every session, and a
 * model call per exercise would be slow, billable and no more correct than the rules below,
 * which are testable against the real library.
 */
export type RepUnit = "reps" | "seconds";

export type MovementFacts = {
  name: string;
  pattern?: string | null;
  category?: string | null;
  equipment?: readonly string[] | null;
};

/** Machines you stay on for a while rather than count repetitions of. */
const CARDIO_KIT = new Set(["treadmill", "bike", "rowing_machine", "elliptical", "stair_climber"]);

/**
 * Held positions, matched as whole words. "sit" is deliberately absent on its own - a sit-up
 * is reps - so the wall sit is spelled out, and bare "iso" is absent because a "Leverage Iso
 * Row" is isolateral, not isometric.
 */
const HELD = /\b(plank|hold|holds|hang|wall sit|l-sit|lsit|hollow body|isometric)\b/i;

/**
 * A name describing a transition is a repetition, not a hold: "Push Up to Side Plank" ends in
 * a plank but you do it ten times.
 */
const TRANSITION = /\bto\b/i;

/**
 * "Hang" is the trap. In "Dead Hang" it is the exercise; in "Hang Clean", "Hang Snatch" and
 * "Smith Machine Hang Power Clean" it is only where the bar starts, and those are explosive
 * lifts done for reps. A lift name anywhere in the title settles it.
 */
const LIFT = /\b(clean|snatch|jerk|pull|press|row|curl|shrug|deadlift|thruster|swing)\b/i;

export function repUnitFor(e: MovementFacts): RepUnit {
  const category = e.category ?? "";
  // Anything on the cardio shelf is measured in time, as is a stretch, which is held.
  if (category === "cardio" || category === "stretch") return "seconds";
  // A loaded carry is a distance or a duration, never a count.
  if (e.pattern === "carry") return "seconds";
  if (e.equipment?.some((k) => CARDIO_KIT.has(k))) return "seconds";
  if (HELD.test(e.name) && !TRANSITION.test(e.name) && !LIFT.test(e.name)) return "seconds";
  return "reps";
}

/** How long a held set should last, by role, when the plan has nothing better to go on. */
export function defaultHoldSeconds(role: string): number {
  if (role === "primary") return 45;
  if (role === "secondary") return 40;
  if (role === "finisher") return 30;
  return 35;
}

/** "45s" or "8-12 reps", for anywhere a target is shown to a lifter. */
export function describeTarget(set: { reps: number | null; repRange: [number, number] | null; durationSeconds: number | null }): string {
  if (set.durationSeconds != null) return `${set.durationSeconds}s`;
  if (set.repRange) return `${set.repRange[0]}–${set.repRange[1]} reps`;
  if (set.reps != null) return `${set.reps} reps`;
  return "—";
}
