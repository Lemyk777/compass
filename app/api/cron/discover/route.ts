// Cron endpoint — discovers NEW competition candidates via web search and
// queues them for admin review in `competition_candidates`. Students never see
// anything from this route directly: approval happens at /admin/opportunities.
//
// Cost control: one Haiku call (with up to 5 web searches) per faculty, and
// only 2 faculties per run, rotating weekly — the full 8-faculty cycle takes
// a month. Verification adds one cheap Haiku extraction per NEW candidate.
//
// Security: protected by CRON_SECRET header (same contract as sync-dates).

import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { denyUnlessCronAuthorized } from "@/lib/cron/auth";
import { FACULTY_VALUES } from "@/lib/data/faculties";
import { LOCAL_TARGETS, normalizeCountry } from "@/lib/data/geo";
import {
  knownCompetitionNames,
  searchCandidates,
  searchLocalCandidates,
  verifyCandidates,
  type CandidateRow,
} from "@/lib/discovery/discover";

export const maxDuration = 300; // web search + per-candidate verification is slow

const FACULTIES_PER_RUN = 2;

export async function GET(req: NextRequest) {
  const denied = denyUnlessCronAuthorized(req);
  if (denied) return denied;

  const supabase = createAdminClient();
  const results: Record<string, string> = {};

  // Everything already known in the DB — dedup + "already known" prompt list.
  const [{ data: candRows }, { data: liveRows }] = await Promise.all([
    supabase.from("competition_candidates").select("id, name"),
    supabase.from("competition_deadlines").select("id, name"),
  ]);
  const knownIds = new Set<string>([
    ...(candRows ?? []).map((r: { id: string }) => r.id),
    ...(liveRows ?? []).map((r: { id: string }) => r.id),
  ]);
  const knownNames = knownCompetitionNames([
    ...(candRows ?? []).map((r: { name: string }) => r.name),
    ...(liveRows ?? []).map((r: { name: string }) => r.name),
  ]);

  // Weekly rotation through the faculty list so a single run stays fast/cheap.
  const week = Math.floor(Date.now() / (7 * 24 * 3600 * 1000));
  const start = (week * FACULTIES_PER_RUN) % FACULTY_VALUES.length;
  const batch = Array.from(
    { length: FACULTIES_PER_RUN },
    (_, i) => FACULTY_VALUES[(start + i) % FACULTY_VALUES.length],
  );

  let inserted = 0;

  async function insertCandidates(tag: string, verified: CandidateRow[], foundCount: number) {
    if (verified.length === 0) {
      results[tag] = `found ${foundCount}, kept 0 after dedup/verification`;
      return;
    }
    const { error } = await supabase.from("competition_candidates").insert(
      verified.map((c) => ({
        id: c.id,
        name: c.name,
        url: c.url,
        fields: c.fields,
        level: c.level,
        category: c.category,
        tier: c.tier,
        deadline: c.deadline,
        event_window: c.event_window,
        blurb: c.blurb,
        eligibility: c.eligibility,
        date_confirmed: c.date_confirmed,
        date_evidence: c.date_evidence,
        source: c.source,
        region: c.region,
        city: c.city,
      })),
    );
    if (error) {
      results[tag] = `error: ${error.message}`;
    } else {
      for (const c of verified) knownIds.add(c.id);
      inserted += verified.length;
      results[tag] = `queued ${verified.length} candidate(s) for review`;
    }
  }

  // ── Global discovery: the rotating faculty batch ──────────────────────────
  for (const faculty of batch) {
    try {
      const { candidates: raw, query } = await searchCandidates(faculty, knownNames);
      const verified = await verifyCandidates(raw, knownIds, query);
      await insertCandidates(faculty, verified, raw.length);
    } catch (e) {
      console.error(`[discover] faculty ${faculty} failed:`, e);
      results[faculty] = `error: ${e instanceof Error ? e.message : "unknown"}`;
    }
  }

  // ── Local discovery: one country per run, chosen by where students are ────
  // Normalize the free-text profile countries, keep those we have local-search
  // metadata for, and rotate weekly through the top 3 by student count.
  let localTag = "local";
  try {
    const { data: profileRows } = await supabase.from("profiles").select("country");
    const counts = new Map<string, number>();
    for (const p of profileRows ?? []) {
      const code = normalizeCountry(p.country as string | null);
      if (code && LOCAL_TARGETS[code]) counts.set(code, (counts.get(code) ?? 0) + 1);
    }
    const top = [...counts.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([code]) => code);

    if (top.length > 0) {
      const target = LOCAL_TARGETS[top[week % top.length]];
      localTag = `local:${target.code}`;
      const { candidates: raw, query } = await searchLocalCandidates(target, knownNames);
      const verified = await verifyCandidates(raw, knownIds, query, target.code);
      await insertCandidates(localTag, verified, raw.length);
    } else {
      results[localTag] = "skipped: no students from a supported local-target country yet";
    }
  } catch (e) {
    console.error(`[discover] local batch failed:`, e);
    results[localTag] = `error: ${e instanceof Error ? e.message : "unknown"}`;
  }

  return NextResponse.json({
    ok: true,
    ranAt: new Date().toISOString(),
    faculties: batch,
    inserted,
    results,
  });
}
