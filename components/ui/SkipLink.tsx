import Link from "@/components/ui/Link";

/**
 * The first thing in the tab order, and invisible until it is reached.
 *
 * Measured before it existed: ten tab stops sat between the top of a guide page
 * and its `<h1>` — the logo, two header buttons, five section tabs, a breadcrumb
 * and the Close control. That is the price of arriving, and a keyboard or switch
 * user paid it again on every navigation, so reading three country profiles cost
 * thirty presses that were not about the countries. The guide is a section people
 * move through, which is exactly the shape where this stops being a formality.
 *
 * Two details that make it actually work rather than merely exist:
 *
 * `sr-only` alone would hide it from the sighted keyboard user it is FOR, so
 * `focus:not-sr-only` brings it back the moment it is reached — the standard
 * pattern, and the reason it must not be `hidden` or `display:none`.
 *
 * The target needs `tabIndex={-1}`. Without it the browser scrolls to the anchor
 * but leaves focus where it was, so the next Tab continues from the header and
 * the link silently does nothing — the failure mode that makes people think skip
 * links are decorative.
 */
export const SKIP_TARGET = "content";

export function SkipLink() {
  return (
    <Link
      href={`#${SKIP_TARGET}`}
      className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:inline-flex focus:h-11 focus:items-center focus:rounded-xl focus:bg-ink focus:px-4 focus:text-sm focus:font-medium focus:text-white focus-visible:focus-ring"
    >
      Skip to the content
    </Link>
  );
}
