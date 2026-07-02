// Deterministic smoke test for the South Korea analysis engine.
// No API key needed (the KR pathway never calls the model):
//   npx tsx scripts/test-korea.ts
//
// Walks representative profiles through analyzeKoreaPrograms and asserts the
// load-bearing rules: the language gate caps "likely", interviews gate SNU,
// KAIST's automatic full ride, and honest index sourcing (gpa → ib → sat → estimate).

import assert from "node:assert";
import { analyzeKoreaPrograms } from "../lib/ai/korea-analyze";

const ids = [
  "snu-cs",
  "snu-business",
  "kaist-cs",
  "yonsei-uic-econ",
  "ku-business",
  "skku-business-en",
  "hanyang-eng",
  "khu-business",
];

const byId = (out: ReturnType<typeof analyzeKoreaPrograms>, id: string) => {
  const p = out.find((x) => x.program_id === id);
  assert(p, `missing ${id}`);
  return p!;
};

function show(label: string, out: ReturnType<typeof analyzeKoreaPrograms>) {
  console.log(`\n=== ${label} ===`);
  for (const p of out) {
    console.log(
      `${p.program_id.padEnd(18)} status=${p.status.padEnd(6)} idx=${String(p.user_index).padStart(3)} (${p.index_source})  lang=${p.language.padEnd(7)} schol=${p.scholarship}`
    );
  }
}

const strongRecord = {
  honors: [{ title: "National Olympiad", levels: ["National"], grades: [] }],
  activities: [
    {
      type: "",
      position: "Team Captain",
      organization: "Math club",
      description: "led the team",
      grades: ["10", "11", "12"],
      hours_per_week: 10,
      weeks_per_year: 40,
    },
  ],
};

// A: strong GPA + English but NO TOPIK → English-taught can be likely, Korean-taught capped.
const a = analyzeKoreaPrograms(ids, {
  gpaPercent: 97,
  ielts: 7.5,
  gradeStatus: "predicted" as const,
  ...strongRecord,
});
show("A: GPA 97%, IELTS 7.5, no TOPIK, strong record", a);
assert.equal(byId(a, "kaist-cs").status, "likely", "KAIST (EN) should be likely");
assert.equal(byId(a, "kaist-cs").scholarship, "likely_full", "KAIST full ride");
assert.equal(byId(a, "snu-cs").status, "likely", "SNU CS: IELTS route + interview-ready record → likely");
assert.equal(byId(a, "snu-business").status, "target", "SNU Business needs TOPIK 6 — capped without it");
assert.equal(byId(a, "ku-business").status, "target", "KU (TOPIK-only) capped without TOPIK");
assert.equal(byId(a, "ku-business").language, "unknown");

// B: the same student with TOPIK 4 → Korean-taught opens up (except SNU Business's TOPIK 6).
const b = analyzeKoreaPrograms(ids, {
  gpaPercent: 97,
  ielts: 7.5,
  topik: 4,
  gradeStatus: "achieved" as const,
  ...strongRecord,
});
show("B: same + TOPIK 4", b);
assert.equal(byId(b, "ku-business").status, "likely", "TOPIK 4 unlocks KU");
assert.equal(byId(b, "ku-business").language, "meets");
assert.equal(byId(b, "snu-business").status, "target", "TOPIK 4 < required 6 → still capped");
assert.equal(byId(b, "snu-business").language, "below");
assert.equal(byId(b, "ku-business").conditional_offer, false, "achieved grades → direct offer");

// C: mid GPA, TOPIK 3, thin record → targets at the accessible end, reaches at SKY.
const c = analyzeKoreaPrograms(ids, { gpaPercent: 84, topik: 3, gradeStatus: "predicted" as const });
show("C: GPA 84%, TOPIK 3, no English, thin record", c);
assert.equal(byId(c, "snu-cs").status, "reach");
assert.equal(byId(c, "khu-business").status, "likely", "84% ≥ KHU typical 82% and TOPIK met");
assert.equal(byId(c, "kaist-cs").language, "unknown", "no English shown for the EN-only track");

// D: index sourcing fallbacks are honest.
const d1 = analyzeKoreaPrograms(["kaist-cs"], { ibTotal: 42, toefl: 105, gradeStatus: "predicted" as const });
assert.equal(d1[0].index_source, "ib");
const d2 = analyzeKoreaPrograms(["kaist-cs"], { sat: 1500, gradeStatus: "predicted" as const });
assert.equal(d2[0].index_source, "sat");
const d3 = analyzeKoreaPrograms(["kaist-cs"], { gradeStatus: "predicted" as const });
assert.equal(d3[0].index_source, "estimate");
// The neutral estimate (82) sits below KAIST's band → honest "reach", and the
// auto-full-ride read correspondingly softens to partial.
assert.equal(d3[0].status, "reach");
assert.equal(d3[0].scholarship, "likely_partial");
show("D: fallbacks (IB / SAT / estimate)", [...d1, ...d2, ...d3]);

// E: language-linked merit floor (SKKU-style) — TOPIK 6 floors at partial even below cutoff.
const e = analyzeKoreaPrograms(["skku-business-en", "hanyang-eng"], {
  gpaPercent: 80,
  topik: 6,
  gradeStatus: "predicted" as const,
});
show("E: GPA 80%, TOPIK 6 (language-linked merit)", e);
assert.notEqual(byId(e, "hanyang-eng").scholarship, "unlikely", "TOPIK 6 floors merit at partial");

// F: country-native scorecard axes — KR plots the document-screen set (language
// axis only once a Korea list exists), AE plots the grades-first quadrilateral.
import {
  krScorecardFactors,
  uaeScorecardFactors,
  krLanguageGateScore,
} from "../lib/data/country-scorecard";

const factors = [
  { key: "academics", label: "Academics", score: 8, rubric_tier: "", reasoning: [], note: "" },
  { key: "test_scores", label: "Test scores", score: 7, rubric_tier: "", reasoning: [], note: "" },
  { key: "course_rigor", label: "Course rigor", score: 9, rubric_tier: "", reasoning: [], note: "" },
  { key: "leadership", label: "Leadership", score: 6, rubric_tier: "", reasoning: [], note: "" },
  { key: "extracurricular_depth", label: "Extracurricular depth", score: 6, rubric_tier: "", reasoning: [], note: "" },
  { key: "awards", label: "Awards & recognition", score: 8, rubric_tier: "", reasoning: [], note: "" },
  { key: "narrative_fit", label: "Narrative / fit", score: 7, rubric_tier: "", reasoning: [], note: "" },
];

const ae = uaeScorecardFactors(factors);
assert.deepEqual(ae.map((f) => f.key), ["test_scores", "academics", "course_rigor", "ae_achievements"]);

const lang = krLanguageGateScore(b.map((p) => ({ language: p.language })));
assert(lang != null && lang > 0 && lang <= 10);
const krWith = krScorecardFactors(factors, lang);
assert.deepEqual(krWith.map((f) => f.key), ["academics", "course_rigor", "kr_language", "kr_achievements"]);
const krWithout = krScorecardFactors(factors, null);
assert.deepEqual(krWithout.map((f) => f.key), ["academics", "course_rigor", "kr_achievements"]);
console.log("\n=== F: scorecard axes ===");
console.log("AE:", ae.map((f) => `${f.label}=${f.score}`).join(", "));
console.log("KR:", krWith.map((f) => `${f.label}=${f.score}`).join(", "));

console.log("\nAll Korea engine assertions passed.");
