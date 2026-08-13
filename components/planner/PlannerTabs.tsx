"use client";

import { usePathname } from "next/navigation";
import { Link } from "@/components/ui/Link";
import { PLANNER_SECTIONS } from "@/lib/data/planner-sections";

// Reads the registry, exactly like the guide's tabs. A client island only
// because it needs the current path — the registry itself is pure data, so it
// travels into this bundle for free.
export function PlannerTabs() {
  const pathname = usePathname();

  return (
    <nav aria-label="Planner" className="flex flex-wrap items-center gap-1">
      {PLANNER_SECTIONS.map((s) => {
        const on = pathname === s.href;
        return (
          <Link
            key={s.id}
            href={s.href}
            aria-current={on ? "page" : undefined}
            className={`rounded-xl px-3 py-2 text-sm font-medium transition-colors focus-visible:focus-ring ${
              on
                ? "bg-accent-soft text-accent-ink"
                : "text-ink-soft hover:bg-card hover:text-ink"
            }`}
          >
            {s.label}
          </Link>
        );
      })}
    </nav>
  );
}
