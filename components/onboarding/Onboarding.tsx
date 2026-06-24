"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Logo } from "@/components/ui/Logo";
import { Button, ButtonLink } from "@/components/ui/Button";
import { LanguageToggle } from "@/components/ui/LanguageToggle";
import { useT } from "@/lib/i18n/client";
import type { StudentProfileInput } from "@/lib/types";

import { OnboardingContextProvider, useOnboardingContext } from "./context/OnboardingContext";
import { useOnboardingWizard } from "./hooks/useOnboardingWizard";
import { STEP_REGISTRY } from "./registry";

function OnboardingWizard({ hasAnalysis }: { hasAnalysis: boolean }) {
  const t = useT();
  const router = useRouter();
  const { data, errors, isSaving, updateField, updateFields, saveProfile } = useOnboardingContext();
  const { stepIndex, steps, stepKey, isFirst, isLast, next, back, goToKey } = useOnboardingWizard();

  const [prevIndex, setPrevIndex] = useState(0);
  const [direction, setDirection] = useState(1);

  if (stepIndex !== prevIndex) {
    setDirection(stepIndex > prevIndex ? 1 : -1);
    setPrevIndex(stepIndex);
  }

  const stepMeta = STEP_REGISTRY[stepKey];
  const StepComponent = stepMeta?.component;

  const handleNext = () => {
    next();
  };

  const handleBack = () => {
    back();
  };

  const handleSubmit = async () => {
    const res = await saveProfile();
    if (res.ok) {
      router.push("/dashboard?analyze=1");
    }
  };

  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col px-5 pb-8">
      <header className="flex items-center justify-between py-5">
        <Logo className="text-ink" />
        <div className="flex items-center gap-1.5">
          <LanguageToggle />
          <ButtonLink href="/ambassador" variant="ghost" size="sm">
            {t("common.areYouAmbassador")}
          </ButtonLink>
        </div>
      </header>

      {/* Progress */}
      <div className="mb-1.5 flex justify-end">
        <span data-num className="text-xs text-ink-faint">
          {t("ob.step")} {stepIndex + 1} {t("ob.of")} {steps.length}
        </span>
      </div>
      <div className="mb-6 flex gap-1.5" aria-hidden="true">
        {steps.map((_, i) => (
          <div
            key={i}
            className={`h-1.5 flex-1 rounded-full transition-colors ${
              i <= stepIndex ? "bg-accent" : "bg-line"
            }`}
          />
        ))}
      </div>

      <div className="flex-1 relative overflow-x-hidden min-h-[450px]">
        <AnimatePresence mode="wait">
          <motion.div
            key={stepKey}
            initial={{ opacity: 0, x: direction * 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -direction * 20 }}
            transition={{ duration: 0.22, ease: "easeInOut" }}
          >
            {stepMeta && (
              <>
                <h1 className="text-2xl font-semibold tracking-tight text-ink">
                  {t(stepMeta.titleKey)}
                </h1>
                <p className="mb-6 mt-1 text-sm text-ink-soft">
                  {t(stepMeta.subKey)}
                </p>
                {StepComponent && (
                  <StepComponent
                    data={data}
                    updateField={updateField}
                    updateFields={updateFields}
                    goToKey={goToKey}
                  />
                )}
              </>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {errors?.global && (
        <p role="alert" className="mt-4 rounded-lg bg-reach-soft px-3 py-2 text-sm text-reach">
          {errors.global}
        </p>
      )}

      <div className="sticky bottom-0 mt-6 flex gap-3 bg-surface py-4">
        {!isFirst && (
          <Button variant="subtle" size="lg" onClick={handleBack} disabled={isSaving}>
            {t("common.back")}
          </Button>
        )}
        {!isLast ? (
          <Button size="lg" className="flex-1" onClick={handleNext}>
            {t("common.continue")}
          </Button>
        ) : (
          <Button size="lg" className="flex-1" onClick={handleSubmit} disabled={isSaving}>
            {isSaving
              ? t("ob.saving")
              : hasAnalysis
                ? t("ob.saveReanalyze")
                : t("ob.seeStanding")}
          </Button>
        )}
      </div>
    </main>
  );
}

export function Onboarding({
  initial,
  hasAnalysis = false,
  showSurvey = false,
}: {
  initial?: StudentProfileInput | null;
  hasAnalysis?: boolean;
  showSurvey?: boolean;
}) {
  return (
    <OnboardingContextProvider initial={initial} showSurvey={showSurvey}>
      <OnboardingWizard hasAnalysis={hasAnalysis} />
    </OnboardingContextProvider>
  );
}
