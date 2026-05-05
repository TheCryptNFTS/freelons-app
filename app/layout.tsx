import "./globals.css";
import type { Metadata, Viewport } from "next";
import { Providers } from "@/components/Providers";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#0e0c0a",
};

export const metadata: Metadata = {
  title: "FREELONS — 404 HEX NOT FOUND",
  description: "The hex was removed in 2021. We noticed. Bring it back on X.",
  metadataBase: new URL("https://freelons.xyz"),
  openGraph: {
    title: "FREELONS — 404 HEX NOT FOUND",
    description: "The hex was removed in 2021. We noticed. Bring it back on X.",
    siteName: "Freelons",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "FREELONS — 404 HEX NOT FOUND",
    description: "Bring back the hex on X.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body><Providers>{children}</Providers></body>
    </html>
  );
}
