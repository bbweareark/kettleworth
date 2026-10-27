import Link from "next/link";
import { BrandMark } from "@kettleworth/ui";

/**
 * Bold, after Reality Is__ (design/refs/footer-reality-is), which footer.design files under
 * Bold: no columns, six links, zero card-like surfaces, and the highest contrast on the page.
 *
 * Two deliberate differences from that reference, both recorded in design/SECTION-MAP.md:
 *   - the wordmark is set once at display size and left in the flow, not blown up to bleed off
 *     the edge. Four apps in this portfolio already close on a giant clipped wordmark and the
 *     previous Kettleworth build was one of them;
 *   - a volt hairline runs above it, which is the one place in the app the accent is used as a
 *     rule rather than as a fill. It marks the end of the page.
 */
const LINKS = [
  { href: "/#method", label: "Method" },
  { href: "/library", label: "Library" },
  { href: "/sign-up", label: "Start free" },
  { href: "/sign-in", label: "Sign in" },
  { href: "/privacy", label: "Privacy" },
  { href: "/terms", label: "Terms" },
];

export function SiteFooter() {
  return (
    <footer className="mt-section">
      <div aria-hidden className="h-px bg-volt" />
      <div className="mx-auto w-full max-w-[1200px] px-4 py-12 sm:px-6">
        <div className="flex flex-col gap-10 md:flex-row md:items-end md:justify-between">
          <div>
            <BrandMark size={22} />
            <p className="mt-4 font-display text-3xl leading-none">kettleworth</p>
            <p className="measure mt-3 text-sm text-fg-muted">
              One block, written around you, that moves when you do.
            </p>
          </div>
          <nav aria-label="Footer">
            <ul className="grid grid-cols-2 gap-x-10 gap-y-2.5 sm:grid-cols-3">
              {LINKS.map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="text-sm text-fg-muted transition-colors hover:text-fg">{l.label}</Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>

        <div className="mt-10 flex flex-col gap-3 border-t border-rule pt-5 md:flex-row md:items-start md:justify-between">
          <p className="measure text-xs text-fg-subtle">
            Not medical advice. Talk to a professional before starting a new programme,
            especially with a medical condition.
          </p>
          <span className="meta">&copy; {new Date().getFullYear()}</span>
        </div>
      </div>
    </footer>
  );
}
