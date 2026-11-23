import type { Metadata, Viewport } from "next";
import { cookies } from "next/headers";
import localFont from "next/font/local";
import { Toaster } from "@kettleworth/ui";
import { STYLES, type Style } from "@kettleworth/types";
import { TooltipProvider } from "@kettleworth/ui";
import "./globals.css";

/*
 * Antonio + Geist + Geist Mono, all OFL, self-hosted as latin-subset variable woff2
 * (26.5KB + 29.3KB + 23.1KB = 79KB, inside the 120KB budget).
 *
 * Antonio carries every figure. The signature idea of this design is that the load is the
 * largest thing on the screen, and a condensed face keeps a five-character load legible at
 * 96px on a 390px phone, which the previous expanded face could not. Geist carries language;
 * Geist Mono carries counters, timers and set markers, the role the DNA reference gives mono.
 *
 * Archivo is gone with the teenage engineering system it belonged to.
 *
 * adjustFontFallback matches the fallback's metrics so swapping in the real face causes no
 * layout shift.
 */
const antonio = localFont({
  src: "./fonts/antonio-variable.woff2",
  variable: "--font-antonio",
  display: "swap",
  weight: "100 700",
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
 * Darker Grotesque and Schibsted Grotesk are Arc (Locomotive's whisper-weight display and a
 * grotesk for language); Young Serif and Schibsted are Sanctuary. All OFL, all latin subsets.
 */
const darkerGrotesque = localFont({
  src: "./fonts/darker-grotesque-variable.woff2",
  variable: "--font-darker-grotesque",
  display: "swap",
  weight: "300 900",
});
const schibsted = localFont({
  src: "./fonts/schibsted-grotesk-variable.woff2",
  variable: "--font-schibsted",
  display: "swap",
  weight: "400 900",
});
const youngSerif = localFont({
  src: "./fonts/young-serif.woff2",
  variable: "--font-young-serif",
  display: "swap",
  weight: "400",
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
    <html lang="en" data-theme={theme} data-style={style} suppressHydrationWarning className={`${antonio.variable} ${geist.variable} ${geistMono.variable} ${darkerGrotesque.variable} ${schibsted.variable} ${youngSerif.variable}`}>
      <body className="min-h-dvh bg-bg text-fg">
        <TooltipProvider>{children}</TooltipProvider>
        <Toaster position="top-center" toastOptions={{ className: "!bg-bg-elevated !border-rule !text-fg !shadow-pop !" }} />
      </body>
    </html>
  );
}
