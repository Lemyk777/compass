import {
  COMPETITIONS,
  competitionCategory,
  daysBetween,
  opportunityCost,
  type Competition,
  type CompetitionCategory,
} from "@/lib/data/key-dates";
import { daysLeftLabel, formatDate } from "@/lib/data/opportunity-format";
// The chip's short names, shared with the opportunity card this preview is a
// copy of. It held a third private copy of the map — undocumented, unlike the
// card's, and so the front page printed "Research" while the page a click away
// printed "Research program". The visual claims to be the product rather than a
// picture of it; that only holds while it says the same words.
import { CATEGORY_LABEL_SHORT } from "@/lib/data/opportunity-vocab";

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

/**
 * Picks the rows to show, deterministically from today's date.
 *
 * The order is the argument the page is making, so it is not random: a real
 * deadline you can still make, then something you can start tonight. Categories
 * are kept distinct so four rows read as a catalog rather than four olympiads.
 */
export function previewOpportunities(
  today = new Date(),
  limit = 4,
): Competition[] {
  const picked: Competition[] = [];
  const seen = new Set<CompetitionCategory>();

  const dated = COMPETITIONS.filter(
    (c) => c.dateConfirmed && daysBetween(today, c.deadline) >= 0,
  ).sort(
    (a, b) => daysBetween(today, a.deadline) - daysBetween(today, b.deadline),
  );

  const open = COMPETITIONS.filter(
    (c) => c.alwaysOpen && opportunityCost(c).tone === "free",
  );

  // Alternate between the two kinds so neither half of the story is missing,
  // preferring a category we haven't shown yet.
  const take = (pool: Competition[]) => {
    const fresh = pool.find(
      (c) => !picked.includes(c) && !seen.has(competitionCategory(c)),
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
    <div className="rounded-2xl border border-line bg-card p-2 shadow-lift sm:p-2.5">
      <div className="flex items-center justify-between gap-3 px-3 pb-2.5 pt-2">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-ink-faint">
          Open right now
        </p>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-ivy-soft px-2.5 py-1 text-[12px] font-semibold text-ivy-ink">
          {/* The only thing on this card that moves on its own, and it earns it:
              the claim beside it is that these rows are live. `animate-pulse` is
              opacity-only, so it composites, and the global reduced-motion guard
              in globals.css zeroes it. */}
          <span
            aria-hidden="true"
            className="h-1.5 w-1.5 animate-pulse rounded-full bg-ivy"
          />
          Live from the catalog
        </span>
      </div>

      <ul className="space-y-2">
        {items.map((o, i) => (
          <Row key={o.id} o={o} today={today} index={i} />
        ))}
      </ul>

      {/* The card is the front door, so it opens. A preview that cannot be
          entered is a picture of the product; four rows that each lead to their
          own page, and a way through to the rest, is the product. */}
      <a
        href="/opportunities"
        className="group mt-2 flex items-center justify-between gap-3 rounded-xl px-3 py-2.5 transition-colors hover:bg-surface focus-visible:focus-ring"
      >
        <p className="text-xs leading-relaxed text-ink-faint">
          Four of{" "}
          <span data-num className="font-semibold text-ink-soft">
            {COMPETITIONS.length}
          </span>
          . Every link and date checked by hand.
        </p>
        <span className="shrink-0 whitespace-nowrap text-xs font-semibold text-ivy-ink transition-transform duration-300 group-hover:translate-x-0.5">
          See all →
        </span>
      </a>
    </div>
  );
}

function Row({
  o,
  today,
  index,
}: {
  o: Competition;
  today: Date;
  index: number;
}) {
  const cost = opportunityCost(o);
  const days = o.dateConfirmed ? daysBetween(today, o.deadline) : null;

  return (
    <li>
      {/* Each row is a real link to that opportunity's own page — the same
          address a student would share. Entrance is the page's own `rise-in`,
          staggered so the list assembles rather than appearing; it is a CSS
          animation with `both`, not a scroll-gated reveal, so the content is
          never held invisible waiting for an observer. */}
      <a
        href={`/opportunities/${o.id}`}
        style={{ animationDelay: `${0.18 + index * 0.07}s` }}
        className="rise-in block rounded-xl border border-transparent bg-surface px-3.5 py-3 transition-all duration-300 hover:-translate-y-0.5 hover:border-line hover:shadow-card focus-visible:focus-ring active:translate-y-0 active:shadow-none"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold leading-snug text-ink">
              {o.name}
            </p>
            <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
              <CostChip tone={cost.tone} label={cost.short} />
              <Chip>{CATEGORY_LABEL_SHORT[competitionCategory(o)]}</Chip>
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
                {daysLeftLabel(days)}
              </span>
            )}
          </div>
        </div>

        {/* The eligibility line is the whole point of the product, so it is on
            every row here exactly as it is on every real card. */}
        <p className="mt-2 line-clamp-2 text-xs leading-relaxed text-ink-soft">
          <span className="font-medium text-ink">Who can enter:</span>{" "}
          {o.eligibility ??
            "check the age and grade rules on the official page"}
        </p>

        {days !== null && (
          <p className="mt-1 text-xs text-ink-faint">
            Closes{" "}
            <span data-num className="tabular-nums">
              {formatDate(o.deadline)}
            </span>
          </p>
        )}
      </a>
    </li>
  );
}

function Chip({ children }: { children: React.ReactNode }) {
  return (
    <span className="whitespace-nowrap rounded-full bg-card px-2 py-0.5 text-[12px] font-semibold uppercase tracking-wide text-ink-soft">
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
      className={`whitespace-nowrap rounded-full px-2 py-0.5 text-[12px] font-semibold uppercase tracking-wide ${cls}`}
    >
      {label}
    </span>
  );
}
