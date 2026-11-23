"use client";
import { useId, type ReactNode } from "react";
import { motion, useReducedMotion } from "motion/react";
import { Figure } from "@kettleworth/ui";
import { artSrcSet, FULL_BLEED } from "@/lib/art-srcset";

/**
 * Sanctuary's screen head: the figure under a drawn arch.
 *
 * design/CONCEPT.md gives this world one memorable idea, and this is it. Ported from
 * Structured, "Renaissance gallery on putty paper": a gallery wall, and on the wall an arched
 * niche with the photograph set inside it. Carbon bleeds its photograph edge to edge and Arc
 * scatters labels around a hard-edged figure; this one frames, which is the whole difference
 * between a gym and a hall.
 *
 * It is symmetrical, which the anti-generic rules otherwise treat as a smell. It earns it
 * here: an arch has an axis, the reference's own composition is centred, and the other two
 * worlds in this app are deliberately not. A centred page in all three would be the failure;
 * one centred page out of three is a contrast.
 *
 * The arch is also the progress meter when a screen gives it something to count: the ring is
 * cut into one stone per session of the block and the completed ones are set in gold, so the
 * arch fills as the block is trained. Session progress uses the same idea at a smaller size
 * in components/style/arch.tsx.
 */
export function SanctuaryHead({
  art,
  eyebrow,
  label,
  value,
  title,
  unit,
  decimals,
  second,
  children,
  arch,
  priority,
}: {
  art: string;
  eyebrow: string;
  label: string;
  value?: number | string;
  title?: string;
  unit?: string;
  decimals?: number;
  second?: ReactNode;
  children?: ReactNode;
  /** Sessions done and sessions in the block, when the screen knows them. */
  arch?: { done: number; total: number };
  priority?: boolean;
}) {
  const reduce = useReducedMotion();
  const id = useId().replace(/[^a-zA-Z0-9]/g, "");
  const clip = `arch-${id}`;

  /*
   * The arch, in a 100 x 130 box: straight jambs, a semicircular head. Drawn once as a path
   * and used three ways - as the clip for the photograph, as the gold outline over it, and as
   * the ring the stones are cut from.
   */
  const W = 100;
  const H = 130;
  const SPRING = 55; // where the curve starts, measured from the top
  const outline = `M4 ${H - 2} L4 ${SPRING} A46 46 0 0 1 ${W - 4} ${SPRING} L${W - 4} ${H - 2}`;

  const stones = arch && arch.total > 0 ? Math.min(24, arch.total) : 0;
  const lit = stones ? Math.round((Math.min(arch!.done, arch!.total) / arch!.total) * stones) : 0;

  return (
    <section aria-label={label} className="border-b border-rule">
      <div className="mx-auto w-full max-w-[1200px] px-4 pb-6 pt-20 text-center sm:px-6">
        <p className="meta">{eyebrow}</p>

        <div className="relative mx-auto mt-4 w-full max-w-[280px] sm:max-w-[340px]">
          <svg aria-hidden width="0" height="0" className="absolute">
            <defs>
              <clipPath id={clip} clipPathUnits="objectBoundingBox">
                {/* The same arch in unit space, so it scales with whatever it wraps. */}
                <path d="M0.04,1 L0.04,0.423 A0.46,0.354 0 0 1 0.96,0.423 L0.96,1 Z" />
              </clipPath>
            </defs>
          </svg>

          {/* The photograph, inside the niche. It arrives by light coming up the wall rather
              than by fading: a reveal from the bottom edge, slow enough to be calm. */}
          <motion.div
            initial={reduce ? undefined : { clipPath: "inset(100% 0 0 0)" }}
            animate={reduce ? undefined : { clipPath: "inset(0% 0 0 0)" }}
            transition={{ duration: 0.86, ease: [0.25, 1, 0.5, 1] }}
            className="aspect-[100/130] w-full"
          >
            <picture>
              <source type="image/webp" srcSet={artSrcSet(art)} sizes={FULL_BLEED} />
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={art}
                alt=""
                aria-hidden
                decoding="async"
                fetchPriority={priority ? "high" : undefined}
                className="size-full object-cover"
                style={{ clipPath: `url(#${clip})` }}
              />
            </picture>
          </motion.div>

          {/* The gold hairline, drawing itself up one jamb, over the head and down the other. */}
          <svg aria-hidden viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" className="pointer-events-none absolute inset-0 size-full text-gold">
            <motion.path
              d={outline}
              fill="none"
              stroke="currentColor"
              strokeWidth={1.3}
              vectorEffect="non-scaling-stroke"
              initial={reduce ? undefined : { pathLength: 0 }}
              animate={reduce ? undefined : { pathLength: 1 }}
              transition={{ duration: 1.1, delay: 0.2, ease: "easeInOut" }}
            />
            {/* One stone per session of the block, set as they are trained. */}
            {Array.from({ length: stones }, (_, i) => {
              const a = 180 - (i + 0.5) * (180 / stones);
              const rad = (a * Math.PI) / 180;
              const cx = W / 2;
              const cy = SPRING;
              const x1 = cx + 36 * Math.cos(rad);
              const y1 = cy - 36 * Math.sin(rad);
              const x2 = cx + 45.5 * Math.cos(rad);
              const y2 = cy - 45.5 * Math.sin(rad);
              const set = i < lit;
              return (
                <motion.line
                  key={i}
                  x1={x1} y1={y1} x2={x2} y2={y2}
                  stroke="currentColor"
                  strokeWidth={set ? 1.6 : 0.5}
                  opacity={set ? 1 : 0.35}
                  vectorEffect="non-scaling-stroke"
                  initial={reduce ? undefined : { opacity: 0 }}
                  animate={reduce ? undefined : { opacity: set ? 1 : 0.35 }}
                  transition={{ duration: 0.4, delay: 0.5 + Math.min(i, 10) * 0.04 }}
                />
              );
            })}
          </svg>
        </div>

        <div className="mt-5">
          {value != null ? (
            <Figure labelAs="h1" label={label} value={value} unit={unit} decimals={decimals} center />
          ) : (
            <>
              <p className="meta">{label}</p>
              <h1 className="mt-1 font-display text-3xl">{title}</h1>
            </>
          )}
          {second ? <p className="mx-auto mt-2 max-w-[34ch] font-display text-xl leading-tight text-gold">{second}</p> : null}
          {arch ? <p className="meta mt-3">{arch.done} of {arch.total} stones set</p> : null}
        </div>
        {children}
      </div>
    </section>
  );
}
