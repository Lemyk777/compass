// Input bounds — the single source of truth for how big a profile may get.
//
// These are enforced in THREE places so an oversized profile can never reach
// the model (the root cause of analysis timeouts / truncated JSON):
//   1. the intake Zod schema (app/onboarding/actions.ts) — rejects on save,
//   2. the onboarding UI (components/onboarding/Onboarding.tsx) — caps as you type,
//   3. the model-input builder (lib/ai/analyze.ts) — final defensive trim.
//
// Keep them generous enough for a real student, tight enough to bound cost and
// generation time.
export const LIMITS = {
  activities: 12, // max number of activities
  activityTitle: 120, // chars per activity title
  activityDetail: 300, // chars per activity detail
  grades: 600, // chars of free-text grades
  subjects: 400, // chars of subjects list
  shortText: 80, // country / citizenship / intended major
  targetSchools: 12, // max target schools
} as const;
