import Link from "next/link";
import { BrandMark } from "@kettleworth/ui";

/**
 * Grid footer on the inverted band, replicated from teenage.engineering's own footer
 * (measured: 7 columns, 96px tall, 7 tiny links, dark band, largest text 19px weight 300).
 *
 * Explicitly not a giant clipped wordmark: four of this owner's six apps already close on
 * one, and the previous Kettleworth build was among them.
 */
const COLUMNS: { head: string; links: { href: string; label: string }[] }[] = [
  { head: "Training", links: [{ href: "/#week", label: "The week" }, { href: "/#block", label: "The block" }, { href: "/#method", label: "Method" }] },
  { head: "Library", links: [{ href: "/library", label: "850 movements" }, { href: "/library?q=squat", label: "Search" }] },
  { head: "Account", links: [{ href: "/sign-up", label: "Start free" }, { href: "/sign-in", label: "Sign in" }] },
  { head: "Legal", links: [{ href: "/privacy", label: "Privacy" }, { href: "/terms", label: "Terms" }, { href: "mailto:hello@kettleworth.app", label: "Contact" }] },
];

export function SiteFooter() {
  return (
    <footer className="band mt-section">
      <div className="mx-auto w-full max-w-[1200px] px-4 py-10 sm:px-6">
        <div className="grid grid-cols-2 gap-x-6 gap-y-8 sm:grid-cols-4">
          {COLUMNS.map((c) => (
            <div key={c.head}>
              <p className="meta mb-2.5 text-band-fg/55">{c.head}</p>
              <ul className="space-y-1.5">
                {c.links.map((l) => (
                  <li key={l.href}>
                    <Link href={l.href} className="text-sm text-band-fg/80 transition-colors duration-(--dur-fast) hover:text-band-fg">
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-10 flex flex-col gap-4 border-t border-band-fg/15 pt-5 text-xs text-band-fg/55 md:flex-row md:items-start md:justify-between">
          <span className="flex items-center gap-2">
            <BrandMark size={14} />
            kettleworth
          </span>
          <p className="measure">
            Not medical advice. Talk to a professional before starting a new programme,
            especially with a medical condition.
          </p>
          <span>&copy; {new Date().getFullYear()}</span>
        </div>
      </div>
    </footer>
  );
}
