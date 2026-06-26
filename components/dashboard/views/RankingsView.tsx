"use client";

import { useState, type ReactNode } from "react";
import {
  COUNTRY_SECTIONS,
  computeStanding,
  factorColor,
  legendFactors,
  rowsForCountry,
  type LeaderboardFactor,
  type LeaderboardRow,
} from "@/lib/data/leaderboard";
import { PageHeader } from "@/components/dashboard/states";

export function RankingsView({
  rows,
  currentUserId,
}: {
  rows: LeaderboardRow[];
  currentUserId: string | null;
}) {
  const [hidden, setHidden] = useState(false);
  // Allow several rows open at once; the current user's row starts expanded so
  // they see their own breakdown immediately.
  const [open, setOpen] = useState<Set<string>>(
    () => new Set(currentUserId ? [currentUserId] : [])
  );
  const standing = computeStanding(rows, currentUserId);

  if (rows.length === 0) {
    return (
      <div className="space-y-5">
        <PageHeader title="Rankings" hint="See how you compare with other students." />
        <p className="text-sm text-ink-soft">
          No ranked profiles yet. Once students complete their analysis, the
          leaderboard fills in here.
        </p>
      </div>
    );
  }

  const legend = legendFactors(rows);

  function toggle(userId: string) {
    setOpen((prev) => {
      const next = new Set(prev);
      if (next.has(userId)) next.delete(userId);
      else next.add(userId);
      return next;
    });
  }

  return (
    <div className="space-y-5">
      {/* Header: title + compact standing badge (no two big cards — tighter). */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <PageHeader
          title="Rankings"
          hint="How your profile stacks up against everyone who's completed Compass."
        />
        {standing && <StandingBadge standing={standing} />}
      </div>

      {/* Where-to-focus callout */}
      {standing?.focus && (
        <div className="flex items-start gap-3 rounded-xl border border-accent/25 bg-accent-soft/60 px-4 py-3">
          <TargetIcon />
          <p className="text-pretty text-sm leading-relaxed text-ink">
            <span className="font-semibold">{standing.focus.label}</span> is your
            weakest dimension at{" "}
            <span data-num className="font-semibold text-accent">
              {standing.focus.score}/10
            </span>
            . The top {standing.focus.topK}{" "}
            {standing.focus.topK === 1 ? "student averages" : "students average"}{" "}
            <span data-num className="font-semibold text-accent">
              {standing.focus.topAvg}/10
            </span>{" "}
            — closing this gap is the fastest path up the board.
          </p>
        </div>
      )}

      {/* Main board: everyone, ranked by overall profile score. */}
      <Board
        title="Leaderboard"
        icon={<TrophyIcon />}
        rows={rows}
        hidden={hidden}
        currentUserId={currentUserId}
        open={open}
        onToggle={toggle}
        legend={legend}
        headerRight={
          currentUserId && (
            <button
              type="button"
              onClick={() => setHidden((h) => !h)}
              className="rounded text-xs font-medium text-ink-soft transition-colors hover:text-ink focus-visible:focus-ring"
            >
              {hidden ? "Show my profile" : "Hide my profile"}
            </button>
          )
        }
      />

      {/* Per-country mini-sections: the SAME profiles and scores, filtered to
          students who applied to that destination and re-ranked within it. */}
      {COUNTRY_SECTIONS.map(({ code, label, flag }) => {
        const cohort = rowsForCountry(rows, code);
        if (cohort.length === 0) return null;
        return (
          <Board
            key={code}
            title={label}
            flag={flag}
            rows={cohort}
            hidden={hidden}
            currentUserId={currentUserId}
            open={open}
            onToggle={toggle}
          />
        );
      })}
    </div>
  );
}

/**
 * One leaderboard surface: header, optional color legend, and the ranked rows.
 * Reused by the main board and each country mini-section so they stay visually
 * and behaviorally identical. Rank is the row's position within THIS cohort, and
 * is computed from the full (sorted) cohort so hiding your own row never shifts
 * everyone else's number.
 */
function Board({
  title,
  icon,
  flag,
  rows,
  hidden,
  currentUserId,
  open,
  onToggle,
  legend,
  headerRight,
}: {
  title: string;
  icon?: ReactNode;
  flag?: string;
  rows: LeaderboardRow[];
  hidden: boolean;
  currentUserId: string | null;
  open: Set<string>;
  onToggle: (userId: string) => void;
  legend?: { key: string; label: string }[];
  headerRight?: ReactNode;
}) {
  if (rows.length === 0) return null;
  const visible = hidden ? rows.filter((r) => r.userId !== currentUserId) : rows;

  return (
    <section className="overflow-hidden rounded-2xl border border-line bg-card shadow-card">
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 border-b border-line px-5 py-4">
        <h2 className="flex items-center gap-2 text-base font-semibold text-ink">
          {flag ? (
            <span aria-hidden className="text-lg leading-none">
              {flag}
            </span>
          ) : (
            icon
          )}{" "}
          {title}
          <span data-num className="text-xs font-normal text-ink-faint">
            ({rows.length})
          </span>
        </h2>
        {headerRight}
      </div>

      {/* Shared color legend — the collapsed rows show colors only, so this is
          what maps each hue back to a factor (works for any 3–7 set). */}
      {legend && legend.length > 0 && (
        <ul className="flex flex-wrap items-center gap-x-4 gap-y-1.5 border-b border-line bg-surface/60 px-5 py-2.5">
          {legend.map((f) => (
            <li key={f.key} className="flex items-center gap-1.5">
              <span
                className="h-2 w-2 shrink-0 rounded-full"
                style={{ backgroundColor: factorColor(f.key) }}
              />
              <span className="text-[11px] font-medium text-ink-soft">
                {f.label}
              </span>
            </li>
          ))}
        </ul>
      )}

      <ul className="max-h-[64vh] divide-y divide-line overflow-y-auto">
        {visible.map((r) => {
          const rank = rows.findIndex((x) => x.userId === r.userId) + 1;
          return (
            <RowItem
              key={r.userId}
              row={r}
              rank={rank}
              me={r.userId === currentUserId}
              isOpen={open.has(r.userId)}
              onToggle={() => onToggle(r.userId)}
            />
          );
        })}
      </ul>
    </section>
  );
}

/** A single ranked profile row, with an expandable factor breakdown. */
function RowItem({
  row: r,
  rank,
  me,
  isOpen,
  onToggle,
}: {
  row: LeaderboardRow;
  rank: number;
  me: boolean;
  isOpen: boolean;
  onToggle: () => void;
}) {
  return (
    <li className={me ? "bg-accent-soft/40" : ""}>
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={isOpen}
        className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-surface/70 focus-visible:focus-ring sm:gap-4 sm:px-5"
      >
        <RankBadge rank={rank} />

        <Avatar name={r.name} highlight={me} />

        <div className="min-w-0 flex-1">
          <p className="flex items-center gap-1.5 truncate text-sm font-semibold text-ink">
            {r.name}
            {me && (
              <span className="rounded-full bg-accent px-1.5 py-0.5 text-[10px] font-semibold text-white">
                You
              </span>
            )}
          </p>
          <p className="truncate text-xs text-ink-soft">{r.major}</p>
        </div>

        {/* Factor fingerprint: one mini-bar per factor, any 3–7. */}
        <FactorSparkline factors={r.factors} />

        <div className="w-[3.25rem] shrink-0 text-right">
          <span data-num className="text-lg font-semibold tabular-nums text-ink">
            {r.overall}
          </span>
          <span className="text-[11px] text-ink-faint">/100</span>
        </div>

        <Chevron open={isOpen} />
      </button>

      {/* Expandable labeled breakdown — adapts to this row's factors. */}
      <div
        className={`grid px-4 motion-safe:transition-all motion-safe:duration-200 sm:px-5 ${
          isOpen ? "grid-rows-[1fr] pb-4" : "grid-rows-[0fr]"
        }`}
      >
        <div className="overflow-hidden">
          <FactorBreakdown factors={r.factors} />
        </div>
      </div>
    </li>
  );
}

function StandingBadge({
  standing,
}: {
  standing: NonNullable<ReturnType<typeof computeStanding>>;
}) {
  return (
    <div className="flex items-center gap-4 rounded-2xl border border-line bg-card px-4 py-2.5 shadow-card">
      <div>
        <p className="text-[10px] font-semibold uppercase tracking-wide text-ink-faint">
          Your standing
        </p>
        <p className="leading-tight">
          <span data-num className="font-display text-2xl font-semibold tabular-nums text-ink">
            #{standing.rank}
          </span>{" "}
          <span className="text-xs text-ink-soft">of {standing.total}</span>
        </p>
      </div>
      <div className="h-9 w-px bg-line" />
      <div className="text-right">
        <span className="inline-block rounded-full bg-likely-soft px-2 py-0.5 text-[11px] font-semibold text-[#2C6B4D]">
          Top {standing.topPct}%
        </span>
        <p className="mt-1 text-xs text-ink-soft">
          Overall{" "}
          <span data-num className="font-semibold tabular-nums text-ink">
            {standing.current.overall}
          </span>
          /100
        </p>
      </div>
    </div>
  );
}

function FactorSparkline({ factors }: { factors: LeaderboardFactor[] }) {
  return (
    <div className="hidden h-7 shrink-0 items-end gap-[3px] sm:flex" aria-hidden>
      {factors.map((f) => (
        <span
          key={f.key}
          title={`${f.label}: ${f.score}/10`}
          className="relative block h-full w-[5px] overflow-hidden rounded-full bg-line/70"
        >
          <span
            className="absolute inset-x-0 bottom-0 rounded-full"
            style={{ height: `${f.score * 10}%`, backgroundColor: factorColor(f.key) }}
          />
        </span>
      ))}
    </div>
  );
}

function FactorBreakdown({ factors }: { factors: LeaderboardFactor[] }) {
  return (
    <ul className="space-y-2 pl-3 pt-1 sm:pl-[4.25rem]">
      {factors.map((f) => (
        <li
          key={f.key}
          className="grid grid-cols-[5.5rem_1fr_2.5rem] items-center gap-3 sm:grid-cols-[10rem_1fr_2.75rem]"
        >
          <span className="truncate text-xs font-medium text-ink-soft">
            {f.label}
          </span>
          <span className="h-1.5 overflow-hidden rounded-full bg-line">
            <span
              className="block h-full rounded-full"
              style={{ width: `${f.score * 10}%`, backgroundColor: factorColor(f.key) }}
            />
          </span>
          <span data-num className="text-right text-xs font-semibold tabular-nums text-ink">
            {f.score}
            <span className="font-normal text-ink-faint">/10</span>
          </span>
        </li>
      ))}
    </ul>
  );
}

function RankBadge({ rank }: { rank: number }) {
  const medal =
    rank === 1 ? "#D9A406" : rank === 2 ? "#9AA3B2" : rank === 3 ? "#B06B3A" : null;
  if (medal) {
    return (
      <span
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-white"
        style={{ backgroundColor: medal }}
        title={`#${rank}`}
      >
        <TrophyIcon small />
      </span>
    );
  }
  return (
    <span
      data-num
      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-surface text-sm font-semibold tabular-nums text-ink-soft"
    >
      {rank}
    </span>
  );
}

function Avatar({ name, highlight }: { name: string; highlight?: boolean }) {
  const initials = name
    .split(" ")
    .map((w) => w[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
  return (
    <span
      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${
        highlight ? "bg-accent text-white" : "bg-accent-soft text-accent-ink"
      }`}
    >
      {initials || "?"}
    </span>
  );
}

function Chevron({ open }: { open: boolean }) {
  return (
    <svg
      className={`h-4 w-4 shrink-0 text-ink-faint transition-transform duration-200 ${
        open ? "rotate-180" : ""
      }`}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}

function TargetIcon() {
  return (
    <svg
      className="mt-0.5 h-5 w-5 shrink-0 text-accent"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <circle cx="12" cy="12" r="9" />
      <circle cx="12" cy="12" r="5" />
      <circle cx="12" cy="12" r="1" />
    </svg>
  );
}

function TrophyIcon({ small = false }: { small?: boolean }) {
  return (
    <svg
      className={small ? "h-4 w-4" : "h-5 w-5 text-target"}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M8 21h8M12 17v4M7 4h10v5a5 5 0 0 1-10 0V4Z" />
      <path d="M17 5h3v2a3 3 0 0 1-3 3M7 5H4v2a3 3 0 0 0 3 3" />
    </svg>
  );
}
