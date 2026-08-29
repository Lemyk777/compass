import { ImageResponse } from "next/og";
import { COMPETITIONS, opportunityCost } from "@/lib/data/key-dates";
import {
  OG_CONTENT_TYPE,
  ogFonts,
  OG_SIZE,
  OG,
  OgFrame,
} from "@/lib/og-card";

// The site-wide link preview — what every URL without its own card unfurls as.
//
// A Next file convention: this OVERRIDES `openGraph.images` from
// `generateMetadata`, so `pageMeta` stays free of image plumbing and every
// route under `app/` inherits this unless it ships its own
// `opengraph-image.tsx`. `/opportunities/[id]` does.
//
// The numbers are read from the catalog at render time, for the same reason the
// landing page computes every figure it prints: a hardcoded "150+" on a card
// that lives in someone's chat history drifts from what they will actually see
// when they open it.

export const alt =
  "Compass — competitions, olympiads and programmes school students can actually enter, with checked links and dates";
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

export const runtime = "edge";

export default async function Image() {
  const total = COMPETITIONS.length;
  const free = COMPETITIONS.filter((c) => opportunityCost(c).tone === "free")
    .length;

  return new ImageResponse(
    (
      <OgFrame eyebrow="FREE · NO ACCOUNT">
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div
            style={{
              fontSize: 76,
              fontWeight: 700,
              lineHeight: 1.05,
              letterSpacing: "-0.02em",
              color: OG.ink,
              maxWidth: 900,
            }}
          >
            See what you can enter this year.
          </div>
          <div
            style={{
              display: "flex",
              fontSize: 30,
              lineHeight: 1.4,
              color: OG.inkSoft,
              marginTop: 24,
              maxWidth: 860,
            }}
          >
            Competitions, olympiads and programmes open to school students at
            their own age — with the deadlines.
          </div>
        </div>

        <div style={{ display: "flex", gap: 20 }}>
          <Stat n={String(total)} label="opportunities" />
          <Stat n={String(free)} label="free to enter" tone="ivy" />
          <Stat n="Every" label="link and date checked" />
        </div>
      </OgFrame>
    ),
    { ...size, fonts: await ogFonts() },
  );
}

function Stat({
  n,
  label,
  tone,
}: {
  n: string;
  label: string;
  tone?: "ivy";
}) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        backgroundColor: OG.card,
        borderRadius: 14,
        padding: "20px 28px",
      }}
    >
      <div
        style={{
          fontSize: 44,
          fontWeight: 700,
          color: tone === "ivy" ? OG.ivy : OG.ink,
        }}
      >
        {n}
      </div>
      <div style={{ fontSize: 24, color: OG.inkFaint, marginTop: 4 }}>
        {label}
      </div>
    </div>
  );
}
