// One-off verification pass for this session's changes — pure logic, no API
// key, no DB, no network. Exercises the code paths a build can't prove:
// geo normalization, region gating, the pre-analysis (growth-mode) plan,
// discovery slug/dedup helpers, and the cron batch rotation math.

import assert from "node:assert";
import { normalizeCountry, LOCAL_TARGETS, regionLabel } from "../lib/data/geo";
import {
  buildExtracurriculars,
  buildStudyPlan,
  resolveCompetitions,
  COMPETITIONS,
  type Competition,
} from "../lib/data/key-dates";
import { buildRoadmap } from "../lib/data/roadmap";
import { slugify } from "../lib/discovery/discover";

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
