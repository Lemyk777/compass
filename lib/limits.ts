// Input bounds — the single source of truth for how big a profile may get.
//
// The Activities / Honors caps and per-field character limits mirror the
// Common Application exactly. Enforced in THREE places so an oversized profile
// can never reach the model (the root cause of analysis timeouts / truncation):
//   1. the intake Zod schema (app/onboarding/actions.ts) — rejects on save,
//   2. the onboarding UI (components/onboarding/Onboarding.tsx) — caps as you type,
//   3. the model-input builder (lib/ai/analyze.ts) — final defensive trim.
export const LIMITS = {
  // Common App: up to 10 activities, up to 5 honors.
  activities: 10,
  honors: 5,
  // Common App activity character limits.
  activityPosition: 50,
  activityOrganization: 100,
  activityDescription: 150,
  // Common App honor character limit.
  honorTitle: 100,
  // Sanity caps for the numeric activity fields.
  hoursPerWeek: 168,
  weeksPerYear: 52,
  // Other free-text fields.
  grades: 600,
  subjects: 400,
  shortText: 80, // country / citizenship / intended major
  targetSchools: 12,
  // Italy / Hong Kong / UAE / Korea program lists (built per-country in the dashboard).
  italyPrograms: 8,
  hkPrograms: 6,
  uaePrograms: 6,
  krPrograms: 6,
  // Country-first intake: destinations applied to, and fields of study.
  destinations: 6,
  faculties: 3,
  // Planner (migration 0028). `plannerItems` is the abuse bound, not a product
  // opinion: a server action is a public HTTP endpoint, and without a ceiling
  // one authenticated request loop fills the table.
  plannerTitle: 120,
  plannerNote: 500,
  plannerItems: 100,
  // Mind maps (migration 0029). `mapNodes` and the depth cap in
  // lib/data/mindmap.ts are also the bound on the LAYOUT — they are what keeps
  // the diagram drawable, not just the table small.
  mapLabel: 80,
  mapNodes: 60,
  maps: 12,
} as const;
