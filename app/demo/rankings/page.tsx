import { RankingsView } from "@/components/dashboard/views/RankingsView";
import type { LeaderboardRow } from "@/lib/data/leaderboard";

// Sample leaderboard so /demo/rankings shows the design without a database.
// Dimensions are on our 0–10 rubric, exactly like the Your-standing scorecard.
const SAMPLE: LeaderboardRow[] = [
  { userId: "u1", name: "Daniel Whitfield", major: "Computer Science", overall: 91, academics: 10, activities: 9, awards: 9, leadership: 9 },
  { userId: "u2", name: "Agastya Bhardwaj", major: "Business & Economics", overall: 90, academics: 9, activities: 9, awards: 8, leadership: 9 },
  { userId: "u3", name: "Hajoon Kim", major: "Engineering", overall: 88, academics: 10, activities: 9, awards: 8, leadership: 9 },
  { userId: "u4", name: "Ratmir Kutyrev", major: "Engineering", overall: 85, academics: 9, activities: 9, awards: 9, leadership: 9 },
  { userId: "u-aizhan", name: "Aizhan Suleimenova", major: "Business & Economics", overall: 76, academics: 8, activities: 7, awards: 6, leadership: 8 },
  { userId: "u6", name: "Anna Petrova", major: "Natural Sciences", overall: 74, academics: 8, activities: 8, awards: 6, leadership: 7 },
  { userId: "u7", name: "Diego Ramos", major: "Humanities & Social Sciences", overall: 71, academics: 8, activities: 8, awards: 6, leadership: 7 },
  { userId: "u8", name: "Mei Tanaka", major: "Arts & Design", overall: 68, academics: 7, activities: 8, awards: 5, leadership: 7 },
  { userId: "u9", name: "Omar Haddad", major: "Medicine & Health", overall: 65, academics: 8, activities: 7, awards: 5, leadership: 6 },
];

export default function DemoRankingsPage() {
  return <RankingsView rows={SAMPLE} currentUserId="u-aizhan" />;
}
