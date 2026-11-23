"use client";
import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { cn } from "@kettleworth/ui";
import { useStyle } from "@/lib/style";
import { MENTOR, MENTOR_CLIP } from "@/lib/arc-art";
import type { Praise } from "@/lib/voice";

/**
 * The coach, in the corner, after a set.
 *
 * The owner's idea, close to his words: "it would be good if there was a coach character
 * saying well done after each set, maybe on the bottom right or left, and then disappear".
 * He is right about the shape of it. The app already reads a set back in the pulse panel, but
 * a panel that updates in place is a log; nobody feels congratulated by a log. An
 * acknowledgement has to arrive, be addressed to you, and leave.
 *
 * Three rules hold it to that:
 *
 *   **It is short and it is not the pulse.** Two words of acknowledgement and one line of
 *   fact. The coaching read-back - the numbers, the correction, the reason the next set moves
 *   - stays in the pulse where it can be read twice. Saying both in both places is how an app
 *   gets muted.
 *
 *   **It leaves on its own, in four and a half seconds**, and it can be dismissed sooner. It
 *   never blocks the console, it sits above the rest dock using the height the dock publishes,
 *   and it is `aria-live="polite"` so a screen reader gets it once without interrupting.
 *
 *   **It is a different coach in each world**, because the voice is the one thing that was
 *   always meant to differ. Arc has a drawn mentor who rises out of the corner and speaks in a
 *   hard-edged panel; this is the figure the member is supposed to be training under. Carbon
 *   has no character on purpose - its world is a gallery of instruments, and a cartoon in the
 *   corner of a gallery is costume - so the acknowledgement is an instrument strip with a volt
 *   caret. Sanctuary is a line struck in bronze under a rule, the way a keeper writes down
 *   what was kept.
 */
export function CoachCallout({
  /** Increments when something worth acknowledging happens. A change is what fires it. */
  fire,
  praise,
}: {
  fire: number;
  praise: Praise | null;
}) {
  const style = useStyle();
  const reduce = useReducedMotion();
  const [shown, setShown] = useState(0);
  const seen = useRef(fire);

  useEffect(() => {
    if (fire === seen.current) return;
    seen.current = fire;
    if (fire <= 0) return;
    // Written from a timeout rather than during the effect: this app's lint bans a synchronous
    // setState in an effect, and it is right to - the render that follows is wasted.
    const on = setTimeout(() => setShown(fire), 0);
    const off = setTimeout(() => setShown(0), 4500);
    return () => { clearTimeout(on); clearTimeout(off); };
  }, [fire]);

  const open = shown > 0 && shown === fire && !!praise;

  return (
    <div
      aria-live="polite"
      className="pointer-events-none fixed bottom-[calc(4rem+env(safe-area-inset-bottom)+var(--kw-dock,0px)+0.75rem)] left-0 z-40 w-full max-w-[21rem] px-4 sm:px-6 lg:bottom-[calc(var(--kw-dock,0px)+1rem)]"
    >
      <AnimatePresence>
        {open && praise ? (
          <motion.div
            key={shown}
            initial={reduce ? { opacity: 0 } : { opacity: 0, y: 28 }}
            animate={reduce ? { opacity: 1 } : { opacity: 1, y: 0 }}
            exit={reduce ? { opacity: 0 } : { opacity: 0, y: 14 }}
            transition={{ type: "spring", stiffness: 420, damping: 30, mass: 0.7 }}
            className="pointer-events-auto"
          >
            {/*
              The whole thing is the dismiss target. A close cross on something that leaves by
              itself in four seconds is a 24px tap target guarding a 4 second wait, and it put
              a floating square over the keypad behind it.
            */}
            <button type="button" onClick={() => setShown(0)} aria-label="Dismiss the coach" className="block w-full text-left">
              {style === "arc" ? <ArcCoach praise={praise} /> : style === "sanctuary" ? <SanctuaryCoach praise={praise} /> : <CarbonCoach praise={praise} />}
            </button>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}

/**
 * Arc. The mentor comes up out of the bottom of the screen with his own speed lines behind
 * him, and speaks in a panel with a tail, which is how a page of this kind does dialogue. The
 * clip plays once and holds its last frame; the still is its poster and its fallback, so a
 * refused autoplay or a reduced-motion setting shows the frame that was there anyway.
 */
function ArcCoach({ praise }: { praise: Praise }) {
  const reduce = useReducedMotion();
  const el = useRef<HTMLVideoElement>(null);
  useEffect(() => { el.current?.play().catch(() => {}); }, []);
  return (
    <div className="flex items-end gap-0">
      <motion.div
        initial={reduce ? undefined : { y: 40, rotate: -4 }}
        animate={reduce ? undefined : { y: 0, rotate: 0 }}
        transition={{ type: "spring", stiffness: 400, damping: 22 }}
        className="relative size-24 shrink-0 overflow-hidden border border-rule-strong bg-bg"
      >
        <span aria-hidden className="screentone-dense absolute inset-0 text-fg-subtle opacity-25" />
        {reduce ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={MENTOR} alt="" aria-hidden className="relative size-full object-cover object-top" />
        ) : (
          <video ref={el} src={MENTOR_CLIP} poster={MENTOR} autoPlay muted playsInline preload="auto" aria-hidden className="relative size-full object-cover object-top" />
        )}
      </motion.div>

      {/* The panel. Hard corners, ink on white, and a tail cut back towards him. */}
      <div className="lean relative -ml-px min-w-0 flex-1 border border-rule-strong bg-band px-3 py-2 text-band-fg">
        <p className="font-display text-lg uppercase leading-none">{praise.head}</p>
        <p className="mt-1 text-xs leading-snug opacity-80">{praise.line}</p>
      </div>
    </div>
  );
}

/** Carbon. A readout on the plinth: a hairline box, one volt caret, nothing moving. */
function CarbonCoach({ praise }: { praise: Praise }) {
  return (
    <div className="flex items-start gap-3 border border-rule bg-surface px-3.5 py-3">
      <span aria-hidden className="mt-1 size-2 shrink-0 bg-volt" />
      <div className="min-w-0">
        <p className="meta text-volt">Coach</p>
        <p className="mt-0.5 font-display text-lg leading-none tracking-tightest">{praise.head}</p>
        <p className="mt-1 text-xs leading-snug text-fg-muted">{praise.line}</p>
      </div>
    </div>
  );
}

/** Sanctuary. A line written under a bronze rule, on the ground, with no box around it. */
function SanctuaryCoach({ praise }: { praise: Praise }) {
  return (
    <div className={cn("rounded-md border border-rule border-t-2 border-t-gold bg-bg px-3.5 py-3")}>
      <p className="font-display text-xl leading-none tracking-tightest">{praise.head}</p>
      <p className="mt-1.5 text-xs leading-snug text-fg-muted">{praise.line}</p>
    </div>
  );
}
