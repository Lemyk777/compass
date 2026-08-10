"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
// Opportunities is the one view whose cards reflow on tab switch, so it uses the
// framer-backed MotionCard (position animation) instead of the plain Card.
import { MotionCard as Card } from "@/components/report/MotionCard";
import { useDashboard } from "@/components/dashboard/DashboardContext";
import { PageHeader } from "@/components/dashboard/states";
import { saveFaculties, saveGraduationYear } from "@/app/dashboard/actions";
import {
  graduationYearFromGrade,
  gradeFromGraduationYear,
} from "@/lib/data/eligibility";
import {
  FACULTIES,
  FACULTY_LABEL,
  type FacultyValue,
} from "@/lib/data/faculties";
import { InterestQuiz } from "@/components/opportunities/InterestQuiz";
import { DirectionSummary } from "@/components/opportunities/DirectionSummary";
import Link from "@/components/ui/Link";
import { OpportunityRow } from "@/components/opportunities/CommitRow";
import { FilterBar } from "@/components/opportunities/FilterBar";
import {
  NO_FILTERS,
  activeFilterCount,
  filterOpportunities,
  type CategoryFilter,
  type OpportunityFilters,
} from "@/lib/data/opportunity-filter";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { MotionSafe } from "@/components/ui/MotionSafe";
import type {
  ExtracurricularsPlan,
  Opportunity,
  OpportunityFit,
  StrengthBand,
} from "@/lib/data/key-dates";

// The "Opportunities" section — OUR recommendations of what to enter next, not
// the student's own activities (the header makes that explicit). Founder's model:
// weak profiles see ACCESSIBLE events to build a record; strong profiles see only
// ELITE ones (they need one clean win, not more entries). The match is computed
// in buildExtracurriculars from the student's rubric factors.

const BAND_COPY: Record<
  StrengthBand,
  { label: string; tone: string; line: string }
> = {
  emerging: {
    label: "Building your record",
    tone: "bg-reach-soft text-reach-ink",
    line: "Start with accessible, beginner-friendly events to get wins on the board. Volume and momentum matter more than prestige right now.",
  },
  developing: {
    label: "Gaining traction",
    tone: "bg-target-soft text-target-ink",
    line: "You have a base — now step up to national-calibre competitions while keeping a couple of accessible wins for breadth.",
  },
  competitive: {
    label: "Sharpening your spike",
    tone: "bg-likely-soft text-likely-ink",
    line: "You're competitive. Focus on selective and elite events that produce a standout, verifiable result — depth over volume.",
  },
  elite: {
    label: "Chasing the headline win",
    tone: "bg-accent-soft text-accent-ink",
    line: "Your record is already strong. You don't need more entries — you need one elite, international-calibre win. Go all-in on the top tier.",
  },
};

const FIT_GROUPS: { fit: OpportunityFit; title: string; hint: string }[] = [
  {
    fit: "recommended",
    title: "Recommended for you",
    hint: "Matched to where you are now — prioritize these.",
  },
  {
    fit: "stretch",
    title: "Stretch goals",
    hint: "A level above — aim here once you've landed the recommended ones.",
  },
  {
    fit: "foundational",
    title: "Foundational",
    hint: "Easier entry points — useful for breadth, but likely below your level.",
  },
];

// How many to put in front of the student by default.
//
// This view used to open with the whole matched catalog split into three fit
// groups — for a profile with nothing filled in, that is ~35 cards under
// "Recommended for you" alone. Meanwhile the public page at /opportunities,
// which knows nothing about the visitor, shows five. The person who told us
// more was getting the worse screen.
//
// Choice overload is moderated by preference uncertainty and task difficulty,
// and both peak for exactly the students who have no record yet. So: five, and
// the rest one deliberate tap away.
const SHOWN = 5;

/** Rows a fit group opens with, and adds per "show more". */
const PAGE = 8;

export function OpportunitiesView() {
  const { analysis, hasProfile, profileMeta, liveDates, basePath } =
    useDashboard();
  // Derived, not configured: this view is the dedicated section when it IS the
  // dedicated section. A flag threaded through the provider was one more thing
  // to wire correctly at every call site, and one more way to be wrong.
  const standalone = usePathname() === "/opportunities";

  // "today" depends on the visitor's clock — resolve on the client to avoid a
  // hydration mismatch (same pattern as the Timeline view).
  const [today, setToday] = useState<Date | null>(null);
  useEffect(() => setToday(new Date()), []);

  const [category, setCategory] = useState<CategoryFilter>("all");
  // Everything the filter panel owns (search text, money, timing, level,
  // eligibility). Kind stays its own state above because the sticky tabs are
  // its control — one criterion, one place to set it.
  const [filters, setFilters] = useState<OpportunityFilters>(NO_FILTERS);
  // The full grouped catalog is now opt-in. See SHOWN below for why.
  const [showAll, setShowAll] = useState(false);
  // A year answered inline this session, before the server round-trip lands.
  const [yearOverride, setYearOverride] = useState<number | null>(null);
  const graduationYear = yearOverride ?? profileMeta.graduationYear;
  const grade =
    today && graduationYear != null
      ? gradeFromGraduationYear(graduationYear, today)
      : null;

  // The two default questions are grade (above) and field (below). Fields
  // answered inline this session; `dismissed` lets "show me everything" close
  // the prompt without forcing a choice — an empty field set is a valid answer.
  const [facultiesOverride, setFacultiesOverride] = useState<
    FacultyValue[] | null
  >(null);
  const [fieldsDismissed, setFieldsDismissed] = useState(false);
  const [showQuiz, setShowQuiz] = useState(false);
  // Which answer the student has re-opened from the summary. Without this the
  // two questions were one-way doors: they rendered only while the answer was
  // MISSING, so nobody could correct a year or change fields afterwards — and
  // the interest quiz, which is reached from inside the field question, became
  // unreachable the moment a field existed.
  const [editing, setEditing] = useState<"year" | "fields" | null>(null);
  const faculties = (facultiesOverride ??
    profileMeta.faculties) as FacultyValue[];
  const [, startFacSave] = useTransition();

  // Apply a chosen field set from either the manual picker or the quiz: filter
  // immediately (optimistic) and persist best-effort. The optimistic override
  // drives the list for this visit even if the save fails, so the answer is
  // never lost to a transient error.
  function applyFaculties(picked: FacultyValue[]) {
    setFacultiesOverride(picked);
    setShowQuiz(false);
    setEditing(null);
    startFacSave(async () => {
      await saveFaculties(picked);
    });
  }

  // The catalog is deterministic, so it works BEFORE any analysis exists —
  // that's the "grow with us" mode for younger students with thin portfolios.
  // Without factors the strength is 0 → "emerging" → accessible events first,
  // exactly the right starting point for someone building a record.
  const [plan, setPlan] = useState<ExtracurricularsPlan | null>(null);
  useEffect(() => {
    if (!today) {
      setPlan(null);
      return;
    }
    let cancelled = false;
    // Lazy-load the matching engine (and the ~2,700-entry catalog it pulls in)
    // so the dataset is a separate async chunk instead of this route's initial
    // JS. The client filter stays instant once the chunk has loaded — the plan
    // is null for one paint (the skeleton already handles that).
    import("@/lib/data/key-dates").then((m) => {
      if (cancelled) return;
      setPlan(
        m.buildExtracurriculars({
          today,
          faculties,
          factors: analysis?.factors ?? [],
          liveCompetitions: liveDates.competitions,
          homeCountry: profileMeta.homeCountry,
          graduationYear,
        }),
      );
    });
    return () => {
      cancelled = true;
    };
  }, [
    today,
    analysis,
    faculties,
    profileMeta.homeCountry,
    graduationYear,
    liveDates.competitions,
  ]);

  // Two half-filtered sets, on purpose — each control's counts have to be
  // honest about what the OTHER controls have already done:
  //   filtered   = the panel applied, kind ignored → the tab numbers
  //   inCategory = the kind applied, panel ignored → the panel's own counts
  //   visible    = both → what actually renders
  // Memoised for its IDENTITY, not its cost: a fresh `[]` on every render
  // would invalidate every memo below it, including the facet counts the
  // filter panel recomputes.
  const items = useMemo(() => plan?.items ?? [], [plan]);
  const filtered = useMemo(
    () => filterOpportunities(items, filters),
    [items, filters],
  );
  const inCategory = useMemo(
    () =>
      category === "all"
        ? items
        : items.filter((o) => o.categoryResolved === category),
    [items, category],
  );
  const visible = useMemo(
    () =>
      category === "all"
        ? filtered
        : filtered.filter((o) => o.categoryResolved === category),
    [filtered, category],
  );

  // Any active filter is an explicit request to browse, so it opens the full
  // list on its own: a student who searches "robotics" and gets the same five
  // recommendations back would reasonably conclude the search is broken.
  const filtering = activeFilterCount(filters) > 0;
  const browsing = showAll || filtering;

  // How many sit behind each tab. Showing the number turns the filter from a
  // guess ("is there anything under Courses?") into a decision.
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { all: filtered.length };
    for (const o of filtered) {
      counts[o.categoryResolved] = (counts[o.categoryResolved] ?? 0) + 1;
    }
    return counts;
  }, [filtered]);

  // What to act on now: eligible today, in the order buildExtracurriculars
  // already put them (matched to strength first, then datable, then soonest).
  const openNow = items.filter((o) => !o.notYetEligible);
  const shortlist = openNow.slice(0, SHOWN);
  const nearest = shortlist
    .filter((o) => o.dateConfirmed)
    .reduce<Opportunity | null>(
      (best, o) =>
        best == null || o.daysToDeadline < best.daysToDeadline ? o : best,
      null,
    );

  return (
    // Three zones, and the rules between them are the whole change.
    //
    // This was one `space-y-5` holding nine blocks: header, the door across, the
    // summary of your answers, your strength band, the door to the guide, the
    // filter, the shortlist, the browse button, a footnote — every one of them a
    // 20px-radius panel, every gap between them identical, so the page had no
    // grain at all and the first opportunity started 726px down behind five
    // boxes of preamble. Nothing here is cut. It is grouped by what a block is
    // FOR, and the three groups are: who you are, what to enter, where it leads.
    // Inside a group 16px; between groups 64px and a hairline.
    //
    // The guide link moved to the end for the same reason `NextStep` sits at the
    // foot of every guide page: "where could this lead" is the question you have
    // AFTER you have seen the list, not instead of it.
    <div>
      <PageHeader
        title="Opportunities"
        hint="Competitions and olympiads we recommend for you — matched to your field and strength. These are our suggestions to enter next, not your own activities."
      />

      {/* Inside the report, this panel is a summary of a section that is bigger
          than a panel. The door across is the first thing on the page and is
          deliberately loud: everything built around Opportunities — the
          questionnaires, the careers guide, the map — lives over there. It sits
          with the header rather than in a zone because it is navigation, not
          part of the answer. */}
      {!standalone && (
        <div className="mb-8">
          <SectionDoor />
        </div>
      )}

      {plan ? (
        <>
          {/* ── Zone 1 · who you are ─────────────────────────────────────── */}
          <section className="space-y-4">
            <DirectionSummary
              grade={grade}
              faculties={faculties}
              nearest={
                nearest
                  ? { name: nearest.name, days: nearest.daysToDeadline }
                  : null
              }
              totalOpen={openNow.length}
              onEditYear={() => {
                setShowQuiz(false);
                setEditing("year");
              }}
              onEditFields={() => {
                setShowQuiz(false);
                setFieldsDismissed(false);
                setEditing("fields");
              }}
            />

            {analysis ? (
              <StrengthBanner band={plan.band} strength={plan.strength} />
            ) : (
              <StarterBanner basePath={basePath} hasProfile={hasProfile} />
            )}

            {/* The two default questions, in order: grade, then field. A student
              who doesn't know their field can take the optional interest quiz
              instead. The full analysis questionnaire stays opt-in. Each swap
              animates so the surface feels like one flow, not a jump-cut. */}
            <AnimatePresence mode="wait" initial={false}>
              {graduationYear == null || editing === "year" ? (
                <PromptSwap key="year">
                  <YearPrompt
                    onPick={(year) => {
                      setYearOverride(year);
                      setEditing(null);
                    }}
                  />
                </PromptSwap>
              ) : (faculties.length === 0 && !fieldsDismissed) ||
                editing === "fields" ? (
                showQuiz ? (
                  <PromptSwap key="quiz">
                    <InterestQuiz
                      onComplete={applyFaculties}
                      onCancel={() => setShowQuiz(false)}
                    />
                  </PromptSwap>
                ) : (
                  <PromptSwap key="field">
                    <FieldPrompt
                      initial={faculties}
                      onChoose={applyFaculties}
                      onSkip={() => {
                        setFieldsDismissed(true);
                        setEditing(null);
                      }}
                      onQuiz={() => setShowQuiz(true)}
                    />
                  </PromptSwap>
                )
              ) : null}
            </AnimatePresence>
          </section>

          {/* ── Zone 2 · what to enter ───────────────────────────────────── */}
          <section className="mt-8 space-y-4 border-t border-line pt-8">
            {plan.items.length > 0 ? (
              <>
                {/* Search and criteria. Above the shortlist because "I know what
                  I'm looking for" has to be answerable without scrolling past
                  five recommendations first. */}
                <FilterBar
                  items={inCategory}
                  value={filters}
                  onChange={setFilters}
                  resultCount={visible.length}
                />

                {/* The shortlist is the answer to "what should I do next", which
                  a filtered list is not — so it steps aside while filtering
                  rather than sitting above unrelated results. */}
                {!filtering && (
                  <Shortlist
                    rows={shortlist}
                    total={openNow.length}
                    nearestDays={nearest?.daysToDeadline}
                  />
                )}

                {!browsing ? (
                  <button
                    type="button"
                    onClick={() => setShowAll(true)}
                    className="w-full rounded-2xl border border-dashed border-line bg-card py-3.5 text-sm font-medium text-ink-soft transition-colors hover:border-ink/25 hover:text-ink focus-visible:focus-ring"
                  >
                    Show everything we track for you{" "}
                    <span data-num className="text-ink-faint">
                      ({plan.items.length})
                    </span>
                  </button>
                ) : (
                  <>
                    {/* The tabs stay reachable while you scroll a hundred cards —
                      having to scroll back up to change filter is the thing
                      that makes a long list feel like work. */}
                    <div className="sticky top-2 z-20 -mx-1 px-1 py-1">
                      <CategoryTabs
                        active={category}
                        onChange={setCategory}
                        counts={categoryCounts}
                      />
                    </div>
                    {FIT_GROUPS.map((g) => {
                      const rows = visible.filter((o) => o.fit === g.fit);
                      if (rows.length === 0) return null;
                      return (
                        <FitSection
                          key={`${g.fit}-${category}`}
                          title={g.title}
                          hint={g.hint}
                          count={rows.length}
                          rows={rows}
                        />
                      );
                    })}
                    {visible.length === 0 && (
                      <Card>
                        {filtering ? (
                          <>
                            <p className="text-sm text-ink-soft">
                              Nothing matches all of that. The narrowest filter
                              is usually the money one — try dropping a
                              criterion rather than starting over.
                            </p>
                            <button
                              type="button"
                              onClick={() => setFilters(NO_FILTERS)}
                              className="mt-3 inline-flex h-9 items-center rounded-lg border border-line px-3 text-xs font-medium text-ink-soft transition-colors hover:border-ink/30 hover:text-ink focus-visible:focus-ring"
                            >
                              Clear the filters
                            </button>
                          </>
                        ) : (
                          <p className="text-sm text-ink-soft">
                            Nothing in this category matches your profile yet.
                            Try another tab — everything we track for you is
                            still in &ldquo;All&rdquo;.
                          </p>
                        )}
                      </Card>
                    )}
                  </>
                )}

                <p className="text-center text-xs text-ink-faint">
                  Dates are indicative — always confirm on the official site
                  before you rely on them.
                </p>
              </>
            ) : (
              <Card>
                <p className="text-sm text-ink-soft">
                  <span className="font-medium text-ink">
                    Add a field of study
                  </span>{" "}
                  in your profile to see competitions and olympiads matched to
                  it.
                </p>
              </Card>
            )}
          </section>

          {/* ── Zone 3 · where it leads ──────────────────────────────────── */}
          {/* The careers layer itself moved to /guide — the whole "kinds of work
              → where in the world → the way in" story needs a page, not a drawer
              on the page you came to for deadlines. What stays here is the door
              to it, and it stands at the foot of the page rather than fourth
              from the top: it used to sit between the student's answers and the
              list, which put a link OUT of the section in the way of the thing
              the section is for. */}
          {faculties.length > 0 && (
            <section className="mt-8 border-t border-line pt-8">
              <GuideLink faculties={faculties} />
            </section>
          )}
        </>
      ) : (
        <div className="h-40 animate-pulse rounded-2xl border border-line bg-card" />
      )}
    </div>
  );
}

/** The door from the report's panel across to the dedicated Opportunities
 *  section. Shown only inside the report — the section does not link to itself. */
function SectionDoor() {
  return (
    <Link
      href="/opportunities"
      className="block rounded-2xl border border-accent/40 bg-accent-soft/25 p-5 transition-colors hover:border-accent focus-visible:focus-ring"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-ink">
            Open the full Opportunities section &rarr;
          </p>
          <p className="mt-1 max-w-2xl text-sm leading-relaxed text-ink-soft">
            Its own space, built around this instead of around your profile
            score: the short questions that sharpen the match, the interest
            quiz, what each field leads to, and the cities where that work
            actually is. This panel stays here — nothing moves out of your
            report.
          </p>
        </div>
        <span className="text-xs font-medium uppercase tracking-wide text-accent-ink">
          Opportunities &middot; Guide
        </span>
      </div>
    </Link>
  );
}

/** The door to the guide. Deliberately a link and not a panel: this page is for
 *  deciding what to enter, and the "where could my life go" question deserves
 *  more room than a drawer under the deadlines. */
function GuideLink({ faculties }: { faculties: FacultyValue[] }) {
  const names = faculties.map((f) => FACULTY_LABEL[f]).join(" & ");
  return (
    <Link
      href="/guide"
      className="flex items-center justify-between gap-3 rounded-2xl border border-line/70 bg-card p-5 shadow-sm transition-colors hover:border-accent focus-visible:focus-ring"
    >
      <span className="min-w-0">
        <span className="block text-sm font-semibold text-ink">
          Where {names} can lead
        </span>
        <span className="mt-0.5 block text-xs text-ink-soft">
          Kinds of work, the jobs inside each, and the cities where that work
          actually is — with the catch and the way in
        </span>
      </span>
      <span className="shrink-0 text-ink-faint" aria-hidden>
        &rarr;
      </span>
    </Link>
  );
}

/** Animated wrapper so the intake prompts cross-fade instead of jump-cutting
 *  when one answer swaps in the next (year → field → quiz). */
function PromptSwap({ children }: { children: React.ReactNode }) {
  return (
    // `MotionSafe` because the y-offset here is real movement, and framer reads
    // `prefers-reduced-motion` only when asked. With it, a reader who opted out
    // still gets the cross-fade — so one question replacing another still reads
    // as a replacement rather than a jump-cut — but nothing slides.
    <MotionSafe>
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
      >
        {children}
      </motion.div>
    </MotionSafe>
  );
}

// Pre-analysis ("grow with us") banner: the student sees the full catalog with
// beginner-friendly events first, and a clear, opt-in path to the full report.
//
// Since signup now lands here (not the questionnaire), this banner is the main
// place a new student discovers that a full admission report exists. It is
// deliberately opt-in, not a wall: a profile-less student is pointed at the
// profile builder that unlocks the report; one who already has a profile just
// needs to run the analysis from the overview.
function StarterBanner({
  basePath,
  hasProfile,
}: {
  basePath: string;
  hasProfile: boolean;
}) {
  const href = hasProfile ? basePath : "/onboarding";
  const cta = hasProfile
    ? "Run your full admission report"
    : "Build your profile for the full report";
  return (
    <Card>
      <div className="flex flex-wrap items-center gap-3">
        <SparkIcon />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-ink">
            Start building your record
          </p>
          <p className="mt-1 text-pretty text-sm leading-relaxed text-ink-soft">
            These are real competitions, olympiads and programs you can enter —
            beginner-friendly ones first. It&rsquo;s completely fine to have
            nothing on your list yet: pick one accessible event and start there.
          </p>
        </div>
      </div>
      <div className="mt-3.5">
        <a
          href={href}
          className="inline-flex h-10 items-center rounded-xl bg-ink px-4 text-sm font-medium text-surface transition-colors hover:bg-ink/90 focus-visible:focus-ring"
        >
          {cta} &rarr;
        </a>
        <p className="mt-2 text-xs text-ink-faint">
          Optional — your Opportunities stay free whether or not you do this.
        </p>
      </div>
    </Card>
  );
}

function StrengthBanner({
  band,
  strength,
}: {
  band: StrengthBand;
  strength: number;
}) {
  const copy = BAND_COPY[band];
  return (
    <Card>
      <div className="flex flex-wrap items-center gap-3">
        <SparkIcon />
        <div className="min-w-0 flex-1">
          <p className="flex flex-wrap items-center gap-2 text-sm font-semibold text-ink">
            {copy.label}
            <span
              className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${copy.tone}`}
            >
              Extracurricular strength{" "}
              <span data-num className="tabular-nums">
                {strength.toFixed(1)}
              </span>
              /10
            </span>
          </p>
          <p className="mt-1 text-pretty text-sm leading-relaxed text-ink-soft">
            {copy.line}
          </p>
        </div>
      </div>
    </Card>
  );
}

/**
 * The five to act on, stated as a verdict rather than offered as a list. The
 * count is of what is on screen; the size of the matched set stays visible
 * underneath so nothing is being hidden, just de-emphasised.
 */
function Shortlist({
  rows,
  total,
  nearestDays,
}: {
  rows: Opportunity[];
  total: number;
  nearestDays?: number;
}) {
  if (rows.length === 0) return null;
  return (
    <Card>
      <div className="border-l-2 border-ivy pl-4">
        <h2 className="text-xl font-semibold leading-tight tracking-tight text-ink">
          <span data-num className="text-ivy-ink">
            {rows.length}
          </span>{" "}
          to enter next.
        </h2>
        <p className="mt-1 text-sm text-ink-soft">
          Matched to where you are now
          {nearestDays != null && (
            <>
              {" · "}the nearest closes in{" "}
              <span data-num className="font-semibold text-ink">
                {nearestDays} days
              </span>
            </>
          )}
          .
        </p>
        {total > rows.length && (
          <p className="mt-1 text-xs text-ink-faint">
            You can enter <span data-num>{total}</span> in total — these are the
            ones to start with.
          </p>
        )}
      </div>
      <ul className="mt-4 grid gap-2.5 2xl:grid-cols-2">
        {rows.map((o, i) => (
          <li
            key={o.id}
            className="animate-fade-up"
            // Same 45ms stagger as the public page — the two lists should feel
            // like the same product.
            style={{
              animationDelay: `${i * 45}ms`,
              animationFillMode: "backwards",
            }}
          >
            <OpportunityRow o={o} commit />
          </li>
        ))}
      </ul>
    </Card>
  );
}

/**
 * The one question that unlocks every age and grade rule we have.
 *
 * Without a graduation year nothing can be filtered, so a student who skipped
 * the intake sees the unfiltered catalog — including things they are years too
 * young for. Asking here, in a tap, is the whole intervention: no form, no
 * navigation away, and the answer persists so it is never asked twice.
 */
function YearPrompt({ onPick }: { onPick: (year: number) => void }) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function pick(grade: number) {
    const year = graduationYearFromGrade(grade, new Date());
    onPick(year); // optimistic — the list re-filters immediately
    setError(null);
    startTransition(async () => {
      const res = await saveGraduationYear(year);
      if (!res.ok) setError(res.error);
    });
  }

  return (
    <Card>
      <p className="text-sm font-semibold text-ink">
        What year are you in at school?
      </p>
      <p className="mt-1 text-sm text-ink-soft">
        Everything below is unfiltered until we know — some of it has age limits
        you may not have reached yet.
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        {[5, 6, 7, 8, 9, 10, 11, 12].map((g) => (
          <button
            key={g}
            type="button"
            disabled={pending}
            onClick={() => pick(g)}
            aria-label={`Year ${g}`}
            className="h-11 min-w-[2.75rem] rounded-xl border border-line bg-card px-3.5 text-sm font-semibold text-ink transition-colors hover:border-ink/30 focus-visible:focus-ring disabled:opacity-50"
          >
            <span data-num>{g}</span>
          </button>
        ))}
      </div>
      <p className="mt-2 text-xs text-ink-faint">
        Your last year of school counts as 12, even if your school ends at 11.
      </p>
      {error && (
        <p role="alert" className="mt-2 text-xs text-reach-ink">
          {error} Your list is filtered for this visit either way.
        </p>
      )}
    </Card>
  );
}

/**
 * The second default question: which fields to look in.
 *
 * Asked right after the school year, inline, in a tap — the pair (grade + field)
 * is the whole default intake now that the analysis questionnaire is opt-in.
 * Choosing nothing is a real answer ("show me everything"), so "Show all fields"
 * closes the prompt without forcing a pick rather than blocking on one.
 */
function FieldPrompt({
  initial = [],
  onChoose,
  onSkip,
  onQuiz,
}: {
  /** Current fields, so re-opening this to CHANGE them starts from the answer
   *  the student already gave rather than from an empty set. */
  initial?: FacultyValue[];
  onChoose: (faculties: FacultyValue[]) => void;
  onSkip: () => void;
  onQuiz: () => void;
}) {
  const [sel, setSel] = useState<FacultyValue[]>(initial);

  const toggle = (f: FacultyValue) =>
    setSel((s) => (s.includes(f) ? s.filter((x) => x !== f) : [...s, f]));

  return (
    <Card>
      <p className="text-sm font-semibold text-ink">
        What do you want to look into?
      </p>
      <p className="mt-1 text-sm text-ink-soft">
        Pick the fields you care about and we&rsquo;ll match competitions and
        programs to them — or see everything.
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        {FACULTIES.map((f) => {
          const on = sel.includes(f.value);
          return (
            <button
              key={f.value}
              type="button"
              aria-pressed={on}
              onClick={() => toggle(f.value)}
              className={`h-10 rounded-full border px-3.5 text-sm font-medium transition-colors focus-visible:focus-ring ${
                on
                  ? "border-accent bg-accent-soft text-accent-ink"
                  : "border-line bg-card text-ink-soft hover:border-ink/30 hover:text-ink"
              }`}
            >
              {FACULTY_LABEL[f.value]}
            </button>
          );
        })}
      </div>
      <div className="mt-4 flex flex-wrap items-center gap-2.5">
        <button
          type="button"
          disabled={sel.length === 0}
          onClick={() => onChoose(sel)}
          className="h-10 rounded-xl bg-ink px-4 text-sm font-medium text-surface transition-colors hover:bg-ink/90 focus-visible:focus-ring disabled:opacity-40"
        >
          Show these{sel.length > 0 && <span data-num> ({sel.length})</span>}
        </button>
        <button
          type="button"
          onClick={onSkip}
          className="text-sm font-medium text-ink-soft underline-offset-2 hover:text-ink hover:underline focus-visible:focus-ring"
        >
          Show all fields
        </button>
      </div>
      {/* The whole point of the quiz: a student who can't answer the question
          above isn't stuck with a blind guess. */}
      <button
        type="button"
        onClick={onQuiz}
        className="mt-3 text-sm font-medium text-accent underline-offset-2 hover:underline focus-visible:focus-ring"
      >
        Not sure what you like? Take a 2-minute quiz &rarr;
      </button>
    </Card>
  );
}

function CategoryTabs({
  active,
  onChange,
  counts,
}: {
  active: CategoryFilter;
  onChange: (c: CategoryFilter) => void;
  counts: Record<string, number>;
}) {
  const tabs: { key: CategoryFilter; label: string }[] = [
    { key: "all", label: "All" },
    { key: "olympiad", label: "Olympiads" },
    { key: "competition", label: "Competitions" },
    { key: "course", label: "Courses" },
    { key: "summer_program", label: "Summer" },
    { key: "research_program", label: "Research" },
  ];
  return (
    // Scrollable on a phone rather than wrapping into two ragged rows.
    <div className="flex gap-1 overflow-x-auto rounded-xl border border-line bg-card/95 p-1 shadow-card backdrop-blur [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      {tabs.map((t) => {
        const on = t.key === active;
        const n = counts[t.key] ?? 0;
        // An empty tab is noise — except the one you are standing on. The
        // counts now move with the filter panel, so hiding a zeroed tab
        // unconditionally would delete the selected tab out from under a
        // student mid-search and leave the row with nothing highlighted.
        if (n === 0 && t.key !== "all" && !on) return null;
        return (
          <button
            key={t.key}
            type="button"
            aria-pressed={on}
            onClick={() => onChange(t.key)}
            className={`flex shrink-0 items-center gap-1.5 rounded-lg px-3.5 py-2 text-sm font-medium transition-colors duration-200 focus-visible:focus-ring ${
              on
                ? "bg-accent text-on-fill"
                : "text-ink-soft hover:bg-surface hover:text-ink"
            }`}
          >
            {t.label}
            <span
              data-num
              className={`tabular-nums text-xs ${on ? "text-white/70" : "text-ink-faint"}`}
            >
              {n}
            </span>
          </button>
        );
      })}
    </div>
  );
}

function FitSection({
  title,
  hint,
  count,
  rows,
}: {
  title: string;
  hint: string;
  count: number;
  rows: Opportunity[];
}) {
  // A fit group can hold sixty cards. Rendering all of them costs a long,
  // janky first paint and gives the student a wall to scroll past to reach the
  // next section — so the group opens at a readable length and grows on demand.
  const [limit, setLimit] = useState(PAGE);
  const page = rows.slice(0, limit);
  const rest = rows.length - page.length;

  return (
    <Card>
      <div className="mb-1 flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
        <h2 className="flex items-baseline gap-2 text-base font-semibold text-ink">
          {title}
          <span data-num className="text-xs font-normal text-ink-faint">
            ({count})
          </span>
        </h2>
        <p className="text-xs text-ink-faint">{hint}</p>
      </div>
      <ul className="mt-3 grid gap-2.5 2xl:grid-cols-2">
        {page.map((o, i) => (
          <li
            key={o.id}
            // Only the newly revealed rows animate in — re-animating the whole
            // group on every "show more" would read as a flicker.
            className={
              i >= limit - PAGE && limit > PAGE ? "animate-fade-up" : undefined
            }
          >
            <OpportunityRow o={o} />
          </li>
        ))}
      </ul>
      {rest > 0 && (
        <button
          type="button"
          onClick={() => setLimit((n) => n + PAGE)}
          className="mt-3 w-full rounded-xl border border-dashed border-line py-2.5 text-sm font-medium text-ink-soft transition-colors hover:border-ink/25 hover:text-ink focus-visible:focus-ring"
        >
          Show <span data-num>{Math.min(rest, PAGE)}</span> more
          <span data-num className="text-ink-faint">
            {" "}
            ({rest} left)
          </span>
        </button>
      )}
    </Card>
  );
}

function SparkIcon() {
  return (
    <svg
      className="h-6 w-6 shrink-0 text-accent"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M12 3v4M12 17v4M3 12h4M17 12h4M5.6 5.6l2.8 2.8M15.6 15.6l2.8 2.8M18.4 5.6l-2.8 2.8M8.4 15.6l-2.8 2.8" />
    </svg>
  );
}
