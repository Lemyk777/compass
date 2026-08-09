import {
  COMPETITIONS,
  competitionCategory,
  daysBetween,
  opportunityCost,
  type Competition,
  type CompetitionCategory,
} from "@/lib/data/key-dates";
import { formatDate } from "@/lib/data/opportunity-format";

// The hero's visual: four REAL rows out of the catalog, rendered on the server.
//
// What used to sit here was the country-outline map — a beautiful thing that
// belongs to the admission report (it plots the universities the analysis
// benchmarks against), cost ~140 kB of client JS plus a terrain raster, and said
// nothing about what a student can actually enter. The front door should show
// the front door: the same four facts every opportunity card carries — what it
// is, who can enter, what it costs, when it closes.
//
// Server component on purpose. It ships as HTML, so it is on screen in the first
// paint with no hydration, no images and no JS at all.

const CATEGORY_LABEL: Record<CompetitionCategory, string> = {
  olympiad: "Olympiad",
  competition: "Competition",
  course: "Course",
  research_program: "Research",
  summer_program: "Summer program",
};

/**
 * Picks the rows to show, deterministically from today's date.
 *
 * The order is the argument the page is making, so it is not random: a real
 * deadline you can still make, then something you can start tonight. Categories
 * are kept distinct so four rows read as a catalog rather than four olympiads.
 */
export function previewOpportunities(today = new Date(), limit = 4): Competition[] {
  const picked: Competition[] = [];
  const seen = new Set<CompetitionCategory>();

  const dated = COMPETITIONS.filter(
    (c) => c.dateConfirmed && daysBetween(today, c.deadline) >= 0
  ).sort((a, b) => daysBetween(today, a.deadline) - daysBetween(today, b.deadline));

  const open = COMPETITIONS.filter(
    (c) => c.alwaysOpen && opportunityCost(c).tone === "free"
  );

  // Alternate between the two kinds so neither half of the story is missing,
  // preferring a category we haven't shown yet.
  const take = (pool: Competition[]) => {
    const fresh = pool.find(
      (c) => !picked.includes(c) && !seen.has(competitionCategory(c))
    );
    const next = fresh ?? pool.find((c) => !picked.includes(c));
    if (!next) return false;
    picked.push(next);
    seen.add(competitionCategory(next));
    return true;
  };

  while (picked.length < limit) {
    const before = picked.length;
    if (picked.length % 2 === 0) take(dated) || take(open);
    else take(open) || take(dated);
    if (picked.length === before) break; // both pools exhausted
  }

  return picked;
}

export function OpportunityPreview({
  items,
  today = new Date(),
}: {
  items: Competition[];
  today?: Date;
}) {
  if (items.length === 0) return null;

  return (
    <div className="rounded-2xl border border-line bg-card p-2 shadow-lift">
      <div className="flex items-center justify-between gap-3 px-3 pb-2 pt-2">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-ink-faint">
          Open right now
        </p>
        <span className="rounded-full bg-ivy-soft px-2.5 py-1 text-[11px] font-semibold text-ivy-ink">
          Live from the catalog
        </span>
      </div>

      <ul className="space-y-1.5">
        {items.map((o) => (
          <Row key={o.id} o={o} today={today} />
        ))}
      </ul>

      <p className="px-3 pb-2 pt-3 text-xs leading-relaxed text-ink-faint">
        Four of{" "}
        <span data-num className="font-semibold text-ink-soft">
          {COMPETITIONS.length}
        </span>
        . Every link and date is checked by hand — we never show a countdown for
        a date we can&rsquo;t stand behind.
      </p>
    </div>
  );
}

function Row({ o, today }: { o: Competition; today: Date }) {
  const cost = opportunityCost(o);
  const days = o.dateConfirmed ? daysBetween(today, o.deadline) : null;

  return (
    <li className="rounded-xl bg-surface px-3 py-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold leading-snug text-ink">
            {o.name}
          </p>
          <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
            <CostChip tone={cost.tone} label={cost.short} />
            <Chip>{CATEGORY_LABEL[competitionCategory(o)]}</Chip>
          </div>
        </div>
        <div className="shrink-0">
          {days === null ? (
            <span className="whitespace-nowrap rounded-full bg-likely-soft px-2.5 py-1 text-xs font-semibold text-ivy-ink">
              Open now
            </span>
          ) : (
            <span
              data-num
              className={`whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold tabular-nums ${
                days <= 14
                  ? "bg-reach-soft text-reach-ink"
                  : days <= 30
                    ? "bg-target-soft text-target-ink"
                    : "bg-likely-soft text-ivy-ink"
              }`}
            >
              {days === 0 ? "closes today" : days === 1 ? "1 day left" : `${days} days left`}
            </span>
          )}
        </div>
      </div>

      {/* The eligibility line is the whole point of the product, so it is on
          every row here exactly as it is on every real card. */}
      <p className="mt-2 line-clamp-2 text-xs leading-relaxed text-ink-soft">
        <span className="font-medium text-ink">Who can enter:</span>{" "}
        {o.eligibility ?? "check the age and grade rules on the official page"}
      </p>

      {days !== null && (
        <p className="mt-1 text-xs text-ink-faint">
          Closes{" "}
          <span data-num className="tabular-nums">
            {formatDate(o.deadline)}
          </span>
        </p>
      )}
    </li>
  );
}

function Chip({ children }: { children: React.ReactNode }) {
  return (
    <span className="whitespace-nowrap rounded-full bg-card px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-ink-soft">
      {children}
    </span>
  );
}

function CostChip({ tone, label }: { tone: string; label: string }) {
  const cls =
    tone === "free"
      ? "bg-ivy-soft text-ivy-ink"
      : tone === "partial"
        ? "bg-target-soft text-target-ink"
        : tone === "paid"
          ? "bg-reach-soft text-reach-ink"
          : "bg-card text-ink-faint";
  return (
    <span
      className={`whitespace-nowrap rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${cls}`}
    >
      {label}
    </span>
  );
}
