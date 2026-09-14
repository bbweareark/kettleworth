import { describe, it, expect } from "vitest";
import { rankMatches } from "./community";
const me = { userId: "me", goals: ["muscle"], styles: ["bodybuilding"], level: "intermediate", daysPerWeek: 4, preferredTime: "early_morning", city: "London", trainTogether: true, lat: 51.5, lng: -0.12 };
describe("matching", () => {
  it("ranks the closest fit first with reasons and drops weak matches", () => {
    const r = rankMatches(me, [
      { userId: "a", goals: ["muscle"], styles: ["bodybuilding"], level: "intermediate", daysPerWeek: 4, preferredTime: "early_morning", city: "London", trainTogether: true, lat: 51.51, lng: -0.13 },
      { userId: "b", goals: ["endurance"], styles: ["running"], level: "beginner", daysPerWeek: 2, preferredTime: "evening", city: "Leeds", trainTogether: false },
      { userId: "c", goals: ["muscle", "strength"], styles: [], level: "advanced", daysPerWeek: 5, preferredTime: null, city: "London", trainTogether: false },
    ]);
    expect(r.map((x) => x.userId)).toEqual(["a", "c"]);
    expect(r[0]!.score).toBeGreaterThan(90);
    expect(r[0]!.reasons).toContain("Within 5 km");
  });
});
