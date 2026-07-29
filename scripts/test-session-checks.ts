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
import { findDatePages } from "../lib/scraper/scrape-dates";

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
