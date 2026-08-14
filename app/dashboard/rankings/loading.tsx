// Leaderboard-shaped skeleton for the Rankings section — this is the one
// dashboard page that does a real server fetch (the cross-user leaderboard), so
// it keeps a loading state. Its shape mirrors RankingsView (header + standing
// badge + a board card of ranked rows), not the Overview.
export default function RankingsLoading() {
  return (
    <div className="space-y-5 animate-pulse" aria-hidden="true">
      {/* Header: title + country switch */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="h-7 w-40 rounded-lg bg-line/60" />
          <div className="mt-2 h-4 w-72 rounded bg-line/30" />
        </div>
        <div className="h-[42px] w-40 rounded-xl border border-line bg-card/50" />
      </div>

      {/* Standing badge + focus callout */}
      <div className="flex flex-col gap-3 lg:flex-row lg:items-stretch">
        <div className="h-[70px] w-full rounded-2xl border border-line bg-card shadow-card lg:w-72" />
        <div className="h-[70px] flex-1 rounded-xl border border-accent/20 bg-accent-soft/40" />
      </div>

      {/* Board card: header, legend, ranked rows */}
      <section className="overflow-hidden rounded-2xl border border-line bg-card shadow-card">
        <div className="flex items-center justify-between border-b border-line px-5 py-4">
          <div className="h-5 w-36 rounded bg-line/50" />
          <div className="h-4 w-24 rounded bg-line/30" />
        </div>
        <div className="flex flex-wrap gap-x-4 gap-y-1.5 border-b border-line bg-surface/60 px-5 py-2.5">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-3 w-16 rounded bg-line/40" />
          ))}
        </div>
        <ul className="divide-y divide-line">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <li
              key={i}
              className="flex items-center gap-3 px-4 py-3 sm:gap-4 sm:px-5"
            >
              <div className="h-8 w-8 shrink-0 rounded-full bg-line/40" />
              <div className="h-9 w-9 shrink-0 rounded-full bg-line/30" />
              <div className="min-w-0 flex-1">
                <div className="h-4 w-32 rounded bg-line/50" />
                <div className="mt-1.5 h-3 w-20 rounded bg-line/30" />
              </div>
              <div className="hidden h-7 shrink-0 items-end gap-[3px] sm:flex">
                {[1, 2, 3, 4].map((j) => (
                  <span
                    key={j}
                    className="block h-full w-[5px] rounded-full bg-line/50"
                  />
                ))}
              </div>
              <div className="h-6 w-[3.25rem] shrink-0 rounded bg-line/40" />
              <div className="h-4 w-4 shrink-0 rounded bg-line/30" />
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
