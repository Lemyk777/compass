"use client";

import type { UaeProgramAnalysis } from "@/lib/ai/schema";
import { Flag } from "@/components/ui/Flag";
import { uaeOfficialSources } from "@/lib/data/official-sources";
import { branchCampusFor } from "@/lib/data/branch-campuses";
import {
  CountryBanner,
  OfferTypeBadge,
  OfficialSources,
  ProgramCardShell,
  ProgramRoadmap,
  ScholarshipBadge,
  ScoreBar,
  Stat,
  StatusPill,
} from "@/components/report/program-card";

type Props = {
  programs: UaeProgramAnalysis[];
};

export function UaeBreakdown({ programs }: Props) {
  if (!programs.length) return null;

  return (
    <div className="space-y-10">
      <CountryBanner code="AE" title="UAE Admission Rules">
        UAE university admission is grades-first and SAT-driven for international applicants, with
        generous merit scholarships. The most selective seats (NYU Abu Dhabi, direct-entry Medicine)
        interview shortlisted applicants, and predicted-grade offers come as Conditional Offers.
        Check each program&apos;s scorecard below.
      </CountryBanner>

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

      <ProgramRoadmap
        programs={programs}
        title="UAE Application Roadmap"
        intro="These steps outline your path to applying to UAE universities as an international applicant."
      />
    </div>
  );
}

function UaeProgramCard({ program: p }: { program: UaeProgramAnalysis }) {
  const branch = branchCampusFor(p.university);
  const src = uaeOfficialSources(p.university);

  return (
    <ProgramCardShell status={p.status} reasoning={p.reasoning} notes={p.notes}>
      {/* University + program */}
      <div className="mb-3">
        <p className="text-[11px] font-medium uppercase tracking-widest text-ink-faint">
          {p.field} · {p.emirate}
        </p>
        <p className="mt-0.5 text-sm font-semibold leading-snug text-ink">{p.university}</p>
        <p className="text-xs text-ink-soft">{p.program_name}</p>
      </div>

      {/* Hybrid school: a US university's campus — admissions run on the US
          system, not the grades-first UAE process this tab models. */}
      {branch && (
        <div className="mb-3 rounded-xl border border-accent/20 bg-accent-soft/50 p-2.5">
          <p className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-accent-ink">
            <Flag code="US" size={11} className="shrink-0" />
            US university abroad · evaluated differently
          </p>
          <p className="mt-1 text-[11px] leading-relaxed text-ink-soft">
            {p.university} is {branch.parent_name}&apos;s campus — you apply
            through {branch.application} with US-style holistic review, not
            the grades-first process used by the other UAE universities. For
            the full US-methodology read, also add it on your US list.
          </p>
        </div>
      )}

      {/* Status + academic index */}
      <div className="mb-3 flex items-center justify-between">
        <StatusPill status={p.status} />
        <div className="text-right">
          <p className="text-[11px] text-ink-faint">SAT Index</p>
          <p className="text-base font-bold tabular-nums text-ink">
            {p.user_index}
            {p.index_source !== "sat" && (
              <span className="ml-1 text-[11px] font-medium text-ink-faint">
                {p.index_source === "gpa" ? "est. from GPA" : "est."}
              </span>
            )}
          </p>
        </div>
      </div>

      <ScoreBar
        user={p.user_index}
        min={p.min_sat}
        typical={p.typical_sat}
        pad={60}
        caption="SAT standing vs. typical range"
        scaleLabel="SAT scale"
      />

      {/* Specific entry gates and details */}
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

      {src && (
        <OfficialSources
          links={[
            { href: src.admissions, label: "Admissions" },
            { href: src.scholarship, label: "Scholarships" },
          ]}
        />
      )}
    </ProgramCardShell>
  );
}

// ── UAE-specific badges ───────────────────────────────────────────────────────

function InterviewBadge({ required, needBlind }: { required: boolean; needBlind: boolean }) {
  if (!required) {
    return (
      <span className="rounded bg-line px-1.5 py-0.5 text-[11px] font-medium text-ink-soft">
        No Interview
      </span>
    );
  }
  return (
    <span className="rounded bg-target-soft px-1.5 py-0.5 text-[11px] font-medium text-target-ink">
      {needBlind ? "Candidate Weekend" : "Interview Required"}
    </span>
  );
}

function EnglishBadge({ status }: { status: UaeProgramAnalysis["english"] }) {
  const config = {
    meets: { label: "English Met ✓", className: "bg-likely-soft text-likely-ink" },
    below: { label: "English Below Bar ⚠", className: "bg-reach-soft text-reach-ink" },
    unknown: { label: "English Unknown", className: "bg-line text-ink-soft" },
  };
  const c = config[status];
  return (
    <span className={`rounded px-1.5 py-0.5 text-[11px] font-medium ${c.className}`}>
      {c.label}
    </span>
  );
}

function NeedBlindBadge() {
  return (
    <span className="rounded bg-likely-soft px-1.5 py-0.5 text-[11px] font-medium text-likely-ink">
      Need-Blind · Full Need Met
    </span>
  );
}
