"use client";

import type { SchoolLikelihood } from "@/lib/ai/schema";
import { TIER_HEX, TIER_META } from "@/lib/tiers";
import { resolveSchoolDeadlines } from "@/lib/data/app-deadlines";
import { formatDate } from "@/lib/data/opportunity-format";
import { branchCampusFor, type BranchCampus } from "@/lib/data/branch-campuses";
import { Flag } from "@/components/ui/Flag";
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
  const branch = branchCampusFor(school.name);
  const low = Math.max(0, Math.min(100, school.likelihood_low));
  const high = Math.max(low, Math.min(100, school.likelihood_high));

  // Only show deadlines that haven't passed for this cycle, soonest first.
  const deadlines = today
    ? resolveSchoolDeadlines(school.name, today, graduationYear).filter(
        (d) => !d.passed,
      )
    : [];

  return (
    <div className="rounded-2xl border border-line/70 bg-card p-5 shadow-card transition-all duration-200 hover:shadow-lift">
      <div className="flex items-start justify-between gap-3">
        <h3 className="text-base font-bold leading-snug text-ink">
          {school.name}
        </h3>
        <span
          className="shrink-0 rounded-full px-3 py-1 text-xs font-semibold shadow-sm"
          style={{ backgroundColor: meta.soft, color: meta.text }}
        >
          {t(`tier.${school.tier}`)}
        </span>
      </div>

      <div className="mt-3 flex items-baseline gap-2">
        <span data-num className="font-display text-2xl font-bold text-ink">
          {low}–{high}%
        </span>
        <span className="text-xs font-medium text-ink-faint">
          {t(`conf.${school.confidence}`)}
        </span>
      </div>

      {/* Range track */}
      <div className="relative mt-2.5 h-2.5 w-full rounded-full bg-line/80 shadow-inner">
        <div
          className="absolute top-0 h-full rounded-full shadow-sm"
          style={{
            left: `${low}%`,
            width: `${Math.max(2, high - low)}%`,
            backgroundColor: color,
          }}
        />
      </div>
      <div className="mt-1 flex justify-between text-[12px] font-medium text-ink-faint">
        <span>0%</span>
        <span>50%</span>
        <span>100%</span>
      </div>

      <p className="mt-3 text-xs leading-relaxed text-ink-soft">
        {school.reason}
      </p>

      {branch && <BranchCampusPanel branch={branch} />}

      {deadlines.length > 0 && (
        <div className="mt-3.5 border-t border-line/60 pt-3">
          <p className="mb-2 text-[12px] font-bold uppercase tracking-wider text-ink-faint">
            Application deadlines
          </p>
          <ul className="space-y-2">
            {deadlines.map((d) => (
              <li
                key={d.stage}
                className="flex items-center justify-between gap-2 text-xs"
              >
                <span className="flex min-w-0 items-center gap-1.5">
                  <span className="font-semibold text-ink">{d.short}</span>
                  {d.binding && (
                    <span className="shrink-0 rounded-md bg-reach-soft px-1.5 py-0.5 text-[12px] font-bold text-reach-ink shadow-sm">
                      Binding
                    </span>
                  )}
                </span>
                <span className="flex shrink-0 items-center gap-2 text-ink-soft">
                  <span data-num className="tabular-nums font-medium">
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

/**
 * Hybrid-school explainer: this campus is in another country, but its odds
 * above were computed under the US system — the student applies through the
 * Common App (or the parent's US application) and is reviewed holistically.
 */
function BranchCampusPanel({ branch }: { branch: BranchCampus }) {
  return (
    <div className="mt-3 rounded-xl border border-accent/20 bg-accent-soft/50 p-3">
      <p className="flex items-center gap-1.5 text-[12px] font-semibold uppercase tracking-wide text-accent-ink">
        <Flag code={branch.host_code} size={11} className="shrink-0" />
        Campus in {branch.host_country.replace(/^the /, "")} · US-system
        admissions
      </p>
      <p className="mt-1 text-xs leading-relaxed text-ink-soft">
        This is {branch.parent_name}&apos;s campus in {branch.host_city},{" "}
        {branch.host_country}. Admissions don&apos;t follow the local system.
        You apply through {branch.application} and are reviewed holistically,
        like a US applicant, so the odds above use the US methodology.
      </p>
    </div>
  );
}

/** Days-left pill, coloured by urgency (mirrors the Timeline countdown). */
function DeadlinePill({ days }: { days: number }) {
  const tone =
    days <= 14
      ? "bg-reach-soft text-reach-ink"
      : days <= 30
        ? "bg-target-soft text-target-ink"
        : "bg-likely-soft text-likely-ink";
  const text = days === 0 ? "today" : days === 1 ? "1 day" : `${days} days`;
  return (
    <span
      data-num
      className={`whitespace-nowrap rounded-full px-2 py-0.5 text-[12px] font-semibold tabular-nums ${tone}`}
    >
      {text}
    </span>
  );
}
