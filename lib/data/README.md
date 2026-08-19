# `lib/data` — the deterministic half of the product

Everything here is data plus the code that reasons over it. **No AI call ever
happens in this folder.** Every number the student sees — scores, odds,
benchmarks, countdowns, eligibility verdicts — is produced here or in
`lib/ai/assemble.ts`, which is why the same profile yields the same report on
every run.

## What lives where

| File | |
| --- | --- |
| `universities.ts` | The US dataset (also shipped in the cached system prompt) |
| `italian-universities.ts`, `hk-universities.ts`, `uae-universities.ts`, `korea-universities.ts` | Per-country programme datasets |
| `branch-campuses.ts` | US-parent campuses abroad, scored through the US pipeline |
| `competitions-data.ts` | **The catalog itself** — 172 curated competitions, olympiads, courses, programmes, communities and job simulations. Entries only; no logic |
| `key-dates.ts` | The **types and the matching engine** over that catalog, which it re-exports so existing imports still work. It builds a lookup map over the whole catalog at module load, so it cannot be tree-shaken — see the bundle rule below |
| `opportunity-filter.ts` | The filter panel's rules, pure: groups ANDed, options inside a group ORed, every option carrying its own count. Also `matchedOnly`, which is **mandatory on any surface without a filter panel** |
| `opportunity-format.ts` | `formatDate` / `opportunityCost` / `daysBetween`. **Client components import these from here, never from key-dates** |
| `eligibility.ts` | Who can actually enter: parses the curated sentence into a gate |
| `intents.ts` | "I'm doing this" — statuses, the start-moment vocabulary |
| `geo.ts` | Free-text country → ISO-2, and local-discovery targets |
| `roadmap.ts` | The dated, runway-aware plan |
| `app-deadlines.ts`, `intl-deadlines.ts` | Application deadlines per school |
| `country-content.ts`, `deterministic-countries.ts` | Per-country registries — adding a destination is an entry here, not edits across the app |
| `faculties.ts`, `destinations.ts`, `countries.ts`, `regions.ts` | Shared vocabularies. **One list each** — five of these existed twice and that duplication was the soil three shipped bugs grew in |

### The guide (public, ~4,000 lines of prose across five registries)

| File | |
| --- | --- |
| `careers.ts` | 33 **areas** of work per field, with the real job titles inside them. Never one prescribed profession — we cannot know which job a student wants, so we widen. Server-only in practice |
| `career-titles.ts` | The area titles alone, duplicated and pinned to the registry by a test. **Import labels from here in anything that runs in the browser** |
| `majors.ts` | 44 subjects — guide step 2, what you apply *with*. `alsoCalled`, `firstYear` and `schoolSubjects` are the three fields nobody else writes down |
| `study-destinations.ts` | 17 full country profiles. Trade-offs must outnumber strengths, `notForYou` is mandatory, no prices or rankings |
| `world.ts` | 38 city hubs, each with a catch and a real route in. One hub is one city |
| `from-home.ts` | 6 routes that need no move. No URLs — the catalog owns links, because `test:links` keeps those alive |
| `place-universities.ts` | 79 named institutions, **never ranked**. Positions and superlatives are both banned; `englishTaught` is the field that rots |
| `spine.ts` | The join across all of the above, **derived and never stored**. A stop's identity is its destination id, never its printed name |
| `try-it.ts` | How to try a kind of work. Names the employer, describes the task, **no URLs**, and renders nothing where there is no honest answer |
| `guide-sections.ts`, `guide-fields.ts`, `guide-filter.ts`, `legacy-guide-urls.ts` | The five steps as one registry, the `?f=` field filter, and the enumerated legacy redirects |

### The companion and the plan

| File | |
| --- | --- |
| `thread.ts` | Seven stations, **derived** from facts already stored. Where the student IS, not the furthest thing they have touched, and nothing moves it backwards |
| `beats.ts` | Two concrete working days, fixed weights, pure scoring. Observations, never types. **Never rename a beat id** — production rows reference them |
| `planner.ts`, `planner-start.ts`, `planner-sections.ts` | The pure planner core. Takes a structural subset of `Competition`, so it imports no dataset at all |
| `next-move.ts` | Exactly ONE move, ordered, with a mandatory `why`, and it never invents a number |
| `plan-picks.ts` | What the student claimed out of the guide. **Type-only imports**, tested — it travels into two client bundles |
| `mindmap.ts` | Stores structure, computes the picture. `buildTree` is defensive about three states the database can hold and a renderer cannot survive |
| `interest-quiz.ts`, `values.ts`, `readiness.ts` | Optional self-knowledge. Values may only **reorder** areas, never filter them |

## Adding an opportunity to `competitions-data.ts`

1. **Open the page and read it.** A discontinued contest can still answer
   HTTP 200 — the Goi Peace essay contest does exactly that.
2. Write `eligibility` the way the organiser states it. If the sentence names
   **two** ranges ("AMC 10: grade ≤10 … AMC 12: grade ≤12", "Junior under 15 and
   Senior 15+"), add an explicit `gate` — the parser takes the first match and
   will silently hide the entry from everyone it should reach.
3. Set `dateConfirmed: true` **only** for a sourced date in the current cycle.
   Otherwise the UI says "dates not yet announced" instead of a countdown we
   cannot stand behind.
4. Run the checks:

   ```bash
   node --import tsx scripts/test-session-checks.ts
   ```

   ```bash
   npm run test:links
   ```

They enforce: unique ids, no two entries on one URL, valid https, no
self-contradicting gate, no confirmed date in the past, and — the one that has
caught the most — **every entry must be reachable by at least one real
student**.

## Rules that hold across this folder

- **Unknown facts never exclude.** No country, no graduation year, no chosen
  fields ⇒ the student sees more, never less.
- **Age comes from the school year as a range** (year N ⇒ N+5..N+6) and only
  excludes when the whole year group is outside the rule. We never ask for a
  birth date.
- **Too young stays visible**, badged, and can never be "recommended". Knowing
  what to aim for is the point for a younger student.
- **A retired id goes in `RETIRED_IDS`.** Deleting an entry is not enough — a
  live database row with that id would be re-added as a live-only row.
- **Matching ANNOTATES; it does not hide.** `buildExtracurriculars` returns every
  row, carrying `offField` / `offRegion`, and the filter panel narrows. **So any
  surface without a filter panel must call `matchedOnly`** — the guest checker,
  onboarding's `FirstWin`, and `lib/planner/load.ts`. Without it a student in
  Uzbekistan is shown a competition that only runs in Kazakhstan, and nothing
  looks wrong; there are simply more rows than there should be. A unit test pins
  all three files by name.
- **Nothing heavy may reach a client bundle, and the test is REACHABILITY.**
  `key-dates.ts` builds a lookup map over the whole catalog at module load, so it
  cannot be tree-shaken and any runtime import — including one reached through an
  intermediate module — drags the dataset into that route. Two such chains once
  cost eight routes 27–41 kB each. The guard walks the module graph, stopping at
  `"use server"` files. Size is not the test: `world.ts` is 822 lines and shakes
  clean, because it is plain consts.
- **The catalog currently has ZERO `pinned` rows and ZERO `region`-tagged rows,
  and a unit test pins each zero.** Both were the same entry, removed on the
  owner's instruction. Adding the first local row will fail that test on
  purpose — read audit finding A8 before changing it, because widening local
  (KZ / Central Asia) coverage is the highest-value data work available.
- **Prose registries carry rules a test enforces**: a mandatory `catch` and
  `notForYou`, trade-offs outnumbering strengths, and **no prices, salaries or
  rankings** — figures rot within a year and shape does not.
