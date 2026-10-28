"use client";
import { useEffect, useState } from "react";

/**
 * True while the reader is scrolling down, away from the top of the page.
 *
 * The floating nav pill sits over the content, which is right on a screen that opens with a
 * photograph and wrong everywhere else: once you scroll, whatever happens to be passing under
 * it is covered, and on Community that was the handle and the Edit profile link.
 *
 * Getting out of the way on the way down and coming back on the way up keeps the pill looking
 * exactly as it did - no layout change, nothing moves - while giving the content the screen.
 * It never hides near the top, so the first thing you see is unchanged.
 */
export function useHideOnScroll(threshold = 120): boolean {
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    let last = window.scrollY;
    let frame = 0;
    const read = () => {
      frame = 0;
      const y = window.scrollY;
      // A few pixels of slack, so a thumb resting on the screen does not flicker it.
      if (Math.abs(y - last) > 6) {
        setHidden(y > threshold && y > last);
        last = y;
      }
    };
    const onScroll = () => { if (!frame) frame = requestAnimationFrame(read); };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => { window.removeEventListener("scroll", onScroll); cancelAnimationFrame(frame); };
  }, [threshold]);

  return hidden;
}
