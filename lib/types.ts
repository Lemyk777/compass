// Shared types for the student profile (intake) and analysis I/O.
// Reused on both client and server — keep this the single source of truth.

export const CURRICULA = [
  { value: "IB", label: "International Baccalaureate (IB)" },
  { value: "A-Level", label: "A-Levels" },
  { value: "national", label: "National / local curriculum" },
  { value: "US-GPA", label: "US high school (GPA)" },
  { value: "other", label: "Other" },
] as const;

export type Curriculum = (typeof CURRICULA)[number]["value"];

export type Activity = {
  title: string;
  detail?: string;
};

export type Grades = {
  /** Free-text the student typed, e.g. "A*A*A (Math, Econ, Business, predicted)". */
  raw: string;
  /** Optional normalized signals by curriculum. */
  ib_total?: number; // out of 45
  gpa?: number; // out of 4.0
  national_percent?: number; // 0–100
};

export type Tests = {
  SAT?: number;
  ACT?: number;
  IELTS?: number;
  TOEFL?: number;
  subjects?: string;
};

export type StudentProfileInput = {
  country: string; // origin country
  curriculum: Curriculum | "";
  grades: Grades;
  tests: Tests;
  activities: Activity[];
  target_schools: string[];
  intended_major: string;
  citizenship: string;
  needs_aid: boolean;
};

export function emptyProfile(): StudentProfileInput {
  return {
    country: "",
    curriculum: "",
    grades: { raw: "" },
    tests: {},
    activities: [{ title: "", detail: "" }],
    target_schools: [],
    intended_major: "",
    citizenship: "",
    needs_aid: false,
  };
}
