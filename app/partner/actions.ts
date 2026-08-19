"use server";

// What a partner organisation can do: post an opportunity, edit it, take it
// down, and edit its own public profile.
//
// PUBLISHING IS INSTANT. There is no per-post review queue — trust was granted
// once, when an admin approved and verified the organisation, and making a hub
// with real authority in Kazakhstan wait on us before its own hackathon appears
// would defeat the point of the partnership. What replaces the queue:
//
//   • only an ACTIVE partner can write at all (a suspended one fails here, and
//     everything it already posted disappears from every read — see
//     lib/partners/live.ts);
//   • every post is owned by a partner id, so a takedown is one flag away for
//     the partner and for an admin;
//   • the honesty rules the curated catalog lives by are enforced on input
//     rather than assumed: a deadline must be a real future date, a row with
//     nothing to announce cannot pretend to have a date, and the cost has to be
//     stated rather than left silent.
//
// Every export is async — a non-function export in a "use server" file crashes
// the production build with an opaque digest error.

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireSession } from "@/lib/auth/session";
import { createAdminClient } from "@/lib/supabase/admin";
import { getPartnerForUser } from "@/lib/partners/queries";
import { slugify, type Partner } from "@/lib/data/partners";
import { COMPETITION_CATEGORIES } from "@/lib/data/key-dates";
import { FACULTY_VALUES, type FacultyValue } from "@/lib/data/faculties";
import { currentCycle, cycleEndPlaceholder } from "@/lib/data/cycle";

export type PartnerResult =
  { ok: true; id?: string } | { ok: false; error: string };

const BLURB_MAX = 280;
const NAME_MAX = 120;
const DETAIL_MAX = 300;

// The three ways an opportunity can sit in time — exactly the three the card
// can render. There is no fourth, and in particular there is no "we'll put a
// date in later and hope": a row either has a real date, runs continuously, or
// says its dates are not announced.
const TIMING = ["deadline", "always_open", "tba"] as const;

/**
 * A link, with the characters that are not part of any URL refused.
 *
 * `.url()` alone is NOT enough, and that is a measured fact rather than
 * caution: it calls the WHATWG parser, which TOLERATES a tab, a CR or an LF
 * inside the input — so `https://example.com/a\r\nX-EVIL:1` passes validation
 * and is stored exactly as typed. That string later goes onto a line of a
 * generated `.ics` file, where a newline ends one calendar property and starts
 * another, so a partner could write events straight into the calendar of every
 * student who downloaded it. `lib/calendar/ics.ts` strips them at the other end
 * too — this end is where the row stops being wrong in the database.
 */
const httpUrl = z
  .string()
  .trim()
  .url()
  .startsWith("http")
    // eslint-disable-next-line no-control-regex -- refusing them is the point
  .refine((v) => !/[\u0000-\u001F\u007F]/.test(v), {
    message: "That link contains characters a URL cannot have.",
  });

const opportunitySchema = z.object({
  name: z.string().trim().min(3).max(NAME_MAX),
  url: httpUrl,
  blurb: z.string().trim().min(10).max(BLURB_MAX),
  category: z.enum(COMPETITION_CATEGORIES),
  tier: z.enum(["accessible", "selective", "elite"]),
  level: z.enum(["international", "national", "regional"]),
  // Empty = relevant to any field. Same meaning as "all" in the catalog:
  // unknown facts never exclude.
  fields: z
    .array(z.enum(FACULTY_VALUES as [FacultyValue, ...FacultyValue[]]))
    .max(8),
  eligibility: z.string().trim().max(200),
  timing: z.enum(TIMING),
  deadline: z.string().trim(),
  eventWindow: z.string().trim().max(160),
  cost: z.enum([
    "free",
    "funded",
    "free_then_paid",
    "free_cert_paid",
    "freemium",
    "one_time",
    "subscription",
    "paid_aid",
    "varies",
  ]),
  costDetail: z.string().trim().max(DETAIL_MAX),
  // local → shown only to students in the partner's own country. That is the
  // whole point of a city hub's post, and it is also what keeps a Shymkent
  // hackathon off a Tashkent student's list.
  scope: z.enum(["local", "global"]),
  city: z.string().trim().max(60),
});

export type NewOpportunityInput = z.infer<typeof opportunitySchema>;

/** The caller's organisation, or an error explaining why it cannot post. */
async function activePartner(): Promise<
  { ok: true; partner: Partner; userId: string } | { ok: false; error: string }
> {
  const session = await requireSession("/partner");
  const partner = await getPartnerForUser(session.id);
  if (!partner) {
    return {
      ok: false,
      error: "This account is not linked to a partner organisation.",
    };
  }
  if (partner.status === "pending") {
    return { ok: false, error: "Your application is still being reviewed." };
  }
  if (partner.status !== "active") {
    return { ok: false, error: "This partner account cannot post right now." };
  }
  return { ok: true, partner, userId: session.id };
}

function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

/**
 * Resolve the timing choice into the two columns the card reads.
 *
 * `date_confirmed` is TRUE for a partner-set deadline, and this is the one
 * place in the codebase where that is granted without a scrape or a hand
 * check — because it is not a date we extracted from a page, it is the
 * organiser stating their own deadline. It is also why a past date is rejected
 * outright rather than stored: a countdown is the strongest claim this product
 * makes, and it has to stay worth something.
 */
function resolveTiming(
  input: NewOpportunityInput,
):
  | { ok: true; deadline: string; confirmed: boolean; alwaysOpen: boolean }
  | { ok: false; error: string } {
  if (input.timing === "deadline") {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(input.deadline)) {
      return { ok: false, error: "Enter the deadline as a date." };
    }
    if (input.deadline < todayISO()) {
      return { ok: false, error: "That deadline is in the past." };
    }
    return {
      ok: true,
      deadline: input.deadline,
      confirmed: true,
      alwaysOpen: false,
    };
  }
  return {
    ok: true,
    deadline: cycleEndPlaceholder(),
    confirmed: false,
    alwaysOpen: input.timing === "always_open",
  };
}

/** A row id nobody else holds: "astana-hub-nfactorial-2026", then -2, -3… */
async function uniqueId(partnerId: string, name: string): Promise<string> {
  const admin = createAdminClient();
  const base = `${partnerId}-${slugify(name) || "opportunity"}`.slice(0, 80);
  for (let n = 1; n < 30; n++) {
    const candidate = n === 1 ? base : `${base}-${n}`;
    const { data } = await admin
      .from("competition_deadlines")
      .select("id")
      .eq("id", candidate)
      .maybeSingle();
    if (!data) return candidate;
  }
  return `${base}-${Date.now().toString(36)}`;
}

function rowFrom(
  input: NewOpportunityInput,
  partner: Partner,
  timing: { deadline: string; confirmed: boolean; alwaysOpen: boolean },
) {
  return {
    name: input.name,
    // Empty selection means "any field", stored the same way the catalog
    // stores it so matching cannot tell a partner row apart.
    fields: input.fields.length > 0 ? input.fields : "all",
    deadline: timing.deadline,
    event_window:
      input.eventWindow ||
      (timing.alwaysOpen
        ? "Runs continuously. Start whenever you like"
        : "See the official page"),
    level: input.level,
    url: input.url,
    blurb: input.blurb,
    category: input.category,
    tier: input.tier,
    eligibility: input.eligibility || null,
    date_confirmed: timing.confirmed,
    always_open: timing.alwaysOpen,
    cost: input.cost,
    cost_detail: input.costDetail || null,
    // A local post inherits the organisation's country — the partner picks the
    // scope, never a country it does not belong to.
    region: input.scope === "local" ? partner.country : null,
    city: input.scope === "local" ? input.city || partner.city : null,
    cycle: currentCycle(),
    updated_at: new Date().toISOString(),
  };
}

function revalidateOpportunitySurfaces(partnerId: string): void {
  revalidatePath("/partner");
  revalidatePath(`/partners/${partnerId}`);
  revalidatePath("/partners");
  revalidatePath("/opportunities");
  revalidatePath("/admin/partners");
}

/** Create and publish. Live to students the moment this returns. */
export async function postOpportunity(
  input: NewOpportunityInput,
): Promise<PartnerResult> {
  const auth = await activePartner();
  if (!auth.ok) return auth;

  const parsed = opportunitySchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: firstIssue(parsed.error) };
  }
  const timing = resolveTiming(parsed.data);
  if (!timing.ok) return timing;

  const id = await uniqueId(auth.partner.id, parsed.data.name);
  const admin = createAdminClient();
  const { error } = await admin.from("competition_deadlines").insert({
    id,
    partner_id: auth.partner.id,
    published: true,
    posted_at: new Date().toISOString(),
    ...rowFrom(parsed.data, auth.partner, timing),
  });

  if (error) {
    console.error("[partners] post failed:", error);
    return {
      ok: false,
      error: "Could not publish that. Try again in a moment.",
    };
  }

  await logEvent(auth.userId, "partner_post");
  revalidateOpportunitySurfaces(auth.partner.id);
  return { ok: true, id };
}

/** Edit one of your own posts. Ownership is re-checked against partner_id. */
export async function updateOpportunity(
  id: string,
  input: NewOpportunityInput,
): Promise<PartnerResult> {
  const auth = await activePartner();
  if (!auth.ok) return auth;

  const parsed = opportunitySchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: firstIssue(parsed.error) };
  const timing = resolveTiming(parsed.data);
  if (!timing.ok) return timing;

  const admin = createAdminClient();
  const { error } = await admin
    .from("competition_deadlines")
    .update(rowFrom(parsed.data, auth.partner, timing))
    .eq("id", id)
    // The ownership check IS this filter: another partner's id simply matches
    // no rows.
    .eq("partner_id", auth.partner.id);

  if (error) {
    console.error("[partners] update failed:", error);
    return { ok: false, error: "Could not save those changes." };
  }

  revalidateOpportunitySurfaces(auth.partner.id);
  return { ok: true, id };
}

/**
 * Take a post down, or put it back up. Never a delete: a partner who pulls an
 * event that filled up should be able to run it again next year without
 * retyping it, and a student who committed to it keeps a record that resolves.
 */
export async function setOpportunityPublished(
  id: string,
  published: boolean,
): Promise<PartnerResult> {
  const auth = await activePartner();
  if (!auth.ok) return auth;

  const admin = createAdminClient();
  const { error } = await admin
    .from("competition_deadlines")
    .update({ published, updated_at: new Date().toISOString() })
    .eq("id", id)
    .eq("partner_id", auth.partner.id);

  if (error) return { ok: false, error: "Could not change that." };

  revalidateOpportunitySurfaces(auth.partner.id);
  return { ok: true, id };
}

const profileSchema = z.object({
  about: z.string().trim().max(600),
  website: z.string().trim().max(200),
  logoUrl: z.string().trim().max(300),
  city: z.string().trim().max(60),
  contactEmail: z.string().trim().max(120),
});

export type PartnerProfileInput = z.infer<typeof profileSchema>;

/**
 * Edit the public profile. Note what is NOT here: `name`, `status`,
 * `verified_at` and `country`. The tick has to keep meaning "we checked this
 * organisation" — if a verified partner could rename itself afterwards, the
 * mark would verify nothing at all. Renames go through an admin.
 */
export async function savePartnerProfile(
  input: PartnerProfileInput,
): Promise<PartnerResult> {
  const auth = await activePartner();
  if (!auth.ok) return auth;

  const parsed = profileSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: firstIssue(parsed.error) };

  const { about, website, logoUrl, city, contactEmail } = parsed.data;
  if (website && !/^https?:\/\//i.test(website)) {
    return { ok: false, error: "The website needs to start with https://" };
  }
  // A logo is either a file we committed to /public or the organisation's own
  // https URL. Anything else (a data: URI, a javascript: scheme) is refused.
  if (logoUrl && !/^(https:\/\/|\/)/.test(logoUrl)) {
    return { ok: false, error: "The logo needs to be an https:// link." };
  }

  const admin = createAdminClient();
  const { error } = await admin
    .from("partners")
    .update({
      about,
      website: website || null,
      logo_url: logoUrl || null,
      city: city || null,
      contact_email: contactEmail || null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", auth.partner.id);

  if (error) return { ok: false, error: "Could not save your profile." };

  revalidateOpportunitySurfaces(auth.partner.id);
  return { ok: true, id: auth.partner.id };
}

function firstIssue(error: z.ZodError): string {
  const issue = error.issues[0];
  const field = issue?.path?.[0];
  const where = typeof field === "string" ? `${field}: ` : "";
  return `${where}${issue?.message ?? "Something in that form isn't right."}`;
}

async function logEvent(userId: string, type: string): Promise<void> {
  try {
    const admin = createAdminClient();
    await admin.from("events").insert({ user_id: userId, type });
  } catch {
    // The event log is for metrics. It must never be the reason a partner's
    // post fails.
  }
}
