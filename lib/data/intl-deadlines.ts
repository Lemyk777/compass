// Per-UNIVERSITY international-undergraduate application deadlines for the non-US
// destinations (HK / Italy / UAE / Korea). Unlike the US (whose per-school
// deadlines live in app-deadlines.ts), these were the weak point: the Roadmap
// used to show invented country-level dates. This file replaces that with dates
// hand-verified against each university's OFFICIAL admissions page.
//
// THE TRUST RULE (this whole product runs on it): a date is stored with
// `confirmed: true` and shown with a live countdown ONLY if it was verified from
// the official source below. Everything we could not verify to the day — rolling
// admission, per-programme "calls", or dates not yet published for the cycle —
// carries `confirmed: false` and is shown as an honest WINDOW + the official
// link, never a fake countdown. Better to say "check the official page" than to
// state a date that might be wrong.
//
// Dates are STABLE month/day patterns (a school's round is the same month/day
// most years); the calendar year is resolved from the student's graduation year,
// exactly like app-deadlines.ts. ⚠️ VERIFY ANNUALLY — sources checked 2026-07-02.

import { daysBetween } from "@/lib/data/opportunity-format";

export type IntlRound = { label: string; month: number; day: number };

export type UniversityDeadline = {
  // Verified, dated rounds. Empty when we have no confirmed date (see `window`).
  rounds: IntlRound[];
  // True only if `rounds` were verified from `source`. Drives whether the UI
  // shows a countdown (confirmed) or an honest window (not confirmed).
  confirmed: boolean;
  // Admission continues on a rolling basis after the main round.
  rolling?: boolean;
  // Honest, human description shown when not confirmed (or as a rolling note).
  window?: string;
  // The official page the date/window came from (the ultimate source of truth).
  source: string;
};

// Keyed by the EXACT `university` string used in each country's dataset
// (lib/data/{hk,italian,uae,korea}-universities.ts).
export const INTL_DEADLINES: Record<string, UniversityDeadline> = {
  // ── Hong Kong (verified 2026-07-02) ─────────────────────────────────────────
  HKU: {
    rounds: [{ label: "First round", month: 11, day: 26 }],
    confirmed: true,
    rolling: true,
    window: "Rolling after the first round until late August.",
    source: "https://admissions.hku.hk/apply/international-qualifications",
  },
  HKUST: {
    rounds: [
      { label: "Early round", month: 11, day: 20 },
      { label: "Main round", month: 1, day: 8 },
      { label: "Late round", month: 6, day: 30 },
    ],
    confirmed: true,
    source: "https://join.hkust.edu.hk/admissions/international-qualifications",
  },
  CUHK: {
    rounds: [
      { label: "Advance round", month: 11, day: 13 },
      { label: "Regular round", month: 1, day: 8 },
    ],
    confirmed: true,
    rolling: true,
    window: "Applications extended on a rolling basis into late May.",
    source:
      "https://admission.cuhk.edu.hk/application/overseas-other-qualifications-non-local-international-team/requirements/",
  },
  CityU: {
    rounds: [
      { label: "Early round", month: 11, day: 15 },
      { label: "Main round", month: 1, day: 15 },
    ],
    confirmed: true,
    source: "https://www.cityu.edu.hk/admo/admissions/international-admissions",
  },
  PolyU: {
    // Downgraded from a "May" date: PolyU's international pathway is rolling and
    // the published cutoff wording was ambiguous — not safe to show a countdown.
    rounds: [],
    confirmed: false,
    rolling: true,
    window:
      "Rolling international admission. Offers are made as places fill, so apply early. Confirm the current cutoff on the official page.",
    source:
      "https://www.polyu.edu.hk/study/ug/admissions/international-other-qualifications",
  },

  // ── Italy (Bocconi verified; public universities use per-programme Bandi we
  // deliberately do NOT pin to one date) ──────────────────────────────────────
  "Bocconi University": {
    rounds: [
      { label: "Early session", month: 9, day: 26 },
      { label: "Winter session", month: 1, day: 23 },
      { label: "Spring session", month: 4, day: 13 },
    ],
    confirmed: true,
    source:
      "https://www.unibocconi.it/en/applying-bocconi/bachelor-and-law-programs/timeline",
  },
  "Politecnico di Milano": {
    rounds: [],
    confirmed: false,
    window:
      "International admission runs through Politecnico's Calls for Admission in rounds through the year; dates vary by programme. Check the official call.",
    source:
      "https://www.polimi.it/en/prospective-students/how-to-apply/admission-to-laurea-programmes/students-with-a-foreign-degree",
  },
  "Politecnico di Torino": {
    rounds: [],
    confirmed: false,
    window:
      "Admission runs via the TIL-I test in rolling sessions; language requirements are due around late May. Check the official calls.",
    source: "https://www.polito.it/en/education/applying-studying-graduating/admissions-and-enrolment/bachelor-s-degree-programmes",
  },
  "Sapienza University of Rome": {
    rounds: [],
    confirmed: false,
    window:
      "Extra-EU applicants apply through Sapienza's own procedure (typically spring) plus Universitaly pre-enrolment. Check the official page.",
    source:
      "https://www.uniroma1.it/en/pagina/applying-sapienza-international-student",
  },
  "University of Bologna": {
    rounds: [],
    confirmed: false,
    window:
      "Each programme publishes its own call for international applicants (often spring); the visa pre-enrolment window is separate. Check the official page.",
    source:
      "https://www.unibo.it/en/study/incoming-outgoing-international-mobility/you-are-an-international-student-wishing-to-study-at-Unibo",
  },
  "University of Padova": {
    rounds: [],
    confirmed: false,
    window:
      "International application windows are set per programme (often winter–spring). Check the official page.",
    source: "https://www.unipd.it/en/how-apply",
  },
  "University of Milan": {
    rounds: [],
    confirmed: false,
    window:
      "International enrolment windows are set per programme. Check the official page.",
    source:
      "https://www.unimi.it/en/international/coming-abroad/enrol-programme/international-enrolment-degree-programmes",
  },
  "University of Siena": {
    rounds: [],
    confirmed: false,
    window:
      "International applications run through Siena's own portal (typically spring); decisions in ~1 month. Check the official page.",
    source: "https://admission.unisi.it/",
  },
  "University of Messina": {
    rounds: [],
    confirmed: false,
    window:
      "Extra-UE application windows are set per programme. Check the official international-admissions page.",
    source: "https://international.unime.it/study-us/application-and-admission",
  },
  "University of Cassino": {
    rounds: [],
    confirmed: false,
    window:
      "International application windows are set per programme. Check the official page.",
    source: "https://www.unicas.it/",
  },

  // ── South Korea (SNU + KAIST verified; others run rolling/varying rounds) ────
  "Seoul National University": {
    rounds: [{ label: "Autumn-intake application", month: 3, day: 5 }],
    confirmed: true,
    window: "SNU runs a single early-March window for autumn (September) entry.",
    source: "https://en.snu.ac.kr/admission",
  },
  KAIST: {
    rounds: [
      { label: "Early admission", month: 10, day: 22 },
      { label: "Regular admission", month: 1, day: 14 },
    ],
    confirmed: true,
    source: "https://admission.kaist.ac.kr/intl-undergraduate/",
  },
  "Yonsei University (UIC)": {
    rounds: [],
    confirmed: false,
    window:
      "UIC admits international students on a rolling basis across ~3 rounds; autumn-entry decisions land by late June. Check the official page.",
    source: "https://uic.yonsei.ac.kr/main/admission.php",
  },
  "Yonsei University": {
    rounds: [],
    confirmed: false,
    window:
      "International admission runs in rounds that vary by track. Check the official page.",
    source: "https://oia.yonsei.ac.kr/intstd/appPro.asp",
  },
  "Korea University": {
    rounds: [],
    confirmed: false,
    window:
      "International admission for autumn entry runs in rounds. Check the official application guide.",
    source: "https://oia.korea.ac.kr/oia/under/admission.do",
  },
  "Sungkyunkwan University": {
    rounds: [],
    confirmed: false,
    window:
      "International admission runs in rounds that vary by intake. Check the official page.",
    source: "https://admission-global.skku.edu/eng/undergraduate.html",
  },
  "Hanyang University": {
    rounds: [],
    confirmed: false,
    window:
      "International admission runs in rounds that vary by intake. Check the official page.",
    source: "https://www.hanyang.ac.kr/web/eng/international-admissions",
  },
  "Kyung Hee University": {
    rounds: [],
    confirmed: false,
    window:
      "International admission runs in rounds that vary by intake. Check the official page.",
    source:
      "https://iadmission.khu.ac.kr/gglobalcenter/user/contents/view.do?menuNo=8000031",
  },

  // ── United Arab Emirates (NYUAD = US-style dates; Khalifa verified; others
  // largely rolling) ──────────────────────────────────────────────────────────
  "NYU Abu Dhabi": {
    rounds: [
      { label: "Early Decision", month: 11, day: 1 },
      { label: "Regular Decision", month: 1, day: 5 },
    ],
    confirmed: true,
    window: "US-style holistic review via the Common App.",
    source: "https://nyuad.nyu.edu/en/admissions/undergraduate.html",
  },
  "Khalifa University": {
    // Downgraded: could not re-verify a specific day from a current official page
    // (the FAQ was stale), so we won't assert a countdown.
    rounds: [],
    confirmed: false,
    window:
      "A single published deadline each cycle (not rolling). Confirm the current date on the official admissions page.",
    source: "https://www.ku.ac.ae/undergraduate-admissions",
  },
  "American University of Sharjah": {
    rounds: [],
    confirmed: false,
    rolling: true,
    window: "Rolling admission. Apply as early as you can; check the official page.",
    source: "https://www.aus.edu/admissions/undergraduate-admissions",
  },
  "UAE University": {
    rounds: [],
    confirmed: false,
    rolling: true,
    window: "Rolling admission with intake windows. Check the official page.",
    source: "https://www.uaeu.ac.ae/en/admission/",
  },
  "Zayed University": {
    rounds: [],
    confirmed: false,
    rolling: true,
    window: "Rolling admission with intake windows. Check the official page.",
    source: "https://www.zu.ac.ae/main/en/admission/index.aspx",
  },
  "Mohammed Bin Rashid University": {
    rounds: [],
    confirmed: false,
    window:
      "Medicine/health admission runs on its own timeline. Check the official page.",
    source: "https://www.mbru.ac.ae/admission/",
  },
};

export type ResolvedUniversityDeadline = {
  university: string;
  confirmed: boolean;
  rolling: boolean;
  window: string | null;
  source: string;
  // Dated rounds resolved to the student's cycle (only when confirmed).
  rounds: { label: string; iso: string; daysLeft: number }[];
};

const pad = (n: number) => String(n).padStart(2, "0");

// "Class of G" enrols in the autumn of G, applying the season before: Aug–Dec
// deadlines fall in year G-1, Jan–Jul deadlines in year G (same convention as
// app-deadlines.ts / key-dates.ts). With no graduation year, assume the coming
// autumn.
function cycleFallYear(today: Date, graduationYear?: number): number {
  if (graduationYear && Number.isFinite(graduationYear)) return graduationYear - 1;
  return today.getUTCFullYear();
}

/**
 * Resolve a university's international deadlines to the student's cycle. Returns
 * null when we have no entry for that university at all (the Roadmap then shows a
 * country-level "check the official page" note). When `confirmed` is false the
 * `rounds` array is empty and the caller must show `window` + `source` instead
 * of a countdown.
 */
export function resolveUniversityDeadlines(
  university: string,
  today: Date,
  graduationYear?: number
): ResolvedUniversityDeadline | null {
  const entry = INTL_DEADLINES[university];
  if (!entry) return null;
  const fall = cycleFallYear(today, graduationYear);
  const rounds = entry.confirmed
    ? entry.rounds
        .map((r) => {
          const year = r.month >= 8 ? fall : fall + 1;
          const iso = `${year}-${pad(r.month)}-${pad(r.day)}`;
          return { label: r.label, iso, daysLeft: daysBetween(today, iso) };
        })
        .sort((a, b) => (a.iso < b.iso ? -1 : a.iso > b.iso ? 1 : 0))
    : [];
  return {
    university,
    confirmed: entry.confirmed,
    rolling: entry.rolling ?? false,
    window: entry.window ?? null,
    source: entry.source,
    rounds,
  };
}
