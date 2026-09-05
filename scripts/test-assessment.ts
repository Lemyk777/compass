import { test } from "node:test";
import assert from "node:assert";
import { readFileSync } from "node:fs";
import path from "node:path";
import {
  ASSESSMENT_QUESTIONS,
  calculateBlueprint,
  type AssessmentAnswers,
} from "../components/assessment/mentorData";

test("ASSESSMENT_QUESTIONS: schema, counts, and accessibility metadata", () => {
  assert.equal(ASSESSMENT_QUESTIONS.length, 4, "Must have exactly 4 conversational steps");

  const requiredIds = ["grade", "interests", "struggle", "ambition"];
  assert.deepEqual(
    ASSESSMENT_QUESTIONS.map((q) => q.id),
    requiredIds,
    "Questions must appear in the exact conversational order"
  );

  for (const q of ASSESSMENT_QUESTIONS) {
    assert.ok(q.prompt.length > 10, `Question ${q.id} prompt is too short`);
    assert.ok(q.subtitle.length > 10, `Question ${q.id} subtitle is too short`);
    assert.ok(q.options.length >= 4, `Question ${q.id} must offer at least 4 options`);

    for (const opt of q.options) {
      assert.ok(opt.id, `Option in ${q.id} is missing an id`);
      assert.ok(opt.title, `Option in ${q.id} is missing a title`);
      assert.ok(opt.hint, `Option ${opt.id} in ${q.id} is missing a hint description`);
    }
  }
});

test("calculateBlueprint: early future builder", () => {
  const answers: AssessmentAnswers = {
    grade: "grade_9",
    interests: ["cs", "eng"],
    struggle: "clutter",
    ambition: "us_top",
  };
  const result = calculateBlueprint(answers);

  assert.equal(result.archetype, "The Future Builder");
  assert.equal(result.stageTitle, "Foundation & Spike Exploration Window");
  assert.ok(result.mentorVerdict.includes("unaccredited summer pay-to-play"));
  assert.ok(result.strategicNote.includes("early high school"));
  assert.equal(result.topActions.length, 3);
  assert.equal(result.topActions[1].tag, "Milestone");
  assert.ok(result.topActions[1].detail.includes("Khan Academy"));
  assert.deepEqual(result.matchedFaculties, ["computer_science", "engineering"]);
});

test("calculateBlueprint: junior technical innovator with Italian destination", () => {
  const answers: AssessmentAnswers = {
    grade: "grade_11",
    interests: ["cs"],
    struggle: "timeline",
    ambition: "europe_italy",
  };
  const result = calculateBlueprint(answers);

  assert.equal(result.archetype, "The Technical Innovator");
  assert.equal(result.stageTitle, "High-Impact Competition & Portfolio Year");
  assert.ok(result.mentorVerdict.includes("phased execution"));
  assert.ok(result.topActions.some((a) => a.tag === "Strategy" && a.detail.includes("CISIA / TOLC")));
  assert.deepEqual(result.matchedFaculties, ["computer_science"]);
});

test("calculateBlueprint: senior strategic pioneer with full aid requirement", () => {
  const answers: AssessmentAnswers = {
    grade: "grade_12",
    interests: ["biz"],
    struggle: "cost",
    ambition: "full_aid",
  };
  const result = calculateBlueprint(answers);

  assert.equal(result.archetype, "The Strategic Pioneer");
  assert.equal(result.stageTitle, "Execution & Application Sprint");
  assert.ok(result.mentorVerdict.includes("World-class education does not require six-figure debt"));
  assert.ok(result.topActions.some((a) => a.tag === "Funding" && a.detail.includes("CSS Profile")));
  assert.deepEqual(result.matchedFaculties, ["business_economics"]);
});

test("calculateBlueprint: humanities and voice thinker navigating without counseling", () => {
  const answers: AssessmentAnswers = {
    grade: "grade_10",
    interests: ["humanities"],
    struggle: "guidance",
    ambition: "open",
  };
  const result = calculateBlueprint(answers);

  assert.equal(result.archetype, "The Voice & Policy Thinker");
  assert.ok(result.mentorVerdict.includes("Navigating alone without a school counselor"));
  assert.deepEqual(result.matchedFaculties, ["humanities_social"]);
});

test("calculateBlueprint: research investigator uncertain of career direction", () => {
  const answers: AssessmentAnswers = {
    grade: "grade_11",
    interests: ["med", "sci"],
    struggle: "direction",
    ambition: "asia_global",
  };
  const result = calculateBlueprint(answers);

  assert.equal(result.archetype, "The Research Investigator");
  assert.ok(result.mentorVerdict.includes("life's calling"));
  assert.deepEqual(result.matchedFaculties, ["medicine_health", "natural_sciences"]);
});

test("calculateBlueprint: creative visionary with design interests", () => {
  const answers: AssessmentAnswers = {
    grade: "grade_10",
    interests: ["design"],
    struggle: "clutter",
    ambition: "open",
  };
  const result = calculateBlueprint(answers);

  assert.equal(result.archetype, "The Creative Visionary");
  assert.deepEqual(result.matchedFaculties, ["arts_design"]);
});

test("calculateBlueprint: polymath with diverse interests", () => {
  const answers: AssessmentAnswers = {
    grade: "grade_11",
    interests: ["undecided", "cs"],
    struggle: "timeline",
    ambition: "open",
  };
  const result = calculateBlueprint(answers);

  assert.ok(result.archetype);
  assert.equal(result.topActions.length, 3);
});

test("Bundle Isolation: Assessment components have ZERO imports from heavy server registries", () => {
  const filesToCheck = [
    "components/assessment/mentorData.ts",
    "components/assessment/SummaryBlueprint.tsx",
    "components/assessment/Wizard.tsx",
    "app/assessment/page.tsx",
  ];

  const forbidden = [
    "lib/data/key-dates",
    "lib/data/careers",
    "lib/data/majors",
    "lib/data/study-destinations",
    "lib/data/world",
    "lib/data/from-home",
  ];

  for (const relPath of filesToCheck) {
    const fullPath = path.join(process.cwd(), relPath);
    const content = readFileSync(fullPath, "utf8");

    for (const mod of forbidden) {
      assert.ok(
        !content.includes(mod),
        `Bundle violation: ${relPath} directly imports forbidden registry: ${mod}`
      );
    }
  }
});

test("Ultrawide & Layout Compliance: app/assessment/page.tsx uses Container reading and max-w-2xl", () => {
  const pageContent = readFileSync(
    path.join(process.cwd(), "app/assessment/page.tsx"),
    "utf8"
  );
  assert.ok(
    pageContent.includes('Container size="reading"'),
    "Assessment page must wrap content in Container size='reading'"
  );
  assert.ok(
    pageContent.includes("max-w-2xl"),
    "Assessment page must constrain card to max-w-2xl"
  );
  assert.ok(
    pageContent.includes("<SkipLink />"),
    "Assessment page must include SkipLink for accessibility"
  );
  assert.ok(
    pageContent.includes("<BrandLink"),
    "Assessment page must include BrandLink"
  );
});
