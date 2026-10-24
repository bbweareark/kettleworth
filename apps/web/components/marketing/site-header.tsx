"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu } from "lucide-react";
import { Button, Logo, Sheet, SheetClose, SheetContent, SheetTrigger, cn } from "@kettleworth/ui";

/**
 * Static navbar (navbar.gallery taxonomy), sticky and translucent, that detaches into a
 * floating pill once the reader is past the hero.
 *
 * One header for every public route, so /library and the legal pages stop diverging. The
 * mobile panel is a real sheet: Radix gives it the focus trap, Escape, backdrop dismissal
 * and body-scroll lock, and the links no longer simply vanish below 768px.
 */
const LINKS = [
  { href: "/#how", label: "How it works" },
  { href: "/#inside", label: "What's inside" },
  { href: "/library", label: "Exercise library" },
];

export function SiteHeader({ signedIn }: { signedIn: boolean }) {
  const [stuck, setStuck] = useState(false);
  const [open, setOpen] = useState(false);
  // One primary action per viewport: the nav CTA is the same action and label as the hero's,
  // so it only appears once the hero's has scrolled away. Pages with no hero show it at once.
  const [showCta, setShowCta] = useState(false);
  const path = usePathname();

  useEffect(() => {
    const heroCta = document.getElementById("hero-cta");
    if (!heroCta) { setShowCta(true); return; }
    const io = new IntersectionObserver(([e]) => setShowCta(!e!.isIntersecting), { threshold: 0 });
    io.observe(heroCta);
    return () => io.disconnect();
  }, [path]);

  useEffect(() => {
    const onScroll = () => setStuck(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const isCurrent = (href: string) => (href.startsWith("/#") ? false : path === href || path.startsWith(`${href}/`));
  const cta = signedIn ? { href: "/app", label: "Open app" } : { href: "/sign-up", label: "Start free" };

  return (
    <header className={cn("sticky top-0 z-40 transition-[padding] duration-(--dur-base) ease-out", stuck && "px-2 pt-2 sm:px-4 sm:pt-3")}>
      <div
        className={cn(
          "mx-auto flex items-center justify-between gap-4 transition-[max-width,background-color,border-radius,box-shadow,border-color] duration-(--dur-base) ease-out",
          "h-16 px-4 sm:px-6",
          stuck
            ? "max-w-5xl rounded-full border border-border bg-[color-mix(in_oklch,var(--color-bg)_78%,transparent)] shadow-pop backdrop-blur-xl backdrop-saturate-150"
            : "max-w-6xl border border-transparent bg-transparent",
        )}
      >
        <Link href="/" aria-label="Kettleworth home" className="shrink-0 rounded-md"><Logo /></Link>

        <nav className="hidden items-center gap-8 md:flex" aria-label="Primary">
          {LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              aria-current={isCurrent(l.href) ? "page" : undefined}
              className={cn("text-sm font-medium tracking-[-0.01em] transition-colors duration-(--dur-fast)", isCurrent(l.href) ? "text-fg" : "text-fg-muted hover:text-fg")}
            >
              {l.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          {!signedIn && <Button asChild variant="ghost" className="hidden md:inline-flex"><Link href="/sign-in">Sign in</Link></Button>}
          {/* Desktop only: on phones the sticky bar is the persistent primary action. */}
          <Button
            asChild
            className={cn("hidden transition-opacity duration-(--dur-base) md:inline-flex", showCta ? "opacity-100" : "pointer-events-none opacity-0")}
            inert={!showCta}
          >
            <Link href={cta.href}>{cta.label}</Link>
          </Button>

          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <button type="button" aria-label="Open menu" aria-expanded={open} className="grid size-11 place-items-center rounded-lg text-fg-muted transition-colors hover:bg-surface-2 hover:text-fg md:hidden">
                <Menu className="size-5" />
              </button>
            </SheetTrigger>
            <SheetContent title="Menu" side="bottom">
              <ul className="space-y-1 pb-2">
                {LINKS.map((l) => (
                  <li key={l.href}>
                    <SheetClose asChild>
                      <Link href={l.href} aria-current={isCurrent(l.href) ? "page" : undefined} className="flex h-14 items-center rounded-xl px-3 font-display text-2xl font-semibold tracking-tighter text-fg transition-colors hover:bg-surface-2">
                        {l.label}
                      </Link>
                    </SheetClose>
                  </li>
                ))}
              </ul>
              <hr className="rule-dashed my-3" />
              {!signedIn && (
                <SheetClose asChild>
                  <Link href="/sign-in" className="flex h-12 items-center rounded-xl px-3 text-sm font-medium text-fg-muted transition-colors hover:bg-surface-2 hover:text-fg">Sign in</Link>
                </SheetClose>
              )}
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
