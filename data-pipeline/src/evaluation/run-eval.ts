/**
 * Demo / self-check for the deep evaluation engine.
 *
 *   npm run eval:demo   (from data-pipeline/)
 *
 *  Layer 1 is exercised on the REAL 200-profile dataset (dataset.json).
 *  Layer 2 is exercised on a synthetic labelled set with a KNOWN hidden admit
 *  law, to prove the empirical model recovers the signal. If a non-empty
 *  dataset_real.json (from `npm run scrape:reddit:real`) is present, the
 *  empirical model is built from that REAL data instead.
 */
import * as fs from "fs";
import * as path from "path";
import {
  academicIndex,
  deepRubric,
  buildEmpiricalModel,
  curveAt,
  evaluate,
  type Profile,
  type LabeledRecord,
} from "./deep-eval";

const DIR = path.join(__dirname, "..", "..");
const read = (f: string) => JSON.parse(fs.readFileSync(path.join(DIR, f), "utf8"));

function dist(nums: number[]) {
  const s = [...nums].sort((a, b) => a - b);
  const q = (p: number) => s[Math.min(s.length - 1, Math.floor(p * s.length))];
  const mean = nums.reduce((a, b) => a + b, 0) / (nums.length || 1);
  return { n: nums.length, min: s[0], p25: q(0.25), median: q(0.5), p75: q(0.75), max: s[s.length - 1], mean: Math.round(mean * 10) / 10 };
}

// ── Layer 1 over the real dataset ─────────────────────────────────────────────
function checkLayer1() {
  console.log("\n=== LAYER 1 — deep rubric over dataset.json (real profiles) ===");
  const data: Profile[] = read("dataset.json");
  const scores: number[] = [];
  const indices: number[] = [];
  let spikes = 0;
  for (const p of data) {
    const r = deepRubric(p);
    scores.push(r.overall);
    indices.push(r.academicIndex.value);
    if (r.spike.detected) spikes++;
  }
  console.log("deepScore distribution:", dist(scores));
  console.log("academicIndex distribution:", dist(indices));
  console.log(`spike detected: ${spikes}/${data.length} (${Math.round((spikes / data.length) * 100)}%)`);

  console.log("\n— sample breakdown (profile #0):");
  const r0 = deepRubric(data[0]);
  console.log(`  deepScore=${r0.overall} | academicIndex=${r0.academicIndex.value} | spike=${r0.spike.detected ? r0.spike.area + " (" + r0.spike.strength + ")" : "none"}`);
  for (const f of r0.factors) console.log(`   • ${f.key.padEnd(22)} ${f.score}/10  sub=${JSON.stringify(f.sub)}`);
}

// ── Synthetic labelled data with a known hidden admit law (for Layer 2) ───────
function syntheticProfile(targetIndex: number, school: string): Profile {
  // Build a profile whose academicIndex ≈ targetIndex by choosing SAT + IB.
  const sat = Math.round(clamp(400 + (targetIndex / 100) * 1200, 400, 1600) / 10) * 10;
  const ib = Math.round(clamp(24 + (targetIndex / 100) * 21, 24, 45));
  return {
    curriculum: "IB",
    grades: { ib_total: ib },
    tests: { SAT: sat, IELTS: 7.5 },
    faculties: ["computer_science"],
    intended_major: "Computer Science",
    activities: [],
    honors: [],
    target_schools: [school],
  };
}
const clamp = (n: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, n));
const sigmoid = (x: number) => 1 / (1 + Math.exp(-x));

function makeSyntheticLabelled(): { records: LabeledRecord[]; truth: Record<string, number> } {
  // Hidden "true" selectivity thresholds (index at which admit prob = 50%).
  const truth: Record<string, number> = {
    "Massachusetts Institute of Technology": 92,
    "University of Michigan": 72,
    "Arizona State University": 50,
  };
  const records: LabeledRecord[] = [];
  let seed = 42;
  const rand = () => ((seed = (seed * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff);

  for (const [school, thr] of Object.entries(truth)) {
    for (let i = 0; i < 120; i++) {
      const idxTarget = Math.round(40 + rand() * 60); // applicants index 40–100
      const p = syntheticProfile(idxTarget, school);
      const realIdx = academicIndex(p).value;
      const pAdmit = sigmoid((realIdx - thr) / 6);
      const admitted = rand() < pAdmit;
      records.push({ profile: p, accepted: admitted ? [school] : [], rejected: admitted ? [] : [school] });
    }
  }
  return { records, truth };
}

function checkLayer2() {
  console.log("\n=== LAYER 2 — empirical 'students like you' ===");

  // Prefer REAL scraped outcomes if present; else synthetic proof.
  let records: LabeledRecord[] | null = null;
  const realPath = path.join(DIR, "dataset_real.json");
  if (fs.existsSync(realPath)) {
    const real = JSON.parse(fs.readFileSync(realPath, "utf8"));
    if (Array.isArray(real) && real.length > 0) {
      records = real.map((r: any) => ({
        profile: {
          curriculum: r.extracted?.curriculum ?? null,
          grades: { ib_total: r.extracted?.ib_score ?? null, gpa: null },
          tests: { SAT: r.extracted?.sat ?? null, ACT: r.extracted?.act ?? null, IELTS: r.extracted?.ielts ?? null, TOEFL: r.extracted?.toefl ?? null },
          target_schools: [...(r.extracted?.accepted ?? []), ...(r.extracted?.rejected ?? [])],
        } as Profile,
        accepted: r.extracted?.accepted ?? [],
        rejected: r.extracted?.rejected ?? [],
        waitlisted: r.extracted?.waitlisted ?? [],
      }));
      console.log(`Using REAL scraped outcomes: ${records.length} records from dataset_real.json`);
    }
  }
  let truth: Record<string, number> | null = null;
  if (!records) {
    const syn = makeSyntheticLabelled();
    records = syn.records;
    truth = syn.truth;
    console.log(`No real data yet — using ${records.length} synthetic labelled records with a known hidden admit law.`);
  }

  const model = buildEmpiricalModel(records, 8);
  const pts = [50, 60, 70, 80, 90, 100];
  console.log(`\nRecovered admit curves (P at index = ${pts.join(" / ")}):`);
  for (const m of Object.values(model.schools)) {
    const c = curveAt(model, m.school, pts) ?? [];
    const raw = m.b > 0.01 ? Math.round((-m.a / m.b) * 100) : null;
    const cross = raw != null && raw >= 30 && raw <= 100 ? `${raw}` : "(outside observed range)";
    console.log(`  ${m.school.padEnd(42)} n=${String(m.n).padStart(3)}  [${c.map((r) => r.toFixed(2)).join("  ")}]  fitted 50%-index ≈ ${cross}`);
  }

  if (truth) {
    console.log("\nSanity vs hidden truth (the fitted 50%-index should ≈ the true one):");
    for (const [school, thr] of Object.entries(truth)) console.log(`  ${school.padEnd(42)} true 50%-index = ${thr}`);
  }

  // Combined evaluation on a sample student.
  console.log("\n=== COMBINED — evaluate() on a sample student (SAT 1500, IB 42) ===");
  const student: Profile = {
    curriculum: "IB",
    grades: { ib_total: 42 },
    tests: { SAT: 1500, IELTS: 7.5 },
    faculties: ["computer_science"],
    intended_major: "Computer Science",
    activities: [
      { type: "Academic", position: "Founder", organization: "AI Club", description: "Built a computer vision project, led 20 members", grades: ["10", "11", "12"], hours_per_week: 8, weeks_per_year: 36 },
    ],
    honors: [{ title: "National Olympiad in Informatics", levels: ["national"] }],
    target_schools: Object.keys(truth ?? model.schools).slice(0, 3),
  };
  const ev = evaluate(student, model);
  console.log(`academicIndex=${ev.academicIndex} | deepScore=${ev.deepScore}/100 | spike=${ev.spike.detected ? ev.spike.area : "none"}`);
  for (const s of ev.schools) {
    console.log(`  ${s.school.padEnd(42)} chance=${(s.chance * 100).toFixed(0)}%  band=${s.band.padEnd(6)} via ${s.source} (conf ${s.confidence}, n=${s.sampleSize})`);
  }
}

function main() {
  console.log("============================================");
  console.log(" Compass — deep evaluation engine self-check");
  console.log("============================================");
  checkLayer1();
  checkLayer2();
  console.log("\nDone.");
}

main();
