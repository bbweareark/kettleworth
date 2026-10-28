"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { Menu, X } from "lucide-react";
import { Button, BrandMark, cn } from "@kettleworth/ui";
import { useHideOnScroll } from "@/lib/use-hide-on-scroll";

/**
 * The same floating pill group and full-screen menu the app uses.
 *
 * Ported from Clonix (design/refs/navbar-clonix) for the overlay and from Integrated
 * Biosciences for the pill group that floats over the imagery rather than sitting in a bar.
 * It replaces the permanent three-column labelled row taken from teenage.engineering: that
 * row was 25 always-visible links and no call to action, which suited a catalogue of products
 * and did not suit a page whose job is to get one block written.
 *
 * Unlike the app's menu this one carries a call to action, because on a public page the next
 * step is the point.
 */
const LINKS = [
  { href: "/#week", label: "The week" },
  { href: "/#block", label: "The block" },
  { href: "/#method", label: "Method" },
  { href: "/library", label: "Library" },
];

export function SiteHeader({ signedIn }: { signedIn: boolean }) {
  const [open, setOpen] = useState(false);
  const path = usePathname();
  const reduce = useReducedMotion();
  const hidden = useHideOnScroll();
  const cta = signedIn ? { href: "/app", label: "Open app" } : { href: "/sign-up", label: "Start free" };

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.removeEventListener("keydown", onKey); document.body.style.overflow = prev; };
  }, [open]);

  return (
    <>
      <div className={cn("pointer-events-none fixed inset-x-0 top-0 z-40 transition-transform duration-300 ease-out", hidden && "-translate-y-[calc(100%+1rem)]")}>
        <div className="mx-auto flex w-full max-w-[1200px] items-center justify-between gap-3 px-4 pt-[max(0.75rem,env(safe-area-inset-top))] sm:px-6">
          <Link
            href="/"
            aria-label="Kettleworth home"
            className="pointer-events-auto inline-flex h-11 items-center gap-2 rounded-full border border-rule bg-surface/90 pl-3.5 pr-4 backdrop-blur-sm transition-colors hover:border-rule-strong"
          >
            <BrandMark size={14} />
            <span className="font-display text-sm">kettleworth</span>
          </Link>
          <div className="pointer-events-auto flex items-center gap-2">
            <Button asChild size="sm" className="hidden sm:inline-flex"><Link href={cta.href}>{cta.label}</Link></Button>
            <button
              type="button"
              onClick={() => setOpen(true)}
              aria-expanded={open}
              aria-label="Menu"
              className="inline-flex size-11 items-center justify-center rounded-full border border-rule bg-surface/90 backdrop-blur-sm transition-colors hover:border-rule-strong"
            >
              <Menu className="size-4" strokeWidth={1.75} aria-hidden />
            </button>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {open ? (
          <motion.div
            initial={reduce ? { opacity: 0 } : { opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={reduce ? { opacity: 0 } : { opacity: 0, y: -12 }}
            transition={{ duration: 0.28, ease: [0.25, 1, 0.5, 1] }}
            className="fixed inset-0 z-50 flex flex-col bg-bg"
            role="dialog"
            aria-modal="true"
            aria-label="Menu"
          >
            <div className="mx-auto flex w-full max-w-[1200px] items-center justify-between px-4 pt-[max(0.75rem,env(safe-area-inset-top))] sm:px-6">
              <span className="inline-flex h-11 items-center gap-2">
                <BrandMark size={14} />
                <span className="font-display text-sm">kettleworth</span>
              </span>
              <button type="button" autoFocus onClick={() => setOpen(false)} aria-label="Close menu" className="inline-flex size-11 items-center justify-center rounded-full border border-rule bg-surface transition-colors hover:border-rule-strong">
                <X className="size-4" strokeWidth={1.75} aria-hidden />
              </button>
            </div>

            <nav aria-label="Primary" className="mx-auto flex w-full max-w-[1200px] flex-1 flex-col justify-end overflow-y-auto px-4 pb-[max(1.5rem,env(safe-area-inset-bottom))] sm:px-6 lg:justify-center">
              <ul className="w-full">
                {LINKS.map((l, n) => (
                  <motion.li
                    key={l.href}
                    initial={reduce ? false : { opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: reduce ? 0 : 0.04 + n * 0.028, duration: 0.3, ease: [0.25, 1, 0.5, 1] }}
                    className="border-b border-rule"
                  >
                    <Link
                      href={l.href}
                      onClick={() => setOpen(false)}
                      aria-current={path === l.href ? "page" : undefined}
                      className={cn("flex items-baseline justify-between gap-4 py-3.5 font-display text-2xl transition-colors", path === l.href ? "text-volt" : "text-fg hover:text-fg-muted")}
                    >
                      {l.label}
                      <span className="meta">{String(n + 1).padStart(2, "0")}</span>
                    </Link>
                  </motion.li>
                ))}
              </ul>
              <div className="mt-6 flex flex-wrap gap-2">
                <Button asChild size="lg"><Link href={cta.href} onClick={() => setOpen(false)}>{cta.label}</Link></Button>
                {!signedIn ? <Button asChild size="lg" variant="secondary"><Link href="/sign-in" onClick={() => setOpen(false)}>Sign in</Link></Button> : null}
              </div>
            </nav>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </>
  );
}
