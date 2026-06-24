// Italian university dataset for the Extra-UE (non-EU citizen) admission pathway.
//
// IMPORTANT: All quota figures, SAT cutoffs, and guaranteed thresholds are
// approximations derived from publicly available Bando di Ammissione documents
// and historical Graduatoria Extra-UE rankings. Verify against each university's
// current Bando before presenting to users publicly.
//
// Two admission branches exist in Italian state universities (see lib/ai/italy-analyze.ts):
//   Branch A – "guaranteed": meeting the SAT threshold secures a seat early, no ranking needed.
//   Branch B – "graduatoria": strict merit ranking after the application deadline closes.
//
// Bocconi is private (different system; not DSU-eligible).

export type ItalyAdmissionBranch = "guaranteed" | "graduatoria";
export type ItalianProgramField =
  | "engineering"
  | "economics"
  | "science"
  | "humanities";
export type ProgramLevel = "bsc" | "msc";
export type ProgramLanguage = "EN" | "IT" | "EN+IT";

export type ItalianProgram = {
  id: string;
  university: string;
  city: string;
  program_name: string;
  field: ItalianProgramField;
  level: ProgramLevel;
  language: ProgramLanguage;
  // Extra-UE quota: seats reserved for non-EU international students.
  extra_ue_quota: number;
  // Historical SAT cutoff: approximate SAT of the last admitted Extra-UE student
  // in the previous cycle (converted from the university's internal scale).
  historical_sat_cutoff: number;
  // Whether this program/cycle has an Early Admission / Guaranteed Enrollment system.
  has_guaranteed_threshold: boolean;
  // SAT score that triggers guaranteed early admission. null when not applicable.
  guaranteed_threshold: number | null;
  // Approximate annual tuition in EUR (before DSU reduction; income-based sliding scale applies).
  annual_fee_eur: number;
  // Private universities cannot award DSU scholarships.
  is_private: boolean;
  dsu_eligible: boolean;
  notes: string;
};

export const ITALIAN_PROGRAMS: ItalianProgram[] = [
  // ── Politecnico di Milano ────────────────────────────────────────────────
  {
    id: "polimi-cs-eng",
    university: "Politecnico di Milano",
    city: "Milan",
    program_name: "Computer Science and Engineering (BSc)",
    field: "engineering",
    level: "bsc",
    language: "EN+IT",
    extra_ue_quota: 15,
    historical_sat_cutoff: 1150,
    has_guaranteed_threshold: true,
    guaranteed_threshold: 1300,
    annual_fee_eur: 3400,
    is_private: false,
    dsu_eligible: true,
    notes:
      "Polimi's flagship CS program. Early Admission pathway: SAT ≥ threshold secures a seat before the ranking phase opens. Both Italian and English tracks available; language of instruction shifts to full English from year 3 MSc onward.",
  },
  {
    id: "polimi-automation",
    university: "Politecnico di Milano",
    city: "Milan",
    program_name: "Automation and Control Engineering (BSc)",
    field: "engineering",
    level: "bsc",
    language: "EN+IT",
    extra_ue_quota: 10,
    historical_sat_cutoff: 1130,
    has_guaranteed_threshold: true,
    guaranteed_threshold: 1280,
    annual_fee_eur: 3400,
    is_private: false,
    dsu_eligible: true,
    notes:
      "Strong systems and robotics focus. Same Early Admission rules as CS Eng at Polimi. Lower historical cutoff than CS Eng — more accessible but equally rigorous program.",
  },
  {
    id: "polimi-eng-systems",
    university: "Politecnico di Milano",
    city: "Milan",
    program_name: "Engineering of Computing Systems (MSc)",
    field: "engineering",
    level: "msc",
    language: "EN",
    extra_ue_quota: 10,
    historical_sat_cutoff: 1200,
    has_guaranteed_threshold: true,
    guaranteed_threshold: 1320,
    annual_fee_eur: 3400,
    is_private: false,
    dsu_eligible: true,
    notes:
      "Fully English-taught MSc. Requires a relevant BSc for direct admission. SAT accepted as a supplementary credential for international applicants in the Extra-UE track.",
  },

  // ── Politecnico di Torino ─────────────────────────────────────────────────
  {
    id: "polito-cs-eng",
    university: "Politecnico di Torino",
    city: "Turin",
    program_name: "Computer Engineering (BSc)",
    field: "engineering",
    level: "bsc",
    language: "EN",
    extra_ue_quota: 12,
    historical_sat_cutoff: 1100,
    has_guaranteed_threshold: true,
    guaranteed_threshold: 1250,
    annual_fee_eur: 3500,
    is_private: false,
    dsu_eligible: true,
    notes:
      "One of the few Italian engineering BSc programs fully taught in English. Polito's guaranteed-admission track mirrors Polimi's Early Admission logic. Strong focus on software systems and embedded design.",
  },
  {
    id: "polito-data-ai",
    university: "Politecnico di Torino",
    city: "Turin",
    program_name: "Data Science and Artificial Intelligence (MSc)",
    field: "engineering",
    level: "msc",
    language: "EN",
    extra_ue_quota: 10,
    historical_sat_cutoff: 1120,
    has_guaranteed_threshold: true,
    guaranteed_threshold: 1260,
    annual_fee_eur: 3500,
    is_private: false,
    dsu_eligible: true,
    notes:
      "Growing program with strong industry partnerships in Northern Italy. Guaranteed threshold applies; historically lower competition vs. Polimi's equivalent.",
  },

  // ── Sapienza University of Rome ───────────────────────────────────────────
  {
    id: "sapienza-cs",
    university: "Sapienza University of Rome",
    city: "Rome",
    program_name: "Computer Science (BSc)",
    field: "science",
    level: "bsc",
    language: "IT",
    extra_ue_quota: 3,
    historical_sat_cutoff: 1380,
    has_guaranteed_threshold: false,
    guaranteed_threshold: null,
    annual_fee_eur: 1500,
    is_private: false,
    dsu_eligible: true,
    notes:
      "Primarily Italian-language instruction. Strict Graduatoria — 3 Extra-UE seats means extreme sensitivity to individual applicant quality. Low fees thanks to income-based sliding scale. Requires Italian language proficiency (B2 minimum).",
  },
  {
    id: "sapienza-eng-cs",
    university: "Sapienza University of Rome",
    city: "Rome",
    program_name: "Engineering in Computer Science (MSc)",
    field: "engineering",
    level: "msc",
    language: "EN",
    extra_ue_quota: 5,
    historical_sat_cutoff: 1320,
    has_guaranteed_threshold: false,
    guaranteed_threshold: null,
    annual_fee_eur: 1500,
    is_private: false,
    dsu_eligible: true,
    notes:
      "English-taught MSc with very competitive Extra-UE quota. One of the lowest-cost CS master's programs in Europe. Strict ranking — 5 seats for all non-EU applicants globally.",
  },

  // ── University of Bologna ─────────────────────────────────────────────────
  {
    id: "unibo-ai",
    university: "University of Bologna",
    city: "Bologna",
    program_name: "Artificial Intelligence (MSc)",
    field: "science",
    level: "msc",
    language: "EN",
    extra_ue_quota: 8,
    historical_sat_cutoff: 1250,
    has_guaranteed_threshold: false,
    guaranteed_threshold: null,
    annual_fee_eur: 2600,
    is_private: false,
    dsu_eligible: true,
    notes:
      "One of Italy's most prestigious AI programs; world's oldest university. Strict Graduatoria with a more generous Extra-UE quota than Sapienza. Applicants are ranked by academic record conversion.",
  },
  {
    id: "unibo-business",
    university: "University of Bologna",
    city: "Bologna",
    program_name: "Business and Economics (BSc)",
    field: "economics",
    level: "bsc",
    language: "EN",
    extra_ue_quota: 10,
    historical_sat_cutoff: 1150,
    has_guaranteed_threshold: false,
    guaranteed_threshold: null,
    annual_fee_eur: 2600,
    is_private: false,
    dsu_eligible: true,
    notes:
      "English-track economics BSc at UNIBO Rimini campus. Good Extra-UE quota; historically more accessible than engineering programs. Solid for students targeting international business careers in Europe.",
  },

  // ── University of Padova ──────────────────────────────────────────────────
  {
    id: "unipd-data-science",
    university: "University of Padova",
    city: "Padua",
    program_name: "Data Science (MSc)",
    field: "science",
    level: "msc",
    language: "EN",
    extra_ue_quota: 6,
    historical_sat_cutoff: 1200,
    has_guaranteed_threshold: false,
    guaranteed_threshold: null,
    annual_fee_eur: 2400,
    is_private: false,
    dsu_eligible: true,
    notes:
      "Strong research environment; University of Padova is one of Europe's oldest. Graduates regularly enter top European tech companies. Strict Graduatoria with moderate Extra-UE quota.",
  },
  {
    id: "unipd-cs",
    university: "University of Padova",
    city: "Padua",
    program_name: "Computer Science (MSc)",
    field: "science",
    level: "msc",
    language: "EN",
    extra_ue_quota: 8,
    historical_sat_cutoff: 1180,
    has_guaranteed_threshold: false,
    guaranteed_threshold: null,
    annual_fee_eur: 2400,
    is_private: false,
    dsu_eligible: true,
    notes:
      "Good quota and lower historical bar vs. Sapienza. Bologna–Padova corridor is Italy's strongest for STEM graduates. Programs conducted jointly with the CS department with strong theoretical foundations.",
  },

  // ── University of Milan ───────────────────────────────────────────────────
  {
    id: "unimi-cs",
    university: "University of Milan",
    city: "Milan",
    program_name: "Computer Science (BSc)",
    field: "science",
    level: "bsc",
    language: "IT",
    extra_ue_quota: 5,
    historical_sat_cutoff: 1150,
    has_guaranteed_threshold: false,
    guaranteed_threshold: null,
    annual_fee_eur: 2200,
    is_private: false,
    dsu_eligible: true,
    notes:
      "Italian-language program; Italian B2 required. Lower fees and more accessible cutoff than Polimi. Good option for students who can study in Italian and want a Milan base. Strict Graduatoria.",
  },

  // ── Bocconi University (private) ──────────────────────────────────────────
  {
    id: "bocconi-econ-mgmt",
    university: "Bocconi University",
    city: "Milan",
    program_name: "Economics and Management (BSc)",
    field: "economics",
    level: "bsc",
    language: "EN",
    extra_ue_quota: 40,
    historical_sat_cutoff: 1400,
    has_guaranteed_threshold: false,
    guaranteed_threshold: null,
    annual_fee_eur: 14500,
    is_private: true,
    dsu_eligible: false,
    notes:
      "Italy's top private business school; holistic merit review (SAT/ACT, GPA, essays, English proficiency). Not DSU-eligible — income-based Bocconi scholarships exist but are separate. Large international class; competes on global stage vs. LSE/HEC.",
  },
  {
    id: "bocconi-intl-mgmt",
    university: "Bocconi University",
    city: "Milan",
    program_name: "International Management (MSc)",
    field: "economics",
    level: "msc",
    language: "EN",
    extra_ue_quota: 30,
    historical_sat_cutoff: 1420,
    has_guaranteed_threshold: false,
    guaranteed_threshold: null,
    annual_fee_eur: 16000,
    is_private: true,
    dsu_eligible: false,
    notes:
      "Bocconi's flagship MSc program. Requires relevant BSc and GMAT/GRE preferred (SAT accepted as proxy for recent graduates). Holistic review; no strict Graduatoria — committee-based decision.",
  },

  // ── Politecnico di Milano (more programs) ─────────────────────────────────
  {
    id: "polimi-management-eng",
    university: "Politecnico di Milano",
    city: "Milan",
    program_name: "Management Engineering (BSc)",
    field: "engineering",
    level: "bsc",
    language: "EN+IT",
    extra_ue_quota: 12,
    historical_sat_cutoff: 1180,
    has_guaranteed_threshold: true,
    guaranteed_threshold: 1300,
    annual_fee_eur: 3400,
    is_private: false,
    dsu_eligible: true,
    notes:
      "Bridges engineering and business; one of Polimi's most popular Extra-UE tracks. Early Admission applies. Strong placement into consulting and tech-management roles.",
  },
  {
    id: "polimi-mech-eng",
    university: "Politecnico di Milano",
    city: "Milan",
    program_name: "Mechanical Engineering (BSc)",
    field: "engineering",
    level: "bsc",
    language: "EN+IT",
    extra_ue_quota: 10,
    historical_sat_cutoff: 1120,
    has_guaranteed_threshold: true,
    guaranteed_threshold: 1270,
    annual_fee_eur: 3400,
    is_private: false,
    dsu_eligible: true,
    notes:
      "Classic engineering pillar with a lower historical bar than CS/Management. Early Admission pathway. Italian useful in early years; English track available.",
  },
  {
    id: "polimi-math-eng",
    university: "Politecnico di Milano",
    city: "Milan",
    program_name: "Mathematical Engineering (BSc)",
    field: "engineering",
    level: "bsc",
    language: "EN+IT",
    extra_ue_quota: 8,
    historical_sat_cutoff: 1200,
    has_guaranteed_threshold: true,
    guaranteed_threshold: 1330,
    annual_fee_eur: 3400,
    is_private: false,
    dsu_eligible: true,
    notes:
      "Quant-heavy program feeding finance/data roles. Higher cutoff; strong maths record expected. Early Admission applies.",
  },

  // ── Politecnico di Torino (more programs) ─────────────────────────────────
  {
    id: "polito-mech-eng",
    university: "Politecnico di Torino",
    city: "Turin",
    program_name: "Mechanical Engineering (BSc)",
    field: "engineering",
    level: "bsc",
    language: "EN",
    extra_ue_quota: 10,
    historical_sat_cutoff: 1080,
    has_guaranteed_threshold: true,
    guaranteed_threshold: 1230,
    annual_fee_eur: 3500,
    is_private: false,
    dsu_eligible: true,
    notes:
      "English-taught mechanical track; close ties to the Turin automotive cluster (Fiat/Stellantis). Guaranteed-admission logic mirrors Polimi.",
  },

  // ── Sapienza University of Rome (more programs) ───────────────────────────
  {
    id: "sapienza-econ",
    university: "Sapienza University of Rome",
    city: "Rome",
    program_name: "Economics and Finance (BSc)",
    field: "economics",
    level: "bsc",
    language: "EN",
    extra_ue_quota: 8,
    historical_sat_cutoff: 1150,
    has_guaranteed_threshold: false,
    guaranteed_threshold: null,
    annual_fee_eur: 1500,
    is_private: false,
    dsu_eligible: true,
    notes:
      "English-taught economics at Italy's largest university. Strict Graduatoria; low fees with income-based reductions. More accessible than Sapienza CS.",
  },

  // ── University of Bologna (more programs) ─────────────────────────────────
  {
    id: "unibo-auto-eng",
    university: "University of Bologna",
    city: "Bologna",
    program_name: "Automation Engineering (MSc)",
    field: "engineering",
    level: "msc",
    language: "EN",
    extra_ue_quota: 8,
    historical_sat_cutoff: 1180,
    has_guaranteed_threshold: false,
    guaranteed_threshold: null,
    annual_fee_eur: 2600,
    is_private: false,
    dsu_eligible: true,
    notes:
      "English-taught MSc with strong robotics/control focus. Requires a relevant BSc. Strict Graduatoria with moderate Extra-UE quota.",
  },

  // ── University of Trento ──────────────────────────────────────────────────
  {
    id: "unitn-cs",
    university: "University of Trento",
    city: "Trento",
    program_name: "Computer Science (MSc)",
    field: "science",
    level: "msc",
    language: "EN",
    extra_ue_quota: 10,
    historical_sat_cutoff: 1180,
    has_guaranteed_threshold: false,
    guaranteed_threshold: null,
    annual_fee_eur: 1600,
    is_private: false,
    dsu_eligible: true,
    notes:
      "Consistently top-ranked Italian CS department; English-taught MSc with strong research ties (FBK). Low fees, high quality of life. Strict Graduatoria.",
  },

  // ── University of Pisa ────────────────────────────────────────────────────
  {
    id: "unipi-cs",
    university: "University of Pisa",
    city: "Pisa",
    program_name: "Computer Science (BSc)",
    field: "science",
    level: "bsc",
    language: "IT",
    extra_ue_quota: 5,
    historical_sat_cutoff: 1200,
    has_guaranteed_threshold: false,
    guaranteed_threshold: null,
    annual_fee_eur: 1500,
    is_private: false,
    dsu_eligible: true,
    notes:
      "Historic CS powerhouse (first Italian CS degree). Italian-language BSc — B2 required. Strict Graduatoria; tightly linked to CNR and Scuola Normale ecosystem.",
  },

  // ── University of Turin ───────────────────────────────────────────────────
  {
    id: "unito-business",
    university: "University of Turin",
    city: "Turin",
    program_name: "Business and Management (BSc)",
    field: "economics",
    level: "bsc",
    language: "EN",
    extra_ue_quota: 10,
    historical_sat_cutoff: 1130,
    has_guaranteed_threshold: false,
    guaranteed_threshold: null,
    annual_fee_eur: 2700,
    is_private: false,
    dsu_eligible: true,
    notes:
      "English-taught management BSc (SAA/ESOMAS). Accessible cutoff; strong regional employer network. Strict Graduatoria.",
  },

  // ── Ca' Foscari University of Venice ──────────────────────────────────────
  {
    id: "unive-econ",
    university: "Ca' Foscari University of Venice",
    city: "Venice",
    program_name: "Economics (BSc)",
    field: "economics",
    level: "bsc",
    language: "EN",
    extra_ue_quota: 12,
    historical_sat_cutoff: 1120,
    has_guaranteed_threshold: false,
    guaranteed_threshold: null,
    annual_fee_eur: 2300,
    is_private: false,
    dsu_eligible: true,
    notes:
      "English-taught economics in Venice with a strong international cohort. Generous Extra-UE quota; relatively accessible. Strict Graduatoria.",
  },

  // ── University of Naples Federico II ──────────────────────────────────────
  {
    id: "unina-cs-eng",
    university: "University of Naples Federico II",
    city: "Naples",
    program_name: "Computer Engineering (BSc)",
    field: "engineering",
    level: "bsc",
    language: "IT",
    extra_ue_quota: 6,
    historical_sat_cutoff: 1100,
    has_guaranteed_threshold: false,
    guaranteed_threshold: null,
    annual_fee_eur: 1300,
    is_private: false,
    dsu_eligible: true,
    notes:
      "Large southern flagship; Italian-language BSc with very low fees. Strict Graduatoria; Apple's iOS Developer Academy partnership is a notable draw.",
  },

  // ── University of Pavia ───────────────────────────────────────────────────
  {
    id: "unipv-eng",
    university: "University of Pavia",
    city: "Pavia",
    program_name: "Electronic and Computer Engineering (BSc)",
    field: "engineering",
    level: "bsc",
    language: "EN",
    extra_ue_quota: 8,
    historical_sat_cutoff: 1100,
    has_guaranteed_threshold: false,
    guaranteed_threshold: null,
    annual_fee_eur: 2000,
    is_private: false,
    dsu_eligible: true,
    notes:
      "Rare fully-English engineering BSc near Milan; historic university with strong collegio (Ghislieri/Borromeo) scholarship culture. Strict Graduatoria.",
  },

  // ── LUISS Guido Carli (private) ───────────────────────────────────────────
  {
    id: "luiss-econ",
    university: "LUISS Guido Carli",
    city: "Rome",
    program_name: "Economics and Business (BSc)",
    field: "economics",
    level: "bsc",
    language: "EN",
    extra_ue_quota: 25,
    historical_sat_cutoff: 1280,
    has_guaranteed_threshold: false,
    guaranteed_threshold: null,
    annual_fee_eur: 12500,
    is_private: true,
    dsu_eligible: false,
    notes:
      "Top Italian private after Bocconi; holistic admission (SAT/grades/English). Not DSU-eligible — LUISS runs its own merit/need scholarships. Strong consulting/finance placement.",
  },
  {
    id: "luiss-mgmt-cs",
    university: "LUISS Guido Carli",
    city: "Rome",
    program_name: "Management and Computer Science (BSc)",
    field: "economics",
    level: "bsc",
    language: "EN",
    extra_ue_quota: 20,
    historical_sat_cutoff: 1300,
    has_guaranteed_threshold: false,
    guaranteed_threshold: null,
    annual_fee_eur: 13000,
    is_private: true,
    dsu_eligible: false,
    notes:
      "Hybrid management + coding degree aimed at product/tech-business careers. Holistic review; not DSU-eligible. Separate LUISS scholarships available.",
  },
];

export const ITALIAN_PROGRAM_NAMES = ITALIAN_PROGRAMS.map(
  (p) => `${p.university} — ${p.program_name}`
);

export function findItalianProgram(idOrName: string): ItalianProgram | undefined {
  const q = idOrName.trim().toLowerCase();
  return ITALIAN_PROGRAMS.find(
    (p) =>
      p.id === q ||
      `${p.university} — ${p.program_name}`.toLowerCase() === q
  );
}

export function getItalianProgramsByField(
  field: ItalianProgramField
): ItalianProgram[] {
  return ITALIAN_PROGRAMS.filter((p) => p.field === field);
}
