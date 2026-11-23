"use client";
import { useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { Button } from "@kettleworth/ui";
import { useStyle } from "@/lib/style";
import { arcCleared, arcOpening } from "@/lib/voice";
import { Aura } from "@/components/style/arc-fx";
import { castFor, stateSrc } from "@/lib/arc-art";

/**
 * Arc's two full-screen moments: the title card and the clear.
 *
 * The owner's verdict on the first cut of this world was that it still looked like the app
 * with different paint, and then that the anime one was "just images" that appear and
 * disappear. Both are the same note: a picture of a character is not a character doing
 * something. What makes someone the main character is the app treating their session as an
 * episode, announcing it, and marking the end of it, with the figure powered up rather than
 * placed.
 *
 * So opening a session in Arc opens on a title card, the way an episode opens, and finishing
 * one closes on a clear. Neither is decoration you have to sit through: the title card leaves
 * on its own in 2.4 seconds and on any tap, and the clear waits for you.
 *
 * Composition ported from Agence Foudre (design/refs/dna-agence-foudre): ultra-black display
 * type at 0.72 leading set as one dense block that owns the viewport, almost no chrome, and
 * colour as emotional punctuation. The lean, the aura and the slam are this app's own.
 */
const EASE = [0.25, 1, 0.5, 1] as const;

/**
 * The title block, thrown into frame the way a title card lands.
 *
 * The lean lives on the wrapper rather than on the animated element: Framer writes an inline
 * transform while it springs, which would overwrite a skew applied by a class.
 */
function Slam({ children, delay = 0, className }: { children: React.ReactNode; delay?: number; className?: string }) {
  const reduce = useReducedMotion();
  return (
    <div className="lean origin-left">
      <motion.h2
        initial={reduce ? undefined : { y: "-32%", scale: 1.35, opacity: 0 }}
        animate={reduce ? undefined : { y: 0, scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 520, damping: 22, mass: 0.8, delay }}
        className={className}
      >
        {children}
      </motion.h2>
    </div>
  );
}

export function ArcTitleCard({ enabled, name, episode, title, rounds, sex }: { enabled: boolean; name: string; episode: number; title: string; rounds: number; sex?: "male" | "female" | "other" | null }) {
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
    const t = setTimeout(() => setDismissed(true), reduce ? 1200 : 2400);
    return () => clearTimeout(t);
  }, [open, reduce]);

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          role="presentation"
          onClick={() => setDismissed(true)}
          initial={{ opacity: 1 }}
          animate={{ opacity: 1 }}
          exit={reduce ? { opacity: 0 } : { clipPath: "inset(0 0 100% 0)", transition: { duration: 0.4, ease: EASE } }}
          className="fixed inset-0 z-[60] flex flex-col justify-start overflow-hidden bg-bg px-6 pt-[18vh] text-fg"
        >
          <div aria-hidden className="screentone pointer-events-none absolute inset-0 opacity-25" />

          {/* He is charging while the title lands: the field burns behind him from the first frame. */}
          <div className="pointer-events-none absolute -right-10 bottom-0 h-[48%] w-[72%]">
            <Aura level="charging" className="bottom-[-6%] left-[-10%] right-[-16%] top-0" />
            <motion.img
              src={stateSrc(castFor(sex), "ready")}
              alt=""
              aria-hidden
              initial={reduce ? undefined : { x: 90, y: 20, opacity: 0, scale: 1.1 }}
              animate={reduce ? undefined : { x: 0, y: 0, opacity: 1, scale: 1 }}
              transition={{ type: "spring", stiffness: 380, damping: 26, mass: 0.8 }}
              className="absolute bottom-0 right-0 h-full w-auto select-none object-contain object-bottom"
            />
          </div>

          <div className="relative">
            <motion.p
              initial={reduce ? undefined : { x: -24, opacity: 0 }}
              animate={reduce ? undefined : { x: 0, opacity: 1 }}
              transition={{ duration: 0.4, ease: EASE, delay: 0.05 }}
              className="meta text-impact"
            >
              Episode {String(episode).padStart(2, "0")}
            </motion.p>

            {/* The title, one dense block that owns the viewport, leaning into the frame. */}
            <Slam delay={0.08} className="font-display mt-2 max-w-[8ch] text-figure uppercase leading-[0.84]">
              {title}
            </Slam>

            <motion.p
              initial={reduce ? undefined : { y: 14, opacity: 0 }}
              animate={reduce ? undefined : { y: 0, opacity: 1 }}
              transition={{ duration: 0.4, ease: EASE, delay: 0.45 }}
              className="mt-4 max-w-[20ch] font-display text-xl uppercase leading-none"
            >
              {arcOpening(name, episode)}
            </motion.p>

            <motion.p
              initial={reduce ? undefined : { opacity: 0 }}
              animate={reduce ? undefined : { opacity: 1 }}
              transition={{ duration: 0.3, delay: 0.65 }}
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
export function ArcClear({ done, total, episode, tonnage, unit, sex, onClose }: { done: number; total: number; episode: number; tonnage: number; unit: string; sex?: "male" | "female" | "other" | null; onClose?: () => void }) {
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
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, transition: { duration: 0.25 } }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-[60] flex flex-col justify-end overflow-hidden bg-bg px-6 pb-10 text-fg"
        >
          <div aria-hidden className="screentone pointer-events-none absolute inset-0 opacity-25" />

          {/* Radial speed lines behind the figure, drawn once as the card arrives. */}
          <motion.svg
            aria-hidden
            viewBox="0 0 100 100"
            initial={reduce ? undefined : { scale: 0.6, opacity: 0, rotate: -6 }}
            animate={reduce ? undefined : { scale: 1, opacity: 0.5, rotate: 0 }}
            transition={{ duration: 0.7, ease: EASE }}
            className="pointer-events-none absolute inset-x-0 top-[2%] mx-auto h-[56%] w-[140%] max-w-none text-impact"
          >
            {Array.from({ length: 28 }, (_, i) => {
              const a = (i / 28) * Math.PI * 2;
              return (
                <line
                  key={i}
                  x1={50 + Math.cos(a) * 16}
                  y1={50 + Math.sin(a) * 16}
                  x2={50 + Math.cos(a) * 70}
                  y2={50 + Math.sin(a) * 70}
                  stroke="currentColor"
                  strokeWidth={i % 3 === 0 ? 1.6 : 0.7}
                />
              );
            })}
          </motion.svg>

          <div className="pointer-events-none absolute inset-x-0 top-[5%] mx-auto h-[48%] w-[88%]">
            <Aura level="peak" className="inset-[-8%]" />
            <motion.img
              src={stateSrc(castFor(sex), "win")}
              alt=""
              aria-hidden
              initial={reduce ? undefined : { scale: 1.25, y: 30, opacity: 0 }}
              animate={reduce ? undefined : { scale: 1, y: 0, opacity: 1 }}
              transition={{ type: "spring", stiffness: 360, damping: 24, mass: 0.9 }}
              className="absolute inset-0 mx-auto h-full w-auto select-none object-contain"
            />
          </div>

          <div className="relative">
            <motion.p
              initial={reduce ? undefined : { opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.25 }}
              className="meta text-impact"
            >
              Episode {String(episode).padStart(2, "0")} · complete
            </motion.p>

            <Slam delay={0.3} className="font-display mt-2 max-w-[8ch] text-figure uppercase leading-[0.84]">
              {arcCleared(episode)}
            </Slam>

            <motion.p
              initial={reduce ? undefined : { y: 12, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.35, delay: 0.55 }}
              className="mt-4 font-display text-xl uppercase leading-none"
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
