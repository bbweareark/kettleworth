"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Home, Dumbbell, BookOpen, TrendingUp, Salad, Settings, Watch, MessageCircle, Users, Plus, X } from "lucide-react";
import { cn, BrandMark } from "@kettleworth/ui";

/**
 * The app nav in the sheet's own language: a ruled row of labels, not a glass bar of pills.
 *
 * The current page is marked by a heavy rule under its label, which is the only structural
 * device this system has. The accent stays reserved for the primary action, so the current
 * page is black-on-ground rather than accent-coloured.
 */
const PRIMARY = [
  { href: "/app", label: "Today", icon: Home },
  { href: "/app/programme", label: "Programme", icon: Dumbbell },
  { href: "/app/progress", label: "Progress", icon: TrendingUp },
  { href: "/app/nutrition", label: "Nutrition", icon: Salad },
  { href: "/app/coach", label: "Coach", icon: MessageCircle },
];
const SECONDARY = [
  { href: "/app/community", label: "Community", icon: Users },
  { href: "/library", label: "Library", icon: BookOpen },
  { href: "/app/connected", label: "Connected apps", icon: Watch },
  { href: "/app/settings", label: "Settings", icon: Settings },
];

function useActive() {
  const path = usePathname();
  return (href: string) => (href === "/app" ? path === "/app" : path.startsWith(href));
}

/** Desktop: a single ruled row across the top. The sheet has no sidebar. */
export function AppNav({ name }: { name: string }) {
  const active = useActive();
  return (
    <>
      <div className="hidden border-b border-rule lg:block">
        <div className="mx-auto flex w-full max-w-[1200px] items-stretch gap-8 px-6">
          <Link href="/app" aria-label="Kettleworth" className="flex items-center gap-2 py-3">
            <BrandMark size={16} />
            <span className="font-display text-base">kettleworth</span>
          </Link>
          <nav aria-label="Primary" className="flex items-stretch gap-6">
            {PRIMARY.map((i) => (
              <Link
                key={i.href}
                href={i.href}
                aria-current={active(i.href) ? "page" : undefined}
                className={cn(
                  "flex items-center border-b-2 py-3 text-sm transition-colors duration-(--dur-fast)",
                  active(i.href) ? "border-rule-strong text-fg" : "border-transparent text-fg-muted hover:text-fg",
                )}
              >
                {i.label}
              </Link>
            ))}
          </nav>
          <nav aria-label="Secondary" className="ml-auto flex items-stretch gap-5">
            {SECONDARY.map((i) => (
              <Link
                key={i.href}
                href={i.href}
                aria-current={active(i.href) ? "page" : undefined}
                className={cn(
                  "flex items-center border-b-2 py-3 text-xs transition-colors duration-(--dur-fast)",
                  active(i.href) ? "border-rule-strong text-fg" : "border-transparent text-fg-subtle hover:text-fg",
                )}
              >
                {i.label}
              </Link>
            ))}
          </nav>
        </div>
      </div>

      {/* Phone: a ruled tab strip pinned to the bottom. Labels, no chrome. */}
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
                  "flex h-14 flex-col items-center justify-center gap-1 border-t-2 text-[0.625rem] uppercase tracking-label transition-colors duration-(--dur-fast)",
                  on ? "border-rule-strong text-fg" : "border-transparent text-fg-subtle",
                )}
              >
                <i.icon className="size-4" strokeWidth={1.5} />
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
  const [open, setOpen] = useState(false);
  const active = useActive();
  return (
    <>
      <button type="button" aria-label="More" aria-expanded={open} onClick={() => setOpen(true)} className="grid size-11 place-items-center text-fg">
        <Plus className="size-5" strokeWidth={1.5} />
      </button>
      {open && (
        <div className="fixed inset-0 z-50 bg-bg">
          <div className="flex items-center justify-between border-b border-rule px-4 py-3">
            <span className="meta">More</span>
            <button type="button" aria-label="Close" onClick={() => setOpen(false)} className="grid size-11 place-items-center"><X className="size-5" /></button>
          </div>
          <ul className="px-4">
            {SECONDARY.map((i) => (
              <li key={i.href}>
                <Link
                  href={i.href}
                  onClick={() => setOpen(false)}
                  aria-current={active(i.href) ? "page" : undefined}
                  className="flex h-14 items-center gap-3 border-b border-rule font-display text-xl"
                >
                  <i.icon className="size-4" strokeWidth={1.5} />{i.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </>
  );
}
