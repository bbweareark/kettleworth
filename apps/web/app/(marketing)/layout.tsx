import Link from "next/link";
import { Button, Logo } from "@kettleworth/ui";
import { getSession } from "@/lib/session";

export default async function MarketingLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  return (
    <div className="min-h-dvh">
      <header className="sticky top-0 z-40 glass">
        <div className="page flex h-16 items-center justify-between">
          <Link href="/" aria-label="Kettleworth home"><Logo /></Link>
          <nav className="hidden items-center gap-6 text-sm text-fg-muted md:flex" aria-label="Primary">
            <a href="#how" className="hover:text-fg">How it works</a>
            <a href="#pillars" className="hover:text-fg">What's inside</a>
            <Link href="/library" className="hover:text-fg">Exercise library</Link>
          </nav>
          <div className="flex items-center gap-2">
            {session ? <Button asChild><Link href="/app">Open app</Link></Button> : (<><Button asChild variant="ghost"><Link href="/sign-in">Sign in</Link></Button><Button asChild><Link href="/sign-up">Get started</Link></Button></>)}
          </div>
        </div>
      </header>
      {children}
      <footer className="border-t border-border py-10">
        <div className="page flex flex-col items-start justify-between gap-6 text-sm text-fg-muted md:flex-row md:items-center">
          <Logo size={22} />
          <div className="flex flex-wrap gap-x-6 gap-y-2"><Link href="/privacy" className="hover:text-fg">Privacy</Link><Link href="/terms" className="hover:text-fg">Terms</Link><Link href="/library" className="hover:text-fg">Library</Link><a href="mailto:hello@kettleworth.app" className="hover:text-fg">Contact</a></div>
          <p className="text-xs text-fg-subtle">Kettleworth is not medical advice. Talk to a professional before starting a new programme, especially with a medical condition.</p>
        </div>
      </footer>
    </div>
  );
}
