"use client";
import { useEffect, useRef, useState } from "react";
import { cn } from "@kettleworth/ui";

/**
 * The one signature motion moment.
 *
 * Ported from figureandplot.com (design/refs/hero-figure-and-plot): a horizontal track of
 * uniform tiles travelling through a single fixed node in the centre, with one quiet label
 * per group. Here the tiles are the weeks of a training block and the fixed node is NOW, so
 * the block scrolls under the marker rather than the marker moving along the block.
 *
 * Everything else on the page is still. This is deliberately the only thing that moves, and
 * under prefers-reduced-motion it becomes a static strip with the current week marked.
 */
const WEEKS = [
  { n: 1, kind: "build", top: "100.0" },
  { n: 2, kind: "build", top: "102.5" },
  { n: 3, kind: "build", top: "105.0" },
  { n: 4, kind: "deload", top: "85.0" },
  { n: 5, kind: "build", top: "107.5" },
  { n: 6, kind: "build", top: "110.0" },
  { n: 7, kind: "build", top: "112.5" },
  { n: 8, kind: "deload", top: "90.0" },
  { n: 9, kind: "peak", top: "117.5" },
];

export function Conveyor() {
  const track = useRef<HTMLDivElement>(null);
  const [now, setNow] = useState(4);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const id = window.setInterval(() => setNow((w) => (w % WEEKS.length) + 1), 2200);
    return () => window.clearInterval(id);
  }, []);

  return (
    <div className="relative">
      <div className="mb-3 flex items-baseline justify-between">
        <span className="meta">The block</span>
        <span className="meta">Week {now} of {WEEKS.length}</span>
      </div>

      {/* the fixed NOW marker: the track moves, this does not */}
      <div aria-hidden className="pointer-events-none absolute inset-y-10 left-1/2 z-10 hidden w-px -translate-x-px bg-rule-strong sm:block" />

      <div ref={track} className="overflow-hidden border-y border-rule py-5">
        <div
          className="flex gap-element transition-transform duration-500 ease-out motion-reduce:transition-none"
          style={{ transform: `translateX(calc(50% - ${(now - 0.5) * 124}px))` }}
        >
          {WEEKS.map((w) => {
            const current = w.n === now;
            return (
              <div
                key={w.n}
                aria-current={current ? "step" : undefined}
                className={cn(
                  "w-[109px] shrink-0 border-l pl-3",
                  current ? "border-rule-strong" : "border-rule",
                )}
              >
                <div className={cn("meta", current && "text-volt")}>
                  {String(w.n).padStart(2, "0")} · {w.kind}
                </div>
                <div className={cn("mt-1 font-display text-2xl tabular", current ? "text-fg" : "text-fg-subtle")}>
                  {w.top}
                </div>
                <div
                  aria-hidden
                  className={cn(
                    "mt-2 h-8",
                    w.kind === "deload" ? "bg-rule" : current ? "bg-volt" : "bg-fg-subtle/35",
                  )}
                  style={{ height: `${w.kind === "deload" ? 14 : 14 + (w.n * 3)}px` }}
                />
              </div>
            );
          })}
        </div>
      </div>

      <p className="measure mt-3 text-sm text-fg-muted">
        Three weeks up, one week back, then higher than before. The deload is not a gap in the
        plan; it is the plan.
      </p>
    </div>
  );
}
