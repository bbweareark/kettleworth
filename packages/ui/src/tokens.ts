/** Platform-agnostic tokens (for React Native / charts). Mirrors tokens.css. Values are sRGB hex approximations of the OKLCH values. */
export const tokens = {
  color: {
    dark: { bg: "#131211", surface: "#1b1917", surface2: "#221f1c", border: "rgba(255,255,255,0.06)", fg: "#efeae3", fgMuted: "#a39c93", fgSubtle: "#75706a", ember: "#c9a97a", signal: "#9bb89a", amber: "#d3b47e", rose: "#b8736a", sky: "#8fa7bb" },
    light: { bg: "#f7f5f2", surface: "#fcfbfa", surface2: "#f0ede9", border: "rgba(0,0,0,0.07)", fg: "#2a2622", fgMuted: "#6d665f", fgSubtle: "#8f8880", ember: "#8a6a3e", signal: "#4f7d55", amber: "#9a7a3b", rose: "#9a4f45", sky: "#4a6f8f" },
    series: ["#c9a97a", "#8fa7bb", "#9bb89a", "#b19bc0", "#d3b47e", "#b8736a"],
  },
  radius: { sm: 6, md: 10, lg: 14, xl: 20, "2xl": 28, full: 9999 },
  space: [0, 4, 8, 12, 16, 20, 24, 32, 40, 48, 64, 80, 96],
  font: { display: "Inter Tight", sans: "Inter", mono: "JetBrains Mono" },
  motion: { micro: 150, panel: 250, celebrate: 600 },
} as const;
export type Tokens = typeof tokens;
