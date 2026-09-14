"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Dumbbell, BookOpen, TrendingUp, Salad, Settings, Watch, MessageCircle } from "lucide-react";
import { cn, Logo } from "@kettleworth/ui";

const items = [
  { href: "/app", label: "Today", icon: Home },
  { href: "/app/coach", label: "Coach", icon: MessageCircle },
  { href: "/app/programme", label: "Programme", icon: Dumbbell },
  { href: "/app/progress", label: "Progress", icon: TrendingUp },
  { href: "/app/nutrition", label: "Nutrition", icon: Salad },
];
const secondary = [
  { href: "/library", label: "Library", icon: BookOpen },
  { href: "/app/connected", label: "Connected apps", icon: Watch },
  { href: "/app/settings", label: "Settings", icon: Settings },
];

export function AppNav({ name }: { name: string }) {
  const path = usePathname();
  const active = (href: string) => (href === "/app" ? path === "/app" : path.startsWith(href));
  return (
    <>
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-60 flex-col border-r border-border bg-bg-elevated px-4 py-5 lg:flex">
        <Link href="/app" aria-label="Kettleworth" className="mb-8 px-2"><Logo /></Link>
        <nav aria-label="Main" className="flex flex-1 flex-col gap-1">
          {items.map((i) => (<Link key={i.href} href={i.href} aria-current={active(i.href) ? "page" : undefined} className={cn("flex h-10 items-center gap-3 rounded-md px-3 text-sm font-medium transition-colors", active(i.href) ? "bg-ember-soft text-fg" : "text-fg-muted hover:bg-surface-2 hover:text-fg")}><i.icon className={cn("size-4", active(i.href) && "text-ember")} />{i.label}</Link>))}
          <div className="my-3 h-px bg-border" />
          {secondary.map((i) => (<Link key={i.href} href={i.href} aria-current={active(i.href) ? "page" : undefined} className={cn("flex h-10 items-center gap-3 rounded-md px-3 text-sm font-medium transition-colors", active(i.href) ? "bg-ember-soft text-fg" : "text-fg-muted hover:bg-surface-2 hover:text-fg")}><i.icon className="size-4" />{i.label}</Link>))}
        </nav>
        <div className="truncate px-3 text-xs text-fg-subtle">Signed in as {name}</div>
      </aside>
      <nav aria-label="Main" className="fixed inset-x-0 bottom-0 z-30 glass pb-[env(safe-area-inset-bottom)] lg:hidden">
        <div className="grid grid-cols-5">
          {items.map((i) => (<Link key={i.href} href={i.href} aria-current={active(i.href) ? "page" : undefined} className={cn("flex h-14 flex-col items-center justify-center gap-1 text-2xs font-medium", active(i.href) ? "text-ember" : "text-fg-muted")}><i.icon className="size-5" />{i.label}</Link>))}
        </div>
      </nav>
    </>
  );
}
