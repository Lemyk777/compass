// Section-level locality for the AI analysis.
//
// The rule "same profile → same output" exists because re-running the analysis
// on an UNCHANGED profile used to make the model-judged parts wobble (a factor
// scored 9 then 8, its wording and argument drifting) even though the student
// changed nothing. The honest behaviour is: a section only changes when the
// specific input it depends on changes.
//
// This module implements that. We diff the previous run's profile against the
// new one, grouped by the parts of the profile the MODEL actually reads, and:
//   - if no model-relevant group changed, the caller skips the AI call and reuses
//     the previous model output verbatim (deterministic parts recompute — they're
//     pure functions of the profile, so identical input gives identical output);
//   - if some group changed, the caller still calls the AI but keeps the previous
//     text for every section whose inputs didn't change.
//
// Deterministic-only fields (the per-country program lists, aid) are intentionally
// NOT groups here: they never feed the model — assembleAnalysis recomputes them in
// code — so changing them must not force the AI to re-run.

import type { StudentProfileInput } from "@/lib/types";
import type { ModelAnalysis } from "@/lib/ai/schema";

// The parts of the profile the model reads. `narrative` is the "story/context"
// (what you'll study, who you are); `schoolList` is the US target list.
// `destinations` is deliberately excluded — adding a destination triggers that
// country's deterministic engine, it shouldn't re-roll the US prose.
export type InputGroup =
  | "academics"
  | "activities"
  | "honors"
  | "narrative"
  | "schoolList";

const ALL_AI_GROUPS: InputGroup[] = [
  "academics",
  "activities",
  "honors",
  "narrative",
  "schoolList",
];

// The raw value behind each group — compared canonically to detect real changes.
function groupValue(p: StudentProfileInput, g: InputGroup): unknown {
  switch (g) {
    case "academics":
      return {
        grades: p.grades,
        tests: p.tests,
        curriculum: p.curriculum,
        school_years: p.school_years,
        graduation_year: p.graduation_year,
      };
    case "activities":
      return p.activities;
    case "honors":
      return p.honors;
    case "narrative":
      return {
        intended_major: p.intended_major,
        faculties: p.faculties,
        country: p.country,
        citizenship: p.citizenship,
      };
    case "schoolList":
      return p.target_schools;
  }
}

// Deterministic JSON (object keys sorted recursively) so two equal profiles hash
// identically regardless of key order; arrays keep their order.
function stable(v: unknown): string {
  return JSON.stringify(v, (_k, val) =>
    val && typeof val === "object" && !Array.isArray(val)
      ? Object.fromEntries(
          Object.entries(val as Record<string, unknown>).sort(([a], [b]) =>
            a.localeCompare(b)
          )
        )
      : val
  );
}

/** The model-relevant input groups that differ between two profiles. */
export function changedGroups(
  prev: StudentProfileInput,
  next: StudentProfileInput
): Set<InputGroup> {
  const changed = new Set<InputGroup>();
  for (const g of ALL_AI_GROUPS) {
    if (stable(groupValue(prev, g)) !== stable(groupValue(next, g))) changed.add(g);
  }
  return changed;
}

// Which input groups each reusable model section depends on. A section is reused
// verbatim when none of its groups changed.
const FACTOR_DEPS: Record<string, InputGroup[]> = {
  academics: ["academics"],
  test_scores: ["academics"],
  course_rigor: ["academics"],
  awards: ["honors"],
  leadership: ["activities", "honors"],
  extracurricular_depth: ["activities"],
  narrative_fit: ["narrative", "activities", "honors"],
};

// A per-school odds+reason depends on the whole academic/record/context picture —
// but NOT on which other schools are in the list.
const SCHOOL_DEPS: InputGroup[] = ["academics", "activities", "honors", "narrative"];

// Whole-profile prose. Excludes schoolList on purpose: adding or removing a target
// school shouldn't rewrite your summary, gaps, or timeline.
const PROFILE_DEPS: InputGroup[] = ["academics", "activities", "honors", "narrative"];

/**
 * Merge the freshly generated model output with the previous one, keeping prior
 * text for every section whose inputs didn't change. `changed` is the set of
 * groups that differ between the previous and current profile.
 */
export function mergeModelSections(
  prev: ModelAnalysis,
  fresh: ModelAnalysis,
  changed: Set<InputGroup>
): ModelAnalysis {
  const unchanged = (deps: InputGroup[]) => deps.every((d) => !changed.has(d));

  // Factors: reuse a factor's score + reasoning when its own inputs are unchanged.
  // Unknown keys fall back to "regenerate on any change" (conservative).
  const prevFactor = new Map(prev.factors.map((f) => [f.key, f]));
  const factors = fresh.factors.map((f) => {
    const deps = FACTOR_DEPS[f.key] ?? ALL_AI_GROUPS;
    const prior = prevFactor.get(f.key);
    return prior && unchanged(deps) ? prior : f;
  });

  // Schools: when the academic picture is unchanged, every school that already
  // existed keeps its prior odds + reason; brand-new schools come fresh.
  const prevSchool = new Map(prev.schools.map((s) => [s.name, s]));
  const schools = unchanged(SCHOOL_DEPS)
    ? fresh.schools.map((s) => prevSchool.get(s.name) ?? s)
    : fresh.schools;

  return {
    ...fresh,
    factors,
    schools,
    gap_analysis: unchanged(PROFILE_DEPS) ? prev.gap_analysis : fresh.gap_analysis,
    timeline: unchanged(PROFILE_DEPS) ? prev.timeline : fresh.timeline,
    summary: unchanged(PROFILE_DEPS) ? prev.summary : fresh.summary,
  };
}
