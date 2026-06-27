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
// Every profile carries the same overall score + 7-factor breakdown regardless
// of destination; `countries` decides which per-country mini-section a row also
// appears in (a row can belong to several, e.g. US + HK).
const f = (scores: Record<string, number>) =>
  orderFactors(
    Object.entries(scores).map(([key, score]) => ({
      key,
      label: LABELS[key] ?? key,
      score,
    }))
  );

// Country-native breakdowns (same shape the live page derives from the Italy/HK
// program analyses) so /demo/rankings shows each board talking about its own
// country, not US factors.
const itf = (academic: number, security: number, finance: number) =>
  orderFactors([
    { key: "it_academic", label: "Academic margin", score: academic },
    { key: "it_security", label: "Admission odds", score: security },
    { key: "it_finance", label: "Financial fit", score: finance },
  ]);

// HK is grades-first: GPA + test + rigor spine, with one combined achievements
// bar (olympiads/awards weighted heaviest) as the tie-breaker.
const hkf = (gpa: number, test: number, rigor: number, achievements: number) =>
  orderFactors([
    { key: "academics", label: "Academics", score: gpa },
    { key: "test_scores", label: "Test score", score: test },
    { key: "course_rigor", label: "Course rigor", score: rigor },
    { key: "hk_achievements", label: "Achievements", score: achievements },
  ]);

const SAMPLE: LeaderboardRow[] = [
  {
    userId: "u1",
    name: "Daniel Whitfield",
    major: "Computer Science",
    overall: 91,
    countries: ["US"],
    factors: f({ academics: 10, test_scores: 10, course_rigor: 9, leadership: 9, extracurricular_depth: 9, awards: 9, narrative_fit: 8 }),
  },
  {
    userId: "u2",
    name: "Agastya Bhardwaj",
    major: "Business & Economics",
    overall: 90,
    countries: ["US", "HK"],
    factors: f({ academics: 9, test_scores: 9, course_rigor: 8, leadership: 9, extracurricular_depth: 9, awards: 8, narrative_fit: 9 }),
    factorsByCountry: { HK: hkf(9, 9, 8, 8) },
  },
  {
    userId: "u3",
    name: "Giulia Romano",
    major: "Engineering (Italy)",
    overall: 88,
    countries: ["IT"],
    factors: f({ academics: 9, test_scores: 10, course_rigor: 8, leadership: 7, extracurricular_depth: 6, awards: 7, narrative_fit: 7 }),
    factorsByCountry: { IT: itf(9, 7, 6) },
  },
  {
    userId: "u4",
    name: "Ratmir Kutyrev",
    major: "Engineering",
    overall: 85,
    countries: ["US"],
    factors: f({ academics: 9, test_scores: 8, course_rigor: 9, leadership: 9, extracurricular_depth: 9, awards: 9, narrative_fit: 8 }),
  },
  {
    userId: "u-aizhan",
    name: "Aizhan Suleimenova",
    major: "Business & Economics",
    overall: 76,
    countries: ["US", "HK"],
    factors: f({ academics: 8, test_scores: 7, course_rigor: 7, leadership: 8, extracurricular_depth: 7, awards: 6, narrative_fit: 7 }),
    factorsByCountry: { HK: hkf(8, 7, 7, 7) },
  },
  {
    userId: "u6",
    name: "Anna Petrova",
    major: "Natural Sciences",
    overall: 74,
    countries: ["US"],
    factors: f({ academics: 8, test_scores: 8, course_rigor: 7, leadership: 7, extracurricular_depth: 8, awards: 6, narrative_fit: 6 }),
  },
  {
    userId: "u7",
    name: "Diego Ramos",
    major: "Humanities & Social Sciences",
    overall: 71,
    countries: ["US"],
    factors: f({ academics: 8, test_scores: 7, course_rigor: 7, leadership: 7, extracurricular_depth: 8, awards: 6, narrative_fit: 7 }),
  },
  {
    userId: "u8",
    name: "Mei Tanaka",
    major: "Arts & Design",
    overall: 68,
    countries: ["HK"],
    factors: f({ academics: 7, test_scores: 6, course_rigor: 6, leadership: 7, extracurricular_depth: 8, awards: 5, narrative_fit: 8 }),
    factorsByCountry: { HK: hkf(7, 6, 6, 6) },
  },
  {
    userId: "u9",
    name: "Sofia Bianchi",
    major: "Medicine & Health (Italy)",
    overall: 65,
    countries: ["IT"],
    factors: f({ academics: 8, test_scores: 7, course_rigor: 6, leadership: 5, extracurricular_depth: 6, awards: 5, narrative_fit: 5 }),
    factorsByCountry: { IT: itf(7, 4, 8) },
  },
];

export default function DemoRankingsPage() {
  return <RankingsView rows={SAMPLE} currentUserId="u-aizhan" />;
}
