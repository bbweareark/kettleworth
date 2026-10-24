import { SiteHeader } from "@/components/marketing/site-header";
import { SiteFooter } from "@/components/marketing/site-footer";
import { getSession } from "@/lib/session";

/** Header + footer for every public route, so no page is a dead end. */
export async function PublicShell({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  return (
    <div className="flex min-h-dvh flex-col">
      <SiteHeader signedIn={!!session} />
      <div className="flex-1">{children}</div>
      <SiteFooter />
    </div>
  );
}
