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
| 22 (hero) | **One layout bug, not three complaints.** The dead space, the gutter and the too-small card were all the same 193px of accumulated slack. See §5.8 — and note the two further bugs it uncovered in `RotatingHeadline`. |

---

## 4. What is left, in detail

Ordered by what unblocks the most. Each entry states the ask, what is already
known, the files, and the decision needed.

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

### #9 — top universities per country and city — DONE 2026-08-11

Shipped as [lib/data/place-universities.ts](../lib/data/place-universities.ts):
**76 institutions across all 17 destinations, covering all 34 hubs**, rendered as a
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

---

## 6. Verification

```bash
npm run build            # the gate — never while `npm run dev` is running
npm run test:unit        # 124 tests (113 + 4 interaction invariants §5.9 + 7 for #9)
npx tsc --noEmit
npm run lint
npm run test:guide-links # 28/28 official sources reachable
node --import tsx scripts/test-session-checks.ts
```

CI runs `npm run build`, the session checks, then `npm run test:unit`, without
secrets. `npm run test:analyze` is the only one needing a real
`ANTHROPIC_API_KEY`.
