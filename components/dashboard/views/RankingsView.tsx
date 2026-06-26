"use client";

import { useState } from "react";
import {
  computeStanding,
  LEADERBOARD_DIMS,
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

  const visible = hidden ? rows.filter((r) => r.userId !== currentUserId) : rows;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Rankings"
        hint="How your profile stacks up against everyone who's completed Compass."
      />

      {/* Top: your standing + where to focus */}
      {standing && (
        <div className="grid gap-5 lg:grid-cols-2">
          <section className="rounded-2xl border border-line bg-card p-6 shadow-card">
            <p className="text-xs font-semibold uppercase tracking-wide text-ink-faint">
              Your standing
            </p>
            <div className="mt-3 flex items-baseline gap-3">
              <span data-num className="font-display text-5xl font-semibold text-ink">
                #{standing.rank}
              </span>
              <span className="text-sm text-ink-soft">of {standing.total}</span>
            </div>
            <div className="mt-3 flex items-center gap-3 text-sm">
              <span className="rounded-full bg-likely-soft px-2.5 py-1 text-xs font-semibold text-[#2C6B4D]">
                Top {standing.topPct}%
              </span>
              <span className="text-ink-soft">
                Overall{" "}
                <span data-num className="font-semibold text-ink">
                  {standing.current.overall}
                </span>
                /100
              </span>
            </div>
          </section>

          <section className="rounded-2xl border border-line bg-card p-6 shadow-card">
            <p className="text-xs font-semibold uppercase tracking-wide text-ink-faint">
              Where to focus next
            </p>
            {standing.focus ? (
              <p className="mt-3 text-pretty leading-relaxed text-ink">
                <span className="font-semibold">{standing.focus.label}</span> is your
                weakest dimension at{" "}
                <span data-num className="font-semibold text-accent">
                  {standing.focus.score}
                </span>
                . The top {standing.focus.topK}{" "}
                {standing.focus.topK === 1 ? "student averages" : "students average"}{" "}
                <span data-num className="font-semibold text-accent">
                  {standing.focus.topAvg}
                </span>{" "}
                — closing this gap is the fastest path up the board.
              </p>
            ) : (
              <p className="mt-3 text-sm text-ink-soft">You&apos;re looking strong across the board.</p>
            )}
          </section>
        </div>
      )}

      {/* Leaderboard */}
      <section className="overflow-hidden rounded-2xl border border-line bg-card shadow-card">
        <div className="flex items-center justify-between gap-3 border-b border-line px-5 py-4">
          <h2 className="flex items-center gap-2 text-base font-semibold text-ink">
            <TrophyIcon /> Leaderboard
          </h2>
          {currentUserId && (
            <button
              type="button"
              onClick={() => setHidden((h) => !h)}
              className="text-xs font-medium text-ink-soft transition-colors hover:text-ink"
            >
              {hidden ? "Show my profile" : "Hide my profile"}
            </button>
          )}
        </div>

        {/* Header (desktop) */}
        <div className="hidden grid-cols-[3rem_minmax(0,1fr)_5rem_repeat(4,minmax(0,1fr))] gap-3 px-5 py-2.5 text-[11px] font-semibold uppercase tracking-wide text-ink-faint md:grid">
          <span>Rank</span>
          <span>Student</span>
          <span>Overall</span>
          {LEADERBOARD_DIMS.map((d) => (
            <span key={d.key}>{d.label}</span>
          ))}
        </div>

        <ul className="max-h-[60vh] overflow-y-auto">
          {visible.map((r) => {
            const rank = rows.findIndex((x) => x.userId === r.userId) + 1;
            const me = r.userId === currentUserId;
            return (
              <li
                key={r.userId}
                className={`border-t border-line px-5 py-3 md:grid md:grid-cols-[3rem_minmax(0,1fr)_5rem_repeat(4,minmax(0,1fr))] md:items-center md:gap-3 ${
                  me ? "bg-accent-soft/50" : ""
                }`}
              >
                <div className="flex items-center md:block">
                  <RankBadge rank={rank} />
                </div>

                <div className="mt-2 flex min-w-0 items-center gap-3 md:mt-0">
                  <Avatar name={r.name} highlight={me} />
                  <div className="min-w-0">
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
                </div>

                <div className="mt-2 md:mt-0">
                  <span data-num className="text-base font-semibold text-ink">
                    {r.overall}
                  </span>
                  <span className="text-xs text-ink-faint">/100</span>
                </div>

                {LEADERBOARD_DIMS.map((d) => (
                  <div key={d.key} className="mt-2 md:mt-0">
                    <div className="mb-1 flex items-baseline justify-between md:hidden">
                      <span className="text-xs text-ink-soft">{d.label}</span>
                      <span data-num className="text-xs font-semibold text-ink">
                        {r[d.key]}<span className="text-ink-faint">/10</span>
                      </span>
                    </div>
                    <div className="hidden text-sm font-semibold text-ink md:block" data-num>
                      {r[d.key]}
                      <span className="text-xs font-normal text-ink-faint">/10</span>
                    </div>
                    <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-line">
                      <div
                        className="h-full rounded-full"
                        style={{ width: `${r[d.key] * 10}%`, backgroundColor: d.color }}
                      />
                    </div>
                  </div>
                ))}
              </li>
            );
          })}
        </ul>
      </section>
    </div>
  );
}

function RankBadge({ rank }: { rank: number }) {
  const medal =
    rank === 1 ? "#D9A406" : rank === 2 ? "#9AA3B2" : rank === 3 ? "#B06B3A" : null;
  if (medal) {
    return (
      <span
        className="flex h-8 w-8 items-center justify-center rounded-full text-white"
        style={{ backgroundColor: medal }}
        title={`#${rank}`}
      >
        <TrophyIcon small />
      </span>
    );
  }
  return (
    <span data-num className="flex h-8 w-8 items-center justify-center rounded-full bg-surface text-sm font-semibold text-ink-soft">
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
    >
      <path d="M8 21h8M12 17v4M7 4h10v5a5 5 0 0 1-10 0V4Z" />
      <path d="M17 5h3v2a3 3 0 0 1-3 3M7 5H4v2a3 3 0 0 0 3 3" />
    </svg>
  );
}
