import type { Metadata, Viewport } from "next";
import { cookies } from "next/headers";
import localFont from "next/font/local";
import { Toaster } from "@kettleworth/ui";
import { STYLES, type Style } from "@kettleworth/types";
import { TooltipProvider } from "@kettleworth/ui";
import "./globals.css";

/*
 * Sora + Geist + Geist Mono, all OFL, self-hosted as latin-subset variable woff2
 * (25KB + 29.3KB + 23.1KB = 77KB, inside the 120KB budget).
 *
 * Sora carries every figure in Carbon, at 600 with the hardware gallery's own compression.
 * Antonio is gone with it: a condensed face reads as a scoreboard, and Carbon is now a lit
 * object on a dark plinth rather than a readout. Geist carries language; Geist Mono carries
 * counters, timers and set markers, the role the DNA reference gives mono.
 *
 * adjustFontFallback matches the fallback's metrics so swapping in the real face causes no
 * layout shift.
 */
const sora = localFont({
  src: "./fonts/sora.woff2",
  variable: "--font-sora",
  display: "swap",
  weight: "400 800",
});
const geist = localFont({
  src: "./fonts/geist-variable.woff2",
  variable: "--font-geist",
  display: "swap",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/geist-mono-variable.woff2",
  variable: "--font-geist-mono",
  display: "swap",
  weight: "100 900",
});

/*
 * The other two styles' faces. Declaring all six costs nothing: a browser never downloads an
 * @font-face it does not render, so a member on Carbon fetches 79KB and never sees Arc's or
 * Sanctuary's, which is why DESIGN.md budgets each style on its own.
 *
 * Anton and Schibsted Grotesk are Arc (an ultra-black display that can carry a title card,
 * and a grotesk for language); Familjen Grotesk and Schibsted are Sanctuary, which traded
 * Young Serif for a grotesque when it moved from a gallery wall to poured concrete. All OFL,
 * all latin subsets.
 */
const anton = localFont({
  src: "./fonts/anton.woff2",
  variable: "--font-anton",
  display: "swap",
  weight: "400",
});
const schibsted = localFont({
  src: "./fonts/schibsted-grotesk-variable.woff2",
  variable: "--font-schibsted",
  display: "swap",
  weight: "400 900",
});
const familjen = localFont({
  src: "./fonts/familjen-grotesk.woff2",
  variable: "--font-familjen",
  display: "swap",
  weight: "400 700",
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"),
  title: { default: "Kettleworth", template: "%s · Kettleworth" },
  description: "A coach in your pocket. Personalised training, nutrition and recovery that adapt to what you actually do.",
  applicationName: "Kettleworth",
  appleWebApp: { capable: true, statusBarStyle: "black-translucent", title: "Kettleworth" },
  icons: { icon: [{ url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" }, { url: "/icons/favicon-32.png", sizes: "32x32", type: "image/png" }], apple: "/icons/apple-touch-icon.png" },
};
export const viewport: Viewport = { themeColor: "#16191a", width: "device-width", initialScale: 1, viewportFit: "cover" };

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  // Theme is read on the server from a cookie, so the first paint is already right and no inline script is needed.
  // Carbon (dark) is the designed default: the DNA is a dark room with one hard light, and
  // the app is used in a gym. Daylight is the opt-in.
  const jar = await cookies();
  const theme = jar.get("kw-theme")?.value === "light" ? "light" : "dark";
  /*
   * The style is read the same way, from a cookie written alongside the profile field, so the
   * first paint is already in the member's own world with no flash and no inline script. The
   * profile is the record of record; the cookie is how the first byte knows.
   */
  const style = STYLES.includes(jar.get("kw-style")?.value as Style) ? (jar.get("kw-style")!.value as Style) : "carbon";
  return (
    <html lang="en" data-theme={theme} data-style={style} suppressHydrationWarning className={`${sora.variable} ${geist.variable} ${geistMono.variable} ${anton.variable} ${schibsted.variable} ${familjen.variable}`}>
      <body className="min-h-dvh bg-bg text-fg">
        <TooltipProvider>{children}</TooltipProvider>
        <Toaster position="top-center" toastOptions={{ className: "!bg-bg-elevated !border-rule !text-fg !shadow-pop !" }} />
      </body>
    </html>
  );
}
