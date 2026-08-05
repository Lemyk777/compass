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
import { CAREERS_BY_FACULTY, careersForFaculties } from "@/lib/data/careers";
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
test("every faculty has at least 3 fully-filled careers", () => {
  for (const f of FACULTY_VALUES) {
    const careers = CAREERS_BY_FACULTY[f];
    assert.ok(careers && careers.length >= 3, `${f} has too few careers`);
    for (const c of careers) {
      assert.ok(c.title.trim() && c.what.trim() && c.path.trim(), `${f}/${c.title} has an empty field`);
    }
  }
});

test("careersForFaculties groups by chosen field; empty in, empty out", () => {
  assert.deepEqual(careersForFaculties([]), []);
  const groups = careersForFaculties(["computer_science", "law"]);
  assert.equal(groups.length, 2);
  assert.equal(groups[0].faculty, "computer_science");
  assert.ok(groups[0].careers.length >= 3);
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
