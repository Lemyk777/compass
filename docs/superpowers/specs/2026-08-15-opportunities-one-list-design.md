# Opportunities — one list, honest counts, and a readable width

**Date:** 2026-08-15
**Status:** **DELIVERED.** §2 and §3 (one list, the gates as filters, the honest
count) shipped in PR [#114](https://github.com/Lemyk777/compass/pull/114). §4
shipped 2026-08-16 — but the measurement it called for changed what was built,
so **read §4a before touching this: the filter rail is deliberately not built,
the columns are a container query rather than `sm:2 → xl:3`, and the typography
pass was measured as unnecessary.** §4's original bullets are kept above §4a
because the reasoning that overturned them only makes sense next to them.

---

## 0. What was reported, and what is actually true

The owner, comparing Compass against projectconnectforum.com: their list is
readable, ours is harder work; the split between five recommendations and
everything else should be one thing; and the catalog says 172 while his account
shows 114 with no explanation and no way to see the rest.

All three verified in code before this was written.

| Report | Verdict | Evidence |
|---|---|---|
| The 5/everything split is two objects | **True, and it is three** | `FilterBar`, then `Shortlist` (5 rows), then a button revealing the full list. The shortlist also *disappears* while filtering, so the object is there and then not there. |
| 172 vs 114, with no way to the full catalog | **True, and worse** | A signed-in student has **no route at all** to the full catalog. `buildExtracurriculars` (`lib/data/key-dates.ts:569`) applies four gates — country reachability, field match, past confirmed dates, age/grade — and returns only survivors. `COMPETITIONS.length` appears on the marketing page and the guest `/opportunities`, nowhere a signed-in student can reach. |
| The copy lies about it | **True** | The button reads **"Show everything we track for you (114)"**. "Everything" is false: it is everything we *matched*. A student reads it as "they only have 114". |
| Harder to read than the competitor | **True, and measurable** | The list is `grid gap-2.5 2xl:grid-cols-2` — **one column until 1536px**. Inside a 1440px `Shell`, every card is a ~1400px strip carrying four text tiers spread across it. The guide's own lists run `sm:2 → xl:3 → 2xl:4`. The product's main list is its least dense, and it breaks the rule written in its own `CLAUDE.md`: **width buys columns, never line length.** |

Not found: dead code. Every `.tsx` under `components/` is imported somewhere.
What does exist is **built-but-unreachable** work, recorded here because it is
the same complaint in a different place: the interest quiz is buried at
`OpportunitiesView.tsx:363` as one prompt's fallback, and `TryTheWork` renders
on 6 of 35 area pages.

---

## 1. Decisions taken

| # | Question | Decision |
|---|---|---|
| D1 | How does a student know what we recommend, once the list is one thing? | **One list, the top rows marked.** Quietly — see §2. |
| D2 | How do they reach the full catalog, and where do we admit we filtered? | **The gates become filters.** |
| D3 | Scope of the readability work | **Rail + columns + a typography pass on the card.** |
| D4 | Sequencing | **The guided thread finishes and merges first.** |

---

## 2. One list

`Shortlist` and the "Show everything we track for you" button are both removed.
One `<ul>`, in the order `buildExtracurriculars` already returns — fit first.
Nothing is re-sorted, because the order was never the problem.

**The mark on the top rows is a reason, not a label.** An eyebrow line above the
title on the first few: *"suits you — your field, and you are old enough"*. Not
a "RECOMMENDED" pill.

Two reasons, and the second is the one that matters:

1. A pill on five rows out of a hundred is the same section boundary with the
   heading removed. It re-draws the line the owner asked to remove.
2. An instruction is not a reason. `nextMove` makes `why` mandatory for exactly
   this reason, and "there is no accompaniment" was the complaint that rule was
   written to answer. A card that says *why* it is above the others is doing the
   work; a card that says "recommended" is asserting rank.

The reason is derived from the same verdict the gates produce (§3), so it costs
no new data and cannot disagree with the filters.

---

## 3. The gates become filters

**This is the one real architectural change.** Today
`buildExtracurriculars` **filters and returns** ~114 rows. It will **annotate
and return** all 172, each carrying its gate verdict, and the filter panel
decides what is shown.

The filter panel gains one group, **"matched to you"**, with both options on by
default:

- **My field** (−58 on the reporting account)
- **My country** (−0 on that account)

Counts follow the panel's existing rule: each control's count is computed **with
that control's own selection lifted**. Groups stay ANDed, options inside a group
ORed. Turning either off widens the list toward 172.

Above the list, one honest line: **"114 of 172, matched to you."**

**Why this beats a "see the full catalog" button.** A button states a fact; a
filter with a count states the *cause* and hands back control. The student
learns that 58 were removed **because of their field**, which is a fact about
our matching rather than about the world — and they can act on it in one press.

**What does not change:**

- `too_young` rows stay visible. Not yet eligible is aspirational, never "do
  this now", and that ordering rule is untouched.
- Past confirmed dates stay filtered out entirely and do **not** become a
  toggle. A closed date is not a narrowing of the catalog, it is a fact about
  the world, and offering to "show expired" would be offering rubbish.
- `pinned` still reorders only, and a pinned row still has to pass eligibility.

**Bundle note:** the client receives 172 annotated rows instead of 114 filtered
ones. The rows are already the shape the card renders; the three matching views
must keep dynamic-importing `buildExtracurriculars`, as they do today.

---

## 4. Rail and columns

- From `lg`, `FilterBar` becomes a left rail in the column that is otherwise
  gutter, sticky at `top-20` (StudentNav is sticky and ~57px). Below `lg` it
  collapses to the button-and-sheet it already is — most of our students are on
  a phone, and a rail there is noise.
- The list becomes `sm:grid-cols-2 xl:grid-cols-3`, matching the guide's lists.
- The card stops being a ~1400px strip and becomes a ~340px object.

**Then, and only then, the typography pass.** The card's tiers were laid out for
a width that will no longer exist, so they have to be re-checked at the new one:
11px floor, a title/body step of 1.14–1.25 in size *and* 200 in weight, at most
four tiers, and facts of the same kind grouped.

**A warning that belongs in the spec, not in a code comment:** this card's
typography was already fixed once, and the measurement then showed contrast was
never the problem — flatness and missing groups were. If the rail and the
columns alone make it read properly, this section shrinks to *verify at the new
width* rather than *rebuild*. Do the layout first and measure before touching
type.

### 4a. What was actually built, and why the rail was not — 2026-08-16

The measurement this section asked for was taken, and it **overturned two of
the three bullets above.** Recorded here in full so nobody re-derives it, and
so nobody "finishes" the rail as an unfinished task.

**The filter rail is not built. Owner's call, from the numbers.** The section
told us to check the companion first, and the answer was worse than the
contingency allowed for: the companion's 20rem column IS the spare gutter, so a
second rail is squeezed out of the content rather than out of the margin. The
student shell's content column measures 966px at 1024, then **drops to 854px at
1280** when the companion appears, 864 at 1440, 1024 at 1536. A 256px rail
leaves two-column cards of 338 / **282** / 287 / 367px. The 282 is at 1280, the
commonest desktop width, and it is narrower than anything the product ships —
against this spec's own ~340px target and the guide's 336–399px cards. The rail
costs ~140px a card at *every* width. The section's fallback ("it waits until
`xl` too and the two share the row") does not help, because `xl` is exactly
where the companion arrives.

**The list is not `sm:grid-cols-2 xl:grid-cols-3` either, and it is not a
viewport breakpoint at all.** Two findings:

1. *This card has a cliff, not a curve.* Forced to exact widths in 20px steps
   it is flat at **272px tall from 380px up**; at 340–360 the title takes a
   third line and it jumps to 356px; at 320 the title wraps to **four** lines,
   the blurb to three at 23 characters, and it stands 421px. So 380px a card is
   the knee — and a third column is 320px even at 1536, precisely the width
   that breaks. Two columns, never three. `sm` was measured at 262px a card and
   is nowhere near.
2. *One viewport breakpoint cannot serve both shells.* This list renders in the
   student's section AND in the report's, whose sidebar spends the width
   differently: at 1024 the same list is **924px wide in one and 652px in the
   other**. `lg:grid-cols-2` measured 457px cards in one and 321px — below the
   knee — in the other.

So the columns are a **container query** (`.opp-list` / `.opp-grid` in
`globals.css`): two columns once the list itself is ≥800px, which is the
narrowest that clears the 380px knee with room to spare. Both shells get the
right answer without either knowing about the other, and the rule is stated in
terms of the thing that actually constrains it.

Result: 457 / 401 / 406 / 486px cards in the student's section, 652 (one
column) / 449 / 529 in the report's, and the list is **39% shorter** at 1440.

**The typography pass was not needed** — the outcome this section explicitly
allowed for. Measured on the card at its new 406px: four size tiers
(15 / 13 / 12 / 11px), floor exactly at 11, title/body step 1.154 in size and
200 in weight, eligibility and deadline already one group. Every band passes,
so nothing was rebuilt.

---

## 5. Testing

`lib/data/opportunity-filter.ts` is pure and already unit-tested; the new group
extends it there.

| What | Assertion |
|---|---|
| gate annotation | every catalog row comes back annotated; none is dropped except past-confirmed |
| the new group | groups ANDed, options ORed; each count computed with its own selection lifted |
| honest count | the "N of M" line equals the annotated set's sizes, never a literal |
| widening | turning off "my field" strictly grows the list; turning both off yields the whole non-expired catalog |
| the mark | a marked row's reason is derived from its own verdict, so a row cannot be marked and filtered out by the same fact |
| no regressions | `too_young` still shown; past-confirmed still hidden; `pinned` still reorders only and still passes eligibility |

Gate: `npm run build` · `npm run test:unit` · session checks.

---

## 6. Out of scope, deliberately

- Surfacing the interest quiz and widening `TryTheWork` coverage. Both are real
  and both are recorded in §0, but they belong to the guided thread's work, not
  to this list's layout.
- Any change to the catalog's contents.
- The guest `/opportunities` page, which already shows the full count.
