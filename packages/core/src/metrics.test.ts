import { describe, it, expect } from "vitest";
import { bmi, bmr, estimate1RM, computeBaseline, activityMultiplier, pctOf1RM } from "./metrics";
import { TrainingProfile } from "@kettleworth/types";

describe("metrics", () => {
  it("computes BMI", () => expect(bmi(80, 180)).toBe(24.7));
  it("computes Mifflin BMR", () => {
    expect(bmr(80, 180, 30, "male")).toBe(1780);
    expect(bmr(60, 165, 30, "female")).toBe(1320);
  });
  it("estimates 1RM sensibly", () => {
    expect(estimate1RM(100, 1)).toBe(100);
    const e = estimate1RM(100, 5);
    expect(e).toBeGreaterThan(112);
    expect(e).toBeLessThan(118);
  });
  it("percent of 1RM decreases with reps", () => expect(pctOf1RM(5, 8)).toBeLessThan(pctOf1RM(3, 8)));
  it("activity multiplier scales with training time", () => {
    expect(activityMultiplier(3, 60)).toBe(1.465);
    expect(activityMultiplier(1, 30)).toBe(1.2);
  });
  it("enforces calorie floor for fat loss", () => {
    const p = TrainingProfile.parse({ sex: "female", age: 30, heightCm: 155, weightKg: 48, primaryGoal: "fat_loss", goals: ["fat_loss"], daysPerWeek: 1, sessionMinutes: 30 });
    const b = computeBaseline(p);
    expect(b.targetCalories!).toBe(1200);
    expect(b.explanations.some((e) => e.includes("won't go below"))).toBe(true);
  });
  it("macros sum to target calories within rounding", () => {
    const p = TrainingProfile.parse({ sex: "male", age: 28, heightCm: 182, weightKg: 85, primaryGoal: "muscle", goals: ["muscle"], daysPerWeek: 4, sessionMinutes: 60 });
    const b = computeBaseline(p);
    const kcal = b.proteinG! * 4 + b.carbsG! * 4 + b.fatG! * 9;
    expect(Math.abs(kcal - b.targetCalories!)).toBeLessThan(10);
  });
});
