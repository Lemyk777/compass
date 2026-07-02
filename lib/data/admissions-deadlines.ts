// Representative international-undergraduate application deadlines, per
// destination country, so the Roadmap can anchor its runway to the EARLIEST
// deadline across the countries a student actually chose — not just the US
// cycle. Dates are computed from the student's graduation year (a "Class of G"
// student enrols in the autumn of year G; the US applies the autumn before,
// while most other systems' main international rounds fall later).
//
// ⚠️ INDICATIVE, VERIFY ANNUALLY. These are representative country-level rounds,
// not per-university dates: selective schools (Bocconi, Politecnico, SNU, KAIST,
// HKU) run earlier and/or rolling rounds, and visa/pre-enrolment windows are
// separate. They are shown in the UI with the same "confirm on the official
// site" disclaimer as the rest of the calendar. The caveat strings below are
// surfaced next to each country's deadline so the student knows to check.

import type { DestinationCode } from "@/lib/data/destinations";

export type AdmissionRound = { round: string; iso: string }; // iso = YYYY-MM-DD

/**
 * Representative application rounds for a country, for a student graduating in
 * `gradYear` (→ enrolling autumn of `gradYear`). US keeps its two well-known
 * rounds; the others carry a single representative main international round.
 */
export function admissionRounds(
  code: DestinationCode,
  gradYear: number
): AdmissionRound[] {
  const G = gradYear;
  switch (code) {
    case "US":
      return [
        { round: "US Early Action / Decision", iso: `${G - 1}-11-01` },
        { round: "US Regular Decision", iso: `${G}-01-05` },
      ];
    case "HK":
      // Non-JUPAS international UG: opens ~Sept (G-1), main round early-mid Jan.
      return [{ round: "Hong Kong main international round", iso: `${G}-01-15` }];
    case "IT":
      // Extra-EU Bando / Universitaly pre-enrolment cluster in spring.
      return [{ round: "Italy Extra-EU / Bando round", iso: `${G}-04-30` }];
    case "AE":
      // Mostly rolling; a representative priority round in late January.
      return [{ round: "UAE priority round", iso: `${G}-01-31` }];
    case "KR":
      // Fall-intake international applications cluster in spring.
      return [{ round: "Korea autumn-intake round", iso: `${G}-05-31` }];
    default:
      // CN / CA not yet analyzed — no deadline model.
      return [];
  }
}

/**
 * A short honesty note per country, shown beside its deadline so a student never
 * treats an indicative representative date as a hard, universal cutoff.
 */
export const DEADLINE_CAVEAT: Partial<Record<DestinationCode, string>> = {
  HK: "Applications open in autumn and many run rolling — apply as early as you can.",
  IT: "Selective schools (Bocconi, Politecnico) run earlier autumn rounds; the visa pre-enrolment window is separate.",
  AE: "Most UAE universities admit on a rolling basis; NYU Abu Dhabi follows the US Early/Regular dates.",
  KR: "There is also a spring intake with deadlines the previous autumn; SNU/KAIST run earlier rounds.",
};
