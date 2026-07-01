"use client";

import { useState } from "react";
import type { UaeProgramAnalysis } from "@/lib/ai/schema";
import { Flag } from "@/components/ui/Flag";
import { OfficialSourceLink } from "@/components/ui/OfficialSourceLink";
import { uaeOfficialSources } from "@/lib/data/official-sources";

type Props = {
  programs: UaeProgramAnalysis[];
};

export function UaeBreakdown({ programs }: Props) {
  if (!programs.length) return null;

  return (
    <div className="space-y-10">
      {/* UAE context banner */}
      <div className="rounded-2xl border border-line bg-card px-5 py-4">
        <div className="flex items-start gap-3">
          <Flag code="AE" size={16} className="mt-0.5 shrink-0" />
          <div>
            <p className="text-sm font-medium text-ink">UAE Admission Rules</p>
            <p className="mt-0.5 text-xs leading-relaxed text-ink-soft">
              UAE university admission is grades-first and SAT-driven for international applicants, with
              generous merit scholarships. The most selective seats (NYU Abu Dhabi, direct-entry Medicine)
              interview shortlisted applicants, and predicted-grade offers come as Conditional Offers.
              Check each program&apos;s scorecard below.
            </p>
          </div>
        </div>
      </div>

      {/* Programs List */}
      <div className="space-y-4">
        <div className="space-y-1">
          <h3 className="text-base font-semibold tracking-tight text-ink">UAE Target Programs</h3>
          <p className="text-xs leading-relaxed text-ink-faint">
            Your competitive standing, SAT comparison, scholarship range, and specific entry gates.
          </p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          {programs.map((p) => (
            <UaeProgramCard key={p.program_id} program={p} />
          ))}
        </div>
      </div>

      {/* Global UAE Application Roadmap */}
      <UaeRoadmap programs={programs} />
    </div>
  );
}

// ── UaeProgramCard ────────────────────────────────────────────────────────────

function UaeProgramCard({ program: p }: { program: UaeProgramAnalysis }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="group relative overflow-hidden rounded-2xl border border-line bg-card shadow-card transition-shadow hover:shadow-lift">
      {/* Status strip */}
      <div className={`h-0.5 w-full ${statusColor(p.status)}`} />

      <div className="p-4 pb-3">
        {/* University + program */}
        <div className="mb-3">
          <p className="text-[10px] font-medium uppercase tracking-widest text-ink-faint">
            {p.field} · {p.emirate}
          </p>
          <p className="mt-0.5 text-sm font-semibold leading-snug text-ink">
            {p.university}
          </p>
          <p className="text-xs text-ink-soft">{p.program_name}</p>
        </div>

        {/* Status + academic index */}
        <div className="mb-3 flex items-center justify-between">
          <StatusPill status={p.status} />
          <div className="text-right">
            <p className="text-[10px] text-ink-faint">SAT Index</p>
            <p className="text-base font-bold tabular-nums text-ink">
              {p.user_index}
              {p.index_source !== "sat" && (
                <span className="ml-1 text-[10px] font-medium text-ink-faint">
                  {p.index_source === "gpa" ? "est. from GPA" : "est."}
                </span>
              )}
            </p>
          </div>
        </div>

        {/* SAT Score Bar */}
        <UaeScoreBar
          userIndex={p.user_index}
          minSat={p.min_sat}
          typicalSat={p.typical_sat}
        />

        {/* Specific Entry Gates and Details */}
        <div className="mt-4 space-y-2 border-t border-line pt-3">
          <div className="flex flex-wrap gap-1.5">
            <InterviewBadge required={p.interview_required} needBlind={p.need_blind} />
            <EnglishBadge status={p.english} />
            <OfferTypeBadge conditional={p.conditional_offer} />
            {p.need_blind && <NeedBlindBadge />}
          </div>

          <div className="flex items-center justify-between gap-4 pt-1">
            <Stat label="Annual Tuition" value={`$${p.annual_fee_usd.toLocaleString()}`} />
            <ScholarshipBadge status={p.scholarship} />
          </div>
        </div>

        <UaeCardSources university={p.university} />
      </div>

      {/* Expandable reasoning */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between border-t border-line px-4 py-2.5 text-left text-xs font-medium text-ink-soft transition-colors hover:bg-accent-soft focus-visible:focus-ring min-h-[44px]"
      >
        <span>Full analysis &amp; program details</span>
        <ChevronIcon open={open} />
      </button>

      {open && (
        <div className="border-t border-line bg-surface px-4 py-3 space-y-2">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-ink-faint">Analysis &amp; Recommendation</p>
            <p className="mt-1 text-xs leading-relaxed text-ink-soft">{p.reasoning}</p>
          </div>
          {p.notes && (
            <div className="pt-2 border-t border-line">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-ink-faint">Institution Notes</p>
              <p className="mt-1 text-xs leading-relaxed text-ink-soft">{p.notes}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── UaeScoreBar ───────────────────────────────────────────────────────────────

function UaeScoreBar({
  userIndex,
  minSat,
  typicalSat,
}: {
  userIndex: number;
  minSat: number;
  typicalSat: number;
}) {
  const minRange = Math.min(userIndex, minSat) - 60;
  const maxRange = Math.max(userIndex, typicalSat) + 60;
  const range = maxRange - minRange;

  const minPct = ((minSat - minRange) / range) * 100;
  const typicalPct = ((typicalSat - minRange) / range) * 100;
  const userPct = ((userIndex - minRange) / range) * 100;

  return (
    <div className="mt-3">
      <div className="mb-1 flex items-center justify-between text-[10px] text-ink-faint">
        <span>SAT standing vs. typical range</span>
        <span>SAT scale</span>
      </div>
      <div className="relative h-6">
        <div className="absolute top-1/2 h-1 w-full -translate-y-1/2 rounded-full bg-line" />
        {/* Shaded bar from min to typical */}
        <div
          className="absolute top-1/2 h-2.5 -translate-y-1/2 rounded bg-accent/15"
          style={{ left: `${minPct}%`, width: `${typicalPct - minPct}%` }}
        />
        {/* Min SAT marker */}
        <div
          className="absolute top-0 h-6 w-px bg-ink-faint"
          style={{ left: `${minPct}%` }}
        />
        <p
          className="absolute -bottom-4 text-[9px] text-ink-faint"
          style={{ left: `${minPct}%`, transform: "translateX(-50%)" }}
        >
          Min: {minSat}
        </p>
        {/* Typical SAT marker */}
        <div
          className="absolute top-0 h-6 w-px bg-accent/40"
          style={{ left: `${typicalPct}%` }}
        />
        <p
          className="absolute -bottom-4 text-[9px] text-accent font-medium"
          style={{ left: `${typicalPct}%`, transform: "translateX(-50%)" }}
        >
          Typ: {typicalSat}
        </p>
        {/* User Index Dot */}
        <div
          className={`absolute top-1/2 h-3.5 w-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white shadow transition-transform group-hover:scale-110 ${
            userIndex >= typicalSat ? "bg-likely" : userIndex >= minSat ? "bg-target" : "bg-reach"
          }`}
          style={{ left: `${Math.max(2, Math.min(98, userPct))}%` }}
        />
      </div>
    </div>
  );
}

// ── UaeRoadmap ────────────────────────────────────────────────────────────────

function UaeRoadmap({ programs }: { programs: UaeProgramAnalysis[] }) {
  const seen = new Set<string>();
  const steps: string[] = [];
  for (const p of programs) {
    for (const s of p.roadmap) {
      if (!seen.has(s)) {
        seen.add(s);
        steps.push(s);
      }
    }
  }
  if (!steps.length) return null;

  return (
    <div className="rounded-2xl border border-line bg-card p-5">
      <p className="mb-1 text-sm font-semibold text-ink">UAE Application Roadmap</p>
      <p className="mb-4 text-xs text-ink-faint">
        These steps outline your path to applying to UAE universities as an international applicant.
      </p>
      <ol className="space-y-3">
        {steps.map((step, i) => (
          <li key={i} className="flex gap-3">
            <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-ink text-[10px] font-bold text-white">
              {i + 1}
            </span>
            <p className="text-xs leading-relaxed text-ink-soft">{step}</p>
          </li>
        ))}
      </ol>
    </div>
  );
}

// ── Official sources ──────────────────────────────────────────────────────────

function UaeCardSources({ university }: { university: string }) {
  const s = uaeOfficialSources(university);
  if (!s) return null;
  return (
    <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1.5 border-t border-line pt-2.5">
      <span className="text-[10px] font-semibold uppercase tracking-wide text-ink-faint">
        Official
      </span>
      <OfficialSourceLink href={s.admissions} label="Admissions" />
      {s.scholarship && (
        <OfficialSourceLink href={s.scholarship} label="Scholarships" />
      )}
    </div>
  );
}

// ── Badges & Sub-components ───────────────────────────────────────────────────

function StatusPill({ status }: { status: UaeProgramAnalysis["status"] }) {
  const config = {
    likely: { label: "Likely", className: "bg-likely-soft text-likely" },
    target: { label: "Target", className: "bg-target-soft text-target" },
    reach: { label: "Reach", className: "bg-reach-soft text-reach" },
  };
  const c = config[status];
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold ${c.className}`}>
      {c.label}
    </span>
  );
}

function InterviewBadge({ required, needBlind }: { required: boolean; needBlind: boolean }) {
  if (!required) {
    return (
      <span className="rounded bg-line px-1.5 py-0.5 text-[10px] font-medium text-ink-soft">
        No Interview
      </span>
    );
  }
  return (
    <span className="rounded bg-target-soft px-1.5 py-0.5 text-[10px] font-medium text-target">
      {needBlind ? "Candidate Weekend" : "Interview Required"}
    </span>
  );
}

function EnglishBadge({ status }: { status: UaeProgramAnalysis["english"] }) {
  const config = {
    meets: { label: "English Met ✓", className: "bg-likely-soft text-likely" },
    below: { label: "English Below Bar ⚠", className: "bg-reach-soft text-reach" },
    unknown: { label: "English Unknown", className: "bg-line text-ink-soft" },
  };
  const c = config[status];
  return (
    <span className={`rounded px-1.5 py-0.5 text-[10px] font-medium ${c.className}`}>
      {c.label}
    </span>
  );
}

function OfferTypeBadge({ conditional }: { conditional: boolean }) {
  return conditional ? (
    <span className="rounded bg-accent-soft px-1.5 py-0.5 text-[10px] font-medium text-ink">
      Conditional Offer
    </span>
  ) : (
    <span className="rounded bg-likely-soft px-1.5 py-0.5 text-[10px] font-medium text-likely">
      Direct Offer
    </span>
  );
}

function NeedBlindBadge() {
  return (
    <span className="rounded bg-likely-soft px-1.5 py-0.5 text-[10px] font-medium text-likely">
      Need-Blind · Full Need Met
    </span>
  );
}

function ScholarshipBadge({ status }: { status: UaeProgramAnalysis["scholarship"] }) {
  const config = {
    likely_full: { label: "Likely Full Scholarship", className: "text-likely bg-likely-soft" },
    likely_partial: { label: "Likely Partial Scholarship", className: "text-likely bg-likely-soft" },
    unlikely: { label: "Scholarship Unlikely", className: "text-ink-faint bg-line" },
    unknown: { label: "Scholarship Unknown", className: "text-ink-faint bg-line" },
  };
  const c = config[status];
  return (
    <div className="text-right">
      <p className="text-[10px] text-ink-faint">Scholarship</p>
      <span className={`inline-block rounded px-2 py-0.5 mt-0.5 text-[10px] font-semibold ${c.className}`}>
        {c.label}
      </span>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[10px] text-ink-faint">{label}</p>
      <p className="text-xs font-semibold tabular-nums text-ink mt-0.5">{value}</p>
    </div>
  );
}

function ChevronIcon({ open }: { open: boolean }) {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 14 14"
      fill="none"
      aria-hidden="true"
      className={`shrink-0 transition-transform ${open ? "rotate-180" : ""}`}
    >
      <path
        d="M3 5l4 4 4-4"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function statusColor(status: UaeProgramAnalysis["status"]): string {
  switch (status) {
    case "likely":
      return "bg-likely";
    case "target":
      return "bg-target";
    case "reach":
      return "bg-reach";
  }
}
