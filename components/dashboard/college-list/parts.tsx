"use client";

import { useEffect, useState, type ReactNode } from "react";
import { Button } from "@/components/ui/Button";

// Shared, presentational building blocks for the college-list builders. Kept
// separate from the builders so the per-country logic stays small and the pieces
// (search bar, pick card, sticky action bar, overlay, grade toggle) have one
// definition instead of one copy per country.

/** The display content of a pick card — everything except selection state. */
export type PickCardContent = {
  title: string;
  subtitle?: string;
  /** Optional pill under the title (e.g. the hybrid branch-campus badge). */
  badge?: ReactNode;
  meta: string[];
  note?: string;
};

export function SearchBar({
  query,
  onQuery,
  placeholder,
  count,
  cap,
}: {
  query: string;
  onQuery: (v: string) => void;
  placeholder: string;
  count: number;
  cap: number;
}) {
  return (
    <div className="sticky top-0 z-10 -mx-4 bg-surface/90 px-4 py-3 backdrop-blur sm:-mx-8 sm:px-8">
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative min-w-0 flex-1">
          <svg className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-faint" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="7" />
            <path d="m21 21-4.3-4.3" />
          </svg>
          <input
            value={query}
            onChange={(e) => onQuery(e.target.value)}
            placeholder={placeholder}
            className="h-11 w-full rounded-xl border border-line bg-card pl-10 pr-3.5 text-[0.95rem] text-ink placeholder:text-ink-faint focus-visible:focus-ring"
          />
        </div>
        <span className="shrink-0 text-sm font-medium text-ink-soft">
          {count} / {cap} selected
        </span>
      </div>
    </div>
  );
}

export function PickCard({
  on,
  disabled,
  onClick,
  title,
  subtitle,
  badge,
  meta,
  note,
}: PickCardContent & {
  on: boolean;
  disabled: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-pressed={on}
      disabled={disabled}
      onClick={onClick}
      className={`flex flex-col rounded-2xl border p-4 text-left transition-colors focus-visible:focus-ring ${
        on
          ? "border-accent bg-accent-soft"
          : disabled
            ? "cursor-not-allowed border-line bg-card opacity-50"
            : "border-line bg-card hover:border-ink/20"
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex min-w-0 flex-col">
          <h3 className="text-[0.95rem] font-semibold leading-tight text-ink">{title}</h3>
          {subtitle && <p className="mt-0.5 text-xs text-ink-soft">{subtitle}</p>}
          {badge}
        </div>
        <span
          className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border ${
            on ? "border-accent bg-accent text-white" : "border-line"
          }`}
        >
          {on && (
            <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12l5 5L20 7" />
            </svg>
          )}
        </span>
      </div>
      <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-ink-soft">
        {meta.map((m) => (
          <span key={m}>{m}</span>
        ))}
      </div>
      {note && <p className="mt-2 line-clamp-2 text-xs text-ink-faint">{note}</p>}
    </button>
  );
}

export function StickyActionBar({
  error,
  message,
  ctaLabel,
  ctaDisabled,
  onCta,
}: {
  error: string | null;
  message: string;
  ctaLabel: string;
  ctaDisabled: boolean;
  onCta: () => void;
}) {
  return (
    <div className="fixed inset-x-0 bottom-0 z-20 border-t border-line bg-card/95 backdrop-blur lg:left-64">
      <div className="mx-auto flex max-w-[1500px] items-center justify-between gap-4 px-4 py-3 sm:px-8">
        <div className="min-w-0">
          {error ? (
            <p className="truncate text-sm text-reach-ink">{error}</p>
          ) : (
            <p className="truncate text-sm text-ink-soft">{message}</p>
          )}
        </div>
        <Button size="md" disabled={ctaDisabled} onClick={onCta}>
          {ctaLabel}
          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M5 12h14M13 6l6 6-6 6" />
          </svg>
        </Button>
      </div>
    </div>
  );
}

export function AnalyzingOverlay() {
  const MESSAGES = [
    "Reading your profile…",
    "Scoring each school against admitted data…",
    "Estimating your likelihood ranges…",
    "Benchmarking your stats…",
    "Finalizing your admission odds…",
  ];
  const [i, setI] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setI((x) => (x + 1) % MESSAGES.length), 4500);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-surface/90 px-6 text-center backdrop-blur-sm">
      <div className="h-11 w-11 animate-spin rounded-full border-2 border-line border-t-accent" />
      <h2 className="mt-6 text-lg font-semibold text-ink">Building your admission odds</h2>
      <p className="mt-1 min-h-[1.25rem] max-w-xs text-sm text-ink-soft">{MESSAGES[i]}</p>
      <p className="mt-4 text-xs text-ink-faint">This usually takes around 30 seconds.</p>
    </div>
  );
}

/**
 * Notice that the program list is scoped to the student's chosen fields of study
 * (from onboarding), with a toggle to reveal everything. Only rendered when a
 * field filter is actually available (the student picked fields that match
 * programs in this country).
 */
export function FieldFilterNotice({
  facultyLabels,
  active,
  matchCount,
  totalCount,
  onToggle,
}: {
  facultyLabels: string[];
  active: boolean;
  matchCount: number;
  totalCount: number;
  onToggle: () => void;
}) {
  const fields = facultyLabels.join(", ");
  return (
    <div className="flex flex-wrap items-center gap-x-2 gap-y-1 rounded-xl border border-line bg-card px-3.5 py-2.5 text-xs">
      {active ? (
        <>
          <span className="text-ink-soft">
            Showing <span className="font-semibold text-ink">{matchCount}</span>{" "}
            {matchCount === 1 ? "program" : "programs"} in your{" "}
            {facultyLabels.length === 1 ? "field" : "fields"}:
          </span>
          <span className="font-medium text-ink">{fields}</span>
        </>
      ) : (
        <span className="text-ink-soft">Showing all {totalCount} programs.</span>
      )}
      <button
        type="button"
        onClick={onToggle}
        className="ml-auto font-semibold text-accent hover:underline focus-visible:focus-ring"
      >
        {active ? `Show all ${totalCount}` : `Filter to my fields (${fields})`}
      </button>
    </div>
  );
}

/**
 * "Your grades are Predicted / Achieved" toggle — identical across the HK, UAE
 * and Korea builders. `className` lets the caller place it (a bounded box vs a
 * grid cell).
 */
export function GradeStatusField({
  value,
  onChange,
  className,
}: {
  value: "predicted" | "achieved";
  onChange: (v: "predicted" | "achieved") => void;
  className?: string;
}) {
  return (
    <div className={className}>
      <span className="text-sm font-medium text-ink">Your grades are</span>
      <p className="mb-2 text-xs text-ink-soft">
        Predicted grades get a conditional-offer read; achieved grades are scored as final.
      </p>
      <div className="flex gap-2">
        {(["predicted", "achieved"] as const).map((s) => {
          const on = value === s;
          return (
            <button
              key={s}
              type="button"
              onClick={() => onChange(s)}
              aria-pressed={on}
              className={`min-h-[44px] flex-1 rounded-xl border px-4 py-3 text-sm font-medium transition-colors focus-visible:focus-ring ${
                on
                  ? "border-accent bg-accent-soft text-ink"
                  : "border-line bg-card text-ink-soft hover:border-ink/30"
              }`}
            >
              {s === "predicted" ? "Predicted" : "Achieved"}
            </button>
          );
        })}
      </div>
    </div>
  );
}
