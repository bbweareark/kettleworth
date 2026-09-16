import Link from "next/link";
import { Settings } from "lucide-react";
import { Logo } from "@kettleworth/ui";
import { requireUser } from "@/lib/session";
import { AppNav } from "@/components/app/nav";
import { TimeZoneCookie } from "@/components/app/timezone-cookie";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();
  return (
    <div className="min-h-dvh lg:pl-60">
      <TimeZoneCookie />
      <AppNav name={user.name} />
      <header className="sticky top-0 z-20 glass lg:hidden">
        <div className="flex h-14 items-center justify-between px-4"><Link href="/app" aria-label="Kettleworth"><Logo size={24} /></Link><Link href="/app/settings" aria-label="Settings" className="rounded-md p-2 text-fg-muted hover:text-fg"><Settings className="size-5" /></Link></div>
      </header>
      <main className="page pb-24 pt-6 lg:pb-12 lg:pt-8">{children}</main>
    </div>
  );
}
