// Shown while a guide route resolves.
//
// Splitting the guide into routes created a gap that a single page did not
// have: every step is now a server round trip, and without this the student
// pressed a tab and watched nothing happen. A skeleton that matches the real
// layout also reserves the space the content will take, so nothing jumps when
// it arrives.
//
// The tabs and the shell live in layout.tsx and stay on screen throughout — only
// the page below them is replaced, which is the whole reason the tabs are in the
// layout rather than in each page.
export default function GuideLoading() {
  return (
    <div className="space-y-6" role="status" aria-label="Loading">
      <div className="space-y-2.5">
        <div className="h-8 w-2/3 max-w-sm animate-pulse rounded-lg bg-line/60" />
        <div className="h-4 w-full max-w-2xl animate-pulse rounded bg-line/40" />
        <div className="h-4 w-4/5 max-w-xl animate-pulse rounded bg-line/40" />
      </div>

      <div className="h-[46px] animate-pulse rounded-2xl border border-line bg-card" />

      <ul className="grid gap-2.5 sm:grid-cols-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <li
            key={i}
            className="h-[132px] animate-pulse rounded-2xl border border-line bg-card"
            // Staggered like the real cards, so the wait reads as the same
            // motion resolving rather than as a different screen.
            style={{ animationDelay: `${i * 80}ms` }}
          />
        ))}
      </ul>
      <span className="sr-only">Loading</span>
    </div>
  );
}
