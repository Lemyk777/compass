/**
 * SIMULATION — can the product argue every holistic score?  (no API key)
 *   npx tsx scripts/sim-scorecard.ts
 *
 * Three students at low / high / mid holistic levels. For each factor we print
 * the TIER, the derived SCORE, the published RULE that fired, and the EVIDENCE
 * (the student's own data) — so every point is fully defensible.
 */
import { scoreHolistic } from "../lib/ai/tier-score";
import type { Activity, Honor } from "../lib/types";

type Student = { name: string; target: string; major: string; faculties: string[]; activities: Activity[]; honors: Honor[] };

const STUDENTS: Student[] = [
  {
    name: "A — Maria",
    target: "ожидаем ~4 (слабый холистик)",
    major: "Business", faculties: ["business_economics"],
    activities: [
      { type: "Community Service (Volunteer)", position: "Member", organization: "Interact Club", description: "Helped at events.", grades: ["11", "12"], hours_per_week: 2, weeks_per_year: 20 },
      { type: "Athletics: Club", position: "Member", organization: "School football", description: "Played weekends.", grades: ["10", "11"], hours_per_week: 3, weeks_per_year: 18 },
    ],
    honors: [{ title: "School attendance award", grades: ["11"], levels: ["School"] }],
  },
  {
    name: "B — Daniyar",
    target: "ожидаем ~8 (сильный холистик)",
    major: "Computer Science", faculties: ["computer_science"],
    activities: [
      { type: "Research", position: "Co-founder", organization: "AI startup", description: "Built a computer-vision product; raised funding; led a team of 6.", grades: ["10", "11", "12"], hours_per_week: 15, weeks_per_year: 40, continue_in_college: true },
      { type: "Academic", position: "Captain", organization: "National Informatics Olympiad team", description: "Coached juniors.", grades: ["11", "12"], hours_per_week: 6, weeks_per_year: 30 },
    ],
    honors: [{ title: "National Informatics Olympiad — 1st place", grades: ["12"], levels: ["National"] }],
  },
  {
    name: "C — Aisha",
    target: "ожидаем ~6 (средний холистик)",
    major: "Economics", faculties: ["business_economics"],
    activities: [
      { type: "Academic", position: "President", organization: "School Economics Club", description: "Ran weekly sessions for 25 members.", grades: ["11", "12"], hours_per_week: 5, weeks_per_year: 30 },
      { type: "Community Service (Volunteer)", position: "Volunteer", organization: "Local NGO", description: "Tutored kids.", grades: ["11"], hours_per_week: 3, weeks_per_year: 20 },
    ],
    honors: [{ title: "Regional Economics Competition — finalist", grades: ["11"], levels: ["State/Regional"] }],
  },
];

const bar = (n: number) => "█".repeat(Math.round(n)) + "░".repeat(10 - Math.round(n));

for (const s of STUDENTS) {
  const card = scoreHolistic({ activities: s.activities, honors: s.honors, intended_major: s.major, faculties: s.faculties });
  console.log("\n" + "═".repeat(74));
  console.log(`${s.name}   (${s.target})`);
  console.log(`ХОЛИСТИЧЕСКИЙ БАЛЛ: ${card.holistic}/10   ${bar(card.holistic)}`);
  console.log("═".repeat(74));
  for (const f of card.factors) {
    console.log(`\n● ${f.factor}${f.proxy ? " (proxy → ИИ уточняет)" : ""}`);
    console.log(`   ${f.tierName}  →  балл ${f.score}/10`);
    console.log(`   ПРАВИЛО:  ${f.rule}`);
    console.log(`   ДОКАЗАТЕЛЬСТВО:`);
    for (const e of f.evidence) console.log(`      • ${e}`);
  }
}
console.log("\n" + "═".repeat(74));
console.log("Каждый балл = ТИР (по правилу + доказательству) → фикс. таблица. Тот же профиль → тот же балл.");
