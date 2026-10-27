import type { ReactNode } from "react";
import { Figure, cn } from "@kettleworth/ui";
import { Unmask } from "@/components/motion/unmask";

/**
 * The screen head, every screen, the same shape.
 *
 * Ported from Lando Norris (design/refs/hero-lando-norris/scrolled.png): a photograph that
 * bleeds edge to edge with no border and no radius, and the figure carried on black directly
 * beneath it rather than set over the image. Text over photography is the easiest way to lose
 * a hero, and this reference refuses to do it - the image is the atmosphere, the number is
 * the content.
 *
 * It is deliberately one component used by Today, Programme, Progress, Nutrition, Community
 * and the Coach, because the through-line in design/SECTION-MAP.md is that every screen
 * answers one question with one number. Nine screens that each invent their own head is how
 * the previous build ended up with no hierarchy of heat anywhere.
 */
export function ScreenHero({
  art,
  eyebrow,
  label,
  value,
  /** A display line instead of a figure, for the two screens that answer with words. */
  title,
  unit,
  decimals,
  /** The accented line under the figure. One per screen, and it carries the only volt text. */
  second,
  children,
  short,
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
  /** A shallower crop, for screens whose content starts immediately. */
  short?: boolean;
  priority?: boolean;
}) {
  return (
    /*
      Rendered as a sibling of the content column, not inside it: the photograph spans the
      whole canvas and the block beneath re-establishes the 1200px column. A negative gutter
      cannot do this - it reaches 24px, so on a wide screen the bleed stopped short of the
      canvas edge and the rounded top corner it is meant to fill never appeared.
    */
    <section aria-label={label}>
      <div className="relative w-full overflow-hidden lg:rounded-t-xl">
        <Unmask
          src={art}
          priority={priority}
          className={cn(
            "w-full object-cover",
            short ? "aspect-[16/9] sm:aspect-[21/9] lg:aspect-[32/9]" : "aspect-[5/4] sm:aspect-[16/9] lg:aspect-[2.6/1]",
          )}
        />
        {/* The scrim does two jobs: it keeps the photograph from competing with the figure, and
            it dissolves the bottom edge into the ground so the two read as one surface. */}
        <div aria-hidden className="scrim absolute inset-0" />
        <p className="meta absolute inset-x-0 bottom-3 mx-auto max-w-[1200px] px-4 sm:px-6">{eyebrow}</p>
      </div>
      <div className="mx-auto w-full max-w-[1200px] px-4 sm:px-6">
        {value != null ? (
          <Figure labelAs="h1" label={label} value={value} unit={unit} decimals={decimals} className="pt-4" />
        ) : (
          <div className="pt-4">
            <p className="meta">{label}</p>
            <h1 className="mt-1 font-display text-3xl">{title}</h1>
          </div>
        )}
        {second ? <p className="mt-2 font-display text-xl text-volt">{second}</p> : null}
        {children}
      </div>
    </section>
  );
}
