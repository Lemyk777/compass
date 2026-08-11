# The 23-item backlog — state, findings, and what to do next

Written 2026-08-11 as a handoff. The founder gave a 23-item fix/redesign list on
2026-08-10. Thirteen items are done and merged into `develop`; this file carries
everything a fresh session needs to finish the rest without re-deriving it.

Read [CLAUDE.md](../CLAUDE.md) first — it holds the product rules. This file
holds only what is **specific to this backlog** and not already written there.

---

## 1. Where the repository stands

| | |
|---|---|
| `develop` | pushed through `8c46c3e` |
| PR [#99](https://github.com/Lemyk777/compass/pull/99) | `develop` → `main`, OPEN, MERGEABLE — **the founder merges it, not us** |
| `ad8eaec` | committed **locally, deliberately not pushed** |

**Why `ad8eaec` is unpushed, and what to do about it.** PR #99 is open and the
founder is going to review and merge it. Pushing `develop` adds this commit to
that PR silently, which changes what a reviewer is looking at after they started
looking. Either push it deliberately (`git push origin develop`) and say so, or
leave it for the release after. Do not push it as a side effect of other work.

**Before any push:** `npm run build` is the gate, and it must not run while
`npm run dev` is up — they share `.next/` and the production build replaces
chunks the dev server still references. Stop the dev server first.

---

## 2. Owner decisions already taken — do not re-litigate

- **#17 planner = FULL scope.** Calendar + kanban board + mind maps, as a third
  top-level section beside Opportunities and Guide, interacting with both the
  catalog and the guide. Needs a DB migration.
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

---

## 4. What is left, in detail

Ordered by what unblocks the most. Each entry states the ask, what is already
known, the files, and the decision needed.

### #22 — the landing page (start here)

**The single most useful finding of the session:** the rotating-headline bug and
the "too much gutter, the gap between the columns is too big" complaint are
**the same problem**, and fixing the layout fixes both.

Measured at 1440×900 on `/`:

| | |
|---|---|
| left column | 560px (`lg:grid-cols-[minmax(0,560px)_1fr]`) |
| font size | 60px |
| longest phrase "Then make your move." on one line | **616px** |

The phrase does not fit. So the invisible sizer in
[RotatingHeadline.tsx](../components/marketing/RotatingHeadline.tsx) wraps to two
lines and reserves 125px, while the phrase itself — absolutely positioned, out of
that flow — renders on one 62px line. The ~63px difference is the ragged empty
space the founder reported.

**Two fixes were tried and reverted; do not repeat them:**

1. `whitespace-nowrap` on the box → the line becomes 616px inside a 560px
   column, and the hero has `overflow-hidden`, so the last word is clipped.
2. Forcing sizer and phrase to share a measure (`block w-full`,
   `[text-wrap:wrap]`), and separately removing `text-balance` from the `<h1>` →
   neither changed the measurement. The sizer still came back 440px / 2.2 lines.

`RotatingHeadline.tsx` is currently **byte-identical to HEAD** — the revert was
clean. Start from a layout change, not from a patch to the component:

- Widen the left column (≈640–680px) and reduce the outer gutters. That makes
  the phrases fit, closes the gap between the columns, and gives the right
  column the room it needs to become bigger and more animated — which is three
  of the founder's asks in one move.
- Or shorten the phrases to ≈17 characters. Cheap, but "Then close the gap."
  has to be rewritten, and it is the hero's voice — the founder's call.

**Still open in #22 beyond the hero:**

- The right column ("open right now") should be bigger, more creative, animated.
  It is `OpportunityPreview`, a **server component** rendering four real catalog
  rows as HTML with no JS. Keep that property — see §5.7.
- Make the sample report noticeably more prominent. UI/UX rule that applies: one
  primary CTA per view, the secondary visually subordinate but *findable*.
- **Do not add the progress-tracker copy yet.** The founder asked for it, but
  #17 does not exist. Advertising a feature that is not built is exactly what
  this product's own rules forbid. This half of #22 is blocked on #17.

### #23 — animations, interactions, and the button system

Site-wide. Nothing started. Known constraints:

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

### #9 — top universities per country and city

**There is a trap.** `scripts/test-engine.ts` forbids `top \d+`, `ranked #N`,
prices and salaries in the guide's data, by regex, because figures rot within a
year. Writing "top 5 universities" fails the build.

The rule bans **rankings**, not university names. Implement as a structured
field — `{ name, city, knownFor[], englishTaught }` — phrased as "who is
actually named for this subject here", never with a number or a position. That
keeps the rule and satisfies the ask.

### #14 — Malaysia and Australia

Two full `StudyDestination` entries plus their cities. Every field is mandatory
and test-enforced: trade-offs must outnumber strengths, `notForYou` is required,
no prices or rankings, and `sources` must be **official bodies only** (a test
rejects rankings sites, Wikipedia and blogs, and requires https).
`npm run test:guide-links` then checks they answer; a 403/429/412 is a bot wall
and passes, a **timeout does not ship**.

Each new city must be added to some country's `hubs` — a test asserts every hub
is claimed by exactly one destination.

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

### #17 — the planner (largest item)

Full scope, per the founder. A third top-level section beside Opportunities and
Guide. Deadlines from `opportunity_intents` on a calendar, a board of goals with
statuses and notes, free mind maps of a student's own paths, interacting with
both the catalog and the guide. Needs a migration.

Note there is prior art to reuse and not duplicate: `lib/data/roadmap.ts`
already turns a graduation year into date-anchored phases, and
`lib/data/intents.ts` already records "I'm doing this" plus when the student will
start — which is, per the product's own note, the **only** behavioural metric
that matters. The planner should read those, not invent a parallel store.

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

---

## 6. Verification

```bash
npm run build            # the gate — never while `npm run dev` is running
npm run test:unit        # 113 tests as of ad8eaec
npx tsc --noEmit
npm run lint
npm run test:guide-links # 28/28 official sources reachable
node --import tsx scripts/test-session-checks.ts
```

CI runs `npm run build`, the session checks, then `npm run test:unit`, without
secrets. `npm run test:analyze` is the only one needing a real
`ANTHROPIC_API_KEY`.
