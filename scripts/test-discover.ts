// Live smoke test for the discovery engine (no DB writes).
// Runs one target through search + screening + verification and prints what
// survived, what was dropped and why.
//
//   npm run test:discover                     (business_economics, first angle)
//   npm run test:discover -- law              (any FacultyValue)
//   npm run test:discover -- KZ               (any LOCAL_TARGETS country code)
//   npm run test:discover -- law writing      (target + angle key)
//
// Needs ANTHROPIC_API_KEY in .env.local. Costs a few cents (one Haiku call
// with up to 6 web searches + one page fetch and one extraction per candidate).

import { FACULTY_VALUES, type FacultyValue } from "../lib/data/faculties";
import { LOCAL_TARGETS } from "../lib/data/geo";
import {
  SEARCH_ANGLES,
  angleByKey,
  discoveryIndex,
  knownCompetitionNames,
  searchCandidates,
  searchLocalCandidates,
  verifyCandidates,
} from "../lib/discovery/discover";

async function main() {
  // Arg 1: a faculty ("law") for global discovery, or a country code ("KZ")
  // for local discovery. Arg 2: an angle key. Defaults: business_economics,
  // the first angle.
  const arg = process.argv[2];
  const localTarget = arg ? LOCAL_TARGETS[arg.toUpperCase()] : undefined;
  const faculty: FacultyValue =
    arg && FACULTY_VALUES.includes(arg as FacultyValue)
      ? (arg as FacultyValue)
      : "business_economics";
  const angle = angleByKey(process.argv[3]) ?? SEARCH_ANGLES[0];

  console.log(
    `── Discovery smoke test: ${localTarget ? `local ${localTarget.name}` : faculty} · ${angle.label} ──`,
  );
  console.log(`   (angles: ${SEARCH_ANGLES.map((a) => a.key).join(", ")})`);
  const t0 = Date.now();

  const known = knownCompetitionNames([]);
  const { candidates: raw, query } = localTarget
    ? await searchLocalCandidates(localTarget, known, angle)
    : await searchCandidates(faculty, known, angle);
  console.log(`\nSearch returned ${raw.length} raw candidate(s) [${query}]`);
  for (const c of raw) console.log(`  • ${c.name} — ${c.url}`);

  const { rows, dropped } = await verifyCandidates(
    raw,
    discoveryIndex(),
    query,
    localTarget?.code ?? null,
  );

  if (dropped.length > 0) {
    console.log(`\nDropped ${dropped.length}:`);
    for (const d of dropped) console.log(`  ✗ ${d.name} — ${d.reason}`);
  }

  console.log(`\nSurvived screening + verification: ${rows.length}`);
  for (const c of rows) {
    console.log(`\n  ${c.name}  (${c.id})`);
    console.log(`    url:         ${c.url}`);
    console.log(`    fields:      ${JSON.stringify(c.fields)}`);
    console.log(`    level/tier:  ${c.level} / ${c.tier} / ${c.category}`);
    console.log(`    deadline:    ${c.deadline ?? "—"}  confirmed=${c.date_confirmed}`);
    if (c.region) console.log(`    local:       ${c.region}${c.city ? ` / ${c.city}` : ""}`);
    console.log(`    evidence:    ${c.date_evidence}`);
    console.log(`    eligibility: ${c.eligibility ?? "—"}`);
    console.log(`    blurb:       ${c.blurb}`);
    for (const w of c.warnings) console.log(`    ⚠ ${w.code}: ${w.detail}`);
  }

  console.log(`\nDone in ${((Date.now() - t0) / 1000).toFixed(1)}s`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
