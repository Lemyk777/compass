// Live Supabase rows → the Competition shape the whole app renders from.
//
// This mapping used to live inline in app/dashboard/layout.tsx. It moved here
// the moment a second surface needed it (the public eligibility checker, which
// must show partner-posted opportunities too) — two copies of "what a live row
// means" would drift, and the thing they would drift about is whether a
// suspended organisation's posts are still on screen.
//
// Pure and dependency-light on purpose: `Competition` is imported as a type
// only, so nothing here drags the ~2,700-entry catalog into a bundle.

import type { Competition } from "@/lib/data/key-dates";
import { partnerFromRow, partnerRef, type PartnerRef } from "@/lib/data/partners";

type Row = Record<string, unknown>;

/** Active partners, keyed by id, in the card-sized shape. */
export function partnerRefsById(rows: Row[] | null | undefined): Map<string, PartnerRef> {
  const map = new Map<string, PartnerRef>();
  for (const r of rows ?? []) {
    const ref = partnerRef(partnerFromRow(r));
    if (ref) map.set(ref.id, ref);
  }
  return map;
}

/**
 * Live competition rows, mapped and filtered.
 *
 * Two rows never make it out of here:
 *  • `published = false` — taken down by an admin or by the partner itself.
 *  • a row whose partner is no longer ACTIVE (suspended, or the application was
 *    revoked). Suspension has to remove the posts as well as the account,
 *    otherwise "we can suspend them" is not actually a kill switch. Belt and
 *    braces with the RLS policy, because the admin client bypasses RLS.
 */
export function competitionsFromRows(
  compRows: Row[] | null | undefined,
  partnerRows: Row[] | null | undefined,
): Competition[] {
  const partners = partnerRefsById(partnerRows);
  const out: Competition[] = [];

  for (const r of compRows ?? []) {
    if (r.published === false) continue;

    const partnerId = (r.partner_id as string | null) ?? null;
    if (partnerId) {
      const ref = partners.get(partnerId);
      if (!ref) continue;
      out.push({ ...baseCompetition(r), partner: ref });
    } else {
      out.push(baseCompetition(r));
    }
  }

  return out;
}

function baseCompetition(r: Row): Competition {
  return {
    id: r.id as string,
    name: r.name as string,
    fields: r.fields as Competition["fields"],
    deadline: r.deadline as string,
    window: r.event_window as string,
    level: r.level as Competition["level"],
    url: r.url as string,
    blurb: r.blurb as string,
    dateConfirmed: r.date_confirmed === true,
    // Discovery columns (migration 0020). Absent on an older DB → undefined,
    // and competitionTier()/competitionCategory() supply the defaults.
    category: (r.category as Competition["category"]) ?? undefined,
    tier: (r.tier as Competition["tier"]) ?? undefined,
    eligibility: (r.eligibility as string | null) ?? undefined,
    region: (r.region as string | null) ?? null,
    city: (r.city as string | null) ?? null,
    // Partner columns (migration 0024). Cost had never been storable before, so
    // every live-only row rendered "cost unverified" no matter what its poster
    // knew.
    cost: (r.cost as Competition["cost"]) ?? undefined,
    costDetail: (r.cost_detail as string | null) ?? undefined,
    alwaysOpen: r.always_open === true,
  };
}
