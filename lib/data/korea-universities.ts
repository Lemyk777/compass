// South Korea university dataset for the international admission pathway.
//
// IMPORTANT: Korean undergraduate admission for international students (the
// "pure foreigner" track — student and both parents non-Korean) is DOCUMENT-
// BASED and GPA-first: universities screen the full school record, a personal
// statement / study plan, and recommendations. There is no entrance exam for
// this track and the SAT is optional almost everywhere (recommended at KAIST
// and Yonsei UIC as supporting evidence).
//
// The decisive gate is LANGUAGE:
//   - Korean-taught programs require TOPIK (typically level 3+ to apply,
//     level 4+ by graduation; SNU Business requires TOPIK 6 outright),
//   - English-taught programs (KAIST, Yonsei UIC, KU International Studies,
//     SKKU Global tracks) require IELTS/TOEFL instead.
//
// The GPA bands below are INDICATIVE reference points compiled from public
// admission information and admitted-student reporting (official international-
// admission guides of SNU, KAIST, Yonsei/UIC, Korea Univ, SKKU, Hanyang and
// Kyung Hee, 2024–2026 cycles; URLs in lib/data/official-sources.ts, checked
// 2026-07-02). Korean universities do NOT publish admitted-GPA statistics for
// this track, so the bands are directional, not guarantees — the engine
// (lib/ai/korea-analyze.ts) deliberately returns honest, wide reads.
//
// The academic index is the school GPA as a percent of the maximum (0–100),
// because the transcript is what Korean document screening actually reads.
// IB / SAT applicants are mapped onto it transparently in korea-analyze.ts.

export type KoreaField =
  | "engineering"
  | "computer_science"
  | "business"
  | "science"
  | "humanities"
  | "social_science";

export type KoreaProgram = {
  id: string;
  university: string;
  city: string;
  program_name: string;
  field: KoreaField;
  /** Teaching language — decides which language credential gates admission. */
  language_track: "EN" | "KR";
  /**
   * Minimum TOPIK level accepted at application (null when only the English
   * route exists). When both topik_required and english_ielts are set, EITHER
   * credential satisfies the language requirement (SNU-style).
   */
  topik_required: number | null;
  /** Minimum IELTS overall for the English route (null when only TOPIK works). */
  english_ielts: number | null;
  /** Indicative lower boundary of admitted GPA (percent of max, 0–100). */
  min_gpa_percent: number;
  /** Indicative typical admitted GPA (percent of max, 0–100). */
  typical_gpa_percent: number;
  /** Hard interview/screening gate beyond documents. */
  interview_required: boolean;
  /** KAIST-style: every admitted international student gets a full scholarship. */
  auto_full_scholarship: boolean;
  /** GPA percent at/above which a merit (admission) scholarship becomes likely. */
  scholarship_gpa_cutoff: number;
  /** Indicative international annual tuition, USD (before any scholarship). */
  annual_fee_usd: number;
  /** One line on the merit-aid picture. */
  merit_scholarship_note: string;
  notes: string;
};

export const KOREA_PROGRAMS: KoreaProgram[] = [
  // ── Seoul National University (SNU) ─────────────────────────────────────────
  // The national flagship. International admission is document screening plus
  // an interview/additional review for many colleges. TOPIK 3+ OR English
  // proficiency (TOEFL 80 / IELTS 6.0) to apply — but classes are overwhelmingly
  // Korean-taught, and Business requires TOPIK 6 with no English substitute.
  {
    id: "snu-humanities",
    university: "Seoul National University",
    city: "Seoul",
    program_name: "Humanities / Social Sciences (BA)",
    field: "humanities",
    language_track: "KR",
    topik_required: 3,
    english_ielts: 6.0,
    min_gpa_percent: 88,
    typical_gpa_percent: 95,
    interview_required: true,
    auto_full_scholarship: false,
    scholarship_gpa_cutoff: 95,
    annual_fee_usd: 4900,
    merit_scholarship_note:
      "Selected admits receive the SNU Global Talent Scholarship (tuition + partial living costs), announced with the admission decision.",
    notes:
      "Korea's top-ranked university; the most competitive document screen in the country. TOPIK 3 gets you in the door, but plan for TOPIK 4+ — most instruction is in Korean.",
  },
  {
    id: "snu-business",
    university: "Seoul National University",
    city: "Seoul",
    program_name: "Business Administration (BBA)",
    field: "business",
    language_track: "KR",
    topik_required: 6,
    english_ielts: null,
    min_gpa_percent: 90,
    typical_gpa_percent: 96,
    interview_required: true,
    auto_full_scholarship: false,
    scholarship_gpa_cutoff: 96,
    annual_fee_usd: 4900,
    merit_scholarship_note:
      "Global Talent Scholarship for selected admits; extremely competitive.",
    notes:
      "SNU Business requires TOPIK level 6 at application — there is NO English-proficiency substitute for this college. The hardest language bar in this dataset.",
  },
  {
    id: "snu-eng",
    university: "Seoul National University",
    city: "Seoul",
    program_name: "Engineering (BS)",
    field: "engineering",
    language_track: "KR",
    topik_required: 3,
    english_ielts: 6.0,
    min_gpa_percent: 90,
    typical_gpa_percent: 96,
    interview_required: true,
    auto_full_scholarship: false,
    scholarship_gpa_cutoff: 96,
    annual_fee_usd: 5900,
    merit_scholarship_note:
      "Global Talent Scholarship for selected admits (tuition + partial living costs).",
    notes:
      "Top engineering college in Korea. Document screening weighs Maths/Physics heavily; several departments interview shortlisted applicants.",
  },
  {
    id: "snu-cs",
    university: "Seoul National University",
    city: "Seoul",
    program_name: "Computer Science & Engineering (BS)",
    field: "computer_science",
    language_track: "KR",
    topik_required: 3,
    english_ielts: 6.0,
    min_gpa_percent: 91,
    typical_gpa_percent: 97,
    interview_required: true,
    auto_full_scholarship: false,
    scholarship_gpa_cutoff: 97,
    annual_fee_usd: 5900,
    merit_scholarship_note: "Global Talent Scholarship for selected admits.",
    notes:
      "The most in-demand SNU major; runs above the engineering floor. Evidence of building/olympiads strengthens the document screen.",
  },
  {
    id: "snu-science",
    university: "Seoul National University",
    city: "Seoul",
    program_name: "Natural Sciences (BS)",
    field: "science",
    language_track: "KR",
    topik_required: 3,
    english_ielts: 6.0,
    min_gpa_percent: 89,
    typical_gpa_percent: 95,
    interview_required: true,
    auto_full_scholarship: false,
    scholarship_gpa_cutoff: 95,
    annual_fee_usd: 5500,
    merit_scholarship_note: "Global Talent Scholarship for selected admits.",
    notes:
      "Research-intensive; a genuine science spike (olympiads, research) matters in the document screen.",
  },

  // ── KAIST (Daejeon) ─────────────────────────────────────────────────────────
  // Fully English-taught, no TOPIK needed. Document-based (transcript, essays,
  // one teacher recommendation, English proficiency; SAT/AP/IB welcome as
  // evidence). EVERY admitted international undergraduate receives the KAIST
  // scholarship: full tuition + monthly stipend. Intl acceptance ≈ 7–10%.
  {
    id: "kaist-eng",
    university: "KAIST",
    city: "Daejeon",
    program_name: "Engineering (BS)",
    field: "engineering",
    language_track: "EN",
    topik_required: null,
    english_ielts: 6.5,
    min_gpa_percent: 90,
    typical_gpa_percent: 96,
    interview_required: false,
    auto_full_scholarship: true,
    scholarship_gpa_cutoff: 90,
    annual_fee_usd: 10200,
    merit_scholarship_note:
      "Every admitted international undergraduate receives the KAIST Scholarship: full tuition for 8 semesters plus a monthly living allowance — no separate application.",
    notes:
      "Korea's MIT. All-English instruction, no TOPIK required. Admission is document-based (≈7–10% international admit rate); strong Maths/Physics evidence is decisive. Students pick their major after year one.",
  },
  {
    id: "kaist-cs",
    university: "KAIST",
    city: "Daejeon",
    program_name: "Computing / Electrical Engineering (BS)",
    field: "computer_science",
    language_track: "EN",
    topik_required: null,
    english_ielts: 6.5,
    min_gpa_percent: 91,
    typical_gpa_percent: 97,
    interview_required: false,
    auto_full_scholarship: true,
    scholarship_gpa_cutoff: 91,
    annual_fee_usd: 10200,
    merit_scholarship_note:
      "Full tuition + monthly stipend for every admitted international student.",
    notes:
      "The most competitive intended track at KAIST. Olympiads, projects and research weigh heavily in the document screen.",
  },
  {
    id: "kaist-science",
    university: "KAIST",
    city: "Daejeon",
    program_name: "Natural Sciences (BS)",
    field: "science",
    language_track: "EN",
    topik_required: null,
    english_ielts: 6.5,
    min_gpa_percent: 89,
    typical_gpa_percent: 95,
    interview_required: false,
    auto_full_scholarship: true,
    scholarship_gpa_cutoff: 89,
    annual_fee_usd: 10200,
    merit_scholarship_note:
      "Full tuition + monthly stipend for every admitted international student.",
    notes:
      "Research from year one; the science-olympiad profile fits naturally here.",
  },

  // ── Yonsei University (Seoul) ───────────────────────────────────────────────
  // Underwood International College (UIC) is a fully English-taught liberal-arts
  // college inside Yonsei — essays + documents, no interview, SAT recommended
  // but optional. The main (Korean-taught) campus admits internationals on
  // TOPIK + documents.
  {
    id: "yonsei-uic-humanities",
    university: "Yonsei University (UIC)",
    city: "Seoul",
    program_name: "Underwood Division — Humanities & Social Sciences (BA)",
    field: "social_science",
    language_track: "EN",
    topik_required: null,
    english_ielts: 6.5,
    min_gpa_percent: 85,
    typical_gpa_percent: 93,
    interview_required: false,
    auto_full_scholarship: false,
    scholarship_gpa_cutoff: 93,
    annual_fee_usd: 12500,
    merit_scholarship_note:
      "Admitted internationals are automatically considered for UIC merit scholarships — the strongest admits receive up to full tuition for four years.",
    notes:
      "US-style, essay-driven admission entirely in English (applications via Common App accepted). SAT is optional but recommended; the personal essays carry real weight.",
  },
  {
    id: "yonsei-uic-econ",
    university: "Yonsei University (UIC)",
    city: "Seoul",
    program_name: "Underwood Division — Economics / International Studies (BA)",
    field: "business",
    language_track: "EN",
    topik_required: null,
    english_ielts: 6.5,
    min_gpa_percent: 86,
    typical_gpa_percent: 94,
    interview_required: false,
    auto_full_scholarship: false,
    scholarship_gpa_cutoff: 94,
    annual_fee_usd: 12500,
    merit_scholarship_note:
      "Automatic consideration for merit scholarships up to full tuition.",
    notes:
      "The most sought-after UIC tracks. Strong essays + a clear quantitative record are the differentiators.",
  },
  {
    id: "yonsei-business-kr",
    university: "Yonsei University",
    city: "Seoul",
    program_name: "Business Administration (BBA, Korean-taught)",
    field: "business",
    language_track: "KR",
    topik_required: 4,
    english_ielts: null,
    min_gpa_percent: 84,
    typical_gpa_percent: 92,
    interview_required: false,
    auto_full_scholarship: false,
    scholarship_gpa_cutoff: 92,
    annual_fee_usd: 7400,
    merit_scholarship_note:
      "Merit scholarships tied to the document screen and TOPIK level; a higher TOPIK raises the award.",
    notes:
      "Main-campus Korean-taught track — cheaper than UIC and less essay-driven, but TOPIK 4+ is expected and instruction is in Korean.",
  },

  // ── Korea University (Seoul) ────────────────────────────────────────────────
  // Document screening, no interview for most colleges. Korean-taught tracks
  // want TOPIK 3+ (4+ to be competitive); the Division of International Studies
  // is English-taught.
  {
    id: "ku-intl-studies",
    university: "Korea University",
    city: "Seoul",
    program_name: "International Studies (BA, English-taught)",
    field: "social_science",
    language_track: "EN",
    topik_required: null,
    english_ielts: 6.5,
    min_gpa_percent: 84,
    typical_gpa_percent: 92,
    interview_required: false,
    auto_full_scholarship: false,
    scholarship_gpa_cutoff: 92,
    annual_fee_usd: 7400,
    merit_scholarship_note:
      "Admission scholarships (25–100% tuition) from the document evaluation; renewable on GPA.",
    notes:
      "KU's flagship English-taught track — SKY-tier prestige without the TOPIK gate. Popular, so the effective bar runs above the Korean-track floor.",
  },
  {
    id: "ku-business",
    university: "Korea University",
    city: "Seoul",
    program_name: "Business Administration (BBA)",
    field: "business",
    language_track: "KR",
    topik_required: 3,
    english_ielts: null,
    min_gpa_percent: 83,
    typical_gpa_percent: 91,
    interview_required: false,
    auto_full_scholarship: false,
    scholarship_gpa_cutoff: 91,
    annual_fee_usd: 7600,
    merit_scholarship_note:
      "Admission scholarships from the document screen; higher TOPIK levels earn evaluation points and larger awards.",
    notes:
      "AACSB-accredited; the strongest business brand in the SKY trio after SNU. TOPIK 3 to apply, TOPIK 4+ to be competitive.",
  },
  {
    id: "ku-eng",
    university: "Korea University",
    city: "Seoul",
    program_name: "Engineering (BS)",
    field: "engineering",
    language_track: "KR",
    topik_required: 3,
    english_ielts: null,
    min_gpa_percent: 82,
    typical_gpa_percent: 90,
    interview_required: false,
    auto_full_scholarship: false,
    scholarship_gpa_cutoff: 90,
    annual_fee_usd: 8600,
    merit_scholarship_note:
      "Admission scholarships (25–100% tuition) from the document evaluation.",
    notes:
      "Broad engineering entry at a SKY university; a solid Maths/Physics transcript carries the screen.",
  },

  // ── Sungkyunkwan University (SKKU, Seoul/Suwon) ─────────────────────────────
  // Strong industry ties (Samsung). Language-linked tuition waivers are the
  // headline: TOPIK 5 → 50%, TOPIK 6 → 100%; IELTS 7.0 → 50%, IELTS 8.0 → 100%.
  {
    id: "skku-business-en",
    university: "Sungkyunkwan University",
    city: "Seoul",
    program_name: "Global Business Administration (BBA, English-taught)",
    field: "business",
    language_track: "EN",
    topik_required: null,
    english_ielts: 6.5,
    min_gpa_percent: 80,
    typical_gpa_percent: 89,
    interview_required: false,
    auto_full_scholarship: false,
    scholarship_gpa_cutoff: 89,
    annual_fee_usd: 8100,
    merit_scholarship_note:
      "Language-linked tuition waivers: IELTS 7.0+ / TOPIK 5 → 50%, IELTS 8.0+ / TOPIK 6 → 100% of tuition.",
    notes:
      "SKKU's flagship English-taught program. The transparent language-linked scholarship ladder makes a high IELTS directly valuable.",
  },
  {
    id: "skku-cs",
    university: "Sungkyunkwan University",
    city: "Suwon",
    program_name: "Computer Science / Software (BS)",
    field: "computer_science",
    language_track: "KR",
    topik_required: 3,
    english_ielts: null,
    min_gpa_percent: 79,
    typical_gpa_percent: 88,
    interview_required: false,
    auto_full_scholarship: false,
    scholarship_gpa_cutoff: 88,
    annual_fee_usd: 8700,
    merit_scholarship_note:
      "TOPIK-linked waivers (TOPIK 5 → 50%, TOPIK 6 → 100%) plus merit awards from the document screen.",
    notes:
      "Samsung-linked software programs with strong placement. TOPIK 3 to apply; TOPIK 4+ by graduation.",
  },
  {
    id: "skku-eng",
    university: "Sungkyunkwan University",
    city: "Suwon",
    program_name: "Engineering (BS)",
    field: "engineering",
    language_track: "KR",
    topik_required: 3,
    english_ielts: null,
    min_gpa_percent: 77,
    typical_gpa_percent: 86,
    interview_required: false,
    auto_full_scholarship: false,
    scholarship_gpa_cutoff: 86,
    annual_fee_usd: 8700,
    merit_scholarship_note:
      "TOPIK-linked tuition waivers plus merit awards from the document screen.",
    notes:
      "A realistic target with genuine research strength; the natural step down from the SKY tier.",
  },

  // ── Hanyang University (Seoul) ──────────────────────────────────────────────
  // Engineering-first reputation. TOPIK required (higher levels earn evaluation
  // points); admission scholarships give 30–70% tuition reductions.
  {
    id: "hanyang-cs",
    university: "Hanyang University",
    city: "Seoul",
    program_name: "Computer Science (BS)",
    field: "computer_science",
    language_track: "KR",
    topik_required: 3,
    english_ielts: null,
    min_gpa_percent: 78,
    typical_gpa_percent: 87,
    interview_required: false,
    auto_full_scholarship: false,
    scholarship_gpa_cutoff: 87,
    annual_fee_usd: 8800,
    merit_scholarship_note:
      "Admission scholarships give 30–70% tuition reductions based on the document evaluation; TOPIK level earns points.",
    notes:
      "Hanyang is Korea's engineering-first private university with strong industry placement.",
  },
  {
    id: "hanyang-eng",
    university: "Hanyang University",
    city: "Seoul",
    program_name: "Engineering (BS)",
    field: "engineering",
    language_track: "KR",
    topik_required: 3,
    english_ielts: null,
    min_gpa_percent: 76,
    typical_gpa_percent: 85,
    interview_required: false,
    auto_full_scholarship: false,
    scholarship_gpa_cutoff: 85,
    annual_fee_usd: 8800,
    merit_scholarship_note:
      "Admission scholarships of 30–70% tuition from the document evaluation.",
    notes:
      "The classic Hanyang entry — accessible for a solid transcript, respected by employers.",
  },
  {
    id: "hanyang-business",
    university: "Hanyang University",
    city: "Seoul",
    program_name: "Business Administration (BBA)",
    field: "business",
    language_track: "KR",
    topik_required: 3,
    english_ielts: null,
    min_gpa_percent: 75,
    typical_gpa_percent: 84,
    interview_required: false,
    auto_full_scholarship: false,
    scholarship_gpa_cutoff: 84,
    annual_fee_usd: 7800,
    merit_scholarship_note:
      "Admission scholarships of 30–70% tuition; TOPIK level counts in the evaluation.",
    notes: "Accessible business entry at a top-10 Korean university.",
  },

  // ── Kyung Hee University (Seoul) ────────────────────────────────────────────
  // The accessible end of the ladder; known for hospitality/management and a
  // broad international intake. TOPIK-linked admission scholarships.
  {
    id: "khu-business",
    university: "Kyung Hee University",
    city: "Seoul",
    program_name: "Business / Hotel & Tourism Management (BBA)",
    field: "business",
    language_track: "KR",
    topik_required: 3,
    english_ielts: null,
    min_gpa_percent: 72,
    typical_gpa_percent: 82,
    interview_required: false,
    auto_full_scholarship: false,
    scholarship_gpa_cutoff: 82,
    annual_fee_usd: 7400,
    merit_scholarship_note:
      "Admission scholarships from half to full first-semester tuition; higher TOPIK levels unlock larger, renewable awards.",
    notes:
      "Korea's best-known hospitality school and one of the most international campuses — a realistic entry point with a real brand.",
  },
  {
    id: "khu-humanities",
    university: "Kyung Hee University",
    city: "Seoul",
    program_name: "Humanities / Social Sciences (BA)",
    field: "humanities",
    language_track: "KR",
    topik_required: 3,
    english_ielts: null,
    min_gpa_percent: 70,
    typical_gpa_percent: 80,
    interview_required: false,
    auto_full_scholarship: false,
    scholarship_gpa_cutoff: 80,
    annual_fee_usd: 6400,
    merit_scholarship_note:
      "TOPIK-linked admission scholarships (up to full first-semester tuition).",
    notes:
      "The most accessible entry in this dataset; a sensible safety alongside SKY/SKKU targets.",
  },
];

export function findKoreaProgram(id: string): KoreaProgram | undefined {
  return KOREA_PROGRAMS.find((p) => p.id === id);
}

/** Display label for a program (used in intake + report). */
export function koreaProgramLabel(p: KoreaProgram): string {
  return `${p.university} — ${p.program_name}`;
}
