import { RankingsView } from "@/components/dashboard/views/RankingsView";
import { orderFactors, type LeaderboardRow } from "@/lib/data/leaderboard";

// Sample leaderboard so /demo/rankings shows the design without a database.
// Factor scores are on our 0–10 rubric, exactly like the Your-standing scorecard.

const LABELS: Record<string, string> = {
  academics: "Academics",
  test_scores: "Test scores",
  course_rigor: "Course rigor",
  leadership: "Leadership",
  extracurricular_depth: "Extracurricular depth",
  awards: "Awards & recognition",
  narrative_fit: "Narrative / fit",
};

// Compact factor builder: f({ academics: 9, ... }) → ordered LeaderboardFactor[].
// A row may carry anywhere from 3 to 7 factors — the board renders whatever's
// here, so the demo deliberately mixes full (US-style, 7) and reduced
// (Italy-style, 4) profiles to show the country-agnostic layout holds up.
const f = (scores: Record<string, number>) =>
  orderFactors(
    Object.entries(scores).map(([key, score]) => ({
      key,
      label: LABELS[key] ?? key,
      score,
    }))
  );

const SAMPLE: LeaderboardRow[] = [
  {
    userId: "u1",
    name: "Daniel Whitfield",
    major: "Computer Science",
    overall: 91,
    factors: f({ academics: 10, test_scores: 10, course_rigor: 9, leadership: 9, extracurricular_depth: 9, awards: 9, narrative_fit: 8 }),
  },
  {
    userId: "u2",
    name: "Agastya Bhardwaj",
    major: "Business & Economics",
    overall: 90,
    factors: f({ academics: 9, test_scores: 9, course_rigor: 8, leadership: 9, extracurricular_depth: 9, awards: 8, narrative_fit: 9 }),
  },
  {
    userId: "u3",
    name: "Giulia Romano",
    major: "Engineering (Italy)",
    overall: 88,
    // Italy-style profile — only the factors that matter for state admission.
    factors: f({ academics: 9, test_scores: 10, course_rigor: 8, narrative_fit: 7 }),
  },
  {
    userId: "u4",
    name: "Ratmir Kutyrev",
    major: "Engineering",
    overall: 85,
    factors: f({ academics: 9, test_scores: 8, course_rigor: 9, leadership: 9, extracurricular_depth: 9, awards: 9, narrative_fit: 8 }),
  },
  {
    userId: "u-aizhan",
    name: "Aizhan Suleimenova",
    major: "Business & Economics",
    overall: 76,
    factors: f({ academics: 8, test_scores: 7, course_rigor: 7, leadership: 8, extracurricular_depth: 7, awards: 6, narrative_fit: 7 }),
  },
  {
    userId: "u6",
    name: "Anna Petrova",
    major: "Natural Sciences",
    overall: 74,
    factors: f({ academics: 8, test_scores: 8, course_rigor: 7, leadership: 7, extracurricular_depth: 8, awards: 6, narrative_fit: 6 }),
  },
  {
    userId: "u7",
    name: "Diego Ramos",
    major: "Humanities & Social Sciences",
    overall: 71,
    factors: f({ academics: 8, test_scores: 7, course_rigor: 7, leadership: 7, extracurricular_depth: 8, awards: 6, narrative_fit: 7 }),
  },
  {
    userId: "u8",
    name: "Mei Tanaka",
    major: "Arts & Design",
    overall: 68,
    factors: f({ academics: 7, test_scores: 6, course_rigor: 6, leadership: 7, extracurricular_depth: 8, awards: 5, narrative_fit: 8 }),
  },
  {
    userId: "u9",
    name: "Sofia Bianchi",
    major: "Medicine & Health (Italy)",
    overall: 65,
    // Another reduced (Italy-style) profile.
    factors: f({ academics: 8, test_scores: 7, course_rigor: 6, narrative_fit: 5 }),
  },
];

export default function DemoRankingsPage() {
  return <RankingsView rows={SAMPLE} currentUserId="u-aizhan" />;
}
