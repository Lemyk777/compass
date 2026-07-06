// Deterministic-country assembly registry.
//
// Each non-US destination is evaluated strictly in code (no AI), and each used to
// have its own near-identical block in assembleAnalysis: "if the student chose
// this country AND picked programs, run its engine and attach the result". That
// pattern is captured once here, so assemble.ts just spreads the outputs and a
// new country is a single entry below.

import { gpaToPercent, type StudentProfileInput } from "@/lib/types";
import type { Analysis } from "@/lib/ai/schema";
import type { DestinationCode } from "@/lib/data/destinations";
import type { ProgramsKey } from "@/lib/data/country-content";
import {
  analyzeItalianPrograms,
  computeFinancialFitScore,
} from "@/lib/ai/italy-analyze";
import { analyzeHkPrograms } from "@/lib/ai/hk-analyze";
import { analyzeUaePrograms } from "@/lib/ai/uae-analyze";
import { analyzeKoreaPrograms } from "@/lib/ai/korea-analyze";

// The slice of an Analysis a deterministic country contributes: its programs
// array plus any country-specific extras (Italy's financial-fit score).
type CountryOutput = Partial<
  Pick<Analysis, ProgramsKey | "italy_financial_fit_score">
>;

// Rough USD→EUR so the onboarding annual budget (USD) can stand in for the
// family-finances input Italy's DSU / scholarship read expects (EUR). A student's
// budget is what the family can pay per year, which is the same signal DSU
// need-assessment keys off — lower budget ⇒ stronger DSU fit.
const USD_TO_EUR = 0.92;

// Most students skip the budget question, so we never want the Italy read to
// break or come back blank. This is a deliberately NEUTRAL fallback: it lands the
// financial-fit score at the mid value (5/10) and DSU at a modest "partial" —
// high enough that we never over-promise need-based aid the student hasn't
// actually shown. A real budget or income always overrides it.
const DEFAULT_ITALY_INCOME_EUR = 45000;

/**
 * The EUR family-finances figure that drives Italy's DSU + financial-fit read.
 * Priority: the precise Italy income → the onboarding budget (converted) → a
 * neutral default. ALWAYS returns a usable, non-negative number, so an empty
 * budget degrades gracefully instead of breaking or leaving the read blank —
 * this is what lets the budget question stay optional.
 */
function italyIncomeEUR(p: StudentProfileInput): number {
  const raw =
    p.italy_family_income ??
    (p.budget_annual_usd != null
      ? p.budget_annual_usd * USD_TO_EUR
      : DEFAULT_ITALY_INCOME_EUR);
  return Math.max(0, Math.round(raw));
}

type DeterministicCountry = {
  code: DestinationCode;
  programsKey: ProgramsKey;
  /** The program ids the student picked for this country. */
  programIds(profile: StudentProfileInput): string[];
  /** Run the country's engine and return its Analysis slice. */
  build(profile: StudentProfileInput): CountryOutput;
};

export const DETERMINISTIC_COUNTRIES: DeterministicCountry[] = [
  {
    code: "IT",
    programsKey: "italy_programs",
    programIds: (p) => p.italy_programs ?? [],
    build: (p) => {
      const income = italyIncomeEUR(p);
      return {
        italy_programs: analyzeItalianPrograms(p.italy_programs ?? [], p.tests?.SAT, income),
        italy_financial_fit_score: computeFinancialFitScore(income, true),
      };
    },
  },
  {
    code: "HK",
    programsKey: "hk_programs",
    programIds: (p) => p.hk_programs ?? [],
    build: (p) => ({
      hk_programs: analyzeHkPrograms(p.hk_programs ?? [], {
        ibTotal: p.grades?.ib_total,
        sat: p.tests?.SAT,
        ielts: p.tests?.IELTS,
        toefl: p.tests?.TOEFL,
        gradeStatus: p.hk_grade_status ?? "predicted",
        activities: p.activities,
        honors: p.honors,
      }),
    }),
  },
  {
    code: "AE",
    programsKey: "uae_programs",
    programIds: (p) => p.uae_programs ?? [],
    build: (p) => ({
      uae_programs: analyzeUaePrograms(p.uae_programs ?? [], {
        sat: p.tests?.SAT,
        gpaPercent:
          p.grades?.gpa != null
            ? gpaToPercent(p.grades.gpa, p.grades.gpa_scale)
            : undefined,
        ielts: p.tests?.IELTS,
        toefl: p.tests?.TOEFL,
        gradeStatus: p.uae_grade_status ?? "predicted",
        activities: p.activities,
        honors: p.honors,
      }),
    }),
  },
  {
    code: "KR",
    programsKey: "kr_programs",
    programIds: (p) => p.kr_programs ?? [],
    build: (p) => ({
      kr_programs: analyzeKoreaPrograms(p.kr_programs ?? [], {
        gpaPercent:
          p.grades?.gpa != null
            ? gpaToPercent(p.grades.gpa, p.grades.gpa_scale)
            : p.grades?.national_percent != null
              ? p.grades.national_percent
              : undefined,
        ibTotal: p.grades?.ib_total,
        sat: p.tests?.SAT,
        topik: p.kr_topik_level,
        ielts: p.tests?.IELTS,
        toefl: p.tests?.TOEFL,
        gradeStatus: p.kr_grade_status ?? "predicted",
        activities: p.activities,
        honors: p.honors,
      }),
    }),
  },
];

/**
 * Run every deterministic country the student actually chose (destination selected
 * AND at least one program picked) and merge their Analysis slices. Countries the
 * student didn't choose contribute nothing, so their `*_programs` fields stay
 * absent — exactly as before.
 */
export function assembleDeterministicCountries(
  profile: StudentProfileInput
): CountryOutput {
  const destinations = profile.destinations ?? [];
  const out: CountryOutput = {};
  for (const country of DETERMINISTIC_COUNTRIES) {
    if (
      destinations.includes(country.code) &&
      country.programIds(profile).length > 0
    ) {
      Object.assign(out, country.build(profile));
    }
  }
  return out;
}
