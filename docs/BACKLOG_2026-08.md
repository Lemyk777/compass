# The 23-item backlog — state, findings, and what to do next

The founder gave a 23-item fix/redesign list on 2026-08-10. **Last updated
2026-08-12.** This file carries everything a fresh session needs to finish the
rest without re-deriving it.

Read [CLAUDE.md](../CLAUDE.md) first — it holds the product rules. This file
holds only what is **specific to this backlog** and not already written there.

---

## 1. Where the repository stands

| | |
|---|---|
| `main` and `develop` | **in sync**, everything merged and deployed |
| PRs [#99](https://github.com/Lemyk777/compass/pull/99) · [#100](https://github.com/Lemyk777/compass/pull/100) · [#101](https://github.com/Lemyk777/compass/pull/101) · [#102](https://github.com/Lemyk777/compass/pull/102) | all MERGED |
| Progress | **17 of 23 done, 2 half-done, 4 untouched**, plus **#24 done** 2026-08-13 — see §3 and §4 |
| Unit tests | **156** (`npm run test:unit`) |

### ⚠️ One thing is pending and it is not code

**Migrations `0028_planner.sql` and `0029_planner_maps.sql` have not been
applied.** (`0027` now has been — `npm run db:check` on 2026-08-12 reported only
0028 missing at that point.) Migrations in this project are run by hand in the
Supabase SQL editor. Apply **0028 first**: `0029`'s "Send to plan" writes into
the table 0028 creates. Until 0029 is applied, `/planner/maps` reads as "no
maps" and starting one returns a readable error naming the migration.

Until 0028 is applied:

- the **agenda still works in full** — it is built from `opportunity_intents`,
  the catalog and the roadmap, none of which are new;
- **the student's own tasks do not save.** `planner_items` does not exist, so
  the board shows only committed opportunities and "Add" returns a readable
  error naming the migration rather than a 500. The loader reads the missing
  table as "no tasks of your own" instead of throwing.
- **and nothing can be moved to "In progress"**, because that writes
  `status = 'doing'`, which the old CHECK constraint rejects. Same treatment: a
  named error, not a crash.

Run it, then `npm run db:check`.

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
| 17 | **The planner, COMPLETE** — `/planner` (agenda) + `/planner/board` + `/planner/maps`. Delivered in two releases; both shipped. See §5.12 and [PLANNER_PLAN.md](PLANNER_PLAN.md). |

**Not on the founder's list, added because it was needed:**

| | |
|---|---|
| NAO Cup | First **pinned** entry — a debate tournament in Shymkent, region-scoped to KZ, auto-expiring the day after the event. |
| Pinning | `Competition.pinned` — the one editorial override in an otherwise derived ordering. Reorders only; never bypasses eligibility. See §5.10. |
| Admin quick-add | Post an opportunity from the top of the Opportunities list, writing the same live row a partner post writes. See §5.10. |
| Georgia's sources | `npm run test:links`' sibling gate was **red and nobody knew**. See §5.11. |

---

## 4. What is left, in detail

**Four untouched (#11, #14, #15, #16), two half-done (#22, #23).** By item count
that is ~78% complete; by effort it is nearer two thirds, because **#16** (the
coherent spine) is now the largest thing left, and it could not have been started
earlier because it depends on #9 and #14.

Suggested order, and the reason for it:

**#24 is done** — it was taken first because the founder asked for it directly
on 2026-08-13, and it turned out to be the natural way in to the animation half
of #23: the open question there was always *which* moment had earned an authored
one, and the answer arrived as a complaint. What is left:

1. **#14** — Malaysia and Australia. Self-contained, and #16 needs it.
2. **#15** — verify the unconfirmed dates. Pure verification, no design decisions,
   and it protects the product's central promise. It is also worth more than it
   was: an unconfirmed date now costs a row its place in the planner's calendar
   as well as its countdown, so every one verified moves a card onto the agenda.
3. **#11** — careers depth and the quiz. Two separable halves: re-tune the weights,
   rewrite the content in the direct tone already chosen.
4. **#16** — the spine. Unblocked by #9, better after #14.
5. The rest of the animation half of **#23**, and then the progress-tracker copy in **#22** —
   **no longer blocked**, because #17 now exists and can honestly be advertised.
6. The planner's **release 2**: mind maps, and the drag-and-drop enhancement over
   the existing move action. See [PLANNER_PLAN.md](PLANNER_PLAN.md) §10.

Each entry below states the ask, what is already known, the files, and the
decision needed.

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

### #22 — the landing page (hero DONE 2026-08-11, rest below)

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

**Still open in #22:**

- **Do not add the progress-tracker copy yet.** The founder asked for it, but
  #17 does not exist. Advertising a feature that is not built is exactly what
  this product's own rules forbid. This half of #22 is blocked on #17.
- Everything below the hero is untouched: the counts band, `HowItWorks`, the
  problem band, the guide cards, the report section. Nobody has audited those
  against the founder's "gutters are too big" complaint at 1440+, and the
  `max-w-6xl` on all of them is the same class of cap that was wrong in the hero
  — 1152px of content inside a 1440px window. Measure before changing: the
  Shell rule is that width buys **columns**, never line length.

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

### #16 — the coherent spine

Connect areas of work → majors → countries → cities → universities and their
majors, and explain the from-home step better. This is the largest structural
item after the planner and is best done **after** #9 and #14, because it needs
the university layer to exist to connect to.

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

**NAO Cup is the first pinned entry** and shows the shape: region-scoped to `KZ`
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

## 6. Verification

```bash
npm run build            # the gate — never while `npm run dev` is running
npm run test:unit        # 127 tests
npx tsc --noEmit
npm run lint
node --import tsx scripts/test-session-checks.ts   # 60 checks
npm run test:guide-links # 27/27 official sources — NOT in CI, run it anyway
npm run db:check         # after applying a migration, and before believing any note about one
```

**CI runs three of these**: `npm run build`, the session checks, then
`npm run test:unit`, without secrets. `npm run test:analyze` is the only one
needing a real `ANTHROPIC_API_KEY`.

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

### Process notes that cost time here

- Commit in logical units, and order them so each one is green on its own.
- `next build` with a throwaway `distDir` rewrites `tsconfig.json` — it injects
  `<thatDir>/types/**/*.ts` into `include` and reformats the file. Revert it.
- The doc you are reading goes stale fastest at the top. §1 claimed an open PR
  and an unpushed commit for a day after both were false.
