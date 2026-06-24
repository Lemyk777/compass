/**
 * Build the per-school empirical admit model that the PRODUCTION app ships.
 *
 *   npm run build:model            (from data-pipeline/)
 *
 * Reads the collected admissions outcomes and fits, per canonical Compass
 * university id, a 2-parameter logistic curve  P(admit) = sigmoid(a + b·index/100)
 * (same primitive as the Layer-2 engine in deep-eval.ts). The result is written
 * as a small static JSON into the app at lib/data/admit-model.json, so the
 * dashboard's per-school likelihoods come from REAL outcomes — computed in code,
 * costing zero model tokens at request time.
 *
 * Source preference:
 *   1. dataset_clean.json  — LLM-verified, school_ids already canonical (best).
 *   2. dataset_real.json   — raw regex extraction; school names are matched to
 *                            canonical ids here and noisy strings are dropped.
 *
 * The same artifact regenerates from the clean dataset once `npm run clean:real`
 * has been run — no app code changes needed.
 */
import * as fs from "fs";
import * as path from "path";
import { academicIndex, fitLogistic, type Profile } from "./deep-eval";
import { matchSchool } from "../parser/clean-real";

const ROOT = path.join(__dirname, "..", "..");
const APP_ROOT = path.join(ROOT, "..");
const CLEAN_FILE = path.join(ROOT, "dataset_clean.json");
const REAL_FILE = path.join(ROOT, "dataset_real.json");
const OUT_FILE = path.join(APP_ROOT, "lib", "data", "admit-model.json");

const MIN_SAMPLES = 8; // schools with fewer observed applications are dropped

type Point = { x: number; y: number }; // x = index/100, y = 1 admit / 0 reject / 0.5 WL

/**
 * Academic index as a fraction (0–1), or null when the record carries NO
 * academic signal (no test score and no grades). Such records can't be placed
 * on the index, so including them would flatten every school's curve toward the
 * raw base rate — we skip them instead so the slope reflects real applicants.
 */
function indexOf(grades: Profile["grades"], tests: Profile["tests"], curriculum: string | null): number | null {
  const ai = academicIndex({ grades, tests, curriculum: curriculum ?? null });
  if (ai.gradesScore == null && ai.testScore == null) return null;
  return ai.value / 100;
}

/** Parse a possibly-dirty GPA string/number into a sane 0–5 (4.0-scale) value. */
function parseGpa(raw: unknown): number | null {
  const n = typeof raw === "number" ? raw : parseFloat(String(raw ?? "").replace(/[^0-9.]/g, ""));
  return Number.isFinite(n) && n > 0 && n <= 5 ? n : null;
}

/** Push one (index, outcome) point onto the right canonical school's bucket. */
function add(buckets: Record<string, Point[]>, schoolId: string | null, x: number, y: number) {
  if (schoolId) (buckets[schoolId] ??= []).push({ x, y });
}

function fromClean(records: any[], buckets: Record<string, Point[]>): number {
  let used = 0;
  for (const r of records) {
    const idx = indexOf(
      { ib_total: r.ib_total ?? null, gpa: parseGpa(r.gpa) },
      { SAT: r.sat ?? null, ACT: r.act ?? null },
      r.curriculum ?? null
    );
    if (idx == null) continue;
    for (const res of r.results ?? []) {
      const id: string | null = res.school_id ?? matchSchool(res.school_raw ?? "");
      const y = res.decision === "accepted" ? 1 : res.decision === "waitlisted" ? 0.5 : res.decision === "rejected" ? 0 : null;
      if (y == null) continue; // skip "deferred"
      add(buckets, id, idx, y);
      used++;
    }
  }
  return used;
}

function fromReal(records: any[], buckets: Record<string, Point[]>): number {
  let used = 0;
  for (const r of records) {
    const e = r.extracted ?? {};
    const idx = indexOf(
      { ib_total: e.ib_score ?? null, gpa: parseGpa(e.gpa_raw) },
      { SAT: e.sat ?? null, ACT: e.act ?? null },
      e.curriculum ?? null
    );
    if (idx == null) continue;
    const push = (list: unknown, y: number) => {
      for (const raw of (list as string[]) ?? []) {
        const id = matchSchool(String(raw));
        if (id) {
          add(buckets, id, idx, y);
          used++;
        }
      }
    };
    push(e.accepted, 1);
    push(e.rejected, 0);
    push(e.waitlisted, 0.5);
  }
  return used;
}

function main() {
  let records: any[];
  let source: string;
  if (fs.existsSync(CLEAN_FILE)) {
    records = JSON.parse(fs.readFileSync(CLEAN_FILE, "utf8"));
    source = "dataset_clean.json";
  } else if (fs.existsSync(REAL_FILE)) {
    records = JSON.parse(fs.readFileSync(REAL_FILE, "utf8"));
    source = "dataset_real.json";
  } else {
    console.error("No dataset found. Run npm run scrape:reddit:real (and optionally clean:real) first.");
    process.exit(1);
  }

  const buckets: Record<string, Point[]> = {};
  const usedDecisions = source === "dataset_clean.json" ? fromClean(records, buckets) : fromReal(records, buckets);

  // Partial pooling (eval variant M3): fit a shared global curve over ALL points,
  // then shrink each school's own fit toward it by w = n/(n+K). This beat the
  // independent per-school fit on held-out Brier and is far more robust for the
  // many schools with thin samples (an independent 2-param fit overfits there).
  const POOL_K = 12;
  const allPoints = Object.values(buckets).flat();
  const global = fitLogistic(allPoints);

  const schools: Record<string, { a: number; b: number; n: number; admits: number }> = {};
  let kept = 0;
  for (const [id, pts] of Object.entries(buckets)) {
    if (pts.length < MIN_SAMPLES) continue;
    const own = fitLogistic(pts);
    const w = pts.length / (pts.length + POOL_K);
    const a = w * own.a + (1 - w) * global.a;
    const b = Math.max(0, w * own.b + (1 - w) * global.b);
    const admits = pts.reduce((s, p) => s + (p.y === 1 ? 1 : 0), 0);
    schools[id] = { a: round4(a), b: round4(b), n: pts.length, admits };
    kept++;
  }

  const artifact = {
    _comment: "Per-school empirical admit model. Generated by data-pipeline/src/evaluation/build-admit-model.ts — do not edit by hand. P(admit)=sigmoid(a + b·academicIndex/100).",
    _generatedAt: new Date().toISOString(),
    _source: source,
    _minSamples: MIN_SAMPLES,
    _records: records.length,
    _decisions: usedDecisions,
    schools,
  };

  fs.mkdirSync(path.dirname(OUT_FILE), { recursive: true });
  fs.writeFileSync(OUT_FILE, JSON.stringify(artifact, null, 2) + "\n");

  console.log(`Source: ${source} (${records.length} records, ${usedDecisions} matched decisions)`);
  console.log(`Fitted ${kept} schools with ≥${MIN_SAMPLES} observed applications.`);
  const top = Object.entries(schools).sort((a, b) => b[1].n - a[1].n).slice(0, 15);
  console.log("\nTop schools by sample size:");
  for (const [id, m] of top) {
    const fmt = (idx: number) => (1 / (1 + Math.exp(-(m.a + m.b * (idx / 100)))) * 100).toFixed(0);
    console.log(`  ${id.padEnd(16)} n=${String(m.n).padStart(3)} admits=${String(m.admits).padStart(3)}  P@70=${fmt(70)}%  P@85=${fmt(85)}%  P@95=${fmt(95)}%`);
  }
  console.log(`\n💾 ${OUT_FILE}`);
}

const round4 = (n: number) => Math.round(n * 1e4) / 1e4;

main();
