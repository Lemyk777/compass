import type { Metadata, Viewport } from "next";
import { Space_Grotesk, Inter } from "next/font/google";
import "./globals.css";
import { LanguageProvider } from "@/lib/i18n/client";
import { getLang } from "@/lib/i18n/server";
import { CANONICAL_URL } from "@/lib/site";
import { ViewTransitions } from "@/components/ui/ViewTransitions";

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
  title: "Compass — See what you can enter this year",
  description:
    "Competitions, olympiads and programmes school students can actually enter at their age, with the deadlines — every link and date checked. Free, no account needed. Plus an honest, data-driven read on your university applications.",
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    url: CANONICAL_URL,
    siteName: "Compass",
    title: "Compass — See what you can enter this year",
    description:
      "Competitions, olympiads and programmes you can actually enter, with the deadlines — free, no account needed. Plus honest guidance on your university applications.",
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
    <ViewTransitions>
      <html lang={lang} className={`${display.variable} ${body.variable}`}>
        <body>
          <LanguageProvider initial={lang}>{children}</LanguageProvider>
        </body>
      </html>
    </ViewTransitions>
  );
}

