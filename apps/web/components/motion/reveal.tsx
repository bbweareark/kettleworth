"use client";
import { useEffect, useRef, type ElementType, type ReactNode } from "react";

/**
 * The page spine: a section translates 20px and fades as it crosses ~15% of the viewport.
 *
 * Content starts visible. The hidden state is gated behind a `js-reveal` class that this
 * component puts on <html> only once it has mounted and only when the reader has not asked
 * for reduced motion, so the page reads correctly with JS disabled, before hydration, and for
 * anyone who finds movement unpleasant. Reveals happen once and never re-hide.
 */
export function Reveal({ as: Tag = "div", delay = 0, className, children }: { as?: ElementType; delay?: number; className?: string; children: ReactNode }) {
  const ref = useRef<HTMLElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) { el.setAttribute("data-reveal", "in"); return; }
    document.documentElement.classList.add("js-reveal");
    const io = new IntersectionObserver((entries) => {
      for (const e of entries) if (e.isIntersecting) { e.target.setAttribute("data-reveal", "in"); io.unobserve(e.target); }
    }, { rootMargin: "0px 0px -15% 0px", threshold: 0.01 });
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return <Tag ref={ref} data-reveal="" style={delay ? ({ "--reveal-delay": `${delay}ms` } as React.CSSProperties) : undefined} className={className}>{children}</Tag>;
}
