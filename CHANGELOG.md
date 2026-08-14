# Changelog

What changed in production, in plain English, newest first.

Two things this is **not**. It is not `git log` — a hundred commit subjects is a
record of typing, not of what the product does differently. And it is not a
marketing page: things that were removed, and things that turned out to be
broken, are listed as plainly as things that were added, because the reason to
look something up here is usually that something surprised you.

An entry answers three questions: what a student notices, what changed
underneath, and what anyone working on the code now has to know. Anything with a
manual step — a migration to apply, an environment variable to set — says so in
bold, because that is the class of thing that silently does not happen.

**Format.** One heading per release, meaning one merge of `develop` into `main`,
dated. Releases before 2026-08-07 are not written up: this file starts here
rather than reconstructing months of history after the fact, which would be
guessing. For anything earlier, `git log` and the docs in `docs/` are the
record.

---

## 2026-08-14 — The plan is the guide, answered

The section this release rebuilds had already been rebuilt once, three days
earlier, and the founder's verdict on that was "almost nothing changed". He was
right. That release shipped a view registry, a stepped agenda and typed map
nodes — all necessary, none of it visible. **A structural release needs one
thing a person can see shipped with it, or it reads as no work at all.** That is
the finding this entry exists to record.

### What a student notices

- **The plan stopped being three pages.** "What's next", the board and the maps
  were three addresses behind a control shaped like a tab strip, so switching
  view reloaded the section and threw away whichever month you had stepped to.
  They are three lenses over one screen now: switching is instant, the period
  you were looking at survives it, and the address still names the view so a
  link to your board still opens your board.
- **Every guide page can be put on the plan.** A kind of work, a country, a
  city, a route from home — one quiet control in the margin of the page you were
  reading. The plan shows them back grouped under the guide's own step numbers,
  and every chip opens where you read it. Before this, the plan could send you
  into the guide and nothing could come back: you could read every word about
  Germany and there was no way to say "this one is mine".
- **There is one sentence at the top of the plan that tells you what to do next,
  and why.** Always exactly one, at every stage — not a list, and not only on
  your first day. It runs from what has already gone wrong, to the question you
  are furthest from answering, to what is closest to happening. If we have no
  honest number to give you, the sentence does not have one in it.
- **The mind map says what it is acting on.** The bar was ten words in a row —
  Add inside, Add after, Indent, Outdent, Up, Down — with nothing on screen
  saying which branch any of them would touch. It now names the branch above the
  verbs, the two "add"s became one control whose choice is a sentence, and
  indent/outdent are arrows labelled with what they do. And your first map is no
  longer blank: it can be drawn from the countries you already picked, with the
  cities nested inside the right one.
- **You can try the work before choosing a degree.** An area of work now names
  the free employer-built simulations that let you do the actual job for an
  afternoon — J.P. Morgan on money and markets, three on data and AI. We build
  none of these and we host none of them; we point at the platform that does.
  Where there is no honest answer — nobody runs a simulation of treating
  patients — the page says nothing rather than offering a near miss.
- **Moving a card on the board is instant**, and the card visibly travels
  between columns. It used to sit still until a server round trip finished.

### One bug this found

A country appeared **twice** in a field's chain, one city under each. The guide
matched a country by the name printed on a city ("UAE") against the name on the
country profile ("United Arab Emirates"), so it could never recognise itself.
Live since the chain shipped, and invisible to every test that existed —
they all checked properties of the chain and none checked that a country appears
in it once. Found by reading the browser console. "Hong Kong SAR" against "Hong
Kong" was one city away from the same fault.

### Under the hood

- **Migration `0030_planner_path.sql` — already applied** (`npm run db:check`
  reports 32/32). It holds what a student claimed out of the guide. There is no
  `kind` column: a pick's kind is the prefix of its ref, the same argument that
  keeps a map node's type out of the database. The server action computes the
  link and ignores the caller's, because a server action is a public HTTP
  endpoint and a supplied path would let anyone file `/admin` under the label
  "Germany".
- `/planner/board` and `/planner/maps` are enumerated **308s**, not deletions.
  `/planner/maps/<id>` stays a real page: one map is a document a student can
  send to someone.
- The card that moves between columns needed a data-flow change rather than an
  animation. A view transition whose promise waits on a server round trip
  freezes the document — measured at 2130ms here once already — so the move now
  lands in the client first and the server reconciles behind it.
- **192 unit tests**, up from 175. `/planner` is 105 kB carrying all three
  lenses, down from 110 kB carrying one.
- No new environment variable.

### What this deliberately did not do

The owner's call was that the plan gets **no path of stages** — no numbered
progression of its own. The alternative was a five-stop spine mirroring the
guide, and the concern against going without it is that all the accompaniment
then rests on that single next-move sentence. It is recorded in
[PLANNER_PLAN.md](docs/PLANNER_PLAN.md) §"Release 4" so it can be revisited
against evidence rather than re-argued. Majors still do not exist as a layer.

---

## 2026-08-07 — The guide says three times as much

### What a student notices

- **Every area of work now answers the questions you actually have.** It was a
  title, one line and a list of job titles. It now says what a working week is
  really like, what the work costs you, what people reliably get wrong about it,
  the route in as three stages (school → what you study → how the first years
  actually go), and the cheapest way to test whether you like it — this month,
  from home, for nothing.
- **Every city says what living there is like**, not only what industry sits
  there: housing, transport, weather, how the money works, what language you
  need for the job as distinct from the life, and who should pick somewhere else.
- **Every country now says when things actually happen.** Missing a deadline is
  the one way a strong applicant loses a place that has nothing to do with how
  good they are, so each profile states the cycle, how an application is really
  read there, what studying there is like once you arrive, and what applicants
  from this region specifically get wrong.
- **Each route you can take from home** states what it costs in time and what
  you can show for it afterwards.
- **Areas of work link to their neighbours**, for the student who is close but
  not quite.

In total the guide's writing went from about 7,100 words to about 24,300.

### The honesty rules this extended

- **"The catch" is now mandatory on areas of work.** Every city has stated its
  downside since the map was written; areas of work did not, which made the
  careers layer the one place in the product that could read as a brochure. A
  test enforces it now, exactly as it does for cities.
- **"No prices, no rankings" is now checked automatically**, not just written
  down. Money is described in shape — "housing is the whole problem", "income is
  untaxed but residence is tied to your employer" — because figures rot within a
  year and shape does not.
- **"Who should look elsewhere" is required** on cities and on from-home routes.
  Without it, a description is a recommendation.

### Under the hood

- The interest quiz is a client component and imported the careers registry for
  eight short labels. Tripling that file would have shipped every paragraph to
  the browser, so the titles moved to a tiny module of their own
  ([lib/data/career-titles.ts](lib/data/career-titles.ts)), kept in step by a
  test. **Bundle sizes are unchanged** — `/guide/work/[area]` is still 1.09 kB.
- No database migration. No new environment variable.

---

## 2026-08-07 — The screen gets used

### What a student notices

- **The page fills the window.** The content column was 1024px wide whatever the
  screen was, so a 1920px display spent about 900px on empty margin — and
  everything the page had to say came out as scrolling instead. The column now
  grows to 1440px, and the gutters grow with it.
- **Much less scrolling for the same content.** On a 1900px screen the cities
  step went from 4.5 screens of scroll to 2.0; the countries step fits in 1.3.
  Nothing was removed to get there.
- **Country, city and area pages have a side column.** Where to go next — the
  cities inside a country, the country a city sits in, what to compare it with —
  moved out of the bottom of the page and into the space beside it, where it
  stays in view as you read.
- **The step heading and the field filter share a row** instead of taking one
  each.
- **Bigger tap targets.** Two controls added in the last release were 16px tall
  against a 44px minimum. The country name in the cities list is now itself the
  link to that country's profile, which is both a larger target and the more
  obvious one.

### Under the hood

- One container component ([components/ui/Shell.tsx](components/ui/Shell.tsx))
  replaces a `max-w-5xl` that was set separately in three files.
- Long-form text keeps its own cap (`max-w-[60ch]`) independent of the
  container. Widening without it took the country profile to 131 characters per
  line against a readable measure of 60–75; it now sits at 72.

### For anyone working on this code

- The rule, and the two ways it was got wrong while writing it, are in the
  "Layout: width buys columns, never line length" section of
  [CLAUDE.md](CLAUDE.md). Short version: answer extra width with more columns or
  a rail, never with longer lines; and apply density at the level that actually
  repeats — making the city *cards* 4-up saved 2%, flowing the *country groups*
  into columns saved 54%.
- No database migration. No new environment variable.

---

## 2026-08-07 — The guide becomes a section

### What a student notices

- **Every part of the guide has its own address.** It was one page holding four
  steps: finding anything meant scrolling past 33 areas of work, 22 cities and
  11 country profiles. There are now five list pages and 66 subject pages, so
  `/guide/cities/berlin` is a link you can send to a parent.
- **Cities sit inside countries now.** The guide used to offer Berlin as step 2
  and Germany as step 3, which is a zoom outwards. Countries come first, the
  city list is grouped by country, and a city's trail reads Guide → Germany →
  Berlin. Cities in countries we don't profile — Almaty, Astana, Tashkent,
  Tbilisi among them — keep their place in the list rather than disappearing.
- **"Compare it with" actually compares.** It was a row of chips that navigated
  to the other country, replacing the one you were reading. It now opens both
  side by side on the same axes: money, admissions, what happens after you
  graduate, and who each one is wrong for.
- **Detail opens as a page, not a pop-up.** Opening a city or a sphere of work
  used to be a modal with no URL — you could not bookmark it, and the Back
  button closed it instead of leaving the page. Back now returns to the list at
  the same scroll position.
- **The field filter survives navigation.** It lives in the URL (`?f=law`), so
  moving between steps or into a country profile no longer silently widens the
  guide back to everything.
- **The filter is one line instead of a wall.** Eight field chips took 412px of
  a 375px-wide phone, which pushed the first city to 888px on an 812px screen:
  you opened "Cities" and saw no cities. Now 46px, with the chips one tap away.
- **"You don't have to move" is a real step.** It was a closing paragraph under
  three long sections — the most actionable thing the guide says, in its least
  visible position. Six routes now, each with its honest catch and a first move
  small enough to do this week.
- **Opening a card morphs it into the page it opens**, rather than cutting.

### Under the hood

- Country profiles moved from `/guide/[place]` to `/guide/places/[place]`. A
  dynamic segment in the root of the section meant every sub-route added later
  was a name that had to not-be-a-country. **Old links still work** — the eleven
  old paths are enumerated 308s in `next.config.mjs`, which runs before routing
  and so is a true redirect regardless of how the page streams. With the old
  route deleted, an unknown `/guide/anything` is a real 404 rather than a 200
  serving a "not found" page.
- The guide is server-rendered except two client islands (the field chips and
  the areas list, which the optional values refine reorders from
  `localStorage`). `/guide` was 22.3 kB of route JS and 124 kB first load; the
  heaviest page is now 5.6 kB / 102 kB and the subject pages are 1.1 kB /
  97.7 kB.
- One session read per request instead of three. The layout, the page and the
  filter's default each called `getSession()`, so a single view cost three
  `auth.getUser()` round trips and three `profiles` reads before drawing
  anything.
- `app/guide/loading.tsx` — each step is now a server round trip, so there is a
  skeleton where before there was nothing happening.

### Fixed

- **`prefers-reduced-motion` was only half honoured.** The global guard zeroed
  animation *durations* but not *delays*. Any entrance using `fill-mode: both`
  therefore held its content invisible for the length of its delay — for a
  reader who had explicitly asked for less motion, which is exactly what the
  guard exists to prevent. It now zeroes delays too, which affects every
  animation in the app, not only the guide's.

### For anyone working on this code

- Read the "The guide is a section of routes" section of
  [CLAUDE.md](CLAUDE.md) before touching it. The two rules easiest to break by
  accident: ask for the reader through `guideView()`, never `getSession()`
  directly; and do not add an entrance animation that starts at `opacity: 0` —
  it makes the page's content depend on an animation finishing, and it fights
  the card→page morph.
- Seven new unit tests cover the invariants that have no visible failure mode:
  career-area slug uniqueness, view-transition names being valid and distinct,
  `?f=` parsing (where "not stated" and "explicitly everything" must stay
  different), the step chain, and the rule that every from-home route states a
  catch and a first move.
- No database migration. No new environment variable.
