"use client";
import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import { BrandMark, cn } from "@kettleworth/ui";

/**
 * A permanent labelled row, replicated from teenage.engineering's own nav
 * (design/refs/dna-teenage-engineering/desktop.png).
 *
 * What the reference does and this does too: category headings with their sub-links always
 * visible rather than hidden behind hover, tiny light type, the wordmark set as plain text at
 * the same weight as everything else, and no call to action in the nav at all (measured: 25
 * links, 0 CTAs). It does not change on scroll, so there is no pill morph here either.
 */
const GROUPS = [
  { label: "Training", links: [{ href: "/#week", t: "The week" }, { href: "/#block", t: "The block" }, { href: "/#method", t: "Method" }] },
  { label: "Library", links: [{ href: "/library", t: "850 movements" }, { href: "/library?q=squat", t: "Search" }] },
  { label: "Account", links: [{ href: "/sign-in", t: "Sign in" }, { href: "/sign-up", t: "Start free" }] },
];

export function SiteHeader({ signedIn }: { signedIn: boolean }) {
  const [open, setOpen] = useState(false);
  const path = usePathname();
  const groups = signedIn
    ? GROUPS.map((g) => (g.label === "Account" ? { ...g, links: [{ href: "/app", t: "Open app" }] } : g))
    : GROUPS;

  return (
    <header className="border-b border-rule">
      <div className="mx-auto w-full max-w-[1200px] px-4 sm:px-6">
        <div className="flex items-start justify-between gap-8 py-4">
          <Link href="/" aria-label="Kettleworth home" className="flex shrink-0 items-start gap-2 pt-0.5">
            <BrandMark size={18} />
            <span className="font-display text-lg leading-[1.05]">
              kettle
              <br />
              worth
            </span>
          </Link>

          <nav aria-label="Primary" className="hidden gap-10 md:flex">
            {groups.map((g) => (
              <div key={g.label}>
                <p className="meta mb-1.5">{g.label}</p>
                <ul className="space-y-0.5">
                  {g.links.map((l) => (
                    <li key={l.href + l.t}>
                      <Link
                        href={l.href}
                        aria-current={path === l.href ? "page" : undefined}
                        className={cn(
                          "text-sm transition-colors duration-(--dur-fast) hover:text-fg",
                          path === l.href ? "text-fg" : "text-fg-muted",
                        )}
                      >
                        {l.t}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </nav>

          <button
            type="button"
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
            onClick={() => setOpen((v) => !v)}
            className="grid size-11 shrink-0 place-items-center text-fg md:hidden"
          >
            {open ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
        </div>
      </div>

      {open && (
        <nav aria-label="Primary mobile" className="border-t border-rule md:hidden">
          <div className="mx-auto w-full max-w-[1200px] px-4 py-2 sm:px-6">
            {groups.map((g) => (
              <div key={g.label} className="border-b border-rule py-3 last:border-b-0">
                <p className="meta mb-2">{g.label}</p>
                <ul>
                  {g.links.map((l) => (
                    <li key={l.href + l.t}>
                      <Link href={l.href} onClick={() => setOpen(false)} className="flex h-11 items-center font-display text-xl">
                        {l.t}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </nav>
      )}
    </header>
  );
}
