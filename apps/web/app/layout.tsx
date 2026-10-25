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
/*
 * One family, two axes. Archivo variable carries weight 100-900 and width 62-125%, so the
 * expanded display cut and the hairline text cut come from a single 90KB file.
 *
 * The DNA's own face (te-20) is custom and unlicensable, and the style page's suggested
 * fallback is Inter, which is banned. Archivo holds the same engineered register.
 */
const archivo = localFont({
  src: "./fonts/archivo-variable.woff2",
  variable: "--font-archivo",
  display: "swap",
  weight: "100 900",
  declarations: [{ prop: "font-stretch", value: "62% 125%" }],
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"),
  title: { default: "Kettleworth", template: "%s · Kettleworth" },
  description: "A coach in your pocket. Personalised training, nutrition and recovery that adapt to what you actually do.",
  applicationName: "Kettleworth",
  appleWebApp: { capable: true, statusBarStyle: "black-translucent", title: "Kettleworth" },
  icons: { icon: [{ url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" }, { url: "/icons/favicon-32.png", sizes: "32x32", type: "image/png" }], apple: "/icons/apple-touch-icon.png" },
};
export const viewport: Viewport = { themeColor: "#F6F8F7", width: "device-width", initialScale: 1, viewportFit: "cover" };

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  // Theme is read on the server from a cookie, so the first paint is already right and no inline script is needed.
  // Sheet (light) is the designed default; Carbon (dark) is the opt-in.
  const theme = (await cookies()).get("kw-theme")?.value === "dark" ? "dark" : "light";
  return (
    <html lang="en" data-theme={theme} suppressHydrationWarning className={archivo.variable}>
      <body className="min-h-dvh bg-bg text-fg">
        <TooltipProvider>{children}</TooltipProvider>
        <Toaster position="top-center" toastOptions={{ className: "!bg-bg-elevated !border-border !text-fg !shadow-pop !" }} />
      </body>
    </html>
  );
}
