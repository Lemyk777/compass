"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  useTransition,
} from "react";
import type { StudentProfileInput } from "@/lib/types";
import { emptyProfile } from "@/lib/types";
import type { OnboardingContextValue } from "../types";
import { saveProfile as saveProfileAction } from "@/app/onboarding/actions";

const OnboardingContext = createContext<OnboardingContextValue | undefined>(undefined);

// Onboarding is a long (8–11 step) form whose state lives only in memory and is
// written to the DB once, at the final "Review → Submit". An interrupted session
// (closed tab, dead battery, tab-switch to look up a score) used to wipe every
// answer — a major silent drop-off for first-time signups. We mirror the working
// answers into localStorage so a returning user resumes instead of starting over.
const DRAFT_KEY = "compass:onboarding:draft:v1";

export function OnboardingContextProvider({
  children,
  initial,
  showSurvey = false,
  hasSavedProfile = false,
}: {
  children: React.ReactNode;
  initial?: StudentProfileInput | null;
  showSurvey?: boolean;
  hasSavedProfile?: boolean;
}) {
  const [data, setData] = useState<StudentProfileInput>(initial ?? emptyProfile());
  const [errors, setErrors] = useState<Record<string, string> | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Draft autosave targets the at-risk flow only: first-time onboarding, where
  // the DB holds nothing yet. Users with a saved profile read from the DB, so a
  // stale local draft must never shadow it.
  const draftEnabled = !hasSavedProfile;

  // Restore a saved draft once, on mount.
  const restoredRef = useRef(false);
  useEffect(() => {
    if (restoredRef.current) return;
    restoredRef.current = true;
    if (!draftEnabled) return;
    try {
      const raw = window.localStorage.getItem(DRAFT_KEY);
      if (raw) setData(JSON.parse(raw) as StudentProfileInput);
    } catch {
      // Corrupt JSON or storage blocked (private mode) — just start fresh.
    }
  }, [draftEnabled]);

  // Persist the draft as the user fills the form. Skip the first commit so the
  // empty initial state can't overwrite a draft we're about to restore.
  const skipFirstWrite = useRef(true);
  useEffect(() => {
    if (!draftEnabled) return;
    if (skipFirstWrite.current) {
      skipFirstWrite.current = false;
      return;
    }
    try {
      window.localStorage.setItem(DRAFT_KEY, JSON.stringify(data));
    } catch {
      // Storage full or unavailable — autosave is best-effort, never fatal.
    }
  }, [data, draftEnabled]);

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
      // Profile is now persisted server-side — drop the local draft so a later
      // visit edits the saved profile, not a stale copy.
      try {
        window.localStorage.removeItem(DRAFT_KEY);
      } catch {
        // Non-fatal — the draft is ignored anyway once a saved profile exists.
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
        showSurvey,
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
