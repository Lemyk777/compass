// Does the database actually have the schema this code assumes?
//
// Migrations here are applied by hand in the Supabase SQL editor, so the only
// record of what is applied has been a note in a doc — and that record was wrong
// once already: `0010_graduation_year` sat unapplied for months while the app
// quietly degraded, re-asking every student their school year forever.
//
// That uncertainty is why the codebase is full of defensive scaffolding —
// `select("*")` so a missing column can't fail a query, empty catches so a
// missing table reads as "no rows", coalescing every newer field to null. All of
// it exists to survive a state nobody could check. This makes the state
// checkable in two seconds, which is what has to be true before any of that
// scaffolding can be deleted.
//
// Read-only: it touches information_schema and nothing else.
//
//   npm run db:check
//
// Needs NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (via
// `node --env-file=.env.local`, which the npm script does).

import { createClient } from "@supabase/supabase-js";

/** table → columns this code requires, keyed by the migration that adds them. */
const EXPECTED: { migration: string; table: string; columns: string[] }[] = [
  { migration: "0001 init", table: "profiles", columns: ["id", "role", "country"] },
  { migration: "0001 init", table: "student_profiles", columns: ["user_id", "curriculum"] },
  { migration: "0001 init", table: "analyses", columns: ["user_id", "output"] },
  { migration: "0001 init", table: "ambassadors", columns: ["user_id", "code"] },
  { migration: "0001 init", table: "events", columns: ["user_id", "type"] },
  { migration: "0002 honors", table: "student_profiles", columns: ["honors"] },
  { migration: "0003 italy", table: "student_profiles", columns: ["include_italy", "italy_programs"] },
  { migration: "0004 destinations", table: "student_profiles", columns: ["destinations", "faculties"] },
  { migration: "0005 hong kong", table: "student_profiles", columns: ["hk_programs"] },
  { migration: "0006 heard from", table: "profiles", columns: ["heard_from"] },
  { migration: "0007 analysis usage", table: "analyses", columns: ["usage"] },
  { migration: "0009 onboarding extras", table: "student_profiles", columns: ["budget_annual_usd"] },
  { migration: "0010 graduation year", table: "student_profiles", columns: ["graduation_year"] },
  { migration: "0011 key dates", table: "competition_deadlines", columns: ["id", "deadline"] },
  { migration: "0011 key dates", table: "sat_sittings", columns: ["test_date", "reg_deadline"] },
  { migration: "0015 date confirmed", table: "competition_deadlines", columns: ["date_confirmed"] },
  { migration: "0016 uae", table: "student_profiles", columns: ["uae_programs"] },
  { migration: "0017 korea", table: "student_profiles", columns: ["kr_programs", "kr_topik_level"] },
  { migration: "0018 school years", table: "student_profiles", columns: ["school_years"] },
  { migration: "0019 model output", table: "analyses", columns: ["model_output"] },
  { migration: "0020 discovery", table: "competition_candidates", columns: ["id", "tier", "region"] },
  { migration: "0021 link health", table: "competition_deadlines", columns: ["link_ok", "link_detail", "link_checked_at"] },
  { migration: "0022 intents", table: "opportunity_intents", columns: ["user_id", "opportunity_id", "status"] },
  { migration: "0023 why matters", table: "opportunity_intents", columns: ["why_matters"] },
  { migration: "0024 partners", table: "partners", columns: ["id", "status", "verified_at"] },
  { migration: "0024 partners", table: "competition_deadlines", columns: ["partner_id", "published", "cost"] },
  { migration: "0025 traffic", table: "page_views", columns: ["visitor_id", "session_id", "path", "dwell_ms"] },
  { migration: "0026 discovery quality", table: "competition_candidates", columns: ["warnings"] },
  { migration: "0027 pinned", table: "competition_deadlines", columns: ["pinned"] },
  { migration: "0028 planner", table: "planner_items", columns: ["user_id", "title", "due_date", "status", "link_href"] },
  { migration: "0029 planner maps", table: "planner_map_nodes", columns: ["user_id", "map_id", "parent_id", "label", "position", "link_href"] },
  { migration: "0030 planner path", table: "planner_path", columns: ["user_id", "ref", "label", "href", "added_at"] },
  { migration: "0031 beat reactions", table: "beat_reactions", columns: ["user_id", "beat_id", "reaction", "created_at"] },
];

async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    console.error(
      "Missing NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY.\n" +
        "Run with: npm run db:check (it loads .env.local)",
    );
    process.exit(2);
  }

  const db = createClient(url, key, { auth: { persistSession: false } });

  // Ask the database itself, one probe per group: `select(cols).limit(0)`
  // returns no rows and no data, but PostgREST answers 42P01 for a missing
  // table and 42703 for a missing column. That needs nothing exposed in
  // Settings → API, which asking for information_schema would have.
  async function probe(
    table: string,
    columns: string[],
  ): Promise<{ ok: true } | { ok: false; kind: "table" | "column" }> {
    const { error } = await db.from(table).select(columns.join(",")).limit(0);
    if (!error) return { ok: true };
    if (error.code === "42P01") return { ok: false, kind: "table" };
    return { ok: false, kind: "column" };
  }

  let missing = 0;
  for (const e of EXPECTED) {
    const grouped = await probe(e.table, e.columns);
    if (grouped.ok) continue;

    if (grouped.kind === "table") {
      console.log(`MISSING  ${e.migration.padEnd(24)} table "${e.table}"`);
      missing++;
      continue;
    }

    // Narrow it down so the output names the column to add, not just the group.
    const absent: string[] = [];
    for (const c of e.columns) {
      const one = await probe(e.table, [c]);
      if (!one.ok) absent.push(c);
    }
    console.log(
      `MISSING  ${e.migration.padEnd(24)} ${e.table}.${absent.join(`, ${e.table}.`)}`,
    );
    missing++;
  }

  if (missing === 0) {
    console.log(`applied: all ${EXPECTED.length} checks pass — schema matches the code.`);
    process.exit(0);
  }
  console.log(
    `\n${missing} check(s) failed. Apply the SQL in supabase/migrations/ for each,` +
      ` then re-run.`,
  );
  process.exit(1);
}

main();
