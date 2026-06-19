// Shared types for the student profile (intake) and analysis I/O.
// Reused on both client and server — keep this the single source of truth.
//
// The Activities and Honors sections mirror the Common Application 1:1
// (field set, options, and character limits live in lib/limits.ts).

export const CURRICULA = [
  { value: "IB", label: "International Baccalaureate (IB)" },
  { value: "A-Level", label: "A-Levels" },
  { value: "national", label: "National / local curriculum" },
  { value: "US-GPA", label: "US high school (GPA)" },
  { value: "other", label: "Other" },
] as const;

export type Curriculum = (typeof CURRICULA)[number]["value"];

// --- Common App: Activities -------------------------------------------------

/** Common App activity-type categories (shown as a dropdown, stored as-is). */
export const ACTIVITY_TYPES = [
  "Academic",
  "Art",
  "Athletics: Club",
  "Athletics: JV/Varsity",
  "Career-Oriented",
  "Community Service (Volunteer)",
  "Computer/Technology",
  "Cultural",
  "Dance",
  "Debate/Speech",
  "Environmental",
  "Family Responsibilities",
  "Foreign Exchange",
  "Internship",
  "Journalism/Publication",
  "Junior R.O.T.C.",
  "LGBT",
  "Music: Instrumental",
  "Music: Vocal",
  "Religious",
  "Research",
  "Robotics",
  "School Spirit",
  "Science/Math",
  "Social Justice",
  "Student Govt./Politics",
  "Theater/Drama",
  "Work (Paid)",
  "Other Club/Activity",
] as const;
export type ActivityType = (typeof ACTIVITY_TYPES)[number];

/** Grade levels (Common App allows marking several per activity/honor). */
export const GRADE_LEVELS = ["9", "10", "11", "12", "PG"] as const;
export type GradeLevel = (typeof GRADE_LEVELS)[number];

/** When the activity happens (Common App: multiple allowed). */
export const ACTIVITY_TIMING = ["School year", "School break", "All year"] as const;
export type ActivityTiming = (typeof ACTIVITY_TIMING)[number];

export type Activity = {
  type?: string; // one of ACTIVITY_TYPES
  position: string; // "Position/Leadership description", max 50
  organization?: string; // max 100
  description?: string; // max 150
  grades?: string[]; // subset of GRADE_LEVELS
  timing?: string[]; // subset of ACTIVITY_TIMING
  hours_per_week?: number;
  weeks_per_year?: number;
  continue_in_college?: boolean;
};

// --- Common App: Honors -----------------------------------------------------

/** Level of recognition (Common App: multiple allowed). */
export const HONOR_LEVELS = [
  "School",
  "State/Regional",
  "National",
  "International",
] as const;
export type HonorLevel = (typeof HONOR_LEVELS)[number];

export type Honor = {
  title: string; // max 100
  grades?: string[]; // subset of GRADE_LEVELS
  levels?: string[]; // subset of HONOR_LEVELS
};

// --- Grades / tests ---------------------------------------------------------

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
  honors: Honor[];
  target_schools: string[];   // US university names
  intended_major: string;
  citizenship: string;
  needs_aid: boolean;
  // Italy module — only active when include_italy is true.
  include_italy: boolean;
  italy_programs: string[];   // Italian program IDs from the dataset
  italy_family_income?: number; // Annual family income in EUR (for DSU scholarship estimate)
};

export function emptyActivity(): Activity {
  return { type: "", position: "", organization: "", description: "" };
}

export function emptyHonor(): Honor {
  return { title: "", grades: [], levels: [] };
}

export function emptyProfile(): StudentProfileInput {
  return {
    country: "",
    curriculum: "",
    grades: { raw: "" },
    tests: {},
    activities: [emptyActivity()],
    honors: [],
    target_schools: [],
    intended_major: "",
    citizenship: "",
    needs_aid: false,
    include_italy: false,
    italy_programs: [],
    italy_family_income: undefined,
  };
}

/**
 * Normalize activities loaded from the DB. Older rows used { title, detail };
 * map them onto the Common App shape so existing profiles don't break.
 */
export function normalizeActivities(raw: unknown): Activity[] {
  if (!Array.isArray(raw)) return [emptyActivity()];
  const out = raw.map((a): Activity => {
    const o = (a ?? {}) as Record<string, unknown>;
    const legacyTitle = typeof o.title === "string" ? o.title : "";
    const legacyDetail = typeof o.detail === "string" ? o.detail : "";
    return {
      type: typeof o.type === "string" ? o.type : "",
      position: typeof o.position === "string" ? o.position : legacyTitle,
      organization: typeof o.organization === "string" ? o.organization : "",
      description:
        typeof o.description === "string" ? o.description : legacyDetail,
      grades: Array.isArray(o.grades) ? (o.grades as string[]) : [],
      timing: Array.isArray(o.timing) ? (o.timing as string[]) : [],
      hours_per_week:
        typeof o.hours_per_week === "number" ? o.hours_per_week : undefined,
      weeks_per_year:
        typeof o.weeks_per_year === "number" ? o.weeks_per_year : undefined,
      continue_in_college:
        typeof o.continue_in_college === "boolean"
          ? o.continue_in_college
          : undefined,
    };
  });
  return out.length ? out : [emptyActivity()];
}

/** Normalize honors loaded from the DB (defensive against shape drift). */
export function normalizeHonors(raw: unknown): Honor[] {
  if (!Array.isArray(raw)) return [];
  return raw.map((h): Honor => {
    const o = (h ?? {}) as Record<string, unknown>;
    return {
      title: typeof o.title === "string" ? o.title : "",
      grades: Array.isArray(o.grades) ? (o.grades as string[]) : [],
      levels: Array.isArray(o.levels) ? (o.levels as string[]) : [],
    };
  });
}
