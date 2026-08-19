// One discovery run — the code the weekly cron and the admin's "run it now"
// button both go through.
//
// It used to live inside the cron route, which meant discovery could only ever
// happen at 07:00 on a Tuesday. That is the whole reason the pipeline sat
// unexamined for a month: nobody could ask it a question and get an answer, so
// growing the catalog fell back to a person searching by hand, which is the
// expensive way to do the one thing this file automates.
//
// Everything here is idempotent and safe to run twice: the screening index
// carries the catalog, the queue and every already-rejected candidate, so a
// second run on the same target inserts nothing it inserted before.

import type { SupabaseClient } from "@supabase/supabase-js";
import { createAdminClient } from "@/lib/supabase/admin";
import { FACULTY_VALUES, type FacultyValue } from "@/lib/data/faculties";
import { LOCAL_TARGETS, normalizeCountry, type LocalTarget } from "@/lib/data/geo";
import {
  angleForRun,
  discoveryIndex,
  knownCompetitionNames,
  searchCandidates,
  searchLocalCandidates,
  verifyCandidates,
  type CandidateRow,
  type SearchAngle,
} from "@/lib/discovery/discover";
import type { RegistryEntry } from "@/lib/discovery/screen";

export type DiscoveryTarget =
  | { kind: "faculty"; faculty: FacultyValue }
  | { kind: "local"; target: LocalTarget };

/** What one target produced. `dropped` is never silent — see verifyCandidates. */
export type TargetOutcome = {
  tag: string;
  found: number;
  queued: number;
  /** Queued but carrying at least one screening flag for the reviewer. */
  flagged: number;
  dropped: { name: string; reason: string }[];
  error?: string;
  /** A normal outcome that isn't a failure — "nothing to search here yet". */
  note?: string;
};

export type DiscoveryRun = {
  ranAt: string;
  angle: string;
  inserted: number;
  outcomes: TargetOutcome[];
};

/** Rotating slice of the faculty list, so one run stays fast and cheap. */
export function facultyBatch(runIndex: number, perRun: number): FacultyValue[] {
  const start = (runIndex * perRun) % FACULTY_VALUES.length;
  return Array.from(
    { length: perRun },
    (_, i) => FACULTY_VALUES[(start + i) % FACULTY_VALUES.length],
  );
}

/** Whole weeks since the epoch — the rotation clock for scheduled runs. */
export function weekIndex(now: Date = new Date()): number {
  return Math.floor(now.getTime() / (7 * 24 * 3600 * 1000));
}

/**
 * The country to search locally in: whichever of our supported local targets
 * the most students actually come from, rotating weekly through the top 3 so
 * the second- and third-largest groups are not permanently ignored.
 */
export async function topLocalTarget(
  db: SupabaseClient,
  runIndex: number,
): Promise<LocalTarget | null> {
  const { data: profileRows } = await db.from("profiles").select("country");
  const counts = new Map<string, number>();
  for (const p of profileRows ?? []) {
    const code = normalizeCountry(p.country as string | null);
    if (code && LOCAL_TARGETS[code]) counts.set(code, (counts.get(code) ?? 0) + 1);
  }
  const top = [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([code]) => code);
  if (top.length === 0) return null;
  return LOCAL_TARGETS[top[runIndex % top.length]];
}

/**
 * Everything already known, in the two shapes discovery needs: an index for
 * deterministic dedup, and a name list for the search prompt's "don't return
 * these" instruction. Read once per run, not once per target.
 */
async function loadKnown(db: SupabaseClient) {
  const [{ data: candRows }, { data: liveRows }] = await Promise.all([
    db.from("competition_candidates").select("id, name, url"),
    db.from("competition_deadlines").select("id, name, url"),
  ]);
  const rows = [...(candRows ?? []), ...(liveRows ?? [])] as RegistryEntry[];
  return {
    index: discoveryIndex(rows),
    names: knownCompetitionNames(rows.map((r) => r.name)),
  };
}

/**
 * Insert candidates, tolerating a database that predates migration 0026.
 *
 * Same degradation contract as the intents columns: the new column is dropped
 * from the payload and the insert retried, so a deploy that lands before the
 * migration is applied still queues candidates — it just queues them without
 * their screening warnings, which is the old behaviour, not a broken one.
 */
async function insertCandidates(
  db: SupabaseClient,
  rows: CandidateRow[],
): Promise<string | null> {
  const payload = rows.map((c) => ({
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
    warnings: c.warnings,
  }));

  const { error } = await db.from("competition_candidates").insert(payload);
  if (!error) return null;
  if (error.code !== "42703" && error.code !== "PGRST204") return error.message;

  const { error: retryErr } = await db.from("competition_candidates").insert(
    payload.map(({ warnings: _warnings, ...rest }) => rest),
  );
  return retryErr ? retryErr.message : null;
}

/**
 * Run discovery over one or more targets at one angle and queue what survives.
 *
 * The angle is the question being asked (see SEARCH_ANGLES) — the same faculty
 * at a different angle is a genuinely different search, which is what makes
 * re-running a faculty worth the few cents it costs.
 */
export async function runDiscovery(
  targets: DiscoveryTarget[],
  angle: SearchAngle,
  db: SupabaseClient = createAdminClient(),
): Promise<DiscoveryRun> {
  const { index, names } = await loadKnown(db);
  const outcomes: TargetOutcome[] = [];
  let inserted = 0;

  for (const target of targets) {
    const tag = target.kind === "faculty" ? target.faculty : `local:${target.target.code}`;
    try {
      const { candidates: raw } =
        target.kind === "faculty"
          ? await searchCandidates(target.faculty, names, angle)
          : await searchLocalCandidates(target.target, names, angle);

      const region = target.kind === "local" ? target.target.code : null;
      const { rows, dropped } = await verifyCandidates(
        raw,
        index,
        `${tag} · ${angle.label}`,
        region,
      );

      let error: string | undefined;
      if (rows.length > 0) {
        error = (await insertCandidates(db, rows)) ?? undefined;
        if (!error) {
          inserted += rows.length;
          // Later targets in the same run must not re-propose what this one
          // just queued.
          for (const r of rows) {
            index.ids.add(r.id);
            index.names.push(r.name);
            names.push(r.name);
          }
        }
      }

      outcomes.push({
        tag,
        found: raw.length,
        queued: error ? 0 : rows.length,
        flagged: error ? 0 : rows.filter((r) => r.warnings.length > 0).length,
        dropped,
        error,
      });
    } catch (e) {
      console.error(`[discover] ${tag} failed:`, e);
      outcomes.push({
        tag,
        found: 0,
        queued: 0,
        flagged: 0,
        dropped: [],
        error: e instanceof Error ? e.message : "unknown error",
      });
    }
  }

  return { ranAt: new Date().toISOString(), angle: angle.label, inserted, outcomes };
}

/** The scheduled run: a rotating faculty batch plus one local country. */
export async function runScheduledDiscovery(
  facultiesPerRun: number,
  db: SupabaseClient = createAdminClient(),
): Promise<DiscoveryRun> {
  const week = weekIndex();
  const targets: DiscoveryTarget[] = facultyBatch(week, facultiesPerRun).map((faculty) => ({
    kind: "faculty" as const,
    faculty,
  }));

  const local = await topLocalTarget(db, week);
  if (local) targets.push({ kind: "local", target: local });

  // The angle advances every week too, so the faculty that comes round again in
  // a month is asked a different question than it was last time.
  const run = await runDiscovery(targets, angleForRun(week), db);

  if (!local) {
    run.outcomes.push({
      tag: "local",
      found: 0,
      queued: 0,
      flagged: 0,
      dropped: [],
      note: "skipped: no students from a supported local-target country yet",
    });
  }
  return run;
}
