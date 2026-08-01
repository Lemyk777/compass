# Opportunities — status & next steps

Working notes for the Opportunities feature (catalog, discovery, matching).
Last updated: 2026-07-31.

The long-term intent is that this becomes a product in its own right, not just
a dashboard section — a student should get value from it before, or instead of,
running an admission analysis.

**Read [OPPORTUNITIES_RESEARCH.md](OPPORTUNITIES_RESEARCH.md) before designing
any of it.** Short version: every large trial of "tell students about their
options" measured zero, including one with 800,000 students. What moved
behaviour was removing ambiguity about eligibility and removing the work. So the
public surface below must be an **eligibility checker**, not a browsable
catalog — and the catalog's growth belongs in the matching, not on the screen.

---

## Where it stands

**Catalog** — 100 curated opportunities in `lib/data/key-dates.ts`. Every link
verified: `npm run test:links` reports 100/100 healthy.

The most recent pass added 12 entries a student can enter **in grades 5–9** —
the catalog's earliest real entry point used to be grade 9, so a 12-year-old
got a page of "eligible from grade 9" stretch goals. Two long-standing
duplicates were merged out (Lumiere under two ids in two different tiers; NYT
STEM Writing pointing at the same hub as NYT Student Contests), and their ids
are in `RETIRED_IDS` so a live DB row can't resurrect them.

**Matching** (`buildExtracurriculars` + `lib/data/eligibility.ts`) filters by
region → faculty → date → eligibility gate → tier-vs-strength fit.
Key rules, all covered by checks:

- Unknown facts never exclude. No country or no graduation year ⇒ the student
  still sees the whole catalog.
- **Age rules apply, from a range.** We never ask for a birth date, so age is
  inferred from the school year as a range (year N ⇒ N+5 to N+6) and a rule
  only excludes when the WHOLE year group falls outside it. Until this existed,
  age gates fired for nobody: every "Ages 13–18" entry counted as open to a
  12-year-old, and the public checker's headline count was simply wrong.
- Wrong country or past the age ceiling ⇒ hidden. **Too young ⇒ still shown**,
  badged "Eligible from grade N" and never ranked "recommended".
- No faculties chosen ⇒ show everything (it used to show 9 of 86).
- Grade rolls over in **June**, so a rising senior counts as grade 12 over the
  summer and isn't excluded from autumn final-year deadlines.

**Discovery** — weekly cron (`/api/cron/discover`, Tuesdays) searches per
faculty plus one local country, verifies each candidate's deadline against its
own official page, and queues it in `competition_candidates`. Nothing reaches
students without approval at `/admin/opportunities`.
**Never produced a candidate yet — it has not had a Tuesday since deploy.**

**Dates** — `/api/cron/sync-dates` runs daily over a rotating batch of 8. It
reads the landing page *and* the linked "key dates"/"apply" page, because
landing pages carry no deadlines. 6 competitions now have confirmed dates and
8 SAT sittings are synced. Failures report a typed reason
(`fetch_failed` / `no_content` / `model_error` / `declined` / `invalid_date`)
rather than a silent null.

**Link health** — the daily cron records `link_ok` / `link_detail` per
competition; the admin page lists broken links first.

---

## Verification (no API key needed)

```bash
npm run test:links      # every catalog URL; non-zero exit if any is DEAD
npm run test:scrape     # which linked page each competition resolves to
npm run build           # lint + type-check gate
node --import tsx scripts/test-session-checks.ts   # 46 logic checks
```

`test:links` separates *dead* from *blocked*: a 403/429 from a bot wall is
reported but does not fail the run, because a real browser gets through and a
gate that is always red stops being read. Running the checker repeatedly
against the same host will trip that wall — re-run before believing it. A
5xx/timeout is retried once, four seconds later, so a site having a bad minute
doesn't fail the gate; a link that is really dead fails both attempts and is
reported as "(twice, 4s apart)".

`npm run test:discover -- KZ` exercises live discovery but needs a valid
`ANTHROPIC_API_KEY` in `.env.local`.

---

## Next steps, in order

1. **Keep expanding the catalog.** Now **100 entries**. Per-field coverage for
   a year-8 student in Kazakhstan (visible / recommended / open now):

   | field | | field | |
   |---|---|---|---|
   | natural sciences | 49 / 18 / 42 | humanities | 35 / 14 / 30 |
   | engineering | 47 / 15 / 42 | business | 31 / 14 / 28 |
   | computer science | 45 / 18 / 40 | arts & design | 23 / 13 / 21 |
   | medicine | 22 / 9 / 19 | law | 20 / 6 / 17 |

   Law has doubled from the original 10, but its *recommended* count is stuck
   at 6 and that part is **structural, not a sourcing failure**: law is not a
   school subject in most systems, so the honest school-level proxies are
   debate, Model UN and policy writing — and we already carry the accessible
   ones (MUN, IDEA, Immerse, NHD). New law entries land in the selective tier,
   which reads as "stretch" to a 13-year-old. Adding more will not move that
   number; only an accessible-tier law-facing programme would.

   Add entries the same way, and **verify the content, not just the link**: the
   Goi Peace essay contest was dropped from the last batch after its own page
   announced the programme ended with the 2024 edition — while still answering
   HTTP 200. The integrity checks have now caught five duplicate ids, two
   duplicate URLs and three mis-parsed eligibility gates.

2. ~~Fix country normalization.~~ **Done.** `normalizeCountry` reads
   `Shymkent/Kazakhstan`, `Almaty, KZ`, bare cities (`taraz`) and misspellings
   (`Kazahstan`) through three passes — exact, place tokens, spelling-tolerant
   patterns. Note the side effect: students whose country now resolves see a
   SHORTER list, because US-only entries are finally hidden from them.

3. **Run discovery for real and review what it finds.** The whole local
   (Kazakhstan) path is untested against reality. Costs a few cents per run.

4. **Lightweight intake.** 80 of 180 profiles (44%) signed up and filled
   nothing at all — the overlap with "never analyzed" is exactly 100%. Asking
   only for fields + graduation year would personalise Opportunities without
   the full seven-step onboarding they abandoned.

5. ~~Public eligibility checker.~~ **First version built** — `/opportunities`,
   no login (`app/opportunities/page.tsx` +
   `components/opportunities/EligibilityChecker.tsx`). One question (school
   year), then a verdict, five results, a calendar file. Field chips refine the
   answer *after* it has been given, never before. It runs through the same
   `buildExtracurriculars` the dashboard uses, so the public answer and the
   logged-in answer cannot disagree.

   **What building it exposed:** the first draft told a year 7 "you can enter
   79 of these right now", which was false — age rules were being ignored
   entirely (see below). And most cards read "Dates TBA", because only 8 of 96
   entries have a confirmed date. Confirmed-date coverage is now the binding
   constraint on the whole work-removal idea.

   **The dashboard now matches it.** `OpportunitiesView` opened with the whole
   matched catalog in three fit groups — 61 cards for the demo profile, ~35
   under "Recommended" alone for a profile with nothing filled in. So the
   stranger who told us nothing got five cards and a verdict, while the student
   who signed up got the overload screen. It is now the same shape: verdict,
   five, and everything else behind one deliberate tap.

   It also asks **one question inline** when `graduation_year` is missing —
   eight taps, saved by `saveGraduationYear` without opening the intake. Until
   that answer exists no age or grade rule can fire at all, so those students
   (the 44% who filled in nothing) were being shown the unfiltered catalog.

6. **Re-engagement email** to the 44% who never returned — only after (4),
   otherwise they arrive at the same wall. Needs custom SMTP (Resend/Postmark):
   Supabase's built-in mailer is transactional-only and has already hit its
   rate limit. Must include an unsubscribe link. **Sending is the founder's
   call, not an automated step.** Send it on a temporal landmark (1 September,
   term start, new year) — the fresh-start literature says the same email
   performs materially better there.

7. **Remove the work, don't describe it.** Per opportunity: calendar file,
   materials checklist, scheduled reminder. This is the largest effect size in
   the college-access literature (information alone ≈ 0; information plus
   someone doing the form with you ≈ +25–30% enrollment). The calendar file
   ships already — but it is **blocked on date coverage**: with ~6 confirmed
   dates in 96 entries it covers three cards out of five. Getting `sync-dates`
   to actually confirm dates is now a product-critical task, not housekeeping.

8. ~~One field after "I'm doing this".~~ **Built.** Every card on the shortlist
   (and only there — sixty of them would make it a checklist, not a decision)
   offers "I'm doing this", then asks *when will you start?* with four
   near-term options plus an optional where/how. Stored in
   `opportunity_intents` (migration 0022, **applied**), rendered back as a
   first-person plan, with "I entered it" and "Undo".

   This is the implementation-intention mechanic (d = 0.65 across 94 trials)
   and, more importantly, **the only behavioural metric this product can
   collect.** Until now we could measure that a student looked, never that they
   acted — and clicks on "Details ↗" are precisely the metric that convinced a
   whole research literature that nudges worked before they were scaled. The
   intake rework (7) should now be judged on `status = 'applied'`, not on
   session counts.

   Writes are optimistic and **roll back on failure**, so the UI never claims a
   save that did not happen. The commit row is hidden in `/demo`, which has no
   session and therefore could never persist one.

9. **A parent-facing view for grades 5–9.** For that age the parent is the
   decision-maker, and we have never addressed them.

---

## Owner actions outstanding

- **`CRON_SECRET` in Vercel** — both cron endpoints are currently callable by
  anyone. The code enforces the secret as soon as the variable exists.
- **`ANTHROPIC_API_KEY` in `.env.local`** — the local key is invalid, so local
  discovery/analysis scripts fail. Production's key is healthy and unaffected.
- **Nothing pending.** Verified against the live database on 2026-08-02, not
  taken from these notes: 0015, 0020, 0021 and 0022 are all applied. Check it
  the same way rather than trusting this line — one query against
  `information_schema` beats a stale sentence in a plan file:

  ```sql
  select 'link_ok (0021)' as m, count(*) from information_schema.columns
    where table_name='competition_deadlines' and column_name='link_ok'
  union all select 'opportunity_intents (0022)', count(*) from information_schema.tables
    where table_name='opportunity_intents';
  ```
- ~~Two catalog links down at their end.~~ `curieux` (nginx 503) and
  `destination-imagination` (Cloudflare 522) both **recovered within the hour**
  — which is why a same-day outage must never be answered by deleting a
  correct URL.

---

## Traps worth remembering

- **Deploys take longer than they look.** Two measurements looked like "the fix
  failed" when the old build was still live. The cron response now carries a
  `scraper` build marker — check it before drawing conclusions.
- **A landing page is not a dates page.** Deadlines live one click away.
- **Model replies are not clean JSON.** They arrive fenced or with prose;
  `parseJsonLoose` handles it. A bare `JSON.parse` silently swallowed
  every SAT sync for weeks.
- **Audit a parser against the whole dataset before trusting it.** Doing that
  caught "no national selection needed" being read as *requiring* it.
- **`npm run test:links` before every catalog change.** A dead link is the most
  visible quality failure there is — a student found one before we did.
- **A live link is not a live programme.** The Goi Peace essay contest answers
  HTTP 200 and its own page says the contest ended after 2024. `test:links`
  cannot see that. Read what the page actually says before adding an entry.
- **An eligibility sentence with two brackets loses the wider one.** The parser
  takes the first match, so "AMC 10: grade ≤10 … AMC 12: grade ≤12" capped the
  AMC at grade 10 and hid it from every 11th and 12th grader, and "Junior
  (under 15) and Senior (15+)" read as an age ceiling of 14. Both were live in
  the catalog for weeks. Two-bracket entries need an explicit `gate`; the
  "every entry is reachable by at least one real student" check now guards it.
- **A duplicate id is not the only kind of duplicate.** Two ids pointing at one
  URL put the same programme in two fit groups at once. Checked now.
