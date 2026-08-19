"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "@/components/ui/Link";
import { useTransitionRouter } from "@/components/ui/ViewTransitions";
import { previousUrl } from "@/components/guide/NavTrail";

// The way OUT of a guide sub-page.
//
// These pages replaced modal sheets, and the swap quietly took something with
// it: a sheet had an ✕, it closed on Escape, and closing put you back exactly
// where you were. A page got a breadcrumb instead — correct, but it is one line
// at the very top of a profile that runs several screens, so the moment a
// student scrolls the only exit left is the browser's own back button. That is
// the browser's chrome, not ours; on a phone it is a swipe most people never
// learn, and inside an in-app webview it may not exist at all.
//
// So: an explicit Close next to the breadcrumb, the same control following the
// student down the page once that one scrolls away, and Escape, which is what
// the sheet always answered to.
//
// Where it lands is stated, never guessed — `label` is the crumb, so the pill
// reads "← Countries" and not a bare arrow.

export function DetailExit({
  /** Where closing lands — the parent list, filter and all. */
  href,
  /** What is there, in the crumb's own words: "Countries", "Kinds of work". */
  label,
}: {
  href: string;
  label: string;
}) {
  const inline = useRef<HTMLAnchorElement>(null);
  // "The inline Close has scrolled out of reach" — the only condition under
  // which a floating duplicate is worth putting on top of the content.
  const [adrift, setAdrift] = useState(false);
  const router = useTransitionRouter();

  const leave = useCallback(() => {
    // Back only when back demonstrably means "that list" — then the browser
    // restores the student's place in it. Otherwise navigate, which is right
    // from a shared link, a reload, or a hop between two detail pages.
    if (previousUrl() === href) router.back();
    else router.push(href);
  }, [href, router]);

  // Both controls are real anchors: middle-click, copy-link and open-in-new-tab
  // all keep working, and the back optimisation is layered on top of that
  // rather than replacing it.
  const onClick = useCallback(
    (e: React.MouseEvent<HTMLAnchorElement>) => {
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button === 1) {
        return;
      }
      if (previousUrl() !== href) return; // let Link do its normal push
      e.preventDefault();
      router.back();
    },
    [href, router],
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape" || e.defaultPrevented) return;
      const t = e.target as HTMLElement | null;
      // Escape belongs to whatever is nearer the student first: a field being
      // typed in, or anything that opened over the page.
      if (
        t &&
        (t.isContentEditable ||
          t.tagName === "INPUT" ||
          t.tagName === "TEXTAREA" ||
          t.tagName === "SELECT")
      ) {
        return;
      }
      if (document.querySelector('[role="dialog"]')) return;
      leave();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [leave]);

  useEffect(() => {
    const el = inline.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    const io = new IntersectionObserver(
      ([entry]) => setAdrift(!entry.isIntersecting),
      // StudentNav is sticky and ~57px tall, so the top ~64px of the viewport
      // is not somewhere a control can actually be seen or clicked.
      { rootMargin: "-64px 0px 0px 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <>
      <Link
        ref={inline}
        href={href}
        onClick={onClick}
        aria-label={`Close, back to ${label}`}
        className="inline-flex min-h-11 shrink-0 items-center gap-1.5 rounded-xl px-2.5 text-sm font-medium text-ink-faint transition-colors hover:bg-card hover:text-ink focus-visible:focus-ring"
      >
        <CloseIcon />
        Close
        <kbd className="ml-0.5 hidden rounded border border-line bg-surface px-1.5 py-0.5 text-[12px] font-medium text-ink-faint sm:inline">
          Esc
        </kbd>
      </Link>

      {/* The same exit, once the first one is gone. It fades and lifts into
          place rather than appearing, because it arrives while the student is
          moving — a control that pops in at full opacity mid-scroll reads as
          something that just happened to the page. Hidden, it is also out of
          the tab order and out of the accessibility tree: it is a duplicate,
          and the breadcrumb above is the one that belongs in both. */}
      <Link
        href={href}
        onClick={onClick}
        tabIndex={adrift ? undefined : -1}
        aria-hidden={adrift ? undefined : true}
        className={`fixed bottom-[calc(1rem+env(safe-area-inset-bottom))] right-4 z-40 inline-flex h-11 items-center gap-2 rounded-full border border-line bg-card/95 pl-3 pr-4 text-sm font-medium text-ink-soft shadow-lift backdrop-blur transition-[opacity,transform,color,border-color] duration-300 ease-out hover:border-accent hover:text-ink active:scale-[0.97] active:duration-75 focus-visible:focus-ring motion-reduce:transition-none sm:bottom-6 sm:right-6 ${
          adrift
            ? "translate-y-0 opacity-100"
            : "pointer-events-none translate-y-3 opacity-0"
        }`}
      >
        <span aria-hidden className="text-base leading-none">
          &larr;
        </span>
        {label}
      </Link>
    </>
  );
}

function CloseIcon() {
  return (
    <svg
      className="h-3.5 w-3.5 shrink-0"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      aria-hidden
    >
      <path d="M6 6l12 12M18 6L6 18" />
    </svg>
  );
}
