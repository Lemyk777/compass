import { DateClock } from "@/components/dashboard/DateGreeting";

/**
 * Persistent, slim top bar across every dashboard page. Holds the always-visible
 * date + live clock (the "today" anchor) — kept to the right so it never
 * duplicates the big time-aware greeting on the home header. Sticky so it stays
 * in view while scrolling long sections.
 */
export function TopBar() {
  return (
    <div className="sticky top-0 z-20 border-b border-line bg-surface/85 backdrop-blur">
      <div className="mx-auto flex w-full max-w-[1500px] items-center justify-end px-4 py-2.5 sm:px-8">
        <DateClock />
      </div>
    </div>
  );
}
