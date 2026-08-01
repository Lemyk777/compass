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
| `key-dates.ts` | **The opportunity registry** — competitions, olympiads, summer and research programmes — plus the matching engine |
| `eligibility.ts` | Who can actually enter: parses the curated sentence into a gate |
| `intents.ts` | "I'm doing this" — statuses, the start-moment vocabulary |
| `geo.ts` | Free-text country → ISO-2, and local-discovery targets |
| `roadmap.ts` | The dated, runway-aware plan |
| `app-deadlines.ts`, `intl-deadlines.ts` | Application deadlines per school |
| `country-content.ts`, `deterministic-countries.ts` | Per-country registries — adding a destination is an entry here, not edits across the app |
| `faculties.ts`, `destinations.ts`, `countries.ts` | Shared vocabularies |

## Adding an opportunity to `key-dates.ts`

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
