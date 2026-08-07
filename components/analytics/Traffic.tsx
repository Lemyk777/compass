"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

/**
 * Records a page view, then how long the page stayed open.
 *
 * Mounted once in the root layout. It has no props, renders nothing, and holds
 * no state that survives a reload — the ids it is attributed to live in
 * httpOnly cookies the page cannot read (lib/supabase/middleware.ts).
 *
 * TIME ON PAGE IS VISIBLE TIME, NOT WALL-CLOCK TIME. The timer pauses when the
 * tab goes to the background and resumes when it comes back. That is the whole
 * reason this component exists rather than a one-line fetch: "average session
 * 40 minutes" is nearly always someone who opened a tab and went to lunch, and
 * a founder deciding what to build from that number decides wrongly.
 */
export function Traffic() {
  const pathname = usePathname();

  // The row this component is currently timing, and the clock for it.
  const rowId = useRef<number | null>(null);
  const visibleSince = useRef<number | null>(null);
  const accumulated = useRef(0);
  // document.referrer keeps pointing at the original external page for the
  // whole client-side session, so only the first view of a page load may claim
  // one. Otherwise every navigation would re-report the same source.
  const claimedReferrer = useRef(false);

  useEffect(() => {
    if (!pathname) return;

    let cancelled = false;
    const path = pathname;

    /** Total visible milliseconds so far, including the leg in progress. */
    const elapsed = () =>
      accumulated.current +
      (visibleSince.current == null ? 0 : Date.now() - visibleSince.current);

    /**
     * Report the current page's time. Uses sendBeacon so it survives the page
     * being torn down — a normal fetch is cancelled on unload, which is why
     * "time on page" is missing from most hand-rolled analytics.
     */
    const flush = () => {
      const id = rowId.current;
      const ms = elapsed();
      if (id == null || ms < 1000) return; // under a second is noise, not a visit
      const body = JSON.stringify({ id, ms });
      if (navigator.sendBeacon) {
        navigator.sendBeacon("/api/track", new Blob([body], { type: "application/json" }));
      } else {
        void fetch("/api/track", { method: "POST", body, keepalive: true }).catch(
          () => {}
        );
      }
    };

    const onVisibility = () => {
      if (document.hidden) {
        // Bank the time and report it now: a backgrounded tab may never get
        // another chance to run code before the browser discards it.
        accumulated.current = elapsed();
        visibleSince.current = null;
        flush();
      } else if (visibleSince.current == null) {
        visibleSince.current = Date.now();
      }
    };

    // Start this page's clock. Effects run after paint, and a tab restored from
    // the background can mount hidden — so only start the clock if visible.
    accumulated.current = 0;
    visibleSince.current = document.hidden ? null : Date.now();
    rowId.current = null;

    const referrer = claimedReferrer.current ? "" : document.referrer;
    claimedReferrer.current = true;

    void fetch("/api/track", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ path, referrer }),
    })
      .then((r) => (r.ok && r.status !== 204 ? r.json() : null))
      .then((data: { id?: number } | null) => {
        // A navigation may have happened while this was in flight; attributing
        // the new page's time to the old row would be worse than losing it.
        if (!cancelled && data?.id != null) rowId.current = data.id;
      })
      .catch(() => {});

    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("pagehide", flush);

    return () => {
      cancelled = true;
      accumulated.current = elapsed();
      visibleSince.current = null;
      flush();
      rowId.current = null;
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("pagehide", flush);
    };
  }, [pathname]);

  return null;
}
