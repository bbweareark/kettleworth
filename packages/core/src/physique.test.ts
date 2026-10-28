import { describe, it, expect } from "vitest";
import { physiqueTimeline, growthPoints, levelAt, trend } from "./physique";
describe("physique engine", () => {
  it("smooths implausible body-fat jumps and derives lean mass", () => {
    const t = physiqueTimeline([
      { date: "2026-09-01", weightKg: 82, source: "measurement" },
      { date: "2026-09-01", bfLow: 18, bfHigh: 22, source: "photo" },
      { date: "2026-09-08", weightKg: 81.5, source: "measurement" },
      { date: "2026-09-08", bfLow: 12, bfHigh: 14, source: "photo" }, // 7-point drop in a week: not physiology
    ]);
    const last = t[t.length - 1]!;
    expect(last.bodyFatPct).toBe(19.3);
    expect(last.note).toMatch(/smoothed/);
    expect(last.leanMassKg).toBeGreaterThan(60);
    expect(t[1]!.confidence).toBeGreaterThan(0.5);
  });
  it("growth points only add and level up", () => {
    const g = growthPoints({ sessionsCompleted: 6, prs: 3, weighIns: 2, photoSets: 1, streakWeeks: 2, setsLogged: 90, activitiesLogged: 1 });
    expect(g.total).toBe(6 * 100 + 90 * 2 + 3 * 60 + 2 * 20 + 80 + 30 + 100);
    // 1210 Growth: past level 3 (1200) and short of level 4 (2100). Levels are 1-based, so
    // nobody is ever "level 0"; the thresholds themselves are unchanged.
    expect(g.level).toBe(3);
    expect(g.nextLevelAt).toBe(2100);
    expect(levelAt(1)).toBe(0);
    expect(levelAt(2)).toBe(500);
  });
  it("trend sentences", () => {
    expect(trend([{ date: "2026-09-01", value: 90 }, { date: "2026-09-29", value: 88 }], " cm", true).sentence).toMatch(/right way/);
    expect(trend([{ date: "2026-09-01", value: 60 }], " kg").perWeek).toBeNull();
  });
});
