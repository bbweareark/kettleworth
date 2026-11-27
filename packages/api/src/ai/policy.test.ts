import { describe, expect, it } from "vitest";
import { capsFor, decide, modelFor, monthStart, policyFor, DEFAULT_POLICY } from "./policy";

const premiumUser = { tier: "premium" as const, aiCoach: true };
const freeUser = { tier: "free" as const, aiCoach: false };
const freeUnenforced = { tier: "free" as const, aiCoach: true }; // BILLING_ENFORCED unset: everyone has the coach

describe("model tiers", () => {
  it("maps each tier to its own model, with AI_MODEL as the premium model", () => {
    const env = { AI_MODEL: "claude-opus-5" };
    expect(modelFor("routine", env)).toBe("claude-haiku-5-5");
    expect(modelFor("standard", env)).toBe("claude-sonnet-5-5");
    expect(modelFor("premium", env)).toBe("claude-opus-5");
  });
  it("honours per-tier overrides", () => {
    const env = { AI_MODEL_ROUTINE: "r", AI_MODEL_STANDARD: "s", AI_MODEL: "p" };
    expect([modelFor("routine", env), modelFor("standard", env), modelFor("premium", env)]).toEqual(["r", "s", "p"]);
  });
  it("AI_TIERING=off restores the single model for every task", () => {
    const env = { AI_TIERING: "off", AI_MODEL: "p" };
    expect(modelFor("routine", env)).toBe("p");
    expect(modelFor("standard", env)).toBe("p");
  });
  it("every task has a policy and unknown tasks fall back to standard + aiCoach", () => {
    expect(policyFor("intake_extract")).toEqual({ tier: "routine", access: "all" });
    expect(policyFor("body_photo_analysis").tier).toBe("premium");
    expect(policyFor("some_new_task")).toEqual(DEFAULT_POLICY);
  });
});

describe("entitlement gate", () => {
  it("lets free users run onboarding and safety tasks but not coaching tasks", () => {
    expect(decide("intake_extract", freeUser, { calls: 0, tokens: 0 }, {}).allow).toBe(true);
    const d = decide("weekly_letter", freeUser, { calls: 0, tokens: 0 }, {});
    expect(d).toMatchObject({ allow: false, reason: "gated" });
  });
  it("lets entitled users run coaching tasks on the tiered model", () => {
    expect(decide("coach_chat", premiumUser, { calls: 10, tokens: 1000 }, {})).toEqual({ allow: true, model: "claude-sonnet-5-5", tier: "standard" });
  });
  it("AI_GATING=off disables the gate and the cap but keeps tiering", () => {
    const env = { AI_GATING: "off" };
    expect(decide("weekly_letter", freeUser, { calls: 10_000, tokens: 10_000_000 }, env)).toEqual({ allow: true, model: "claude-sonnet-5-5", tier: "standard" });
  });
});

describe("monthly cap", () => {
  it("has sane defaults per plan and 0 means unlimited", () => {
    expect(capsFor("free", {})).toEqual({ calls: 40, tokens: 200_000 });
    expect(capsFor("premium", {})).toEqual({ calls: 600, tokens: 3_000_000 });
    expect(capsFor("premium", { AI_CAP_PREMIUM_CALLS: "0" }).calls).toBe(0);
    expect(decide("coach_chat", premiumUser, { calls: 99_999, tokens: 0 }, { AI_CAP_PREMIUM_CALLS: "0" }).allow).toBe(true);
  });
  it("blocks on calls, then on tokens, once the month's allowance is used", () => {
    expect(decide("coach_chat", premiumUser, { calls: 600, tokens: 0 }, {})).toMatchObject({ allow: false, reason: "cap_calls" });
    expect(decide("coach_chat", premiumUser, { calls: 1, tokens: 3_000_000 }, {})).toMatchObject({ allow: false, reason: "cap_tokens" });
    expect(decide("coach_chat", premiumUser, { calls: 599, tokens: 2_999_999 }, {}).allow).toBe(true);
  });
  it("applies the free cap to free users even when billing is not enforced", () => {
    expect(decide("coach_chat", freeUnenforced, { calls: 40, tokens: 0 }, {})).toMatchObject({ allow: false, reason: "cap_calls" });
    expect(decide("coach_chat", freeUnenforced, { calls: 39, tokens: 0 }, {}).allow).toBe(true);
  });
  it("ignores malformed cap values", () => {
    expect(capsFor("free", { AI_CAP_FREE_CALLS: "lots" }).calls).toBe(40);
    expect(capsFor("free", { AI_CAP_FREE_CALLS: "-5" }).calls).toBe(40);
  });
  it("resets on the first of the month in UTC", () => {
    expect(monthStart(new Date("2026-10-25T23:59:59Z")).toISOString()).toBe("2026-10-01T00:00:00.000Z");
    expect(monthStart(new Date("2026-01-01T00:00:00Z")).toISOString()).toBe("2026-01-01T00:00:00.000Z");
  });
});
