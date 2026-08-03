"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
// Opportunities is the one view whose cards reflow on tab switch, so it uses the
// framer-backed MotionCard (position animation) instead of the plain Card.
import { MotionCard as Card } from "@/components/report/MotionCard";
import { useDashboard } from "@/components/dashboard/DashboardContext";
import { OpportunityCard } from "@/components/opportunities/OpportunityCard";
import { PageHeader } from "@/components/dashboard/states";
import {
  clearOpportunityIntent,
  saveGraduationYear,
  saveOpportunityIntent,
} from "@/app/dashboard/actions";
import { graduationYearFromGrade } from "@/lib/data/eligibility";
import { downloadIcs } from "@/lib/calendar/ics";
import {
  INTENT_TEXT_MAX,
  START_OPTIONS,
  WHY_MATTERS_MAX,
  intentSentence,
  type OpportunityIntent,
} from "@/lib/data/intents";
import {
  buildExtracurriculars,
  type CompetitionCategory,
  type Opportunity,
  type OpportunityFit,
  type StrengthBand,
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
    tone: "bg-reach-soft text-reach",
    line: "Start with accessible, beginner-friendly events to get wins on the board. Volume and momentum matter more than prestige right now.",
  },
  developing: {
    label: "Gaining traction",
    tone: "bg-target-soft text-target",
    line: "You have a base — now step up to national-calibre competitions while keeping a couple of accessible wins for breadth.",
  },
  competitive: {
    label: "Sharpening your spike",
    tone: "bg-likely-soft text-[#2C6B4D]",
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

type CategoryFilter = "all" | CompetitionCategory;

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
  const { analysis, profileMeta, liveDates, basePath } = useDashboard();

  // "today" depends on the visitor's clock — resolve on the client to avoid a
  // hydration mismatch (same pattern as the Timeline view).
  const [today, setToday] = useState<Date | null>(null);
  useEffect(() => setToday(new Date()), []);

  const [category, setCategory] = useState<CategoryFilter>("all");
  // The full grouped catalog is now opt-in. See SHOWN below for why.
  const [showAll, setShowAll] = useState(false);
  // A year answered inline this session, before the server round-trip lands.
  const [yearOverride, setYearOverride] = useState<number | null>(null);
  const graduationYear = yearOverride ?? profileMeta.graduationYear;

  // The catalog is deterministic, so it works BEFORE any analysis exists —
  // that's the "grow with us" mode for younger students with thin portfolios.
  // Without factors the strength is 0 → "emerging" → accessible events first,
  // exactly the right starting point for someone building a record.
  const plan = useMemo(() => {
    if (!today) return null;
    return buildExtracurriculars({
      today,
      faculties: profileMeta.faculties,
      factors: analysis?.factors ?? [],
      liveCompetitions: liveDates.competitions,
      homeCountry: profileMeta.homeCountry,
      graduationYear,
    });
  }, [
    today,
    analysis,
    profileMeta.faculties,
    profileMeta.homeCountry,
    graduationYear,
    liveDates.competitions,
  ]);

  const visible =
    plan?.items.filter(
      (o) => category === "all" || o.categoryResolved === category
    ) ?? [];

  // How many sit behind each tab. Showing the number turns the filter from a
  // guess ("is there anything under Courses?") into a decision.
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { all: plan?.items.length ?? 0 };
    for (const o of plan?.items ?? []) {
      counts[o.categoryResolved] = (counts[o.categoryResolved] ?? 0) + 1;
    }
    return counts;
  }, [plan]);

  // What to act on now: eligible today, in the order buildExtracurriculars
  // already put them (matched to strength first, then datable, then soonest).
  const openNow = plan?.items.filter((o) => !o.notYetEligible) ?? [];
  const shortlist = openNow.slice(0, SHOWN);
  const nearest = shortlist
    .filter((o) => o.dateConfirmed)
    .reduce<Opportunity | null>(
      (best, o) => (best == null || o.daysToDeadline < best.daysToDeadline ? o : best),
      null
    );

  return (
    <div className="space-y-5">
      <PageHeader
        title="Opportunities"
        hint="Competitions and olympiads we recommend for you — matched to your field and strength. These are our suggestions to enter next, not your own activities."
      />

      {plan ? (
        <>
          {analysis ? (
            <StrengthBanner band={plan.band} strength={plan.strength} />
          ) : (
            <StarterBanner basePath={basePath} />
          )}

          {graduationYear == null && (
            <YearPrompt
              onPick={(year) => setYearOverride(year)}
            />
          )}

          {plan.items.length > 0 ? (
            <>
              <Shortlist
                rows={shortlist}
                total={openNow.length}
                nearestDays={nearest?.daysToDeadline}
              />

              {!showAll ? (
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
                      <p className="text-sm text-ink-soft">
                        Nothing in this category matches your profile yet. Try
                        another tab — everything we track for you is still in
                        &ldquo;All&rdquo;.
                      </p>
                    </Card>
                  )}
                </>
              )}

              <p className="text-center text-xs text-ink-faint">
                Dates are indicative — always confirm on the official site before
                you rely on them.
              </p>
            </>
          ) : (
            <Card>
              <p className="text-sm text-ink-soft">
                <span className="font-medium text-ink">
                  Add a field of study
                </span>{" "}
                in your profile to see competitions and olympiads matched to it.
              </p>
            </Card>
          )}
        </>
      ) : (
        <div className="h-40 animate-pulse rounded-2xl border border-line bg-card" />
      )}
    </div>
  );
}

// Pre-analysis ("grow with us") banner: the student sees the full catalog with
// beginner-friendly events first, and a nudge that the analysis will match it
// to their actual strength. The overview owns the run-analysis flow.
function StarterBanner({ basePath }: { basePath: string }) {
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
            nothing on your list yet: pick one accessible event and start there.{" "}
            <a href={basePath} className="font-medium text-accent hover:underline">
              Run the analysis
            </a>{" "}
            when you&rsquo;re ready and we&rsquo;ll match these to your strength.
          </p>
        </div>
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
      <ul className="mt-4 space-y-2.5">
        {rows.map((o, i) => (
          <li
            key={o.id}
            className="animate-fade-up"
            // Same 45ms stagger as the public page — the two lists should feel
            // like the same product.
            style={{ animationDelay: `${i * 45}ms`, animationFillMode: "backwards" }}
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
        <p role="alert" className="mt-2 text-xs text-reach">
          {error} Your list is filtered for this visit either way.
        </p>
      )}
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
        if (n === 0 && t.key !== "all") return null;
        return (
          <button
            key={t.key}
            type="button"
            aria-pressed={on}
            onClick={() => onChange(t.key)}
            className={`flex shrink-0 items-center gap-1.5 rounded-lg px-3.5 py-2 text-sm font-medium transition-colors duration-200 focus-visible:focus-ring ${
              on ? "bg-accent text-white" : "text-ink-soft hover:bg-surface hover:text-ink"
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
      <ul className="mt-3 space-y-2.5">
        {page.map((o, i) => (
          <li
            key={o.id}
            // Only the newly revealed rows animate in — re-animating the whole
            // group on every "show more" would read as a flicker.
            className={i >= limit - PAGE && limit > PAGE ? "animate-fade-up" : undefined}
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
          <span data-num className="text-ink-faint"> ({rest} left)</span>
        </button>
      )}
    </Card>
  );
}

function OpportunityRow({ o, commit }: { o: Opportunity; commit?: boolean }) {
  // One card definition for the whole product — see OpportunityCard. The
  // commitment step is the only thing unique to the dashboard, so it rides in
  // as the card's footer.
  return (
    <OpportunityCard
      o={o}
      density="compact"
      footer={commit ? <CommitRow o={o} /> : undefined}
    />
  );
}

/**
 * "I'm doing this" → "when will you start?".
 *
 * Two things at once. It is an implementation intention: naming a concrete
 * moment is what carries the d = 0.65 effect, and the options are all near-term
 * because an intention set for "sometime" is not one. And it is the only
 * behavioural signal we can collect — without it we can measure that a student
 * looked, never that they acted, which is precisely the illusion that made a
 * generation of nudge trials look successful before they were scaled.
 */
function CommitRow({ o }: { o: Opportunity }) {
  const { intents, setIntent, demo } = useDashboard();
  const intent = intents[o.id];
  const [asking, setAsking] = useState(false);
  const [detail, setDetail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function persist(next: OpportunityIntent | null) {
    const previous = intent ?? null;
    setIntent(o.id, next); // optimistic
    setError(null);
    startTransition(async () => {
      const res = next
        ? await saveOpportunityIntent({
            opportunityId: o.id,
            status: next.status,
            startWhen: next.startWhen,
            startDetail: next.startDetail,
            whyMatters: next.whyMatters,
          })
        : await clearOpportunityIntent(o.id);
      if (!res.ok) {
        setIntent(o.id, previous); // roll back — never claim a save that failed
        setError(res.error);
      }
    });
  }

  // Demo has no session, so a commitment could never persist. Rather than
  // offering a button that always fails, say nothing at all.
  if (demo) return null;

  if (intent && intent.status !== "dropped") {
    return (
      <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-2 border-t border-line pt-3">
        <p className="text-xs font-medium text-ivy-ink">{intentSentence(intent)}</p>
        {intent.status === "planning" && (
          <button
            type="button"
            disabled={pending}
            onClick={() => persist({ ...intent, status: "applied" })}
            className="rounded-lg border border-line px-2.5 py-1 text-xs font-medium text-ink-soft transition-colors hover:border-ink/30 hover:text-ink focus-visible:focus-ring disabled:opacity-50"
          >
            I entered it
          </button>
        )}
        {/* The return loop: a real calendar event with a reminder a week before
            the deadline closes — an external trigger that brings the student
            back on its own, with no email/push infrastructure. Only offered for
            a CONFIRMED date; a reminder on a guessed one would misfire. */}
        {o.dateConfirmed && intent.status === "planning" && (
          <button
            type="button"
            onClick={() => downloadIcs([o])}
            className="rounded-lg border border-ivy/30 bg-ivy-soft/40 px-2.5 py-1 text-xs font-medium text-ivy-ink transition-colors hover:bg-ivy-soft focus-visible:focus-ring"
          >
            Remind me before it closes
          </button>
        )}
        <button
          type="button"
          disabled={pending}
          onClick={() => persist(null)}
          className="text-xs text-ink-faint underline-offset-2 hover:underline focus-visible:focus-ring disabled:opacity-50"
        >
          Undo
        </button>
        {error && (
          <p role="alert" className="w-full text-xs text-reach">
            {error}
          </p>
        )}
        <WhyMattersField
          intent={intent}
          pending={pending}
          onSave={(why) => persist({ ...intent, whyMatters: why })}
        />
      </div>
    );
  }

  if (!asking) {
    return (
      <div className="mt-3 border-t border-line pt-3">
        <button
          type="button"
          onClick={() => setAsking(true)}
          className="rounded-lg bg-ink px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-ink/90 focus-visible:focus-ring"
        >
          I&rsquo;m doing this
        </button>
      </div>
    );
  }

  return (
    <div className="mt-3 border-t border-line pt-3">
      <p className="text-xs font-medium text-ink">When will you start?</p>
      <div className="mt-2 flex flex-wrap gap-2">
        {START_OPTIONS.map((when) => (
          <button
            key={when}
            type="button"
            disabled={pending}
            onClick={() =>
              persist({
                opportunityId: o.id,
                status: "planning",
                startWhen: when,
                startDetail: detail,
              })
            }
            className="h-9 rounded-lg border border-line px-3 text-xs font-medium capitalize text-ink transition-colors hover:border-ink/30 focus-visible:focus-ring disabled:opacity-50"
          >
            {when}
          </button>
        ))}
      </div>
      <label className="mt-2 block">
        <span className="sr-only">Where or how you&rsquo;ll start (optional)</span>
        <input
          type="text"
          value={detail}
          maxLength={INTENT_TEXT_MAX}
          onChange={(e) => setDetail(e.target.value)}
          placeholder="where, or how you'll start (optional)"
          className="w-full max-w-sm rounded-lg border border-line bg-card px-3 py-1.5 text-xs text-ink placeholder:text-ink-faint focus-visible:focus-ring"
        />
      </label>
      {error && (
        <p role="alert" className="mt-2 text-xs text-reach">
          {error}
        </p>
      )}
    </div>
  );
}

/**
 * "Why does this matter to you?" — one line, in the student's own words.
 *
 * Self-generated relevance (Hulleman & Harackiewicz): the interest gain comes
 * from the student writing the reason, not from our blurb telling them. Framed
 * for autonomy, not for a CV ("why you're in", not "why this helps admissions"),
 * because the cohort this is aimed at responds to being treated as an agent, not
 * improved at. Deliberately optional and low-friction — it appears only after a
 * commitment already exists, and saving is a blur or Enter away.
 */
function WhyMattersField({
  intent,
  onSave,
  pending,
}: {
  intent: OpportunityIntent;
  onSave: (why: string | null) => void;
  pending: boolean;
}) {
  const existing = intent.whyMatters ?? null;
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(existing ?? "");

  // Reflect an externally-changed value (e.g. optimistic rollback) back in.
  useEffect(() => {
    setValue(existing ?? "");
  }, [existing]);

  function commit() {
    setEditing(false);
    const cleaned = value.trim().replace(/\s+/g, " ").slice(0, WHY_MATTERS_MAX) || null;
    if (cleaned !== existing) onSave(cleaned); // only write a real change
  }

  if (!editing) {
    return (
      <button
        type="button"
        disabled={pending}
        onClick={() => setEditing(true)}
        className="w-full text-left text-xs focus-visible:focus-ring disabled:opacity-50"
      >
        {existing ? (
          <span className="text-ink-soft">
            <span className="text-ink-faint">Why you&rsquo;re in: </span>
            <span className="italic text-ivy-ink">&ldquo;{existing}&rdquo;</span>
          </span>
        ) : (
          <span className="text-ink-faint underline-offset-2 hover:underline">
            + say why this matters to you
          </span>
        )}
      </button>
    );
  }

  return (
    <label className="block w-full">
      <span className="sr-only">Why this matters to you</span>
      <input
        type="text"
        autoFocus
        value={value}
        maxLength={WHY_MATTERS_MAX}
        disabled={pending}
        onChange={(e) => setValue(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            commit();
          } else if (e.key === "Escape") {
            setValue(existing ?? "");
            setEditing(false);
          }
        }}
        placeholder="why this matters to you (in your words)"
        className="w-full max-w-sm rounded-lg border border-line bg-card px-3 py-1.5 text-xs text-ink placeholder:text-ink-faint focus-visible:focus-ring"
      />
    </label>
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
