import type { ReactNode } from "react";
import { cn } from "@kettleworth/ui";

/**
 * A titled section of a screen.
 *
 * This used to be a raised rounded box, and it was the single biggest source of boxiness in
 * the app: five screens stacked four or five of them down the page, so every screen read as a
 * column of equal-weight cards with nothing dominating. That is the AI house style, and
 * `references/anti-generic.md` names the fix: let type carry the structure and use a hairline
 * instead of a frame.
 *
 * So a panel is now a rule, a title set at display size on the page's own ground, and the
 * content below it. Nothing is raised, nothing is framed, and the title is big enough to be
 * the thing that organises the screen. The contract is unchanged, so every caller keeps
 * working and the five screens all change at once.
 */
export function Panel({ id, title, note, action, children, className }: { id?: string; title?: string; note?: string; action?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <section id={id} className={cn("border-t border-rule pt-4", className)}>
      {title ? (
        <div className="mb-4 flex items-baseline justify-between gap-4">
          <div className="min-w-0">
            <h2 className="font-display text-2xl leading-none tracking-tightest">{title}</h2>
            {note ? <p className="measure mt-2 text-sm text-fg-muted">{note}</p> : null}
          </div>
          {action}
        </div>
      ) : null}
      {children}
    </section>
  );
}
