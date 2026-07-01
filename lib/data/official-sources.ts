// Official, verified source links shown on the Admission-odds views.
//
// Italy posts its admission rules through two official channels: the government
// Universitaly portal (Extra-UE pre-enrollment + study visa) and each
// university's own "students with a foreign qualification" admissions page,
// where that program's Bando di Ammissione is published. HK admission is
// per-university (non-JUPAS), with no single government portal — so each program
// links to its university's official admissions / English-requirement /
// entrance-scholarship pages.
//
// All URLs verified 2026-06-27 against the official sites. Re-check yearly:
// university deep links occasionally move between admission cycles.

export type OfficialLink = { label: string; url: string; hint?: string };

// ── Italy ─────────────────────────────────────────────────────────────────────

// Government-level, applies to every Italian program (shown once, not per card).
export const ITALY_GOV_SOURCES: OfficialLink[] = [
  {
    label: "Universitaly — official government portal",
    url: "https://www.universitaly.it/",
    hint: "The MUR (Ministry) portal for Extra-UE pre-enrollment and the study-visa procedure — the official source every Italian university points to.",
  },
];

// Keyed by the exact `university` string used in lib/data/italian-universities.ts.
// Each points to that university's official international / foreign-qualification
// admissions page (where the current Bando is posted).
export const ITALY_UNIVERSITY_SOURCES: Record<string, string> = {
  "Politecnico di Milano":
    "https://www.polimi.it/en/prospective-students/how-to-apply/admission-to-laurea-programmes/students-with-a-foreign-degree",
  "Politecnico di Torino": "https://international.polito.it/admission",
  "Sapienza University of Rome":
    "https://www.uniroma1.it/en/pagina/applying-sapienza-international-student",
  "University of Bologna":
    "https://www.unibo.it/en/study/incoming-outgoing-international-mobility/you-are-an-international-student-wishing-to-study-at-Unibo",
  "University of Padova": "https://www.unipd.it/en/how-apply",
  "University of Milan":
    "https://www.unimi.it/en/international/coming-abroad/enrol-programme/international-enrolment-degree-programmes",
  "Bocconi University":
    "https://www.unibocconi.it/en/applying-bocconi/bachelor-and-law-programs/application-and-admissions",
  "University of Trento":
    "https://www.unitn.it/en/international/coming-unitrento/degree-seeking-student/admission-process",
  "University of Pisa":
    "https://www.unipi.it/en/education/registration/enrolment-and-registration/enrolment-for-international-students/",
  "University of Turin":
    "https://en.unito.it/studying-unito/international-degree-seeking-students",
  "Ca' Foscari University of Venice": "https://www.unive.it/pag/41327/",
  "University of Naples Federico II":
    "https://www.international.unina.it/education/admission-regulation/",
  "University of Pavia":
    "https://en.unipv.it/en/education/bachelors-and-masters-degree-programs/how-apply",
  "LUISS Guido Carli":
    "https://www.luiss.edu/en/admissions/undergraduate-admissions/admissions-international-students",
};

export function italyOfficialUrl(university: string): string | undefined {
  return ITALY_UNIVERSITY_SOURCES[university];
}

// ── Hong Kong ─────────────────────────────────────────────────────────────────

export type HkSources = {
  admissions: string;
  english?: string;
  scholarship?: string;
};

// Keyed by the short `university` code used in lib/data/hk-universities.ts.
// `english` is only set where the university has a distinct English-requirement
// page; otherwise the admissions page covers it.
export const HK_UNIVERSITY_SOURCES: Record<string, HkSources> = {
  HKU: {
    admissions: "https://admissions.hku.hk/apply/international-qualifications",
    english:
      "https://admissions.hku.hk/apply/international-qualifications/english-language-requirement",
    scholarship: "https://admissions.hku.hk/fees-and-scholarships/scholarships",
  },
  HKUST: {
    admissions: "https://join.hkust.edu.hk/admissions/international-qualifications",
    english: "https://join.hkust.edu.hk/oas/elar.pdf",
    scholarship: "https://join.hkust.edu.hk/intlscholarships",
  },
  CUHK: {
    admissions:
      "https://admission.cuhk.edu.hk/application/overseas-other-qualifications-non-local-international-team/requirements/",
    english:
      "https://admission.cuhk.edu.hk/application/non-jupas/language-requirements/",
    scholarship: "http://admission.cuhk.edu.hk/scholarships/admission.html",
  },
  CityU: {
    admissions: "https://www.cityu.edu.hk/admo/admissions/international-admissions",
    english: "https://www.admo.cityu.edu.hk/intl/international/entreq/",
    scholarship: "https://www.cityu.edu.hk/admissions/scholarship",
  },
  PolyU: {
    admissions:
      "https://www.polyu.edu.hk/study/ug/admissions/international-other-qualifications/international-other-qualifications-general",
    scholarship: "https://www.polyu.edu.hk/study/ug/fees-and-scholarships/scholarships",
  },
  HKBU: {
    admissions: "https://admissions.hkbu.edu.hk/admissions/international-qualifications.html",
    scholarship: "https://admissions.hkbu.edu.hk/en/scholarships.html",
  },
  Lingnan: {
    admissions:
      "https://www.ln.edu.hk/admissions/ug/apply-now/overseas-and-mainland-applicants-holding-international-qualifications",
    scholarship:
      "https://www.ln.edu.hk/admissions/ug/your-future-begins-now-apply/fees-and-scholarships",
  },
  EdUHK: {
    admissions: "https://www.apply.eduhk.hk/ug/nonlocal",
    scholarship: "https://www.apply.eduhk.hk/ug/scholarships",
  },
};

export function hkOfficialSources(university: string): HkSources | undefined {
  return HK_UNIVERSITY_SOURCES[university];
}

// ── United Arab Emirates ──────────────────────────────────────────────────────
// UAE admission is per-university (no single central portal for international
// applicants), so each card links straight to that university's official
// undergraduate-admissions and scholarship pages — the real gates. Official
// domains; re-check yearly (deep links occasionally move between cycles).

export type UaeSources = {
  admissions: string;
  scholarship?: string;
};

// Keyed by the exact `university` string used in lib/data/uae-universities.ts.
export const UAE_UNIVERSITY_SOURCES: Record<string, UaeSources> = {
  "NYU Abu Dhabi": {
    admissions: "https://nyuad.nyu.edu/en/admissions/undergraduate.html",
    scholarship:
      "https://nyuad.nyu.edu/en/admissions/undergraduate/cost-and-financial-aid.html",
  },
  "Khalifa University": {
    admissions: "https://www.ku.ac.ae/admissions",
    scholarship: "https://www.ku.ac.ae/scholarships",
  },
  "American University of Sharjah": {
    admissions: "https://www.aus.edu/admissions/undergraduate-admissions",
    scholarship: "https://www.aus.edu/financial-grants-and-scholarships",
  },
  "UAE University": {
    admissions: "https://www.uaeu.ac.ae/en/admission/",
    scholarship: "https://www.uaeu.ac.ae/en/admission/scholarships.shtml",
  },
  "Zayed University": {
    admissions: "https://www.zu.ac.ae/main/en/admission/index.aspx",
  },
  "Mohammed Bin Rashid University": {
    admissions: "https://www.mbru.ac.ae/admission/",
    scholarship: "https://www.mbru.ac.ae/admission/scholarships/",
  },
};

export function uaeOfficialSources(university: string): UaeSources | undefined {
  return UAE_UNIVERSITY_SOURCES[university];
}
