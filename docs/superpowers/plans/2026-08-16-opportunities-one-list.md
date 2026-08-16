# Opportunities — One List Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn the Opportunities view from three stacked objects into one honest list — matching stops hiding rows and starts annotating them, the two invisible gates become ordinary filters with counts, and the list gets a filter rail and real columns instead of 1400px strips.

**Architecture:** One real change underneath, three consequences above it. `buildExtracurriculars` stops *filtering* on field and region and starts *annotating* every row with why it would have been dropped; the pure filter model gains a `matched` group whose options default to on; and the view then has nothing left to hide, so the shortlist and the "show everything" button both disappear into a single sorted list. Layout follows: the filter panel becomes a rail from `lg`, the list becomes columns.

**Tech Stack:** Next.js 14 App Router (RSC + client islands), TypeScript strict, Tailwind, `node:test` via `npm run test:unit`.

**Design of record:** [`docs/superpowers/specs/2026-08-15-opportunities-one-list-design.md`](../specs/2026-08-15-opportunities-one-list-design.md). §0 is the verified state of what ships today — read it before changing anything.

---

## Global Constraints

- **Branch from `develop`, PR back into `develop`.** `main` is production and deploys on change. Run `gh pr view <n> --json state` before every push to a branch with a PR — a merged PR is closed and silently takes no more commits.
- **Never run `npm run build` while `npm run dev` is up.** They share `.next/` and the dev server dies with a fake `Cannot find module './NNNN.js'`.
- **Bundle rule.** `lib/data/key-dates.ts` builds a map over the whole ~2,700-row catalog at module load. Client components import `formatDate`/`opportunityCost` from `lib/data/opportunity-format.ts`, and the three matching views **dynamic-import** `buildExtracurriculars`. Type-only imports from key-dates are free.
- **The filter panel's three rules are the product's rules:** groups are **ANDed, options inside a group ORed**; **"Free" never includes an unverified cost**; and **any active filter opens the full list on its own**. Each control's count is computed **with that control's own selection lifted**.
- **Never show a countdown for a date we cannot stand behind.** Confirmed → countdown; anything else → "Dates TBA" or "open now".
- **`pinned` reorders only, and a pinned row still has to pass eligibility.** Tests are written against whatever is pinned *today*, never a named id.
- **Colour/type:** tokens only; `text-accent` is a fill, use `text-accent-ink`; filled primary is `bg-cta text-cta-ink`; focus is `focus-visible:focus-ring`; 11px floor; merge caller `className` with `cn`; no `!` escapes.
- **Motion:** `transform` and `opacity` only.
- **Gate for every task:** `npx tsc --noEmit`, `npm run lint`, `npm run test:unit`. Full `npm run build` at the end.
- Conventional commits; commit at every step marked Commit.

---

## File Structure

| File | Responsibility |
|---|---|
| `lib/data/key-dates.ts` | **Modify.** `buildExtracurriculars` annotates instead of filtering on field/region. |
| `lib/data/opportunity-filter.ts` | **Modify.** The `matched` filter group, its facets, its chips, and the honest count. Pure; all rules live here. |
| `components/opportunities/FilterBar.tsx` | **Modify.** Render the new group; become a rail from `lg`. |
| `components/dashboard/views/OpportunitiesView.tsx` | **Modify.** One list — delete the shortlist/show-all split; add the count line; lay out rail + columns. |
| `scripts/test-engine.ts` | **Modify.** Tests for all of the above. |

---

### Task 1: Matching annotates instead of hiding

**Files:**
- Modify: `lib/data/key-dates.ts` (`Opportunity` type, `buildExtracurriculars`)
- Test: `scripts/test-engine.ts`

**Interfaces:**
- Produces: `Opportunity` gains `offField: boolean` and `offRegion: boolean`. `buildExtracurriculars` returns **every** row that passes the date and eligibility gates, including ones outside the student's field or region.

> **What must NOT change.** Past *confirmed* dates stay filtered out entirely and never become a toggle — a closed date is a fact about the world, not a narrowing of the catalog, and offering to "show expired" is offering rubbish. Rows the student can never enter (`verdict.ok === false` and not `too_young`) stay dropped. `too_young` rows stay visible and stay `fit: "stretch"`.

- [ ] **Step 1: Write the failing tests**

Append to `scripts/test-engine.ts`:

```ts
// ── Matching annotates, it does not hide ─────────────────────────────────────
test("a student outside a row's field still sees it, marked", () => {
  // The gate was invisible: 58 of 172 rows vanished with no way to ask why or
  // to see them. It is a filter now, so matching must hand the filter something
  // to filter ON rather than doing the hiding itself.
  const plan = buildExtracurriculars({
    today: TODAY,
    faculties: ["law"],
    factors: [],
  });
  const offField = plan.items.filter((o) => o.offField);
  assert.ok(
    offField.length > 0,
    "nothing came back marked off-field — matching is still hiding",
  );
  for (const o of offField) {
    assert.ok(
      o.fields !== "all" && !o.fields.includes("law"),
      `${o.id} is marked off-field but is in the student's field`,
    );
  }
});

test("stating no field marks nothing off-field", () => {
  // Empty faculties means "show me everything", never "show me nothing" — so
  // there is no field to be outside of.
  const plan = buildExtracurriculars({ today: TODAY, faculties: [], factors: [] });
  assert.ok(plan.items.every((o) => !o.offField));
});

test("a local row from another country is marked, not dropped", () => {
  const plan = buildExtracurriculars({
    today: TODAY,
    faculties: [],
    factors: [],
    homeCountry: "IT",
  });
  const offRegion = plan.items.filter((o) => o.offRegion);
  for (const o of offRegion) {
    assert.ok(o.region && o.region !== "IT", `${o.id} is wrongly marked off-region`);
  }
  assert.ok(
    plan.items.some((o) => o.offRegion),
    "a region-tagged row from elsewhere was still hidden",
  );
});

test("a confirmed date in the past is still GONE, not marked", () => {
  // A closed date is a fact about the world, not a narrowing of the catalog.
  // Offering to "show expired" would be offering rubbish.
  const plan = buildExtracurriculars({ today: TODAY, faculties: [], factors: [] });
  for (const o of plan.items) {
    if (o.dateConfirmed) {
      assert.ok(
        o.daysToDeadline >= 0,
        `${o.id} is confirmed and past but was returned`,
      );
    }
  }
});

test("the annotated list is a superset of the matched one, and nothing else changed", () => {
  const narrow = buildExtracurriculars({
    today: TODAY,
    faculties: ["law"],
    factors: [],
  });
  const matched = narrow.items.filter((o) => !o.offField && !o.offRegion);
  const wide = buildExtracurriculars({ today: TODAY, faculties: [], factors: [] });
  assert.ok(
    narrow.items.length > matched.length,
    "annotating did not widen anything",
  );
  assert.equal(
    narrow.items.length,
    wide.items.length,
    "the returned set depends on the student's field, which it must no longer",
  );
});
```

- [ ] **Step 2: Run to verify they fail**

```bash
npm run test:unit
```

Expected: FAIL — `offField` is not a property of `Opportunity`.

- [ ] **Step 3: Add the two fields to the `Opportunity` type**

In `lib/data/key-dates.ts`, on the `Opportunity` type:

```ts
  /**
   * Outside the student's stated fields. Marked rather than hidden: the gate
   * used to remove ~58 of 172 rows invisibly, so a student saw a smaller
   * catalog than we have and could not ask why. False when no field is stated
   * — empty faculties means "show me everything".
   */
  offField: boolean;
  /**
   * A local row tagged for a different country. Same reasoning: it is a reason
   * to rank something last, not a reason to pretend it does not exist.
   */
  offRegion: boolean;
```

- [ ] **Step 4: Annotate instead of filtering**

In `buildExtracurriculars`, replace the two leading `.filter(...)` calls:

```ts
  const items: Opportunity[] = comps
    .filter((c) => reachableFrom(c, homeCountry))
    .filter(
      (c) =>
        fac.size === 0 ||
        c.fields === "all" ||
        c.fields.some((f) => fac.has(f)),
    )
```

with a pass-through that records the same two facts:

```ts
  const items: Opportunity[] = comps
    // Neither of these removes a row any more. They RECORD why a row would have
    // been removed, and `lib/data/opportunity-filter.ts` turns that into two
    // ordinary filters with counts — so a student can see that 58 rows are
    // off-field and switch the narrowing off. The gate was invisible before,
    // which meant the product quietly showed a smaller catalog than it has.
    .map((c) => ({
      c,
      offRegion: !reachableFrom(c, homeCountry),
      offField:
        fac.size > 0 &&
        c.fields !== "all" &&
        !c.fields.some((f) => fac.has(f)),
    }))
```

Then thread `offField`/`offRegion` through the remaining stages. The
`.filter((c) => !c.dateConfirmed || …)` becomes `.filter(({ c }) => …)`, the
eligibility `.map` destructures `{ c, offField, offRegion }` and returns them
alongside `gate` and `verdict`, and the final `.map` spreads them onto the
result:

```ts
      return {
        ...c,
        offField,
        offRegion,
        daysToDeadline: daysBetween(today, c.deadline),
        // …the rest unchanged
      };
```

- [ ] **Step 5: Rank an off-field row last, below fit**

In the same function's `.sort`, immediately **after** the `pinned` comparison
and **before** the fit comparison:

```ts
      // Off-field and off-region rows sink below everything the student
      // actually matches. They are visible, not promoted — the list still opens
      // on what fits, and widening is a thing you choose rather than a thing
      // that happens to you.
      const am = a.offField || a.offRegion ? 1 : 0;
      const bm = b.offField || b.offRegion ? 1 : 0;
      if (am !== bm) return am - bm;
```

- [ ] **Step 6: Run until green, then type-check**

```bash
npm run test:unit && npx tsc --noEmit
```

Expected: PASS, then no output. `tsc` will name every other place that
constructs an `Opportunity` literal — there are matching views and test
fixtures; add `offField: false, offRegion: false` to each.

- [ ] **Step 7: Commit**

```bash
git add lib/data/key-dates.ts scripts/test-engine.ts
git commit -m "feat(opportunities): matching annotates instead of hiding"
```

---

### Task 2: The two gates become a filter group

**Files:**
- Modify: `lib/data/opportunity-filter.ts`
- Test: `scripts/test-engine.ts`

**Interfaces:**
- Consumes: `Opportunity.offField`, `Opportunity.offRegion` (Task 1).
- Produces:
  - `type MatchBucket = "field" | "region"`
  - `OpportunityFilters` gains `matched: MatchBucket[]`
  - `NO_FILTERS.matched` is `["field", "region"]` — **on by default**
  - `MATCH_OPTIONS: { id: MatchBucket; label: string }[]`
  - `OpportunityFacets` gains `matched: Record<MatchBucket, number>`
  - `function matchedCount(items: Opportunity[]): { shown: number; total: number }`

> **This group is inverted from every other one, and that must be explicit.** Elsewhere an empty array means "no narrowing". Here the default is *both on*, because the product's honest default is still the student's own list — the change is that the narrowing is now visible and reversible. `activeFilterCount` therefore counts this group when it is **missing** an option, not when it has one.

- [ ] **Step 1: Write the failing tests**

```ts
// ── The gates, made visible ──────────────────────────────────────────────────
test("by default the student still gets their own list", () => {
  assert.deepEqual([...NO_FILTERS.matched].sort(), ["field", "region"]);
});

test("unchecking a match option widens the list, and counts as an active filter", () => {
  // The panel's standing rule: any active filter opens the full list on its
  // own. Widening is the clearest case of that.
  assert.equal(activeFilterCount(NO_FILTERS), 0, "the default must be quiet");
  const widened = { ...NO_FILTERS, matched: ["region" as const] };
  assert.equal(activeFilterCount(widened), 1);
  const wideOpen = { ...NO_FILTERS, matched: [] };
  assert.equal(activeFilterCount(wideOpen), 2);
});

test("the match group filters on the annotation, both ways", () => {
  const rows = [
    { ...SAMPLE_OPPORTUNITY, id: "mine", offField: false, offRegion: false },
    { ...SAMPLE_OPPORTUNITY, id: "other-field", offField: true, offRegion: false },
    { ...SAMPLE_OPPORTUNITY, id: "other-place", offField: false, offRegion: true },
  ];
  const mine = filterOpportunities(rows, NO_FILTERS).map((o) => o.id);
  assert.deepEqual(mine, ["mine"]);

  const withOffField = filterOpportunities(rows, {
    ...NO_FILTERS,
    matched: ["region"],
  }).map((o) => o.id);
  assert.deepEqual(withOffField.sort(), ["mine", "other-field"]);

  const everything = filterOpportunities(rows, {
    ...NO_FILTERS,
    matched: [],
  }).map((o) => o.id);
  assert.equal(everything.length, 3);
});

test("the match counts say how many rows each narrowing is removing", () => {
  const rows = [
    { ...SAMPLE_OPPORTUNITY, id: "a", offField: false, offRegion: false },
    { ...SAMPLE_OPPORTUNITY, id: "b", offField: true, offRegion: false },
    { ...SAMPLE_OPPORTUNITY, id: "c", offField: true, offRegion: false },
    { ...SAMPLE_OPPORTUNITY, id: "d", offField: false, offRegion: true },
  ];
  const facets = opportunityFacets(rows, NO_FILTERS);
  // Counted with THIS control's own selection lifted, like every other group:
  // "how many would I see if this one were off".
  assert.equal(facets.matched.field, 4);
  assert.equal(facets.matched.region, 4);
});

test("the honest count is computed, never written down", () => {
  const rows = [
    { ...SAMPLE_OPPORTUNITY, id: "a", offField: false, offRegion: false },
    { ...SAMPLE_OPPORTUNITY, id: "b", offField: true, offRegion: false },
  ];
  assert.deepEqual(matchedCount(rows), { shown: 1, total: 2 });
  assert.deepEqual(matchedCount([]), { shown: 0, total: 0 });
});

test("an unchecked match option appears as a removable chip", () => {
  const chips = activeChips({ ...NO_FILTERS, matched: ["field"] });
  assert.ok(
    chips.some((c) => c.group === "matched"),
    "widening the list left nothing the student could put back",
  );
});
```

Add the shared fixture beside the other filter fixtures:

```ts
const SAMPLE_OPPORTUNITY = {
  ...COMPETITIONS[0],
  daysToDeadline: 30,
  tierResolved: "accessible" as const,
  categoryResolved: "competition" as const,
  fit: "recommended" as const,
  offField: false,
  offRegion: false,
};
```

- [ ] **Step 2: Run to verify they fail**

```bash
npm run test:unit
```

Expected: FAIL — `matched` is not a property of `OpportunityFilters`.

- [ ] **Step 3: Add the type, the options and the default**

In `lib/data/opportunity-filter.ts`:

```ts
/**
 * The two narrowings that used to happen invisibly, inside matching.
 *
 * This group is INVERTED from the others and that is deliberate: everywhere
 * else an empty array means "no narrowing", here the default is both ON. The
 * honest default is still the student's own list — what changed is that the
 * narrowing is now visible, counted, and reversible. Turning one off says
 * "show me the ones I don't match either", which is a question the product
 * previously gave no way to ask.
 */
export type MatchBucket = "field" | "region";

export const MATCH_OPTIONS: { id: MatchBucket; label: string }[] = [
  { id: "field", label: "In my fields" },
  { id: "region", label: "Open where I live" },
];
```

Add to `OpportunityFilters`:

```ts
  /** Which narrowings are ON. Both, by default — see MatchBucket. */
  matched: MatchBucket[];
```

Add to `NO_FILTERS`:

```ts
  matched: ["field", "region"],
```

- [ ] **Step 4: Apply it in `matchesFilters`**

Inside `matchesFilters`, before the other groups:

```ts
  // Groups are ANDed. A row is kept when every narrowing still switched on
  // either does not apply to it, or applies and it passes.
  if (f.matched.includes("field") && o.offField) return false;
  if (f.matched.includes("region") && o.offRegion) return false;
```

- [ ] **Step 5: Count it as active when it is OFF**

In `activeFilterCount`, add:

```ts
    // Counted by what is MISSING, because this group's default is "on". A
    // widened list is an active choice and must open the full list, same as
    // every other filter.
    (NO_FILTERS.matched.length - f.matched.length) +
```

- [ ] **Step 6: Facets and chips**

Add to `OpportunityFacets`:

```ts
  /** What would survive with each narrowing lifted — "how many if this were off". */
  matched: Record<MatchBucket, number>;
```

In `opportunityFacets`:

```ts
  const forField = without({ matched: f.matched.filter((m) => m !== "field") });
  const forRegion = without({ matched: f.matched.filter((m) => m !== "region") });
  const matched = {
    field: forField.length,
    region: forRegion.length,
  } as Record<MatchBucket, number>;
```

…and include `matched` in the returned object.

In `activeChips`, after the existing groups:

```ts
  for (const opt of MATCH_OPTIONS) {
    if (!f.matched.includes(opt.id)) {
      chips.push({
        id: `matched:${opt.id}`,
        label: `Including ones not ${opt.label.toLowerCase()}`,
        group: "matched",
        value: opt.id,
      });
    }
  }
```

In `withoutChip`, removing a `matched` chip puts the narrowing BACK:

```ts
    case "matched":
      return {
        ...f,
        matched: [...f.matched, chip.value as MatchBucket],
      };
```

Widen `FilterChip["group"]` to include `"matched"`.

- [ ] **Step 7: The honest count**

```ts
/**
 * How much of the catalog this student is being shown, and out of how much.
 *
 * Computed from the annotated rows, never written down — the button that used
 * to sit here said "Show everything we track for you (114)", where "everything"
 * was false: it was everything we MATCHED. A student read it as "they only have
 * 114" and had no way to find out otherwise.
 */
export function matchedCount(items: Opportunity[]): {
  shown: number;
  total: number;
} {
  return {
    shown: items.filter((o) => !o.offField && !o.offRegion).length,
    total: items.length,
  };
}
```

- [ ] **Step 8: Run until green**

```bash
npm run test:unit && npx tsc --noEmit && npm run lint
```

Expected: PASS, then no output from either. `tsc` will name every place that
builds an `OpportunityFilters` literal — add `matched: NO_FILTERS.matched`.

- [ ] **Step 9: Commit**

```bash
git add lib/data/opportunity-filter.ts scripts/test-engine.ts
git commit -m "feat(opportunities): the two invisible gates become filters with counts"
```

---

### Task 3: One list

**Files:**
- Modify: `components/dashboard/views/OpportunitiesView.tsx`
- Modify: `components/opportunities/FilterBar.tsx`

**Interfaces:**
- Consumes: `matchedCount`, `MATCH_OPTIONS`, `OpportunityFacets["matched"]` (Task 2).

- [ ] **Step 1: Delete the split**

In `OpportunitiesView.tsx`, remove the `Shortlist` render, the
`Show everything we track for you` button, and the `showAll`/`browsing` state
that existed only to drive them. One `<ul>` remains, rendering the filtered
list in the order `buildExtracurriculars` returns.

- [ ] **Step 2: Mark the top rows with a REASON, not a badge**

Above the first rows, on the card itself, an eyebrow line derived from the row's
own verdict — *"suits you — your field, and you're old enough"* — not a
"RECOMMENDED" pill.

Two reasons, and the second is the one that matters: a pill on five rows out of
a hundred is the same section boundary with the heading removed, and it re-draws
the line this task exists to erase. And an instruction is not a reason — the
same rule that makes `why` mandatory on `nextMove`, written for the same
complaint.

- [ ] **Step 3: The honest count line**

Directly above the list:

```tsx
{(() => {
  const { shown, total } = matchedCount(inCategory);
  return shown === total ? null : (
    <p className="text-sm text-ink-soft">
      Showing{" "}
      <span data-num className="font-semibold text-ink">
        {shown}
      </span>{" "}
      of {total}, matched to you.{" "}
      <span className="text-ink-faint">
        The filters say what was left out, and let you put it back.
      </span>
    </p>
  );
})()}
```

- [ ] **Step 4: Render the group in `FilterBar`**

A group headed **"Matched to you"** with the two options as checkboxes, each
carrying `facets.matched[id]` as its count, in the same shape the money/when/
level groups already use. Checked = narrowing on.

- [ ] **Step 5: Verify in the browser**

Start the dev server and open `/opportunities` signed in. Confirm: one list with
no "show everything" button; the count line reads "Showing N of M"; unchecking
"In my fields" grows the list and the count line disappears when N equals M;
the chip for it appears and removing the chip puts the narrowing back.

- [ ] **Step 6: Gate and commit**

```bash
npm run test:unit && npx tsc --noEmit && npm run lint
git add components/dashboard/views/OpportunitiesView.tsx components/opportunities/FilterBar.tsx
git commit -m "feat(opportunities): one list, and it says what it is not showing you"
```

---

### Task 4: A rail and real columns

**Files:**
- Modify: `components/dashboard/views/OpportunitiesView.tsx`
- Modify: `components/opportunities/FilterBar.tsx`

- [ ] **Step 1: The rail**

From `lg`, `FilterBar` moves into a left column and becomes sticky at `top-20`
(StudentNav is sticky and ~57px tall — the same anchor `DetailShell`'s aside
uses). Below `lg` it stays exactly the button-and-sheet it already is: most of
our students are on a phone, and a rail there is noise.

**Check the companion first.** The student shell already places its own rail
from `xl`. Put the filter rail on the LEFT and confirm at 1280px that the main
column still holds a readable measure with both rails present; if it does not,
the filter rail waits until `xl` too and the two share the row.

- [ ] **Step 2: The columns**

The list becomes `sm:grid-cols-2 xl:grid-cols-3`, matching the guide's lists.
It is `2xl:grid-cols-2` today — one column until 1536px — which is why every
card is a ~1400px strip inside a 1440px shell, and why the product's main list
is its least dense.

- [ ] **Step 3: Measure, do not assume**

With the dev server up, at 1280px and at 1440px: count the cards per row, and
check the longest card description does not exceed ~75 real characters a line.
`ch` is the width of a zero and reads ~20% narrow, so measure characters, not
`ch` units.

- [ ] **Step 4: Gate and commit**

```bash
npm run test:unit && npx tsc --noEmit && npm run lint
git add components/dashboard/views/OpportunitiesView.tsx components/opportunities/FilterBar.tsx
git commit -m "feat(opportunities): a filter rail and three columns instead of 1400px strips"
```

---

### Task 5: Typography at the new width, and the release gate

**Files:**
- Modify: `components/opportunities/OpportunityCard.tsx` (only if measurement says so)

- [ ] **Step 1: Measure before touching anything**

The card's tiers were laid out for a width that no longer exists. At ~340px
check: nothing below 11px; the title/body step is 1.14–1.25 in size **and** 200
in weight; at most four tiers; and facts of the same kind are grouped
(eligibility and the deadline are both *the terms of entry* and belong together,
set off from the description).

**If the rail and the columns alone made it read properly, stop here and say
so.** This card's typography was already fixed once, and the measurement then
showed contrast was never the problem — flatness and missing groups were.
Rebuilding what is already right is how a fix becomes a regression.

- [ ] **Step 2: Full gate**

Stop the dev server first.

```bash
npm run build
npm run test:unit && node --import tsx scripts/test-session-checks.ts
```

Expected: build clean; tests pass; 61 session checks pass. Check `/opportunities`
in the build output has not grown by more than a few kB.

- [ ] **Step 3: Open the PR**

```bash
gh pr create --base develop --title "feat: opportunities — one list, honest counts, a readable width" --body "$(cat <<'EOF'
Implements docs/superpowers/specs/2026-08-15-opportunities-one-list-design.md.

Matching stops hiding rows and starts annotating them, so the two gates that
removed ~58 of 172 rows invisibly are now ordinary filters with counts — a
student sees "Showing 114 of 172, matched to you" and can widen in one press.
The shortlist and the "Show everything we track for you (114)" button are gone;
"everything" was false, and it was the only route to the full catalog.

The list is a filter rail plus real columns instead of one column until 1536px.

🤖 Generated with [Claude Code](https://claude.com/claude-code)
EOF
)"
```

---

## Self-review

**Spec coverage.** §2 one list → Task 3. §3 gates become filters → Tasks 1 and 2; the honest count line → Task 2 (`matchedCount`) rendered in Task 3; `too_young` still visible, past-confirmed still hidden, `pinned` still reorder-only → asserted in Task 1. §4 rail and columns → Task 4; typography → Task 5, gated on measurement. §5 testing → the test blocks in Tasks 1 and 2. §6 out of scope → nothing here touches the interest quiz, `TryTheWork` coverage, the catalog's contents or the guest page.

**Placeholders.** None. Tasks 3–5 describe UI edits in prose rather than full JSX because they are deletions and layout-class changes to a 1,000-line existing component, where a wholesale rewrite in the plan would be less accurate than the file itself; every one names the exact file, the exact change, and the measurement that decides whether it is right.

**Type consistency.** `offField`/`offRegion` are defined in Task 1 and consumed in Task 2 (`matchesFilters`, `opportunityFacets`, `matchedCount`) and Task 3. `MatchBucket`, `MATCH_OPTIONS`, `NO_FILTERS.matched` and `facets.matched` are defined in Task 2 and consumed in Tasks 3 and 4. `matchedCount` returns `{ shown, total }` in both its definition and its render.

**One judgement recorded rather than hidden:** the `matched` group is inverted from every other group in the module (default on, counted when absent). That is a real inconsistency in an otherwise uniform model, and it is accepted because the alternative — an empty default meaning "show all 172" — would change what every existing student sees on their next visit, which is not what this spec asked for.
