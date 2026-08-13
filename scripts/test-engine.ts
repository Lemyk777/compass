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
import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { renderModule } from "./build-map-outlines";
import { MAP_OUTLINES } from "@/lib/data/map-outlines";
import { COUNTRIES } from "@/lib/data/map-markers";
import {
  PLACE_UNIVERSITIES,
  universitiesForHub,
  universitiesForPlace,
} from "@/lib/data/place-universities";

import { RUBRIC, computeOverall, type FactorKey } from "@/lib/rubric";
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
} from "@/lib/data/key-dates";
import type { CompetitionLevel, Opportunity } from "@/lib/data/key-dates";
import {
  NO_FILTERS,
  activeChips,
  activeFilterCount,
  filterOpportunities,
  opportunityFacets,
  withoutChip,
  type CostBucket,
  type TimingBucket,
} from "@/lib/data/opportunity-filter";
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
import { HOME_ROUTES, homeRoutesForFaculties } from "@/lib/data/from-home";
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
import { PLANNER_SECTIONS } from "@/lib/data/planner-sections";
import {
  MINDMAP_MAX_DEPTH,
  buildTree,
  canIndent,
  canMoveDown,
  canMoveUp,
  canOutdent,
  layoutTree,
  type MapNode,
  type MapNodeRow,
} from "@/lib/data/mindmap";
import {
  PLANNER_COLUMNS,
  buildPlanner,
  daysBetweenISO,
  intentStatusFromPlanner,
  isMovable,
  plannerStatusFromIntent,
  stepStatus,
  type PlannerInputs,
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

test("no filters is the identity — the default render pays nothing", () => {
  assert.equal(filterOpportunities(FILTER_POOL, NO_FILTERS), FILTER_POOL);
  assert.equal(activeFilterCount(NO_FILTERS), 0);
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
  const f = {
    query: "robotics",
    cost: ["free", "paid"] as CostBucket[],
    timing: ["closing"] as TimingBucket[],
    levels: ["national"] as CompetitionLevel[],
    openOnly: true,
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
    [1, 2, 3, 4],
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
  assert.deepEqual(
    GUIDE_SECTIONS.map((s) => s.id),
    ["work", "places", "cities", "from-home"],
  );
  assert.equal(nextGuideSection("work")?.id, "places");
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

// Nothing may freeze a colour: a literal hex in a component or a data file stays
// light-mode red on a dark page. The two files that used to hold the palette are
// the ones most likely to grow one back.
test("the shared colour modules hold no frozen hex", () => {
  for (const f of ["lib/tiers.ts", "tailwind.config.ts"]) {
    const text = readFileSync(path.join(process.cwd(), f), "utf8");
    const code = text.replace(/\/\/[^\n]*|\/\*[\s\S]*?\*\//g, "");
    const frozen = code.match(/#[0-9A-Fa-f]{6}\b/g) ?? [];
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
          if (/text-(reach|target|likely)(?![-\w])/.test(line)) {
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

test("a local partner post reaches its own country and nobody else", () => {
  const live = competitionsFromRows(
    [postRow({ region: "KZ" })],
    [partnerRow()],
  );
  const seen = (homeCountry: string | null) =>
    buildExtracurriculars({
      today: TODAY,
      faculties: [],
      factors: [],
      liveCompetitions: live,
      homeCountry,
    }).items.some((o) => o.id === "astana-hub-hackathon");
  assert.equal(seen("KZ"), true);
  assert.equal(seen("UZ"), false);
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
const rel = (f: string) =>
  path.relative(process.cwd(), f).split(path.sep).join("/");
const stripComments = (s: string) =>
  s.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^[ \t]*\/\/[^\n]*$/gm, "");

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
        const hits = line.match(
          /(?<=[\s"'`{])!(?:[a-z-]+:)*[a-z][a-z0-9]*-[a-z0-9./[\]%-]+/g,
        );
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
        if (/ring-offset-(white|black)\b/.test(line))
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
    for (const m of src.matchAll(/<(a|button|Link)\s([^>]*?)>/gs)) {
      const attrs = m[2];
      if (!/className/.test(attrs)) continue;
      // Only elements that paint themselves. A bare inline link inherits the
      // browser's own outline and is not the problem.
      if (!/rounded|border|bg-|shadow|px-|py-|p-\d|flex/.test(attrs)) continue;
      if (/focus-visible|focus-ring|focus:/.test(attrs)) continue;
      if (/sr-only/.test(attrs)) continue;
      offenders.push(
        `${rel(file)}:${src.slice(0, m.index).split("\n").length} <${m[1]}>`,
      );
    }
  }
  assert.deepEqual(
    offenders,
    [],
    `interactive but unfocusable:\n  ${offenders.join("\n  ")}\nAdd \`focus-visible:focus-ring\`, or render it through <Button>/<ButtonLink>.`,
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
      if (!/^\s*(\/\/|\/\*|\{\s*\/\*)\s*eslint-disable-next-line\b/.test(line))
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
  const local = COMPETITIONS.filter((c) => c.pinned && c.region);
  for (const c of local) {
    const elsewhere = buildExtracurriculars({
      today: TODAY,
      faculties: [],
      factors: [],
      homeCountry: c.region === "IT" ? "KZ" : "IT",
      graduationYear: 2028,
    });
    assert.ok(
      !elsewhere.items.some((i) => i.id === c.id),
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
  for (const s of PLANNER_SECTIONS) {
    assert.ok(
      s.href === "/planner" || s.href.startsWith("/planner/"),
      `${s.id} is outside the section`,
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
  const promote = src.slice(
    src.indexOf("export async function promoteNodeToTask"),
  );
  assert.ok(promote.length > 0, "promoteNodeToTask is missing");
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
    !/framer-motion/.test(field),
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
    !/\bblur-(sm|md|lg|xl|2xl|3xl)\b/.test(hero),
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
    for (const m of src.matchAll(/className="([^"]*\bmax-w-6xl\b[^"]*)"/g)) {
      assert.ok(
        m[1].includes("2xl:max-w-[90rem]"),
        `${rel}: a container caps at max-w-6xl without ramping — "${m[1]}"`,
      );
    }
  }
});
