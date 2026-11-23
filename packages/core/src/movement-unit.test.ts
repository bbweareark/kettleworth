import { describe, expect, it } from "vitest";
import { describeTarget, repUnitFor } from "./movement-unit";

/*
 * Every name below is a real row from the exercise library, including the ones that make a
 * naive keyword match wrong.
 */
describe("what a movement is counted in", () => {
  it("counts a held position in seconds", () => {
    expect(repUnitFor({ name: "Plank", pattern: "core", category: "strength", equipment: ["bodyweight"] })).toBe("seconds");
    expect(repUnitFor({ name: "Dead Hang", pattern: "vertical_pull", category: "strength" })).toBe("seconds");
    expect(repUnitFor({ name: "Wall Sit", pattern: "squat", category: "strength" })).toBe("seconds");
  });

  it("counts a transition into a position in reps, not seconds", () => {
    // Ends in "Plank", but you do it ten times.
    expect(repUnitFor({ name: "Push Up to Side Plank", pattern: "horizontal_push", category: "strength" })).toBe("reps");
  });

  it("counts anything on the cardio shelf in seconds", () => {
    expect(repUnitFor({ name: "Rowing, Stationary", pattern: "cardio", category: "cardio" })).toBe("seconds");
    expect(repUnitFor({ name: "Running, Treadmill", pattern: "cardio", category: "cardio", equipment: ["machine", "treadmill"] })).toBe("seconds");
    expect(repUnitFor({ name: "Recumbent Bike", pattern: "cardio", category: "cardio", equipment: ["machine", "bike"] })).toBe("seconds");
  });

  it("counts a stretch in seconds, because it is held", () => {
    expect(repUnitFor({ name: "Superman", pattern: "mobility", category: "stretch" })).toBe("seconds");
  });

  it("counts a loaded carry in seconds", () => {
    expect(repUnitFor({ name: "Sled Overhead Backward Walk", pattern: "carry", category: "strength" })).toBe("seconds");
    expect(repUnitFor({ name: "Farmer's Walk", pattern: "carry", category: "strength" })).toBe("seconds");
  });

  it("leaves ordinary lifts alone", () => {
    expect(repUnitFor({ name: "Barbell Bench Press", pattern: "horizontal_push", category: "strength" })).toBe("reps");
    expect(repUnitFor({ name: "Barbell Back Squat", pattern: "squat", category: "strength" })).toBe("reps");
    // A sled row is a pull, despite "Sled" sharing a shelf with the cardio machines.
    expect(repUnitFor({ name: "Sled Row", pattern: "horizontal_pull", category: "strength", equipment: ["machine"] })).toBe("reps");
    // "Sit-up" must not match the wall sit rule.
    expect(repUnitFor({ name: "Sit-Up", pattern: "core", category: "strength" })).toBe("reps");
  });

  it("does not mistake a lifting position for a hold", () => {
    // "Hang" here is where the bar starts, not something you hold. Every one of these is a
    // real library row that the first version of this got wrong.
    for (const name of ["Hang Clean", "Hang Snatch", "Kettlebell Hang Clean", "Alternating Hang Clean", "Smith Machine Hang Power Clean", "Bottoms-Up Clean From The Hang Position"]) {
      expect(repUnitFor({ name, pattern: "hinge", category: "strength" })).toBe("reps");
    }
    // "Iso" in a machine name means isolateral, not isometric.
    expect(repUnitFor({ name: "Leverage Iso Row", pattern: "horizontal_pull", category: "strength" })).toBe("reps");
    // "Hanging" is not "hang".
    expect(repUnitFor({ name: "Hanging Leg Raise", pattern: "core", category: "strength" })).toBe("reps");
  });

  it("still catches a genuine hang", () => {
    expect(repUnitFor({ name: "Dead Hang", pattern: "vertical_pull", category: "strength" })).toBe("seconds");
    expect(repUnitFor({ name: "Isometric Neck Exercise", pattern: "core", category: "strength" })).toBe("seconds");
  });

  it("describes a target in the unit it is actually measured in", () => {
    expect(describeTarget({ reps: null, repRange: [8, 12], durationSeconds: null })).toBe("8 to 12 reps");
    expect(describeTarget({ reps: 5, repRange: null, durationSeconds: null })).toBe("5 reps");
    expect(describeTarget({ reps: null, repRange: null, durationSeconds: 45 })).toBe("45s");
    // A held set keeps its seconds even when a rep range came along for the ride.
    expect(describeTarget({ reps: null, repRange: [8, 12], durationSeconds: 40 })).toBe("40s");
  });
});
