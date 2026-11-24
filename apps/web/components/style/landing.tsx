"use client";
import { useEffect, useRef, useState } from "react";
import { useReducedMotion } from "motion/react";
import { useStyle } from "@/lib/style";
import { Burst } from "@/components/style/arc-fx";
import { armAudio, setChime } from "@/lib/chime";
import { cn } from "@kettleworth/ui";

/**
 * A set lands.
 *
 * This is the only moment in the app that hits back, and until now only one of the three
 * worlds hit back at all: Arc broke the panel, Carbon and Sanctuary changed a number. The
 * owner's note was that whichever world you choose you should feel like the hero of it, so
 * all three now answer a logged set, in their own grammar, with sound and with motion.
 *
 * The grammar came from one reference, Scrolltide's Match Strike, which is a fireplace switch
 * you light like a match: the head drags across the striker, sparks fly, a flame catches and
 * the room warms. That is four phases, and the three worlds each take a different one.
 *
 *   Carbon      the drag. A head crosses the striker and leaves nothing behind. No sparks,
 *               no flame. An instrument reports; it does not perform.
 *   Arc         the catch. Flash, speed lines, ring, red field, and the screen shakes.
 *   Sanctuary   the room warming. A low bronze light rises off the floor and goes out.
 *
 * Sound is written in `@kettleworth/core`'s sound module and played by `lib/chime.ts`. Two
 * rules hold it in place: a landing is always quieter and shorter than the sound that ends
 * rest, which is asserted in the tests, and it plays whether or not motion is reduced.
 * Reduced motion is a statement about movement, not about hearing, and silencing someone's
 * confirmation because they are sensitive to animation would be the wrong reading of it.
 *
 * `fire` is the number of completed sets. A rise is the event. A fall is an exercise being
 * cleared, which must never be rewarded.
 */
export function SetLanded({ fire, last = false }: { fire: number; last?: boolean }) {
  const style = useStyle();
  const reduce = useReducedMotion();
  const [hit, setHit] = useState(0);
  const seen = useRef(fire);
  /*
   * The world and the ending flag are read through refs, for the same reason rest.tsx does
   * it: both can change after hydration, and neither is the event. Only `fire` is.
   */
  const voice = useRef({ style, last });
  useEffect(() => { voice.current = { style, last }; });

  // The browser will not make a sound until the person has touched the page, and on iOS that
  // permission attaches to the audio context rather than to the page, so it is opened early.
  useEffect(() => { armAudio(); }, []);

  useEffect(() => {
    if (fire === seen.current) return;
    const up = fire > seen.current;
    seen.current = fire;
    if (!up) return;
    setChime(voice.current.style, voice.current.last);
    setHit((n) => n + 1);
  }, [fire]);

  if (reduce || hit === 0) return null;
  if (style === "arc") return <Burst fire={hit} />;
  if (style === "sanctuary") return <WarmRise fire={hit} />;
  return null;
}

/**
 * Sanctuary: the room warms.
 *
 * A bronze light that rises off the floor of the screen, holds for a moment and goes out,
 * over a second. It cannot be clicked. This world does not flash; a thing that has been kept
 * gives off heat.
 *
 * The floor is not the bottom of the window. A set landing starts rest, so the rest dock
 * arrives on the same beat, and anchored to the viewport the whole light was behind it -
 * built, correct, and invisible. It is anchored instead to the top edge of the dock, through
 * the `--kw-dock` height the dock publishes, so the light rises off whatever the floor
 * actually is: the dock when there is one, the tab strip when there is not.
 */
function WarmRise({ fire }: { fire: number }) {
  return (
    <div
      key={fire}
      aria-hidden
      className="animate-warm-rise pointer-events-none fixed inset-x-0 z-20 h-48 bottom-[calc(4rem+env(safe-area-inset-bottom)+var(--kw-dock,0px))] lg:bottom-[calc(var(--kw-dock,0px))]"
      style={{
        background:
          "linear-gradient(0deg, color-mix(in srgb, var(--color-gold) 30%, transparent) 0%, color-mix(in srgb, var(--color-gold) 10%, transparent) 42%, transparent 100%)",
      }}
    />
  );
}

/**
 * The figure that answers, in every world.
 *
 * Wraps whatever is given it - in practice the weight and the reps, the two numbers someone
 * is looking at when they press Log - and responds on the same beat as the screen.
 *
 *   Arc         is struck, with the screen.
 *   Carbon      settles, and a volt head drags the width of the row beneath it.
 *   Sanctuary   settles more slowly, and a bronze line warms under it and fades.
 *
 * Carbon and Sanctuary's line is drawn on an element of its own below the children rather
 * than as a border on them, so nothing in the row moves when it appears.
 */
export function Struck({ count, children, className }: { count: number; children: React.ReactNode; className?: string }) {
  const style = useStyle();
  const reduce = useReducedMotion();
  const [hit, setHit] = useState(0);
  const seen = useRef(count);

  useEffect(() => {
    if (count === seen.current) return;
    const up = count > seen.current;
    seen.current = count;
    if (up) setHit((n) => n + 1);
  }, [count]);

  if (reduce) return <>{children}</>;
  if (style === "arc") {
    return <div key={hit} className={cn(hit && "animate-impact-strike", className)}>{children}</div>;
  }

  const warm = style === "sanctuary";
  return (
    <div className={cn("relative", className)}>
      <div key={hit} className={hit ? "animate-strike-settle" : undefined}>{children}</div>
      {/*
        The striker. A one pixel track that is empty until a set lands, clipped so the head
        enters and leaves past the ends of the row rather than appearing inside it. It is its
        own element, below the children, so nothing in the row moves when the head crosses.
      */}
      <div aria-hidden className="pointer-events-none absolute inset-x-0 -bottom-2 h-px overflow-hidden">
        {hit ? (
          <div
            key={hit}
            className={cn("animate-strike-drag h-px w-1/2", warm ? "opacity-90" : undefined)}
            style={{
              background: `linear-gradient(90deg, transparent 0%, ${warm ? "var(--color-gold)" : "var(--color-volt)"} 50%, transparent 100%)`,
            }}
          />
        ) : null}
      </div>
    </div>
  );
}
