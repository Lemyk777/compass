import type { Metadata } from "next";

// One place that builds a public page's metadata, because the same three
// mistakes were about to be made 70 times by hand.
//
// The guide is 66 public pages written for a family who will find them from a
// search or be sent one by a friend. Both of those depend on things no page had:
// a canonical URL, and a link preview that says what THIS page is. Before this,
// every shared guide link rendered the site-wide card, so a link to Berlin and a
// link to the home page looked identical — for URLs we deliberately designed to
// be sendable to a parent.
//
// `metadataBase` is set once in app/layout.tsx, so every path here can stay
// relative and still resolve to the canonical domain.

export type PageMetaInput = {
  title: string;
  description: string;
  /**
   * The page's own address. A query string belongs here only when the query IS
   * the subject (`/guide/compare?a=&b=`) — never the guide's `?f=` filter or a
   * `?ref=` code. See the note on the canonical below.
   */
  path: string;
  /** Long-form subject pages are articles; lists and tools are websites. */
  type?: "website" | "article";
};

/**
 * Title, description, canonical and Open Graph for one public page.
 *
 * The canonical is deliberately the bare path. The guide carries its field
 * filter in `?f=` and the report links carry `?ref=` codes, and none of those
 * are different pages — a canonical that kept the query string would tell a
 * crawler that `/guide/work?f=law` and `/guide/work?f=medicine` are two separate
 * documents competing with each other.
 */
/**
 * What a search result actually shows.
 *
 * Measured on the live site 2026-08-22: 250 of 317 titles ran past 60
 * characters and 205 of 317 descriptions past 160, so on most pages the tail
 * was cut. Nothing was duplicated or missing — the uniqueness was fine and the
 * LENGTH was not.
 *
 * These are the numbers Google truncates around. They are approximate by
 * nature (it measures pixels, not characters), which is the argument for
 * treating them as a budget rather than a hard cap on the subject itself.
 */
export const SERP_TITLE_MAX = 60;
export const SERP_DESCRIPTION_MAX = 160;

const BRAND = " | Compass";

/**
 * A title built to survive the cut, subject first.
 *
 * The rule it enforces: BOILERPLATE NEVER PUSHES THE SUBJECT OUT OF VIEW. The
 * old templates put a fixed explanatory tail on every page — "who can enter,
 * what it costs, when it closes | Compass" is 56 characters before the name is
 * even considered — so a long opportunity name produced a 128-character title
 * whose visible part was all name and no product, and whose invisible part was
 * the same sentence on all 172 rows.
 *
 * So the tail is a NICETY and the subject is not. Drop the qualifier if the
 * pair will not fit, then the brand, and never truncate the subject: a name cut
 * mid-word is worse in a result than a long one, and the opening of it is what
 * someone searched for.
 */
export function fitTitle(subject: string, qualifier?: string): string {
  const s = subject.trim().replace(/\s+/g, " ");
  if (qualifier) {
    const full = `${s} · ${qualifier.trim()}${BRAND}`;
    if (full.length <= SERP_TITLE_MAX) return full;
  }
  const branded = `${s}${BRAND}`;
  return branded.length <= SERP_TITLE_MAX ? branded : s;
}

/**
 * A description trimmed to the budget, at a boundary a reader can live with.
 *
 * Applied inside `pageMeta` rather than at the call sites, because the text
 * comes from prose registries written for the PAGE — `hub.what`,
 * `major.whatItActuallyIs`, `destination.oneLine` — and none of those were
 * written to a search engine's measure. Asking every caller to remember would
 * mean 17 places to forget.
 *
 * A sentence boundary is preferred over a word boundary, and a word boundary
 * over a hard cut, so the snippet ends somewhere deliberate instead of
 * mid-word.
 *
 * The floor stops a short first sentence from becoming the whole description,
 * and 80 is measured rather than picked. Across the 132 descriptions the
 * registries produce, 48 need trimming and 35 of those have a sentence end
 * inside the budget, sitting at 33, 40, 42, 46, 58, 63, 68, 73, 73, 85, 86, 86,
 * 87 and then 92 upwards. Stopping at 33 characters throws away most of a
 * snippet Google would have shown; stopping at 85 does not. 80 is the gap
 * between those two groups.
 */
const SENTENCE_FLOOR = 80;
export function fitDescription(text: string): string {
  const t = text.trim().replace(/\s+/g, " ");
  if (t.length <= SERP_DESCRIPTION_MAX) return t;

  const window = t.slice(0, SERP_DESCRIPTION_MAX + 1);
  const stop = Math.max(
    window.lastIndexOf(". "),
    window.lastIndexOf("! "),
    window.lastIndexOf("? "),
  );
  if (stop >= SENTENCE_FLOOR) return t.slice(0, stop + 1);

  // The ellipsis is a character and counts against the budget. Slicing to the
  // full maximum and then appending it returns 161, which the test caught.
  const room = t.slice(0, SERP_DESCRIPTION_MAX - 1);
  const space = room.lastIndexOf(" ");
  return `${(space > 0 ? room.slice(0, space) : room).trimEnd()}…`;
}

export function pageMeta({
  title,
  description,
  path,
  type = "website",
}: PageMetaInput): Metadata {
  // Every caller gets the budget applied whether or not it thought about it.
  const desc = fitDescription(description);
  return {
    title,
    description: desc,
    alternates: { canonical: path },
    openGraph: {
      type,
      url: path,
      siteName: "Compass",
      title,
      // The same trimmed string, not the raw one. A page has one description;
      // two versions of it is a thing to keep in sync for no gain, and the card
      // truncates at its own limit anyway.
      description: desc,
    },
    // The image itself is a FILE convention — `app/opengraph-image.tsx`, and
    // `app/opportunities/[id]/opengraph-image.tsx` for a single row — because
    // file-based metadata overrides anything set here, and putting the plumbing
    // there keeps this helper the one place that reasons about titles and
    // canonicals. What has to be said here is the card SHAPE: without it X
    // renders `summary`, the narrow thumbnail strip, and the card is the whole
    // reason the image exists.
    twitter: {
      card: "summary_large_image",
      title,
      description: desc,
    },
  };
}
