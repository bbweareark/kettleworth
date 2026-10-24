import type { Metadata, Viewport } from "next";
import { cookies } from "next/headers";
import localFont from "next/font/local";
import { Toaster } from "@kettleworth/ui";
import { TooltipProvider } from "@kettleworth/ui";
import "./globals.css";

/*
 * Clash Display + Switzer, both Fontshare, free for commercial use, self-hosted as variable
 * woff2 (14KB + 16KB, well inside the 120KB budget). Inter and Inter Tight are gone: they are
 * the fonts every generated interface reaches for, and they carried no tone for a product
 * about lifting heavy things in a dark room.
 *
 * adjustFontFallback matches the fallback's metrics so swapping in the real face causes no
 * layout shift.
 */
const display = localFont({
  src: [{ path: "./fonts/clash-display-600.woff2", weight: "600", style: "normal" }],
  variable: "--font-clash",
  display: "swap",
});
const text = localFont({
  src: [
    { path: "./fonts/switzer-400.woff2", weight: "400", style: "normal" },
    { path: "./fonts/switzer-500.woff2", weight: "500", style: "normal" },
    { path: "./fonts/switzer-600.woff2", weight: "600", style: "normal" },
  ],
  variable: "--font-switzer",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"),
  title: { default: "Kettleworth", template: "%s · Kettleworth" },
  description: "A coach in your pocket. Personalised training, nutrition and recovery that adapt to what you actually do.",
  applicationName: "Kettleworth",
  appleWebApp: { capable: true, statusBarStyle: "black-translucent", title: "Kettleworth" },
  icons: { icon: [{ url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" }, { url: "/icons/favicon-32.png", sizes: "32x32", type: "image/png" }], apple: "/icons/apple-touch-icon.png" },
};
export const viewport: Viewport = { themeColor: "#141110", width: "device-width", initialScale: 1, viewportFit: "cover" };

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  // Theme is read on the server from a cookie, so the first paint is already right and no inline script is needed.
  const theme = (await cookies()).get("kw-theme")?.value === "light" ? "light" : "dark";
  return (
    <html lang="en" data-theme={theme} suppressHydrationWarning className={`${display.variable} ${text.variable}`}>
      <body className="min-h-dvh bg-bg text-fg">
        <TooltipProvider>{children}</TooltipProvider>
        <Toaster position="top-center" toastOptions={{ className: "!bg-bg-elevated !border-border !text-fg !shadow-pop !rounded-xl" }} />
      </body>
    </html>
  );
}
