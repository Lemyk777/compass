"use client";

import { useState, useMemo } from "react";
import { useOnboardingContext } from "../context/OnboardingContext";
import type { StepKey } from "../types";
import type { DestinationCode } from "@/lib/data/destinations";
import { stepSchemas } from "../schemas";

export function buildSteps(destinations: DestinationCode[]): StepKey[] {
  const wantsUS = destinations.includes("US");
  const wantsIT = destinations.includes("IT");
  const wantsHK = destinations.includes("HK");
  return [
    // The "how did you hear about us?" survey is no longer a standalone step;
    // it's folded into the first ("origin") step for non-referral signups.
    "origin",
    "destinations",
    "faculties",
    "grades",
    "tests",
    "activities",
    "honors",
    ...(wantsUS ? (["us"] as StepKey[]) : []),
    ...(wantsIT ? (["it"] as StepKey[]) : []),
    ...(wantsHK ? (["hk"] as StepKey[]) : []),
    "review",
  ];
}

export function useOnboardingWizard() {
  const { data, setErrorMsg, clearError } = useOnboardingContext();
  const [stepIndex, setStepIndex] = useState(0);

  const steps = useMemo(() => buildSteps(data.destinations), [data.destinations]);

  // Clamp stepIndex defensively in case the list of steps shrinks dynamically
  const clampedIndex = Math.min(stepIndex, steps.length - 1);
  const stepKey = steps[clampedIndex];
  const isFirst = clampedIndex === 0;
  const isLast = clampedIndex === steps.length - 1;

  const next = (): boolean => {
    const currentStepKey = steps[clampedIndex];
    const schema = stepSchemas[currentStepKey];
    if (schema) {
      // Validate the specific fields of the current step from data
      const parsed = schema.safeParse(data);
      if (!parsed.success) {
        const firstIssue = parsed.error.issues[0];
        setErrorMsg(firstIssue.message);
        return false;
      }
    }

    clearError();
    if (clampedIndex < steps.length - 1) {
      setStepIndex(clampedIndex + 1);
      return true;
    }
    return false;
  };

  const back = () => {
    clearError();
    if (clampedIndex > 0) {
      setStepIndex(clampedIndex - 1);
    }
  };

  const goToKey = (key: StepKey) => {
    clearError();
    const idx = steps.indexOf(key);
    if (idx !== -1) {
      setStepIndex(idx);
    }
  };

  return {
    stepIndex: clampedIndex,
    steps,
    stepKey,
    isFirst,
    isLast,
    next,
    back,
    goToKey,
  };
}
