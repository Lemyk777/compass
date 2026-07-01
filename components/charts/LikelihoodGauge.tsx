"use client";

import type { SchoolLikelihood } from "@/lib/ai/schema";
import { TIER_HEX, TIER_META } from "@/lib/tiers";
import { resolveSchoolDeadlines } from "@/lib/data/app-deadlines";
import { formatDate } from "@/lib/data/key-dates";
import { useT } from "@/lib/i18n/client";

// Per-school admission-likelihood gauge: a range band (low–high) on a 0–100
// track, coloured by tier. Always a range, never a single number (§7.2).
// When `today` is known (resolved on the client to avoid hydration drift) we
// also surface this school's real application deadlines, dated to the student's
// cycle with a live countdown.
export function LikelihoodGauge({
  school,
  today,
  graduationYear,
}: {
  school: SchoolLikelihood;
  today?: Date | null;
  graduationYear?: number;
}) {
  const t = useT();
  const color = TIER_HEX[school.tier];
  const meta = TIER_META[school.tier];
  const low = Math.max(0, Math.min(100, school.likelihood_low));
  const high = Math.max(low, Math.min(100, school.likelihood_high));

  // Only show deadlines that haven't passed for this cycle, soonest first.
  const deadlines = today
    ? resolveSchoolDeadlines(school.name, today, graduationYear).filter(
        (d) => !d.passed
      )
    : [];

  return (
    <div className="rounded-2xl border border-line bg-card p-4 shadow-card">
      <div className="flex items-start justify-between gap-3">
        <h3 className="text-[0.95rem] font-semibold leading-tight text-ink">
          {school.name}
        </h3>
        <span
          className="shrink-0 rounded-full px-2.5 py-1 text-xs font-medium"
          style={{ backgroundColor: meta.soft, color: meta.text }}
        >
          {t(`tier.${school.tier}`)}
        </span>
      </div>

      <div className="mt-3 flex items-baseline gap-2">
        <span data-num className="font-display text-xl font-semibold text-ink">
          {low}–{high}%
        </span>
        <span className="text-xs text-ink-faint">
          {t(`conf.${school.confidence}`)}
        </span>
      </div>

      {/* Range track */}
      <div className="relative mt-2 h-2.5 w-full rounded-full bg-line">
        <div
          className="absolute top-0 h-full rounded-full"
          style={{
            left: `${low}%`,
            width: `${Math.max(2, high - low)}%`,
            backgroundColor: color,
          }}
        />
      </div>
      <div className="mt-1 flex justify-between text-[10px] text-ink-faint">
        <span>0%</span>
        <span>50%</span>
        <span>100%</span>
      </div>

      <p className="mt-2.5 text-xs leading-relaxed text-ink-soft">
        {school.reason}
      </p>

      {deadlines.length > 0 && (
        <div className="mt-3 border-t border-line pt-2.5">
          <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wide text-ink-faint">
            Application deadlines
          </p>
          <ul className="space-y-1.5">
            {deadlines.map((d) => (
              <li
                key={d.stage}
                className="flex items-center justify-between gap-2 text-xs"
              >
                <span className="flex min-w-0 items-center gap-1.5">
                  <span className="font-medium text-ink">{d.short}</span>
                  {d.binding && (
                    <span className="shrink-0 rounded bg-reach-soft px-1.5 py-0.5 text-[10px] font-semibold text-reach">
                      Binding
                    </span>
                  )}
                </span>
                <span className="flex shrink-0 items-center gap-2 text-ink-soft">
                  <span data-num className="tabular-nums">
                    {formatDate(d.date)}
                  </span>
                  <DeadlinePill days={d.daysLeft} />
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

/** Days-left pill, coloured by urgency (mirrors the Timeline countdown). */
function DeadlinePill({ days }: { days: number }) {
  const tone =
    days <= 14
      ? "bg-reach-soft text-reach"
      : days <= 30
        ? "bg-target-soft text-target"
        : "bg-likely-soft text-[#2C6B4D]";
  const text = days === 0 ? "today" : days === 1 ? "1 day" : `${days} days`;
  return (
    <span
      data-num
      className={`whitespace-nowrap rounded-full px-2 py-0.5 text-[10px] font-semibold tabular-nums ${tone}`}
    >
      {text}
    </span>
  );
}
