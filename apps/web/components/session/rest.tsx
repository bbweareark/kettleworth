"use client";
import { useEffect, useRef, useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import { Minus, Plus, SkipForward } from "lucide-react";
import { Button } from "@kettleworth/ui";
import { describePlates, describeTarget, platesPerSide, round } from "@kettleworth/core";
import type { PlannedSet } from "@kettleworth/types";
import { effortWord } from "./effort";

/**
 * Rest: the clock, and what is next.
 *
 * This replaces the rest deck, which the owner's verdict on was that it is bad and the screen
 * around it confusing. Both came from one cause: the deck was an arcade. Five tabs - Rush,
 * Quiz, Breathe, Call it, Tip - of unrelated content, inside a screen that already has a tab
 * bar, none of it what anybody needs between sets. It also meant the thing you came for, the
 * time left, shared the screen with a word game.
 *
 * Rest asks two questions: how long, and what am I doing next. So the clock is the figure, the
 * next set is stated once under it, the plates for that weight are drawn, and the one thing on
 * the old deck that was real - breathing down, which does drop heart rate between sets - is
 * the default content rather than a tab nobody opened.
 *
 * design/SECTION-MAP.md carries the row by row justification.
 */
export function Rest({
  label,
  seconds,
  why,
  next,
  setsInExercise,
  nextWeight,
  bar,
  units,
  onDone,
  onSkip,
}: {
  /** What this world calls the gap between sets. */
  label: string;
  seconds: number;
  /** Why this rest is this long, from the engine. */
  why?: string;
  next: PlannedSet | null;
  /** How many sets this exercise has, so the next one can say where it sits. */
  setsInExercise: number;
  /** The next set's load, already in the member's own units. */
  nextWeight: number | null;
  /** The bar for this movement in those same units, or null when there is no bar. */
  bar: number | null;
  units: "metric" | "imperial";
  onDone: () => void;
  onSkip: () => void;
}) {
  const reduce = useReducedMotion();
  const [left, setLeft] = useState(seconds);
  const [total, setTotal] = useState(seconds);
  const endAt = useRef(0);
  const done = useRef(false);

  /*
   * `onDone` is an inline arrow, so it is a different function on every render of the player,
   * and logging a set or pressing anything re-renders the player. While the deadline was set
   * inside an effect that depended on it, every one of those renders pushed the deadline
   * forward and the clock appeared to start again. Holding the callback in a ref is what fixes
   * that: the deadline is only ever set when the rest period itself changes.
   */
  const fire = useRef(onDone);
  useEffect(() => { fire.current = onDone; });

  useEffect(() => {
    // `left` and `total` are not reset here. The player gives this component a fresh key for
    // every rest period, so it is already a new mount with the right starting values, and
    // writing them again would undo a plus or minus the lifter had pressed.
    endAt.current = Date.now() + seconds * 1000;
    done.current = false;
    const t = setInterval(() => {
      const l = Math.max(0, Math.round((endAt.current - Date.now()) / 1000));
      setLeft(l);
      if (l === 0 && !done.current) {
        done.current = true;
        try { navigator.vibrate?.([120, 60, 120]); } catch {}
        chime();
        fire.current();
      }
    }, 250);
    return () => clearInterval(t);
  }, [seconds]);

  const adjust = (d: number) => { endAt.current += d * 1000; setTotal((t) => Math.max(5, t + d)); };
  const mm = Math.floor(left / 60);
  const ss = String(left % 60).padStart(2, "0");
  const unit = units === "metric" ? "kg" : "lb";
  const pct = total ? (left / total) * 100 : 0;

  /*
   * Four seconds in, four out: slow enough to pull heart rate down, simple enough to follow
   * with your eyes shut. One cycle is eight seconds, so the square is also a coarse clock.
   */
  const inhale = left % 8 < 4;
  const through = inhale ? (left % 8) / 4 : 1 - ((left % 8) - 4) / 4;

  /*
   * What goes on the bar, in words rather than as the console's plate glyph. The glyph reads
   * plates by relative height, which says nothing when the answer is a single plate, and the
   * console two rows down already draws it.
   */
  const plates = next && nextWeight != null && bar != null && nextWeight > bar ? platesPerSide(nextWeight, bar, units).plates : null;

  return (
    <section
      className="rounded-lg border border-volt/40 bg-surface p-4"
      role="timer"
      aria-live="off"
      aria-label={`${label}, between sets`}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="meta">{label}</p>
          {/* The clock is the figure. Nothing else on this screen comes near its size. */}
          <p data-clock className="font-display text-figure leading-none tracking-tightest tabular text-volt">{mm}:{ss}</p>
        </div>
        {/*
          The breath, kept quiet. A square that grows on the way in and shrinks on the way out,
          drawn in the support ramp rather than the accent: the accent on this screen belongs to
          the clock, and a second volt shape of this size competed with it. No shadow and no
          blur either, which the DNA allows nowhere.
        */}
        <div className="shrink-0 text-center">
          <div aria-hidden className="grid size-16 place-items-center rounded-lg border border-rule">
            <motion.div
              animate={reduce ? { scale: 0.8 } : { scale: 0.45 + through * 0.55 }}
              transition={{ duration: 0.9, ease: "linear" }}
              className="size-12 rounded-md border border-volt/50 bg-volt/15"
            />
          </div>
          <p className="meta mt-1.5">Breathe {inhale ? "in" : "out"}</p>
        </div>
      </div>

      <p className="measure text-sm text-fg-muted">{why ?? "Four seconds in, four out, until it hits zero."}</p>

      <div aria-hidden className="mt-3 h-1 overflow-hidden rounded-full bg-rule">
        <div className="h-full rounded-full bg-volt transition-[width] duration-200" style={{ width: `${pct}%` }} />
      </div>

      {next ? (
        <div className="mt-4 border-t border-rule pt-3">
          <p className="meta">Next up · set {next.setNumber} of {setsInExercise}</p>
          {/* Said once, in the console's own words, so the two never read differently. */}
          <p className="mt-0.5 font-display text-xl tracking-tighter">
            {nextWeight != null ? `${round(nextWeight, 1)} ${unit} · ` : ""}
            {describeTarget(next)}
            {next.targetRpe ? ` at ${effortWord(next.targetRpe).toLowerCase()}` : ""}
          </p>
          {plates?.length ? <p className="mt-1.5 text-sm text-fg-muted">On the bar: {describePlates(plates)} {unit} a side</p> : null}
        </div>
      ) : null}

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <Button variant="secondary" size="sm" onClick={() => adjust(-15)} aria-label="Fifteen seconds less rest"><Minus /> 15s</Button>
        <Button variant="secondary" size="sm" onClick={() => adjust(15)} aria-label="Fifteen seconds more rest"><Plus /> 15s</Button>
        <Button variant="ghost" size="sm" className="ml-auto" onClick={onSkip}>Go now <SkipForward /></Button>
      </div>
    </section>
  );
}

function chime() {
  try {
    const ctx = new AudioContext();
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.connect(g); g.connect(ctx.destination);
    o.frequency.value = 880; g.gain.value = 0.05;
    o.start(); o.stop(ctx.currentTime + 0.18);
  } catch {}
}
