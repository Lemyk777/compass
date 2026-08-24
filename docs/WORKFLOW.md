# Workflow — how work is cut up, and what each piece must prove

Three documents already answer three questions.
[ARCHITECTURE.md](ARCHITECTURE.md) says **where** a change goes.
[../CONTRIBUTING.md](../CONTRIBUTING.md) says **how** it gets in.
[BACKLOG_2026-08.md §7](BACKLOG_2026-08.md) says **how to think** while doing
it, and it is the section that transfers when the findings around it go stale.

This file answers the fourth question, which none of them do: **who does which
piece, and what that piece has to come back with before anybody believes it.**

It exists because the failure this repository keeps repeating is not a wrong
answer. It is a confident report about work that was never checked. Five guards
have shipped that enforced nothing; three whole-branch reviews of the companion
missed the three defects that mattered; a PR description cited a regex that
matched no string in the language. Every one of those was somebody, or
something, reporting green.

---

## The one rule

> **A piece of work may be split off only when it ends in a fact the main
> session can check without redoing the work.**

Everything below is that rule applied to the kinds of work this repository
actually contains. Parallelism is not the goal and has never been the
bottleneck here — deciding what is true has.

**The evidence for the rule, both directions:**

- **It pays.** A read-only sweep over 433 regex literals found three dead
  guards in one pass. Another found one vocabulary hand-copied into five places
  and a second into seven. Each returned a list of `file:line`, each was
  verified in seconds, and neither could have been produced faster by reading
  more carefully.
- **It fails.** Three full reviews of the companion found six genuine bugs by
  reading code and missed that the panel was never sticky (a grid item stretches
  to its row, so the aside stood 4054px tall), that its bottom sat permanently
  below the fold (an 816px panel pinned in a 720px viewport), and that it asked
  two things at once. All three are properties of height, position and
  adjacency. A fourth reviewer would have missed them too, because the channel
  was wrong, not the amount of attention.

---

## The six kinds of work

| kind | split off? | what it must return | what it may never claim |
| --- | --- | --- | --- |
| **Sweep** — find every place where X happens | yes, in parallel | `file:line` and the quoted line, plus what was searched and what was excluded | that it fixed anything, or that the list is complete without saying what the search covered |
| **Guard** — encode an audit as an invariant in `scripts/test-engine.ts` | yes, one per invariant | the diff, **the failure output from a deliberately seeded violation**, and a bite test built from the real defect | "the test passes." A test nobody has seen fail is a belief |
| **Measurement** — geometry, contrast, bundle bytes, characters per full line | yes, **exactly one at a time** | numbers, with the viewport, the theme and the probe that produced them | an impression. "Looks fine", "reads well", "seems centred" are not findings |
| **Catalog verification** — is the date real, is the link alive, does the blurb obey [lib/data/README.md](../lib/data/README.md) | yes, in parallel | per row: the verdict, the organiser URL, and the sentence on that page that supports it | that a row can be kept by weakening its claim. Verification failures are answered by dropping, not by softening |
| **Implementation** — the diff | only when genuinely independent, and then in a worktree | the diff, plus green `npm run build` and `npm run test:unit` output | "verified" for anything the tests do not actually cover |
| **Direction** — what to build, and whether to build it | **never** | — | — |

---

## The five agents

Definitions live in [`.claude/agents/`](../.claude/agents). They exist so a
split-off piece does not pay for a cold start: each one carries the rules it can
break, so it does not have to read 600 lines of [CLAUDE.md](../CLAUDE.md) to
avoid writing `bg-ink text-white` on a button.

| agent | what it is for | the discipline baked into it |
| --- | --- | --- |
| [`sweeper`](../.claude/agents/sweeper.md) | read-only fan-out: inventories, "find every place where", walking the module graph | returns evidence, never a fix and never a verdict; states the search it ran, so the negative space is visible |
| [`guard-writer`](../.claude/agents/guard-writer.md) | one invariant into `scripts/test-engine.ts` | must seed a violation, show the failure, then revert. The bite test reads the shipped pattern, never a copy of it |
| [`measurer`](../.claude/agents/measurer.md) | the running system: `getBoundingClientRect`, computed styles, contrast arithmetic, built chunk sizes | the only agent allowed the dev server, and only one may run. Reports numbers with viewport and theme attached |
| [`catalog-verifier`](../.claude/agents/catalog-verifier.md) | catalog rows: dates, links, cost claims, blurb rules | five verdict bands, two of which fail the gate. Drops rather than softens |
| [`reviewer`](../.claude/agents/reviewer.md) | fresh eyes on a diff, before the author's own last read | never the last gate. Must close by naming what its channel could not reach |

**On the reviewer, because this file first shipped without one.** The argument
for leaving it out was that the three whole-branch reviews of the companion
missed the three defects that mattered, so a second reader does not reach the
class of bug that keeps getting through. The first half of that is true and the
conclusion does not follow from it. **The same three reviews found six genuine
criticals**, and the author re-reading their own diff is not the same act as
fresh eyes on it — reading is insufficient, which is not the same as worthless.

So the reviewer exists, and the fix for the misses is a stated boundary rather
than an absence: it is **never the last gate**, and every review it returns
closes with a `Not covered:` section naming what only the `measurer` can check.
A review without that section gets read as clearance, which is exactly how three
of them shipped a panel that was never sticky.

**Why these five and not more.** Each maps onto work that has already happened
here repeatedly and has a checkable output. The test to apply before adding a
sixth is the rule at the top of this file, not whether the role sounds useful.

**A definition added mid-session is not available in that session.** The agent
registry is read at startup, so a freshly written `.claude/agents/*.md` fails
with "agent type not found" until Claude Code is restarted — which is confusing
precisely because the file is right there on disk. To exercise one before
restarting, dispatch a general-purpose agent and have it **read the definition
file as its first instruction**. That is a real test of whether the definition
is self-sufficient, which is the part worth testing anyway.

---

## What is never delegated

- **Deciding what to build.** §7 records three decisions taken from evidence and
  then settled differently by the founder. Their calls stand and are marked as
  owner's calls, so a future session can see that a human chose it rather than
  "fixing" it back. An agent cannot make that call and cannot recognise one.
- **The last read of the diff before a PR.** Not because an agent reads badly,
  but because the person merging is the one who has to stand behind it.
- **`git commit`.** [CLAUDE.md](../CLAUDE.md) requires an explicit instruction,
  and `.claude/settings.json` puts `git commit` behind `ask`.
- **Applying a migration.** SQL is run by hand in the Supabase editor. Run
  `npm run db:check` afterwards.
- **Any claim whose evidence is "and then it looked right."**

---

## Shared resources — two agents can silently break each other

- **`.next` is shared.** `npm run build` while `npm run dev` is up replaces
  chunks the dev server still references, and it fails as
  `Cannot find module './NNNN.js'`, which looks like a code bug and is not one.
  **Only the `measurer` holds the dev server**, and it must stop the preview
  before anything builds. Never run two of these concurrently.
- **A branch whose PR has merged does not take commits.** It has happened three
  times, once stranding ten commits while the branch looked current. Check
  `gh pr view <n> --json state` before pushing.
- **A codemod over a styling token needs its exceptions checked by hand.** A
  sweep replaced `text-accent` on three icons including `AuthAside`, which
  paints its own fixed dark gradient in both themes, so a token that darkens in
  light mode was a regression there. Machine-wide replacement is a sweep
  result, not a sweep action.

---

## The order of a release

1. **Sweep** — parallel, read-only, ends in a list.
2. **Decide** — main session; the owner where it is a product call.
3. **Implement** — main session, or worktree agents where the tasks touch
   disjoint files.
4. **Guard** — one `guard-writer` per invariant, each seen failing before it is
   trusted.
5. **Measure** — one `measurer`, exclusive on the dev server, numbers only.
6. **Gate** — the three CI commands, locally, in this order:

```bash
npm run build
```

```bash
node --import tsx scripts/test-session-checks.ts
```

```bash
npm run test:unit
```

7. **Read the whole diff yourself.**
8. **PR into `develop`.** Never straight to `main`.

---

## The check to run on this file

If a piece of work came back with a claim and you cannot name the command,
number or `file:line` that supports it, the split was wrong — not the reporter.
Pull the work back into the main session and measure it.
