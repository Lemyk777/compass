import { Sidebar } from "@/components/dashboard/Sidebar";
import { TopBar } from "@/components/dashboard/TopBar";
import { SKIP_TARGET, SkipLink } from "@/components/ui/SkipLink";

// The persistent frame: sidebar on the left (a top scroller on mobile), a slim
// sticky top bar with the live date/clock, and the section content filling the
// rest of the viewport. Lives inside DashboardProvider so children can read the
// shared context.
export function DashboardShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-dvh bg-surface lg:flex">
      {/* The report has the longest run of chrome in the product — a rail of up
          to eight section links before any of the analysis. `main` was already
          the right landmark here; what was missing was the way past the rail. */}
      <SkipLink />
      <Sidebar />
      <main id={SKIP_TARGET} tabIndex={-1} className="min-w-0 flex-1">
        <TopBar />
        <div className="mx-auto w-full max-w-[1500px] px-4 py-6 sm:px-8 sm:py-8">
          {children}
        </div>
      </main>
    </div>
  );
}
