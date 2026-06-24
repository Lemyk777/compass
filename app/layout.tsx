import type { Metadata, Viewport } from "next";
import { Space_Grotesk, Inter } from "next/font/google";
import "./globals.css";
import { LanguageProvider } from "@/lib/i18n/client";
import { getLang } from "@/lib/i18n/server";
import { CANONICAL_URL } from "@/lib/site";

const display = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
});

const body = Inter({
  subsets: ["latin"],
  variable: "--font-body",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(CANONICAL_URL),
  title: "Compass — See your standing for top universities",
  description:
    "Compass helps internationally-based students assess and improve their applications to leading universities — in the US, Italy, and Hong Kong — with honest, data-driven guidance.",
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    url: CANONICAL_URL,
    siteName: "Compass",
    title: "Compass — See your standing for top universities",
    description:
      "Honest, data-driven guidance on your competitiveness for top universities in the US, Italy, and Hong Kong.",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#10192b",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const lang = getLang();
  return (
    <html lang={lang} className={`${display.variable} ${body.variable}`}>
      <body>
        <LanguageProvider initial={lang}>{children}</LanguageProvider>
      </body>
    </html>
  );
}
