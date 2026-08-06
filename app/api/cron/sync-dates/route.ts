// Cron endpoint — syncs SAT dates and competition deadlines from official
// sources into Supabase. Called by Vercel Cron (weekly) or manually by admin.
//
// Security: protected by CRON_SECRET header (set in Vercel env) or admin session.
// If scraping fails for any source, the existing DB rows are left untouched
// (fail-safe: stale data is better than no data).

import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { denyUnlessCronAuthorized } from "@/lib/cron/auth";
import { scrapeSatDates, scrapeCompetitionDeadline } from "@/lib/scraper/scrape-dates";
import { COMPETITIONS, daysBetween, type Competition } from "@/lib/data/key-dates";

export const maxDuration = 300; // scraping multiple sites can be slow

// How many competitions to refresh per run. The registry has ~46 entries and
// one entry costs up to ~15s (10s fetch timeout + one Haiku extraction) — a
// single run over everything blew straight through the function timeout and
// synced NOTHING (the pre-batching failure mode). With a daily schedule and a
// rotating window, every competition is re-checked roughly every 6 days while
// a run stays comfortably under maxDuration.
const COMPS_PER_RUN = 8;

// Guardrail before trusting a scraped competition date. A wrong auto-date can
// push a student past a real deadline, so we only accept a scrape that is in the
// future, not absurdly far out, and reasonably close to the curated estimate for
// this competition. Anything else is rejected and the curated date is kept.
function acceptScrapedDate(
  scrapedISO: string,
  curated: Competition,
): { ok: true } | { ok: false; reason: string } {
  const today = new Date();
  const dToScraped = daysBetween(today, scrapedISO);
  if (dToScraped < 0) return { ok: false, reason: "date is in the past" };
  if (dToScraped > 430)
    return { ok: false, reason: "date is more than ~14 months out" };
  // Sanity vs. the curated estimate: a real cycle shift is small; a date half a
  // year off the known pattern is almost certainly the wrong event/cycle.
  const drift = Math.abs(daysBetween(curated.deadline, scrapedISO));
  if (drift > 200)
    return { ok: false, reason: `drifts ${drift}d from curated estimate` };
  return { ok: true };
}

export async function GET(req: NextRequest) {
  const denied = denyUnlessCronAuthorized(req);
  if (denied) return denied;

  const supabase = createAdminClient();
  const results: Record<string, string> = {};

  // ── 1. Sync SAT dates ────────────────────────────────────────────────────
  try {
    const { sittings, note } = await scrapeSatDates();
    if (sittings.length > 0) {
      // Upsert on test_date — that is the table's unique key. The old
      // delete-by-cycle-then-insert broke as soon as extraction started
      // working: a sitting already stored under a different cycle label hit
      // "duplicate key ... sat_sittings_test_date_key" and the whole batch
      // was lost. Each row's cycle is derived from its own test date, not
      // from today's date, so a run in July doesn't mislabel autumn sittings.
      const { error } = await supabase.from("sat_sittings").upsert(
        sittings.map((s) => ({
          test_date: s.test,
          reg_deadline: s.regDeadline,
          cycle: cycleForDate(s.test),
        })),
        { onConflict: "test_date" }
      );
      if (error) {
        console.error("Failed to upsert SAT sittings:", error);
        results.sat = `error: ${error.message}`;
      } else {
        results.sat = `synced ${sittings.length} sittings`;
      }
    } else {
      results.sat = `no dates (${note}) — kept existing`;
    }
  } catch (e) {
    console.error("SAT sync failed:", e);
    results.sat = `error: ${e instanceof Error ? e.message : "unknown"}`;
  }

  // ── 2. Sync competition deadlines (rotating batch) ───────────────────────
  // Use the hardcoded COMPETITIONS as the "registry" of which competitions to
  // track, but only refresh a day-rotated window per run — see COMPS_PER_RUN.
  const day = Math.floor(Date.now() / 86_400_000);
  const start = (day * COMPS_PER_RUN) % COMPETITIONS.length;
  const batch = Array.from(
    { length: Math.min(COMPS_PER_RUN, COMPETITIONS.length) },
    (_, i) => COMPETITIONS[(start + i) % COMPETITIONS.length],
  );

  for (const comp of batch) {
    try {
      const result = await scrapeCompetitionDeadline(comp.url, comp.name);

      // Record link health on every pass. The scrape already loaded the page,
      // so this is free — and a dead link is what a student actually hits
      // when they click "Details". Columns arrive in migration 0021; before
      // it is applied the update simply errors and is ignored.
      const linkOk = !(result.ok === false && result.reason === "fetch_failed");
      await supabase
        .from("competition_deadlines")
        .update({
          link_ok: linkOk,
          link_checked_at: new Date().toISOString(),
          link_detail: linkOk ? null : result.detail.slice(0, 200),
        })
        .eq("id", comp.id);

      if (!result.ok) {
        // Typed reason instead of a blanket "returned null", so a broken
        // pipeline is distinguishable from a page that has no dates.
        results[comp.id] = `no date (${result.reason}): ${result.detail}`;
        continue;
      }
      {
        const scraped = result;
        // Never trust a scrape blindly — it must clear the guardrail before it
        // can overwrite the curated date and drive a countdown.
        const verdict = acceptScrapedDate(scraped.deadline, comp);
        if (!verdict.ok) {
          console.warn(`Rejected ${comp.id} scrape (${scraped.deadline}): ${verdict.reason}`);
          results[comp.id] = `rejected: ${verdict.reason} (kept existing)`;
          continue;
        }
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
              // Only a guardrail-passed scrape is marked confirmed; this flag is
              // what lets the date overlay the curated one in the UI.
              date_confirmed: true,
              cycle: getCurrentCycle(),
              updated_at: new Date().toISOString(),
            },
            { onConflict: "id" }
          );
        if (error) {
          console.error(`Failed to upsert ${comp.id}:`, error);
          results[comp.id] = `error: ${error.message}`;
        } else {
          results[comp.id] =
            `synced: deadline ${scraped.deadline} (confirmed, ${scraped.pagesRead} page(s) read)`;
        }
      }
    } catch (e) {
      console.error(`Competition sync failed for ${comp.id}:`, e);
      results[comp.id] = `error: ${e instanceof Error ? e.message : "unknown"}`;
    }
  }

  return NextResponse.json({
    // Identifies which build answered — a run that silently predates a fix is
    // otherwise indistinguishable from one where the fix didn't work.
    scraper: "two-hop-v2",
    ok: true,
    syncedAt: new Date().toISOString(),
    batch: batch.map((c) => c.id),
    results,
  });
}

/** Academic cycle label, e.g. "2026-27" for dates from Aug 2026 to Jun 2027. */
function getCurrentCycle(): string {
  return cycleForDate(new Date().toISOString().slice(0, 10));
}

/**
 * The academic cycle a given ISO date belongs to. Derived from the date
 * itself, so an August sitting is labelled with the cycle it actually falls
 * in even when the sync runs in July.
 */
function cycleForDate(iso: string): string {
  const [y, m] = iso.split("-").map(Number);
  const year = m >= 8 ? y : y - 1; // academic year starts in August
  return `${year}-${String(year + 1).slice(2)}`;
}
