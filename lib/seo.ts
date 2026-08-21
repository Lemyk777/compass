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
export function pageMeta({
  title,
  description,
  path,
  type = "website",
}: PageMetaInput): Metadata {
  return {
    title,
    description,
    alternates: { canonical: path },
    openGraph: {
      type,
      url: path,
      siteName: "Compass",
      title,
      description,
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
      description,
    },
  };
}
