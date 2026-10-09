import type { Metadata, Viewport } from "next";
import { Fira_Sans_Condensed, Golos_Text } from "next/font/google";
import "./globals.css";

// Broadcast graphics package: a condensed face for names and tabular numerals, a sturdy
// text face for running copy. Both cover Cyrillic plus Turkish/Albanian/Swedish Latin.
const display = Fira_Sans_Condensed({
  variable: "--font-fira",
  subsets: ["latin", "latin-ext", "cyrillic", "cyrillic-ext"],
  weight: ["500", "600", "700", "800"],
  display: "swap",
});

const text = Golos_Text({
  variable: "--font-golos",
  subsets: ["latin", "latin-ext", "cyrillic", "cyrillic-ext"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Бизнис Арена 2026 — Гласање",
  description: "Гласање на публиката на Бизнис Арена 2026",
  robots: { index: false, follow: false },
  applicationName: "Biznis Arena Vote",
  // Installed to the home screen, it opens full-screen like an app (no browser bar).
  appleWebApp: { capable: true, title: "BA Vote", statusBarStyle: "black-translucent" },
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  themeColor: "#0B1736",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  colorScheme: "dark",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="mk" className={`${display.variable} ${text.variable} antialiased`}>
      <body>{children}</body>
    </html>
  );
}
