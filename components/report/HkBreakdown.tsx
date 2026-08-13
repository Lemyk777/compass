"use client";

import type { HkProgramAnalysis } from "@/lib/ai/schema";
import { hkOfficialSources } from "@/lib/data/official-sources";
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
  programs: HkProgramAnalysis[];
};

export function HkBreakdown({ programs }: Props) {
  if (!programs.length) return null;

  return (
    <div className="space-y-10">
      <CountryBanner code="HK" title="Hong Kong Admission Rules">
        Hong Kong university admission is academically merit-driven but also highly holistic.
        Shortlisted students are often interviewed, and final admission for predicted-grade applicants
        comes as a Conditional Offer. Check each program&apos;s scorecard below.
      </CountryBanner>

      <div className="space-y-4">
        <div className="space-y-1">
          <h3 className="text-base font-semibold tracking-tight text-ink">HK Target Programs</h3>
          <p className="text-xs leading-relaxed text-ink-faint">
            Your competitive standing, academic index comparison, and specific entry gates.
          </p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          {programs.map((p) => (
            <HkProgramCard key={p.program_id} program={p} />
          ))}
        </div>
      </div>

      <ProgramRoadmap
        programs={programs}
        title="Hong Kong Application Roadmap"
        intro="These steps outline your path to applying to Hong Kong universities as an international applicant."
      />
    </div>
  );
}

// A stored analysis is "native-scale valid" only when it matches the current
// engine output. Older rows (produced before the native-scale rewrite) can carry
// index_source "sat" with a low IB-equivalent in user_index and no typical_sat —
// guard against rendering that as a nonsensical "Your SAT 41 / Min -79". Such a
// row (and a blank estimate) resolves to "stale" and shows a refresh prompt
// instead of a broken number/bar.
type HkIndexView =
  | { kind: "ib"; value: string }
  | { kind: "sat"; value: string }
  | { kind: "stale"; needsRefresh: boolean };

function hkIndexView(p: HkProgramAnalysis): HkIndexView {
  if (p.index_source === "ib") return { kind: "ib", value: `${p.user_index}/45` };
  // A real SAT is on the 400–1600 scale AND new rows always carry typical_sat.
  if (p.index_source === "sat" && p.typical_sat != null && p.user_index >= 400) {
    return { kind: "sat", value: String(p.user_index) };
  }
  // "estimate" = blank profile; a "sat" row that failed the check = outdated.
  return { kind: "stale", needsRefresh: p.index_source !== "estimate" };
}

function HkProgramCard({ program: p }: { program: HkProgramAnalysis }) {
  const view = hkIndexView(p);
  const src = hkOfficialSources(p.university);

  return (
    <ProgramCardShell status={p.status} reasoning={p.reasoning} notes={p.notes}>
      {/* University + program */}
      <div className="mb-3">
        <p className="text-[11px] font-medium uppercase tracking-widest text-ink-faint">
          {p.field}
        </p>
        <p className="mt-0.5 text-sm font-semibold leading-snug text-ink">{p.university}</p>
        <p className="text-xs text-ink-soft">{p.program_name}</p>
      </div>

      {/* Status + academic index (shown in the student's native scale) */}
      <div className="mb-3 flex items-center justify-between">
        <StatusPill status={p.status} />
        <div className="text-right">
          <p className="text-[11px] text-ink-faint">
            {view.kind === "sat" ? "Your SAT" : view.kind === "ib" ? "Your IB" : "Academic standing"}
          </p>
          <p className="text-base font-bold tabular-nums text-ink">
            {view.kind === "stale" ? "—" : view.value}
          </p>
        </div>
      </div>

      <HkScoreBar program={p} />

      {/* Specific entry gates and details */}
      <div className="mt-4 space-y-2 border-t border-line pt-3">
        <div className="flex flex-wrap gap-1.5">
          <InterviewBadge required={p.interview_required} />
          <EnglishBadge status={p.english} />
          <OfferTypeBadge conditional={p.conditional_offer} />
        </div>

        <div className="flex items-center justify-between gap-4 pt-1">
          <Stat label="Annual Tuition" value={`${p.annual_fee_hkd.toLocaleString()} HKD`} />
          <ScholarshipBadge status={p.scholarship} />
        </div>
      </div>

      {src && (
        <OfficialSources
          links={[
            { href: src.admissions, label: "Admissions" },
            { href: src.english, label: "English requirement" },
            { href: src.scholarship, label: "Scholarships" },
          ]}
        />
      )}
    </ProgramCardShell>
  );
}

// HK's bar is native-scale (IB vs IB, SAT vs SAT) with a stale-row guard, so it
// wraps the shared ScoreBar rather than using it directly.
function HkScoreBar({ program: p }: { program: HkProgramAnalysis }) {
  const view = hkIndexView(p);
  if (view.kind === "stale") {
    return (
      <div className="mt-3 rounded-lg border border-dashed border-line px-3 py-2 text-[11px] leading-relaxed text-ink-faint">
        {view.needsRefresh
          ? "Re-run your analysis to refresh this standing with the latest scoring."
          : "Add your IB total or SAT to see exactly where you stand against this programme's typical admitted range."}
      </div>
    );
  }

  const isSat = view.kind === "sat";
  const typical = isSat ? p.typical_sat ?? p.user_index : p.typical_ib;
  const min = isSat ? p.min_sat ?? typical - 120 : p.min_ib;

  return (
    <ScoreBar
      user={p.user_index}
      min={min}
      typical={typical}
      pad={isSat ? 40 : 3}
      caption="Standing vs. typical range"
      scaleLabel={isSat ? "SAT scale" : "IB scale"}
    />
  );
}

// ── HK-specific badges ────────────────────────────────────────────────────────

function InterviewBadge({ required }: { required: boolean }) {
  return required ? (
    <span className="rounded bg-target-soft px-1.5 py-0.5 text-[11px] font-medium text-target-ink">
      Interview Compulsory
    </span>
  ) : (
    <span className="rounded bg-line px-1.5 py-0.5 text-[11px] font-medium text-ink-soft">
      No Interview
    </span>
  );
}

function EnglishBadge({ status }: { status: HkProgramAnalysis["english"] }) {
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
