"use client";
import { useEffect, useRef, useState, type ReactNode } from "react";

/**
 * Renders its children once they are about to come into view.
 *
 * `next/dynamic` splits a component into its own chunk but still fetches it the moment the
 * component mounts, so a chart two screens down was still pulling 361KB of Recharts while the
 * page was trying to become interactive. Holding the render back until the reader is within
 * `rootMargin` of it means the chunk is fetched on the way there instead.
 *
 * The placeholder must be the same height as what replaces it, so nothing moves. With 400px
 * of margin the real thing has normally arrived before it is on screen, which is why this
 * costs nothing to look at.
 */
export function WhenVisible({ children, placeholder, rootMargin = "400px" }: { children: ReactNode; placeholder: ReactNode; rootMargin?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [show, setShow] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    // No observer (or a very old browser): show it rather than hide content behind a feature.
    if (typeof IntersectionObserver === "undefined") { setShow(true); return; }
    const io = new IntersectionObserver((entries) => {
      if (entries.some((e) => e.isIntersecting)) { setShow(true); io.disconnect(); }
    }, { rootMargin });
    io.observe(el);
    return () => io.disconnect();
  }, [rootMargin]);

  return <div ref={ref}>{show ? children : placeholder}</div>;
}
