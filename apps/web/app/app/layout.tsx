import { requireUser } from "@/lib/session";
import { AppNav } from "@/components/app/nav";
import { TimeZoneCookie } from "@/components/app/timezone-cookie";

/**
 * The app shell.
 *
 * Ported from the DNA reference's own shell (design/refs/dna-integrated-biosciences/desktop.png):
 * a true-black ground with the content held on a rounded inset canvas, and navigation that
 * floats over that canvas rather than occupying a bar above it. On a phone the canvas is the
 * whole viewport - an inset would spend screen width on decoration - so the radius and the
 * margin only appear from `lg` up.
 *
 * Navigation is all in `AppNav`: the five-tab strip at the thumb on a phone, a pill group at
 * the top on a wide screen, and a full-screen menu behind the pill for everything that does
 * not fit in five.
 */
export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();
  return (
    <div className="min-h-dvh bg-bg lg:bg-band">
      <TimeZoneCookie />
      {/* No overflow-hidden here: the canvas grows past the viewport and clipping would cut
          the page off. Anything that needs the corner rounded clips itself. */}
      <div className="relative min-h-dvh bg-bg lg:mx-6 lg:my-6 lg:min-h-[calc(100dvh-3rem)] lg:rounded-xl">
        <AppNav name={user.name} />
        <main className="pb-[calc(4rem+env(safe-area-inset-bottom))] lg:pb-12">{children}</main>
      </div>
    </div>
  );
}
