import Link from "@/components/ui/Link";
import { Logo } from "@/components/ui/Logo";

// The brand mark, and it always goes home.
//
// It was seven different behaviours across seven headers: on the landing page,
// on /guide and on the signed-out /opportunities the logo was not a link at
// all; in the student nav it went to /opportunities; in the report's header to
// /dashboard; in the report's sidebar nowhere; and on /partners — alone out of
// seven — to `/`. So the single most-clicked affordance on the site did
// something different depending on which page you happened to be reading, and
// six times out of seven it did not do what everyone tries first.
//
// One component now, one destination. `/` is right for a signed-in student as
// well as a visitor because the landing page is session-aware: it already shows
// "Dashboard" instead of "Log in" and routes them onward. A logo that leads to
// a section rather than to the front door quietly tells a reader they are stuck
// in one.
//
// The `view-transition-name` travels with it, so the mark morphs between routes
// instead of cutting — it is the same object, and it should look like it.
export function BrandLink({
  className = "",
  /**
   * Only ONE element in a document may hold a given view-transition-name. A
   * page with two headers (a sticky nav and a footer mark) must opt one out.
   */
  transition = true,
}: {
  className?: string;
  transition?: boolean;
}) {
  return (
    <Link
      href="/"
      aria-label="Compass — home"
      // `min-h-11` because this is a touch target before it is a logo, and the
      // mark itself is 24px. The rest of the product's controls clear 44px and
      // the one people aim at most did not.
      className={`inline-flex min-h-11 shrink-0 items-center rounded-xl transition-opacity hover:opacity-80 focus-visible:focus-ring motion-reduce:transition-none ${className}`}
    >
      <Logo
        className="text-ink"
        style={transition ? { viewTransitionName: "brand-logo" } : undefined}
      />
    </Link>
  );
}
