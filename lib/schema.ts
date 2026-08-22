import { CANONICAL_URL, CONTACT_EMAIL } from "@/lib/site";

// Structured data: the machine-readable half of what every public page already
// says in prose.
//
// The site had none at all. That is not a neutral state — `lib/seo.ts` gave 316
// public URLs a title, a description and a canonical, and `opengraph-image.tsx`
// gave them a card, but nothing told a crawler what KIND of thing any of them
// was. A country profile, an opportunity and the landing page were three
// documents with three titles, and the relationship between them — that Berlin
// sits under Germany, which sits under the guide — existed only as a row of
// links a parser has to guess at.
//
// Three rules govern everything in this file, and each is the same rule the
// product already follows for the reader:
//
//  1. NEVER STATE WHAT WE CANNOT STAND BEHIND. The catalog refuses to show a
//     countdown for an unconfirmed date; it follows that we do not hand a
//     crawler that date either. Structured data is read by machines that cannot
//     see the hedge in the sentence beside it, so an unverified claim here is
//     worse than the same claim on screen, not better. This is why there is no
//     `SearchAction` below and no `Course`/`EducationEvent` builder at all —
//     see the notes on each.
//
//  2. ONE SOURCE. A schema builder takes the values the page already renders,
//     never a second copy of them written out for crawlers. `DetailShell` feeds
//     the visible breadcrumb and `breadcrumbSchema` from the same props;
//     `faqSchema` reads the FAQ component's own array. A separate list would be
//     wrong within a release, and wrong invisibly — nobody reads the JSON.
//
//  3. THE OUTPUT IS UNTRUSTED TEXT. A partner names their own organisation and
//     their own post, and both reach a breadcrumb. See `serializeJsonLd`.

export type JsonLd = Record<string, unknown>;

/**
 * The path a crawler should be told about, which is the path `pageMeta` reports
 * as canonical: no query string, no fragment.
 *
 * This is load-bearing rather than tidy. The guide carries its field filter in
 * `?f=` and every in-section link goes through `withFields`, so `crumbHref` on
 * a live page is routinely `/guide/places?f=law`. A breadcrumb naming that URL
 * contradicts the canonical on the very page it sits on, which is how a site
 * teaches a crawler that its own filter states are separate documents. The rule
 * lives here, in the builder, so no caller can forget it.
 */
export function canonicalPath(path: string): string {
  const cut = path.search(/[?#]/);
  return cut === -1 ? path : path.slice(0, cut);
}

/**
 * JSON-LD as a string safe to place inside a `<script>` element.
 *
 * `JSON.stringify` is not enough, and the gap is an injection. A script element
 * is parsed as raw text until the literal sequence `</script`, so any `<` that
 * survives into the JSON can end the block early and start real markup — and
 * the strings going in are not ours. An approved partner writes their own
 * organisation name and the title of every post, and both travel into an
 * opportunity page's breadcrumb. That is the same shape as the `.ics` finding:
 * trust is granted once per organisation, so the safety net has to be at the
 * point of rendering, not at the point of approval.
 *
 * `<` and `>` are the breakout; `&` is escaped too so an HTML entity in a
 * partner's name cannot be re-interpreted; U+2028 and U+2029 are legal in JSON
 * and illegal in a JavaScript string literal, which is a parse error rather
 * than an exploit but breaks the block just as completely. All five are written
 * as `\uXXXX` escapes, which JSON parses straight back to the original
 * character — the payload is unchanged, only its spelling is.
 *
 * Both separators are written here as escapes rather than as themselves. A
 * literal U+2028 in a source file is invisible, and it does not survive an
 * editor or a patch — the same reason the control-character class in `buildIcs`
 * is spelled out. The first attempt at this file was truncated by exactly that.
 */
export function serializeJsonLd(data: JsonLd | JsonLd[]): string {
  return JSON.stringify(data)
    .replace(/</g, "\\u003c")
    .replace(/>/g, "\\u003e")
    .replace(/&/g, "\\u0026")
    .replace(/\u2028/g, "\\u2028")
    .replace(/\u2029/g, "\\u2029");
}

// ── Who we are ───────────────────────────────────────────────────────────────

/**
 * The one statement of what this site is and who runs it.
 *
 * It belongs on the home page and only there: Google's own instruction is to
 * put it on the site's front page, and repeating it on 316 others adds bytes to
 * every response without adding a claim. `Traffic` and the middleware already
 * make every HTML response uncacheable, so those bytes would be paid every
 * time.
 *
 * `sameAs` is absent because there are no verified profiles to name. It is the
 * field that most wants filling in with something plausible, and a link to an
 * account we do not control is exactly the claim this file exists to refuse.
 */
export function organizationSchema(): JsonLd {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "Compass",
    url: CANONICAL_URL,
    logo: `${CANONICAL_URL}/compass-mark.png`,
    email: CONTACT_EMAIL,
    description:
      "Compass lists the competitions, olympiads, courses and programmes school students can actually enter at their age, with the real deadline and the real cost, and a guide to where each one leads.",
  };
}

/**
 * The site as a document, for the sitelinks box.
 *
 * DELIBERATELY NO `potentialAction` / `SearchAction`, and this is the most
 * likely thing in the file for a later session to "fix". The sitelinks search
 * box needs a URL TEMPLATE that runs a search — and the search on
 * `/opportunities` is client state inside `FilterBar`, not a query parameter.
 * Nothing on this site answers `?q=`. Declaring the action would hand Google a
 * URL that loads the unfiltered list and looks, to a searcher who used the box,
 * exactly like a broken product.
 *
 * If the filters ever move into the URL — which `?f=` in the guide already does
 * and the opportunity list deliberately does not — this becomes true and can be
 * added. Until then it is a claim about a feature we do not have.
 */
export function webSiteSchema(): JsonLd {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "Compass",
    url: CANONICAL_URL,
    inLanguage: "en",
    publisher: { "@type": "Organization", name: "Compass" },
  };
}

// ── Where you are ────────────────────────────────────────────────────────────

export type Crumb = {
  /** What the reader sees in the trail. */
  name: string;
  /** Its address. A query string is stripped — see `canonicalPath`. */
  path: string;
};

/**
 * The trail, ending at the page itself.
 *
 * This is the one builder here with a visible effect on a search result: it is
 * what turns a bare URL under the title into `Compass › Countries › Germany`,
 * and the guide is three levels deep on 138 pages that a family reaches from a
 * search or from a link somebody sent them. The trail passed in must be the one
 * rendered on the page — a breadcrumb that disagrees with the navigation above
 * it is the failure mode the whole thing has, and it is invisible without a
 * validator.
 */
export function breadcrumbSchema(trail: readonly Crumb[]): JsonLd {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: trail.map((c, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: c.name,
      item: `${CANONICAL_URL}${canonicalPath(c.path)}`,
    })),
  };
}

// ── What we are asked ────────────────────────────────────────────────────────

/**
 * The landing page's questions, as the questions they are.
 *
 * Google's requirement is that every answer is already visible on the page, and
 * this one is met by an earlier decision rather than by anything here: the FAQ
 * was rebuilt as native `<details>` precisely so the answers ship in the HTML
 * instead of being mounted on open. A version that kept them out of the DOM
 * until clicked would make this markup a violation rather than a description.
 *
 * Takes the component's own array, so the two cannot disagree.
 */
export function faqSchema(items: readonly { q: string; a: string }[]): JsonLd {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((it) => ({
      "@type": "Question",
      name: it.q,
      acceptedAnswer: { "@type": "Answer", text: it.a },
    })),
  };
}

// ── What is NOT here, and why ────────────────────────────────────────────────
//
// There is no `Course` or `EducationEvent` builder for the 172 opportunity
// pages, and that is a decision rather than an omission. Both types are the
// obvious next thing to add and both would have to lie:
//
//  • `EducationEvent` is a subtype of `Event`, whose required field is
//    `startDate`. We do not have one. The catalog stores `deadline` — the entry
//    cutoff — and `window`, which is human prose ("March, most years"). Using
//    the deadline as the start date states that a contest begins on the day
//    entry closes, on every row. And the deadline itself is only trustworthy
//    where `dateConfirmed` is true, which is the rule the countdown already
//    obeys on screen.
//
//  • `Course` needs a `provider`, and for a curated row we have the organiser's
//    URL, not their name. Deriving one from the hostname is guessing at a
//    proper noun and putting it in a machine-readable field attributed to us.
//
// So an opportunity page gets its breadcrumb, its canonical, its title and its
// own link-preview card, and says nothing it cannot support. Adding either type
// means adding the fields to the catalog first — an organiser name, and a real
// start date behind its own confirmation flag — not adding a builder here.
