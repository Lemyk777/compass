"use client";

import { usePathname } from "next/navigation";
import { Link } from "@/components/ui/Link";
import { PLANNER_SECTIONS } from "@/lib/data/planner-sections";

// ONE WINDOW, three views — not three destinations.
//
// The agenda, the board and the maps are the same commitments seen three ways:
// sorted by date, grouped by state, or drawn as the decision they came out of.
// They were shipped as three tab-shaped links to three pages, each with its own
// `<h1>` and its own paragraph of explanation, and that framing is what made the
// section read as three products stapled together. It is the settled pattern
// everywhere this problem is solved well — Notion, Linear, Asana, Trello — that
// one dataset gets many views and switching between them does not feel like
// going somewhere else.
//
// So this is a SEGMENTED CONTROL: one track, one lit segment, the label of the
// current view carried inside it rather than repeated as a page heading below.
// The routes stay real URLs, because a view a student cannot send to someone —
// or return to with Back — is worse than a tab.
//
// A client island only because it needs the current path; the registry is pure
// data and travels into this bundle for free.
export function PlannerTabs() {
  const pathname = usePathname();

  // `/planner/maps/<id>` is still the maps view. Matching on the prefix rather
  // than on equality is what stops the control going blank the moment a student
  // opens one of their own maps.
  const activeId =
    PLANNER_SECTIONS.filter(
      (s) => pathname === s.href || pathname.startsWith(`${s.href}/`),
    )
      // The longest match wins, so `/planner/maps` beats `/planner`.
      .sort((a, b) => b.href.length - a.href.length)[0]?.id ??
    PLANNER_SECTIONS[0].id;

  const active = PLANNER_SECTIONS.find((s) => s.id === activeId)!;

  return (
    <div className="space-y-3">
      <nav
        aria-label="Views of your plan"
        className="inline-flex w-full max-w-md items-center gap-1 rounded-2xl border border-line bg-card p-1 sm:w-auto"
      >
        {PLANNER_SECTIONS.map((s) => {
          const on = s.id === activeId;
          return (
            <Link
              key={s.id}
              href={s.href}
              aria-current={on ? "page" : undefined}
              className={`flex-1 whitespace-nowrap rounded-xl px-3.5 py-2.5 text-center text-sm font-medium transition-colors focus-visible:focus-ring sm:flex-none ${
                on
                  ? "bg-accent-soft text-accent-ink"
                  : "text-ink-soft hover:bg-surface hover:text-ink"
              }`}
            >
              {s.label}
            </Link>
          );
        })}
      </nav>

      {/* The current view's own sentence, said ONCE and here. Each page used to
          repeat its title as an `<h1>` and its blurb underneath, so the window
          opened with two headings before any content — and the three views
          disagreed about how tall their own header was. */}
      <p className="max-w-[62ch] text-sm leading-relaxed text-ink-soft">
        {active.blurb}
      </p>
    </div>
  );
}
