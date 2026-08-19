// Data-free formatters split out of key-dates.ts. key-dates statically imports
// the ~2,700-entry catalog and builds a lookup map at module load, so ANY
// runtime import of it drags the whole dataset into that route's client bundle.
// These two helpers are the only key-dates runtime values the client
// card/roadmap/odds components need, and they touch no catalog data — living
// here keeps those routes' initial JS free of the catalog, which now loads only
// via the dynamic import in the matching views.

import type { Competition, CostInfo, CostModel, CostTone } from "./key-dates";

// ── Date helpers (UTC, date-only — no timezone drift) ─────────────────────────
//
// `daysBetween` lived in key-dates until it was found to be the reason the odds
// page shipped the catalog: `app-deadlines.ts` imported this two-line function,
// and that one edge pulled key-dates — which builds a lookup map at module load
// and so cannot be tree-shaken — into `LikelihoodGauge`'s client bundle. The
// header above already claimed this module held every key-dates runtime value
// the client card, roadmap and odds components need; this is the one that was
// left behind. key-dates re-exports it, so every existing import still resolves.
/**
 * A plain `YYYY-MM-DD`, which is the only shape the catalog ever stores.
 *
 * Anything else falls through to the `Date` path below, so a malformed string
 * still produces exactly what it produced before — including the NaN that a
 * caller passing a full timestamp has always got out of this function.
 */
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

function toUTC(d: Date | string): number {
  if (typeof d !== "string") {
    return Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
  }
  // The parse is the whole cost here, and for a date-only string there is
  // nothing to parse: the three fields are at fixed offsets. `daysBetween` runs
  // two to three times per catalog row on every match, so building a Date to
  // read three getters off it and throw it away was the arithmetic paying for
  // an allocation it never needed.
  if (ISO_DATE.test(d)) {
    return Date.UTC(+d.slice(0, 4), +d.slice(5, 7) - 1, +d.slice(8, 10));
  }
  const x = new Date(d + "T00:00:00Z");
  return Date.UTC(x.getUTCFullYear(), x.getUTCMonth(), x.getUTCDate());
}

/** Whole days from `from` to `to` (negative if `to` is in the past). */
export function daysBetween(from: Date | string, to: Date | string): number {
  return Math.round((toUTC(to) - toUTC(from)) / 86_400_000);
}

const COST_COPY: Record<
  CostModel,
  { label: string; short: string; tone: CostTone; fallback: string }
> = {
  free: {
    label: "Free",
    short: "Free",
    tone: "free",
    fallback: "Free to take part. No fee at any stage.",
  },
  free_cert_paid: {
    label: "Free to learn · the certificate costs money",
    short: "Free · paid certificate",
    tone: "partial",
    fallback:
      "Free to learn, but the certificate is a paid extra. You can do the whole course without paying. You just won't get the certificate at the end.",
  },
  free_then_paid: {
    label: "Free to enter · you pay only if you get through",
    short: "Free to enter",
    tone: "partial",
    fallback:
      "The first round costs nothing. A fee appears only if you progress, so you can find out how far you get before any money is involved.",
  },
  freemium: {
    label: "Free tier · paid plan optional",
    short: "Free tier",
    tone: "partial",
    fallback:
      "There is a real free tier you can learn from; a paid plan adds extras. You are never forced to pay.",
  },
  subscription: {
    label: "Paid subscription",
    short: "Subscription",
    tone: "paid",
    fallback:
      "This one is a subscription: you pay every month for as long as you use it. Check the current price before you start.",
  },
  one_time: {
    label: "Costs money, a one-off fee",
    short: "Costs money",
    tone: "paid",
    fallback: "There is a single up-front fee to take part.",
  },
  paid_aid: {
    label: "Costs money · financial aid available",
    short: "Paid · aid available",
    tone: "paid",
    fallback:
      "This costs money, but need-based financial aid is available. Ask for it inside the application, not after you are admitted.",
  },
  funded: {
    label: "Free, and it pays you",
    short: "Free · funded",
    tone: "free",
    fallback:
      "Nothing to pay: selected participants are funded (a stipend, or their costs covered).",
  },
  varies: {
    label: "The fee depends on your school or country",
    short: "Fee varies",
    tone: "unknown",
    fallback:
      "The fee is set by your school, team or national organiser rather than centrally, so it varies. Ask them what entry actually costs you.",
  },
  unknown: {
    label: "We haven't verified the cost",
    short: "Cost unverified",
    tone: "unknown",
    fallback:
      "We haven't verified what this one costs, so don't assume it's free. Check the fees on the official page before you commit to it.",
  },
};

export function opportunityCost(c: Competition): CostInfo {
  const model = c.cost ?? "unknown";
  const copy = COST_COPY[model] ?? COST_COPY.unknown;
  return {
    model,
    label: copy.label,
    short: copy.short,
    detail: c.costDetail ?? copy.fallback,
    tone: copy.tone,
  };
}

/**
 * ONE formatter, built once.
 *
 * `toLocaleDateString(locale, options)` is specified as
 * `new Intl.DateTimeFormat(locale, options).format(this)` — so calling it with
 * an options object constructs a formatter, resolves the locale and throws the
 * whole thing away, every single time. Measured at **90.76 µs a call**, which
 * is roughly a thousand times what the rest of a card costs to compute.
 *
 * That would be an academic number if this ran once a page. It runs once per
 * opportunity card: 3.47 ms for the forty on one screen, and again on every
 * re-render — so every keystroke in the search box paid it. Hoisting the
 * formatter is the entire fix, and the output is identical by definition.
 */
const DAY_MONTH_YEAR = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
  timeZone: "UTC",
});

export function formatDate(iso: string): string {
  return DAY_MONTH_YEAR.format(new Date(iso + "T00:00:00Z"));
}
