"use client";

import { useTransitionRouter } from "@/components/ui/ViewTransitions";
import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Logo } from "@/components/ui/Logo";
import { Button, ButtonLink } from "@/components/ui/Button";
import type { StudentProfileInput } from "@/lib/types";
import { logOnboardingStep } from "@/app/onboarding/actions";

import { OnboardingContextProvider, useOnboardingContext } from "./context/OnboardingContext";
import {
  GeneralSection,
  AcademicsSection,
  ActivitiesSection,
  AwardsSection,
  BudgetSection,
} from "./sections";

type SectionDef = {
  key: string;
  label: string;
  title: string;
  sub: string;
  why: string;
  Component: () => JSX.Element;
};

const SECTIONS: SectionDef[] = [
  {
    key: "general",
    label: "General",
    title: "General",
    sub: "Tell us a little bit about yourself",
    why: "This information helps us personalize your recommendations and provide the most accurate admission insights.",
    Component: GeneralSection,
  },
  {
    key: "academics",
    label: "Academics",
    title: "Academics",
    sub: "Your grades and test scores",
    why: "Your academic profile is the single biggest driver of your competitiveness — we score it against real admitted-student data.",
    Component: AcademicsSection,
  },
  {
    key: "activities",
    label: "Activities",
    title: "Activities",
    sub: "What you do outside the classroom",
    why: "Activities show depth, leadership, and commitment — the part of your story that grades alone can't tell.",
    Component: ActivitiesSection,
  },
  {
    key: "awards",
    label: "Awards",
    title: "Awards",
    sub: "Honors and recognitions you've earned",
    why: "Verified awards add credibility to your profile and can lift your standing on competitive lists.",
    Component: AwardsSection,
  },
  {
    key: "budget",
    label: "Budget",
    title: "Budget",
    sub: "What your family can invest each year",
    why: "Affordability shapes which schools are realistic — and lets us factor financial aid into your odds.",
    Component: BudgetSection,
  },
];

function Wizard({
  hasAnalysis,
  basePath,
  preview,
}: {
  hasAnalysis: boolean;
  basePath: string;
  preview: boolean;
}) {
  const router = useTransitionRouter();

  const { isSaving, errors, saveProfile } = useOnboardingContext();
  const [index, setIndex] = useState(0);
  const [dir, setDir] = useState(1);

  const section = SECTIONS[index];
  const isFirst = index === 0;
  const isLast = index === SECTIONS.length - 1;

  // Funnel instrumentation: record each section the user reaches, once per
  // session, so /admin can see where the drop-off is. Fire-and-forget; never
  // blocks navigation. Skipped in the auth-free preview.
  const loggedSteps = useRef<Set<string>>(new Set());
  useEffect(() => {
    if (preview || loggedSteps.current.has(section.key)) return;
    loggedSteps.current.add(section.key);
    void logOnboardingStep(section.key).catch(() => {});
  }, [section.key, preview]);

  const go = (next: number) => {
    setDir(next > index ? 1 : -1);
    setIndex(Math.max(0, Math.min(SECTIONS.length - 1, next)));
  };

  const handleSubmit = async () => {
    if (preview) {
      router.push(basePath);
      return;
    }
    const res = await saveProfile();
    if (res.ok) router.push(`${basePath}?analyze=1`);
  };

  return (
    <main className="min-h-dvh bg-surface">
      <header className="border-b border-line">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
          <Logo className="text-ink" style={{ viewTransitionName: "brand-logo" }} />
          <ButtonLink href={basePath} variant="ghost" size="sm">
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="m15 18-6-6 6-6" />
            </svg>
            Dashboard
          </ButtonLink>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-6 py-8">
        <h1 className="text-4xl font-semibold tracking-tight text-ink">Build Your Profile</h1>

        {/* Step pills */}
        <div className="mt-6 flex flex-wrap gap-3 border-b border-line pb-6">
          {SECTIONS.map((s, i) => {
            const active = i === index;
            const done = i < index;
            return (
              <button
                key={s.key}
                type="button"
                onClick={() => go(i)}
                className={`flex items-center gap-2.5 rounded-full border px-4 py-2 text-sm font-medium transition-colors ${
                  active
                    ? "border-accent bg-accent-soft text-accent-ink"
                    : "border-line bg-card text-ink-soft hover:border-ink/20"
                }`}
              >
                <span
                  className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${
                    active
                      ? "bg-accent text-white"
                      : done
                        ? "bg-accent/15 text-accent"
                        : "bg-line text-ink-faint"
                  }`}
                >
                  {i + 1}
                </span>
                {s.label}
              </button>
            );
          })}
        </div>

        {/* Body: form (left) + "why this matters" aside (right) */}
        <div className="mt-8 grid gap-10 lg:grid-cols-[1fr_300px]">
          <div className="min-w-0">
            <h2 className="text-2xl font-semibold tracking-tight text-ink">{section.title}</h2>
            <p className="mb-7 mt-1 text-sm text-ink-soft">{section.sub}</p>
            <motion.div
              key={section.key}
              initial={{ opacity: 0, x: dir * 16 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.2, ease: "easeInOut" }}
            >
              <section.Component />
            </motion.div>
          </div>

          <aside className="hidden lg:block lg:border-l lg:border-line lg:pl-8">
            <WhyIllustration />
            <h3 className="mt-6 text-lg font-semibold tracking-tight text-ink">
              Why this matters?
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-ink-soft">{section.why}</p>
          </aside>
        </div>

        {errors?.global && (
          <p role="alert" className="mt-6 max-w-xl rounded-lg bg-reach-soft px-3 py-2 text-sm text-reach">
            {errors.global}
          </p>
        )}

        {/* Nav */}
        <div className="mt-10 flex gap-3">
          {!isFirst && (
            <Button variant="subtle" size="lg" onClick={() => go(index - 1)} disabled={isSaving}>
              Back
            </Button>
          )}
          {!isLast ? (
            <Button size="lg" onClick={() => go(index + 1)}>
              Continue
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 12h14M13 6l6 6-6 6" />
              </svg>
            </Button>
          ) : (
            <Button size="lg" onClick={handleSubmit} disabled={isSaving}>
              {isSaving ? "Saving…" : preview ? "Submit" : hasAnalysis ? "Save & re-analyze" : "See my standing"}
            </Button>
          )}
        </div>
      </div>
    </main>
  );
}

function WhyIllustration() {
  return (
    <svg viewBox="0 0 200 150" className="w-full max-w-[220px]" fill="none" aria-hidden="true">
      <rect x="58" y="22" width="84" height="106" rx="10" fill="var(--accent-soft)" />
      <rect x="58" y="22" width="84" height="106" rx="10" stroke="var(--accent)" strokeOpacity="0.3" />
      <rect x="84" y="14" width="32" height="16" rx="6" fill="var(--card)" stroke="var(--accent)" strokeOpacity="0.4" />
      <circle cx="100" cy="55" r="11" fill="var(--card)" stroke="var(--accent)" strokeWidth="2" />
      <circle cx="100" cy="51" r="4" fill="var(--accent)" />
      <path d="M92 62c2-3 14-3 16 0" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round" />
      <rect x="72" y="82" width="56" height="6" rx="3" fill="var(--accent)" fillOpacity="0.35" />
      <rect x="72" y="96" width="40" height="6" rx="3" fill="var(--accent)" fillOpacity="0.25" />
      <rect x="72" y="110" width="48" height="6" rx="3" fill="var(--accent)" fillOpacity="0.25" />
      <path d="M150 96l24 24m-24 0 24-24" stroke="var(--accent)" strokeWidth="3" strokeLinecap="round" transform="translate(2 -6) rotate(45 162 108)" />
    </svg>
  );
}

export function Onboarding({
  initial,
  hasAnalysis = false,
  showSurvey = false,
  hasSavedProfile = false,
  basePath = "/dashboard",
  preview = false,
}: {
  initial?: StudentProfileInput | null;
  hasAnalysis?: boolean;
  showSurvey?: boolean;
  hasSavedProfile?: boolean;
  basePath?: string;
  preview?: boolean;
}) {
  return (
    <OnboardingContextProvider
      initial={initial}
      showSurvey={showSurvey}
      hasSavedProfile={hasSavedProfile}
    >
      <Wizard hasAnalysis={hasAnalysis} basePath={basePath} preview={preview} />
    </OnboardingContextProvider>
  );
}
