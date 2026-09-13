import type { Muscle, MovementPattern, Equipment, BodyRegion } from "@kettleworth/types";

export type FedbExercise = {
  id: string; name: string; force: "push" | "pull" | "static" | null; level: "beginner" | "intermediate" | "expert";
  mechanic: "compound" | "isolation" | null; equipment: string | null; primaryMuscles: string[]; secondaryMuscles: string[];
  instructions: string[]; category: string; images: string[];
};

const MUSCLE: Record<string, Muscle[]> = {
  abdominals: ["abs"], hamstrings: ["hamstrings"], adductors: ["adductors"], quadriceps: ["quads"], biceps: ["biceps"], shoulders: ["front_delts", "side_delts"],
  chest: ["chest"], "middle back": ["upper_back"], calves: ["calves"], glutes: ["glutes"], "lower back": ["lower_back"], lats: ["lats"], triceps: ["triceps"],
  traps: ["traps"], forearms: ["forearms"], neck: ["neck"], abductors: ["abductors"],
};
const EQUIP: Record<string, Equipment[]> = {
  "body only": ["bodyweight"], machine: ["machine"], "foam roll": ["foam_roller"], kettlebells: ["kettlebell"], dumbbell: ["dumbbell"], cable: ["cable"], barbell: ["barbell"],
  bands: ["bands"], "medicine ball": ["medicine_ball"], "exercise ball": ["bodyweight"], "e-z curl bar": ["ez_bar"], other: ["bodyweight"],
};

export function mapMuscles(xs: string[]): Muscle[] {
  const out = new Set<Muscle>();
  for (const x of xs) for (const m of MUSCLE[x] ?? []) out.add(m);
  return [...out];
}
export function mapEquipment(e: string | null, name: string): Equipment[] {
  const n = name.toLowerCase();
  const base = new Set<Equipment>(EQUIP[e ?? "other"] ?? ["bodyweight"]);
  if (/\bbench\b|incline|decline/.test(n) && !/bodyweight|bench dip/.test(n)) base.add("bench");
  if (/smith/.test(n)) { base.delete("barbell"); base.add("smith_machine"); }
  if (/trap bar|hex bar/.test(n)) { base.delete("barbell"); base.add("trap_bar"); }
  if (/leg press/.test(n)) { base.delete("machine"); base.add("leg_press"); }
  if (/pull-?up|chin-?up|hanging/.test(n) && e === "body only") base.add("pull_up_bar");
  if (/\bdip\b/.test(n) && e === "body only" && !/bench/.test(n)) base.add("dip_station");
  if (/trx|suspension|suspended/.test(n)) { base.delete("bodyweight"); base.add("trx"); }
  if (/\bsled\b|prowler/.test(n)) { base.delete("bodyweight"); base.add("machine"); }
  if (/rack|squat\b/.test(n) && e === "barbell" && !/front raise|curl|row|press/.test(n)) base.add("squat_rack");
  if (/rowing machine|rower/.test(n)) base.add("rowing_machine");
  if (/treadmill|running/.test(n) && e !== "body only") base.add("treadmill");
  if (/bike|cycling/.test(n)) base.add("bike");
  return [...base];
}
export function mapPattern(x: FedbExercise, primary: Muscle[]): MovementPattern {
  const n = x.name.toLowerCase();
  if (x.category === "cardio") return "cardio";
  if (x.category === "stretching") return "mobility";
  if (x.category === "plyometrics") return "plyometric";
  if (/carry|walk\b|farmer/.test(n)) return "carry";
  if (/lunge|split squat|step-?up|bulgarian|pistol/.test(n)) return "lunge";
  if (/squat|leg press|hack|goblet|sissy/.test(n) && !/jump/.test(n)) return "squat";
  if (/deadlift|romanian|rdl|good morning|hip thrust|glute bridge|kettlebell swing|swing|hyperextension|back extension|clean|snatch|pull-?through/.test(n)) return "hinge";
  if (/pull-?up|chin-?up|pulldown|lat pull/.test(n)) return "vertical_pull";
  if (/row|face pull|rear delt|reverse fly|pullover|shrug/.test(n) && x.mechanic === "compound") return "horizontal_pull";
  if (/row|face pull/.test(n)) return "horizontal_pull";
  if (/overhead|shoulder press|military|arnold|push press|handstand|pike push/.test(n)) return "vertical_push";
  if (/bench|push-?up|chest press|dip|fly|flye|crossover|pec deck/.test(n)) return "horizontal_push";
  if (primary.some((m) => m === "abs" || m === "obliques" || m === "lower_back") && x.mechanic !== "isolation") return "core";
  if (primary.some((m) => m === "abs" || m === "obliques")) return "core";
  if (x.mechanic === "isolation") return "isolation";
  if (primary.includes("chest")) return "horizontal_push";
  if (primary.includes("lats") || primary.includes("upper_back")) return "horizontal_pull";
  if (primary.includes("quads")) return "squat";
  if (primary.includes("hamstrings") || primary.includes("glutes")) return "hinge";
  return "isolation";
}
export function mapCategory(x: FedbExercise): "strength" | "cardio" | "mobility" | "plyometric" | "warmup" | "stretch" {
  if (x.category === "cardio") return "cardio";
  if (x.category === "stretching") return "stretch";
  if (x.category === "plyometrics") return "plyometric";
  return "strength";
}
export function mapDifficulty(level: string, category?: string): "beginner" | "intermediate" | "advanced" {
  if (category === "olympic weightlifting" || category === "strongman") return "advanced";
  return level === "expert" ? "advanced" : level === "intermediate" ? "intermediate" : "beginner";
}
export function contraindications(x: FedbExercise, pattern: MovementPattern, primary: Muscle[], equipment: Equipment[]): BodyRegion[] {
  const n = x.name.toLowerCase();
  const out = new Set<BodyRegion>();
  if (pattern === "hinge" && /deadlift|good morning|clean|snatch|swing|hyperextension/.test(n)) out.add("lower_back");
  if (pattern === "squat") out.add("knee");
  if (pattern === "squat" && equipment.includes("barbell")) out.add("lower_back");
  if (/lunge|split squat|pistol|jump|box|sissy|leg extension/.test(n)) out.add("knee");
  if (pattern === "vertical_push" || /behind the neck|upright row|dip\b/.test(n)) out.add("shoulder");
  if (pattern === "horizontal_push" && equipment.includes("barbell")) out.add("shoulder");
  if (/skull|french press|close-grip|kickback|pushdown/.test(n) || primary.includes("triceps")) out.add("elbow");
  if (/wrist|reverse curl|forearm/.test(n)) out.add("wrist");
  if (/neck/.test(n) || primary.includes("neck")) out.add("neck");
  if (pattern === "plyometric") { out.add("knee"); out.add("ankle"); }
  if (/calf|calves/.test(n)) out.add("ankle");
  if (/hip thrust|glute bridge|adductor|abductor/.test(n)) out.add("hip");
  return [...out];
}
export function unilateral(name: string): boolean {
  return /one-?arm|single-?arm|single-?leg|one-?leg|alternat|unilateral|lunge|split squat|bulgarian|pistol|step-?up/i.test(name);
}
export function slugify(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}
