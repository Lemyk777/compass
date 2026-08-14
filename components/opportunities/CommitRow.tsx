"use client";

// The commitment cluster extracted from OpportunitiesView: the shared card
// row plus the "I'm doing this" → "when will you start?" → "why it matters"
// flow. Self-contained (its own actions/intents imports) so the view file
// stays about layout, not the intent state machine.

import { useEffect, useState, useTransition } from "react";
import { OpportunityCard } from "@/components/opportunities/OpportunityCard";
import { useDashboard } from "@/components/dashboard/DashboardContext";
import {
  clearOpportunityIntent,
  saveOpportunityIntent,
} from "@/app/dashboard/actions";
import { downloadIcs } from "@/lib/calendar/ics";
import {
  INTENT_TEXT_MAX,
  START_OPTIONS,
  WHY_MATTERS_MAX,
  intentSentence,
  type OpportunityIntent,
} from "@/lib/data/intents";
import type { Opportunity } from "@/lib/data/key-dates";

export function OpportunityRow({
  o,
  commit,
}: {
  o: Opportunity;
  commit?: boolean;
}) {
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
        <p className="text-xs font-medium text-ivy-ink">
          {intentSentence(intent)}
        </p>
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
          <p role="alert" className="w-full text-xs text-reach-ink">
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
          className="rounded-lg bg-ink px-3 py-1.5 text-xs font-medium text-surface transition-colors hover:bg-ink/90 focus-visible:focus-ring"
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
        <span className="sr-only">
          Where or how you&rsquo;ll start (optional)
        </span>
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
        <p role="alert" className="mt-2 text-xs text-reach-ink">
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
    const cleaned =
      value.trim().replace(/\s+/g, " ").slice(0, WHY_MATTERS_MAX) || null;
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
            <span className="italic text-ivy-ink">
              &ldquo;{existing}&rdquo;
            </span>
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
