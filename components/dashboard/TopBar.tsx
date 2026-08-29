import { DateClock } from "@/components/dashboard/DateGreeting";
import { Container } from "@/components/ui/Container";

/**
 * Persistent, slim top bar across every dashboard page. Holds the always-visible
 * date + live clock (the "today" anchor) — kept to the right so it never
 * duplicates the big time-aware greeting on the home header. Sticky so it stays
 * in view while scrolling long sections.
 */
export function TopBar() {
  return (
    <div
      className="sticky top-0 z-20 border-b border-line/60 bg-surface/80 backdrop-blur-md transition-colors"
      style={{ viewTransitionName: "header" }}
    >
      <Container size="dashboard" className="flex items-center justify-between py-2.5">
        <div className="flex items-center gap-2">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-accent opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-accent" />
          </span>
          <span className="text-xs font-medium text-ink-faint tracking-wide">
            Compass Advisory Hub
          </span>
        </div>
        <DateClock />
      </Container>
    </div>
  );
}
