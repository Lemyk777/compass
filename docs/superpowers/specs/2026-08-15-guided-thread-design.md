# The guided thread — design

**Date:** 2026-08-15
**Status:** design approved, not yet planned or built
**Supersedes:** nothing. Extends `PLANNER_PLAN.md` and `OPPORTUNITIES_PLAN.md`.

---

## 0. Why this exists

The founder's report, 2026-08-14: there is no detailed help inside the planner,
no route to a job simulation, no majors anywhere, and the product is still too
hard to work out. All four were verified against the code before this design was
written; the evidence is in §1.

The one-line diagnosis: **we built an excellent library and called it
accompaniment.** A library answers a question that is already formed. Our student
cannot form the question — that is the reason they came. We hand them 35 cards
and wait for a choice, and choosing is precisely the work they do not yet know
how to do.

The product's promise is "we were confused too, so we built the thing that sorts
it out". What ships today sorts nothing; it presents. This design is the
correction.

### The decision this revisits

Release 4 declined a "path of stages" (`PLANNER_PLAN.md` §1), and the concern —
that declining it leaves all accompaniment resting on a single next-move sentence
— was recorded at the time so it could be revisited against evidence rather than
re-argued. The evidence arrived: the owner, using the product, reporting exactly
that. The decision is reversed deliberately, not by accident.

---

## 1. What is actually true today (verified 2026-08-14/15)

All of release 4 is merged and deployed (`git log origin/main..HEAD` is empty).
Nothing below is a "not shipped yet" problem.

| Complaint | Verdict | Evidence |
|---|---|---|
| No detailed help in the planner | **True** | The section's entire guidance is `NextMoveCard` — headline + one `why` sentence + one button (~40 words), by written rule. `PlannerLenses` is a tab strip with counts. The four starting points in `EmptyPlanner` render only while the plan is completely empty and vanish permanently after the first action — accompaniment switches off exactly when confusion begins. |
| No route to simulations | **True** | `TryTheWork` renders in one place: `app/guide/work/[area]/page.tsx:195`. 15 simulations covering **6 of 35** areas, so 29 area pages render nothing. The link goes to `/opportunities/forage-all` — a generic catalog row — not to the employer. Full path from "I'm curious about investment banking" to the J.P. Morgan simulation: `/guide` → `/guide/work` → find one of 35 cards → scroll to "Test it this month" → catalog row → out to Forage → **search for J.P. Morgan by hand** (we tell them to). Six hops and a manual search. `nextMove` has ten branches and none of them mentions trying the work. |
| No majors | **True** | There is no majors layer at all. Eight broad `faculties` exist (`lib/data/faculties.ts`). `intended major` is a free-text 80-character box: `components/onboarding/sections.tsx:109`, "What major do you want to study?". A student who does not know what a major *is* is asked to type one. The chain is field (8) → area of work (35) → country (17) → city (38); **the degree subject, the thing you actually apply to, appears nowhere.** |
| Still too complex | **True, and measurable** | For a newcomer: 3 top-level sections, guide = 4 steps, step 1 = 35 cards, step 2 = 17 countries, step 3 = 38 cities, catalog = 173 rows, planner = 3 lenses and ~10 map controls. **No screen states what order to read this in or why.** The one sentence that says "do this" lives on `/planner`, which is the last place a newcomer arrives. The self-knowledge tool (`interest-quiz`, 8 questions) is buried inside `OpportunitiesView.tsx:363` as the fallback of a single prompt. |

---

## 2. Decisions taken

| # | Question | Decision |
|---|---|---|
| D1 | Guided thread, or rooms with good signposts? | **One guided thread.** |
| D2 | How does it learn who the student is? | **Reaction to concrete things.** No abstract questions. |
| D3 | Where do majors sit? | **A full step of the guide**, with real pages, between work and countries. |
| D4 | What ships first? | **One complete circle** — narrow, but end to end and walkable. |
| D5 | How is the thread carried? | **A companion present on every screen** (rail on desktop, one-line dock on mobile). Not a fourth section, not a replacement entrance. |
| D6 | Majors in release 1 | **All ~50, with full pages.** A partial layer walks the student into an empty room, which is the failure being fixed. |

### Why D5 over "the thread owns the entrance"

The alternative considered was: for a newcomer, the root of the product *is* the
thread, and the sections are where it leads. It was rejected for one reason —
it repairs only the entrance. The complaint is "I get more confused as I use the
site", which is about every screen, not the first. A thread that hands the
student to a section and stops leaves them alone in the library again, one step
later. The companion is the only shape that never disappears.

The known weakness of the companion — that it can become a caption rather than a
guide — is answered by §3: the work happens **inside** it.

### Why the product's own name

The companion is the compass needle, already drawn in `NextMoveCard`. It is not a
new entity to learn; it is the product finally doing what its name says.

---

## 3. The companion

A persistent element on every page of the student's product (`/opportunities`,
`/guide/*`, `/planner`). Desktop: a rail in the column that is already empty
(same reasoning as `DetailShell`'s `aside`). Mobile: a single 44px line at the
bottom that expands into a sheet on tap.

### Rules — each is a way the obvious version fails

1. **It speaks about the student, never about the page.** "You are reading
   Germany because you said the money matters more than the city" cannot be
   written in advance — it is derived. A caption ("Germany is a country in
   Europe") is worthless; the page already says that.
2. **It never repeats itself.** Every utterance is a function of what changed
   since the last one. When nothing changed, it says nothing and shows only the
   next step. A companion that says the same thing twice reads as broken. This
   is test-enforced (§9).
3. **It waits; it never chases.** No pop-ups, no auto-expansion, no "did you
   know". It is where it is, and it is quiet.
4. **The work happens inside it.** Reaction pairs are asked in it. Conclusions
   are said in it. It can change the page beneath itself — press "show me the
   majors", the page changes, the companion stays and says what just happened.
   This is the whole difference between a guide and a caption.
5. **It can be dismissed.** "I'll take it from here" collapses it to an icon and
   it does not come back until called. A student who has worked it out should not
   have to carry a chaperone.
6. **No entrance animation on anything it says.** A fade-up holds content at
   `opacity: 0` until the animation finishes, and this is the product's guidance.
   Same rule, same reason, as `NextMoveCard`.

### Technical shape

- The companion is on every page, so it **must not pull a single heavy registry
  into a client bundle.** This is the repository's most-repeated trap:
  `key-dates.ts` builds a map over ~2,700 catalog rows at module load,
  `careers.ts` is ~1,100 lines of prose, `spine.ts` is server-only by test. The
  companion's content is therefore **computed on the server and handed down as
  nodes** — exactly how `PlannerWindow` already receives `nextMove` and
  `mapsLens`.
- **No state is stored except reactions.** The stage ("3 of 7") is a pure
  function of facts that already exist: profile fields, `planner_path`,
  `opportunity_intents`, and reactions. Same argument as `spine.ts` (never store
  a derivation — it becomes a copy that drifts) and `plan-picks` (a pick's kind
  is the prefix of its ref, not a column).
- The companion is a client component (it holds open/collapsed state and posts
  reactions). Its props are serialisable values and pre-rendered nodes.

---

## 4. The reaction engine

### The content

New registry `lib/data/beats.ts` — roughly 24 "Tuesdays": one concrete moment of
real work, 15–25 words, **containing no jargon and naming no profession.**
Presented in pairs.

Example of the shape (not final copy):

> You sit with a company's numbers and find the place where it is lying to
> itself. By evening, you find it.

> Your code has to hold ten thousand people by morning. It doesn't. You find out
> why.

### The scoring

Fixed per-option weights and pure scoring, the same pattern as the existing
`interest-quiz`. **The axes are the shape of the work, not the faculty:**

- result lands today · result lands in years
- with people · with things and symbols
- inside rules · inside fog
- making something new · keeping something alive
- alone · in a group

Faculties and areas of work are the **output** of the engine, never the question
put to the student. This is the point of D2: a 15-year-old cannot answer "which
faculty", and cannot honestly answer "what do you value in work" either — both
are abstractions. They can answer "which of these two is more like me" when both
are concrete.

### Rules

1. **The engine reports observations, never types.** Never "you are an
   Investigator". Only "you picked the one where the result lands the same
   evening, twice". Personality typing is a claim we cannot support, and this
   product's ethic is that we do not assert what we do not know — the same rule
   that keeps a countdown off an unconfirmed date.
2. **The first conclusion comes after the third pair, not the eighth.** A
   confused student will not reach the eighth. Three pairs is enough to say
   something honest.
3. **"I don't get it" is a first-class answer.** We rephrase in plainer words and
   **do not count it as a signal**. This is the button nobody builds and the one
   our student needs most. Recording it also tells us which beats are badly
   written.
4. **A student may stop at any point** and the thread continues from whatever it
   has. Unknown facts never exclude — the catalog's rule, applied here.

### Storage — migration `0031`

One table. `user_id · beat_id · reaction ('picked' | 'passed' | 'unclear') ·
created_at`. RLS "own rows only", matching every other student table. One row per
beat *shown*, so "neither" is two `passed` rows and is distinguishable from a
pair never seen.

Add the expected columns to `scripts/check-schema.ts` in the same commit, per the
standing rule.

---

## 5. The thread

`lib/data/thread.ts` — pure, ordered, testable:

```
thread(facts) -> { stage, said, next: { label, href }, why }
```

### The seven stations

| # | Station | The student's own question | Reached when — and from which stored fact |
|---|---|---|---|
| 1 | `sense` | who am I | ≥3 reaction pairs answered — `student_reactions` (§4) |
| 2 | `look` | what is this work actually like | a `work:` pick — `planner_path` |
| 3 | `try` | is it really for me | an `opportunity_intents` row for a try (§5, "station 3") |
| 4 | `study` | what do I have to study for it | a `major:` pick — `planner_path` |
| 5 | `where` | where do they teach it, and what does it cost | a `place:` pick — `planner_path` |
| 6 | `act` | what do I do now, at my age | an `opportunity_intents` row with `status` past `planning` |
| 7 | `keep` | am I still moving | the plan is moving and nothing is overdue |

**Every station is reached by a fact we already store**, which is what lets the
stage stay derived rather than saved. "Opened the page" is deliberately not a
condition: per-student page reads are not recorded (`page_views` is the anonymous
traffic table and must stay that way — see the `cleanPath` privacy boundary), and
recording them to drive this would be a new tracking system built for a progress
bar. Taking something onto the plan is the observable act, and it is already the
guide→plan join.

### Rules, inherited from `nextMove` and kept

- **Exactly one next move.** A list of suggestions is the student's confusion
  handed back with our name on it.
- **Every move says why.** An instruction is not a reason, and the missing reason
  is the whole of "there is no accompaniment".
- **It never invents a number.** Where we have nothing honest, the copy carries
  no figure.
- **What has already gone wrong outranks everything**, and only a closed or near
  date may use the warning tone.

### `nextMove` is absorbed, not duplicated

`next-move.ts` becomes the planner's rendering of this same ladder. One ladder,
two places it is shown (the companion everywhere, the card in the planner).
Keeping two would be two sources of truth about the same student — the rule this
codebase applies everywhere else (`movePlannerItem` dispatching on origin; no
`kind` column on `planner_path`).

Existing `nextMove` unit tests must keep passing; the function keeps its exported
signature and delegates.

### Station 3 is never empty

Today, 29 of 35 areas have no simulation, so a station that only offered
simulations would break for most students. It has a ladder, taken in order:

1. an employer job simulation (`try-it.ts`), when one honestly exists;
2. a free course from the catalog in that field;
3. a competition or olympiad they can actually enter;
4. "find one person who does this and ask them one question" — with what to ask.

`try-it.ts`'s own rule stands unchanged: **no simulation is invented to fill a
gap.** Absence over a wrong claim. The ladder is how the *station* stays whole
without the *registry* lying.

---

## 6. Majors — step 2 of the guide

### Placement

The guide's order becomes:

```
1 kinds of work → 2 what you'd study → 3 the countries → 4 the cities → 5 from home
```

The major sits between "what would I do" and "where would I learn it", because
**the major is what you actually apply to.** This renumbers existing steps 2–4 in
`lib/data/guide-sections.ts`; step numbers do not appear in URLs, so no redirects
are needed, but the index counts, the "next step" footer and the sitemap all read
that registry and follow automatically.

### Routes

```
/guide/majors             list (in a (list) route group, so the loading
                          boundary does not reach the subject pages —
                          see the 200-instead-of-404 lesson in CLAUDE.md)
/guide/majors/[major]     the subject page
```

Page shape follows every other subject page: `ForYou` → `PageContents` → two to
five `GuidePart`s, parts declared as one array and read twice.

### The record

`lib/data/majors.ts`, ~50 entries:

| Field | Why it exists |
|---|---|
| `id`, `name` | identity; the id is the URL |
| `alsoCalled[]` | **"Computer Science, also called informatics, also called CS, and called applied mathematics at half the universities in this region."** Without this a student cannot tell that three names are one thing. Nobody writes this down. |
| `whatItActuallyIs` | one sentence, no jargon |
| `firstYear` | **what the first year is really made of.** Not "you will study the foundations" — "the first year is mathematics, and a lot of people leave after it." |
| `catch` | mandatory. Same rule as areas and cities: a layer with no catch reads as a brochure. |
| `notForYou` | mandatory |
| `schoolSubjects[]` | **the only thing on the page that can be started today.** |
| `leadsTo[]` | `areaSlug[]` — the join back to work |
| `fields` | `FacultyValue[]` — the join to countries, cities, catalog, spine |
| `hardGate` | honest exclusions ("without strong mathematics this door is shut") |

### Rules, test-enforced

- **No prices, no salaries, no rankings** — the same regex test that guards
  `world.ts`. Figures rot within a year; shape does not.
- `catch` and `notForYou` are mandatory.
- **No URLs.** The catalog owns links, because `test:links` is what keeps them
  alive.
- **Every major leads to at least one area of work that exists**, and **every
  area of work is reachable from at least one major.** Either gap breaks the
  chain silently, which is the class of bug that produced the duplicate-country
  spine failure.
- `alsoCalled` is required wherever the name is not self-evident.

### A major is a plan pick, and that needs no migration

`planner_path` has **no `kind` column** — a pick's kind is the prefix of its
`ref` (`place:germany`). So `major:computer-science` is storable the day the
registry exists. Three consequences, all of them the existing design working as
intended:

- `PickKind` gains `"major"`; `pickHref` gains one `case` returning
  `/guide/majors/${id}`. **The server action keeps computing the href and
  ignoring the caller's** — a server action is a public HTTP endpoint, and a
  client-supplied path would let anyone store `/admin` under the label
  "Computer Science". The existing test that asserts `pickHref` can only produce
  `/guide/…` covers the new case for free.
- `AddToPlan` works on a major page with no change beyond the new kind.
- `YourPicks` groups by the guide's step numbers, so the new group appears from
  the registry renumbering alone.

### The spine gains a stop

`lib/data/spine.ts` walks field → work → country → city today. The major becomes
a stop between work and country. Its four existing rules carry over unchanged,
including the one learned the hard way: **a stop's identity is its id, never its
printed name.**

This is the point at which "everything is connected" stops being an intention and
becomes a property a test can assert.

### Cost, stated plainly

Fifty full pages is roughly **half the work of release 1** and is what determines
the timeline. It is being done in full because a partial layer walks a student
into an empty room, and the student most likely to hit the empty room is the one
with the least common interest — exactly who we exist for.

---

## 7. Changes to what already ships

### Simulations

- Reachable from the companion at station 3, from the major page ("try it before
  you study it for four years"), and from the plan as a dated thing to do this
  weekend.
- The path to the J.P. Morgan simulation becomes **two clicks instead of six**.
  The rule that the catalog owns the outbound link is kept; the catalog page must
  be openable with the employer named, so the student is not dropped into a
  platform search with no instructions.
- Coverage stays honest at 6/35 for now; station 3's ladder (§5) is what keeps
  the experience whole. Widening the registry is separate content work.

### The planner

- Detailed help is not a new block of prose. It is the companion being present
  here too, saying where the student is and what is next.
- The four starting points in `EmptyPlanner` stop vanishing forever; they become
  stations of the thread, reachable whenever that station is the current one.
- The three lenses, the board's optimistic move, `dueISO`-null-unless-confirmed
  and every other release-4 rule are untouched.

### Onboarding

- The free-text "What major do you want to study?" becomes a choice from the
  registry **plus "I don't know", which is a valid answer** and routes into the
  thread rather than into a dead end.
- The full analysis questionnaire stays opt-in. No mandatory intake gate is
  re-added.

---

## 8. Design and motion

Implementation runs through the `impeccable` skill. The repository's constraints
are not negotiable and are listed here so the plan can be checked against them:

- `transform` and `opacity` only. No animated `filter: blur` anywhere.
- `MotionSafe` is mounted **inside a component that already imports framer**,
  never in a shell — hoisting it drags framer into server-rendered route bundles.
- 11px type floor; `cn` for class merging; `focus-visible:focus-ring`; no `!`
  utility escapes; `bg-cta text-cta-ink` for filled primaries, never `bg-ink`.
- Width buys columns, never line length. Long-form prose keeps its own `ch` cap,
  and the cap is set by measuring real characters, not by reading `ch` as
  characters.
- **No entrance animation on the companion's utterances.**

One new animation, and it carries information: **the chosen card of a pair moves
forward while the other fades.** It is the one place where motion says "your
choice was recorded". Reduced motion drops the movement and keeps the crossfade.

---

## 9. Testing

Added to `scripts/test-engine.ts` (the deterministic core, in CI):

| What | Assertion |
|---|---|
| `thread()` | one move; every move has a `why`; ordering (what went wrong outranks what is next); no invented numbers; every station reachable |
| reaction scoring | pure and stable; `unclear` contributes no signal; a conclusion is available at three pairs |
| majors registry | `catch`/`notForYou` present; no prices, salaries or rankings; no URLs; every major → ≥1 real area; **every area ← ≥1 major** |
| spine | a major's chain leads back to the field's areas; ids compared, never names |
| **the companion does not repeat** | walking a generated set of fact-states (every station, plus the transitions between adjacent ones), no two consecutive utterances are identical |
| **bundle discipline** | the companion imports none of `careers` / `key-dates` / `spine` / `world` at runtime |
| `nextMove` | existing tests keep passing against the delegating implementation |

Gate, unchanged: `npm run build` · `node --import tsx scripts/test-session-checks.ts` · `npm run test:unit`.
After the migration: `npm run db:check`, and add the new table's columns to
`scripts/check-schema.ts` in the same commit.

---

## 10. Scope of release 1, and what is deliberately out

**In:** the companion (rail + dock, all six rules); `thread.ts` with seven
stations; the reaction engine with ~24 beats, migration `0031`, and a conclusion
at three pairs; the majors layer in full (~50 entries, list + subject pages,
spine stop, guide renumbering); station 3's ladder and the two-click route to a
simulation; the planner and onboarding changes in §7.

**Out, deliberately:**
- Widening simulation coverage beyond the 6 areas that honestly have one.
- A conversational companion that answers free-text questions. It is a real
  option and it changes the cost structure (model calls per student); it is not
  part of this release.
- Any change to the admission report, partners, traffic, or the analysis
  pipeline.
- Making the guide statically cacheable. Still an owner call, still recorded as
  not-fixed-deliberately in CLAUDE.md.

**The rule this release is measured against**, from the backlog: *a structural
release needs one visible consequence shipped with it, or it reads as nothing.*
The visible consequence here is that the owner can walk the whole circle himself
— arrive knowing nothing, react to two concrete things, be told something true
about himself, read a kind of work, try it, see what to study, see where, and put
one real thing on a plan — without ever being asked a question he cannot answer.

---

## 11. Open risks

1. **The companion becomes noise on a phone.** Most of our students are on one.
   Mitigation: one 44px line, never covering content, dismissible. If it cannot
   be made to feel quiet, the mobile form is wrong and should be redesigned
   rather than shrunk.
2. **Fifty majors is a lot of prose to keep honest.** Same class of maintenance
   as `world.ts` and `study-destinations.ts`. `firstYear` and `hardGate` are the
   fields most likely to rot; they get the same yearly-pass note as
   `englishTaught` and the post-study work rules.
3. **The reaction engine could feel like a personality test**, which would be a
   claim we cannot support. Rule 1 of §4 is the guard, and it is a copy
   discipline, not a code one — it needs review at the writing stage, not just a
   unit test.
4. **Renumbering the guide's steps touches four surfaces.** They all read one
   registry, which is why this is safe; the unit test that asserts config, legacy
   list and registry agree must be extended to cover the new step.
