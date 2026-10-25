import { describe, expect, it } from "vitest";
import {
  makeRound, checkRound, fewestPlates, totalFor,
  DRILL_MAX_SOLVES, DRILL_POINTS_PER_SOLVE, PLATES_KG,
} from "./plate-drill";

describe("fewestPlates", () => {
  it("loads 100kg on a 20kg bar as two 20s and a 2.5 per side", () => {
    expect(fewestPlates(40, PLATES_KG)).toEqual([25, 15]);
  });

  it("returns null when the remainder cannot be made from the rack", () => {
    expect(fewestPlates(1, PLATES_KG)).toBeNull();
  });

  it("is greedy-optimal because every plate divides the next one up", () => {
    expect(fewestPlates(27.5, PLATES_KG)).toEqual([25, 2.5]);
    expect(fewestPlates(0, PLATES_KG)).toEqual([]);
  });
});

describe("makeRound", () => {
  it("is deterministic for a seed and streak", () => {
    expect(makeRound("s", 3)).toEqual(makeRound("s", 3));
  });

  it("always produces a target that is actually loadable", () => {
    for (let streak = 0; streak < 12; streak++) {
      const r = makeRound(`seed-${streak}`, streak);
      expect(fewestPlates((r.target - r.bar) / 2, r.plates)).not.toBeNull();
      expect(r.target).toBeGreaterThan(r.bar);
    }
  });

  it("keeps the standard bar and the big plates while the streak is short", () => {
    for (let i = 0; i < 6; i++) {
      const r = makeRound(`early-${i}`, 0);
      expect(r.bar).toBe(20);
      expect(r.solution.every((p) => p >= 5)).toBe(true);
    }
  });
});

describe("checkRound", () => {
  const round = makeRound("fixed", 0);

  it("accepts the exact load and pays for it", () => {
    const v = checkRound(round, round.solution, 0);
    expect(v.correct).toBe(true);
    expect(v.optimal).toBe(true);
    expect(v.points).toBe(DRILL_POINTS_PER_SOLVE);
  });

  it("says how far off a wrong answer is, and in which direction", () => {
    const over = checkRound(round, [...round.solution, 5], 0);
    expect(over.correct).toBe(false);
    expect(over.delta).toBe(10); // a 5 per side is 10 on the bar
    expect(over.message).toContain("over");

    const under = checkRound(round, [], 0);
    expect(under.correct).toBe(false);
    expect(under.message).toContain("short");
  });

  it("pays nothing once the session cap is reached, and says so", () => {
    const v = checkRound(round, round.solution, DRILL_MAX_SOLVES);
    expect(v.correct).toBe(true);
    expect(v.points).toBe(0);
    expect(v.message).toContain("limit");
  });

  it("cannot out-earn training: the whole cap is worth less than a third of a session", () => {
    expect(DRILL_POINTS_PER_SOLVE * DRILL_MAX_SOLVES).toBeLessThan(100 / 3);
  });

  it("accepts a correct but wasteful answer, and points out the shorter route", () => {
    const wasteful = checkRound({ ...round, target: totalFor(20, [25]), bar: 20, solution: [25] }, [20, 5], 0);
    expect(wasteful.correct).toBe(true);
    expect(wasteful.optimal).toBe(false);
    expect(wasteful.points).toBe(DRILL_POINTS_PER_SOLVE);
    expect(wasteful.message).toContain("would do it");
  });
});
