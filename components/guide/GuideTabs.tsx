"use client";

import { useEffect, useRef } from "react";
import Link from "@/components/ui/Link";
import { usePathname, useSearchParams } from "next/navigation";
import { GUIDE_SECTIONS } from "@/lib/data/guide-sections";

// The guide's own navigation, one level below StudentNav.
//
// It replaces a row of `#anchor` links that looked exactly like tabs and were
// not: they scrolled, they never changed the URL, they carried no aria-current,
// and they sat `sticky top-16` directly under an already-sticky header, which on
// a 375px screen spent two bars of vertical space telling the student where they
// were. These are real routes.
//
// Deliberately NOT sticky. StudentNav is; a second sticky strip under it is how
// a phone ends up with a third of the viewport permanently spent on chrome.
//
// The current query string rides along on every tab, because the field filter
// lives in the URL now (lib/data/guide-fields.ts) and moving between steps must
// not silently widen the guide back out.

export function GuideTabs() {
  const pathname = usePathname();
  const search = useSearchParams().toString();
  const query = search ? `?${search}` : "";
  const strip = useRef<HTMLElement>(null);
  const settled = useRef(false);

  // On a phone the row is 660px wide inside 375px, so "From home" sits at 513px
  // — land there from a link and the strip shows four tabs, none of them the one
  // you are on, and claims you are nowhere.
  //
  // Scroll the strip itself, never the page: `scrollIntoView` would drag the
  // document too and throw the reader past the heading they just arrived at.
  // Instant on the first paint, animated afterwards — arriving somewhere is not
  // a movement the reader made, so animating it is motion without a cause.
  useEffect(() => {
    const el = strip.current;
    const active = el?.querySelector<HTMLElement>('[aria-current="page"]');
    const wasSettled = settled.current;
    settled.current = true;
    if (!el || !active) return;

    const visible =
      active.offsetLeft >= el.scrollLeft &&
      active.offsetLeft + active.offsetWidth <= el.scrollLeft + el.clientWidth;
    if (visible) return;

    el.scrollTo({
      left: Math.max(0, active.offsetLeft - 16),
      behavior:
        wasSettled &&
        !window.matchMedia("(prefers-reduced-motion: reduce)").matches
          ? "smooth"
          : "auto",
    });
  }, [pathname]);

  const tabs = [
    { href: "/guide", label: "Overview", step: null as number | null },
    ...GUIDE_SECTIONS.map((s) => ({
      href: s.href,
      label: s.label,
      step: s.step,
    })),
  ];

  return (
    <nav
      ref={strip}
      aria-label="The guide"
      // Scrolls itself on narrow screens so the page never does. The negative
      // margin lets the row bleed to the screen edge, which is what makes it
      // read as scrollable instead of as a clipped list.
      className="-mx-4 overflow-x-auto px-4 pb-1 sm:-mx-6 sm:px-6"
    >
      <ul className="flex w-max gap-1.5">
        {tabs.map((t) => {
          const on =
            t.href === "/guide"
              ? pathname === "/guide"
              : pathname === t.href || pathname.startsWith(`${t.href}/`);
          return (
            <li key={t.href}>
              <Link
                href={`${t.href}${query}`}
                aria-current={on ? "page" : undefined}
                className={`flex h-11 items-center gap-2 whitespace-nowrap rounded-xl px-3.5 text-sm font-medium transition-[background-color,color,transform] duration-200 ease-out active:scale-[0.97] active:duration-75 focus-visible:focus-ring motion-reduce:transform-none motion-reduce:transition-none ${
                  on
                    ? "bg-accent-soft text-accent-ink"
                    : "text-ink-soft hover:bg-card hover:text-ink"
                }`}
              >
                {t.step !== null && (
                  <span
                    data-num
                    aria-hidden
                    className={`inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[12px] font-semibold ${
                      on
                        ? "bg-accent text-on-fill"
                        : "bg-line/70 text-ink-faint"
                    }`}
                  >
                    {t.step}
                  </span>
                )}
                {t.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
