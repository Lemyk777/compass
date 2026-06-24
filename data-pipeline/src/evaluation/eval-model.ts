/**
 * EVAL — does the model actually predict real admissions, and which variant is
 * most accurate?  (no API key)
 *
 *   npm run eval:model            (from data-pipeline/)
 *
 * Builds (academic index → admit/reject) records from dataset_clean.json, does a
 * seeded train/test split, fits several models on TRAIN and scores them on the
 * held-out TEST with Brier score + AUC. This is the honest answer to "why this
 * number": a number is defensible only if it beats the base rate on data the
 * model never saw, and we can report its error.
 *
 * Models compared (worst → best expected):
 *   M0 global base rate      — ignore the student entirely
 *   M1 per-school base rate   — school selectivity, but ignore the student
 *   M2 per-school logistic    — independent fit per school (current generator)
 *   M3 partial-pooling logist — per-school shrunk toward a global curve (sparse-data robust)
 */
import * as fs from "fs";
import * as path from "path";
import { academicIndex, fitLogistic, type Profile } from "./deep-eval";

const ROOT = path.join(__dirname, "..", "..");
const CLEAN = path.join(ROOT, "dataset_clean.json");
const MIN_TRAIN = 8; // min train samples for a school to get its own logistic

type Rec = { school: string; index: number; y: number }; // y = 1 admit / 0 reject
const sigmoid = (x: number) => 1 / (1 + Math.exp(-Math.max(-30, Math.min(30, x))));

function loadRecords(): Rec[] {
  if (!fs.existsSync(CLEAN)) {
    console.error(`Missing ${CLEAN}. Run clean:real first.`);
    process.exit(1);
  }
  const data = JSON.parse(fs.readFileSync(CLEAN, "utf8"));
  const recs: Rec[] = [];
  for (const r of data) {
    const profile: Profile = {
      grades: { ib_total: r.ib_total ?? null, gpa: r.gpa ?? null },
      tests: { SAT: r.sat ?? null, ACT: r.act ?? null },
      curriculum: r.curriculum ?? null,
    };
    const ai = academicIndex(profile);
    if (ai.gradesScore == null && ai.testScore == null) continue; // no academic signal
    for (const res of r.results ?? []) {
      if (!res.school_id) continue;
      const y = res.decision === "accepted" ? 1 : res.decision === "rejected" ? 0 : null;
      if (y == null) continue; // drop waitlist/deferred for a clean binary eval
      recs.push({ school: res.school_id, index: ai.value / 100, y });
    }
  }
  return recs;
}

// Seeded shuffle for a reproducible split.
function split(recs: Rec[], testFrac = 0.25) {
  let seed = 12345;
  const rand = () => ((seed = (seed * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff);
  const shuffled = [...recs].sort(() => rand() - 0.5);
  const nTest = Math.floor(shuffled.length * testFrac);
  return { test: shuffled.slice(0, nTest), train: shuffled.slice(nTest) };
}

function bySchool(recs: Rec[]): Map<string, Rec[]> {
  const m = new Map<string, Rec[]>();
  for (const r of recs) (m.get(r.school) ?? m.set(r.school, []).get(r.school)!).push(r);
  return m;
}

// ── Models: each returns predict(school, index) → p ───────────────────────────
function buildGlobalRate(train: Rec[]) {
  const p = train.reduce((s, r) => s + r.y, 0) / train.length;
  return () => p;
}
function buildSchoolRate(train: Rec[]) {
  const g = train.reduce((s, r) => s + r.y, 0) / train.length;
  const rate = new Map<string, number>();
  for (const [s, rs] of bySchool(train)) rate.set(s, rs.reduce((a, r) => a + r.y, 0) / rs.length);
  return (school: string) => rate.get(school) ?? g;
}
function buildPerSchoolLogistic(train: Rec[]) {
  const g = train.reduce((s, r) => s + r.y, 0) / train.length;
  const models = new Map<string, { a: number; b: number }>();
  for (const [s, rs] of bySchool(train)) if (rs.length >= MIN_TRAIN) models.set(s, fitLogistic(rs.map((r) => ({ x: r.index, y: r.y }))));
  return (school: string, index: number) => {
    const m = models.get(school);
    return m ? sigmoid(m.a + m.b * index) : g;
  };
}
function buildPartialPooling(train: Rec[], K = 12) {
  const g = train.reduce((s, r) => s + r.y, 0) / train.length;
  const global = fitLogistic(train.map((r) => ({ x: r.index, y: r.y }))); // shared curve
  const models = new Map<string, { a: number; b: number }>();
  for (const [s, rs] of bySchool(train)) {
    const n = rs.length;
    const own = n >= 3 ? fitLogistic(rs.map((r) => ({ x: r.index, y: r.y }))) : global;
    const w = n / (n + K); // shrink toward the global curve when data is thin
    models.set(s, { a: w * own.a + (1 - w) * global.a, b: w * own.b + (1 - w) * global.b });
  }
  return (school: string, index: number) => {
    const m = models.get(school) ?? global;
    return sigmoid(m.a + m.b * index);
  };
}

// ── Metrics ───────────────────────────────────────────────────────────────────
function brier(preds: number[], ys: number[]) {
  return preds.reduce((s, p, i) => s + (p - ys[i]) ** 2, 0) / preds.length;
}
function auc(scores: number[], labels: number[]) {
  const idx = scores.map((_, i) => i).sort((a, b) => scores[a] - scores[b]);
  const ranks = new Array(scores.length);
  let i = 0;
  while (i < idx.length) {
    let j = i;
    while (j + 1 < idx.length && scores[idx[j + 1]] === scores[idx[i]]) j++;
    const avg = (i + j) / 2 + 1;
    for (let k = i; k <= j; k++) ranks[idx[k]] = avg;
    i = j + 1;
  }
  let sumPos = 0, nPos = 0, nNeg = 0;
  for (let k = 0; k < labels.length; k++) (labels[k] === 1 ? ((sumPos += ranks[k]), nPos++) : nNeg++);
  return nPos && nNeg ? (sumPos - (nPos * (nPos + 1)) / 2) / (nPos * nNeg) : NaN;
}

function score(name: string, predict: (s: string, i: number) => number, test: Rec[]) {
  const preds = test.map((r) => predict(r.school, r.index));
  const ys = test.map((r) => r.y);
  return { name, brier: brier(preds, ys), auc: auc(preds, ys) };
}

function main() {
  const recs = loadRecords();
  console.log(`Records (academic signal + binary outcome): ${recs.length}`);
  const schools = bySchool(recs);
  console.log(`Distinct schools: ${schools.size} | overall admit rate: ${(recs.reduce((s, r) => s + r.y, 0) / recs.length * 100).toFixed(1)}%`);
  if (recs.length < 100) {
    console.log("\n⚠ Too few records yet (clean:real still running?). Re-run when cleaning finishes.");
  }

  const { train, test } = split(recs);
  console.log(`Train: ${train.length} | Test (held-out): ${test.length}\n`);

  const results = [
    score("M0 global base rate ", buildGlobalRate(train), test),
    score("M1 per-school base   ", buildSchoolRate(train), test),
    score("M2 per-school logistic", buildPerSchoolLogistic(train), test),
    score("M3 partial pooling   ", buildPartialPooling(train), test),
  ];

  console.log("Held-out accuracy (Brier ↓ better, AUC ↑ better):");
  console.log("  model                    Brier     AUC");
  for (const r of results) console.log(`  ${r.name}   ${r.brier.toFixed(4)}   ${isNaN(r.auc) ? "n/a" : r.auc.toFixed(4)}`);
  const best = results.slice().sort((a, b) => a.brier - b.brier)[0];
  console.log(`\nBest by Brier: ${best.name.trim()}.  AUC > 0.5 means the academic index genuinely ranks admits above rejects.`);
}

main();
