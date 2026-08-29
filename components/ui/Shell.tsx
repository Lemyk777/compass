// The one content container for the student's section.
//
// It was `max-w-5xl` — 1024px — set independently in three files. On a 1920px
// display that left roughly 900px of empty gutter, and because the width was
// never used, everything the page had to say was spent as HEIGHT instead: the
// scroll bar was long for no reason a reader could see.
//
// The width is a scale, not a number, and it stops at 1440. Growth past that
// buys nothing: a card 500px wide is not more useful than one 360px wide, and a
// paragraph that keeps stretching stops being readable — which is the rule that
// makes this a container and not a `w-full`.
//
// **Width buys columns, never line length.** Every page inside this container
// keeps its prose capped (`max-w-2xl`, ≈70 characters) and answers extra width
// by showing MORE cards per row, or by moving a side rail up beside the content.
// Stretching the text to the container is the one change that would make a wide
// screen worse instead of better.
//
// Gutters grow with the container (16 → 24 → 32px), which is what stops the
// content from looking like it is jammed against the window on a large monitor.
export function Shell({
  children,
  className = "",
  as: Tag = "div",
  id,
  tabIndex,
}: {
  children: React.ReactNode;
  className?: string;
  as?: "div" | "main" | "header";
  /** Anchor for the skip link when this is the `main` landmark. */
  id?: string;
  /** `-1` so the skip link can move focus here, not just scroll to it. */
  tabIndex?: number;
}) {
  return (
    <Tag
      id={id}
      tabIndex={tabIndex}
      className={`w-full max-w-[90rem] mx-auto px-4 sm:px-6 md:px-8 lg:px-10 xl:px-12 2xl:px-14 ${className}`}
    >
      {children}
    </Tag>
  );
}
