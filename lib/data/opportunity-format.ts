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
function toUTC(d: Date | string): number {
  const x = typeof d === "string" ? new Date(d + "T00:00:00Z") : d;
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
    fallback: "Free to take part — no fee at any stage.",
  },
  free_cert_paid: {
    label: "Free to learn · the certificate costs money",
    short: "Free · paid certificate",
    tone: "partial",
    fallback:
      "Free to learn, but the certificate is a paid extra. You can do the whole course without paying — you just won't get the certificate at the end.",
  },
  free_then_paid: {
    label: "Free to enter · you pay only if you get through",
    short: "Free to enter",
    tone: "partial",
    fallback:
      "The first round costs nothing. A fee appears only if you progress — so you can find out how far you get before any money is involved.",
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
      "This one is a subscription — you pay every month for as long as you use it. Check the current price before you start.",
  },
  one_time: {
    label: "Costs money — a one-off fee",
    short: "Costs money",
    tone: "paid",
    fallback: "There is a single up-front fee to take part.",
  },
  paid_aid: {
    label: "Costs money · financial aid available",
    short: "Paid · aid available",
    tone: "paid",
    fallback:
      "This costs money, but need-based financial aid is available — ask for it inside the application, not after you are admitted.",
  },
  funded: {
    label: "Free — and it pays you",
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
      "The fee is set by your school, team or national organiser rather than centrally, so it varies — ask them what entry actually costs you.",
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

export function formatDate(iso: string): string {
  return new Date(iso + "T00:00:00Z").toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  });
}
