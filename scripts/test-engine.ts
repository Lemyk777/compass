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
  careerAreasForFaculties,
  careerAreaTitles,
} from "@/lib/data/careers";
import {
  VALUE_LABEL,
  rankAreasByValues,
  scoreValues,
  topValues,
} from "@/lib/data/values";
import {
  HUBS,
  REGION_ORDER,
  hubsByRegion,
  hubsForFaculties,
} from "@/lib/data/world";
import {
  STUDY_DESTINATIONS,
  destinationById,
  destinationsForFaculties,
} from "@/lib/data/study-destinations";
import { FACULTY_VALUES } from "@/lib/data/faculties";
import { competitionsFromRows } from "@/lib/partners/live";

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
