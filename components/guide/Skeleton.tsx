// The wait, drawn — shared by every guide LIST route's loading.tsx.
//
// Splitting the guide into routes created a gap a single page did not have:
// each step is a server round trip, and for a signed-in student that includes
// an auth read, so without this they pressed a tab and watched nothing happen.
// The skeleton mirrors the real layout, so nothing jumps when content lands.
//
// It is deliberately NOT mounted over the subject pages (a city, a country, an
// area of work), and that is not an oversight — see the note in
// app/guide/(index)/loading.tsx. Those pages render from static data with no
// session read, so there is no wait to draw; and a fallback there would cost us
// two things that matter more, a real 404 status for an unknown id and the
// card-to-heading morph.
export function GuideSkeleton() {
  return (
    <div className="space-y-6" role="status" aria-label="Loading">
      <div className="space-y-2.5">
        <div className="h-8 w-2/3 max-w-sm animate-pulse rounded-lg bg-line/60" />
        <div className="h-4 w-full max-w-2xl animate-pulse rounded bg-line/40" />
        <div className="h-4 w-4/5 max-w-xl animate-pulse rounded bg-line/40" />
      </div>

      <div className="h-[46px] animate-pulse rounded-2xl border border-line bg-card" />

      <ul className="grid gap-2.5 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
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
