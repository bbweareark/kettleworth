import { describe, expect, it } from "vitest";
import { loadLadder, nearestRung, loadModel, platesPerSide } from "./load";

const ex = (name: string, equipment: string[]) => ({ name, equipment, unilateral: false }) as Parameters<typeof loadModel>[0];

describe("the dumbbell rack", () => {
  const rack = loadLadder(loadModel(ex("Dumbbell Press", ["dumbbell"])), "metric").values;

  it("offers 22.5 and 25 with nothing invented between them", () => {
    expect(rack).toContain(22.5);
    expect(rack).toContain(25);
    expect(rack.filter((v) => v > 22.5 && v < 25)).toEqual([]);
  });

  it("never offers a weight no rack carries", () => {
    // Stepping 22.5 by 5 used to produce 27.5 on a rack that jumps to 25 then 27.5 then 30.
    expect(rack).not.toContain(23);
    expect(rack).not.toContain(26);
  });

  it("rises, never repeats", () => {
    expect([...rack].sort((a, b) => a - b)).toEqual(rack);
    expect(new Set(rack).size).toBe(rack.length);
  });
});

describe("kettlebells", () => {
  it("offers only sizes that are cast", () => {
    const kb = loadLadder(loadModel(ex("Kettlebell Swing", ["kettlebell"])), "metric").values;
    expect(kb).toContain(24);
    expect(kb).not.toContain(22); // no such bell
    expect(kb).not.toContain(25);
  });
});

describe("the barbell", () => {
  const bar = 20;
  const ladder = loadLadder(loadModel(ex("Back Squat", ["barbell"])), "metric", bar).values;

  it("starts at the empty bar", () => {
    expect(ladder[0]).toBe(bar);
  });

  it("offers only totals the plates can actually build", () => {
    for (const total of ladder) expect(platesPerSide(total, bar, "metric").exact).toBe(true);
  });

  it("includes the classics and excludes what pairs cannot make", () => {
    expect(ladder).toContain(60); // 20 + 2x20
    expect(ladder).toContain(100); // 20 + 2x(20+20)
    expect(ladder).not.toContain(21); // one 1.25 a side is 22.5, never 21
  });
});

describe("bodyweight work", () => {
  it("offers nothing added, because zero is a real answer", () => {
    const added = loadLadder(loadModel(ex("Pull-Up", ["pull_up_bar", "bodyweight"])), "metric").values;
    expect(added[0]).toBe(0);
  });
});

describe("nearestRung", () => {
  it("lands on the rung a lifter is already using", () => {
    expect(nearestRung([10, 12, 14], 12.4)).toBe(12);
    expect(nearestRung([10, 12, 14], 13.9)).toBe(14);
  });
  it("returns null when the quantity is continuous", () => {
    expect(nearestRung([], 20)).toBeNull();
  });
});
