// Partner organisations — the people who post opportunities under their own
// name (Astana Hub, Shymkent Hub, a university, a foundation).
//
// This module is deliberately DATA-ONLY and dependency-free: it is imported by
// client components (the card badge) and by server code alike, and it must not
// drag in the ~2,700-entry catalog from key-dates.ts. Types from there are
// imported as types only, which the compiler erases.

import type { CompetitionCategory, CompetitionTier, CostModel } from "./key-dates";

export type PartnerStatus = "pending" | "active" | "suspended" | "rejected";

/** The full organisation record, as the partner console and admin see it. */
export type Partner = {
  id: string;
  name: string;
  userId: string | null;
  logoUrl: string | null;
  website: string | null;
  about: string;
  country: string | null;
  city: string | null;
  contactEmail: string | null;
  status: PartnerStatus;
  verifiedAt: string | null;
  appliedNote: string;
  reviewNote: string;
  createdAt: string | null;
};

/**
 * The slice of a partner that travels with an opportunity to every surface
 * that renders one. Kept small on purpose: a card needs to say who posted it
 * and whether we verified them, and nothing else.
 */
export type PartnerRef = {
  id: string;
  name: string;
  logoUrl: string | null;
  /**
   * True only when an admin confirmed the account belongs to that organisation
   * AND the organisation is currently active. This is the tick, and it is a
   * factual claim about authorship — never a quality judgement about the
   * opportunity itself.
   */
  verified: boolean;
};

/** DB row → Partner. Tolerates the columns being absent on an older DB. */
export function partnerFromRow(row: Record<string, unknown>): Partner {
  return {
    id: String(row.id ?? ""),
    name: String(row.name ?? ""),
    userId: (row.user_id as string | null) ?? null,
    logoUrl: (row.logo_url as string | null) ?? null,
    website: (row.website as string | null) ?? null,
    about: (row.about as string | null) ?? "",
    country: (row.country as string | null) ?? null,
    city: (row.city as string | null) ?? null,
    contactEmail: (row.contact_email as string | null) ?? null,
    status: isPartnerStatus(row.status) ? row.status : "pending",
    verifiedAt: (row.verified_at as string | null) ?? null,
    appliedNote: (row.applied_note as string | null) ?? "",
    reviewNote: (row.review_note as string | null) ?? "",
    createdAt: (row.created_at as string | null) ?? null,
  };
}

export function isPartnerStatus(v: unknown): v is PartnerStatus {
  return v === "pending" || v === "active" || v === "suspended" || v === "rejected";
}

/** The card-sized reference. Returns null for anything not currently active. */
export function partnerRef(p: Partner): PartnerRef | null {
  if (p.status !== "active") return null;
  return {
    id: p.id,
    name: p.name,
    logoUrl: p.logoUrl,
    verified: p.verifiedAt != null,
  };
}

export function partnerPath(id: string): string {
  return `/partners/${id}`;
}

/**
 * Fallback avatar when a partner has no logo file: up to two initials. Never a
 * broken image, and never a generic grey square that reads as "unknown".
 */
export function partnerMonogram(name: string): string {
  const words = name
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .split(/\s+/)
    .filter(Boolean);
  if (words.length === 0) return "?";
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return (words[0][0] + words[1][0]).toUpperCase();
}

/**
 * URL-safe id from a name. Latin output only — Cyrillic input transliterates,
 * because the id is also a public path and an opportunity-id prefix.
 */
const CYRILLIC: Record<string, string> = {
  а: "a", б: "b", в: "v", г: "g", д: "d", е: "e", ё: "e", ж: "zh", з: "z",
  и: "i", й: "i", к: "k", л: "l", м: "m", н: "n", о: "o", п: "p", р: "r",
  с: "s", т: "t", у: "u", ф: "f", х: "h", ц: "ts", ч: "ch", ш: "sh", щ: "sch",
  ъ: "", ы: "y", ь: "", э: "e", ю: "yu", я: "ya",
  ә: "a", ғ: "g", қ: "q", ң: "ng", ө: "o", ұ: "u", ү: "u", һ: "h", і: "i",
};

export function slugify(raw: string): string {
  return raw
    .toLowerCase()
    .split("")
    .map((ch) => CYRILLIC[ch] ?? ch)
    .join("")
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
}

// ── The posting vocabulary ───────────────────────────────────────────────────
// The partner form offers exactly the fields a card renders — no more, so a
// post can never carry something we have nowhere to show, and no fewer, so a
// partner is never forced to leave a card less honest than they could make it.

export const PARTNER_CATEGORY_OPTIONS: {
  value: CompetitionCategory;
  label: string;
  hint: string;
}[] = [
  { value: "competition", label: "Competition", hint: "Hackathon, contest, case championship, pitch day" },
  { value: "olympiad", label: "Olympiad", hint: "A subject olympiad with ranked results" },
  { value: "course", label: "Course", hint: "A course or bootcamp students enrol in" },
  { value: "research_program", label: "Research program", hint: "Mentored research with an output" },
  { value: "summer_program", label: "Summer program", hint: "A camp, school or intensive with a cohort" },
];

export const PARTNER_TIER_OPTIONS: {
  value: CompetitionTier;
  label: string;
  hint: string;
}[] = [
  { value: "accessible", label: "Open to beginners", hint: "No prior record needed — a good first one" },
  { value: "selective", label: "Selective", hint: "National calibre; a result here is a real differentiator" },
  { value: "elite", label: "Flagship", hint: "The hardest thing you run — a result changes an application" },
];

export const PARTNER_LEVEL_OPTIONS: {
  value: "international" | "national" | "regional";
  label: string;
}[] = [
  { value: "regional", label: "City / region" },
  { value: "national", label: "Country-wide" },
  { value: "international", label: "International" },
];

/**
 * The cost models a partner can pick for their own event. `unknown` is
 * deliberately NOT offered: an organiser always knows what their own contest
 * costs, and "we haven't verified this" is a statement about US, not them.
 */
export const PARTNER_COST_OPTIONS: {
  value: Exclude<CostModel, "unknown">;
  label: string;
  hint: string;
}[] = [
  { value: "free", label: "Free", hint: "Nothing to pay at any stage" },
  { value: "funded", label: "Free, and funded", hint: "You cover participants' costs or pay a stipend" },
  { value: "free_then_paid", label: "Free to enter, paid later", hint: "A fee only if they get through a round" },
  { value: "free_cert_paid", label: "Free, paid certificate", hint: "The certificate at the end costs money" },
  { value: "freemium", label: "Free tier, paid plan", hint: "A real free tier with an optional upgrade" },
  { value: "one_time", label: "One-off fee", hint: "A single entry fee" },
  { value: "subscription", label: "Subscription", hint: "Paid monthly or yearly" },
  { value: "paid_aid", label: "Paid, aid available", hint: "It costs money but waivers or aid exist" },
  { value: "varies", label: "Depends on the school", hint: "The fee is set locally, not by you" },
];
