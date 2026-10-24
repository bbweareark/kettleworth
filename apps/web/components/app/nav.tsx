"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Home, Dumbbell, BookOpen, TrendingUp, Salad, Settings, Watch, MessageCircle, Users, MoreHorizontal } from "lucide-react";
import { cn, Logo, Sheet, SheetClose, SheetContent, SheetTrigger } from "@kettleworth/ui";

/**
 * Side Bar on desktop, Tabs on phones (navbar.gallery taxonomy).
 *
 * Accent discipline: the current page is marked by an ember rail, not an ember fill, so the
 * only filled ember on screen is still the primary action.
 *
 * The four secondary destinations used to be desktop-only, which left Community and
 * Connected apps unreachable on a phone. They now live in a More sheet on the app bar.
 */
const PRIMARY = [
  { href: "/app", label: "Today", icon: Home },
  { href: "/app/coach", label: "Coach", icon: MessageCircle },
  { href: "/app/programme", label: "Programme", icon: Dumbbell },
  { href: "/app/progress", label: "Progress", icon: TrendingUp },
  { href: "/app/nutrition", label: "Nutrition", icon: Salad },
];
const SECONDARY = [
  { href: "/app/community", label: "Community", icon: Users },
  { href: "/library", label: "Library", icon: BookOpen },
  { href: "/app/connected", label: "Connected apps", icon: Watch },
  { href: "/app/settings", label: "Settings", icon: Settings },
];

export function useIsActive() {
  const path = usePathname();
  return (href: string) => (href === "/app" ? path === "/app" : path.startsWith(href));
}

export function AppNav({ name }: { name: string }) {
  const active = useIsActive();
  const row = (i: (typeof PRIMARY)[number], isActive: boolean) => (
    <Link
      key={i.href}
      href={i.href}
      aria-current={isActive ? "page" : undefined}
      className={cn(
        "relative flex h-11 items-center gap-3 rounded-lg px-3 text-sm font-medium transition-colors duration-(--dur-fast)",
        isActive ? "bg-surface-2 text-fg" : "text-fg-muted hover:bg-surface-2 hover:text-fg",
      )}
    >
      {isActive && <span aria-hidden className="absolute inset-y-2 left-0 w-0.5 rounded-full bg-ember" />}
      <i.icon className={cn("size-[1.125rem]", isActive && "text-ember")} />
      {i.label}
    </Link>
  );

  return (
    <>
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-60 flex-col border-r border-border bg-[color-mix(in_oklch,var(--color-bg-elevated)_88%,transparent)] px-3 py-5 backdrop-blur-xl lg:flex">
        <Link href="/app" aria-label="Kettleworth" className="mb-8 px-3"><Logo /></Link>
        <nav aria-label="Primary" className="flex flex-col gap-1">
          {PRIMARY.map((i) => row(i, active(i.href)))}
        </nav>
        <hr className="rule-dashed my-4" />
        <nav aria-label="Secondary" className="flex flex-1 flex-col gap-1">
          {SECONDARY.map((i) => row(i, active(i.href)))}
        </nav>
        <p className="truncate px-3 text-xs text-fg-subtle">Signed in as {name}</p>
      </aside>

      <nav
        aria-label="Primary"
        className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-[color-mix(in_oklch,var(--color-bg)_85%,transparent)] pb-[env(safe-area-inset-bottom)] backdrop-blur-xl lg:hidden"
      >
        <div className="grid grid-cols-5">
          {PRIMARY.map((i) => {
            const isActive = active(i.href);
            return (
              <Link
                key={i.href}
                href={i.href}
                aria-current={isActive ? "page" : undefined}
                className={cn("relative flex h-14 flex-col items-center justify-center gap-1 text-2xs font-medium transition-colors duration-(--dur-fast)", isActive ? "text-fg" : "text-fg-muted")}
              >
                {isActive && <span aria-hidden className="absolute inset-x-5 top-0 h-0.5 rounded-full bg-ember" />}
                <i.icon className={cn("size-5", isActive && "text-ember")} />
                {i.label}
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}

/** The phone app bar's entry to everything that is not one of the five tabs. */
export function MoreMenu() {
  const active = useIsActive();
  const [open, setOpen] = useState(false);
  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <button type="button" aria-label="More" aria-expanded={open} className="grid size-11 place-items-center rounded-lg text-fg-muted transition-colors hover:bg-surface-2 hover:text-fg">
          <MoreHorizontal className="size-5" />
        </button>
      </SheetTrigger>
      <SheetContent title="More" side="bottom">
        <ul className="space-y-1 pb-2">
          {SECONDARY.map((i) => (
            <li key={i.href}>
              <SheetClose asChild>
                <Link
                  href={i.href}
                  aria-current={active(i.href) ? "page" : undefined}
                  className={cn("flex h-14 items-center gap-3 rounded-xl px-3 text-base font-medium transition-colors", active(i.href) ? "bg-surface-2 text-fg" : "text-fg-muted hover:bg-surface-2 hover:text-fg")}
                >
                  <i.icon className={cn("size-5", active(i.href) && "text-ember")} />
                  {i.label}
                </Link>
              </SheetClose>
            </li>
          ))}
        </ul>
      </SheetContent>
    </Sheet>
  );
}
