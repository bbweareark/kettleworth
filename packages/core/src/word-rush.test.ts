import { describe, expect, it } from "vitest";
import {
  makeQuestion, finishRun, windowMs, WORDS,
  GAME_MAX_RUNS, GAME_POINTS_PER_RUN, SCORING_THRESHOLD,
  START_MS, FLOOR_MS,
} from "./word-rush";

describe("the vocabulary", () => {
  it("has no duplicate English meanings, or a question could have two right answers", () => {
    const en = WORDS.map((w) => w.en);
    expect(new Set(en).size).toBe(en.length);
  });

  it("has at least two words in every group, so a decoy can come from the same group", () => {
    for (const g of new Set(WORDS.map((w) => w.group))) {
      expect(WORDS.filter((w) => w.group === g).length).toBeGreaterThanOrEqual(2);
    }
  });
});

describe("makeQuestion", () => {
  it("is deterministic for a seed and index", () => {
    expect(makeQuestion("s", 3)).toEqual(makeQuestion("s", 3));
  });

  it("always offers the right answer and a different decoy", () => {
    for (let i = 0; i < 200; i++) {
      const q = makeQuestion("seed", i);
      expect(q.options[q.correct]).toBe(q.word.en);
      expect(q.options[0]).not.toBe(q.options[1]);
    }
  });

  it("draws the decoy from the same group, so the game teaches rather than tests shape-matching", () => {
    let sameGroup = 0;
    for (let i = 0; i < 100; i++) {
      const q = makeQuestion("g", i);
      const decoy = q.options[q.correct === 0 ? 1 : 0];
      const dw = WORDS.find((w) => w.en === decoy)!;
      if (dw.group === q.word.group) sameGroup++;
    }
    expect(sameGroup).toBe(100);
  });
});

describe("difficulty ramp", () => {
  it("starts generous and tightens, which is the loop that makes it addictive", () => {
    expect(windowMs(0)).toBe(START_MS);
    expect(windowMs(5)).toBeLessThan(windowMs(0));
    expect(windowMs(500)).toBe(FLOOR_MS);
  });

  it("never drops below a window a thumb can actually hit", () => {
    for (let i = 0; i < 1000; i++) expect(windowMs(i)).toBeGreaterThanOrEqual(FLOOR_MS);
  });
});

describe("finishRun", () => {
  it("pays only once the run clears the threshold, so a lucky tap earns nothing", () => {
    expect(finishRun(SCORING_THRESHOLD - 1, 0, 0).points).toBe(0);
    expect(finishRun(SCORING_THRESHOLD, 0, 0).points).toBe(GAME_POINTS_PER_RUN);
  });

  it("calls out a new best", () => {
    const r = finishRun(12, 7, 0);
    expect(r.beatBest).toBe(true);
    expect(r.best).toBe(12);
    expect(r.message).toContain("New best");
  });

  it("calls out being one short, which is what makes people tap again", () => {
    const r = finishRun(9, 10, 0);
    expect(r.soClose).toBe(true);
    expect(r.message).toContain("One short");
  });

  it("calls a tie a tie: matching your best is not one short of it", () => {
    const r = finishRun(5, 5, 0);
    expect(r.soClose).toBe(false);
    expect(r.beatBest).toBe(false);
    expect(r.message).toContain("Level with your best");
    expect(r.message).not.toContain("One short");
  });

  it("stops paying at the session cap but keeps playing", () => {
    const r = finishRun(20, 5, GAME_MAX_RUNS);
    expect(r.points).toBe(0);
    expect(r.beatBest).toBe(true);
    expect(r.message).toContain("limit");
  });

  it("cannot out-earn training: the whole cap is under a third of a session", () => {
    expect(GAME_POINTS_PER_RUN * GAME_MAX_RUNS).toBeLessThan(100 / 3);
  });

  it("keeps the previous best when the run is worse", () => {
    expect(finishRun(2, 15, 0).best).toBe(15);
  });
});
