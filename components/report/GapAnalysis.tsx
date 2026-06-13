import type { GapItem } from "@/lib/ai/schema";

const EFFORT_META: Record<GapItem["effort"], { label: string; cls: string }> = {
  low: { label: "Low effort", cls: "bg-likely-soft text-[#2C6B4D]" },
  medium: { label: "Medium effort", cls: "bg-target-soft text-[#8A5410]" },
  high: { label: "High effort", cls: "bg-reach-soft text-[#A93B2A]" },
};

// Prioritized, specific actions — the part the student can actually act on.
export function GapAnalysis({ items }: { items: GapItem[] }) {
  const sorted = [...items].sort((a, b) => a.priority - b.priority);
  return (
    <ol className="space-y-3">
      {sorted.map((g, i) => {
        const effort = EFFORT_META[g.effort];
        return (
          <li
            key={i}
            className="flex gap-3 rounded-2xl border border-line bg-card p-4 shadow-card"
          >
            <span
              data-num
              className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-accent-soft text-sm font-semibold text-accent-ink"
            >
              {g.priority}
            </span>
            <div className="min-w-0">
              <p className="text-sm font-medium text-ink">{g.action}</p>
              <p className="mt-1 text-xs leading-relaxed text-ink-soft">
                {g.impact}
              </p>
              <span
                className={`mt-2 inline-block rounded-full px-2 py-0.5 text-[11px] font-medium ${effort.cls}`}
              >
                {effort.label}
              </span>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
