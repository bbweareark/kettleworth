import { describe, expect, it } from "vitest";
import { restFor } from "./rest";
const squat = { mechanics: "compound" as const, pattern: "squat", equipment: ["barbell"], primaryMuscles: ["quads", "glutes"] };
const bench = { mechanics: "compound" as const, pattern: "horizontal_push", equipment: ["barbell"], primaryMuscles: ["chest"] };
const curl = { mechanics: "isolation" as const, pattern: "isolation", equipment: ["dumbbell"], primaryMuscles: ["biceps"] };
describe("restFor", () => {
  it("gives heavy lower-body compounds the longest rest", () => {
    expect(restFor(squat, { role: "primary", goal: "strength", topReps: 5, experience: "intermediate" }).seconds).toBe(210);
    expect(restFor(bench, { role: "primary", goal: "strength", topReps: 5, experience: "intermediate" }).seconds).toBe(180);
  });
  it("shortens rest for isolation work and higher reps", () => {
    expect(restFor(curl, { role: "accessory", goal: "muscle", topReps: 12, experience: "intermediate" }).seconds).toBe(75);
    expect(restFor(bench, { role: "secondary", goal: "muscle", topReps: 12, experience: "intermediate" }).seconds).toBe(120);
  });
  it("adjusts for experience and caps for endurance", () => {
    expect(restFor(bench, { role: "primary", goal: "muscle", topReps: 10, experience: "advanced" }).seconds).toBe(165);
    expect(restFor(bench, { role: "primary", goal: "muscle", topReps: 10, experience: "beginner" }).seconds).toBe(135);
    expect(restFor(squat, { role: "primary", goal: "endurance", topReps: 15, experience: "intermediate" }).seconds).toBe(90);
  });
  it("gives explosive work full recovery and explains every value", () => {
    const r = restFor({ ...squat, category: "olympic weightlifting" }, { role: "primary", goal: "sport", topReps: 3, experience: "advanced" });
    expect(r.seconds).toBe(240); expect(r.reason).toMatch(/explosive/); expect(r.evidence.length).toBeGreaterThan(10);
  });
});
