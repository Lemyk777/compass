"use client";

import { useEffect, useMemo, useState } from "react";
import type { Analysis } from "@/lib/ai/schema";
import { useT } from "@/lib/i18n/client";

// Left rail for the (long) results report: in-page jump links + scrollspy.
// It derives its item set from the same analysis the report renders from, so
// the rail always matches what's on screen. Desktop only — on mobile the report
// stays a single scrolling column.
const LABEL_KEY: Record<string, string> = {
  standing: "nav.standing",
  results: "nav.results",
  costs: "nav.costs",
  plan: "nav.plan",
  timeline: "nav.timeline",
  summary: "nav.summary",
};

export function ReportNav({ analysis }: { analysis: Analysis }) {
  const t = useT();

  // Which anchors the report actually renders (mirror Report.tsx logic).
  const ids = useMemo(() => {
    const hasResults =
      analysis.schools.length > 0 ||
      (analysis.italy_programs?.length ?? 0) > 0 ||
      (analysis.hk_programs?.length ?? 0) > 0;
    const list: string[] = ["standing"];
    if (hasResults) list.push("results", "costs");
    if (analysis.gap_analysis.length > 0) list.push("plan");
    if (analysis.timeline.length > 0) list.push("timeline");
    if (analysis.summary) list.push("summary");
    return list;
  }, [analysis]);

  const [active, setActive] = useState<string>(ids[0] ?? "");

  // Scrollspy: the active section is the last one whose top has scrolled past a
  // line just below the sticky header. This stays correct at the very top of a
  // long report (first item active) where an intersection-ratio approach can
  // miss when tall sections push others out of the "active" band.
  useEffect(() => {
    const els = ids
      .map((id) => document.getElementById(id))
      .filter((el): el is HTMLElement => el != null);
    if (els.length === 0) return;

    let raf = 0;
    const update = () => {
      raf = 0;
      const threshold = 120; // px from the top, clears the sticky header
      // Pick the section whose top is closest to (but past) the line. On ties —
      // sections sharing a row, side by side — the first (left/primary) wins.
      let current = els[0].id;
      let best = -Infinity;
      for (const el of els) {
        const top = el.getBoundingClientRect().top - threshold;
        if (top <= 1 && top > best) {
          best = top;
          current = el.id;
        }
      }
      // The final section (e.g. "Summary") is often too short to ever push its
      // top above the threshold line — the page bottoms out first — so the loop
      // can never mark it active and the marker sticks on the previous item.
      // When scrolled to the very bottom, the last section is by definition the
      // one in view: select it explicitly.
      const atBottom =
        window.innerHeight + window.scrollY >=
        document.documentElement.scrollHeight - 2;
      if (atBottom) current = els[els.length - 1].id;
      setActive(current);
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };

    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [ids]);

  if (ids.length < 2) return null;

  return (
    <nav aria-label={t("nav.onThisPage")} className="hidden lg:block">
      <div className="sticky top-[76px]">
        <p className="mb-2 px-3 text-[11px] font-medium uppercase tracking-wide text-ink-faint">
          {t("nav.onThisPage")}
        </p>
        <ul className="space-y-0.5">
          {ids.map((id) => {
            const on = active === id;
            return (
              <li key={id}>
                <a
                  href={`#${id}`}
                  aria-current={on ? "true" : undefined}
                  className={`block rounded-lg border-l-2 px-3 py-2 text-sm transition-colors focus-visible:focus-ring ${
                    on
                      ? "border-accent bg-accent-soft font-medium text-accent-ink"
                      : "border-transparent text-ink-soft hover:bg-card hover:text-ink"
                  }`}
                >
                  {t(LABEL_KEY[id])}
                </a>
              </li>
            );
          })}
        </ul>
      </div>
    </nav>
  );
}
