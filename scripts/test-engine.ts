// Unit tests for the DETERMINISTIC engine — the part of Compass that turns a
// profile into numbers and a matched opportunity list in code, run to run the
// same. These are pure functions with no key, no network, no DB, which is
// exactly what makes them worth locking down: the whole product's promise is
// "same profile in, same numbers out", and nothing verified that at the unit
// level before. Run with `npm run test:unit` (node:test, no new dependency —
// the same runner already used by scripts/test-onboarding.ts).
//
// Scope on purpose: expiry of past confirmed dates and the cron/registry
// invariants live in scripts/test-session-checks.ts; this file covers scoring
// (rubric/assemble), eligibility arithmetic, the interest quiz, and the
// matching invariants those checks don't assert.

import { test } from "node:test";
import type { NextRequest } from "next/server";
import { denyUnlessCronAuthorized } from "@/lib/cron/auth";
import { TIER_META } from "@/lib/tiers";
import assert from "node:assert/strict";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { renderModule } from "./build-map-outlines";
import { MAP_OUTLINES } from "@/lib/data/map-outlines";
import { COUNTRIES } from "@/lib/data/map-markers";
import {
  PLACE_UNIVERSITIES,
  universitiesForHub,
  universitiesForPlace,
} from "@/lib/data/place-universities";

import {
  foldEdge,
  stickyCtaVisible,
  NO_EDGES,
  type CtaEdges,
} from "@/lib/data/sticky-cta";
import { classifyStatus, FAILS_THE_GATE } from "./test-links";
import {
  fitTitle,
  fitDescription,
  SERP_TITLE_MAX,
  SERP_DESCRIPTION_MAX,
} from "@/lib/seo";
import {
  serializeJsonLd,
  canonicalPath,
  breadcrumbSchema,
  faqSchema,
  webSiteSchema,
  organizationSchema,
} from "@/lib/schema";
import { RUBRIC, computeOverall, type FactorKey } from "@/lib/rubric";
import { FACTOR_ORDER } from "@/lib/data/leaderboard";
import {
  computeOverallFromFactors,
  computeBenchmarks,
} from "@/lib/ai/assemble";
import {
  gradeFromGraduationYear,
  graduationYearFromGrade,
  plausibleAgeForGrade,
  checkEligibility,
} from "@/lib/data/eligibility";
import {
  scoreInterestQuiz,
  topFacultiesFromQuiz,
} from "@/lib/data/interest-quiz";
import {
  buildExtracurriculars,
  strengthBand,
  reachableFrom,
  COMPETITIONS,
  COMPETITION_CATEGORIES,
  COMPETITION_LEVELS,
  COMPETITION_TIERS,
  gateFor,
} from "@/lib/data/key-dates";
import type {
  Competition,
  CompetitionLevel,
  Opportunity,
} from "@/lib/data/key-dates";
import {
  CATEGORY_ORDER,
  CATEGORY_TABS,
  CATEGORY_TAB_LABEL,
  COST_OPTIONS,
  COST_MODELS_WITHOUT_A_BUCKET,
  LEVEL_OPTIONS,
  MATCH_OPTIONS,
  TIMING_OPTIONS,
  NO_FILTERS,
  activeChips,
  categoryFromParam,
  matchedCount,
  matchedOnly,
  activeFilterCount,
  filterOpportunities,
  matchesQuery,
  opportunityFacets,
  withoutChip,
  type CostBucket,
  type OpportunityFilters,
  type TimingBucket,
} from "@/lib/data/opportunity-filter";
import {
  CATEGORY_LABEL,
  CATEGORY_LABEL_SHORT,
  COST_LABEL,
  COST_MODELS,
  LEVEL_HINT,
  LEVEL_LABEL,
  TIER_LABEL,
  isOpportunityId,
} from "@/lib/data/opportunity-vocab";
import {
  PARTNER_CATEGORY_OPTIONS,
  PARTNER_COST_OPTIONS,
  PARTNER_COST_VALUES,
  PARTNER_LEVEL_OPTIONS,
  PARTNER_TIER_OPTIONS,
} from "@/lib/data/partners";
import { emptyProfile } from "@/lib/types";
import {
  CAREER_AREAS_BY_FACULTY,
  allCareerAreas,
  areaBySlug,
  areaSlug,
  careerAreasForFaculties,
  careerAreaTitles,
} from "@/lib/data/careers";
import { CAREER_AREA_TITLES } from "@/lib/data/career-titles";
import {
  JOB_SIMULATIONS,
  TRY_IT_OPPORTUNITY_ID,
  simulationsForArea,
} from "@/lib/data/try-it";
import { HOME_ROUTES, homeRoutesForFaculties } from "@/lib/data/from-home";
import {
  MAJORS,
  majorById,
  majorsByField,
  majorsForArea,
  majorsForFaculties,
} from "@/lib/data/majors";
import {
  LEGACY_GUIDE_PLACE_IDS,
  RENAMED_HUB_IDS,
} from "@/lib/data/legacy-guide-urls";
import {
  ALL_FIELDS,
  parseFieldsParam,
  serializeFields,
  withFields,
} from "@/lib/data/guide-fields";
import {
  GUIDE_SECTIONS,
  guideMorph,
  nextGuideSection,
} from "@/lib/data/guide-sections";
import { INTENT_STATUSES } from "@/lib/data/intents";
import {
  PLANNER_SECTIONS,
  plannerViewFromParam,
} from "@/lib/data/planner-sections";
import { nextMove, type NextMoveInput } from "@/lib/data/next-move";
import {
  PICK_KINDS,
  countPicks,
  groupPicks,
  isPickId,
  isPickKind,
  parsePickRef,
  pickHref,
  pickRef,
} from "@/lib/data/plan-picks";
import {
  MAP_NODE_KIND_LABEL,
  mapNodeKind,
  MINDMAP_MAX_DEPTH,
  branchDepth,
  branchHeight,
  buildTree,
  canIndent,
  canMoveDown,
  canMoveUp,
  canOutdent,
  layoutTree,
  type MapNode,
  type MapNodeRow,
  type TreeRow,
} from "@/lib/data/mindmap";
import {
  PLANNER_COLUMNS,
  buildPlanner,
  agendaHomeIndex,
  daysBetweenISO,
  intentStatusFromPlanner,
  isMovable,
  plannerMorph,
  plannerStatusFromIntent,
  stepStatus,
  tallyPlanner,
  PLANNER_STATUSES,
  type PlannerInputs,
  type PlannerItem,
  type PlannerStatus,
} from "@/lib/data/planner";
import {
  VALUE_LABEL,
  rankAreasByValues,
  scoreValues,
  topValues,
} from "@/lib/data/values";
import {
  HUBS,
  REGION_ORDER,
  hubsByCountry,
  hubsByRegion,
  hubsForFaculties,
  type RegionKey,
} from "@/lib/data/world";
import {
  NO_GUIDE_FILTERS,
  activeGuideFilterCount,
  filterGuideRows,
  guideFacets,
  guideFilterParams,
  parseGuideFilters,
  type GuideRow,
} from "@/lib/data/guide-filter";
import {
  STUDY_DESTINATIONS,
  destinationById,
  destinationForHub,
  destinationsForFaculties,
} from "@/lib/data/study-destinations";
import { FACULTY_VALUES } from "@/lib/data/faculties";
import { buildIcs } from "@/lib/calendar/ics";
import {
  closesInPhrase,
  daysBetween,
  daysLeftLabel,
  formatDate,
} from "@/lib/data/opportunity-format";
import { OG_GLYPHS } from "@/lib/data/og-glyphs";
import { parseEligibility } from "@/lib/data/eligibility";
import { plannerStarts } from "@/lib/data/planner-start";
import {
  areasForDestination,
  areasForHub,
  facultyOfArea,
  spineForFaculty,
} from "@/lib/data/spine";
import {
  BEATS,
  BEAT_PAIRS,
  isBeatReaction,
  isKnownBeat,
  nextPair,
  observationFromBeats,
  pairsAnswered,
  scoreBeats,
  topFieldsFromBeats,
  type BeatAnswers,
} from "@/lib/data/beats";
import {
  STATIONS,
  station,
  type StationFacts,
} from "@/lib/data/thread";
import { competitionsFromRows } from "@/lib/partners/live";
import sitemapRoutes from "@/app/sitemap";
import robotsFile from "@/app/robots";
import { CANONICAL_URL } from "@/lib/site";
import {
  cleanDwell,
  cleanPath,
  externalHost,
  isBot,
  isMeasurableHost,
  shouldTrack,
} from "@/lib/traffic/track";
import {
  formatDuration,
  summarize,
  visitDurationMs,
  type ViewRow,
} from "@/lib/traffic/summarize";
import {
  buildRegistryIndex,
  nameSimilarity,
  normalizeUrl,
  screenDedup,
  screenEligibility,
  screenHost,
  screenPage,
  shouldDrop,
} from "@/lib/discovery/screen";
import { previewOpportunities } from "@/components/marketing/OpportunityPreview";

// A fixed "today" in the second half of the year → academic year end rolls to
// the next year (June rollover), so a Class of 2027 student is in grade 12.
const TODAY = new Date("2026-08-04T00:00:00Z");
const allTen = Object.fromEntries(RUBRIC.map((f) => [f.key, 10])) as Record<
  FactorKey,
  number
>;
const allZero = Object.fromEntries(RUBRIC.map((f) => [f.key, 0])) as Record<
  FactorKey,
  number
>;

// ── Rubric / overall score ───────────────────────────────────────────────────
test("rubric weights sum to 1.0", () => {
  const sum = RUBRIC.reduce((s, f) => s + f.weight, 0);
  assert.ok(Math.abs(sum - 1) < 1e-9, `weights sum to ${sum}`);
});

test("computeOverall: all 10s → 100, all 0s → 0", () => {
  assert.equal(computeOverall(allTen), 100);
  assert.equal(computeOverall(allZero), 0);
});

test("computeOverall is monotonic and bounded", () => {
  const mid = Object.fromEntries(RUBRIC.map((f) => [f.key, 5])) as Record<
    FactorKey,
    number
  >;
  const score = computeOverall(mid);
  assert.equal(score, 50);
  assert.ok(score > computeOverall(allZero));
  assert.ok(score < computeOverall(allTen));
});

test("computeOverallFromFactors agrees with computeOverall", () => {
  const factors = RUBRIC.map((f) => ({ key: f.key, score: 10 }));
  assert.equal(computeOverallFromFactors(factors), computeOverall(allTen));
  assert.equal(computeOverallFromFactors(factors), 100);
});

test("scoring is deterministic (same input, same output)", () => {
  const factors = RUBRIC.map((f, i) => ({ key: f.key, score: (i % 5) + 3 }));
  assert.equal(
    computeOverallFromFactors(factors),
    computeOverallFromFactors(factors),
  );
});

test("computeBenchmarks: no SAT → empty", () => {
  assert.deepEqual(computeBenchmarks(emptyProfile()), []);
  const withSatNoSchools = { ...emptyProfile(), tests: { SAT: 1500 } };
  assert.deepEqual(computeBenchmarks(withSatNoSchools), []);
});

// ── Eligibility arithmetic ───────────────────────────────────────────────────
test("gradeFromGraduationYear maps grad year → grade (June rollover)", () => {
  assert.equal(gradeFromGraduationYear(2027, TODAY), 12);
  assert.equal(gradeFromGraduationYear(2030, TODAY), 9);
  assert.equal(gradeFromGraduationYear(undefined, TODAY), null);
  // Out of the 1–13 band → null rather than a nonsense grade.
  assert.equal(gradeFromGraduationYear(2040, TODAY), null);
});

test("grade ↔ graduation year round-trips for 5..12", () => {
  for (let g = 5; g <= 12; g++) {
    assert.equal(
      gradeFromGraduationYear(graduationYearFromGrade(g, TODAY), TODAY),
      g,
      `round-trip failed for grade ${g}`,
    );
  }
});

test("plausibleAgeForGrade is a wide range, not a point", () => {
  assert.deepEqual(plausibleAgeForGrade(7), { min: 12, max: 13 });
  assert.deepEqual(plausibleAgeForGrade(12), { min: 17, max: 18 });
});

test("checkEligibility: unknown country never excludes", () => {
  assert.deepEqual(checkEligibility({ countries: ["US"] }, { country: null }), {
    ok: true,
  });
});

test("checkEligibility: wrong country excludes", () => {
  const v = checkEligibility({ countries: ["US"] }, { country: "Canada" });
  assert.equal(v.ok, false);
  assert.equal(v.ok === false && v.reason, "country");
});

test("checkEligibility: grade ceiling and floor", () => {
  assert.equal(checkEligibility({ gradeMax: 10 }, { grade: 12 }).ok, false);
  assert.equal(checkEligibility({ gradeMax: 12 }, { grade: 12 }).ok, true);
  const young = checkEligibility({ gradeMin: 9 }, { grade: 7 });
  assert.equal(young.ok === false && young.reason, "too_young");
});

test("checkEligibility: inferred age fires only when the whole year is outside", () => {
  // Year 7 (12–13) vs "ages 13+" — some are already 13 → not excluded.
  assert.equal(
    checkEligibility({ ageMin: 13 }, { ageRange: { min: 12, max: 13 } }).ok,
    true,
  );
  // Year 6 (11–12) vs "ages 13+" — entire group below → excluded.
  const below = checkEligibility(
    { ageMin: 13 },
    { ageRange: { min: 11, max: 12 } },
  );
  assert.equal(below.ok === false && below.reason, "too_young");
});

// ── Interest quiz ────────────────────────────────────────────────────────────
test("interest quiz: empty answers recommend nothing (no dead-end)", () => {
  assert.deepEqual(scoreInterestQuiz({}), []);
  assert.deepEqual(topFacultiesFromQuiz({}), []);
});

test("interest quiz: a coder path tops computer science", () => {
  const coder = {
    afternoon: "code",
    headline: "startup",
    "team-role": "maker",
    problem: "logic",
    proud: "ship",
    class: "stem",
  };
  assert.equal(topFacultiesFromQuiz(coder)[0], "computer_science");
});

test("interest quiz: top N is capped and a single answer scores one field", () => {
  const answersAll = {
    afternoon: "make",
    headline: "law",
    "team-role": "voice",
    problem: "fair",
    proud: "heal",
    class: "arts",
  };
  assert.ok(topFacultiesFromQuiz(answersAll, 3).length <= 3);
  assert.deepEqual(scoreInterestQuiz({ afternoon: "build" }), [
    { faculty: "engineering", score: 2 },
  ]);
});

// ── Matching invariants ──────────────────────────────────────────────────────
test("strengthBand thresholds", () => {
  assert.equal(strengthBand(0), "emerging");
  assert.equal(strengthBand(10), "elite");
});

test("buildExtracurriculars: empty faculties shows the whole catalog", () => {
  const plan = buildExtracurriculars({
    today: TODAY,
    faculties: [],
    factors: [],
  });
  // "Unknown facts never exclude" — no fields ⇒ a large matched set, not a
  // near-empty one. Loose bound so it survives the catalog growing.
  assert.ok(plan.items.length > 50, `only ${plan.items.length} items`);
  assert.equal(plan.band, "emerging");
});

test("buildExtracurriculars: a chosen field never widens the list", () => {
  const all = buildExtracurriculars({
    today: TODAY,
    faculties: [],
    factors: [],
  });
  const cs = buildExtracurriculars({
    today: TODAY,
    faculties: ["computer_science"],
    factors: [],
  });
  assert.ok(cs.items.length <= all.items.length);
  assert.ok(cs.items.length > 0);
});

// ── The Opportunities filter ─────────────────────────────────────────────────
// The panel behind the "Filters" button. Pure rules, so they are pinned here
// rather than eyeballed in the UI — and one of them (money) is a promise, not
// a convenience: filtering to "free" must never surface a row whose cost we
// have not verified.

/** Minimal matched row — only the fields the filter actually reads. */
function opp(over: Partial<Opportunity> & { id: string }): Opportunity {
  return {
    name: over.id,
    fields: "all",
    deadline: "2026-12-01",
    window: "December",
    level: "national",
    url: "https://example.org",
    blurb: "",
    daysToDeadline: 100,
    tierResolved: "selective",
    categoryResolved: "competition",
    fit: "recommended",
    // Defaults, so a case that is not about the two match gates does not have
    // to mention them. The cases that ARE about them set them explicitly.
    offField: false,
    offRegion: false,
    ...over,
  };
}

const FILTER_POOL: Opportunity[] = [
  opp({
    id: "free-intl",
    cost: "free",
    level: "international",
    dateConfirmed: true,
    daysToDeadline: 10,
  }),
  opp({
    id: "funded-natl",
    cost: "funded",
    level: "national",
    alwaysOpen: true,
  }),
  opp({
    id: "cert-paid",
    cost: "free_cert_paid",
    level: "national",
    dateConfirmed: true,
    daysToDeadline: 200,
  }),
  opp({
    id: "fee",
    cost: "one_time",
    level: "regional",
    dateConfirmed: true,
    daysToDeadline: 5,
  }),
  opp({ id: "unverified", level: "regional" }), // no cost, no date → unknown/TBA
  opp({
    id: "too-young",
    cost: "free",
    level: "international",
    notYetEligible: "from year 11",
  }),
];

const ids = (items: Opportunity[]) => items.map((o) => o.id).sort();

test("the neutral state still narrows to the student's own list", () => {
  // This used to assert reference identity — "no active filters, same array
  // back". That stopped being true and, more importantly, stopped being RIGHT:
  // the neutral state now keeps both match narrowings on, so a student who has
  // touched nothing gets their own list rather than all 172. Returning the
  // array untouched would have been the exact bug this group was added to fix.
  //
  // Nothing in the pool is off-field or off-region, so the CONTENT is
  // unchanged, and the badge still reads zero: narrowing the student never
  // asked for is not a choice they made.
  assert.deepEqual(filterOpportunities(FILTER_POOL, NO_FILTERS), FILTER_POOL);
  assert.equal(activeFilterCount(NO_FILTERS), 0);

  const withOutsiders = [...FILTER_POOL, opp({ id: "elsewhere", offField: true })];
  assert.equal(
    filterOpportunities(withOutsiders, NO_FILTERS).length,
    FILTER_POOL.length,
    "the default let an off-field row through",
  );
});

test("filtering to free never includes a cost we haven't verified", () => {
  // The rule the whole money layer rests on: `unknown` and `varies` belong to
  // NO bucket. A filter that quietly lumps "we haven't checked" in with "free"
  // is the same lie as a card that does it.
  const free = filterOpportunities(FILTER_POOL, {
    ...NO_FILTERS,
    cost: ["free"],
  });
  assert.deepEqual(ids(free), ["free-intl", "funded-natl", "too-young"]);
  assert.ok(!ids(free).includes("unverified"));
  // "Free to learn, paid certificate" is not free either — it is its own bucket.
  assert.ok(!ids(free).includes("cert-paid"));
  assert.deepEqual(
    ids(
      filterOpportunities(FILTER_POOL, { ...NO_FILTERS, cost: ["free_start"] }),
    ),
    ["cert-paid"],
  );
  // Every bucket together still leaves the unverified row out.
  const everyBucket = filterOpportunities(FILTER_POOL, {
    ...NO_FILTERS,
    cost: ["free", "funded", "free_start", "paid"],
  });
  assert.ok(!ids(everyBucket).includes("unverified"));
});

test("groups are ANDed, options inside a group are ORed", () => {
  // Two levels → either. A level plus a cost → both.
  assert.deepEqual(
    ids(
      filterOpportunities(FILTER_POOL, {
        ...NO_FILTERS,
        levels: ["international", "regional"],
      }),
    ),
    ["fee", "free-intl", "too-young", "unverified"],
  );
  assert.deepEqual(
    ids(
      filterOpportunities(FILTER_POOL, {
        ...NO_FILTERS,
        levels: ["international", "regional"],
        cost: ["paid"],
      }),
    ),
    ["fee"],
  );
});

test("timing buckets say only what we can stand behind", () => {
  const t = (b: TimingBucket) =>
    ids(filterOpportunities(FILTER_POOL, { ...NO_FILTERS, timing: [b] }));
  assert.deepEqual(t("closing"), ["fee", "free-intl"]); // confirmed and ≤ 30 days
  assert.deepEqual(t("open"), ["funded-natl"]); // no deadline to miss
  // TBA is the honest third state: no confirmed date and nothing to start today.
  assert.deepEqual(t("tba"), ["too-young", "unverified"]);
  assert.deepEqual(t("dated"), ["cert-paid", "fee", "free-intl"]);
});

test("search takes all terms, in any order, over name and blurb", () => {
  const pool = [
    opp({
      id: "a",
      name: "International Robotics Olympiad",
      blurb: "Build a robot.",
    }),
    opp({
      id: "b",
      name: "Essay Prize",
      blurb: "Write about robotics in society.",
    }),
    opp({ id: "c", name: "Maths Challenge", blurb: "Ten problems." }),
  ];
  const q = (query: string) =>
    ids(filterOpportunities(pool, { ...NO_FILTERS, query }));
  assert.deepEqual(q("robot"), ["a", "b"]); // matches the blurb too
  assert.deepEqual(q("olympiad robotics"), ["a"]); // both terms, order irrelevant
  assert.deepEqual(q("  "), ["a", "b", "c"]); // whitespace is not a filter
  assert.equal(activeFilterCount({ ...NO_FILTERS, query: "   " }), 0);
});

test("only-what-I-can-enter-now drops the not-yet-eligible rows", () => {
  const now = filterOpportunities(FILTER_POOL, {
    ...NO_FILTERS,
    openOnly: true,
  });
  assert.ok(!ids(now).includes("too-young"));
  assert.equal(now.length, FILTER_POOL.length - 1);
});

test("facet counts lift their own group and keep the others", () => {
  const f = {
    ...NO_FILTERS,
    cost: ["free"] as const,
    levels: ["international"] as const,
  };
  const facets = opportunityFacets(FILTER_POOL, {
    ...NO_FILTERS,
    cost: [...f.cost],
    levels: [...f.levels],
  });
  // Money counts ignore the money selection (what happens if I pick this
  // instead) but still respect the level one — only the two international rows
  // are in play, and both are free.
  assert.equal(facets.cost.free, 2);
  assert.equal(facets.cost.paid, 0);
  // Level counts ignore the level selection but keep the money one: three rows
  // are free/funded, spread across international and national.
  assert.equal(facets.levels.international, 2);
  assert.equal(facets.levels.national, 1);
  assert.equal(facets.levels.regional, 0);
  // And the eligibility toggle says what it would leave.
  assert.equal(facets.openNow, 1);
});

test("the chips and the badge can never disagree", () => {
  const f: OpportunityFilters = {
    ...NO_FILTERS,
    query: "robotics",
    cost: ["free", "paid"] as CostBucket[],
    timing: ["closing"] as TimingBucket[],
    levels: ["national"] as CompetitionLevel[],
    openOnly: true,
    // Widened too, so the invariant is checked across the one group that is
    // counted by what is MISSING rather than by what is set.
    matched: ["region" as const],
  };
  const chips = activeChips(f);
  assert.equal(chips.length, activeFilterCount(f));
  assert.equal(
    new Set(chips.map((c) => c.id)).size,
    chips.length,
    "chip keys must be unique",
  );
  // Dismissing one chip removes exactly that one.
  for (const chip of chips) {
    assert.equal(activeFilterCount(withoutChip(f, chip)), chips.length - 1);
  }
  // Clearing everything is the neutral state, not a half-cleared one.
  assert.deepEqual(
    chips.reduce((acc, c) => withoutChip(acc, c), f),
    NO_FILTERS,
  );
});

test("no filter combination can widen the student's matched list", () => {
  // Run against the REAL catalog: the filter narrows what buildExtracurriculars
  // already decided this student may enter, and may never add to it.
  const plan = buildExtracurriculars({
    today: TODAY,
    faculties: [],
    factors: [],
  });
  const matched = new Set(plan.items.map((o) => o.id));
  for (const filters of [
    { ...NO_FILTERS, cost: ["free"] as CostBucket[] },
    { ...NO_FILTERS, timing: ["closing"] as TimingBucket[] },
    { ...NO_FILTERS, openOnly: true },
    { ...NO_FILTERS, query: "olympiad" },
  ]) {
    const out = filterOpportunities(plan.items, filters);
    assert.ok(out.length <= plan.items.length);
    for (const o of out)
      assert.ok(matched.has(o.id), `${o.id} was not in the matched set`);
  }
});

// ── Careers layer ────────────────────────────────────────────────────────────
test("every faculty has at least 3 fully-filled career areas", () => {
  for (const f of FACULTY_VALUES) {
    const areas = CAREER_AREAS_BY_FACULTY[f];
    assert.ok(areas && areas.length >= 3, `${f} has too few career areas`);
    for (const a of areas) {
      assert.ok(
        a.title.trim() && a.what.trim() && a.path.trim(),
        `${f}/${a.title} has an empty field`,
      );
    }
  }
});

// The whole point of the change: we name a SPHERE and the jobs in it, never one
// prescribed profession. An area that carried a single role would be that guess
// wearing a different label, so the shape is enforced here.
test("every career area lists several real roles, none empty or duplicated", () => {
  for (const f of FACULTY_VALUES) {
    for (const a of CAREER_AREAS_BY_FACULTY[f]) {
      assert.ok(a.roles.length >= 3, `${f}/${a.title} lists too few roles`);
      for (const role of a.roles) {
        assert.ok(role.trim(), `${f}/${a.title} has an empty role`);
      }
      assert.equal(
        new Set(a.roles).size,
        a.roles.length,
        `${f}/${a.title} repeats a role`,
      );
    }
  }
});

test("careerAreasForFaculties groups by chosen field; empty in, empty out", () => {
  assert.deepEqual(careerAreasForFaculties([]), []);
  const groups = careerAreasForFaculties(["computer_science", "law"]);
  assert.equal(groups.length, 2);
  assert.equal(groups[0].faculty, "computer_science");
  assert.ok(groups[0].areas.length >= 3);
});

// ── Values refine ────────────────────────────────────────────────────────────
// The refine is only allowed to REORDER what the careers panel already shows.
// These checks pin that down: nothing appears, nothing disappears, and an
// unanswered quiz changes nothing at all.
test("every career area carries valid, deduplicated value tags", () => {
  const axes = new Set(Object.keys(VALUE_LABEL));
  for (const f of FACULTY_VALUES) {
    for (const a of CAREER_AREAS_BY_FACULTY[f]) {
      assert.ok(a.values.length >= 2, `${f}/${a.title} has too few value tags`);
      assert.equal(
        new Set(a.values).size,
        a.values.length,
        `${f}/${a.title} repeats a value tag`,
      );
      for (const v of a.values) {
        assert.ok(axes.has(v), `${f}/${a.title} has unknown value tag ${v}`);
      }
    }
  }
});

test("scoreValues sums fixed weights; no answers score nothing", () => {
  assert.deepEqual(scoreValues({}), {});
  const scores = scoreValues({ "worth-it": "pay", bother: "less" });
  assert.equal(scores.money, 4);
  assert.equal(scores.impact, undefined);
  assert.deepEqual(topValues(scores), ["money"]);
});

test("an unanswered refine leaves the areas exactly as curated", () => {
  const areas = CAREER_AREAS_BY_FACULTY.computer_science;
  const ranked = rankAreasByValues(areas, scoreValues({}));
  assert.deepEqual(
    ranked.map((r) => r.area.title),
    areas.map((a) => a.title),
  );
  assert.ok(
    ranked.every((r) => !r.fits),
    "nothing may be badged a fit",
  );
});

test("ranking reorders but never drops or duplicates an area", () => {
  const scores = scoreValues({ "worth-it": "own", matters: "build" });
  for (const f of FACULTY_VALUES) {
    const areas = CAREER_AREAS_BY_FACULTY[f];
    const ranked = rankAreasByValues(areas, scores);
    assert.equal(ranked.length, areas.length, `${f} changed length`);
    assert.deepEqual(
      new Set(ranked.map((r) => r.area.title)),
      new Set(areas.map((a) => a.title)),
      `${f} lost or invented an area`,
    );
    // Scores must be non-increasing, and only the top score is a "fit".
    for (let i = 1; i < ranked.length; i++) {
      assert.ok(ranked[i - 1].score >= ranked[i].score, `${f} is out of order`);
    }
    // A field where nothing matches what was said badges NOTHING — Law offers
    // no "independence / making things" area, and inventing a match there would
    // be exactly the false precision this whole layer exists to avoid.
    const anyMatch = areas.some((a) =>
      a.values.some((v) => (scores[v] ?? 0) > 0),
    );
    assert.equal(ranked[0].fits, anyMatch, `${f} badges the wrong thing`);
    if (!anyMatch) {
      assert.ok(
        ranked.every((r) => !r.fits),
        `${f} badged a zero score`,
      );
    }
  }
});

test("wanting money over impact puts the money-tagged area first", () => {
  const areas = CAREER_AREAS_BY_FACULTY.law;
  const money = rankAreasByValues(areas, scoreValues({ "worth-it": "pay" }));
  const impact = rankAreasByValues(areas, scoreValues({ "worth-it": "help" }));
  assert.ok(money[0].area.values.includes("money"));
  assert.ok(impact[0].area.values.includes("impact"));
  assert.notEqual(money[0].area.title, impact[0].area.title);
});

test("careerAreaTitles gives the quiz result a sphere list, never job titles", () => {
  const titles = careerAreaTitles("medicine_health");
  assert.ok(titles.length >= 3);
  assert.deepEqual(
    titles,
    CAREER_AREAS_BY_FACULTY.medicine_health.map((a) => a.title),
  );
});

// ── The world map (guide) ────────────────────────────────────────────────────
// The rule that makes this layer safe to show a 15-year-old: no city is ever an
// advert. Every hub states its catch and the actual door in, and every field has
// somewhere to go — an empty guide would be worse than no guide.
test("every hub has a catch and a way in, and unique ids", () => {
  const ids = new Set<string>();
  for (const h of HUBS) {
    assert.ok(!ids.has(h.id), `duplicate hub id ${h.id}`);
    ids.add(h.id);
    assert.ok(h.city.trim() && h.country.trim(), `${h.id} is missing a name`);
    assert.ok(h.what.trim().length > 40, `${h.id} has no real description`);
    assert.ok(
      h.catch.trim().length > 40,
      `${h.id} has no catch — that is an advert`,
    );
    assert.ok(h.route.trim().length > 40, `${h.id} has no way in`);
    assert.ok(h.fields.length > 0, `${h.id} belongs to no field`);
    assert.ok(REGION_ORDER.includes(h.region), `${h.id} has an unknown region`);
  }
});

// The depth layer on cities. Three lines about an industry say nothing about
// the years a student would actually spend in a place, and the years are what
// they are deciding about — so each of these is mandatory too.
test("every hub says what living there is like, costs, and demands", () => {
  for (const h of HUBS) {
    assert.ok(
      h.dayHere.trim().length > 150,
      `${h.id} does not say what living there is actually like`,
    );
    assert.ok(
      h.money.trim().length > 150,
      `${h.id} does not explain how the money works`,
    );
    assert.ok(
      h.language.trim().length > 100,
      `${h.id} does not state the language you need`,
    );
    // Both halves, or it is a recommendation rather than a description.
    assert.ok(
      h.whoThrives.trim().length > 120 && /look elsewhere/i.test(h.whoThrives),
      `${h.id} does not name who should go somewhere else instead`,
    );
  }
});

// No prices anywhere in the world map — the rule the destination profiles are
// already held to. Figures rot within a year; shape does not.
test("no hub quotes a price, a salary or a ranking", () => {
  const forbidden =
    /(\$|€|£|₸|\bUSD\b|\bEUR\b|\bper month\b|\bper year\b|\brank(ed|ing)? (?:#|no\.?\s?)\d|\btop \d+\b)/i;
  for (const h of HUBS) {
    for (const [field, text] of Object.entries(h)) {
      if (typeof text !== "string") continue;
      assert.ok(
        !forbidden.test(text),
        `${h.id}.${field} quotes a figure or ranking that will rot: ${text.slice(0, 80)}`,
      );
    }
  }
});

test("every field has hubs across more than one region", () => {
  for (const f of FACULTY_VALUES) {
    const hubs = hubsForFaculties([f]);
    assert.ok(hubs.length >= 3, `${f} has too few places to go`);
    const regions = new Set(hubs.map((h) => h.region));
    assert.ok(regions.size >= 2, `${f} points at only one region`);
  }
});

test("no chosen field ⇒ the whole map; a chosen one never widens it", () => {
  assert.equal(hubsForFaculties([]).length, HUBS.length);
  const cs = hubsForFaculties(["computer_science"]);
  assert.ok(cs.length > 0 && cs.length <= HUBS.length);
  // Grouping keeps the curated region order and drops empty regions.
  const groups = hubsByRegion(["law"]);
  assert.ok(groups.length > 0);
  const order = groups.map((g) => REGION_ORDER.indexOf(g.region));
  assert.deepEqual(
    order,
    [...order].sort((a, b) => a - b),
  );
  for (const g of groups)
    assert.ok(g.hubs.length > 0, "an empty region survived");
});

test("the home region leads the map", () => {
  assert.equal(REGION_ORDER[0], "central_asia");
  assert.ok(
    HUBS.filter((h) => h.region === "central_asia").length >= 3,
    "the students' own region is barely represented",
  );
});

// ── The guide as a section of routes ─────────────────────────────────────────
// The guide stopped being one page: each step, each area of work and each city
// is its own URL now. Two things that used to be impossible to get wrong become
// possible once addresses exist, so they are pinned here.

// The depth layer. `catch` is the rule this file was missing: every city in
// world.ts states its downside, areas of work did not, and that made the
// careers layer the one place in the product that could read as a brochure.
test("every area of work states its catch, and the rest of the depth", () => {
  for (const { faculty, area } of allCareerAreas()) {
    const where = `${faculty}/${area.title}`;
    assert.ok(
      area.catch.trim().length > 120,
      `${where} has no real catch — that is an advert`,
    );
    assert.ok(
      area.dayToDay.trim().length > 120,
      `${where} does not say what the work is actually like`,
    );
    assert.ok(
      area.misconception.trim().length > 80,
      `${where} names nothing students get wrong about it`,
    );
    assert.ok(
      area.tryItNow.trim().length > 80,
      `${where} gives no way to test the fit`,
    );
    for (const [k, v] of Object.entries(area.stages)) {
      assert.ok(
        v.trim().length > 80,
        `${where} stage "${k}" is too thin to act on`,
      );
    }
  }
});

// The other half of the honesty rule, and the reason the area pages used to open
// with a table of contents instead of an answer. A country states suitsYou and
// notForYou, a city states whoThrives with "look elsewhere" inside it — areas of
// work stated neither, so the one part of a subject page written TO the reader
// was missing from the layer a student reaches first.
//
// Distinctness is checked as well as length, because thirty-three hand-written
// pairs is exactly the size at which one sentence gets pasted across a whole
// field and nobody notices; an identical answer for two different kinds of work
// is not an answer.
test("every area of work says who it suits AND who should look elsewhere", () => {
  const suits = new Set<string>();
  const avoid = new Set<string>();
  for (const { faculty, area } of allCareerAreas()) {
    const where = `${faculty}/${area.title}`;
    assert.ok(
      area.suitsYou.trim().length > 100,
      `${where} does not say who this work actually suits`,
    );
    // The longer bar is deliberate: this is the half that does the work, and a
    // one-line brush-off here is how a page goes back to reading as an advert.
    assert.ok(
      area.notForYou.trim().length > 140,
      `${where} does not name who should look somewhere else instead`,
    );
    suits.add(area.suitsYou.trim());
    avoid.add(area.notForYou.trim());
  }
  const n = allCareerAreas().length;
  assert.equal(
    suits.size,
    n,
    "two areas claim to suit exactly the same person",
  );
  assert.equal(avoid.size, n, "two areas warn off exactly the same person");
});

// `adjacent` holds titles, not ids, so a typo would render a dead link with no
// error anywhere. This is what makes that impossible.
test("every adjacent area resolves, and none points at itself", () => {
  for (const { area } of allCareerAreas()) {
    assert.ok(
      area.adjacent.length >= 2,
      `${area.title} offers too few neighbours to be useful`,
    );
    assert.equal(
      new Set(area.adjacent).size,
      area.adjacent.length,
      `${area.title} repeats a neighbour`,
    );
    for (const title of area.adjacent) {
      assert.notEqual(title, area.title, `${area.title} lists itself`);
      const found = areaBySlug(areaSlug(title));
      assert.ok(found, `${area.title} points at a missing area: ${title}`);
      assert.equal(found!.area.title, title);
    }
  }
});

// The titles are duplicated into a tiny module so the client-side interest quiz
// can import labels without pulling 1,100 lines of prose into the browser.
test("the client-side title list matches the registry exactly", () => {
  for (const f of FACULTY_VALUES) {
    assert.deepEqual(
      CAREER_AREA_TITLES[f],
      CAREER_AREAS_BY_FACULTY[f].map((a) => a.title),
      `career-titles.ts has drifted from the registry for ${f}`,
    );
  }
});

// A career area has no id of its own — its slug is derived from its title. Two
// areas sharing a slug would silently serve one under the other's address.
test("every career area has a unique slug that resolves back to it", () => {
  const seen = new Map<string, string>();
  for (const { faculty, area } of allCareerAreas()) {
    const slug = areaSlug(area.title);
    assert.ok(slug.length > 2, `${area.title} slugifies to nothing usable`);
    assert.ok(
      /^[a-z0-9-]+$/.test(slug),
      `${area.title} slugifies to a non-URL string: ${slug}`,
    );
    const clash = seen.get(slug);
    assert.ok(!clash, `${area.title} and ${clash} share the slug ${slug}`);
    seen.set(slug, area.title);

    const found = areaBySlug(slug);
    assert.ok(found, `${slug} does not resolve`);
    assert.equal(found!.area.title, area.title);
    assert.equal(found!.faculty, faculty);
  }
  assert.equal(seen.size, allCareerAreas().length);
  assert.equal(areaBySlug("not-a-real-area"), undefined);
});

// The field filter lives in the URL. "Not stated" and "explicitly everything"
// must stay distinguishable: the first falls back to the student's own fields,
// the second is a student deliberately widening the guide, and collapsing them
// would re-apply the profile on every navigation.
test("the guide's field parameter separates unstated from everything", () => {
  assert.equal(parseFieldsParam(undefined), null);
  assert.deepEqual(parseFieldsParam(ALL_FIELDS), []);
  assert.deepEqual(parseFieldsParam(""), []);
  assert.deepEqual(parseFieldsParam("law,computer_science"), [
    "law",
    "computer_science",
  ]);
  // Junk narrows nothing rather than emptying the page — the same rule as the
  // catalog's "unknown facts never exclude".
  assert.deepEqual(parseFieldsParam("nonsense"), []);
  assert.deepEqual(parseFieldsParam("law,nonsense,law"), ["law"]);
  assert.deepEqual(parseFieldsParam(["law", "medicine_health"]), ["law"]);

  assert.equal(serializeFields([]), ALL_FIELDS);
  assert.equal(withFields("/guide/cities", null), "/guide/cities");
  assert.equal(
    withFields("/guide/cities", []),
    `/guide/cities?f=${ALL_FIELDS}`,
  );
  assert.equal(withFields("/guide/cities", ["law"]), "/guide/cities?f=law");
  // Round trip: whatever a link writes, the next page reads back unchanged.
  for (const fields of [["law"], ["law", "engineering"], []] as const) {
    assert.deepEqual(parseFieldsParam(serializeFields([...fields])), [
      ...fields,
    ]);
  }
});

// The card→page morph only happens if both sides emit the identical string, and
// it silently does nothing if that string is not a valid CSS custom-ident — a
// failure with no error anywhere, just a transition that stopped happening.
test("every guide morph name is a valid, unique custom-ident", () => {
  const names = [
    ...allCareerAreas().map(({ area }) =>
      guideMorph("area", areaSlug(area.title)),
    ),
    ...HUBS.map((h) => guideMorph("hub", h.id)),
    ...STUDY_DESTINATIONS.map((d) => guideMorph("place", d.id)),
  ];
  for (const n of names) {
    assert.ok(
      /^[a-z][a-z0-9-]*$/.test(n),
      `${n} is not usable as a view-transition-name`,
    );
  }
  assert.equal(new Set(names).size, names.length, "two subjects share a morph");
});

test("the guide's steps are a chain that ends", () => {
  assert.deepEqual(
    GUIDE_SECTIONS.map((s) => s.step),
    [1, 2, 3, 4, 5],
  );
  const hrefs = new Set(GUIDE_SECTIONS.map((s) => s.href));
  assert.equal(hrefs.size, GUIDE_SECTIONS.length, "two steps share a route");
  for (const s of GUIDE_SECTIONS) {
    assert.ok(s.href.startsWith("/guide/"), `${s.id} is not inside the guide`);
    assert.ok(s.blurb.trim().length > 40, `${s.id} has no real description`);
  }
  // The zoom goes IN: a country contains cities, so it comes first. The guide
  // shipped with these the other way round, which asked a student to weigh
  // Berlin and then zoomed out to Germany a step later.
  // The subject you apply WITH sits between the work and the country: knowing
  // the work comes first, and the country is chosen with a subject in hand.
  assert.deepEqual(
    GUIDE_SECTIONS.map((s) => s.id),
    ["work", "majors", "places", "cities", "from-home"],
  );
  assert.equal(nextGuideSection("work")?.id, "majors");
  assert.equal(nextGuideSection("majors")?.id, "places");
  assert.equal(nextGuideSection("places")?.id, "cities");
  // The last step must not point onwards — that footer becomes the CTA into the
  // catalog instead, which is the whole point of ending on "from home".
  assert.equal(nextGuideSection("from-home"), undefined);
});

// Cities stayed a step of their own when they moved under countries, and this
// is the reason: most of them are in countries we do not profile, and four of
// those are the home region. If a future change nests cities strictly inside
// country profiles, this test is the one that should stop it.
// This test used to assert the opposite: that some cities had NO country page,
// and that Almaty, Astana and Tbilisi were among them — a guard so a
// tidy-up could not delete the home region from the map. Those countries are
// profiled now, so the guard becomes the stronger invariant it was standing in
// for: every city belongs to a country you can open, and no city belongs to two.
test("every city sits in exactly one country we profile", () => {
  const claimed = STUDY_DESTINATIONS.flatMap((d) => d.hubs);
  const claimedSet = new Set(claimed);
  assert.equal(claimed.length, claimedSet.size, "two countries claim one city");

  for (const h of HUBS) {
    assert.ok(
      claimedSet.has(h.id),
      `${h.id} (${h.city}) has no country page — add one, or the breadcrumb dead-ends`,
    );
    assert.equal(
      destinationForHub(h.id)?.name !== undefined,
      true,
      `${h.id} does not resolve to a destination`,
    );
  }
  for (const home of ["almaty", "astana", "tbilisi"]) {
    assert.ok(
      HUBS.some((h) => h.id === home),
      `${home} has been dropped from the world map`,
    );
  }
  // Grouping by country must lose nobody: every hub still appears exactly once.
  const grouped = hubsByCountry([]).flatMap((g) => g.hubs);
  assert.equal(
    grouped.length,
    HUBS.length,
    "grouping by country dropped a hub",
  );
  assert.equal(new Set(grouped.map((h) => h.id)).size, HUBS.length);
  for (const g of hubsByCountry([])) {
    assert.ok(
      g.hubs.every((h) => h.country === g.country),
      `${g.country} group contains a hub from elsewhere`,
    );
  }
});

// A hub may be a PAIR of cities — "Zurich & Lausanne", "Dubai & Abu Dhabi",
// "Osaka & Kyoto" — where two cities are genuinely one labour market with one
// route in. That is a deliberate shape and this test does not forbid it.
//
// What it forbids is a pair that swallows a city ALREADY PROFILED on its own.
// The Netherlands listed "Amsterdam" and "Amsterdam & Eindhoven" side by side,
// and China listed "Shanghai" and "Shenzhen & Shanghai" — so the same city
// appeared twice in one country's list, under two different cards, with
// different advice on each. A reader cannot tell which one is for them, and
// both were simply mislabelled entries about Eindhoven and Shenzhen.
test("no hub's label swallows a city that is profiled on its own", () => {
  for (const outer of HUBS) {
    for (const inner of HUBS) {
      if (outer.id === inner.id) continue;
      assert.ok(
        !outer.city.includes(inner.city),
        `${outer.id} is labelled "${outer.city}", which contains "${inner.city}" — ` +
          `${inner.id} already has its own page, so the city appears twice. ` +
          `Name this hub after the place it is actually about.`,
      );
    }
  }
});

// The old `/guide/<country>` URLs are public and shared, and their redirect
// lives in next.config.mjs — a file that cannot import TypeScript, so the list
// is duplicated. This is what keeps the duplicate honest: add a country and the
// test fails until its legacy URL is redirected too.
test("every country's legacy URL is redirected, and no extra ones are", async () => {
  const ids = [...STUDY_DESTINATIONS.map((d) => d.id)].sort();
  assert.deepEqual(
    [...LEGACY_GUIDE_PLACE_IDS].sort(),
    ids,
    "lib/data/legacy-guide-urls.ts has drifted from the destination registry",
  );

  // The config is what actually runs, so it is what gets asserted — the real
  // redirect list, not the text of the file. An earlier version of this test
  // grepped for a string and matched the explanatory COMMENT next to the code.
  const config = (await import("../next.config.mjs")).default;
  const redirects = await config.redirects!();
  // Two different kinds live here now, and they are asserted separately: a
  // country's short address is `/guide/<id>` (two segments), a renamed city hub
  // is `/guide/cities/<id>` (three). Lumping them together is how the country
  // assertion would silently start passing with a city redirect in the list.
  const all = redirects.filter((r) => r.source.startsWith("/guide/"));
  const guide = all.filter((r) => r.source.split("/").length === 3);
  const renamedHubs = all.filter((r) => r.source.startsWith("/guide/cities/"));
  assert.equal(
    guide.length + renamedHubs.length,
    all.length,
    "a /guide redirect exists that is neither a country short URL nor a renamed hub",
  );

  assert.deepEqual(
    guide.map((r) => r.source).sort(),
    ids.map((id) => `/guide/${id}`).sort(),
    "the running redirect list does not match the destination registry",
  );
  for (const r of guide) {
    assert.equal(
      r.destination,
      r.source.replace("/guide/", "/guide/places/"),
      `${r.source} points somewhere unexpected`,
    );
    assert.equal(r.permanent, true, `${r.source} should be a 308, not a 307`);
    // A pattern would run BEFORE routing and swallow the guide's own steps:
    // `/guide/work` would be sent to `/guide/places/work`, which does not exist.
    assert.ok(
      !r.source.includes(":") && !r.source.includes("*"),
      `${r.source} is a pattern and would capture the guide's step routes`,
    );
  }

  // A renamed hub must redirect to a hub that EXISTS, and must not point at
  // itself — both of which a copy-paste rename gets wrong silently.
  assert.deepEqual(
    renamedHubs.map((r) => r.source).sort(),
    Object.keys(RENAMED_HUB_IDS)
      .map((id) => `/guide/cities/${id}`)
      .sort(),
    "next.config.mjs has drifted from RENAMED_HUB_IDS",
  );
  for (const [from, to] of Object.entries(RENAMED_HUB_IDS)) {
    assert.ok(
      !HUBS.some((h) => h.id === from),
      `${from} is still a live hub id, so it must not be redirected away`,
    );
    assert.ok(
      HUBS.some((h) => h.id === to),
      `${from} redirects to ${to}, which is not a hub`,
    );
  }
  for (const r of renamedHubs) {
    assert.equal(r.permanent, true, `${r.source} should be a 308, not a 307`);
  }

  // And the steps themselves must not be matched by any of it.
  for (const s of GUIDE_SECTIONS) {
    assert.ok(
      !all.some((r) => r.source === s.href),
      `${s.href} is being redirected away`,
    );
  }
});

test("destinationForHub resolves both ways, and is undefined for a non-hub", () => {
  for (const d of STUDY_DESTINATIONS) {
    for (const hubId of d.hubs) {
      assert.equal(destinationForHub(hubId)?.id, d.id);
    }
  }
  assert.equal(destinationForHub("not-a-hub"), undefined);
});

// Step 4 carries the same honesty rule as the world map: naming a route that
// pays or teaches you from home without naming what it costs is an advert.
test("every from-home route has a catch and a first move", () => {
  const ids = new Set<string>();
  for (const r of HOME_ROUTES) {
    assert.ok(!ids.has(r.id), `duplicate route id ${r.id}`);
    ids.add(r.id);
    assert.ok(r.name.trim(), `${r.id} has no name`);
    assert.ok(r.what.trim().length > 40, `${r.id} has no real description`);
    assert.ok(
      r.catch.trim().length > 40,
      `${r.id} has no catch — that is an advert`,
    );
    assert.ok(
      r.firstMove.trim().length > 40,
      `${r.id} has no first move a student could make this week`,
    );
    // "You can do this from home" is only useful next to what it costs and what
    // it leaves behind — otherwise it is encouragement, not guidance.
    assert.ok(
      r.commitment.trim().length > 100,
      `${r.id} does not say what it costs in time`,
    );
    assert.ok(
      r.proof.trim().length > 100,
      `${r.id} does not say what you can show for it afterwards`,
    );
    assert.ok(
      r.whoThrives.trim().length > 100 && /look elsewhere/i.test(r.whoThrives),
      `${r.id} does not name who should pick a different route`,
    );
  }
  assert.ok(HOME_ROUTES.length >= 4, "too few routes to be worth a step");
});

test("no chosen field ⇒ every from-home route; field-free routes always show", () => {
  assert.equal(homeRoutesForFaculties([]).length, HOME_ROUTES.length);
  for (const f of FACULTY_VALUES) {
    const routes = homeRoutesForFaculties([f]);
    assert.ok(
      routes.length > 0,
      `${f} is told there is nothing to do from home`,
    );
    assert.ok(routes.length <= HOME_ROUTES.length);
    for (const r of HOME_ROUTES.filter((x) => x.fields.length === 0)) {
      assert.ok(
        routes.some((x) => x.id === r.id),
        `${r.id} applies to everyone but was hidden from ${f}`,
      );
    }
  }
});

// ── The cron gate fails CLOSED ───────────────────────────────────────────────
// Both cron endpoints spend money per call (page fetches + model reads, web
// search) and write with the service-role key. The original gate was
// `if (secret && header !== secret) 401`, which lets EVERYTHING through when the
// variable is unset — and it was unset in production. This test exists so that
// shape cannot come back: no secret configured must mean nobody runs it.
test("cron auth refuses when CRON_SECRET is missing, not the reverse", () => {
  const req = (auth?: string) =>
    ({
      headers: {
        get: (k: string) => (k === "authorization" ? (auth ?? null) : null),
      },
    }) as unknown as NextRequest;

  const original = process.env.CRON_SECRET;
  try {
    delete process.env.CRON_SECRET;
    const unset = denyUnlessCronAuthorized(req("Bearer anything"));
    assert.ok(unset, "an unset secret must NOT authorize the request");
    assert.equal(unset!.status, 503);

    process.env.CRON_SECRET = "s3cret";
    assert.equal(denyUnlessCronAuthorized(req("Bearer s3cret")), null);
    assert.equal(denyUnlessCronAuthorized(req("Bearer wrong"))?.status, 401);
    assert.equal(denyUnlessCronAuthorized(req())?.status, 401);
  } finally {
    if (original === undefined) delete process.env.CRON_SECRET;
    else process.env.CRON_SECRET = original;
  }
});

// ── Destination deep-dives (guide) ───────────────────────────────────────────
// The rule that keeps these pages from turning into brochures: a destination
// must carry at least as many honest trade-offs as strengths, and must say who
// it is WRONG for. Agencies sell these countries to exactly our students; the
// only thing we can offer that they can't is the other half of the story.
test("no destination is a brochure: trade-offs >= strengths, and all filled", () => {
  const ids = new Set<string>();
  for (const d of STUDY_DESTINATIONS) {
    assert.ok(!ids.has(d.id), `duplicate destination id ${d.id}`);
    ids.add(d.id);
    assert.ok(d.strengths.length >= 4, `${d.id} lists too few strengths`);
    assert.ok(
      d.tradeoffs.length >= d.strengths.length,
      `${d.id} sells more than it warns (${d.strengths.length} up, ${d.tradeoffs.length} down)`,
    );
    for (const line of [...d.strengths, ...d.tradeoffs]) {
      assert.ok(line.trim().length > 30, `${d.id} has a throwaway bullet`);
    }
    for (const [field, min] of [
      ["oneLine", 40],
      ["unique", 60],
      ["money", 60],
      ["admissions", 60],
      ["afterStudy", 40],
      ["suitsYou", 40],
      ["notForYou", 40],
    ] as const) {
      assert.ok(
        d[field].trim().length > min,
        `${d.id}.${field} is too thin to be useful`,
      );
    }
  }
});

// ── The register a country profile is written in ─────────────────────────────
// `world.ts`, `place-universities.ts` and `majors.ts` each ban superlatives.
// STUDY_DESTINATIONS — 17 profiles, the deepest prose in the product and the
// only one of the four that reaches a page a stranger can land on from a search
// result — had no such guard at all, and on 2026-08-27 two of its pages were
// live with one: `/guide/places/switzerland` opened on "World-class research"
// and called ETH and EPFL "top-tier"; `/guide/places/poland` opened on "The
// best ratio of cost to opportunity in the European Union".
//
// TWO TIERS, because one list of words was measured and was the wrong tool.
// Running the majors pattern over these registries returned SEVEN hits of which
// ONE was real: `\bbest\b` fires on "the students who do best here", "many of
// the best reporters", "the best technical solution frequently loses" — all
// ordinary comparative English, and all of it in the fields that exist to be
// honest. Meanwhile it missed BOTH live defects, because "world-class" and
// "top-tier" were in nobody's list. Words are shared across unrelated concepts;
// shape is not.
//
//   MARKETING_REGISTER  — never ordinary English here. Every string field.
//   SELLING_SUPERLATIVE — ambiguous, so only the three fields that make the
//                         case FOR the country: oneLine, unique, strengths.
//
// Split that way it returns three findings and three are real.
//
// DELIBERATELY NOT BANNED: a superlative pointed at the READER rather than at
// the country. "The hardest admission in Europe" is a catch, and a catch stated
// strongly is still a catch — the rule exists because an appeal without its
// catch is an advert, so the catch is the half we are protecting.
const MARKETING_REGISTER =
  /(\bworld[- ]class\b|\btop[- ]tier\b|\bworld[- ]leading\b|\bworld[- ]famous\b|\bcutting[- ]edge\b|\bstate[- ]of[- ]the[- ]art\b|\brenowned\b|\bprestigious\b|\bpremier\b|\bunrivall?ed\b|\bfinest\b|\belite\b|\bbest[- ]in[- ]class\b|\bleading\b(?!\s+to\b)|\bno\.? ?1\b|\btop \d+\b|\brank(ed|ing)? (?:#|no\.?\s?)\d)/i;
const SELLING_SUPERLATIVE = /\bbest\b/i;
/** The fields that argue FOR a destination. The rest are allowed comparatives. */
const DEST_SELLING_FIELD = /^[a-z-]+\.(oneLine|unique|strengths)(\[\d+\])?$/;

/** Every string in a destination, as `id.path` → text. Skips `url` — a link is
 *  not prose, and a host name is not a claim we wrote. */
function destinationStrings(d: unknown, path: string): [string, string][] {
  if (typeof d === "string") return path.endsWith(".url") ? [] : [[path, d]];
  if (Array.isArray(d))
    return d.flatMap((v, i) => destinationStrings(v, `${path}[${i}]`));
  if (d && typeof d === "object")
    return Object.entries(d).flatMap(([k, v]) =>
      destinationStrings(v, `${path}.${k}`),
    );
  return [];
}

test("no country profile is written in the marketing register", () => {
  for (const d of STUDY_DESTINATIONS) {
    for (const [path, text] of destinationStrings(d, d.id)) {
      const sold = text.match(MARKETING_REGISTER);
      assert.ok(
        !sold,
        `${path} is written like an advert ("${sold?.[0]}"): ${text.slice(0, 90)}`,
      );
      if (!DEST_SELLING_FIELD.test(path)) continue;
      const boast = text.match(SELLING_SUPERLATIVE);
      assert.ok(
        !boast,
        `${path} makes a superlative claim for the country ("${boast?.[0]}"): ${text.slice(0, 90)}`,
      );
    }
  }
});

test("that register guard bites on the two shapes that shipped", () => {
  // Built from the lines that were live, not from a paraphrase of them.
  const shippedSwitzerlandOneLine =
    "World-class research at low tuition, gated by the hardest admission and the highest cost of living in Europe.";
  const shippedSwitzerlandUnique =
    "ETH Zurich and EPFL charge among the lowest tuition of any top-tier research university on earth.";
  const shippedPolandOneLine =
    "The best ratio of cost to opportunity in the European Union for a student from this region.";

  assert.match(shippedSwitzerlandOneLine, MARKETING_REGISTER);
  assert.match(shippedSwitzerlandUnique, MARKETING_REGISTER);
  assert.match(shippedPolandOneLine, SELLING_SUPERLATIVE);
  assert.ok(
    DEST_SELLING_FIELD.test("poland.oneLine"),
    "the selling-field test stopped recognising oneLine",
  );

  // And the near-misses, which are the half that decides whether this guard
  // survives a month or gets exempted. Every one of these is real prose from
  // this repository or one word away from it.
  for (const honest of [
    "Treating staying as failure. The students who do best here choose the local degree deliberately.",
    "Many of the best reporters bring expertise in economics, science or law to a beat.",
    "The best technical solution frequently loses to the one that fits the existing workflow.",
    "A bachelor's here is three years, leading to a master's that most employers expect.",
  ]) {
    assert.doesNotMatch(
      honest,
      MARKETING_REGISTER,
      `the marketing ban fires on honest prose: ${honest.slice(0, 60)}`,
    );
  }
  // `best` in an honest field is allowed, and the field test is what allows it.
  assert.ok(!DEST_SELLING_FIELD.test("kazakhstan.commonMistake"));
  assert.ok(!DEST_SELLING_FIELD.test("poland.tradeoffs[0]"));
  assert.ok(DEST_SELLING_FIELD.test("switzerland.strengths[2]"));
});

// The depth layer on countries. A student picks a country on admissions and
// then lives inside its teaching culture and its calendar for years, so those
// are stated too — and timing especially, because missing a deadline is the one
// way to lose a place that has nothing to do with how good you are.
test("every destination states its cycle, its reading, and its teaching", () => {
  for (const d of STUDY_DESTINATIONS) {
    assert.ok(
      d.applicationCycle.trim().length > 200,
      `${d.id} does not say when things actually happen`,
    );
    assert.ok(
      d.howTheyRead.trim().length > 200,
      `${d.id} does not say how an application is read there`,
    );
    assert.ok(
      d.studyingThere.trim().length > 200,
      `${d.id} does not say what studying there is like`,
    );
    assert.ok(
      d.commonMistake.trim().length > 120,
      `${d.id} names nothing applicants from this region get wrong`,
    );
  }
});

// ── The semantic tier scale is three roles, not one colour ───────────────────
//
// Every tier had a DEFAULT (a fill) and a `soft` (a tint) and no text colour, so
// a component needing coloured text reached for the fill and got 3.40:1 on white
// and 2.85:1 on its own chip — under WCAG AA, and it was the colour of every
// `role="alert"` error message in the product. `text-target` was 2.76:1, under
// even the 3:1 bar that applies to graphics, so the trophy glyph failed as an
// icon too.
//
// What makes this worth a test rather than a commit is that the codebase already
// knew: lib/tiers.ts has carried readable `text` values the whole time, and six
// components had hand-copied that hex inline rather than reach for a token that
// did not exist. So the two lists must not drift apart again, and the ratios are
// asserted rather than trusted — a future tweak to a brand colour cannot quietly
// drop below AA.
// It now checks BOTH themes, which is the whole reason the palette moved into
// CSS variables: a dark theme is a second set of values that has to clear the
// same bar, and eyeballing "looks fine on my monitor" is exactly how a dark mode
// ships at 2:1. The values are read out of app/globals.css, because after the
// move the Tailwind config holds no colours at all — it names roles.
const relativeLuminance = (rgb: [number, number, number]) => {
  const channel = (c: number) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  };
  return (
    0.2126 * channel(rgb[0]) +
    0.7152 * channel(rgb[1]) +
    0.0722 * channel(rgb[2])
  );
};
const contrast = (a: [number, number, number], b: [number, number, number]) => {
  const [hi, lo] = [relativeLuminance(a), relativeLuminance(b)].sort(
    (x, y) => y - x,
  );
  return (hi + 0.05) / (lo + 0.05);
};

/** Read one theme's channel triplets out of globals.css. */
function readTheme(css: string, selector: string) {
  const start = css.indexOf(selector);
  assert.ok(start >= 0, `globals.css has no ${selector} block`);
  const body = css.slice(start, css.indexOf("}", start));
  const out: Record<string, [number, number, number]> = {};
  for (const m of body.matchAll(/--([a-z-]+):\s*(\d+)\s+(\d+)\s+(\d+)\s*;/g)) {
    out[m[1]] = [Number(m[2]), Number(m[3]), Number(m[4])];
  }
  return out;
}

test("both themes clear AA — every ink on every surface it lands on", () => {
  const css = readFileSync(path.join(process.cwd(), "app/globals.css"), "utf8");
  const themes = {
    light: readTheme(css, ":root {"),
    dark: readTheme(css, ':root[data-theme="dark"] {'),
  };

  for (const [name, T] of Object.entries(themes)) {
    const need = (
      label: string,
      fg: string,
      bg: string,
      min: number,
      what: string,
    ) => {
      assert.ok(T[fg], `${name}: --${fg} is not defined`);
      assert.ok(T[bg], `${name}: --${bg} is not defined`);
      const r = contrast(T[fg], T[bg]);
      assert.ok(
        r >= min,
        `${name}: ${label} is ${r.toFixed(2)}:1, under ${min} (${what})`,
      );
    };

    // Body text, on both the page and a raised card.
    for (const fg of ["ink", "ink-soft", "ink-faint"]) {
      need(`${fg} on surface`, fg, "surface", 4.5, "text");
      need(`${fg} on card`, fg, "card", 4.5, "text");
    }
    // Every coloured TEXT token, on the page, on a card, and on its own tint —
    // the chip is the case that catches people, because a tint of the same hue
    // is where a colour has the least room to be readable.
    for (const t of ["accent", "ivy", "reach", "target", "likely"]) {
      need(`${t}-ink on surface`, `${t}-ink`, "surface", 4.5, "text");
      need(`${t}-ink on card`, `${t}-ink`, "card", 4.5, "text");
      need(`${t}-ink on ${t}-soft`, `${t}-ink`, `${t}-soft`, 4.5, "chip text");
    }
    // Fills are graphics: 3:1, and `target` failed even this before the ink
    // tokens existed.
    for (const t of ["accent", "ivy", "reach", "target", "likely"]) {
      need(`${t} fill on card`, t, "card", 3, "graphic");
    }
    // The inverted band. The second assertion is the one that encodes the bug:
    // painted with `ink`, this band passed every contrast check and still broke
    // the page, because it went WHITE in dark mode. Contrast was never the
    // problem — DIRECTION was. So the rule is absolute, not relative: the band
    // is a dark surface in both themes and may never become a light slab.
    //
    // Deliberately not "darker than surface". In dark mode the page is already
    // near-black and the band lifts slightly above it (surface < band < card);
    // a relative test would force the band under the floor, and down there
    // contrast ratios compress so far that they measure nothing.
    need("band-ink on band", "band-ink", "band", 4.5, "text");

    // The filled primary control, and the same bug one layer down: painted with
    // `bg-ink text-surface` it passed every contrast check in both themes and
    // still broke the dark page, because `ink` is near-white — a `size="lg"`
    // call to action became the brightest object on screen. Reported twice.
    //
    // Two assertions, and the second is the real one. The label has to be
    // readable (4.5), AND the button must never be a near-white slab: capped
    // well below the page's own `surface` in light mode, which is 0.94. A button
    // DOES have to lift clear of a dark page — unlike the band, it cannot simply
    // stay dark — so this is a ceiling, not a floor.
    need("cta-ink on cta", "cta-ink", "cta", 4.5, "button label");
    need(
      "cta fill on surface",
      "cta",
      "surface",
      3,
      "the button against the page",
    );
    assert.ok(
      relativeLuminance(T["cta"]) < 0.55,
      `${name}: --cta has luminance ${relativeLuminance(T["cta"]).toFixed(3)} — ` +
        `that is a near-white slab, not a button. It may get lighter in dark ` +
        `mode, but never to the point of being the brightest thing on the page.`,
    );

    assert.ok(
      relativeLuminance(T["band"]) < 0.1,
      `${name}: --band has luminance ${relativeLuminance(T["band"]).toFixed(3)} — ` +
        `too light to be an inverted band. It must be dark in BOTH themes; ` +
        `that is the entire reason it is not just --ink.`,
    );
    // A border nobody can see is not a border. Low bar on purpose — this is a
    // hairline, not a control — but a bar, because "invisible in dark mode" is
    // the classic way a themed divider disappears.
    need("line on card", "line", "card", 1.25, "divider");
    need("line on surface", "line", "surface", 1.25, "divider");
    // A raised surface must not be the SAME colour as the page — but the floor
    // is deliberately near the noise, because elevation is not carried by this
    // step in either theme. Light mode separates a card with its shadow and its
    // border (white on #F7F8FA is 1.06 and has always been); dark mode uses a
    // slightly lighter card and leans harder on the border, which is why `line`
    // is checked above at a real bar. Asserting a big step here would be
    // asserting a design the product does not have.
    need("card on surface", "card", "surface", 1.04, "elevation");
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// The ban patterns, in ONE place, because three of them have shipped broken.
//
// Every guard below is the same shape: walk the tree, collect offenders, assert
// the list is empty. **That shape fails OPEN.** A regex that matches nothing
// collects nothing, the list is empty, and CI goes green — which is
// indistinguishable from the rule holding. It has happened three times here:
//
//   • the bundle guard, written as a template literal, where `\s` became the
//     letter s;
//   • the type floor, `/text-[(d+(?:.d+)?)px]/`, whose backslashes were eaten,
//     so `[…]` was a character CLASS and the comparison was against `NaN`;
//   • the beat word count, `split(/s+/)`, which split on runs of the letter s
//     and read 9 words where the real maximum was 23.
//
// All three were quoted as guarantees while enforcing nothing.
//
// So the patterns live here and the guards reference them, and one test at the
// end of this block proves each one catches a line it must catch and ignores a
// line it must not. **The indirection is the point**: a bite test written
// against a COPY of a regex proves only that the copy works, and a copy drifts.
//
// `BAN_FIXTURES` is typed as a Record over `keyof typeof BAN`, so adding a
// pattern without a fixture does not compile. That is the part that survives
// somebody in a hurry.
const BAN = {
  /** A literal hex freezes a colour to one theme. */
  frozenHex: /#[0-9A-Fa-f]{6}\b/g,
  /** `reach`/`target`/`likely` DEFAULT is a fill (3:1); text needs `-ink`. */
  tierAsText: /text-(reach|target|likely)(?![-\w])/,
  /** `accent` DEFAULT measures 4.28:1 on the page — a fill, not a foreground. */
  accentAsText: /(?<![-\w:])text-accent(?![-\w])/,
  /** A `!` escape at a call site is a merge bug being forced, not a style. */
  bangEscape: /(?<=[\s"'`{])!(?:[a-z-]+:)*[a-z][a-z0-9]*-[a-z0-9./[\]%-]+/g,
  /** A hardcoded offset paints a white halo on the dark theme. */
  ringOffset: /ring-offset-(white|black)\b/,
  /** The directive disables the NEXT line, so a comment under it disables nothing. */
  eslintDisable: /^\s*(\/\/|\/\*|\{\s*\/\*)\s*eslint-disable-next-line\b/,
  /** The landing page ships no framer-motion; decoration does not buy hydration. */
  framerMotion: /framer-motion/,
  /** An animated blur re-rasterises every frame and cannot be composited. */
  animatedBlur: /\bblur-(sm|md|lg|xl|2xl|3xl)\b/,
  /** A band that caps at 6xl does not ramp with the shell. */
  ungrampedBand: /className="([^"]*\bmax-w-6xl\b[^"]*)"/g,
  /** Hardcoded type, in px or rem, checked against the floor. */
  hardcodedType: /text-\[(\d+(?:\.\d+)?)(px|rem)\]/g,
  /**
   * The same floor arriving as a NUMBER on a JSX prop, which no class-string
   * scan can see. CLAUDE.md names this exact case — `fontSize: 10` passed as a
   * prop — as the third way a guard is useless: correct, biting, reading the
   * right string, and pointed at an input surface narrower than its own rule.
   * Nine chart labels sat below the floor behind it, in four files, each of
   * which already set 12 for its own tooltip a few lines away.
   *
   * Unitless, because that is what Recharts and SVG take; the capture is the
   * bare number and the consumer treats it as px.
   */
  hardcodedFontSizeProp: /\bfontSize:\s*(\d+(?:\.\d+)?)\b/g,
  /** A client component reading the clock disagrees with the server's `todayISO`. */
  clockInClient: /new Date\(\s*\)/,
} as const;

/**
 * For each ban: lines it MUST catch, and lines it must leave alone.
 *
 * **`ignores` is a list, and it is the half that does the work.** The first
 * version of this test had one `ignores` line per pattern and it did not catch
 * a deliberate break: `tierAsText` was changed from `(?![-\w])` to `(?![-w])`,
 * losing a backslash exactly the way the three real failures did, and both
 * fixtures still behaved — because `text-reach` and `text-reach-ink` do not
 * distinguish `\w` from the letter w. Only a third word character does.
 *
 * So each `ignores` list must contain a **boundary** case, not just an obviously
 * different line: the near-miss that the pattern is supposed to exclude by a
 * single character of lookahead or lookbehind. A fixture that is far away from
 * the boundary proves nothing about where the boundary is.
 */
const BAN_FIXTURES: Record<
  keyof typeof BAN,
  { catches: string[]; ignores: string[] }
> = {
  frozenHex: {
    catches: ['const c = "#1A2B3C";', 'border: "#fff000"'],
    // Five digits is not a colour, and the token form is the correct one.
    ignores: ["rgb(var(--ink))", 'const c = "#1A2B3";'],
  },
  tierAsText: {
    catches: ['<p className="text-reach">', 'className="md:text-target"'],
    // `-ink` is the correct token; `text-targeted` is the word-character
    // boundary that a lost backslash in `\w` stops excluding.
    ignores: [
      '<p className="text-reach-ink">',
      'className="text-targeted"',
      'className="text-likely2"',
    ],
  },
  accentAsText: {
    catches: ['<span className="text-accent">', 'className="text-accent "'],
    // `-ink` is correct; `hover:` is the lookbehind; `accented` is the
    // word-character boundary on the other side.
    ignores: [
      '<span className="text-accent-ink">',
      'className="hover:text-accent"',
      'className="text-accented"',
    ],
  },
  bangEscape: {
    // The `!` has to open the class: the lookbehind is a quote, a space, a
    // backtick or `{`.
    catches: ['className="!px-7 py-4"', 'className="p-2 !mt-0"'],
    // `!==` and a bare `!flag` are not Tailwind escapes.
    //
    // KNOWN GAP, found by writing this fixture and left deliberately: Tailwind
    // also accepts the important modifier AFTER a variant (`sm:!mt-0`), and
    // this pattern cannot see that form, because it expects `!` first and the
    // variants after it. The tree has zero of them today (grep
    // `[a-z-]+:![a-z]`), so widening the regex here would be changing what is
    // enforced on the strength of a fixture rather than a defect. If one ever
    // appears, the fix is to allow variants on both sides of the `!`.
    ignores: ['className="px-7 py-4"', "if (a !== b) return;", "const x = !ok;"],
  },
  ringOffset: {
    catches: ["focus:ring-offset-white", 'className="ring-offset-black"'],
    // The themed token is the fix, and it starts with the same eleven letters.
    ignores: ["focus-visible:focus-ring", 'className="ring-offset-surface"'],
  },
  eslintDisable: {
    catches: [
      "  // eslint-disable-next-line no-explicit-any",
      "  {/* eslint-disable-next-line react/no-x */}",
    ],
    // The file-wide form disables a file, not the next line, and is not this rule.
    ignores: ["  const a = 1;", "  /* eslint-disable no-explicit-any */"],
  },
  framerMotion: {
    catches: ['import { motion } from "framer-motion";'],
    ignores: ['import Link from "next/link";', "// no framer here"],
  },
  animatedBlur: {
    catches: ['<div className="blur-3xl" />', 'className="md:blur-sm"'],
    // `backdrop-blur` composites; `blur-none` is the off switch.
    ignores: ['<div className="backdrop-blur" />', 'className="blur-none"'],
  },
  ungrampedBand: {
    catches: ['<div className="mx-auto max-w-6xl px-6">'],
    // 7xl ramps; `xl:max-w-6xl` as part of a ramp is caught deliberately, so the
    // near-miss here is the next size up rather than a prefixed 6xl.
    ignores: ['<div className="mx-auto max-w-7xl px-6">', 'className="max-w-60"'],
  },
  hardcodedType: {
    catches: ['<span className="text-[10px]">', 'className="text-[0.7rem]"'],
    // A scale class carries no bracket; `text-[color:…]` is not a size.
    ignores: ['<span className="text-sm">', 'className="text-[#fff]"'],
  },
  hardcodedFontSizeProp: {
    catches: [
      'tick={{ fill: "rgb(var(--ink-faint))", fontSize: 10 }}',
      "wrapperStyle={{ fontSize: 11, color: \"rgb(var(--ink-soft))\" }}",
    ],
    // The near-misses. A CSS string value is the class-string guard's business
    // and carries a unit; a name that merely ends in the word is not the prop.
    ignores: ['style={{ fontSize: "0.8rem" }}', "const baseFontSize = 10;"],
  },
  clockInClient: {
    catches: ["const t = new Date();", "const t = new Date(  );"],
    // Any argument makes it deterministic, which is the whole rule.
    ignores: ["const t = new Date(todayISO);", "const t = new Date(0);"],
  },
};

test("every ban pattern bites, and leaves the near-misses alone", () => {
  // A fresh regex from the same SOURCE, so a /g pattern's `lastIndex` is never
  // carried into or out of this test and the guards keep their exact semantics.
  // It has to be the same source and not a copied literal: a bite test written
  // against its own copy of a regex proves the copy works, which is nothing.
  const fresh = (re: RegExp) => new RegExp(re.source, re.flags.replace("g", ""));

  for (const key of Object.keys(BAN) as (keyof typeof BAN)[]) {
    const { catches, ignores } = BAN_FIXTURES[key];
    assert.ok(catches.length > 0 && ignores.length > 1, `BAN.${key} needs a boundary fixture`);
    for (const line of catches) {
      assert.ok(
        fresh(BAN[key]).test(line),
        `BAN.${key} does not match what it bans, so it is enforcing nothing: ${line}`,
      );
    }
    for (const line of ignores) {
      assert.ok(
        !fresh(BAN[key]).test(line),
        `BAN.${key} matches a correct line, so somebody will disable it: ${line}`,
      );
    }
  }
});

// Nothing may freeze a colour: a literal hex in a component or a data file stays
// light-mode red on a dark page. The two files that used to hold the palette are
// the ones most likely to grow one back.
test("the shared colour modules hold no frozen hex", () => {
  for (const f of ["lib/tiers.ts", "tailwind.config.ts"]) {
    const text = readFileSync(path.join(process.cwd(), f), "utf8");
    const code = text.replace(/\/\/[^\n]*|\/\*[\s\S]*?\*\//g, "");
    const frozen = code.match(BAN.frozenHex) ?? [];
    assert.deepEqual(
      frozen,
      [],
      `${f} holds ${frozen.join(", ")} — use rgb(var(--token)) so it themes`,
    );
  }
  // TIER_META is what the charts read; it has to point at the variables.
  for (const tier of ["reach", "target", "likely"] as const) {
    assert.match(
      TIER_META[tier].text,
      /^rgb\(var\(--\w[\w-]*\)\)$/,
      `TIER_META.${tier}.text must be a themed variable, not a fixed colour`,
    );
  }
});

// The fill is not a foreground colour. `text-*` sets `color`, which reaches text
// and every currentColor icon — so there is no legitimate `text-reach`, and
// naming the whole class of mistake is cheaper than re-auditing 88 call sites.
test("no component paints text with a tier fill instead of its ink", () => {
  const walk = (dir: string): string[] =>
    readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
      const full = path.join(dir, e.name);
      if (e.isDirectory()) return walk(full);
      return /\.tsx?$/.test(e.name) ? [full] : [];
    });

  const offenders: string[] = [];
  for (const root of ["app", "components"]) {
    for (const file of walk(path.join(process.cwd(), root))) {
      readFileSync(file, "utf8")
        .split("\n")
        .forEach((line, i) => {
          if (BAN.tierAsText.test(line)) {
            offenders.push(`${path.relative(process.cwd(), file)}:${i + 1}`);
          }
        });
    }
  }
  assert.deepEqual(
    offenders,
    [],
    `use text-<tier>-ink for foreground colour; the bare token is the fill:\n${offenders.join("\n")}`,
  );
});

// Text that reached production reading "TГјrkiye" and "KrakГіw".
//
// Windows PowerShell 5.1 decodes with the system ANSI codepage unless told
// otherwise, so a read-modify-write of a UTF-8 source file re-encodes the whole
// thing: every em dash became "вЂ”", every "ü" became "Гј", and the build was
// green throughout because mojibake is valid TypeScript. Editors do not show it
// either — it looks like text. This is the only cheap way to catch it.
//
// The sequences below cannot occur in real Russian, so this stays safe for the
// files that legitimately contain it (lib/data/geo.ts, the reasoning traces).
test("no source file carries mojibake from a bad encoding round-trip", () => {
  const MOJIBAKE = [
    "вЂ",
    "Гј",
    "Гі",
    "Гџ",
    "Г¶",
    "в†",
    "вњ“",
    "в”Ђ",
    "Д±",
    "Ã©",
    "â€",
  ];
  const roots = ["lib/data", "app/guide", "components/guide"];

  const walk = (dir: string): string[] =>
    readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
      const full = path.join(dir, e.name);
      if (e.isDirectory()) return walk(full);
      return /\.(ts|tsx)$/.test(e.name) ? [full] : [];
    });

  for (const root of roots) {
    for (const file of walk(path.join(process.cwd(), root))) {
      const text = readFileSync(file, "utf8");
      for (const seq of MOJIBAKE) {
        assert.ok(
          !text.includes(seq),
          `${path.relative(process.cwd(), file)} contains "${seq}" — the file was written by a tool that mis-decoded UTF-8`,
        );
      }
      assert.ok(
        !text.startsWith("﻿"),
        `${path.relative(process.cwd(), file)} starts with a byte-order mark`,
      );
    }
  }
});

// The guide's central claim is that its rules come from the organiser or the
// government that sets them. For two releases it linked to none of them, which
// made the claim unprovable — and unprovable is the same as untrue to a reader
// who is deciding whether to believe the rest of the page.
test("every country links to the body that actually sets its rules", () => {
  const seen = new Set<string>();
  for (const d of STUDY_DESTINATIONS) {
    assert.ok(
      d.sources.length >= 1,
      `${d.id} claims to be checked against an official source and links to none`,
    );
    for (const s of d.sources) {
      assert.ok(s.label.trim().length > 10, `${d.id} has an unlabelled source`);
      assert.ok(
        s.url.startsWith("https://"),
        `${d.id}: ${s.url} is not https — a rule read over http is a rule anyone can rewrite in transit`,
      );
      assert.ok(
        !seen.has(s.url),
        `${s.url} is listed twice across destinations`,
      );
      seen.add(s.url);
      // Official bodies only. An agency's page is a sales page, and a ranking
      // site is the thing this guide exists not to be.
      assert.ok(
        !/(wikipedia|blogspot|medium\.com|ranking|topuniversities|timeshigher)/i.test(
          s.url,
        ),
        `${d.id}: ${s.url} is not a primary source`,
      );
    }
  }
});

test("destination fields and hub links resolve", () => {
  const hubIds = new Set(HUBS.map((h) => h.id));
  const faculties = new Set<string>(FACULTY_VALUES);
  for (const d of STUDY_DESTINATIONS) {
    assert.ok(d.fields.length > 0, `${d.id} claims no fields`);
    for (const f of d.fields) {
      assert.ok(faculties.has(f), `${d.id} has unknown field ${f}`);
    }
    for (const h of d.hubs) {
      assert.ok(hubIds.has(h), `${d.id} points at missing hub ${h}`);
    }
  }
});

test("every field reaches at least three destinations; empty in ⇒ all", () => {
  assert.equal(destinationsForFaculties([]).length, STUDY_DESTINATIONS.length);
  for (const f of FACULTY_VALUES) {
    assert.ok(
      destinationsForFaculties([f]).length >= 3,
      `${f} has too few destinations to compare`,
    );
  }
});

test("every destination Compass models odds for has a profile", () => {
  // US, Italy, Hong Kong, UAE and Korea have deterministic or AI odds engines;
  // a student reading their odds must be able to read what the place is like.
  for (const id of [
    "united-states",
    "italy",
    "hong-kong",
    "uae",
    "south-korea",
  ]) {
    const d = destinationById(id);
    assert.ok(d, `no profile for modelled destination ${id}`);
    assert.equal(d!.modelled, true, `${id} is modelled but not marked as such`);
  }
});

// ── Partner attribution and the kill switch ──────────────────────────────────
// The rules that decide whether an organisation's name and tick appear on a
// student's card, and — the security-relevant half — whether a suspended
// organisation's posts disappear. `competitionsFromRows` is the ONE place both
// student surfaces map live rows, so these invariants only need holding here.

const partnerRow = (over: Record<string, unknown> = {}) => ({
  id: "astana-hub",
  name: "Astana Hub",
  status: "active",
  verified_at: "2026-08-01T00:00:00Z",
  logo_url: null,
  ...over,
});

const postRow = (over: Record<string, unknown> = {}) => ({
  id: "astana-hub-hackathon",
  name: "Astana Hub Hackathon",
  fields: "all",
  deadline: "2026-11-01",
  event_window: "Two days in November",
  level: "national",
  url: "https://astanahub.com/hack",
  blurb: "A weekend hackathon for school students.",
  date_confirmed: true,
  published: true,
  partner_id: "astana-hub",
  ...over,
});

test("a verified partner's post carries the name and the tick", () => {
  const [c] = competitionsFromRows([postRow()], [partnerRow()]);
  assert.equal(c.partner?.name, "Astana Hub");
  assert.equal(c.partner?.verified, true);
});

test("verification is separate from listing — no verified_at, no tick", () => {
  const [c] = competitionsFromRows(
    [postRow()],
    [partnerRow({ verified_at: null })],
  );
  assert.equal(c.partner?.name, "Astana Hub");
  assert.equal(c.partner?.verified, false);
});

test("suspending a partner removes its posts, not just its name", () => {
  const rows = competitionsFromRows(
    [postRow()],
    [partnerRow({ status: "suspended" })],
  );
  assert.equal(rows.length, 0);
  // Same when the partner row is absent entirely (RLS hid it).
  assert.equal(competitionsFromRows([postRow()], []).length, 0);
});

test("a taken-down post is gone whatever the partner's state", () => {
  assert.equal(
    competitionsFromRows([postRow({ published: false })], [partnerRow()])
      .length,
    0,
  );
});

test("a non-partner live row is untouched by any of this", () => {
  const rows = competitionsFromRows([postRow({ partner_id: null })], []);
  assert.equal(rows.length, 1);
  assert.equal(rows[0].partner, undefined);
});

test("partner rows join the student pool as ordinary opportunities", () => {
  const live = competitionsFromRows([postRow()], [partnerRow()]);
  const plan = buildExtracurriculars({
    today: TODAY,
    faculties: [],
    factors: [],
    liveCompetitions: live,
    homeCountry: null,
  });
  const found = plan.items.find((o) => o.id === "astana-hub-hackathon");
  assert.ok(found, "partner post should reach the matched list");
  assert.equal(found?.partner?.verified, true);
});

test("a local partner post is for its own country, and says so elsewhere", () => {
  // This used to assert the row VANISHED outside its country. It is marked
  // `offRegion` now and the filter panel hides it by default, which keeps the
  // student's list the same while giving them a way to see it and a count
  // saying how many rows the narrowing removed — the gate used to be invisible
  // and had no route past it at all.
  const live = competitionsFromRows(
    [postRow({ region: "KZ" })],
    [partnerRow()],
  );
  const row = (homeCountry: string | null) =>
    buildExtracurriculars({
      today: TODAY,
      faculties: [],
      factors: [],
      liveCompetitions: live,
      homeCountry,
    }).items.find((o) => o.id === "astana-hub-hackathon");

  assert.equal(row("KZ")?.offRegion, false, "hidden from the country it is for");
  assert.equal(row("UZ")?.offRegion, true, "not marked as belonging elsewhere");
  // And with no country stated, a local row is nobody's outsider.
  assert.equal(row(null)?.offRegion, false);
});

// ---------------------------------------------------------------------------
// Site traffic (lib/traffic/*)
//
// Two things are pinned here, and both fail silently otherwise.
//
// The first is the privacy boundary: `cleanPath` is the only thing standing
// between an auth callback URL and a permanent analytics row. It is one line of
// string handling, which is exactly why it needs a test — nothing on the admin
// dashboard would look wrong if it quietly stopped working.
//
// The second is the set of definitions the dashboard is made of. "Visit
// duration", "returned", "bounced" are choices, not facts, and a founder
// acting on them deserves to know they still mean what the page says.
// ---------------------------------------------------------------------------

test("a path is stored without its query string, ever", () => {
  assert.equal(
    cleanPath("/auth/callback?code=SECRET&next=/x"),
    "/auth/callback",
  );
  assert.equal(cleanPath("/opportunities?ref=alibek#top"), "/opportunities");
  assert.equal(cleanPath("/guide/"), "/guide");
  assert.equal(cleanPath("/"), "/");
  // Anything that is not a path of ours is not stored at all.
  assert.equal(cleanPath("https://evil.test/x"), null);
  assert.equal(cleanPath(""), null);
});

test("the admin reading this dashboard is not counted as site traffic", () => {
  assert.equal(shouldTrack("/admin/traffic"), false);
  assert.equal(shouldTrack("/api/track"), false);
  assert.equal(shouldTrack("/auth/callback"), false);
  assert.equal(shouldTrack("/opportunities"), true);
  assert.equal(shouldTrack("/"), true);
});

test("development and preview hosts stay out of production numbers", () => {
  assert.equal(isMeasurableHost("localhost:3000"), false);
  assert.equal(isMeasurableHost("127.0.0.1:3000"), false);
  assert.equal(isMeasurableHost("compass-git-develop.vercel.app"), false);
  assert.equal(isMeasurableHost("compass.app"), true);
  assert.equal(isMeasurableHost(null), false);
});

test("our own pages are never a traffic source", () => {
  assert.equal(externalHost("https://compass.app/guide", "compass.app"), null);
  assert.equal(externalHost("https://www.compass.app/x", "compass.app"), null);
  assert.equal(externalHost("https://t.me/chan", "compass.app"), "t.me");
  assert.equal(
    externalHost("https://www.google.com/", "compass.app"),
    "google.com",
  );
  assert.equal(externalHost(null, "compass.app"), null);
  assert.equal(externalHost("not a url", "compass.app"), null);
});

test("a missing user agent is a bot, and a real one is not", () => {
  assert.equal(isBot(null), true);
  assert.equal(isBot("Mozilla/5.0 (compatible; Googlebot/2.1)"), true);
  assert.equal(isBot("HeadlessChrome/120"), true);
  assert.equal(
    isBot("Mozilla/5.0 (iPhone; CPU iPhone OS 17_0) AppleWebKit/605.1.15"),
    false,
  );
});

test("a client cannot claim an implausible amount of time on a page", () => {
  assert.equal(cleanDwell(45_000), 45_000);
  assert.equal(cleanDwell(-5), null);
  assert.equal(cleanDwell("nope"), null);
  // A tab left open all weekend must not become the median visit.
  assert.equal(cleanDwell(9_999_999_999), 60 * 60 * 1000);
});

const T0 = Date.parse("2026-08-07T12:00:00.000Z");
const view = (o: Partial<ViewRow> & { created_at: string }): ViewRow => ({
  visitor_id: "v1",
  session_id: "s1",
  user_id: null,
  path: "/",
  referrer: null,
  country: null,
  device: "desktop",
  dwell_ms: null,
  ...o,
});

test("one page with a beacon is a real visit, not a zero-second one", () => {
  // The whole reason dwell is measured: last-minus-first would call this 0.
  const ms = visitDurationMs([
    view({ created_at: new Date(T0).toISOString(), dwell_ms: 42_000 }),
  ]);
  assert.equal(ms, 42_000);
});

test("a visit includes reading time on its last page", () => {
  const ms = visitDurationMs([
    view({ created_at: new Date(T0).toISOString(), dwell_ms: 30_000 }),
    view({ created_at: new Date(T0 + 30_000).toISOString(), dwell_ms: 60_000 }),
  ]);
  assert.equal(ms, 90_000);
});

test("a single view with no beacon is unknown, not zero", () => {
  assert.equal(
    visitDurationMs([view({ created_at: new Date(T0).toISOString() })]),
    null,
  );
  assert.equal(visitDurationMs([]), null);
});

test("a visit of unknown length is left out of the median, not counted as 0s", () => {
  const rows = [
    view({ created_at: new Date(T0).toISOString(), dwell_ms: 120_000 }),
    view({
      session_id: "s2",
      visitor_id: "v2",
      created_at: new Date(T0).toISOString(),
    }),
  ];
  const s = summarize(rows, T0 + 1000, 7);
  assert.equal(s.totals.visits, 2);
  assert.equal(s.totals.medianVisitSec, 120);
  // One visit had a knowable length, and it did not bounce.
  assert.equal(s.totals.bounceRate, 0);
});

test("returned means a second DAY, not a second click", () => {
  const sameDay = [
    view({ created_at: new Date(T0 - 5 * 3_600_000).toISOString() }),
    view({ session_id: "s2", created_at: new Date(T0).toISOString() }),
  ];
  assert.equal(summarize(sameDay, T0 + 1000, 7).totals.returned, 0);

  const twoDays = [
    view({ created_at: new Date(T0 - 36 * 3_600_000).toISOString() }),
    view({ session_id: "s2", created_at: new Date(T0).toISOString() }),
  ];
  const s = summarize(twoDays, T0 + 1000, 7);
  assert.equal(s.totals.returned, 1);
  assert.equal(s.totals.visitors, 1);
});

test("a visitor first seen in the comparison window is not counted as new", () => {
  const rows = [
    // 10 days ago — outside the displayed 7 days, inside the loaded 14.
    view({ created_at: new Date(T0 - 10 * 86_400_000).toISOString() }),
    view({
      session_id: "s2",
      created_at: new Date(T0 - 3_600_000).toISOString(),
    }),
  ];
  const s = summarize(rows, T0, 7);
  const today = s.buckets[s.buckets.length - 1];
  assert.equal(today.visitors, 1);
  assert.equal(today.newVisitors, 0, "we had seen them before");
  assert.equal(today.returningVisitors, 1);
});

test("the chart has one bucket per calendar slot, including the empty ones", () => {
  const s = summarize(
    [view({ created_at: new Date(T0).toISOString() })],
    T0,
    30,
  );
  assert.equal(s.buckets.length, 30);
  assert.equal(s.granularity, "day");
  assert.equal(summarize([], T0, 1).buckets.length, 24);
  assert.equal(summarize([], T0, 1).granularity, "hour");

  // The bucket key IS the UTC calendar slot, and it is built from the date's
  // UTC fields rather than by slicing `toISOString()` — that method formats the
  // milliseconds and the zone as well, only for the slice to discard them, and
  // it runs once per row per pass. Same characters, and this is what says so.
  // A whole day and a whole 24 hours are walked, so a month or hour that pads
  // differently at either end cannot slip through.
  const DAY = 24 * 60 * 60 * 1000;
  for (let i = 0; i < 30; i++) {
    const t = T0 - i * DAY;
    assert.equal(
      summarize([], t, 30).buckets[29].key,
      new Date(t).toISOString().slice(0, 10),
      `day key drift at ${new Date(t).toISOString()}`,
    );
  }
  for (let h = 0; h < 24; h++) {
    const t = Date.parse("2026-12-31T00:00:00.000Z") + h * 60 * 60 * 1000;
    assert.equal(
      summarize([], t, 1).buckets[23].key,
      new Date(t).toISOString().slice(0, 13),
      `hour key drift at ${new Date(t).toISOString()}`,
    );
  }
});

test("a visit has one source — its first external referrer", () => {
  const rows = [
    view({ created_at: new Date(T0).toISOString(), referrer: "t.me" }),
    view({ created_at: new Date(T0 + 60_000).toISOString() }),
    view({ created_at: new Date(T0 + 120_000).toISOString() }),
  ];
  const s = summarize(rows, T0 + 200_000, 7);
  assert.deepEqual(s.sources, [{ source: "t.me", visits: 1, visitors: 1 }]);
});

test("no referrer anywhere in a visit reads as Direct", () => {
  const s = summarize(
    [view({ created_at: new Date(T0).toISOString() })],
    T0 + 1000,
    7,
  );
  assert.equal(s.sources[0].source, "Direct");
});

test("entry pages count visits that started there, not views", () => {
  const rows = [
    view({ created_at: new Date(T0).toISOString(), path: "/" }),
    view({
      created_at: new Date(T0 + 10_000).toISOString(),
      path: "/opportunities",
    }),
    view({ created_at: new Date(T0 + 20_000).toISOString(), path: "/" }),
  ];
  const s = summarize(rows, T0 + 30_000, 7);
  const home = s.pages.find((p) => p.path === "/");
  assert.equal(home?.views, 2);
  assert.equal(home?.entries, 1);
  assert.equal(s.pages.find((p) => p.path === "/opportunities")?.entries, 0);
});

test("summarize reads correctly at zero rather than dividing by it", () => {
  const s = summarize([], T0, 7);
  assert.equal(s.totals.visitors, 0);
  assert.equal(s.totals.viewsPerVisit, 0);
  assert.equal(s.totals.medianVisitSec, 0);
  assert.equal(s.totals.bounceRate, null, "no visits means no rate, not 0%");
  assert.equal(s.live.visitors, 0);
  assert.equal(s.pages.length, 0);
});

test("durations are never shown as a bare number of seconds", () => {
  assert.equal(formatDuration(0), "0s");
  assert.equal(formatDuration(45), "45s");
  assert.equal(formatDuration(200), "3m 20s");
  assert.equal(formatDuration(180), "3m");
  assert.equal(formatDuration(3_840), "1h 4m");
});

// ── The landing map's precomputed outlines ────────────────────────────────────
//
// lib/data/map-outlines.ts is generated from public/data/*.json, and generated
// files rot silently: someone edits the geo data, the committed module keeps
// drawing the old coastline, and nothing complains. Regenerating in-memory and
// diffing catches exactly that.

test("map-outlines.ts matches what the generator produces today", () => {
  const onDisk = readFileSync(
    path.join(process.cwd(), "lib", "data", "map-outlines.ts"),
    "utf8",
  );
  assert.equal(
    renderModule().replace(/\r\n/g, "\n"),
    onDisk.replace(/\r\n/g, "\n"),
    "public/data changed without `npm run map:outlines` — the landing map is drawing a stale coastline",
  );
});

test("every country the map can show has an outline", () => {
  for (const c of COUNTRIES) {
    const o = MAP_OUTLINES[c.code];
    assert.ok(o, `${c.code} has no generated outline`);
    // A path that never closes a ring means the clip mask is empty, which
    // renders as a country-shaped hole rather than a country.
    assert.ok(
      o.d.startsWith("M") && o.d.endsWith("Z"),
      `${c.code} path is malformed`,
    );
    assert.ok(o.img.w > 0 && o.img.h > 0, `${c.code} has no terrain box`);
    const [minLon, minLat, maxLon, maxLat] = o.bounds;
    assert.ok(
      minLon < maxLon && minLat < maxLat,
      `${c.code} bounds are inverted`,
    );
    // Markers are placed by inverting `bounds`, so one outside the box would be
    // drawn off the coastline entirely.
    for (const m of c.markers) {
      assert.ok(
        m.lon >= minLon &&
          m.lon <= maxLon &&
          m.lat >= minLat &&
          m.lat <= maxLat,
        `${c.code}: ${m.name} sits outside the generated bounds`,
      );
    }
  }
});

// ── The site is findable ──────────────────────────────────────────────────────
//
// 66 evergreen public pages, written for queries our students actually type,
// and until app/sitemap.ts existed nothing told a crawler they were there. Two
// invariants worth pinning, because both failures are silent: a sitemap that
// lists a URL which 404s, and a robots.txt rule that blocks a page we are
// simultaneously asking to be indexed.

test("every guide URL in the sitemap resolves to a real subject", () => {
  const urls = sitemapRoutes().map((e) => e.url);

  assert.equal(new Set(urls).size, urls.length, "the sitemap repeats a URL");

  for (const url of urls) {
    assert.ok(
      url.startsWith(`${CANONICAL_URL}/`),
      `${url} is not an absolute URL on the canonical domain`,
    );
  }

  const paths = urls.map((u) => new URL(u).pathname);

  // The four steps and the section index, from the registry the tabs read.
  assert.ok(paths.includes("/guide"));
  for (const s of GUIDE_SECTIONS)
    assert.ok(paths.includes(s.href), `${s.href} missing`);
  assert.ok(paths.includes("/"), "the landing page is missing");
  assert.ok(paths.includes("/opportunities"), "the front door is missing");

  const listed = (prefix: string) =>
    paths
      .filter((p) => p.startsWith(prefix))
      .map((p) => p.slice(prefix.length));

  const areas = listed("/guide/work/");
  assert.equal(areas.length, allCareerAreas().length);
  for (const slug of areas)
    assert.ok(areaBySlug(slug), `no area of work at ${slug}`);

  const places = listed("/guide/places/");
  assert.equal(places.length, STUDY_DESTINATIONS.length);
  for (const id of places)
    assert.ok(destinationById(id), `no country at ${id}`);

  const cities = listed("/guide/cities/");
  assert.equal(cities.length, HUBS.length);
  for (const id of cities)
    assert.ok(
      HUBS.some((h) => h.id === id),
      `no city at ${id}`,
    );

  // The old country addresses are 308s, not pages: listing one would ask a
  // crawler to index a redirect.
  for (const id of LEGACY_GUIDE_PLACE_IDS) {
    assert.ok(
      !paths.includes(`/guide/${id}`),
      `/guide/${id} is a redirect, not a page`,
    );
  }
});

test("robots.txt does not block anything the sitemap advertises", () => {
  const rules = robotsFile().rules;
  const blocks = Array.isArray(rules) ? rules : [rules];
  const disallow = blocks.flatMap((b) => [b.disallow ?? []].flat());

  // robots.txt matches by PREFIX unless the rule is anchored with `$`, which is
  // how `Disallow: /partner` (the console) would also have hidden `/partners`
  // (the public list of organisations) — the exact bug this test exists for.
  const blocked = (pathname: string, rule: string) =>
    rule.endsWith("$")
      ? pathname === rule.slice(0, -1)
      : pathname.startsWith(rule);

  for (const entry of sitemapRoutes()) {
    const pathname = new URL(entry.url).pathname;
    for (const rule of disallow) {
      assert.ok(
        !blocked(pathname, rule),
        `robots.txt rule "${rule}" blocks ${pathname}, which the sitemap lists`,
      );
    }
  }

  // And the private trees really are closed.
  for (const priv of [
    "/dashboard",
    "/admin/traffic",
    "/api/track",
    "/partner",
    "/planner",
  ]) {
    assert.ok(
      disallow.some((rule) => blocked(priv, rule)),
      `${priv} is crawlable`,
    );
  }
});

// ── Discovery screening ──────────────────────────────────────────────────────
// The step that decides whether a discovered candidate is worth a human's
// attention. Every case below is a failure that actually shipped, or the fix
// for one: a live link to a dead programme, a whole platform made
// undiscoverable by a blunt host rule, an eligibility sentence no student
// passes. These run with no key and no network — the screening is deliberately
// deterministic so it can be pinned here.

const SCREEN_REGISTRY = buildRegistryIndex([
  {
    id: "john-locke",
    name: "John Locke Essay Prize",
    url: "https://www.johnlockeinstitute.com/essay-competition",
  },
  { id: "cs50-ai", name: "CS50 AI", url: "https://cs50.harvard.edu/ai/" },
  {
    id: "amc",
    name: "AMC 10/12 (math)",
    url: "https://maa.org/maa-invitational-competitions/",
  },
]);

test("a URL differing only by www, trailing slash or query is the same page", () => {
  assert.equal(
    normalizeUrl("https://www.johnlockeinstitute.com/essay-competition/"),
    normalizeUrl(
      "https://johnlockeinstitute.com/essay-competition?utm_source=x",
    ),
  );
  assert.notEqual(
    normalizeUrl("https://cs50.harvard.edu/ai/"),
    normalizeUrl("https://cs50.harvard.edu/web/"),
  );
});

test("a renamed duplicate is caught; a sibling programme on the same host is not", () => {
  // Same programme, padded name — containment catches what Jaccard misses.
  assert.ok(
    nameSimilarity(
      "John Locke Essay Prize",
      "John Locke Institute Essay Competition",
    ) >= 0.75,
  );

  const dup = screenDedup(
    {
      id: "john-locke-institute-essay-competition",
      name: "John Locke Institute Essay Competition",
      url: "https://www.johnlockeinstitute.com/apply",
    },
    SCREEN_REGISTRY,
  );
  assert.ok(shouldDrop(dup), "a renamed duplicate must not reach the queue");

  // The old rule dropped anything sharing a HOST with the catalog, which made
  // every further course on a platform we already list undiscoverable.
  const sibling = screenDedup(
    {
      id: "cs50-cybersecurity",
      name: "CS50 Cybersecurity",
      url: "https://cs50.harvard.edu/cybersecurity/",
    },
    SCREEN_REGISTRY,
  );
  assert.ok(
    !shouldDrop(sibling),
    "a different programme on a known host must survive",
  );
  assert.ok(
    sibling.some((w) => w.code === "same_site"),
    "…but the reviewer is told it shares a site",
  );
});

test("a one-token overlap is not a duplicate", () => {
  // "Informatics Olympiad" vs "Informatics Olympiad Kazakhstan": the generic
  // words are stripped, so a single surviving token would collapse a global
  // contest and a national one into each other.
  const index = buildRegistryIndex([
    {
      id: "ioi",
      name: "International Olympiad in Informatics",
      url: "https://ioinformatics.org/",
    },
  ]);
  const res = screenDedup(
    {
      id: "kazakh-informatics-olympiad",
      name: "Kazakhstan Informatics Olympiad",
      url: "https://olymp.kz/",
    },
    index,
  );
  assert.ok(!shouldDrop(res));
});

test("a listing site is dropped; a social page depends on scope", () => {
  assert.ok(
    shouldDrop(
      screenHost("https://opportunitydesk.org/2026/03/01/some-contest/", null),
    ),
  );
  assert.ok(
    shouldDrop(screenHost("https://medium.com/@someone/top-10-contests", null)),
  );

  // A global programme with nothing but an Instagram page is not one we can
  // stand behind; a city hackathon in Almaty announced there is.
  assert.ok(
    shouldDrop(screenHost("https://www.instagram.com/some_contest/", null)),
  );
  const local = screenHost("https://www.instagram.com/almaty_hack/", "KZ");
  assert.ok(!shouldDrop(local));
  assert.ok(local.some((w) => w.code === "social_only"));

  assert.equal(screenHost("https://ioinformatics.org/", null).length, 0);
});

test("a page that says the programme has ended is flagged with the sentence", () => {
  // The Goi Peace trap: HTTP 200, and the page itself says it is over.
  // test:links cannot see this, and it shipped in the catalog once.
  const text =
    "The International Essay Contest for Young People concluded with the 2024 edition. " +
    "Thank you to everyone who took part over the years. ".repeat(6);
  const warnings = screenPage(
    {
      name: "International Essay Contest for Young People",
      url: "https://example.org/essay",
    },
    text,
  );
  const ended = warnings.find((w) => w.code === "discontinued");
  assert.ok(ended, "an ended programme must be flagged");
  assert.match(ended!.detail, /concluded with the 2024/);
});

test("a healthy competition page is not read as discontinued", () => {
  // "Registration is closed" is the normal state of a healthy contest for most
  // of the year. Reading it as death would empty the queue.
  const text =
    "Registration for the 2027 cycle is closed. Applications reopen in September. " +
    "The Foo Challenge runs every year for students aged 13 to 18. ".repeat(6);
  const warnings = screenPage(
    { name: "Foo Challenge", url: "https://example.org/foo" },
    text,
  );
  assert.ok(!warnings.some((w) => w.code === "discontinued"));
});

test("screening quotes money instead of guessing a price", () => {
  const text =
    "The Bar Prize is open to students worldwide. There is a $25 entry fee, waived on request. " +
    "Submissions are judged by a panel. ".repeat(8);
  const money = screenPage(
    { name: "Bar Prize", url: "https://example.org/bar" },
    text,
  ).find((w) => w.code === "cost_signal");
  assert.ok(money, "a fee on the page must reach the reviewer");
  assert.match(money!.detail, /\$25/);
});

test("a US-only page is flagged rather than silently recommended abroad", () => {
  const text =
    "The contest is open only to US citizens enrolled in a high school. " +
    "Entries are judged in three rounds. ".repeat(10);
  const warnings = screenPage(
    { name: "Baz Contest", url: "https://example.org/baz" },
    text,
  );
  assert.ok(warnings.some((w) => w.code === "country_locked"));
});

test("a page that never names the programme is flagged", () => {
  const text =
    "We are a foundation supporting education across the region. ".repeat(12);
  const warnings = screenPage(
    { name: "Quux Robotics Challenge", url: "https://example.org/" },
    text,
  );
  assert.ok(warnings.some((w) => w.code === "name_absent"));
});

test("an eligibility sentence no student passes is flagged, not queued as normal", () => {
  // The AMC trap: two brackets in one sentence, the parser takes the first,
  // and the entry becomes unreachable for everyone it was written for.
  assert.ok(
    screenEligibility("Undergraduate students only, ages 19–25").some(
      (w) => w.code === "unreachable_gate",
    ),
  );
  // A normal school-age rule passes clean.
  assert.equal(screenEligibility("Ages 13–18, any country").length, 0);
  // Silence about eligibility is itself a finding — it is the first question a
  // student asks.
  assert.ok(screenEligibility(null).some((w) => w.code === "gate_unstated"));
});

// ── The guide's list filters ────────────────────────────────────────────────
//
// Same three rules as the opportunities panel, because a student should not
// have to learn two filtering behaviours inside one product. These are the
// rules, not the implementation, so they are worth pinning.

const gRow = (
  id: string,
  region: RegionKey,
  text: string,
  modelled?: boolean,
): GuideRow => ({ id, region, text: text.toLowerCase(), modelled });

const GROWS: GuideRow[] = [
  gRow("germany", "europe", "Germany free public universities", true),
  gRow("italy", "europe", "Italy income based tuition", true),
  gRow("japan", "asia_pacific", "Japan national universities", false),
  gRow("korea", "asia_pacific", "South Korea scholarships", true),
  gRow("uae", "middle_east", "United Arab Emirates Dubai", true),
  gRow("kazakhstan", "central_asia", "Kazakhstan already inside", false),
];

test("no filter shows everything, and the neutral state is empty", () => {
  assert.equal(filterGuideRows(GROWS, NO_GUIDE_FILTERS).length, GROWS.length);
  assert.equal(activeGuideFilterCount(NO_GUIDE_FILTERS), 0);
  assert.deepEqual(guideFilterParams(NO_GUIDE_FILTERS), {});
});

test("options inside a group are ORed, groups are ANDed", () => {
  const twoRegions = {
    ...NO_GUIDE_FILTERS,
    regions: ["europe", "asia_pacific"] as RegionKey[],
  };
  // OR inside the group: both regions, not their intersection (which is empty).
  assert.equal(filterGuideRows(GROWS, twoRegions).length, 4);
  // AND across groups: those regions AND modelled.
  const andModelled = { ...twoRegions, modelledOnly: true };
  assert.deepEqual(
    filterGuideRows(GROWS, andModelled).map((r) => r.id),
    ["germany", "italy", "korea"],
  );
});

test("a group's counts are computed with its OWN selection lifted", () => {
  // The rule that makes a count worth reading: standing on Europe, the number
  // on Asia-Pacific must still say what switching to it would give you. With
  // the group applied it would read 0 and tell the student nothing.
  const f = { ...NO_GUIDE_FILTERS, regions: ["europe"] as RegionKey[] };
  const facets = guideFacets(GROWS, f);
  assert.equal(facets.regions.europe, 2);
  assert.equal(facets.regions.asia_pacific, 2, "sibling region zeroed out");
  assert.equal(facets.regions.central_asia, 1);
  // The total, by contrast, IS what the list shows.
  assert.equal(facets.total, 2);
});

test("a count from another group still reflects the filters that are on", () => {
  // Lifting is per-group, not global: with Europe selected, the modelled count
  // must describe Europe, or the two controls would describe different lists.
  const f = { ...NO_GUIDE_FILTERS, regions: ["europe"] as RegionKey[] };
  assert.equal(guideFacets(GROWS, f).modelled, 2);
  assert.equal(guideFacets(GROWS, NO_GUIDE_FILTERS).modelled, 4);
});

test("search takes all terms in any order, and an empty query matches all", () => {
  const q = (s: string) =>
    filterGuideRows(GROWS, { ...NO_GUIDE_FILTERS, q: s });
  assert.deepEqual(
    q("public germany").map((r) => r.id),
    ["germany"],
  );
  assert.deepEqual(
    q("GERMANY").map((r) => r.id),
    ["germany"],
    "case-insensitive",
  );
  assert.deepEqual(
    q("univers").map((r) => r.id),
    ["germany", "japan"],
    "substring",
  );
  assert.equal(q("   ").length, GROWS.length, "blank query is not a filter");
  assert.equal(q("germany japan").length, 0, "terms are ANDed");
});

test("filters survive a round trip through the URL", () => {
  const f = {
    q: "free public",
    regions: ["europe", "middle_east"] as RegionKey[],
    modelledOnly: true,
  };
  assert.deepEqual(parseGuideFilters(guideFilterParams(f)), f);
  // Empty values never reach the URL — a student pastes these into a chat.
  assert.deepEqual(guideFilterParams({ ...NO_GUIDE_FILTERS, q: "  " }), {});
  // Junk in a hand-edited URL is dropped rather than throwing.
  assert.deepEqual(parseGuideFilters({ r: "europe,atlantis", m: "yes" }), {
    q: "",
    regions: ["europe"],
    modelledOnly: false,
  });
  // A repeated region is a hand-edited URL, not a state the panel can produce.
  assert.deepEqual(parseGuideFilters({ r: "europe,europe" }).regions, [
    "europe",
  ]);
});

// ── Interaction & class-composition invariants ───────────────────────────────
//
// Four rules, each one a bug this codebase actually shipped. They are checked by
// reading the source because none of them can fail a type-check, and three of
// them cannot fail a lint either: the code is valid, it just does not do what it
// says.

/** Every .ts/.tsx under app/ and components/. */
const sourceFiles = (): string[] => {
  const walk = (dir: string): string[] =>
    readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
      const full = path.join(dir, e.name);
      if (e.isDirectory()) return e.name === "node_modules" ? [] : walk(full);
      return /\.tsx?$/.test(e.name) ? [full] : [];
    });
  return ["app", "components"].flatMap((r) =>
    walk(path.join(process.cwd(), r)),
  );
};
/** Every .ts/.tsx under app/, components/ AND lib/ — the whole authored tree. */
const allRepoSources = (): string[] => {
  const walk = (dir: string): string[] =>
    readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
      const full = path.join(dir, e.name);
      if (e.isDirectory()) return e.name === "node_modules" ? [] : walk(full);
      return /\.tsx?$/.test(e.name) ? [full] : [];
    });
  return ["app", "components", "lib"].flatMap((r) =>
    walk(path.join(process.cwd(), r)),
  );
};
const rel = (f: string) =>
  path.relative(process.cwd(), f).split(path.sep).join("/");
const stripComments = (s: string) =>
  s.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^[ \t]*\/\/[^\n]*$/gm, "");

/**
 * A JSX opening tag, with its attribute list COMPLETE.
 *
 * This exists because two guards below bounded a tag with the next `>` —
 * `/<(a|button|Link)\s([^>]*?)>/` and `/<button\b[\s\S]{0,1200}?>/` — and
 * `onClick={() =>` contains a `>`. Both therefore stopped before `className`
 * on every tag carrying an arrow function, which is most of them. Measured
 * 2026-08-25: the focus guard matched 227 tags, 80 truncated, and **78 were
 * then dropped by its own `if (!/className/.test(attrs)) continue`** — 34% of
 * the surface, never inspected. The dimmed-control guard was worse: run
 * against the pre-fix `GuideFilterBar.tsx`, the file its own comment names, it
 * flagged **0 of the 2** `opacity-50` chips it was written to catch.
 *
 * Both bite tests passed the whole time, because both fixtures used
 * `onClick={onClick}` — the one attribute shape with no arrow in it.
 *
 * So: a tag ends at a `>` that sits at brace depth 0 and outside any string.
 * The scan is bounded because a runaway (an unbalanced `{` in a template) would
 * otherwise walk to end-of-file once per tag, which is quadratic over the tree.
 */
type JsxTag = { text: string; name: string; index: number };
const JSX_TAG_LIMIT = 4000;
const jsxOpenTags = (src: string, names: readonly string[]): JsxTag[] => {
  const out: JsxTag[] = [];
  const opener = new RegExp(`<(${names.join("|")})(?=[\\s/>])`, "g");
  for (const m of src.matchAll(opener)) {
    const from = m.index + m[0].length;
    const limit = Math.min(src.length, from + JSX_TAG_LIMIT);
    let depth = 0;
    let end = -1;
    for (let i = from; i < limit; i++) {
      const c = src[i];
      if (c === "{") depth++;
      else if (c === "}") depth = Math.max(0, depth - 1);
      else if (c === '"' || c === "'" || c === "`") {
        const quote = c;
        i += 1;
        while (i < limit && src[i] !== quote) i += src[i] === "\\" ? 2 : 1;
      } else if (c === ">" && depth === 0) {
        end = i;
        break;
      }
    }
    if (end < 0) continue;
    out.push({ text: src.slice(m.index, end + 1), name: m[1], index: m.index });
  }
  return out;
};

// A Tailwind `!` escape is never a style decision — it is an author discovering
// that a component concatenated its classes with theirs, so the framework's
// emission order beat their override, and forcing the issue locally. Button.tsx
// had three of these pointing at one root cause. Fix the component (merge with
// `cn`), don't escape at the call site.
test("no `!important` Tailwind escapes — they mark a component that won't let a caller win", () => {
  const offenders: string[] = [];
  for (const file of sourceFiles()) {
    stripComments(readFileSync(file, "utf8"))
      .split("\n")
      .forEach((line, i) => {
        // `!` directly before a utility-shaped token (needs the dash, so `!isOpen`
        // and `!==` are not matches).
        const hits = line.match(BAN.bangEscape);
        for (const h of hits ?? [])
          offenders.push(`${rel(file)}:${i + 1} ${h}`);
      });
  }
  assert.deepEqual(
    offenders,
    [],
    `Tailwind \`!\` escape(s) found:\n  ${offenders.join("\n  ")}\nThese mean a component is concatenating classes instead of merging them with cn().`,
  );
});

// A focus ring has two colours and BOTH have to theme. `ring-offset-white` was
// hardcoded in Button.tsx: in dark mode that painted a white halo around every
// focused control on a near-black page. It is invisible in a light-mode
// screenshot, which is why it survived — so it is asserted, not looked at.
test("focus rings theme — no hardcoded ring offset", () => {
  const offenders: string[] = [];
  for (const file of sourceFiles()) {
    stripComments(readFileSync(file, "utf8"))
      .split("\n")
      .forEach((line, i) => {
        if (BAN.ringOffset.test(line))
          offenders.push(`${rel(file)}:${i + 1}`);
      });
  }
  assert.deepEqual(
    offenders,
    [],
    `hardcoded focus-ring offset at:\n  ${offenders.join("\n  ")}\nUse the themed \`focus-visible:focus-ring\` utility (ring-accent over ring-offset-surface).`,
  );
});

// An element that paints itself as a control — a card, a pill, a bordered row —
// but carries no focus style is invisible to a keyboard while looking perfectly
// interactive to a mouse. There were eleven. Anything rendered through
// Button/ButtonLink is fine; the system supplies the ring.
test("every self-styled interactive element has a focus treatment", () => {
  const offenders: string[] = [];
  for (const file of sourceFiles()) {
    const src = readFileSync(file, "utf8");
    // A className assembled from a module-level constant says nothing about
    // focus until the constant is put back: `fields.tsx` reported as an
    // offender on `className={`${inputCls} flex …`}` while `inputCls` carries
    // `focus-visible:focus-ring` three lines up the file. Expanding one level
    // of `${NAME}` against this file's own string consts is what makes the
    // reading true. Same lesson as the tag bounds — the guard was right and
    // its INPUT was not the thing the rule is about.
    const consts = new Map<string, string>();
    for (const c of src.matchAll(/^const\s+([A-Za-z_$][\w$]*)\s*=\s*"([^"]*)";/gm)) {
      consts.set(c[1], c[2]);
    }
    const expand = (s: string) =>
      s.replace(/\$\{\s*([A-Za-z_$][\w$]*)\s*\}/g, (whole, id: string) =>
        consts.get(id) ?? whole,
      );
    // `jsxOpenTags`, never `[^>]` — see the helper's note. Bounding the tag
    // with the next `>` hid 78 of these 227 tags behind an arrow function.
    for (const tag of jsxOpenTags(src, ["a", "button", "Link"])) {
      const { name, index } = tag;
      const attrs = expand(tag.text);
      if (!/className/.test(attrs)) continue;
      // Only elements that paint themselves. A bare inline link inherits the
      // browser's own outline and is not the problem.
      if (!/rounded|border|bg-|shadow|px-|py-|p-\d|flex/.test(attrs)) continue;
      if (/focus-visible|focus-ring|focus:/.test(attrs)) continue;
      if (/sr-only/.test(attrs)) continue;
      offenders.push(
        `${rel(file)}:${src.slice(0, index).split("\n").length} <${name}>`,
      );
    }
  }
  assert.deepEqual(
    offenders,
    [],
    `interactive but unfocusable:\n  ${offenders.join("\n  ")}\nAdd \`focus-visible:focus-ring\`, or render it through <Button>/<ButtonLink>.`,
  );
});

test("the focus guard actually bites — through an arrow, and not through a const", () => {
  // This guard shipped for months reading `/<(a|button|Link)\s([^>]*?)>/`, and
  // had no bite test at all. Both halves below are failures it really had:
  //
  //   1. `onClick={() =>` contains a `>`, so the tag ended 60 characters in and
  //      `className` fell past the cut. Measured 2026-08-25: of 227 tags, 80
  //      truncated and 78 were then dropped by the `className` filter — 34% of
  //      the surface, silently unchecked. Five controls with no focus style
  //      were sitting in that blind spot.
  //   2. Once it could see them, `fields.tsx` reported a FALSE positive: its
  //      className is `${inputCls} …` and the constant carries the focus ring.
  //
  // A guard that cannot see the common shape and cries wolf on the correct one
  // is two bugs, not one. Both are asserted here against the shipped helpers.
  const painted = "rounded-full border px-4 py-2";

  const arrowNoFocus =
    `<button type="button" onClick={() => go(1)} className="${painted}">`;
  const [arrowTag] = jsxOpenTags(arrowNoFocus, ["a", "button", "Link"]);
  assert.ok(arrowTag, "an arrow handler must not end the tag");
  assert.ok(
    /className/.test(arrowTag.text),
    "className must survive the arrow — this is the 78-tag blind spot",
  );
  assert.ok(
    !/focus-visible|focus-ring|focus:/.test(arrowTag.text),
    "and the guard must see that this one has no focus treatment",
  );

  // The near-miss: same tag, focus ring present. It must NOT be reported.
  const arrowWithFocus =
    `<button type="button" onClick={() => go(1)} className="${painted} focus-visible:focus-ring">`;
  const [okTag] = jsxOpenTags(arrowWithFocus, ["a", "button", "Link"]);
  assert.ok(
    /focus-visible/.test(okTag.text),
    "a correct control must not be reported",
  );

  // And the const expansion, which is what stops the false positive. The
  // shapes here are `fields.tsx` exactly: a multi-line `const NAME = "…";`
  // and a className that interpolates it.
  const src =
    'const inputCls =\n  "h-12 rounded-xl border focus-visible:focus-ring";\n' +
    "export function F() {\n" +
    "  return <button type=\"button\" onClick={() => t()} className={`${inputCls} flex`}>x</button>;\n" +
    "}\n";
  const consts = new Map<string, string>();
  for (const c of src.matchAll(/^const\s+([A-Za-z_$][\w$]*)\s*=\s*"([^"]*)";/gm)) {
    consts.set(c[1], c[2]);
  }
  assert.equal(
    consts.get("inputCls"),
    "h-12 rounded-xl border focus-visible:focus-ring",
    "a const declared across two lines must still be read",
  );
  const [interpolated] = jsxOpenTags(src, ["a", "button", "Link"]);
  const expanded = interpolated.text.replace(
    /\$\{\s*([A-Za-z_$][\w$]*)\s*\}/g,
    (whole, id: string) => consts.get(id) ?? whole,
  );
  assert.ok(
    !/focus-visible/.test(interpolated.text),
    "unexpanded, the tag looks unfocusable — which is the false positive",
  );
  assert.ok(
    /focus-visible/.test(expanded),
    "expanded, it is correct and must not be reported",
  );
});

// ── A variant whose parent does not exist ────────────────────────────────────
// `group-hover:` / `group-open:` / `group-focus:` compile to
// `.group:hover .group-hover\:x`. Without a `group` on an ancestor the selector
// matches nothing — and NOTHING in this repository notices. The class is one
// Tailwind can generate, so `tailwindcss/no-custom-classname` is satisfied; the
// build is green; a reader sees the intent and not the selector. This is the
// same failure as the four modals that carried `animate-in fade-in zoom-in-95`
// from a plugin nobody installed and simply never animated for months, and as
// `text-[10px]` slipping past a floor guard whose capture captured nothing:
// **a rule can be spelled correctly and still be connected to nothing.**
//
// Found on 2026-08-27 in `StudentNav.tsx`, the only offender in the tree: the
// account menu's chevron was `group-open:rotate-180` on a `<details>` carrying
// `className="relative shrink-0"`. The arrow never turned, for the life of the
// component.
//
// SCOPE, stated because it is looser than it looks: this is a FILE-level check,
// not an element-level one. It cannot tell you the `group` is on the right
// ancestor, only that the file declares one somewhere. That is the level the
// real defect lived at, and an ancestor walk through JSX is a parser rather
// than a pattern. If a file ever declares `group` for one subtree and uses a
// `group-` variant in an unrelated one, this passes and it should not.
const GROUP_VARIANT = /\bgroup-(hover|open|focus|focus-within|active|disabled|checked|first|last)[:/]/;
/**
 * Does this source declare a `group` PARENT anywhere?
 *
 * Two things make the reading true rather than approximately true. It looks
 * only inside string literals, and only after comments are stripped — so a line
 * of prose about "a group of cards" cannot satisfy it, which would be the
 * fail-open. And the lookahead excludes `-` but allows `/`: `group-hover` is
 * the variant asking for a parent, while `group/card` is a NAMED group, which
 * is a real parent. Nothing in the tree uses a named group today; the day one
 * does, this must not report it.
 */
function declaresGroupParent(src: string): boolean {
  const strings = stripComments(src).matchAll(
    /"([^"\n]*)"|'([^'\n]*)'|`([^`]*)`/g,
  );
  return [...strings].some((m) =>
    /\bgroup\b(?![-\w:.])/.test(m[1] ?? m[2] ?? m[3] ?? ""),
  );
}

test("a group- variant always has a group parent to hang off", () => {
  const offenders: string[] = [];
  for (const file of sourceFiles()) {
    const src = readFileSync(file, "utf8");
    if (!GROUP_VARIANT.test(stripComments(src))) continue;
    if (declaresGroupParent(src)) continue;
    offenders.push(path.relative(process.cwd(), file).replace(/\\/g, "/"));
  }
  assert.deepEqual(
    offenders,
    [],
    `these files use a group- variant with no \`group\` anywhere, so the selector matches nothing:\n${offenders.join("\n")}`,
  );
});

test("that group- guard bites on the markup that shipped", () => {
  // The real pair, verbatim from StudentNav before the fix.
  const asShipped = `
    <details className="relative shrink-0">
      <summary className="inline-flex min-h-11 items-center gap-1.5">
        <svg className="transition-transform duration-200 group-open:rotate-180" />
      </summary>
    </details>`;
  assert.ok(GROUP_VARIANT.test(asShipped), "the fixture stopped using a group- variant");
  assert.ok(
    !declaresGroupParent(asShipped),
    "the guard must see that nothing here declares `group`",
  );

  // The fix, which must pass.
  assert.ok(declaresGroupParent(asShipped.replace('"relative shrink-0"', '"group relative shrink-0"')));

  // Near-misses, each one character or one context away from the real thing.
  assert.ok(
    !declaresGroupParent(`<div className="group-hover:opacity-100" />`),
    "`group-hover` is the VARIANT, not a declaration of the parent",
  );
  assert.ok(
    !declaresGroupParent(`<div className="grouped flex" />`),
    "`grouped` is a different word",
  );
  assert.ok(
    !declaresGroupParent(`// the cards are laid out in a group, three per row\nconst x = 1;`),
    "prose in a comment must not satisfy the guard — that is the fail-open",
  );
  assert.ok(
    declaresGroupParent(`<li className="group/card relative" />`),
    "a named group is a real parent — `group/card` must count, or this guard fires falsely the day someone uses one",
  );
});

// `eslint-disable-next-line` disables exactly the next LINE. Writing the reason
// as a `--` tail that wraps onto further comment lines therefore suppresses a
// comment and leaves the real line still warning — which is how PartnerBadge
// carried a documented, deliberate `<img>` waiver that never applied and warned
// on every single build. Put the prose above; keep the directive adjacent.
test("every eslint-disable-next-line is adjacent to the code it disables", () => {
  const offenders: string[] = [];
  for (const file of sourceFiles()) {
    const lines = readFileSync(file, "utf8").split("\n");
    lines.forEach((line, i) => {
      // Only a comment that BEGINS with the directive is one — ESLint ignores a
      // mention inside prose, and so must this, or documenting the rule trips it.
      if (!BAN.eslintDisable.test(line))
        return;
      const next = lines.slice(i + 1).find((l) => l.trim() !== "");
      if (next && /^(\/\/|\/\*|\{\s*\/\*)/.test(next.trim()))
        offenders.push(`${rel(file)}:${i + 1}`);
    });
  }
  assert.deepEqual(
    offenders,
    [],
    `eslint-disable-next-line followed by a comment, so it disables nothing:\n  ${offenders.join("\n  ")}`,
  );
});

// ── Who is actually named for a subject here (#9) ────────────────────────────
//
// The guide explained how a country's admissions, money and post-study rules
// behave and then never named a single institution, so a student who had decided
// on Germany still had nothing to search for. lib/data/place-universities.ts adds
// that layer WITHOUT adding a league table — see the rules at the top of that
// file. These tests are what keep the distinction real.

test("every destination we profile names at least three institutions", () => {
  for (const d of STUDY_DESTINATIONS) {
    const named = universitiesForPlace(d.id);
    assert.ok(
      named.length >= 3,
      `${d.id} names ${named.length} — fewer than three reads as a shortlist someone curated for a reason they will not state`,
    );
  }
});

test("the university registry has no key that is not a destination", () => {
  const ids = new Set(STUDY_DESTINATIONS.map((d) => d.id));
  for (const key of Object.keys(PLACE_UNIVERSITIES)) {
    assert.ok(
      ids.has(key),
      `place-universities has "${key}", which is not a destination`,
    );
  }
});

// `hub: null` is the honest value for a city we do not profile, and the UI must
// render those as plain text. A hub that IS set has to belong to this very
// destination, or a city page would list an institution from another country.
test("every named city is either a hub of that destination, or explicitly null", () => {
  const hubIds = new Set(HUBS.map((h) => h.id));
  for (const d of STUDY_DESTINATIONS) {
    const own = new Set(d.hubs);
    for (const u of universitiesForPlace(d.id)) {
      if (u.hub === null) continue;
      assert.ok(
        hubIds.has(u.hub),
        `${d.id}: ${u.name} points at unknown hub "${u.hub}"`,
      );
      assert.ok(
        own.has(u.hub),
        `${d.id}: ${u.name} sits in hub "${u.hub}", which belongs to a different destination`,
      );
    }
  }
});

test("every institution states what it is studied for, in the product's own taxonomy", () => {
  const valid = new Set(FACULTY_VALUES);
  for (const [place, list] of Object.entries(PLACE_UNIVERSITIES)) {
    for (const u of list) {
      assert.ok(u.name.trim().length > 0, `${place} has a nameless entry`);
      assert.ok(u.city.trim().length > 0, `${place}: ${u.name} names no city`);
      assert.ok(
        u.knownFor.length > 0,
        `${place}: ${u.name} says nothing about what it is for`,
      );
      for (const f of u.knownFor) {
        assert.ok(
          valid.has(f),
          `${place}: ${u.name} claims unknown field "${f}"`,
        );
      }
    }
  }
});

test("no institution is listed twice inside one destination", () => {
  for (const [place, list] of Object.entries(PLACE_UNIVERSITIES)) {
    const names = list.map((u) => u.name);
    assert.equal(
      new Set(names).size,
      names.length,
      `${place} lists the same institution more than once`,
    );
  }
});

// The whole point of the field: association, never position. A rank is stale
// within a year, differs between the tables that publish one, and answers a
// question a seventeen-year-old should not be asking first. Superlatives are
// banned alongside the numbers, because "the leading university for X" is a
// ranking with the number filed off.
test("the university layer quotes no ranking, price or superlative", () => {
  const forbidden =
    /(\$|EUR\b|USD\b|GBP\b|rank(ed|ing)?|top \d+|\bbest\b|\bleading\b|\belite\b|\bworld-class\b|\bprestigious\b|\bno\.? ?\d)/i;
  for (const [place, list] of Object.entries(PLACE_UNIVERSITIES)) {
    for (const u of list) {
      for (const text of [u.name, u.city]) {
        assert.ok(
          !forbidden.test(text),
          `${place}: "${text}" carries a ranking, a price or a superlative — this layer names, it does not rank`,
        );
      }
    }
  }
});

// A city page reads the same registry the country page does, so the two can
// never disagree. This pins the derivation rather than the data.
test("a hub's institutions are exactly the ones its destination puts there", () => {
  for (const d of STUDY_DESTINATIONS) {
    for (const hub of d.hubs) {
      const viaHub = universitiesForHub(hub)
        .map((u) => u.name)
        .sort();
      const viaPlace = universitiesForPlace(d.id)
        .filter((u) => u.hub === hub)
        .map((u) => u.name)
        .sort();
      assert.deepEqual(
        viaHub,
        viaPlace,
        `${d.id}/${hub}: city and country pages disagree`,
      );
    }
  }
});

// ── Pinning ──────────────────────────────────────────────────────────────────
// The one editorial override in an otherwise derived ordering, so it gets the
// two assertions that keep it from becoming a way to lie: it must actually win
// the sort, and it must not survive an eligibility check it would otherwise
// fail. Deliberately written as invariants over whatever is pinned TODAY rather
// than against a named entry — a pinned row is by nature short-lived, and a test
// naming one starts failing the day it expires.

test("a pinned opportunity sorts above everything else", () => {
  const plan = buildExtracurriculars({
    today: TODAY,
    faculties: [],
    factors: [],
    homeCountry: "KZ",
    graduationYear: 2028,
  });
  const flags = plan.items.map((i) => Boolean(i.pinned));
  const lastPinned = flags.lastIndexOf(true);
  const firstLoose = flags.indexOf(false);
  if (lastPinned === -1) return; // nothing pinned right now — the invariant holds vacuously
  assert.ok(
    firstLoose === -1 || lastPinned < firstLoose,
    `a pinned row sits below an unpinned one (last pinned ${lastPinned}, first unpinned ${firstLoose})`,
  );
});

test("pinning reorders, it never bypasses eligibility", () => {
  // A region-scoped pin must not reach a student in another country. This is the
  // failure that would matter: a card saying "you can enter this" to someone who
  // cannot is the one thing the product does not get to do, and "we pinned it"
  // is not an excuse the student can see.
  //
  // "Reach" is what needed re-deriving, and this test had the OLD answer. It
  // asserted plain absence from `items`, which was right when matching hid
  // off-region rows and wrong from the one-list release onward — the matcher
  // marks now, and the default filters narrow. It never fired either way,
  // because it iterates pinned local rows and there have been none; the day
  // somebody pinned a Kazakh olympiad, which is the likeliest pin this product
  // will ever have, it would have failed while the code was correct.
  //
  // So the guarantee is stated where it actually lives: the row is marked, and
  // it is gone from the list the student is shown.
  const local = COMPETITIONS.filter((c) => c.pinned && c.region);
  for (const c of local) {
    const elsewhere = buildExtracurriculars({
      today: TODAY,
      faculties: [],
      factors: [],
      homeCountry: c.region === "IT" ? "KZ" : "IT",
      graduationYear: 2028,
    });
    const row = elsewhere.items.find((i) => i.id === c.id);
    if (row) {
      assert.ok(
        row.offRegion,
        `${c.id} is region-scoped to ${c.region} and came back unmarked to a student outside it`,
      );
    }
    assert.ok(
      !matchedOnly(elsewhere.items).some((i) => i.id === c.id),
      `${c.id} is region-scoped to ${c.region} but reached a student outside it`,
    );
  }
});

test("at most one thing is pinned in the curated catalog", () => {
  // Not a style rule. A list where several rows outrank the student's own fit is
  // a list with no order at all, and the override stops meaning anything.
  const pinned = COMPETITIONS.filter((c) => c.pinned).map((c) => c.id);
  assert.ok(
    pinned.length <= 1,
    `${pinned.length} entries are pinned (${pinned.join(", ")}) — keep it to one`,
  );
});

// The region rule has three cases and the middle one is easy to collapse into
// the wrong neighbour — which is exactly what happened: "country unknown" was
// treated like "country does not match", so a local event was hidden from the
// only visitors who had not told us where they are. Pinned directly, because
// both the opportunities list and the timeline read it and they must not drift.
test("a local opportunity is hidden only from a country we KNOW is different", () => {
  const local = { region: "KZ" };
  const global_ = { region: null };

  assert.equal(
    reachableFrom(local, "KZ"),
    true,
    "its own country cannot see it",
  );
  assert.equal(
    reachableFrom(local, "UZ"),
    false,
    "leaked to a known, different country",
  );
  // Unknown must not exclude — the same rule as empty faculties meaning "show
  // everything" and an unknown grade never removing a row.
  assert.equal(
    reachableFrom(local, null),
    true,
    "hidden from an unknown country",
  );
  assert.equal(
    reachableFrom(local, undefined),
    true,
    "hidden from an unknown country",
  );
  assert.equal(
    reachableFrom(local, ""),
    true,
    "an empty string is not a country",
  );

  // A row with no region tag is global and reaches everyone, always.
  for (const c of ["KZ", "UZ", null, undefined]) {
    assert.equal(
      reachableFrom(global_, c),
      true,
      `a global row was hidden from ${c}`,
    );
  }
});

// ── The planner ───────────────────────────────────────────────────────────────
//
// Backlog #17. Two views over one list, and the rules that must hold whatever
// is on it. Every assertion here is a product rule from docs/PLANNER_PLAN.md,
// not a description of the implementation — in particular §7's "never place an
// unconfirmed date on the calendar", which is the failure this surface is the
// most able to commit and the one that costs a student's trust outright.

function plannerInput(over: Partial<PlannerInputs> = {}): PlannerInputs {
  return {
    todayISO: "2026-08-12",
    intents: [],
    committed: [],
    ownItems: [],
    satSittings: [],
    deadlines: [],
    phases: [],
    ...over,
  };
}

test("planner: the two status vocabularies round-trip, both ways", () => {
  for (const s of INTENT_STATUSES) {
    assert.equal(
      intentStatusFromPlanner(plannerStatusFromIntent(s)),
      s,
      `intent "${s}" did not survive the round trip`,
    );
  }
  const planner: PlannerStatus[] = ["todo", "doing", "done", "dropped"];
  for (const s of planner) {
    assert.equal(plannerStatusFromIntent(intentStatusFromPlanner(s)), s);
  }
  // "applied" must keep meaning exactly what it meant before `doing` existed —
  // every count on /admin/intents depends on it.
  assert.equal(plannerStatusFromIntent("applied"), "done");
  assert.equal(intentStatusFromPlanner("done"), "applied");
});

test("planner: an unconfirmed date is never given a position in time", () => {
  const view = buildPlanner(
    plannerInput({
      intents: [{ opportunityId: "x", status: "planning" }],
      committed: [
        {
          id: "x",
          name: "Guessy Olympiad",
          deadline: "2026-09-30",
          dateConfirmed: false,
        },
      ],
    }),
  );

  const item = view.items.find((i) => i.sourceId === "x");
  assert.ok(item, "the committed opportunity is missing entirely");
  // The rule lives in the TYPE, not in a view: there is simply no date to draw.
  assert.equal(item.dueISO, null, "an unconfirmed deadline leaked into dueISO");
  assert.equal(
    item.daysLeft,
    null,
    "an unconfirmed deadline produced a countdown",
  );
  assert.equal(
    view.months.length,
    0,
    "an unconfirmed date was placed in a month",
  );
  assert.deepEqual(
    view.undated.map((i) => i.sourceId),
    ["x"],
    "an unconfirmed row must still be listed, just never dated",
  );
});

test("planner: overdue is what is late and not finished", () => {
  const view = buildPlanner(
    plannerInput({
      intents: [
        { opportunityId: "late", status: "planning" },
        { opportunityId: "sent", status: "applied" },
      ],
      committed: [
        {
          id: "late",
          name: "Missed",
          deadline: "2026-08-01",
          dateConfirmed: true,
        },
        {
          id: "sent",
          name: "Submitted",
          deadline: "2026-08-01",
          dateConfirmed: true,
        },
      ],
    }),
  );

  assert.deepEqual(
    view.overdue.map((i) => i.sourceId),
    ["late"],
  );
  assert.equal(
    view.months.length,
    0,
    "a past date must not appear in the agenda's future months",
  );
});

test("planner: the agenda and the board hold different things", () => {
  const view = buildPlanner(
    plannerInput({
      ownItems: [
        {
          id: "a",
          title: "Write the essay",
          note: null,
          dueISO: null,
          status: "todo",
          href: null,
        },
      ],
      satSittings: [{ test: "2026-10-03", regDeadline: "2026-09-18" }],
    }),
  );

  // An own task with no date belongs on the board, and nowhere in the agenda.
  const board = [
    ...view.columns.todo,
    ...view.columns.doing,
    ...view.columns.done,
  ];
  assert.ok(
    board.some((i) => i.sourceId === "a"),
    "the own task is missing from the board",
  );
  assert.ok(
    !view.undated.some((i) => i.sourceId === "a"),
    "a dateless own task must not clutter the agenda's undated block",
  );

  // A SAT sitting is a fact about the world: dated, and not a card you move.
  const sat = view.items.find((i) => i.origin === "sat");
  assert.ok(sat, "the SAT sitting is missing");
  assert.equal(
    sat.dueISO,
    "2026-09-18",
    "the SAT row must anchor to the REGISTRATION cutoff",
  );
  assert.equal(isMovable(sat), false);
  assert.ok(
    !board.some((i) => i.origin === "sat"),
    "a SAT sitting reached the board, where it would render a card nobody can move",
  );
});

test("planner: dropped is archived, not a column", () => {
  const view = buildPlanner(
    plannerInput({
      intents: [{ opportunityId: "x", status: "dropped" }],
      committed: [
        {
          id: "x",
          name: "Changed my mind",
          deadline: "2026-12-01",
          dateConfirmed: true,
        },
      ],
    }),
  );

  for (const col of PLANNER_COLUMNS) {
    assert.equal(
      view.columns[col].length,
      0,
      `a dropped row appeared in "${col}"`,
    );
  }
  assert.equal(view.droppedCount, 1);
});

test("planner: one opportunity can never appear twice", () => {
  const view = buildPlanner(
    plannerInput({
      intents: [
        { opportunityId: "x", status: "planning" },
        { opportunityId: "x", status: "applied" },
      ],
      committed: [
        {
          id: "x",
          name: "Only once",
          deadline: "2026-12-01",
          dateConfirmed: true,
        },
      ],
    }),
  );

  const keys = view.items.map((i) => i.key);
  assert.equal(
    new Set(keys).size,
    keys.length,
    "the planner produced a duplicate key",
  );
});

test("planner: an empty planner is empty, not broken", () => {
  const view = buildPlanner(plannerInput());
  assert.deepEqual(view.items, []);
  assert.deepEqual(view.months, []);
  assert.deepEqual(view.overdue, []);
  assert.deepEqual(view.undated, []);
  assert.equal(view.droppedCount, 0);
  for (const col of PLANNER_COLUMNS) assert.deepEqual(view.columns[col], []);
});

test("planner: same inputs, same view — twice", () => {
  const input = plannerInput({
    intents: [{ opportunityId: "x", status: "planning" }],
    committed: [
      { id: "x", name: "Stable", deadline: "2026-12-01", dateConfirmed: true },
    ],
    satSittings: [{ test: "2026-10-03", regDeadline: "2026-09-18" }],
  });
  assert.deepEqual(buildPlanner(input), buildPlanner(input));
});

test("planner: a phase is a separator, never something you can move", () => {
  const view = buildPlanner(
    plannerInput({
      intents: [{ opportunityId: "x", status: "planning" }],
      committed: [
        {
          id: "x",
          name: "In September",
          deadline: "2026-09-20",
          dateConfirmed: true,
        },
      ],
      phases: [
        {
          id: "focus",
          name: "Focusing",
          rangeLabel: "Sep-Nov 2026",
          startISO: "2026-09-01",
        },
        {
          id: "gone",
          name: "Long past",
          rangeLabel: "2019",
          startISO: "2019-01-01",
        },
      ],
    }),
  );

  const september = view.months.find((m) => m.key === "2026-09");
  assert.ok(september, "the September bucket is missing");
  assert.deepEqual(
    september.phases.map((p) => p.id),
    ["focus"],
  );
  assert.ok(
    !view.items.some((i) => i.sourceId === "focus"),
    "a phase became an item — it has no date and no state, so it cannot be one",
  );
  // A phase with no month to sit in is dropped rather than drawn as a separator
  // over nothing.
  assert.ok(!view.months.some((m) => m.phases.some((p) => p.id === "gone")));
});

test("planner: the move track has two ends, and dropped is off it", () => {
  assert.equal(stepStatus("todo", -1), null);
  assert.equal(stepStatus("todo", 1), "doing");
  assert.equal(stepStatus("doing", -1), "todo");
  assert.equal(stepStatus("doing", 1), "done");
  assert.equal(stepStatus("done", 1), null);
  assert.equal(stepStatus("dropped", 1), null);
  assert.equal(stepStatus("dropped", -1), null);
});

test("planner: day arithmetic is date-only and direction-aware", () => {
  assert.equal(daysBetweenISO("2026-08-12", "2026-08-12"), 0);
  assert.equal(daysBetweenISO("2026-08-12", "2026-08-13"), 1);
  assert.equal(daysBetweenISO("2026-08-13", "2026-08-12"), -1);
  // Across a northern-hemisphere DST boundary — UTC arithmetic, so exactly 31.
  assert.equal(daysBetweenISO("2026-10-15", "2026-11-15"), 31);
});

// A server action is a public HTTP endpoint and the form in front of it is a
// convenience. None of what follows can fail a type-check or a lint — the code
// would be perfectly valid without it — so it is asserted from source, the same
// way the button system's four invariants are.
test("planner actions validate on the server, not only in the form", () => {
  const src = readFileSync(
    path.join(process.cwd(), "app/planner/actions.ts"),
    "utf8",
  );

  for (const bound of ["plannerTitle", "plannerNote", "plannerItems"]) {
    assert.ok(
      src.includes(`LIMITS.${bound}`),
      `the action never reads LIMITS.${bound}`,
    );
  }

  // link_href is an IN-APP path. An external URL here would route around
  // `npm run test:links`, which is what keeps our links alive and which only
  // knows about the catalog.
  assert.ok(
    src.includes('startsWith("/")'),
    "the action does not constrain link_href to an in-app path",
  );
  assert.ok(
    src.includes('startsWith("//")'),
    "a protocol-relative //host leaves the site while looking like a path",
  );

  // The 0028 degradation path: a database without the migration must produce a
  // readable error naming it, not a 500. Same pattern migration 0027 set.
  assert.ok(src.includes("0028"), "no error path names the migration");
});

test("the planner is private, and its steps are a registry", () => {
  // The section is behind a login, so it must not be advertised. The sitemap
  // and robots are checked against each other elsewhere; this is the other
  // half — that we never asked for it to be indexed in the first place.
  const paths = sitemapRoutes().map((e) => new URL(e.url).pathname);
  assert.ok(
    !paths.some((p) => p === "/planner" || p.startsWith("/planner/")),
    "the sitemap advertises a page that requires an account",
  );

  // Same registry rule as the guide's four steps: the tabs, the headings and
  // any step added later read ONE array, so adding mind maps is one edit and
  // not four that drift.
  assert.ok(
    PLANNER_SECTIONS.length >= 2,
    "the planner has fewer than two steps",
  );
  const ids = PLANNER_SECTIONS.map((s) => s.id);
  assert.equal(new Set(ids).size, ids.length, "two planner steps share an id");

  // They are VIEWS of one route now, not routes of their own — which is what
  // "one window" actually means and what makes switching cost no round trip.
  // A section whose href went back to `/planner/<something>` would be three
  // destinations again with the same paint.
  const views = PLANNER_SECTIONS.map((s) => s.view);
  assert.equal(new Set(views).size, views.length, "two lenses share a ?view=");
  for (const s of PLANNER_SECTIONS) {
    assert.equal(
      s.href,
      `/planner?view=${s.view}`,
      `${s.id} is not a view of the one planner route`,
    );
    assert.ok(s.label.trim().length > 0, `${s.id} has no tab label`);
    assert.ok(s.title.trim().length > 0, `${s.id} has no heading`);
    assert.ok(
      s.blurb.trim().length > 0,
      `${s.id} does not say what it answers`,
    );
  }
});

// ── Mind maps (planner release 2) ─────────────────────────────────────────────
//
// The one decision everything here follows from: we store the STRUCTURE, never
// the coordinates. So the picture is a pure function of the tree, and every
// property a canvas would have needed a human to eyeball is asserted instead.
//
// Three of these guard against states the DATABASE can technically hold and a
// renderer cannot survive: a parent pointing outside the map, a cycle, and depth
// past the cap. None should ever happen. All three would hang or crash the page.

function node(over: Partial<MapNodeRow> & { id: string }): MapNodeRow {
  return {
    mapId: "m1",
    parentId: null,
    label: over.id,
    note: null,
    linkHref: null,
    position: 0,
    ...over,
  };
}

test("mind map: flat rows become a tree, children in position order", () => {
  const tree = buildTree(
    [
      node({ id: "root", label: "Where could I study?" }),
      node({ id: "b", parentId: "root", label: "Korea", position: 1 }),
      node({ id: "a", parentId: "root", label: "Germany", position: 0 }),
      node({
        id: "a1",
        parentId: "a",
        label: "Learn German to B1",
        position: 0,
      }),
    ],
    "root",
  );

  assert.ok(tree, "no tree was built");
  assert.equal(tree.label, "Where could I study?");
  assert.deepEqual(
    tree.children.map((c) => c.label),
    ["Germany", "Korea"],
    "children must follow `position`, not insertion order",
  );
  assert.deepEqual(
    tree.children[0].children.map((c) => c.id),
    ["a1"],
  );
  assert.equal(tree.depth, 0);
  assert.equal(tree.children[0].depth, 1);
  assert.equal(tree.children[0].children[0].depth, 2);
});

test("mind map: a row from another map is never pulled in", () => {
  const tree = buildTree(
    [
      node({ id: "root" }),
      node({ id: "mine", parentId: "root" }),
      // Same shape, different map. The query is already scoped by map_id; the
      // builder does not assume the query was written correctly.
      node({ id: "theirs", parentId: "root", mapId: "m2" }),
    ],
    "root",
  );

  assert.deepEqual(
    tree!.children.map((c) => c.id),
    ["mine"],
  );
});

test("mind map: a cycle terminates instead of recursing forever", () => {
  // a → b → a. Reachable only through corruption, and fatal if walked naively.
  const tree = buildTree(
    [
      node({ id: "root" }),
      node({ id: "a", parentId: "b" }),
      node({ id: "b", parentId: "a" }),
    ],
    "root",
  );

  assert.ok(tree, "a cycle elsewhere in the table killed the whole map");
  assert.deepEqual(tree.children, [], "a cycle was walked into the tree");
});

test("mind map: depth past the cap is truncated, not rendered", () => {
  const rows: MapNodeRow[] = [node({ id: "n0" })];
  for (let i = 1; i <= MINDMAP_MAX_DEPTH + 3; i++) {
    rows.push(node({ id: `n${i}`, parentId: `n${i - 1}` }));
  }

  const tree = buildTree(rows, "n0")!;
  let deepest = 0;
  const walk = (n: MapNode) => {
    deepest = Math.max(deepest, n.depth);
    n.children.forEach(walk);
  };
  walk(tree);

  assert.equal(
    deepest,
    MINDMAP_MAX_DEPTH,
    `the tree went ${deepest} deep against a cap of ${MINDMAP_MAX_DEPTH}`,
  );
});

test("mind map: the layout is deterministic", () => {
  const tree = buildTree(
    [
      node({ id: "root" }),
      node({ id: "a", parentId: "root", position: 0 }),
      node({ id: "b", parentId: "root", position: 1 }),
    ],
    "root",
  )!;

  assert.deepEqual(layoutTree(tree), layoutTree(tree));
});

test("mind map: a parent sits at the midpoint of its children", () => {
  const tree = buildTree(
    [
      node({ id: "root" }),
      node({ id: "a", parentId: "root", position: 0 }),
      node({ id: "b", parentId: "root", position: 1 }),
      node({ id: "c", parentId: "root", position: 2 }),
    ],
    "root",
  )!;

  const { nodes } = layoutTree(tree);
  const at = (id: string) => nodes.find((n) => n.id === id)!;

  assert.equal(
    at("root").y,
    (at("a").y + at("c").y) / 2,
    "the root is not centred between its first and last child",
  );
  // Depth drives x, and only depth.
  assert.ok(
    at("a").x > at("root").x,
    "a child is not to the right of its parent",
  );
  assert.equal(at("a").x, at("b").x, "siblings are at different depths");
});

test("mind map: every leaf gets its own row, and nothing overlaps", () => {
  const tree = buildTree(
    [
      node({ id: "root" }),
      node({ id: "a", parentId: "root", position: 0 }),
      node({ id: "a1", parentId: "a", position: 0 }),
      node({ id: "a2", parentId: "a", position: 1 }),
      node({ id: "b", parentId: "root", position: 1 }),
    ],
    "root",
  )!;

  const { nodes, edges, width, height } = layoutTree(tree);

  const leaves = ["a1", "a2", "b"];
  const ys = leaves.map((id) => nodes.find((n) => n.id === id)!.y);
  assert.equal(new Set(ys).size, leaves.length, "two leaves share a row");

  // One edge per node except the root — a tree, not a graph.
  assert.equal(edges.length, nodes.length - 1);
  assert.ok(width > 0 && height > 0, "the canvas has no size");
  for (const n of nodes) {
    assert.ok(n.x >= 0 && n.y >= 0, `${n.id} is off the canvas`);
  }
});

test("mind map: a root on its own lays out without throwing", () => {
  const tree = buildTree(
    [node({ id: "root", label: "Where could I study?" })],
    "root",
  )!;
  const { nodes, edges, width, height } = layoutTree(tree);

  assert.equal(nodes.length, 1);
  assert.deepEqual(edges, []);
  assert.ok(width > 0 && height > 0, "an only-child map collapsed to nothing");
});

test("mind map: the move predicates agree with what the actions permit", () => {
  const tree = buildTree(
    [
      node({ id: "root" }),
      node({ id: "a", parentId: "root", position: 0 }),
      node({ id: "b", parentId: "root", position: 1 }),
      node({ id: "b1", parentId: "b", position: 0 }),
    ],
    "root",
  )!;

  // The root is not a card: it cannot move, indent, outdent or be deleted.
  assert.equal(canMoveUp(tree, "root"), false);
  assert.equal(canMoveDown(tree, "root"), false);
  assert.equal(canIndent(tree, "root"), false);
  assert.equal(canOutdent(tree, "root"), false);

  // Indent means "become the child of the sibling above you" — so the first
  // sibling cannot, and the second can.
  assert.equal(
    canIndent(tree, "a"),
    false,
    "the first child has nothing to indent under",
  );
  assert.equal(canIndent(tree, "b"), true);

  // Outdent means "become a sibling of your parent" — impossible at depth 1,
  // because the parent is the root and the root has no siblings.
  assert.equal(canOutdent(tree, "a"), false);
  assert.equal(canOutdent(tree, "b1"), true);

  assert.equal(canMoveUp(tree, "a"), false, "the first sibling cannot move up");
  assert.equal(canMoveDown(tree, "a"), true);
  assert.equal(canMoveUp(tree, "b"), true);
  assert.equal(
    canMoveDown(tree, "b"),
    false,
    "the last sibling cannot move down",
  );

  // An id that is not in this map answers false rather than throwing.
  assert.equal(canMoveUp(tree, "nope"), false);
  assert.equal(canIndent(tree, "nope"), false);
});

test("map actions validate on the server, and never delete the thinking", () => {
  const src = readFileSync(
    path.join(process.cwd(), "app/planner/maps/actions.ts"),
    "utf8",
  );

  for (const bound of ["mapLabel", "mapNodes", "maps"]) {
    assert.ok(
      src.includes(`LIMITS.${bound}`),
      `the action never reads LIMITS.${bound}`,
    );
  }
  assert.ok(
    src.includes("MINDMAP_MAX_DEPTH"),
    "nothing stops a node being nested past the depth the layout can draw",
  );

  // Same in-app-path rule as the tasks: the catalog owns external links because
  // `npm run test:links` is what keeps them alive.
  assert.ok(
    src.includes('startsWith("/")'),
    "link_href is not constrained to an in-app path",
  );
  assert.ok(
    src.includes('startsWith("//")'),
    "a protocol-relative //host would leave the site",
  );

  // A database without 0029 must name the migration rather than 500.
  assert.ok(src.includes("0029"), "no error path names the migration");

  // "Send to plan" copies the node into planner_items. It must NOT remove it:
  // deleting the thinking at the moment you act on it is exactly backwards.
  // Assert the INDEX, not the slice's length. Written as
  // `src.slice(src.indexOf(…))` with one argument, a renamed function makes
  // `indexOf` return −1, `slice(-1)` returns the file's LAST CHARACTER, and
  // `length > 0` passes — after which the delete check scans one character and
  // finds nothing. The guard would have gone green on a `promoteNodeToTask`
  // that deleted the node, which is the exact thing it exists to forbid. Its
  // two siblings in this file pass a second argument and fail closed on the
  // same input; this one was the outlier.
  const at = src.indexOf("export async function promoteNodeToTask");
  assert.notEqual(
    at,
    -1,
    "promoteNodeToTask is missing or renamed — this guard now reads nothing",
  );
  const promote = src.slice(at);
  assert.ok(
    !/\.delete\(\)/.test(promote),
    "sending a node to the plan deletes it — the map must keep the node",
  );
});

// ─────────────────────────────────────────────────────────────────────────────
// The hero field (#24) — the light behind the landing page's first screen.
//
// A background that is always on, always animating and sitting under the one
// paragraph that carries the product's promise has exactly two ways to be
// wrong, and neither is visible in a screenshot: it can cost frames, and it can
// drag the text on it under AA. Both are arithmetic, so both are asserted here
// rather than eyeballed — the same reason the palette's contrast is.

/** The block of app/globals.css that owns the field. */
function fieldCss() {
  const css = readFileSync(path.join(process.cwd(), "app/globals.css"), "utf8");
  const start = css.indexOf("/* ── THE HERO FIELD");
  assert.ok(start >= 0, "globals.css no longer has a hero-field block");
  const end = css.indexOf("/* Honor reduced-motion */", start);
  assert.ok(end > start, "the hero-field block is not where it was");
  return css.slice(start, end);
}

/** Read one theme's scalar (non-triplet) custom properties. */
function readAlphas(css: string, selector: string) {
  const start = css.indexOf(selector);
  assert.ok(start >= 0, `globals.css has no ${selector} block`);
  const body = css.slice(start, css.indexOf("\n}", start));
  const out: Record<string, number> = {};
  for (const m of body.matchAll(/--([a-z-]+-alpha):\s*([\d.]+)\s*;/g)) {
    out[m[1]] = Number(m[2]);
  }
  return out;
}

/** src composited over dst at alpha `a`. */
const composite = (
  src: [number, number, number],
  dst: [number, number, number],
  a: number,
): [number, number, number] => [
  dst[0] + (src[0] - dst[0]) * a,
  dst[1] + (src[1] - dst[1]) * a,
  dst[2] + (src[2] - dst[2]) * a,
];

test("the hero field cannot drag the text on it under AA, in either theme", () => {
  const css = readFileSync(path.join(process.cwd(), "app/globals.css"), "utf8");
  const themes = {
    light: { c: readTheme(css, ":root {"), a: readAlphas(css, ":root {") },
    dark: {
      c: readTheme(css, ':root[data-theme="dark"] {'),
      a: readAlphas(css, ':root[data-theme="dark"] {'),
    },
  };

  for (const [name, T] of Object.entries(themes)) {
    for (const k of [
      "field-line-alpha",
      "field-glow-alpha",
      "field-beam-alpha",
      "field-spark-alpha",
    ]) {
      assert.ok(T.a[k] !== undefined, `${name}: --${k} is not defined`);
    }

    // The worst composite the field can produce anywhere: the beam's wash and
    // its sweep overlapping (both are the accent at the same alpha), with the
    // strongest blob centred on top. Every hue has to survive it, because which
    // one lands on a given phrase is a matter of where a div was put.
    let beam = composite(T.c.accent, T.c.surface, T.a["field-beam-alpha"]);
    beam = composite(T.c.accent, beam, T.a["field-beam-alpha"]);

    for (const hue of ["accent", "ivy", "target"]) {
      const lit = composite(T.c[hue], beam, T.a["field-glow-alpha"]);

      // NORMAL text on the field. `ink-soft` is what the hero's promise
      // paragraph uses; it was `text-ink/60`, which is 4.53:1 on the BARE light
      // page — a pass by three hundredths — and 3.71:1 with the field lit under
      // it. If a fainter token is ever wanted here, this is the number saying no.
      for (const fg of ["ink", "ink-soft"]) {
        const r = contrast(T.c[fg], lit);
        assert.ok(
          r >= 4.5,
          `${name}: ${fg} over the field's ${hue} blob is ${r.toFixed(2)}:1, under AA`,
        );
      }

      // LARGE text — the h1 and the rotating phrase, 45-60px, which owe 3:1.
      const r = contrast(T.c["hero-ink"], lit);
      assert.ok(
        r >= 3,
        `${name}: the rotating phrase over the ${hue} blob is ${r.toFixed(2)}:1, under the 3:1 large-text bar`,
      );
    }

    // The lattice must be VISIBLE and must not read as a rule. Both themes were
    // first drawn at ~1.10:1 — a hairline you had to already know was there,
    // the same failure --line was raised for — and the product's real dividers
    // carry 1.3, which a decoration must stay under.
    const line = composite(
      T.c["field-line"],
      T.c.surface,
      T.a["field-line-alpha"],
    );
    const lr = contrast(line, T.c.surface);
    assert.ok(
      lr >= 1.15 && lr <= 1.3,
      `${name}: the lattice is ${lr.toFixed(3)}:1 against the page — outside 1.15-1.3`,
    );
  }
});

test("every field token exists in all three theme blocks", () => {
  const css = readFileSync(path.join(process.cwd(), "app/globals.css"), "utf8");
  // The media query and the attribute selector are two copies on purpose — one
  // is today's mechanism, the other is what a future toggle would use. A token
  // added to only one of them themes correctly for half our readers.
  const blocks = [
    ":root {",
    ':root:not([data-theme="light"]) {',
    ':root[data-theme="dark"] {',
  ];
  const names = blocks.map((sel) => {
    const start = css.indexOf(sel);
    assert.ok(start >= 0, `globals.css has no ${sel} block`);
    const body = css.slice(start, css.indexOf("color-scheme", start));
    return new Set([...body.matchAll(/--(field-[a-z-]+):/g)].map((m) => m[1]));
  });
  assert.ok(names[0].size >= 5, "the field lost its tokens");
  for (const n of names[0]) {
    for (let i = 1; i < blocks.length; i++) {
      assert.ok(names[i].has(n), `--${n} is missing from ${blocks[i]}`);
    }
  }
});

test("the hero field animates transform and opacity only", () => {
  // Through `stripComments` — the same helper the `!important` audit uses.
  // Both assertions below first failed on their own footnote: the CSS comment
  // naming `filter: blur` as the thing being avoided, and HeroField's comment
  // naming framer-motion for the same reason. An assertion about what the code
  // does has to read the code.
  const block = stripComments(fieldCss());

  // A `filter` here is the specific mistake this design exists to avoid: it
  // cannot be composited, so an always-on background would re-paint every frame
  // for as long as the tab is open. The softness is in the paint.
  assert.ok(
    !/\bfilter\s*:/.test(block),
    "the hero field declares a filter — the blur must live in the gradient's falloff",
  );

  // `transparent` is rgba(0, 0, 0, 0), so a gradient running to it interpolates
  // through BLACK and leaves a grey bruise round every blob.
  assert.ok(
    !/:[^;]*\btransparent\b/.test(block),
    "a field gradient stops at `transparent`; use rgb(var(--x) / 0) or the stop drags through black",
  );

  for (const m of block.matchAll(/@keyframes\s+(field-[\w-]+)\s*\{/g)) {
    const name = m[1];
    const body = block.slice(m.index as number, block.indexOf("\n}", m.index));
    const props = [...body.matchAll(/^\s{4}([a-z-]+):/gm)].map((p) => p[1]);
    assert.ok(props.length > 0, `@keyframes ${name} declares nothing`);
    for (const p of props) {
      assert.ok(
        p === "transform" || p === "opacity",
        `@keyframes ${name} animates ${p} — only transform and opacity are composited`,
      );
    }
  }
});

test("every looping field keyframe is closed, because reduced motion lands on the END state", () => {
  const block = stripComments(fieldCss());

  // The global guard forces `animation-iteration-count: 1` alongside a ~0
  // duration, so an infinite loop does not pause where it started — it jumps to
  // 100%. A loop whose 100% differs from its 0% therefore freezes a
  // reduced-motion reader mid-stride, which is the one thing the guard exists
  // to prevent.
  const frames = new Map<string, string>();
  for (const m of block.matchAll(/@keyframes\s+(field-[\w-]+)\s*\{/g)) {
    frames.set(
      m[1],
      block.slice(m.index as number, block.indexOf("\n}", m.index)),
    );
  }
  assert.ok(frames.size >= 5, "the field lost its keyframes");

  let checked = 0;
  for (const [name, body] of frames) {
    if (!new RegExp(`animation:[^;]*\\b${name}\\b[^;]*infinite`).test(block)) {
      continue;
    }
    checked++;

    if (name === "field-spark-run") {
      // The deliberate exception, and it is the RIGHT answer rather than an
      // oversight: a spark's 100% is `opacity: 0`, so reduced motion removes
      // the runners instead of freezing three dots in mid-flight.
      assert.match(
        body.slice(body.indexOf("100%")),
        /opacity:\s*0/,
        "field-spark-run must end at opacity 0 so reduced motion removes it",
      );
      continue;
    }

    if (name === "field-grid-drift") {
      // This one closes by GEOMETRY rather than by repeating itself: it travels
      // exactly one cell on both axes, so its end state is pixel-identical to
      // its start and the seam does not exist. Change the distance and it does.
      assert.match(
        body,
        /translate3d\(\s*calc\(var\(--field-cell\) \* -1\),\s*calc\(var\(--field-cell\) \* -1\),\s*0\s*\)/,
        "the lattice must drift exactly one cell on both axes or the loop shows a seam",
      );
      continue;
    }

    assert.match(
      body,
      /0%,\s*100%\s*\{/,
      `@keyframes ${name} does not share its 0% and 100% stop, so it does not return to where it started`,
    );
  }
  assert.ok(
    checked >= 5,
    "the field's looping animations are no longer looping",
  );
});

test("the landing hero's background costs no JavaScript and no blur", () => {
  const field = stripComments(
    readFileSync(
      path.join(process.cwd(), "components/marketing/HeroField.tsx"),
      "utf8",
    ),
  );
  assert.ok(
    !field.includes('"use client"'),
    "HeroField became a client component — the landing page's JS budget is the point",
  );
  assert.ok(
    !BAN.framerMotion.test(field),
    "HeroField imports framer-motion; this page ships none and must not start",
  );
  // The field is the section's FIRST child and carries no z-index: a `-z-10`
  // puts a child behind its parent's own background when the parent is
  // `position: relative` with `z-index: auto`, which is exactly this section,
  // and the field would paint invisibly under `bg-surface`.
  assert.ok(
    !/-z-10/.test(field),
    "the field uses a negative z-index — it would paint behind bg-surface",
  );

  const page = readFileSync(
    path.join(process.cwd(), "app/(marketing)/page.tsx"),
    "utf8",
  );
  const hero = page.slice(
    page.indexOf("<HeroField />"),
    page.indexOf("What the list is made of"),
  );
  assert.ok(hero.length > 0, "the hero no longer mounts the field");
  assert.ok(
    !BAN.animatedBlur.test(hero),
    "a blur-* is back in the hero — that is a full re-raster of the box on every paint",
  );
});

test("the landing page's bands ramp with the window, and no band caps at 1152", () => {
  // Nine sections each set `max-w-6xl` on their own, which put 1152px of
  // content inside a 1920px window — 768px of gutter, measured, i.e. 40% of the
  // display — while the hero above them ran to 1600. `Band` carries Shell's
  // ramp instead. A container that stops at 1152 is the thing this asserts
  // against, and the footer is allowed to spell it out inline because it is a
  // landmark rather than a `div`.
  const band = readFileSync(
    path.join(process.cwd(), "components/marketing/Band.tsx"),
    "utf8",
  );
  for (const step of ["max-w-6xl", "xl:max-w-7xl", "2xl:max-w-[90rem]"]) {
    assert.ok(band.includes(step), `Band lost its ${step} step`);
  }

  for (const rel of [
    "app/(marketing)/page.tsx",
    "components/marketing/HowItWorks.tsx",
  ]) {
    const src = readFileSync(path.join(process.cwd(), rel), "utf8");
    for (const m of src.matchAll(BAN.ungrampedBand)) {
      assert.ok(
        m[1].includes("2xl:max-w-[90rem]"),
        `${rel}: a container caps at max-w-6xl without ramping — "${m[1]}"`,
      );
    }
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// Readability, measured rather than looked at (2026-08-14).
//
// The report was "text on our site is hard to read", next to a competitor's
// light-theme screenshot. Contrast turned out to be fine everywhere — the
// defects were a type scale with no steps in it, a 10px floor, and one theme's
// optical needs being served by the other theme's settings.

// The floor is a number in one place, so that raising it is one edit and the
// tests below cannot disagree with each other about what it is.
const TYPE_FLOOR_PX = 12;

// Every hardcoded size in the tree, in px, with its file and line. `rem` is
// resolved at the root's 16px: `text-[0.7rem]` is 11.2px, and a px-only guard
// would wave it through.
function hardcodedTypeSizes(): { at: string; px: number }[] {
  const walk = (dir: string): string[] =>
    readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
      const full = path.join(dir, e.name);
      if (e.isDirectory()) return walk(full);
      return /\.tsx?$/.test(e.name) ? [full] : [];
    });
  const out: { at: string; px: number }[] = [];
  for (const root of ["app", "components"]) {
    for (const file of walk(path.join(process.cwd(), root))) {
      readFileSync(file, "utf8")
        .split("\n")
        .forEach((line, i) => {
          // matchAll, not match: a ternary can carry three sizes on one
          // line, and reading only the first is how a 9px monogram sat behind
          // an 11px one for a whole release. Found when prettier happened to
          // split the line.
          for (const m of line.matchAll(BAN.hardcodedType)) {
            out.push({
              at: `${path.relative(process.cwd(), file)}:${i + 1}`,
              px: m[2] === "rem" ? Number(m[1]) * 16 : Number(m[1]),
            });
          }
          // The same rule arriving as a number on a prop. Kept as a second
          // pass over the same line rather than one combined pattern, because
          // the two have different capture shapes and a merged regex is where
          // a group index quietly shifts and the size becomes NaN — which is
          // how this guard failed open the first time.
          for (const m of line.matchAll(BAN.hardcodedFontSizeProp)) {
            out.push({
              at: `${path.relative(process.cwd(), file)}:${i + 1}`,
              px: Number(m[1]),
            });
          }
        });
    }
  }
  return out;
}

test(`${TYPE_FLOOR_PX}px is the floor — no surface ships smaller type`, () => {
  // 10px uppercase with letter-spacing was the smallest type in the product and
  // it carried real information across 21 files: the report's programme cards,
  // four country breakdowns, the admin tables, the guide's badges and the
  // landing's own hero preview. A floor that holds in some components is not a
  // floor, so it is asserted over the whole tree.
  //
  // The floor rose from 11 to 12 on 2026-08-19 with the scale, because 118
  // labels were pinned at exactly 11px by the pass that fixed the 10px bug: "at
  // the floor" is not "readable", it is "not illegal". Raise this literal in
  // the wave that earns it, the same way the discovery count floors work.
  const offenders = hardcodedTypeSizes()
    .filter((s) => s.px < TYPE_FLOOR_PX)
    .map((s) => `${s.at} (${s.px}px)`);
  assert.deepEqual(
    offenders,
    [],
    `type below ${TYPE_FLOOR_PX}px:\n${offenders.join("\n")}`,
  );
});

test("the type floor guard actually bites", () => {
  // The version this replaced could never have failed. It was written as
  // `/text-[(d+(?:.d+)?)px]/` — the backslashes had been eaten, so `[...]` was
  // a character CLASS, nothing was captured, `Number(undefined)` was NaN, and
  // `NaN < 11` is false. It matched a real class name and reported nothing, for
  // every release it existed. Same failure as the bundle guard written as a
  // template literal, where `\s` became the letter s: a guard that fails OPEN
  // still looks like a guarantee in a PR description.
  //
  // So the pattern is asserted against lines it MUST catch, and lines it must
  // not, rather than only against the tree, which is clean by construction.
  //
  // It reads `BAN.hardcodedType` rather than a copy of it, and that is
  // load-bearing: a bite test written against its own copy of a regex proves
  // that the copy works, which is exactly nothing once the two drift apart.
  const re = BAN.hardcodedType;
  const sizeOf = (line: string) =>
    [...line.matchAll(re)].map((m) =>
      m[2] === "rem" ? Number(m[1]) * 16 : Number(m[1]),
    );

  assert.deepEqual(sizeOf('<span className="text-[10px] uppercase">'), [10]);
  assert.deepEqual(sizeOf('className="text-[0.7rem]"'), [11.2]);
  assert.deepEqual(
    sizeOf('{a ? "text-[9px]" : b ? "text-[12px]" : "text-[13px]"}'),
    [9, 12, 13],
    "a ternary carrying three sizes must yield all three",
  );
  assert.deepEqual(sizeOf('className="text-sm text-ink-soft"'), []);
  assert.ok(
    sizeOf('<span className="text-[10px]">').some((n) => n < TYPE_FLOOR_PX),
    "the guard must reject 10px",
  );
  assert.ok(
    !sizeOf('<span className="text-[12px]">').some((n) => n < TYPE_FLOOR_PX),
    "the guard must accept the floor itself",
  );
});

test("the accent fill is not used as a foreground on text", () => {
  // The sibling test above covers reach/target/likely and stops there, which is
  // how 25 call sites came to paint TEXT with `text-accent` — 4.28:1 on the
  // page background, i.e. the exact failure that test exists to name. `accent`
  // is the only other fill with the problem: `ivy` measures 4.95 and 6.41.
  //
  // Icons keep the fill, because a graphic owes 3:1 and this token clears it.
  // They are told apart by what else is on the line: an icon carries its own
  // box, is an <svg>, or is a form control's tick.
  const walk = (dir: string): string[] =>
    readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
      const full = path.join(dir, e.name);
      if (e.isDirectory()) return walk(full);
      return /\.tsx?$/.test(e.name) ? [full] : [];
    });
  const ALLOW = new Set([
    // Paints its own FIXED dark gradient in both themes, so a token that gets
    // darker in light mode is a regression here rather than a fix.
    "components/marketing/AuthAside.tsx",
  ]);
  const offenders: string[] = [];
  for (const root of ["app", "components"]) {
    for (const file of walk(path.join(process.cwd(), root))) {
      const rel = path.relative(process.cwd(), file).split(path.sep).join("/");
      if (ALLOW.has(rel)) continue;
      const lines = readFileSync(file, "utf8").split("\n");
      lines.forEach((line, i) => {
        if (!BAN.accentAsText.test(line)) return;
        // An icon's evidence is rarely on the same line as its colour: the size
        // can come from a `${px}` variable, and a wrapper span sits above the
        // `ICONS[...]` it colours. Two lines either way catches both, and is
        // narrow enough that a paragraph cannot borrow an icon's alibi.
        const near = lines.slice(Math.max(0, i - 2), i + 3).join(" ");
        if (
          /\bh-\d|\bw-\d|<svg|role="img"|aria-hidden|ICONS\[|type="(checkbox|radio)"/.test(
            near,
          )
        ) {
          return;
        }
        offenders.push(`${rel}:${i + 1}`);
      });
    }
  }
  assert.deepEqual(
    offenders,
    [],
    `use text-accent-ink for foreground colour; the bare token is the fill (4.28:1 on the page):\n${offenders.join("\n")}`,
  );
});

test("typography compensates for the theme it is rendered in", () => {
  // Light text on a dark ground blooms — the glyphs spread into the background
  // and the space between letters is eaten. The compensation is a property of
  // the THEME, so it is a token, in all three blocks like every colour.
  const css = readFileSync(path.join(process.cwd(), "app/globals.css"), "utf8");
  const track = (selector: string) => {
    const start = css.indexOf(selector);
    assert.ok(start >= 0, `globals.css has no ${selector} block`);
    const body = css.slice(start, css.indexOf("color-scheme", start));
    const m = body.match(/--type-tracking-body:\s*([\d.]+)em\s*;/);
    assert.ok(m, `${selector} does not define --type-tracking-body`);
    return Number(m![1]);
  };
  const light = track(":root {");
  for (const dark of [
    ':root:not([data-theme="light"]) {',
    ':root[data-theme="dark"] {',
  ]) {
    assert.ok(
      track(dark) > light,
      `${dark}: the dark theme must open the letter-fit, not match the light one`,
    );
    assert.ok(
      track(dark) <= 0.02,
      `${dark}: ${track(dark)}em is letter-spacing a reader will see, not optical compensation`,
    );
  }
  assert.equal(
    light,
    0,
    "the light theme needs no compensation and should say so",
  );

  // It has to INHERIT, or the 111 places that made an explicit `tracking-*`
  // decision would be the only ones affected — the exact inverse of the intent.
  assert.match(
    css,
    /body\s*\{[^}]*letter-spacing:\s*var\(--type-tracking-body\)/,
    "the tracking token is defined but never applied to body",
  );
});

test("the two cards that carry the product have a real type step", () => {
  // Both were measured flat. The opportunity card ran title 18 / body 15.2 — a
  // step of 1.18 — and the guide card ran title 14 / body 14, a step of exactly
  // 1.00, while being the navigation for 88 pages. Neither is a contrast
  // problem, which is why no contrast test caught either.
  const card = readFileSync(
    path.join(process.cwd(), "components/opportunities/OpportunityCard.tsx"),
    "utf8",
  );
  assert.match(
    card,
    /: "text-xl font-semibold leading-snug text-ink"/,
    "the opportunity card's title is no longer a step above its body",
  );
  assert.match(
    card,
    /: "mt-3 text-base leading-relaxed text-ink-soft"/,
    "the opportunity card's description left the 16px body floor",
  );
  // The deadline is the promise the whole product is built on. It was the
  // faintest thing on the card, quieter than the description above it.
  // Scoped to the deadline block: `ink-faint` is still correct on the TBA pill,
  // which sits on `bg-surface` rather than on the card, and on the person glyph.
  const deadline = card.slice(
    card.indexOf("{o.dateConfirmed ? ("),
    card.indexOf("</div>", card.indexOf("{o.dateConfirmed ? (")),
  );
  assert.ok(deadline.length > 0, "the deadline block moved");
  assert.ok(
    !/text-ink-faint/.test(deadline),
    "the deadline is back on ink-faint — it is the product's central promise",
  );

  const guide = readFileSync(
    path.join(process.cwd(), "components/guide/parts.tsx"),
    "utf8",
  );
  assert.match(
    guide,
    /className="text-base font-semibold leading-snug text-ink"/,
    "the guide card's title is back to the same size as its own description",
  );
});

// ─────────────────────────────────────────────────────────────────────────────
// One visual step per heading level, on the guide's reading surface.
//
// This is the mechanism behind "it's a wall of text", and it is not contrast:
// contrast has been measured innocent four times. A reader chunks a long page
// by SIZE, and on a country profile the same level could be four different
// sizes — h2 at 12, 15, 17 and 22px — while an h3 at 17px outranked three of
// them. There was also a real h2 → h4 skip. Size stopped tracking structure, so
// there was nothing to chunk by, and 10,000 pixels of careful prose read as one
// undifferentiated block.
//
// Two rules are enforced here, and the second is what keeps the first honest:
//   • one size class per level, so a level means one thing everywhere;
//   • nothing that merely LABELS a widget is a heading. `PageContents`, the two
//     filter bars and the rail panels were all h2s rendering below body size;
//     they carry `aria-label`/`aria-labelledby` instead, so their regions keep
//     an accessible name without claiming a rank in the outline.
//
// Scope is the subject pages and the parts they are built from. `/guide/compare`
// is deliberately excluded: its axis labels are a consistent uppercase overline
// system, which is a legitimate pattern rather than this defect. The list pages
// are excluded too — a grid of cards is not a document hierarchy.
const GUIDE_READING_SURFACE = [
  "app/guide/places/[place]/page.tsx",
  "app/guide/cities/[hub]/page.tsx",
  "app/guide/work/[area]/page.tsx",
  "app/guide/majors/[major]/page.tsx",
  "app/guide/from-home/page.tsx",
  "components/guide/parts.tsx",
  "components/guide/Spine.tsx",
  "components/guide/TryTheWork.tsx",
];

/** `text-…` size class on every `<hN>` in a source file, by level. */
function headingSizes(src: string): { level: number; size: string }[] {
  const out: { level: number; size: string }[] = [];
  const tag = /<h([1-6])\b([^>]*)>/g;
  let m: RegExpExecArray | null;
  while ((m = tag.exec(src))) {
    const size = m[2].match(
      /\btext-(?:xs|sm|base|lg|xl|2xl|3xl|4xl|\[[^\]\s]+\])/,
    );
    out.push({ level: +m[1], size: size ? size[0] : "(none)" });
  }
  return out;
}

// ─────────────────────────────────────────────────────────────────────────────
// Every character a link-preview card can print, it can draw.
//
// The two Open Graph cards carry a SUBSET of Inter, because the edge function
// they run in is capped at 1 MB compressed and full Latin Inter put the bundle
// at 1.06 MB gzip — `next build` passed locally and in CI, neither of which
// enforces that limit, and only the deploy failed.
//
// The hazard subsetting creates is silent: a glyph outside the set does not
// throw, it renders as a blank box, on a public card, inside someone else's
// chat. Writing the set by hand found this the hard way — the first pass
// covered Latin punctuation and missed both `²` and the Cyrillic in "Турнир
// городов", a real catalog row.
//
// So the set is declared as RANGES rather than as today's characters, and this
// asserts the catalog stays inside it. Widen `OG_GLYPHS` and re-run
// `scripts/subset-og-fonts.ts` when it fires.
const OG_CARD_FIELDS = [
  "name",
  "blurb",
  "eligibility",
  "window",
  "costDetail",
] as const;

test("the link-preview font covers every character the catalog can print", () => {
  const covered = new Set([...OG_GLYPHS]);
  const missing = new Map<string, string>();
  for (const c of COMPETITIONS) {
    for (const field of OG_CARD_FIELDS) {
      const value = (c as Record<string, unknown>)[field];
      if (typeof value !== "string") continue;
      for (const ch of value) {
        if (!covered.has(ch)) missing.set(ch, `${c.id}.${field}`);
      }
    }
  }
  assert.deepEqual(
    [...missing].map(([ch, where]) => `U+${ch.codePointAt(0)!.toString(16).toUpperCase().padStart(4, "0")} ${ch} in ${where}`),
    [],
    "widen OG_GLYPHS and re-run scripts/subset-og-fonts.ts",
  );
});

test("the glyph-coverage guard actually bites", () => {
  const covered = new Set([...OG_GLYPHS]);
  // The two that were genuinely missing on the first pass, plus one nobody has
  // any reason to use — if these ever land inside the set, it has been widened
  // to something that is no longer a subset and the size win is gone.
  assert.ok(covered.has("²"), "superscript two is used by an eligibility line");
  assert.ok(covered.has("Т") && covered.has("у"), "Cyrillic is in the catalog");
  assert.ok(!covered.has("漢"), "the subset is not silently the whole font");
  // And the check itself finds a character outside the set.
  const outside = [..."漢字"].filter((ch) => !covered.has(ch));
  assert.deepEqual(outside, ["漢", "字"]);
});

test("the guide's reading surface uses one type step per heading level", () => {
  // h1 is not pinned: a list page's `SectionIntro` is deliberately smaller than
  // a subject page's `DetailShell`, and they are different surfaces.
  const ALLOWED: Record<number, string[]> = {
    2: ["text-2xl"],
    3: ["text-lg"],
  };
  const offenders: string[] = [];
  for (const rel of GUIDE_READING_SURFACE) {
    const src = readFileSync(path.join(process.cwd(), rel), "utf8");
    for (const { level, size } of headingSizes(src)) {
      if (level >= 4) {
        offenders.push(`${rel}: h${level} — the guide stops at h3`);
        continue;
      }
      const allowed = ALLOWED[level];
      if (allowed && !allowed.includes(size)) {
        offenders.push(`${rel}: h${level} is ${size}, expected ${allowed[0]}`);
      }
    }
  }
  assert.deepEqual(
    offenders,
    [],
    `heading level and type step disagree:\n${offenders.join("\n")}`,
  );
});

test("the heading-step guard actually bites", () => {
  // Never ship one of these without watching it fail. Three shapes, and every
  // one of them shipped in this repo: a sub-head promoted past its parent, a
  // level rendering at two sizes, and a skipped level.
  const overpowering = '<h3 className="text-xl font-semibold text-ink">x</h3>';
  const undersized = '<h2 className="text-sm font-semibold text-ink">x</h2>';
  const skipped = '<h4 className="text-base font-semibold text-ink">x</h4>';
  const ok = '<h2 className="text-xl font-semibold text-ink">x</h2>';

  assert.deepEqual(headingSizes(overpowering), [{ level: 3, size: "text-xl" }]);
  assert.deepEqual(headingSizes(undersized), [{ level: 2, size: "text-sm" }]);
  assert.deepEqual(headingSizes(skipped), [{ level: 4, size: "text-base" }]);
  assert.deepEqual(headingSizes(ok), [{ level: 2, size: "text-xl" }]);

  // The multi-line form the codebase actually writes, which a naive
  // single-line regex misses entirely.
  const wrapped = '<h2\n  id="x"\n  className="text-sm font-semibold text-ink"\n>';
  assert.deepEqual(headingSizes(wrapped), [{ level: 2, size: "text-sm" }]);

  // And a heading with no size class at all is reported rather than skipped.
  assert.deepEqual(headingSizes("<h3>bare</h3>"), [
    { level: 3, size: "(none)" },
  ]);
});

// ─────────────────────────────────────────────────────────────────────────────
// The spine (#16) — the guide's four steps, joined.
//
// The chain is DERIVED, so what has to be asserted is not "the data is right"
// but "the derivation preserves the product's rules". All four of those rules
// were already true of some individual layer and could quietly stop being true
// of the join.

test("every field's chain reaches somewhere, and every stop can be opened", () => {
  for (const f of FACULTY_VALUES) {
    const spine = spineForFaculty(f);
    assert.ok(
      spine.stops.length > 0,
      `${f} leads nowhere — a field of study with no place attached is a dead end`,
    );
    for (const stop of spine.stops) {
      // A country with neither a profile page nor a single city page is a name
      // a student cannot click. A list of those is an advert, which is the same
      // rule the world map is held to.
      assert.ok(
        stop.destination !== null || stop.hubs.length > 0,
        `${f}: "${stop.country}" is on the chain with no page behind it`,
      );
    }
  }
});

test("the home region leads the chain, exactly as it leads the map", () => {
  // Central Asia and the Caucasus first, for the reason the destination list
  // and the world map already do it: for many of our readers a strong degree at
  // home plus a funded master's abroad is the honest answer, and a chain that
  // lists sixteen ways to leave and none to stay is recommending, not informing.
  for (const f of FACULTY_VALUES) {
    const spine = spineForFaculty(f);
    const positions = spine.stops.map((s) => REGION_ORDER.indexOf(s.region));
    for (let i = 1; i < positions.length; i++) {
      assert.ok(
        positions[i] >= positions[i - 1],
        `${f}: the chain leaves ${REGION_ORDER[positions[i - 1]]} and comes back to ${REGION_ORDER[positions[i]]}`,
      );
    }
    assert.ok(
      positions.every((p) => p >= 0),
      `${f}: a stop is in no known region`,
    );
  }
});

test("the chain names institutions and never ranks or invents them", () => {
  for (const f of FACULTY_VALUES) {
    for (const stop of spineForFaculty(f).stops) {
      if (stop.universities.length === 0) continue;
      assert.ok(
        stop.destination,
        `${f}: "${stop.country}" names institutions with no country profile behind them`,
      );
      // Only ever listed under a field they are actually known for.
      for (const u of stop.universities) {
        assert.ok(
          u.knownFor.includes(f),
          `${u.name} is listed under ${f}, which it is not knownFor`,
        );
      }
      // And in the registry's own order — no score, no reordering, nothing that
      // could read as a ranking. This is the assertion that would fail the day
      // someone sorts by "strength".
      const expected = universitiesForPlace(stop.destination!.id)
        .filter((u) => u.knownFor.includes(f))
        .map((u) => u.name);
      assert.deepEqual(
        stop.universities.map((u) => u.name),
        expected,
        `${f}/${stop.country}: the institution order is not the registry's`,
      );
    }
  }
});

test("the chain agrees with itself walked backwards", () => {
  // The whole point of #16: the layers were joined in one direction and could
  // drift in the other. If a city is on the chain for a field, that city must
  // return the areas of that field — and if a country page says it is a route
  // into some work, that work's chain must contain the country.
  for (const f of FACULTY_VALUES) {
    const spine = spineForFaculty(f);
    const areas = CAREER_AREAS_BY_FACULTY[f] ?? [];
    assert.ok(areas.length > 0, `${f} names no areas of work`);

    for (const stop of spine.stops) {
      for (const hub of stop.hubs) {
        const back = areasForHub(hub).map(({ area }) => areaSlug(area.title));
        for (const area of areas) {
          assert.ok(
            back.includes(areaSlug(area.title)),
            `${hub.city} is on ${f}'s chain but does not lead back to "${area.title}"`,
          );
        }
      }
      if (!stop.destination) continue;
      const backFromCountry = areasForDestination(stop.destination).map(
        ({ faculty }) => faculty,
      );
      // A country reached only through its cities need not claim the field
      // itself — `fields` on a destination is an editorial claim about the
      // country, and a city's labour market is a different one. But if it DOES
      // claim it, the chain must contain it.
      if (backFromCountry.includes(f)) {
        assert.ok(
          spine.stops.some((s) => s.destination?.id === stop.destination!.id),
          `${stop.destination.name} claims ${f} but is missing from its chain`,
        );
      }
    }
  }
});

test("every area of work resolves to exactly one field", () => {
  // `facultyOfArea` walks the registry by SLUG, because an area has no id. A
  // collision would silently file one area's chain under another's field.
  for (const { faculty, area } of allCareerAreas()) {
    assert.equal(
      facultyOfArea(area),
      faculty,
      `"${area.title}" resolves to the wrong field`,
    );
  }
});

// ── The heavy registries stay out of every client bundle ─────────────────────
//
// This guard used to scan for a DIRECT import edge from a client component, and
// that is exactly how the catalog escaped: `RoadmapView` (a client component)
// imported `lib/data/roadmap.ts`, which imported `buildStudyPlan` from
// `key-dates.ts`, which builds a lookup map over the whole ~2,700-row catalog at
// module load and therefore cannot be tree-shaken. ONE HOP of indirection, and
// the catalog sat in the initial bundle of four dashboard routes and their four
// demo twins — measured at 27–28 kB apiece, on pages that never show it.
//
// Bundling is a REACHABILITY property, so the guard is now a graph walk. Two
// edge kinds are deliberately excluded, because neither ships anything:
// `import type`, which the compiler erases, and dynamic `import()`, which is the
// sanctioned escape the matching views and `RoadmapView` use.
const HEAVY_REGISTRIES = [
  "lib/data/key-dates",
  "lib/data/competitions-data",
  "lib/data/careers",
  "lib/data/world",
  "lib/data/study-destinations",
  "lib/data/spine",
  "lib/data/majors",
  "lib/data/place-universities",
];

/** Static, value-carrying import specifiers in one file. */
function staticImports(src: string): string[] {
  const out: string[] = [];
  // Tempered: an import body may not contain another `import`, or a greedy
  // match spans the whole header and reports the wrong specifier.
  const re = /^import\s+((?:(?!^import\s)[\s\S])*?)from\s+["']([^"']+)["']/gm;
  let m: RegExpExecArray | null;
  while ((m = re.exec(src))) {
    const clause = m[1].trim();
    if (/^type\b/.test(clause)) continue; // `import type { X } from`
    const inner = clause.match(/\{([\s\S]*)\}/)?.[1];
    if (inner) {
      const specs = inner.split(",").map((x) => x.trim()).filter(Boolean);
      // `import { type A, type B }` carries no value either.
      if (specs.length > 0 && specs.every((x) => /^type\s/.test(x))) continue;
    }
    out.push(m[2]);
  }
  return out;
}

/** `@/x/y` or `./y` → a repo-relative module id, or null if it leaves the repo. */
function resolveModule(fromFile: string, spec: string): string | null {
  let base: string;
  if (spec.startsWith("@/")) base = path.join(process.cwd(), spec.slice(2));
  else if (spec.startsWith(".")) base = path.resolve(path.dirname(fromFile), spec);
  else return null; // node_modules
  for (const cand of [
    `${base}.ts`,
    `${base}.tsx`,
    path.join(base, "index.ts"),
    path.join(base, "index.tsx"),
  ]) {
    if (existsSync(cand)) return rel(cand);
  }
  return null;
}

/** Everything a client component drags into its bundle, transitively. */
function clientReachable(): Map<string, string[]> {
  const cache = new Map<string, string[]>();
  const readImports = (id: string): string[] => {
    const hit = cache.get(id);
    if (hit) return hit;
    const full = path.join(process.cwd(), id);
    const raw = existsSync(full) ? readFileSync(full, "utf8") : "";
    // A `"use server"` module is a BUNDLING BOUNDARY, not a dependency: the
    // client gets an RPC stub, never the module. Walking through one reported
    // the admin quick-add form as shipping the catalog (client form → server
    // action → key-dates), which the build manifest disproves — the catalog
    // chunk is in eight routes and /admin/opportunities is not one of them.
    // Modelling the boundary is the difference between a guard people trust and
    // one they start ignoring.
    const deps = /^\s*["']use server["']/m.test(raw)
      ? []
      : staticImports(stripComments(raw))
          .map((s) => resolveModule(full, s))
          .filter((x): x is string => x !== null);
    cache.set(id, deps);
    return deps;
  };
  // id → the path by which a client component reaches it
  const reached = new Map<string, string[]>();
  for (const file of sourceFiles()) {
    const src = readFileSync(file, "utf8");
    if (!/^\s*["']use client["']/m.test(src)) continue;
    const root = rel(file);
    const stack: { id: string; trail: string[] }[] = [{ id: root, trail: [root] }];
    const seen = new Set<string>([root]);
    while (stack.length > 0) {
      const { id, trail } = stack.pop()!;
      for (const dep of readImports(id)) {
        if (seen.has(dep)) continue;
        seen.add(dep);
        const next = [...trail, dep];
        if (!reached.has(dep)) reached.set(dep, next);
        stack.push({ id: dep, trail: next });
      }
    }
  }
  return reached;
}

test("no heavy registry is REACHABLE from a client component", () => {
  const reached = clientReachable();
  const offenders: string[] = [];
  for (const mod of HEAVY_REGISTRIES) {
    const trail = reached.get(`${mod}.ts`);
    if (trail) offenders.push(`${mod}\n      via ${trail.join("\n       → ")}`);
  }
  assert.deepEqual(
    offenders,
    [],
    `a heavy registry ships in a client bundle:\n  ${offenders.join("\n  ")}`,
  );
});

test("the reachability guard actually bites — on a DIRECT and an INDIRECT edge", () => {
  // The direct half is what the old guard checked. The indirect half is the one
  // that mattered: it is the shape the catalog escaped through, and a walk that
  // only reports depth 1 would pass against it exactly as the old guard did.
  const here = rel(path.join(process.cwd(), "scripts/test-engine.ts"));
  assert.deepEqual(
    staticImports('import { buildRoadmap } from "@/lib/data/roadmap";'),
    ["@/lib/data/roadmap"],
    "a value import is not seen as an edge — the walk would traverse nothing",
  );
  assert.deepEqual(
    staticImports('import type { Roadmap } from "@/lib/data/roadmap";'),
    [],
    "a type-only import is counted as an edge — it is erased and ships nothing",
  );
  assert.deepEqual(
    staticImports('import { type A, type B } from "@/lib/data/roadmap";'),
    [],
    "an inline type-only import is counted as an edge",
  );
  assert.deepEqual(
    staticImports('const m = await import("@/lib/data/roadmap");'),
    [],
    "a dynamic import is counted as an edge — it is the sanctioned escape",
  );
  // The resolver has to actually find real files, or every walk ends at depth 0
  // and the whole guard silently asserts nothing.
  assert.equal(
    resolveModule(path.join(process.cwd(), here), "@/lib/data/roadmap"),
    "lib/data/roadmap.ts",
    "the resolver cannot find a module that exists",
  );
  // And the chain the outage travelled must be a real chain in the tree today:
  // roadmap.ts still reaches key-dates, which is WHY RoadmapView may only load
  // it dynamically.
  const roadmapDeps = staticImports(
    stripComments(readFileSync(path.join(process.cwd(), "lib/data/roadmap.ts"), "utf8")),
  );
  assert.ok(
    roadmapDeps.includes("@/lib/data/key-dates"),
    "roadmap.ts no longer reaches key-dates — re-check whether RoadmapView still needs its dynamic import",
  );
});

// ─────────────────────────────────────────────────────────────────────────────
// The agenda's window (release 3, #26).
//
// The agenda shows ONE period now instead of every month down the page, so
// something has to decide which period it opens on. That decision is pure and
// lives in lib/data/planner.ts, because a rule the planner cannot test is
// folklore — the same reason `stepStatus` is there.

test("the agenda's window opens on a period that answers 'what is next'", () => {
  const months = (...keys: string[]) => keys.map((key) => ({ key }));

  // The ordinary case: today's month is in the list.
  assert.equal(
    agendaHomeIndex(months("2026-07", "2026-08", "2026-09"), "2026-08-14"),
    1,
  );

  // The case that matters. Nothing is due in August, and opening on July —
  // which is behind — or on an empty window would answer "what is next" with
  // either the past or with nothing. It steps to the next month that HAS
  // something, which is the honest answer.
  assert.equal(
    agendaHomeIndex(months("2026-07", "2026-09", "2026-11"), "2026-08-14"),
    1,
  );

  // Everything dated is already behind. The last month is the only honest
  // answer; pretending there is a future period would be inventing one.
  assert.equal(agendaHomeIndex(months("2026-03", "2026-05"), "2026-08-14"), 1);

  // Everything is ahead — open on the first, not on some notion of "now" that
  // has no period to sit in.
  assert.equal(agendaHomeIndex(months("2027-01", "2027-04"), "2026-08-14"), 0);

  // Empty list returns 0 so a caller can index without a guard, and the view
  // renders its empty state rather than reading months[-1].
  assert.equal(agendaHomeIndex([], "2026-08-14"), 0);

  // Year boundaries are string comparisons on "YYYY-MM", which sort correctly.
  // This is the assertion that fails if anyone switches to a numeric month.
  assert.equal(
    agendaHomeIndex(months("2026-09", "2026-12", "2027-02"), "2027-01-05"),
    2,
  );
});

test("the planner's window is stepped, and nothing in it moves on its own", () => {
  const stepper = readFileSync(
    path.join(process.cwd(), "components/planner/PeriodStepper.tsx"),
    "utf8",
  );
  // The founder's rule for the whole section, and it now has a second surface:
  // a card moves because a button was pressed. A carousel that advances itself
  // would be the first thing here that moves without being asked.
  assert.ok(
    !/setInterval|setTimeout\(\s*\(\)\s*=>\s*[^)]*step/i.test(stepper),
    "the period stepper advances on a timer — every step must be asked for",
  );
  // Disabled exactly when the step is impossible, the same rule the map's
  // action bar follows: a lit control the handler then refuses teaches the
  // structure's rules wrongly.
  assert.match(
    stepper,
    /disabled=\{index <= 0\}/,
    "stepping earlier is not disabled at the first period",
  );
  assert.match(
    stepper,
    /disabled=\{index >= count - 1\}/,
    "stepping later is not disabled at the last period",
  );
  // Keys are bound on the group, not the document: otherwise an arrow press
  // while typing a task title somewhere else on the page would step the window.
  assert.ok(
    !/addEventListener\(\s*["']keydown/.test(stepper),
    "the stepper binds keys globally — it must bind them on its own group",
  );
});

test("no client component in the planner reads the clock", () => {
  // Release 1's rule, and the window is the first thing that would have been
  // tempted to break it: `todayISO` is resolved once in the loader and passed
  // down. It is what makes the views agree with each other, survive hydration,
  // and stay unit-testable.
  const dir = path.join(process.cwd(), "components/planner");
  for (const f of readdirSync(dir)) {
    if (!f.endsWith(".tsx")) continue;
    const src = readFileSync(path.join(dir, f), "utf8");
    if (!/^\s*["']use client["']/m.test(src)) continue;
    assert.ok(
      !BAN.clockInClient.test(stripComments(src)),
      `components/planner/${f} calls new Date() — todayISO comes from the loader`,
    );
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// Where a plan starts (release 3, #26) — the guide→planner bridge.

test("the empty planner offers a choice, and every option is a thing that happens", () => {
  const starts = plannerStarts({
    faculties: ["computer_science"],
    areaCount: 4,
    placeCount: 16,
    openCount: 104,
    mapCount: 0,
  });

  assert.equal(starts.length, 4, "the choice lost an option");

  for (const s of starts) {
    // The constraint the whole screen rests on: "pick a field" is a form with
    // different paint, and a form is exactly what a student who cannot say what
    // they want to study is unable to fill in. Every label is an ACTION.
    assert.match(
      s.label,
      /^(See|Find|Think|Go)\b/,
      `"${s.label}" is a noun phrase — every option must be something that happens`,
    );
    // What they will know afterwards. Without it, choosing requires already
    // knowing, which is the thing this student does not have.
    assert.ok(
      s.tells.length > 25,
      `${s.id} does not say what it will tell them`,
    );
    assert.ok(s.href.startsWith("/"), `${s.id} leaves the app`);
  }

  // Three of the four land in the guide or the catalog — the bridge. A choice
  // screen whose options all stayed inside the planner would be the island the
  // planner already was.
  const outward = starts.filter((s) => !s.href.startsWith("/planner"));
  assert.equal(
    outward.length,
    3,
    "the choice stopped reaching outside the planner",
  );

  // A count is a real number or absent. A zero rendered as a count is the one
  // thing on the card a student would take literally.
  assert.equal(
    starts.find((s) => s.id === "map")!.count,
    null,
    "a zero map count must render as no count at all",
  );
  assert.equal(starts.find((s) => s.id === "enter")!.count, 104);
});

test("with no field stated the choice widens rather than shortening", () => {
  // Unknown facts never exclude — the product's oldest rule, and the one most
  // easily broken by a screen that thinks it needs an answer before it can help.
  const none = plannerStarts({
    faculties: [],
    areaCount: 33,
    placeCount: 19,
    openCount: 121,
    mapCount: 2,
  });
  assert.equal(
    none.length,
    4,
    "a student who stated nothing got fewer choices",
  );

  // And the guide links carry `f=all`, which is "they deliberately widened it"
  // rather than "not stated" — the third of the three states that must not be
  // collapsed, or the profile re-applies itself on every navigation.
  for (const id of ["work", "places"]) {
    assert.match(
      none.find((s) => s.id === id)!.href,
      /\?f=all$/,
      `${id} does not widen the guide for a student with no stated field`,
    );
  }

  // Already has maps — the label acknowledges it rather than inviting them to
  // start over.
  assert.match(none.find((s) => s.id === "map")!.label, /back/i);
});

// ─────────────────────────────────────────────────────────────────────────────
// Typed map nodes (release 3, #26 item 4).
//
// The owner's call: the map is the STRUCTURE OF A DECISION, not a free canvas.
// A node's kind is derived from where it points, so there is no column to keep
// in step and no way for a label and a type to disagree — the same reason the
// spine is a function rather than a table.

test("what a map node IS comes from where it points", () => {
  assert.equal(mapNodeKind("/guide/places/germany"), "country");
  assert.equal(mapNodeKind("/guide/cities/berlin"), "city");
  assert.equal(mapNodeKind("/guide/work/data-and-ai"), "work");
  assert.equal(mapNodeKind("/opportunities/promys"), "opportunity");
  assert.equal(mapNodeKind("/planner/board"), "plan");

  // The ordinary case, and it has to stay the cheap one: an untyped thought.
  assert.equal(mapNodeKind(null), "note");
  assert.equal(
    MAP_NODE_KIND_LABEL.note,
    null,
    "an untyped thought must not be badged",
  );

  // A guide path we do not recognise falls back rather than guessing. A wrong
  // badge is worse than none: the badge is the thing telling a student what
  // kind of decision they are making.
  assert.equal(mapNodeKind("/guide/from-home"), "note");
  assert.equal(mapNodeKind("/guide"), "note");

  // Prefix order matters. `/guide/work/...` must not be swallowed by a looser
  // guide test — this is the assertion that fails if anyone reorders them.
  assert.notEqual(mapNodeKind("/guide/work/games-and-interactive"), "country");

  // Every kind except the untyped one is nameable, or a node could be typed and
  // still render as nothing.
  for (const [kind, label] of Object.entries(MAP_NODE_KIND_LABEL)) {
    if (kind === "note") continue;
    assert.ok(label && label.length > 0, `${kind} has no label`);
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// The brand mark, and where a header sends you.

test("the logo is always a link, and it always goes home", () => {
  // It was seven different behaviours across seven headers: not a link at all
  // on the landing page, on /guide and on the signed-out /opportunities; to
  // /opportunities in the student nav; to /dashboard in the report's header;
  // nowhere in the report's sidebar; and to `/` on /partners alone. The single
  // most-clicked affordance on the site did something different depending on
  // which page you were reading, and six times out of seven it was not what
  // everyone tries first.
  const offenders: string[] = [];
  for (const file of sourceFiles()) {
    const rel_ = rel(file);
    // BrandLink is the one place allowed to render the mark directly.
    if (rel_.endsWith("components/ui/BrandLink.tsx")) continue;
    if (rel_.endsWith("components/ui/Logo.tsx")) continue;
    // The one legitimate exception, and it is not a header: Scorecard renders
    // the mark INSIDE the report card it draws. A link there would be a link in
    // a picture of a document.
    if (rel_.endsWith("components/report/Scorecard.tsx")) continue;
    const src = stripComments(readFileSync(file, "utf8"));
    if (!/<Logo\b/.test(src)) continue;
    offenders.push(rel_);
  }
  assert.deepEqual(
    offenders,
    [],
    `render <BrandLink/>, not <Logo/> — the mark must be a link home:\n${offenders.join("\n")}`,
  );

  const brand = readFileSync(
    path.join(process.cwd(), "components/ui/BrandLink.tsx"),
    "utf8",
  );
  assert.match(brand, /href="\/"/, "the brand link no longer points home");
  // It is a touch target before it is a logo, and the mark itself is 24px.
  assert.match(brand, /min-h-11/, "the brand link lost its 44px touch target");
  assert.match(brand, /aria-label=/, "the brand link has no accessible name");
});

test("the student nav runs in the product's own order", () => {
  // Opportunities → Guide → Plan: what you can enter, where it leads, then it
  // becomes work. It shipped as Opportunities → Plan → Guide, which disagreed
  // with the landing page, with the guide's own "next step" footer, and with
  // the sentence we use to explain ourselves.
  const src = readFileSync(
    path.join(process.cwd(), "components/student/StudentNav.tsx"),
    "utf8",
  );
  const order = [...src.matchAll(/href: "(\/[a-z]+)"/g)].map((m) => m[1]);
  assert.deepEqual(order, ["/opportunities", "/guide", "/planner"]);

  // Sign out was a permanent top-level button: the most destructive action on
  // the page, one stray tap from a student's session, beside the links they
  // actually want. It belongs behind the account menu.
  const nav = src.slice(0, src.indexOf("function AccountMenu"));
  assert.ok(
    !/signout/i.test(nav),
    "sign out is back in the header's top level",
  );

  // A menu without these is a trap.
  assert.match(
    src,
    /"Escape"/,
    "the account menu cannot be closed with Escape",
  );
  assert.match(
    src,
    /pointerdown/,
    "the account menu does not close on a click outside",
  );
  // And a closed menu must carry no listeners at all.
  assert.match(src, /removeEventListener/, "the menu leaks its listeners");
});

// ─────────────────────────────────────────────────────────────────────────────
// The guide → plan join (migration 0030).
//
// The plan could already send a student into the guide; nothing could come
// back. A pick is the other half of that sentence — the answers a student
// claimed as theirs — and everything below is a rule that would be silently
// wrong without a test, because the whole feature sits behind a session and an
// agent cannot open it in a browser.

test("what a plan can hold is exactly what the guide can produce", () => {
  // The kinds ARE the guide's steps. A fifth kind without a step would be a
  // thing the plan can hold and the guide has no way to produce; a step with no
  // kind would be a page whose "add to my plan" has nowhere to write.
  assert.deepEqual(
    PICK_KINDS.map((k) => k.section),
    GUIDE_SECTIONS.map((s) => s.id),
    "the picks and the guide's steps have drifted apart",
  );
  for (const k of PICK_KINDS) {
    const section = GUIDE_SECTIONS.find((s) => s.id === k.section)!;
    assert.equal(
      k.step,
      section.step,
      `${k.kind} shows a step number the guide does not use`,
    );
    assert.equal(
      k.listHref,
      section.href,
      `${k.kind} does not lead back to its own step`,
    );
  }
});

test("a pick's kind is derived from its ref, never stored beside it", () => {
  for (const k of PICK_KINDS) {
    const ref = pickRef(k.kind, "some-id");
    assert.deepEqual(parsePickRef(ref), { kind: k.kind, id: "some-id" });
  }

  // Everything after the FIRST colon is the id, so a malformed ref cannot
  // silently become a different kind.
  assert.deepEqual(parsePickRef("place:united-states"), {
    kind: "place",
    id: "united-states",
  });

  // Unrecognised, malformed and empty all return null rather than guessing. A
  // chip whose kind we cannot name has no group to sit in.
  for (const bad of [
    "",
    ":",
    "place:",
    ":germany",
    "country:germany",
    "germany",
  ]) {
    assert.equal(parsePickRef(bad), null, `"${bad}" was accepted as a pick`);
  }
});

test("a pick can only ever point into the guide", () => {
  // The server action computes the href and ignores anything the caller sends,
  // and this is why: a client-supplied path would let anyone store `/admin`
  // under the label "Germany" and have the plan render it as a country chip.
  for (const k of PICK_KINDS) {
    const href = pickHref(k.kind, "berlin");
    assert.ok(
      href.startsWith("/guide/"),
      `${k.kind} can point outside the guide (${href})`,
    );
  }
  assert.equal(pickHref("place", "germany"), "/guide/places/germany");
  assert.equal(pickHref("hub", "berlin"), "/guide/cities/berlin");
  assert.equal(pickHref("work", "data-and-ai"), "/guide/work/data-and-ai");
  // Step 4 is one page, not a page per route, so every route lands there. The
  // ref stays unique, which is what the database key needs.
  assert.equal(pickHref("route", "kaggle"), "/guide/from-home");

  // Ids are slugs and nothing else — this is half of a database key and half of
  // a URL, so traversal, protocols and whitespace are rejected outright.
  for (const bad of [
    "",
    "../admin",
    "Germany",
    "a b",
    "germany?x=1",
    "//evil.example",
    "-leading",
  ]) {
    assert.equal(isPickId(bad), false, `"${bad}" was accepted as a pick id`);
  }
  assert.ok(isPickId("united-states"));
  assert.ok(isPickKind("place"));
  assert.equal(isPickKind("country"), false);
});

test("picks are grouped in the guide's own order, and empty groups are dropped", () => {
  const picks = [
    { ref: "hub:berlin", label: "Berlin", href: "/guide/cities/berlin" },
    { ref: "place:germany", label: "Germany", href: "/guide/places/germany" },
    {
      ref: "work:data-and-ai",
      label: "Data & AI",
      href: "/guide/work/data-and-ai",
    },
    // A row written by a version that knew a kind we no longer do. It used to
    // say `major:` — which is a REAL kind now, so the fixture had to move to
    // one that never will be. That is the rule working: an unknown kind is
    // dropped, and yesterday's unknown can become today's known.
    { ref: "scholarship:daad", label: "DAAD", href: "/guide/x" },
  ];

  const groups = groupPicks(picks);
  assert.deepEqual(
    groups.map((g) => g.kind),
    ["work", "place", "hub"],
    "the plan reorders what the guide numbered, or kept an empty group",
  );

  // Dropped, not coerced into a group it does not belong to.
  assert.ok(
    groups.every((g) => g.picks.every((p) => p.ref !== "scholarship:daad")),
    "an unrecognised pick was rendered under a kind it is not",
  );

  // The order INSIDE a group is the order given — the loader sorts by when they
  // were added, so nothing here may re-sort and bury the newest thought.
  const two = groupPicks([
    { ref: "place:poland", label: "Poland", href: "/guide/places/poland" },
    { ref: "place:germany", label: "Germany", href: "/guide/places/germany" },
  ]);
  assert.deepEqual(
    two[0].picks.map((p) => p.label),
    ["Poland", "Germany"],
    "the picks were re-sorted, which is a ranking nobody asked for",
  );

  assert.deepEqual(countPicks(picks), {
    work: 1,
    major: 0,
    place: 1,
    hub: 1,
    route: 0,
  });
  assert.equal(groupPicks([]).length, 0);
});

test("the plan's picks stay out of every prose registry", () => {
  // Same bundle rule as the spine and the catalog: this module is imported by
  // two client components, and the guide's registries are ~4,000 lines. A chip
  // renders from its stored label and href, which is all a chip needs.
  const src = readFileSync(
    path.join(process.cwd(), "lib/data/plan-picks.ts"),
    "utf8",
  );
  const runtimeImports = src
    .split("\n")
    .filter((l) => /^import /.test(l) && !/^import type /.test(l));
  assert.deepEqual(
    runtimeImports,
    [],
    "plan-picks.ts gained a runtime import — it must stay type-only",
  );
});

// ─────────────────────────────────────────────────────────────────────────────
// The next move — the whole of the plan's guidance, in one pure function.
//
// The section's real failure was that the only sentence addressed to a student
// lived on the EMPTY state and vanished the moment anything existed in the
// plan, so the product accompanied nobody past their first action. These are
// the rules that stop that coming back.

const NO_PICKS = { work: 0, major: 0, place: 0, hub: 0, route: 0 };

function moveInput(over: Partial<NextMoveInput> = {}): NextMoveInput {
  return {
    fieldsStated: 1,
    picks: NO_PICKS,
    committed: 0,
    started: 0,
    overdue: 0,
    openToYou: 0,
    reachableAreas: 0,
    // `tried: 1` by default, deliberately. The fixture stands for a student who
    // has cleared every earlier gate except the one the test is varying, and
    // these cases were written to exercise the branches BELOW the try step. The
    // try step has its own tests, which set this to 0 explicitly.
    tried: 1,
    reachableMajors: 0,
    reachableCountries: 0,
    citiesInPicked: 0,
    nextDeadline: null,
    dated: 0,
    ...over,
  };
}

test("there is always exactly one next move, and it always says why", () => {
  // Every state the rules can be in, including several that differ in one
  // number — the point is that none falls through and none returns a menu.
  const states: Partial<NextMoveInput>[] = [
    {},
    { overdue: 2 },
    { overdue: 1, committed: 4, started: 3, dated: 9 },
    { picks: { ...NO_PICKS, work: 1 } },
    { picks: { ...NO_PICKS, work: 1 }, tried: 0 },
    { picks: { ...NO_PICKS, work: 1, major: 1 } },
    { picks: { ...NO_PICKS, work: 1, major: 1, place: 2 }, citiesInPicked: 5 },
    { picks: { ...NO_PICKS, work: 1, major: 1, place: 2 }, citiesInPicked: 0 },
    { picks: { ...NO_PICKS, work: 1, major: 1, place: 1, hub: 1 } },
    { picks: { ...NO_PICKS, work: 1, major: 1, place: 1, hub: 1 }, committed: 2 },
    {
      picks: { ...NO_PICKS, work: 1, major: 1, place: 1, hub: 1 },
      committed: 2,
      started: 1,
      dated: 3,
      nextDeadline: { title: "PROMYS", daysLeft: 20 },
    },
    {
      committed: 1,
      started: 1,
      picks: { ...NO_PICKS, work: 1, major: 1, place: 1, hub: 1 },
    },
    { fieldsStated: 0 },
  ];

  const seen = new Set<string>();
  for (const s of states) {
    const move = nextMove(moveInput(s));
    seen.add(move.id);

    assert.ok(move.headline.trim().length > 0, `${move.id} has no headline`);
    // The reason is not decoration. "Go and read about countries" is an
    // instruction; a reason is the thing a consultant gives that a form does
    // not, and its absence is exactly what "there is no accompaniment" meant.
    assert.ok(
      move.why.trim().length > 40,
      `${move.id} tells the student what to do without saying why`,
    );
    assert.ok(
      move.action.href.startsWith("/"),
      `${move.id} sends the student off the site`,
    );
    assert.ok(move.action.label.trim().length > 0, `${move.id} has no action`);
    // At most ONE alternative, ever. Two beside a recommendation is a menu,
    // which is what this exists to replace.
    assert.ok(
      move.alt === undefined || move.alt.href.startsWith("/"),
      `${move.id}'s alternative leaves the site`,
    );
    // The warning colour keeps meaning "this one ran out".
    if (move.tone === "urgent") {
      assert.ok(
        move.id === "overdue" || move.id === "deadline",
        `${move.id} claims urgency without a date having run out`,
      );
    }
  }

  // The states above exercise the ladder, not one branch of it.
  assert.ok(seen.size >= 7, `only ${seen.size} distinct moves are reachable`);
});

test("the next move runs from what has gone wrong to what is closest", () => {
  // 1. A closed deadline outranks everything, including a student who is
  // otherwise doing fine. Nothing about Berlin matters this week.
  assert.equal(
    nextMove(
      moveInput({
        overdue: 1,
        picks: { ...NO_PICKS, work: 2, place: 3, hub: 2 },
        committed: 5,
        started: 4,
        dated: 6,
        nextDeadline: { title: "PROMYS", daysLeft: 3 },
      }),
    ).id,
    "overdue",
  );

  // 2. Nothing at all → the most concrete thing that exists, because it needs
  // no self-knowledge. Asking "what do you want to study" here is the form this
  // product exists to avoid.
  const cold = nextMove(moveInput({ fieldsStated: 0 }));
  assert.equal(cold.id, "cold-start");
  assert.equal(cold.action.href, "/opportunities");

  // 3-5. The guide's own zoom, in order: what work, then where, then which city
  // inside it. A country contains cities, so it comes first — the guide shipped
  // that backwards once.
  // `withWork` carries the SUBJECT too, because the ladder gained two steps
  // between the work and the country: try it, then choose what you'd study.
  // Both have their own tests; this one is about the zoom that follows them.
  const withWork = { ...NO_PICKS, work: 1, major: 1 };
  assert.equal(nextMove(moveInput({ committed: 1 })).id, "pick-work");
  assert.equal(nextMove(moveInput({ picks: withWork })).id, "pick-place");
  assert.equal(
    nextMove(moveInput({ picks: { ...withWork, place: 1 }, citiesInPicked: 4 }))
      .id,
    "pick-city",
  );

  // The one number allowed to DECIDE rather than only phrase: with no city page
  // inside the countries they picked, the move must not send them to a list
  // with nothing of theirs in it.
  assert.equal(
    nextMove(moveInput({ picks: { ...withWork, place: 1 }, citiesInPicked: 0 }))
      .id,
    "commit",
  );

  const decided = { ...NO_PICKS, work: 1, major: 1, place: 1, hub: 1 };
  // 6. Thought it through, did nothing about it — the gap the product measures.
  assert.equal(nextMove(moveInput({ picks: decided })).id, "commit");
  // 7. Said they would, never started. We ask "when will you start?" precisely
  // so this state is observable; saying nothing about it wastes the answer.
  assert.equal(
    nextMove(moveInput({ picks: decided, committed: 3 })).id,
    "start",
  );
  // 8. Moving, and something is close.
  const deadline = nextMove(
    moveInput({
      picks: decided,
      committed: 3,
      started: 2,
      dated: 4,
      nextDeadline: { title: "PROMYS", daysLeft: 4 },
    }),
  );
  assert.equal(deadline.id, "deadline");
  assert.match(deadline.headline, /PROMYS/);
  assert.equal(deadline.tone, "urgent");
  // 9. Carrying things, none of which has a date we can stand behind. Said
  // plainly rather than hidden: a student planning around a guess is worse off
  // than one who knows there is nothing to plan around.
  assert.equal(
    nextMove(moveInput({ picks: decided, committed: 2, started: 1 })).id,
    "undated",
  );
  // 10. Nothing wrong, nothing urgent — still one move.
  assert.equal(
    nextMove(
      moveInput({
        picks: decided,
        committed: 2,
        started: 2,
        dated: 3,
        nextDeadline: null,
      }),
    ).id,
    "steady",
  );
});

test("the next move never invents a number, and widens when nothing was stated", () => {
  // A count we do not have is left out of the sentence rather than rendered as
  // a zero — the same rule the empty planner's cards follow, because a number
  // is the one thing on a card a student takes literally.
  const noCatalog = nextMove(moveInput({ fieldsStated: 0, openToYou: 0 }));
  assert.ok(
    !/\d/.test(noCatalog.action.label),
    `"${noCatalog.action.label}" carries a number we do not have`,
  );
  const withCatalog = nextMove(moveInput({ fieldsStated: 0, openToYou: 42 }));
  assert.match(withCatalog.action.label, /\b42\b/);

  // Singular and plural, because "1 things" is the tell that a count was
  // concatenated rather than written.
  assert.match(nextMove(moveInput({ overdue: 1 })).headline, /One thing closed/);
  assert.match(nextMove(moveInput({ overdue: 3 })).headline, /^3 things/);

  // Unknown facts never exclude: a student who stated no field is sent into the
  // guide DELIBERATELY WIDENED (`f=all`), not into a list filtered by nothing.
  // Collapsing "not stated" and "widened" re-applies the profile on every
  // navigation — the third of the three states that must not be merged.
  const widened = nextMove(moveInput({ fieldsStated: 0, committed: 1 }));
  assert.equal(widened.id, "pick-work");
  assert.match(widened.action.href, /\?f=all$/);
  const narrowed = nextMove(moveInput({ fieldsStated: 2, committed: 1 }));
  assert.ok(
    !narrowed.action.href.includes("?f="),
    "a student's own fields were frozen into the link instead of left as the default",
  );
});

test("the plan's tally is read off the view, never re-derived", () => {
  let n = 0;
  const item = (over: Partial<PlannerItem>): PlannerItem => ({
    key: `k${(n += 1)}`,
    origin: "opportunity",
    sourceId: "x",
    title: "X",
    dueISO: null,
    status: "todo",
    href: null,
    note: null,
    daysLeft: null,
    ...over,
  });

  const soon = item({ title: "Soonest", dueISO: "2026-09-01", daysLeft: 18 });
  const later = item({ title: "Later", dueISO: "2026-09-20", daysLeft: 37 });

  const tally = tallyPlanner({
    items: [
      soon,
      later,
      item({ status: "doing" }),
      item({ status: "done" }),
      item({ status: "dropped" }),
      item({ origin: "own", status: "doing" }),
      // A fact about the world with no state — never counted as a commitment.
      item({ origin: "sat", status: "todo" }),
    ],
    months: [
      {
        key: "2026-09",
        label: "September 2026",
        items: [soon, later],
        phases: [],
      },
    ],
    overdue: [item({ dueISO: "2026-07-01", daysLeft: -44 })],
    undated: [],
    columns: { todo: [], doing: [], done: [] },
    droppedCount: 1,
  });

  // Own tasks and world facts are not commitments; dropped ones are not either.
  assert.equal(tally.committed, 4);
  assert.equal(tally.started, 2);
  assert.equal(tally.overdue, 1);
  assert.equal(tally.dated, 2);
  // The nearest date is the head of the first non-empty month, NOT a fresh
  // minimum: a second ordering can disagree with the one the agenda draws.
  assert.deepEqual(tally.nextDeadline, { title: "Soonest", daysLeft: 18 });

  const empty = tallyPlanner({
    items: [],
    months: [],
    overdue: [],
    undated: [],
    columns: { todo: [], doing: [], done: [] },
    droppedCount: 0,
  });
  assert.equal(empty.nextDeadline, null);
  assert.equal(empty.committed, 0);
});

test("the planner is one route, and its old addresses still resolve", () => {
  // `?view=` is read leniently: an old link, a typo or a truncated share all
  // arrive here, and none is worth an error page when "show them the agenda" is
  // available and correct.
  assert.equal(plannerViewFromParam(undefined), "next");
  assert.equal(plannerViewFromParam("board"), "board");
  assert.equal(plannerViewFromParam("map"), "maps");
  assert.equal(plannerViewFromParam("nonsense"), "next");
  assert.equal(plannerViewFromParam(["board", "map"]), "board");

  const root = process.cwd();
  // The board and the maps list stopped being routes. Both addresses were live
  // and linked, so both must redirect — a deleted page that 404s is a broken
  // link in somebody's history.
  const config = readFileSync(path.join(root, "next.config.mjs"), "utf8");
  for (const [from, view] of [
    ["/planner/board", "board"],
    ["/planner/maps", "map"],
  ]) {
    assert.ok(
      config.includes(`"${from}", "${view}"`),
      `${from} has no redirect to its view`,
    );
    assert.ok(
      PLANNER_SECTIONS.some((s) => s.view === view),
      `${from} redirects to ?view=${view}, which no lens answers to`,
    );
  }

  // Enumerated, never a pattern: the page for a single map is still real,
  // because one map is a document a student can send to someone. Checked
  // against the CODE with comments stripped — the config explains this rule in
  // prose, and prose that names the forbidden pattern is not the pattern.
  const code = config.replace(/\/\/.*$/gm, "");
  assert.ok(
    !/planner\/maps\/[:*]/.test(code),
    "a pattern redirect would swallow the page for a single map",
  );
  assert.ok(
    existsSync(path.join(root, "app/planner/maps/[id]/page.tsx")),
    "the page for a single map is gone",
  );
  for (const dead of ["app/planner/board", "app/planner/maps/page.tsx"]) {
    assert.ok(
      !existsSync(path.join(root, dead)),
      `${dead} still exists — a lens and a route for the same thing will drift`,
    );
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// Trying the work (backlog §8 item 4) — a few hours of the actual job, on the
// page about that job.
//
// The founder asked for this by name. Every rule below is a way the obvious
// version either rots within a year or tells a student something false about a
// career they then spend three years training for.

test("a simulation is named where the work is, and points at a real area", () => {
  const slugs = new Set(allCareerAreas().map(({ area }) => areaSlug(area.title)));

  assert.ok(JOB_SIMULATIONS.length > 0, "nothing to try anywhere");

  for (const s of JOB_SIMULATIONS) {
    assert.ok(s.employer.trim().length > 0, "a simulation with no employer");
    assert.ok(s.areas.length > 0, `${s.employer} is a try at nothing`);
    for (const a of s.areas) {
      // A dead slug renders as silence, which is the worst failure here: the
      // page looks finished and the one actionable thing on it is missing.
      assert.ok(
        slugs.has(a),
        `${s.employer} points at "${a}", which is not an area of work`,
      );
    }
    // Written like `dayToDay` — the Tuesday, not the job description. A short
    // line here is a product blurb, which is the thing we are replacing.
    assert.ok(
      s.what.length > 80,
      `${s.employer} describes the task too thinly to be worth an evening`,
    );
    assert.ok(s.hours.trim().length > 0, `${s.employer} has no rough length`);
  }
});

test("the try-it registry owns no links and promises no outcomes", () => {
  const src = readFileSync(
    path.join(process.cwd(), "lib/data/try-it.ts"),
    "utf8",
  );

  // The catalog owns links, because `npm run test:links` is what keeps them
  // alive and it only knows about the catalog — and these company pages sit
  // behind connection-level bot protection the gate demonstrably cannot pass.
  // So they are NAMED here and LINKED through the one row that does pass.
  const code = stripComments(src);
  assert.ok(
    !/https?:\/\//.test(code),
    "try-it.ts carries a URL — the catalog owns links, and the gate cannot check these",
  );

  // No product titles. The employer is the stable half of the claim and the
  // thing a student searches for; a course name is what gets re-cut and
  // renamed, and a page that names one is wrong the day it changes.
  assert.ok(
    !/Virtual Experience|Job Simulation Program|Programme\b/i.test(code),
    "try-it.ts names a product title, which is the half that rots",
  );

  // And no outcome claims. The hiring statistics are real and they are the
  // platform's, not ours — quoting them on a card turns "try this" into a
  // promise about a student's future.
  assert.ok(
    !/twice as likely|guarantee|get hired|land a job|\d+%/i.test(code),
    "try-it.ts makes a claim about what happens to the student afterwards",
  );
});

test("an area with no honest simulation gets silence, not a near miss", () => {
  // Absence over a wrong claim — the same rule that keeps a countdown off an
  // unconfirmed date. There is no employer simulation for treating patients,
  // and offering an adjacent one would cost a reader an evening and teach them
  // the wrong thing about medicine.
  assert.deepEqual(simulationsForArea("treating-patients"), []);
  assert.deepEqual(simulationsForArea("not-an-area-at-all"), []);

  // The founder's own example, and it is the assertion that fails if the
  // mapping is ever broken: someone weighing investment banking meets the
  // bank's own simulation on that page.
  const money = simulationsForArea("money-and-markets");
  assert.ok(money.length > 0, "money & markets offers nothing to try");
  assert.ok(
    money.some((s) => /J\.P\. Morgan/.test(s.employer)),
    "the bank that builds the investment-banking simulation is not on that page",
  );

  // Capped, and in registry order. The area page already answers five
  // questions; a fourth card turns its one actionable part back into a list,
  // and sorting would be a ranking nobody asked for.
  for (const { area } of allCareerAreas()) {
    const list = simulationsForArea(areaSlug(area.title));
    assert.ok(
      list.length <= 3,
      `${area.title} offers ${list.length} things to try — the cap is 3`,
    );
    const registryOrder = JOB_SIMULATIONS.filter((s) =>
      s.areas.includes(areaSlug(area.title)),
    ).slice(0, 3);
    assert.deepEqual(
      list.map((s) => s.employer),
      registryOrder.map((s) => s.employer),
      `${area.title} reorders what to try, which is a ranking`,
    );
  }
});

test("the try-it card links through the catalog row that the gate keeps alive", () => {
  // The one URL in this whole feature lives in the catalog, where
  // `npm run test:links` can reach it. If that row is ever renamed or removed,
  // every area page's most actionable link dies silently — so it is pinned.
  assert.ok(
    COMPETITIONS.some((c) => c.id === TRY_IT_OPPORTUNITY_ID),
    `${TRY_IT_OPPORTUNITY_ID} is not in the catalog — the try-it card links nowhere`,
  );
  const row = COMPETITIONS.find((c) => c.id === TRY_IT_OPPORTUNITY_ID)!;
  assert.equal(
    row.category,
    "simulation",
    "the row the try-it card links to is no longer a simulation",
  );
});

// ─────────────────────────────────────────────────────────────────────────────
// A card moving between columns (backlog §8 item 5, the rest of #23).
//
// The move is applied in the client BEFORE the server answers, and only then is
// it allowed to be animated. Both halves are the same decision, and the second
// one is a rule this codebase has already been burned by once.

test("a moving card is named so it can be morphed, and the name is legal CSS", () => {
  // A `view-transition-name` is a custom-ident: `:` is not legal in one, and
  // the item key is `${origin}:${sourceId}`. An id starting with a digit would
  // not be legal either — the prefix handles that.
  const ident = /^[a-zA-Z-][a-zA-Z0-9-]*$/;

  for (const key of [
    "opportunity:forage-all",
    "own:6f1c9e2a-9b3d-4c77-8a10-9e2b4c5d6e7f",
    "sat:2026-11-07",
    "deadline:mit-ea",
    // The nastiest realistic case: an id that is all digits.
    "opportunity:2026",
  ]) {
    const name = plannerMorph(key);
    assert.match(name, ident, `${key} produced an illegal ident: ${name}`);
    assert.ok(!name.includes(":"), `${name} still carries a colon`);
  }

  // Distinct keys stay distinct — two elements sharing a name is not a broken
  // animation, it is NO animation, silently.
  const keys = ["opportunity:a", "own:a", "opportunity:a-b", "opportunity:a:b"];
  const names = keys.map(plannerMorph);
  assert.equal(
    new Set(names).size,
    names.length,
    `two cards would claim one transition name: ${names.join(", ")}`,
  );
});

test("the board's view transition can never freeze the page", () => {
  const src = readFileSync(
    path.join(process.cwd(), "components/planner/PlannerBoard.tsx"),
    "utf8",
  );

  // §5.1, and it is the general rule rather than a detail of that bug: a
  // `startViewTransition` whose promise is gated on anything asynchronous
  // paints a snapshot and stops responding to scroll until it settles —
  // measured at 2130ms waiting on a `force-dynamic` route. The callback here
  // must therefore be synchronous, which also means the server action cannot
  // be inside it.
  const callback = src.match(/startViewTransition\(([\s\S]{0,200})/);
  assert.ok(callback, "the board no longer starts a view transition");
  assert.ok(
    !/await|async|movePlannerItem/.test(callback[1]),
    "the board's view transition waits on something — that freezes the document",
  );

  // `flushSync`, or React batches the update, the snapshot is taken before
  // anything has changed, and the morph animates nothing.
  assert.match(
    src,
    /flushSync/,
    "the board's transition updates state asynchronously, so it morphs nothing",
  );

  // Reduced motion skips the transition ENTIRELY. The global CSS guard zeroes
  // the duration, and a zero-duration transition still freezes — which is
  // exactly the trap §5.1 records.
  assert.match(
    src,
    /prefers-reduced-motion/,
    "the board animates a move for a reader who asked for less motion",
  );

  // And the whole thing is feature-detected: Firefox had no view transitions
  // for most of this product's life, and the move must still land there.
  assert.match(src, /"startViewTransition" in document/);
});

test("a country appears once in a chain, however its hubs spell its name", () => {
  // Found by opening an area page and reading the console: React reported two
  // children with the key "United Arab Emirates-middle_east". What a student
  // saw was the same country listed twice, one city under each.
  //
  // The cause was an identity built out of PROSE. The walk matched a stop on
  // `s.country === hub.country` and stored `destination?.name ?? hub.country` —
  // and the hubs say "UAE" where the country profile says "United Arab
  // Emirates", so the stop could never match itself. Dubai and Abu Dhabi were
  // split into separate hubs two releases ago, which is what made it visible.
  // "Hong Kong SAR" against "Hong Kong" was one hub away from the same bug.
  for (const faculty of FACULTY_VALUES) {
    const spine = spineForFaculty(faculty);

    const seenDestination = new Set<string>();
    const seenLabel = new Set<string>();
    for (const stop of spine.stops) {
      if (stop.destination) {
        assert.ok(
          !seenDestination.has(stop.destination.id),
          `${faculty}: ${stop.destination.name} appears twice in the chain`,
        );
        seenDestination.add(stop.destination.id);
      }
      // What the renderer keys on, and what a reader actually sees. Even two
      // stops that are genuinely different rows must not present as the same
      // country in the same region.
      const label = `${stop.country}-${stop.region}`;
      assert.ok(
        !seenLabel.has(label),
        `${faculty}: two stops both read as "${label}"`,
      );
      seenLabel.add(label);
    }

    // And nothing was lost in the deduplication: every hub carrying this field
    // still has a stop to sit in, exactly once.
    const hubIds = spine.stops.flatMap((s) => s.hubs.map((h) => h.id));
    assert.equal(
      new Set(hubIds).size,
      hubIds.length,
      `${faculty}: a city is listed under two countries`,
    );
    assert.equal(
      hubIds.length,
      spine.hubCount,
      `${faculty}: the chain's own city count disagrees with the cities in it`,
    );
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// Every kind of opportunity has a tab.
//
// Reported by the founder as a number that did not add up: the tab strip showed
// 10 + 48 + 26 + 10 + 9 + 10 = 113 while "All" said 114. The missing one was the
// catalog's single `simulation` — the kind was added to the data model, the
// Record-typed label maps were updated because the COMPILER forced them, and
// the tab strip's hand-written array was not, because an array has no
// obligation to cover a union. So one row counted inside "All" and could not be
// reached by any filter.
//
// The compiler covers the labels. This covers the order, which is the half it
// cannot.

test("every kind of opportunity is reachable from the tabs", () => {
  for (const kind of COMPETITION_CATEGORIES) {
    assert.ok(
      CATEGORY_ORDER.includes(kind),
      `"${kind}" has no tab — rows of that kind count inside "All" and cannot be filtered to`,
    );
    assert.ok(
      CATEGORY_TAB_LABEL[kind]?.trim().length > 0,
      `"${kind}" has no tab label`,
    );
  }

  // And nothing extra: a tab for a kind the catalog cannot hold would always
  // read zero, and a zeroed tab is hidden — so it would be invisible dead code.
  for (const kind of CATEGORY_ORDER) {
    assert.ok(
      (COMPETITION_CATEGORIES as readonly string[]).includes(kind),
      `"${kind}" is a tab for a kind that does not exist`,
    );
  }
  assert.equal(
    new Set(CATEGORY_ORDER).size,
    CATEGORY_ORDER.length,
    "a kind is listed twice in the tab order",
  );

  // "All" leads, and then one tab per kind — so the tabs' counts sum to it.
  assert.equal(CATEGORY_TABS[0].key, "all");
  assert.equal(CATEGORY_TABS.length, COMPETITION_CATEGORIES.length + 1);

  // Every category the catalog actually uses is covered too. This is the
  // assertion that fails if a row is given a kind nobody added to the union —
  // which the type system prevents in source but not in data pasted at speed.
  for (const c of COMPETITIONS) {
    // `category` is optional on a row — an omitted one falls back downstream
    // rather than being invalid, so only a stated kind is asserted here.
    if (!c.category) continue;
    assert.ok(
      CATEGORY_ORDER.includes(c.category),
      `"${c.id}" is a ${c.category}, which has no tab`,
    );
  }
});

test("the category list is not hand-copied into a view", () => {
  // The bug was one array kept by hand in a component. Two components render a
  // list of kinds — the student's tabs and the admin's quick-add — and both
  // must read the registry, or this comes back the next time a kind is added.
  for (const file of [
    "components/dashboard/views/OpportunitiesView.tsx",
    "components/admin/QuickAddOpportunity.tsx",
  ]) {
    const src = stripComments(
      readFileSync(path.join(process.cwd(), file), "utf8"),
    );
    // Three or more category literals in one file is a copy of the union.
    const literals = (
      src.match(
        /"(olympiad|competition|course|research_program|summer_program|community|simulation)"/g,
      ) ?? []
    ).length;
    assert.ok(
      literals < 3,
      `${file} writes out ${literals} category names — read CATEGORY_ORDER instead`,
    );
  }

  // The admin form must be able to post every kind the server accepts. It was
  // two behind: `community` and `simulation` were valid at the endpoint and
  // unchoosable in the form that calls it.
  const action = readFileSync(
    path.join(process.cwd(), "app/admin/opportunities/actions.ts"),
    "utf8",
  );
  assert.match(
    action,
    /ADMIN_CATEGORIES = COMPETITION_CATEGORIES/,
    "the admin endpoint no longer accepts exactly the catalog's kinds",
  );
});

// ── The vocabularies, and the shape that keeps breaking ──────────────────────
//
// An opportunity has four closed vocabularies — kind, level, tier, cost — and
// only ONE of them had ever been protected. The guard above is that protection:
// it exists because a hand-kept array of kinds fell two behind, so `community`
// and `simulation` were accepted by the server and unchoosable in the form.
//
// The two vocabularies sitting beside it in the same files never got it, and by
// 2026-08-24 `level` was declared by hand in FIVE places and `cost` in SIX.
// Two of those copies were already wrong:
//
//   • the admin form offered a fourth level, `school`, that nothing on the read
//     side had heard of — so such a row sat in no facet, no level filter could
//     reach it, and the facet numbers stopped summing to the list total;
//   • the admin form offered NINE of the ten cost models, and the missing one
//     was `funded` — *they pay you* — which the server action had accepted the
//     whole time.
//
// Both are structurally impossible now: the arrays live in `opportunity-vocab`,
// every option list is derived from them, and every label map is a
// `Record<Union, …>` the compiler refuses to leave incomplete. **These tests do
// not duplicate that.** They cover the three things a type cannot:
//
//   1. that nobody has quietly written a private copy back into a component;
//   2. that the DERIVED lists really do cover their vocabulary (a later `as`
//      cast or a `.filter` would silently reintroduce the gap);
//   3. that every deliberate exclusion is NAMED, because a deliberate omission
//      and a forgotten one look identical in a list.
//
// One table, one bite test — the same discipline as `BAN`, and for the same
// reason: a guard written against its own copy of a pattern proves only that
// the copy works.

/**
 * The vocabularies, and the literal members a private copy would contain.
 *
 * Typed as a Record over the vocabulary names so adding a vocabulary without
 * its members does not compile — the same trick `BAN_FIXTURES` uses.
 */
const VOCAB_MEMBERS = {
  level: COMPETITION_LEVELS,
  tier: COMPETITION_TIERS,
  cost: COST_MODELS,
  category: COMPETITION_CATEGORIES,
} as const;

/**
 * Files allowed to hold three or more literals of a vocabulary, and why.
 *
 * `opportunity-vocab` IS the list. The two test files are these tests. Anything
 * else with three members of one vocabulary in it is a fourth copy in the
 * making, which is exactly how every defect above shipped.
 */
const VOCAB_HOMES = [
  // The list itself.
  "lib/data/opportunity-vocab.ts",
  // The catalog is 172 rows of data, each naming its own level and kind. It is
  // the thing the vocabulary describes, not a copy of it.
  "lib/data/competitions-data.ts",
  // The discovery screener sends the vocabulary to the model as prompt text and
  // validates the reply against it. Those literals are an interface with
  // something outside this codebase, not an option list a person reads.
  "lib/discovery/screen.ts",
  "lib/discovery/discover.ts",
  // The bucket → models mapping ("free to start" is these three). That IS a
  // partition of the cost vocabulary rather than a copy of it, and it has a
  // STRONGER guard than this one a few tests below: every model must appear in
  // a bucket or be named unbucketed, asserted in both directions. A guard that
  // fires where a better guard already holds teaches people to add exemptions.
  "lib/data/opportunity-filter.ts",
];

/** Every .ts/.tsx under app/, lib/ and components/. */
function projectSources(): string[] {
  const out: string[] = [];
  const visit = (dir: string) => {
    for (const e of readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, e.name);
      if (e.isDirectory()) {
        if (e.name === "node_modules" || e.name === ".next") continue;
        visit(full);
      } else if (/\.tsx?$/.test(e.name)) {
        out.push(full);
      }
    }
  };
  for (const d of ["app", "lib", "components"]) visit(path.join(process.cwd(), d));
  return out;
}

/**
 * The largest number of DISTINCT members of one vocabulary that appear inside a
 * single array literal.
 *
 * Three decisions here, and the first version of this guard got all three
 * wrong. Each is a different way to measure the wrong thing, so each is worth
 * keeping written down:
 *
 *  • **Distinct, not total.** `oneOf(COST_MODELS, raw, "unknown")` appearing
 *    three times in one file is three uses of one fallback, not a list.
 *  • **Inside an array literal.** Every real instance of this defect has been
 *    an array — the admin form's `[…].map()`, the approval form's
 *    `[{ value, label }, …]`, `z.enum([…])`, `ADMIN_LEVELS`. Counting the whole
 *    FILE instead flagged nine files and eight were unrelated unions that merely
 *    share a word: `scholarship: "unknown"`, `english: "unknown"`,
 *    `StrengthBand` containing "elite". A vocabulary's generic members belong to
 *    other vocabularies too; its SHAPE does not.
 *  • **Comments stripped.** Several of the files that explain this rule name the
 *    members while doing so, and a guard unusable in the files documenting it is
 *    a guard somebody deletes.
 */
function vocabLiterals(src: string, members: readonly string[]): number {
  const body = stripComments(src);
  const member = new RegExp(`"(${members.join("|")})"`, "g");
  let worst = 0;
  for (let i = 0; i < body.length; i++) {
    if (body[i] !== "[") continue;
    // Walk to the matching bracket. Bounded: an array literal running past
    // ~4000 characters is not an option list, and refusing to scan further
    // stops one stray bracket swallowing the rest of the file.
    let depth = 0;
    let end = -1;
    for (let j = i; j < Math.min(body.length, i + 4000); j++) {
      if (body[j] === "[") depth++;
      else if (body[j] === "]") {
        depth--;
        if (depth === 0) {
          end = j;
          break;
        }
      }
    }
    if (end < 0) continue;
    const found = new Set(body.slice(i, end + 1).match(member) ?? []);
    if (found.size > worst) worst = found.size;
    i = end;
  }
  return worst;
}

test("no file keeps a private copy of a vocabulary", () => {
  const offenders: string[] = [];
  for (const file of projectSources()) {
    const rel = path.relative(process.cwd(), file).split(path.sep).join("/");
    if (VOCAB_HOMES.includes(rel)) continue;
    const src = readFileSync(file, "utf8");
    for (const [name, members] of Object.entries(VOCAB_MEMBERS)) {
      const n = vocabLiterals(src, members);
      // Three is the threshold the category guard already used: one or two
      // literals is a default or a special case, three is the union being
      // restated.
      if (n >= 3) offenders.push(`${rel} writes out ${n} ${name} names`);
    }
  }
  assert.deepEqual(
    offenders,
    [],
    `a vocabulary is being copied instead of imported from opportunity-vocab:\n${offenders.join("\n")}`,
  );
});

test("the private-copy guard actually bites", () => {
  // The guard above walks the tree, collects offenders and asserts the list is
  // empty — the shape that fails OPEN. It has to be shown catching something.
  //
  // It reads VOCAB_MEMBERS rather than its own copy of the member list, which
  // is the load-bearing part: a bite test written against a copy of a pattern
  // proves that the copy works, which is exactly nothing once the two drift.
  // The three real defects, verbatim. Each must be caught.
  const adminLevelSelect =
    '{["school", "regional", "national", "international"].map((l) => (';
  assert.equal(vocabLiterals(adminLevelSelect, VOCAB_MEMBERS.level), 4);

  const adminCostSelect =
    '{["unknown","free","free_cert_paid","free_then_paid","freemium",' +
    '"subscription","one_time","paid_aid","varies"].map((c) => (';
  assert.equal(vocabLiterals(adminCostSelect, VOCAB_MEMBERS.cost), 9);

  const partnerZodEnum = 'level: z.enum(["international", "national", "regional"]),';
  assert.equal(vocabLiterals(partnerZodEnum, VOCAB_MEMBERS.level), 3);

  // And the near-misses it must NOT fire on. Every one of these is a real
  // line from this repository that the first version of the guard flagged.
  assert.ok(
    vocabLiterals('const cost = oneOf(COST_MODELS, raw, "unknown");', VOCAB_MEMBERS.cost) < 3,
    "a fallback is not a list",
  );
  assert.ok(
    vocabLiterals(
      'scholarship: z.enum(["likely_full", "likely_partial", "unlikely", "unknown"]),',
      VOCAB_MEMBERS.cost,
    ) < 3,
    "another union that happens to contain the word unknown is not a copy of the cost list",
  );
  assert.ok(
    vocabLiterals(
      'const TARGET_TIERS = { emerging: ["accessible"], developing: ["accessible", "selective"],' +
        ' competitive: ["selective", "elite"], elite: ["elite"] };',
      VOCAB_MEMBERS.tier,
    ) < 3,
    "a band-to-tier mapping is a mapping, not a restatement of the tier list",
  );
  assert.equal(
    vocabLiterals(
      '// "international", "national" and "regional" are the three levels\nconst a = 1;',
      VOCAB_MEMBERS.level,
    ),
    0,
    "prose explaining the rule is not a copy of it",
  );
});

test("every derived option list covers its whole vocabulary", () => {
  // The lists are derived, so this holds by construction TODAY. It is asserted
  // because the failure mode is silent and the repair is not: a later `.filter`
  // or `as` cast puts the gap straight back, and the symptom is a facet that
  // counts nothing rather than an error anybody sees.
  assert.deepEqual(
    LEVEL_OPTIONS.map((o) => o.id),
    [...COMPETITION_LEVELS],
    "the level filter no longer offers every level",
  );
  assert.deepEqual(
    [...PARTNER_LEVEL_OPTIONS.map((o) => o.value)].reverse(),
    [...COMPETITION_LEVELS],
    "a partner can no longer post at every level the catalog stores",
  );
  assert.deepEqual(
    PARTNER_TIER_OPTIONS.map((o) => o.value),
    [...COMPETITION_TIERS],
    "a partner can no longer post at every tier",
  );

  // Every option carries the words for it. An empty label is a facet a student
  // cannot read, and it renders as a blank chip rather than as an error.
  for (const o of [...LEVEL_OPTIONS, ...COST_OPTIONS, ...TIMING_OPTIONS]) {
    assert.ok(o.label.trim().length > 0, `option "${o.id}" has no label`);
    assert.ok(o.hint.trim().length > 0, `option "${o.id}" has no hint`);
  }
  for (const o of MATCH_OPTIONS) {
    assert.ok(o.label.trim().length > 0, `option "${o.id}" has no label`);
  }
});

test("every cost model reaches the money filter, or is named as unbucketed", () => {
  // Rule 2 of opportunity-filter: "Free" never includes a cost we have not
  // verified, so `unknown` and `varies` belong to NO bucket. That is correct
  // and it is also indistinguishable from having forgotten one — the money
  // filter simply stops being able to find those rows, silently.
  //
  // So the exclusion is written down and this asserts BOTH directions: every
  // model is in a bucket or on the list, and nothing on the list is also in a
  // bucket. A new cost model that lands in neither fails here.
  const bucketed = new Set(COST_OPTIONS.flatMap((o) => o.models));
  const unreachable = COST_MODELS.filter(
    (m) => !bucketed.has(m) && !COST_MODELS_WITHOUT_A_BUCKET.includes(m),
  );
  assert.deepEqual(
    unreachable,
    [],
    `these cost models are in no money bucket and not declared unbucketed, so the filter can never find them: ${unreachable.join(", ")}`,
  );

  const contradictory = COST_MODELS_WITHOUT_A_BUCKET.filter((m) =>
    bucketed.has(m),
  );
  assert.deepEqual(
    contradictory,
    [],
    "a model cannot be both bucketed and declared unbucketed",
  );

  // The two that are excluded are excluded for one stated reason: we have not
  // verified the money. Anything else appearing here is a product decision
  // somebody should have to make on purpose.
  assert.deepEqual(COST_MODELS_WITHOUT_A_BUCKET, ["varies", "unknown"]);
});

test("every deliberate exclusion from a partner's choices is named", () => {
  // A partner cannot post a simulation (we link out to those, never host them)
  // and cannot say the cost is unknown (an organiser knows what their own event
  // costs). Both are right. Neither was written down, so each read as a list
  // that had fallen a member behind — which is what the category list actually
  // HAD done, one file away.
  assert.deepEqual(
    COMPETITION_CATEGORIES.filter(
      (c) => !PARTNER_CATEGORY_OPTIONS.some((o) => o.value === c),
    ),
    ["simulation"],
  );
  assert.deepEqual(
    COST_MODELS.filter(
      (m) => !PARTNER_COST_OPTIONS.some((o) => o.value === m),
    ),
    ["unknown"],
  );
  // The form's options and the server's validator are one list, not two that
  // agree. They used to be two, and the day they stopped agreeing a partner
  // would have been offered a cost the action then rejected.
  assert.deepEqual(
    PARTNER_COST_VALUES,
    PARTNER_COST_OPTIONS.map((o) => o.value),
  );
});

test("the label maps stay keyed by their own vocabulary", () => {
  // Completeness is the compiler's job — every map here is a Record over its
  // union. What a Record cannot stop is somebody later writing `as Record<…>`
  // over an object literal, which is how the facet counts were built before
  // this pass and how a missing key becomes `undefined` on screen instead of a
  // type error in an editor.
  const sameKeys = (
    map: Record<string, unknown>,
    members: readonly string[],
    what: string,
  ) =>
    assert.deepEqual(
      Object.keys(map).sort(),
      [...members].sort(),
      `${what} no longer has exactly one entry per member`,
    );

  sameKeys(LEVEL_LABEL, COMPETITION_LEVELS, "LEVEL_LABEL");
  sameKeys(LEVEL_HINT, COMPETITION_LEVELS, "LEVEL_HINT");
  sameKeys(TIER_LABEL, COMPETITION_TIERS, "TIER_LABEL");
  sameKeys(CATEGORY_LABEL, COMPETITION_CATEGORIES, "CATEGORY_LABEL");
  sameKeys(CATEGORY_LABEL_SHORT, COMPETITION_CATEGORIES, "CATEGORY_LABEL_SHORT");
  sameKeys(CATEGORY_TAB_LABEL, COMPETITION_CATEGORIES, "CATEGORY_TAB_LABEL");
  sameKeys(COST_LABEL, COST_MODELS, "COST_LABEL");

  // The short form differs from the long one in exactly one place, and that is
  // the whole reason two maps exist rather than one. If they ever become
  // identical, one of them is dead weight; if they diverge further, the second
  // difference wants the same deliberate argument the first one has.
  const differ = COMPETITION_CATEGORIES.filter(
    (c) => CATEGORY_LABEL[c] !== CATEGORY_LABEL_SHORT[c],
  );
  assert.deepEqual(differ, ["research_program"]);
});

/** A runtime load of one of the two heavy registries. */
const DYNAMIC_CATALOG_IMPORT =
  /import\(\s*["']@\/lib\/data\/(key-dates|roadmap)["']\s*\)/;

/** The three-line pair five components each wrote out. */
const HAND_ROLLED_TODAY = /setToday\s*\(\s*new Date\(\)\s*\)/;
// ── The catalog load, and the render cycle it used to wait for ───────────────
//
// Four client components each held their own copy of this pair:
//
//     const [today, setToday] = useState<Date | null>(null);
//     useEffect(() => setToday(new Date()), []);
//     useEffect(() => {
//       if (!today) return;
//       import("@/lib/data/key-dates").then(…);
//     }, [today, …]);
//
// The second effect cannot run until `today` exists, which takes a state
// update and a re-render — so the largest asynchronous chunk on the route
// began downloading one full render cycle after it could have, and it depends
// on `today` in no way whatsoever. On the public checker the import was gated
// on the visitor's ANSWER too, so it started at the moment of highest intent
// instead of before it.
//
// `lib/data/use-opportunity-plan.ts` owns both halves now: `useToday` is the
// date, `useWarmModule` is a mount-only effect that starts the fetch. These
// tests keep it that way, because the old shape reads as perfectly ordinary
// and would be written again by anybody adding a fifth surface.

/**
 * A `<button …>` opening tag, up to the `>` that closes it.
 *
 * Bounded at 1200 characters: these className strings are long, and a
 * runaway match would swallow the element after it and report the wrong file.
 */

/** An opacity utility with no state prefix — it applies always, not on a state. */
const BARE_OPACITY = /(?<![\w:-])opacity-(?:[0-6]?[0-9])(?![\w-])/;

test("a dimmed control is a disabled control", () => {
  // Measured on the built page, 2026-08-24: an opportunity filter chip with
  // no results rendered its label at **3.27:1** and its count at **2.41:1**,
  // against 8.78 and 5.48 for the same chip with results in it. 13px text
  // needs 4.5. The cause was `opacity-50` laid over the chip to mean "nothing
  // here" while it stayed enabled and clickable.
  //
  // Every colour token inside was checked. The alpha over the top was not —
  // and it arrives from a direction the existing contrast guards cannot see,
  // because those scan for `text-ink/60`-style class names and this is an
  // `opacity` on the element itself. Three chips had it: the opportunity
  // filter and both of the guide filter's.
  //
  // Everywhere else in this codebase a dimmed control carries `disabled:` on
  // the opacity, so it only applies to a control that really is disabled —
  // and WCAG 1.4.3 exempts those. That convention is the rule; this asserts
  // it rather than trusting it, and "nothing here" is expressed as a BRANCH
  // of the colour instead.
  const offenders: string[] = [];
  for (const file of projectSources()) {
    const rel = path.relative(process.cwd(), file).split(path.sep).join("/");
    const body = stripComments(readFileSync(file, "utf8"));
    // `jsxOpenTags`, never a lazy `[\s\S]*?>` — see the helper's note. The
    // first version of this guard stopped at the `>` inside `onClick={() =>`
    // and found 0 of the 2 chips named in the comment above.
    for (const { text: tag } of jsxOpenTags(body, ["button"])) {
      if (!BARE_OPACITY.test(tag)) continue;
      // `disabled` anywhere in the same opening tag means the dimming is
      // conditional on a state WCAG exempts. `aria-disabled` counts too.
      if (/\bdisabled\b/.test(tag)) continue;
      offenders.push(`${rel} — ${tag.replace(/\s+/g, " ").slice(0, 90)}…`);
    }
  }
  assert.deepEqual(
    offenders,
    [],
    `these dim an ENABLED control, which takes checked text colours below AA:\n${offenders.join("\n")}`,
  );
});

test("the dimmed-control guard actually bites", () => {
  // Collect-and-assert-empty again, so it has to be shown catching the real
  // line. This is the opportunity filter chip exactly as it shipped.
  const asItShipped =
    '<button type="button" aria-pressed={on} onClick={onClick} className={`inline-flex h-8 ' +
    'items-center rounded-full border px-3 text-xs ${on ? "border-accent" : "border-line ' +
    'text-ink-soft"} ${count === 0 && !on ? "opacity-50" : ""}`}>';
  const shipped = jsxOpenTags(asItShipped, ["button"]);
  assert.equal(shipped.length, 1, "the real chip must be recognised as a button");
  assert.ok(BARE_OPACITY.test(shipped[0].text), "and its bare opacity must be found");
  assert.ok(!/\bdisabled\b/.test(shipped[0].text), "and it must not look disabled");

  // ── The case the first version of this guard could not see ───────────────
  //
  // Every fixture above uses `onClick={onClick}`, the one handler shape with
  // no arrow in it — which is why this test passed while the guard found 0 of
  // the 2 chips in `GuideFilterBar.tsx`. `onClick={() =>` contains a `>`, so a
  // tag bounded by the next `>` ended 60 characters in, long before
  // `className`. Both shapes below are copied from that file as it shipped;
  // the second nests an object literal inside the arrow, so it also proves the
  // scan counts braces rather than stopping at the first `}`.
  const withArrow =
    '<button\n  type="button"\n  aria-pressed={on}\n  onClick={() => toggleRegion(r)}\n' +
    '  className={`inline-flex h-11 rounded-full border px-4 ${\n' +
    '    on ? "border-accent" : "border-line text-ink-soft"\n' +
    '  } ${n === 0 && !on ? "opacity-50" : ""}`}\n>';
  const arrowTags = jsxOpenTags(withArrow, ["button"]);
  assert.equal(arrowTags.length, 1, "an arrow handler must not end the tag");
  assert.ok(
    BARE_OPACITY.test(arrowTags[0].text),
    "the chip that actually shipped must be caught — this is the whole defect",
  );

  const withNestedObject =
    '<button\n  type="button"\n  onClick={() =>\n    write({\n' +
    '      [GUIDE_FILTER_KEYS.modelled]: filters.modelledOnly ? null : "1",\n' +
    "    })\n  }\n" +
    '  className={`… ${facets.modelled === 0 ? "opacity-50" : ""}`}\n>';
  const nestedTags = jsxOpenTags(withNestedObject, ["button"]);
  assert.equal(nestedTags.length, 1, "a nested object literal must not end the tag");
  assert.ok(
    BARE_OPACITY.test(nestedTags[0].text),
    "the second guide chip must be caught too",
  );

  // And the boundary in the other direction: the tag really does END at its
  // own `>`, so a dimmed element that is NOT this button must not be swept in.
  const twoElements =
    '<button type="button" onClick={() => go()} className="rounded">go</button>' +
    '<span className="opacity-50">dimmed text, not a control</span>';
  const [first] = jsxOpenTags(twoElements, ["button"]);
  assert.ok(
    !BARE_OPACITY.test(first.text),
    "the scan must stop at the button's own `>`, not run on into a sibling",
  );

  // The near-misses, all real shapes from this tree, each excluded by exactly
  // one character of the pattern — which is the case a bite test has to carry.
  assert.ok(
    !BARE_OPACITY.test('className="… focus-visible:focus-ring disabled:opacity-50"'),
    "disabled:opacity is the correct convention and must not fire",
  );
  assert.ok(
    !BARE_OPACITY.test('className="… transition-opacity hover:opacity-90"'),
    "a hover state is not a resting colour",
  );
  assert.ok(
    !BARE_OPACITY.test('className="… group-hover:opacity-100"'),
    "a group variant is a state too",
  );
  // The boundary case: `opacity-100` is not a dimming, and it differs from
  // `opacity-10` by one trailing character. A pattern that cannot tell them
  // apart would fire on every full-opacity override in the tree.
  assert.ok(!BARE_OPACITY.test('className="opacity-100"'), "full opacity is not dimming");
  assert.ok(BARE_OPACITY.test('className="opacity-10"'), "and 10 still is");
});

// ── Validators point at a vocabulary; they never restate one ────────────────
//
// The same root cause as `opportunity-vocab`, one layer out. A `z.enum` taking
// a literal array is a second declaration of a vocabulary that already exists,
// and the compiler cannot tell it has fallen behind — a Zod enum is checked
// for WRONG members and never for MISSING ones, exactly like a `T[]` literal.
//
// **This had already broken the product, and the repair was a comment.** The
// intake schema's destinations enum was missing `"AE"`, so a student who
// selected the United Arab Emirates could not save their intake at all. It was
// fixed by adding the string and writing `// Keep in sync with DestinationCode`
// above it. Two more restatements were sitting in the same file when this was
// written — the eight faculty values and the five curricula — each one an
// option the picker offers and the save would refuse.
//
// The rule is narrow on purpose: **a validator must take an identifier.** That
// is checkable in one regex, it has exactly one legitimate exception, and it
// catches the defect at the moment somebody types it.

/** `z.enum([` — a validator declaring its own vocabulary inline. */
const INLINE_ENUM = /z\.enum\(\s*\[/g;

test("a validator points at a vocabulary rather than restating one", () => {
  // `lib/ai/schema.ts` is the exception, and it is a real one: it validates the
  // MODEL's reply, so those unions have no existence anywhere else in the
  // codebase — the schema IS their canonical declaration. Everything else
  // validates a vocabulary some registry already owns.
  const allowed = new Set([
    "lib/ai/schema.ts",
  ]);
  // Two-member unions are exempt. `"local" | "global"`, `"predicted" |
  // "achieved": both members are always written together, there is nothing for
  // a third to be missing from, and naming them would add indirection without
  // adding a guarantee. The defect needs a list long enough to fall behind.
  const offenders: string[] = [];
  for (const file of projectSources()) {
    const rel = path.relative(process.cwd(), file).split(path.sep).join("/");
    if (allowed.has(rel)) continue;
    const body = stripComments(readFileSync(file, "utf8"));
    for (const m of body.matchAll(INLINE_ENUM)) {
      const tail = body.slice(m.index, m.index + 600);
      const close = tail.indexOf("]");
      if (close < 0) continue;
      const members = tail.slice(0, close).match(/"[^"]+"/g) ?? [];
      if (members.length > 2) {
        offenders.push(`${rel} — z.enum([${members.slice(0, 4).join(", ")}…]) declares ${members.length} members inline`);
      }
    }
  }
  assert.deepEqual(
    offenders,
    [],
    `a validator is restating a vocabulary instead of importing it:\n${offenders.join("\n")}`,
  );
});

test("the inline-validator guard actually bites", () => {
  // The exact three lines that were in the intake schema, one of which had
  // already cost a student their save.
  const asItShipped = [
    'destinations: z.array(z.enum(["US", "IT", "HK", "AE", "KR", "CN", "CA"]))',
    'faculties: z.array(z.enum(["engineering", "computer_science", "business_economics"]))',
    'curriculum: z.enum(["IB", "A-Level", "national", "US-GPA", "other"], {',
  ];
  for (const line of asItShipped) {
    const hits = [...stripComments(line).matchAll(INLINE_ENUM)];
    assert.equal(hits.length, 1, `not recognised as an inline enum: ${line}`);
  }

  // And the shapes it must leave alone.
  assert.equal(
    [...stripComments('level: z.enum(COMPETITION_LEVELS),').matchAll(INLINE_ENUM)].length,
    0,
    "an identifier is the whole point of the rule",
  );
  assert.equal(
    [...stripComments('fields: z.array(z.enum(FACULTY_VALUES as [FacultyValue, ...FacultyValue[]]))').matchAll(INLINE_ENUM)].length,
    0,
    "a tuple CAST on an identifier is still an identifier",
  );
});

test("every rubric factor has a place in the display order", () => {
  // `FACTOR_ORDER` is deliberately a SUPERSET — it carries the country boards'
  // own factors alongside the US rubric's — so it is not a restatement and
  // `orderIndex` sends anything unknown to the end on purpose. What that
  // graceful fallback also hides is a US factor going missing: it would sort
  // last on the main board, silently, looking like a ranking decision.
  const missing = RUBRIC.map((f) => f.key).filter(
    (k) => !(FACTOR_ORDER as readonly string[]).includes(k),
  );
  assert.deepEqual(
    missing,
    [],
    `these rubric factors have no position in FACTOR_ORDER and would sort last: ${missing.join(", ")}`,
  );
});

test("nothing outside the plan hook loads the catalog directly", () => {
  // A direct dynamic import is not wrong in itself — it is how the hook does
  // it — but each new one is a component deciding for itself WHEN the load
  // starts, and four out of four decided the same wrong thing.
  const allowed = new Set([
    // The hook. Both loaders live here.
    "lib/data/use-opportunity-plan.ts",
    // Server-only, and already a single place: the planner's loader is the
    // one spot the planner touches key-dates or roadmap at all.
    "lib/planner/load.ts",
    // A server action, which is an RPC endpoint rather than a rendered
    // surface; there is no render cycle here to wait for.
    "app/planner/maps/actions.ts",
    // Server-only too. `partnerOpportunities` reaches for the tier/category
    // resolvers so the partner console does not reimplement them, and it is
    // lazy so the console's client bundle never carries the catalog. Same
    // reasoning as the planner loader: nothing here renders, so nothing waits.
    "lib/partners/queries.ts",
  ]);
  const offenders: string[] = [];
  for (const file of projectSources()) {
    const rel = path.relative(process.cwd(), file).split(path.sep).join("/");
    if (allowed.has(rel)) continue;
    const body = stripComments(readFileSync(file, "utf8"));
    if (DYNAMIC_CATALOG_IMPORT.test(body)) offenders.push(rel);
  }
  assert.deepEqual(
    offenders,
    [],
    `these load the catalog themselves instead of through use-opportunity-plan:\n${offenders.join("\n")}`,
  );
});

test("no component resolves the visitor's date for itself", () => {
  // Five did, each with its own comment giving the same hydration reason. The
  // duplication was not the cost — the cost was that four of them then wired
  // the catalog load behind it, so fixing one taught the others nothing.
  const offenders: string[] = [];
  for (const file of projectSources()) {
    const rel = path.relative(process.cwd(), file).split(path.sep).join("/");
    if (rel === "lib/data/use-opportunity-plan.ts") continue;
    const body = stripComments(readFileSync(file, "utf8"));
    if (HAND_ROLLED_TODAY.test(body)) offenders.push(rel);
  }
  assert.deepEqual(
    offenders,
    [],
    `these resolve "today" by hand — call useToday() instead:\n${offenders.join("\n")}`,
  );
});

test("the catalog-load guards actually bite", () => {
  // Both guards are collect-and-assert-empty, which fails OPEN: a pattern
  // that matches nothing collects nothing and goes green. So each is shown
  // catching the exact line that shipped, and ignoring the near-misses.
  //
  // They read DYNAMIC_CATALOG_IMPORT and HAND_ROLLED_TODAY rather than their
  // own copies, which is the load-bearing part — a bite test written against
  // a copy proves the copy works, and copies drift.
  assert.match(
    stripComments(
      'useEffect(() => { import("@/lib/data/key-dates").then((m) => setPlan(m.x())); }, [today]);',
    ),
    DYNAMIC_CATALOG_IMPORT,
  );
  assert.match(
    stripComments('import("@/lib/data/roadmap").then((m) => setRoadmap(m.buildRoadmap({})));'),
    DYNAMIC_CATALOG_IMPORT,
  );
  assert.match(
    stripComments("useEffect(() => setToday(new Date()), []);"),
    HAND_ROLLED_TODAY,
  );

  // The near-misses, all real lines from this tree.
  assert.doesNotMatch(
    stripComments('import type { Competition } from "@/lib/data/key-dates";'),
    DYNAMIC_CATALOG_IMPORT,
    "a type-only import carries no runtime cost and is not a load",
  );
  assert.doesNotMatch(
    stripComments('const { COMPETITIONS } = await import("./competitions-data");'),
    DYNAMIC_CATALOG_IMPORT,
    "another module is not the catalog",
  );
  assert.doesNotMatch(
    stripComments("const today = new Date().toISOString().slice(0, 10);"),
    HAND_ROLLED_TODAY,
    "a server-side ISO date is not the client hydration pattern",
  );
  assert.doesNotMatch(
    stripComments("//     useEffect(() => setToday(new Date()), []);"),
    HAND_ROLLED_TODAY,
    "the hook's own header quotes the shape it replaced; documentation is not a violation",
  );
});

test("opportunity-vocab imports nothing, so it can never become heavy", () => {
  // The module's whole value is that a client bundle, a server action and an
  // edge function can all reach the SAME array. One `import` of a registry here
  // would put that registry into every one of them — including the two Open
  // Graph routes, which are edge functions capped at 1 MB compressed and have
  // already blown that cap once.
  const src = readFileSync(
    path.join(process.cwd(), "lib/data/opportunity-vocab.ts"),
    "utf8",
  );
  // Match the DEPENDENCY EDGE, not the keyword `import`. Until 2026-08-25 this
  // read `/^\s*import\b[^;]*;/gm`, which is blind to `export { X } from "y"`
  // and `export * from "y"` — both of which pull the module in at runtime in
  // exactly the same way. A re-export is not a hypothetical here: `key-dates`
  // re-exports ten names from this very file, so the idiom is one line away,
  // and `export { HEAVY } from "./world"` would have kept this test green while
  // shipping `world.ts` into every client bundle and both 1 MB edge functions.
  const body = stripComments(src);
  const edges = [
    ...(body.match(/^[^\n]*\bfrom\s*["'][^"']+["']/gm) ?? []),
    ...(body.match(/^\s*import\s+["'][^"']+["']\s*;?/gm) ?? []), // bare `import "x";`
  ].map((s) => s.trim());
  assert.deepEqual(
    edges,
    [],
    `opportunity-vocab must reach nothing; it now depends on:\n${edges.join("\n")}`,
  );
});

test("the imports-nothing guard actually bites — on an import AND a re-export", () => {
  // Written because the first version only knew the word `import`, and a
  // re-export creates the identical runtime edge. Both forms must be caught,
  // and the module's own real content must not be.
  const scan = (s: string) =>
    [
      ...(stripComments(s).match(/^[^\n]*\bfrom\s*["'][^"']+["']/gm) ?? []),
      ...(stripComments(s).match(/^\s*import\s+["'][^"']+["']\s*;?/gm) ?? []),
    ].map((x) => x.trim());

  assert.equal(scan('import { HUBS } from "./world";').length, 1, "a plain import");
  assert.equal(scan('import type { X } from "./world";').length, 1, "even a type import");
  assert.equal(scan('export { HUBS } from "./world";').length, 1, "a named re-export");
  assert.equal(scan('export * from "./world";').length, 1, "a star re-export");
  assert.equal(scan('import "./side-effect";').length, 1, "a bare side-effect import");

  // The near-misses: this module is arrays and label maps, and the word "from"
  // appears in its prose and could appear in a value. Neither is an edge.
  assert.deepEqual(scan('// derived from the canonical array'), [], "a comment is not an edge");
  assert.deepEqual(
    scan('export const COST_LABEL = { free: "Free from the organiser" } as const;'),
    [],
    "the word from inside a string is not an edge",
  );
});
// ── Majors ───────────────────────────────────────────────────────────────────
// The layer that was missing from the chain entirely: a student could learn what
// work exists and where it lives, and never find out what you actually apply to.
// Held to the same rules as every other prose registry here.

test("every major has a unique id, a name, and belongs to a field", () => {
  const ids = new Set<string>();
  // The floor rises with each wave: 12 after A1, 24 after A1b, 36 after A1c,
  // 44 after A1d. Raise this literal in the wave that earns it — a floor that
  // stays at 12 stops being a floor.
  assert.ok(MAJORS.length >= 44, "the majors layer is too thin to be a step");
  for (const m of MAJORS) {
    assert.ok(!ids.has(m.id), `duplicate major id ${m.id}`);
    ids.add(m.id);
    assert.match(m.id, /^[a-z0-9][a-z0-9-]{0,63}$/, `${m.id} is not a slug`);
    assert.ok(m.name.trim().length > 2, `${m.id} has no name`);
    assert.ok(m.fields.length > 0, `${m.id} belongs to no field`);
  }
});

test("every major says what it actually is, what the first year is, and what school subjects it needs", () => {
  for (const m of MAJORS) {
    assert.ok(
      m.whatItActuallyIs.trim().length > 60,
      `${m.id} does not say what it actually is`,
    );
    // The field nobody writes down, and the reason half of first years leave.
    assert.ok(
      m.firstYear.trim().length > 120,
      `${m.id} does not say what the first year is really made of`,
    );
    assert.ok(
      m.schoolSubjects.length > 0,
      `${m.id} names nothing a student could start today`,
    );
  }
});

test("every major states its catch and who should look elsewhere", () => {
  const catches = new Set<string>();
  const avoid = new Set<string>();
  for (const m of MAJORS) {
    assert.ok(
      m.catch.trim().length > 100,
      `${m.id} has no catch — that is a brochure`,
    );
    assert.ok(
      m.suitsYou.trim().length > 100,
      `${m.id} does not say who it suits`,
    );
    assert.ok(
      m.notForYou.trim().length > 140,
      `${m.id} does not name who should look somewhere else`,
    );
    catches.add(m.catch.trim());
    avoid.add(m.notForYou.trim());
  }
  assert.equal(catches.size, MAJORS.length, "two majors share one catch");
  assert.equal(avoid.size, MAJORS.length, "two majors warn off the same person");
});

test("no major quotes a price, a salary or a ranking", () => {
  const forbidden =
    /(\$|€|£|₸|\bUSD\b|\bEUR\b|\bper month\b|\bper year\b|\brank(ed|ing)? (?:#|no\.?\s?)\d|\btop \d+\b|\bbest\b|\bleading\b|\bprestigious\b)/i;
  for (const m of MAJORS) {
    for (const [field, text] of Object.entries(m)) {
      if (typeof text !== "string") continue;
      assert.ok(
        !forbidden.test(text),
        `${m.id}.${field} quotes a figure, ranking or superlative: ${text.slice(0, 80)}`,
      );
    }
  }
});

test("no major carries a URL — the catalog owns links", () => {
  const src = readFileSync(
    path.join(process.cwd(), "lib/data/majors.ts"),
    "utf8",
  );
  assert.ok(
    !/https?:\/\//.test(stripComments(src)),
    "majors.ts contains a URL; test:links only knows about the catalog",
  );
});

test("every major leads to at least one area of work that exists", () => {
  const areaSlugs = new Set(
    allCareerAreas().map(({ area }) => areaSlug(area.title)),
  );
  for (const m of MAJORS) {
    assert.ok(m.leadsTo.length > 0, `${m.id} leads to no work at all`);
    for (const slug of m.leadsTo) {
      assert.ok(
        areaSlugs.has(slug),
        `${m.id} points at a missing area of work: ${slug}`,
      );
    }
  }
});

test("every area of work is reachable from at least one major", () => {
  // The reverse edge, and the one that actually protects a student: a kind of
  // work nothing leads to is a page whose reader has nowhere to go next. The
  // student most likely to hit it is the one with the least common interest —
  // exactly who this layer exists for.
  const reached = new Set<string>();
  for (const m of MAJORS) for (const slug of m.leadsTo) reached.add(slug);
  for (const { area } of allCareerAreas()) {
    const slug = areaSlug(area.title);
    assert.ok(
      reached.has(slug),
      `no subject leads to ${slug} — a student reaches a dead end there`,
    );
  }
});

test("majors: empty fields in ⇒ every major; a chosen field never widens it", () => {
  assert.equal(majorsForFaculties([]).length, MAJORS.length);
  const cs = majorsForFaculties(["computer_science"]);
  assert.ok(cs.length > 0 && cs.length <= MAJORS.length);
  assert.ok(cs.every((m) => m.fields.includes("computer_science")));
});

test("majorById and majorsForArea resolve, and unknown ids return nothing", () => {
  assert.equal(majorById(MAJORS[0].id)?.id, MAJORS[0].id);
  assert.equal(majorById("no-such-major"), undefined);
  const slug = MAJORS[0].leadsTo[0];
  assert.ok(majorsForArea(slug).some((m) => m.id === MAJORS[0].id));
  assert.deepEqual(majorsForArea("no-such-area"), []);
});

test("majorsByField groups in the order given and drops empty fields", () => {
  const groups = majorsByField(["computer_science", "law"]);
  assert.equal(groups[0].faculty, "computer_science");
  assert.ok(groups.every((g) => g.majors.length > 0));
});

// Sentence case, not Title Case. The product writes every label, heading and
// button in sentence case, and this registry is written by four separate passes
// — which is exactly how one of them drifted into "Environmental Science" and
// "Public Health" while every other entry said "Computer science". Nobody
// notices one entry; a reader going down a list of forty-four notices the list.
//
// The rule is expressed as "at most one capitalised word, and it is the first",
// because a genuine proper noun inside a subject name is legitimate — "English
// literature", "American studies". Those go in PROPER_NOUNS rather than
// weakening the check.
const PROPER_NOUNS = new Set<string>([]);

test("every major's name is sentence case", () => {
  for (const m of MAJORS) {
    const [first, ...rest] = m.name.split(" ");
    assert.match(first, /^[A-Z]/, `${m.id} does not start with a capital`);
    for (const word of rest) {
      assert.ok(
        !/^[A-Z]/.test(word) || PROPER_NOUNS.has(word),
        `${m.id} is Title Case ("${m.name}") — the product writes sentence case`,
      );
    }
  }
});

// ── Majors as a guide step, and a thing the plan can hold ───────────────────
test("the guide's steps are 1..N with no gaps, and majors sits between work and countries", () => {
  const steps = GUIDE_SECTIONS.map((s) => s.step);
  assert.deepEqual(
    steps,
    Array.from({ length: GUIDE_SECTIONS.length }, (_, i) => i + 1),
    "the guide's step numbers have a gap or a duplicate",
  );
  const order = GUIDE_SECTIONS.map((s) => s.id);
  assert.ok(
    order.indexOf("work") < order.indexOf("majors"),
    "you cannot choose what to study before knowing what the work is",
  );
  assert.ok(
    order.indexOf("majors") < order.indexOf("places"),
    "the major is what you apply WITH — it comes before the country",
  );
});

test("every pick kind has a guide step, and every guide step can be picked", () => {
  for (const meta of PICK_KINDS) {
    const section = GUIDE_SECTIONS.find((s) => s.id === meta.section);
    assert.ok(section, `pick kind ${meta.kind} names a missing guide step`);
    assert.equal(
      meta.step,
      section!.step,
      `pick kind ${meta.kind} disagrees with the guide about which step it is`,
    );
  }
  for (const section of GUIDE_SECTIONS) {
    assert.ok(
      PICK_KINDS.some((k) => k.section === section.id),
      `guide step ${section.id} produces nothing the plan can hold`,
    );
  }
});

test("pickHref can only produce an in-app guide path, including for a major", () => {
  assert.equal(
    pickHref("major", "computer-science"),
    "/guide/majors/computer-science",
  );
  for (const meta of PICK_KINDS) {
    const href = pickHref(meta.kind, "x");
    assert.ok(
      href.startsWith("/guide/"),
      `${meta.kind} can produce a path outside the guide: ${href}`,
    );
  }
});

test("countPicks counts a major", () => {
  const counts = countPicks([
    {
      ref: "major:computer-science",
      label: "Computer science",
      href: "/guide/majors/computer-science",
    },
    { ref: "work:data-and-ai", label: "Data & AI", href: "/guide/work/data-and-ai" },
  ]);
  assert.equal(counts.major, 1);
  assert.equal(counts.work, 1);
  assert.equal(counts.place, 0);
});

test("the spine carries the study step, and every subject on it is under that field", () => {
  // The chain used to run work -> country, skipping the row a student fills in
  // on a form. This is the join that closes it.
  for (const faculty of FACULTY_VALUES) {
    const spine = spineForFaculty(faculty);
    assert.ok(
      spine.majors.length > 0,
      `${faculty} has no subject to study — the chain breaks at step 2`,
    );
    assert.ok(
      spine.majors.every((m) => m.fields.includes(faculty)),
      `${faculty}'s chain lists a subject from another field`,
    );
  }
});

test("the sitemap lists the majors step and every subject page", () => {
  const urls = new Set(sitemapRoutes().map((e) => e.url));
  assert.ok(
    urls.has(`${CANONICAL_URL}/guide/majors`),
    "the majors step is not advertised to a crawler",
  );
  for (const m of MAJORS) {
    assert.ok(
      urls.has(`${CANONICAL_URL}/guide/majors/${m.id}`),
      `${m.id} has a page the sitemap does not list`,
    );
  }
});

// ── The reaction engine ──────────────────────────────────────────────────────
// How the thread learns who a student is without asking them the question they
// came here unable to answer. Pure, fixed weights, same shape as the interest
// quiz — and, unlike a personality test, it only ever reports what they picked.

test("every beat is concrete, has a plainer version, and names no profession", () => {
  const ids = new Set<string>();
  assert.ok(BEATS.length >= 20, "too few beats to separate anything");
  for (const b of BEATS) {
    assert.ok(!ids.has(b.id), `duplicate beat id ${b.id}`);
    ids.add(b.id);
    // The old band was 60–260, which never bit: every beat landed at a median
    // of 154 characters and 29 words, and two of those side by side in a narrow
    // rail is twenty lines of text for one question. The spec asked for 15–25
    // words; the test has to be the thing that holds it to that.
    // `\s`, not `s`. This read `/s+/` until 2026-08-19, which splits on runs of
    // the LETTER s: it reported a maximum of 9 "words" across all 24 beats when
    // the real maximum is 23, so the ≤24 rule CLAUDE.md calls test-enforced was
    // enforcing nothing and would have passed a sixty-word beat. Third guard in
    // this repo to lose its backslashes and fail open. The content happened to
    // comply, which is luck, not coverage.
    const words = b.text.trim().split(/\s+/).length;
    assert.ok(
      b.text.trim().length > 50 && b.text.trim().length <= 135,
      `${b.id} is ${b.text.trim().length} chars — a beat is one moment, not a paragraph`,
    );
    assert.ok(
      words <= 24,
      `${b.id} is ${words} words; a student reads two of these at once`,
    );
    // The button nobody builds. A student who cannot parse the sentence must
    // have somewhere to go that is not a wrong answer.
    assert.ok(
      b.plainer.trim().length > 40,
      `${b.id} has no plainer version for "I don't get it"`,
    );
    assert.ok(
      Object.keys(b.axes).length > 0,
      `${b.id} measures nothing`,
    );
  }
});

test("no beat names a job title — that is the vocabulary the student does not have", () => {
  const titles = /\b(engineer|lawyer|doctor|analyst|consultant|banker|designer|scientist|developer|manager|architect)\b/i;
  for (const b of BEATS) {
    assert.ok(
      !titles.test(b.text),
      `${b.id} names a profession: ${b.text.slice(0, 60)}`,
    );
  }
});

test("every pair is two real, distinct beats, and no beat appears in two pairs", () => {
  const byId = new Map(BEATS.map((b) => [b.id, b]));
  const seen = new Set<string>();
  assert.ok(BEAT_PAIRS.length >= 8, "fewer than eight pairs is not a sequence");
  for (const [a, b] of BEAT_PAIRS) {
    assert.ok(byId.has(a), `pair names a missing beat: ${a}`);
    assert.ok(byId.has(b), `pair names a missing beat: ${b}`);
    assert.notEqual(a, b, "a pair asks the same thing twice");
    assert.ok(!seen.has(a) && !seen.has(b), `beat reused across pairs: ${a}/${b}`);
    seen.add(a);
    seen.add(b);
  }
});

test("nextPair walks the sequence and returns null when it is finished", () => {
  assert.deepEqual(nextPair({})?.map((b) => b.id), BEAT_PAIRS[0]);
  const first: BeatAnswers = {
    [BEAT_PAIRS[0][0]]: "picked",
    [BEAT_PAIRS[0][1]]: "passed",
  };
  assert.deepEqual(nextPair(first)?.map((b) => b.id), BEAT_PAIRS[1]);
  const all: BeatAnswers = {};
  for (const [a, b] of BEAT_PAIRS) {
    all[a] = "picked";
    all[b] = "passed";
  }
  assert.equal(nextPair(all), null);
});

test("scoring: nothing in ⇒ nothing out, and unclear contributes no signal", () => {
  assert.deepEqual(scoreBeats({}), []);
  assert.deepEqual(topFieldsFromBeats({}), []);
  const unclearOnly: BeatAnswers = Object.fromEntries(
    BEATS.slice(0, 4).map((b) => [b.id, "unclear" as const]),
  );
  assert.deepEqual(
    scoreBeats(unclearOnly),
    [],
    "an answer of 'I don't get it' was counted as a preference",
  );
});

test("scoring: only what was PICKED counts, and the result is ordered", () => {
  const b = BEATS[0];
  const scored = scoreBeats({ [b.id]: "picked" });
  assert.ok(scored.length > 0, "picking a beat measured nothing");
  for (let i = 1; i < scored.length; i += 1) {
    assert.ok(scored[i - 1].score >= scored[i].score, "not ordered");
  }
  assert.deepEqual(
    scoreBeats({ [b.id]: "passed" }),
    [],
    "passing on something was counted as choosing it",
  );
});

test("pairsAnswered counts pairs, not beats, and ignores unclear-only pairs", () => {
  assert.equal(pairsAnswered({}), 0);
  const [a1, b1] = BEAT_PAIRS[0];
  assert.equal(pairsAnswered({ [a1]: "picked", [b1]: "passed" }), 1);
  assert.equal(
    pairsAnswered({ [a1]: "unclear", [b1]: "unclear" }),
    0,
    "a pair nobody understood was counted as answered",
  );
});

test("the observation waits for three pairs, then says something, and never types the student", () => {
  const answers: BeatAnswers = {};
  for (let i = 0; i < 2; i += 1) {
    answers[BEAT_PAIRS[i][0]] = "picked";
    answers[BEAT_PAIRS[i][1]] = "passed";
  }
  assert.equal(
    observationFromBeats(answers),
    null,
    "it spoke before it had grounds to",
  );
  answers[BEAT_PAIRS[2][0]] = "picked";
  answers[BEAT_PAIRS[2][1]] = "passed";
  const said = observationFromBeats(answers);
  assert.ok(said && said.length > 30, "three pairs in and it had nothing to say");
  // Rule 1 of the engine: observations, never types. A personality label is a
  // claim we cannot support, and this product does not assert what it does not
  // know.
  assert.ok(
    !/you are (an?|the) [A-Z]/.test(said!),
    `it typed the student instead of observing them: ${said}`,
  );
});

test("the beats measure every field and both ends of every axis", () => {
  // Coverage the count floors cannot express, and without it the engine can be
  // green and useless: a set of beats that only ever offers "result lands
  // today" measures nothing, because every student picks it and the scores
  // never separate. Both ends of each dichotomy have to be on offer, or the
  // choice carries no information.
  const seenFields = new Set<string>();
  const seenAxes = new Set<string>();
  for (const b of BEATS) {
    for (const f of Object.keys(b.fields)) seenFields.add(f);
    for (const a of Object.keys(b.axes)) seenAxes.add(a);
  }
  for (const f of FACULTY_VALUES) {
    assert.ok(
      seenFields.has(f),
      `no beat leans toward ${f} — a student in that direction learns nothing`,
    );
  }
  const DICHOTOMIES: [string, string][] = [
    ["result_today", "result_years"],
    ["with_people", "with_things"],
    ["inside_rules", "inside_fog"],
    ["making_new", "keeping_alive"],
    ["alone", "in_a_group"],
  ];
  for (const [a, b] of DICHOTOMIES) {
    assert.ok(seenAxes.has(a), `nothing measures ${a}`);
    assert.ok(
      seenAxes.has(b),
      `${b} is never on offer, so ${a} is not a choice — it is the only option`,
    );
  }
});

test("a pair pulls in different directions, or it is not a question", () => {
  // Two beats that lean the same way are a survey, not a choice: whichever the
  // student picks, the score moves the same direction and nothing was learned.
  const byId = new Map(BEATS.map((b) => [b.id, b]));
  for (const [leftId, rightId] of BEAT_PAIRS) {
    const left = byId.get(leftId)!;
    const right = byId.get(rightId)!;
    const leftAxes = new Set(Object.keys(left.axes));
    const rightAxes = Object.keys(right.axes);
    assert.ok(
      rightAxes.some((a) => !leftAxes.has(a)),
      `${leftId} / ${rightId} measure the same things — that pair asks nothing`,
    );
    const leftFields = new Set(Object.keys(left.fields));
    assert.ok(
      Object.keys(right.fields).some((f) => !leftFields.has(f)),
      `${leftId} / ${rightId} point at the same fields — that pair separates nobody`,
    );
  }
});

test("the reaction action's bounds reject anything the registry does not contain", () => {
  // A server action is a public HTTP endpoint, and these two are the whole
  // defence between an arbitrary POST and a row in beat_reactions. They live in
  // the registry rather than in the action so a test can reach them — a
  // "use server" module cannot be imported here.
  assert.ok(isKnownBeat(BEATS[0].id));
  assert.ok(!isKnownBeat("../../etc/passwd"));
  assert.ok(!isKnownBeat(""));
  assert.ok(isBeatReaction("picked"));
  assert.ok(isBeatReaction("unclear"));
  assert.ok(!isBeatReaction("PICKED"), "case was accepted where it should not be");
  assert.ok(!isBeatReaction("loved"));
  assert.ok(!isBeatReaction(null));
  assert.ok(!isBeatReaction(7));
});

// ── The thread's stations ────────────────────────────────────────────────────
const NOWHERE: StationFacts = {
  pairsAnswered: 0,
  picks: { work: 0, major: 0, place: 0, hub: 0, route: 0 },
  tried: 0,
  committed: 0,
  started: 0,
  overdue: 0,
};

test("stations are numbered 1..7 with no gaps and no duplicates", () => {
  assert.equal(STATIONS.length, 7);
  assert.deepEqual(
    STATIONS.map((s) => s.index),
    [1, 2, 3, 4, 5, 6, 7],
  );
  assert.equal(new Set(STATIONS.map((s) => s.id)).size, 7);
});

test("a student who has done nothing is at station one", () => {
  const at = station(NOWHERE);
  assert.equal(at.id, "sense");
  assert.equal(at.index, 1);
  assert.equal(at.total, 7);
});

test("the stations advance in order as real facts accumulate", () => {
  const steps: [Partial<StationFacts>, string][] = [
    [{ pairsAnswered: 3 }, "look"],
    [
      {
        pairsAnswered: 3,
        picks: { work: 1, major: 0, place: 0, hub: 0, route: 0 },
      },
      "try",
    ],
    [
      {
        pairsAnswered: 3,
        picks: { work: 1, major: 0, place: 0, hub: 0, route: 0 },
        tried: 1,
      },
      "study",
    ],
    [
      {
        pairsAnswered: 3,
        picks: { work: 1, major: 1, place: 0, hub: 0, route: 0 },
        tried: 1,
      },
      "where",
    ],
    [
      {
        pairsAnswered: 3,
        picks: { work: 1, major: 1, place: 1, hub: 0, route: 0 },
        tried: 1,
      },
      "act",
    ],
    [
      {
        pairsAnswered: 3,
        picks: { work: 1, major: 1, place: 1, hub: 0, route: 0 },
        tried: 1,
        committed: 1,
        started: 1,
      },
      "keep",
    ],
  ];
  for (const [patch, expected] of steps) {
    assert.equal(
      station({ ...NOWHERE, ...patch }).id,
      expected,
      `expected ${expected} for ${JSON.stringify(patch)}`,
    );
  }
});

test("the station is where they ARE, not the furthest thing they have touched", () => {
  // Somebody who commits to an olympiad before answering a single pair is still
  // at the beginning. Taking the maximum instead would tell a lost student they
  // were nearly finished, which is the opposite of accompaniment.
  assert.equal(station({ ...NOWHERE, committed: 3, started: 3 }).id, "sense");
});

test("an overdue thing does not move the station", () => {
  // Urgency is the MOVE's business — it outranks everything there. A progress
  // figure that fell because a deadline lapsed would read as punishment, and
  // this product does not treat not-entering as a verdict on a person.
  assert.equal(station({ ...NOWHERE, overdue: 2 }).id, "sense");
});

test("knowing the work but never trying it sends you to try it", () => {
  const move = nextMove(
    moveInput({ picks: { ...NO_PICKS, work: 1 }, tried: 0 }),
  );
  assert.equal(move.id, "try-it");
  assert.ok(move.why.trim().length > 40, "a move without a reason is an order");
});

test("having tried it, the next question is what you'd study", () => {
  const move = nextMove(
    moveInput({
      picks: { ...NO_PICKS, work: 1 },
      tried: 1,
      reachableMajors: 4,
    }),
  );
  assert.equal(move.id, "pick-major");
  assert.match(move.action.href, /^\/guide\/majors/);
  assert.match(move.why, /4 subjects/);
});

test("the study step comes before the country step", () => {
  // The major is what you apply WITH, so it cannot come after the place you
  // apply TO. The guide's own order shipped backwards once for cities and
  // countries; this is the same mistake one layer up.
  const move = nextMove(
    moveInput({ picks: { ...NO_PICKS, work: 1 }, tried: 1 }),
  );
  assert.notEqual(move.id, "pick-place");
});

test("with no subjects to name, the study move drops the number rather than guessing", () => {
  // Rule 3 of the ladder: it never invents a figure. Where we have nothing
  // honest to say, the copy is phrased without one.
  const move = nextMove(
    moveInput({
      picks: { ...NO_PICKS, work: 1 },
      tried: 1,
      reachableMajors: 0,
    }),
  );
  assert.equal(move.id, "pick-major");
  assert.ok(!/\b0\b/.test(move.why), `it printed a zero: ${move.why}`);
});

test("an overdue thing still outranks both new branches", () => {
  const move = nextMove(
    moveInput({ overdue: 1, picks: { ...NO_PICKS, work: 1 }, tried: 0 }),
  );
  assert.equal(move.id, "overdue");
  assert.equal(move.tone, "urgent");
});

test("the companion says nothing twice in a row as a student advances", () => {
  // A companion that repeats itself reads as broken, and this is the only way
  // to catch it: walk the ladder the way a real student walks it and compare
  // each utterance with the one before. Every step below is a fact changing,
  // so every step must produce something different to say.
  const said: string[] = [];
  let facts: StationFacts = {
    pairsAnswered: 3,
    picks: { work: 0, major: 0, place: 0, hub: 0, route: 0 },
    tried: 0,
    committed: 0,
    started: 0,
    overdue: 0,
  };
  const advance: (() => void)[] = [
    () => {
      facts = { ...facts, picks: { ...facts.picks, work: 1 } };
    },
    () => {
      facts = { ...facts, tried: 1 };
    },
    () => {
      facts = { ...facts, picks: { ...facts.picks, major: 1 } };
    },
    () => {
      facts = { ...facts, picks: { ...facts.picks, place: 1 } };
    },
    () => {
      facts = { ...facts, committed: 1, started: 1 };
    },
  ];

  for (const step of advance) {
    const move = nextMove(
      moveInput({
        picks: facts.picks,
        tried: facts.tried,
        committed: facts.committed,
        started: facts.started,
      }),
    );
    said.push(`${station(facts).id}|${move.headline}`);
    step();
  }
  // The state after the last advance counts too — it is what the student sees
  // once everything is moving, and "nothing to say" there would be a companion
  // that goes quiet exactly when it has succeeded.
  const last = nextMove(
    moveInput({
      picks: facts.picks,
      tried: facts.tried,
      committed: facts.committed,
      started: facts.started,
    }),
  );
  said.push(`${station(facts).id}|${last.headline}`);

  for (let i = 1; i < said.length; i += 1) {
    assert.notEqual(
      said[i],
      said[i - 1],
      `the companion said the same thing twice in a row: ${said[i]}`,
    );
  }
  assert.equal(new Set(said).size, said.length, "the walk repeats itself");
});

test("the companion never drags a prose registry into a client bundle", () => {
  // key-dates builds a map over ~2,700 catalog rows at module load; careers,
  // world, study-destinations and spine are thousands of lines of prose. Any
  // runtime import of one of them from a client component ships it to every
  // route the companion renders on — which, by design, is every route in the
  // student's product. This is the repository's most expensive recurring
  // mistake and the companion is the widest possible surface for it.
  const banned = [
    "@/lib/data/key-dates",
    "@/lib/data/careers",
    "@/lib/data/world",
    "@/lib/data/study-destinations",
    "@/lib/data/spine",
    "@/lib/data/competitions-data",
    "@/lib/data/majors",
  ];
  const files = [
    "components/companion/Companion.tsx",
    "components/companion/BeatPair.tsx",
  ];
  for (const file of files) {
    const full = path.join(process.cwd(), file);
    // Asserted, not skipped. A guard that quietly passes for a file that is not
    // there guards nothing — and would go green again the day someone deletes
    // the component it protects.
    assert.ok(
      existsSync(full),
      `${file} is missing — this guard has no subject`,
    );
    const src = stripComments(readFileSync(full, "utf8"));
    for (const mod of banned) {
      assert.ok(
        !runtimeImportOf(mod).test(src),
        `${file} imports ${mod} at runtime — that ships it to every page`,
      );
    }
  }
});

/**
 * Matches a RUNTIME import of one module. `import type` is erased by the
 * compiler and is free, so it must not match.
 *
 * Assembled from RegExp LITERALS via `.source`, never from a template string.
 * The first version of this was written as a template literal, where `\s` is
 * the letter s and `\b` is a backspace — it compiled to
 * `imports+(?!type\b)[^;]*froms+…`, matched nothing, and therefore passed
 * against a clean codebase exactly as it would have passed against the bug it
 * exists to catch. Using `.source` hands the escaping to the JS parser, which
 * cannot get it wrong.
 */
function runtimeImportOf(mod: string): RegExp {
  const escaped = mod.replace(/[.*+?^${}()|[\]\\/-]/g, "\\$&");
  return new RegExp(
    /import\s+(?!type\b)[^;]*from\s+["']/.source + escaped + /["']/.source,
  );
}

test("that bundle guard actually bites — a regex matching nothing is not a guard", () => {
  // A guard that matches nothing is indistinguishable from a codebase with no
  // violations, and this one really did match nothing for a while. So: prove it
  // fires on a known-bad line and stays quiet on a type-only import.
  const guard = runtimeImportOf("@/lib/data/careers");
  assert.ok(
    guard.test('import { allCareerAreas } from "@/lib/data/careers";'),
    "the guard does not catch a real runtime import — it asserts nothing",
  );
  assert.ok(
    guard.test('import { areaSlug } from "@/lib/data/careers"'),
    "the guard needs a trailing semicolon to fire",
  );
  assert.ok(
    !guard.test('import type { CareerArea } from "@/lib/data/careers";'),
    "the guard rejects a type-only import, which is erased and costs nothing",
  );
  assert.ok(
    !guard.test('import { HUBS } from "@/lib/data/world";'),
    "the guard fires on a module it was not asked about",
  );
});

test("a kind in the URL resolves to a real tab, and rubbish narrows nothing", () => {
  // `/opportunities?kind=simulation` is where the thread's "try it" move points.
  // Before this the page ignored the query and landed on "All", so the two-clicks
  // -to-a-simulation promise was not delivered.
  assert.equal(categoryFromParam("simulation"), "simulation");
  assert.equal(categoryFromParam("all"), "all");
  assert.equal(categoryFromParam(["competition"]), "competition");
  assert.equal(categoryFromParam("not-a-kind"), null);
  assert.equal(categoryFromParam(undefined), null);
  assert.equal(categoryFromParam(7), null);
  for (const tab of CATEGORY_TABS) {
    assert.equal(categoryFromParam(tab.key), tab.key, `${tab.key} is unreachable from the URL`);
  }
});

test("the observation speaks on the pair that earned it, then goes quiet", () => {
  // "Never repeats itself" is broken in the most tiring way available by saying
  // ONE thing without stopping: the first version returned a fixed string per
  // axis forever, so the same paragraph followed the reader across all 88 guide
  // pages, the catalog and the plan.
  const answers: BeatAnswers = {};
  const answerPair = (i: number) => {
    answers[BEAT_PAIRS[i][0]] = "picked";
    answers[BEAT_PAIRS[i][1]] = "passed";
  };
  answerPair(0);
  answerPair(1);
  assert.equal(observationFromBeats(answers), null, "it spoke too early");
  answerPair(2);
  assert.ok(observationFromBeats(answers), "three pairs in and it said nothing");
  answerPair(3);
  assert.equal(
    observationFromBeats(answers),
    null,
    "it is still standing there repeating itself a pair later",
  );
  answerPair(4);
  answerPair(5);
  assert.ok(
    observationFromBeats(answers),
    "it never speaks again after the first time",
  );
});

test("a subject alone is not an empty plan", () => {
  // The majors step is reachable directly, so a student can claim a subject
  // before anything else. Telling them "your plan is empty" while the plan
  // renders "Subjects you'd study — Computer science" underneath is the product
  // contradicting itself on one screen.
  const move = nextMove(
    moveInput({ picks: { ...NO_PICKS, major: 1 }, tried: 0 }),
  );
  assert.notEqual(move.id, "cold-start");
});

test("committing to things and starting none reaches 'start', not 'try it'", () => {
  // Both callers derive `tried` from the same started-intent count, so without
  // the committed check the try branch swallowed the one below it and a student
  // who chose three things and began none was told "you haven't done any of it".
  const move = nextMove(
    moveInput({
      picks: { ...NO_PICKS, work: 1, major: 1, place: 1, hub: 1 },
      tried: 0,
      committed: 3,
      started: 0,
    }),
  );
  assert.equal(move.id, "start");
});

test("'I don't get it' keeps the pair open — it is a question, not a verdict", () => {
  // `unclear` means "I don't understand this sentence", not "I have decided".
  // Treating it as seen threw the pair away the moment a student asked for it
  // to be rephrased — and disagreed with `pairsAnswered`, which does not count
  // such a pair either. The button's whole purpose is to let them answer AFTER
  // understanding.
  const [a, b] = BEAT_PAIRS[0];
  const asked: BeatAnswers = { [a]: "unclear" };
  assert.deepEqual(
    nextPair(asked)?.map((x) => x.id),
    [a, b],
    "asking for plainer words skipped the pair",
  );
  assert.equal(pairsAnswered(asked), 0, "an unclear pair was counted as answered");
  // And once they really answer, it advances.
  const answered: BeatAnswers = { [a]: "picked", [b]: "passed" };
  assert.notDeepEqual(nextPair(answered)?.map((x) => x.id), [a, b]);
});

test("the station and the move ladder agree about step three", () => {
  // One step, two files. Both callers derive `tried` from the same started-
  // intent count, so a student with commitments and nothing started must not be
  // at "Trying it" while the plan's own card says "start". Neither statement
  // would be false, which is exactly why the drift would go unnoticed.
  const committedNothingStarted = {
    ...NOWHERE,
    pairsAnswered: 3,
    picks: { work: 1, major: 0, place: 0, hub: 0, route: 0 },
    tried: 0,
    committed: 3,
    started: 0,
  };
  assert.notEqual(
    station(committedNothingStarted).id,
    "try",
    "the station still says 'trying it' after they committed to three things",
  );
  assert.equal(
    nextMove(
      moveInput({
        picks: { ...NO_PICKS, work: 1, major: 1, place: 1, hub: 1 },
        tried: 0,
        committed: 3,
        started: 0,
      }),
    ).id,
    "start",
  );
});

// ── Matching annotates, it does not hide ─────────────────────────────────────
test("a student outside a row's field still sees it, marked", () => {
  // The gate was invisible: ~58 of 172 rows vanished with no way to ask why and
  // no route to the rest. It is a filter now, so matching must hand the filter
  // something to filter ON rather than doing the hiding itself.
  const plan = buildExtracurriculars({
    today: TODAY,
    faculties: ["law"],
    factors: [],
  });
  const offField = plan.items.filter((o) => o.offField);
  assert.ok(
    offField.length > 0,
    "nothing came back marked off-field — matching is still hiding",
  );
  for (const o of offField) {
    assert.ok(
      o.fields !== "all" && !o.fields.includes("law"),
      `${o.id} is marked off-field but is in the student's field`,
    );
  }
});

test("stating no field marks nothing off-field", () => {
  // Empty faculties means "show me everything", never "show me nothing" — so
  // there is no field to be outside of.
  const plan = buildExtracurriculars({
    today: TODAY,
    faculties: [],
    factors: [],
  });
  assert.ok(plan.items.every((o) => !o.offField));
});

test("a country-gated row is hidden outside its countries, and never on an unknown country", () => {
  // The FIRST catalog rows to carry `gate.countries` landed on 2026-08-28.
  // Until then the mechanism was covered only by two unit fixtures calling
  // `checkEligibility` with a synthetic gate — the branch existed, the data
  // never reached it, and this end-to-end path had never once run. That is the
  // sixth way a guard is useless in this repo: correct, and abstaining.
  //
  // The defect that produced the first row: Scholastic requires residence in
  // the US, its territories or Canada, and shipped with no country restriction
  // at all, so a sixteen-year-old in Shymkent was told they could enter.
  const gated = COMPETITIONS.filter(
    (c) => (c as { gate?: { countries?: string[] } }).gate?.countries?.length,
  );
  assert.ok(
    gated.length > 0,
    "no row carries gate.countries — this guard is ABSTAINING, not passing. " +
      "If that is deliberate, say so here; if a row lost its gate, that is the bug.",
  );

  const factors = [{ key: "extracurriculars", score: 6 }];
  const shows = (id: string, country: string | null, fields: string[]) =>
    buildExtracurriculars({
      today: TODAY,
      faculties: fields,
      factors,
      homeCountry: country,
      graduationYear: TODAY.getUTCFullYear() + 2,
    }).items.some((o) => o.id === id);

  for (const row of gated) {
    const allowed = (row as { gate: { countries: string[] } }).gate.countries;
    const fields = row.fields as unknown as string[];
    for (const c of allowed) {
      assert.ok(
        shows(row.id, c, fields),
        `${row.id} is hidden from ${c}, which its own gate allows`,
      );
    }
    // Somewhere the gate does not name. KZ unless the row already allows it.
    const outside = allowed.includes("KZ") ? "JP" : "KZ";
    assert.ok(
      !shows(row.id, outside, fields),
      `${row.id} is shown to a student in ${outside}, who cannot enter it`,
    );
    // And the rule the whole matcher is built on: an unknown fact never
    // excludes. A student who has not told us where they live still sees it.
    assert.ok(
      shows(row.id, null, fields),
      `${row.id} is hidden from a student whose country we do not know — unknown facts must never exclude`,
    );
  }
});

test("the catalog carries local rows at all", () => {
  // This test used to assert the opposite — that NOTHING was region-tagged —
  // and its own comment said the first local row would trip it and force
  // somebody to read audit finding A8. That happened on 2026-08-25.
  //
  // It is kept pointing the other way rather than deleted, because the zero it
  // pinned was not a neutral state: `region` exists so that a student in
  // Shymkent meets something they can turn up to, and for ten days it applied
  // to nothing curated at all. A product whose stated mission is students
  // outside the first tier, holding no row any of them can attend in person,
  // is the gap A8 names. Going back to zero should fail.
  const local = COMPETITIONS.filter((c) => c.region);
  assert.ok(
    local.length > 0,
    "no region-tagged rows left — the local mechanism applies to nothing again, see AUDIT §A8",
  );
});

test("a local row is marked for a student elsewhere, not hidden from them", () => {
  // The three cases of the region rule, over the REAL catalog rather than over
  // a synthetic row. `reachableFrom` has had unit coverage all along; what had
  // none was whether the matcher above it agrees, and it did not — the
  // reference implementation in the one-pass matcher test still hard-filtered
  // region six days after the release that stopped doing so.
  const forCountry = (homeCountry: string | null) =>
    buildExtracurriculars({
      today: TODAY,
      faculties: [],
      factors: [],
      homeCountry,
    }).items;

  const abroad = forCountry("IT");
  const marked = abroad.filter((o) => o.offRegion);
  assert.ok(marked.length > 0, "a local row vanished instead of being marked");
  for (const o of marked) {
    assert.ok(o.region && o.region !== "IT", `${o.id} is marked but not local`);
  }
  // Marked means filterable, and both match options default ON — so the list
  // the student is actually shown carries none of them.
  assert.equal(
    matchedOnly(abroad).filter((o) => o.offRegion).length,
    0,
    "an off-region row survived the default narrowing",
  );

  // Its own country sees it as an ordinary row.
  const athome = forCountry("KZ");
  const kzRows = athome.filter((o) => o.region === "KZ");
  assert.ok(kzRows.length > 0, "a Kazakh student cannot see the Kazakh rows");
  for (const o of kzRows) {
    assert.ok(!o.offRegion, `${o.id} is marked off-region inside its own region`);
  }

  // And an unknown country is not a different country. A logged-out reader in
  // Shymkent is exactly who a local event is for, and they were once the only
  // person who could not see it.
  const anon = forCountry(null);
  assert.equal(
    anon.filter((o) => o.offRegion).length,
    0,
    "a visitor who has not said where they live was treated as being elsewhere",
  );
  assert.ok(
    kzRows.every((o) => anon.some((a) => a.id === o.id)),
    "a local row is missing from the signed-out list",
  );
});

test("a confirmed date in the past is still GONE, not marked", () => {
  // A closed date is a fact about the world, not a narrowing of the catalog.
  // Offering to "show expired" would be offering rubbish.
  const plan = buildExtracurriculars({
    today: TODAY,
    faculties: [],
    factors: [],
  });
  for (const o of plan.items) {
    if (o.dateConfirmed) {
      assert.ok(
        o.daysToDeadline >= 0,
        `${o.id} is confirmed and past but was returned`,
      );
    }
  }
});

test("what comes back no longer depends on the student's field", () => {
  const narrow = buildExtracurriculars({
    today: TODAY,
    faculties: ["law"],
    factors: [],
  });
  const matched = narrow.items.filter((o) => !o.offField && !o.offRegion);
  const wide = buildExtracurriculars({
    today: TODAY,
    faculties: [],
    factors: [],
  });
  assert.ok(narrow.items.length > matched.length, "annotating widened nothing");
  assert.equal(
    narrow.items.length,
    wide.items.length,
    "the returned set still depends on the field, which it must no longer",
  );
});

test("an off-field row sinks below everything the student matches", () => {
  // Visible, not promoted. The list still opens on what fits, and widening is a
  // thing you choose rather than a thing that happens to you.
  const plan = buildExtracurriculars({
    today: TODAY,
    faculties: ["law"],
    factors: [],
  });
  const firstOff = plan.items.findIndex((o) => o.offField || o.offRegion);
  const lastMatched = plan.items.reduce(
    (last, o, i) => (!o.offField && !o.offRegion ? i : last),
    -1,
  );
  if (firstOff !== -1 && lastMatched !== -1) {
    assert.ok(
      firstOff > lastMatched,
      "an off-field row is sitting above one the student actually matches",
    );
  }
});

test("a beat opens with the ACTION, not with scenery", () => {
  // This is the rule that was missing, and its absence is what turned the set
  // into riddles. "No jargon, no profession named" was obeyed and overshot: the
  // beats became evocative but unanchored — "The only two people left who
  // remember how the old festival was run are both past eighty…" is a short
  // story whose verb arrives at word 25, and a fifteen-year-old cannot tell
  // what they are choosing between.
  //
  // Concrete and PLAIN, not concrete and literary. The cheapest test of that is
  // where the verb sits: a beat must start by telling you what you are DOING.
  const OPENERS = /^(You |Someone |Two |A person )/;
  for (const b of BEATS) {
    assert.match(
      b.text,
      OPENERS,
      `${b.id} opens on scenery rather than on the thing you are doing`,
    );
  }
});

/** Sentences in a beat. Beats carry no abbreviations, so a period ends one. */
const sentencesIn = (t: string) =>
  t
    .trim()
    .split(/[.!?]+(?:\s|$)/)
    .filter((s) => s.trim().length > 0).length;

test("a beat is TWO sentences: the situation, then what you do about it", () => {
  // The rule the other two guards could not see. Word count, opener and the
  // profession ban were all passing while a reader called the questions
  // "philosophical" — because every beat was ONE sentence of about twenty words
  // carrying its situation in a subordinate clause, so nothing resolved until
  // the last word. 23 of 24 were built that way.
  //
  // The proof that plain was always possible is in the file itself: `plainer`,
  // the text behind "I don't get it", says what is happening in ordinary words.
  // The clarity existed and was hidden behind a button most readers never press.
  //
  // Two sentences forces the order that fixes it: state the situation, then the
  // action. It is mechanical, which is the point — the previous rules measured
  // length and first word, and a riddle can satisfy both.
  for (const b of BEATS) {
    const n = sentencesIn(b.text);
    assert.ok(
      n >= 2,
      `${b.id} is ${n} sentence(s): "${b.text}" — say the situation, then what you do`,
    );
    // Not four either. Two short ones is a moment; four is a paragraph in a
    // narrow rail, and two of those sit side by side.
    assert.ok(n <= 3, `${b.id} is ${n} sentences — a beat is one moment`);
  }
});

test("that two-sentence rule bites on the shape it was written for", () => {
  // A guard that has never been shown to fail is a guard nobody has checked.
  // This is the exact beat that shipped, and it must be rejected.
  const asShipped =
    "You work out which beam gave way, after the model bridge you built snapped under half the weight it should hold.";
  assert.equal(sentencesIn(asShipped), 1, "the fixture stopped being one sentence");

  // And the replacement must pass, or the rule is unmeetable rather than strict.
  const rewritten =
    "You built a model bridge and it snapped at half the weight it should hold. You work out which beam went first.";
  assert.equal(sentencesIn(rewritten), 2);
  assert.ok(rewritten.split(/\s+/).length <= 24, "the replacement broke the word cap");
});

test("the plainer version is actually plainer — never longer than its own beat", () => {
  // The rule that was missing entirely, and the field it was missing from is
  // the one a student reaches only after saying "I don't get it".
  //
  // The beats were rewritten on 2026-08-22 because each was one sentence of
  // about twenty words carrying its situation in a subordinate clause. That fix
  // was applied to `text` and never to its neighbour: measured on 2026-08-27,
  // `plainer` ran to a median of 28 words against the beat's 21, **19 of 24
  // were LONGER than the beat they explain**, and all but one were a single
  // clause chained with "and", "because" or "though". The most confused reader
  // on the surface was handed the harder sentence.
  //
  // Words, not characters, and against its OWN beat rather than a fixed cap:
  // "plainer" is a comparison, so the guard has to be one. A flat ceiling would
  // pass a 24-word explanation of an 18-word beat.
  //
  // What is deliberately NOT asserted here: two sentences, and an opening word.
  // Both are `text`'s rules and both would be wrong here —
  // `same-question-fortieth` is thirteen words in one clean clause, and forcing
  // a second sentence onto it would make it worse. The audit that found this
  // originally reported those two as failures; they were the wrong properties,
  // and re-checking beat acting on them.
  const words = (s: string) => s.trim().split(/\s+/).length;
  for (const b of BEATS) {
    assert.ok(
      words(b.plainer) <= words(b.text),
      `${b.id}: the plainer version is ${words(b.plainer)} words against the beat's ${words(b.text)} — "${b.plainer}"`,
    );
  }
  // And it must still SAY something: the existing floor is 40 characters, which
  // a one-word "Accounting." would pass in spirit but not in use.
  for (const b of BEATS) {
    assert.ok(words(b.plainer) >= 8, `${b.id}: the plainer version says nothing`);
  }
});

test("the plainer rule bites on the copy that shipped", () => {
  const words = (s: string) => s.trim().split(/\s+/).length;
  // Verbatim, the worst pair as it stood before the rewrite.
  const beat =
    "You spot a pattern in this morning's numbers that might be nothing. You spend six more months finding out which.";
  const asShipped =
    "A pattern shows up in your data, but nobody can yet tell if it means something real or is just chance, and it will take another six months of testing to find out.";
  assert.equal(words(beat), 20, "the fixture's beat changed; re-derive the numbers");
  assert.equal(words(asShipped), 33, "the fixture stopped being the shipped copy");
  assert.ok(
    words(asShipped) > words(beat),
    "the guard would not have fired on the copy it was written for",
  );
  // The replacement has to pass, or the rule is unmeetable rather than strict.
  const rewritten =
    "Research data shows a pattern that might be chance. Six more months of testing decide which.";
  assert.ok(words(rewritten) <= words(beat));
  assert.ok(words(rewritten) >= 8);
});

// ── The gates, made visible ──────────────────────────────────────────────────
test("by default the student still gets their own list", () => {
  assert.deepEqual([...NO_FILTERS.matched].sort(), ["field", "region"]);
  assert.equal(
    activeFilterCount(NO_FILTERS),
    0,
    "the default must be quiet — it is not a choice the student made",
  );
});

test("unchecking a match option widens the list and counts as an active filter", () => {
  // This group is INVERTED from every other one: elsewhere an empty array means
  // "no narrowing", here the default is both ON. So it is counted by what is
  // MISSING — and it must count, because the panel's standing rule is that any
  // active filter opens the full list on its own.
  assert.equal(activeFilterCount({ ...NO_FILTERS, matched: ["region"] }), 1);
  assert.equal(activeFilterCount({ ...NO_FILTERS, matched: [] }), 2);
});

test("the match group filters on the annotation, both ways", () => {
  const rows = [
    opp({ id: "mine" }),
    opp({ id: "other-field", offField: true }),
    opp({ id: "other-place", offRegion: true }),
  ];
  assert.deepEqual(
    filterOpportunities(rows, NO_FILTERS).map((o) => o.id),
    ["mine"],
  );
  assert.deepEqual(
    filterOpportunities(rows, { ...NO_FILTERS, matched: ["region"] })
      .map((o) => o.id)
      .sort(),
    ["mine", "other-field"],
  );
  assert.equal(
    filterOpportunities(rows, { ...NO_FILTERS, matched: [] }).length,
    3,
  );
});

test("the match counts say what each narrowing is removing", () => {
  const rows = [
    opp({ id: "a" }),
    opp({ id: "b", offField: true }),
    opp({ id: "c", offField: true }),
    opp({ id: "d", offRegion: true }),
  ];
  const facets = opportunityFacets(rows, NO_FILTERS);
  // Counted with THIS control's own selection lifted, like every other group —
  // "how many would I see if this one were off".
  assert.equal(facets.matched.field, 3, "a=on-field, b+c off-field, d still off-region");
  assert.equal(facets.matched.region, 2, "a plus d, with b+c still cut by field");
});

test("the honest count is computed, never written down", () => {
  // The control that used to sit here read "Show everything we track for you
  // (114)", where "everything" was false — it was everything we MATCHED, and a
  // student read it as "they only have 114".
  assert.deepEqual(
    matchedCount([opp({ id: "a" }), opp({ id: "b", offField: true })]),
    { shown: 1, total: 2 },
  );
  assert.deepEqual(matchedCount([]), { shown: 0, total: 0 });
});

test("a widened list leaves a chip that puts the narrowing back", () => {
  const chips = activeChips({ ...NO_FILTERS, matched: ["field"] });
  const chip = chips.find((c) => c.group === "matched");
  assert.ok(chip, "widening the list left nothing the student could undo");
  assert.deepEqual(
    withoutChip({ ...NO_FILTERS, matched: ["field"] }, chip!).matched.sort(),
    ["field", "region"],
  );
});

test("every surface without a filter panel narrows to the student's own list", () => {
  // Matching stopped hiding rows so the panel could own the narrowing — which
  // means a surface with NO panel narrows nothing unless it asks. Three of them
  // are in that position, and the leak is silent: nothing looks wrong, there
  // are simply more rows than there should be. A student in Uzbekistan seeing a
  // competition that only runs in Kazakhstan is the exact failure the region
  // tag exists to prevent.
  const files = [
    "components/opportunities/EligibilityChecker.tsx",
    "components/onboarding/FirstWin.tsx",
    "lib/planner/load.ts",
  ];
  for (const file of files) {
    const full = path.join(process.cwd(), file);
    assert.ok(existsSync(full), `${file} is missing — this guard has no subject`);
    const src = stripComments(readFileSync(full, "utf8"));
    assert.match(
      src,
      /matchedOnly\(/,
      `${file} reads the matched plan without calling matchedOnly — it will show a student other people's opportunities`,
    );
  }
});

test("every surface that renders an opportunity says WHERE a local one is", () => {
  // Three files render an opportunity's identity, and for a long time only two
  // of them drew the `Local · …` badge. The third — the public detail page,
  // which exists so a student can send a row to a friend — never got it,
  // because it is a hand-built page rather than a caller of OpportunityDetail.
  //
  // That was invisible until the catalog had local rows to render. Measured on
  // 2026-08-25 against the running app: of five Kazakhstan-only detail pages,
  // TWO named no country anywhere on them. The other three were saved by their
  // eligibility sentence happening to mention Kazakhstan, which is a
  // coincidence rather than a mechanism — `debat-eli-practice-games` says only
  // "School students and first-year university students starting out in
  // debate", so a reader arriving from a shared link met a row they cannot
  // enter with nothing on the page to tell them.
  //
  // The card's own comment says the badge "reads as 'near you', not as a
  // restriction", and that is true THERE: a local row only reaches a student
  // from that country or one whose country we do not know. A public page
  // arrives from anywhere, so for most of its readers the fact is the opposite
  // one. Same badge, different job, and both jobs need it drawn.
  // FOUR files, and the fourth is the one the first version of this guard
  // missed. The share card is a separate surface from the page it links to:
  // `page.tsx` was fixed and its Open Graph image was not, so a shared link
  // still unfurled into a card naming no country while the page underneath
  // named one. That is worse than the original defect, because it puts the
  // honest sentence one tap PAST the moment the reader decides.
  const files = [
    "components/opportunities/OpportunityCard.tsx",
    "components/opportunities/OpportunityDetail.tsx",
    "app/opportunities/[id]/page.tsx",
    "app/opportunities/[id]/opengraph-image.tsx",
  ];
  for (const file of files) {
    const full = path.join(process.cwd(), file);
    assert.ok(existsSync(full), `${file} is missing — this guard has no subject`);
    const src = stripComments(readFileSync(full, "utf8"));
    assert.match(
      src,
      /regionLabel\(/,
      `${file} renders an opportunity without naming the country a local one belongs to`,
    );
  }
});

test("the front page shows global rows only", () => {
  // The one surface where excluding local rows is a RULE rather than a filter.
  //
  // Everywhere else a local row is shown to someone we know is in that country,
  // or marked `offRegion` and narrowed away by the panel. The landing hero is
  // neither: it renders before anyone has told us anything, to every visitor on
  // earth, and it does not go through `buildExtracurriculars`, so `matchedOnly`
  // never sees these rows and `reachableFrom` is never consulted.
  //
  // Asserted over the real catalog and over the DATED pool specifically,
  // because that is the half about to become live: `dated` sorts by nearest
  // confirmed deadline, and the Kazakh rows carry the nearest estimates in the
  // catalog. Confirm two of them in September — the next item on the backlog —
  // and without this rule they take the top of the front page by construction.
  for (const c of previewOpportunities(TODAY, 12)) {
    assert.ok(
      !c.region,
      `${c.id} is local to ${c.region} and is on the front page, which cannot know where the reader is`,
    );
  }
});

test("matchedOnly keeps only what the student matches", () => {
  const rows = [
    opp({ id: "mine" }),
    opp({ id: "other-field", offField: true }),
    opp({ id: "other-place", offRegion: true }),
    opp({ id: "both", offField: true, offRegion: true }),
  ];
  assert.deepEqual(
    matchedOnly(rows).map((o) => o.id),
    ["mine"],
  );
  assert.deepEqual(matchedOnly([]), []);
});

// ── A number in the README has to be the number ─────────────────────────────
//
// The landing page never drifts because it COUNTS the data at request time.
// Prose cannot do that, so the README said 173 entries for two days after the
// nao-cup row was removed, and OPPORTUNITIES_PLAN — the file a resuming session
// is pointed at first — still said 156 and 100 from an August 2 measurement.
// A stale count is worse than no count: it is the input to somebody's plan.
//
// So the counts that matter are asserted here. The date beside each one is not
// decoration either: a figure with no date cannot be told apart from a figure
// that is merely old.
test("the README's counts are the counts", () => {
  const readme = readFileSync(path.join(process.cwd(), "README.md"), "utf8");

  // `\s+`, not a space: the claim wraps across a line in the README, and a
  // pattern that assumed one line reported "the README no longer states a
  // count" — a guard failing for the wrong reason is a guard nobody trusts.
  const entries = readme.match(
    /\*\*(\d+)\s+entries\s+as\s+of\s+(\d{4}-\d{2}-\d{2})\*\*/,
  );
  assert.ok(entries, "the README no longer states a dated catalog size");
  assert.equal(
    Number(entries[1]),
    COMPETITIONS.length,
    `README says ${entries[1]} catalog entries, the catalog holds ${COMPETITIONS.length}`,
  );

  // All FIVE steps, because the guide has five and a guard that covers three
  // leaves two counts free to rot. Majors became step 2 in release 5, and the
  // README carried that number for a while with nothing asserting it — the
  // same gap this whole test exists to close, one layer in.
  const guide = readme.match(
    /(\d+) areas of work, (\d+) majors, (\d+) country profiles, (\d+) cities,\s+(\d+) routes from\s+home/,
  );
  assert.ok(guide, "the README no longer states the guide's shape");
  assert.equal(Number(guide[1]), allCareerAreas().length, "areas of work");
  assert.equal(Number(guide[2]), MAJORS.length, "majors");
  assert.equal(Number(guide[3]), STUDY_DESTINATIONS.length, "country profiles");
  assert.equal(Number(guide[4]), HUBS.length, "cities");
  assert.equal(Number(guide[5]), HOME_ROUTES.length, "routes from home");
});

// ── No dictionary key that nobody asks for ──────────────────────────────────
//
// 163 of 393 keys were referenced nowhere — 137 of them `ob.*`, stranded when
// the onboarding wizard moved to inline English. This map is imported by the
// language provider in the ROOT layout, so every key ships in the client bundle
// of every route on the site; the file's own header records ~80 landing keys
// being removed for that reason once already, which is the argument for a test
// rather than a second cleanup.
//
// Four prefixes are built dynamically and can never appear at a call site. That
// list is the whole risk in this guard: `dest.*` became dynamic in this very
// change (the registry now derives `labelKey` as `dest.${code}` instead of
// spelling out seven literals), and a first run without it happily deleted all
// eight live country names.
const DYNAMIC_KEY_PREFIXES = ["tier.", "conf.", "effort.", "dest."];

test("every dictionary key is asked for somewhere", () => {
  const dictPath = path.join(process.cwd(), "lib/i18n/dictionary.ts");
  const keys = [...readFileSync(dictPath, "utf8").matchAll(/^ {2}"([^"]+)":/gm)]
    .map((m) => m[1]);
  assert.ok(keys.length > 100, "the dictionary parsed as almost empty — check the key pattern");

  const corpus = [...allRepoSources(), ...[path.join(process.cwd(), "middleware.ts")]]
    .filter((f) => existsSync(f) && f !== dictPath)
    .map((f) => readFileSync(f, "utf8"))
    .join("\n");

  const unused = keys.filter(
    (k) =>
      !DYNAMIC_KEY_PREFIXES.some((p) => k.startsWith(p)) &&
      !corpus.includes(`"${k}"`) &&
      !corpus.includes(`'${k}'`) &&
      !corpus.includes("`" + k + "`"),
  );
  assert.deepEqual(
    unused,
    [],
    `${unused.length} dictionary keys are never read — they ship to every route:\n${unused.join("\n")}`,
  );
});

test("the dictionary guard bites, and spares the dynamic prefixes", () => {
  const corpus = 'const a = t("nav.plan");';
  const check = (k: string) =>
    DYNAMIC_KEY_PREFIXES.some((p) => k.startsWith(p)) || corpus.includes(`"${k}"`);
  assert.ok(check("nav.plan"), "a key that IS read is reported unused");
  assert.ok(!check("ob.longGone"), "a key nothing reads slips through");
  // The four that are assembled at runtime must survive a corpus that never
  // spells them out — this is the case that nearly deleted every country name.
  assert.ok(check("dest.US"), "a template-built key would be deleted");
  assert.ok(check("tier.reach"), "a template-built key would be deleted");
  assert.ok(check("conf.high"), "a template-built key would be deleted");
  assert.ok(check("effort.low"), "a template-built key would be deleted");
});

// ── Nothing exports a value that nobody uses ────────────────────────────────
//
// Twenty-four exported symbols were referenced nowhere in the tree — four
// parallel `*ProgramLabel` helpers left behind by the country-registry refactor,
// the old onboarding wizard's step model, `UNIVERSITY_NAMES`, the language
// toggle's leftovers. None could fail a type-check or a lint, because every one
// of them was valid code; they were simply nobody's.
//
// The point of running the audit as a TEST rather than doing the delete once:
// dead code is not a state you clean up, it is a rate. Something falls out of
// use on nearly every refactor, and the only difference between a tree with
// twenty-four dead exports and one with none is whether anything is counting.
//
// VALUES only. A `type X = (typeof CONST)[number]` alias beside a live constant
// costs nothing at runtime and is the pattern that stops the next person
// hand-writing the union — deleting those would be cleanup as cargo cult.
const NEXT_CONTRACT_EXPORT =
  /^(metadata|dynamic|revalidate|runtime|maxDuration|generateMetadata|generateStaticParams|viewport|fetchCache|dynamicParams|preferredRegion|alt|size|contentType|config|middleware|default)$/;

test("every exported value is used somewhere", () => {
  // `scripts/` counts as a CONSUMER — `scoreHolistic` is called only by
  // check-scoring and sim-scorecard, and a corpus that skipped them reported a
  // live function as dead. Root-level `middleware.ts` counts for the same
  // reason: it is the only caller of `updateSession`.
  const walkScripts = (dir: string): string[] =>
    readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
      const full = path.join(dir, e.name);
      if (e.isDirectory()) return walkScripts(full);
      return /\.tsx?$/.test(e.name) ? [full] : [];
    });
  const files = [
    ...allRepoSources(),
    ...walkScripts(path.join(process.cwd(), "scripts")),
    ...["middleware.ts"]
      .map((f) => path.join(process.cwd(), f))
      .filter((f) => existsSync(f)),
  ];
  // One tokenised pass over the tree, then arithmetic — checking each symbol
  // against every file separately is quadratic and makes the suite crawl.
  const perFile = new Map<string, Map<string, number>>();
  const total = new Map<string, number>();
  const declared: { file: string; name: string }[] = [];
  for (const f of files) {
    const src = stripComments(readFileSync(f, "utf8"))
      // Strings too: a name mentioned in copy is not a use.
      .replace(/`(?:\\.|[^`\\])*`/g, "``")
      .replace(/"(?:\\.|[^"\\])*"/g, '""')
      .replace(/'(?:\\.|[^'\\])*'/g, "''");
    const counts = new Map<string, number>();
    for (const m of src.matchAll(/[A-Za-z_$][\w$]*/g)) {
      counts.set(m[0], (counts.get(m[0]) ?? 0) + 1);
      total.set(m[0], (total.get(m[0]) ?? 0) + 1);
    }
    perFile.set(rel(f), counts);
    const isRoute =
      /\/(page|layout|route|loading|error|not-found|sitemap|robots|icon|opengraph-image|template|default|global-error)\.tsx?$/.test(
        rel(f),
      );
    for (const m of src.matchAll(
      /^export\s+(?:async\s+)?(function|const|let|class|enum)\s+([A-Za-z_$][\w$]*)/gm,
    )) {
      if (isRoute && NEXT_CONTRACT_EXPORT.test(m[2])) continue;
      declared.push({ file: rel(f), name: m[2] });
    }
  }
  // DEAD means the identifier occurs exactly once in the whole tree: its own
  // declaration. A symbol used inside its own file is merely over-exported —
  // the `export` keyword is unnecessary, the code is not dead — and failing the
  // build on that would bury the real thing under 160 items of tidying.
  const dead = declared.filter(({ name }) => (total.get(name) ?? 0) === 1);
  assert.deepEqual(
    dead.map((d) => `${d.file} → ${d.name}`),
    [],
    "these exported values are referenced nowhere — delete them, or use them",
  );
});

test("the dead-export scan actually bites", () => {
  // It has to find a symbol that IS dead, or it is an empty loop reporting
  // success. `__deadOnPurpose` below is exported and used by nothing; the scan
  // must be able to see it, and the real test must be excluding it by name
  // rather than by luck.
  const src = `export const __deadOnPurpose = 1;\nexport const used = 2;\nconsole.log(used);`;
  const names = [...src.matchAll(/^export\s+(?:async\s+)?(?:const)\s+([A-Za-z_$][\w$]*)/gm)]
    .map((m) => m[1]);
  assert.deepEqual(names, ["__deadOnPurpose", "used"], "the scan cannot see exports at all");
  const count = (n: string) => [...src.matchAll(new RegExp(`\\b${n}\\b`, "g"))].length;
  assert.equal(count("__deadOnPurpose"), 1, "a dead export must appear exactly once");
  assert.ok(count("used") > 1, "a used export must appear more than once");
});

// ── One list, or the compiler cannot help you ───────────────────────────────
//
// Every set below used to exist twice: a union in one file, a hand-written copy
// somewhere else, with nothing relating them. That is the shape audit finding A4
// came in — a kind of opportunity the tab strip did not know about, which made
// the counts stop summing — and four more of them were still in the tree.
//
// The type system now owns each relationship, so these tests guard the one thing
// it cannot: somebody typing the members out again.
test("the five live destination codes are written down exactly once", () => {
  // `AvailableDestinationCode` is derived from AVAILABLE_DESTINATION_CODES, and
  // the college-list builder, the rankings board, the map markers and
  // dashboard/actions all alias it. Before that, promoting CN or CA would have
  // left all four silently short with no type error anywhere.
  const offenders: string[] = [];
  const literal = /"US"\s*\|\s*"IT"\s*\|\s*"HK"\s*\|\s*"[AK][ER]"\s*\|\s*"[AK][ER]"/;
  for (const file of allRepoSources()) {
    if (rel(file) === "lib/data/destinations.ts") continue;
    if (rel(file) === "scripts/test-engine.ts") continue;
    if (literal.test(stripComments(readFileSync(file, "utf8")))) {
      offenders.push(rel(file));
    }
  }
  assert.deepEqual(
    offenders,
    [],
    `the destination list is written out again instead of imported:\n${offenders.join("\n")}`,
  );
});

test("that destination guard bites on the literal it is looking for", () => {
  const literal = /"US"\s*\|\s*"IT"\s*\|\s*"HK"\s*\|\s*"[AK][ER]"\s*\|\s*"[AK][ER]"/;
  assert.ok(
    literal.test('export type BuilderCountry = "US" | "IT" | "HK" | "AE" | "KR";'),
    "the guard misses the exact copy that was in useListBuilder",
  );
  assert.ok(
    // map-markers had drifted in member ORDER, which is how one set starts
    // reading as two.
    literal.test('export type CountryCode = "US" | "IT" | "HK" | "KR" | "AE";'),
    "the guard misses a reordered copy",
  );
  assert.ok(
    !literal.test("export type X = AvailableDestinationCode;"),
    "the guard fires on the derived form it is meant to allow",
  );
});

test("every vocabulary array covers its whole union", () => {
  // The direction matters. Declared the other way — union first, array second —
  // TypeScript checks that each member is VALID and never that the set is
  // COMPLETE, so a new member is silently missing from the array that validates
  // it. Each of these is now `as const` with the union derived from it; these
  // assertions state the invariant that buys.
  assert.deepEqual([...PLANNER_STATUSES].sort(), ["doing", "done", "dropped", "todo"]);
  assert.equal(new Set(PLANNER_STATUSES).size, PLANNER_STATUSES.length);
  assert.equal(new Set(COMPETITION_LEVELS).size, COMPETITION_LEVELS.length);
  assert.equal(new Set(COMPETITION_TIERS).size, COMPETITION_TIERS.length);
  // A tier or level the catalog actually uses must be in its own vocabulary, or
  // discovery's sanitiser silently rewrites it to the fallback.
  for (const c of COMPETITIONS) {
    if (c.level)
      assert.ok(
        (COMPETITION_LEVELS as readonly string[]).includes(c.level),
        `${c.id} has level "${c.level}", absent from COMPETITION_LEVELS`,
      );
    if (c.tier)
      assert.ok(
        (COMPETITION_TIERS as readonly string[]).includes(c.tier),
        `${c.id} has tier "${c.tier}", absent from COMPETITION_TIERS`,
      );
  }
});

test("the scoring core has one factor list, not two", () => {
  // `Factor` in tier-score.ts is now an alias of the rubric's `FactorKey`. A
  // type alias leaves nothing to assert at runtime, so this checks the thing
  // that would actually rot: the rubric naming a factor the alias cannot serve.
  const keys = RUBRIC.map((f) => f.key).sort();
  assert.equal(new Set(keys).size, keys.length, "the rubric names a factor twice");
  assert.deepEqual(keys, [
    "academics",
    "awards",
    "course_rigor",
    "extracurricular_depth",
    "leadership",
    "narrative_fit",
    "test_scores",
  ]);
});

// ── What may reach the one table that measures the product ─────────────────
//
// `saveOpportunityIntent` accepted any string of 1 to 120 characters as an
// opportunity id and wrote it to `opportunity_intents` — the only behavioural
// signal this product collects, and the number `/admin/intents` reports. Four
// files away, `recordReaction` refuses a `beatId` the registry does not
// contain. Same job, one of them done: the repository's most frequent bug
// shape, a rule enforced in one place and not in the one beside it.
//
// The check is on the SHAPE, and that was chosen by measurement rather than by
// taste. Membership would have been a regression: an admin quick-add mints
// `slugId(name)` and a partner post mints `${partnerUuid}-${slug}`, neither of
// which is in the curated catalog, and both are things a student really commits
// to. Refusing those would read as the button not working.
const INTENT_ID_CALLERS: { file: string; must: RegExp; why: string }[] = [
  {
    file: "app/dashboard/actions.ts",
    must: /saveOpportunityIntent[\s\S]{0,900}?!isOpportunityId\(/,
    why: "the write path stopped validating the id, so anything at all reaches opportunity_intents again",
  },
  {
    file: "app/dashboard/actions.ts",
    must: /clearOpportunityIntent[\s\S]{0,400}?!isOpportunityId\(/,
    why: "the delete path stopped validating, so the pair disagrees and teaches the next reader the wrong rule",
  },
];

test("an opportunity id has to look like one before it is stored", () => {
  // Every real writer, checked against the shape rather than assumed.
  for (const c of COMPETITIONS) {
    assert.ok(
      isOpportunityId(c.id),
      `catalog row ${c.id} would be refused by its own validator`,
    );
  }
  // The two live writers, reproduced from their sources.
  const slugId = (name: string) =>
    `${name
      .toLowerCase()
      .normalize("NFKD")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 48) || "opportunity"}-${Date.now().toString(36)}`;
  assert.ok(isOpportunityId(slugId("Turnir Gorodov 2027")), "admin quick-add");
  // A name with no latin characters collapses to the fallback, and that still
  // has to pass — otherwise an admin posting a Russian-named contest is told
  // their own opportunity does not exist.
  assert.ok(isOpportunityId(slugId("Турнир городов")), "admin quick-add, non-latin name");
  const partnerPost = `550e8400-e29b-41d4-a716-446655440000-${"a".repeat(43)}`;
  assert.equal(partnerPost.length, 80, "the partner ceiling moved; re-check the bound");
  assert.ok(isOpportunityId(partnerPost), "partner post at its 80-character ceiling");
});

test("the opportunity-id guard bites, and spares the near-misses", () => {
  // Everything the 120-character ceiling used to let through.
  for (const junk of [
    "../../etc/passwd",
    "<script>alert(1)</script>",
    "DROP TABLE opportunity_intents",
    "a b c",
    "ÜBER",
    "Has-Capitals",
    "trailing space ",
    "",
    "a".repeat(97),
  ]) {
    assert.ok(!isOpportunityId(junk), `${JSON.stringify(junk)} still reaches the table`);
  }
  // The near-misses, which is the half that gets skipped. Each differs from a
  // rejected string by one character, and a guard that fired on these would be
  // exempted away inside a month.
  assert.ok(isOpportunityId("a".repeat(96)), "the bound is off by one at the top");
  assert.ok(isOpportunityId("a"), "a single character is a legal id");
  assert.ok(isOpportunityId("0-a"), "a leading digit is legal");
  assert.ok(!isOpportunityId("-a"), "a leading hyphen is not");
});

test("both intent actions call the guard, not just the one that writes", () => {
  for (const { file, must, why } of INTENT_ID_CALLERS) {
    const full = path.join(process.cwd(), file);
    assert.ok(existsSync(full), `${file} is missing — this guard has no subject`);
    assert.match(stripComments(readFileSync(full, "utf8")), must, `${file}: ${why}`);
  }
});

test("that caller guard bites on the exact line that shipped", () => {
  // The real code, before the fix. It compiles, type-checks and lints.
  const asShipped = `
export async function saveOpportunityIntent(input: { opportunityId: string }) {
  const opportunityId = input.opportunityId?.trim();
  if (!opportunityId || opportunityId.length > 120) {
    return { ok: false, error: "Unknown opportunity." };
  }
`;
  assert.ok(
    !INTENT_ID_CALLERS[0].must.test(asShipped),
    "the pattern passes the code it was written to reject",
  );
  const fixed = asShipped.replace(
    "opportunityId.length > 120",
    "!isOpportunityId(opportunityId)",
  );
  assert.match(fixed, INTENT_ID_CALLERS[0].must, "the pattern rejects the fix as well");
});

// ── The commitment step has to be REACHABLE ─────────────────────────────────
// The bug this catches shipped to production and no test noticed, because
// every part still compiled: `CommitRow` was rendered only by the five-row
// `Shortlist`, and deleting that for the one list deleted the only caller.
// `saveOpportunityIntent` — the product's single behavioural signal, and the
// number `/admin/intents` reports — became unreachable from the UI while
// remaining a valid, exported, type-checked server action.
//
// So the chain is pinned by name: the list's row builds the node, the card
// hands it to the panel, and the panel renders it. Any one of those three
// links quietly removed puts the metric back in the dark.
const COMMIT_CHAIN: { file: string; must: RegExp; why: string }[] = [
  {
    file: "components/opportunities/CommitRow.tsx",
    must: /commit=\{<CommitRow\b/,
    why: "OpportunityRow no longer builds the commitment node, so nothing in the list can offer it",
  },
  {
    file: "components/opportunities/OpportunityCard.tsx",
    must: /<OpportunityDetail[\s\S]{0,200}?\bcommit=\{commit\}/,
    why: "the card takes a commit node and never passes it to the detail panel, so it renders nowhere",
  },
  {
    file: "components/opportunities/OpportunityDetail.tsx",
    must: /\{commit\s*&&/,
    why: "the detail panel accepts a commit node and never renders it",
  },
];

test("the commitment step is reachable from the opportunity list", () => {
  for (const { file, must, why } of COMMIT_CHAIN) {
    const full = path.join(process.cwd(), file);
    assert.ok(existsSync(full), `${file} is missing — this guard has no subject`);
    assert.match(stripComments(readFileSync(full, "utf8")), must, `${file}: ${why}`);
  }
});

test("the commitment-chain guard actually bites", () => {
  // A guard written as a template literal once compiled to a pattern that
  // matched nothing and was cited as a guarantee in a PR description. Every
  // hand-built pattern here is therefore shown failing on the exact edit that
  // caused the outage: the node stops being built, or stops being handed on.
  const brokenRow = `return <OpportunityCard o={o} density="compact" />;`;
  const brokenCard = `{detail && <OpportunityDetail o={o} onClose={close} />}`;
  const brokenPanel = `<div className="border-t">{children}</div>`;
  assert.ok(
    !COMMIT_CHAIN[0].must.test(brokenRow),
    "the row guard passes a card that builds no commitment node",
  );
  assert.ok(
    !COMMIT_CHAIN[1].must.test(brokenCard),
    "the card guard passes a panel call that drops the commit prop",
  );
  assert.ok(
    !COMMIT_CHAIN[2].must.test(brokenPanel),
    "the panel guard passes a panel that never renders the node",
  );
  // …and passes the real thing, so it is not merely a pattern that never matches.
  for (const { file, must } of COMMIT_CHAIN) {
    const src = stripComments(
      readFileSync(path.join(process.cwd(), file), "utf8"),
    );
    assert.match(src, must);
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// THE CACHES AND THE FAST PATHS
//
// Six hot paths were rewritten for speed, and every one of them replaced a
// straightforward computation with either a remembered answer or a cheaper
// route to the same one. That is the class of change that goes wrong quietly:
// a cache that returns the wrong row does not throw, it just shows a student
// something that is not theirs, and a hand-rolled date parse that is off by a
// day moves a deadline.
//
// So each test below re-derives the answer the SLOW way — the exact code that
// shipped before — and asserts the two agree over the whole real catalog rather
// than over a fixture. The point is not that the new code is fast; it is that
// being fast changed nothing a student can see.
// ─────────────────────────────────────────────────────────────────────────────

test("the date formatter is built once and says exactly what it said before", () => {
  // `toLocaleDateString(locale, options)` constructs an Intl.DateTimeFormat per
  // call — measured at 90.76 µs against 2.08 for a hoisted one, and it runs
  // once per opportunity card, so a forty-card screen spent 3.5 ms formatting
  // dates and spent it again on every re-render. The output is identical by
  // specification; this asserts it over every date the product actually
  // renders, plus the shapes most likely to expose a formatter difference.
  const before = (iso: string) =>
    new Date(iso + "T00:00:00Z").toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      timeZone: "UTC",
    });
  for (const c of COMPETITIONS) {
    assert.equal(formatDate(c.deadline), before(c.deadline), c.id);
  }
  for (const iso of [
    "2028-02-29", // leap day
    "2026-01-01", // year start, single-digit day
    "2026-12-31", // year end
    "2027-09-09", // single-digit month and day
  ]) {
    assert.equal(formatDate(iso), before(iso), iso);
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// How long is left, said once.
//
// Four places rendered this sentence and three of them disagreed. The card and
// the landing preview were right; `OpportunityDetail` printed "1 days left",
// and the public checker's verdict printed "the nearest closes in 0 days" on
// the day something closed — the two shapes a reader cannot tell from a bug.
// The grammar now lives here, so a fifth caller cannot invent a fourth
// spelling.
test("the days-left phrasings handle today, tomorrow and the plural", () => {
  assert.equal(daysLeftLabel(0), "closes today");
  assert.equal(daysLeftLabel(1), "1 day left");
  assert.equal(daysLeftLabel(2), "2 days left");
  assert.equal(daysLeftLabel(37), "37 days left");
  // A confirmed date in the past is filtered before it reaches a card, but a
  // clock that ticks over between render and read must not print "-1 days".
  assert.equal(daysLeftLabel(-3), "closes today");

  assert.equal(closesInPhrase(0), "closes today");
  assert.equal(closesInPhrase(1), "closes tomorrow");
  assert.equal(closesInPhrase(2), "closes in 2 days");
  assert.equal(closesInPhrase(37), "closes in 37 days");
  assert.equal(closesInPhrase(-3), "closes today");

  // Neither one may ever emit the shapes that made this a bug.
  for (const n of [-3, -1, 0, 1, 2, 5, 37]) {
    for (const s of [daysLeftLabel(n), closesInPhrase(n)]) {
      assert.ok(!/\b1 days\b/.test(s), `"${s}" says "1 days"`);
      assert.ok(!/\b0 days\b/.test(s), `"${s}" says "0 days"`);
      assert.ok(!/-\d/.test(s), `"${s}" carries a negative count`);
    }
  }
});

test("no component spells the days-left sentence for itself", () => {
  // This scanned a hardcoded list of four files until 2026-08-25, and by then
  // SIX rendered a countdown: `RoadmapView.tsx` said "due today" where every
  // other surface says "closes today", and `FirstWin.tsx` printed
  // `{days} days left` with no singular case, so a student one day out read
  // "1 days left". Both sat outside the list, so the guard reported nothing.
  //
  // **An inclusion list fails OPEN and an exemption list fails CLOSED**, and
  // that is the whole repair: a file added tomorrow is now scanned by default
  // and has to be argued out, rather than being invisible by default. The same
  // inversion is worth applying to every other hardcoded file list in here.
  const OWNS_THE_WORDING = new Set([
    // The module the label belongs to. `daysLeftLabel` and `closesInPhrase`
    // are defined here; this is the one place the words may be typed.
    "lib/data/opportunity-format.ts",
    // Builds a full SENTENCE with its own pluraliser (`${title} closes in 3
    // days.`), which is a different job from a badge label. Exempt by name and
    // with a reason, rather than by not being looked at.
    "lib/data/next-move.ts",
  ]);
  const offenders: string[] = [];
  for (const file of allRepoSources()) {
    const name = rel(file);
    if (OWNS_THE_WORDING.has(name)) continue;
    const src = stripComments(readFileSync(file, "utf8"));
    if (/\bdays? left\b/.test(src)) {
      offenders.push(`${name} — spells the countdown itself`);
    }
    if (/closes today|due today/.test(src)) {
      offenders.push(`${name} — spells the closing day itself`);
    }
  }
  assert.deepEqual(
    offenders,
    [],
    `import daysLeftLabel/closesInPhrase instead of retyping the words:\n  ${offenders.join("\n  ")}`,
  );
});

test("daysBetween reads a date-only string without building a Date", () => {
  // The fast path only fires on a plain YYYY-MM-DD. Anything else falls through
  // to the old behaviour EXACTLY, including the NaN a caller has always got for
  // a string this function cannot read — that is a contract rather than a bug,
  // and quietly turning it into a number would hide a bad row instead of
  // letting it render as "Dates TBA".
  const beforeUTC = (d: Date | string) => {
    const x = typeof d === "string" ? new Date(d + "T00:00:00Z") : d;
    return Date.UTC(x.getUTCFullYear(), x.getUTCMonth(), x.getUTCDate());
  };
  const before = (from: Date | string, to: Date | string) =>
    Math.round((beforeUTC(to) - beforeUTC(from)) / 86_400_000);

  const today = new Date("2026-08-19T00:00:00Z");
  for (const c of COMPETITIONS) {
    assert.equal(daysBetween(today, c.deadline), before(today, c.deadline), c.id);
    assert.equal(daysBetween(c.deadline, today), before(c.deadline, today), c.id);
  }
  // Both directions, a leap year and a whole year — the arithmetic, not the parse.
  assert.equal(daysBetween("2026-01-01", "2026-12-31"), 364);
  assert.equal(daysBetween("2028-02-28", "2028-03-01"), 2);
  assert.equal(daysBetween("2027-02-28", "2027-03-01"), 1);
  assert.equal(daysBetween("2026-12-31", "2026-01-01"), -364);
  // The unreadable string still reads as unreadable.
  assert.ok(Number.isNaN(daysBetween("not-a-date", today)));
});

test("a cached eligibility gate is the gate the parser would have produced", () => {
  // Keyed on the ROW, which is also why this pins the rule the cache must not
  // swallow: an explicit `gate` on an entry always beats the parsed sentence.
  // That rule sits one line above the cache and is the one a later edit is
  // most likely to fold into it.
  for (const c of COMPETITIONS) {
    const expected = c.gate ?? parseEligibility(c.eligibility);
    assert.deepEqual(gateFor(c), expected, `gate drift on ${c.id}`);
    // Again, because the second call is the one served from the cache.
    assert.deepEqual(gateFor(c), expected, `cached gate drift on ${c.id}`);
  }
  const pinned = COMPETITIONS.find((c) => c.gate);
  if (pinned) assert.equal(gateFor(pinned), pinned.gate);

  // A row rebuilt by resolveCompetitions is a NEW object carrying the same
  // sentence — a fresh key, and it has to be parsed rather than missed.
  const plain = COMPETITIONS.find((c) => !c.gate && c.eligibility);
  assert.ok(plain, "expected at least one catalog row with a parsed gate");
  const rebuilt = { ...plain!, deadline: "2027-01-01" };
  assert.deepEqual(gateFor(rebuilt), parseEligibility(rebuilt.eligibility));
});

test("the one-pass matcher returns what the five-pass chain returned", () => {
  // The chain was five map/filter stages; it is one loop now. MEMBERSHIP is
  // re-derived here straight from the primitives, so a bug in the loop cannot
  // hide behind the same bug in the reference.
  //
  // That independence does NOT extend to the region flag asserted further
  // down, which calls `reachableFrom` — the same helper the matcher calls. It
  // is deliberate rather than sloppy: `reachableFrom` is three lines of pure
  // logic with its own direct unit coverage, including the empty-string case,
  // and re-deriving it here would only re-test the thing that is already
  // tested. Worth stating, because an earlier version of this comment claimed
  // the independence for the whole test and a reader would have believed it.
  const today = new Date("2026-08-19T00:00:00Z");
  const profiles: {
    faculties: string[];
    factors: { key: string; score: number }[];
  }[] = [
    { faculties: [], factors: [] },
    { faculties: ["computer_science"], factors: [] },
    {
      faculties: ["engineering", "arts_design"],
      factors: [
        { key: "awards", score: 9 },
        { key: "extracurricular_depth", score: 8 },
        { key: "academics", score: 9 },
      ],
    },
  ];
  let combinations = 0;
  for (const p of profiles) {
    for (const homeCountry of [null, "KZ", "US", "UZ"]) {
      for (const graduationYear of [undefined, 2027, 2028, 2031]) {
        const grade = gradeFromGraduationYear(graduationYear, today);
        const ageRange = grade == null ? null : plausibleAgeForGrade(grade);
        // Region does NOT appear here, and that absence is the point.
        //
        // It used to: this reference read `if (!reachableFrom(c, homeCountry))
        // return false;`, which is what the matcher did BEFORE the one-list
        // release made matching annotate instead of hide. The reference was
        // written on 2026-08-19, three days after that release, and it stayed
        // green for six days — not because it agreed with the code, but
        // because the catalog held zero `region`-tagged rows and the line
        // could not be reached. The first local row made the two disagree on
        // ten entries at once.
        //
        // So the membership rule is: a confirmed past date is gone, a row the
        // student can never enter is gone, and everything else comes back.
        // Off-region is a FLAG, asserted separately below, and the default
        // filters are what narrow the list a student actually sees.
        const expected = COMPETITIONS.filter((c) => {
          if (c.dateConfirmed && daysBetween(today, c.deadline) < 0) return false;
          const v = checkEligibility(c.gate ?? parseEligibility(c.eligibility), {
            country: homeCountry,
            grade,
            ageRange,
          });
          return v.ok || v.reason === "too_young";
        }).map((c) => c.id);

        const items = buildExtracurriculars({
          today,
          faculties: p.faculties,
          factors: p.factors,
          homeCountry,
          graduationYear,
        }).items;
        const got = items.map((o) => o.id);

        assert.deepEqual(
          [...got].sort(),
          [...expected].sort(),
          `membership drift: fields=${p.faculties} country=${homeCountry} year=${graduationYear}`,
        );

        // The half the membership rule above deliberately stopped covering.
        // Taking region out of `expected` without putting it back HERE would
        // have turned a stale guard into an absent one, which is the worse of
        // the two — the flag is what the panel filters on and what
        // `matchedOnly` reads, so a wrong flag shows a student in Rome a
        // one-day event in Kostanay with nothing looking broken.
        for (const o of items) {
          assert.equal(
            o.offRegion,
            !reachableFrom(o, homeCountry),
            `offRegion drift on ${o.id} for country=${homeCountry}`,
          );
        }
        // And the narrowed list — what a student actually sees, since both
        // match options default ON — still carries nothing from anywhere else.
        for (const o of matchedOnly(items)) {
          assert.ok(
            reachableFrom(o, homeCountry),
            `${o.id} survived matchedOnly for country=${homeCountry}`,
          );
        }
        combinations++;
      }
    }
  }
  assert.ok(combinations >= 36, "the matrix stopped covering what it claims to");

  // Sorting in place must still be a total, repeatable answer.
  const args = {
    today,
    faculties: ["computer_science"],
    factors: [],
    homeCountry: "KZ",
    graduationYear: 2028,
  };
  assert.deepEqual(
    buildExtracurriculars(args).items.map((o) => o.id),
    buildExtracurriculars(args).items.map((o) => o.id),
  );
});

test("the remembered search haystack is the haystack, for every query shape", () => {
  // The haystack is built once per row and reused across the six faceting
  // passes. Built from the wrong row, search would return someone else's
  // opportunity for a term that is not on the card — the exact failure the
  // whole matching layer is written to prevent.
  const today = new Date("2026-08-19T00:00:00Z");
  const items = buildExtracurriculars({
    today,
    faculties: [],
    factors: [],
    homeCountry: null,
    graduationYear: 2028,
  }).items;

  const before = (o: Opportunity, q: string) => {
    const terms = q.toLowerCase().split(/\s+/).filter(Boolean);
    if (terms.length === 0) return true;
    const hay = [o.name, o.blurb, o.eligibility, o.city, o.partner?.name]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();
    return terms.every((t) => hay.includes(t));
  };

  const queries = [
    "", // empty matches everything
    "   ", // whitespace is still empty
    "math",
    "MATH", // case folds
    "math olympiad",
    "olympiad math", // any order
    "  spaced   out  ", // repeated separators
    "zzzznope", // matches nothing
  ];
  for (const q of queries) {
    for (const o of items) {
      assert.equal(matchesQuery(o, q), before(o, q), `query="${q}" row=${o.id}`);
      // Twice: the first call fills the cache, the second reads it.
      assert.equal(
        matchesQuery(o, q),
        before(o, q),
        `cached query="${q}" row=${o.id}`,
      );
    }
  }
  // And through the pass that tokenises once for the list instead of per row.
  for (const q of queries) {
    assert.deepEqual(
      filterOpportunities(items, {
        ...NO_FILTERS,
        matched: [],
        query: q,
      }).map((o) => o.id),
      items.filter((o) => before(o, q)).map((o) => o.id),
      `filterOpportunities disagrees with matchesQuery for "${q}"`,
    );
  }
});

test("the indexed registry lookups answer what the scans answered", () => {
  // Both were linear scans rebuilt per call. `universitiesForHub` flattened the
  // entire institution registry to keep a handful of rows, and its ORDER is
  // load-bearing: the guide names institutions and never ranks them, so "the
  // registry's own order" is the rule, and a grouping pass that reordered them
  // would be a ranking introduced by accident.
  for (const h of HUBS) {
    assert.equal(
      destinationForHub(h.id),
      STUDY_DESTINATIONS.find((d) => d.hubs.includes(h.id)),
      h.id,
    );
    assert.deepEqual(
      universitiesForHub(h.id),
      Object.values(PLACE_UNIVERSITIES)
        .flat()
        .filter((u) => u.hub === h.id),
      h.id,
    );
  }
  // An id nothing claims stays unclaimed rather than falling into a bucket.
  for (const bogus of ["", "nowhere", "BERLIN"]) {
    assert.equal(destinationForHub(bogus), undefined, bogus);
    assert.deepEqual(universitiesForHub(bogus), []);
  }
  // A null `hub` means "named city, no page" and must never become a key.
  const unhoused = Object.values(PLACE_UNIVERSITIES)
    .flat()
    .filter((u) => !u.hub);
  for (const u of unhoused) {
    assert.ok(
      !HUBS.some((h) => universitiesForHub(h.id).includes(u)),
      `${u.name} has no hub but was filed under one`,
    );
  }
});

test("the memoised spine is one object per field, and it is the derived one", () => {
  // The memo hands every caller THE SAME object, which is what makes it cheap
  // and also what makes it worth writing down: a view that sorted `stops` in
  // place would reorder the chain for every later request and break the
  // home-region-leads rule for everyone. Nothing does today.
  for (const f of FACULTY_VALUES) {
    const first = spineForFaculty(f);
    assert.equal(spineForFaculty(f), first, `spine for ${f} is rebuilt per call`);
    // Still self-consistent, and still derived rather than stored.
    assert.equal(
      first.hubCount,
      first.stops.reduce((n, s) => n + s.hubs.length, 0),
      f,
    );
    assert.equal(
      first.universityCount,
      first.stops.reduce((n, s) => n + s.universities.length, 0),
      f,
    );
    // Rule 2 still holds through the memo: every stop can be opened.
    for (const s of first.stops) {
      assert.ok(
        s.destination !== null || s.hubs.length > 0,
        `${f}: ${s.country} is a stop with nothing behind it`,
      );
    }
  }
});

test("mind map: the branch walks survive a cycle, in BOTH directions", () => {
  // `buildTree` was written on the stated assumption that this table can hold a
  // cycle, and it breaks one rather than recursing into it. The two walks the
  // MOVE actions run had drifted apart on exactly that point: `branchDepth`
  // carried a visited set, `branchHeight` — its neighbour, used by the same
  // indent check — recursed into its children with neither a visited set nor a
  // ceiling. So a cycle the renderer survived overflowed the stack inside a
  // server action and turned it into a 500.
  //
  // Both are asserted here because the pair is the point: they are used in one
  // expression (`branchDepth(parent) + 1 + branchHeight(node)`), and either one
  // spinning takes the whole action down.
  const cyclic: TreeRow[] = [
    { id: "root", parentId: null },
    { id: "a", parentId: "b" },
    { id: "b", parentId: "a" }, // a → b → a
  ];
  // Would not return at all before the fix.
  assert.ok(branchHeight(cyclic, "a") <= MINDMAP_MAX_DEPTH + 2);
  assert.ok(branchDepth(cyclic, "a") <= MINDMAP_MAX_DEPTH + 2);
  // A self-parenting row is the shortest cycle there is.
  const selfLoop: TreeRow[] = [
    { id: "root", parentId: null },
    { id: "x", parentId: "x" },
  ];
  assert.ok(branchHeight(selfLoop, "x") <= MINDMAP_MAX_DEPTH + 2);
  assert.ok(branchDepth(selfLoop, "x") <= MINDMAP_MAX_DEPTH + 2);

  // A cycle somewhere else in the table must not affect a healthy branch.
  const mixed: TreeRow[] = [
    { id: "root", parentId: null },
    { id: "k1", parentId: "root" },
    { id: "k2", parentId: "k1" },
    { id: "a", parentId: "b" },
    { id: "b", parentId: "a" },
  ];
  assert.equal(branchHeight(mixed, "root"), 2);
  assert.equal(branchDepth(mixed, "k2"), 2);
});

test("mind map: branch height and depth measure what the indent check needs", () => {
  //        root
  //        ├── a ── a1 ── a2
  //        └── b
  const rows: TreeRow[] = [
    { id: "root", parentId: null },
    { id: "a", parentId: "root" },
    { id: "a1", parentId: "a" },
    { id: "a2", parentId: "a1" },
    { id: "b", parentId: "root" },
  ];
  assert.equal(branchHeight(rows, "a2"), 0, "a leaf is height 0");
  assert.equal(branchHeight(rows, "a1"), 1);
  assert.equal(branchHeight(rows, "a"), 2);
  assert.equal(branchHeight(rows, "root"), 3, "the longest branch, not a count");
  assert.equal(branchHeight(rows, "b"), 0);
  assert.equal(branchDepth(rows, "root"), 0, "a root is depth 0");
  assert.equal(branchDepth(rows, "a2"), 3);
  // An id nothing knows about is depth 0 and height 0, not a throw.
  assert.equal(branchDepth(rows, "ghost"), 0);
  assert.equal(branchHeight(rows, "ghost"), 0);

  // The check the action actually runs: indenting `b` under `a` would put a
  // three-deep branch below a node already one deep.
  assert.equal(branchDepth(rows, "a") + 1 + branchHeight(rows, "b"), 2);
  assert.ok(branchDepth(rows, "a") + 1 + branchHeight(rows, "a1") > 2);
});

test("mind map: a very deep chain is bounded, not recursed to the stack limit", () => {
  // Depth is capped in the database by the actions, but nothing stops a chain
  // arriving longer than the cap — an edited row, a migration run by hand. The
  // walk must answer rather than run to the end of a 50,000-long chain.
  const rows: TreeRow[] = [{ id: "n0", parentId: null }];
  for (let i = 1; i < 50_000; i++) {
    rows.push({ id: `n${i}`, parentId: `n${i - 1}` });
  }
  assert.equal(branchHeight(rows, "n0"), MINDMAP_MAX_DEPTH + 3);
  assert.equal(branchDepth(rows, "n49999"), MINDMAP_MAX_DEPTH + 3);
});

test("a single visit of any size has a length, rather than a RangeError", () => {
  // `Math.min(...times)` passed one argument per view, and an argument list
  // past roughly 100,000 throws. It never threw in production — /admin/traffic
  // caps its query at 50,000 rows, so a visit could not get that big — but the
  // safety was a constant in another file rather than anything in this one.
  // 150,000 is above where the spread gives out and below nothing in
  // particular, which is the point: the answer should not depend on the size.
  const many: ViewRow[] = Array.from({ length: 150_000 }, (_, i) =>
    view({
      session_id: "one-long-visit",
      created_at: new Date(T0 - (150_000 - i) * 1000).toISOString(),
      dwell_ms: 1000,
    }),
  );
  const ms = visitDurationMs(many);
  assert.equal(
    ms,
    150_000 * 1000 - 1000 + 1000,
    "the span is first to last, plus the last page's reading time",
  );

  // …and the ordinary cases are untouched: the minimum is the EARLIEST view,
  // whatever order the rows arrive in.
  const shuffled: ViewRow[] = [
    view({ created_at: new Date(T0 + 60_000).toISOString(), dwell_ms: 5_000 }),
    view({ created_at: new Date(T0).toISOString(), dwell_ms: 1_000 }),
    view({ created_at: new Date(T0 + 30_000).toISOString(), dwell_ms: 2_000 }),
  ];
  assert.equal(visitDurationMs(shuffled), 65_000);
  assert.equal(visitDurationMs([]), null, "no views is unknown, not zero");
});

// A minimal confirmed row. The calendar only ever builds from confirmed dates.
const icsRow = (o: Partial<Competition> & { id: string }): Competition => ({
  name: "A real-looking hackathon",
  fields: "all",
  deadline: "2026-11-01",
  window: "November",
  level: "national",
  url: "https://example.org/",
  blurb: "Nothing wrong with this blurb.",
  dateConfirmed: true,
  ...o,
});

test("a partner-supplied link cannot write extra events into a calendar", () => {
  // `URL:` is a URI property, not TEXT — a backslash escapes nothing there, so
  // the only correct treatment is to remove what cannot sit on a content line.
  //
  // This was a live hole. The same string went through `icsText` for
  // DESCRIPTION and raw for URL, and the partner form's
  // `z.string().trim().url()` ACCEPTS a CR or LF inside a URL — the WHATWG
  // parser it calls tolerates them — and stored it verbatim. A calendar file
  // is downloaded into a student's own calendar, where taking the post down
  // afterwards reaches nothing at all.
  const evil = [
    "https://example.com/a\r\nX-EVIL:1",
    "https://example.com/a\r\nEND:VEVENT\r\nBEGIN:VEVENT\r\nSUMMARY:Injected",
    "https://example.com/a\nSUMMARY:Injected",
    "https://example.com/a\tb",
    "https://example.com/a\u0000b",
  ];
  for (const url of evil) {
    const ics = buildIcs([icsRow({ id: "partner-x", url })]);
    const lines = ics.split("\r\n");

    // LINES, not substrings. `BEGIN:VEVENT` legitimately appears inside the
    // DESCRIPTION value, where `icsText` escaped the newline to a literal
    // backslash-n — that is the escaping working, and counting substrings
    // would call it a failure. Injection means a value became a PROPERTY LINE
    // of its own, so the lines are the only thing worth counting.
    assert.equal(
      lines.filter((l) => l === "BEGIN:VEVENT").length,
      1,
      `a link opened a second event: ${JSON.stringify(url)}`,
    );
    assert.equal(lines.filter((l) => l === "END:VEVENT").length, 1);
    assert.ok(
      !lines.some((l) => l.startsWith("X-EVIL")),
      "an injected property became a line of its own",
    );
    assert.ok(
      !lines.some((l) => l === "SUMMARY:Injected"),
      "an injected summary became a line of its own",
    );

    // Every line is a property or a structural keyword, and none of them
    // carries a character that cannot be on a content line.
    for (const line of lines) {
      assert.match(
        line,
        /^[A-Za-z-]+[;:]/,
        `not a property line: ${JSON.stringify(line)}`,
      );
      assert.ok(
        // eslint-disable-next-line no-control-regex -- looking for them is the point
        !/[\u0000-\u001F\u007F]/.test(line),
        `a control character reached a content line: ${JSON.stringify(line)}`,
      );
    }
  }
});

test("the calendar still says what it is supposed to say", () => {
  // Stripping is worthless if it also mangles the links students follow, so the
  // ordinary row is asserted character for character.
  const ics = buildIcs([
    icsRow({
      id: "imo",
      name: "IMO — International Mathematical Olympiad",
      url: "https://www.imo-official.org/?a=1&b=2#top",
      blurb: "The world championship of school mathematics.",
    }),
    // An unconfirmed row never gets an event: a reminder set on a guessed date
    // sends a student to a page that is not open, which is worse than none.
    icsRow({ id: "guessed", dateConfirmed: false }),
  ]);

  assert.equal(
    ics.match(/BEGIN:VEVENT/g)?.length,
    1,
    "an unconfirmed date was given a reminder",
  );
  assert.ok(ics.includes("URL:https://www.imo-official.org/?a=1&b=2#top"));
  assert.ok(ics.includes("UID:imo@compass"));
  assert.ok(ics.includes("DTSTART;VALUE=DATE:20261101"));
  assert.ok(ics.includes("TRIGGER:-P7D"));

  // The TEXT rule still applies where TEXT is what the property holds — the URI
  // rule was added beside it, not in place of it.
  const withPunctuation = buildIcs([
    icsRow({ id: "x", name: "Maths, physics and informatics", blurb: "One; two, three." }),
  ]);
  assert.ok(
    withPunctuation.includes("SUMMARY:Deadline — Maths\\, physics and informatics"),
  );
  assert.ok(withPunctuation.includes("DESCRIPTION:One\\; two\\, three."));

  // Nothing at all to put in a calendar is an empty calendar, not a crash.
  const none = buildIcs([icsRow({ id: "y", dateConfirmed: false })]);
  assert.ok(!none.includes("BEGIN:VEVENT"));
  assert.ok(none.startsWith("BEGIN:VCALENDAR"));
  assert.ok(none.endsWith("END:VCALENDAR"));
});

// ── Structured data ─────────────────────────────────────────────────────────
//
// Same shape of risk as the calendar above, and the same answer. A partner
// names their own organisation and every post they publish, and those names
// travel into an opportunity page's breadcrumb — this time into a `<script>`
// element, whose body is raw text until the parser sees `</script`. So the
// escape is asserted against a name that tries to close the block, not merely
// asserted to exist.

test("a partner-supplied name cannot end the JSON-LD block", () => {
  // The separators are built from their code points rather than typed. A raw
  // U+2028 in a source file is invisible and does not survive an editor or a
  // patch — writing this file the first time proved it twice.
  const LS = String.fromCharCode(0x2028);
  const PS = String.fromCharCode(0x2029);

  const hostile = {
    name: `</script><img src=x onerror=alert(1)>`,
    amp: "Tom & Jerry",
    seps: `a${LS}b${PS}c`,
  };
  const out = serializeJsonLd(hostile);

  assert.ok(
    !/<\/script/i.test(out),
    "the payload can close the script element it sits in",
  );
  assert.ok(!out.includes("<"), "a raw < survived into the script body");
  assert.ok(!out.includes(">"), "a raw > survived into the script body");
  assert.ok(!out.includes("&"), "a raw & survived into the script body");
  assert.ok(!out.includes(LS), "a raw U+2028 survived — that is a parse error");
  assert.ok(!out.includes(PS), "a raw U+2029 survived — that is a parse error");

  // Escaping that changed the data would be its own bug: the crawler must read
  // exactly the name the partner typed.
  const back = JSON.parse(out) as typeof hostile;
  assert.deepEqual(back, hostile, "escaping altered the payload");

  // And it bites through the builders, not only when called directly — that is
  // the path a real partner name actually takes.
  const crumbs = serializeJsonLd(
    breadcrumbSchema([
      { name: "Everything you can enter", path: "/opportunities" },
      { name: hostile.name, path: "/opportunities/x" },
    ]),
  );
  assert.ok(!/<\/script/i.test(crumbs));
});

test("the trail a crawler is given is the canonical path", () => {
  // `?f=` is a filter, not a document, and `pageMeta` already drops it from the
  // canonical. A breadcrumb naming the filtered URL would contradict the
  // canonical on the very page it sits on — and `crumbHref` in the guide is
  // routinely filtered, because every in-section link goes through
  // `withFields`.
  assert.equal(canonicalPath("/guide/places?f=law"), "/guide/places");
  assert.equal(canonicalPath("/guide/places#money"), "/guide/places");
  assert.equal(canonicalPath("/guide/places?f=law#money"), "/guide/places");
  assert.equal(canonicalPath("/guide/places"), "/guide/places");

  const trail = breadcrumbSchema([
    { name: "The guide", path: "/guide" },
    { name: "Countries", path: "/guide/places?f=law" },
    { name: "Germany", path: "/guide/places/germany" },
  ]);
  const items = trail.itemListElement as {
    position: number;
    name: string;
    item: string;
  }[];

  assert.deepEqual(
    items.map((i) => i.position),
    [1, 2, 3],
    "positions must be 1-based and in order or the trail is ignored",
  );
  assert.ok(
    items.every((i) => i.item.startsWith("https://")),
    "a breadcrumb item has to be an absolute URL",
  );
  assert.ok(
    !items.some((i) => i.item.includes("?")),
    "a query string reached the structured data",
  );
  assert.equal(items[2].name, "Germany");
});

test("the FAQ markup carries the answers, and the site claims no search it lacks", () => {
  const items = [
    { q: "Is it free?", a: "Yes, all of it." },
    { q: "Do I need an account?", a: "No." },
  ];
  const faq = faqSchema(items);
  const questions = faq.mainEntity as {
    name: string;
    acceptedAnswer: { text: string };
  }[];
  assert.equal(questions.length, items.length);
  assert.deepEqual(
    questions.map((q) => q.acceptedAnswer.text),
    items.map((i) => i.a),
    "an answer went missing between the page and the markup",
  );

  // Pinned deliberately, so removing it is a decision rather than an accident.
  // A `SearchAction` needs a URL TEMPLATE that runs a search, and the search on
  // /opportunities is client state inside FilterBar — nothing here answers
  // `?q=`. Declaring it would hand Google a URL that loads the unfiltered list.
  assert.ok(
    !("potentialAction" in webSiteSchema()),
    "a sitelinks search box was declared for a search that is not in the URL",
  );

  // The one claim in the Organization block that could quietly become false.
  assert.ok(
    !("sameAs" in organizationSchema()),
    "sameAs names profiles we do not control",
  );
});

// ── What a search result actually shows ─────────────────────────────────────
//
// Measured live on 2026-08-22: 250 of 317 titles ran past 60 characters and 205
// of 317 descriptions past 160, so on most pages the tail was cut. Nothing was
// duplicated and nothing was missing — the uniqueness work held and the LENGTH
// was never checked, because no test looked at it.

test("boilerplate never pushes the subject out of a title", () => {
  // The property that matters, stated as a property rather than as a list of
  // pages: the qualifier is a nicety and the subject is not.
  const short = fitTitle("Berlin", "the catch and the way in");
  assert.ok(short.length <= SERP_TITLE_MAX);
  assert.ok(short.startsWith("Berlin"), "the subject has to lead");
  assert.ok(short.includes("Compass"), "the brand fits here and should be kept");

  // Long subject: the qualifier goes first, then the brand, and the subject is
  // never cut. A name sliced mid-word is worse in a result than a long one.
  const long =
    "Machine Learning Specialization by Andrew Ng and Stanford Online";
  const fitted = fitTitle(long, "cost, dates and who can enter");
  assert.ok(!fitted.includes("cost, dates"), "the qualifier survived past the budget");
  assert.ok(fitted.startsWith(long), "the subject was truncated");

  // The middle case: brand fits, qualifier does not.
  const mid = fitTitle("Studying in the United Arab Emirates", "the honest picture");
  assert.equal(mid, "Studying in the United Arab Emirates | Compass");
  assert.ok(mid.length <= SERP_TITLE_MAX);
});

test("every real subject we publish produces a title inside the budget", () => {
  // Over the actual registries, with the qualifiers the routes actually pass.
  const cases: [string, string][] = [
    ...HUBS.map(
      (h) => [`Working in ${h.city}`, "the catch and the way in"] as [string, string],
    ),
    ...STUDY_DESTINATIONS.map(
      (d) => [`Studying in ${d.name}`, "the honest picture"] as [string, string],
    ),
    ...MAJORS.map(
      (m) => [m.name, "what it is, and who should not"] as [string, string],
    ),
    ...allCareerAreas().map(
      ({ area }) => [area.title, "what it is and how you get in"] as [string, string],
    ),
  ];
  const over = cases
    .map(([s, q]) => ({ s, title: fitTitle(s, q) }))
    .filter((c) => c.title.length > SERP_TITLE_MAX);
  assert.deepEqual(
    over.map((c) => `${c.title.length} ${c.title}`),
    [],
    "these titles are cut in a search result",
  );

  // The catalog is the one set where a name alone can exceed the budget, and
  // that is allowed — but the fallback must have dropped everything droppable.
  for (const c of COMPETITIONS) {
    const t = fitTitle(c.name, "cost, dates and who can enter");
    if (t.length > SERP_TITLE_MAX) {
      assert.equal(t, c.name, `${c.id}: over budget but still carrying boilerplate`);
    }
  }

  // Shortening must not make two pages share a title. Dropping a qualifier
  // removes the differentiating half, so the subjects have to carry it — and
  // for the catalog the fallback is the bare name, which is the only thing
  // left to tell two rows apart.
  const catalogTitles = COMPETITIONS.map((c) =>
    fitTitle(c.name, "cost, dates and who can enter"),
  );
  assert.equal(
    new Set(catalogTitles).size,
    catalogTitles.length,
    "two opportunities now produce the same title",
  );
  const guideTitles = cases.map(([s, q]) => fitTitle(s, q));
  assert.equal(
    new Set(guideTitles).size,
    guideTitles.length,
    "two guide pages now produce the same title",
  );
});

test("only a WRONG url fails the link gate, and a wrong one still does", () => {
  // The weekly Link health workflow failed on all four runs of its life, every
  // time naming links that were alive: GitHub's runners get refused by a dozen
  // of these hosts. Verified by hand on 2026-08-24 — ijsoweb.org,
  // shanghai.nyu.edu and icaci.org all answer 200 from a residential request,
  // and icaci.org renders fully in a browser while resetting curl.
  //
  // A gate that has never once passed is a red light people scroll past, which
  // is worse than no gate: it also hides the day something is really wrong. The
  // file's own comment always described the right rule and the code did not
  // implement it, so this asserts the rule rather than the comment.

  // The far end says our address is wrong.
  for (const s of [400, 404, 405, 410, 451]) {
    assert.equal(classifyStatus(s), "broken", `HTTP ${s} should fail the gate`);
  }

  // The far end says the fault is its own. Editing our link cannot fix it.
  for (const s of [500, 502, 503, 504, 522]) {
    assert.equal(
      classifyStatus(s),
      "unreachable",
      `HTTP ${s} is their server, not our URL`,
    );
  }

  // The far end answered and refused this caller because it thinks we are a
  // script. A human browser sails past, so this proves nothing and fails
  // nothing.
  // 412 is in this list, and it was missing until 2026-08-25. The guide's
  // checker had treated it as a bot wall for releases and CLAUDE.md stated the
  // rule as "403/429/412", so the catalog gate was the one copy that had not
  // been told — and a catalog URL behind such a rule would have fallen through
  // to `broken` and exited 1 on a live page. Two gates, one rule.
  for (const s of [403, 406, 409, 412, 429]) {
    assert.equal(classifyStatus(s), "blocked");
  }

  // 401 is NOT a bot wall, and it sat inside that set until 2026-08-24.
  //
  // "We think you are a robot" and "this needs credentials you do not have"
  // are different sentences, and only the first one describes a link a student
  // can still open. The catalog's NAO Cup row was a Google Forms /edit address
  // carrying a response token — an owner-only URL answering 401 to everyone
  // else — and this gate reported that run as "170/173 healthy · 0 broken".
  // The one row it was built to catch was the one it waved through.
  assert.equal(classifyStatus(401), "private");
  assert.deepEqual([...FAILS_THE_GATE].sort(), ["broken", "private"]);

  for (const s of [200, 204, 301, 302]) {
    assert.equal(classifyStatus(s), "ok");
  }
});

test("the pages that bypass pageMeta are inside the budget too", () => {
  // `fitDescription` runs inside `pageMeta`, which is exactly why the routes
  // that do NOT use it were the ones left over. The home page is the important
  // one: its metadata lives in the root layout, it inherits down to /demo, and
  // it is the page most likely to be seen in a result. It was 228 characters
  // while every page that went through the helper was inside 160.
  const src = readFileSync(
    path.join(process.cwd(), "app/layout.tsx"),
    "utf8",
  );
  const m = src.match(/description:\s*\n?\s*"([^"]+)"/);
  assert.ok(m, "the root layout no longer declares a description");
  assert.ok(
    m![1].length <= SERP_DESCRIPTION_MAX,
    `the root description is ${m![1].length} characters; a result shows about ${SERP_DESCRIPTION_MAX}`,
  );
  // And it should still be a real description, not a stub.
  assert.ok(m![1].length >= 90, "the root description is too short to be useful");
});

test("no description we publish is longer than a result will show", () => {
  const sources = [
    ...HUBS.map((h) => h.what),
    ...STUDY_DESTINATIONS.map((d) => d.oneLine),
    ...MAJORS.map((m) => m.whatItActuallyIs),
    ...allCareerAreas().map(({ area }) => area.what),
  ];
  for (const s of sources) {
    const d = fitDescription(s);
    assert.ok(
      d.length <= SERP_DESCRIPTION_MAX,
      `description is ${d.length}: ${d.slice(0, 60)}`,
    );
  }
  // It trims at a boundary, not mid-word.
  const long = "A".repeat(80) + " " + "B".repeat(120);
  const cut = fitDescription(long);
  assert.ok(cut.length <= SERP_DESCRIPTION_MAX);
  assert.ok(cut.endsWith("…"), "a hard cut should say it was cut");
  // A sentence boundary is preferred when there is one past the floor.
  const twoSentences =
    "This opening sentence is comfortably past the eighty-character floor and stands alone. " +
    "This second one pushes the whole thing past the budget, so it is dropped entirely.";
  assert.ok(twoSentences.length > SERP_DESCRIPTION_MAX, "fixture must need trimming");
  assert.ok(fitDescription(twoSentences).endsWith("stands alone."));

  // A short first sentence is NOT allowed to become the whole description: the
  // ellipsis carries more of the text than stopping at the full stop would.
  const shortThenLong =
    "Too short. " +
    "Everything worth knowing is in this second sentence, which runs well past the budget and therefore has to be cut somewhere.";
  assert.ok(!fitDescription(shortThenLong).endsWith("Too short."));
  // Short text is returned untouched.
  assert.equal(fitDescription("Short and fine."), "Short and fine.");
});

test("the country list leads with what we actually model, and says nothing else", () => {
  // The order of this list is the only editorial claim it makes, so both halves
  // are pinned. It used to lead with the home region on the argument that a
  // guide listing eighteen ways to leave and none to stay is recommending; the
  // founders' counter-argument was that leading with Kazakhstan steers just as
  // hard in the other direction. The lead is derived from `modelled` now, which
  // is a fact about the product rather than a view about a country.
  const flags = STUDY_DESTINATIONS.map((d) => d.modelled);
  const lastModelled = flags.lastIndexOf(true);
  const firstUnmodelled = flags.indexOf(false);
  assert.ok(
    lastModelled < firstUnmodelled,
    "a modelled destination fell behind an unmodelled one, so the lead is no longer the stated rule",
  );

  // Derived, not hand-listed: the front of the list must BE the modelled set,
  // so a country that gains or loses an odds engine moves on its own.
  const lead = STUDY_DESTINATIONS.slice(0, lastModelled + 1).map((d) => d.id);
  assert.deepEqual(
    [...lead].sort(),
    STUDY_DESTINATIONS.filter((d) => d.modelled)
      .map((d) => d.id)
      .sort(),
  );

  // And those are the five the report actually computes. If this ever fails it
  // means either a country gained an engine and nobody told the report, or the
  // flag is being used for something it does not mean.
  assert.deepEqual([...lead].sort(), [
    "hong-kong",
    "italy",
    "south-korea",
    "uae",
    "united-states",
  ]);

  // The regional grouping is a different thing and is deliberately untouched:
  // it groups the world map geographically and asserts nothing about merit.
  assert.equal(REGION_ORDER[0], "central_asia");
});

test("the phone call-to-action appears only where the page has none", () => {
  // The numbers are measured, not invented: the landing page at 375x812, with
  // the hero button row and the closing call as the two edges. An
  // IntersectionObserver does not fire at all in a throttled pane, so this is
  // the only place the rule can actually be checked.
  const VIEW = 812;
  const at = (heroTop: number, finalTop: number): CtaEdges => {
    let e = NO_EDGES;
    e = foldEdge(e, "hero", heroTop < VIEW && heroTop > -60, heroTop);
    e = foldEdge(e, "final", finalTop < VIEW && finalTop > -1200, finalTop);
    return e;
  };

  // Top of the page: the hero's own buttons are right there.
  assert.equal(
    stickyCtaVisible(at(607, 13800)),
    false,
    "two filled controls on one screen — the rule this bar exists under",
  );

  // The long middle, where every measured scroll position has nothing to press.
  assert.equal(stickyCtaVisible(at(-5731, 6712)), true);
  assert.equal(stickyCtaVisible(at(-2000, 9000)), true);

  // The closing call is on screen and is the real thing. The bar gets out of
  // its way rather than floating over it.
  assert.equal(stickyCtaVisible(at(-12000, 300)), false);

  // Past it, at the footer, whose links are small and close together. This is
  // the latch: "reached" has to mean at-or-past, never "currently visible", or
  // the bar comes back on top of Privacy and Terms.
  assert.equal(
    stickyCtaVisible(at(-13000, -900)),
    false,
    "the bar returned over the footer",
  );

  // First paint, before anything has scrolled: the closing call is below the
  // fold and so is also "not intersecting". Keying on that alone is the bug
  // `top < 0` rules out — it would show the bar at scroll position zero.
  const firstPaint = foldEdge(NO_EDGES, "hero", false, 13800);
  assert.equal(
    stickyCtaVisible(firstPaint),
    false,
    "an element below the fold was read as one scrolled past",
  );
});
