"use client";
import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useStyle } from "@/lib/style";
import { Aura, type Charge } from "@/components/style/arc-fx";
import { arcDuring } from "@/lib/voice";

/**
 * The character who is having the session.
 *
 * Arc's first cut put a character on the screen head and nowhere else, so the world you
 * actually spend forty minutes in, the session, was still Carbon with square corners. This is
 * the fix: a band above the console that reacts to what you just did.
 *
 * Three states, one character, drawn as the same person: waiting, straining, and the fist in
 * the air. He is thrown into frame on a spring rather than cross faded, because a cross fade
 * is not animation, and an energy field burns behind him the whole time: idling between sets,
 * charging while the rest clock runs, white hot on the set itself.
 *
 * Arc only, and the band is not rendered at all in the other two worlds.
 */
const SRC = {
  ready: "/art/arc/ready-560.webp",
  strain: "/art/arc/strain-560.webp",
  win: "/art/arc/win-560.webp",
} as const;

export function ArcCharacter({ done, total, exerciseDone, resting }: { done: number; total: number; exerciseDone: boolean; resting: boolean }) {
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
    const off = setTimeout(() => setStraining(false), 2600);
    return () => { clearTimeout(on); clearTimeout(off); };
  }, [done]);

  const state: keyof typeof SRC = exerciseDone ? "win" : straining ? "strain" : "ready";
  /*
   * How hard the field is working. Rest is a charge: the energy builds back while the clock
   * runs, which is the one piece of this world where waiting is the point. The set itself is
   * the peak, and the rest of the time it idles.
   */
  const level: Charge = straining ? "peak" : resting ? "charging" : "idle";

  if (style !== "arc") return null;

  return (
    <section aria-hidden className="relative h-32 overflow-hidden border-y border-rule sm:h-36">
      {/* Tone behind the figure, fading out to the right so the line stays readable. */}
      <div aria-hidden className="screentone-dense pointer-events-none absolute inset-0 text-fg-subtle opacity-20" />

      <div className="relative flex h-full items-center gap-4 pl-3 pr-0">
        <p className="font-display max-w-[56%] text-xl uppercase leading-none">
          {state === "win" ? "That is the exercise." : resting ? "Charging." : done === 0 ? "Round one. Go." : arcDuring(done)}
        </p>

        <div className="relative ml-auto h-full w-[46%] shrink-0">
          {/* The energy sits behind him and never in front: the figure is the subject. */}
          <Aura level={level} className="bottom-[-18%] left-[-12%] right-[-12%] top-[-10%]" />
          <AnimatePresence mode="popLayout" initial={false}>
            <motion.img
              key={state}
              src={SRC[state]}
              alt=""
              /*
               * He is thrown into frame rather than faded in: up from below with a kick of
               * scale, which is how an impact panel introduces a figure.
               */
              initial={reduce ? undefined : { opacity: 0, y: 26, scale: 1.08 }}
              animate={reduce ? undefined : { opacity: 1, y: 0, scale: 1 }}
              exit={reduce ? undefined : { opacity: 0, y: -14, scale: 0.98 }}
              transition={{ type: "spring", stiffness: 420, damping: 26, mass: 0.7 }}
              className="absolute bottom-0 right-0 h-[122%] w-auto select-none object-contain object-bottom"
            />
          </AnimatePresence>
        </div>
      </div>

      {/* The count, set small in the corner the way a panel is numbered. */}
      <p className="meta absolute left-3 top-2.5">{done} / {total}</p>
    </section>
  );
}
