import type { ItalianProgramField } from "@/lib/data/italian-universities";

// Curated faculty / field-of-study taxonomy. The student picks up to
// LIMITS.faculties of these on the intake. Each faculty maps onto the coarse
// `field` used by the Italian dataset so that the chosen faculties can
// pre-filter Italian program suggestions; `itField: null` means we have no
// Italian programs in that field yet (handled gracefully in the UI).

export type FacultyValue =
  | "engineering"
  | "computer_science"
  | "business_economics"
  | "natural_sciences"
  | "humanities_social"
  | "medicine_health"
  | "law"
  | "arts_design";

export type Faculty = {
  value: FacultyValue;
  /** i18n key for the label (see lib/i18n/dictionary.ts → "fac.*"). */
  labelKey: string;
  itField: ItalianProgramField | null;
};

export const FACULTIES: Faculty[] = [
  { value: "engineering", labelKey: "fac.engineering", itField: "engineering" },
  { value: "computer_science", labelKey: "fac.computer_science", itField: "engineering" },
  { value: "business_economics", labelKey: "fac.business_economics", itField: "economics" },
  { value: "natural_sciences", labelKey: "fac.natural_sciences", itField: "science" },
  { value: "humanities_social", labelKey: "fac.humanities_social", itField: "humanities" },
  { value: "medicine_health", labelKey: "fac.medicine_health", itField: null },
  { value: "law", labelKey: "fac.law", itField: null },
  { value: "arts_design", labelKey: "fac.arts_design", itField: null },
];

export const FACULTY_VALUES: FacultyValue[] = FACULTIES.map((f) => f.value);

/** The Italian dataset fields implied by the chosen faculties (deduped). */
export function italianFieldsForFaculties(
  faculties: string[]
): ItalianProgramField[] {
  const set = new Set<ItalianProgramField>();
  for (const v of faculties) {
    const match = FACULTIES.find((f) => f.value === v);
    if (match?.itField) set.add(match.itField);
  }
  return [...set];
}

/** Label key for a faculty value (falls back to undefined for unknowns). */
export function facultyLabelKey(value: string): string | undefined {
  return FACULTIES.find((f) => f.value === value)?.labelKey;
}
