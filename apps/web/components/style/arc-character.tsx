"use client";
import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useStyle } from "@/lib/style";
import { arcDuring } from "@/lib/voice";

/**
 * The character who is having the session.
 *
 * Arc's first cut put a character on the screen head and nowhere else, so the world you
 * actually spend forty minutes in, the session, was still Carbon with square corners. This is
 * the fix: a band above the console that reacts to what you just did.
 *
 * Three states, one character, drawn as the same person: waiting, straining, and the fist in
 * the air. A landed set throws him into the strain frame for a beat and then he settles, and
 * the last set of the exercise puts the fist up. It is the cheapest possible animation of a
 * thing that is otherwise invisible, which is that someone is actually doing this.
 *
 * Arc only, and the band is not rendered at all in the other two worlds.
 */
const SRC = {
  ready: "/art/arc/ready-560.webp",
  strain: "/art/arc/strain-560.webp",
  win: "/art/arc/win-560.webp",
} as const;

export function ArcCharacter({ done, total, exerciseDone }: { done: number; total: number; exerciseDone: boolean }) {
  const style = useStyle();
  const reduce = useReducedMotion();
  /*
   * The fist in the air is a fact about the exercise, so it is derived. Only the strain frame
   * is timed, and it is written from a timeout rather than during the effect.
   */
  const [straining, setStraining] = useState(false);
  const seen = useRef(done);

  useEffect(() => {
    if (done === seen.current) return;
    const up = done > seen.current;
    seen.current = done;
    if (!up) return;
    const on = setTimeout(() => setStraining(true), 0);
    const off = setTimeout(() => setStraining(false), 2200);
    return () => { clearTimeout(on); clearTimeout(off); };
  }, [done]);

  const state: keyof typeof SRC = exerciseDone ? "win" : straining ? "strain" : "ready";

  if (style !== "arc") return null;

  return (
    <section aria-hidden className="relative h-28 overflow-hidden border-y border-rule sm:h-32">
      {/* Tone behind the figure, fading out to the right so the line stays readable. */}
      <div aria-hidden className="screentone-dense pointer-events-none absolute inset-0 text-fg-subtle opacity-20" />

      <div className="relative flex h-full items-center gap-4 pl-3 pr-0">
        <p className="font-display max-w-[58%] text-lg leading-tight tracking-tightest">
          {state === "win" ? "That is the exercise. Next." : done === 0 ? "Round one. Set up and go." : arcDuring(done)}
        </p>

        <div className="relative ml-auto h-full w-[42%] shrink-0">
          <AnimatePresence mode="popLayout" initial={false}>
            <motion.img
              key={state}
              src={SRC[state]}
              alt=""
              initial={reduce ? undefined : { opacity: 0, x: 18, scale: 0.98 }}
              animate={reduce ? undefined : { opacity: 1, x: 0, scale: 1 }}
              exit={reduce ? undefined : { opacity: 0, x: -10 }}
              transition={{ duration: 0.28, ease: [0.25, 1, 0.5, 1] }}
              className="absolute bottom-0 right-0 h-[118%] w-auto select-none object-contain object-bottom"
            />
          </AnimatePresence>
        </div>
      </div>

      {/* The count, set small in the corner the way a panel is numbered. */}
      <p className="meta absolute left-3 top-2.5">{done} / {total}</p>
    </section>
  );
}
