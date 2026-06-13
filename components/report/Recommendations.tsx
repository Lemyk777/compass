import type { RecommendedSchool } from "@/lib/ai/schema";
import { TIER_META } from "@/lib/tiers";

// Ranked school recommendations not already on the student's list.
export function Recommendations({ schools }: { schools: RecommendedSchool[] }) {
  if (!schools.length) return null;
  return (
    <ul className="space-y-3">
      {schools.map((s, i) => {
        const meta = TIER_META[s.tier];
        return (
          <li
            key={i}
            className="rounded-2xl border border-line bg-card p-4 shadow-card"
          >
            <div className="flex items-start justify-between gap-3">
              <h3 className="text-[0.95rem] font-semibold leading-tight text-ink">
                {s.name}
              </h3>
              <div className="flex shrink-0 items-center gap-2">
                <span
                  className="rounded-full px-2.5 py-1 text-xs font-medium"
                  style={{ backgroundColor: meta.soft, color: meta.text }}
                >
                  {meta.label}
                </span>
                <span data-num className="text-xs font-medium text-ink-soft">
                  fit {s.fit_score}/10
                </span>
              </div>
            </div>
            <p className="mt-2 text-xs leading-relaxed text-ink-soft">{s.why}</p>
          </li>
        );
      })}
    </ul>
  );
}
