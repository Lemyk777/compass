// Live smoke test for the discovery engine (no DB writes).
// Runs one faculty through search + verification and prints the candidates.
//
//   npm run test:discover            (defaults to business_economics)
//   npm run test:discover -- law     (any FacultyValue)
//
// Needs ANTHROPIC_API_KEY in .env.local. Costs a few cents (one Haiku call
// with up to 5 web searches + one extraction per new candidate).

import { FACULTY_VALUES, type FacultyValue } from "../lib/data/faculties";
import { LOCAL_TARGETS } from "../lib/data/geo";
import {
  knownCompetitionNames,
  searchCandidates,
  searchLocalCandidates,
  verifyCandidates,
} from "../lib/discovery/discover";

async function main() {
  // Arg: a faculty ("law") for global discovery, or a country code ("KZ")
  // for local discovery. Default: business_economics.
  const arg = process.argv[2];
  const localTarget = arg ? LOCAL_TARGETS[arg.toUpperCase()] : undefined;
  const faculty: FacultyValue =
    arg && FACULTY_VALUES.includes(arg as FacultyValue)
      ? (arg as FacultyValue)
      : "business_economics";

  console.log(
    `── Discovery smoke test: ${localTarget ? `local ${localTarget.name}` : faculty} ──`,
  );
  const t0 = Date.now();

  const { candidates: raw, query } = localTarget
    ? await searchLocalCandidates(localTarget, knownCompetitionNames([]))
    : await searchCandidates(faculty, knownCompetitionNames([]));
  console.log(`\nSearch returned ${raw.length} raw candidate(s) [${query}]`);
  for (const c of raw) console.log(`  • ${c.name} — ${c.url}`);

  const verified = await verifyCandidates(raw, new Set(), query, localTarget?.code ?? null);
  console.log(`\nSurvived dedup + verification: ${verified.length}`);
  for (const c of verified) {
    console.log(`\n  ${c.name}  (${c.id})`);
    console.log(`    url:         ${c.url}`);
    console.log(`    fields:      ${JSON.stringify(c.fields)}`);
    console.log(`    level/tier:  ${c.level} / ${c.tier} / ${c.category}`);
    console.log(`    deadline:    ${c.deadline ?? "—"}  confirmed=${c.date_confirmed}`);
    if (c.region) console.log(`    local:       ${c.region}${c.city ? ` / ${c.city}` : ""}`);
    console.log(`    evidence:    ${c.date_evidence}`);
    console.log(`    eligibility: ${c.eligibility ?? "—"}`);
    console.log(`    blurb:       ${c.blurb}`);
  }

  console.log(`\nDone in ${((Date.now() - t0) / 1000).toFixed(1)}s`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
