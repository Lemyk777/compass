// Country content registry — the single source of truth for "what does an
// Analysis carry for each destination country, and how do I read it".
//
// Before this existed, every consumer (the odds page, the costs page, the
// dashboard tabs, the roadmap) hardcoded its own 4–5-way per-country switch on
// `analysis.italy_programs` / `hk_programs` / `uae_programs` / `kr_programs`.
// Adding a country meant editing all of them. Now they iterate this registry, so
// a new deterministic country is one entry here (plus its data + engine + view).
//
// This module is intentionally free of React and of the heavy analysis engines,
// so both server code and client components can import it.

import type { Analysis } from "@/lib/ai/schema";
import type { DestinationCode } from "@/lib/data/destinations";

// The Analysis fields that hold a deterministic country's per-program analyses.
// Keep in sync with the optional `*_programs` fields on analysisSchema.
export type ProgramsKey =
  | "italy_programs"
  | "hk_programs"
  | "uae_programs"
  | "kr_programs";

export type CountryContent = {
  code: DestinationCode;
  /** The Analysis field holding this country's analyzed programs (US has none — it uses `schools`). */
  programsKey?: ProgramsKey;
  /** How many analyzed items this country has (0 = its college list isn't built yet). */
  count(a: Analysis): number;
  /** Distinct target university names — the roadmap resolves each one's real deadline. */
  universities(a: Analysis): string[];
};

// Order is canonical display order (US first, then the deterministic countries in
// the order they were launched).
export const COUNTRY_CONTENT: CountryContent[] = [
  {
    code: "US",
    count: (a) => a.schools.length,
    universities: (a) => a.schools.map((s) => s.name),
  },
  {
    code: "IT",
    programsKey: "italy_programs",
    count: (a) => a.italy_programs?.length ?? 0,
    universities: (a) => (a.italy_programs ?? []).map((p) => p.university),
  },
  {
    code: "HK",
    programsKey: "hk_programs",
    count: (a) => a.hk_programs?.length ?? 0,
    universities: (a) => (a.hk_programs ?? []).map((p) => p.university),
  },
  {
    code: "AE",
    programsKey: "uae_programs",
    count: (a) => a.uae_programs?.length ?? 0,
    universities: (a) => (a.uae_programs ?? []).map((p) => p.university),
  },
  {
    code: "KR",
    programsKey: "kr_programs",
    count: (a) => a.kr_programs?.length ?? 0,
    universities: (a) => (a.kr_programs ?? []).map((p) => p.university),
  },
];

const byCode = new Map(COUNTRY_CONTENT.map((c) => [c.code, c]));

/** Whether the analysis already carries content for a country (its list is built). */
export function analysisHasCountry(a: Analysis, code: DestinationCode): boolean {
  return (byCode.get(code)?.count(a) ?? 0) > 0;
}

/** Whether the student has built a college list for ANY country yet. */
export function hasAnyCollegeList(a: Analysis): boolean {
  return COUNTRY_CONTENT.some((c) => c.count(a) > 0);
}
