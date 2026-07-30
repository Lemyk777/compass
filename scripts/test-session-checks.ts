// One-off verification pass for this session's changes — pure logic, no API
// key, no DB, no network. Exercises the code paths a build can't prove:
// geo normalization, region gating, the pre-analysis (growth-mode) plan,
// discovery slug/dedup helpers, and the cron batch rotation math.

import assert from "node:assert";
import { FACULTY_VALUES } from "../lib/data/faculties";
import { normalizeCountry, LOCAL_TARGETS, regionLabel } from "../lib/data/geo";
import {
  buildExtracurriculars,
  buildStudyPlan,
  resolveCompetitions,
  COMPETITIONS,
  type Competition,
} from "../lib/data/key-dates";
import { buildRoadmap } from "../lib/data/roadmap";
import {
  checkEligibility,
  gradeFromGraduationYear,
  parseEligibility,
} from "../lib/data/eligibility";
import { slugify } from "../lib/discovery/discover";
import { findDatePages, parseJsonLoose } from "../lib/scraper/scrape-dates";

let passed = 0;
function ok(name: string, fn: () => void) {
  fn();
  passed++;
  console.log(`  ✓ ${name}`);
}

const today = new Date();

// ── geo ──────────────────────────────────────────────────────────────────────
console.log("geo.ts");
ok("normalizeCountry: EN/RU/code/casing/whitespace", () => {
  assert.equal(normalizeCountry("Kazakhstan"), "KZ");
  assert.equal(normalizeCountry("казахстан"), "KZ");
  assert.equal(normalizeCountry("  КАЗАХСТАН  "), "KZ");
  assert.equal(normalizeCountry("kz"), "KZ");
  assert.equal(normalizeCountry("Узбекистан"), "UZ");
  assert.equal(normalizeCountry("US"), "US"); // bare ISO-2 passes through
  assert.equal(normalizeCountry("Atlantis"), null);
  assert.equal(normalizeCountry(""), null);
  assert.equal(normalizeCountry(null), null);
});
ok("LOCAL_TARGETS sane; regionLabel falls back", () => {
  assert.ok(LOCAL_TARGETS.KZ.cities.length >= 3);
  assert.equal(regionLabel("KZ"), "Kazakhstan");
  assert.equal(regionLabel("XX"), "XX");
});

// ── region gating in resolve/build ───────────────────────────────────────────
console.log("key-dates.ts");
const in30 = new Date(Date.now() + 30 * 86_400_000).toISOString().slice(0, 10);
const localRow: Competition = {
  id: "kz-test-olympiad",
  name: "KZ Test Olympiad",
  fields: "all",
  deadline: in30,
  window: "test window",
  level: "national",
  url: "https://example.kz",
  blurb: "test",
  dateConfirmed: true,
  region: "KZ",
  city: "Almaty",
};

ok("resolveCompetitions merges a live-only local row", () => {
  const merged = resolveCompetitions([localRow]);
  assert.equal(merged.length, COMPETITIONS.length + 1);
  const row = merged.find((c) => c.id === "kz-test-olympiad");
  assert.ok(row && row.region === "KZ" && row.city === "Almaty");
});

ok("resolveCompetitions: unconfirmed live date never overrides curated", () => {
  const amc = COMPETITIONS.find((c) => c.id === "amc")!;
  const stale = { ...amc, deadline: "2020-01-01", dateConfirmed: false };
  const merged = resolveCompetitions([stale]);
  assert.equal(merged.find((c) => c.id === "amc")!.deadline, amc.deadline);
});

const factors = [{ key: "awards", score: 9 }, { key: "extracurricular_depth", score: 9 }, { key: "academics", score: 9 }];
ok("buildExtracurriculars: KZ student sees the local row", () => {
  const plan = buildExtracurriculars({
    today, faculties: ["law"], factors, liveCompetitions: [localRow], homeCountry: "KZ",
  });
  assert.ok(plan.items.some((o) => o.id === "kz-test-olympiad"));
});
ok("buildExtracurriculars: UZ / unknown student does NOT see it", () => {
  for (const home of ["UZ", null, undefined]) {
    const plan = buildExtracurriculars({
      today, faculties: ["law"], factors, liveCompetitions: [localRow], homeCountry: home,
    });
    assert.ok(!plan.items.some((o) => o.id === "kz-test-olympiad"), `leaked to ${home}`);
  }
});
ok("buildExtracurriculars: no factors → emerging, accessible recommended (growth mode)", () => {
  const plan = buildExtracurriculars({
    today, faculties: ["computer_science", "natural_sciences"], factors: [], liveCompetitions: [],
  });
  assert.equal(plan.band, "emerging");
  assert.equal(plan.strength, 0);
  assert.ok(plan.items.length > 0);
  for (const o of plan.items.filter((i) => i.fit === "recommended")) {
    assert.equal(o.tierResolved, "accessible");
  }
});

ok("buildStudyPlan: timeline gates local rows by homeCountry too", () => {
  const withKZ = buildStudyPlan({
    today, graduationYear: today.getFullYear() + 2, faculties: ["law"],
    homeCountry: "KZ", liveCompetitions: [localRow],
  });
  const without = buildStudyPlan({
    today, graduationYear: today.getFullYear() + 2, faculties: ["law"],
    homeCountry: null, liveCompetitions: [localRow],
  });
  assert.ok(withKZ.competitions.some((c) => c.id === "kz-test-olympiad"));
  assert.ok(!without.competitions.some((c) => c.id === "kz-test-olympiad"));
});

// ── growth mode: roadmap without analysis ────────────────────────────────────
console.log("roadmap.ts");
ok("buildRoadmap works with NO analysis (empty targets/actions)", () => {
  const r = buildRoadmap({
    today, graduationYear: today.getFullYear() + 2, faculties: ["computer_science"],
    targets: [], planActions: [],
  });
  assert.ok(r.headline.length > 0);
  assert.ok(r.phases.length > 0);
});
ok("buildRoadmap works with nothing at all (no grad year)", () => {
  const r = buildRoadmap({ today, faculties: [], targets: [], planActions: [] });
  assert.ok(r.headline.length > 0); // the "add your graduation year" state
});

// ── discovery helpers ────────────────────────────────────────────────────────
console.log("discover.ts");
ok("slugify: stable, safe ids incl. Cyrillic transliteration", () => {
  assert.equal(slugify("Wharton Global High School Investment Competition!"), "wharton-global-high-school-investment-competition");
  assert.equal(slugify("  Олимпиада «Мёбиус» 2026  "), "olimpiada-mebius-2026");
  assert.equal(slugify("Республикалық олимпиада"), "respublikalyk-olimpiada"); // Kazakh letters
  assert.equal(slugify("---"), "");
});

// ── two-hop date-page discovery (pure, no network) ───────────────────────────
console.log("scrape-dates.ts / findDatePages");
const html = (...links: string[]) => `<html><body>${links.join("")}</body></html>`;
const a = (href: string, text = "link") => `<a href="${href}">${text}</a>`;

ok("picks an explicit key-dates page above everything else", () => {
  const out = findDatePages(
    html(a("/about"), a("/register-and-key-dates.html", "Register & Key Dates"), a("/events/")),
    "https://www.nmun.org/",
  );
  assert.equal(out[0], "https://www.nmun.org/register-and-key-dates.html");
});

ok("apply page outranks a generic events page (the alumni-events trap)", () => {
  const out = findDatePages(
    html(a("/about-us/alumni-events", "Alumni events"), a("/programs/apply-rsi", "Apply")),
    "https://www.cee.org/programs/research-science-institute",
  );
  assert.equal(out[0], "https://www.cee.org/programs/apply-rsi");
});

ok("same-section links are preferred over other sections", () => {
  const out = findDatePages(
    html(a("/other/deadlines", "Deadlines"), a("/programs/deadlines", "Deadlines")),
    "https://x.org/programs/thing",
  );
  assert.equal(out[0], "https://x.org/programs/deadlines");
});

ok("off-site application portals survive; weak off-site links do not", () => {
  const out = findDatePages(
    html(a("https://portal.embark.com/apply/x", "Apply now"), a("https://other.com/events", "Events")),
    "https://summerscience.org/",
  );
  assert.deepEqual(out, ["https://portal.embark.com/apply/x"]);
});

ok("ignores assets, socials, mailto and self-links", () => {
  const out = findDatePages(
    html(
      a("/rules.pdf", "Deadlines PDF"),
      a("https://facebook.com/x", "Deadlines"),
      a("mailto:a@b.c", "Apply"),
      a("https://x.org/", "Key dates"),
    ),
    "https://x.org/",
  );
  assert.deepEqual(out, []);
});

ok("returns at most `limit`, deduped, absolute", () => {
  const out = findDatePages(
    html(a("/apply"), a("/apply"), a("/calendar"), a("/deadlines"), a("/register")),
    "https://x.org/",
  );
  assert.equal(out.length, 2);
  assert.ok(out.every((u) => u.startsWith("https://x.org/")));
  assert.equal(new Set(out).size, out.length);
});

ok("malformed base URL or link-free HTML yields nothing (never throws)", () => {
  assert.deepEqual(findDatePages(html(a("/apply")), "not-a-url"), []);
  assert.deepEqual(findDatePages("<html></html>", "https://x.org/"), []);
});

// ── eligibility parsing & gating ─────────────────────────────────────────────
console.log("eligibility.ts");
ok("reads country, grade and age rules we actually write", () => {
  const us = parseEligibility("Grades 9–12 at a US school — no minimum age");
  assert.deepEqual(us.countries, ["US"]);
  assert.equal(us.gradeMin, 9);
  assert.equal(us.gradeMax, 12);
  assert.equal(parseEligibility("Ages 13–18 — open worldwide").ageMax, 18);
  assert.equal(parseEligibility("High-school students aged 13–18").ageMin, 13);
  assert.equal(parseEligibility("Under 20 — free to enter").ageMax, 19);
  assert.equal(parseEligibility("Age 15 or under on 31 December").ageMax, 15);
  assert.equal(parseEligibility("Students aged 16+ who have completed grade 10").ageMin, 16);
  assert.equal(parseEligibility("Final-year (grade 12) students only").gradeMin, 12);
});
ok("does not invent constraints from negations or non-age numbers", () => {
  // "no national selection needed" previously parsed as REQUIRING one.
  assert.equal(
    parseEligibility("Students under 25 worldwide — no national selection needed").viaNationalSelection,
    undefined,
  );
  // "under 4 years of secondary school remaining" is not an age.
  assert.equal(
    parseEligibility("Female students with under 4 years of secondary school remaining").ageMax,
    undefined,
  );
  assert.deepEqual(parseEligibility(undefined), {});
  assert.deepEqual(parseEligibility("Open to everyone"), {});
});
ok("gate excludes wrong country and past-ceiling, keeps too-young", () => {
  const usOnly = { countries: ["US"] };
  assert.equal(checkEligibility(usOnly, { country: "KZ" }).ok, false);
  assert.equal(checkEligibility(usOnly, { country: "US" }).ok, true);
  // Unknown country must never exclude.
  assert.equal(checkEligibility(usOnly, { country: null }).ok, true);

  const seniorOnly = { gradeMin: 12, gradeMax: 12 };
  const young = checkEligibility(seniorOnly, { grade: 9 });
  assert.equal(young.ok, false);
  assert.equal(young.ok === false && young.reason, "too_young");
  const old = checkEligibility({ ageMax: 15 }, { age: 17 });
  assert.equal(old.ok === false && old.reason, "too_old");
  // Unknown grade/age must never exclude.
  assert.equal(checkEligibility(seniorOnly, { grade: null }).ok, true);
});
ok("grade is derived from graduation year, nonsense rejected", () => {
  const jul2026 = new Date("2026-07-29T00:00:00Z");
  assert.equal(gradeFromGraduationYear(2027, jul2026), 12);
  assert.equal(gradeFromGraduationYear(2030, jul2026), 9);
  assert.equal(gradeFromGraduationYear(undefined, jul2026), null);
  assert.equal(gradeFromGraduationYear(2099, jul2026), null);
});

// ── matching behaviour ───────────────────────────────────────────────────────
console.log("matching");
const midFactors = [
  { key: "awards", score: 5 },
  { key: "extracurricular_depth", score: 5 },
  { key: "academics", score: 7 },
];
ok("no faculties selected shows the whole catalog, not almost nothing", () => {
  const plan = buildExtracurriculars({ today, faculties: [], factors: [] });
  assert.ok(
    plan.items.length > COMPETITIONS.length * 0.9,
    `expected nearly the whole catalog, got ${plan.items.length}/${COMPETITIONS.length}`,
  );
});
ok("US-only entries are hidden from a non-US student and kept for a US one", () => {
  const args = { today, faculties: ["medicine_health", "natural_sciences"], factors: midFactors };
  const kz = buildExtracurriculars({ ...args, homeCountry: "KZ" });
  const us = buildExtracurriculars({ ...args, homeCountry: "US" });
  for (const id of ["usabo", "usapho", "usnco", "congressional-app"]) {
    assert.ok(!kz.items.some((i) => i.id === id), `${id} leaked to a KZ student`);
  }
  assert.ok(us.items.some((i) => i.id === "usabo"), "over-filtered a US student");
});
ok("too-young entries stay visible but are never 'recommended'", () => {
  const g9 = buildExtracurriculars({
    today, faculties: ["natural_sciences"], factors: midFactors, graduationYear: today.getFullYear() + 4,
  });
  const notYet = g9.items.filter((i) => i.notYetEligible);
  assert.ok(notYet.length > 0, "expected some not-yet-eligible entries for a 9th grader");
  for (const i of notYet) assert.notEqual(i.fit, "recommended");
});

// ── registry integrity ───────────────────────────────────────────────────────
console.log("key-dates.ts / registry");
ok("competition ids are unique", () => {
  const seen = new Map<string, number>();
  for (const c of COMPETITIONS) seen.set(c.id, (seen.get(c.id) ?? 0) + 1);
  const dupes = [...seen.entries()].filter(([, n]) => n > 1).map(([id]) => id);
  assert.deepEqual(dupes, [], `duplicate ids: ${dupes.join(", ")}`);
});
ok("every entry has a valid https URL and non-empty copy", () => {
  for (const c of COMPETITIONS) {
    assert.ok(/^https:\/\//.test(c.url), `${c.id}: url must be https — ${c.url}`);
    assert.doesNotThrow(() => new URL(c.url), `${c.id}: unparseable url`);
    assert.ok(c.name.trim().length > 0, `${c.id}: empty name`);
    assert.ok(c.blurb.trim().length > 0, `${c.id}: empty blurb`);
    assert.ok(c.window.trim().length > 0, `${c.id}: empty window`);
  }
});
ok("dates are valid ISO and fields/level/tier are in range", () => {
  const levels = ["international", "national", "regional"];
  const tiers = ["accessible", "selective", "elite"];
  const cats = ["competition", "olympiad", "course", "research_program", "summer_program"];
  for (const c of COMPETITIONS) {
    assert.ok(/^\d{4}-\d{2}-\d{2}$/.test(c.deadline), `${c.id}: bad deadline ${c.deadline}`);
    assert.ok(levels.includes(c.level), `${c.id}: bad level`);
    if (c.tier) assert.ok(tiers.includes(c.tier), `${c.id}: bad tier`);
    if (c.category) assert.ok(cats.includes(c.category), `${c.id}: bad category`);
    if (c.fields !== "all") {
      assert.ok(c.fields.length > 0, `${c.id}: empty fields`);
      for (const f of c.fields) {
        assert.ok(FACULTY_VALUES.includes(f), `${c.id}: unknown faculty ${f}`);
      }
    }
  }
});
ok("a confirmed date is never already in the past", () => {
  const todayISO = new Date().toISOString().slice(0, 10);
  for (const c of COMPETITIONS) {
    if (c.dateConfirmed) {
      assert.ok(c.deadline >= todayISO, `${c.id}: confirmed but past (${c.deadline})`);
    }
  }
});

// ── model-reply parsing ──────────────────────────────────────────────────────
console.log("scrape-dates.ts / parseJsonLoose");
ok("plain JSON array and object", () => {
  assert.deepEqual(parseJsonLoose('[{"test":"2026-08-22"}]'), [{ test: "2026-08-22" }]);
  assert.deepEqual(parseJsonLoose('{"deadline":"2026-10-28"}'), { deadline: "2026-10-28" });
});
ok("survives markdown fences (the SAT failure mode)", () => {
  assert.deepEqual(
    parseJsonLoose('```json\n[{"test":"2026-08-22","regDeadline":"2026-08-07"}]\n```'),
    [{ test: "2026-08-22", regDeadline: "2026-08-07" }],
  );
});
ok("survives prose around the JSON", () => {
  assert.deepEqual(
    parseJsonLoose('Here are the dates I found:\n[{"a":1}]\nLet me know if you need more.'),
    [{ a: 1 }],
  );
});
ok("literal null and unparseable replies", () => {
  assert.equal(parseJsonLoose("null"), null);
  assert.equal(parseJsonLoose("  null  "), null);
  assert.equal(parseJsonLoose("I could not find a deadline."), null);
  assert.equal(parseJsonLoose(""), null);
});
ok("prefers the outer shape, not a brace inside prose", () => {
  assert.deepEqual(parseJsonLoose('The set {a} aside, here: [{"x":2}]'), [{ x: 2 }]);
});

// ── cron rotation math ───────────────────────────────────────────────────────
console.log("cron rotation");
ok("sync-dates: every competition covered by the daily 8-comp window", () => {
  const N = COMPETITIONS.length;
  const PER = 8;
  const covered = new Set<number>();
  for (let day = 0; day < 60; day++) {
    const start = (day * PER) % N;
    for (let i = 0; i < PER; i++) covered.add((start + i) % N);
  }
  assert.equal(covered.size, N, `only ${covered.size}/${N} covered in 60 days`);
});
ok("discover: faculty rotation covers all 8 faculties", () => {
  const N = 8, PER = 2;
  const covered = new Set<number>();
  for (let week = 0; week < 8; week++) {
    const start = (week * PER) % N;
    for (let i = 0; i < PER; i++) covered.add((start + i) % N);
  }
  assert.equal(covered.size, N);
});

console.log(`\nAll ${passed} checks passed.`);
