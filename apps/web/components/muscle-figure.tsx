import { cn } from "@kettleworth/ui";

/**
 * Bronze figure with the working muscles lit from within. One base figure per sex, front and back, and one lit
 * variant per muscle group, all generated from the same reference so they cut together. Muscle keys from the
 * exercise library map onto the twelve lit groups below.
 */
export type MuscleGroup = "chest" | "shoulders" | "biceps" | "core" | "quads" | "forearms" | "back" | "triceps" | "glutes" | "hamstrings" | "calves" | "lower-back";
const GROUP: Record<string, MuscleGroup | null> = {
  chest: "chest", front_delts: "shoulders", side_delts: "shoulders", rear_delts: "shoulders", neck: "shoulders",
  lats: "back", upper_back: "back", traps: "back", lower_back: "lower-back",
  biceps: "biceps", triceps: "triceps", forearms: "forearms",
  abs: "core", obliques: "core", hip_flexors: "core",
  quads: "quads", adductors: "quads", abductors: "glutes", glutes: "glutes", hamstrings: "hamstrings", calves: "calves",
  full_body: null, cardio: null,
};
const BACK_VIEW = new Set<MuscleGroup>(["back", "triceps", "glutes", "hamstrings", "calves", "lower-back"]);
export const GROUP_LABEL: Record<MuscleGroup, string> = { chest: "Chest", shoulders: "Shoulders", biceps: "Biceps", core: "Core", quads: "Quads", forearms: "Forearms", back: "Back", triceps: "Triceps", glutes: "Glutes", hamstrings: "Hamstrings", calves: "Calves", "lower-back": "Lower back" };

export function muscleGroupsFor(muscles: string[]): MuscleGroup[] {
  const out: MuscleGroup[] = [];
  for (const m of muscles) { const g = GROUP[m]; if (g && !out.includes(g)) out.push(g); }
  return out;
}
export function figureSrc(sex: "male" | "female" | "other" | null | undefined, group: MuscleGroup | null, view?: "front" | "back"): string {
  const s = sex === "female" ? "f" : "m";
  if (!group) return `/art/body/base-${s}-${view ?? "front"}.jpg`;
  return `/art/body/${s}-${group}.jpg`;
}

/** The lit figure for an exercise: first primary muscle group drives the image; the rest are named beneath. */
export function MuscleFigure({ muscles, sex, className, size = "md", caption = true }: { muscles: string[]; sex?: "male" | "female" | "other" | null; className?: string; size?: "sm" | "md" | "lg"; caption?: boolean }) {
  const groups = muscleGroupsFor(muscles);
  const lead = groups[0] ?? null;
  const dim = size === "sm" ? "size-16" : size === "lg" ? "size-56" : "size-28";
  return (
    <figure className={cn("flex shrink-0 flex-col items-center gap-1.5", className)}>
      <div className={cn("relative overflow-hidden rounded-2xl ring-1 ring-white/[0.06]", dim)}>
        <img src={figureSrc(sex, lead)} alt={lead ? `${GROUP_LABEL[lead]} lit on a bronze figure` : "Bronze figure"} className="size-full object-cover object-top" />
        <div aria-hidden className="absolute inset-0 bg-[radial-gradient(60%_60%_at_50%_45%,transparent_40%,rgba(0,0,0,0.35)_100%)]" />
      </div>
      {caption && groups.length ? <figcaption className="max-w-[9rem] text-center text-2xs uppercase tracking-[0.14em] text-fg-subtle">{groups.map((g) => GROUP_LABEL[g]).join(" · ")}</figcaption> : null}
    </figure>
  );
}

/** Two-view figure with several groups lit at once, for the session and week summaries: front and back side by side. */
export function MuscleMap({ muscles, sex, className }: { muscles: string[]; sex?: "male" | "female" | "other" | null; className?: string }) {
  const groups = muscleGroupsFor(muscles);
  const front = groups.find((g) => !BACK_VIEW.has(g)) ?? null;
  const back = groups.find((g) => BACK_VIEW.has(g)) ?? null;
  return (
    <div className={cn("flex gap-2", className)}>
      {[["front", front], ["back", back]].map(([view, g]) => (
        <div key={view as string} className="relative aspect-[3/4] w-1/2 overflow-hidden rounded-2xl ring-1 ring-white/[0.06]"><img src={figureSrc(sex, g as MuscleGroup | null, view as "front" | "back")} alt="" className="size-full object-cover object-top" /></div>
      ))}
    </div>
  );
}
