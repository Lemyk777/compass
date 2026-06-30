export default function DashboardLoading() {
  return (
    <div className="space-y-6 animate-pulse" aria-hidden="true">
      {/* Greeting Row Skeleton */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="h-9 w-64 rounded-lg bg-line/60" />
        <div className="h-[46px] w-48 rounded-xl border border-line bg-card/50" />
      </div>

      {/* Two cards on one row, equal height */}
      <div className="grid items-stretch gap-6 lg:grid-cols-2">
        {/* Left Column: Spider chart */}
        <section className="flex flex-col rounded-2xl border border-line bg-card p-6 shadow-card">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-ink-faint">
            <span className="inline-block h-4 w-32 rounded bg-line/50" />
          </h2>
          <div className="flex flex-1 items-center justify-center">
            <div className="w-full h-64 flex items-center justify-center">
              <div className="h-48 w-48 rounded-full border border-line/30 flex items-center justify-center">
                <div className="h-28 w-28 rounded-full border border-line/30 flex items-center justify-center">
                  <div className="h-12 w-12 rounded-full border border-line/30" />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Right Column: Gauge + factor bars + CTA */}
        <section className="flex flex-col rounded-2xl border border-line bg-card p-6 shadow-card">
          <div className="flex flex-1 flex-col items-center gap-6 sm:flex-row sm:items-center">
            {/* OverallGauge Loading Shape */}
            <div className="flex flex-col items-center">
              <div className="h-40 w-40 rounded-full bg-line/20 flex items-center justify-center">
                <div className="h-28 w-28 rounded-full bg-card flex items-center justify-center" />
              </div>
            </div>
            {/* 4 progress bars list */}
            <ul className="w-full flex-1 space-y-4">
              {[1, 2, 3, 4].map((i) => (
                <li key={i}>
                  <div className="mb-1 flex items-baseline justify-between gap-4">
                    <div className="h-4 w-24 rounded bg-line/50" />
                    <div className="h-4 w-8 rounded bg-line/40" />
                  </div>
                  <div className="h-2 w-full rounded-full bg-line" />
                </li>
              ))}
            </ul>
          </div>
          {/* Button CTA Link skeleton */}
          <div className="mt-6 h-12 w-full rounded-xl bg-line/40" />
        </section>
      </div>

      {/* Wide call to action → admission odds skeleton */}
      <div className="flex w-full items-center gap-6 rounded-2xl border border-line bg-card shadow-card px-6 py-6">
        <div className="h-14 w-14 shrink-0 rounded-full bg-line/40 flex items-center justify-center">
          <div className="h-6 w-6 rounded bg-line/20" />
        </div>
        <div className="flex-1">
          <div className="h-3 w-20 rounded bg-line/40" />
          <div className="mt-1 h-5 w-48 rounded bg-line/60" />
          <div className="mt-1 h-4 w-32 rounded bg-line/30" />
        </div>
        <div className="h-5 w-5 rounded bg-line/40" />
      </div>
    </div>
  );
}


