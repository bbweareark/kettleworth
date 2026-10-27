import type { Metadata, Viewport } from "next";
import { cookies } from "next/headers";
import localFont from "next/font/local";
import { Toaster } from "@kettleworth/ui";
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
  const theme = (await cookies()).get("kw-theme")?.value === "light" ? "light" : "dark";
  return (
    <html lang="en" data-theme={theme} suppressHydrationWarning className={`${antonio.variable} ${geist.variable} ${geistMono.variable}`}>
      <body className="min-h-dvh bg-bg text-fg">
        <TooltipProvider>{children}</TooltipProvider>
        <Toaster position="top-center" toastOptions={{ className: "!bg-bg-elevated !border-rule !text-fg !shadow-pop !" }} />
      </body>
    </html>
  );
}
