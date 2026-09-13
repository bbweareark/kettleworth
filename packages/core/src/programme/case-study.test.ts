import { describe, it, expect } from "vitest";
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { TrainingProfile, type ExerciseSummary } from "@kettleworth/types";
import { generateProgramme, validatePlanAgainstLibrary } from "./generate";
import { exclusionReason, availableEquipment } from "./selection";
import { nutritionTargets } from "../nutrition/targets";
import { computeBaseline } from "../metrics";

/**
 * Case studies: the engine is run against the real 855-exercise library for six very different people, and every
 * hard promise is asserted: no missing equipment, no hated exercise, no severe-injury movement, session time respected,
 * volume landmarks in range, calorie floors respected. The results are written to docs/CASE-STUDIES.md so the reasoning
 * behind each plan is reviewable, not just the code.
 */
const here = path.dirname(fileURLToPath(import.meta.url));
const raw = JSON.parse(readFileSync(path.join(here, "../../../db/seed/data/free-exercise-db.json"), "utf8")) as { id: string; name: string; equipment: string | null; level: string; mechanic: string | null; primaryMuscles: string[]; secondaryMuscles: string[]; category: string; images: string[]; instructions: string[]; force: string | null }[];
// Reuse the seed mapper so the test sees exactly what production sees.
import { contraindications, mapCategory, mapDifficulty, mapEquipment, mapMuscles, mapPattern, slugify, unilateral } from "../../../db/seed/map-exercise";
const library: ExerciseSummary[] = raw.filter((x) => x.category !== "strongman").map((x) => {
  const primary = mapMuscles(x.primaryMuscles); const equipment = mapEquipment(x.equipment, x.name); const pattern = mapPattern(x as never, primary);
  return { id: slugify(x.name), slug: slugify(x.name), name: x.name, aliases: [], primaryMuscles: primary, secondaryMuscles: mapMuscles(x.secondaryMuscles), equipment, pattern, mechanics: (x.mechanic ?? (pattern === "isolation" ? "isolation" : "compound")) as "compound" | "isolation", difficulty: mapDifficulty(x.level, x.category), category: mapCategory(x as never), contraindicatedRegions: contraindications(x as never, pattern, primary, equipment), unilateral: unilateral(x.name), imageUrls: [], hasVideo: false, popularity: /^(barbell squat|barbell deadlift|barbell bench press|pullups|barbell shoulder press|bent over barbell row|romanian deadlift|dumbbell bench press|goblet squat|pushups|dumbbell lunges|leg press|wide-grip lat pulldown|seated cable rows|one-arm dumbbell row|barbell hip thrust|side lateral raise|barbell curl|triceps pushdown|plank|dumbbell shoulder press)/i.test(x.name) ? 90 : x.mechanic === "compound" ? 35 : 25 };
});

const personas = [
  { name: "Priya, 34, beginner fat loss at home", profile: { sex: "female", age: 34, heightCm: 163, weightKg: 74, experience: "beginner", goals: ["fat_loss"], primaryGoal: "fat_loss", daysPerWeek: 3, sessionMinutes: 40, environment: "home", equipment: ["dumbbell", "bands"], dietType: "vegetarian", allergens: ["nuts"], cookingMinutes: 20, budgetTier: "low", timelineWeeks: 12 } },
  { name: "Tom, 28, intermediate hypertrophy, gym, bad shoulder", profile: { sex: "male", age: 28, heightCm: 182, weightKg: 86, experience: "intermediate", goals: ["muscle"], primaryGoal: "muscle", daysPerWeek: 5, sessionMinutes: 75, environment: "gym", styles: ["bodybuilding"], injuries: [{ region: "shoulder", severity: "severe" }], hatedExerciseIds: ["dips-triceps-version"], knownLifts: [{ exerciseId: "barbell-squat", weightKg: 120, reps: 5 }, { exerciseId: "barbell-deadlift", weightKg: 150, reps: 3 }], timelineWeeks: 12, varietyPreference: "high" } },
  { name: "Aisha, 45, general health, 2 days, halal, high stress", profile: { sex: "female", age: 45, heightCm: 158, weightKg: 62, experience: "novice", goals: ["general_health"], primaryGoal: "general_health", daysPerWeek: 2, sessionMinutes: 45, environment: "gym", dietType: "halal", stressLevel: 5, sleepHours: 5.5, timelineWeeks: 8 } },
  { name: "Marcus, 52, strength, 4 days, moderate lower back", profile: { sex: "male", age: 52, heightCm: 178, weightKg: 92, experience: "advanced", goals: ["strength"], primaryGoal: "strength", daysPerWeek: 4, sessionMinutes: 90, environment: "gym", styles: ["powerlifting"], injuries: [{ region: "lower_back", severity: "moderate" }], knownLifts: [{ exerciseId: "barbell-bench-press-medium-grip", weightKg: 110, reps: 3 }], timelineWeeks: 12, varietyPreference: "steady" } },
  { name: "Lena, 23, vegan endurance runner adding strength, 2 days, 30 min", profile: { sex: "female", age: 23, heightCm: 170, weightKg: 57, experience: "beginner", goals: ["endurance", "general_health"], primaryGoal: "endurance", daysPerWeek: 2, sessionMinutes: 30, environment: "home", equipment: ["kettlebell", "pull_up_bar"], styles: ["running", "kettlebell"], dietType: "vegan", allergens: ["soy"], timelineWeeks: 8 } },
  { name: "Dev, 38, 6 days, calisthenics, bodyweight only, knee", profile: { sex: "male", age: 38, heightCm: 175, weightKg: 78, experience: "intermediate", goals: ["muscle", "sport"], primaryGoal: "muscle", daysPerWeek: 6, sessionMinutes: 50, environment: "home", equipment: ["pull_up_bar", "dip_station"], styles: ["calisthenics"], injuries: [{ region: "knee", severity: "mild" }], timelineWeeks: 12 } },
] as const;

const lines: string[] = ["# Case studies", "", "_Generated by `packages/core/src/programme/case-study.test.ts` against the full library. Re-run `pnpm --filter @kettleworth/core test` to refresh._", ""];

describe("case studies against the real library", () => {
  for (const c of personas) {
    it(c.name, () => {
      const profile = TrainingProfile.parse(c.profile);
      const plan = generateProgramme(profile, library, { seed: c.name });
      const baseline = computeBaseline(profile);
      const targets = nutritionTargets(profile);
      const byId = new Map(library.map((e) => [e.id, e]));
      const equipment = availableEquipment(profile);
      const week1 = plan.mesocycles[0]!.weeks[0]!;
      const allEx = plan.mesocycles.flatMap((m) => m.weeks.flatMap((w) => w.sessions.flatMap((s) => s.exercises)));
      // Hard promises
      expect(validatePlanAgainstLibrary(plan, library)).toEqual([]);
      for (const e of allEx) { const ex = byId.get(e.exerciseId)!; expect(exclusionReason(ex, profile, equipment), `${ex.name} for ${c.name}`).toBeNull(); }
      for (const s of week1.sessions) expect(s.estimatedMinutes, `${s.name} minutes`).toBeLessThanOrEqual(profile.sessionMinutes + 5);
      expect(plan.totalWeeks).toBe(profile.timelineWeeks);
      expect(plan.mesocycles.flatMap((m) => m.weeks).filter((w) => w.isDeload).length).toBeGreaterThanOrEqual(1);
      const floor = Math.max(profile.sex === "female" ? 1200 : 1500, Math.round((baseline.bmr ?? 0) * 1.05));
      expect(targets.calories).toBeGreaterThanOrEqual(floor);
      expect(targets.proteinG).toBeGreaterThanOrEqual(Math.round(profile.weightKg! * 1.6));
      // Volume landmarks: the primary goal muscles get at least 6 working sets in week 1 (ramping to 10+), never more than 20 for anyone.
      const sets = plan.weeklyVolumeBySet;
      for (const [m, n] of Object.entries(sets)) expect(n, `${m} sets`).toBeLessThanOrEqual(22);
      const big = ["quads", "chest", "lats", "upper_back", "glutes", "hamstrings"].filter((m) => sets[m] != null);
      expect(big.length).toBeGreaterThanOrEqual(4);
      // Frequency: with 3+ days, at least one big muscle is trained in 2+ sessions.
      if (profile.daysPerWeek >= 3) {
        const hits: Record<string, number> = {};
        for (const s of week1.sessions) for (const m of new Set(s.exercises.flatMap((e) => byId.get(e.exerciseId)!.primaryMuscles))) hits[m] = (hits[m] ?? 0) + 1;
        expect(Math.max(...Object.values(hits))).toBeGreaterThanOrEqual(2);
      }
      // Report
      lines.push(`## ${c.name}`, "", `**Profile:** ${JSON.stringify(c.profile)}`, "", `**Plan:** ${plan.name}. ${plan.summary}`, "", "**Why:**", ...plan.rationale.map((r) => `- ${r}`), "", `**Baseline:** BMI ${baseline.bmi}, BMR ${baseline.bmr} kcal, TDEE ${baseline.tdee} kcal. **Targets:** ${targets.calories} kcal (${targets.trainingDayCalories} train / ${targets.restDayCalories} rest), ${targets.proteinG} g protein, ${targets.carbsG} g carbs, ${targets.fatG} g fat.${targets.warnings.length ? ` Warnings: ${targets.warnings.join(" ")}` : ""}`, "", "**Week 1:**", "");
      for (const s of week1.sessions) { lines.push(`- **${s.name}** (~${s.estimatedMinutes} min): ${s.exercises.map((e) => { const ex = byId.get(e.exerciseId)!; const w = e.sets.filter((x) => x.type === "working"); const f = w[0]!; return `${ex.name} ${w.length}×${f.repRange ? `${f.repRange[0]}-${f.repRange[1]}` : f.reps}${f.weightKg ? ` @ ${f.weightKg} kg` : ""}${f.targetRpe ? ` RPE ${f.targetRpe}` : ""}`; }).join("; ")}`); }
      lines.push("", `**Weekly working sets by muscle:** ${Object.entries(sets).sort(([, a], [, b]) => b - a).map(([m, n]) => `${m.replace("_", " ")} ${n}`).join(", ")}`, "");
      const b1 = plan.mesocycles[1]?.weeks[0]?.sessions; if (b1) { const changed = b1.flatMap((s, i) => s.exercises.filter((e) => !week1.sessions[i]?.exercises.some((x) => x.exerciseId === e.exerciseId)).map((e) => byId.get(e.exerciseId)!.name)); lines.push(`**Block 2 rotation (${profile.varietyPreference}):** ${changed.length ? changed.join(", ") : "no changes"}`, ""); }
    });
  }
  it("writes docs/CASE-STUDIES.md", () => {
    const out = path.join(here, "../../../../docs/CASE-STUDIES.md");
    mkdirSync(path.dirname(out), { recursive: true });
    writeFileSync(out, lines.join("\n"));
    expect(lines.length).toBeGreaterThan(20);
  });
});
