import type { ReactNode } from "react";

// The link preview card, shared by every `opengraph-image` in the app.
//
// Why this exists at all: the product's stated growth mechanic is a student
// finding a contest and sending it to a friend, and that is the whole reason
// the detail stopped being a modal and got a real address. The text Open Graph
// tags were written and correct — `og:title`, `og:description` carrying the
// four facts — but there was no `og:image` anywhere in the app, on any of the
// 316 URLs in the sitemap. A card with no image unfurls in WhatsApp and
// Telegram as a narrow grey text row, which is the shape this audience reads as
// spam. Every honest word in those tags was landing in a container nobody opens.
//
// Two constraints shape everything below:
//
//   • Satori, not a browser. Flexbox only, no grid, and every element with more
//     than one child needs an explicit `display: flex`. There is no cascade, so
//     each style is written where it applies.
//   • No CSS variables. An OG card is a fixed PNG rendered once on the server;
//     the reader's theme never reaches it. So the palette is the DARK theme's
//     token values, hardcoded — chosen over the light one because a dark card
//     holds its edge against both a light and a dark chat background, where a
//     near-white card dissolves into the light one.

export const OG_SIZE = { width: 1200, height: 630 };
export const OG_CONTENT_TYPE = "image/png";

/** Dark-theme tokens from globals.css, resolved to hex. Keep them in step. */
export const OG = {
  surface: "#0B111C", // --surface
  card: "#1A2333", // --card
  ink: "#F1F4F9", // --ink
  inkSoft: "#AEBBD0",
  inkFaint: "#8794AB",
  accentInk: "#A9C6FF", // --accent-ink
  ivy: "#74D6AC", // --ivy-ink
} as const;

// ── The runtime, and the font ────────────────────────────────────────────────
//
// Both cards run on the EDGE runtime, and that is a bug fix rather than a
// preference. @vercel/og's *node* build does this at module load, before any
// option of ours is read:
//
//   fs.readFileSync(fileURLToPath(join(import.meta.url, "../noto-sans….ttf")))
//
// `path.join` on a `file://` URL survives on POSIX by accident, because the
// separators already match. On Windows it produces `.\file:\C:\…\noto-sans….ttf`
// and `new URL` throws ERR_INVALID_URL — so importing `next/og` at all crashes,
// and `next build` fails on "Export encountered errors: /opengraph-image".
// Passing `fonts` does not help: the read is unconditional and runs first.
// The edge build contains no `readFileSync` and no `fileURLToPath`, so it
// simply never reaches the defect. It is also the runtime Vercel recommends for
// these, so the fix costs nothing we wanted.
//
// The font then has to arrive as an ASSET rather than off disk. `new URL(…,
// import.meta.url)` is the form webpack rewrites into an emitted asset URL, so
// the file is bundled and deployed with the route — no file-tracing config, and
// nothing that can silently go missing in production.
//
// Inter, because the product is set in Inter: the preview now matches the page
// it links to. Two static weights rather than the variable file, because Satori
// renders a variable font at its default instance and this card is built on the
// contrast between 400 and 700.

/**
 * The `fonts` option both cards pass to `ImageResponse`.
 *
 * Async because the asset is fetched, and deliberately called per render: the
 * edge runtime caches the fetch, so this is a map lookup after the first hit.
 */
export async function ogFonts() {
  const [regular, bold] = await Promise.all([
    fetch(new URL("./og-fonts/Inter-Regular.ttf", import.meta.url)).then((r) =>
      r.arrayBuffer(),
    ),
    fetch(new URL("./og-fonts/Inter-Bold.ttf", import.meta.url)).then((r) =>
      r.arrayBuffer(),
    ),
  ]);
  return [
    { name: "Inter", data: regular, weight: 400 as const, style: "normal" as const },
    { name: "Inter", data: bold, weight: 700 as const, style: "normal" as const },
  ];
}

/** Cut a string to fit the card without a mid-word break. */
export function clampText(s: string, max: number): string {
  const t = s.replace(/\s+/g, " ").trim();
  if (t.length <= max) return t;
  const cut = t.slice(0, max);
  const space = cut.lastIndexOf(" ");
  return (space > max * 0.6 ? cut.slice(0, space) : cut).replace(/[,.;:]$/, "") + "…";
}

/**
 * The frame every card shares: the ground, the wordmark, the accent rule and
 * the domain. Only the middle changes, so two cards from two routes read as one
 * family rather than as two designs that happen to share a colour.
 */
export function OgFrame({
  children,
  eyebrow,
}: {
  children: ReactNode;
  eyebrow?: string;
}) {
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        backgroundColor: OG.surface,
        fontFamily: "Inter",
        padding: "64px 72px",
        // No decoration. An earlier draft ran a 16px accent bar down the left
        // edge, justified in a comment as "a needle's worth of accent" — which
        // was a rationalisation: a vertical bar encodes nothing about a compass
        // or about this card, and a thick coloured rail on one side of a card
        // is one of the most worn tells in generated interfaces. The claim it
        // was really answering — that a near-black card needs an edge — is also
        // false: every chat client draws the preview inside its own bordered,
        // rounded container. The structure here is carried by the things that
        // mean something: the wordmark, the headline, and the raised fact cards.
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
        <div
          style={{
            fontSize: 30,
            fontWeight: 700,
            letterSpacing: "0.16em",
            color: OG.ink,
          }}
        >
          COMPASS
        </div>
        {eyebrow ? (
          <div
            style={{
              fontSize: 22,
              fontWeight: 700,
              letterSpacing: "0.14em",
              color: OG.accentInk,
              backgroundColor: "#16233C",
              padding: "8px 16px",
              borderRadius: 8,
            }}
          >
            {eyebrow}
          </div>
        ) : null}
      </div>

      {children}

      <div style={{ display: "flex", fontSize: 24, color: OG.inkFaint }}>
        applycompass.app
      </div>
    </div>
  );
}

/**
 * One labelled fact. Three of these carry the promise the product makes about
 * a shared link: who can enter, what it costs, when it closes.
 */
export function OgFact({
  label,
  body,
  tone,
}: {
  label: string;
  body: string;
  tone?: "ivy" | "accent";
}) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        flex: 1,
        backgroundColor: OG.card,
        borderRadius: 14,
        padding: "22px 24px",
      }}
    >
      <div
        style={{
          fontSize: 20,
          fontWeight: 700,
          letterSpacing: "0.12em",
          color: tone === "ivy" ? OG.ivy : OG.accentInk,
          marginBottom: 12,
        }}
      >
        {label}
      </div>
      <div style={{ fontSize: 26, lineHeight: 1.35, color: OG.ink }}>
        {body}
      </div>
    </div>
  );
}
