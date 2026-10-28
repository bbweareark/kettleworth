"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import { makeQuestion, finishRun, GAME_MAX_RUNS, GAME_POINTS_PER_RUN, SCORING_THRESHOLD, type Question, type RunResult } from "@kettleworth/core";
import { cn } from "@kettleworth/ui";
import { useClientValue } from "@/lib/use-client-value";

/**
 * Word Rush. Two targets, one thumb, one mistake ends it.
 *
 * The addictive loop is Flappy Bird's and is deliberate: the run-over screen *is* the start
 * button, your best sits on screen the whole time, the answer window tightens with every
 * correct word, and ending one short of your best says so. The content is gym and food
 * Spanish, so the thing it drills is the thing the user is already doing.
 *
 * The training guard is unchanged from the game it replaces: it only exists inside a rest
 * timer, the countdown stays above it, and Growth stops at six scoring runs a session.
 */
type Phase = "ready" | "playing" | "over";

export function WordRush({
  seedKey,
  scoringRunsThisSession,
  onScoringRun,
  restLeft,
}: {
  seedKey: string;
  scoringRunsThisSession: number;
  onScoringRun: (points: number) => void;
  restLeft: number | null;
}) {
  const reduce = useReducedMotion();
  const [phase, setPhase] = useState<Phase>("ready");
  const [index, setIndex] = useState(0);
  const [q, setQ] = useState<Question | null>(null);
  // The best is per device and per language, not worth a round trip. Read straight from
  // storage so the figure is right on the first paint rather than after one.
  const storedBest = useClientValue(() => { try { return Number(localStorage.getItem("kw-rush-best") ?? 0) || 0; } catch { return 0; } }, 0);
  const [beaten, setBeaten] = useState<number | null>(null);
  const best = beaten ?? storedBest;
  const setBest = setBeaten;
  const [runs, setRuns] = useState(scoringRunsThisSession);
  const [result, setResult] = useState<RunResult | null>(null);
  const [remaining, setRemaining] = useState(1);
  const deadline = useRef<number>(0);
  const raf = useRef<number | null>(null);
  const runSeed = useRef(seedKey);

  const end = useCallback((score: number) => {
    if (raf.current) cancelAnimationFrame(raf.current);
    const r = finishRun(score, best, runs);
    setResult(r);
    setPhase("over");
    setBest(r.best);
    try { localStorage.setItem("kw-rush-best", String(r.best)); } catch { /* private mode */ }
    if (r.points > 0) { setRuns((n) => n + 1); onScoringRun(r.points); }
  }, [best, runs, onScoringRun, setBest]);

  // One timer for the whole run, read on each frame, so the bar and the deadline agree.
  useEffect(() => {
    if (phase !== "playing" || !q) return;
    deadline.current = performance.now() + q.ms;
    const tick = () => {
      const left = deadline.current - performance.now();
      if (left <= 0) { end(index); return; }
      setRemaining(left / q.ms);
      raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
    return () => { if (raf.current) cancelAnimationFrame(raf.current); };
  }, [phase, q, index, end]);

  function start() {
    runSeed.current = `${seedKey}:${Date.now()}`;
    setIndex(0);
    setQ(makeQuestion(runSeed.current, 0));
    setResult(null);
    setRemaining(1);
    setPhase("playing");
  }

  function answer(choice: 0 | 1) {
    if (!q || phase !== "playing") return;
    if (choice !== q.correct) { end(index); return; }
    const next = index + 1;
    setIndex(next);
    setQ(makeQuestion(runSeed.current, next));
    setRemaining(1);
  }

  const capped = runs >= GAME_MAX_RUNS;

  return (
    <div>
      <div className="flex items-baseline justify-between gap-4 border-b border-rule pb-2">
        <span className="meta">Word rush · Spanish</span>
        <span className="meta">
          {capped ? "Session limit" : `${runs} / ${GAME_MAX_RUNS} · ${GAME_POINTS_PER_RUN} growth`}
        </span>
      </div>

      {/* the run clock: the only moving thing on the screen */}
      <div className="h-1 w-full overflow-hidden rounded-full bg-rule" aria-hidden>
        <motion.div
          className={cn("h-full rounded-full", remaining < 0.3 ? "bg-volt" : "bg-fg")}
          style={{ width: phase === "playing" ? `${Math.max(0, remaining) * 100}%` : "0%" }}
          transition={reduce ? { duration: 0 } : { duration: 0 }}
        />
      </div>

      <div className="flex items-baseline justify-between gap-4 py-3">
        <span className="font-display text-figure leading-none tabular">{phase === "playing" ? index : (result?.score ?? 0)}</span>
        <span className="meta">Best {best}</span>
      </div>

      {phase === "playing" && q ? (
        <>
          <p className="border-y border-rule py-5 text-center font-display text-3xl" aria-live="off">
            {q.word.es}
          </p>
          <div className="mt-2 grid grid-cols-2 gap-1.5">
            {q.options.map((opt, i) => (
              <button
                key={opt}
                type="button"
                onClick={() => answer(i as 0 | 1)}
                className="h-20 touch-manipulation rounded-md border border-rule px-2 text-base transition-colors hover:border-fg active:bg-fg active:text-bg"
              >
                {opt}
              </button>
            ))}
          </div>
        </>
      ) : (
        <div className="border-y border-rule py-5">
          <p className="font-display text-xl">
            {phase === "ready" ? "Two words. Tap the meaning." : result?.message}
          </p>
          <p className="measure mt-1.5 text-sm text-fg-muted">
            {phase === "ready"
              ? `One wrong answer ends the run, and the clock gets quicker with every word. ${SCORING_THRESHOLD} in a row earns a point.`
              : "The clock tightens every word. Go again."}
          </p>
          {/* the run-over screen is the start button: no menu between you and the next go */}
          <button
            type="button"
            onClick={start}
            autoFocus={phase === "over"}
            className="mt-4 h-14 w-full touch-manipulation rounded-full bg-volt text-base text-volt-fg transition-colors hover:bg-volt-hover"
          >
            {phase === "ready" ? "Start" : "Go again"}
          </button>
        </div>
      )}

      {restLeft != null && restLeft <= 10 && (
        <p className="mt-3 border-t border-rule pt-2 text-sm text-volt" role="status">
          Rest is nearly up. Put the phone down.
        </p>
      )}
    </div>
  );
}
