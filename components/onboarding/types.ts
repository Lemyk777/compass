import type { ZodSchema } from "zod";
import type { StudentProfileInput } from "@/lib/types";

export type StepKey =
  | "origin"
  | "destinations"
  | "faculties"
  | "grades"
  | "tests"
  | "activities"
  | "honors"
  | "us"
  | "it"
  | "hk"
  | "review";

export interface StepProps {
  data: StudentProfileInput;
  updateField: <K extends keyof StudentProfileInput>(
    key: K,
    value: StudentProfileInput[K]
  ) => void;
  updateFields: (fields: Partial<StudentProfileInput>) => void;
  goToKey?: (key: StepKey) => void;
}

export interface StepConfig {
  key: StepKey;
  titleKey: string;
  subKey: string;
  schema: ZodSchema;
  component: React.ComponentType<StepProps>;
  shouldShow?: (data: StudentProfileInput) => boolean;
}

export interface OnboardingContextValue {
  data: StudentProfileInput;
  /** Whether to show the "how did you hear about us?" step (non-referral signups). */
  showSurvey: boolean;
  errors: Record<string, string> | null;
  isSaving: boolean;
  updateField: <K extends keyof StudentProfileInput>(
    key: K,
    value: StudentProfileInput[K]
  ) => void;
  updateFields: (fields: Partial<StudentProfileInput>) => void;
  saveProfile: () => Promise<{ ok: boolean; error?: string }>;
  clearError: () => void;
  setErrorMsg: (msg: string | null) => void;
}
