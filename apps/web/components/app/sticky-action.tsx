import Link from "next/link";
import type { ReactNode } from "react";
import { cn } from "@kettleworth/ui";

/**
 * The one action, pinned to the thumb.
 *
 * Ported from Get Ripe (design/refs/cta-get-ripe/mobile.png): a filled pill, 56px tall, held
 * at the bottom of the viewport over a scrim so it reads against whatever scrolls behind it.
 * The skill's rule is one primary action per viewport, and the DNA's is that the accent only
 * appears where effort is - so this is the only volt fill on a screen, and a screen that has
 * no single obvious next action does not get one.
 *
 * It sits above the tab strip on a phone, so a screen using it must leave room for both:
 * `pb-32` on its last section, which `Screen` does not add automatically because most screens
 * do not have a sticky action.
 */
export function StickyAction({
  href,
  label,
  note,
  icon,
  tone = "volt",
}: {
  href: string;
  label: string;
  /** The line to the left of the pill: what this action is about, never marketing copy. */
  note?: ReactNode;
  icon?: ReactNode;
  tone?: "volt" | "quiet";
}) {
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-[calc(4rem+env(safe-area-inset-bottom))] z-30 lg:bottom-0">
      <div aria-hidden className="h-16 bg-[linear-gradient(180deg,transparent,var(--color-bg))]" />
      <div className="bg-bg pb-3 lg:pb-[max(0.75rem,env(safe-area-inset-bottom))]">
        <div className="mx-auto flex w-full max-w-[1200px] items-center gap-4 px-4 sm:px-6">
          {note ? <div className="pointer-events-auto min-w-0 flex-1 truncate text-sm text-fg-muted">{note}</div> : <div className="flex-1" />}
          <Link
            href={href}
            className={cn(
              "pointer-events-auto inline-flex h-14 shrink-0 items-center gap-2.5 rounded-full px-7 text-base transition-colors [&_svg]:size-5",
              tone === "volt" ? "bg-volt text-volt-fg hover:bg-volt-hover" : "border border-rule-strong bg-surface text-fg hover:border-fg",
            )}
          >
            {label}
            {icon}
          </Link>
        </div>
      </div>
    </div>
  );
}
