"use client";

import { ButtonLink } from "@/components/ui/Button";
import type { BlueprintResult } from "./mentorData";

export function SummaryBlueprint({
  blueprint,
  onRetake,
}: {
  blueprint: BlueprintResult;
  onRetake: () => void;
}) {
  const queryParam = blueprint.matchedFaculties.length
    ? `?faculties=${blueprint.matchedFaculties.join(",")}`
    : "";

  return (
    <div className="space-y-8 animate-fade-up">
      {/* Header Banner */}
      <div className="border-b border-line/60 pb-6 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-ivy/25 bg-ivy-soft/50 px-3 py-1 text-xs font-semibold text-ivy-ink">
            <svg
              className="h-3.5 w-3.5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <polyline points="20 6 9 17 4 12" />
            </svg>
            Mentor Blueprint Ready
          </span>
          <button
            type="button"
            onClick={onRetake}
            className="inline-flex min-h-[44px] items-center text-xs font-medium text-ink-faint hover:text-ink underline underline-offset-2 focus-visible:focus-ring rounded px-2 py-1"
          >
            Retake Assessment
          </button>
        </div>

        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-accent-ink">
            {blueprint.stageTitle}
          </p>
          <h2 className="mt-1 text-2xl sm:text-3xl font-semibold tracking-tight text-ink">
            Your Archetype: <span className="text-accent-ink">{blueprint.archetype}</span>
          </h2>
        </div>
      </div>

      {/* Mentor Takeaway Box */}
      <div className="rounded-xl border border-accent/25 bg-accent-soft/30 p-5 sm:p-6 space-y-2.5">
        <h3 className="text-sm font-semibold text-accent-ink flex items-center gap-2">
          <svg
            className="h-4 w-4 shrink-0"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
          Mentor Verdict & Guidance
        </h3>
        <p className="text-sm sm:text-base text-ink leading-relaxed font-medium">
          {blueprint.mentorVerdict}
        </p>
        <p className="text-xs sm:text-sm text-ink-soft leading-relaxed">
          {blueprint.strategicNote}
        </p>
      </div>

      {/* Recommended Next Actions */}
      <div className="space-y-3.5">
        <h3 className="text-base font-semibold text-ink">Your Top 3 Immediate Milestones</h3>
        <div className="space-y-3">
          {blueprint.topActions.map((act, i) => (
            <div
              key={act.title}
              className="flex items-start gap-3.5 rounded-xl border border-line/70 bg-surface/60 p-4 transition-colors hover:border-line"
            >
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-cta text-cta-ink text-xs font-semibold">
                {i + 1}
              </span>
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h4 className="text-sm font-semibold text-ink">{act.title}</h4>
                  <span className="rounded-md border border-line/80 bg-card/80 px-1.5 py-0.5 text-xs font-medium text-ink-faint">
                    {act.tag}
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-ink-soft leading-relaxed">{act.detail}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Action CTAs */}
      <div className="border-t border-line/60 pt-6 flex flex-col sm:flex-row gap-3">
        <ButtonLink
          href={`/opportunities${queryParam}`}
          variant="primary"
          size="lg"
          className="flex-1 text-center justify-center"
        >
          Explore Matched Opportunities →
        </ButtonLink>
        <ButtonLink
          href="/auth/signup"
          variant="subtle"
          size="lg"
          className="flex-1 text-center justify-center"
        >
          Save My Roadmap (Free)
        </ButtonLink>
      </div>
    </div>
  );
}
