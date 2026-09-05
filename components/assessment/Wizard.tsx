"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import { AnimatePresence, motion, type Variants } from "framer-motion";
import { MotionSafe } from "@/components/ui/MotionSafe";
import { Button } from "@/components/ui/Button";
import {
  ASSESSMENT_QUESTIONS,
  calculateBlueprint,
  type AssessmentAnswers,
  type BlueprintResult,
} from "./mentorData";
import { SummaryBlueprint } from "./SummaryBlueprint";

const slideVariants: Variants = {
  enter: (direction: number) => ({
    x: direction > 0 ? 36 : -36,
    opacity: 0,
    filter: "blur(4px)",
  }),
  center: {
    x: 0,
    opacity: 1,
    filter: "blur(0px)",
    transition: {
      x: { type: "spring", stiffness: 320, damping: 30 },
      opacity: { duration: 0.22, ease: [0.22, 1, 0.36, 1] },
      filter: { duration: 0.22 },
    },
  },
  exit: (direction: number) => ({
    x: direction > 0 ? -36 : 36,
    opacity: 0,
    filter: "blur(4px)",
    transition: {
      x: { type: "spring", stiffness: 320, damping: 30 },
      opacity: { duration: 0.18, ease: [0.22, 1, 0.36, 1] },
      filter: { duration: 0.18 },
    },
  }),
};

const STORAGE_KEY = "compass_assessment_draft";

export function Wizard() {
  const [stepIndex, setStepIndex] = useState(0);
  const [direction, setDirection] = useState(1);
  const [answers, setAnswers] = useState<AssessmentAnswers>({
    grade: null,
    interests: [],
    struggle: null,
    ambition: null,
  });
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [blueprint, setBlueprint] = useState<BlueprintResult | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Clear any pending calculation timers on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, []);

  // Restore draft if present with defensive validation
  useEffect(() => {
    try {
      const saved = sessionStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        const restored = parsed?.answers;
        if (restored && typeof restored === "object") {
          setAnswers({
            grade: typeof restored.grade === "string" ? restored.grade : null,
            interests: Array.isArray(restored.interests)
              ? restored.interests.filter((item: unknown): item is string => typeof item === "string")
              : [],
            struggle: typeof restored.struggle === "string" ? restored.struggle : null,
            ambition: typeof restored.ambition === "string" ? restored.ambition : null,
          });
        }
      }
    } catch {
      // Ignore storage errors in restricted contexts
    }
  }, []);

  // Save draft whenever answers change
  useEffect(() => {
    try {
      sessionStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ answers, stepIndex })
      );
    } catch {
      // Ignore storage errors
    }
  }, [answers, stepIndex]);

  const totalSteps = ASSESSMENT_QUESTIONS.length;
  const currentQ = ASSESSMENT_QUESTIONS[stepIndex];

  const canProceed = useMemo(() => {
    if (!currentQ) return false;
    if (currentQ.id === "grade") return answers.grade !== null;
    if (currentQ.id === "interests") return answers.interests.length > 0;
    if (currentQ.id === "struggle") return answers.struggle !== null;
    if (currentQ.id === "ambition") return answers.ambition !== null;
    return false;
  }, [currentQ, answers]);

  const handleSelectOption = (optionId: string) => {
    if (currentQ.multiSelect) {
      setAnswers((prev) => {
        const list = Array.isArray(prev.interests) ? prev.interests : [];
        const exists = list.includes(optionId);
        let next: string[];
        if (exists) {
          next = list.filter((id) => id !== optionId);
        } else if (list.length < (currentQ.maxSelect ?? 3)) {
          next = [...list, optionId];
        } else {
          // Replace oldest if already at maximum
          next = [...list.slice(1), optionId];
        }
        return { ...prev, interests: next };
      });
    } else {
      setAnswers((prev) => ({ ...prev, [currentQ.id]: optionId }));
    }
  };

  const nextStep = () => {
    if (stepIndex < totalSteps - 1) {
      setDirection(1);
      setStepIndex((s) => s + 1);
    } else {
      // Trigger 1.2s mentor calculation pulse
      setIsAnalyzing(true);
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
      timerRef.current = setTimeout(() => {
        const result = calculateBlueprint(answers);
        setBlueprint(result);
        setIsAnalyzing(false);
      }, 1200);
    }
  };

  const prevStep = () => {
    if (stepIndex > 0) {
      setDirection(-1);
      setStepIndex((s) => s - 1);
    }
  };

  const handleRetake = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
    try {
      sessionStorage.removeItem(STORAGE_KEY);
    } catch {
      // Ignore storage errors
    }
    setBlueprint(null);
    setAnswers({ grade: null, interests: [], struggle: null, ambition: null });
    setDirection(-1);
    setStepIndex(0);
  };

  if (blueprint) {
    return (
      <div className="rounded-2xl border border-line/80 bg-card/90 p-6 sm:p-10 shadow-lift backdrop-blur-xl">
        <SummaryBlueprint
          blueprint={blueprint}
          onRetake={handleRetake}
        />
      </div>
    );
  }

  if (isAnalyzing) {
    return (
      <div className="rounded-2xl border border-line/80 bg-card/90 p-8 sm:p-12 shadow-lift backdrop-blur-xl text-center space-y-6">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border border-accent/30 bg-accent-soft/50 text-accent-ink animate-pulse">
          <svg
            className="h-8 w-8 animate-spin"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
          </svg>
        </div>
        <div className="space-y-2 max-w-md mx-auto">
          <h2 className="text-xl sm:text-2xl font-semibold text-ink">
            Synthesizing your mentor blueprint...
          </h2>
          <p className="text-sm text-ink-soft leading-relaxed">
            Matching your timeline against 170+ verified competitions, deadlines, and debt-free university pathways.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-line/80 bg-card/90 p-6 sm:p-10 shadow-lift backdrop-blur-xl space-y-6">
      {/* Mentor Header & Progress */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="inline-flex items-center gap-2 rounded-full border border-accent/25 bg-accent-soft/40 px-3 py-1 text-xs font-medium text-accent-ink">
            <span className="h-2 w-2 rounded-full bg-accent animate-pulse" aria-hidden="true" />
            Mentor Conversation
          </div>
          <span className="text-xs font-medium text-ink-faint">
            Question {stepIndex + 1} of {totalSteps}
          </span>
        </div>

        {/* Accessible Progress Bar */}
        <div
          role="progressbar"
          aria-valuenow={stepIndex + 1}
          aria-valuemin={1}
          aria-valuemax={totalSteps}
          aria-label="Assessment progress"
          className="h-1.5 w-full overflow-hidden rounded-full bg-line/70"
        >
          <motion.div
            className="h-full rounded-full bg-accent"
            initial={{ width: 0 }}
            animate={{ width: `${((stepIndex + 1) / totalSteps) * 100}%` }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
          />
        </div>
      </div>

      {/* Animated Question Stage */}
      <MotionSafe>
        <div className="relative overflow-hidden min-h-[360px]">
          <AnimatePresence mode="wait" custom={direction} initial={false}>
            <motion.div
              key={currentQ.id}
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              className="space-y-6"
            >
              <div>
                <h2 className="text-xl sm:text-2xl font-semibold tracking-tight text-ink">
                  {currentQ.prompt}
                </h2>
                <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-sm text-ink-soft">
                  <p className="leading-relaxed">{currentQ.subtitle}</p>
                  {currentQ.multiSelect && (
                    <span className="shrink-0 text-xs font-medium text-accent-ink">
                      Selected: {answers.interests.length} of {currentQ.maxSelect ?? 3}
                    </span>
                  )}
                </div>
              </div>

              {/* Options Grid */}
              <div
                className={`grid gap-3 ${
                  currentQ.options.length > 4 ? "sm:grid-cols-2" : "grid-cols-1"
                }`}
              >
                {currentQ.options.map((opt) => {
                  const isSelected = currentQ.multiSelect
                    ? answers.interests.includes(opt.id)
                    : answers[currentQ.id as keyof AssessmentAnswers] === opt.id;

                  return (
                    <button
                      key={opt.id}
                      type="button"
                      aria-pressed={isSelected}
                      onClick={() => handleSelectOption(opt.id)}
                      className={`flex items-start gap-3.5 rounded-xl border p-4 text-left transition-[background-color,border-color,box-shadow,transform] duration-200 focus-visible:focus-ring active:scale-[0.99] min-h-[52px] ${
                        isSelected
                          ? "border-accent bg-accent-soft/40 shadow-sm"
                          : "border-line bg-card/60 hover:border-accent/40 hover:bg-surface/50"
                      }`}
                    >
                      <span
                        className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border text-xs font-semibold transition-colors ${
                          isSelected
                            ? "border-accent bg-accent text-white"
                            : "border-line text-transparent"
                        }`}
                        aria-hidden="true"
                      >
                        <svg
                          className="h-3 w-3"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="3"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      </span>
                      <div className="space-y-0.5">
                        <p className="text-sm font-medium text-ink leading-snug">
                          {opt.title}
                        </p>
                        {opt.hint && (
                          <p className="text-xs text-ink-soft leading-normal">
                            {opt.hint}
                          </p>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </MotionSafe>

      {/* Navigation Controls */}
      <div className="flex items-center justify-between border-t border-line/60 pt-5">
        {stepIndex > 0 ? (
          <Button variant="ghost" size="sm" onClick={prevStep}>
            ← Back
          </Button>
        ) : (
          <div />
        )}

        <Button
          variant="primary"
          size="md"
          disabled={!canProceed}
          onClick={nextStep}
          className="ml-auto"
        >
          {stepIndex === totalSteps - 1 ? "Synthesize Blueprint →" : "Continue →"}
        </Button>
      </div>
    </div>
  );
}
