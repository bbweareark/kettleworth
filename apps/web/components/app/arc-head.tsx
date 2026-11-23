"use client";
import type { ReactNode } from "react";
import { motion, useReducedMotion } from "motion/react";
import { Figure } from "@kettleworth/ui";
import { arcCast, arcSrc, arcSrcSet, type ArcCast } from "@/lib/arc-art";

/**
 * Arc's screen head.
 *
 * Ported from Locomotive (design/refs/dna-locomotive/scrolled.png), whose head is not a stack:
 * a hard-edged image sits in the frame and the labels are scattered around it, one up and to
 * the left, one offset lower, the date opposite, a hairline rule and an arrow in the bottom
 * corner. Carbon's head does the opposite on purpose, a full-bleed photograph with the figure
 * carried beneath it, which is why this is a different component rather than a variant.
 *
 * The figure is still the largest thing on the screen. The character is the room it stands in.
 *
 * Motion, within the budget of two signatures: the image arrives by a hard wipe from the
 * right rather than a fade, and the speed lines behind it draw themselves left to right. Both
 * are gated by useReducedMotion, and neither moves again once it has landed.
 */
export function ArcHead({
  eyebrow,
  label,
  value,
  title,
  unit,
  decimals,
  second,
  children,
  episode,
  cast,
  priority,
}: {
  eyebrow: string;
  label: string;
  value?: number | string;
  title?: string;
  unit?: string;
  decimals?: number;
  second?: ReactNode;
  children?: ReactNode;
  /** The episode this screen is opening on, when the screen knows one. */
  episode?: number;
  cast?: ArcCast;
  priority?: boolean;
}) {
  const reduce = useReducedMotion();
  const who = cast ?? arcCast(label);
  const wipe = reduce
    ? {}
    : { initial: { clipPath: "inset(0 0 0 100%)", x: 24 }, animate: { clipPath: "inset(0 0 0 0%)", x: 0 }, transition: { duration: 0.62, ease: [0.25, 1, 0.5, 1] as const } };

  return (
    <section aria-label={label} className="relative border-b border-rule">
      <div className="relative mx-auto w-full max-w-[1200px] px-4 pb-5 pt-20 sm:px-6">
        {/* Scattered, not stacked: the date up and to the left, the episode opposite it. */}
        <div className="flex items-baseline justify-between gap-4 border-b border-rule pb-2">
          <p className="meta">{eyebrow}</p>
          {episode != null ? <p className="meta">Ep. {String(episode).padStart(2, "0")}</p> : null}
        </div>

        {/*
          An L: the character top right, the figure bottom left, crossing it on the diagonal.
          They are meant to overlap at the corner, which is the collage Locomotive makes of an
          image and its labels; what they must not do is sit on top of each other, so the text
          column is held to a width that clears the body.
        */}
        <div className="relative mt-3 min-h-[330px] sm:min-h-[400px]">
          {/* Speed lines, behind the figure, drawing themselves outward. Hairlines, so they
              read as drawn marks rather than as a gradient. */}
          <svg aria-hidden viewBox="0 0 100 60" preserveAspectRatio="none" className="pointer-events-none absolute right-0 top-4 h-[60%] w-[70%] text-rule">
            {[4, 12, 21, 31, 42, 51].map((y, i) => (
              <motion.line
                key={y}
                x1={100}
                y1={y}
                x2={12 + i * 7}
                y2={y}
                stroke="currentColor"
                strokeWidth={0.4}
                vectorEffect="non-scaling-stroke"
                initial={reduce ? undefined : { pathLength: 0, opacity: 0 }}
                animate={reduce ? undefined : { pathLength: 1, opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.12 + i * 0.05, ease: "easeOut" }}
              />
            ))}
          </svg>

          <motion.img
            {...wipe}
            src={arcSrc(who)}
            srcSet={arcSrcSet(who)}
            sizes="(max-width: 640px) 62vw, 400px"
            alt=""
            aria-hidden
            fetchPriority={priority ? "high" : undefined}
            decoding="async"
            className="pointer-events-none absolute right-0 top-0 h-[270px] w-auto max-w-[66%] select-none object-contain object-top sm:h-[340px]"
          />

          {/* The screen's own name, set down the left edge the way Locomotive runs a caps
              label vertically beside its image. */}
          <p className="meta absolute bottom-0 left-0 [writing-mode:vertical-rl] rotate-180">{label}</p>

          {/* The figure, overlapping the image at the corner rather than sitting under it. */}
          <div className="absolute bottom-0 left-0 z-10 max-w-[76%] pl-6">
            {value != null ? (
              <Figure labelAs="h1" label={label} value={value} unit={unit} decimals={decimals} labelHidden />
            ) : (
              <h1 className="font-display text-4xl leading-none tracking-tightest">{title}</h1>
            )}
            {second ? <p className="mt-2 max-w-[22ch] font-display text-xl leading-tight">{second}</p> : null}
          </div>
        </div>

        <div className="mt-4 flex items-end justify-between gap-4 border-t border-rule pt-2">
          <p className="meta">Kettleworth</p>
          <span aria-hidden className="font-display text-xl leading-none">&#8599;</span>
        </div>
        {children}
      </div>
    </section>
  );
}
