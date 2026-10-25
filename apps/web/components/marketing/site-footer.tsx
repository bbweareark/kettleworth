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

      {/* The wordmark closes the page the way the DNA closes a product reveal: oversized
          and clipped at the baseline. Outlined from Clash Display 600 rather than set as
          live text, so it can never render in a fallback face at a forced width.
          Decorative, so it is hidden from assistive tech. */}
      <div aria-hidden className="pointer-events-none select-none overflow-hidden px-4 sm:px-6">
        <svg viewBox="0 0 7829 690" className="mx-auto -mb-[1.5%] block w-full max-w-6xl" role="presentation" focusable="false">
          <path transform="translate(-40 680)" className="fill-fg/[0.05]" d="M190 0H40V-670H190V-404H357L535 -670H715L482 -340L712 0H532L359 -258H190Z M1320 0H753V-670H1320V-535H903V-404H1305V-270H903V-135H1320Z M1761 0H1611V-535H1362V-670H2010V-535H1761Z M2437 0H2287V-535H2038V-670H2686V-535H2437Z M3289 0H2740V-670H2890V-135H3289Z M3916 0H3349V-670H3916V-535H3499V-404H3901V-270H3499V-135H3916Z M4336 0H4113L3955 -670H4123L4204 -290L4227 -143H4238L4269 -290L4381 -670H4604L4715 -290L4746 -143H4757L4780 -290L4861 -670H5025L4866 0H4643L4543 -335L4496 -528H4485L4438 -335Z M5422 10Q5256 10 5159 -84Q5062 -178 5062 -335Q5062 -492 5159 -586Q5256 -680 5422 -680Q5591 -680 5688.5 -586.5Q5786 -493 5786 -335Q5786 -177 5688.5 -83.5Q5591 10 5422 10ZM5266 -179Q5311 -134 5422 -134Q5533 -134 5579.5 -179Q5626 -224 5626 -335Q5626 -446 5579.5 -491Q5533 -536 5422 -536Q5311 -536 5266 -491Q5221 -446 5221 -335Q5221 -224 5266 -179Z M6001 0H5851V-670H6221Q6345 -670 6412.5 -617.5Q6480 -565 6480 -469Q6480 -301 6291 -283V-275Q6333 -264 6355.5 -242Q6378 -220 6399 -180L6496 0H6322L6230 -174Q6209 -214 6183 -228.5Q6157 -243 6100 -243H6001ZM6001 -535V-356H6220Q6275 -356 6299 -375.5Q6323 -395 6323 -446Q6323 -495 6298.5 -515Q6274 -535 6220 -535Z M6916 0H6766V-535H6517V-670H7165V-535H6916Z M7369 0H7219V-670H7369V-404H7719V-670H7869V0H7719V-269H7369Z" />
        </svg>
      </div>
    </footer>
  );
}
