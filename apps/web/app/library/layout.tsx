import Link from "next/link";
import { Button, Logo } from "@kettleworth/ui";
import { getSession } from "@/lib/session";
export default async function LibraryLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  return (
    <div className="min-h-dvh">
      <header className="sticky top-0 z-40 glass"><div className="page flex h-16 items-center justify-between"><Link href="/" aria-label="Kettleworth"><Logo /></Link><div className="flex items-center gap-2">{session ? <Button asChild variant="secondary"><Link href="/app">Open app</Link></Button> : <Button asChild><Link href="/sign-up">Get started</Link></Button>}</div></div></header>
      <main className="page py-8">{children}</main>
    </div>
  );
}
