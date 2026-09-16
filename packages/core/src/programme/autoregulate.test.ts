import { describe, expect, it } from "vitest";
import { autoregulate } from "./autoregulate";

const target = { repRange: [8, 10] as [number, number], reps: null, targetRpe: 8, weightKg: 60 };
const metric = { step: 2.5, units: "metric" as const };

describe("autoregulate", () => {
  it("holds when the set lands in range at the target effort", () => {
    expect(autoregulate({ weightKg: 60, reps: 9, rpe: 8 }, target, metric)).toMatchObject({ action: "hold", nextWeightKg: 60 });
  });
  it("adds a small step when reps overshoot, and a bigger one when it was also easy", () => {
    expect(autoregulate({ weightKg: 60, reps: 12, rpe: 8 }, target, metric)).toMatchObject({ action: "up", nextWeightKg: 62.5 });
    expect(autoregulate({ weightKg: 60, reps: 12, rpe: 6.5 }, target, metric)).toMatchObject({ action: "up", nextWeightKg: 62.5 });
    expect(autoregulate({ weightKg: 100, reps: 12, rpe: 6.5 }, target, metric)).toMatchObject({ action: "up", nextWeightKg: 105 });
  });
  it("comes down when reps fall short or the set ran too hard", () => {
    expect(autoregulate({ weightKg: 60, reps: 7, rpe: 9 }, target, metric)).toMatchObject({ action: "down", nextWeightKg: 57.5 });
    expect(autoregulate({ weightKg: 100, reps: 5, rpe: 10 }, target, metric)).toMatchObject({ action: "down", nextWeightKg: 90 });
    expect(autoregulate({ weightKg: 100, reps: 9, rpe: 9.5 }, target, metric)).toMatchObject({ action: "down", nextWeightKg: 95 });
  });
  it("nudges up when reps are in range but effort was clearly low", () => {
    expect(autoregulate({ weightKg: 60, reps: 10, rpe: 6 }, target, metric)).toMatchObject({ action: "up", nextWeightKg: 62.5 });
  });
  it("uses real increments: 5 kg stacks, 5 lb steps, and never more than 10%", () => {
    expect(autoregulate({ weightKg: 40, reps: 13, rpe: 6 }, target, { step: 5, units: "metric" })).toMatchObject({ nextWeightKg: 45 });
    const lb = autoregulate({ weightKg: 61.235, reps: 12, rpe: 8 }, target, { step: 5, units: "imperial" });
    expect(lb.reason).toMatch(/140 lb/);
    const big = autoregulate({ weightKg: 200, reps: 2, rpe: 10 }, target, metric);
    expect(big.nextWeightKg).toBeGreaterThanOrEqual(180);
  });
  it("leaves bodyweight and targetless sets alone and explains every change", () => {
    expect(autoregulate({ weightKg: null, reps: 12, rpe: 7 }, target, metric).action).toBe("hold");
    expect(autoregulate({ weightKg: 60, reps: 12, rpe: 7 }, { ...target, repRange: null }, metric).action).toBe("hold");
    expect(autoregulate({ weightKg: 60, reps: 12, rpe: 8 }, target, metric).reason).toBe("12 reps at RPE 8, above your 8 to 10 range: next set 62.5 kg (+2.5 kg).");
  });
});
