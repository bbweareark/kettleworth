import { SiteHeader } from "@/components/marketing/site-header";
import { SiteFooter } from "@/components/marketing/site-footer";
import { getSession } from "@/lib/session";

export default async function LibraryLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  return (
    <div className="flex min-h-dvh flex-col">
      <SiteHeader signedIn={!!session} />
      <main className="page flex-1 pb-8 pt-20">{children}</main>
      <SiteFooter />
    </div>
  );
}
