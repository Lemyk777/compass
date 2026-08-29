// Partner organisations — the people who post opportunities under their own
// name (Astana Hub, Shymkent Hub, a university, a foundation).
//
// This module is deliberately DATA-ONLY and dependency-free: it is imported by
// client components (the card badge) and by server code alike, and it must not
// drag in the ~2,700-entry catalog from key-dates.ts. Types from there are
// imported as types only, which the compiler erases.

// Runtime values, and safe to be: `opportunity-vocab` imports nothing at all.
// This file's own header says it must not drag in the catalog, and before the
// vocabularies had a home of their own that rule forced every option list below
// to be hand-written — including one whose TYPE restated a three-member union,
// so it could not have gained a level even had somebody remembered to add one.
import {
  CATEGORY_LABEL,
  COMPETITION_CATEGORIES,
  COMPETITION_LEVELS,
  COMPETITION_TIERS,
  COST_LABEL,
  COST_MODELS,
  type CompetitionCategory,
  type CompetitionLevel,
  type CompetitionTier,
  type CostModel,
} from "./opportunity-vocab";

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
  return (
    v === "pending" || v === "active" || v === "suspended" || v === "rejected"
  );
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
  а: "a",
  б: "b",
  в: "v",
  г: "g",
  д: "d",
  е: "e",
  ё: "e",
  ж: "zh",
  з: "z",
  и: "i",
  й: "i",
  к: "k",
  л: "l",
  м: "m",
  н: "n",
  о: "o",
  п: "p",
  р: "r",
  с: "s",
  т: "t",
  у: "u",
  ф: "f",
  х: "h",
  ц: "ts",
  ч: "ch",
  ш: "sh",
  щ: "sch",
  ъ: "",
  ы: "y",
  ь: "",
  э: "e",
  ю: "yu",
  я: "ya",
  ә: "a",
  ғ: "g",
  қ: "q",
  ң: "ng",
  ө: "o",
  ұ: "u",
  ү: "u",
  һ: "h",
  і: "i",
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

/**
 * The kinds a partner may NOT post, named rather than left as a gap.
 *
 * A partner cannot post a job simulation, because we link out to those and
 * never build them (PLANNER_PLAN.md §3) — an organisation offering one is
 * offering something else. That exclusion was real and correct and nothing
 * said it: the list simply held six of the seven kinds, which is
 * indistinguishable from having fallen a kind behind, and falling a kind
 * behind is exactly what the category list in the admin form had done.
 */
const PARTNER_CANNOT_POST: CompetitionCategory[] = ["simulation"];

/** What each kind means to the organisation filling the form in. */
const PARTNER_CATEGORY_HINT: Record<CompetitionCategory, string> = {
  competition: "Hackathon, contest, case championship, pitch day",
  olympiad: "A subject olympiad with ranked results",
  course: "A course or bootcamp students enrol in",
  research_program: "Mentored research with an output",
  summer_program: "A camp, school or intensive with a cohort",
  community:
    "A club network, forum or ongoing group students join rather than enter",
  simulation: "Not something an organisation posts here — we link out to these",
};

export const PARTNER_CATEGORY_OPTIONS: {
  value: CompetitionCategory;
  label: string;
  hint: string;
}[] = COMPETITION_CATEGORIES.filter(
  (c) => !PARTNER_CANNOT_POST.includes(c),
).map((value) => ({
  value,
  label: CATEGORY_LABEL[value],
  hint: PARTNER_CATEGORY_HINT[value],
}));

/**
 * How hard the prize is, in the organiser's own terms.
 *
 * The words differ from the student's ("Open to beginners" against "Good first
 * one") because the two are answering different questions — one is describing
 * what they run, the other is being told what they are looking at. The
 * difference is in the labels alone; the vocabulary underneath is the same
 * array, so a tier cannot exist on one side and not the other.
 */
const PARTNER_TIER_HINT: Record<CompetitionTier, { label: string; hint: string }> =
  {
    accessible: {
      label: "Open to beginners",
      hint: "No prior record needed, a good first one",
    },
    selective: {
      label: "Selective",
      hint: "National calibre; a result here is a real differentiator",
    },
    elite: {
      label: "Flagship",
      hint: "The hardest thing you run, a result changes an application",
    },
  };

export const PARTNER_TIER_OPTIONS: {
  value: CompetitionTier;
  label: string;
  hint: string;
}[] = COMPETITION_TIERS.map((value) => ({
  value,
  ...PARTNER_TIER_HINT[value],
}));

/** How wide the field is, said the way an organiser would say it. */
const PARTNER_LEVEL_LABEL: Record<CompetitionLevel, string> = {
  school: "Inside schools",
  regional: "City / region",
  national: "Country-wide",
  international: "International",
};

/**
 * Narrowest first, which is how an organiser thinks: they know their own city
 * and work outward. The student's filter renders the same array widest-first.
 * One vocabulary, two reading orders, and no second list to fall behind — this
 * one had its own three-member union written into its type, so it could not
 * have gained a level even if somebody had remembered to add one.
 */
export const PARTNER_LEVEL_OPTIONS: {
  value: CompetitionLevel;
  label: string;
}[] = [...COMPETITION_LEVELS].reverse().map((value) => ({
  value,
  label: PARTNER_LEVEL_LABEL[value],
}));

/**
 * The cost models a partner can pick for their own event.
 *
 * `unknown` is deliberately NOT offered: an organiser always knows what their
 * own contest costs, and "we haven't verified this" is a statement about US,
 * not about them. Written down as an exclusion for the same reason
 * `PARTNER_CANNOT_POST` is — a deliberate omission and a forgotten one look
 * identical in a list.
 */
const PARTNER_CANNOT_CHARGE: CostModel[] = ["unknown"];

/** What each bargain means when it is YOUR event. */
const PARTNER_COST_HINT: Record<CostModel, string> = {
  funded: "You cover participants' costs or pay a stipend",
  free: "Nothing to pay at any stage",
  free_cert_paid: "The certificate at the end costs money",
  free_then_paid: "A fee only if they get through a round",
  freemium: "A real free tier with an optional upgrade",
  one_time: "A single entry fee",
  subscription: "Paid monthly or yearly",
  paid_aid: "It costs money but waivers or aid exist",
  varies: "The fee is set locally, not by you",
  unknown: "Not offered — you know what your own event costs",
};

export const PARTNER_COST_OPTIONS: {
  value: CostModel;
  label: string;
  hint: string;
}[] = COST_MODELS.filter((m) => !PARTNER_CANNOT_CHARGE.includes(m)).map(
  (value) => ({
    value,
    label: COST_LABEL[value].label,
    hint: PARTNER_COST_HINT[value],
  }),
);

/**
 * The same set as a tuple, which is the shape `z.enum` takes.
 *
 * The form's options and the server's validator used to be two independent
 * nine-member lists that happened to agree. Nothing would have said so the day
 * they stopped — a partner would simply have been offered a cost the action
 * then rejected, with a validation error naming a field they had filled in
 * correctly.
 */
export const PARTNER_COST_VALUES = PARTNER_COST_OPTIONS.map((o) => o.value) as [
  CostModel,
  ...CostModel[],
];
