"use client";
import Link from "next/link";
import { motion, useReducedMotion } from "motion/react";
import { cn } from "@kettleworth/ui";

/**
 * Arc's week: the block read as episodes.
 *
 * design/CONCEPT.md says the memorable idea of this world is that the work is the drama and
 * the number going up is the plot. A list of four cards called "Week ahead" says none of that.
 * An index of episodes does: every session in the block is numbered from the first one you
 * ever did, the one you are on is marked, and the ones still to come are listed the way a
 * chapter index lists chapters.
 *
 * Composition from Locomotive's own index (design/refs/dna-locomotive/desktop-full.png): a
 * hairline per row, a caps label at the left, the title set large in the display face, the
 * metadata pushed to the right edge, and no cards anywhere. The current row inverts to the
 * band colour and carries the only red mark on the screen.
 */
export type Episode = { id: string; name: string; when: string; minutes: number; state: "now" | "later" };

export function EpisodeWeek({ episodes, firstEpisode }: { episodes: Episode[]; firstEpisode: number }) {
  const reduce = useReducedMotion();
  if (!episodes.length) {
    return (
      <section className="border-t border-rule pt-4">
        <p className="meta">The arc</p>
        <p className="mt-1 text-sm text-fg-muted">Generate a programme and the episodes fill in.</p>
      </section>
    );
  }
  return (
    <section className="border-t border-rule pt-4">
      <div className="mb-3 flex items-baseline justify-between gap-4">
        <h2 className="font-display text-xl tracking-tightest">The arc</h2>
        <Link href="/app/programme" className="meta transition-colors hover:text-fg">All episodes</Link>
      </div>
      <ol>
        {episodes.map((e, i) => {
          const n = firstEpisode + i;
          const now = e.state === "now";
          return (
            <motion.li
              key={e.id}
              initial={reduce ? undefined : { clipPath: "inset(0 100% 0 0)", opacity: 0 }}
              animate={reduce ? undefined : { clipPath: "inset(0 0% 0 0)", opacity: 1 }}
              transition={{ duration: 0.45, delay: Math.min(i, 5) * 0.07, ease: [0.25, 1, 0.5, 1] }}
              className={cn("border-t border-rule", now && "band")}
            >
              <Link href={`/app/session/${e.id}`} className="flex items-center gap-4 px-3 py-3.5">
                <span className="meta w-16 shrink-0" style={now ? { color: "inherit", opacity: 0.7 } : undefined}>
                  Ep. {String(n).padStart(2, "0")}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-display text-2xl leading-none tracking-tightest">{e.name}</span>
                  <span className="meta mt-1 block" style={now ? { color: "inherit", opacity: 0.7 } : undefined}>
                    {e.when} · {e.minutes} min
                  </span>
                </span>
                {now ? (
                  /* The only red on the screen that is not an impact frame: this one is here. */
                  <motion.span
                    aria-label="Current episode"
                    className="size-3 shrink-0 bg-impact"
                    initial={reduce ? undefined : { scale: 0 }}
                    animate={reduce ? undefined : { scale: 1 }}
                    transition={{ duration: 0.3, delay: 0.35, ease: [0.25, 1, 0.5, 1] }}
                  />
                ) : (
                  <span aria-hidden className="font-display text-lg leading-none text-fg-subtle">&#8599;</span>
                )}
              </Link>
            </motion.li>
          );
        })}
      </ol>
    </section>
  );
}
