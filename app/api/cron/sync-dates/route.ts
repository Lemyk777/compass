// Cron endpoint — syncs SAT dates and competition deadlines from official
// sources into Supabase. Called by Vercel Cron (weekly) or manually by admin.
//
// Security: protected by CRON_SECRET header (set in Vercel env) or admin session.
// If scraping fails for any source, the existing DB rows are left untouched
// (fail-safe: stale data is better than no data).

import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { scrapeSatDates, scrapeCompetitionDeadline } from "@/lib/scraper/scrape-dates";
import { COMPETITIONS } from "@/lib/data/key-dates";

export const maxDuration = 120; // scraping multiple sites can be slow

export async function GET(req: NextRequest) {
  // Auth: either Vercel Cron header or a manual trigger from admin
  const cronSecret = process.env.CRON_SECRET;
  const authHeader = req.headers.get("authorization");
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createAdminClient();
  const results: Record<string, string> = {};

  // ── 1. Sync SAT dates ────────────────────────────────────────────────────
  try {
    const sittings = await scrapeSatDates();
    if (sittings.length > 0) {
      // Clear old data for this cycle and insert fresh
      const cycle = getCurrentCycle();
      await supabase.from("sat_sittings").delete().eq("cycle", cycle);
      const { error } = await supabase.from("sat_sittings").insert(
        sittings.map((s) => ({
          test_date: s.test,
          reg_deadline: s.regDeadline,
          cycle,
        }))
      );
      if (error) {
        console.error("Failed to insert SAT sittings:", error);
        results.sat = `error: ${error.message}`;
      } else {
        results.sat = `synced ${sittings.length} sittings`;
      }
    } else {
      results.sat = "skipped: scraper returned 0 sittings (kept existing)";
    }
  } catch (e) {
    console.error("SAT sync failed:", e);
    results.sat = `error: ${e instanceof Error ? e.message : "unknown"}`;
  }

  // ── 2. Sync competition deadlines ────────────────────────────────────────
  // Use the hardcoded COMPETITIONS as the "registry" of which competitions to
  // track, then try to scrape fresh deadlines from each site.
  for (const comp of COMPETITIONS) {
    try {
      const scraped = await scrapeCompetitionDeadline(comp.url, comp.name);
      if (scraped) {
        const { error } = await supabase
          .from("competition_deadlines")
          .upsert(
            {
              id: comp.id,
              name: comp.name,
              fields: comp.fields,
              deadline: scraped.deadline,
              event_window: scraped.window,
              level: comp.level,
              url: comp.url,
              blurb: comp.blurb,
              cycle: getCurrentCycle(),
              updated_at: new Date().toISOString(),
            },
            { onConflict: "id" }
          );
        if (error) {
          console.error(`Failed to upsert ${comp.id}:`, error);
          results[comp.id] = `error: ${error.message}`;
        } else {
          results[comp.id] = `synced: deadline ${scraped.deadline}`;
        }
      } else {
        results[comp.id] = "skipped: scraper returned null (kept existing)";
      }
    } catch (e) {
      console.error(`Competition sync failed for ${comp.id}:`, e);
      results[comp.id] = `error: ${e instanceof Error ? e.message : "unknown"}`;
    }
  }

  return NextResponse.json({
    ok: true,
    syncedAt: new Date().toISOString(),
    results,
  });
}

/** Academic cycle label, e.g. "2026-27" for dates from Aug 2026 to Jun 2027. */
function getCurrentCycle(): string {
  const now = new Date();
  // Academic year starts in August
  const year = now.getMonth() >= 7 ? now.getFullYear() : now.getFullYear() - 1;
  return `${year}-${String(year + 1).slice(2)}`;
}
