# The Planner — design and plan of record

Backlog item **#17**, the largest thing on the founder's 23-item list. A third
top-level section beside Opportunities and the Guide.

Read [CLAUDE.md](../CLAUDE.md) first — it holds the product rules this design is
written against. Read [BACKLOG_2026-08.md](BACKLOG_2026-08.md) §4 for where #17
sits among the rest, and §7 for the working method.

**Status:** both releases approved 2026-08-12. **Release 1** (§1–§10) = the
agenda and the board, shipped. **Release 2** (§11) = mind maps, which complete
#17.

**Task-by-task implementation plan** for release 1:
[docs/superpowers/plans/2026-08-12-planner.md](superpowers/plans/2026-08-12-planner.md).
Release 2 was executed in-thread against §11 directly.

---

## 1. What it is for

Opportunities answers *what can I enter*. The Guide answers *where does it
lead*. Neither answers **what do I do next, and am I on time** — and that
question is the one a student actually re-opens a site for.

The product already collects the two halves of the answer and shows them
nowhere together:

- `opportunity_intents` (migrations 0022/0023) knows what the student committed
  to and the moment they said they would start;
- `lib/data/roadmap.ts` knows how much runway they have and what the real dated
  deadlines are.

The planner is the surface where those two meet, plus the student's own tasks.

**It is not a todo app.** A blank todo screen hands the work back to the
student, which is the failure mode this product exists to avoid: the college
access literature's one repeated lesson is that information alone moves nothing
and *doing part of the work* moves 25–30%. So the planner opens **already
filled in** from what we know, and the student adds to it rather than starting
it.

---

## 2. Decisions taken, with the reasoning

These were settled with the founder on 2026-08-12. Recorded so they are not
re-opened as mysteries later.

| Decision | Chosen | Why |
|---|---|---|
| Scope of release 1 | **Calendar + board**, mind maps second | Calendar and board are two views of one list — same rows, same rules, sorted by date or grouped by status. A mind map re-uses none of it: different data shape (nodes + edges), different renderer, and by far the hardest part to make keyboard-operable. Cutting on that seam is the cheapest cut available, and it ships a whole first release instead of half of three. |
| What is on it | **Derived *and* the student's own** | Derived alone is a second view of the Roadmap, which is not what was asked. Own-only opens empty. |
| Moving a card | **`←` / `→` buttons**, not drag | Native HTML5 drag is unusable from a keyboard and poor on touch, and there is no DnD library in the project. Buttons are a server action, work everywhere, and cost zero new dependencies. Most of our students are on a phone, where a button beats a drag outright. Drag can be added later as an enhancement over the same action. |
| Calendar shape | **Agenda by month, plus a month grid from `lg`** | The agenda is the literal answer to "what is next and am I on time", and it is the only form readable at 375px. The grid appears where there is width for it — the Shell rule: width buys columns, never line length. |
| Roadmap phases | **In the agenda, as separators. Never on the board.** | A phase gives useful context ("you are in the focusing phase"). But it is a *period*, not a *thing*: it has no single date and cannot be moved. A card nobody can move breaks a board. |

---

## 3. The selection rule

One sentence, and everything else follows from it:

> **The planner holds things that have a date and a state.**

And it splits the two views cleanly, which is what stops the board from filling
with cards nobody can move:

> **The agenda shows everything that has a date. The board shows everything that
> has a state you own.** Committed opportunities are the intersection — they are
> on both, and that is the point.

| Source | Agenda | Board | Notes |
|---|---|---|---|
| Committed opportunities (`opportunity_intents` × catalog) | ✅ | ✅ | The only rows with both. |
| SAT registration deadlines | ✅ | ❌ | Dated, and missing one costs a cycle. But it is a fact about the world, not a card you move. |
| Verified university application deadlines | ✅ | ❌ | Same. Only the ones `roadmap.ts` verified to the day. |
| The student's own tasks | if dated | ✅ | Date optional — see §6. |
| Roadmap **phases** | as separators | ❌ | Context, not items. No single date, not movable. |
| Unconfirmed / rolling deadlines | undated block | — | Listed, never positioned. See §7. |
| Analysis recommendations, gap analysis | ❌ | ❌ | They belong to the report. The planner is not a second Roadmap. |

---

## 4. Architecture: one list, two origins

Three architectures were considered.

**A — one list, two origins. Chosen.** `opportunity_intents` remains the single
source of truth for anything about an opportunity; a new `planner_items` table
holds *only* the student's own tasks. A pure function merges them into one
`PlannerItem[]` that both views render.

**B — copy-on-add.** Committing to an opportunity writes a snapshot row into
`planner_items`. Rejected: two sources of truth. The card's deadline goes stale
the moment the catalog is corrected, and "I entered it" would be recorded in two
places that drift. This is exactly the "parallel store" the backlog warns
against.

**C — derived only, no new table.** Rejected by the founder: the student must be
able to add their own tasks.

### What that means in practice

Moving a card dispatches on its **origin**:

```
origin = "opportunity"  → writes opportunity_intents.status
origin = "own"          → writes planner_items.status
origin = "sat" | "deadline" → no state at all; agenda only, never on the board
```

One fact, one home. Nothing is ever written twice.

---

## 5. One status vocabulary

Four states, shared by both origins:

```
todo → doing → done          dropped (off to the side, from any state)
```

`opportunity_intents.status` is today `planning | applied | dropped`. It gains
**`doing`**, and the mapping is exact:

| intent | planner |
|---|---|
| `planning` | `todo` |
| `doing` | `doing` |
| `applied` | `done` |
| `dropped` | `dropped` |

**Why add a state to the table that holds the product's only behavioural
metric.** Because the metric currently cannot see the thing it most needs to.
We ask "when will you start?" — the implementation-intention mechanic that
migration 0022 exists for — and then have no way to record whether they *did*
start. Between `planning` and `applied` on an olympiad there are three months of
silence. `doing` is that missing measurement. `applied` keeps its exact meaning,
so every existing count on `/admin/intents` is unchanged.

**The risk, stated plainly.** This is an `ALTER` of a CHECK constraint on a live
table, and migrations here are applied by hand. Mitigation is the pattern
migration 0027 already established: the server action returns a readable error
naming the migration rather than a 500, and the board degrades to three columns
instead of breaking. A student whose database has not been migrated can still
plan; they just cannot mark something as started.

`dropped` is **not a visible column**. It is an archive under the board with a
count and a way back. Keeping the row matters (0022: "knowing what students
abandon is as informative as knowing what they enter") — but a permanent column
headed "gave up" on a school student's own planning screen is not a neutral
design choice, and this product is aimed at exactly the students who need the
opposite.

---

## 6. The data

### Migration `0028_planner.sql`

Two things, both additive:

1. `alter table opportunity_intents` — replace the status CHECK with the
   four-value one.
2. `create table planner_items` — the student's own tasks.

```
planner_items
  id          uuid pk
  user_id     uuid not null → auth.users on delete cascade
  title       text not null
  note        text
  due_date    date            -- nullable: a task with no date is legitimate
  status      text not null default 'todo'
              check (status in ('todo','doing','done','dropped'))
  link_href   text            -- an in-app path this task is about, or null
  created_at  timestamptz
  updated_at  timestamptz
```

- **RLS on, four policies, own rows only** — the same shape as
  `opportunity_intents`.
- **Column grants issued explicitly.** Migration 0008 locked table-wide
  privileges down, and a missing grant surfaces as a bare 42501 that looks
  nothing like a permissions problem from the UI. That is the `profiles.full_name`
  incident (0012) and it is not repeating here.
- **`link_href` is a relative in-app path or null.** Never an external URL: the
  catalog owns external links because `test:links` checks those. Validated in the
  server action to start with `/` and to contain no scheme. The icon is *derived*
  from the path prefix rather than stored, so there is no second field that can
  disagree with the first.
- **No `sort_order` in v1.** Within a column, order is due date then creation.
  Manual ordering is meaningless without drag, and adding the column later is
  additive.

`scripts/check-schema.ts` gets the expected row **in the same commit** — that is
the rule that lets defensive scaffolding be deleted instead of accumulating.

### Bounds

New entries in `lib/limits.ts` (the single source of truth), enforced in the
**server action**, not only in the form — a server action is a public HTTP
endpoint and the form is a convenience:

```
plannerTitle: 120       plannerNote: 500       plannerItems: 100
```

`plannerItems` is the abuse bound. Without a ceiling, one authenticated request
loop fills a table.

---

## 7. Rules carried over from the rest of the product

These are not new; they are the existing rules applied to a new surface, and
each one is a bug if forgotten.

- **Never place an unconfirmed date on the calendar.** A position in a month
  grid *is* a countdown. Anything with `dateConfirmed: false` goes to a
  "Date not announced" block below the agenda, keeping its link. This is the
  product's central promise and the planner is the surface most able to break
  it.
- **Unknown facts never exclude.** No graduation year, no fields, no
  commitments — the planner still renders, and it still says something useful.
- **The empty state is not a dead end.** Nothing committed → the two nearest
  opportunities the student actually matches (resolved on the **server** with
  `buildExtracurriculars`, capped at two), a link to Opportunities, and "add
  your own". Never a blank column, and never a blank column with only a link in
  it.
- **A derived card cannot be deleted, only dropped.** Deleting it would delete
  the record of a commitment. Own cards delete.
- **`today` is resolved once, on the server, and passed down as an ISO string.**
  No client component calls `new Date()`. That is what makes the render
  deterministic, the tests pure, and hydration stable. (`RoadmapView` resolves it
  on the client because it is a client component; the planner's pages are server
  components, so it does not have to.)
- **Private.** `robots.ts` blocks `/planner`; the sitemap does not list it; the
  existing "private trees really are closed" test covers it.

---

## 8. The code

### Pure core — `lib/data/planner.ts`

```ts
buildPlanner({ todayISO, intents, competitions, ownItems, satSittings,
               deadlines, phases }) → PlannerView
```

Deterministic, no I/O, **no runtime import of `key-dates`**. The page resolves
the handful of `Competition` rows the student actually committed to and passes
them in. Type-only imports are free; a runtime one drags the ~2,700-entry
catalog into the route's client bundle. Same rule as `guide-filter.ts` and
`WorkList`, in a new place.

Returns one `PlannerItem[]` plus the two groupings the views need (by month, by
status), the overdue set, and the undated set — computed once, not per view.

### Registry — `lib/data/planner-sections.ts`

The two views, in one place, read by the tabs and the index. Mind maps become a
third entry, not a fourth edit site. Same pattern as `guide-sections.ts`.

### Routes

```
/planner          agenda — "What's next"      (server)
/planner/board    the board                    (server)
```

Both `force-dynamic`, both `requireSession`, both feeding client islands with
props. `StudentNav` gains a third link.

### Server actions — `app/planner/actions.ts`

```
createPlannerItem   updatePlannerItem   deletePlannerItem
movePlannerItem     -- dispatches on origin (§4)
```

Every one validates independently of the form, returns `{ok:false,error}` rather
than throwing, and rolls the optimistic UI back on failure — the pattern
`CommitRow` already uses.

---

## 9. Tests

Written **before** the code, in `scripts/test-engine.ts`, and each one proved to
fail before it passes. A source-scanning test that cannot fail is worth nothing
(backlog §7).

1. Status mapping round-trips between intent and planner vocabularies, both ways.
2. An unconfirmed date never lands in a month bucket — it lands in "undated".
3. Overdue is computed against `todayISO`, and a `done` item is never overdue.
4. An own task with no date appears on the board and *not* in the agenda; a SAT
   sitting appears in the agenda and *not* on the board.
5. One opportunity can never appear twice, whatever the inputs.
6. Empty everything → an empty view, no throw, counts all zero.
7. `buildPlanner` is deterministic: same inputs, same output, twice.
8. `dropped` is excluded from the three visible columns and counted separately.
9. Phases render as separators only — no phase is ever a movable item.
10. `robots.txt` blocks `/planner` and the sitemap does not advertise it.

Verification gate, in order:

```
npm run build            # never while `npm run dev` is running
npm run test:unit
npx tsc --noEmit
npm run lint
node --import tsx scripts/test-session-checks.ts
npm run db:check         # after applying 0028
```

---

## 10. Out of scope for release 1, deliberately

Drag-and-drop. Recurring tasks. Sharing a board. Email or push reminders —
`lib/calendar/ics.ts` already gives a real calendar reminder with no
infrastructure, and it is reused here rather than replaced.

Mind maps were release 2 and are specified in §11 below.

**Not advertised until it exists.** Backlog #22 holds a progress-tracker line
for the landing page that is blocked on this section shipping. It stays blocked
until the planner is live, for the reason it was blocked in the first place:
advertising a feature that does not exist is what this product's own rules
forbid.

---

## 11. Release 2 — mind maps

Approved 2026-08-12. This is the rest of #17.

### 11.1 The one decision everything follows from

**We store the STRUCTURE, never the coordinates.** A node has a parent and a
position among its siblings; where it appears on screen is computed by a pure
function, so one tree always draws one picture.

This is the "separate what decays from what holds" move again. The value of a
student's map is the *branching* — these are my options, this is what each one
needs. Nobody's future depends on whether "Germany" sits at x=340. Coordinates
are the part that would rot, cost a drag implementation, and break on a phone.

It also settles three things at once that a free canvas would have fought:

- **Release 1's own rule holds.** "Moving is a button, never a drag" — there is
  now nothing to drag, because position is derived.
- **It is operable from a keyboard**, which a canvas is not without building a
  second, parallel interaction model purely to pass the accessibility test.
- **The layout is unit-testable.** A picture produced by a pure function can be
  asserted; a picture produced by dragging cannot.

The cost, stated plainly: a student cannot place a node "just there". If that is
ever asked for, the additive answer is two nullable offset columns applied *on
top of* the computed position — not a switch to stored coordinates.

### 11.2 Two panes, one truth

**The diagram is a picture of the tree. The outline is the editor.**

| | below `lg` | from `lg` |
|---|---|---|
| Diagram (SVG) | on top, scrolls horizontally inside its own container | right, taking the remaining width |
| Outline | beneath it | left, a sticky column at `top-20` |

The outline sits on the left because that is where a tree lives in every tool of
this kind. Operate mode is explicit that familiarity is a feature here: the tool
should disappear into the task, and inventing a novel arrangement for a standard
one is the failure mode.

### 11.3 Interaction: a real ARIA tree, and no Tab hijack

The outline is `role="tree"` with roving tabindex — **Tab moves into and out of
the tree, arrow keys move within it.** That is the ARIA authoring practice, and
it avoids the trap every outliner falls into: binding Tab to "indent" takes away
the one key a screen-reader user needs to leave the widget.

Structural edits live in **one action bar above the tree**, always in the same
place, acting on the current node:

```
Add inside · Add after · Indent · Outdent · Up · Down · Send to plan · Delete
```

- **No dropdown menus.** The bar sits *outside* the diagram's scroll container on
  purpose: an absolutely positioned menu inside an `overflow: auto` ancestor is
  clipped, and that is a bug this design does not need to discover later.
- **A button is disabled exactly when its operation is impossible** — Indent with
  no previous sibling, Up at the first position, Delete on the root. The disabled
  states are how the structure's rules are communicated without a paragraph
  explaining them, so the predicates behind them are pure and tested.

### 11.4 What connects it to the product

Both halves, per the founder:

- **A node may carry an in-app link** (`link_href`), reusing the exact validation
  release 1 already has: a path starting `/`, never an external URL, and `//host`
  rejected because it is protocol-relative and leaves the site while looking like
  a path. The catalog owns external links, because `test:links` is what keeps
  them alive.
- **"Send to plan" writes a `planner_items` row**, so the card appears on the
  board. This is what stops the map being a handsome dead end: thought →
  decision → work, in one product. The node is *not* consumed — it stays on the
  map, because deleting the thinking when you act on it is wrong.

### 11.5 Data — migration `0029_planner_maps.sql`

```
planner_map_nodes
  id         uuid pk
  user_id    uuid not null → auth.users on delete cascade
  map_id     uuid not null            -- every node of one map carries it
  parent_id  uuid → planner_map_nodes(id) on delete cascade  -- null = root
  label      text not null
  note       text
  link_href  text                     -- in-app path, or null
  position   int  not null default 0  -- order among siblings
  created_at / updated_at
```

- **`map_id` is denormalised deliberately.** With it, loading a whole map is one
  flat select; without it, it is a recursive CTE for no gain. The root is the
  node whose `parent_id` is null and whose `map_id` equals its own id, so
  "list my maps" is `where parent_id is null` — no second table.
- **Deleting a branch is `on delete cascade` on `parent_id`**, not code walking
  the tree. The database already knows how to do this correctly.
- RLS own-rows-only, four policies, and explicit column grants — the 0012 lesson,
  same as every table since.

Caps in `lib/limits.ts`, enforced in the server actions: **depth 4, 60 nodes per
map, 12 maps.** These are not arbitrary politeness — depth and count are also
the bound on the layout, and they are what keeps the diagram drawable.

### 11.6 The pure core — `lib/data/mindmap.ts`

```ts
buildTree(rows, rootId) → MapNode          // flat rows → a tree, sorted, safe
layoutTree(root) → { nodes, edges, width, height }
canIndent / canOutdent / canMoveUp / canMoveDown (tree, id) → boolean
```

No I/O, no clock, no dataset import. `layoutTree` is a tidy horizontal tree:
depth sets `x`, leaves take successive `y` slots, and a parent sits at the
midpoint of its first and last child. That is the whole algorithm — a few dozen
lines, no dependency, and deterministic.

**`buildTree` is defensive about three things the database can technically
hold:** a `parent_id` pointing at another user's row (dropped — the query is
already scoped, but the tree builder does not assume it), a cycle (broken rather
than recursed into), and depth beyond the cap (truncated). None of these should
happen; all three would hang or crash a renderer if they did.

### 11.7 Colour and motion

Restrained, per Operate. Fill `card`, stroke `line`, text `ink`, and the **accent
only on the current node** — nothing else on the surface earns it. No animation
beyond the existing 150–250 ms `transition-colors`, and nothing that reveals on
scroll: that is the anti-pattern the landing page already removed once.

### 11.8 Empty states teach the interface

- **No maps** is not "nothing here". It offers a first map with a real question
  already in the root — *"Where could I study?"* — because the fastest way to
  explain a mind map is to hand someone one.
- **A map with only a root** carries one line saying what to do next, beside the
  highlighted "Add inside".

### 11.9 Tests

Written first, in `scripts/test-engine.ts`:

1. Flat rows become a tree, children in `position` order.
2. A row belonging to another map is not pulled in.
3. A cycle in `parent_id` terminates instead of recursing forever.
4. Depth beyond the cap is truncated, not rendered.
5. `layoutTree` is deterministic — same tree, same geometry, twice.
6. A parent sits at the vertical midpoint of its children.
7. Every leaf gets its own row; no two nodes overlap.
8. The four `can*` predicates agree with what the actions actually permit.
9. An empty map (root only) lays out without throwing, width and height sane.
