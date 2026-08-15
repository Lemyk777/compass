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
  const [, startTransition] = useTransition();

  function choose(picked: Beat, passed: Beat) {
    if (chosen) return;
    setChosen(picked.id);
    startTransition(async () => {
      await recordReaction({ beatId: picked.id, reaction: "picked" });
      await recordReaction({ beatId: passed.id, reaction: "passed" });
    });
  }

  function neither() {
    if (chosen) return;
    setChosen("neither");
    startTransition(async () => {
      await recordReaction({ beatId: left.id, reaction: "passed" });
      await recordReaction({ beatId: right.id, reaction: "passed" });
    });
  }

  function explain(beat: Beat) {
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
        className={`transition-[transform,opacity] duration-200 ease-out motion-reduce:transition-none ${
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
      <h3 id="beat-pair" className="text-sm font-semibold text-ink">
        Which of these is more like you?
      </h3>
      <p className="mt-1 text-xs leading-relaxed text-ink-faint">
        Two real working days. No right answer, and you can say neither.
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
    </section>
  );
}
