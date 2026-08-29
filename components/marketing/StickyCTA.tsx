"use client";

import { useEffect, useState } from "react";
import {
  foldEdge,
  stickyCtaVisible,
  NO_EDGES,
  type CtaEdges,
} from "@/lib/data/sticky-cta";

// The way in, kept within thumb's reach on a phone.
//
// The landing page runs about six screens on a 375px display, and both of its
// calls to action are at the ends: one in the hero, one in the close. Everything
// between them — the counts, how it works, why lists fail, the guide, the
// planner, the report — is read with nothing on screen to act on. A reader
// convinced in the middle has to scroll to one end or the other to do anything
// about it, and that is the whole of what this fixes.
//
// It obeys the same rule as the rest of the product: ONE primary call per view.
// So it is not simply pinned. It appears only in the stretch where there is
// nothing else to press, and both edges of that stretch are observed rather
// than guessed at with a scroll offset:
//
//   • not until the hero's own buttons have gone. Two filled controls three
//     centimetres apart is how you get neither pressed — the same mistake the
//     companion made against itself with the reaction pair and the move.
//   • gone again from the moment the closing call is reached, and it stays gone
//     below that: `finalReached` latches on the element's top passing the top of
//     the viewport, so the bar cannot come back over the footer, where the links
//     are small and a floating bar would sit exactly on them.
//
// Phones only (`md:hidden`). On a wider screen the hero's buttons and the close
// are never far, and the page has no scroll problem worth covering content for.

/** The hero's button row. The bar waits for this to leave. */
export const HERO_CTA_ID = "hero-cta";
/** The closing call. The bar is gone from here down. */
export const FINAL_CTA_ID = "final-cta";

export function StickyCTA({ children }: { children: React.ReactNode }) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const hero = document.getElementById(HERO_CTA_ID);
    const final = document.getElementById(FINAL_CTA_ID);
    // Nothing to measure against means nothing to show. A bar that guessed
    // would be worse than no bar.
    if (!hero || !final) return;

    // The decision itself lives in `lib/data/sticky-cta.ts` and is unit-tested.
    // What is left here is only the wiring: read the entries, keep the pair,
    // ask. An `IntersectionObserver` cannot be exercised in a throttled or
    // backgrounded pane — it does not fire at all — so a rule written inline
    // here would be a rule nothing could check.
    let edges: CtaEdges = NO_EDGES;

    const io = new IntersectionObserver((entries) => {
      for (const e of entries) {
        edges = foldEdge(
          edges,
          e.target === hero ? "hero" : "final",
          e.isIntersecting,
          e.boundingClientRect.top,
        );
      }
      setShow(stickyCtaVisible(edges));
    });

    io.observe(hero);
    io.observe(final);
    return () => io.disconnect();
  }, []);

  return (
    // The `hidden` ATTRIBUTE rather than an opacity class, and that is an
    // accessibility decision rather than a stylistic one: this is a duplicate of
    // a control that exists elsewhere on the page, so while it is away it must
    // be out of the tab order and out of the accessibility tree too. Fading it
    // to `opacity: 0` leaves a focusable link a keyboard lands on and a screen
    // reader announces, with nothing visible to explain it.
    //
    // No display utility on this element on purpose — `flex` here would beat the
    // user-agent rule for `[hidden]` and the bar would never hide. It sits on
    // the inner row instead. Going from `display: none` back to displayed is
    // also what replays the entrance below, so it costs nothing to animate.
    <div
      hidden={!show}
      className="fixed inset-x-0 bottom-0 z-40 md:hidden"
      // Not a landmark: the same link is already in the page's own content, and
      // announcing a second navigation region for a duplicate is noise.
    >
      <div className="animate-fade-up flex items-center gap-3 border-t border-line bg-card/95 px-4 pb-[calc(0.75rem+env(safe-area-inset-bottom))] pt-3 shadow-lift backdrop-blur">
        {children}
      </div>
    </div>
  );
}
