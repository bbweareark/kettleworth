import Link from "next/link";
import { BrandMark } from "@kettleworth/ui";
import { requireUser } from "@/lib/session";
import { AppNav, MoreMenu } from "@/components/app/nav";
import { TimeZoneCookie } from "@/components/app/timezone-cookie";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();
  return (
    <div className="min-h-dvh">
      <TimeZoneCookie />
      <AppNav name={user.name} />
      <header className="sticky top-0 z-30 border-b border-rule bg-bg lg:hidden">
        <div className="flex h-12 items-center justify-between pl-4 pr-1">
          <Link href="/app" aria-label="Kettleworth" className="flex items-center gap-2">
            <BrandMark size={14} />
            <span className="font-display text-sm">kettleworth</span>
          </Link>
          <MoreMenu />
        </div>
      </header>
      <main className="mx-auto w-full max-w-[1200px] px-4 pb-24 pt-5 sm:px-6 lg:pb-12 lg:pt-8">{children}</main>
    </div>
  );
}
