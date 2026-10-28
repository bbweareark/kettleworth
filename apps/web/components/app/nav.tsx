"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { Home, Dumbbell, TrendingUp, Salad, MessageCircle, Menu, X } from "lucide-react";
import { cn, BrandMark } from "@kettleworth/ui";
import { useHideOnScroll } from "@/lib/use-hide-on-scroll";

/**
 * Five tabs at the thumb, and a full-screen menu behind a pill for everything else.
 *
 * The tab strip is the owner's call and it is the right one: five destinations that are always
 * one tap away, where the hand already is. What it could never do was carry nine, so the
 * previous build hid Community, the Library, connected apps and Settings behind a "+" in the
 * header that read as an add button.
 *
 * So the overflow is now a full-screen menu, ported from Clonix (design/refs/navbar-clonix):
 * one oversized item per row, bottom-aligned so the furthest item is still inside the reach
 * arc of a hand holding the phone. Its trigger is the pill at the top right, which floats over
 * the content rather than sitting in a bar - that part is Integrated Biosciences' own nav.
 */
const PRIMARY = [
  { href: "/app", label: "Today", icon: Home },
  { href: "/app/programme", label: "Programme", icon: Dumbbell },
  { href: "/app/progress", label: "Progress", icon: TrendingUp },
  { href: "/app/nutrition", label: "Nutrition", icon: Salad },
  { href: "/app/coach", label: "Coach", icon: MessageCircle },
];
const SECONDARY = [
  { href: "/app/community", label: "Community" },
  { href: "/library", label: "Library" },
  { href: "/app/connected", label: "Connected apps" },
  { href: "/app/settings", label: "Settings" },
];

function useActive() {
  const path = usePathname();
  return (href: string) => (href === "/app" ? path === "/app" : path.startsWith(href));
}

export function AppNav({ name }: { name: string }) {
  const [open, setOpen] = useState(false);
  const active = useActive();
  const reduce = useReducedMotion();
  const hidden = useHideOnScroll();
  const path = usePathname();
  /*
   * Onboarding is a corridor, not a destination: there is nothing to navigate to until the
   * profile exists, and every other screen redirects back here anyway. Showing the tab strip
   * there offered five dead ends and stole 64px from the questions.
   */
  const corridor = path.startsWith("/app/onboarding");

  // While the menu is open, hold the page still behind it.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.removeEventListener("keydown", onKey); document.body.style.overflow = prev; };
  }, [open]);

  const all = [...PRIMARY, ...SECONDARY];
  const here = all.find((i) => active(i.href))?.label ?? "Menu";

  if (corridor) return null;

  return (
    <>
      {/* The floating pill group: wordmark left, menu right, over the content. */}
      <div className={cn("pointer-events-none fixed inset-x-0 top-0 z-40 transition-transform duration-300 ease-out", hidden && "-translate-y-[calc(100%+1rem)]")}>
        <div className="mx-auto flex w-full max-w-[1200px] items-center justify-between px-4 pt-[max(0.75rem,env(safe-area-inset-top))] sm:px-6">
          <Link
            href="/app"
            aria-label="Kettleworth, today"
            className="pointer-events-auto inline-flex h-11 items-center gap-2 rounded-full border border-rule bg-surface/90 pl-3.5 pr-4 backdrop-blur-sm transition-colors hover:border-rule-strong"
          >
            <BrandMark size={14} />
            <span className="font-display text-sm">kettleworth</span>
          </Link>
          <button
            type="button"
            onClick={() => setOpen(true)}
            aria-expanded={open}
            aria-label={`More. You are on ${here}`}
            className="pointer-events-auto inline-flex h-11 items-center gap-2 rounded-full border border-rule bg-surface/90 pl-4 pr-3.5 backdrop-blur-sm transition-colors hover:border-rule-strong"
          >
            <span className="meta hidden sm:block">More</span>
            <Menu className="size-4" strokeWidth={1.75} aria-hidden />
          </button>
        </div>
      </div>

      {/* Desktop: the five as a pill group, so a wide screen is not driven from a phone bar. */}
      <nav aria-label="Primary" className={cn("pointer-events-none fixed inset-x-0 top-0 z-30 hidden transition-transform duration-300 ease-out lg:block", hidden && "-translate-y-[calc(100%+1rem)]")}>
        <div className="mx-auto flex w-full max-w-[1200px] justify-center pt-3">
          <div className="pointer-events-auto flex items-center gap-1 rounded-full border border-rule bg-surface/90 p-1 backdrop-blur-sm">
            {PRIMARY.map((i) => {
              const on = active(i.href);
              return (
                <Link
                  key={i.href}
                  href={i.href}
                  aria-current={on ? "page" : undefined}
                  className={cn("inline-flex h-9 items-center rounded-full px-4 text-sm transition-colors", on ? "bg-fg text-bg" : "text-fg-muted hover:text-fg")}
                >
                  {i.label}
                </Link>
              );
            })}
          </div>
        </div>
      </nav>

      {/* Phone: the tab strip, at the thumb. */}
      <nav aria-label="Primary" className="fixed inset-x-0 bottom-0 z-30 border-t border-rule bg-bg pb-[env(safe-area-inset-bottom)] lg:hidden">
        <div className="grid grid-cols-5">
          {PRIMARY.map((i) => {
            const on = active(i.href);
            return (
              <Link
                key={i.href}
                href={i.href}
                aria-current={on ? "page" : undefined}
                className={cn(
                  "flex h-16 flex-col items-center justify-center gap-1.5 transition-colors",
                  on ? "text-fg" : "text-fg-subtle",
                )}
              >
                <span className={cn("grid size-8 place-items-center rounded-full transition-colors", on && "bg-volt text-volt-fg")}>
                  <i.icon className="size-4" strokeWidth={1.75} aria-hidden />
                </span>
                <span className="meta">{i.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>

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
            aria-label="More"
          >
            <div className="mx-auto flex w-full max-w-[1200px] items-center justify-between px-4 pt-[max(0.75rem,env(safe-area-inset-top))] sm:px-6">
              <span className="inline-flex h-11 items-center gap-2">
                <BrandMark size={14} />
                <span className="font-display text-sm">kettleworth</span>
              </span>
              <button
                type="button"
                autoFocus
                onClick={() => setOpen(false)}
                aria-label="Close menu"
                className="inline-flex size-11 items-center justify-center rounded-full border border-rule bg-surface transition-colors hover:border-rule-strong"
              >
                <X className="size-4" strokeWidth={1.75} aria-hidden />
              </button>
            </div>

            <nav aria-label="More" className="mx-auto flex w-full max-w-[1200px] flex-1 flex-col justify-end overflow-y-auto px-4 pb-[max(1.5rem,env(safe-area-inset-bottom))] sm:px-6 lg:justify-center">
              <ul className="w-full">
                {SECONDARY.map((i, n) => {
                  const on = active(i.href);
                  return (
                    <motion.li
                      key={i.href}
                      initial={reduce ? false : { opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: reduce ? 0 : 0.04 + n * 0.028, duration: 0.3, ease: [0.25, 1, 0.5, 1] }}
                      className="border-b border-rule"
                    >
                      <Link
                        href={i.href}
                        onClick={() => setOpen(false)}
                        aria-current={on ? "page" : undefined}
                        className={cn(
                          "flex items-baseline justify-between gap-4 py-3.5 font-display text-2xl transition-colors",
                          on ? "text-volt" : "text-fg hover:text-fg-muted",
                        )}
                      >
                        {i.label}
                        <span className="meta">{String(n + 1).padStart(2, "0")}</span>
                      </Link>
                    </motion.li>
                  );
                })}
              </ul>
              <p className="meta mt-6">Signed in as {name}</p>
            </nav>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </>
  );
}
