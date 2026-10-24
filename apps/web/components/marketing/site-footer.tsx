import Link from "next/link";
import { Reveal } from "@/components/motion/reveal";

/**
 * Typographic footer (footer.design taxonomy): the wordmark becomes the closing statement,
 * clipped at the baseline for tension, with links reduced to a thin row beneath a hairline.
 *
 * Shared by every public route. The legal pages used to have no footer at all, which made
 * them dead ends.
 */
const LINKS = [
  { href: "/library", label: "Exercise library" },
  { href: "/privacy", label: "Privacy" },
  { href: "/terms", label: "Terms" },
  { href: "mailto:hello@kettleworth.app", label: "Contact" },
];

export function SiteFooter() {
  return (
    <footer className="relative overflow-hidden border-t border-border">
      <div className="page pb-10 pt-14 md:pb-12 md:pt-20">
        <Reveal>
          <p className="eyebrow">Kettleworth</p>
          <p className="mt-4 max-w-md text-balance font-display text-2xl tracking-tighter md:text-3xl">
            Train on purpose. The plan adapts; the standard does not.
          </p>
        </Reveal>

        <nav aria-label="Footer" className="mt-10">
          <ul className="flex flex-wrap gap-x-8 gap-y-3">
            {LINKS.map((l) => (
              <li key={l.href}>
                <Link href={l.href} className="inline-flex h-11 items-center text-sm text-fg-muted transition-colors duration-(--dur-fast) hover:text-fg">
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <hr className="rule-dashed mt-6" />

        <div className="mt-6 flex flex-col gap-4 text-xs text-fg-subtle md:flex-row md:items-end md:justify-between">
          <p className="measure">
            Kettleworth is not medical advice. Talk to a professional before starting a new programme, especially with a medical condition.
          </p>
          <p className="shrink-0">&copy; {new Date().getFullYear()} Kettleworth</p>
        </div>
      </div>

      {/* The wordmark closes the page the way the DNA closes a product reveal: oversized and
          clipped at the baseline. Drawn as SVG with textLength so it fits the container
          exactly at every width and can never overflow. Decorative, so hidden from AT. */}
      <div aria-hidden className="pointer-events-none select-none overflow-hidden px-4 sm:px-6">
        <svg viewBox="0 0 1000 118" className="mx-auto -mb-[1.5%] block w-full max-w-6xl" role="presentation" focusable="false">
          <text
            x="0"
            y="118"
            textLength="1000"
            lengthAdjust="spacingAndGlyphs"
            fill="currentColor"
            className="fill-fg/[0.05] font-display text-[150px]"
          >
            KETTLEWORTH
          </text>
        </svg>
      </div>
    </footer>
  );
}
