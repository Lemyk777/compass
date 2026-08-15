"use client";

import { useState, useTransition } from "react";
import { recordReaction } from "@/app/companion/actions";
import type { Beat } from "@/lib/data/beats";

// TWO TUESDAYS, THREE ANSWERS.
//
// This is how the product learns who someone is without asking them the question
// they came here unable to answer. It shows two concrete moments of real work
// and asks which is more like them. Nothing abstract is ever put to them.
//
// FOUR RULES, and each is a way the obvious version fails:
//
// 1. **"I don't get it" is a first-class answer**, not a way out. It swaps that
//    card's text for a plainer version IN PLACE and records `unclear`, which
//    contributes no signal — and it does NOT advance the pair, because the
//    student still gets to answer once they understand. It is also our own
//    quality feedback: a beat collecting these is badly written.
// 2. **No framer.** The companion renders on every page in the product, and a
//    new framer importer here would pull the library into every route bundle.
//    The movement is CSS transform/opacity, which the global reduced-motion
//    guard in globals.css already zeroes — so the reader who asked for less
//    gets less, for free.
// 3. **The press lands in the client first.** The chosen card moves and the
//    other fades immediately, then the write goes out. A card that waits on a
//    round trip before acknowledging a tap reads as broken, and this is the
//    first thing a new student ever does here.
// 4. **Both beats are recorded.** Picking one is also passing on the other, and
//    `scoreBeats` only counts `picked` — a pass is not evidence about the other
//    side, because a student can dislike both.
export function BeatPair({ left, right }: { left: Beat; right: Beat }) {
  const [plainer, setPlainer] = useState<Record<string, boolean>>({});
  const [chosen, setChosen] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  /**
   * Write both halves and UNDO the optimistic state if either fails.
   *
   * Discarding the results is what made the first version fatal: `chosen` was
   * set before the write, a failing action returns without revalidating, so
   * nothing re-rendered and the pair stayed disabled forever with no
   * explanation. Migration 0031 is applied by hand, so "the table is not there
   * yet" is a state a real student can meet on day one — and the action's
   * carefully-worded message for exactly that was unreachable.
   *
   * A HALF-written pair is harmless and deliberately not rolled back: only
   * `picked` scores, and `pairsAnswered`/`nextPair` key off either beat, so a
   * lost `passed` row costs nothing but the badly-written-beat telemetry.
   */
  function write(writes: { beatId: string; reaction: string }[]) {
    startTransition(async () => {
      for (const w of writes) {
        const res = await recordReaction(w);
        if (!res.ok) {
          setChosen(null);
          setError(res.error);
          return;
        }
      }
    });
  }

  function choose(picked: Beat, passed: Beat) {
    if (chosen) return;
    setChosen(picked.id);
    setError(null);
    write([
      { beatId: picked.id, reaction: "picked" },
      { beatId: passed.id, reaction: "passed" },
    ]);
  }

  function neither() {
    if (chosen) return;
    setChosen("neither");
    setError(null);
    write([
      { beatId: left.id, reaction: "passed" },
      { beatId: right.id, reaction: "passed" },
    ]);
  }

  function explain(beat: Beat) {
    // Shown immediately and never rolled back: understanding the sentence is
    // the point, and the `unclear` row is only our own telemetry about a badly
    // written beat. A failure here must not take the plainer words away.
    setPlainer((p) => ({ ...p, [beat.id]: true }));
    startTransition(async () => {
      await recordReaction({ beatId: beat.id, reaction: "unclear" });
    });
  }

  const card = (beat: Beat, other: Beat) => {
    const taken = chosen !== null;
    const isChosen = chosen === beat.id;
    return (
      <li
        // Under reduced motion the global guard in globals.css forces
        // `transition-duration: 0.001ms !important` on everything, and a utility
        // class cannot outrank `!important` — so a variant claiming to "keep the
        // crossfade" would be a comment asserting something the CSS does not do.
        // What CAN be honoured here is the 4px jump: `transform-none` removes it
        // rather than leaving it to snap. The acknowledgement is then carried by
        // the opacity change alone, instantly, which is the correct outcome for
        // a reader who asked for less.
        className={`transition-[transform,opacity] duration-200 ease-out motion-reduce:transform-none ${
          taken && !isChosen ? "opacity-40" : ""
        } ${isChosen ? "-translate-y-1" : ""}`}
      >
        <button
          type="button"
          onClick={() => choose(beat, other)}
          disabled={taken}
          className="w-full rounded-2xl border border-line bg-card p-4 text-left transition-[border-color,box-shadow] hover:border-accent hover:shadow-card focus-visible:focus-ring disabled:cursor-default"
        >
          <span className="block text-sm leading-relaxed text-ink">
            {plainer[beat.id] ? beat.plainer : beat.text}
          </span>
        </button>
        {!plainer[beat.id] && !taken && (
          <button
            type="button"
            onClick={() => explain(beat)}
            className="mt-1 inline-flex min-h-11 items-center text-xs text-ink-faint underline-offset-4 transition-colors hover:text-ink-soft hover:underline focus-visible:focus-ring"
          >
            I don&rsquo;t get it
          </button>
        )}
      </li>
    );
  };

  return (
    <section aria-labelledby="beat-pair">
      {/* The frame. Without it a student meets two unlabelled sentences and has
          no idea why they are being asked or what happens to the answer — which
          is how a question meant to help reads as a riddle. It says what these
          are, what we do with them, and that there is nothing to get right. */}
      <h3 id="beat-pair" className="text-sm font-semibold text-ink">
        Which day sounds more like you?
      </h3>
      <p className="mt-1 text-xs leading-relaxed text-ink-faint">
        Two real working days, from two different jobs. Answer a few and we can
        start pointing you somewhere — no right answer, nothing saved to your
        profile, and &ldquo;neither&rdquo; is useful too.
      </p>

      <ul className="mt-3 space-y-2">
        {card(left, right)}
        {card(right, left)}
      </ul>

      {chosen === null && (
        <button
          type="button"
          onClick={neither}
          className="mt-2 inline-flex min-h-11 items-center text-xs font-medium text-ink-soft underline-offset-4 transition-colors hover:text-ink hover:underline focus-visible:focus-ring"
        >
          Neither of these
        </button>
      )}

      {/* Said out loud, and the controls come back. A press that silently does
          nothing teaches a student the product is broken — and this is the
          first thing they ever do here. */}
      {error && (
        <p role="status" className="mt-2 text-xs leading-relaxed text-reach-ink">
          {error} Nothing was lost — press again.
        </p>
      )}
    </section>
  );
}
