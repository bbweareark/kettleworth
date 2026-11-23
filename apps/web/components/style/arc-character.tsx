"use client";
import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useStyle } from "@/lib/style";
import { Aura, type Charge } from "@/components/style/arc-fx";
import { arcDuring } from "@/lib/voice";
import { castFor, type ArcState } from "@/lib/arc-art";
import { ArcClip } from "@/components/style/arc-clip";

/**
 * The character who is having the session.
 *
 * Four frames of the same person, and the person is the member's own: two protagonists are
 * drawn across every state, picked from the profile the way the photography already is.
 * Waiting, straining, sitting on the bench with a towel while the clock runs, and the fist in
 * the air.
 *
 * And the frames themselves move: each state is a short hand-drawn-look cel clip of the same
 * character, so he breathes while he waits, shakes at the hardest point of a rep and punches
 * the air when the set lands. The clip is a panel with its own white ground, inset into the
 * ink page the way a cel panel is, and it is thrown into frame on a spring with two
 * afterimages trailing it. An energy field burns behind it the whole time: idling between
 * sets, charging through the rest clock, white hot on the set itself.
 *
 * Arc only, and the band is not rendered at all in the other two worlds.
 */
export function ArcCharacter({ done, total, exerciseDone, resting, sex }: { done: number; total: number; exerciseDone: boolean; resting: boolean; sex?: "male" | "female" | "other" | null }) {
  const style = useStyle();
  const reduce = useReducedMotion();
  /*
   * The fist in the air and the bench are facts about the session, so they are derived. Only
   * the strain frame is timed, and it is written from a timeout rather than during the effect.
   */
  const [straining, setStraining] = useState(false);
  const seen = useRef(done);

  useEffect(() => {
    if (done === seen.current) return;
    const up = done > seen.current;
    seen.current = done;
    if (!up) return;
    const on = setTimeout(() => setStraining(true), 0);
    const off = setTimeout(() => setStraining(false), 2600);
    return () => { clearTimeout(on); clearTimeout(off); };
  }, [done]);

  const cast = castFor(sex);
  const state: ArcState = exerciseDone ? "win" : straining ? "strain" : resting ? "rest" : "ready";
  /*
   * How hard the field is working. Rest is a charge: the energy builds back while the clock
   * runs, which is the one piece of this world where waiting is the point.
   */
  const level: Charge = straining ? "peak" : resting ? "charging" : "idle";

  if (style !== "arc") return null;

  return (
    <section aria-hidden className="relative h-32 overflow-hidden border-y border-rule sm:h-36">
      {/* Tone behind the figure, fading out to the right so the line stays readable. */}
      <div aria-hidden className="screentone-dense pointer-events-none absolute inset-0 text-fg-subtle opacity-20" />

      <div className="relative flex h-full items-center gap-4 pl-3 pr-0">
        <p className="font-display max-w-[54%] text-xl uppercase leading-none">
          {state === "win" ? "That is the exercise." : resting ? "Charging." : done === 0 ? "Round one. Go." : arcDuring(done)}
        </p>

        <div className="relative ml-auto h-full w-[46%] shrink-0">
          <Aura level={level} className="bottom-[-18%] left-[-12%] right-[-12%] top-[-10%]" />

          <AnimatePresence mode="popLayout" initial={false}>
            <motion.div
              key={state}
              initial={reduce ? undefined : { opacity: 0, y: 30, scale: 1.1 }}
              animate={reduce ? undefined : { opacity: 1, y: 0, scale: 1 }}
              exit={reduce ? undefined : { opacity: 0, y: -16, scale: 0.97 }}
              transition={{ type: "spring", stiffness: 420, damping: 26, mass: 0.7 }}
              className="absolute inset-0"
            >
              {/*
                Two afterimages behind the figure, offset and faded, which is how a cel sheet
                shows speed: the frames that have not caught up yet. They only exist during the
                spring, so they cost two paints and then stop.
              */}
              {/*
                The clip, framed. Two afterimages of its poster trail it into place, which is
                how a cel sheet shows speed: the frames that have not caught up yet.
              */}
              {!reduce && state !== "rest" ? (
                <>
                  <motion.img
                    src={`/art/arc/${cast[state]}-560.webp`}
                    alt=""
                    initial={{ opacity: 0.4, x: 26, y: 10 }}
                    animate={{ opacity: 0, x: 0, y: 0 }}
                    transition={{ duration: 0.34, ease: "easeOut" }}
                    className="absolute bottom-0 right-0 h-[122%] w-auto select-none object-contain object-bottom"
                  />
                  <motion.img
                    src={`/art/arc/${cast[state]}-560.webp`}
                    alt=""
                    initial={{ opacity: 0.22, x: 48, y: 18 }}
                    animate={{ opacity: 0, x: 0, y: 0 }}
                    transition={{ duration: 0.44, ease: "easeOut" }}
                    className="absolute bottom-0 right-0 h-[122%] w-auto select-none object-contain object-bottom"
                  />
                </>
              ) : null}

              <motion.div
                animate={reduce || state !== "ready" ? {} : { y: [0, -3, 0] }}
                transition={{ duration: 3.4, repeat: Infinity, ease: "easeInOut" }}
                className="absolute inset-y-1 right-2 aspect-square border border-rule-strong bg-bg"
              >
                <ArcClip cast={cast} state={state} className="size-full object-cover" />
              </motion.div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* The count, set small in the corner the way a panel is numbered. */}
      <p className="meta absolute left-3 top-2.5">{done} / {total}</p>
    </section>
  );
}
