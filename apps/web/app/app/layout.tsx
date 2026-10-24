import Link from "next/link";
import { Logo } from "@kettleworth/ui";
import { requireUser } from "@/lib/session";
import { AppNav, MoreMenu } from "@/components/app/nav";
import { TimeZoneCookie } from "@/components/app/timezone-cookie";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();
  return (
    <div className="min-h-dvh lg:pl-60">
      <TimeZoneCookie />
      <AppNav name={user.name} />
      <header className="sticky top-0 z-30 border-b border-border bg-[color-mix(in_oklch,var(--color-bg)_85%,transparent)] backdrop-blur-xl lg:hidden">
        <div className="flex h-14 items-center justify-between pl-4 pr-2">
          <Link href="/app" aria-label="Kettleworth" className="rounded-md"><Logo size={24} /></Link>
          <MoreMenu />
        </div>
      </header>
      <main className="page pb-24 pt-6 lg:pb-12 lg:pt-8">{children}</main>
    </div>
  );
}
