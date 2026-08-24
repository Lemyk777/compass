import type { Metadata, Viewport } from "next";
import { Source_Serif_4, Source_Sans_3 } from "next/font/google";
import "./globals.css";
import { LanguageProvider } from "@/lib/i18n/client";
import { getLang } from "@/lib/i18n/server";
import { CANONICAL_URL } from "@/lib/site";
import { ViewTransitions } from "@/components/ui/ViewTransitions";
import { Traffic } from "@/components/analytics/Traffic";

// The pair, and it is a PAIR rather than two picks. Source Serif and Source
// Sans are one superfamily: same designer, same skeletons, same vertical
// metrics, so headings and body agree at the joints instead of merely
// coexisting. That is most of the argument for them here — a guide whose
// country profiles run 1,300 words is a reading surface, and it should look
// like something written rather than something generated.
//
// What they replaced and why: `Space_Grotesk` + `Inter`. Inter is the most-used
// interface face on earth and carries no signal on its own, but the pair is one
// of the named tells of a site assembled in an afternoon, and it was on every
// page.
//
// `cyrillic` is not decoration. The catalog holds "Tournament of Towns (Турнир
// городов)", and an opportunity's name is the `<h1>` of its own page — while
// `h1..h4` are `font-display` globally (globals.css). The old pair declared
// `latin` alone, so that heading had been falling back to a system face all
// along. Next emits one `@font-face` per subset behind a `unicode-range`, so
// pages with no Cyrillic on them never fetch the Cyrillic file.
const display = Source_Serif_4({
  subsets: ["latin", "cyrillic"],
  variable: "--font-display",
  display: "swap",
});

const body = Source_Sans_3({
  subsets: ["latin", "cyrillic"],
  variable: "--font-body",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(CANONICAL_URL),
  title: "Compass — See what you can enter this year",
  // 154 characters, and the count is the point: this was 228, which a result
  // cuts at about 160. The home page does not go through `pageMeta`, so the
  // budget `fitDescription` applies to every other page never reached it —
  // and this is the page that matters most in a result. Rewritten by hand
  // rather than machine-trimmed, because an ellipsis on the front door is a
  // worse answer than a shorter sentence. A test pins the length.
  description:
    "Competitions, olympiads and programmes school students can actually enter at their age, with the real deadline and the real cost. Free, no account needed.",
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    url: CANONICAL_URL,
    siteName: "Compass",
    title: "Compass — See what you can enter this year",
    description:
      "Competitions, olympiads and programmes you can actually enter, with the deadlines — free, no account needed. Plus honest guidance on your university applications.",
  },
  // See the note in lib/seo.ts: the picture comes from `app/opengraph-image.tsx`,
  // this declares the shape of the card it sits in. Routes that build their
  // metadata through `pageMeta` set the same thing; this covers the ones that
  // inherit the root's metadata instead.
  twitter: {
    card: "summary_large_image",
    title: "Compass — See what you can enter this year",
    description:
      "Competitions, olympiads and programmes you can actually enter, with the deadlines — free, no account needed.",
  },
  // Ownership proof for Search Console, which is the only way to see whether
  // any of the rest of this works: which queries reach the 138 guide pages,
  // which of the 172 opportunity URLs are indexed, and whether the structured
  // data validates. The site's own `page_views` table counts arrivals; it
  // cannot show a query, an impression or a crawl error.
  //
  // Read from the environment rather than pasted in, because the value is
  // account-specific and would otherwise be a stranger's token committed to a
  // public repo. Absent, this key is simply omitted and the tag is not
  // rendered — the verification is done once, by whoever owns the property.
  verification: process.env.GOOGLE_SITE_VERIFICATION
    ? { google: process.env.GOOGLE_SITE_VERIFICATION }
    : undefined,
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  // Two values, because this paints the browser's own chrome — the address bar
  // on Android, the title bar of an installed PWA. One value meant a dark strip
  // above a light page or the reverse; each now matches the surface underneath.
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#F7F8FA" },
    { media: "(prefers-color-scheme: dark)", color: "#0B111C" },
  ],
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
          {/* Renders nothing. Uses usePathname (not useSearchParams), so it
              adds no Suspense boundary and no static-rendering constraint. */}
          <Traffic />
        </body>
      </html>
    </ViewTransitions>
  );
}
