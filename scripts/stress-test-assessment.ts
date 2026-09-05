import { test } from "node:test";
import assert from "node:assert";
import {
  calculateBlueprint,
  type AssessmentAnswers,
  type FacultyValue,
} from "../components/assessment/mentorData";

test("Stress-Test: Determinism under repeated calls", () => {
  const sampleAnswers: AssessmentAnswers[] = [
    { grade: "grade_9", interests: ["cs", "eng"], struggle: "clutter", ambition: "us_top" },
    { grade: "grade_11", interests: ["biz", "humanities"], struggle: "cost", ambition: "full_aid" },
    { grade: "grade_12", interests: ["med"], struggle: "direction", ambition: "europe_italy" },
    { grade: "gap_year", interests: ["design", "sci"], struggle: "guidance", ambition: "asia_global" },
    { grade: null, interests: [], struggle: null, ambition: null },
  ];

  for (const a of sampleAnswers) {
    const r1 = calculateBlueprint(a);
    for (let i = 0; i < 100; i++) {
      const r2 = calculateBlueprint(a);
      assert.deepStrictEqual(r1, r2, "calculateBlueprint must be strictly deterministic");
    }
  }
});

test("Stress-Test: Immutability (input array is not mutated)", () => {
  const originalInterests = ["cs", "eng", "biz"];
  const copyInterests = [...originalInterests];
  const answers: AssessmentAnswers = {
    grade: "grade_10",
    interests: copyInterests,
    struggle: "clutter",
    ambition: "us_top",
  };

  calculateBlueprint(answers);
  assert.deepStrictEqual(
    answers.interests,
    originalInterests,
    "calculateBlueprint must not mutate input interests array"
  );
});

test("Stress-Test: Extreme empty/null selections", () => {
  const emptyAnswers: AssessmentAnswers = {
    grade: null,
    interests: [],
    struggle: null,
    ambition: null,
  };

  const res = calculateBlueprint(emptyAnswers);
  assert.ok(typeof res.archetype === "string" && res.archetype.length > 0);
  assert.ok(typeof res.stageTitle === "string" && res.stageTitle.length > 0);
  assert.ok(typeof res.mentorVerdict === "string" && res.mentorVerdict.length > 0);
  assert.ok(typeof res.strategicNote === "string" && res.strategicNote.length > 0);
  assert.equal(res.topActions.length, 3);
  for (const act of res.topActions) {
    assert.ok(act.title && act.detail && act.tag);
  }
  assert.deepStrictEqual(res.matchedFaculties, []);
});

test("Stress-Test: Unknown / hostile IDs", () => {
  const hostileAnswers = {
    grade: "grade_invalid_999",
    interests: ["<script>alert(1)</script>", "__proto__", "constructor", "unknown_val"],
    struggle: "unrecognized_struggle",
    ambition: "unrecognized_ambition",
  } as unknown as AssessmentAnswers;

  const res = calculateBlueprint(hostileAnswers);
  assert.ok(res.archetype);
  assert.ok(res.stageTitle);
  assert.ok(res.mentorVerdict);
  assert.ok(res.strategicNote);
  assert.equal(res.topActions.length, 3);
  assert.deepStrictEqual(res.matchedFaculties, []);
});

test("Stress-Test: Conflicting multiple faculties & maximal interests", () => {
  const allInterests = ["cs", "eng", "biz", "sci", "humanities", "med", "design", "undecided"];
  const answers: AssessmentAnswers = {
    grade: "grade_11",
    interests: allInterests,
    struggle: "clutter",
    ambition: "open",
  };

  const res = calculateBlueprint(answers);
  assert.equal(res.archetype, "The Technical Innovator"); // Priority for cs/eng
  assert.equal(res.matchedFaculties.length, 7); // cs, eng, biz, sci, humanities, med, design (undecided has no faculty)
  assert.ok(!res.matchedFaculties.includes(undefined as unknown as FacultyValue));
});

test("Stress-Test: Exhaustive Cartesian sweep of known options", () => {
  const grades = ["grade_9", "grade_10", "grade_11", "grade_12", "gap_year", null];
  const struggles = ["clutter", "direction", "timeline", "cost", "guidance", null];
  const ambitions = ["us_top", "europe_italy", "asia_global", "full_aid", "open", null];
  const interestSets = [
    [],
    ["undecided"],
    ["cs"],
    ["eng"],
    ["biz"],
    ["sci"],
    ["humanities"],
    ["med"],
    ["design"],
    ["cs", "biz"],
    ["med", "sci", "humanities"],
  ];

  let combinationsCount = 0;
  for (const g of grades) {
    for (const s of struggles) {
      for (const a of ambitions) {
        for (const ints of interestSets) {
          combinationsCount++;
          const answers: AssessmentAnswers = {
            grade: g,
            interests: ints,
            struggle: s,
            ambition: a,
          };
          const res = calculateBlueprint(answers);
          assert.ok(res.archetype, "archetype missing");
          assert.ok(res.stageTitle, "stageTitle missing");
          assert.ok(res.mentorVerdict, "mentorVerdict missing");
          assert.ok(res.strategicNote, "strategicNote missing");
          assert.equal(res.topActions.length, 3, "must have exactly 3 topActions");
          for (let i = 0; i < 3; i++) {
            const act = res.topActions[i];
            assert.ok(act.title, `action ${i} missing title`);
            assert.ok(act.detail, `action ${i} missing detail`);
            assert.ok(act.tag, `action ${i} missing tag`);
          }
          assert.ok(Array.isArray(res.matchedFaculties), "matchedFaculties not an array");
          for (const fac of res.matchedFaculties) {
            assert.ok(typeof fac === "string" && fac.length > 0, "invalid faculty in matchedFaculties");
          }
        }
      }
    }
  }

  assert.equal(combinationsCount, 6 * 6 * 6 * 11); // 2376 test combinations
});
