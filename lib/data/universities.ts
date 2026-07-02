// Curated US university dataset (§8). ~50 schools across the selectivity
// spectrum. Acceptance rates are decimals (0–1); SAT p25/p75 are total scores.
//
// FOUNDER: verify/update these numbers against each school's latest Common Data
// Set before relying on them publicly. Figures here are approximate, drawn from
// recently reported public data, and are meant as a reasonable v1 seed.

import type { FacultyValue } from "@/lib/data/faculties";

export type University = {
  id: string;
  name: string;
  acceptance_rate: number; // 0–1
  sat_p25: number;
  sat_p75: number;
  notes_international: string;
};

export const UNIVERSITIES: University[] = [
  { id: "harvard", name: "Harvard University", acceptance_rate: 0.032, sat_p25: 1500, sat_p75: 1580, notes_international: "Need-blind for all applicants incl. international; generous aid." },
  { id: "stanford", name: "Stanford University", acceptance_rate: 0.036, sat_p25: 1500, sat_p75: 1580, notes_international: "Need-blind for internationals; strong aid." },
  { id: "mit", name: "Massachusetts Institute of Technology", acceptance_rate: 0.04, sat_p25: 1520, sat_p75: 1580, notes_international: "Need-blind for all; meets full need." },
  { id: "princeton", name: "Princeton University", acceptance_rate: 0.04, sat_p25: 1500, sat_p75: 1580, notes_international: "Need-blind incl. international; no-loan aid." },
  { id: "yale", name: "Yale University", acceptance_rate: 0.046, sat_p25: 1500, sat_p75: 1580, notes_international: "Need-blind for internationals; meets full need." },
  { id: "columbia", name: "Columbia University", acceptance_rate: 0.039, sat_p25: 1490, sat_p75: 1570, notes_international: "Need-blind for internationals; meets full need." },
  { id: "upenn", name: "University of Pennsylvania", acceptance_rate: 0.06, sat_p25: 1490, sat_p75: 1570, notes_international: "Need-aware for internationals; strong aid if admitted." },
  { id: "brown", name: "Brown University", acceptance_rate: 0.05, sat_p25: 1500, sat_p75: 1570, notes_international: "Need-blind for internationals (recent policy); meets full need." },
  { id: "dartmouth", name: "Dartmouth College", acceptance_rate: 0.06, sat_p25: 1490, sat_p75: 1570, notes_international: "Need-blind for all applicants (recent policy)." },
  { id: "cornell", name: "Cornell University", acceptance_rate: 0.075, sat_p25: 1470, sat_p75: 1560, notes_international: "Need-aware for internationals; limited aid." },
  { id: "caltech", name: "California Institute of Technology", acceptance_rate: 0.03, sat_p25: 1530, sat_p75: 1590, notes_international: "Very STEM-focused; need-blind, meets full need." },
  { id: "uchicago", name: "University of Chicago", acceptance_rate: 0.054, sat_p25: 1500, sat_p75: 1570, notes_international: "Test-optional; strong aid incl. for internationals." },
  { id: "duke", name: "Duke University", acceptance_rate: 0.06, sat_p25: 1490, sat_p75: 1570, notes_international: "Need-aware for internationals; meets full need if admitted." },
  { id: "northwestern", name: "Northwestern University", acceptance_rate: 0.07, sat_p25: 1490, sat_p75: 1560, notes_international: "Need-aware for internationals." },
  { id: "jhu", name: "Johns Hopkins University", acceptance_rate: 0.07, sat_p25: 1510, sat_p75: 1570, notes_international: "Need-aware for internationals; strong in STEM/med." },
  { id: "vanderbilt", name: "Vanderbilt University", acceptance_rate: 0.07, sat_p25: 1480, sat_p75: 1560, notes_international: "Need-based + merit aid available to internationals." },
  { id: "rice", name: "Rice University", acceptance_rate: 0.08, sat_p25: 1490, sat_p75: 1570, notes_international: "Meets full need; international aid available." },
  { id: "washu", name: "Washington University in St. Louis", acceptance_rate: 0.12, sat_p25: 1470, sat_p75: 1560, notes_international: "Limited need-based aid for internationals; some merit." },
  { id: "notre-dame", name: "University of Notre Dame", acceptance_rate: 0.12, sat_p25: 1440, sat_p75: 1550, notes_international: "Need-aware for internationals." },
  { id: "georgetown", name: "Georgetown University", acceptance_rate: 0.12, sat_p25: 1410, sat_p75: 1550, notes_international: "Need-aware for internationals; strong in IR/business." },
  { id: "cmu", name: "Carnegie Mellon University", acceptance_rate: 0.11, sat_p25: 1500, sat_p75: 1560, notes_international: "Limited aid; very strong CS/engineering." },
  { id: "emory", name: "Emory University", acceptance_rate: 0.13, sat_p25: 1450, sat_p75: 1540, notes_international: "Some need-based aid for internationals." },
  { id: "usc", name: "University of Southern California", acceptance_rate: 0.1, sat_p25: 1450, sat_p75: 1540, notes_international: "Merit scholarships available to internationals." },
  { id: "uva", name: "University of Virginia", acceptance_rate: 0.19, sat_p25: 1410, sat_p75: 1530, notes_international: "Need-aware for internationals; some aid." },
  { id: "umich", name: "University of Michigan, Ann Arbor", acceptance_rate: 0.18, sat_p25: 1350, sat_p75: 1530, notes_international: "Top public flagship; international admit rate runs below the overall rate and aid for internationals is very limited." },
  { id: "unc", name: "University of North Carolina, Chapel Hill", acceptance_rate: 0.19, sat_p25: 1390, sat_p75: 1520, notes_international: "Few international spots; competitive aid." },
  { id: "nyu", name: "New York University", acceptance_rate: 0.09, sat_p25: 1450, sat_p75: 1570, notes_international: "Large international population; aid is limited/competitive." },
  { id: "tufts", name: "Tufts University", acceptance_rate: 0.1, sat_p25: 1450, sat_p75: 1550, notes_international: "Need-aware for internationals; meets full need if admitted." },
  { id: "bc", name: "Boston College", acceptance_rate: 0.16, sat_p25: 1420, sat_p75: 1520, notes_international: "Limited aid for internationals." },
  { id: "bu", name: "Boston University", acceptance_rate: 0.11, sat_p25: 1380, sat_p75: 1530, notes_international: "Some merit aid; large international community." },
  { id: "northeastern", name: "Northeastern University", acceptance_rate: 0.06, sat_p25: 1450, sat_p75: 1540, notes_international: "Co-op program; merit aid for internationals." },
  { id: "rochester", name: "University of Rochester", acceptance_rate: 0.36, sat_p25: 1370, sat_p75: 1520, notes_international: "Generous merit aid for internationals; strong in research." },
  { id: "case-western", name: "Case Western Reserve University", acceptance_rate: 0.27, sat_p25: 1400, sat_p75: 1520, notes_international: "Good merit aid; strong STEM." },
  { id: "wake-forest", name: "Wake Forest University", acceptance_rate: 0.21, sat_p25: 1340, sat_p75: 1490, notes_international: "Test-optional; some merit aid." },
  { id: "lehigh", name: "Lehigh University", acceptance_rate: 0.29, sat_p25: 1330, sat_p75: 1480, notes_international: "Engineering/business strength; some aid." },
  { id: "brandeis", name: "Brandeis University", acceptance_rate: 0.39, sat_p25: 1350, sat_p75: 1510, notes_international: "Need-based and merit aid for internationals." },
  { id: "tulane", name: "Tulane University", acceptance_rate: 0.13, sat_p25: 1390, sat_p75: 1500, notes_international: "Merit scholarships; apply early." },
  { id: "miami", name: "University of Miami", acceptance_rate: 0.19, sat_p25: 1320, sat_p75: 1470, notes_international: "Merit scholarships available." },
  { id: "fordham", name: "Fordham University", acceptance_rate: 0.54, sat_p25: 1280, sat_p75: 1450, notes_international: "Merit aid; NYC location." },
  { id: "purdue", name: "Purdue University", acceptance_rate: 0.5, sat_p25: 1190, sat_p75: 1440, notes_international: "Excellent engineering; affordable; some merit." },

  // ── Expanded pool: public flagships & large publics ───────────────────────
  { id: "pitt", name: "University of Pittsburgh", acceptance_rate: 0.49, sat_p25: 1250, sat_p75: 1440, notes_international: "Strong in health sciences; some merit aid." },
  { id: "syracuse", name: "Syracuse University", acceptance_rate: 0.52, sat_p25: 1180, sat_p75: 1380, notes_international: "Strong comms/architecture; merit aid available." },

  // ── Expanded pool: tech-focused & mid-selective privates ──────────────────
  { id: "rpi", name: "Rensselaer Polytechnic Institute", acceptance_rate: 0.65, sat_p25: 1320, sat_p75: 1500, notes_international: "Strong engineering; merit aid for internationals." },
  { id: "rit", name: "Rochester Institute of Technology", acceptance_rate: 0.71, sat_p25: 1230, sat_p75: 1430, notes_international: "Co-op focus; merit aid available." },
  { id: "drexel", name: "Drexel University", acceptance_rate: 0.78, sat_p25: 1170, sat_p75: 1380, notes_international: "Co-op program; merit aid for internationals." },
  { id: "stevens", name: "Stevens Institute of Technology", acceptance_rate: 0.51, sat_p25: 1320, sat_p75: 1490, notes_international: "Strong engineering near NYC; merit aid." },
  { id: "wpi", name: "Worcester Polytechnic Institute", acceptance_rate: 0.58, sat_p25: 1300, sat_p75: 1470, notes_international: "Project-based engineering; merit aid." },
  { id: "villanova", name: "Villanova University", acceptance_rate: 0.25, sat_p25: 1340, sat_p75: 1500, notes_international: "Strong business/engineering; some aid." },
  { id: "santa-clara", name: "Santa Clara University", acceptance_rate: 0.45, sat_p25: 1290, sat_p75: 1450, notes_international: "Silicon Valley location; merit aid." },
  { id: "smu", name: "Southern Methodist University", acceptance_rate: 0.52, sat_p25: 1290, sat_p75: 1450, notes_international: "Merit scholarships available to internationals." },

  // ── Expanded pool: selective liberal arts colleges ────────────────────────
  { id: "williams", name: "Williams College", acceptance_rate: 0.085, sat_p25: 1410, sat_p75: 1550, notes_international: "Top LAC; need-blind for internationals, meets full need." },
  { id: "amherst", name: "Amherst College", acceptance_rate: 0.07, sat_p25: 1410, sat_p75: 1550, notes_international: "Need-blind for internationals; meets full need." },
  { id: "swarthmore", name: "Swarthmore College", acceptance_rate: 0.07, sat_p25: 1400, sat_p75: 1540, notes_international: "Need-aware for internationals; meets full need if admitted." },
  { id: "pomona", name: "Pomona College", acceptance_rate: 0.07, sat_p25: 1410, sat_p75: 1540, notes_international: "Need-blind for internationals; meets full need." },
  { id: "bowdoin", name: "Bowdoin College", acceptance_rate: 0.09, sat_p25: 1380, sat_p75: 1520, notes_international: "Need-aware for internationals; strong aid." },
  { id: "middlebury", name: "Middlebury College", acceptance_rate: 0.13, sat_p25: 1360, sat_p75: 1520, notes_international: "Need-aware for internationals; strong languages." },
  { id: "wellesley", name: "Wellesley College", acceptance_rate: 0.13, sat_p25: 1390, sat_p75: 1530, notes_international: "Women's college; need-blind for internationals." },
  { id: "carleton", name: "Carleton College", acceptance_rate: 0.17, sat_p25: 1380, sat_p75: 1530, notes_international: "Strong sciences; meets full need." },
  { id: "harvey-mudd", name: "Harvey Mudd College", acceptance_rate: 0.1, sat_p25: 1490, sat_p75: 1570, notes_international: "Elite STEM LAC; need-aware for internationals." },
  { id: "cmc", name: "Claremont McKenna College", acceptance_rate: 0.1, sat_p25: 1400, sat_p75: 1530, notes_international: "Econ/government focus; some aid for internationals." },
  { id: "colgate", name: "Colgate University", acceptance_rate: 0.12, sat_p25: 1370, sat_p75: 1520, notes_international: "Need-aware for internationals; strong aid if admitted." },
  { id: "hamilton", name: "Hamilton College", acceptance_rate: 0.12, sat_p25: 1400, sat_p75: 1530, notes_international: "Strong writing; need-aware for internationals." },
  { id: "davidson", name: "Davidson College", acceptance_rate: 0.17, sat_p25: 1340, sat_p75: 1490, notes_international: "Meets full need; honor code." },
  { id: "vassar", name: "Vassar College", acceptance_rate: 0.19, sat_p25: 1370, sat_p75: 1520, notes_international: "Need-blind for internationals (recent); meets full need." },
  { id: "grinnell", name: "Grinnell College", acceptance_rate: 0.11, sat_p25: 1400, sat_p75: 1530, notes_international: "Generous aid for internationals; strong sciences." },
  { id: "barnard", name: "Barnard College", acceptance_rate: 0.09, sat_p25: 1390, sat_p75: 1530, notes_international: "Women's college partnered with Columbia; need-aware for internationals." },

  // ── US-system branch campuses abroad (hybrid schools) ─────────────────────
  // Physically overseas, but admissions run on the US system — Common App (or
  // the parent's US application) with holistic review. Kept in this dataset so
  // the whole US pipeline (AI odds, benchmarks, recommender) scores them like
  // any US school; lib/data/branch-campuses.ts carries the hybrid metadata the
  // UI uses to explain the split.
  //
  // Figures checked against official admissions pages / class profiles on
  // 2026-07-02 (NYUAD Class of 2026 infographic; DKU Class of 2029 admit news;
  // GU-Q/NU-Q/CMU-Q/TUJ admissions pages). NYU Shanghai publishes no rate or
  // SAT band — its figures are proxied from NYU's other degree-granting
  // campuses and marked as estimates. Re-verify annually.
  { id: "nyu-shanghai", name: "NYU Shanghai", acceptance_rate: 0.07, sat_p25: 1450, sat_p75: 1560, notes_international: "Branch campus in Shanghai, China — full NYU degree; US-style holistic review via the Common App. Publishes no admit rate or SAT band; selectivity is comparable to NYU's other campuses (figures here are estimates). Generous scholarships for internationals." },
  { id: "nyu-abu-dhabi", name: "NYU Abu Dhabi", acceptance_rate: 0.04, sat_p25: 1450, sat_p75: 1560, notes_international: "Branch campus in Abu Dhabi, UAE — need-blind, meets full need incl. travel; US-style holistic review via the Common App; Candidate Weekend for finalists. Admit rate ~4-5%, among the lowest anywhere." },
  { id: "duke-kunshan", name: "Duke Kunshan University", acceptance_rate: 0.05, sat_p25: 1510, sat_p75: 1540, notes_international: "Branch campus in Kunshan, China — Duke degree conferred; US-style holistic review via the Common App, test-optional. International admit rate ~3% (Class of 2029: 165 of 5,882); need-based and merit aid for internationals." },
  { id: "georgetown-qatar", name: "Georgetown University in Qatar", acceptance_rate: 0.15, sat_p25: 1400, sat_p75: 1550, notes_international: "Branch campus in Doha, Qatar — Georgetown SFS degree in international affairs; US-style holistic review via the Georgetown application, test-flexible (admitted average SAT ~1480, GPA ~3.9). ~94% of aid applicants receive Qatar Foundation support." },
  { id: "northwestern-qatar", name: "Northwestern University in Qatar", acceptance_rate: 0.17, sat_p25: 1050, sat_p75: 1250, notes_international: "Branch campus in Doha, Qatar — journalism, media and communication; US-style holistic review via the Common App, test-optional (~1 in 6 admitted); Qatar Foundation aid available." },
  { id: "cmu-qatar", name: "Carnegie Mellon University in Qatar", acceptance_rate: 0.24, sat_p25: 1400, sat_p75: 1550, notes_international: "Branch campus in Doha, Qatar — CS, AI, information systems, business, biology; CMU degree conferred from Pittsburgh; US-style review via the Common App; Qatar Foundation aid available." },
  { id: "temple-japan", name: "Temple University, Japan Campus", acceptance_rate: 0.8, sat_p25: 1150, sat_p75: 1370, notes_international: "Branch campus in Tokyo, Japan — US Temple degree; test-optional with year-round rolling admissions via TUJ's own application (decisions in ~4 weeks); accessible admit rate, some merit aid." },
];

export const UNIVERSITY_NAMES = UNIVERSITIES.map((u) => u.name);

export function findUniversity(nameOrId: string): University | undefined {
  const q = nameOrId.trim().toLowerCase();
  return UNIVERSITIES.find(
    (u) => u.id === q || u.name.toLowerCase() === q
  );
}

// Standout field strengths (0–10) per faculty, keyed by university id. Used by
// the deterministic recommender (lib/data/recommend.ts) to match schools to the
// student's chosen faculties. SPARSE on purpose: list only the fields where a
// school is notably strong; any unlisted field falls back to a selectivity
// baseline in recommend.ts, so every school still gets a reasonable score.
//
// FOUNDER: these are reputation-based v1 seeds (like the figures above). Refine
// per program as you gather real outcome data.
export const FIELD_STRENGTHS: Record<string, Partial<Record<FacultyValue, number>>> = {
  harvard: { business_economics: 10, law: 10, medicine_health: 10, humanities_social: 10, natural_sciences: 9 },
  stanford: { computer_science: 10, engineering: 10, business_economics: 9, natural_sciences: 9 },
  mit: { computer_science: 10, engineering: 10, natural_sciences: 10, business_economics: 8 },
  princeton: { natural_sciences: 9, humanities_social: 9, business_economics: 9, engineering: 8 },
  yale: { law: 10, humanities_social: 10, arts_design: 9, medicine_health: 9, business_economics: 8 },
  columbia: { business_economics: 9, law: 9, humanities_social: 9, medicine_health: 9, engineering: 8 },
  upenn: { business_economics: 10, medicine_health: 9, law: 9, computer_science: 8, engineering: 8 },
  brown: { humanities_social: 9, computer_science: 8, medicine_health: 8 },
  dartmouth: { business_economics: 8, humanities_social: 8, engineering: 7 },
  cornell: { engineering: 9, computer_science: 9, natural_sciences: 9, business_economics: 8 },
  caltech: { natural_sciences: 10, engineering: 10, computer_science: 9 },
  uchicago: { business_economics: 10, humanities_social: 10, law: 9, natural_sciences: 8 },
  duke: { medicine_health: 9, law: 9, business_economics: 8, engineering: 8, humanities_social: 8 },
  northwestern: { business_economics: 9, arts_design: 9, engineering: 8, humanities_social: 8, medicine_health: 8 },
  jhu: { medicine_health: 10, natural_sciences: 9, engineering: 8 },
  vanderbilt: { medicine_health: 9, arts_design: 8, humanities_social: 8 },
  rice: { engineering: 9, natural_sciences: 9, arts_design: 8 },
  washu: { medicine_health: 9, arts_design: 9, business_economics: 8, natural_sciences: 8 },
  "notre-dame": { business_economics: 9, humanities_social: 8, law: 8 },
  georgetown: { business_economics: 9, law: 9, humanities_social: 9 },
  cmu: { computer_science: 10, engineering: 9, arts_design: 9, business_economics: 8 },
  emory: { medicine_health: 9, business_economics: 8 },
  usc: { arts_design: 10, business_economics: 8, engineering: 8, computer_science: 8 },
  uva: { law: 9, business_economics: 8, humanities_social: 8 },
  umich: { engineering: 10, computer_science: 9, business_economics: 9, medicine_health: 8, natural_sciences: 8, humanities_social: 8 },
  unc: { medicine_health: 8, business_economics: 8, humanities_social: 8 },
  nyu: { arts_design: 10, business_economics: 9, law: 9, humanities_social: 8 },
  tufts: { humanities_social: 9, medicine_health: 8 },
  bc: { business_economics: 8, humanities_social: 8, law: 8 },
  bu: { business_economics: 8, medicine_health: 8, arts_design: 7 },
  northeastern: { engineering: 8, computer_science: 8, business_economics: 8 },
  rochester: { arts_design: 9, natural_sciences: 8, medicine_health: 8 },
  "case-western": { engineering: 9, medicine_health: 9, computer_science: 8, natural_sciences: 8 },
  "wake-forest": { business_economics: 8, medicine_health: 7 },
  lehigh: { engineering: 9, business_economics: 8 },
  brandeis: { natural_sciences: 8, humanities_social: 8 },
  tulane: { medicine_health: 8, business_economics: 7 },
  miami: { arts_design: 8, medicine_health: 8, natural_sciences: 7 },
  fordham: { business_economics: 8, law: 8 },
  purdue: { engineering: 10, computer_science: 9, natural_sciences: 8 },
  pitt: { medicine_health: 9, natural_sciences: 8 },
  syracuse: { arts_design: 9, business_economics: 7, humanities_social: 7 },
  rpi: { engineering: 9, computer_science: 9, natural_sciences: 8 },
  rit: { engineering: 8, computer_science: 8, arts_design: 8 },
  drexel: { engineering: 8, computer_science: 7, business_economics: 7 },
  stevens: { engineering: 9, computer_science: 8 },
  wpi: { engineering: 9, computer_science: 8 },
  villanova: { business_economics: 9, engineering: 8 },
  "santa-clara": { business_economics: 8, engineering: 8, computer_science: 8 },
  smu: { business_economics: 8, arts_design: 7 },
  williams: { humanities_social: 10, business_economics: 8, natural_sciences: 8 },
  amherst: { humanities_social: 10, natural_sciences: 8, business_economics: 8 },
  swarthmore: { humanities_social: 10, natural_sciences: 9, engineering: 8 },
  pomona: { humanities_social: 9, natural_sciences: 8, business_economics: 8 },
  bowdoin: { humanities_social: 9, natural_sciences: 8 },
  middlebury: { humanities_social: 10, arts_design: 7 },
  wellesley: { humanities_social: 9, natural_sciences: 8, business_economics: 8 },
  carleton: { natural_sciences: 9, humanities_social: 9, computer_science: 8 },
  "harvey-mudd": { engineering: 10, computer_science: 10, natural_sciences: 9 },
  cmc: { business_economics: 10, humanities_social: 9 },
  colgate: { humanities_social: 8, business_economics: 7 },
  hamilton: { humanities_social: 9, arts_design: 7 },
  davidson: { humanities_social: 8, natural_sciences: 8, medicine_health: 7 },
  vassar: { humanities_social: 9, arts_design: 9 },
  grinnell: { natural_sciences: 9, humanities_social: 9, computer_science: 8 },
  barnard: { humanities_social: 9, arts_design: 8 },
  // US-system branch campuses abroad — strengths mirror each campus's actual
  // program focus, not the parent's full catalogue (NU-Q is a media school,
  // CMU-Q teaches CS/IS/business, GU-Q is SFS international affairs only).
  "nyu-shanghai": { business_economics: 9, computer_science: 8, natural_sciences: 8, humanities_social: 8 },
  "nyu-abu-dhabi": { humanities_social: 9, engineering: 8, computer_science: 8, natural_sciences: 8, business_economics: 8 },
  "duke-kunshan": { natural_sciences: 8, business_economics: 8, computer_science: 8, humanities_social: 8 },
  "georgetown-qatar": { humanities_social: 9, business_economics: 8 },
  "northwestern-qatar": { arts_design: 8, humanities_social: 8 },
  "cmu-qatar": { computer_science: 9, business_economics: 8, natural_sciences: 7 },
  "temple-japan": { business_economics: 7, humanities_social: 7, arts_design: 7 },
};
