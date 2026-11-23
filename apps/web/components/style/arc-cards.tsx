"use client";
import { useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { Button } from "@kettleworth/ui";
import { useStyle } from "@/lib/style";
import { arcCleared, arcOpening } from "@/lib/voice";

/**
 * Arc's two full-screen moments: the title card and the clear.
 *
 * The owner's verdict on the first cut of this world was that it still looked like the app
 * with different paint, and he was right: a head and a palette are not an experience. What
 * makes someone the main character is not a picture of a character, it is the app treating
 * their session as an episode, announcing it, and marking the end of it.
 *
 * So opening a session in Arc opens on a title card, the way an episode opens, and finishing
 * one closes on a clear. Neither is decoration you have to sit through: the title card leaves
 * on its own in 2.2 seconds and on any tap, and the clear waits for you.
 *
 * Both are Arc only. Carbon opens straight into the console and Sanctuary sets a stone.
 * Composition from Locomotive's own full-bleed type pages, with the screen tone referenced
 * from scrolltide's Halftone Mono.
 */
const EASE = [0.25, 1, 0.5, 1] as const;

export function ArcTitleCard({ enabled, name, episode, title, rounds }: { enabled: boolean; name: string; episode: number; title: string; rounds: number }) {
  const reduce = useReducedMotion();
  /*
   * Derived, not set in an effect: the card is simply open while this is Arc and nobody has
   * dismissed it. The only effect is the timer that dismisses it, and that writes state from a
   * timeout rather than during the effect.
   *
   * `enabled` comes from the server rather than from the client hook, because this one covers
   * the whole screen: deciding it after hydration would show a frame of the session first,
   * which is exactly the thing a title card exists to prevent.
   */
  const [dismissed, setDismissed] = useState(false);
  const open = enabled && !dismissed;

  useEffect(() => {
    if (!open) return;
    const t = setTimeout(() => setDismissed(true), reduce ? 1200 : 2200);
    return () => clearTimeout(t);
  }, [open, reduce]);

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          role="presentation"
          onClick={() => setDismissed(true)}
          initial={{ opacity: reduce ? 0 : 1 }}
          animate={{ opacity: 1 }}
          exit={reduce ? { opacity: 0 } : { clipPath: "inset(0 0 100% 0)", transition: { duration: 0.42, ease: EASE } }}
          className="fixed inset-0 z-[60] flex flex-col justify-center overflow-hidden bg-bg px-6 text-fg"
        >
          <div aria-hidden className="screentone pointer-events-none absolute inset-0 opacity-25" />

          {/* The character, cut in from the right as the card lands. */}
          <motion.img
            src="/art/arc/ready-560.webp"
            alt=""
            aria-hidden
            initial={reduce ? undefined : { x: 80, opacity: 0 }}
            animate={reduce ? undefined : { x: 0, opacity: 1 }}
            transition={{ duration: 0.5, ease: EASE }}
            className="pointer-events-none absolute -right-6 bottom-0 h-[52%] w-auto max-w-[70%] select-none object-contain object-bottom"
          />

          <div className="relative">
            <motion.p
              initial={reduce ? undefined : { x: -24, opacity: 0 }}
              animate={reduce ? undefined : { x: 0, opacity: 1 }}
              transition={{ duration: 0.4, ease: EASE, delay: 0.05 }}
              className="meta"
            >
              Episode {String(episode).padStart(2, "0")}
            </motion.p>

            {/* The title, struck in one line at display size. This is the whole card. */}
            <motion.h2
              initial={reduce ? undefined : { clipPath: "inset(0 100% 0 0)" }}
              animate={reduce ? undefined : { clipPath: "inset(0 0% 0 0)" }}
              transition={{ duration: 0.55, ease: EASE, delay: 0.1 }}
              className="font-display mt-1 max-w-[9ch] text-figure uppercase leading-[0.86] tracking-tightest"
            >
              {title}
            </motion.h2>

            <motion.p
              initial={reduce ? undefined : { y: 14, opacity: 0 }}
              animate={reduce ? undefined : { y: 0, opacity: 1 }}
              transition={{ duration: 0.4, ease: EASE, delay: 0.4 }}
              className="mt-3 max-w-[20ch] font-display text-xl leading-tight"
            >
              {arcOpening(name, episode)}
            </motion.p>

            <motion.p
              initial={reduce ? undefined : { opacity: 0 }}
              animate={reduce ? undefined : { opacity: 1 }}
              transition={{ duration: 0.3, delay: 0.6 }}
              className="meta mt-6"
            >
              {rounds} rounds · tap to begin
            </motion.p>
          </div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}

/**
 * The clear. Fires once, when the last set of the session lands, and waits to be dismissed:
 * this is the moment the whole world was built for, and hurrying it would be the one mistake
 * that cannot be undone.
 */
export function ArcClear({ done, total, episode, tonnage, unit, onClose }: { done: number; total: number; episode: number; tonnage: number; unit: string; onClose?: () => void }) {
  const style = useStyle();
  const reduce = useReducedMotion();
  /* Derived the same way: cleared is a fact about the session, not a flag to be set. */
  const [closed, setClosed] = useState(false);
  const open = style === "arc" && total > 0 && done >= total && !closed;
  const close = () => { setClosed(true); onClose?.(); };

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          role="dialog"
          aria-modal="true"
          aria-label="Episode cleared"
          initial={reduce ? { opacity: 0 } : { opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, transition: { duration: 0.25 } }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-[60] flex flex-col justify-end overflow-hidden bg-bg px-6 pb-10 text-fg"
        >
          <div aria-hidden className="screentone pointer-events-none absolute inset-0 opacity-25" />

          <motion.img
            src="/art/arc/win-560.webp"
            alt=""
            aria-hidden
            initial={reduce ? undefined : { scale: 1.12, opacity: 0 }}
            animate={reduce ? undefined : { scale: 1, opacity: 1 }}
            transition={{ duration: 0.55, ease: EASE }}
            className="pointer-events-none absolute inset-x-0 top-[6%] mx-auto h-[46%] w-auto max-w-[86%] select-none object-contain"
          />

          <div className="relative">
            <motion.p
              initial={reduce ? undefined : { opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.25 }}
              className="meta text-impact"
            >
              Episode {String(episode).padStart(2, "0")} · complete
            </motion.p>

            <motion.h2
              initial={reduce ? undefined : { clipPath: "inset(0 100% 0 0)" }}
              animate={reduce ? undefined : { clipPath: "inset(0 0% 0 0)" }}
              transition={{ duration: 0.5, ease: EASE, delay: 0.3 }}
              className="font-display mt-1 max-w-[9ch] text-figure uppercase leading-[0.86] tracking-tightest"
            >
              {arcCleared(episode)}
            </motion.h2>

            <motion.p
              initial={reduce ? undefined : { y: 12, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.35, delay: 0.5 }}
              className="mt-3 font-display text-xl"
            >
              {total} sets. {Math.round(tonnage).toLocaleString("en-GB")} {unit} moved.
            </motion.p>

            <Button className="mt-6 w-full" onClick={close}>Close it out</Button>
          </div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
