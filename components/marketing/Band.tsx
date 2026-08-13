// The landing page's content container — Shell's rule, applied to marketing.
//
// Nine sections each set `max-w-6xl` independently, which is the same
// duplication `components/ui/Shell.tsx` was created to remove for the student's
// section, and it had the same consequence: 1152px of content inside a 1920px
// window, i.e. **768px of gutter** — 40% of the display, measured. The hero was
// already fixed (it runs to 1600px); everything under it was not, so the page
// got visibly narrower the moment you scrolled past the first screen.
//
// The ramp matches Shell's on purpose, so the marketing page and the product
// behind it stop disagreeing about how wide a page is: 1152 → 1280 → 1440, and
// it STOPS at 1440. Growth past that buys nothing — a card 500px wide is not
// more useful than one 360px wide.
//
// **The rule this container exists to protect: width buys COLUMNS, never line
// length.** Every band inside it either flows into more cards per row or keeps
// its prose capped. Widening the container and letting a paragraph stretch with
// it is the one change that makes a large display worse rather than better —
// the country page hit 131 characters per line that way, against a readable
// measure of 60–75.
//
// Padding stays on the `section`, not here, because the bands do not agree
// about it: some are full-bleed colour with inset content, and the counts band
// has a border that has to run to the window edge.
export function Band({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`mx-auto w-full max-w-6xl xl:max-w-7xl 2xl:max-w-[90rem] ${className}`}
    >
      {children}
    </div>
  );
}
