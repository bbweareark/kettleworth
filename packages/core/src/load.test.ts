import { describe, expect, it } from "vitest";
import { loadModel, loadMultiplier, platesPerSide, describePlates } from "./load";

const ex = (name: string, equipment: string[], unilateral = false) => ({ name, equipment: equipment as never, unilateral });

describe("loadModel", () => {
  it("reads bars as the total, bar included", () => {
    expect(loadModel(ex("Barbell Back Squat", ["barbell", "squat_rack"]))).toMatchObject({ kind: "bar", bar: "barbell", hint: "total, bar included" });
    expect(loadModel(ex("EZ-Bar Curl", ["ez_bar"]))).toMatchObject({ kind: "bar", bar: "ez_bar" });
    expect(loadModel(ex("Trap Bar Deadlift", ["trap_bar", "barbell"]))).toMatchObject({ bar: "trap_bar" });
  });
  it("reads dumbbells as the number on one handle, and knows when only one is held", () => {
    expect(loadModel(ex("Dumbbell Bench Press", ["dumbbell", "bench"]))).toMatchObject({ kind: "handheld", count: 2, hint: "per dumbbell" });
    expect(loadModel(ex("Goblet Squat", ["dumbbell"]))).toMatchObject({ count: 1, hint: "one dumbbell" });
    expect(loadModel(ex("One-Arm Dumbbell Row", ["dumbbell", "bench"], true))).toMatchObject({ count: 1 });
    expect(loadModel(ex("Kettlebell Swing", ["kettlebell"]))).toMatchObject({ count: 1, hint: "one kettlebell" });
    expect(loadModel(ex("Double Kettlebell Front Squat", ["kettlebell"]))).toMatchObject({ count: 2 });
  });
  it("reads stacks as the setting and bodyweight moves as the weight added", () => {
    expect(loadModel(ex("Lat Pulldown", ["cable"]))).toMatchObject({ kind: "stack", hint: "stack setting" });
    expect(loadModel(ex("Pull-Up", ["pull_up_bar", "bodyweight"]))).toMatchObject({ kind: "added", label: "Added weight" });
  });
  it("counts a pair of dumbbells twice toward volume and everything else once", () => {
    expect(loadMultiplier(ex("Dumbbell Bench Press", ["dumbbell"]))).toBe(2);
    expect(loadMultiplier(ex("Goblet Squat", ["dumbbell"]))).toBe(1);
    expect(loadMultiplier(ex("Barbell Row", ["barbell"]))).toBe(1);
  });
});

describe("platesPerSide", () => {
  it("builds a metric total from a 20 kg bar", () => {
    const r = platesPerSide(100, 20, "metric");
    expect(r).toMatchObject({ perSide: 40, exact: true, loadable: 100 });
    expect(describePlates(r.plates)).toBe("25 + 15");
  });
  it("handles small plates, imperial bars, and loads that cannot be built exactly", () => {
    expect(describePlates(platesPerSide(62.5, 20, "metric").plates)).toBe("20 + 1.25");
    expect(describePlates(platesPerSide(225, 45, "imperial").plates)).toBe("2×45");
    const odd = platesPerSide(61, 20, "metric");
    expect(odd.exact).toBe(false);
    expect(odd.loadable).toBe(60);
  });
  it("shows an empty bar honestly", () => {
    expect(platesPerSide(20, 20, "metric")).toMatchObject({ plates: [], exact: true });
    expect(describePlates([])).toBe("no plates");
  });
});
