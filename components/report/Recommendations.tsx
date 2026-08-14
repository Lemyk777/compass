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
            className="rounded-2xl border border-line bg-card p-4 shadow-card"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex min-w-0 flex-col">
                <h3 className="text-[0.95rem] font-semibold leading-tight text-ink">
                  {s.name}
                </h3>
                {branch && (
                  <span className="mt-1.5 inline-flex w-fit items-center gap-1.5 rounded-full bg-accent-soft px-2 py-0.5 text-[11px] font-semibold text-accent-ink">
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
                  className="rounded-full px-2.5 py-1 text-xs font-medium"
                  style={{ backgroundColor: meta.soft, color: meta.text }}
                >
                  {t(`tier.${s.tier}`)}
                </span>
                <span data-num className="text-xs font-medium text-ink-soft">
                  {t("report.fit")} {s.fit_score}/10
                </span>
              </div>
            </div>
            <p className="mt-2 text-xs leading-relaxed text-ink-soft">
              {s.why}
            </p>
          </li>
        );
      })}
    </ul>
  );
}
