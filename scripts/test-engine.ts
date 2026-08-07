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
import assert from "node:assert/strict";

import { RUBRIC, computeOverall, type FactorKey } from "@/lib/rubric";
import { computeOverallFromFactors, computeBenchmarks } from "@/lib/ai/assemble";
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
import { buildExtracurriculars, strengthBand } from "@/lib/data/key-dates";
import { emptyProfile } from "@/lib/types";
import {
  CAREER_AREAS_BY_FACULTY,
  allCareerAreas,
  areaBySlug,
  areaSlug,
  careerAreasForFaculties,
  careerAreaTitles,
} from "@/lib/data/careers";
import { HOME_ROUTES, homeRoutesForFaculties } from "@/lib/data/from-home";
import { LEGACY_GUIDE_PLACE_IDS } from "@/lib/data/legacy-guide-urls";
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
} from "@/lib/data/world";
import {
  STUDY_DESTINATIONS,
  destinationById,
  destinationForHub,
  destinationsForFaculties,
} from "@/lib/data/study-destinations";
import { FACULTY_VALUES } from "@/lib/data/faculties";
import { competitionsFromRows } from "@/lib/partners/live";
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

// A fixed "today" in the second half of the year → academic year end rolls to
// the next year (June rollover), so a Class of 2027 student is in grade 12.
const TODAY = new Date("2026-08-04T00:00:00Z");
const allTen = Object.fromEntries(
  RUBRIC.map((f) => [f.key, 10]),
) as Record<FactorKey, number>;
const allZero = Object.fromEntries(
  RUBRIC.map((f) => [f.key, 0]),
) as Record<FactorKey, number>;

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
  const mid = Object.fromEntries(
    RUBRIC.map((f) => [f.key, 5]),
  ) as Record<FactorKey, number>;
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
  assert.deepEqual(
    checkEligibility({ countries: ["US"] }, { country: null }),
    { ok: true },
  );
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
  const below = checkEligibility({ ageMin: 13 }, { ageRange: { min: 11, max: 12 } });
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
  const all = buildExtracurriculars({ today: TODAY, faculties: [], factors: [] });
  const cs = buildExtracurriculars({
    today: TODAY,
    faculties: ["computer_science"],
    factors: [],
  });
  assert.ok(cs.items.length <= all.items.length);
  assert.ok(cs.items.length > 0);
});

// ── Careers layer ────────────────────────────────────────────────────────────
test("every faculty has at least 3 fully-filled career areas", () => {
  for (const f of FACULTY_VALUES) {
    const areas = CAREER_AREAS_BY_FACULTY[f];
    assert.ok(areas && areas.length >= 3, `${f} has too few career areas`);
    for (const a of areas) {
      assert.ok(a.title.trim() && a.what.trim() && a.path.trim(), `${f}/${a.title} has an empty field`);
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
  assert.ok(ranked.every((r) => !r.fits), "nothing may be badged a fit");
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
      assert.ok(ranked.every((r) => !r.fits), `${f} badged a zero score`);
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
    assert.ok(h.catch.trim().length > 40, `${h.id} has no catch — that is an advert`);
    assert.ok(h.route.trim().length > 40, `${h.id} has no way in`);
    assert.ok(h.fields.length > 0, `${h.id} belongs to no field`);
    assert.ok(REGION_ORDER.includes(h.region), `${h.id} has an unknown region`);
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
  assert.deepEqual(order, [...order].sort((a, b) => a - b));
  for (const g of groups) assert.ok(g.hubs.length > 0, "an empty region survived");
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
  assert.equal(withFields("/guide/cities", []), `/guide/cities?f=${ALL_FIELDS}`);
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
    ...allCareerAreas().map(({ area }) => guideMorph("area", areaSlug(area.title))),
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
test("cities in unprofiled countries stay reachable", () => {
  const claimed = new Set(STUDY_DESTINATIONS.flatMap((d) => d.hubs));
  const orphans = HUBS.filter((h) => !claimed.has(h.id));
  assert.ok(
    orphans.length > 0,
    "if every hub has a profile this test can be deleted — check that first",
  );
  for (const home of ["almaty", "astana", "tashkent", "tbilisi"]) {
    assert.ok(
      orphans.some((h) => h.id === home),
      `${home} is expected to be one of the unprofiled hubs`,
    );
  }
  // Grouping by country must lose nobody: every hub still appears exactly once.
  const grouped = hubsByCountry([]).flatMap((g) => g.hubs);
  assert.equal(grouped.length, HUBS.length, "grouping by country dropped a hub");
  assert.equal(new Set(grouped.map((h) => h.id)).size, HUBS.length);
  for (const g of hubsByCountry([])) {
    assert.ok(
      g.hubs.every((h) => h.country === g.country),
      `${g.country} group contains a hub from elsewhere`,
    );
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
  const guide = redirects.filter((r) => r.source.startsWith("/guide/"));

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

  // And the steps themselves must not be matched by any of it.
  for (const s of GUIDE_SECTIONS) {
    assert.ok(
      !guide.some((r) => r.source === s.href),
      `${s.href} is being redirected away`,
    );
  }
});

test("destinationForHub resolves both ways, and is undefined for orphans", () => {
  for (const d of STUDY_DESTINATIONS) {
    for (const hubId of d.hubs) {
      assert.equal(destinationForHub(hubId)?.id, d.id);
    }
  }
  assert.equal(destinationForHub("almaty"), undefined);
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
  }
  assert.ok(HOME_ROUTES.length >= 4, "too few routes to be worth a step");
});

test("no chosen field ⇒ every from-home route; field-free routes always show", () => {
  assert.equal(homeRoutesForFaculties([]).length, HOME_ROUTES.length);
  for (const f of FACULTY_VALUES) {
    const routes = homeRoutesForFaculties([f]);
    assert.ok(routes.length > 0, `${f} is told there is nothing to do from home`);
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
      headers: { get: (k: string) => (k === "authorization" ? (auth ?? null) : null) },
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
  assert.equal(
    destinationsForFaculties([]).length,
    STUDY_DESTINATIONS.length,
  );
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
  const [c] = competitionsFromRows([postRow()], [partnerRow({ verified_at: null })]);
  assert.equal(c.partner?.name, "Astana Hub");
  assert.equal(c.partner?.verified, false);
});

test("suspending a partner removes its posts, not just its name", () => {
  const rows = competitionsFromRows([postRow()], [partnerRow({ status: "suspended" })]);
  assert.equal(rows.length, 0);
  // Same when the partner row is absent entirely (RLS hid it).
  assert.equal(competitionsFromRows([postRow()], []).length, 0);
});

test("a taken-down post is gone whatever the partner's state", () => {
  assert.equal(
    competitionsFromRows([postRow({ published: false })], [partnerRow()]).length,
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
  const live = competitionsFromRows([postRow({ region: "KZ" })], [partnerRow()]);
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
  assert.equal(cleanPath("/auth/callback?code=SECRET&next=/x"), "/auth/callback");
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
  assert.equal(externalHost("https://www.google.com/", "compass.app"), "google.com");
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
    view({ session_id: "s2", created_at: new Date(T0 - 3_600_000).toISOString() }),
  ];
  const s = summarize(rows, T0, 7);
  const today = s.buckets[s.buckets.length - 1];
  assert.equal(today.visitors, 1);
  assert.equal(today.newVisitors, 0, "we had seen them before");
  assert.equal(today.returningVisitors, 1);
});

test("the chart has one bucket per calendar slot, including the empty ones", () => {
  const s = summarize([view({ created_at: new Date(T0).toISOString() })], T0, 30);
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
    view({ created_at: new Date(T0 + 10_000).toISOString(), path: "/opportunities" }),
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
