/**
 * Deterministic check of the HK achievements effect (no API key needed).
 *   npx tsx scripts/test-hk-achievements.ts
 *
 * Shows, on the SAME academics, how a strong record vs. an empty record changes
 * the HK band, scholarship and reasoning — and that academics stay dominant.
 */
import { analyzeHkPrograms, type HkInputs } from "../lib/ai/hk-analyze";
import type { Activity, Honor } from "../lib/types";

const PROGRAMS = ["hku-bba", "ust-cs", "hku-mbbs"]; // last one is interview-gated

const STRONG_ACTS: Activity[] = [
  { type: "Academic", position: "Founder / President", organization: "Robotics Club", description: "Built and led a 30-person team; ran weekly sessions across 3 years.", grades: ["10", "11", "12"], hours_per_week: 8, weeks_per_year: 36, continue_in_college: true },
];
const STRONG_HONORS: Honor[] = [{ title: "International Science Olympiad — Medal", grades: ["12"], levels: ["International"] }];

function run(label: string, ib: number, acts: Activity[], honors: Honor[]) {
  const inputs: HkInputs = { ibTotal: ib, ielts: 7.5, gradeStatus: "predicted", activities: acts, honors };
  const out = analyzeHkPrograms(PROGRAMS, inputs);
  console.log(`\n=== ${label}  (IB ${ib}) ===`);
  for (const p of out) {
    const achMention = /achievements|record is thin|interview/i.test(p.reasoning) ? "✓ explained" : "—";
    console.log(`  ${p.program_id.padEnd(10)} status=${p.status.padEnd(6)} scholarship=${p.scholarship.padEnd(14)} interview=${p.interview_required}  reasoning:${achMention}`);
  }
}

console.log("Hong Kong — achievements effect (academics held constant per row)");
for (const ib of [37, 41]) {
  run("NO record   ", ib, [], []);
  run("STRONG record", ib, STRONG_ACTS, STRONG_HONORS);
}

// Print one full reasoning so the visible, auditable mechanic is concrete.
const sample = analyzeHkPrograms(["hku-bba"], { ibTotal: 37, ielts: 7.5, gradeStatus: "predicted", activities: STRONG_ACTS, honors: STRONG_HONORS })[0];
console.log(`\n--- sample reasoning (hku-bba, IB 37, strong record) ---\n${sample.reasoning}\n`);
