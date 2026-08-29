import { Sidebar } from "@/components/dashboard/Sidebar";
import { TopBar } from "@/components/dashboard/TopBar";
import { Container } from "@/components/ui/Container";
import { SKIP_TARGET, SkipLink } from "@/components/ui/SkipLink";

// The persistent frame: sidebar on the left (a top scroller on mobile), a slim
// sticky top bar with the live date/clock, and the section content filling the
// rest of the viewport. Lives inside DashboardProvider so children can read the
// shared context.
export function DashboardShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative min-h-dvh bg-surface lg:flex selection:bg-accent-soft selection:text-ink">
      {/* Subtle ambient lighting aura in the background */}
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-accent/[0.03] via-transparent to-transparent"
        aria-hidden
      />
      <SkipLink />
      <Sidebar />
      <main id={SKIP_TARGET} tabIndex={-1} className="relative min-w-0 flex-1">
        <TopBar />
        <Container size="dashboard" className="py-6">
          {children}
        </Container>
      </main>
    </div>
  );
}
