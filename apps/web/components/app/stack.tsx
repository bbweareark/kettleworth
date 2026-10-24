import { Children, isValidElement, type ReactNode } from "react";
import { cn } from "@kettleworth/ui";

/**
 * The in-app page spine.
 *
 * A dashboard should not animate on every scroll: the reader is here to read numbers, not to
 * watch a page perform. So the app gets one quiet arrival instead — top-level sections fade
 * up on mount, staggered 60ms and capped at six, which is the motion budget in DESIGN.md.
 *
 * Pure CSS, so it costs no JavaScript and the global prefers-reduced-motion rule neutralises
 * it. Content is painted by the server either way.
 */
export function AppStack({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn("space-y-app-section", className)}>
      {Children.map(children, (child, i) =>
        isValidElement(child) ? (
          <div className="animate-fade-up" style={{ animationDelay: `${Math.min(i, 5) * 60}ms` }}>
            {child}
          </div>
        ) : (
          child
        ),
      )}
    </div>
  );
}
