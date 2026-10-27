import { Children, isValidElement, type ReactNode } from "react";
import { cn } from "@kettleworth/ui";

/**
 * The in-app page spine.
 *
 * Every screen is one column: a 16px gutter on a phone, 56px of air between sections, and
 * enough room at the top for the floating nav pill to clear the first line of content. A
 * dashboard should not animate on every scroll - the reader is here to read numbers, not to
 * watch a page perform - so there is one quiet arrival on mount, staggered and capped, and
 * nothing that fires again later.
 */
export function Screen({ children, className, flush }: { children: ReactNode; className?: string; /** The first section is a full-bleed photograph, so the nav pill floats over it instead of above it. */ flush?: boolean }) {
  return (
    <div className={cn("mx-auto w-full max-w-[1200px] px-4 sm:px-6", flush ? "pt-0" : "pt-20", className)}>
      <div className="space-y-app-section">
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
    </div>
  );
}

/**
 * Cancels the page gutter so a photograph or a rule can run to the edge of the viewport. The
 * Today hero is the reason this exists: its reference bleeds the image edge to edge with no
 * border and no radius at the top.
 */
export function Bleed({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn("-mx-4 sm:-mx-6", className)}>{children}</div>;
}

/** A gutter-respecting block inside a bleeding Screen. */
export function Gutter({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn("px-4 sm:px-6", className)}>{children}</div>;
}

/** The legacy name, kept so screens that have not been recomposed yet keep their rhythm. */
export const AppStack = Screen;
