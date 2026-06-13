import type { Analysis } from "@/lib/ai/schema";
import type { StudentProfileInput } from "@/lib/types";

// The §12 acceptance-test student, used to develop and demo the dashboard
// without a live API call. Real analyses come from /api/analyze.
export const SAMPLE_PROFILE: StudentProfileInput = {
  country: "Kazakhstan",
  citizenship: "Kazakhstan",
  intended_major: "Finance / Business",
  curriculum: "A-Level",
  grades: { raw: "A*A*A (Math, Economics, Business, predicted)" },
  tests: { SAT: 1520, IELTS: 8.0 },
  activities: [
    {
      title: "Co-founded an AI startup",
      detail:
        "Received investment; placed top-7 of 1,200 teams at an international competition.",
    },
    { title: "Organized a 200+ participant academic competition" },
    { title: "School league winner" },
  ],
  target_schools: [
    "University of Pennsylvania",
    "Princeton University",
    "Boston University",
    "University of Michigan, Ann Arbor",
  ],
  needs_aid: true,
};

export const SAMPLE_ANALYSIS: Analysis = {
  overall_score: 73,
  factors: [
    { key: "academics", label: "Academics", score: 8, note: "A*A*A in a rigorous A-Level set is strong for selective US targets." },
    { key: "test_scores", label: "Test scores", score: 9, note: "SAT 1520 and IELTS 8.0 are competitive almost everywhere on your list." },
    { key: "course_rigor", label: "Course rigor", score: 7, note: "A-Levels in quantitative subjects show real rigor; more breadth would help." },
    { key: "leadership", label: "Leadership", score: 8, note: "Co-founding a funded startup is authentic, high-agency leadership." },
    { key: "extracurricular_depth", label: "Extracurricular depth", score: 7, note: "Focused around entrepreneurship and competitions — coherent, not scattered." },
    { key: "awards", label: "Awards & recognition", score: 6, note: "Top-7 of 1,200 is strong; a clearly national/international title would lift this." },
    { key: "narrative_fit", label: "Narrative / fit", score: 7, note: "Founder story fits Finance/Business well; tie it to a specific 'why this school'." },
  ],
  schools: [
    { name: "Princeton University", tier: "reach", likelihood_low: 4, likelihood_high: 9, confidence: "low", fit_score: 7, reason: "Excellent profile, but ~4% admit rates make this a reach for everyone — and Princeton has no undergrad business major." },
    { name: "University of Pennsylvania", tier: "reach", likelihood_low: 6, likelihood_high: 12, confidence: "low", fit_score: 9, reason: "Wharton is a superb fit for your founder story, but admit rates are single digits and aid is need-aware for internationals." },
    { name: "University of Michigan, Ann Arbor", tier: "target", likelihood_low: 25, likelihood_high: 40, confidence: "medium", fit_score: 8, reason: "Ross is strong for business and your stats sit above the mid-range; international aid is limited, though." },
    { name: "Boston University", tier: "likely", likelihood_low: 45, likelihood_high: 65, confidence: "medium", fit_score: 8, reason: "Your SAT is at the top of BU's range and Questrom fits well; the friendliest odds on your current list." },
  ],
  recommended_schools: [
    { name: "University of Rochester", tier: "target", fit_score: 8, why: "Strong in economics/business, generous merit aid for internationals, and far friendlier admit odds — a smart addition." },
    { name: "New York University", tier: "target", fit_score: 8, why: "Stern is a top fit for finance and a global founder profile; large international community." },
    { name: "University of Michigan, Ann Arbor", tier: "target", fit_score: 8, why: "Already on your list — keep it as your anchor target for business." },
  ],
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
    "You have a genuinely strong, coherent profile — top-decile test scores, real entrepreneurial leadership, and rigorous A-Levels. Your list is reach-heavy, and as an aid-seeking international that raises the stakes, so the highest-value moves are balancing the list with aid-friendly targets like Rochester and nudging your SAT and awards up. Penn and Princeton stay aspirational (single-digit odds for everyone); Michigan and BU are where your profile competes hardest.",
};
