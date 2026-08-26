import { ImageResponse } from "next/og";
import {
  competitionCategory,
  resolveCompetitions,
} from "@/lib/data/key-dates";
import {
  CATEGORY_LABEL,
  formatDate,
  opportunityCost,
} from "@/lib/data/opportunity-format";
import { regionLabel } from "@/lib/data/geo";
import { fetchLivePool } from "@/lib/partners/queries";
import {
  OG_CONTENT_TYPE,
  ogFonts,
  OG_SIZE,
  OG,
  OgFact,
  OgFrame,
  clampText,
} from "@/lib/og-card";

// One opportunity's link preview — the card the product's whole share loop
// was missing.
//
// This page's own header comment says the address exists because "the most
// natural thing a student does with this product — find a contest and send it
// to a friend — was impossible", and that its Open Graph tags "mean the link
// unfurls into a card showing [the four facts] rather than into the site-wide
// banner". The text tags did carry them. There was no image, so the card the
// sentence describes did not exist on any of the 172 opportunity URLs. This is
// that card.
//
// It renders the SAME three facts the page does, resolved the SAME way —
// `resolveCompetitions` over the live pool, `opportunityCost`, `formatDate` —
// so the preview and the page cannot disagree. A preview that promises a
// deadline the page then calls unconfirmed would be worse than no preview.

export const alt = "An opportunity on Compass: who can enter, what it costs, when it closes";
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

export const runtime = "edge";

export default async function Image({ params }: { params: { id: string } }) {
  // Degrade rather than fail: a card is a preview, and an unreachable partner
  // pool must not turn a shared link into a broken image. Same reasoning as the
  // public list, which serves the catalog alone when the live pool is down.
  let live: Awaited<ReturnType<typeof fetchLivePool>> = [];
  try {
    live = await fetchLivePool();
  } catch (e) {
    console.error("[og] live pool unavailable, using the catalog only:", e);
  }
  const o = resolveCompetitions(live).find((c) => c.id === params.id);

  if (!o) {
    return new ImageResponse(
      (
        <OgFrame>
          <div
            style={{
              fontSize: 64,
              fontWeight: 700,
              color: OG.ink,
              maxWidth: 900,
            }}
          >
            This one is no longer listed.
          </div>
        </OgFrame>
      ),
      size,
    );
  }

  const cost = opportunityCost(o);
  // The same rule the card and the planner obey: no countdown, and no date at
  // all, for something we have not checked against the organiser's own page.
  const when = o.deadline
    ? o.dateConfirmed
      ? `Closes ${formatDate(o.deadline)}`
      : "Date not confirmed yet"
    : "Open now — no deadline";

  return new ImageResponse(
    (
      <OgFrame
        eyebrow={
          // The kind, and WHERE — because this card is the surface a shared
          // link actually renders, and a local row that names no country here
          // reaches a reader who cannot enter it with nothing saying so. It
          // rides on the eyebrow rather than becoming a fourth `OgFact`: the
          // three facts below are the ones every row carries, and adding a
          // fourth that is usually absent would make the card's shape depend
          // on the row.
          CATEGORY_LABEL[competitionCategory(o)].toUpperCase() +
          (o.region
            ? ` · ${(o.city ?? regionLabel(o.region)).toUpperCase()}`
            : "")
        }
      >
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div
            style={{
              fontSize: o.name.length > 42 ? 56 : 68,
              fontWeight: 700,
              lineHeight: 1.06,
              letterSpacing: "-0.02em",
              color: OG.ink,
              maxWidth: 1000,
            }}
          >
            {clampText(o.name, 78)}
          </div>
          <div
            style={{
              display: "flex",
              fontSize: 27,
              lineHeight: 1.4,
              color: OG.inkSoft,
              marginTop: 18,
              maxWidth: 960,
            }}
          >
            {clampText(o.blurb, 130)}
          </div>
        </div>

        <div style={{ display: "flex", gap: 16 }}>
          <OgFact
            label="WHO CAN ENTER"
            body={clampText(o.eligibility ?? "Check the organiser's page", 62)}
          />
          <OgFact
            label="WHAT IT COSTS"
            body={clampText(cost.short, 40)}
            tone={cost.tone === "free" ? "ivy" : undefined}
          />
          <OgFact label="WHEN IT CLOSES" body={when} />
        </div>
      </OgFrame>
    ),
    { ...size, fonts: await ogFonts() },
  );
}
