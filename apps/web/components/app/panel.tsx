import type { ReactNode } from "react";
import { cn } from "@kettleworth/ui";

/**
 * A titled block of content on a raised surface.
 *
 * This is the one container shape in the app: hairline edge, 18px radius, flat fill one value
 * above the ground, exactly as the DNA reference holds a block. It exists so that charts,
 * lists and forms stop each inventing their own frame - the previous build had four different
 * ones, which is how a surface ends up with no hierarchy.
 */
export function Panel({ id, title, note, action, children, className }: { id?: string; title?: string; note?: string; action?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <section id={id} className={cn("rounded-lg border border-rule bg-surface", className)}>
      {title ? (
        <div className="flex items-baseline justify-between gap-4 border-b border-rule px-4 py-3.5">
          <div className="min-w-0">
            <h2 className="font-display text-lg">{title}</h2>
            {note ? <p className="mt-0.5 text-xs text-fg-subtle">{note}</p> : null}
          </div>
          {action}
        </div>
      ) : null}
      <div className="p-4">{children}</div>
    </section>
  );
}
