import type { NextConfig } from "next";
import withSerwistInit from "@serwist/next";

const withSerwist = withSerwistInit({ swSrc: "app/sw.ts", swDest: "public/sw.js", disable: process.env.NODE_ENV !== "production" });

const config: NextConfig = {
  reactStrictMode: true,
  transpilePackages: ["@kettleworth/ui", "@kettleworth/core", "@kettleworth/types", "@kettleworth/api", "@kettleworth/db", "@kettleworth/integrations"],
  serverExternalPackages: ["postgres", "@anthropic-ai/sdk"],
  images: { remotePatterns: [{ protocol: "https", hostname: "raw.githubusercontent.com" }, { protocol: "https", hostname: "image.mux.com" }] },
  turbopack: {},
  /*
   * Barrel files: importing twenty icons from lucide-react's index pulls far more than twenty
   * icons into the bundle unless the compiler is told to rewrite them into deep imports.
   * Config only - nothing about what is rendered changes.
   */
  experimental: { optimizePackageImports: ["lucide-react", "recharts", "motion", "@kettleworth/ui"] },
  headers: async () => [{ source: "/(.*)", headers: [
    { key: "X-Frame-Options", value: "DENY" },
    { key: "X-Content-Type-Options", value: "nosniff" },
    { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
    { key: "Permissions-Policy", value: "camera=(self), microphone=(), geolocation=()" },
  ] }],
};
export default withSerwist(config);
