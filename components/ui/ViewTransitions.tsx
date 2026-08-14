"use client";

import React, {
  createContext,
  useContext,
  useCallback,
  useState,
  useEffect,
  useRef,
  useTransition,
  useMemo,
} from "react";
import { usePathname, useRouter } from "next/navigation";

// A view transition FREEZES the document. The browser paints a static snapshot
// and stops responding to scroll until the callback's promise settles. For the
// ~200ms a warm client navigation takes that is invisible, and it is the
// mechanism the guide's card→page morph depends on.
//
// It is also how this file used to hang the page, in two ways that were
// reported as separate bugs and are the same defect — an unbounded freeze:
//
//  1. **A hash click froze the page for seconds.** Clicking "On this page"
//     fires `popstate`, which started a transition whose promise was resolved
//     only when the PATHNAME changed. A fragment navigation never changes the
//     pathname, so the promise never settled, and the document stayed frozen
//     until the browser's own internal timeout gave up. The wheel did nothing,
//     and then every queued scroll event applied at once.
//  2. **A cold guide route froze the page for ~2s.** The guide is
//     `force-dynamic`, so `router.push` waits on a server round trip — and the
//     document stayed frozen for the whole of it. Measured at 2130ms with an
//     idle main thread: nothing was slow, the page was simply held.
//
// Hence the two rules here. A transition must be able to tell when it has
// nothing to transition TO, and **no transition may hold the document longer
// than a gesture**. If the route is slower than the deadline, the freeze ends
// and the navigation completes as an ordinary one — a plain cut is far better
// than a page that appears broken.

/**
 * The longest the document may stay frozen. Past this the snapshot is released
 * and the navigation finishes without a morph.
 *
 * 400ms is chosen against the freeze being *perceptible*, not against the
 * animation being complete: under ~100ms reads as instant, and by ~400ms a
 * held page reads as a stuck one. A warm route resolves in ~200ms and never
 * reaches this; a cold `force-dynamic` route now degrades instead of hanging.
 */
const MAX_FREEZE_MS = 400;

const ViewTransitionsContext = createContext<React.Dispatch<
  React.SetStateAction<(() => void) | null>
> | null>(null);

/**
 * Whether a transition should run at all.
 *
 * Includes the reduced-motion check, which the global CSS guard cannot make on
 * its own: `globals.css` zeroes `::view-transition-*` durations, but a
 * zero-duration transition is still a transition — it still freezes the
 * document while the promise is outstanding. A reader who asked for less motion
 * should get no freeze, not a fast one.
 */
function canTransition(): boolean {
  if (typeof document === "undefined") return false;
  if (!("startViewTransition" in document)) return false;
  if (typeof window.matchMedia !== "function") return true;
  return !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export function ViewTransitions({ children }: { children: React.ReactNode }) {
  const [finishViewTransition, setFinishViewTransition] = useState<
    (() => void) | null
  >(null);

  useEffect(() => {
    if (finishViewTransition) {
      finishViewTransition();
      setFinishViewTransition(null);
    }
  }, [finishViewTransition]);

  const pathname = usePathname();
  const currentPathname = useRef(pathname);
  // A ref rather than state: this is a latch read from an event handler and a
  // cleanup, never rendered. As state it also re-ran the effect that resolves
  // it, which is how the two halves could get out of step.
  const pending = useRef<{ resolve: () => void; timer: number } | null>(null);

  useEffect(() => {
    if (!canTransition()) return;

    const onPopState = () => {
      // The hash-click fix. A fragment navigation fires popstate WITHOUT
      // changing the pathname — there is no new document to morph into, and
      // the resolve below is keyed on the pathname changing, so a transition
      // started here could never end. Nothing to transition: leave.
      if (window.location.pathname === currentPathname.current) return;
      // Never stack one freeze on another.
      if (pending.current) return;

      let resolveTransition: () => void = () => {};
      const promise = new Promise<void>((resolve) => {
        resolveTransition = resolve;
      });

      // The deadline. Whatever happens to the navigation — a slow dynamic
      // route, an aborted fetch, a pathname that never arrives — the document
      // is released on a fixed timer rather than on a condition that might
      // never hold.
      const timer = window.setTimeout(() => {
        pending.current = null;
        resolveTransition();
      }, MAX_FREEZE_MS);

      pending.current = { resolve: resolveTransition, timer };
      (
        document as unknown as {
          startViewTransition: (cb: () => Promise<void>) => unknown;
        }
      ).startViewTransition(() => promise);
    };

    window.addEventListener("popstate", onPopState);
    return () => {
      window.removeEventListener("popstate", onPopState);
    };
  }, []);

  useEffect(() => {
    const p = pending.current;
    if (p && currentPathname.current !== pathname) {
      window.clearTimeout(p.timer);
      pending.current = null;
      p.resolve();
    }
    currentPathname.current = pathname;
  }, [pathname]);

  return (
    <ViewTransitionsContext.Provider value={setFinishViewTransition}>
      {children}
    </ViewTransitionsContext.Provider>
  );
}

export function useTransitionRouter() {
  const router = useRouter();
  const setFinishViewTransition = useContext(ViewTransitionsContext);
  const [, startReactTransition] = useTransition();

  const triggerTransition = useCallback(
    (cb: () => void) => {
      if (!canTransition() || !setFinishViewTransition) {
        cb();
        return;
      }
      (
        document as unknown as {
          startViewTransition: (cb: () => Promise<void>) => unknown;
        }
      ).startViewTransition(
        () =>
          new Promise<void>((resolve) => {
            // Same deadline as popstate, and this is the path that actually hit
            // it: every in-guide navigation comes through here, and the guide
            // renders per request. The document must not wait on the server.
            const timer = window.setTimeout(resolve, MAX_FREEZE_MS);
            const finish = () => {
              window.clearTimeout(timer);
              resolve();
            };
            startReactTransition(() => {
              cb();
              // `setState(() => fn)` — the updater form, so the stored value is
              // `finish` itself rather than the result of calling it.
              setFinishViewTransition(() => finish);
            });
          }),
      );
    },
    [setFinishViewTransition, startReactTransition],
  );

  const push = useCallback(
    (href: string, options?: Parameters<typeof router.push>[1]) => {
      triggerTransition(() => router.push(href, options));
    },
    [triggerTransition, router],
  );

  const replace = useCallback(
    (href: string, options?: Parameters<typeof router.replace>[1]) => {
      triggerTransition(() => router.replace(href, options));
    },
    [triggerTransition, router],
  );

  return useMemo(
    () => ({
      ...router,
      push,
      replace,
    }),
    [router, push, replace],
  );
}
