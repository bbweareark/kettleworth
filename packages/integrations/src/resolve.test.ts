import { describe, it, expect } from "vitest";
import { resolveSamples } from "./resolve";
import { computeReadiness } from "@kettleworth/core";
import type { HealthSample } from "@kettleworth/types";

const s = (provider: HealthSample["provider"], metric: HealthSample["metric"], startAt: string, value: number | null, extra: Partial<HealthSample> = {}): HealthSample => ({ provider, metric, startAt, endAt: null, value, unit: "x", payload: null, confidence: 1, providerRecordId: null, ...extra });

describe("resolveSamples", () => {
  it("prefers the higher-priority provider per metric/day", () => {
    const r = resolveSamples([s("apple_health", "sleep_duration", "2026-09-10T06:00:00Z", 400), s("oura", "sleep_duration", "2026-09-10T06:30:00Z", 420)]);
    expect(r).toHaveLength(1);
    expect(r[0]!.provider).toBe("oura");
  });
  it("honours user priority overrides", () => {
    const r = resolveSamples([s("whoop", "hrv", "2026-09-10T06:00:00Z", 60), s("oura", "hrv", "2026-09-10T06:30:00Z", 70)], { hrv: ["oura", "whoop"] });
    expect(r[0]!.value).toBe(70);
  });
  it("dedupes overlapping workouts from two devices", () => {
    const r = resolveSamples([s("strava", "workout", "2026-09-10T07:00:00Z", 45, { endAt: "2026-09-10T07:45:00Z" }), s("whoop", "workout", "2026-09-10T07:02:00Z", 44, { endAt: "2026-09-10T07:46:00Z" }), s("whoop", "workout", "2026-09-11T07:00:00Z", 30, { endAt: "2026-09-11T07:30:00Z" })]);
    expect(r.filter((x) => x.metric === "workout")).toHaveLength(2);
  });
});
describe("readiness from samples", () => {
  it("uses provider recovery score when present", () => {
    const today = new Date("2026-09-12T09:00:00Z");
    const r = computeReadiness([s("whoop", "readiness", "2026-09-12T05:00:00Z", 82)], today);
    expect(r.band).toBe("high");
    expect(r.intensityScalar).toBe(1);
  });
  it("derives from hrv/rhr/sleep otherwise", () => {
    const today = new Date("2026-09-12T09:00:00Z");
    const samples: HealthSample[] = [];
    for (let d = 5; d <= 11; d++) { samples.push(s("oura", "hrv", `2026-09-${String(d).padStart(2, "0")}T05:00:00Z`, 60)); samples.push(s("oura", "resting_hr", `2026-09-${String(d).padStart(2, "0")}T05:00:00Z`, 50)); }
    samples.push(s("oura", "hrv", "2026-09-12T05:00:00Z", 42), s("oura", "resting_hr", "2026-09-12T05:00:00Z", 58), s("oura", "sleep_duration", "2026-09-11T23:00:00Z", 5.2 * 60, { endAt: "2026-09-12T04:30:00Z" }));
    const r = computeReadiness(samples, today);
    expect(r.band).toBe("low");
    expect(r.intensityScalar).toBe(0.85);
    expect(r.reasons.join(" ")).toMatch(/HRV down/);
  });
});
