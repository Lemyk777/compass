import type { StudentProfileInput } from "@/lib/types";

// `StepKey`, `StepProps` and `StepConfig` used to live here: the step-registry
// model of the original onboarding wizard, where each step declared a key, a
// Zod schema and a component. Nothing had referenced them since the intake was
// rebuilt around `sections.tsx`, and they were dead in a way worth noticing —
// `StepKey` listed `"us" | "it" | "hk"` and had no case for the UAE or Korea,
// which have been live destinations for two releases. Dead code does not just
// sit there; it rots, and then somebody revives it and inherits a wrong list.

export interface OnboardingContextValue {
  data: StudentProfileInput;
  /** Whether to show the "how did you hear about us?" step (non-referral signups). */
  showSurvey: boolean;
  errors: Record<string, string> | null;
  isSaving: boolean;
  updateField: <K extends keyof StudentProfileInput>(
    key: K,
    value: StudentProfileInput[K],
  ) => void;
  updateFields: (fields: Partial<StudentProfileInput>) => void;
  saveProfile: () => Promise<{ ok: boolean; error?: string }>;
  clearError: () => void;
  setErrorMsg: (msg: string | null) => void;
}
