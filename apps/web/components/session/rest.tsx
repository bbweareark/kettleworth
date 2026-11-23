"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import { ChevronDown, ChevronUp, Minus, Plus, SkipForward } from "lucide-react";
import { Button, cn } from "@kettleworth/ui";
import { describePlates, describeTarget, platesPerSide, round } from "@kettleworth/core";
import type { PlannedSet } from "@kettleworth/types";
import { effortWord } from "./effort";
import { restChime } from "@/lib/chime";
import { useStyle } from "@/lib/style";
import { ChargeRail, chargeWord } from "@/components/style/charge";

/**
 * Rest: a clock that cannot be lost, drawn as something filling back up.
 *
 * This is the second rebuild of rest, and both came from the owner reporting the same kind of
 * failure. The first time, the screen between sets was an arcade of five tabs; it became a
 * clock with the next set under it. This time his note was blunter and more serious: "when we
 * hit next exercise the timer's gone", and the rest screen "could be made better, like life
 * charging in a game".
 *
 * Both are the same mistake with the same cause. Rest was a **card in the page flow** owned by
 * the exercise on screen. So it scrolled away the moment you looked at anything else, and it
 * was thrown away the moment you moved to the next movement - at exactly the point in a
 * session where you are most likely to move, because the exercise you just finished is done.
 * Rest belongs to the body, not to the exercise. So it is a dock now:
 *
 *   **Fixed above the tab strip.** It cannot scroll away and it cannot be covered. Ported from
 *   Get Ripe's sticky band (design/refs/cta-get-ripe/mobile.png), already the app's pattern for
 *   the one thing a screen is about.
 *
 *   **It survives the exercise change.** The player no longer clears it on next, previous or a
 *   jump; only reaching zero, pressing go, or restarting the session ends a rest period. Move
 *   to the next movement mid-rest and the clock keeps running and starts naming that
 *   movement's first set instead.
 *
 *   **The rail fills rather than drains.** Every other progress bar in this app counts work
 *   done; this one counts recovery gained, so it starts empty and is full when it is time to
 *   lift. It is the dock's own top edge rather than a line inside it, because the dock is the
 *   charge. Per world: see components/style/charge.tsx.
 *
 *   **It holds at full for a beat.** The clock reaching zero used to unmount this instantly,
 *   so the sound played against a screen where nothing happened. Now the rail tops out, the
 *   word changes to go, and the dock leaves about a second later.
 *
 * It collapses to a strip for anyone who wants the screen back, and it reports its own height
 * to the page as `--kw-dock` so the console above it and the coach in the corner both know
 * where it ends. design/SECTION-MAP.md carries the measured row.
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
  const style = useStyle();
  const [left, setLeft] = useState(seconds);
  const [total, setTotal] = useState(seconds);
  const [open, setOpen] = useState(true);
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
  /* The same ref trick for the sound: the world is read after hydration and must not restart
     the clock when it arrives. */
  const sound = useRef(() => restChime(style));
  useEffect(() => { sound.current = () => restChime(style); }, [style]);

  useEffect(() => {
    // `left` and `total` are not reset here. The player gives this component a fresh key for
    // every rest period, so it is already a new mount with the right starting values, and
    // writing them again would undo a plus or minus the lifter had pressed.
    endAt.current = Date.now() + seconds * 1000;
    done.current = false;
    let hold: ReturnType<typeof setTimeout> | undefined;
    const t = setInterval(() => {
      const l = Math.max(0, Math.round((endAt.current - Date.now()) / 1000));
      setLeft(l);
      if (l === 0 && !done.current) {
        done.current = true;
        try { navigator.vibrate?.([120, 60, 120]); } catch {}
        sound.current();
        // Full, then gone: the rail tops out and the dock leaves a beat later, so the sound
        // lands on a screen that is doing something rather than on one that just vanished.
        hold = setTimeout(() => fire.current(), 1100);
      }
    }, 250);
    return () => { clearInterval(t); if (hold) clearTimeout(hold); };
  }, [seconds]);

  /*
   * The dock's own height, published to the page. The console needs to clear it and the coach
   * in the corner needs to sit above it, and neither should have to guess: a collapsed dock
   * and an open one differ by about 130px.
   */
  const [height, setHeight] = useState(0);
  const measure = useCallback((el: HTMLDivElement | null) => {
    if (!el) return;
    const write = () => {
      const h = el.getBoundingClientRect().height;
      setHeight(h);
      document.documentElement.style.setProperty("--kw-dock", `${Math.round(h)}px`);
    };
    write();
    const ro = new ResizeObserver(write);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  useEffect(() => () => { document.documentElement.style.removeProperty("--kw-dock"); }, []);

  const adjust = (d: number) => { endAt.current += d * 1000; setTotal((t) => Math.max(5, t + d)); };
  const mm = Math.floor(left / 60);
  const ss = String(left % 60).padStart(2, "0");
  const unit = units === "metric" ? "kg" : "lb";
  const charged = total ? 1 - left / total : 1;
  const full = left === 0;

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
    <>
      {/* The page keeps its own last section clear of the dock. */}
      <div aria-hidden style={{ height }} />

      <motion.section
        ref={measure}
        initial={reduce ? undefined : { y: 120 }}
        animate={reduce ? undefined : { y: 0 }}
        transition={{ type: "spring", stiffness: 380, damping: 34 }}
        className="fixed inset-x-0 bottom-[calc(4rem+env(safe-area-inset-bottom))] z-40 bg-bg lg:bottom-0 lg:pb-[env(safe-area-inset-bottom)]"
        role="timer"
        aria-live="off"
        aria-label={`${label}, between sets`}
      >
        {/* The charge is the edge of the dock, not a line inside it. */}
        <ChargeRail charged={charged} full={full} />

        <div className="mx-auto w-full max-w-2xl px-4 pb-3 pt-2 sm:px-6">
          {/*
            Label left, charge right, above the clock: the health bar's own label row. Setting
            them as one sentence under the clock ran "Between rounds - Charge 5%" off a 390px
            phone in Arc, which tracks its labels at 0.14em.
          */}
          <div className="flex items-baseline justify-between gap-3">
            <p className="meta truncate">{label}</p>
            <p className="meta shrink-0 text-fg-subtle">{full ? "Full" : `${chargeWord(style)} ${Math.round(charged * 100)}%`}</p>
          </div>

          <div className="mt-0.5 flex items-end gap-4">
            <div className="min-w-0 flex-1">
              <p data-clock className="font-display text-4xl leading-none tracking-tightest tabular text-volt sm:text-figure">
                {full ? "GO" : `${mm}:${ss}`}
              </p>
            </div>

            {/*
              The breath, kept quiet and only while the dock is open. A square that grows on
              the way in and shrinks on the way out, drawn in the support ramp rather than the
              accent: the accent on this screen belongs to the clock.
            */}
            {open && !full ? (
              <div className="shrink-0 text-center">
                <div aria-hidden className="grid size-12 place-items-center rounded-lg border border-rule">
                  <motion.div
                    animate={reduce ? { scale: 0.8 } : { scale: 0.45 + through * 0.55 }}
                    transition={{ duration: 0.9, ease: "linear" }}
                    className="size-9 rounded-md border border-volt/50 bg-volt/15"
                  />
                </div>
                <p className="meta mt-1">Breathe {inhale ? "in" : "out"}</p>
              </div>
            ) : null}

            <button
              type="button"
              onClick={() => setOpen((o) => !o)}
              aria-expanded={open}
              aria-label={open ? "Collapse the rest clock" : "Expand the rest clock"}
              className="-mr-2 grid size-11 shrink-0 place-items-center text-fg-subtle hover:text-fg"
            >
              {open ? <ChevronDown className="size-5" /> : <ChevronUp className="size-5" />}
            </button>
          </div>

          {open ? (
            <>
              {next ? (
                <div className="mt-2.5 border-t border-rule pt-2.5">
                  <p className="meta">Next up · set {next.setNumber} of {setsInExercise}</p>
                  {/* Said once, in the console's own words, so the two never read differently. */}
                  <p className="mt-0.5 font-display text-xl tracking-tighter">
                    {nextWeight != null ? `${round(nextWeight, 1)} ${unit} · ` : ""}
                    {describeTarget(next)}
                    {next.targetRpe ? ` at ${effortWord(next.targetRpe).toLowerCase()}` : ""}
                  </p>
                  {plates?.length ? <p className="mt-1 text-sm text-fg-muted">On the bar: {describePlates(plates)} {unit} a side</p> : null}
                </div>
              ) : null}

              <p className={cn("measure mt-2 hidden text-sm text-fg-muted sm:block")}>{why ?? "Four seconds in, four out, until it hits zero."}</p>

              <div className="mt-2.5 flex flex-wrap items-center gap-2">
                <Button variant="secondary" size="sm" onClick={() => adjust(-15)} aria-label="Fifteen seconds less rest"><Minus /> 15s</Button>
                <Button variant="secondary" size="sm" onClick={() => adjust(15)} aria-label="Fifteen seconds more rest"><Plus /> 15s</Button>
                <Button variant="ghost" size="sm" className="ml-auto" onClick={onSkip}>Go now <SkipForward /></Button>
              </div>
            </>
          ) : null}
        </div>
      </motion.section>
    </>
  );
}
