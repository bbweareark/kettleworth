"use client";
import { useEffect, useRef } from "react";
import { useReducedMotion } from "motion/react";
import { clipFor, stateSrc, type ArcState, type castFor } from "@/lib/arc-art";

/**
 * The character, actually animating.
 *
 * The owner's note was blunt and correct: "I just don't want static images, I want the images
 * to be animated." Everything before this moved a still around with springs and auras, which
 * is motion applied *to* a picture rather than a picture that moves. These are hand-drawn-look
 * cel clips generated from the same character's own frames, so he breathes while he waits,
 * shakes at the hardest point of a rep and punches the air when the set lands.
 *
 * Three decisions worth keeping:
 *
 *   **They are panels, not cut-outs.** The clips keep the white ground they were drawn on and
 *   sit inside a hairline frame, because a bright cel panel inset into an ink page is the
 *   grammar of the thing this world is imitating. Cutting a video out would mean alpha video,
 *   which Safari will not play without HEVC, and a fallback nobody tests.
 *
 *   **The still is the poster and the fallback.** Reduced motion, a cast with no clips yet,
 *   a slow connection or a codec refusal all land on the frame that was already there, so the
 *   screen is never empty and never waits.
 *
 *   **Nothing autoplays with sound, ever.** Muted, inline, and the looping one is the only
 *   one that repeats; the others play once and hold their last frame.
 */
export function ArcClip({
  cast,
  state,
  className,
}: {
  cast: ReturnType<typeof castFor>;
  state: ArcState;
  className?: string;
}) {
  const reduce = useReducedMotion();
  const clip = clipFor(cast, state);
  const still = stateSrc(cast, state);
  const el = useRef<HTMLVideoElement>(null);

  /*
   * `autoplay` is a request, not a guarantee: a browser that has throttled the tab, or has its
   * own policy, will load the first frame and stop. Asking once on mount covers that, and a
   * refusal is fine because the poster is the frame the screen would have shown anyway.
   */
  useEffect(() => {
    el.current?.play().catch(() => {});
  }, [clip]);

  if (reduce || !clip) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={still} alt="" aria-hidden className={className} />;
  }
  return (
    <video
      ref={el}
      // A new element per state: swapping src on a playing video does not reliably restart it.
      key={state}
      src={clip}
      poster={still}
      autoPlay
      muted
      playsInline
      loop={state === "ready" || state === "rest"}
      preload="auto"
      aria-hidden
      className={className}
    />
  );
}
