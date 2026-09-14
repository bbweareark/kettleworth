import type { Metadata, Viewport } from "next";
import Script from "next/script";
import { Inter, Inter_Tight, JetBrains_Mono } from "next/font/google";
import { Toaster } from "@kettleworth/ui";
import { TooltipProvider } from "@kettleworth/ui";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });
const interTight = Inter_Tight({ subsets: ["latin"], variable: "--font-inter-tight", display: "swap", weight: ["500", "600", "700"] });
const mono = JetBrains_Mono({ subsets: ["latin"], variable: "--font-jetbrains", display: "swap", weight: ["400", "500", "600"] });

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"),
  title: { default: "Kettleworth", template: "%s · Kettleworth" },
  description: "A coach in your pocket. Personalised training, nutrition and recovery that adapt to what you actually do.",
  applicationName: "Kettleworth",
  appleWebApp: { capable: true, statusBarStyle: "black-translucent", title: "Kettleworth" },
  icons: { icon: "/icon.svg", apple: "/icon.svg" },
};
export const viewport: Viewport = { themeColor: "#131211", width: "device-width", initialScale: 1, viewportFit: "cover" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning className={`${inter.variable} ${interTight.variable} ${mono.variable}`} style={{ ["--font-sans" as string]: "var(--font-inter), ui-sans-serif, system-ui", ["--font-display" as string]: "var(--font-inter-tight), var(--font-inter), ui-sans-serif", ["--font-mono" as string]: "var(--font-jetbrains), ui-monospace" }}>
      <body className="min-h-dvh bg-bg text-fg">
        <Script id="kw-theme" strategy="beforeInteractive">{`try{var t=localStorage.getItem('kw-theme');document.documentElement.dataset.theme=(t==='light')?'light':'dark'}catch(e){document.documentElement.dataset.theme='dark'}`}</Script>
        <TooltipProvider>{children}</TooltipProvider>
        <Toaster position="top-center" toastOptions={{ className: "!bg-bg-elevated !border-border !text-fg !shadow-pop !rounded-xl" }} />
      </body>
    </html>
  );
}
