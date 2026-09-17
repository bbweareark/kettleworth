import { describe, expect, it } from "vitest";
import { planDay, pastDayLabel, type DaySession } from "./day-plan";

const s = (id: string, scheduledOn: string, status: string, extra: Partial<DaySession> = {}): DaySession => ({ id, scheduledOn, status, startedOn: null, completedOn: null, loggedSets: 0, ...extra });
const TODAY = "2026-09-17"; // Thursday

describe("planDay", () => {
  it("a session opened on Monday with nothing logged, and Pull done since, leaves a rest day with Push offered", () => {
    const plan = planDay([
      s("push", "2026-09-14", "in_progress", { startedOn: "2026-09-14" }),
      s("pull", "2026-09-16", "completed", { startedOn: "2026-09-16", completedOn: "2026-09-16", loggedSets: 17 }),
      s("legs", "2026-09-18", "planned"),
    ], TODAY);
    expect(plan.kind).toBe("rest");
    if (plan.kind === "rest") { expect(plan.next?.id).toBe("legs"); expect(plan.missed?.id).toBe("push"); }
  });

  it("a missed session with nothing trained since is the thing to catch up on", () => {
    const plan = planDay([s("push", "2026-09-16", "planned"), s("pull", "2026-09-18", "planned")], TODAY);
    expect(plan).toMatchObject({ kind: "catch_up", session: { id: "push" } });
  });

  it("a session with logged sets stays in progress, even from an earlier day", () => {
    const plan = planDay([s("push", "2026-09-16", "in_progress", { startedOn: "2026-09-16", loggedSets: 4 }), s("pull", TODAY, "planned")], TODAY);
    expect(plan).toMatchObject({ kind: "in_progress", session: { id: "push" } });
  });

  it("a partly logged session left behind by a later finished one is no longer offered to continue", () => {
    const plan = planDay([
      s("old", "2026-09-08", "in_progress", { startedOn: "2026-09-08", loggedSets: 5 }),
      s("pull", "2026-09-16", "completed", { completedOn: "2026-09-16", loggedSets: 17 }),
      s("legs", "2026-09-18", "planned"),
    ], TODAY);
    expect(plan).toMatchObject({ kind: "rest", next: { id: "legs" }, missed: null });
  });

  it("a session opened today counts as in progress before the first set", () => {
    expect(planDay([s("push", TODAY, "in_progress", { startedOn: TODAY })], TODAY)).toMatchObject({ kind: "in_progress" });
  });

  it("today's planned session wins over an older miss", () => {
    expect(planDay([s("old", "2026-09-15", "planned"), s("now", TODAY, "planned")], TODAY)).toMatchObject({ kind: "today", session: { id: "now" } });
  });

  it("finishing tomorrow's session early today shows done, with the one after previewed", () => {
    const plan = planDay([s("legs", "2026-09-18", "completed", { completedOn: TODAY, loggedSets: 12 }), s("push", "2026-09-21", "planned")], TODAY);
    expect(plan).toMatchObject({ kind: "done", session: { id: "legs" }, next: { id: "push" } });
  });

  it("misses older than a week stop being offered", () => {
    expect(planDay([s("old", "2026-09-08", "planned"), s("next", "2026-09-19", "planned")], TODAY)).toMatchObject({ kind: "rest", missed: null });
  });

  it("skipped sessions are never offered again", () => {
    expect(planDay([s("push", "2026-09-16", "skipped"), s("pull", "2026-09-19", "planned")], TODAY)).toMatchObject({ kind: "rest", missed: null });
  });
});

describe("pastDayLabel", () => {
  it("names recent days plainly", () => {
    expect(pastDayLabel("2026-09-16", TODAY)).toBe("yesterday");
    expect(pastDayLabel("2026-09-14", TODAY)).toBe("Monday");
    expect(pastDayLabel("2026-09-08", TODAY)).toBe("Tue 8 Sep");
  });
});
