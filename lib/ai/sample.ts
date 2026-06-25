import type { Analysis } from "@/lib/ai/schema";
import type { StudentProfileInput } from "@/lib/types";
import {
  analyzeItalianPrograms,
  computeFinancialFitScore,
} from "@/lib/ai/italy-analyze";
import { recommendUniversities } from "@/lib/data/recommend";

// Demo: a Kazakhstan AI-startup founder applying to BOTH the US (business) and
// Italy (CS + economics). This exercises the full product — the multi-country
// selector, per-country scorecards, the Italian graduatoria breakdown, and the
// application-cost sections — so /demo mirrors what real users actually see.
const SAMPLE_ITALY_PROGRAMS = [
  "polimi-cs-eng",
  "bocconi-econ-mgmt",
  "unibo-business",
];
const SAMPLE_FAMILY_INCOME = 30000; // EUR/year — moderate DSU fit

// The §12 acceptance-test student, used to develop and demo the dashboard
// without a live API call. Real analyses come from /api/analyze.
export const SAMPLE_PROFILE: StudentProfileInput = {
  country: "Kazakhstan",
  citizenship: "Kazakhstan",
  destinations: ["US", "IT"],
  faculties: ["computer_science", "business_economics"],
  intended_major: "Finance / Business",
  curriculum: "A-Level",
  grades: { raw: "A*A*A (Math, Economics, Business, predicted)" },
  tests: { SAT: 1520, IELTS: 8.0 },
  activities: [
    {
      type: "Research",
      position: "Co-founder",
      organization: "AI startup",
      description:
        "Raised investment; placed top-7 of 1,200 teams at an international competition.",
      grades: ["11", "12"],
      timing: ["All year"],
      hours_per_week: 12,
      weeks_per_year: 40,
      continue_in_college: true,
    },
    {
      type: "Academic",
      position: "Lead organizer",
      organization: "School academic olympiad",
      description: "Organized a 200+ participant academic competition.",
      grades: ["11"],
      timing: ["School year"],
      hours_per_week: 5,
      weeks_per_year: 10,
    },
    {
      type: "Athletics: Club",
      position: "Captain",
      organization: "School sports league",
      description: "Led the team to a league title.",
      grades: ["10", "11"],
      timing: ["School year"],
      hours_per_week: 6,
      weeks_per_year: 20,
    },
  ],
  honors: [
    {
      title: "International competition — top 7 of 1,200 teams",
      grades: ["12"],
      levels: ["International"],
    },
    {
      title: "National academic olympiad — honorable mention",
      grades: ["11"],
      levels: ["National"],
    },
  ],
  target_schools: [
    "University of Pennsylvania",
    "Princeton University",
    "Boston University",
    "University of Michigan, Ann Arbor",
  ],
  needs_aid: true,
  italy_programs: SAMPLE_ITALY_PROGRAMS,
  italy_family_income: SAMPLE_FAMILY_INCOME,
  hk_programs: [],
  hk_grade_status: undefined,
};

export const SAMPLE_ANALYSIS: Analysis = {
  overall_score: 73,
  factors: [
    { key: "academics", label: "Academics", score: 8, rubric_tier: "Tier 8: Straight A*/A profile in most rigorous curriculum available", reasoning: ["Perfect 4.0 equivalent GPA", "Most rigorous A-Level selection"], note: "A*A*A in a rigorous A-Level set is strong for selective US targets." },
    { key: "test_scores", label: "Test scores", score: 9, rubric_tier: "Tier 9: Top 1% nationally, exceptional standardized scores", reasoning: ["SAT 1520 is in the top 1%", "IELTS 8.0 demonstrates perfect English proficiency"], note: "SAT 1520 and IELTS 8.0 are competitive almost everywhere on your list." },
    { key: "course_rigor", label: "Course rigor", score: 7, rubric_tier: "Tier 7: Highly rigorous, but lacking breadth", reasoning: ["Quantitative subjects are maxed out", "Missing humanities breadth for top-tier liberal arts"], note: "A-Levels in quantitative subjects show real rigor; more breadth would help." },
    { key: "leadership", label: "Leadership", score: 8, rubric_tier: "Tier 8: Regional/National impact founder or leader", reasoning: ["Co-founded funded startup", "Led team of 20+ people"], note: "Co-founding a funded startup is authentic, high-agency leadership." },
    { key: "extracurricular_depth", label: "Extracurricular depth", score: 7, rubric_tier: "Tier 7: Deep spike in one specific area with measurable impact", reasoning: ["Consistent 3-year commitment", "Clear theme around entrepreneurship"], note: "Focused around entrepreneurship and competitions — coherent, not scattered." },
    { key: "awards", label: "Awards & recognition", score: 6, rubric_tier: "Tier 6: Significant regional or minor national recognition", reasoning: ["Top 7 out of 1200 participants locally", "Lacks international-tier verification"], note: "Top-7 of 1,200 is strong; a clearly national/international title would lift this." },
    { key: "narrative_fit", label: "Narrative / fit", score: 7, rubric_tier: "Tier 7: Clear, authentic story that aligns well with stated major", reasoning: ["Founder story aligns perfectly with business major", "Lacks specific 'Why Us' hooks for individual schools"], note: "Founder story fits Finance/Business well; tie it to a specific 'why this school'." },
  ],
  schools: [
    { name: "Princeton University", tier: "reach", likelihood_low: 4, likelihood_high: 9, confidence: "low", fit_score: 7, reason: "Excellent profile, but ~4% admit rates make this a reach for everyone — and Princeton has no undergrad business major." },
    { name: "University of Pennsylvania", tier: "reach", likelihood_low: 6, likelihood_high: 12, confidence: "low", fit_score: 9, reason: "Wharton is a superb fit for your founder story, but admit rates are single digits and aid is need-aware for internationals." },
    { name: "University of Michigan, Ann Arbor", tier: "target", likelihood_low: 25, likelihood_high: 40, confidence: "medium", fit_score: 8, reason: "Ross is strong for business and your stats sit above the mid-range; international aid is limited, though." },
    { name: "Boston University", tier: "likely", likelihood_low: 45, likelihood_high: 65, confidence: "medium", fit_score: 8, reason: "Your SAT is at the top of BU's range and Questrom fits well; the friendliest odds on your current list." },
  ],
  // Computed by the real deterministic recommender so /demo mirrors the live
  // engine (matches the student's fields + aid needs, excludes their targets).
  recommended_schools: recommendUniversities(SAMPLE_PROFILE),
  benchmarks: [
    { school: "University of Pennsylvania", metric: "SAT", student_value: 1520, admit_p25: 1490, admit_p75: 1570 },
    { school: "Boston University", metric: "SAT", student_value: 1520, admit_p25: 1380, admit_p75: 1530 },
    { school: "University of Michigan, Ann Arbor", metric: "SAT", student_value: 1520, admit_p25: 1380, admit_p75: 1530 },
  ],
  gap_analysis: [
    { action: "Raise SAT 1520 → 1550+", impact: "+3 to competitiveness; nudges Penn/Michigan reasoning upward", effort: "medium", priority: 1 },
    { action: "Win a named national/international award in your field", impact: "Lifts Awards 6 → 8; strengthens every reach school", effort: "high", priority: 2 },
    { action: "Write a specific 'why this major + school' narrative", impact: "Improves fit scores and essay readiness across the list", effort: "low", priority: 3 },
    { action: "Add 1–2 aid-friendly target schools", impact: "De-risks a reach-heavy list given your aid need", effort: "low", priority: 4 },
  ],
  timeline: [
    { horizon: "1 month", items: ["Register for the next SAT date", "Draft activity descriptions with concrete numbers", "Shortlist 2 aid-friendly targets"] },
    { horizon: "3 months", items: ["Retake the SAT", "Enter one more competition in your field", "Draft your main essay around the startup story"] },
    { horizon: "6 months", items: ["Finalize a balanced school list (reach/target/likely)", "Secure strong recommenders", "Complete aid paperwork (CSS Profile)"] },
  ],
  summary:
    "You have a genuinely strong, coherent profile — top-decile test scores, real entrepreneurial leadership, and rigorous A-Levels. Your list is reach-heavy, and as an aid-seeking international that raises the stakes, so the highest-value moves are balancing the list with aid-friendly targets like Rochester and nudging your SAT and awards up. Penn and Princeton stay aspirational (single-digit odds for everyone); Michigan and BU are where your profile competes hardest. In Italy your SAT clears the Politecnico early-admission threshold outright — a far more predictable, score-based path worth securing alongside the US list.",
  // Italy pathway — computed deterministically by the engine, exactly as a real
  // analysis would assemble it, so the demo stays faithful to production.
  italy_programs: analyzeItalianPrograms(
    SAMPLE_ITALY_PROGRAMS,
    SAMPLE_PROFILE.tests.SAT,
    SAMPLE_FAMILY_INCOME
  ),
  italy_financial_fit_score: computeFinancialFitScore(
    SAMPLE_FAMILY_INCOME,
    true
  ),
};
