"use client";

import { useEffect, useRef } from "react";
import { usePathname, useSearchParams } from "next/navigation";

// One fact, kept for the whole time the guide is open: which URL the student was
// on immediately before the one they are on now.
//
// It exists so that "close this page" can be the *browser's* back when — and
// only when — the page behind us is the list we would otherwise navigate to.
// The difference is the student's place in that list: a plain link to
// /guide/cities re-renders it at the top, and after reading three cities in
// Kazakhstan that means scrolling the whole map again. A back navigation
// restores the scroll position the browser already saved.
//
// Deliberately module-level rather than sessionStorage: a fresh page load must
// forget it. After a reload we genuinely do not know what is behind us, and
// "close" then has to be the honest, deterministic thing — a link to the list.
//
// Rendered once, by the guide's layout, so it observes every navigation inside
// the section (the layout survives them; the pages do not).

let previous: string | null = null;
let current: string | null = null;

/**
 * The URL the student came from, or `null` when we cannot know — a first paint,
 * a reload, or an arrival from outside the guide. Read it at the moment of the
 * click, never during render: the layout's effect that records it runs *after*
 * a child page's mount effect, so at mount time it is still one navigation
 * behind.
 */
export function previousUrl(): string | null {
  return previous;
}

export function NavTrail() {
  const pathname = usePathname();
  const search = useSearchParams().toString();
  const mounted = useRef(false);

  useEffect(() => {
    const url = search ? `${pathname}?${search}` : pathname;

    if (!mounted.current) {
      // The section just opened. Whatever a previous visit left here is stale —
      // claiming to know the page behind us would send "close" backwards out of
      // the guide entirely.
      mounted.current = true;
      previous = null;
      current = url;
      return;
    }

    if (url !== current) {
      previous = current;
      current = url;
    }
  }, [pathname, search]);

  return null;
}
