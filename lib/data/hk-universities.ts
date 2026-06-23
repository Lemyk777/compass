// Hong Kong university dataset for the international (Non-JUPAS) admission pathway.
//
// IMPORTANT: HK admission is holistic and academically meritocratic, with
// interviews for the most competitive programmes. The figures below are
// INDICATIVE reference points compiled from public admission information
// (HKU/HKUST/CUHK international-admissions pages and brochures, IB/A-Level
// reference-score sheets, and entrance-scholarship pages, 2024–2026). They are
// directional, not guarantees — see lib/ai/hk-analyze.ts, which deliberately
// returns wide, honest ranges because interviews and holistic review add real
// variance.
//
// Academic index is expressed on the IB 45-point scale. Non-IB applicants are
// mapped onto it from SAT (the universal yardstick) or A-Level in hk-analyze.ts.

export type HkField =
  | "engineering"
  | "computer_science"
  | "business"
  | "science"
  | "medicine"
  | "law"
  | "humanities"
  | "design";

export type HkProgram = {
  id: string;
  university: string; // HKU / HKUST / CUHK / CityU / PolyU
  program_name: string;
  field: HkField;
  /** Minimum IB total to be in serious contention (the "lower boundary"). */
  min_ib: number;
  /** Typical/competitive admitted IB total (≈ midpoint of admitted band). */
  typical_ib: number;
  /** IB total at/above which a merit (entrance) scholarship becomes likely. */
  scholarship_ib_cutoff: number;
  /** Typical competitive A-Level grades (best 3), for context. */
  typical_alevel: string;
  /** Indicative SAT (1600 scale) aligned to the typical admitted index. */
  sat_reference: number;
  /** Minimum IELTS overall (TOEFL ≈ IELTS*15 handled in the engine). */
  english_ielts: number;
  /** Hard interview gate for the most competitive programmes. */
  interview_required: boolean;
  /** Indicative non-local annual tuition, HKD. */
  annual_fee_hkd: number;
  notes: string;
};

export const HK_PROGRAMS: HkProgram[] = [
  // ── The University of Hong Kong (HKU) ───────────────────────────────────────
  {
    id: "hku-mbbs",
    university: "HKU",
    program_name: "Medicine (MBBS)",
    field: "medicine",
    min_ib: 40,
    typical_ib: 43,
    scholarship_ib_cutoff: 44,
    typical_alevel: "A*A*A*",
    sat_reference: 1540,
    english_ielts: 7,
    interview_required: true,
    annual_fee_hkd: 171000,
    notes:
      "Among the most competitive programmes in Hong Kong. Requires Chemistry at a high level and a Multiple Mini-Interview (MMI). HKU awards a full-tuition scholarship to applicants achieving IB 44+.",
  },
  {
    id: "hku-llb",
    university: "HKU",
    program_name: "Law (LLB)",
    field: "law",
    min_ib: 39,
    typical_ib: 42,
    scholarship_ib_cutoff: 43,
    typical_alevel: "A*A*A",
    sat_reference: 1500,
    english_ielts: 7,
    interview_required: true,
    annual_fee_hkd: 171000,
    notes:
      "Very high English and reasoning bar; shortlisted applicants are interviewed. Strong writing and debate records help.",
  },
  {
    id: "hku-bba",
    university: "HKU",
    program_name: "Business Administration (BBA)",
    field: "business",
    min_ib: 38,
    typical_ib: 41,
    scholarship_ib_cutoff: 43,
    typical_alevel: "A*AA",
    sat_reference: 1470,
    english_ielts: 6.5,
    interview_required: false,
    annual_fee_hkd: 171000,
    notes:
      "Flagship business intake. The BBA(IBGM) / law-business double degrees are markedly more competitive and may interview.",
  },
  {
    id: "hku-eng",
    university: "HKU",
    program_name: "Engineering (BEng)",
    field: "engineering",
    min_ib: 33,
    typical_ib: 38,
    scholarship_ib_cutoff: 42,
    typical_alevel: "AAB",
    sat_reference: 1380,
    english_ielts: 6.5,
    interview_required: false,
    annual_fee_hkd: 171000,
    notes:
      "Broad first-year admission, specialise later. Maths at a high level expected. More accessible than Medicine/Law/Business.",
  },
  {
    id: "hku-sci",
    university: "HKU",
    program_name: "Science (BSc)",
    field: "science",
    min_ib: 32,
    typical_ib: 37,
    scholarship_ib_cutoff: 42,
    typical_alevel: "AAB",
    sat_reference: 1360,
    english_ielts: 6.5,
    interview_required: false,
    annual_fee_hkd: 171000,
    notes:
      "Lowest IB floor among HKU faculties (≈32); research-track variants (BSc&MRes) are far higher (≈42).",
  },

  // ── HKUST ───────────────────────────────────────────────────────────────────
  {
    id: "ust-global-business",
    university: "HKUST",
    program_name: "Global Business (BBA)",
    field: "business",
    min_ib: 40,
    typical_ib: 42,
    scholarship_ib_cutoff: 43,
    typical_alevel: "A*A*A*",
    sat_reference: 1510,
    english_ielts: 6.5,
    interview_required: true,
    annual_fee_hkd: 174000,
    notes:
      "HKUST's most selective programme; interview is compulsory (up to two rounds). Recent admits commonly hold 3A* at A-Level / IB 41+.",
  },
  {
    id: "ust-bba",
    university: "HKUST",
    program_name: "Business Management (BBA)",
    field: "business",
    min_ib: 37,
    typical_ib: 40,
    scholarship_ib_cutoff: 42,
    typical_alevel: "A*AA",
    sat_reference: 1440,
    english_ielts: 6.5,
    interview_required: false,
    annual_fee_hkd: 174000,
    notes:
      "School of Business & Management. 2025 IB admit band ≈ 35–40 incl. bonus points; auto-considered for scholarships from IB 36.",
  },
  {
    id: "ust-cs",
    university: "HKUST",
    program_name: "Computer Science (BEng)",
    field: "computer_science",
    min_ib: 36,
    typical_ib: 40,
    scholarship_ib_cutoff: 42,
    typical_alevel: "A*AA",
    sat_reference: 1440,
    english_ielts: 6.5,
    interview_required: false,
    annual_fee_hkd: 174000,
    notes:
      "Maths AA HL expected for Engineering. CS is the most in-demand engineering major; index runs above the school floor.",
  },
  {
    id: "ust-eng",
    university: "HKUST",
    program_name: "Engineering (BEng)",
    field: "engineering",
    min_ib: 34,
    typical_ib: 38,
    scholarship_ib_cutoff: 42,
    typical_alevel: "AAA",
    sat_reference: 1390,
    english_ielts: 6.5,
    interview_required: false,
    annual_fee_hkd: 174000,
    notes:
      "Broad School of Engineering admission. 2025 IB band ≈ 35–40 incl. bonus. Maths AA HL required.",
  },
  {
    id: "ust-sci",
    university: "HKUST",
    program_name: "Science (BSc)",
    field: "science",
    min_ib: 33,
    typical_ib: 37,
    scholarship_ib_cutoff: 42,
    typical_alevel: "AAB",
    sat_reference: 1360,
    english_ielts: 6.5,
    interview_required: false,
    annual_fee_hkd: 174000,
    notes: "Strong in the physical and data sciences; among the more accessible HKUST schools.",
  },

  // ── The Chinese University of Hong Kong (CUHK) ──────────────────────────────
  {
    id: "cuhk-mbchb",
    university: "CUHK",
    program_name: "Medicine (MBChB)",
    field: "medicine",
    min_ib: 41,
    typical_ib: 43,
    scholarship_ib_cutoff: 44,
    typical_alevel: "A*A*A*",
    sat_reference: 1530,
    english_ielts: 7,
    interview_required: true,
    annual_fee_hkd: 145000,
    notes:
      "Final IB ≥ 42/45 is the stated bar; interview performance is weighed. Among the hardest seats in Hong Kong.",
  },
  {
    id: "cuhk-business",
    university: "CUHK",
    program_name: "Integrated BBA / Global Business",
    field: "business",
    min_ib: 38,
    typical_ib: 41,
    scholarship_ib_cutoff: 43,
    typical_alevel: "A*AA",
    sat_reference: 1470,
    english_ielts: 6.5,
    interview_required: true,
    annual_fee_hkd: 145000,
    notes:
      "Global Business Studies is highly selective and interviews shortlisted applicants; the standard IBBA is a touch more accessible.",
  },
  {
    id: "cuhk-eng",
    university: "CUHK",
    program_name: "Engineering (BEng)",
    field: "engineering",
    min_ib: 33,
    typical_ib: 37,
    scholarship_ib_cutoff: 42,
    typical_alevel: "AAB",
    sat_reference: 1360,
    english_ielts: 6.5,
    interview_required: false,
    annual_fee_hkd: 145000,
    notes: "Broad engineering and AI/data tracks. Maths at a high level expected.",
  },
  {
    id: "cuhk-sci",
    university: "CUHK",
    program_name: "Science (BSc)",
    field: "science",
    min_ib: 32,
    typical_ib: 36,
    scholarship_ib_cutoff: 42,
    typical_alevel: "ABB",
    sat_reference: 1340,
    english_ielts: 6.5,
    interview_required: false,
    annual_fee_hkd: 145000,
    notes: "One of the more accessible entries into a top-3 HK university.",
  },

  // ── City University of Hong Kong (CityU) ────────────────────────────────────
  {
    id: "cityu-cs",
    university: "CityU",
    program_name: "Computer Science (BSc)",
    field: "computer_science",
    min_ib: 32,
    typical_ib: 36,
    scholarship_ib_cutoff: 40,
    typical_alevel: "ABB",
    sat_reference: 1330,
    english_ielts: 6.5,
    interview_required: false,
    annual_fee_hkd: 145000,
    notes: "Strong computing and data science; a realistic target tier below the top three.",
  },
  {
    id: "cityu-business",
    university: "CityU",
    program_name: "Business (BBA)",
    field: "business",
    min_ib: 31,
    typical_ib: 35,
    scholarship_ib_cutoff: 40,
    typical_alevel: "BBB",
    sat_reference: 1300,
    english_ielts: 6.5,
    interview_required: false,
    annual_fee_hkd: 145000,
    notes: "AACSB-accredited business school; accessible target with solid placement.",
  },

  // ── The Hong Kong Polytechnic University (PolyU) ────────────────────────────
  {
    id: "polyu-eng",
    university: "PolyU",
    program_name: "Engineering (BEng)",
    field: "engineering",
    min_ib: 31,
    typical_ib: 35,
    scholarship_ib_cutoff: 40,
    typical_alevel: "BBB",
    sat_reference: 1300,
    english_ielts: 6,
    interview_required: false,
    annual_fee_hkd: 145000,
    notes: "Applied, industry-linked engineering. One of the more accessible HK targets.",
  },
  {
    id: "polyu-design",
    university: "PolyU",
    program_name: "Design (BA)",
    field: "design",
    min_ib: 30,
    typical_ib: 34,
    scholarship_ib_cutoff: 40,
    typical_alevel: "BBB",
    sat_reference: 1280,
    english_ielts: 6,
    interview_required: true,
    annual_fee_hkd: 145000,
    notes: "School of Design — portfolio and interview are decisive, often more than raw grades.",
  },
];

export function findHkProgram(id: string): HkProgram | undefined {
  return HK_PROGRAMS.find((p) => p.id === id);
}

/** Display label for a program (used in intake + report). */
export function hkProgramLabel(p: HkProgram): string {
  return `${p.university} — ${p.program_name}`;
}
