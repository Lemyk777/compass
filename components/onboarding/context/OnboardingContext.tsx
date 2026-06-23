"use client";

import React, { createContext, useContext, useState, useTransition } from "react";
import type { StudentProfileInput } from "@/lib/types";
import { emptyProfile } from "@/lib/types";
import type { OnboardingContextValue } from "../types";
import { saveProfile as saveProfileAction } from "@/app/onboarding/actions";

const OnboardingContext = createContext<OnboardingContextValue | undefined>(undefined);

export function OnboardingContextProvider({
  children,
  initial,
}: {
  children: React.ReactNode;
  initial?: StudentProfileInput | null;
}) {
  const [data, setData] = useState<StudentProfileInput>(initial ?? emptyProfile());
  const [errors, setErrors] = useState<Record<string, string> | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const updateField = <K extends keyof StudentProfileInput>(
    key: K,
    value: StudentProfileInput[K]
  ) => {
    setData((d) => ({ ...d, [key]: value }));
  };

  const updateFields = (fields: Partial<StudentProfileInput>) => {
    setData((d) => ({ ...d, ...fields }));
  };

  const clearError = () => {
    setErrors(null);
  };

  const setErrorMsg = (msg: string | null) => {
    if (msg === null) {
      setErrors(null);
    } else {
      setErrors({ global: msg });
    }
  };

  const saveProfile = async () => {
    setIsSaving(true);
    setErrors(null);
    try {
      const res = await saveProfileAction(data);
      if (!res.ok) {
        setErrors({ global: res.error || "Could not save your profile." });
        return { ok: false, error: res.error };
      }
      return { ok: true };
    } catch (e: any) {
      const errorMsg = e?.message || "An unexpected error occurred.";
      setErrors({ global: errorMsg });
      return { ok: false, error: errorMsg };
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <OnboardingContext.Provider
      value={{
        data,
        errors,
        isSaving,
        updateField,
        updateFields,
        saveProfile,
        clearError,
        setErrorMsg,
      }}
    >
      {children}
    </OnboardingContext.Provider>
  );
}

export function useOnboardingContext() {
  const ctx = useContext(OnboardingContext);
  if (!ctx) {
    throw new Error("useOnboardingContext must be used within an OnboardingContextProvider");
  }
  return ctx;
}
