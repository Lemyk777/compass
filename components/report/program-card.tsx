"use client";

import { useState, type ReactNode } from "react";
import { Flag } from "@/components/ui/Flag";
import { OfficialSourceLink } from "@/components/ui/OfficialSourceLink";
import type { DestinationCode } from "@/lib/data/destinations";

// Shared building blocks for the grades-first program breakdowns (Hong Kong, UAE,
// South Korea). Those three cards are structurally identical — a status strip,
// header, status pill + academic-index readout, a standing bar, a row of entry-
// gate badges, official-source links, and an expandable reasoning drawer. Only
// the scale, the badges, and the copy differ. Extracting the frame here means one
// definition instead of one copy per country.
//
// Italy is intentionally NOT built on this: it has a different status model
// (guaranteed/graduatoria), threshold/cutoff bars, and DSU/volatility badges.

export type ProgramStatus = "likely" | "target" | "reach";
export type ScholarshipStatus =
  | "likely_full"
  | "likely_partial"
  | "unlikely"
  | "unknown";

export function statusColor(status: ProgramStatus): string {
  switch (status) {
    case "likely":
      return "bg-likely";
    case "target":
      return "bg-target";
    case "reach":
      return "bg-reach";
  }
}

/** The whole card frame: status strip, body slot, and the expandable reasoning. */
export function ProgramCardShell({
  status,
  reasoning,
  notes,
  children,
}: {
  status: ProgramStatus;
  reasoning: string;
  notes?: string;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="group relative overflow-hidden rounded-2xl border border-line bg-card shadow-card transition-shadow hover:shadow-lift">
      <div className={`h-0.5 w-full ${statusColor(status)}`} />

      <div className="p-4 pb-3">{children}</div>

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
            <p className="mt-1 text-xs leading-relaxed text-ink-soft">{reasoning}</p>
          </div>
          {notes && (
            <div className="pt-2 border-t border-line">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-ink-faint">Institution Notes</p>
              <p className="mt-1 text-xs leading-relaxed text-ink-soft">{notes}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/** The "<Country> Admission Rules" context banner atop each breakdown. */
export function CountryBanner({
  code,
  title,
  children,
}: {
  code: DestinationCode;
  title: string;
  children: ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-line bg-card px-5 py-4">
      <div className="flex items-start gap-3">
        <Flag code={code} size={16} className="mt-0.5 shrink-0" />
        <div>
          <p className="text-sm font-medium text-ink">{title}</p>
          <p className="mt-0.5 text-xs leading-relaxed text-ink-soft">{children}</p>
        </div>
      </div>
    </div>
  );
}

/**
 * The "standing vs. typical range" bar: a track with a min marker, a typical
 * marker, and the student's dot coloured by band. Scale-agnostic — the caller
 * supplies the numbers, the padding, an optional upper cap, and a label formatter.
 */
export function ScoreBar({
  user,
  min,
  typical,
  pad,
  maxCap,
  caption,
  scaleLabel,
  fmt = (n) => String(n),
}: {
  user: number;
  min: number;
  typical: number;
  pad: number;
  /** Optional hard ceiling for the visible range (e.g. 102 on a 0–100 scale). */
  maxCap?: number;
  caption: string;
  scaleLabel: string;
  fmt?: (n: number) => string;
}) {
  const minRange = Math.min(user, min) - pad;
  const rawMax = Math.max(user, typical) + pad;
  const maxRange = maxCap != null ? Math.min(maxCap, rawMax) : rawMax;
  const range = maxRange - minRange;

  const minPct = ((min - minRange) / range) * 100;
  const typicalPct = ((typical - minRange) / range) * 100;
  const userPct = ((user - minRange) / range) * 100;

  return (
    <div className="mt-3">
      <div className="mb-1 flex items-center justify-between text-[10px] text-ink-faint">
        <span>{caption}</span>
        <span>{scaleLabel}</span>
      </div>
      <div className="relative h-6">
        <div className="absolute top-1/2 h-1 w-full -translate-y-1/2 rounded-full bg-line" />
        <div
          className="absolute top-1/2 h-2.5 -translate-y-1/2 rounded bg-accent/15"
          style={{ left: `${minPct}%`, width: `${typicalPct - minPct}%` }}
        />
        <div className="absolute top-0 h-6 w-px bg-ink-faint" style={{ left: `${minPct}%` }} />
        <p
          className="absolute -bottom-4 text-[9px] text-ink-faint"
          style={{ left: `${minPct}%`, transform: "translateX(-50%)" }}
        >
          Min: {fmt(min)}
        </p>
        <div className="absolute top-0 h-6 w-px bg-accent/40" style={{ left: `${typicalPct}%` }} />
        <p
          className="absolute -bottom-4 text-[9px] text-accent font-medium"
          style={{ left: `${typicalPct}%`, transform: "translateX(-50%)" }}
        >
          Typ: {fmt(typical)}
        </p>
        <div
          className={`absolute top-1/2 h-3.5 w-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white shadow transition-transform group-hover:scale-110 ${
            user >= typical ? "bg-likely" : user >= min ? "bg-target" : "bg-reach"
          }`}
          style={{ left: `${Math.max(2, Math.min(98, userPct))}%` }}
        />
      </div>
    </div>
  );
}

/** The global application roadmap: unique steps across all programs, in order. */
export function ProgramRoadmap({
  programs,
  title,
  intro,
}: {
  programs: { roadmap: string[] }[];
  title: string;
  intro: string;
}) {
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
      <p className="mb-1 text-sm font-semibold text-ink">{title}</p>
      <p className="mb-4 text-xs text-ink-faint">{intro}</p>
      <ol className="space-y-3">
        {steps.map((step, i) => (
          <li key={i} className="flex gap-3">
            <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-ink text-[10px] font-bold text-surface">
              {i + 1}
            </span>
            <p className="text-xs leading-relaxed text-ink-soft">{step}</p>
          </li>
        ))}
      </ol>
    </div>
  );
}

/** Per-card official-source link row. Renders nothing when no links are present. */
export function OfficialSources({
  links,
}: {
  links: { href?: string | null; label: string }[];
}) {
  const shown = links.filter((l) => l.href);
  if (!shown.length) return null;
  return (
    <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1.5 border-t border-line pt-2.5">
      <span className="text-[10px] font-semibold uppercase tracking-wide text-ink-faint">
        Official
      </span>
      {shown.map((l) => (
        <OfficialSourceLink key={l.href} href={l.href as string} label={l.label} />
      ))}
    </div>
  );
}

// ── Shared badges ─────────────────────────────────────────────────────────────

export function StatusPill({ status }: { status: ProgramStatus }) {
  const config = {
    likely: { label: "Likely", className: "bg-likely-soft text-likely-ink" },
    target: { label: "Target", className: "bg-target-soft text-target-ink" },
    reach: { label: "Reach", className: "bg-reach-soft text-reach-ink" },
  };
  const c = config[status];
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold ${c.className}`}>
      {c.label}
    </span>
  );
}

export function OfferTypeBadge({ conditional }: { conditional: boolean }) {
  return conditional ? (
    <span className="rounded bg-accent-soft px-1.5 py-0.5 text-[10px] font-medium text-ink">
      Conditional Offer
    </span>
  ) : (
    <span className="rounded bg-likely-soft px-1.5 py-0.5 text-[10px] font-medium text-likely-ink">
      Direct Offer
    </span>
  );
}

export function ScholarshipBadge({ status }: { status: ScholarshipStatus }) {
  const config = {
    likely_full: { label: "Likely Full Scholarship", className: "text-likely-ink bg-likely-soft" },
    likely_partial: { label: "Likely Partial Scholarship", className: "text-likely-ink bg-likely-soft" },
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

export function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[10px] text-ink-faint">{label}</p>
      <p className="text-xs font-semibold tabular-nums text-ink mt-0.5">{value}</p>
    </div>
  );
}

export function ChevronIcon({ open }: { open: boolean }) {
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
