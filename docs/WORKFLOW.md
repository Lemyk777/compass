# Workflow — who does which piece, and what it costs

Three documents already answer three questions.
[ARCHITECTURE.md](ARCHITECTURE.md) says **where** a change goes.
[../CONTRIBUTING.md](../CONTRIBUTING.md) says **how** it gets in.
[BACKLOG_2026-08.md §7](BACKLOG_2026-08.md) says **how to think** while doing
it, and it is the section that transfers when the findings around it go stale.

This file answers the fourth: **what to do yourself, what to split off, and how
to tell which is which.**

---

## The default is: do it yourself

This file used to open with one rule about trust. That rule is still here and
still right, but on its own it produced a workflow that reads as "split by
default", and the cost of that was measured on 2026-08-27:

> One audit of this repository dispatched three read-only sweeps in parallel.
> They cost **163k, 201k and 219k tokens** — 61, 97 and 103 tool calls, 13 to 17
> minutes each. A fourth agent, the measurer, **died on the session limit and
> returned nothing.** A fifth, dispatched to apply the fixes, turned out not to
> be remote at all and was killed at two minutes, also returning nothing.
>
> The finding that mattered — three layers painting over the control underneath
> them — was found **inline, in about fifteen tool calls**, by reading two files
> after looking at a screenshot. The measurement that confirmed it was then done
> **inline in about twelve calls**, after the agent that existed for it had
> already failed.
>
> Three of five agents returned something. Two burned budget for nothing. And no
> task that week finished inside one usage window.

So the rule has a second half now, and the second half is the one that was
missing.

---

## The two rules

> **1 · Trust.** A piece may be split off only when it ends in a fact the main
> session can check without redoing the work.
>
> **2 · Cost.** And only when finding that fact yourself would cost **more than
> the agent's cold start.**

Rule 1 says a split is *permitted*. Rule 2 says it is *worth it*. A piece that
satisfies only rule 1 is the expensive mistake this file now exists to prevent.

**A cold start is not free and is not small.** An agent reads
[CLAUDE.md](../CLAUDE.md) — 1,622 lines — plus its own definition, then
re-derives the shape of a repository the calling session already knows. Budget
**~30k tokens and several minutes before its first useful line.** Three agents
in parallel pay that three times, because they share no context with each other:
in the audit above, all three read CLAUDE.md, two ran the full test suite, and
each built its own file walker to answer one question.

**And the agent's output still has to be verified.** That cost belongs to the
agent, not to the main session's ledger. In the same audit, checking the
findings by hand demoted two of them: several "superlatives" in `careers.ts`
were ordinary English (`the best jobs`, `their best point`), and a reported
missing focus ring on two `<summary>` elements turned out to be a consistency
gap rather than an accessibility failure, because nothing in this codebase
resets `outline` globally. Both were reported in good faith. Both would have
been wrong to act on.

---

## The test, before you dispatch anything

Three questions, in order. The first `yes` decides it.

1. **Could a correct `Grep` or `Glob` answer this in under five calls?**
   → Do it yourself. "Find every place where X happens" is usually one pattern,
   not an agent. Spend the thought on the pattern.
2. **Does answering it require BUILDING AN INSTRUMENT** — an index over every
   export, a walk of the whole module graph, a run against every row of a
   registry, dozens of network fetches?
   → Split it off. That is real fan-out and the cold start disappears into it.
3. **Does it need context you already hold** — why we are measuring, what the
   defect looked like, which hypothesis is being falsified?
   → Do it yourself, even when it is big. Rebuilding that context is the whole
   of the agent's cost, and it is what the measurer failed at.

**One agent per question.** Parallel only when the agents look at disjoint parts
of the tree and neither could use the other's output. Three agents on one
subject is one subject paid for three times.

---

## Where a split actually pays, and where it does not

The pattern under all of it: **an agent pays when its cold start is either the
point, or negligible against the work it does.**

| | cold start is | verdict |
| --- | --- | --- |
| [`catalog-verifier`](../.claude/agents/catalog-verifier.md) | negligible — dozens of `WebFetch` calls against organiser pages, minutes of latency each, parallel across rows | **the clearest win.** Reach for it |
| [`sweeper`](../.claude/agents/sweeper.md) | negligible **only on true fan-out** — an index over 1,166 exports, a transitive graph walk, a count over every catalog row | **conditional.** Question 1 above decides |
| [`reviewer`](../.claude/agents/reviewer.md) | **the point** — not having written the diff is the product | **keep**, scoped to one diff |
| [`measurer`](../.claude/agents/measurer.md) | dominant — it must rebuild the hypothesis before it can probe | **measure inline.** Read the file, do not dispatch it |
| [`guard-writer`](../.claude/agents/guard-writer.md) | dominant — one edit, one seeded violation, one revert | **write it inline.** Read the file, do not dispatch it |

**The measurement channel is not being demoted. The agent form of it is.**
Measuring still beats looking, four times out of four, and reading is still
insufficient for height, position and adjacency — three whole-branch reviews of
the companion proved that by finding six real bugs and missing the three that
mattered. What changed is who holds the probe. The traps live in
[`.claude/agents/measurer.md`](../.claude/agents/measurer.md) and
[`.claude/agents/guard-writer.md`](../.claude/agents/guard-writer.md);
**read those two files yourself before measuring or before writing a guard.**
They are checklists first and agent definitions second.

Dispatch `measurer` only when the main session must keep working on something
unrelated while a long measurement sweep runs — and never at the same time as
anything that builds.

---

## The six kinds of work

| kind | split off? | what it must return | what it may never claim |
| --- | --- | --- | --- |
| **Sweep** — find every place where X happens | only on true fan-out (question 2) | `file:line` and the quoted line, plus what was searched and what was excluded | that it fixed anything, or that the list is complete without saying what the search covered |
| **Catalog verification** — is the date real, is the link alive, does the blurb obey [lib/data/README.md](../lib/data/README.md) | yes, in parallel, in batches | per row: the verdict, the organiser URL, and the sentence on that page that supports it | that a row can be kept by weakening its claim. Verification failures are answered by dropping, not by softening |
| **Review** — fresh eyes on a diff | yes, one diff at a time | findings ranked, each with a concrete failure scenario, closing with `Not covered:` | clearance. It is never the last gate |
| **Measurement** — geometry, contrast, bytes, characters per full line | **inline** | numbers, with the viewport, the theme and the probe that produced them | an impression. "Looks fine", "reads well", "seems centred" are not findings |
| **Guard** — encode an audit as an invariant in `scripts/test-engine.ts` | **inline** | the diff, **the failure output from a deliberately seeded violation**, and a bite test built from the real defect | "the test passes." A test nobody has seen fail is a belief |
| **Implementation** — the diff | inline, unless the tasks touch genuinely disjoint files | the diff, plus green `npm run build` and `npm run test:unit` output | "verified" for anything the tests do not actually cover |
| **Direction** — what to build, and whether to build it | **never** | — | — |

---

## Session economics

The six-hour pattern — a full usage window, a wait for the reset, then half of
the next one — is not caused by any single task being hard. Three things cause
it, and all three are avoidable.

- **An audit and its fix in one session.** The audit legitimately fills a
  window; the fix that follows it is usually four edits and ten minutes, and it
  does not need any of the audit's context. **Finish an audit by writing it
  down, then stop.** The fix starts fresh, small, and cheap.
- **Parallel agents on one subject.** See the test above. Three cold starts for
  one answer.
- **Running the whole gate when one command would do.** `npm run build` is the
  full lint plus type-check and takes minutes; `npx tsc --noEmit` is seconds and
  `npx eslint <the files you touched>` is faster still. Run the targeted pair
  while iterating and the full gate **once**, before the PR.

**Push early even when the work is unfinished.** A branch on the remote survives
a closed laptop, a killed session and an exhausted limit. Nothing local does.
CI does not run on a plain branch push — the workflow triggers on `main`,
`develop` and pull requests — so **opening the PR is what runs the gate**, and it
runs on GitHub's machines rather than yours.

**`isolation: "remote"` is not verified to work here.** On 2026-08-27 an agent
dispatched with it silently ran as a **local git worktree** under
`.claude/worktrees/`, confirmed by `TaskStop` reporting `task_type: local_agent`.
Anything promised to a person on the strength of "it runs in the cloud" was
wrong. Check `git worktree list` before believing it, and never tell someone
they can close the laptop until a branch is pushed.

---

## What is never delegated

- **Deciding what to build.** §7 of the backlog records three decisions taken
  from evidence and then settled differently by the founder. Their calls stand
  and are marked as owner's calls, so a future session can see that a human
  chose it rather than "fixing" it back. An agent cannot make that call and
  cannot recognise one.
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
  Whoever holds the dev server holds it exclusively, and stops it before
  anything builds.
  **A deleted route leaves stale types behind.** After removing a page,
  `.next/types/app/<route>/page.ts` survives and `npx tsc --noEmit` then reports
  `TS2307` against a file you deliberately deleted. Remove the stale directory
  before believing the error.
- **A branch whose PR has merged does not take commits.** It has happened three
  times, once stranding ten commits while the branch looked current. Check
  `gh pr view <n> --json state` before pushing.
- **A codemod over a styling token needs its exceptions checked by hand.** A
  sweep replaced `text-accent` on three icons including `AuthAside`, which
  paints its own fixed dark gradient in both themes, so a token that darkens in
  light mode was a regression there. Machine-wide replacement is a sweep
  result, not a sweep action.
- **A definition added mid-session is not available in that session.** The agent
  registry is read at startup, so a freshly written `.claude/agents/*.md` fails
  with "agent type not found" until Claude Code is restarted — confusing
  precisely because the file is right there on disk. To exercise one before
  restarting, dispatch a general-purpose agent and have it **read the definition
  file as its first instruction.** That is a real test of whether the definition
  is self-sufficient, which is the part worth testing anyway.

---

## The order of a release

1. **Sweep** — only where question 2 says so; otherwise grep it yourself.
2. **Decide** — main session; the owner where it is a product call.
3. **Implement** — main session. Worktree agents only where the tasks touch
   disjoint files.
4. **Guard** — inline, one invariant at a time, each seen failing before it is
   trusted. Read `.claude/agents/guard-writer.md` first.
5. **Measure** — inline, exclusive on the dev server, numbers only. Read
   `.claude/agents/measurer.md` first.
6. **Gate** — while iterating, the cheap pair:

```bash
npx tsc --noEmit
```

Then **once**, before the PR, the three CI commands in this order:

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
8. **PR into `develop`.** Never straight to `main`. The PR is also what runs CI.

---

## The two checks to run on this file

**On a claim:** if a piece of work came back with a claim and you cannot name the
command, number or `file:line` that supports it, the split was wrong — not the
reporter. Pull the work back into the main session and measure it.

**On a dispatch:** if an agent came back and its whole result could have been
reached with a handful of greps you now know how to write, that dispatch was
wrong. Write the grep into this file so the next session skips the agent.
