"use client";
import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useStyle } from "@/lib/style";
import { Aura, type Charge } from "@/components/style/arc-fx";
import { arcDuring } from "@/lib/voice";
import { castFor, type ArcState } from "@/lib/arc-art";
import { ArcClip } from "@/components/style/arc-clip";

/**
 * The band: a page, not a card with a picture in it.
 *
 * The owner's verdict on the first version was exact and worth quoting: "the image in a square
 * in the right is bad UI, it feels like a image pasted there and no value add". He was right
 * on both counts and they are the same fault. A square inset, inside a bordered box, beside
 * some text, is the shape of a stock illustration slot - and because the text beside it only
 * said a slogan, the square was carrying nothing a member needed.
 *
 * So the band is built as a page of the thing this world is imitating instead of as a widget:
 *
 *   **The ink is the ground and the panel is cut into it.** Full bleed to both edges of the
 *   phone, no border box, no radius, and the character's panel is cut on a twelve degree
 *   slant with a charge-coloured stroke along the cut. A cel panel on a slant is page
 *   grammar; a square with a border is a card.
 *
 *   **The clip bleeds every edge of that panel.** `object-cover`, so the figure is cropped by
 *   the page the way a panel crops a drawing, rather than floating inside a frame with air
 *   around it.
 *
 *   **It carries the count.** The round number is the largest thing in the band, which is this
 *   app's one rule for every screen, so the band is now where you look to see where you are.
 *   It earns its height.
 *
 * The figure is still the member's own - two protagonists across every state, picked from the
 * profile the way the photography is - and every state is a short cel clip rather than a
 * still, so he breathes while waiting, shakes at the hardest point of a rep and puts a fist up
 * when the set lands. The energy field burns on the ink side, under the type, and charges
 * through the rest clock.
 *
 * Arc only. The band does not render at all in the other two worlds.
 */

/** The cut: the panel starts twelve percent in at the top and runs to the edge at the bottom. */
const SLANT = "polygon(12% 0%, 100% 0%, 100% 100%, 0% 100%)";

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
  const line = state === "win" ? "That is the exercise." : resting ? "Charging back up." : done === 0 ? "Round one. Go." : arcDuring(done);

  if (style !== "arc") return null;

  return (
    <section aria-hidden className="relative -mx-4 h-40 overflow-hidden border-y border-rule bg-bg sm:-mx-6 sm:h-48">
      {/* Tone across the whole page, and the field burning under the type. */}
      <div aria-hidden className="screentone-dense pointer-events-none absolute inset-0 text-fg-subtle opacity-20" />
      <Aura level={level} className="left-[-14%] right-[42%] top-[-24%] bottom-[-24%]" />

      {/* The stroke along the cut: the same shape, three pixels further left, in charge. */}
      <div aria-hidden className="absolute inset-y-0 right-0 w-[64%] -translate-x-[3px] bg-charge" style={{ clipPath: SLANT }} />

      {/* The panel itself. The clip crops to it; nothing floats inside a frame. */}
      <div className="absolute inset-y-0 right-0 w-[64%] overflow-hidden bg-bg" style={{ clipPath: SLANT }}>
        <AnimatePresence mode="popLayout" initial={false}>
          <motion.div
            key={state}
            initial={reduce ? undefined : { opacity: 0, x: 34, scale: 1.08 }}
            animate={reduce ? undefined : { opacity: 1, x: 0, scale: 1 }}
            exit={reduce ? undefined : { opacity: 0, x: -18, scale: 0.98 }}
            transition={{ type: "spring", stiffness: 420, damping: 26, mass: 0.7 }}
            className="absolute inset-0"
          >
            <ArcClip cast={cast} state={state} className="size-full object-cover object-top" />
          </motion.div>
        </AnimatePresence>
      </div>

      {/* The ink side: the count first, because every screen in this app answers with a number. */}
      <div className="relative flex h-full w-[46%] flex-col justify-between py-3 pl-4 pr-2 sm:py-4 sm:pl-6">
        <p className="meta">Round</p>
        <div>
          <p className="font-display text-4xl leading-none">
            {done}
            <span className="text-lg text-fg-subtle"> / {total}</span>
          </p>
          <p className="mt-2 font-display text-sm uppercase leading-tight text-fg-muted">{line}</p>
        </div>
      </div>
    </section>
  );
}
