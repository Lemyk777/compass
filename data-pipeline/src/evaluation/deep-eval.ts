/**
 * Deep evaluation engine for Compass (two layers).
 *
 *  Layer 1 — DEEP RUBRIC (deterministic, no data needed):
 *      Expands the 7 flat rubric factors into scored SUB-factors, detects an
 *      academic "spike", tiers extracurriculars / awards, and measures
 *      narrative coherence. Produces a richer 0–100 profile score than the
 *      single-shot rubric.
 *
 *  Layer 2 — EMPIRICAL "students like you" (data-driven):
 *      Learns, from REAL collected outcomes (profile + accepted/rejected per
 *      school — see reddit-real-scraper.ts), a per-school admit-rate curve as a
 *      function of an academic index. Then a student's per-school chance comes
 *      from how applicants with a similar index actually fared — not a guess.
 *
 *  evaluate() blends them: empirical when there's enough data for a school,
 *  otherwise the Layer-1 heuristic prior. Pure functions, no I/O.
 */

// ── Minimal profile shape (subset of the app's StudentProfileInput) ───────────
export interface Grades {
  raw?: string;
  ib_total?: number | null;
  gpa?: number | null;
  national_percent?: number | null;
}
export interface Tests {
  SAT?: number | null;
  ACT?: number | null;
  IELTS?: number | null;
  TOEFL?: number | null;
}
export interface Activity {
  type?: string;
  position?: string;
  organization?: string;
  description?: string;
  grades?: string[];
  timing?: string[];
  hours_per_week?: number;
  weeks_per_year?: number;
  continue_in_college?: boolean;
}
export interface Honor {
  title?: string;
  levels?: string[];
}
export interface Profile {
  faculties?: string[];
  intended_major?: string;
  curriculum?: string | null;
  grades?: Grades;
  tests?: Tests;
  activities?: Activity[];
  honors?: Honor[];
  target_schools?: string[];
}

const clamp = (n: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, n));
const round1 = (n: number) => Math.round(n * 10) / 10;

// ── Academic index (0–100): one comparable yardstick across curricula ─────────
export interface AcademicIndex {
  value: number; // 0–100
  gradesScore: number | null; // 0–100
  testScore: number | null; // 0–100
  rigorMultiplier: number;
}

export function academicIndex(p: Profile): AcademicIndex {
  const g = p.grades ?? {};
  const t = p.tests ?? {};

  let gradesScore: number | null = null;
  if (g.ib_total != null) gradesScore = clamp(((g.ib_total - 24) / (45 - 24)) * 100, 0, 100);
  else if (g.gpa != null) gradesScore = g.gpa <= 4 ? (g.gpa / 4) * 100 : clamp(g.gpa, 0, 100);
  else if (g.national_percent != null) gradesScore = clamp(g.national_percent, 0, 100);

  let testScore: number | null = null;
  if (t.SAT) testScore = clamp(((t.SAT - 400) / (1600 - 400)) * 100, 0, 100);
  else if (t.ACT) testScore = clamp(((t.ACT - 1) / (36 - 1)) * 100, 0, 100);

  // The most demanding curricula carry full weight; lighter ones are nudged down.
  const rigorMultiplier =
    p.curriculum === "IB" || p.curriculum === "A-Level"
      ? 1.0
      : p.curriculum === "US-GPA" || p.curriculum === "national"
        ? 0.97
        : 0.95;

  const comps: { v: number; w: number }[] = [];
  if (gradesScore != null) comps.push({ v: gradesScore, w: 0.6 });
  if (testScore != null) comps.push({ v: testScore, w: 0.4 });
  const base = comps.length
    ? comps.reduce((s, c) => s + c.v * c.w, 0) / comps.reduce((s, c) => s + c.w, 0)
    : 50;

  return {
    value: Math.round(clamp(base * rigorMultiplier, 0, 100)),
    gradesScore: gradesScore == null ? null : Math.round(gradesScore),
    testScore: testScore == null ? null : Math.round(testScore),
    rigorMultiplier,
  };
}

// ── Layer 1: deep rubric with sub-factors + spike detection ───────────────────
const RUBRIC_WEIGHTS: Record<string, number> = {
  academics: 0.25,
  test_scores: 0.15,
  course_rigor: 0.1,
  leadership: 0.15,
  extracurricular_depth: 0.15,
  awards: 0.1,
  narrative_fit: 0.1,
};

export interface FactorScore {
  key: string;
  score: number; // 0–10
  sub: Record<string, number>; // 0–10 sub-scores
  note: string;
}
export interface Spike {
  detected: boolean;
  strength: number; // 0–10
  area: string | null;
}
export interface DeepRubricResult {
  overall: number; // 0–100
  factors: FactorScore[];
  spike: Spike;
  academicIndex: AcademicIndex;
}

const LEADER_RE = /\b(found|founder|president|captain|chair|lead|director|head|editor[- ]in[- ]chief|ceo)\b/i;

function ecHoursPerYear(a: Activity): number {
  return (a.hours_per_week ?? 0) * (a.weeks_per_year ?? 0);
}

/** Detect a genuine "spike": a sustained, high-commitment, led activity that
 *  lines up with the intended field — the thing selective admissions reward. */
function detectSpike(p: Profile): Spike {
  const acts = p.activities ?? [];
  const field = (p.intended_major ?? "").toLowerCase();
  const facWords = (p.faculties ?? []).join(" ").toLowerCase().replace(/_/g, " ");
  let best: { strength: number; area: string } | null = null;

  for (const a of acts) {
    const hrs = ecHoursPerYear(a);
    const sustained = (a.grades?.length ?? 0) >= 3; // spans 3+ grade levels
    const led = LEADER_RE.test(a.position ?? "") || LEADER_RE.test(a.description ?? "");
    const blob = `${a.type} ${a.position} ${a.organization} ${a.description}`.toLowerCase();
    const onField =
      (field && blob.includes(field.split(" ")[0])) ||
      facWords.split(" ").some((w) => w.length > 3 && blob.includes(w));

    // Strength: commitment (hours) + sustained + leadership + field alignment.
    let s = 0;
    s += clamp(hrs / 200, 0, 4); // up to 4 pts for ~200+ hrs/yr
    if (sustained) s += 2;
    if (led) s += 2;
    if (onField) s += 2;
    s = clamp(s, 0, 10);
    if (s >= 6 && (!best || s > best.strength)) {
      best = { strength: s, area: a.position || a.organization || a.type || "activity" };
    }
  }
  return best
    ? { detected: true, strength: round1(best.strength), area: best.area }
    : { detected: false, strength: 0, area: null };
}

function tierAwards(honors: Honor[]): { score: number; topLevel: string } {
  const rank: Record<string, number> = {
    international: 10,
    national: 8,
    state: 6,
    regional: 6,
    school: 4,
    local: 4,
  };
  let top = 0;
  let topLevel = "none";
  let count = 0;
  for (const h of honors ?? []) {
    for (const lv of h.levels ?? []) {
      const r = rank[lv.toLowerCase()] ?? 3;
      if (r > top) {
        top = r;
        topLevel = lv;
      }
      count++;
    }
    if ((h.levels?.length ?? 0) === 0 && h.title) count++;
  }
  // Top award sets the ceiling; volume adds a little.
  const score = clamp(top + Math.min(2, Math.max(0, count - 1) * 0.5), 0, 10);
  return { score: round1(top === 0 && count === 0 ? 0 : score), topLevel };
}

export function deepRubric(p: Profile): DeepRubricResult {
  const idx = academicIndex(p);
  const acts = p.activities ?? [];
  const spike = detectSpike(p);

  // academics: grades index → 0–10
  const gradesSub = idx.gradesScore == null ? 5 : clamp(idx.gradesScore / 10, 0, 10);
  const rigorSub =
    p.curriculum === "IB" ? 9 : p.curriculum === "A-Level" ? 8 : p.curriculum === "US-GPA" ? 6 : p.curriculum === "national" ? 6 : 4;
  const academicsScore = round1(clamp(gradesSub * 0.7 + rigorSub * 0.3, 0, 10));

  // test_scores: standardized + English proficiency
  const stdSub = idx.testScore == null ? 4 : clamp(idx.testScore / 10, 0, 10);
  const t = p.tests ?? {};
  const englishSub =
    t.IELTS != null ? clamp(((t.IELTS - 5) / (9 - 5)) * 10, 0, 10) : t.TOEFL != null ? clamp(((t.TOEFL - 60) / (120 - 60)) * 10, 0, 10) : 5;
  const testScore = round1(clamp(stdSub * 0.75 + englishSub * 0.25, 0, 10));

  // course_rigor
  const rigorScore = round1(rigorSub);

  // extracurricular depth: breadth + commitment + spike
  const totalHrs = acts.reduce((s, a) => s + ecHoursPerYear(a), 0);
  const breadth = clamp(acts.filter((a) => (a.position ?? "").trim()).length / 2, 0, 5); // up to 5 for ~10 acts
  const commitment = clamp(totalHrs / 300, 0, 3);
  const ecScore = round1(clamp(breadth + commitment + spike.strength * 0.2, 0, 10));

  // leadership: best leadership role + its commitment
  let ledStrength = 0;
  for (const a of acts) {
    if (LEADER_RE.test(a.position ?? "") || LEADER_RE.test(a.description ?? "")) {
      ledStrength = Math.max(ledStrength, clamp(5 + ecHoursPerYear(a) / 100, 0, 10));
    }
  }
  const leadershipScore = round1(ledStrength);

  // awards
  const awardsT = tierAwards(p.honors ?? []);
  const awardsScore = awardsT.score;

  // narrative_fit: do activities/awards line up with the stated field?
  const field = `${p.intended_major ?? ""} ${(p.faculties ?? []).join(" ")}`.toLowerCase().replace(/_/g, " ");
  const fieldWords = Array.from(new Set(field.split(/\s+/).filter((w) => w.length > 3)));
  const blob = acts.map((a) => `${a.position} ${a.organization} ${a.description}`).join(" ").toLowerCase();
  const overlap = fieldWords.filter((w) => blob.includes(w)).length;
  const narrativeScore = round1(clamp(3 + overlap * 1.5 + (spike.detected ? 2 : 0), 0, 10));

  const factors: FactorScore[] = [
    { key: "academics", score: academicsScore, sub: { grades: round1(gradesSub), rigor: round1(rigorSub) }, note: `Academic index ${idx.value}/100.` },
    { key: "test_scores", score: testScore, sub: { standardized: round1(stdSub), english: round1(englishSub) }, note: t.SAT ? `SAT ${t.SAT}.` : t.ACT ? `ACT ${t.ACT}.` : "No standardized test." },
    { key: "course_rigor", score: rigorScore, sub: { curriculum: round1(rigorSub) }, note: `${p.curriculum ?? "unknown"} curriculum.` },
    { key: "leadership", score: leadershipScore, sub: { best_role: round1(ledStrength) }, note: ledStrength > 0 ? "Holds a leadership role." : "No clear leadership role." },
    { key: "extracurricular_depth", score: ecScore, sub: { breadth: round1(breadth), commitment: round1(commitment), spike: spike.strength }, note: spike.detected ? `Spike in "${spike.area}".` : "No standout spike." },
    { key: "awards", score: awardsScore, sub: { top_tier: awardsT.score }, note: `Top award level: ${awardsT.topLevel}.` },
    { key: "narrative_fit", score: narrativeScore, sub: { field_overlap: overlap }, note: `${overlap} activities align with the intended field.` },
  ];

  const overall = Math.round(
    factors.reduce((s, f) => s + f.score * (RUBRIC_WEIGHTS[f.key] ?? 0), 0) * 10
  );

  return { overall, factors, spike, academicIndex: idx };
}

// ── Layer 2: empirical per-school admit-rate model ────────────────────────────
export interface LabeledRecord {
  profile: Profile;
  accepted: string[];
  rejected: string[];
  waitlisted?: string[];
}

function normSchool(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9 ]/g, "").replace(/\s+/g, " ").trim();
}

const sigmoid = (x: number) => 1 / (1 + Math.exp(-clamp(x, -30, 30)));

export interface SchoolModel {
  school: string;
  n: number; // applications observed
  admits: number;
  a: number; // logistic intercept
  b: number; // logistic slope on index/100
}
export interface EmpiricalModel {
  schools: Record<string, SchoolModel>;
  minSamples: number;
}

/** Per-school logistic fit P(admit) = sigmoid(a + b·index/100) by gradient
 *  descent on (fractional) cross-entropy with light L2. Logistic — not binning —
 *  is used because real scraped data is sparse per school; 2 params generalise
 *  far better than 5 buckets, and stay smooth + monotonic (slope kept ≥ 0:
 *  a stronger applicant should never have a lower modelled chance). */
function fitLogistic(points: { x: number; y: number }[]): { a: number; b: number } {
  let a = 0;
  let b = 1; // start with a mild positive slope prior
  const lr = 0.5;
  const l2 = 0.02;
  for (let it = 0; it < 800; it++) {
    let ga = 0;
    let gb = 0;
    for (const { x, y } of points) {
      const p = sigmoid(a + b * x);
      ga += p - y;
      gb += (p - y) * x;
    }
    const n = points.length;
    a -= lr * (ga / n);
    b -= lr * (gb / n + l2 * b);
  }
  return { a, b: Math.max(0, b) };
}

/** Build per-school admit models from labeled outcomes. Waitlist = half-admit. */
export function buildEmpiricalModel(records: LabeledRecord[], minSamples = 8): EmpiricalModel {
  const perSchool: Record<string, { x: number; y: number }[]> = {};
  for (const r of records) {
    const x = academicIndex(r.profile).value / 100;
    const add = (list: string[] | undefined, y: number) => {
      for (const raw of list ?? []) {
        const s = normSchool(raw);
        if (s) (perSchool[s] ??= []).push({ x, y });
      }
    };
    add(r.accepted, 1);
    add(r.rejected, 0);
    add(r.waitlisted, 0.5);
  }

  const schools: Record<string, SchoolModel> = {};
  for (const [school, pts] of Object.entries(perSchool)) {
    const { a, b } = fitLogistic(pts);
    const admits = pts.reduce((s, p) => s + (p.y === 1 ? 1 : 0), 0);
    schools[school] = { school, n: pts.length, admits, a, b };
  }
  return { schools, minSamples };
}

/** Empirical admit probability for a school at a given index (0–100), or null
 *  when too few applications were observed to trust it. */
export function empiricalChance(model: EmpiricalModel, school: string, index: number): { prob: number; n: number } | null {
  const m = model.schools[normSchool(school)];
  if (!m || m.n < model.minSamples) return null;
  return { prob: round1(sigmoid(m.a + m.b * (index / 100)) * 100) / 100, n: m.n };
}

/** Sample the fitted admit curve at given index points (for display/export). */
export function curveAt(model: EmpiricalModel, school: string, points: number[]): number[] | null {
  const m = model.schools[normSchool(school)];
  if (!m) return null;
  return points.map((idx) => round1(sigmoid(m.a + m.b * (idx / 100)) * 100) / 100);
}

// ── Combined evaluation: Layer 1 + Layer 2 ────────────────────────────────────
export interface SchoolChance {
  school: string;
  chance: number; // 0–1
  band: "reach" | "target" | "likely";
  source: "empirical" | "heuristic";
  confidence: "low" | "medium" | "high";
  sampleSize: number;
}
export interface Evaluation {
  academicIndex: number;
  deepScore: number; // Layer-1 overall 0–100
  spike: Spike;
  factors: FactorScore[];
  schools: SchoolChance[];
}

function bandOf(p: number): "reach" | "target" | "likely" {
  return p < 0.2 ? "reach" : p < 0.55 ? "target" : "likely";
}

// Heuristic fallback when there's no data for a school: a generic logistic of
// the academic index (strong profile → higher baseline chance). Intentionally
// conservative; in production this would also fold in the school's own
// selectivity (SAT mid-50%) from the app's universities dataset.
function heuristicChance(index: number): number {
  return round1(1 / (1 + Math.exp(-(index - 78) / 7)) * 100) / 100;
}

export function evaluate(profile: Profile, model?: EmpiricalModel): Evaluation {
  const rubric = deepRubric(profile);
  const idx = rubric.academicIndex.value;

  const schools: SchoolChance[] = (profile.target_schools ?? []).map((school) => {
    const emp = model ? empiricalChance(model, school, idx) : null;
    if (emp) {
      return {
        school,
        chance: emp.prob,
        band: bandOf(emp.prob),
        source: "empirical",
        confidence: emp.n >= 12 ? "high" : emp.n >= 5 ? "medium" : "low",
        sampleSize: emp.n,
      };
    }
    const h = heuristicChance(idx);
    return { school, chance: h, band: bandOf(h), source: "heuristic", confidence: "low", sampleSize: 0 };
  });

  return {
    academicIndex: idx,
    deepScore: rubric.overall,
    spike: rubric.spike,
    factors: rubric.factors,
    schools,
  };
}
