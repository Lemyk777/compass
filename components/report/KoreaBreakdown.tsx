"use client";

import type { KoreaProgramAnalysis } from "@/lib/ai/schema";
import { koreaOfficialSources } from "@/lib/data/official-sources";
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
  programs: KoreaProgramAnalysis[];
};

export function KoreaBreakdown({ programs }: Props) {
  if (!programs.length) return null;

  return (
    <div className="space-y-10">
      <CountryBanner code="KR" title="South Korea Admission Rules">
        Korean international admission is a document-based, GPA-first screen — no entrance
        exam, SAT optional. The decisive gate is language: TOPIK for Korean-taught programs,
        IELTS/TOEFL for English-taught ones (KAIST, Yonsei UIC). Merit scholarships are decided
        from the same document screen; KAIST covers every admitted international student in full.
        Check each program&apos;s scorecard below.
      </CountryBanner>

      <div className="space-y-4">
        <div className="space-y-1">
          <h3 className="text-base font-semibold tracking-tight text-ink">Korea Target Programs</h3>
          <p className="text-xs leading-relaxed text-ink-faint">
            Your competitive standing, GPA comparison, language gate, and scholarship picture.
          </p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          {programs.map((p) => (
            <KoreaProgramCard key={p.program_id} program={p} />
          ))}
        </div>
      </div>

      <ProgramRoadmap
        programs={programs}
        title="Korea Application Roadmap"
        intro="These steps outline your path to applying to Korean universities as an international applicant."
      />
    </div>
  );
}

function KoreaProgramCard({ program: p }: { program: KoreaProgramAnalysis }) {
  const src = koreaOfficialSources(p.university);

  return (
    <ProgramCardShell status={p.status} reasoning={p.reasoning} notes={p.notes}>
      {/* University + program */}
      <div className="mb-3">
        <p className="text-[10px] font-medium uppercase tracking-widest text-ink-faint">
          {p.field.replace("_", " ")} · {p.city}
        </p>
        <p className="mt-0.5 text-sm font-semibold leading-snug text-ink">{p.university}</p>
        <p className="text-xs text-ink-soft">{p.program_name}</p>
      </div>

      {/* Status + academic index */}
      <div className="mb-3 flex items-center justify-between">
        <StatusPill status={p.status} />
        <div className="text-right">
          <p className="text-[10px] text-ink-faint">GPA Index</p>
          <p className="text-base font-bold tabular-nums text-ink">
            {p.user_index}%
            {p.index_source !== "gpa" && (
              <span className="ml-1 text-[10px] font-medium text-ink-faint">
                {p.index_source === "ib"
                  ? "est. from IB"
                  : p.index_source === "sat"
                    ? "est. from SAT"
                    : "est."}
              </span>
            )}
          </p>
        </div>
      </div>

      <ScoreBar
        user={p.user_index}
        min={p.min_gpa_percent}
        typical={p.typical_gpa_percent}
        pad={6}
        maxCap={102}
        caption="GPA standing vs. typical range"
        scaleLabel="% of max"
        fmt={(n) => `${n}%`}
      />

      {/* Specific entry gates and details */}
      <div className="mt-4 space-y-2 border-t border-line pt-3">
        <div className="flex flex-wrap gap-1.5">
          <LanguageBadge program={p} />
          {p.interview_required && (
            <span className="rounded bg-target-soft px-1.5 py-0.5 text-[10px] font-medium text-target-ink">
              Interview Stage
            </span>
          )}
          <OfferTypeBadge conditional={p.conditional_offer} />
          {p.auto_full_scholarship && <AutoScholarshipBadge />}
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

// ── Korea-specific badges ─────────────────────────────────────────────────────

/**
 * The language gate — the single most load-bearing badge on a Korean card.
 * Shows the required credential and whether the student clears it.
 */
function LanguageBadge({ program: p }: { program: KoreaProgramAnalysis }) {
  const bar =
    p.topik_required != null ? `TOPIK ${p.topik_required}+` : "English-taught";
  const config = {
    meets: {
      label: `${bar} · Met ✓`,
      className: "bg-likely-soft text-likely-ink",
    },
    below: {
      label: `${bar} · Below Bar ⚠`,
      className: "bg-reach-soft text-reach-ink",
    },
    unknown: {
      label: p.topik_required != null ? `${bar} · Needed` : "English Score Needed",
      className: "bg-target-soft text-target-ink",
    },
  };
  const c = config[p.language];
  return (
    <span className={`rounded px-1.5 py-0.5 text-[10px] font-medium ${c.className}`}>
      {c.label}
    </span>
  );
}

function AutoScholarshipBadge() {
  return (
    <span className="rounded bg-likely-soft px-1.5 py-0.5 text-[10px] font-medium text-likely-ink">
      Full Ride for Every Admit
    </span>
  );
}
