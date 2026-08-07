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
}: {
  children: React.ReactNode;
  className?: string;
  as?: "div" | "main" | "header";
}) {
  return (
    <Tag
      className={`mx-auto w-full max-w-5xl px-4 sm:px-6 lg:max-w-6xl xl:max-w-7xl xl:px-8 2xl:max-w-[90rem] ${className}`}
    >
      {children}
    </Tag>
  );
}
