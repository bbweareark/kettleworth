import { describe, expect, it } from "vitest";
import type { Style } from "@kettleworth/types";
import { landingTones, restTones, soundPeakGain, soundSeconds, SOUND_LIMITS } from "./sound";

const STYLES: Style[] = ["carbon", "arc", "sanctuary"];

describe("landing sounds", () => {
  it("stays an acknowledgement, not an alarm", () => {
    for (const style of STYLES) {
      for (const last of [false, true]) {
        const tones = landingTones(style, last);
        expect(soundPeakGain(tones), `${style} ${last ? "last" : "mid"} gain`).toBeLessThanOrEqual(SOUND_LIMITS.landingPeakGain);
        expect(soundSeconds(tones), `${style} ${last ? "last" : "mid"} length`).toBeLessThanOrEqual(SOUND_LIMITS.landingSeconds);
      }
    }
  });

  it("is quieter and shorter than the sound that ends rest", () => {
    // Rest ending has to reach someone who has put the phone down; a set landing must not
    // compete with it, or the two events stop being distinguishable.
    for (const style of STYLES) {
      const landing = landingTones(style);
      const rest = restTones(style);
      expect(soundPeakGain(landing), `${style} gain`).toBeLessThan(soundPeakGain(rest));
      expect(soundSeconds(landing), `${style} length`).toBeLessThan(soundSeconds(rest));
    }
  });

  it("gives each world a sound of its own", () => {
    const signatures = STYLES.map((s) => JSON.stringify(landingTones(s)));
    expect(new Set(signatures).size).toBe(STYLES.length);
  });

  it("marks the end of a movement with one note on top, not a different sound", () => {
    for (const style of STYLES) {
      const mid = landingTones(style, false);
      const last = landingTones(style, true);
      expect(last.length).toBe(mid.length + 1);
      expect(last.slice(0, mid.length)).toEqual(mid);
      expect(last[last.length - 1]!.at).toBeGreaterThan(0);
    }
  });

  it("is playable: every tone has a positive length and an audible gain", () => {
    for (const style of STYLES) {
      for (const tone of [...landingTones(style, true), ...restTones(style)]) {
        expect(tone.dur).toBeGreaterThan(0);
        expect(tone.at).toBeGreaterThanOrEqual(0);
        // An exponential gain ramp cannot reach zero, so a silent layer would be a mistake.
        expect(tone.gain).toBeGreaterThan(0);
        expect(tone.from).toBeGreaterThan(20);
        expect(tone.from).toBeLessThan(20000);
        if (tone.to != null) expect(tone.to).toBeGreaterThan(20);
      }
    }
  });
});

describe("rest sounds", () => {
  it("carries across a gym without becoming a ringtone", () => {
    for (const style of STYLES) {
      const tones = restTones(style);
      expect(soundPeakGain(tones), `${style} gain`).toBeLessThanOrEqual(SOUND_LIMITS.restPeakGain);
      expect(soundSeconds(tones), `${style} length`).toBeLessThanOrEqual(SOUND_LIMITS.restSeconds);
    }
  });
});
