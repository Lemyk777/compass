"use client";

import { useState } from "react";
import type { ItalyProgramAnalysis, ItalyDSUFit } from "@/lib/ai/schema";
import { Flag } from "@/components/ui/Flag";
import { OfficialSourceLink } from "@/components/ui/OfficialSourceLink";
import { ITALY_GOV_SOURCES, italyOfficialUrl } from "@/lib/data/official-sources";

type Props = {
  programs: ItalyProgramAnalysis[];
};

export function ItalyBreakdown({ programs }: Props) {
  if (!programs.length) return null;

  const guaranteed = programs.filter((p) => p.admission_branch === "guaranteed");
  const graduatoria = programs.filter((p) => p.admission_branch === "graduatoria");

  return (
    <div className="space-y-10">
      {/* Italy context banner */}
      <div className="rounded-2xl border border-line bg-card px-5 py-4">
        <div className="flex items-start gap-3">
          <Flag code="IT" size={16} className="mt-0.5 shrink-0" />
          <div>
            <p className="text-sm font-medium text-ink">Italian Admission Rules</p>
            <p className="mt-0.5 text-xs leading-relaxed text-ink-soft">
              Italian state universities use two distinct admission systems that operate
              simultaneously. Your analysis below separates them — read each card to
              understand exactly how the rules work for that specific program.
            </p>
            {/* Government source — Italy publishes the official Extra-UE rules and
                pre-enrollment procedure here, updated every cycle. */}
            <div className="mt-2.5 flex flex-wrap items-center gap-x-4 gap-y-1.5 border-t border-line pt-2.5">
              <span className="text-[10px] font-semibold uppercase tracking-wide text-ink-faint">
                Official source
              </span>
              {ITALY_GOV_SOURCES.map((s) => (
                <OfficialSourceLink key={s.url} href={s.url} label={s.label} />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Branch A — Guaranteed Enrollment */}
      {guaranteed.length > 0 && (
        <div className="space-y-4">
          <SectionHeader
            label="Early Admission Track"
            badge="Guaranteed Threshold"
            badgeColor="likely"
            description="These programs run an Early Enrollment system. Clear the threshold before the deadline and you secure a seat — no ranking competition."
          />
          <div className="grid gap-4 sm:grid-cols-2">
            {guaranteed.map((p) => (
              <GuaranteedCard key={p.program_id} program={p} />
            ))}
          </div>
        </div>
      )}

      {/* Branch B — Strict Graduatoria */}
      {graduatoria.length > 0 && (
        <div className="space-y-4">
          <SectionHeader
            label="Merit Ranking Track"
            badge="Strict Graduatoria"
            badgeColor="reach"
            description="These programs close applications, then rank all Extra-UE applicants by score. Only the top N (the quota) are admitted. One stronger applicant can shift the cutoff."
          />
          <div className="grid gap-4 sm:grid-cols-2">
            {graduatoria.map((p) => (
              <GraduatoriaCard key={p.program_id} program={p} />
            ))}
          </div>
        </div>
      )}

      {/* Global Italian Roadmap */}
      <ItalyRoadmap programs={programs} />
    </div>
  );
}

// ── Section header ─────────────────────────────────────────────────────────────

function SectionHeader({
  label,
  badge,
  badgeColor,
  description,
}: {
  label: string;
  badge: string;
  badgeColor: "likely" | "reach";
  description: string;
}) {
  return (
    <div className="space-y-1">
      <div className="flex items-center gap-2">
        <h3 className="text-base font-semibold tracking-tight text-ink">{label}</h3>
        <span
          className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-widest ${
            badgeColor === "likely"
              ? "bg-likely-soft text-likely"
              : "bg-reach-soft text-reach"
          }`}
        >
          {badge}
        </span>
      </div>
      <p className="text-xs leading-relaxed text-ink-faint">{description}</p>
    </div>
  );
}

// ── Branch A — Guaranteed card ─────────────────────────────────────────────────

function GuaranteedCard({ program: p }: { program: ItalyProgramAnalysis }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="group relative overflow-hidden rounded-2xl border border-line bg-card shadow-card transition-shadow hover:shadow-lift">
      {/* Status strip */}
      <div className="h-0.5 w-full bg-likely" />

      <div className="p-4 pb-3">
        {/* University + program */}
        <div className="mb-3">
          <p className="text-[10px] font-medium uppercase tracking-widest text-ink-faint">
            {p.city} · {levelLabel(p.level)} · {p.language}
          </p>
          <p className="mt-0.5 text-sm font-semibold leading-snug text-ink">
            {p.university}
          </p>
          <p className="text-xs text-ink-soft">{p.program_name}</p>
        </div>

        {/* Status + score */}
        <div className="mb-3 flex items-center justify-between">
          <StatusPill status={p.status} />
          <div className="text-right">
            <p className="text-[10px] text-ink-faint">Your SAT</p>
            <p className="text-base font-bold tabular-nums text-ink">
              {p.user_sat}
            </p>
          </div>
        </div>

        {/* Threshold bar */}
        <ThresholdBar
          userSAT={p.user_sat}
          threshold={p.guaranteed_threshold}
          label="Early Admission threshold"
        />

        {/* Quota */}
        <div className="mt-3 flex items-center gap-4">
          <Stat label="Extra-UE seats" value={String(p.quota)} />
          <Stat label="Threshold" value={String(p.guaranteed_threshold ?? "—")} />
          <DSUBadge fit={p.dsu_fit} feeEur={p.annual_fee_eur} />
        </div>

        <ItalyCardSource university={p.university} />
      </div>

      {/* Expandable reasoning */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between border-t border-line px-4 py-2.5 text-left text-xs font-medium text-ink-soft transition-colors hover:bg-accent-soft focus-visible:focus-ring"
      >
        <span>How the system works for this program</span>
        <ChevronIcon open={open} />
      </button>

      {open && (
        <div className="border-t border-line bg-surface px-4 py-3">
          <p className="text-xs leading-relaxed text-ink-soft">{p.reasoning}</p>
        </div>
      )}
    </div>
  );
}

// ── Branch B — Graduatoria card ────────────────────────────────────────────────

function GraduatoriaCard({ program: p }: { program: ItalyProgramAnalysis }) {
  const [open, setOpen] = useState(false);
  const diff = p.user_sat - p.historical_cutoff;

  return (
    <div className="group relative overflow-hidden rounded-2xl border border-line bg-card shadow-card transition-shadow hover:shadow-lift">
      {/* Status strip */}
      <div className={`h-0.5 w-full ${statusColor(p.status)}`} />

      <div className="p-4 pb-3">
        {/* University + program */}
        <div className="mb-3">
          <p className="text-[10px] font-medium uppercase tracking-widest text-ink-faint">
            {p.city} · {levelLabel(p.level)} · {p.language}
          </p>
          <p className="mt-0.5 text-sm font-semibold leading-snug text-ink">
            {p.university}
          </p>
          <p className="text-xs text-ink-soft">{p.program_name}</p>
        </div>

        {/* Status + delta */}
        <div className="mb-3 flex items-center justify-between">
          <StatusPill status={p.status} />
          <div className="text-right">
            <p className="text-[10px] text-ink-faint">vs. cutoff</p>
            <p
              className={`text-base font-bold tabular-nums ${
                diff >= 0 ? "text-likely" : "text-reach"
              }`}
            >
              {diff >= 0 ? "+" : ""}
              {diff}
            </p>
          </div>
        </div>

        {/* Score bar */}
        <ScoreBar userSAT={p.user_sat} cutoff={p.historical_cutoff} />

        {/* Stats row */}
        <div className="mt-3 flex items-center gap-4">
          <Stat label="Extra-UE seats" value={String(p.quota)} />
          <Stat label="Last cutoff" value={String(p.historical_cutoff)} />
          <VolatilityBadge volatility={p.volatility} quota={p.quota} />
        </div>

        {/* DSU */}
        {p.dsu_eligible && (
          <div className="mt-2">
            <DSUBadge fit={p.dsu_fit} feeEur={p.annual_fee_eur} />
          </div>
        )}

        <ItalyCardSource university={p.university} />
      </div>

      {/* Expandable reasoning */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between border-t border-line px-4 py-2.5 text-left text-xs font-medium text-ink-soft transition-colors hover:bg-accent-soft focus-visible:focus-ring"
      >
        <span>Full analysis for this program</span>
        <ChevronIcon open={open} />
      </button>

      {open && (
        <div className="border-t border-line bg-surface px-4 py-3">
          <p className="text-xs leading-relaxed text-ink-soft">{p.reasoning}</p>
        </div>
      )}
    </div>
  );
}

// ── Global Italian Roadmap ─────────────────────────────────────────────────────

function ItalyRoadmap({ programs }: { programs: ItalyProgramAnalysis[] }) {
  // Collect unique roadmap steps across all programs, preserve order.
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
      <p className="mb-1 text-sm font-semibold text-ink">Italian Application Roadmap</p>
      <p className="mb-4 text-xs text-ink-faint">
        These steps apply globally to your Italian applications — complete them once, not per university.
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

// ── Micro-components ───────────────────────────────────────────────────────────

// Links the card to this university's official "foreign qualification"
// admissions page, where the program's Bando di Ammissione is published.
function ItalyCardSource({ university }: { university: string }) {
  const url = italyOfficialUrl(university);
  if (!url) return null;
  return (
    <div className="mt-3 border-t border-line pt-2.5">
      <OfficialSourceLink href={url} label="Official admissions page" />
    </div>
  );
}

function StatusPill({ status }: { status: ItalyProgramAnalysis["status"] }) {
  const config: Record<
    ItalyProgramAnalysis["status"],
    { label: string; className: string }
  > = {
    guaranteed: {
      label: "Guaranteed",
      className: "bg-likely-soft text-likely",
    },
    likely: { label: "Likely", className: "bg-likely-soft text-likely" },
    target: { label: "Target", className: "bg-target-soft text-target" },
    reach: { label: "Reach", className: "bg-reach-soft text-reach" },
  };
  const c = config[status];
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold ${c.className}`}
    >
      {c.label}
    </span>
  );
}

function ThresholdBar({
  userSAT,
  threshold,
  label,
}: {
  userSAT: number;
  threshold: number | null;
  label: string;
}) {
  if (!threshold) return null;
  const min = Math.min(userSAT, threshold) - 100;
  const max = Math.max(userSAT, threshold) + 100;
  const range = max - min;
  const thresholdPct = ((threshold - min) / range) * 100;
  const userPct = ((userSAT - min) / range) * 100;
  const cleared = userSAT >= threshold;

  return (
    <div>
      <p className="mb-1 text-[10px] text-ink-faint">{label}</p>
      <div className="relative h-6">
        <div className="absolute top-1/2 h-1 w-full -translate-y-1/2 rounded-full bg-line" />
        {/* Threshold marker */}
        <div
          className="absolute top-0 flex -translate-x-1/2 flex-col items-center"
          style={{ left: `${thresholdPct}%` }}
        >
          <div className="h-6 w-px bg-ink-faint" />
        </div>
        <p
          className="absolute -bottom-4 text-[9px] text-ink-faint"
          style={{
            left: `${thresholdPct}%`,
            transform: "translateX(-50%)",
          }}
        >
          {threshold}
        </p>
        {/* User SAT dot */}
        <div
          className={`absolute top-1/2 h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white shadow ${
            cleared ? "bg-likely" : "bg-ink-soft"
          }`}
          style={{ left: `${Math.max(2, Math.min(98, userPct))}%` }}
        />
      </div>
      <p className="mt-5 text-[10px] text-ink-faint">
        {cleared
          ? `Your SAT ${userSAT} clears the threshold — guaranteed seat.`
          : `${threshold - userSAT} points below the Early Admission threshold.`}
      </p>
    </div>
  );
}

function ScoreBar({
  userSAT,
  cutoff,
}: {
  userSAT: number;
  cutoff: number;
}) {
  const min = Math.min(userSAT, cutoff) - 80;
  const max = Math.max(userSAT, cutoff) + 80;
  const range = max - min;
  const cutoffPct = ((cutoff - min) / range) * 100;
  const userPct = ((userSAT - min) / range) * 100;
  const above = userSAT >= cutoff;

  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-[10px] text-ink-faint">
        <span>SAT position vs. historical cutoff</span>
        <span>
          {above ? "+" : ""}
          {userSAT - cutoff} pts
        </span>
      </div>
      <div className="relative h-6">
        <div className="absolute top-1/2 h-1 w-full -translate-y-1/2 rounded-full bg-line" />
        {/* Cutoff marker */}
        <div
          className="absolute top-0 h-6 w-px bg-ink-faint"
          style={{ left: `${cutoffPct}%` }}
        />
        <p
          className="absolute -bottom-4 text-[9px] text-ink-faint"
          style={{ left: `${cutoffPct}%`, transform: "translateX(-50%)" }}
        >
          {cutoff}
        </p>
        {/* User dot */}
        <div
          className={`absolute top-1/2 h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white shadow ${
            above ? "bg-likely" : "bg-reach"
          }`}
          style={{ left: `${Math.max(2, Math.min(98, userPct))}%` }}
        />
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[10px] text-ink-faint">{label}</p>
      <p className="text-xs font-semibold tabular-nums text-ink">{value}</p>
    </div>
  );
}

function VolatilityBadge({
  volatility,
  quota,
}: {
  volatility: "stable" | "moderate" | "high";
  quota: number;
}) {
  const config = {
    stable: { label: "Stable odds", className: "text-likely bg-likely-soft" },
    moderate: { label: "Some variance", className: "text-target bg-target-soft" },
    high: { label: "High volatility", className: "text-reach bg-reach-soft" },
  };
  const c = config[volatility];
  return (
    <span
      className={`ml-auto rounded-full px-2 py-0.5 text-[10px] font-semibold ${c.className}`}
      title={`Only ${quota} Extra-UE seats — year-on-year cutoff swings can be large`}
    >
      {c.label}
    </span>
  );
}

function DSUBadge({
  fit,
  feeEur,
}: {
  fit: ItalyDSUFit;
  feeEur: number;
}) {
  if (fit === "not_applicable") {
    return (
      <div>
        <p className="text-[10px] text-ink-faint">Annual fee</p>
        <p className="text-xs font-semibold text-ink">€{feeEur.toLocaleString()}</p>
      </div>
    );
  }

  const labels: Record<ItalyDSUFit, string> = {
    strong: "DSU: Strong fit",
    moderate: "DSU: Moderate fit",
    partial: "DSU: Partial fit",
    unlikely: "DSU: Unlikely",
    unknown: "DSU: Unknown",
    not_applicable: "",
  };
  const colors: Record<ItalyDSUFit, string> = {
    strong: "text-likely bg-likely-soft",
    moderate: "text-target bg-target-soft",
    partial: "text-target bg-target-soft",
    unlikely: "text-ink-faint bg-line",
    unknown: "text-ink-faint bg-line",
    not_applicable: "",
  };

  return (
    <div>
      <p className="text-[10px] text-ink-faint">Scholarship</p>
      <span
        className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold ${colors[fit]}`}
      >
        {labels[fit]}
      </span>
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

function statusColor(status: ItalyProgramAnalysis["status"]): string {
  switch (status) {
    case "guaranteed":
    case "likely":
      return "bg-likely";
    case "target":
      return "bg-target";
    case "reach":
      return "bg-reach";
  }
}

function levelLabel(level: "bsc" | "msc"): string {
  return level === "bsc" ? "BSc" : "MSc";
}
