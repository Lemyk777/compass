# The backlog — state, findings, and what to do next

The founder gave a 23-item fix/redesign list on 2026-08-10; items #24, #26 and
#27 were added after. **Last updated 2026-08-19.** This file carries everything
a fresh session needs to continue without re-deriving it.

Read [CLAUDE.md](../CLAUDE.md) first — it holds the product rules. This file
holds only what is **specific to this backlog** and not already written there.
The planner's own design of record is [PLANNER_PLAN.md](PLANNER_PLAN.md).

**Where to look, by question:** §1 what is deployed · §4 what is left, in detail
· §5 findings worth not re-discovering · §6 how to verify · §7 the method · §8
**the ordered next list**, ending in the **problems that are nobody's work
item** · §9 **the direction** — what the next build is for · §10 a session log
kept for the order things happened in.

**Every count in this file is a claim, not a fact.** It said `main` was two
releases behind reality while being the file that exists to prevent exactly
that. Re-derive before trusting: `git fetch`, `npm run test:unit`, and the
scripts in §6 take under a minute between them.

---

## 1. Where the repository stands — READ THIS FIRST

**As of 2026-08-19 everything in this repository is in production**, including
release 9 — the copy and readability pass, merged through
[#123](https://github.com/Lemyk777/compass/pull/123) into `develop` and released
via [#124](https://github.com/Lemyk777/compass/pull/124). Vercel is green, and
the live pages were verified rather than assumed: `applycompass.app` serves the
rewritten blurbs, zero contrast failures, nothing under 12px, and 5.4% of
`/opportunities` at ≤14px against 51.9% before.

The habit of this file is to warn that the branch is ahead of `main`; right now
it is not. Verify anyway — it takes ten seconds, and a stale note here has cost
a release twice, most recently this one: the table below said `main` was
`4c87cc0` when it had been `6be95e8` for two releases:

```bash
git fetch origin && git log --oneline origin/main..HEAD
```

| | |
|---|---|
| On `main` (deployed) | everything through **release 9**. `origin/main` = `478ab24`, released via [#124](https://github.com/Lemyk777/compass/pull/124) from `origin/develop` = `b3ff145`. The two are identical in content |
| Open PRs | none |
| Branch | `develop` |
| Unit tests | **282** (`npm run test:unit`) |
| Session checks | **61** (`node --import tsx scripts/test-session-checks.ts`) |
| Catalog | **172 entries · 0 broken links locally** (1 unverifiable — a bot wall, reported without failing). **The weekly job on `main` reads differently and has failed since at least 2026-08-03** — see below |
| Migrations | **All applied through `0031_beat_reactions.sql`** — `npm run db:check` reports 33/33 |

**The `Link health` workflow has been red for at least three weekly runs**
(2026-08-03, 08-10, 08-17), and it is not a regression from anything recent. It
reports 161/172 with **2 broken** — `future-problem-solving` and
`odysseyofthemind` — and 9 unverifiable, where a run from a home connection the
same week gets 171/172, **0 broken** and 1 unverifiable. Both "broken" URLs
answer **200** when fetched with an ordinary browser user agent, so this is the
datacenter-IP problem `ARCHITECTURE.md` already names as the reason the job sits
outside the CI gate — the checker is being blocked, not finding dead links. It
still needs a decision, because a check that is permanently red is a check
nobody reads: either the job tolerates a connection-level failure the way it
already tolerates a 403/429/412, or it stops running in CI.

### What shipped in release 9 — the copy and readability pass, 2026-08-19

138 files. Two jobs, and both began by measuring, because both had been "fixed"
before and the complaint came back anyway.

**The catalog had never had a copy pass.** Release 7 took the five prose
registries to zero em dashes; the 172-entry catalog — the front door, and the
text on every card, every `/opportunities/[id]` page and every shared link's
preview — was not in that sweep. Vocabulary was clean again (3 "not just", 2
"prestigious", 1 "gateway" in the whole file). The tells were structural:

| | before | after |
| --- | --- | --- |
| sentence dashes across the catalog's five text fields | 451 | 33 |
| blurbs that were one sentence split by a dash | 149 / 172 | 40 / 172 |
| short sentences (≤6 words) in blurbs | 5.6% | **27.2%** |
| long sentences (≥15 words) in blurbs | 40.3% | **10.8%** |
| sentence-length CV in blurbs | 0.30 | **0.42** |

Also out: ~15 superlatives the catalog was never held to ("the most prestigious",
"pinnacle", "legendary", "premier", "elite") though the guide is test-banned from
them, and the `[Fully Funded]` bracket on 30+ blurbs, which restated the
`CostPill` two lines above it. **The voice was not invented** — entries ~110–172
were already written well, so the file supplied its own target.

**Three traps, all hit and all worth knowing.** `eligibility` is PARSED, so a
range dash in "Grades 9–12" is load-bearing and a sentence dash is not — the
change was only safe because `{gate, parsed}` was dumped for all 172 rows before
and after and diffed to nothing. A dash can be a **join key**
(`country-views.tsx` builds `${university} — ${program}` and
`findItalianProgram` matches that exact string), so both sides have to move
together. And **`prettier --write` must not be run over the changed files**: this
repo is not uniformly prettier-formatted, and it reformatted
`lib/data/universities.ts` by 835 lines for a 7-string edit, forcing a full reset
and re-apply.

**The readability half: contrast was innocent for the third time.** Measured on
three pages in both themes before touching anything — **zero WCAG failures**
(worst 4.53:1) and nothing under 11px. Every test that existed passed while the
complaint stood. The defect was **size**: 93.5% of a country profile's 9,000
characters sat at ≤14px (81% at exactly 14px), `/opportunities` 52%, `/demo`
81%. Repo-wide, 411 `text-sm` + 339 `text-xs` against 100 `text-base`, plus 118
labels pinned at exactly `text-[11px]` — "at the floor" is not "readable", it is
"not illegal". The scale's small end moved one step (xs 13 / sm 15 / base 17 /
lg 19) in `tailwind.config.ts`, the 118 hardcoded floors went to 12px, and
long-form prose took a second step to `text-base`, chosen by `max-w-[54ch]`
because a measure cap only ever appears on a column of continuous reading.
Re-measured after: 0 contrast failures, nothing under 12px, no horizontal
overflow at 375px, and the measure still 70.5 real characters per full line.

Also: 19 `text-ink/60`-style alphas moved to `ink-soft`. CLAUDE.md already named
4.53:1 as the number and the hero paragraph had been moved off it; nineteen
others, including six landing-page body paragraphs at `font-light`, had not.

**And the 11px floor guard had never fired** — see the correction in §5.22.

### What shipped in release 8 — the performance pass, 2026-08-19

Every measured bottleneck was a **formatter or a parser**, never an algorithm —
`formatDate` alone cost 90.76 µs a call and ran once per card. Eight
optimisations, and **three defects nobody had reported**: a mind map's indent
button could overflow the stack (`subtreeHeight` recursed into cycles while its
neighbour `depthOf` was explicitly cycle-safe), a partner's link could inject
events into a student's `.ics` download (`z.string().url()` accepts a CR/LF and
`URL:` was written unescaped), and `visitDurationMs` had an argument-count
ceiling held back only by a constant in another file. 268 → 281 unit tests.
Full account in [PERFORMANCE_2026-08-19.md](PERFORMANCE_2026-08-19.md), §4 for
what was deliberately left alone and §5 for the two things left to the owner.

Two catalog facts that surprise people, both deliberate and both currently zero:
**nothing is `pinned`** and **nothing is `region`-tagged**. The NAO Cup row was
the only instance of each, and it was removed on the owner's instruction — see
the audit's A1, and A8, which is now the highest-value data work available. A
unit test pins each zero, so the first row that changes either will fail and
make somebody read why.

### What shipped in release 7 — the copy pass, 2026-08-16

The complaint was that the text reads as machine-written. It was measured rather
than argued about, and **the usual suspect was innocent**: across 48,000 words of
student-facing prose the AI vocabulary was already absent — one "comprehensive",
five "landscape", and no "delve", "leverage", "utilize" or "robust" anywhere.

The tell was **rhythm**, not vocabulary. Almost every sentence had one shape:
claim, em dash, qualifier. Across the five prose registries, words per sentence
went 22.4 → 16.9, sentences over 30 words 21.7% → 6.6%, and em dashes per
sentence ~0.27 → 0.00. Contractions went from 4 against 514 long forms to 337
against 193 — the earlier ratio of 1:128 was not "few" but effectively none, and
that absolute uniformity is itself the tell, because real writing mixes them.

**Why a regex cannot do this job**, and it is worth not rediscovering: every
individual sentence was defensible. Only the distribution was wrong, and a
distribution is invisible one line at a time.

> **This pass covered the five prose registries and NOT the catalog** — the
> 172 entries behind every card, every `/opportunities/[id]` page and every
> shared link's preview, which is the most-read prose in the product. That was
> found and fixed on 2026-08-19; see the release-9 block in §1. The lesson is
> about scope rather than method: "all the product's text" was measured as "the
> files I thought of", and `competitions-data.ts` is a data file, so it did not
> look like prose. Enumerate the surfaces from what a student reads, not from
> what is shaped like an article.

The pass also corrected a measurement this repo had recorded wrongly for several
releases: the guide's lead paragraph carried `max-w-[60ch]`, honoured it, and
still ran 79–80 characters a line. The old note claimed 60ch "lands at ~72". It
does not, and the reason is that the earlier measurement averaged in the ragged
final line of each paragraph, which drags the mean down by roughly a whole tier.
**Count characters per _full_ line** — walk the text node with a `Range` and
group by `getBoundingClientRect().top`. The cap is `54ch` now.

### What shipped in release 6 — the rest of the one list, and an audit, 2026-08-16

Two halves, merged through [#116](https://github.com/Lemyk777/compass/pull/116)
and released via [#117](https://github.com/Lemyk777/compass/pull/117).

**The half that was specified.** Tasks 4 and 5 of the one-list spec, and neither
landed as written:

- **The filter rail was DECLINED, on measurement.** From `xl` the companion
  already takes 20rem, so the student shell's content column *drops* from 966px
  at 1024 to 854px at 1280. A 256px rail on top of that measured 282px cards at
  the commonest desktop width. **Check what already owns the margin before
  specifying a rail.**
- **Columns shipped as a CONTAINER QUERY, not a breakpoint.** The opportunity
  list renders in the student's section *and* in the report's panel, and at the
  same 1024px viewport it is 924px wide in one and 652px in the other. A
  viewport breakpoint measured 457px cards in one shell and 321px in the other.
  `.opp-list` / `.opp-grid` go two-up once the list itself clears 800px.
- **Typography was measured and left alone.** The reported problem was not there.
- **The "I'm doing this" flow was restored.** [#114](https://github.com/Lemyk777/compass/pull/114)
  deleted the five-row shortlist, which was `CommitRow`'s only caller — so
  `saveOpportunityIntent`, the product's single behavioural signal, was
  **unreachable from the UI for a whole release** while still compiling, still
  exported, still type-checked.

**The half that was not.** A whole-tree audit, nine findings, all fixed:

- **The catalog was reaching eight client bundles** through two chains of one
  hop each: `RoadmapView → roadmap.ts → key-dates`, and `LikelihoodGauge →
  app-deadlines.ts → key-dates` — the second for a two-line date helper.
  plan/timeline went 164 → 121 kB, odds/college-list 171/173 → 138/140.
- **`deleteMap` was dead code while `createMap` told users to use it.**
- **Five vocabularies existed twice**, which is the soil three separate bugs
  grew in. One list each now, so the compiler can help.
- **163 of 393 dictionary keys were dead.**

**The durable lesson, and it is the reason release 6 is worth reading about at
all: in five of the nine findings the root cause was the DETECTOR, not the
defect.** The bundle guard scanned for a *direct* import edge from a client
component, so one hop of indirection was invisible to it — and it had been cited
as a guarantee. It walks the module graph now, stopping at `"use server"` files
(a server action is an RPC stub, not a dependency). Dead exports and unread
dictionary keys are scanned in CI.

**Fix the root, then fix the detector that missed it.** A guard that has never
failed on a known-bad input is a belief, not a test.

### What shipped in release 5 — the guided thread, 2026-08-15/16

Design of record: `docs/superpowers/specs/2026-08-15-guided-thread-design.md`.
The one-line diagnosis it answers: **we built an excellent library and called it
accompaniment.** A library answers a question that is already formed; our
student cannot form the question, which is the reason they came.

Three things a fresh session needs to know exist:

- **The majors layer** — 44 subjects, each with a page, as **step 2 of the
  guide**, between the work and the country, because the major is what you apply
  *with*. It needed no migration: `planner_path` has no `kind` column, so
  `major:computer-science` was storable the day the registry existed.
- **The companion** — a rail from `xl`, a 44px dock below it, on every page of
  the student's section. Its stage is DERIVED (`lib/data/thread.ts`), never
  stored.
- **The reaction engine** — two concrete working days, "which is more like you",
  and **"I don't get it" is a first-class answer** that rephrases and keeps the
  pair open. `0031_beat_reactions` is the only new stored fact in the release.

### Four lessons from release 5, each of which cost something

1. **PR #111 was merged while its review was still running.** All three fix
   commits stranded on the branch, and `develop` briefly carried a version whose
   centrepiece did not work. **This is the third time.** The rule is not "check
   the PR state before pushing" — it is **run the whole-branch review BEFORE
   asking for the merge**, because this owner merges fast and that is fine.
2. **A test asserted nothing for its whole life.** The companion's bundle guard
   was built as a template literal, where `\s` is the letter s and `\b` is a
   backspace: it compiled to `imports+(?!type\b)[^;]*froms+…`, matched nothing,
   and was cited as a guarantee in a PR description. Any hand-built regex now
   needs a second test proving it BITES on a known-bad input. Assemble from
   RegExp literals via `.source` so the parser owns the escaping.
3. **Three code reviews found six criticals and missed the three that mattered
   most.** The companion was never sticky (a grid item stretches to its row, so
   a 4054px "sticky" box has nothing to stick to), its bottom sat 96px below the
   fold, and it asked two things at once. Those are visible only by OPENING THE
   PAGE. Reading code cannot find them — see §7 for how to look when a surface
   is session-gated.
4. **`develop` was 75 commits behind `main` with none of its own.** Branching
   from it per CONTRIBUTING produced a tree with no planner, no spine and no
   plan-picks, which surfaced as "weird type errors". Fast-forwarded. Check
   `git rev-list --count origin/develop..origin/main` before trusting the branch
   model. **Resolved as of release 7** — the last two releases went `develop` →
   `main`, so the documented model and the practice now agree.

### Release 4 — the planner, 2026-08-14 (read PLANNER_PLAN.md § "Release 4")

The founder read release 3 and said almost nothing had changed. He was right,
and the finding is worth more than the fix: **release 3 shipped the structure
and not the experience.** The tab strip was three routes, the only sentence
addressed to a student lived on the empty state and vanished after their first
action, the "bridge" to the guide was four numbers, and the map's typed nodes
were computed and never rendered. Every one of those was real work that produced
no observable change.

**The rule to carry forward: a structural release needs one visible consequence
shipped with it, or it reads as nothing.**

Release 4: one route with three lenses (`/planner?view=…`), `planner_path` as a
real guide→plan join with an "Add to my plan" control on every guide subject
page, and `nextMove` — one pure, ordered sentence with a mandatory reason,
present at every stage rather than only on day one. **The owner declined a
"path" of stages**; the concern that this leaves all the accompaniment resting
on the next move was raised before the decision and is recorded in
PLANNER_PLAN.md §1, so it can be revisited against the evidence rather than
re-argued.

### The mistake that produced that split, so it is not repeated

PR #106 was merged by the founder while work continued on the same branch. A
merged PR is closed and does not take new commits, so everything pushed after
the merge silently accumulated on the branch instead of shipping — and the PR's
title was edited *after* the merge to mention work that was never in it.

**The rule: check `gh pr view <n> --json state` before pushing to a branch that
has an open PR, and open a new PR the moment the old one merges.** Never edit a
merged PR's title or body to describe later work.

### How to see the real state in ten seconds

```bash
git fetch origin && git log --oneline origin/main..HEAD
```

Empty means everything is deployed. Anything listed is not.

### The migrations are applied — verified 2026-08-17

`npm run db:check` reports **all 33 checks pass**, which includes
`planner_items` (0028), `planner_map_nodes` (0029), `planner_path` (0030) and
`beat_reactions` (0031). The warning that used to stand here is gone: the
agenda, the board, the student's own tasks, "In progress", the mind maps, the
guide→plan join and the companion's reactions are all live against a real
schema.

That is what unblocked the planner being **advertised** on the landing page —
this product's own rule is that a feature is not described until it works, and
there was a period when two of the three planner surfaces would have returned a
readable error naming a migration.

Re-run `npm run db:check` before believing any note about what is applied,
including this one. It is read-only, takes a couple of seconds, and it is the
only thing here that cannot go stale silently — a note can.


### The one trap that will waste an hour

`npm run build` must **not** run while `npm run dev` is up — they share `.next/`
and the production build replaces chunks the dev server still references. The dev
server then dies with `Cannot find module './NNNN.js'`, which looks exactly like
a code bug and is not one. Stop the dev server first, or recover with
`rm -rf .next`.

If another session's dev server is holding the port and you need bundle numbers
anyway, build into a throwaway directory rather than clobbering theirs — but see
§5.9 for the side effect that has.

---

## 2. Owner decisions already taken — do not re-litigate

- **#17 planner = FULL scope, SPLIT INTO TWO RELEASES** (revised 2026-08-12).
  The original decision was calendar + kanban board + mind maps in one go. The
  scope is unchanged; the delivery is not. **Release 1 (shipped): calendar +
  board.** They are two views of one list — the same rows, sorted by date or
  grouped by status — so they share a data model, a renderer and a set of rules.
  **Release 2: mind maps**, which share none of those (nodes and edges, a free
  canvas, and the hardest part to operate from a keyboard). Cutting on that seam
  shipped a whole first release instead of half of three.
- **#11 career honesty = DIRECT tone.** Name the barriers explicitly:
  consulting and IB recruit from short lists of target schools and that is the
  main factor; game-dev hiring has contracted and a specialist degree often is
  not a route in. Not softened into "things to consider".
- **Uzbekistan stays in the citizenship list.** "Remove it from the site" (#1)
  meant the guide's country and city profiles, not an Uzbek student's ability to
  say where they are from. `lib/data/countries.ts` and `lib/data/geo.ts` were
  deliberately left alone.

---

## 3. Done, with the finding worth keeping

| # | What it turned out to be |
|---|---|
| 1 | Removed 2 countries + 3 cities. Legacy `/guide/<country>` redirects removed too, so those addresses are a real 404. |
| 2 + 4 | **One bug.** See §5.1. |
| 3 + 13 | **One bug.** See §5.2. |
| 5 + 7 | **One bug** — a paired hub label swallowing a city that already had its own page. Now test-enforced. |
| 6 | Filters on countries and cities, in the URL. See §5.4. |
| 10 | The Dutch English claim was wrong in *both* directions. See §5.3. |
| 12 | Step 4 rebuilt from the guide's own parts; exposed a mobile fold bug affecting every guide page. See §5.5. |
| 18 | The "how do people actually learn this" block. |
| 19 | Every opportunity has an address now. See §5.6. |
| 20 | Not a data bug — 156 is the catalog, 104 is what matched *you*. Both true, neither labelled. Fixed with a caption. |
| 21 | Three country blurbs named cities we do not profile (Delft, Rotterdam, Turin, Bologna, Waterloo). |
| 22 (part) | The full-bleed white band on the landing page. See §5.2. |
| 22 (hero) | **One layout bug, not three complaints.** The dead space, the gutter and the too-small card were all the same 193px of accumulated slack. See §5.8 — and note the two further bugs it uncovered in `RotatingHeadline`. |
| 3 + 13 (again) | **Reopened and finished.** The band was only half of it — every filled primary button was still `bg-ink`, i.e. luminance 0.90 on a page of 0.006. New `--cta` token pair. See §5.2. |
| 8 | A question, not a task — and answering it exposed that #5 and #7 had been fixed one way and four other cities left the other way. 34 → 38 hubs. See the #8 entry in §4. |
| 9 | 79 institutions, named and never ranked. See §4. |
| 23 (buttons) | The button system was being bypassed by the page that mattered most, and three call sites had `!important` escapes pointing at why. See §5.9. |
| 24 | **The hero background.** Two bugs, neither of them the one reported. See §5.14. |
| 16 | **The spine.** The parts were all there; nothing was joined. See §5.17. |
| 27 | **Community, and 157 → 172.** A kind of opportunity the catalog had no shape for. See §5.18. |
| 25 | **Readability.** The dark theme was not lower-contrast, it was under-engineered: no type step, a 10px floor, and one theme's optics served by the other's settings. See §5.16. **Reopened and passed again on 2026-08-19**: the same complaint recurred, contrast was again innocent, and the cause was the body size itself (14px) plus a floor guard that had never fired. See §1's release-9 block and §5.22. |
| 22 | **CLOSED.** The planner is advertised now that it works; the bands below the hero ramp with the window. See §5.15. |
| 17 | **The planner, COMPLETE** — one route, `/planner?view=next\|board\|map`, with the guide join and one next move. Delivered over four releases. See §5.12, §5.19, §5.23, §5.24 and [PLANNER_PLAN.md](PLANNER_PLAN.md). |

**Not on the founder's list, added because it was needed:**

| | |
|---|---|
| NAO Cup | First **pinned** entry — a debate tournament in Shymkent, region-scoped to KZ, auto-expiring the day after the event. **Removed 2026-08-15** on the owner's instruction once its date passed; it was the catalog's only `pinned` row and its only `region`-tagged one, so both mechanisms now apply to nothing. See the audit's A1 and A8. |
| Pinning | `Competition.pinned` — the one editorial override in an otherwise derived ordering. Reorders only; never bypasses eligibility. See §5.10. |
| Admin quick-add | Post an opportunity from the top of the Opportunities list, writing the same live row a partner post writes. See §5.10. |
| Georgia's sources | `npm run test:links`' sibling gate was **red and nobody knew**. See §5.11. |

---

## 4. What is left, in detail

**One and a half untouched (#14, half of #11), and #15 is verification.**
Everything else on the founder's list is closed: #22 and #24 on 2026-08-13, #16
and #27 on 2026-08-14, #17 over four releases ending 2026-08-14, #23's animation
half with release 4, and #25 (readability) twice — once on 2026-08-14 and again
in release 9, because the complaint recurred and the second cause was different.

**#11 is now half done, and that was found by reading the file rather than the
note.** The founder named three areas as wrong: games, consulting and investment
banking. Games has since been rewritten — its `catch` states plainly that pay is
below equivalent software work, that studios staff up and lay off around project
cycles, and that crunch is still common, and its `study` stage warns against
courses that teach one engine and little computer science. **Consulting has
not**: `Strategy & consulting` names travel, hours and up-or-out, and says
nothing about school prestige being the dominant hiring factor or about
recruiting being geographically concentrated — which for a student in Central
Asia is the single most decisive fact about that career. There is no investment
banking area at all.

By item count that is ~93% complete; by effort the remainder is larger than it
looks, because every survivor is **content and verification work** rather than
code — the kind that cannot be finished by anyone who does not know the answer.

**The ordered list of what to do next lives in §8, not here**, and it now
interleaves these with the audit's open findings, which are cheaper. This
section is the detail behind each item: the ask, what is already known, the
files, and the decision needed.


### #24 — the hero background — DONE 2026-08-13

**The ask, verbatim:** the landing background at the top is "just dark, empty
somehow"; make it more creative, and animate it properly.

It is a fair report and it names a real hole. The hero paints `bg-surface` and
nothing else. In light mode that is off-white and reads as clean; in dark mode
`--surface` is `11 17 28`, so the top of the page — the header strip, the
badge, the `<h1>`, the whole left 56% — is a **flat near-black rectangle**. The
only light in the section was two blurred blobs, and both sat in the RIGHT
column behind the opportunity card, i.e. nowhere near the part that was
reported.

So this is not "add a nice background". It is: the hero has a lit half and an
unlit half, and the unlit half is the half carrying the promise.

**What it must not become.** Every constraint from #23 still binds, and they are
what make this hard rather than a copy-paste:

- **No framer-motion on this page**, and no new client component. `/` is 107 kB
  of first-load JS and that was hard-won (§5.8, and the landing section of
  CLAUDE.md). A background is decoration; decoration does not get to cost
  hydration.
- **No animated `filter: blur`.** It cannot be composited, and the old rotating
  headline already taught this lesson the expensive way — a 60px `<h1>`
  re-rasterised on a 2.6s loop for as long as the tab was open. Softness has to
  be baked into the *paint* (a radial-gradient falloff) so the only thing that
  ever animates is a transform.
- **Transform and opacity only.** That rules out the two techniques every
  tutorial reaches for first: animating `background-position` across a mesh of
  radial gradients, and animating a `filter` radius. Both run on the main
  thread every frame.
- **Both themes, from tokens.** A field tuned by eye on a dark monitor is
  invisible on the light one, and vice versa. The strengths have to be per-theme
  values, not one alpha that "looks about right".
- **Reduced motion is already guarded, but the guard changes the design.**
  `globals.css` zeroes `animation-duration`, `animation-delay` **and forces
  `animation-iteration-count: 1`** — so an infinite loop does not stop where it
  started, it jumps to its **end state** and stays there. Every looping keyframe
  here therefore has to be **closed** (`0%` and `100%` identical), or a reader
  who asked their system for less motion gets the composition frozen mid-stride.

**What was looked at, and why it was not chosen.** The current vocabulary for
this on the web is four things: an aurora / mesh gradient, a masked dot-or-line
lattice, a cursor spotlight, and a particle field. The **cursor spotlight is the
one that gets recommended most and it is the one that fits this product least** —
it needs a pointer, it needs JS, and most of our students read us on a phone
where it renders as nothing at all. A particle canvas is the same trade one step
worse. That leaves aurora + lattice, which are both pure paint, and the whole
craft is in not doing them the way the tutorials do.

**Files:** `app/globals.css` (tokens + keyframes),
`components/marketing/HeroField.tsx`, `app/(marketing)/page.tsx`.

**Shipped.** `HeroField` — a server component, four layers, zero JavaScript.
The beam and its sweep along the top edge, a masked lattice drifting exactly one
cell, three radial-gradient blobs on unrelated periods weighted LEFT, and three
points travelling the lattice. `/` is still **107 kB**, and the section now has
*fewer* paints than before: the two `blur-3xl` blobs it replaced were the only
`filter` on the page.

Two bugs surfaced only by measuring, both written up in §5.14: the hero's promise
paragraph was at 4.53:1 before any of this existed, and the blobs were anchored
in percentages of a section that is 900px on a desktop and 1635px on a phone.

### #27 — the catalog widens, and gains a kind — DONE 2026-08-14

**The ask:** more opportunities — at least 170 — and a **community** subsection.

Both shipped: **172 entries, 15 of them `community`**, and every link in the
catalog answers (see §5.18, including the three entries that did not survive
verification and were replaced rather than softened).

**Community is a kind, not a tag**, and the reason is the product's own shape.
The catalog is built around "what can I enter, and when does it close" — a
question with a deadline in it. A forum, a club network, a citizen-science
platform and an open-source month have no deadline and nothing to win; you join,
and you keep going. Filing them under `competition` answered neither question.

It is also the honest answer for the student this product is actually for: the
one who is twelve, or has no money, or lives where none of the programmes reach.
Joining costs nothing and starts today.

**The next expansion, when it comes, should widen the same way** — by asking
what question the catalog cannot currently answer, not by adding more rows to
the questions it already answers well. Two candidates already visible:

- **Local (KZ / Central Asia) rows.** The catalog is overwhelmingly
  international, and `region` exists precisely so a Shymkent row can be shown
  only to students who can reach it. NAO Cup was the only one, and it was
  removed on 2026-08-15 — the count is now zero. See A8.
- **Job simulations and "try the work" rows.** Named directly by the founder
  (Forage's JP Morgan simulation is the example). They belong to the spine's
  "test it this month" step and would give the guide's career layer something
  actionable, not just readable.

### #26 — the planner, rebuilt as ONE connected thing — NEXT, and the biggest

**This is the founder's own diagnosis, 2026-08-14, and it is about the product's
whole premise rather than about a screen.** Recorded close to verbatim, because
paraphrasing it would lose the part that matters:

> A school student arrives knowing nothing — not about themselves, not about
> their future. They look for opportunities, collect them, read the guide, and
> then go to the plan — and **the plan has to be built ON the guide**. That is
> the important part. Students come to us because we say: *we were just as
> confused, so we built a system to help you work it out.* But the system as
> built confuses them further.
>
> I am not blaming anyone — I do not know exactly how it should look either,
> because there is no alternative to copy and I am confused myself. But arriving
> at the site I get **more** confused, and I can see this is not the thing that
> helps me understand myself and build a plan: where do I start, what do I want
> to study, where, how do I get in, what to do, when to do it.
>
> And not "just" those questions either. *What do I want to study* is a very
> deep question — you cannot simply ask it and offer options. People come to us
> **because they cannot answer it.** We have to help them. How? Honestly, I am
> still working that out, and that is exactly why I asked for everything to be
> connected into one structure. It is why I created the guide section at all,
> and why I asked for majors and fields of study.
>
> We are not for the student who already knows and just wants to draw it out —
> that student does not need us. We are for the one who understands nothing. So:
> **minimum friction.** Think of us as a consultant, or a companion through
> admissions.

**The concrete faults named:**

1. **The agenda dumps every month down the page as one list.** It should be an
   **interactive window inside the page** — step between periods with arrows,
   nothing else.
2. **The three views are three sub-tabs, and they should be one window.** The
   calendar, the board and the map are meant to be the same thing seen three
   ways, and today they are three destinations.
3. **The mind map's controls are badly implemented and hard to understand.**
4. **Nothing connects the plan to the guide.** This is the load-bearing one.
   #16 joined the guide's four steps to each other; the plan is still an
   island beside them.

**What must NOT be lost while fixing it** — every one of these was a decision
with a reason, and several were bugs first:

- moving a card is a **button, never a drag** (keyboard, and most of our
  students are on a phone);
- `dueISO` is null unless the date is confirmed — the type is what enforces
  "no countdown we cannot stand behind";
- **nothing is duplicated**: an opportunity's state lives in
  `opportunity_intents`, a student's own task in `planner_items`;
- the map stores **structure, never coordinates**;
- no client component in the planner calls `new Date()`.

**The design pass is DONE — decided 2026-08-14 from published evidence**, at
the founder’s instruction, and written up as **Release 3 in
[PLANNER_PLAN.md](PLANNER_PLAN.md)** with every source listed.

The finding that changed the shape: career indecision is **four profiles, not
one state** (Lower 39% / Moderate 31% / High 23% / Very High 7%), and **brief
interventions barely move 11–16-year-olds while sustained ones do**. So the
answer to "what do I want to study" cannot be a screen at all — no quiz, no
onboarding flow. The thing this product already has that IS sustained is the
plan, so **the planner is the intervention**: not where a finished answer is
recorded, but where it is assembled over months out of what the student does.

Four decisions follow, each with its evidence in PLANNER_PLAN.md — and the
**owner settled three of them on 2026-08-14**, overriding the narrower versions
the research had proposed:

1. **A CHOICE, not an empty plan and not one prescribed next move.** A single
   recommendation is a judgement about a student we have not met; three or four
   real starting points cost the same one tap and the pick itself is the first
   revealed preference we get. Constraint from the evidence: every option must
   be a thing that HAPPENS, not a category — "pick a field" is a form with
   different paint.
2. **The map is the STRUCTURE OF A DECISION**, not a free canvas. Branches are
   the real things — a country, a direction, a step — and the plan assembles out
   of them. A blank canvas is the right tool for someone who already knows what
   they are weighing; ours does not, and it asks them to invent the axes of
   their own decision before they have any.
3. **We LINK OUT and never build.** Compass does not make its own simulations,
   courses or assessments. Worth stating out loud, because "we could build a
   small version ourselves" arrives every time a good external tool has an
   awkward sign-up.
4. The three views become one window over one state. A RIASEC-style interest inventory is **explicitly
rejected** — valid structure, but confounded with prestige and gender and
culturally caveated, which for our readers would launder the exact pressures we
exist to counteract.

### #22 — the landing page — DONE 2026-08-13

The confirmed finding: the rotating-headline bug and the "too much gutter, the
gap between the columns is too big" complaint were **the same problem**. Three
wastes stacked at 1440×900, and all three are gone. See §5.8 for the full
measurement and the two component bugs it exposed.

| | before | after |
|---|---|---|
| left column | 560px | 677px |
| gap, headline → card | **193px** (80 gap + 113 empty track) | 56px |
| dead space under the rotating line | 63px | **0** |
| `<h1>` | 4 lines | 2 lines |
| the card | 512px | 532px, and every row is a link |
| first-load JS for `/` | 107 kB | **107 kB** |

The two reverted fixes named in the old version of this file were right to be
reverted, and the reason is worth keeping: **neither was a layout change.** The
column was narrower than the copy, so nothing done inside the component could
help. Fixed by making the type and the column agree — see §5.8.

**Both remaining halves closed on 2026-08-13:**

- **The planner is on the page.** It was held back because advertising a feature
  that is not built is what this product's own rules forbid — and until
  `0028`/`0029` were applied, two of the three views returned an error naming a
  migration. `npm run db:check` reports 31/31, so the third door is now stated
  in the page's own order: Opportunities → the guide → **the planner** → the
  report. The three cards are read from `PLANNER_SECTIONS`, not written out.
- **The gutters below the hero.** Measured, fixed, and pinned. See §5.15 — the
  finding is that the complaint was right and the number was worse than anyone
  had said: 768px of gutter at 1920, on a page whose hero runs to 1600.

### #23 — animations, interactions, and the button system

**The button system and the interaction states are DONE (2026-08-11); the
animation half is not.** See §5.9 for what the system turned out to be doing
wrong. In short: `Button.tsx` concatenated its classes, so call-site overrides
lost to Tailwind's emission order rather than winning; its focus ring was
`ring-offset-white`, i.e. a white halo on a near-black page; and the landing and
`FinalCTA` had each rebuilt "primary" by hand rather than using it. Focus
coverage went from **11 styled-but-unfocusable interactive elements to 0**.

**What is left of #23 is the animation half**, and it is deliberately unstarted
rather than half-done: the existing vocabulary (`rise-in`, `section-in`,
`.roll-word`, the guide's view-transition morph) is consistent and cheap, so the
open question is not "make things move" but *which single moment on which surface
has earned an authored one*. Answer that before writing any keyframes — a
staggered reveal per section is the anti-pattern this page already removed once.

Known constraints, all still binding:

- **The landing page ships no framer-motion, and must not start.** FAQ is native
  `<details>`; `HowItWorks` and `FinalCTA` are plain server components. First-load
  JS for `/` is 107 kB and that was hard-won.
- **No animated `filter: blur`.** It cannot be composited; the old rotating
  headline blurred on a 2.6s loop forever, re-rasterising a 60px `<h1>` for as
  long as the tab was open. Transform and opacity only.
- **Reduced motion needs two guards.** The CSS guard in `globals.css` zeroes
  animation and transition durations; it does **not** reach framer-motion, which
  drives inline transforms from JS. The five components that render `motion.*`
  are the whole surface: `DirectionSummary`, `PromptSwap`, `MotionCard`,
  `Onboarding`, and the landing `MapView`. Mount `MotionSafe` inside a component
  that already imports framer, never in a shell.
- A view transition freezes the document. Anything added here must respect the
  400ms cap in `ViewTransitions.tsx` — see §5.1.
- For buttons: `components/ui/Button.tsx` holds the variants. Its `primary` is
  `bg-ink text-surface`, which is correct at control size and wrong at surface
  size — §5.2 is the rule.
- **The reduced-motion guard DOES cover CSS transitions**, not just animations —
  it zeroes `transition-duration` and `transition-delay` too. So a
  `transition`-based hover or press state needs no extra guard. Only
  framer-motion escapes it.

### #8 — why some cities were merged — ANSWERED, and then fixed 2026-08-11

The founder asked whether the paired hubs were merged "because they are similar".
They were not: a hub in `world.ts` models a **labour market**, not a municipality
— Toronto–Waterloo is one recruiting corridor, Zurich–Lausanne the ETH/EPFL pair,
Dubai–Abu Dhabi one country's two centres, Osaka–Kyoto the Kansai region.

But the question exposed an inconsistency worth more than the answer. **Items #5
and #7 were this exact pattern** — Amsterdam and Shanghai reading as duplicates —
**and both were fixed by splitting.** Four paired hubs were left behind, so one
problem had two different answers depending on which city you happened to open.
It had already begun to bite: the #9 layer filed the University of Waterloo under
`hub: "toronto"`, so a page titled "Toronto & Waterloo" was the only place
Waterloo existed at all.

Split, 34 → **38 hubs**: `waterloo`, `abu-dhabi`, `lausanne` and `kyoto` are their
own pages, each with the full profile every hub owes — catch, route, `dayHere`,
money, language, and who should look elsewhere. `San Francisco Bay Area` stays
paired on purpose: that is the accepted name of a region, not two cities glued
together.

Three things this turned up:

- **A hub id is a public URL.** Three splits kept their id and gained a sibling,
  but `osaka-kyoto` became `osaka`, and that address was already in the sitemap.
  It is a 308 now via `RENAMED_HUB_IDS` in
  [legacy-guide-urls.ts](../lib/data/legacy-guide-urls.ts), duplicated into
  `next.config.mjs` for the same reason the country list is, and held honest by
  the same unit test — which now also asserts a rename points at a hub that
  **exists** and that the old id is **no longer live**.
- **The redirect test had to learn the difference between two kinds.** It
  asserted that every `/guide/*` redirect was exactly a country short URL, so a
  city redirect would have broken it. It now partitions them by segment count and
  asserts each kind separately, plus that nothing else is hiding in the list.
- **Splitting Dubai from Abu Dhabi emptied Dubai.** Both research universities
  are in the capital, so the city with the biggest name on the map had nobody
  named. Its three branch campuses are listed now, described as what they are.

### #9 — top universities per country and city — DONE 2026-08-11

Shipped as [lib/data/place-universities.ts](../lib/data/place-universities.ts):
**79 institutions across all 17 destinations, covering all 38 hubs**, rendered as a
"Who is named here" part on both `/guide/places/[place]` and
`/guide/cities/[hub]`. The trap held — the rule bans **positions, not names** —
so the entry shape is `{ name, city, hub, knownFor[], englishTaught }` and the
section says in its own first sentence that it is not a ranking and not in order
of merit.

Seven tests were added (117 → 124) and they were proved to fail by seeding a
violation: ≥3 per destination, no key that isn't a destination, `hub` is a real
hub **of that destination** or explicitly `null`, `knownFor` is non-empty and
uses the faculty taxonomy, no duplicate inside a destination, no ranking/price/
**superlative** anywhere, and — the one that matters most — a hub's list is
*derived* from the same registry the country page reads, so a city page and its
country page cannot disagree.

Three decisions worth keeping:

- **`hub: null` is a real value and the UI must respect it.** Oxford, Cambridge,
  Aachen, Delft, Bologna, Sharjah, Al Ain and St. Gallen sit in cities we do not
  profile. They render as plain text, never as a link — naming a city as though
  it were a page and dead-ending there is backlog #21, and it would have come
  straight back here.
- **Superlatives are banned alongside the numbers.** "The leading university for
  X" is a ranking with the number filed off, so the test rejects `best`,
  `leading`, `elite`, `world-class` and `prestigious` as well as `top \d+`.
- **`englishTaught` is the only field here that rots**, for exactly the reason
  §5.3 documents. It is a coarse three-way shape, never a claim about a named
  programme, and both pages carry "check it on their own page for your own entry
  year". Everything else — a name, a city, what a place is studied for — is
  structural.

The data module is imported only by two server-rendered pages, so the bundle
rule holds: `/guide/places/[place]` and `/guide/cities/[hub]` are **unchanged at
2.38 kB / 99 kB**. Keep it that way — it must never be imported by a client
component.

**Not done, and deliberately:** the section does not yet reorder to put a
student's stated fields first. The values-refine rule (reorder, never filter)
is the model to follow when it does.

### #14 — Malaysia and Australia

Two full `StudyDestination` entries plus their cities. Every field is mandatory
and test-enforced: trade-offs must outnumber strengths, `notForYou` is required,
no prices or rankings, and `sources` must be **official bodies only** (a test
rejects rankings sites, Wikipedia and blogs, and requires https).
`npm run test:guide-links` then checks they answer; a 403/429/412 is a bot wall
and passes, a **timeout does not ship**.

Each new city must be added to some country's `hubs` — a test asserts every hub
is claimed by exactly one destination.

**It costs more than it did when this was written, in three ways:**

1. **At least three named institutions per country**, or the #9 test rejects the
   destination. `{ name, city, hub, knownFor[], englishTaught }`, `hub` a real hub
   of that country or explicitly `null`, no rankings and no superlatives.
2. **One hub is one city now** (§ the #8 entry). Do not add `Sydney & Melbourne`
   or `Kuala Lumpur & Penang` — that is the pattern we just spent a release
   undoing.
3. **Verify the sources yourself before committing.** `test:guide-links` is not
   in CI, and two of Georgia's sources were dead for an unknown length of time.
   A reset connection is not a timeout and not a bot wall; see §5.11.

Both are English-teaching destinations with post-study work routes that **drift**
— Australia's in particular has changed repeatedly — so write them as "current
rule, check it" the way every other profile does, and put them in the annual
re-verify pass.

### The cost / language filter (deferred from #6, pairs with #9)

The two most useful filters on `/guide/places` are money and language of study,
and neither exists as structured data. **Do not band 17 countries from memory** —
that is what the product's own rules forbid, and it conflates two different
things (Switzerland has nominal tuition and brutal living costs).

The honest version is a **structural** field describing how tuition *works*, not
what it costs: "no fee at public universities" (Germany), "scales with family
income" (Italy), "the same modest fee for everyone" (Japan, Türkiye, Poland),
"internationals pay a multiple of the local rate" (US, UK, Canada, NL). That is
durable. Then add it to `GuideRow` and the panel — the module already supports
adding a group; see `guideFacets`.

### #11 — careers depth and the interest quiz

Two halves.

**The quiz** ([lib/data/interest-quiz.ts](../lib/data/interest-quiz.ts)) gives
too many people the same result — the founder's read is that the questions do
not discriminate. It is fixed per-option weights and pure scoring, so it is
cheap to re-tune, and `scripts/test-engine.ts` already covers it.

**The content** ([lib/data/careers.ts](../lib/data/careers.ts), ~1,100 lines).
Direct tone was chosen. Specifically named as wrong today: game-dev is presented
without saying hiring has contracted and that a specialist degree is often not a
route in; consulting and investment banking do not say that school prestige is
the dominant factor and that recruiting is concentrated in particular countries.

Rules that still bind: every area states a `catch` and a `suitsYou`/`notForYou`
pair; an area names **areas of work with the real job titles inside them**, never
one prescribed profession, and a test enforces ≥3 roles per area. Career titles
used by the client-side quiz live in
[career-titles.ts](../lib/data/career-titles.ts) and are pinned to the registry
by a test — `careers.ts` must never be imported into a client component.

### #15 — verify the unconfirmed dates

`npm run test:links` proves a URL answers; it **cannot** tell you a contest was
discontinued or that a date moved. Every entry with `dateConfirmed: false` needs
a human read of the organiser's own page. Setting `dateConfirmed: true` is what
turns on a countdown, and the rule is that we never show one for a date we
cannot stand behind.

### #16 — the coherent spine — DONE 2026-08-14

Connect areas of work → majors → countries → cities → universities and their
majors, and explain the from-home step better.

**Shipped, and it needed no new content.** See §5.17 — every layer already
carried the same key, so the spine is a function
([lib/data/spine.ts](../lib/data/spine.ts)) rather than a table, rendered from
both directions by one component
([components/guide/Spine.tsx](../components/guide/Spine.tsx)). It did not have
to wait for #14: two more countries widen the chain, they are not what makes it
exist.

### #17 — the planner — DONE 2026-08-12, both releases

Design and rules: [PLANNER_PLAN.md](PLANNER_PLAN.md) (§1–§10 the agenda and the
board, §11 the maps). Findings: §5.12 and §5.13 below.

**Delivered in two releases, and the seam is worth keeping.** The agenda and the
board are two views of ONE list — the same rows, sorted by date or grouped by
status. A mind map re-uses none of it: a different data shape, a different
renderer, and the hardest part to operate from a keyboard. Cutting there shipped
a whole first release instead of half of three, and the second release then
landed without touching a line of the first.

**Still open and deliberately not part of #17:** drag-and-drop, as an
enhancement over the existing `movePlannerItem` action. The buttons stay either
way — they are the accessible path, not the fallback.

---

## 5. Findings worth not re-discovering

### 5.1 An unresolved view-transition promise freezes the document

`document.startViewTransition(cb)` paints a static snapshot and **stops
responding to scroll** until `cb`'s promise settles. Two bugs, reported
separately, were this one thing:

- `onPopState` started a transition whose promise resolved only when the
  **pathname** changed. A hash click ("On this page") changes only the fragment,
  so the promise never settled and the page froze until the browser's internal
  timeout. The wheel did nothing, then every queued scroll applied at once.
- The guide is `force-dynamic`, so `router.push` waits on a server round trip —
  and the document waited with it. **Measured 2130ms with an idle main thread.**

Fixed in [ViewTransitions.tsx](../components/ui/ViewTransitions.tsx): skip when
the pathname is not changing, and cap every freeze at `MAX_FREEZE_MS = 400`.
Measured after: hash clicks start **zero** transitions, a warm route is 179ms, a
cold-compiled route caps at **411ms**. Reduced motion now skips the transition
entirely — the CSS guard zeroes the *duration*, but a zero-duration transition
still freezes.

**The general rule:** any `startViewTransition` whose promise is gated on a
condition must also have a timeout, or the condition failing means a frozen page.

### 5.2 `bg-ink text-surface` — control, never surface

`ink` is near-white in dark mode. At button size, white-on-dark reads as a
deliberate primary control. At **card** size, and at the full width of the
landing page's "The problem" band, it reads as broken — a screen-wide white slab
on a dark page.

- Anything that fills an **area** uses `bg-accent text-on-fill` (6.97:1 dark,
  4.55:1 light — both verified).
- Where the design wants a genuinely **inverted band**, use the `--band` /
  `--band-ink` tokens. They stay dark in *both* themes, because inversion is a
  relationship and does not survive being flipped.
- `--band` is defined in **all three** blocks of `globals.css` — `:root`, the
  `prefers-color-scheme` media query, and `:root[data-theme="dark"]` — plus
  `tailwind.config.ts`. A new token needs all four.
- The test asserts the **absolute** property (band luminance < 0.1 in both
  themes), not a relative one. Contrast was never the problem; direction was. A
  relative test ("darker than surface") fails, because in dark mode the page is
  already near-black and the band lifts slightly *above* it.

Also found: `text-white` on a themed fill. Use `text-on-fill`. The selected
category tab was `bg-accent` with a `text-white/70` count — about 1.9:1 in dark
mode, i.e. the count on the tab you were standing on was the unreadable one.

**Reopened and finished 2026-08-11 — the band was only half of it.** #3 ("the
huge left button in dark mode breaks the balance") and #13 ("the button at the
bottom is completely white") are the SAME rule one layer down, and they were
still live: every `variant="primary"` button was `bg-ink text-surface`, so in
dark mode the hero CTA measured **luminance 0.90 at 244×56** — a white slab on a
page of luminance 0.006.

Fixed with a `--cta` / `--cta-ink` pair, the same move `--band` made and for the
same reason, but with the opposite constraint: a band may stay dark in both
themes, a **button may not**, because it has to lift clear of the page. So `cta`
is the old deep navy in light mode — verified byte-identical, `rgb(16 25 43)` —
and the accent in dark, measured at luminance **0.34**. All four places a token
needs (`:root`, the media query, `:root[data-theme="dark"]`, `tailwind.config.ts`).

The test now asserts a **luminance CEILING (< 0.55) in both themes**, not just
contrast — because contrast passed for the entire time this was broken, exactly
as it did for the band. Proved by temporarily restoring the old value: it fails
with `dark: --cta has luminance 0.902 — that is a near-white slab, not a button`.

**Measuring note:** flipping the pane's colour scheme at runtime updates
`--cta` but does NOT repaint the `var()`-derived `background-color`. The first
light-mode reading said the button was still blue, which looked like the fix
being broken and was the trap CLAUDE.md already documents. Re-load the page under
the setting; do not toggle.

### 5.3 The Netherlands, and how to check this class of claim

The profile said you could "deal with officials in English from day one". False:
the tax office, the municipality, your health insurer and the water board write
only in Dutch, and permanent residence requires passing a real language exam
(*inburgering*). It **also** carried an out-of-date warning that English-taught
programmes were being cut — the government dropped its language test for
existing programmes in July 2026, while the universities themselves are capping
intake to English tracks (eleven bachelor's programmes for 2026/27).

The lesson: a claim can be stale in *both* directions at once, and live policy
must be checked rather than recalled. The IND page is now a source on that
profile.

### 5.4 The guide's filters

[lib/data/guide-filter.ts](../lib/data/guide-filter.ts) is pure and
**type-imports only** — it is reached from a client component and `world.ts` +
`study-destinations.ts` are ~180kB between them. Rows and counts are built on the
server and passed as props, the same rule `WorkList` follows.

Three rules, matching the opportunities panel so a student does not learn two
behaviours: groups ANDed, options within a group ORed; **each group's counts are
computed with that group's own selection lifted** (otherwise standing on Europe
makes every other region read 0, which tells you nothing about switching); a
zero-count option stays visible and clickable.

Search reaches the page's **content**, not its card front — that is a deliberate
difference from the opportunities search, because the complaint being answered is
"I had to open all seventeen to find out".

### 5.5 `PageContents` and the mobile fold

The contents map wrapped one long chip per row: **344px on an 812px screen**,
42% of the viewport, which pushed the first section past the fold. It scrolls in
one row below `sm` now — **98px** — and because the component is shared, every
country and city page got that back too. Chips keep their 44px tap target.

When adding anything above the first section of a guide page, measure the fold.
The intro paragraph on step 4 was hoisted for a good editorial reason and had to
be cut back to one line for this.

### 5.6 Sharing

Every opportunity has a page at `/opportunities/[id]`, server-rendered, with
Open Graph tags so a pasted link unfurls into the four facts. **Share our URL,
never the organiser's** — their page does not say who can enter, what it costs,
or when it closes.

The link travels **alone**: `navigator.share` is given a `url` and nothing else.
No title, no blurb. A share sheet that pastes marketing copy into someone's chat
on their behalf is why people stop using share buttons.

The clipboard can be refused — an embedded webview, an unfocused document — and
plenty of our students open links inside a messaging app. `Copy failed` alone is
a dead end, so the URL appears in a selectable field instead.

Unknown id is a real 404. All 156 curated entries are in the sitemap; partner
posts are not, because reading them would turn a static sitemap into a
per-request Supabase query.

### 5.7 Measuring in the preview pane

`window.innerWidth` can be **0** when the pane is collapsed, and every width
measurement is then meaningless — a sizer read 119px and "4.2 lines" under those
conditions. **Check `window.innerWidth` before trusting any layout number**, and
set the viewport explicitly (`resize_window` with `width`/`height`) rather than
relying on a preset.

Screenshots and real clicks do not work while the pane is not compositing.
`navigator.clipboard.writeText` fails there with `NotAllowedError: Document is
not focused` and `userActivation.hasBeenActive: false` — that is a harness
artifact, not a bug, and the way to tell is to read the error rather than assume
either way.

**A hidden pane also throttles rAF, so animations never settle and
`await animation.finished` hangs until the tool times out.** To measure a resting
state, finish them synchronously first —
`el.getAnimations().forEach(a => a.finish())` — then read. This matters more than
it sounds: a measurement taken mid-`roll-in` reported a correctly centred phrase
as top-aligned, and the 15px discrepancy was exactly the keyframe's `0.34em`
offset. When a computed style says a rule applied but the geometry disagrees,
suspect the transform before suspecting the browser.

Everything numeric in §5.8 was measured this way — one probe function stored on
`window` and re-invoked after each `resize_window`, which beats screenshots for
anything expressible as a number and worked while screenshots did not.

### 5.8 The hero, and two bugs hiding behind the one that was reported

**The reported bug was a symptom of a disagreement between the type and the
column.** `"Then make your move."` renders 616px wide at 60px; the column was
560px. So the invisible sizer wrapped to two lines and reserved 125px while the
shorter phrases rendered one 62px line. Widening the column to 677px (fractional
tracks, 56/44, gap 56) put every phrase on one line and took the `<h1>` from four
lines to two.

The size is now a **clamp**, not three breakpoint steps, because it has to agree
with the column at every width and a breakpoint agrees at three:
`clamp(2.8125rem, 3.606vw + 0.5052rem, 3.75rem)` — 45px at 1024, the original
60px from 1440 up. **The rule to preserve: the longest rotating phrase measures
~9.05× the font-size, so the type must stay under `columnWidth / 9.05`.**

Two further bugs only measurement could find:

1. **The sizer picked the longest phrase by `String.length`.** Character count is
   not width — the three phrases are 19 characters each and render 382 / 398 /
   398px. Once the copy was equalised, the sizer began reserving the *narrowest*,
   and the other two would have overflowed into the paragraph below. It now
   stacks **every** phrase in one CSS grid cell, so the row is as tall as the
   tallest as rendered, at every width, with no heuristic. Do not reintroduce a
   "pick the longest" step.
2. **A slot sized to the longest of N contents leaves a hole for the others.**
   Two near-identical English sentences still differ by ~16px — `"win"` against
   `"own"` is enough — so no copy can remove this, only shrink the band of widths
   where it happens. The phrases are centred in the slot now (`inset-0 grid
   content-center`), so the difference reads as leading instead of a hole. The
   keyframes translate by `em`, so a full-height box does not change the glide.

Copy: `"Then make your move."` (10.27×) was replaced by `"Then go and own it."`
(9.04×) — the founder's call, taken 2026-08-11. That alone cut the band of
viewport widths that can show a hole from 70px to 16px. **Measure a replacement
phrase, do not count its characters.**

Also done here: every preview row is now a real link to `/opportunities/[id]`
(the card is the front door, so it opens), the rows stagger in on the page's own
`rise-in`, the "live" pill has an opacity-only pulse, and the sample-report line
— previously `text-ink-faint`, the faintest thing in the hero — is its own
bordered strip. Deliberately **not** a third button: one primary CTA per view.
All of it server-rendered; `/` is still 107 kB.

Verified at 1440, 1280, 1024, 430 and 375: dead space 0 at every one, no sizer
overflow, no horizontal overflow, and the hero still fits `100svh` from 1024 up.

### 5.9 The button system was being bypassed, and it deserved to be

Three findings, and the first is the one that explains the other two.

1. **`Button.tsx` composed its classes with a template string.** Tailwind
   utilities of the same type share specificity, so when a caller passed `px-7`
   and the size supplied `px-8`, *both* shipped and the winner was whichever
   Tailwind emitted later — by scale value, not by intent. The landing hero's
   primary CTA had been asking for `px-7 py-4` and rendering `px-8 h-14` since it
   was written, with a green build and a passing linter. Three call sites had
   already been patched around with `!important`. **Those escapes were the
   symptom, not a style choice** — grep for them when auditing any variant
   component. Fixed by using `cn` (clsx + tailwind-merge), which the repo already
   depended on and which only two files had ever used.
2. **The focus ring was `ring-ink` over `ring-offset-white`.** `ink` is near-white
   in dark mode, so a focused button drew a white ring inside a white halo on a
   near-black page. A themed `.focus-ring` utility (`ring-accent` over
   `ring-offset-surface`) already existed in `globals.css` and was used in ~25
   places; `Button` was running a second, broken focus system. **A hardcoded
   light offset colour is invisible in a light-mode screenshot** — this class of
   bug has to be found by reading the token, not by looking.
3. **The landing page and `FinalCTA` had each rebuilt "primary" by hand** out of
   `rounded-full bg-ink px-8 py-4 …`, which is why neither had a focus ring or a
   press state, and why a change to the real `primary` would have reached
   neither. `rounded-full` appeared at seven call sites; it is a `shape="pill"`
   prop now. `hover:shadow-lift` existed only on the hero's hand-rolled button —
   the most-pressed control in the product was the only one acknowledging a
   pointer with elevation — and now belongs to the variant.

Also: `transition-all` became a named property list. `all` transitions height and
width too, which is how a control ends up animating its own layout when something
above it reflows.

**The cost, stated plainly:** `cn` pulls `tailwind-merge` into every *client*
bundle that imports `Button` — measured at **+9 kB on `/onboarding` (157 → 166
kB)**. Server-rendered call sites pay nothing, so **`/` is unchanged at 107 kB**
and the public funnel is untouched. The trade was taken because the bug it removes
is silent, recurring, and had already cost four dead classes and three
`!important` escapes.

**Verification note:** a programmatic `el.focus()` does **not** match
`:focus-visible` on a button or link, so measuring after `.focus()` shows no ring
and looks exactly like a broken fix. Read the rule out of `document.styleSheets`
and resolve `--tw-ring-color` / `--tw-ring-offset-color` on a probe element
instead.

**Trap, paid for once:** building with a throwaway `distDir` (to avoid clobbering
another session's dev server) makes Next inject `<thatDir>/types/**/*.ts` into
`tsconfig.json`'s `include` *and* reformat the whole file. Revert `tsconfig.json`
afterwards.

**A fifth bug, found by fixing the fourth.** `npm run lint` had been reporting one
`<img>` warning in `PartnerBadge.tsx` for a waiver that was already written and
already justified. The waiver did not work: `eslint-disable-next-line` disables
exactly the **next line**, and the reason had been written as a `--` tail spilling
onto two further comment lines — so the directive suppressed a comment and the
`<img>` three lines down warned on every build. Prose above, directive adjacent.
`npm run lint` is now `✔ No ESLint warnings or errors`.

**None of these five can fail a type-check, and three cannot fail a lint** — the
code is valid, it just does not do what it says. So they are asserted from source
instead, as four tests in `scripts/test-engine.ts` (113 → 117):

| test | catches |
|---|---|
| no `!important` Tailwind escapes | a component concatenating instead of merging |
| focus rings theme | a hardcoded `ring-offset-white`/`-black` |
| every self-styled interactive element has a focus treatment | the eleven |
| `eslint-disable-next-line` is adjacent to its code | a waiver that suppresses a comment |

Each was verified to actually fire by seeding one violation of each into a
throwaway component and watching all four fail — a source-scanning test that
cannot fail is worth nothing.

### 5.10 Pinning, and the admin route from knowing to publishing

Two halves of one need: something happens on Friday, we heard about it today, and
the only routes to a student's screen were the curated catalog (needs a deploy)
and discovery (finds things far too late).

**`Competition.pinned` is the single editorial override in the matching engine.**
Everything else about the order is derived from the student's own profile — fit,
then whether the date is confirmed, then how soon it closes. This sorts above all
of it. Three rules, test-enforced:

- **It reorders; it never bypasses eligibility.** A pinned row a student cannot
  enter is filtered out exactly like any other. "Pinned" is about order and
  eligibility is about truth, and a card saying "you can enter this" to someone
  who cannot is the one failure this product does not get to make.
- **One at a time.** A list where several rows outrank the student's own fit is a
  list with no order, and the override stops meaning anything.
- **The tests are written against whatever is pinned today, not a named entry.**
  A pinned row is short-lived by nature; a test naming one starts failing the day
  it expires.

**The admin quick-add writes the same `competition_deadlines` row a partner post
writes**, with `partner_id` left null — so it flows through `resolveCompetitions()`
and renders through the same card. No second catalog, no second renderer, nothing
new for the rest of the code to learn. Validation lives in the server action, not
only in the form: a server action is a public HTTP endpoint and the form is a
convenience. Past dates are rejected outright, because an expired confirmed row
publishes and is then invisible, which reads as a bug.

**The bundle trap, walked into and measured.** The control is rendered behind
`{isAdmin && …}`, and that decides what RENDERS, not what SHIPS — imported
statically it cost every student the admin form's bundle for a control they can
never see. `next/dynamic` fixed it: `/dashboard/opportunities` went 187 → **186
kB**, a kilobyte below where it started. Same trap as importing the catalog or
`careers.ts` into a client component, in a new place.

**NAO Cup was the first pinned entry** (removed 2026-08-15; nothing is pinned
today) and shows the shape: region-scoped to `KZ`
with `city: "Shymkent"` so it reaches students who can physically turn up and
never lands on a student in Rome, `dateConfirmed: true` on the organiser's own
announcement (the same trust a partner-set date gets), and no `cost` — the
announcement lists a certificate, food and prizes and says nothing about an entry
fee, and this product does not file something under "free" on the strength of it
not being mentioned. Verified: first for a KZ student on the 12th, absent for an
IT student, gone on the 15th.

**Where the founder overruled us, and it is recorded rather than argued.** The
registration link is a Google Forms URL containing `/u/6/` — a browser-account
index — and `/edit`. Fetched without that session it answers **401**; the founder
confirmed twice that it works for them and asked for it as supplied, so it ships
as supplied. If students report they cannot register, that is the first thing to
look at, and it is a form-sharing setting rather than a code change.

### 5.11 Two of Georgia's official sources reset the connection

`npm run test:guide-links` was **failing** (exit 1, 26/28) and had been for a
while — nobody had run it, because CI does not. Both of Georgia's sources were
dead: `mes.gov.ge` (the ministry) and `eqe.ge` (the quality-enhancement centre).

The diagnosis matters more than the fix, because the obvious readings are both
wrong. DNS resolves for both. TCP 443 is **open** for both. The failure is a
**connection reset during the TLS handshake**, reproduced on two different TLS
stacks (Windows schannel and Node's OpenSSL). And other Georgian government
hosts — `mfa.gov.ge`, `naec.ge`, `tsu.ge` — answer fine from the same machine,
so it is those two hosts specifically, not the country being unreachable.

That is neither of the cases the rule already covers. A **403/429/412 is a bot
wall and passes**, because the server answered and the page is therefore there.
A **timeout fails**, because it proves nothing. A reset is a third thing: the
host is alive and refusing us, and we cannot tell whether a student in Tbilisi
would get through — quite possibly they would.

Resolved by replacing them with **NAEC**, the body that actually runs the unified
national entrance examinations, which is a better source than a ministry front
page for the question a student is asking. The reason is recorded in
`study-destinations.ts` so nobody restores the old two and turns the gate red
again. One source is enough — the test requires `>= 1`.

**Worth acting on:** this gate is not in CI (it needs the network and would make
CI flaky), so it only fails when someone runs it. Run it before any release that
touches the guide, not just when editing `sources`.

### 5.12 The planner, and the three things it turned out to be

**A rule is worth more in a type than in a component.** The product's oldest
promise is "never show a countdown for a date we can't stand behind", and it had
been enforced by every view remembering to check `dateConfirmed`. The planner
adds two more views, so instead `PlannerItem.dueISO` is **null unless the date is
confirmed** — there is simply no date for a view to draw. The test that pins it
was proved by seeding the obvious mistake (`dueISO: c.deadline`) and watching it
fail with `an unconfirmed deadline leaked into dueISO`.

**Adding a state means auditing everything that reads it.** `opportunity_intents`
gained `doing`, and the immediate consequence was silent: `/admin/intents`
bucketed it into "planning" via an `else`, and its per-opportunity `total` — the
sort key for "what students actually commit to" — omitted it entirely. Neither
could fail a type-check. **When you widen a union that lives in a database
column, grep for every `else` that used to be exhaustive.**

**A layout cannot own a redirect that depends on the path.** `/planner/board`
sent an unauthenticated visitor to `?next=/planner`, because the layout's
`requireSession` runs before the page's and a layout never receives the pathname
— so signing in landed them on the agenda rather than the board they had clicked.
Found by reading the `Location` header, not by looking at the screen. The layout
asks with `getSession` and renders nothing when there is none; each page requires
its own path.

Also confirmed, and worth repeating because it is the trap this codebase keeps
re-finding: the bundle rule held only because `lib/data/planner.ts` takes a
**structural subset** of `Competition` rather than importing the catalog's type
module at runtime. `/planner` is 110 kB against an 87.8 kB baseline; the catalog
alone would have been multiples of that.

### 5.13 Mind maps: what storing structure instead of coordinates bought

A mind map is conventionally a free canvas — drag a node anywhere, store x/y.
That would have collided with four things this codebase already decided: no
drag-and-drop library, a test that fails the build on an interactive element
with no focus treatment, the planner's own "moving is a button, never a drag",
and a student body mostly on phones.

Decomposing the request the way §7 describes settles it. **The value of a
student's map is the branching** — these are my options, this is what each needs.
Where a box sits is the part that would rot, cost a drag implementation the
keyboard cannot use, and be unusable at 375px. So the table stores a parent and
a position, and `layoutTree` computes the picture.

What that bought, beyond avoiding the collision:

- **The geometry is assertable.** A parent sits at the midpoint of its children;
  no two nodes overlap; the canvas has a size for a root on its own. Measured in
  the browser as well: 9 nodes, **0 overlapping pairs**, page does not scroll
  sideways while the 373px container scrolls inside itself.
- **The outline can be a real ARIA tree.** Tab in and out, arrows within — which
  is the pattern precisely because a canvas cannot have it.
- **Two panes cannot disagree**, because one is a function of the other.

Three things worth not re-discovering:

- **Read structure from the tree, never from the drawing.** The first version of
  "Add after" found the parent by comparing y-coordinates in the layout. It
  worked on the example and is nonsense: the picture is derived from the tree, so
  reading the tree back out of the picture inverts the dependency. `parentIdOf`
  exists for this.
- **A scratch page without a viewport meta tag reports `innerWidth: 980` under
  mobile emulation**, not 375. §5.7's rule — check `innerWidth` before trusting
  any layout number — caught it. Measure phone behaviour on a real app route, or
  in a fixed-width container on the scratch page.
- **The detector found nothing, and that is not the same as the design being
  good.** The one real design decision here was refusing to introduce
  `lucide-react` (installed, and used in exactly zero files) for this view alone:
  drawn icons in one corner of a product whose entire vocabulary is text glyphs
  would be the inconsistency, not the fix.

---

### 5.14 The hero background, and the two bugs that were not the one reported

The report was "the top is just dark, empty somehow". Both real defects found
while fixing it were *underneath* that sentence, and neither is visible in a
screenshot.

**1. The hero's promise paragraph was already failing AA, before any background
existed.** It was `text-ink/60`, which measures **4.53:1** on the bare light
page — AA by three hundredths, with no headroom at all. Put anything behind it
and it goes under: with the field lit it measured 3.71:1 light and 3.99:1 dark.
It is `text-ink-soft` now, the token that exists for secondary copy, worth
8.87:1 and 10.52:1 bare.

The general lesson, and it is the one worth keeping: **an alpha modifier on
`ink` is a colour nobody has checked.** `text-ink/60` looks like a design
decision and is arithmetic — it lands wherever the surface happens to be. The
named tokens are checked, in both themes, by a test that has been there for
months. Reach for `ink-soft`/`ink-faint`, not for `/60`.

That is also why the field's strengths are a **solve** rather than a taste. The
bound is the worst composite the field can produce anywhere — the beam and its
sweep overlapping, with the strongest blob centred on top — at which the
faintest text on it must still clear 4.5:1. That fixes the glow at 0.20 light /
0.22 dark and the beam at 0.12 / 0.13. Tuning by eye would have picked 0.30,
which measures 4.14:1 in dark, and nothing on screen would have looked wrong.

**2. The blobs were anchored in percentages of a box whose height doubles.**
The hero section is ~900px on a desktop and **1635px at 375×812**, because below
`lg` the message and the opportunity card stop sitting side by side and stack.
So `-top-[18%]` put the accent blob's centre 774px above the fold, and
`-bottom-[22%]` put the ivy one 90px *below* the section it is clipped to. Two
of the three lights did not exist on a phone — while looking perfect on the
display they were built on.

They are anchored in `vh` now. A viewport unit is the only frame that means the
same thing in both layouts. **Any decorative layer inside a container that
reflows should be measured on the reflowed layout, not the built one**, and a
percentage offset is the specific spelling that hides it.

**What the design turned out to be.** Four layers, all paint, all composited:

| layer | what it does | why it is that and not the obvious thing |
|---|---|---|
| beam + sweep | lights the top edge, behind the header | the literal rectangle that was reported |
| lattice | hairline grid, masked at top-centre, drifting | drifts exactly ONE cell, so the end state is pixel-identical to the start and `linear infinite` has no seam |
| aurora | three blobs, three unrelated periods | softness is the gradient's own falloff — **there is no `filter` anywhere**, so only transforms animate |
| sparks | three points travelling the lattice | the page is about routes; something moves along them |

Three details that only exist because they were got wrong first:

- **Gradient stops are `rgb(var(--x) / 0)`, never `transparent`.** The keyword is
  `rgba(0, 0, 0, 0)`, so a stop running to it interpolates through black and
  leaves a grey bruise round every blob — worst on the light theme.
- **Every loop is closed.** The reduced-motion guard forces
  `animation-iteration-count: 1` *as well as* a ~0 duration, so an infinite
  animation does not pause where it started — it **jumps to its end state**. A
  loop whose 100% differs from its 0% therefore freezes a reduced-motion reader
  mid-stride, which is precisely what the guard exists to prevent. The sparks
  are the one deliberate exception: their 100% is `opacity: 0`, so reduced
  motion *removes* the runners rather than freezing three dots in mid-air.
- **Stacking is DOM order, not `-z-10`.** A negative z-index puts a child behind
  its parent's own background whenever the parent is `position: relative` with
  `z-index: auto` — which is exactly this section — so the field would have
  painted invisibly under `bg-surface`. It is the section's first child and
  carries no z-index; the content grid beside it gained `relative`.

**What was surveyed and rejected.** The four live techniques are aurora/mesh, a
masked lattice, a cursor spotlight, and a particle field. The **cursor spotlight
is the most recommended and the worst fit here** — it needs a pointer, it needs
JS, and it renders as nothing at all on the phone most of our students read us
on. A particle canvas is the same trade one step worse. The two that survived
are pure paint, and the craft is in not doing them the way the tutorials do:
both standard recipes animate `background-position` or a `filter` radius, and
both re-paint every frame.

**Cost:** `/` is still **107 kB** of first-load JS, and the section now has
*fewer* paints than before — the two `blur-3xl` blobs the field replaced were
the only `filter` on the page.

### 5.15 The gutters below the hero, and the measure that is not `ch`

The founder's "the gutters are too big" was fixed in the hero on 2026-08-11 and
never checked below it. At **1920 every section under the hero was 1152px of
content — 768px of gutter, 40% of the display** — while the hero above ran to
1600. The page did not look wide and then narrow by accident; it did that at
exactly the point where the reader stopped looking at the product and started
reading about it.

Nine sections set `max-w-6xl` independently, which is the same duplication
`Shell.tsx` exists to remove for the student's section, so the fix is the same
shape: one `Band`, carrying Shell's own ramp (1152 → 1280 → 1440, stopping
there). Gutter at 1920 is now 480.

**The part worth keeping is how the prose was checked.** Widening a container is
only an improvement if the extra width goes into columns; the failure mode is
that a paragraph quietly stretches with it, which is how the country page
reached 131 characters a line. So every paragraph on the page was measured in
**real characters per line — text length over rendered line count**, and not in
`ch`:

> `ch` is the width of a ZERO, and reads about 20% narrow in this font. A
> measurement of "78ch" is ~94 real characters. Measuring in the unit you are
> capping in will tell you the cap is fine.

One paragraph had gone over: the partners band, at **89 characters**. Its parent
carried `max-w-2xl`, which is a rem measure and therefore does not track the
16px type inside it — a cap in `rem` bounds the BOX, not the line. It carries
`max-w-[60ch]` now (the repo's idiom, ~70 real characters) and the page has zero
paragraphs over 75 at either 1440 or 1920.

A test pins both halves: `Band` must keep all three steps, and no container in
the landing files may cap at `max-w-6xl` without ramping past it.

### 5.16 "The text is hard to read" — and it was not contrast

The founder reported it on 2026-08-14 beside a competitor's screenshot. The
competitor's site is light-themed, ours is dark-first, and **copying their
numbers would have fixed nothing** — measured, every text token on
`/opportunities` was already 5.48:1 or better.

Three defects, none of which any contrast test could catch:

**1. No type step.** The opportunity card held five stacked rows at 18 / 10 /
15.2 / 14 / 14px inside 20px of padding — a title **1.18×** its own body. The
guide card was worse: title and description both 14px, a step of exactly
**1.00**, on the component that navigates 88 pages. "Everything is nearly the
same size, nearly the same distance apart" is what a reader means by a wall of
text, and it is a geometry problem wearing a colour problem's clothes.

Both are fixed with size *and* weight, because size alone asked to carry a
hierarchy will always be pushed too far. And the opportunity card's five tiers
became four: eligibility and the deadline are the same KIND of fact — the terms
of entry — so they are one group now rather than two rows 4px apart.

**2. A 10px floor.** 69 labels at 10px and four at 9px across 21 files, carrying
real information. Raised to 11px in one pass, because a floor that holds in some
components is not a floor.

> **Superseded on 2026-08-19 (release 9).** Raising 118 labels *to* the floor and
> stopping there is what this pass got wrong: "at the floor" is not "readable",
> it is "not illegal", and the complaint came back. The floor is **12px** now and
> the scale's small end moved with it. Worse, the test written to hold this line
> **had never fired** — see §5.22.

**3. One typographic setting for two themes with opposite optical needs.**
This is the finding worth keeping. Light text on a dark ground **blooms**: the
glyphs spread into the background, strokes thicken, counters close and the space
between letters is eaten. Colour was already a per-theme token in this product;
letter-fit was not. `--type-tracking-body` is 0 in light and 0.008em in dark —
~0.13px at 16px, enough to reopen the word shapes and not enough to read as
letter-spacing — applied on `body` so it inherits everywhere an explicit
`tracking-*` was not a decision.

**Found on the way, and bigger than the report:** `text-accent` was painting
real text at 22 call sites. `accent` DEFAULT is **4.28:1 on the page** — and the
test that exists to name exactly this mistake covered `reach`/`target`/`likely`
and stopped. The lesson generalises past this bug: **a test that names a class of
mistake must enumerate the whole class**, or it becomes evidence that the
uncovered members are fine.

### 5.17 The spine: the join was a function, not a table

#16 read like the largest structural item left, and it turned out to need **no
new content at all**. Every layer already carried the same key:

| layer | field |
|---|---|
| `CAREER_AREAS_BY_FACULTY` | keyed by `FacultyValue` |
| `Hub.fields` | `FacultyValue[]` |
| `StudyDestination.fields` | `FacultyValue[]` |
| `NamedUniversity.knownFor` | `FacultyValue[]` |
| `HomeRoute.fields` | `FacultyValue[]` |

What was missing was that **nothing derived the chain**. An area of work listed
the cities it lives in as bare chips — no country, no institution, no route from
home. A city listed the *labels* of the fields that cluster there and gave no
way to read what any of them means. A country explained its money, its
admissions and its visa ladder in full and never said what any of it leads to.
Every one of those is the same dead end pointing a different way.

**So it is a function, not a table**, for the same reason the planner refuses to
snapshot the catalog: a stored spine would be a sixth copy of relationships that
already exist five times, and it would start drifting the first time a city
gained a field.

**The bug the tests found on the first run, and why it matters more than the
feature.** The derivation was two passes — cities in region order, then the
countries that claim a field without any city carrying it. The second pass
appended *after* the first had already walked every region, so the chain went
"… North America" and then back to Asia-Pacific. **The home-region rule was true
of each pass and false of the result.** That is exactly the class of drift the
join exists to end, and no amount of looking at the page would have shown it —
the order looks plausible either way. It is one walk now.

Four rules live in the module rather than in a component, so a view added later
cannot forget them: the home region leads; every stop has a page behind it (a
country that is a name a student cannot click is an advert); institutions appear
only under a field they are actually `knownFor`, in the registry's own order;
and a country we merely NAME does not become a link — that dead end was a real
bug on the city pages and this layer would have repeated it at nine countries.

The round-trip is asserted: if a city is on a field's chain, that city must lead
back to the areas of that field. That is what "coherent" means operationally,
and it is checkable in a way "the pages feel connected" is not.

Cost: **nothing**. `spine.ts` is server-only in practice — it reaches into five
prose registries totalling ~4,000 lines — so the guide's route bundles are
unchanged at 99 kB, and a test fails any client component that imports it.

### 5.18 The catalog widened, and three rows failed verification

157 → **172**, with a new kind: `community`. The number is the least
interesting part.

**A kind, not a tag.** The catalog's every field assumes an event with a
deadline. A forum, a club network, a citizen-science platform and an open-source
month have neither a deadline nor anything to win, so they were unrepresentable
rather than merely missing. That is why this is a sixth `CompetitionCategory`
and not a chip.

**Adding it found that the list of kinds existed FIVE times** — the type union,
the partner form's Zod enum, the admin quick-add's const, the partner option
list, and the session checks — with nothing making them agree. Three of the five
broke, which is the only reason anyone found out. `COMPETITION_CATEGORIES` is
one array now and the union is derived from it.

**Three of the first fourteen rows did not survive `npm run test:links`, and
each failed in a way this catalog's promise forbids shipping:**

| row | what happened | why it cannot ship |
|---|---|---|
| eBird | anonymous visitors bounce into a login loop | a card that lands a student on a sign-in wall lied about "you can start today" |
| THIMUN | TLS chain does not validate | a browser security warning is worse than a 404 — it teaches a student to click through those |
| UNICEF Voices of Youth | 200, redirecting to u-report.org | a different product; guessing what is actually there is the one thing this catalog does not do |

All three were **dropped and replaced** with URLs probed to a clean 200 before
being written, rather than softened into a vaguer blurb. That is the whole
lesson: the failure mode under a deadline is to keep the row and weaken the
claim, and the claim is the product.

Also fixed **`ijso`**, broken before any of this — a dead TLS handshake on
`ijso-official.org`, live on `ijsoweb.org`. **172 links, 0 broken.** Two sit
behind bot walls, which the rules already treat as answered.

### 5.19 The empty planner: what "a choice" has to be to be worth anything

The founder's call was a CHOICE rather than one recommended next move, and the
reason it beats a recommendation is worth keeping: **a single recommendation is
a judgement about a student we have not met.** Four options cost the same one
tap, and the pick itself is the first piece of revealed preference we get.

The research adds the constraint that makes it work at all:

> **Every option must be a thing that HAPPENS, not a category.**

"Pick a field" is a form with different paint — and a form is exactly what a
student who cannot answer "what do I want to study" is unable to fill in. Each
option ends somewhere they can act, and each says what it will TELL them, which
is the part that makes choosing possible *without already knowing*.

A test enforces it by failing any label that is a noun phrase. That sounds
crude and it is the right shape: the failure mode here is not a bad label, it is
a slow drift from verbs back into taxonomy, and taxonomy is what the student
cannot navigate.

The order is an argument, not a layout — most concrete first:

1. something you can enter now (needs no self-knowledge at all);
2. what a kind of work is really like (the question under "what do I want to
   study", asked in a form that has an answer);
3. what a country actually costs and demands;
4. think it through on a map — **last on purpose**: it is the only one that asks
   the student to supply the structure, so it is the wrong first step for
   exactly the person this screen is for.

**The bridge is the counts.** The four options carry numbers walked out of the
spine — the areas of work and countries *this student's own fields* reach. That
one detail is what makes the plan an extension of the guide rather than a second
opinion about it, and it needed no new data. Before it, the planner knew nothing
about the guide at all.

### 5.20 Derive the type from the address

A map node pointing at `/guide/places/germany` **is** a country. Nothing else
could live at that address. So `mapNodeKind` reads the href and there is no
`kind` column, no migration, nothing to keep in step, and no way for a label and
a type to disagree.

It also cannot be forged: the type is a fact about where the node leads, and
`link_href` is already constrained to an in-app path by the server action.

**The generalisation:** when a thing already carries an identifier that is
unique to its category, the category is derived, not stored. This is the third
time the same move has paid — the spine (relationships from `FacultyValue`), the
planner (state from `origin`), and now this. The counter-case is worth naming
too: derive only when the address is *canonical*. If two paths could mean the
same category, storing it is correct.

Prefix order matters and a test pins it: `/guide/work/…` must be tested before
any looser guide prefix, or every guide link answers "country". Unknown paths
fall back to untyped rather than guessing — **a wrong badge is worse than none**,
because the badge is what tells a student what kind of decision they are making.

### 5.21 The logo did seven different things

Prompted by comparing our header with a competitor's. The comparison found
something worse than a layout difference: the brand mark had **seven behaviours
across seven headers** — not a link at all on the landing page, on `/guide` and
on the signed-out `/opportunities`; to `/opportunities` in the student nav; to
`/dashboard` in the report's header; nowhere in the report's sidebar; and to `/`
on `/partners` alone.

One in seven did what everyone tries first.

Three things worth keeping:

- **`/` is right even for a signed-in student**, because the landing page is
  session-aware — it already shows "Dashboard" instead of "Log in". A logo that
  leads to a *section* rather than to the front door quietly tells a reader they
  are stuck in one.
- **It is a touch target before it is a logo.** The mark is 24px and the control
  around it was not sized at all, while every other control in the product
  clears 44px. The one people aim at most did not.
- **The exception is not a header.** `Scorecard` draws the mark inside the
  report card it renders; a link there would be a link in a picture of a
  document. Exceptions to a global rule should be justifiable in one sentence
  like that, or they are not exceptions.

**Sign out was a permanent top-level button** — the most destructive action on
the page, one stray tap from a student's session, sitting beside the links they
actually want. It is behind the account menu now. A native `<details>` does the
disclosure and the keyboard for free; the two things it does not give were added
because a menu without them is a trap — **Escape closes it and returns focus to
the trigger, and a click outside closes it** — and both listeners are removed
when it shuts.

### 5.22 A test that reads one match per line is not a test

The 11px floor test used `line.match(...)`, which returns the **first** match
only. A ternary carrying three sizes on one line — `text-[11px]` before
`text-[9px]` — therefore passed, and a 9px partner monogram survived the entire
floor sweep that the test existed to enforce.

It was found by accident: prettier happened to split that line, and the second
class became visible.

> **Correction, 2026-08-19 (release 9). The `matchAll` fix landed on a regex
> that could never match anything, so this test has never once fired.** It read
> `/text-[(d+(?:.d+)?)px]/` — the backslashes had been eaten somewhere between
> being written and being committed, which turns `[…]` into a character CLASS
> matching one character from `{( d + : ? . ) p x}`. Nothing was captured,
> `m[1]` was `undefined`, `Number(undefined)` is `NaN`, and `NaN < 11` is
> **false**. It matched a real class name on every line it scanned and reported
> zero offenders, for every release it existed.
>
> **This is the same failure as the bundle guard** written as a template
> literal, where `\s` became the letter s (§5 of the release-6 audit). Both were
> quoted as guarantees in a PR description. The shared shape is that **a broken
> pattern fails OPEN**: it does not throw, it does not report, it just goes
> green — which is indistinguishable from working, and is read as proof.
>
> So the rule this section states is right but not sufficient. `match` vs
> `matchAll` only matters if the pattern matches at all. **Every scan-over-source
> guard needs a second test asserting it BITES on a line it must catch**, and
> the floor guard now has one: `text-[10px]`, `text-[0.7rem]` (a `rem` value a
> px-only pattern waves through), and a ternary carrying three sizes.

**The general form, and it is the more useful half:** a scan over source text
must ask what it does when the pattern occurs more than once in a unit. `match`
vs `matchAll`, `find` vs `filter`, `indexOf` vs a loop. A gate that reports
*fewer* offenders than exist is worse than no gate, because its green is read as
proof.

Related, from the same session: two assertions failed on **their own explanatory
comments** — a CSS comment naming `filter: blur` as the thing being avoided, and
a component comment naming framer-motion. Anything asserting about what code
*does* must read the code, not the prose around it. `stripComments` exists for
that and should be the default for this class of test.

### 5.23 The animation was blocked by a data-flow problem, not by an animation problem

The open half of #23 was "a card moving between columns". The obvious version —
wrap the existing move in `document.startViewTransition` — is the bug §5.1
already records: the move is a server action on a `force-dynamic` route, so the
transition's promise waits on a round trip and the document freezes, measured at
2130ms with an idle main thread.

**The fix was not a shorter animation. It was making the move land in the client
first.** The board now holds the presses the student has just made and lays them
over the server's columns, so an arrow moves a card immediately and the server
reconciles afterwards; a failure puts it back. With the update applied
synchronously (`flushSync` inside the callback) there is nothing for the
transition to wait on, and the freeze is bounded by the animation itself.

Two details that would each have shipped as "no animation, and nothing tells
you":

- **`flushSync` is load-bearing.** Without it React batches, the snapshot is
  taken before the DOM changes, and the browser morphs nothing.
- **`plannerMorph` has to be injective.** The first version swept every illegal
  character to `-`, so `a:b` and `a-b` produced one name. Two elements claiming
  one `view-transition-name` is not a broken animation — it is silently no
  animation. It escapes to the character's code point now, hyphen included, and
  a test asserts distinct keys stay distinct.

Reduced motion **skips** the transition rather than shortening it: the global
CSS guard zeroes the duration, and a zero-duration transition still freezes.

**The general lesson, beyond this card:** when an animation cannot be added
safely, the thing to fix is usually the update it is trying to animate. An
interface that cannot be animated without freezing is usually one that was
making the user wait already.

### 5.24 A duplicated country, and an identity built out of prose

Found by opening an area page during verification and reading the console:
React reported *two children with the same key,
`United Arab Emirates-middle_east`*. What a student actually saw was the same
country listed twice in the chain, one city under each.

`spineForFaculty` matched an existing stop on `s.country === hub.country` and
stored `destination?.name ?? hub.country`. Those are two different strings: the
hubs say **`UAE`**, the country profile is called **`United Arab Emirates`**. So
the stop could never match itself, and every additional UAE hub opened a new
one. It became visible only because Dubai and Abu Dhabi were split into separate
hubs two releases ago (#5/#7). **`Hong Kong SAR` against `Hong Kong` was one hub
away from exactly the same bug.**

The rule: **a stop's identity is its destination id, never its printed name.**
Nothing else in this codebase compares prose to decide whether two things are
the same thing, and this is why. Fixed by resolving the destination before the
dedupe and matching on the id; the fallback to a country string survives only
for a hub whose country we do not profile, where that string is genuinely all we
have.

Two things worth carrying:

- **The bug had been live since the spine shipped (#16) and no test saw it**,
  because every existing spine test asserted properties of the chain — home
  region first, every stop reachable, nothing ranked — and none asserted that
  the chain contains each country *once*. A test does now, over every field.
- **It was found by looking, not by testing.** The planner cannot be opened by
  an agent, but the guide can, and the console is where a server component's
  key collisions surface. Reading it after a change is cheap and it is the only
  reason this was caught.

## 6. Verification

```bash
npm run build            # the gate — never while `npm run dev` is running
npm run test:unit        # 282 tests
npx tsc --noEmit
npm run lint
npm run db:check         # read-only: is the DB what the code assumes? 33/33
node --import tsx scripts/test-session-checks.ts   # 61 checks
npm run test:guide-links # 27/27 official sources — NOT in CI, run it anyway
npm run db:check         # after applying a migration, and before believing any note about one
```

**CI runs three of these**: `npm run build`, the session checks, then
`npm run test:unit`, without secrets. `npm run test:analyze` is the only one
needing a real `ANTHROPIC_API_KEY`.

**A green test is not the same as an enforcing test.** The 11px floor guard ran
in CI on every push for several releases and could not have failed: its regex
had lost its backslashes, so it captured nothing and compared `NaN`. §5.22 has
the full shape. When a guard scans source text, write the second test that
asserts it BITES on a line it must catch — otherwise CI is reporting that the
pattern executed, not that the rule holds.

**The two that CI does not run are the two that rot.** `test:guide-links` and
`test:links` need the network and would make CI flaky, so they only fail when a
person runs them — and `test:guide-links` was found red, exit 1, with no idea how
long it had been that way (§5.11). Run both before any release touching the guide
or the catalog, not only when editing a URL.

---

## 7. How we work — the method, not the findings

Everything in §5 was found the same handful of ways. This section is the method
itself, because it transfers and the individual findings do not.

### Measure it; do not look at it

For any claim that can be a number — a column width, a gap, a bundle size, a
contrast ratio, a line count — read it out of the running system. A screenshot
shows one state and proves nothing about the states between the ones you sampled.

The practical form: write one probe function, store it on `window`, and re-invoke
it after every viewport change. That is how "the hero looks off" became "560px
column, 616px phrase, 63px reserved and unused" — and once it is a number, the
fix is decided rather than debated. It also worked when screenshots were
unavailable, which is more than half the time in this harness (§5.7).

Corollaries paid for in this backlog:

- **Character count is not width.** Two 19-character phrases differed by 95px.
- **Contrast is not brightness.** The band and the primary button both passed
  every contrast check while being visibly broken; what was wrong was luminance,
  and only an absolute assertion catches it.
- **A theme toggle at runtime does not repaint `var()` colours.** Load the page
  under the OS setting instead. This produced a false "the fix didn't work"
  reading here, exactly as CLAUDE.md warned.
- **Measuring during an animation measures the animation.** Force it to its
  resting state first; do not await `finished` in a hidden pane, it never
  settles.

### A test you have not seen fail is a belief, not a test

Every source-scanning invariant added in this backlog was verified by **seeding a
violation and watching it fail**, then reverting. This is not ceremony: the first
draft of one of them passed only because its regex was wrong, and the `--cta`
luminance ceiling was confirmed by temporarily restoring the old value and
reading the failure message.

### Fix the root, then encode the audit

When a defect is found by grepping or probing rather than by the compiler, the
grep is the durable artefact. Convert it into an assertion in
`scripts/test-engine.ts` before finishing, and say in the test's own comment which
bug it caught — that is what lets a future reader tell a real invariant from
cargo-culted lint.

Five of the seven defects in §5.9–5.11 could not fail a type-check, and three
could not fail a lint either. The code was valid; it simply did not do what it
said.

### Separate what decays from what holds

When a request collides with a rule (#9: "list the top universities" versus a ban
on rankings), decompose it. A *position* rots within a year; an *association* —
what a place is actually studied for — holds. Ship the durable half in full,
model the volatile field coarsely with an explicit "check it for your own year",
and extend the rule to cover the paraphrase that would smuggle the banned thing
back in (here: superlatives, a ranking with the number filed off).

### Two views of one dataset are one dataset and a function

The city page derives from the same registry the country page reads. The test
asserts the **derivation**, not the contents — a contents test rots at the speed
of the content and gets deleted; a derivation test is size-independent.

### Bundle cost is per consumer, not global

"Should we adopt this dependency?" is one question per consumer with different
answers. `cn` was free in `Input` (its importers already carried tailwind-merge),
worth +9 kB in the components that needed it, and deliberately declined in `Shell`
and `Logo` — with the reason written in the code and the latent risk covered by a
test instead of by bytes. And `{isAdmin && …}` decides what renders, not what
ships (§5.10).

### A question from the founder can be a bug report

#8 was phrased as a neutral question about an existing decision. Answering it
literally was correct; checking the answer against the rest of the same list is
what found that #5 and #7 had been fixed one way and four other cities left the
other way. **"Why is this like this?" means the design failed to explain itself,
which is a defect even when the design is defensible.**

### Say the concern once, then build what was asked

Where we disagreed with the founder and they reaffirmed — the NAO Cup
registration link — the decision is theirs, it ships as they asked, and the
reasoning is recorded in §5.10 so nobody re-opens it as a mystery later. State a
concern once with evidence; do not re-litigate it.

### Never ship a claim you cannot stand behind

The three that keep coming up, all of them rules this product already had and
still nearly broke:

- **"Free" is not the absence of a stated price.** NAO Cup ships with no `cost`,
  which renders as "we have not verified this", because the announcement simply
  does not mention a fee.
- **A countdown needs a date we can source.** The organiser's own announcement
  counts; a scrape does not.
- **A link has to work for the reader, not for us.** And when it fails, say which
  of the four failure modes it was — answered-with-error, refused mid-handshake,
  timed out, or unresolvable — because each licenses a different action and two of
  them look identical in a one-line report (§5.11).

### The complaint is a symptom; measure before believing it

Four times now the reported problem was not the actual defect, and each time
measuring found something the report could not have named:

| reported | actually wrong |
|---|---|
| "the hero is dark and empty" | the hero's promise paragraph was **4.53:1 before any background existed**, and the blobs were anchored in % of a section that doubles in height on a phone |
| "the gutters are too big" | true — 768px at 1920 — but the fix exposed a paragraph at **89 real characters** a line |
| "the text is hard to read" | contrast was fine everywhere (5.48:1+). The defects were **no type step** (a guide card whose title and body were both 14px), a 10px floor, and one typographic setting serving two themes with opposite optical needs |
| "their logo goes to the landing" | ours did **seven different things in seven headers** |

**So: reproduce the complaint as a number before touching anything.** The
founder is reporting a feeling accurately; the cause is usually one layer down
and usually worse. Fixing the reported thing without measuring means fixing the
symptom and shipping the cause.

**"The text is hard to read" came back on 2026-08-19, and measuring found a
different cause again.** Contrast was clean for the third time — zero WCAG
failures on three pages in both themes — and the defect was the body size
itself: 93.5% of a country profile was set at 14px or below. The row above is
therefore not the answer to that complaint, it is the answer to that complaint
*in release 3*. **Re-measure every time; do not look up what it was last
time.** The corollary is uncomfortable and worth stating: a complaint that
recurs after a measured fix usually means the measurement was of the wrong
quantity, not that the reader is wrong.

### One list, or the compiler cannot help you

The kinds of opportunity existed **five times** — the type union, the partner
form's Zod enum, the admin quick-add's const, the partner option list, and the
session checks — with nothing making them agree. Adding a sixth broke three of
the five, which is the only reason anyone found out.

Collapsed to one `as const` array with the union derived from it. The payoff was
immediate and measurable: adding a **seventh** kind later the same day was one
line, and the compiler found every place that had to answer.

**The tell that you have this problem:** a change in one file produces a type
error in a file you did not expect to touch. That error is not an obstacle, it
is the design working — but if it *doesn't* appear when it should have, there
are two lists.

### Verification failures are answered by dropping, not by softening

Under time pressure the instinct is to keep the row and weaken the claim: make
the blurb vaguer, drop the countdown, say "check the site". That inverts the
product — the claim IS the product.

Eight rows failed verification across two days and every one was dropped and
replaced rather than softened:

- **eBird** bounced anonymous visitors into a login loop — a card that lands a
  student on a sign-in wall lied about "you can start today";
- **THIMUN**'s TLS chain does not validate — a browser security warning is worse
  than a 404 because it teaches a student to click through those;
- **UNICEF Voices of Youth** answered 200 and redirected to a different product;
- **five Forage company pages** are demonstrably live (curl, 200, five for five,
  sequential with delays — not rate limiting) and `test:links` still cannot
  reach them, because they sit behind connection-level bot protection. **A link
  the gate cannot stand behind does not ship**, even when you personally know it
  is fine. The catalogue page reaches all five and IS verifiable, so it carries
  their names in its blurb instead.

What is given up is the ability to name a company on a card. What is kept is a
gate whose green means something.

### Research the question, not the feature

When the founder said plainly that they did not know how the planner should
look, "build what was asked" was the wrong reflex — what was asked was a
direction. Six searches on career indecision produced two findings that
invalidated the obvious design:

- career indecision is **four profiles, not one state** (39/31/23/7), so a
  product treating every arrival as completely lost is wrong for seven in ten;
- **brief interventions barely move 11–16-year-olds; sustained ones do**, so
  "what do I want to study" cannot be a screen at all.

That reframed the work: the thing here that IS sustained is the plan, so **the
planner is the intervention** — not where a finished answer is recorded, but
where it is assembled over months out of what the student does.

It also produced a refusal worth keeping. A RIASEC-style interest inventory is
the obvious feature and is **explicitly rejected**: the structure is valid, but
the scales are confounded with **prestige and gender** and culturally caveated.
For readers choosing under family and status pressure it would launder the exact
pressures we exist to counteract into something that looks like a measurement.

**Write the sources into the doc.** A decision with its evidence attached can be
disagreed with on the evidence; one without can only be re-argued from taste.

### The owner's call outranks the research, and the doc says which is which

Three decisions were taken from evidence and then settled differently by the
founder. Their calls stand, and `PLANNER_PLAN.md` marks each one as an owner's
call with the reason it is better — not as a correction of the research, and not
silently overwriting it. A future session must be able to see that a human chose
this, or it will "fix" it back.

### Process notes that cost time here

- Commit in logical units, and order them so each one is green on its own.
- `next build` with a throwaway `distDir` rewrites `tsconfig.json` — it injects
  `<thatDir>/types/**/*.ts` into `include` and reformats the file. Revert it.
- The doc you are reading goes stale fastest at the top. §1 claimed an open PR
  and an unpushed commit for a day after both were false.

---

## 8. What to do next — the ordered list, 2026-08-19

**Nothing is waiting to be merged.** `develop` and `origin/main` hold the same
content and every PR is closed, so a session starting here begins from a clean
production state rather than from someone else's unshipped branch. Confirm it
anyway with the ten-second check in §1.

**#25 (readability) was reopened and passed a second time in release 9** — see
§1 and the correction in §5.22. It is shipped, not outstanding.

> **There is a second list: [AUDIT_2026-08-14.md](AUDIT_2026-08-14.md).** Nine
> findings turned up while answering one question from the founder ("why does
> the site say 114 when the docs say 173?"). **Two are now closed — A1 and A3 —
> and seven are still open.** They are kept in their own file rather than folded
> in here because this backlog is the founder's 23-item list and its history is
> worth keeping legible, but the audit is the more urgent read of the two, and
> its open items are cheaper than anything left on this list.

### What the founder's own list still has open

**Two untouched (#11, #14) and one verification pass (#15).** Everything
structural is done: #16 (the spine) closed 2026-08-14, #17 (the planner) over
four releases, #22 and #24 (the landing page and its hero) on 2026-08-13, #25
(readability) and #27 (the catalog's community kind) on 2026-08-14. #23's
animation half closed with release 4.

**#8.2 — majors — is DONE and the decision it was waiting on was taken.** The
question was whether a "major" is a named degree programme at a named
university or a field of study one level finer than our eight. The second was
proposed and chosen, for the reason recorded here at the time: the first is a
large, fast-rotting per-institution dataset needing a yearly verification pass
we do not have capacity for, while the second composes with every registry that
already keys on `FacultyValue`. It shipped in release 5 as `lib/data/majors.ts`
— 44 subjects, guide step 2 — and needed no migration.

### Then, in order

The order below is by value per hour, and the first two are both data work that
needs no code and no migration.

1. **A8 — local (KZ / Central Asia) catalog rows. The catalog now has ZERO.**
   This was item 6 on the old list, where it read "`region` exists exactly for
   this and NAO Cup is still the only one". That row was removed on 2026-08-15,
   so the local-opportunity mechanism now applies to nothing curated at all.
   The product exists for students outside the first tier and currently reaches
   them with nothing they can turn up to in person: republican olympiads,
   university-run competitions, local hackathons, regional debate leagues. A
   unit test pins the zero, so the first row added will fail it and force
   whoever adds it to read the audit entry. **Highest value available, and it is
   data, not code.**
2. **#15 / A7 — verify the unconfirmed dates, but measure production first.**
   **12 of 172** committed rows carry `dateConfirmed: true`; 57 are `alwaysOpen`
   and correctly have no date to confirm. That leaves roughly a hundred rows
   reading "Dates not announced". **The repository figure is not the live one** —
   production overlays dates from the `sync-dates` cron, which an audit of a
   checkout cannot see. Read the real number off `/admin/opportunities`, which
   already has a date-health panel, and scope the verification against that
   rather than against 7%. Each date verified also moves a card onto the
   planner's agenda, so this is worth more than when it was written.
3. **A5 + A6 — close the last two vocabulary splits.** Release 6 gave categories
   one list (`COMPETITION_CATEGORIES` / `CATEGORY_ORDER`, read by both the
   student's tabs and the admin form) and the same move works twice more:
   - `school` is a fourth level the write path accepts (`ADMIN_LEVELS`) and the
     read path has never heard of (`COMPETITION_LEVELS` has three). Such a row
     is invisible to the filter and counted in no facet, silently. A
     school-level competition is a genuinely useful thing for our students — the
     first rung, and the one most likely to exist in Shymkent — so adding it to
     the union is probably right rather than removing it from the form.
   - `funded` — *they pay you*, the strongest cost signal we have — cannot be
     selected in the admin quick-add form, which still hardcodes nine of the ten
     cost models.

   Both are small. They are third rather than sixth because this exact pattern
   (a union on the read side, a hand-written array on the write side, nothing
   tying them together) is what produced three separate shipped bugs.
4. **A2 — 401 must fail the link gate.** `BOT_WALL` in
   [scripts/test-links.ts](../scripts/test-links.ts) still contains `401`, so a
   private document or an expired share link is reported as healthy. 403/429/412
   mean "we think you are a robot"; 401 means "this needs credentials you do not
   have", which for a public catalog link is precisely what the gate exists to
   catch. Move it to its own bucket that fails, with a message naming the likely
   cause. Leave 403/406/409/429 alone.
5. **#14 — Malaysia and Australia.** Two country profiles, self-contained, and
   they widen the spine's chain immediately. Rules are test-enforced: trade-offs
   must outnumber strengths, `notForYou` is mandatory, no prices or rankings,
   and `sources` must be official bodies over https that actually answer
   (`npm run test:guide-links`). Each new country needs its cities in `hubs` or
   the containment test fails.
6. **#11 — careers depth and the interest quiz. Half of this is already done;
   re-read the file before planning it.** Games was rewritten at some point and
   now states the bargain plainly (pay below equivalent software work, staffing
   around project cycles, crunch, and a warning about one-engine courses).
   **What is left is narrower and sharper than the item's title suggests:**
   `Strategy & consulting` still does not say that school prestige is the
   dominant hiring factor or that recruiting is concentrated in particular
   countries, and there is no investment-banking area at all. For a student in
   Central Asia that omission is not a nuance — it is the fact that decides
   whether the path is open to them, and leaving it out is the brochure
   behaviour this whole layer exists to avoid. **The quiz half carries a
   constraint from §7:** it may inform an offer, it may never be the answer, and
   it must not become a RIASEC clone.
7. **A9 — three copies of `CATEGORY_LABEL`.** Not a bug today and last on
   purpose. All three are `Record<CompetitionCategory, string>`, so the compiler
   keeps them complete; the risk is only that a fourth gets added. If they are
   ever merged, the right shape is one map plus an override for the long form,
   because the difference between them ("Research" on a badge, "Research
   program" on a page heading) is deliberate.

### Standing debts worth knowing about

- **The guide is still `force-dynamic` and uncacheable**, deliberately — two
  measured causes, both owner calls, written up in CLAUDE.md.
- **The link gate is only as good as how often it is run.** `ijso` was broken
  before anyone noticed. It is not in CI, because it makes ~172 network calls;
  run it after any catalog edit.
- **Nothing in the planner can be verified in a browser by an agent** — it is
  behind a session and entering credentials is not permitted. That is *why* the
  planner's logic keeps being pushed into pure functions in `lib/data/planner.ts`
  and `lib/data/planner-start.ts`. Keep doing that: it is the only verification
  available.
- **Three fields rot on a yearly cycle and are written to be re-checked, not
  trusted:** post-study work rules on every country profile, `englishTaught` in
  `place-universities.ts`, and the employer simulations in `try-it.ts`. They are
  phrased as "current rule, check it" for that reason.

### Problems, as distinct from work items — added 2026-08-19

The list above is things to build. These are things that are **wrong right now**
and that no item on any list will fix, because nobody has owned them.

1. **THREE guards in this repo have failed OPEN, and the third was found by
   grepping for the signature.** The bundle guard matched nothing because it was
   written as a template literal where `\s` became the letter s. The 11px floor
   guard matched nothing because its backslashes were eaten, so it compared
   `NaN`. On 2026-08-19 a scan of all **433 regex literals across the 19 test
   scripts** found one more: `test-engine.ts` split beat text on `/s+/` — runs
   of the letter s — instead of `/\s+/`. It reported a maximum of **9 words**
   across the 24 beats when the real maximum is **23**, so the "≤24 words" rule
   CLAUDE.md calls test-enforced would have passed a sixty-word beat. No bad
   content had shipped, which is luck rather than coverage. Fixed.

   **The scan is cheap and worth keeping**: flag any regex literal containing a
   bare `d+`/`s+`/`w+` not preceded by a backslash. It ran clean otherwise — the
   only other hits were correctly-escaped `\[(\d…` patterns.

   **CLOSED 2026-08-19 for the eleven ban patterns.** They now live in one
   `BAN` table in `test-engine.ts`, the guards reference it instead of holding
   their own literal, and one test asserts every entry catches lines it must
   catch and ignores the near-misses. `BAN_FIXTURES` is typed as a
   `Record<keyof typeof BAN, …>`, so **a new ban pattern without its fixture
   does not compile** — which is the part that survives somebody in a hurry.
   All eleven were already correct; the value is that they cannot silently stop
   being correct.

   **Two things that came out of doing it, and both generalise:**

   - **A bite test written against a COPY of a regex proves only that the copy
     works.** The indirection through `BAN` is the whole guarantee; without it
     the test and the guard drift apart and the test keeps passing.
   - **The first version of the bite test did not work, and a deliberate break
     proved it.** `tierAsText` was changed from `(?![-\w])` to `(?![-w])` — one
     backslash, exactly the real failure — and both fixtures still behaved,
     because `text-reach` and `text-reach-ink` cannot tell `\w` from the letter
     w. Only a third word character can. **Every `ignores` list therefore has to
     contain the boundary case**, the near-miss the pattern excludes by a single
     character of lookahead, not merely a line that is obviously different. Both
     failure directions were then verified by breaking a pattern on purpose and
     watching the suite go red: the loosened boundary, and the one that matches
     nothing at all.

   **Still open, and smaller than it was:** the guards that are not simple bans —
   the ones that parse structure (`walk` + `matchAll` over JSX, the import-graph
   reachability walk) — are not in the table because they are extractors rather
   than patterns. The reachability one already has its own bite test. The rest
   are read-and-assert shapes that fail CLOSED, so a broken regex there makes
   the test fail rather than pass.
2. **The product's stated mission and its data disagree.** Compass exists for
   students outside the first tier, most of them in Central Asia. The catalog is
   **155 international, 16 national, 1 regional, 0 school-level, 0
   `region`-tagged**. There is nothing in it a student in Shymkent can turn up
   to in person. This is A8, and it is written here too because it reads as a
   data chore on that list and it is actually the gap between what the product
   says it is and what it contains.
3. **The countdown is the product's central promise and 93% of rows cannot make
   it.** 12 of 172 carry a confirmed date. 57 are legitimately `alwaysOpen`,
   which leaves ~103 rows showing "dates not announced" — honest, and also the
   thing a student came for. Every date verified moves a card onto the planner's
   agenda, so this compounds with the section we just spent four releases
   building.
4. **`Link health` has been red since at least 2026-08-03** and is waiting on an
   owner decision that has not been made. A permanently red check is a check
   nobody reads, which is how `ijso` stayed broken.
5. **The docs drift, including the file whose job is preventing drift.** §1
   carried a `main` SHA two releases stale while telling the reader that a stale
   note here has cost a release twice. It is corrected, but the mechanism that
   let it happen is unchanged: these numbers are maintained by hand. Anything in
   this file that is a *count* should be treated as a claim to re-derive, not a
   fact — `git fetch`, `npm run test:unit`, and the scripts in §6 take under a
   minute between them.
6. **We still cannot tell whether any of this works.** `opportunity_intents` is
   the only behavioural signal the product collects, `/admin/intents` renders
   the funnel, and no one has reported a number off it in this file. Every
   release since #17 has been justified by reasoning rather than by evidence
   that a student did something differently.

## 9. Where this can go next — direction, 2026-08-19

Not a task list. The four items above are what to *build*; this is what the
build is for, and each one is grounded in something already measured rather than
in taste.

**1. Finish the data before adding surfaces.** The last four releases added
structure — the spine, the planner, the companion, one list — and the structure
is now ahead of what fills it. A8 (local rows) and A7/#15 (confirmed dates) are
worth more per hour than any new feature, because both make existing screens
say something they currently cannot. A student who opens Opportunities and sees
one thing happening in their own city, with a real date, has had the product
work as advertised; today that student cannot exist.

**2. Make the guards trustworthy, once.** See problem 1. This is the cheapest
possible insurance against the class of bug this repo keeps shipping, and it is
the only item here that protects every future release rather than improving one.

**3. Then close the honesty gaps in the guide's prose.** #11's consulting half,
and whatever the same read finds in the other 32 areas. The rule the layer was
built on is that an appeal without its catch beside it is an advert; the games
area now honours that and consulting does not, which means the layer is
inconsistent rather than wrong — the worse of the two states, because a reader
cannot tell which pages to trust.

**4. Look at `/admin/intents` and write the number down here.** Problem 6. If
students are committing, that says which kinds of opportunity to add more of and
the data work above gets a target. If they are not, that is the most important
fact in the project and every plan in this file is built on an assumption.

**Deliberately NOT next, and why:** new countries (#14) widen a chain that
already works; a second analysis country adds a pipeline before we know the
first one changes behaviour; and any redesign of a screen shipped in the last
month is answering a complaint nobody has made yet. The pattern this file
records over and over is that measuring first changed what got built — the
filter rail was declined that way, and readability was rediagnosed twice.


## 10. Session log — 2026-08-13 / 14

Kept because the ORDER things happened in is itself information: three of these
were found only because the previous one was done first.

| # | what | why it mattered |
|---|---|---|
| 1 | **#24 the hero field** — 4 layers of paint, zero JS | founder: "the top is dark and empty". Measuring found the promise paragraph at 4.53:1 *before* any background, and blobs anchored in % of a section that doubles on a phone |
| 2 | **#22 the landing, closed** — `Band`, the planner section | 768px of gutter at 1920; one paragraph at 89 real characters |
| 3 | **readability pass** — type step, 11px floor, theme tracking | contrast was never the problem. A guide card whose title and body were the same size; `text-accent` painting text at 22 sites (4.28:1) |
| 4 | **#16 the spine** — `lib/data/spine.ts` | needed no new content: every layer already carried `FacultyValue`. A test caught the home-region rule being true of each pass and false of the result |
| 5 | **#27 community + catalog 157 → 173** | a kind the catalog had no shape for. Found the category list existing five times |
| 6 | **#26 release 3** — designed from evidence, then 5 items built | "what do I want to study" cannot be a screen. The planner is the intervention |
| 7 | **the logo goes home** | comparing headers with a competitor found seven behaviours, not one layout difference |

**Tests: 151 → 175.** Every new assertion was failed deliberately before being
trusted. Three of those deliberate failures found real bugs rather than
confirming the test: the spine's region ordering, the 11px floor's
one-match-per-line hole, and the two assertions that failed on their own
comments. (The floor one is half a success: the hole was real, and the fix for
it was written into a regex that could not match — see the correction in §5.22.)

**Catalog: 156 → 173, and 0 broken links** — including `ijso`, which had been
broken before this session started.

### What was NOT done, and why

- **#11, #14, #15** — content and verification work, untouched. Named in §8.
- **Visual verification of the planner** — impossible for an agent: it is behind
  a session and entering credentials is not permitted. Everything there was
  verified by types, lint, production build, and pure functions under test.
- **Screenshots, for most of the session** — the browser pane was not displayed,
  so it could not composite frames. All layout work was verified numerically
  instead (computed styles, geometry, contrast arithmetic at 375 / 1440 / 1920
  in both themes). This turned out to be *better* than looking, which is now
  written up in §7.

### The mistakes made here, so they are not repeated

1. **Pushed to a branch whose PR had already merged**, ten times, so ten commits
   silently sat unshipped. Check `gh pr view <n> --json state` before pushing.
2. **Edited a merged PR's title** to describe work that was never in it. Never
   do this; open a new PR.
3. **A sweep replaced `text-accent` on three icons**, including `AuthAside`,
   which paints its own fixed dark gradient in both themes — so a token that
   gets darker in light mode was a regression there. **A codemod over a styling
   token needs the exceptions checked by hand**, and the test that codifies it
   needs an allowlist with a stated reason.
4. **Wrote a test whose scan read one match per line.** See §5.22.
