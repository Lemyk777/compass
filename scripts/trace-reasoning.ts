/**
 * REASONING TRACE — make the scoring model show its full work.
 *
 *   npm run trace:reasoning
 *   (loads .env.local via node --env-file; needs ANTHROPIC_API_KEY)
 *
 * Runs a spread of deliberately different student profiles through the EXACT
 * production system prompt (STATIC_SYSTEM_PROMPT) but with EXTENDED THINKING
 * enabled, so we capture the model's genuine step-by-step reasoning — every
 * argument it makes on its way to each 0–10 factor score — alongside the
 * structured JSON it returns. One Markdown transcript per profile is written to
 * reasoning-traces/ so we can audit exactly what the AI decides vs. what could
 * instead be computed deterministically in code.
 */
import Anthropic from "@anthropic-ai/sdk";
import * as fs from "fs";
import * as path from "path";
import { STATIC_SYSTEM_PROMPT } from "../lib/ai/prompt";

const MODEL = "claude-haiku-4-5";
const THINKING_BUDGET = 4000;
const MAX_TOKENS = 9000;

const OUT_DIR = path.join(__dirname, "..", "reasoning-traces");

// ── Compact profiles in the exact shape the model receives (buildModelInput) ──
type Profile = Record<string, unknown> & { target_schools: string[] };

const PROFILES: { id: string; label: string; profile: Profile }[] = [
  {
    id: "01-strong-stem-spike",
    label: "Сильный STEM-спайк (founder + олимпиады)",
    profile: {
      country: "Kazakhstan", citizenship: "Kazakhstan", destinations: ["US"],
      faculties: ["computer_science"], intended_major: "Computer Science", curriculum: "A-Level",
      grades: { raw: "A*A*A* (Math, Further Math, Physics, predicted)" }, tests: { SAT: 1550, IELTS: 8.0 },
      activities: [
        { type: "Research", position: "Co-founder", organization: "AI startup", description: "Built a CV model; raised seed funding; 5k users.", grades: ["10", "11", "12"], hours_per_week: 15, weeks_per_year: 40, continue_in_college: true },
        { type: "Academic", position: "Team captain", organization: "National Informatics Olympiad", description: "Led school team; coached 8 juniors.", grades: ["11", "12"], hours_per_week: 8, weeks_per_year: 30 },
      ],
      honors: [{ title: "International Olympiad in Informatics — Bronze", grades: ["12"], levels: ["International"] }],
      target_schools: ["Massachusetts Institute of Technology", "Carnegie Mellon University", "University of Pennsylvania", "Purdue University"],
      needs_aid: true,
    },
  },
  {
    id: "02-mid-generalist",
    label: "Средний универсал (хорошие оценки, мелкие активности)",
    profile: {
      country: "India", citizenship: "India", destinations: ["US"],
      faculties: ["business_economics"], intended_major: "Economics", curriculum: "IB",
      grades: { raw: "IB predicted 38/45" }, tests: { SAT: 1380, IELTS: 7.0 },
      activities: [
        { type: "Community Service (Volunteer)", position: "Member", organization: "Interact Club", description: "Helped at weekend events.", grades: ["11", "12"], hours_per_week: 3, weeks_per_year: 20 },
        { type: "Athletics: Club", position: "Member", organization: "School football", description: "Played in the school team.", grades: ["10", "11"], hours_per_week: 4, weeks_per_year: 20 },
      ],
      honors: [{ title: "School merit certificate", grades: ["11"], levels: ["School"] }],
      target_schools: ["Boston University", "University of Rochester", "Purdue University", "Fordham University"],
      needs_aid: false,
    },
  },
  {
    id: "03-resume-padder",
    label: "«Накрутка списка» (много активностей по 1 ч/нед)",
    profile: {
      country: "Nigeria", citizenship: "Nigeria", destinations: ["US"],
      faculties: ["business_economics"], intended_major: "Business", curriculum: "national",
      grades: { raw: "WAEC: mostly A1/B2" }, tests: { SAT: 1300 },
      activities: [
        { type: "Academic", position: "Member", organization: "Debate club", description: "Attended meetings.", grades: ["11"], hours_per_week: 1, weeks_per_year: 20 },
        { type: "Cultural", position: "Member", organization: "Drama club", description: "Helped sometimes.", grades: ["11"], hours_per_week: 1, weeks_per_year: 15 },
        { type: "Community Service (Volunteer)", position: "Member", organization: "Red Cross", description: "Volunteered occasionally.", grades: ["12"], hours_per_week: 1, weeks_per_year: 10 },
        { type: "Career-Oriented", position: "Member", organization: "Young Entrepreneurs", description: "Joined the club.", grades: ["12"], hours_per_week: 1, weeks_per_year: 10 },
      ],
      honors: [],
      target_schools: ["Boston University", "Fordham University", "University of Pittsburgh"],
      needs_aid: true,
    },
  },
  {
    id: "04-low-test-real-work",
    label: "Низкий тест, но 20 ч/нед оплачиваемой работы/семьи",
    profile: {
      country: "Philippines", citizenship: "Philippines", destinations: ["US"],
      faculties: ["computer_science"], intended_major: "Information Technology", curriculum: "US-GPA",
      grades: { raw: "GPA 3.6/4.0 unweighted" }, tests: { SAT: 1180, TOEFL: 95 },
      activities: [
        { type: "Work (Paid)", position: "Part-time worker", organization: "Family store", description: "Ran the register and inventory after school to support family income.", grades: ["10", "11", "12"], hours_per_week: 22, weeks_per_year: 48 },
        { type: "Computer/Technology", position: "Self-taught developer", organization: "Personal projects", description: "Built two small Android apps.", grades: ["11", "12"], hours_per_week: 6, weeks_per_year: 30, continue_in_college: true },
      ],
      honors: [],
      target_schools: ["University of Pittsburgh", "Purdue University", "Drexel University"],
      needs_aid: true,
    },
  },
  {
    id: "05-weak-academics",
    label: "Слабая академика в целом",
    profile: {
      country: "Brazil", citizenship: "Brazil", destinations: ["US"],
      faculties: ["business_economics"], intended_major: "Marketing", curriculum: "national",
      grades: { raw: "Average grades, ~C+ equivalent" }, tests: { SAT: 1050, TOEFL: 78 },
      activities: [
        { type: "Athletics: Club", position: "Member", organization: "Local football club", description: "Played weekends.", grades: ["10", "11"], hours_per_week: 5, weeks_per_year: 25 },
      ],
      honors: [],
      target_schools: ["Drexel University", "Fordham University"],
      needs_aid: true,
    },
  },
  {
    id: "06-olympiad-medalist",
    label: "Медалист-олимпиадник (международные награды)",
    profile: {
      country: "Vietnam", citizenship: "Vietnam", destinations: ["US"],
      faculties: ["computer_science"], intended_major: "Mathematics", curriculum: "national",
      grades: { raw: "National gifted school, top of class" }, tests: { SAT: 1500, IELTS: 7.5 },
      activities: [
        { type: "Academic", position: "Competitor", organization: "Math olympiad training", description: "Trained 15 hrs/week with the national team.", grades: ["10", "11", "12"], hours_per_week: 15, weeks_per_year: 44, continue_in_college: true },
      ],
      honors: [
        { title: "International Mathematical Olympiad — Silver Medal", grades: ["12"], levels: ["International"] },
        { title: "National Mathematical Olympiad — 1st place", grades: ["11"], levels: ["National"] },
      ],
      target_schools: ["Massachusetts Institute of Technology", "California Institute of Technology", "Carnegie Mellon University"],
      needs_aid: true,
    },
  },
];

function extractJson(text: string): any | null {
  let t = text.trim();
  const fence = t.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fence) t = fence[1].trim();
  const start = t.indexOf("{");
  const end = t.lastIndexOf("}");
  if (start !== -1 && end !== -1 && end > start) t = t.slice(start, end + 1);
  try { return JSON.parse(t); } catch { return null; }
}

function scoresTable(json: any): string {
  if (!json?.factors) return "_(no factors parsed)_";
  const rows = json.factors.map(
    (f: any) =>
      `| ${f.key} | **${f.score}** | ${f.rubric_tier ?? ""} | ${(f.reasoning ?? []).join("; ")} |`
  );
  return ["| factor | score | rubric_tier | reasoning bullets |", "|---|---|---|---|", ...rows].join("\n");
}

function schoolsTable(json: any): string {
  if (!json?.schools?.length) return "_(none)_";
  const rows = json.schools.map(
    (s: any) => `| ${s.name} | ${s.tier} | ${s.likelihood_low}-${s.likelihood_high}% | ${s.confidence} | ${s.fit_score} |`
  );
  return ["| school | tier | likelihood | conf | fit |", "|---|---|---|---|---|", ...rows].join("\n");
}

async function run() {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) { console.error("Missing ANTHROPIC_API_KEY"); process.exit(1); }
  const anthropic = new Anthropic({ apiKey, maxRetries: 3 });
  fs.mkdirSync(OUT_DIR, { recursive: true });

  const summary: string[] = [];
  for (const { id, label, profile } of PROFILES) {
    process.stdout.write(`\n▶ ${id} — ${label}\n  thinking…`);
    const msg = await anthropic.messages.create({
      model: MODEL,
      max_tokens: MAX_TOKENS,
      thinking: { type: "enabled", budget_tokens: THINKING_BUDGET },
      system: [{ type: "text", text: STATIC_SYSTEM_PROMPT }],
      messages: [{ role: "user", content: JSON.stringify(profile) }],
    });

    const thinkingParts: string[] = [];
    const textParts: string[] = [];
    for (const b of msg.content) {
      if (b.type === "thinking") thinkingParts.push(b.thinking);
      else if (b.type === "text") textParts.push(b.text);
    }
    const thinking = thinkingParts.join("\n\n");
    const text = textParts.join("");
    const json = extractJson(text);

    const md = [
      `# ${id}\n\n**${label}**`,
      `\n## 1. Профиль (ровно то, что увидела модель)`,
      "```json\n" + JSON.stringify(profile, null, 2) + "\n```",
      `\n## 2. 🧠 Полный ход рассуждений модели (extended thinking — verbatim)`,
      "Это НЕ оправдание после решения — это реальный внутренний ход модели, шаг за шагом:\n",
      "```\n" + (thinking || "(модель не вернула thinking-блоков)") + "\n```",
      `\n## 3. 📊 Что модель в итоге выставила`,
      scoresTable(json),
      `\n### Школы (шансы, которые мы теперь переопределяем кодом)`,
      schoolsTable(json),
      `\n### Summary модели`,
      "> " + (json?.summary ?? "(none)").replace(/\n/g, "\n> "),
      `\n## 4. Токены`,
      `input=${msg.usage.input_tokens} · output=${msg.usage.output_tokens} · stop=${msg.stop_reason}`,
      "",
    ].join("\n");

    const file = path.join(OUT_DIR, `${id}.md`);
    fs.writeFileSync(file, md);
    const overall = json?.factors ? json.factors.map((f: any) => `${f.key.slice(0, 4)}:${f.score}`).join(" ") : "parse-fail";
    console.log(`\r  ✓ ${id}  →  ${overall}`);
    summary.push(`- **${id}** — ${label}\n  - оценки: ${overall}\n  - thinking: ${Math.round(thinking.length / 4)} ток. · out: ${msg.usage.output_tokens} ток.`);
  }

  fs.writeFileSync(path.join(OUT_DIR, "INDEX.md"), `# Reasoning traces\n\nЧто ИИ реально делает в цепочке оценки, по ${PROFILES.length} профилям.\n\n${summary.join("\n")}\n`);
  console.log(`\n💾 Транскрипты: ${OUT_DIR}\\*.md  (+ INDEX.md)`);
}

run().catch((e) => { console.error("\nFailed:", e); process.exit(1); });
