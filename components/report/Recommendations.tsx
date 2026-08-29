"use client";

import type { RecommendedSchool } from "@/lib/ai/schema";
import { TIER_META } from "@/lib/tiers";
import { branchCampusFor } from "@/lib/data/branch-campuses";
import { Flag } from "@/components/ui/Flag";
import { useT } from "@/lib/i18n/client";

// Ranked school recommendations not already on the student's list.
export function Recommendations({ schools }: { schools: RecommendedSchool[] }) {
  const t = useT();
  if (!schools.length) return null;
  return (
    <ul className="space-y-3">
      {schools.map((s, i) => {
        const meta = TIER_META[s.tier];
        const branch = branchCampusFor(s.name);
        return (
          <li
            key={i}
            className="rounded-2xl border border-line/70 bg-card p-5 shadow-card transition-all duration-200 hover:shadow-lift"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex min-w-0 flex-col">
                <h3 className="text-base font-bold leading-snug text-ink">
                  {s.name}
                </h3>
                {branch && (
                  <span className="mt-1.5 inline-flex w-fit items-center gap-1.5 rounded-full bg-accent-soft px-2.5 py-0.5 text-xs font-semibold text-accent-ink shadow-sm">
                    <Flag
                      code={branch.host_code}
                      size={10}
                      className="shrink-0"
                    />
                    Campus in {branch.host_country.replace(/^the /, "")} ·
                    US-system admissions
                  </span>
                )}
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <span
                  className="rounded-full px-3 py-1 text-xs font-semibold shadow-sm"
                  style={{ backgroundColor: meta.soft, color: meta.text }}
                >
                  {t(`tier.${s.tier}`)}
                </span>
                <span data-num className="text-xs font-semibold text-ink-soft">
                  {t("report.fit")} {s.fit_score}/10
                </span>
              </div>
            </div>
            <p className="mt-2.5 text-xs leading-relaxed text-ink-soft">
              {s.why}
            </p>
          </li>
        );
      })}
    </ul>
  );
}
