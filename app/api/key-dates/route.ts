// Public API: returns live SAT dates and competition deadlines from Supabase.
// Falls back to the hardcoded data in key-dates.ts if the DB is empty (e.g.
// migration not yet applied, or first deploy before the cron has run).
//
// Cached for 1 hour via Next.js ISR — the data changes at most weekly, so
// there's no need to hit Supabase on every page load.

import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  SAT_SITTINGS,
  resolveCompetitions,
  type SatSitting,
  type Competition,
} from "@/lib/data/key-dates";

export const revalidate = 3600; // ISR: regenerate every hour

export async function GET() {
  let satSittings: SatSitting[] = [];
  let competitions: Competition[] = [];

  try {
    const supabase = createAdminClient();

    // ── SAT sittings ──────────────────────────────────────────────────────
    const { data: satRows } = await supabase
      .from("sat_sittings")
      .select("test_date, reg_deadline")
      .order("test_date", { ascending: true });

    if (satRows && satRows.length > 0) {
      satSittings = satRows.map((r) => ({
        test: r.test_date,
        regDeadline: r.reg_deadline,
      }));
    }

    // ── Competitions ──────────────────────────────────────────────────────
    const { data: compRows } = await supabase
      .from("competition_deadlines")
      .select("*")
      .order("deadline", { ascending: true });

    if (compRows && compRows.length > 0) {
      // resolveCompetitions keeps the curated code authoritative and overlays a
      // live date only when the scraper confirmed it (date_confirmed) — so a
      // stale seed or an unconfirmed scrape can't surface a wrong date here.
      competitions = resolveCompetitions(
        compRows.map((r) => ({
          id: r.id,
          name: r.name,
          fields: r.fields as Competition["fields"],
          deadline: r.deadline,
          window: r.event_window,
          level: r.level as Competition["level"],
          url: r.url,
          blurb: r.blurb,
          dateConfirmed: r.date_confirmed === true,
        }))
      );
    }
  } catch (e) {
    console.error("Failed to fetch live dates from Supabase:", e);
  }

  // Fallback to the curated registry if the DB returned nothing.
  if (satSittings.length === 0) satSittings = SAT_SITTINGS;
  if (competitions.length === 0) competitions = resolveCompetitions();

  return NextResponse.json({ satSittings, competitions });
}
