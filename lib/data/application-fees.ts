// Application (submission) fees — what it costs just to APPLY, before tuition.
//
// IMPORTANT: these are APPROXIMATE. We don't have a verified per-school fee
// table, and inventing 55 exact figures would be false precision, so US fees
// use a representative default (~$80) with a few notable overrides. The UI
// labels this section "approximate" and tells the student to verify.
//
// Italy: state-university pre-enrollment via Universitaly is free (€0); the real
// cost there is tuition, billed after enrollment (see annual_fee_eur). Private
// universities (e.g. Bocconi) charge an application fee — handled in
// lib/ai/italy-analyze.ts from the program's is_private flag.

export const DEFAULT_US_APPLICATION_FEE = 80; // USD, approximate

const US_FEE_OVERRIDES: Record<string, number> = {
  "Stanford University": 90,
  "University of Southern California": 85,
  "Massachusetts Institute of Technology": 75,
  "University of Michigan, Ann Arbor": 75,
  "Georgetown University": 75,
};

/** Approximate application fee (USD) for a US school, by its dataset name. */
export function usApplicationFee(schoolName: string): number {
  return US_FEE_OVERRIDES[schoolName] ?? DEFAULT_US_APPLICATION_FEE;
}

/** Approximate application fee (EUR) for an Italian program. */
export function italyApplicationFee(isPrivate: boolean): number {
  return isPrivate ? 100 : 0; // state pre-enrollment is free
}
