import { describe, it, expect } from "vitest";
import { applyAdaptations, checkInToAdaptations } from "./apply";
const set = (n: number, kg: number | null) => ({ setNumber: n, type: "working" as const, reps: null, repRange: [8, 12] as [number, number], targetRpe: 8, targetRir: 2, weightKg: kg, restSeconds: 90, tempo: null, durationSeconds: null });
const inst = { id: "i1", exerciseId: "curl", role: "accessory", plannedSets: [{ ...set(1, 40), type: "warmup" as const }, set(2, 40), set(3, 40), set(4, 40)] };
describe("applyAdaptations", () => {
  it("scales volume down and loads down for a deload", () => {
    const [c] = applyAdaptations([inst], [{ exerciseId: null, kind: "deload", magnitude: 0.6, reason: "fatigue" }]);
    expect(c!.plannedSets.filter((s) => s.type === "working")).toHaveLength(2);
    expect(c!.plannedSets.find((s) => s.type === "working")!.weightKg).toBe(36.25);
  });
  it("adds a set on volume_up", () => {
    const [c] = applyAdaptations([inst], [{ exerciseId: null, kind: "volume_up", magnitude: 1.34, reason: "easy week" }]);
    expect(c!.plannedSets.filter((s) => s.type === "working")).toHaveLength(4);
    expect(c!.plannedSets.map((s) => s.setNumber)).toEqual([1, 2, 3, 4, 5]);
  });
  it("marks swaps and leaves holds alone", () => {
    expect(applyAdaptations([inst], [{ exerciseId: "curl", kind: "swap", magnitude: null, reason: "stale" }])[0]!.swapTo).toBe("auto");
    expect(applyAdaptations([inst], checkInToAdaptations("keep"))).toHaveLength(0);
    expect(applyAdaptations([inst], checkInToAdaptations("ease"))[0]!.plannedSets.find((s) => s.type === "working")!.weightKg).toBe(36.25);
  });
});
