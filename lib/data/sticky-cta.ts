// When the phone-only call to action at the bottom of the landing page is on
// screen — as arithmetic, with no DOM in it.
//
// It is pulled out of the component for the reason the planner's `stepStatus`
// and the mind map's geometry are: a rule that only exists inside an effect can
// only be checked by looking at it, and looking is the thing that keeps failing
// here. An `IntersectionObserver` does not fire at all in a backgrounded or
// throttled browser pane, so the bar renders correctly and measures as absent,
// which is indistinguishable from the bug. Pure functions are checkable
// wherever they run.
//
// Two edges, and they are asked different questions on purpose — see each.

export type CtaEdges = {
  /** The hero's buttons have gone up past the top of the viewport. */
  heroPassed: boolean;
  /** The closing call has been reached, and everything below it counts too. */
  finalReached: boolean;
};

export const NO_EDGES: CtaEdges = { heroPassed: false, finalReached: false };

/**
 * Fold one observer entry into the pair.
 *
 * The asymmetry is the whole content of this module:
 *
 * `heroPassed` needs `top < 0` as well as `!isIntersecting`, because those two
 * conditions describe opposite situations. An element below the fold is also
 * "not intersecting", and on first paint that is exactly what the CLOSING call
 * is — so a bar keyed on `!isIntersecting` alone would flash on at scroll
 * position zero, on top of the hero button it exists to replace.
 *
 * `finalReached` LATCHES on `top < 0` instead of unlatching. Once the closing
 * call has gone by, the only thing below it is the footer, whose links are
 * small and set close together; a bar that reappeared there would sit on top of
 * them. So "reached" means at or past, never merely "currently visible".
 */
export function foldEdge(
  prev: CtaEdges,
  edge: "hero" | "final",
  isIntersecting: boolean,
  top: number,
): CtaEdges {
  if (edge === "hero") {
    return { ...prev, heroPassed: !isIntersecting && top < 0 };
  }
  return { ...prev, finalReached: isIntersecting || top < 0 };
}

/**
 * The bar is for the stretch of page that has no call to action in it, and for
 * nothing else. One primary call per view is the product's rule everywhere; the
 * failure it prevents here is two filled buttons a few centimetres apart, which
 * is how you get neither pressed.
 */
export function stickyCtaVisible(e: CtaEdges): boolean {
  return e.heroPassed && !e.finalReached;
}
