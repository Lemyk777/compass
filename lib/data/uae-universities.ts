// United Arab Emirates university dataset for the international admission pathway.
//
// IMPORTANT: UAE undergraduate admission is grades-first and SAT-driven for
// international applicants — most universities admit on high-school GPA + SAT +
// an English certificate (IELTS/TOEFL), with interviews reserved for the most
// selective seats (NYU Abu Dhabi's Candidate Weekend, direct-entry Medicine
// MMIs). The figures below are INDICATIVE reference points compiled from public
// admission information (NYUAD/Khalifa/AUS/UAEU/Zayed/MBRU international-
// admissions and merit-scholarship pages, 2024–2026). They are directional, not
// guarantees — see lib/ai/uae-analyze.ts, which deliberately returns honest,
// reasonably wide bands.
//
// The academic index here is the SAT (1600 scale) — the universal yardstick Gulf
// international applicants sit. Non-SAT applicants are mapped onto it from GPA in
// uae-analyze.ts.

export type UaeField =
  | "engineering"
  | "computer_science"
  | "business"
  | "science"
  | "medicine"
  | "humanities"
  | "design";

export type UaeEmirate = "Abu Dhabi" | "Dubai" | "Sharjah";

export type UaeProgram = {
  id: string;
  university: string;
  emirate: UaeEmirate;
  program_name: string;
  field: UaeField;
  /** Minimum SAT to be in serious contention (the "lower boundary"). */
  min_sat: number;
  /** Typical/competitive admitted SAT (≈ midpoint of the admitted band). */
  typical_sat: number;
  /** SAT at/above which a merit (entrance) scholarship becomes likely. */
  scholarship_sat_cutoff: number;
  /** Minimum IELTS overall (TOEFL handled in the engine). */
  english_ielts: number;
  /** Hard interview gate (NYUAD Candidate Weekend, direct-entry Medicine MMI). */
  interview_required: boolean;
  /** True only for need-blind, full-need-met admission (NYU Abu Dhabi). */
  need_blind: boolean;
  /** Indicative international annual tuition, USD (before any scholarship). */
  annual_fee_usd: number;
  /** One line on the merit-aid picture — a major UAE selling point. */
  merit_scholarship_note: string;
  notes: string;
};

export const UAE_PROGRAMS: UaeProgram[] = [
  // ── NYU Abu Dhabi ───────────────────────────────────────────────────────────
  // Need-blind and meets 100% of demonstrated need; among the most selective
  // universities in the world (single-digit admit rate). Holistic review with a
  // Candidate Weekend for shortlisted applicants.
  {
    id: "nyuad-eng",
    university: "NYU Abu Dhabi",
    emirate: "Abu Dhabi",
    program_name: "Engineering (BS)",
    field: "engineering",
    min_sat: 1400,
    typical_sat: 1500,
    scholarship_sat_cutoff: 1400,
    english_ielts: 7,
    interview_required: true,
    need_blind: true,
    annual_fee_usd: 53000,
    merit_scholarship_note:
      "Need-blind admission — NYUAD meets 100% of demonstrated financial need, and admitted students are automatically considered for merit awards that can cover full tuition, housing and travel.",
    notes:
      "Single-digit admit rate; holistic, US-style review. Shortlisted applicants are invited to a Candidate Weekend. Strong Maths/Physics and a genuine intellectual spike matter as much as raw scores.",
  },
  {
    id: "nyuad-cs",
    university: "NYU Abu Dhabi",
    emirate: "Abu Dhabi",
    program_name: "Computer Science (BS)",
    field: "computer_science",
    min_sat: 1410,
    typical_sat: 1510,
    scholarship_sat_cutoff: 1400,
    english_ielts: 7,
    interview_required: true,
    need_blind: true,
    annual_fee_usd: 53000,
    merit_scholarship_note:
      "Need-blind; meets full demonstrated need. Admitted students are considered for full-ride merit scholarships.",
    notes:
      "Among the most in-demand majors. Candidate Weekend for shortlisted applicants; evidence of building/creating (projects, competitions) helps.",
  },
  {
    id: "nyuad-business",
    university: "NYU Abu Dhabi",
    emirate: "Abu Dhabi",
    program_name: "Business, Organizations & Society (BA)",
    field: "business",
    min_sat: 1390,
    typical_sat: 1490,
    scholarship_sat_cutoff: 1390,
    english_ielts: 7,
    interview_required: true,
    need_blind: true,
    annual_fee_usd: 53000,
    merit_scholarship_note:
      "Need-blind; meets full demonstrated need, with merit awards up to full cost of attendance.",
    notes:
      "Interdisciplinary business/economics track. Holistic review; leadership and initiative weigh heavily alongside grades.",
  },
  {
    id: "nyuad-science",
    university: "NYU Abu Dhabi",
    emirate: "Abu Dhabi",
    program_name: "Science (BS — Biology/Chemistry/Physics)",
    field: "science",
    min_sat: 1380,
    typical_sat: 1480,
    scholarship_sat_cutoff: 1380,
    english_ielts: 7,
    interview_required: true,
    need_blind: true,
    annual_fee_usd: 53000,
    merit_scholarship_note:
      "Need-blind; full demonstrated need met, plus consideration for merit scholarships.",
    notes:
      "Research-intensive from year one. A genuine science spike (olympiads, lab/research experience) strengthens the holistic read.",
  },
  {
    id: "nyuad-humanities",
    university: "NYU Abu Dhabi",
    emirate: "Abu Dhabi",
    program_name: "Arts & Humanities / Social Science (BA)",
    field: "humanities",
    min_sat: 1370,
    typical_sat: 1470,
    scholarship_sat_cutoff: 1370,
    english_ielts: 7,
    interview_required: true,
    need_blind: true,
    annual_fee_usd: 53000,
    merit_scholarship_note:
      "Need-blind; meets full demonstrated need, with merit awards up to full cost of attendance.",
    notes:
      "Writing and voice carry real weight here. Holistic review; a strong personal narrative can offset a slightly lower score.",
  },

  // ── Khalifa University (Abu Dhabi) ──────────────────────────────────────────
  // STEM-focused; exceptionally generous merit aid — strong admits are routinely
  // offered full tuition plus a monthly stipend.
  {
    id: "khalifa-eng",
    university: "Khalifa University",
    emirate: "Abu Dhabi",
    program_name: "Engineering (BSc)",
    field: "engineering",
    min_sat: 1250,
    typical_sat: 1380,
    scholarship_sat_cutoff: 1350,
    english_ielts: 6.5,
    interview_required: false,
    need_blind: false,
    annual_fee_usd: 22000,
    merit_scholarship_note:
      "Very generous merit aid: high-achieving admits are commonly awarded full tuition plus a monthly stipend and accommodation.",
    notes:
      "The UAE's leading research university for engineering. Strong Maths/Physics expected. Merit scholarships make it one of the best-value elite STEM seats in the region.",
  },
  {
    id: "khalifa-cs",
    university: "Khalifa University",
    emirate: "Abu Dhabi",
    program_name: "Computer Science / AI (BSc)",
    field: "computer_science",
    min_sat: 1270,
    typical_sat: 1400,
    scholarship_sat_cutoff: 1360,
    english_ielts: 6.5,
    interview_required: false,
    need_blind: false,
    annual_fee_usd: 22000,
    merit_scholarship_note:
      "Strong merit aid — top admits receive full tuition plus a stipend. Home to a dedicated AI institute.",
    notes:
      "Runs above the engineering floor; one of the most competitive majors. Maths at a high level expected.",
  },
  {
    id: "khalifa-science",
    university: "Khalifa University",
    emirate: "Abu Dhabi",
    program_name: "Science (BSc)",
    field: "science",
    min_sat: 1230,
    typical_sat: 1360,
    scholarship_sat_cutoff: 1340,
    english_ielts: 6.5,
    interview_required: false,
    need_blind: false,
    annual_fee_usd: 22000,
    merit_scholarship_note:
      "Merit scholarships (up to full tuition + stipend) for strong admits.",
    notes:
      "Physical and applied sciences with heavy research exposure. Among the more accessible entries into a top UAE research university.",
  },

  // ── American University of Sharjah (AUS) ────────────────────────────────────
  // US-accredited; tiered merit scholarships keyed directly to SAT + GPA.
  {
    id: "aus-eng",
    university: "American University of Sharjah",
    emirate: "Sharjah",
    program_name: "Engineering (BS)",
    field: "engineering",
    min_sat: 1150,
    typical_sat: 1300,
    scholarship_sat_cutoff: 1300,
    english_ielts: 6.5,
    interview_required: false,
    need_blind: false,
    annual_fee_usd: 20000,
    merit_scholarship_note:
      "Tiered merit scholarships (10–50%+ of tuition) awarded automatically on SAT + high-school GPA; higher scores unlock larger awards.",
    notes:
      "US-accredited (ABET) engineering. A realistic, well-regarded target with a clear merit-aid ladder tied to your scores.",
  },
  {
    id: "aus-cs",
    university: "American University of Sharjah",
    emirate: "Sharjah",
    program_name: "Computer Science / Engineering (BS)",
    field: "computer_science",
    min_sat: 1160,
    typical_sat: 1310,
    scholarship_sat_cutoff: 1310,
    english_ielts: 6.5,
    interview_required: false,
    need_blind: false,
    annual_fee_usd: 20000,
    merit_scholarship_note:
      "Automatic merit scholarships on SAT + GPA; strong scores can reach half-tuition or more.",
    notes: "In-demand major; runs slightly above the engineering floor.",
  },
  {
    id: "aus-business",
    university: "American University of Sharjah",
    emirate: "Sharjah",
    program_name: "Business Administration (BSBA)",
    field: "business",
    min_sat: 1120,
    typical_sat: 1260,
    scholarship_sat_cutoff: 1280,
    english_ielts: 6.5,
    interview_required: false,
    need_blind: false,
    annual_fee_usd: 19000,
    merit_scholarship_note:
      "AACSB-accredited school; automatic tiered merit aid on SAT + GPA.",
    notes:
      "Well-placed regional business school. Accessible target with a transparent scholarship ladder.",
  },
  {
    id: "aus-design",
    university: "American University of Sharjah",
    emirate: "Sharjah",
    program_name: "Architecture / Design (BArch/BA)",
    field: "design",
    min_sat: 1130,
    typical_sat: 1270,
    scholarship_sat_cutoff: 1290,
    english_ielts: 6.5,
    interview_required: false,
    need_blind: false,
    annual_fee_usd: 20000,
    merit_scholarship_note:
      "Merit scholarships on SAT + GPA; a strong portfolio is decisive for admission.",
    notes:
      "Regionally leading architecture/design school. A portfolio weighs heavily — often more than raw scores.",
  },
  {
    id: "aus-humanities",
    university: "American University of Sharjah",
    emirate: "Sharjah",
    program_name: "Arts & Sciences / Humanities (BA)",
    field: "humanities",
    min_sat: 1080,
    typical_sat: 1220,
    scholarship_sat_cutoff: 1260,
    english_ielts: 6.5,
    interview_required: false,
    need_blind: false,
    annual_fee_usd: 18000,
    merit_scholarship_note:
      "Automatic tiered merit aid on SAT + GPA.",
    notes: "The most accessible AUS entry; strong English still expected.",
  },

  // ── United Arab Emirates University (UAEU — Al Ain) ──────────────────────────
  // The federal flagship; broad programme range and a competitive direct-entry
  // Medicine (MBBS) track.
  {
    id: "uaeu-eng",
    university: "UAE University",
    emirate: "Abu Dhabi",
    program_name: "Engineering (BSc)",
    field: "engineering",
    min_sat: 1100,
    typical_sat: 1240,
    scholarship_sat_cutoff: 1280,
    english_ielts: 6,
    interview_required: false,
    need_blind: false,
    annual_fee_usd: 16000,
    merit_scholarship_note:
      "Merit scholarships for high achievers; among the more affordable federal-university options.",
    notes:
      "The UAE's federal flagship. Broad engineering entry with applied, research-linked tracks.",
  },
  {
    id: "uaeu-business",
    university: "UAE University",
    emirate: "Abu Dhabi",
    program_name: "Business & Economics (BSc)",
    field: "business",
    min_sat: 1050,
    typical_sat: 1200,
    scholarship_sat_cutoff: 1250,
    english_ielts: 6,
    interview_required: false,
    need_blind: false,
    annual_fee_usd: 15000,
    merit_scholarship_note: "Merit scholarships for strong academic records.",
    notes: "AACSB-accredited college of business and economics; an accessible, affordable target.",
  },
  {
    id: "uaeu-it",
    university: "UAE University",
    emirate: "Abu Dhabi",
    program_name: "Information Technology / CS (BSc)",
    field: "computer_science",
    min_sat: 1080,
    typical_sat: 1220,
    scholarship_sat_cutoff: 1260,
    english_ielts: 6,
    interview_required: false,
    need_blind: false,
    annual_fee_usd: 15000,
    merit_scholarship_note: "Merit scholarships for high achievers.",
    notes: "Computing and information systems with strong regional industry links.",
  },
  {
    id: "uaeu-science",
    university: "UAE University",
    emirate: "Abu Dhabi",
    program_name: "Science (BSc)",
    field: "science",
    min_sat: 1050,
    typical_sat: 1200,
    scholarship_sat_cutoff: 1250,
    english_ielts: 6,
    interview_required: false,
    need_blind: false,
    annual_fee_usd: 15000,
    merit_scholarship_note: "Merit scholarships for strong records.",
    notes: "One of the more accessible entries into the federal flagship.",
  },
  {
    id: "uaeu-medicine",
    university: "UAE University",
    emirate: "Abu Dhabi",
    program_name: "Medicine (MBBS, 6-year direct entry)",
    field: "medicine",
    min_sat: 1300,
    typical_sat: 1420,
    scholarship_sat_cutoff: 1450,
    english_ielts: 6.5,
    interview_required: true,
    need_blind: false,
    annual_fee_usd: 16000,
    merit_scholarship_note:
      "Highly competitive, subsidised seats; merit support for top admits. Places are limited and prioritised heavily by academic record.",
    notes:
      "Direct-entry MBBS from high school. Very competitive; high Chemistry/Biology marks and an interview are decisive. Seats are limited for international applicants.",
  },

  // ── Zayed University (Abu Dhabi & Dubai) ────────────────────────────────────
  // Federal university with a business / IT / media / education focus; the most
  // accessible flagship entry.
  {
    id: "zayed-business",
    university: "Zayed University",
    emirate: "Abu Dhabi",
    program_name: "Business (BSc)",
    field: "business",
    min_sat: 1000,
    typical_sat: 1150,
    scholarship_sat_cutoff: 1220,
    english_ielts: 6,
    interview_required: false,
    need_blind: false,
    annual_fee_usd: 14000,
    merit_scholarship_note: "Merit awards for strong academic records.",
    notes: "AACSB-accredited college of business; an accessible federal-university target.",
  },
  {
    id: "zayed-it",
    university: "Zayed University",
    emirate: "Abu Dhabi",
    program_name: "Technological Innovation / IT (BSc)",
    field: "computer_science",
    min_sat: 1010,
    typical_sat: 1160,
    scholarship_sat_cutoff: 1220,
    english_ielts: 6,
    interview_required: false,
    need_blind: false,
    annual_fee_usd: 14000,
    merit_scholarship_note: "Merit awards for high achievers.",
    notes: "Applied computing and technological-innovation tracks with industry links.",
  },
  {
    id: "zayed-comm",
    university: "Zayed University",
    emirate: "Dubai",
    program_name: "Communication & Media Sciences (BA)",
    field: "humanities",
    min_sat: 1000,
    typical_sat: 1140,
    scholarship_sat_cutoff: 1210,
    english_ielts: 6,
    interview_required: false,
    need_blind: false,
    annual_fee_usd: 14000,
    merit_scholarship_note: "Merit awards for strong records.",
    notes: "Well-known regional media/communication school; portfolio and voice help.",
  },
  {
    id: "zayed-humanities",
    university: "Zayed University",
    emirate: "Dubai",
    program_name: "Humanities & Social Sciences / Education (BA)",
    field: "humanities",
    min_sat: 980,
    typical_sat: 1120,
    scholarship_sat_cutoff: 1200,
    english_ielts: 6,
    interview_required: false,
    need_blind: false,
    annual_fee_usd: 13000,
    merit_scholarship_note: "Merit awards for high achievers.",
    notes: "The most accessible flagship entry; strong English still expected.",
  },

  // ── Mohammed Bin Rashid University (MBRU — Dubai) ────────────────────────────
  // Dubai's dedicated health-sciences university; direct-entry MBBS and Dentistry
  // with an admission test and MMI interview.
  {
    id: "mbru-mbbs",
    university: "Mohammed Bin Rashid University",
    emirate: "Dubai",
    program_name: "Medicine (MBBS, 6-year direct entry)",
    field: "medicine",
    min_sat: 1300,
    typical_sat: 1430,
    scholarship_sat_cutoff: 1460,
    english_ielts: 6.5,
    interview_required: true,
    need_blind: false,
    annual_fee_usd: 30000,
    merit_scholarship_note:
      "Selective, prestige-track scholarships for top admits; seats are limited and heavily merit-based.",
    notes:
      "Dubai's flagship medical university. Direct-entry MBBS from high school with an admission test and a Multiple Mini-Interview (MMI). High Chemistry/Biology marks are essential.",
  },
  {
    id: "mbru-dentistry",
    university: "Mohammed Bin Rashid University",
    emirate: "Dubai",
    program_name: "Dentistry (BDS, 5-year direct entry)",
    field: "medicine",
    min_sat: 1280,
    typical_sat: 1400,
    scholarship_sat_cutoff: 1440,
    english_ielts: 6.5,
    interview_required: true,
    need_blind: false,
    annual_fee_usd: 30000,
    merit_scholarship_note:
      "Limited merit scholarships for top admits; admission is highly competitive.",
    notes:
      "Direct-entry Dentistry with an admission test and MMI. High Chemistry/Biology marks and manual-dexterity aptitude help.",
  },
];

export function findUaeProgram(id: string): UaeProgram | undefined {
  return UAE_PROGRAMS.find((p) => p.id === id);
}

/** Display label for a program (used in intake + report). */
export function uaeProgramLabel(p: UaeProgram): string {
  return `${p.university} — ${p.program_name}`;
}
