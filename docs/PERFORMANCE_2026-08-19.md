# Whole-tree performance and correctness pass — 2026-08-19

A sweep over every module in `app/`, `components/`, `lib/` and `scripts/`
(≈75,000 lines), measuring before changing anything. Eight optimisations and
three defects, each with a number attached and a test behind it.

**Read §1 first.** It is the finding that explains all the others, and it is the
one a future session is most likely to undo by accident.

---

## 1. The lesson: nothing here was an algorithm

Not one measured bottleneck was a loop, a query shape, or a complexity class.
Every one was **a formatter or a parser rebuilding an answer that could not
change.**

The worst of them, by two orders of magnitude:

```ts
// lib/data/opportunity-format.ts — as it stood
export function formatDate(iso: string): string {
  return new Date(iso + "T00:00:00Z").toLocaleDateString("en-US", { … });
}
```

`toLocaleDateString(locale, options)` is *specified* as constructing an
`Intl.DateTimeFormat`, formatting, and throwing the formatter away. Measured:
**90.76 µs a call.** It runs once per opportunity card — 3.47 ms for the forty
on a screen, paid again on every re-render, so it was charged to every keystroke
in the search box.

**Why nobody had found it.** This repo reasons carefully about bundle size and
about `O(n)` shape, and has tests for both. Nothing looked at *constant factors*,
because a 172-row catalog makes every algorithm look free — which is exactly what
hides a 90 µs constant.

**The rule that follows.** Before optimising anything in this codebase,
benchmark the **primitives** over the real registries: `Intl.*`, `Date.parse`,
`new Date()`, `toISOString()`, regex parses. Reason about the constant, not the
row count. And never call a `toLocale*` method with an options object inside a
loop or a render — build the formatter once at module level.

---

## 2. What was measured, and what it is now

Every figure is `ms/op` or `µs/op` over the real catalog and registries, taken
on the same machine in the same session, warm.

| Path | Before | After | Factor |
| --- | ---: | ---: | ---: |
| `formatDate` — once per card | 90.76 µs | 2.08 µs | **44×** |
| …the forty cards on one screen | 3472 µs | 84 µs | **41×** |
| `daysBetween` | 2.26 µs | 0.46 µs | 4.9× |
| `buildExtracurriculars` (172 rows) | 0.583 ms | 0.290 ms | 2.0× |
| One keystroke: filter + facets | 0.865 ms | 0.282 ms | 3.1× |
| `universitiesForHub` × 38 hubs | 94.67 µs | 1.20 µs | **79×** |
| `destinationForHub` × 38 hubs | 3.86 µs | 1.19 µs | 3.2× |
| `spineForFaculty` × 8 fields | 390 µs | 0.25 µs | **1560×** |
| `/admin/traffic` summarise, 50k rows | 693 ms | 224 ms | 3.1× |

Route bundles are unchanged; `/opportunities` stays at 191 kB and
`/dashboard/opportunities` moved 184 → 185 kB, which is `useDeferredValue` and
two memo hooks. Shared-by-all is still 87.9 kB.

### The eight changes

1. **`formatDate` and `monthYear`** (`opportunity-format.ts`, `roadmap.ts`) —
   one module-level `Intl.DateTimeFormat` instead of one per call. Output is
   identical by specification, and asserted over every date the product renders.
2. **`daysBetween`** — a plain `YYYY-MM-DD` needs no `Date`; the three fields
   are at fixed offsets. Anything else falls through to the old path, **including
   the `NaN`** a caller has always received for a string this cannot read. That
   is a contract: turning it into a number would hide a bad row instead of
   letting it render as "Dates TBA".
3. **`gateFor`** (`key-dates.ts`) — `parseEligibility` runs eight regexes over
   static catalog prose and was doing it for all 172 rows on every request (35%
   of the matcher). Now cached in a **WeakMap keyed on the row**, not on the
   sentence: the second input to this cache is a database, and keying on the
   string would grow a table nothing empties. `parseEligibility` itself stays
   pure and uncached — it is the tested contract and `lib/discovery/screen.ts`
   calls it on strings with no row behind them.
4. **`buildExtracurriculars`** — five chained `map`/`filter` stages became one
   loop. The stages allocated five arrays plus a wrapper object per row, and
   computed `daysBetween` twice for every survivor.
5. **The search haystack** (`opportunity-filter.ts`) — built once per row into a
   WeakMap, and the query tokenised once per pass instead of once per row. One
   keystroke was rebuilding it seven times per row (the visible list plus six
   faceting passes) — 1,127 array literals, joins and `toLowerCase` calls for an
   input that had not changed.
6. **`useDeferredValue`** in `OpportunitiesView` and `FilterBar` — the input
   stays exact and immediate; the list and the facet counts render at low
   priority. **Not a debounce**: a timer arrives late even when there is time to
   do the work, and needs tuning per device. `activeFilterCount` reads the
   *deferred* filters too, or the page would flip to the browse list one frame
   before the rows for it existed.
7. **Registry indexes** — `destinationForHub` and `universitiesForHub` were
   linear scans rebuilt per call; the latter flattened the whole institution
   registry to keep a handful of rows. Both are maps built once, and the
   registry's own order is preserved because "never ranks them" depends on it.
8. **`spineForFaculty`** memoised over the eight faculties, and `summarize`'s
   `ts()` memoised per row (seven passes were re-parsing one timestamp seven
   times) with the day/hour keys built from UTC fields instead of by slicing
   `toISOString()`.

### Dead code the change exposed

`matchesFilters` became genuinely unreferenced once the query tokenising moved
out of it — the repo's own dead-export scan caught it on the first run. Deleted
rather than propped up with a test written to keep it alive.

---

## 3. Three defects, all found by looking rather than by a failure

None of these had ever been reported. Each is now pinned by a test that fails on
the old code.

### 3.1 `subtreeHeight` recursed into cycles — a real stack overflow

`app/planner/maps/actions.ts` held two sibling helpers. `depthOf` was written
with a visited set and a ceiling and was commented "Cycle-safe, same reason
`buildTree` is". `subtreeHeight`, directly below it, recursed into its children
with **neither**.

`buildTree` exists on the stated assumption that this table *can* hold a cycle
(CLAUDE.md: a cycle is "broken, not recursed into"). So the renderer survived
what the action did not. Verified against the shipped code:

```
subtreeHeight (old) on a cycle:      THREW RangeError: Maximum call stack size exceeded
subtreeHeight (old) on a self-loop:  THREW RangeError
subtreeHeight (old) on a 50k chain:  THREW RangeError
```

The third case is not corruption at all — just a long chain. Its only caller is
the **indent** branch of `moveNode`, so the failure was a 500 from a button.

**Fixed by moving it**, not by patching it. `branchDepth` and `branchHeight` now
live in `lib/data/mindmap.ts` beside `canIndent`/`canOutdent`, iterative rather
than recursive, children indexed once. That is the actual root cause: the
function had drifted *because* it lived outside the module that owned the
discipline, and a private helper in a `"use server"` file can never be unit
tested.

### 3.2 A partner link could write events into a student's calendar

`lib/calendar/ics.ts` wrote `` `URL:${c.url}` `` with **no escaping**, while the
same value inside `DESCRIPTION` went through `icsText`. One escaped, one raw, in
adjacent lines — the shape of an oversight rather than a decision.

And the other end was open too. Verified:

```
ACCEPTED  "https://example.com/a\r\nX-EVIL:1"
          stored as: "https://example.com/a\r\nX-EVIL:1"
```

`z.string().trim().url()` **accepts a CR/LF inside a URL** and stores it
verbatim, because the WHATWG parser it calls tolerates them. So an approved
partner could post a link containing
`\r\nEND:VEVENT\r\nBEGIN:VEVENT\r\nSUMMARY:…` and write arbitrary events —
with their own summaries, links and alarms — into the calendar of every student
who downloaded the file.

This matters more than the usual injection because of how partners work here:
trust is granted **once per organisation, not per post**, publishing is instant,
and the safety net is removal. Removal does not reach a file already sitting in
someone's calendar.

Fixed at both ends. `URL:` is a URI value, not TEXT, so a backslash escapes
nothing there — the correct treatment is to **remove** what cannot sit on a
content line, and the partner schema now rejects the same characters on input.

**Writing the test found a second hole**: `icsText` escaped newlines but let
every other control character through, so a tab in a URL reached the
`DESCRIPTION` line intact. Both value types now go through one rule.

### 3.3 A latent ceiling in `visitDurationMs`

`Math.min(...times)` passes one argument per view, and an argument list past
roughly 100,000 throws `RangeError`. **It never threw in production** —
`/admin/traffic` caps its query at 50,000 rows, and 50k spreads fine.

But the safety was a constant in a different file. Raising `MAX_ROWS`, or
calling this exported function from anywhere reading more, turns the dashboard
into a 500 with nothing at the call site to suggest why. A loop has no ceiling,
so the bound stops having to be remembered.

---

## 4. Deliberately not changed

Each of these was measured or read, and left alone on purpose. They are listed
so the next pass does not spend the time again.

- **`/auth/login` and `/auth/signup` are 183 kB** because the Supabase browser
  client is 191 kB raw. Fixing it means moving sign-in to server actions — a
  rewrite of the PKCE and OAuth redirect flow. An owner decision, not a refactor.
- **`/opportunities` is 191 kB, and 123.5 kB raw of that is framer-motion**
  (`MotionCard`, `PromptSwap`, `DirectionSummary`). CLAUDE.md documents those
  motion choices deliberately; removing them is a product call.
- **`/admin` 211 kB and `/admin/traffic` 220 kB** are recharts. Admin-only.
- **`opportunityFacets` still makes six passes** where one would do. After the
  haystack fix it is 0.24 ms and no longer the bottleneck, and a single-pass
  rewrite risks diverging from a faceting rule that several tests pin. Not worth
  it yet; revisit if the catalog grows several-fold.
- **The guide stays `force-dynamic`** — already documented in CLAUDE.md as an
  owner call, with both causes measured.

## 5. Open, and worth an owner's attention

Neither is a bug. Both are facts that will get worse on their own.

- **`lookupAuthMethod` pages through at most 2,000 accounts.** It calls
  `admin.auth.admin.listUsers()` up to ten times at 200 per page to find one
  email, on an endpoint that runs unauthenticated on every failed password login.
  Past 2,000 accounts a Google-only user beyond the cap silently gets the
  confusing error the function exists to prevent, and every failed login already
  costs up to ten service-role round trips. The enumeration hardening itself is
  sound and documented; it is the lookup *method* that does not scale.
- **12 of 172 catalog rows have a confirmed date** (57 are always-open, 103 are
  "Dates TBA"). Date health is otherwise clean — nothing expired, no stale
  estimates, `test:links` reports 171/172 healthy with one bot-walled — but the
  countdown, which is the strongest promise the product makes, currently applies
  to 7% of the catalog, and "closing soon" can offer two rows.

---

## 6. How this was verified

Every optimisation replaced a computation with a remembered answer or a cheaper
route to one. **A cache that returns the wrong row does not throw — it shows a
student someone else's opportunity.** So each guard in `scripts/test-engine.ts`
re-derives the answer the *slow* way, using the code that shipped before, and
asserts the two agree over the real catalog rather than over a fixture.

| Check | Result |
| --- | --- |
| `npm run build` (clean `.next`) | exit 0 |
| `scripts/test-session-checks.ts` | 61 / 61 |
| `npm run test:unit` | **281 / 281** (was 268) |
| `npm run test:onboarding` | 126 / 126 |
| `npm run test:links` | 171 / 172 healthy, 0 broken |
| `next lint`, `tsc --noEmit` | clean |
| Dates formatted | 521 outputs identical |
| Matcher membership | 16,500 rows over 100 profile combinations |
| Search results | 2,016 identical |
| `summarize` output | 96 runs byte-identical to `HEAD` |
| Browser | `/opportunities` and `/demo/opportunities` — dates, facet counts and search correct, no console errors |
