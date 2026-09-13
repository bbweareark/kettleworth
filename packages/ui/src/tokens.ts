/** Platform-agnostic tokens (for React Native / charts). Mirrors tokens.css. Values are sRGB hex approximations of the OKLCH values. */
export const tokens = {
  color: {
    dark: { bg: "#111114", surface: "#1a1a1e", surface2: "#212126", border: "rgba(255,255,255,0.08)", fg: "#f5f5f7", fgMuted: "#a7a7ae", fgSubtle: "#77777f", ember: "#ff8a3d", signal: "#4ade80", amber: "#fbbf24", rose: "#f43f5e", sky: "#60a5fa" },
    light: { bg: "#fafaf8", surface: "#ffffff", surface2: "#f2f2f0", border: "rgba(0,0,0,0.08)", fg: "#1c1c21", fgMuted: "#66666e", fgSubtle: "#8a8a92", ember: "#e8631a", signal: "#16a34a", amber: "#d97706", rose: "#e11d48", sky: "#2563eb" },
    series: ["#ff8a3d", "#60a5fa", "#4ade80", "#c084fc", "#fbbf24", "#f43f5e"],
  },
  radius: { sm: 6, md: 10, lg: 14, xl: 20, "2xl": 28, full: 9999 },
  space: [0, 4, 8, 12, 16, 20, 24, 32, 40, 48, 64, 80, 96],
  font: { display: "Inter Tight", sans: "Inter", mono: "JetBrains Mono" },
  motion: { micro: 150, panel: 250, celebrate: 600 },
} as const;
export type Tokens = typeof tokens;
