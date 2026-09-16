import { describe, expect, it } from "vitest";
import { detectPR } from "./analytics";

const set = (weightKg: number, reps: number, extra: Record<string, unknown> = {}) => ({ setNumber: 1, weightKg, reps, rpe: null, durationSeconds: null, completed: true, loggedAt: "2026-09-16T10:00:00Z", ...extra });
const hist = (...sets: [number, number][]) => sets.map(([w, r], i) => ({ exerciseId: "bench", date: `2026-09-0${i + 1}`, set: set(w, r), primaryMuscles: [] }));

describe("detectPR", () => {
  it("never calls a lighter or shorter set a record", () => {
    expect(detectPR(hist([60, 10]), set(50, 8))).toBeNull();
    expect(detectPR(hist([60, 10]), set(60, 9))).toBeNull();
    expect(detectPR(hist([60, 10]), set(55, 10))).toBeNull();
    expect(detectPR(hist([60, 10]), set(60, 10))).toBeNull();
  });
  it("does not celebrate the first time an exercise is logged", () => {
    expect(detectPR([], set(40, 10))).toBeNull();
  });
  it("counts earlier sets from the same session: a lighter second set is not a record", () => {
    const sessionSoFar = hist([60, 10]);
    expect(detectPR(sessionSoFar, set(50, 8))).toBeNull();
  });
  it("names what improved", () => {
    expect(detectPR(hist([60, 10]), set(62.5, 6))).toMatchObject({ kinds: ["weight"], headline: "Heaviest set yet" });
    expect(detectPR(hist([60, 8]), set(60, 10))).toMatchObject({ headline: "Most reps at 60 kg" });
    const e = detectPR(hist([60, 5]), set(55, 10))!;
    expect(e.kinds).toEqual(["e1rm"]);
    expect(e.detail).toMatch(/estimated max/);
  });
  it("never makes a record out of a lighter weight with one more rep", () => {
    expect(detectPR(hist([100, 5]), set(97.5, 6))).toBeNull();
    expect(detectPR(hist([60, 8]), set(57.5, 9))).toBeNull();
  });
  it("ignores tiny estimate wobbles and very high-rep sets for the estimated max", () => {
    expect(detectPR(hist([100, 5]), set(97.5, 6))).toBeNull();
    expect(detectPR(hist([60, 12]), set(40, 30))).toBeNull();
  });
  it("leaves out incomplete sets, empty sets and outliers the lifter confirmed", () => {
    expect(detectPR(hist([60, 10]), set(80, 5, { completed: false }))).toBeNull();
    expect(detectPR(hist([60, 10]), set(80, 5, { confirmed: true }))).toBeNull();
    const withOutlier = [...hist([60, 10]), { exerciseId: "bench", date: "2026-09-05", set: set(400, 10, { confirmed: true }), primaryMuscles: [] }];
    expect(detectPR(withOutlier, set(65, 8))).toMatchObject({ kinds: expect.arrayContaining(["weight"]) });
  });
});
