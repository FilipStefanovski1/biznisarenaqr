import type { MetadataRoute } from "next";

/** Web app manifest: "Add to Home Screen" installs the voting app full-screen. */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Biznis Arena 2026 — Vote",
    short_name: "BA Vote",
    description: "Audience vote at Biznis Arena 2026",
    start_url: "/vote",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#0B1736",
    theme_color: "#0B1736",
    icons: [
      { src: "/brand/app-icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/brand/app-icon-512.png", sizes: "512x512", type: "image/png" },
      { src: "/brand/app-icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
