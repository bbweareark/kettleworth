import type { MetadataRoute } from "next";
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Kettleworth", short_name: "Kettleworth", description: "A coach in your pocket: personalised training, nutrition and recovery.",
    start_url: "/app", display: "standalone", background_color: "#141110", theme_color: "#141110",
    icons: [{ src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" }, { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" }, { src: "/icons/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" }],
    categories: ["health", "fitness", "lifestyle"],
  };
}
