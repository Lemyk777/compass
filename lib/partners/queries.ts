// Server-side reads for the partner feature.
//
// These used to swallow every error — `{ data }` without `error`, wrapped in an
// empty catch — because the tables might not exist yet (0024 is applied by
// hand). The cost of that was a lie the admin console could not detect: a broken
// query and an empty review queue looked identical, so "no applications waiting"
// might have meant "the query has been failing for a week".
//
// The premise is gone: `npm run db:check` verifies 0024 is applied and fails
// loudly if it ever isn't, so the code no longer has to survive a schema it
// can't see. A failed query now throws, which is the honest signal — pages that
// must not lie surface an error, and the ONE surface that genuinely prefers
// degrading (the guest Opportunities page, where partner posts are additive to a
// curated catalog) says so at its own call site instead of every reader here
// pretending nothing went wrong.

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { partnerFromRow, type Partner } from "@/lib/data/partners";
import type { Competition, Opportunity } from "@/lib/data/key-dates";
import { competitionsFromRows } from "./live";

type Row = Record<string, unknown>;

/** Postgres said no ⇒ say so. An empty result must only ever mean "empty". */
function ok<T>(
  res: { data: T; error: { message: string } | null },
  what: string,
): T {
  if (res.error) throw new Error(`partners/${what}: ${res.error.message}`);
  return res.data;
}

/** Every organisation currently listed publicly, newest first. */
export async function listActivePartners(): Promise<Partner[]> {
  const supabase = createClient();
  const data = ok(
    await supabase
      .from("partners")
      .select("*")
      .eq("status", "active")
      .order("created_at", { ascending: false }),
    "listActivePartners",
  );
  return ((data ?? []) as Row[]).map(partnerFromRow);
}

/** One organisation's public profile. Null for pending/suspended/unknown ids. */
export async function getActivePartner(id: string): Promise<Partner | null> {
  const supabase = createClient();
  const data = ok(
    await supabase
      .from("partners")
      .select("*")
      .eq("id", id)
      .eq("status", "active")
      .maybeSingle(),
    "getActivePartner",
  );
  return data ? partnerFromRow(data as Row) : null;
}

/**
 * The organisation this account posts as — in ANY state, including `pending`,
 * because an applicant needs to see that their application is being reviewed
 * and read the reviewer's note. Service role: a pending row is invisible to the
 * public policy, and the caller has already been checked by the page.
 */
export async function getPartnerForUser(userId: string): Promise<Partner | null> {
  const admin = createAdminClient();
  const data = ok(
    await admin.from("partners").select("*").eq("user_id", userId).maybeSingle(),
    "getPartnerForUser",
  );
  return data ? partnerFromRow(data as Row) : null;
}

/** All organisations, for the admin review queue. */
export async function listAllPartners(): Promise<Partner[]> {
  const admin = createAdminClient();
  const data = ok(
    await admin
      .from("partners")
      .select("*")
      .order("created_at", { ascending: false }),
    "listAllPartners",
  );
  return ((data ?? []) as Row[]).map(partnerFromRow);
}

/**
 * The live opportunity pool for a public/student surface: published rows only,
 * with partner attribution attached and suspended partners' posts removed.
 * These are RAW live rows — resolveCompetitions() still decides how they merge
 * with the curated registry.
 */
export async function fetchLivePool(): Promise<Competition[]> {
  const supabase = createClient();
  const [comps, partners] = await Promise.all([
    supabase.from("competition_deadlines").select("*").order("deadline", { ascending: true }),
    supabase.from("partners").select("*").eq("status", "active"),
  ]);
  return competitionsFromRows(
    ok(comps, "fetchLivePool/competitions") as Row[] | null,
    ok(partners, "fetchLivePool/partners") as Row[] | null,
  );
}

/**
 * One partner's live opportunities, in the exact shape a card renders — for
 * their public profile page, which is the link an organisation puts in front of
 * its own audience. It ignores the student matching rules on purpose: someone
 * who arrived from Astana Hub's Instagram came to see what Astana Hub runs, not
 * a list filtered by a school year we never asked them for.
 *
 * Server-only, and the one place outside the matching views that imports the
 * catalog helpers — the resolution rules for tier/category must not be
 * reimplemented per surface.
 */
export async function partnerOpportunities(partnerId: string): Promise<Opportunity[]> {
  const { competitionTier, competitionCategory, daysBetween } = await import(
    "@/lib/data/key-dates"
  );
  const pool = await fetchLivePool();
  const today = new Date();

  return pool
    .filter((c) => c.partner?.id === partnerId)
    .map((c) => ({
      ...c,
      // A partner viewing their own posts is not being narrowed by either gate —
      // this list is scoped by partner id, not by a student profile.
      offField: false,
      offRegion: false,
      daysToDeadline: daysBetween(today, c.deadline),
      tierResolved: competitionTier(c),
      categoryResolved: competitionCategory(c),
      fit: "recommended" as const,
    }))
    .sort((a, b) => {
      // Actionable first: a real deadline, then the always-open ones, then the
      // rows with nothing to announce yet.
      const rank = (o: Opportunity) => (o.dateConfirmed ? 0 : o.alwaysOpen ? 1 : 2);
      return rank(a) - rank(b) || a.daysToDeadline - b.daysToDeadline;
    });
}

/**
 * A partner's own posts, published or not — the console list and the admin
 * detail view. Service role, because an unpublished row is invisible to RLS by
 * design; callers must have established ownership first.
 */
export type PartnerPost = {
  id: string;
  name: string;
  url: string;
  blurb: string;
  deadline: string;
  eventWindow: string;
  dateConfirmed: boolean;
  alwaysOpen: boolean;
  published: boolean;
  category: string | null;
  tier: string | null;
  level: string;
  fields: string[] | "all";
  eligibility: string | null;
  cost: string | null;
  costDetail: string | null;
  region: string | null;
  city: string | null;
  postedAt: string | null;
};

export async function listPartnerPosts(partnerId: string): Promise<PartnerPost[]> {
  const admin = createAdminClient();
  const data = ok(
    await admin
      .from("competition_deadlines")
      .select("*")
      .eq("partner_id", partnerId)
      .order("posted_at", { ascending: false }),
    "listPartnerPosts",
  );
  return ((data ?? []) as Row[]).map(postFromRow);
}

/**
 * How many live posts each partner has, for the public index. Deliberately the
 * anon client: it can only see published rows, which is exactly the number the
 * page claims ("3 open now").
 */
export async function partnerPostCounts(): Promise<Map<string, { live: number }>> {
  const counts = new Map<string, { live: number }>();
  const supabase = createClient();
  const data = ok(
    await supabase
      .from("competition_deadlines")
      .select("partner_id")
      .not("partner_id", "is", null),
    "partnerPostCounts",
  );
  for (const r of (data ?? []) as Row[]) {
    const id = r.partner_id as string;
    counts.set(id, { live: (counts.get(id)?.live ?? 0) + 1 });
  }
  return counts;
}

/** Every partner post, grouped by partner — the admin review table. */
export async function listAllPartnerPosts(): Promise<Map<string, PartnerPost[]>> {
  const byPartner = new Map<string, PartnerPost[]>();
  const admin = createAdminClient();
  const data = ok(
    await admin
      .from("competition_deadlines")
      .select("*")
      .not("partner_id", "is", null)
      .order("posted_at", { ascending: false }),
    "listAllPartnerPosts",
  );
  for (const r of (data ?? []) as Row[]) {
    const id = r.partner_id as string;
    const list = byPartner.get(id) ?? [];
    list.push(postFromRow(r));
    byPartner.set(id, list);
  }
  return byPartner;
}

function postFromRow(r: Row): PartnerPost {
  return {
    id: r.id as string,
    name: r.name as string,
    url: r.url as string,
    blurb: (r.blurb as string | null) ?? "",
    deadline: r.deadline as string,
    eventWindow: (r.event_window as string | null) ?? "",
    dateConfirmed: r.date_confirmed === true,
    alwaysOpen: r.always_open === true,
    published: r.published !== false,
    category: (r.category as string | null) ?? null,
    tier: (r.tier as string | null) ?? null,
    level: (r.level as string | null) ?? "regional",
    fields: (r.fields as string[] | "all") ?? "all",
    eligibility: (r.eligibility as string | null) ?? null,
    cost: (r.cost as string | null) ?? null,
    costDetail: (r.cost_detail as string | null) ?? null,
    region: (r.region as string | null) ?? null,
    city: (r.city as string | null) ?? null,
    postedAt: (r.posted_at as string | null) ?? null,
  };
}
