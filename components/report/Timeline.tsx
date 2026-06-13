import type { TimelineBlock } from "@/lib/ai/schema";

// Action timeline grouped by horizon.
export function Timeline({ blocks }: { blocks: TimelineBlock[] }) {
  if (!blocks.length) return null;
  return (
    <div className="space-y-5">
      {blocks.map((b, i) => (
        <div key={i} className="relative pl-6">
          <span className="absolute left-0 top-1 h-3 w-3 rounded-full border-2 border-accent bg-card" />
          {i < blocks.length - 1 && (
            <span className="absolute left-[5px] top-4 h-[calc(100%+0.5rem)] w-px bg-line" />
          )}
          <p className="text-sm font-semibold text-ink">{b.horizon}</p>
          <ul className="mt-1.5 space-y-1.5">
            {b.items.map((item, j) => (
              <li key={j} className="flex gap-2 text-sm text-ink-soft">
                <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-ink-faint" />
                {item}
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}
