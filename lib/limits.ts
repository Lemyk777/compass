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
} as const;
