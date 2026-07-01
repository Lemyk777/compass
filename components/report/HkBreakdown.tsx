"use client";

import { useState } from "react";
import type { HkProgramAnalysis } from "@/lib/ai/schema";
import { Flag } from "@/components/ui/Flag";
import { OfficialSourceLink } from "@/components/ui/OfficialSourceLink";
import { hkOfficialSources } from "@/lib/data/official-sources";
import { useT } from "@/lib/i18n/client";

type Props = {
  programs: HkProgramAnalysis[];
};

export function HkBreakdown({ programs }: Props) {
  const t = useT();
  if (!programs.length) return null;

  return (
    <div className="space-y-10">
      {/* Hong Kong context banner */}
      <div className="rounded-2xl border border-line bg-card px-5 py-4">
        <div className="flex items-start gap-3">
          <Flag code="HK" size={16} className="mt-0.5 shrink-0" />
          <div>
            <p className="text-sm font-medium text-ink">Hong Kong Admission Rules</p>
            <p className="mt-0.5 text-xs leading-relaxed text-ink-soft">
              Hong Kong university admission is academically merit-driven but also highly holistic.
              Shortlisted students are often interviewed, and final admission for predicted-grade applicants 
              comes as a Conditional Offer. Check each program&apos;s scorecard below.
            </p>
          </div>
        </div>
      </div>

      {/* Programs List */}
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

      {/* Global HK Application Roadmap */}
      <HkRoadmap programs={programs} />
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

// ── HkProgramCard ─────────────────────────────────────────────────────────────

function HkProgramCard({ program: p }: { program: HkProgramAnalysis }) {
  const view = hkIndexView(p);
  const t = useT();
  const [open, setOpen] = useState(false);

  return (
    <div className="group relative overflow-hidden rounded-2xl border border-line bg-card shadow-card transition-shadow hover:shadow-lift">
      {/* Status strip */}
      <div className={`h-0.5 w-full ${statusColor(p.status)}`} />

      <div className="p-4 pb-3">
        {/* University + program */}
        <div className="mb-3">
          <p className="text-[10px] font-medium uppercase tracking-widest text-ink-faint">
            {p.field}
          </p>
          <p className="mt-0.5 text-sm font-semibold leading-snug text-ink">
            {p.university}
          </p>
          <p className="text-xs text-ink-soft">{p.program_name}</p>
        </div>

        {/* Status + academic index (shown in the student's native scale) */}
        <div className="mb-3 flex items-center justify-between">
          <StatusPill status={p.status} />
          <div className="text-right">
            <p className="text-[10px] text-ink-faint">
              {view.kind === "sat" ? "Your SAT" : view.kind === "ib" ? "Your IB" : "Academic standing"}
            </p>
            <p className="text-base font-bold tabular-nums text-ink">
              {view.kind === "stale" ? "—" : view.value}
            </p>
          </div>
        </div>

        {/* Custom HK Score Bar — scale-native (IB vs IB, SAT vs SAT) */}
        <HkScoreBar program={p} />

        {/* Specific Entry Gates and Details */}
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

        <HkCardSources university={p.university} />
      </div>

      {/* Expandable reasoning */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between border-t border-line px-4 py-2.5 text-left text-xs font-medium text-ink-soft transition-colors hover:bg-accent-soft focus-visible:focus-ring min-h-[44px]"
      >
        <span>Full analysis & program details</span>
        <ChevronIcon open={open} />
      </button>

      {open && (
        <div className="border-t border-line bg-surface px-4 py-3 space-y-2">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-ink-faint">Analysis & Recommendation</p>
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

// ── HkScoreBar ────────────────────────────────────────────────────────────────

function HkScoreBar({ program: p }: { program: HkProgramAnalysis }) {
  const view = hkIndexView(p);
  // No real score to place (blank estimate, or an outdated stored row) — show a
  // prompt instead of drawing a fake bar.
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
  const userIndex = p.user_index;
  const typical = isSat ? p.typical_sat ?? userIndex : p.typical_ib;
  const min = isSat ? p.min_sat ?? typical - 120 : p.min_ib;
  const scaleLabel = isSat ? "SAT scale" : "IB scale";
  const pad = isSat ? 40 : 3;

  const minRange = Math.min(userIndex, min) - pad;
  const maxRange = Math.max(userIndex, typical) + pad;
  const range = maxRange - minRange;

  const minPct = ((min - minRange) / range) * 100;
  const typicalPct = ((typical - minRange) / range) * 100;
  const userPct = ((userIndex - minRange) / range) * 100;

  return (
    <div className="mt-3">
      <div className="mb-1 flex items-center justify-between text-[10px] text-ink-faint">
        <span>Standing vs. typical range</span>
        <span>{scaleLabel}</span>
      </div>
      <div className="relative h-6">
        <div className="absolute top-1/2 h-1 w-full -translate-y-1/2 rounded-full bg-line" />
        {/* Shaded bar from min to typical */}
        <div
          className="absolute top-1/2 h-2.5 -translate-y-1/2 rounded bg-accent/15"
          style={{ left: `${minPct}%`, width: `${typicalPct - minPct}%` }}
        />
        {/* Min marker */}
        <div
          className="absolute top-0 h-6 w-px bg-ink-faint"
          style={{ left: `${minPct}%` }}
        />
        <p
          className="absolute -bottom-4 text-[9px] text-ink-faint"
          style={{ left: `${minPct}%`, transform: "translateX(-50%)" }}
        >
          Min: {min}
        </p>
        {/* Typical marker */}
        <div
          className="absolute top-0 h-6 w-px bg-accent/40"
          style={{ left: `${typicalPct}%` }}
        />
        <p
          className="absolute -bottom-4 text-[9px] text-accent font-medium"
          style={{ left: `${typicalPct}%`, transform: "translateX(-50%)" }}
        >
          Typ: {typical}
        </p>
        {/* User score dot */}
        <div
          className={`absolute top-1/2 h-3.5 w-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white shadow transition-transform group-hover:scale-110 ${
            userIndex >= typical ? "bg-likely" : userIndex >= min ? "bg-target" : "bg-reach"
          }`}
          style={{ left: `${Math.max(2, Math.min(98, userPct))}%` }}
        />
      </div>
    </div>
  );
}

// ── HkRoadmap ─────────────────────────────────────────────────────────────────

function HkRoadmap({ programs }: { programs: HkProgramAnalysis[] }) {
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
      <p className="mb-1 text-sm font-semibold text-ink">Hong Kong Application Roadmap</p>
      <p className="mb-4 text-xs text-ink-faint">
        These steps outline your path to applying to Hong Kong universities as an international applicant.
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

// HK admission is per-university (non-JUPAS), so each card links straight to its
// university's official admissions, English-requirement and entrance-scholarship
// pages — the real gates, not a single government portal.
function HkCardSources({ university }: { university: string }) {
  const s = hkOfficialSources(university);
  if (!s) return null;
  return (
    <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1.5 border-t border-line pt-2.5">
      <span className="text-[10px] font-semibold uppercase tracking-wide text-ink-faint">
        Official
      </span>
      <OfficialSourceLink href={s.admissions} label="Admissions" />
      {s.english && (
        <OfficialSourceLink href={s.english} label="English requirement" />
      )}
      {s.scholarship && (
        <OfficialSourceLink href={s.scholarship} label="Scholarships" />
      )}
    </div>
  );
}

// ── Badges & Sub-components ───────────────────────────────────────────────────

function StatusPill({ status }: { status: HkProgramAnalysis["status"] }) {
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

function InterviewBadge({ required }: { required: boolean }) {
  return required ? (
    <span className="rounded bg-target-soft px-1.5 py-0.5 text-[10px] font-medium text-target">
      Interview Compulsory
    </span>
  ) : (
    <span className="rounded bg-line px-1.5 py-0.5 text-[10px] font-medium text-ink-soft">
      No Interview
    </span>
  );
}

function EnglishBadge({ status }: { status: HkProgramAnalysis["english"] }) {
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

function ScholarshipBadge({ status }: { status: HkProgramAnalysis["scholarship"] }) {
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

function statusColor(status: HkProgramAnalysis["status"]): string {
  switch (status) {
    case "likely":
      return "bg-likely";
    case "target":
      return "bg-target";
    case "reach":
      return "bg-reach";
  }
}
