# Opportunities — status & next steps

Working notes for the Opportunities feature (catalog, discovery, matching).
Last updated: 2026-08-05.

**Direction of the whole project is changing.** We are moving the centre of
Compass off *scoring a portfolio* and onto *giving a student opportunities*. The
admission analysis stops being the product and becomes one input; Opportunities
becomes the product a student comes for. A student should get real value here
before, or entirely instead of, running an admission analysis — the scoring
engine keeps working, but it is no longer the thing we build the front door
around. This is the plan of record for now.

**Read [OPPORTUNITIES_RESEARCH.md](OPPORTUNITIES_RESEARCH.md) before designing
any of it.** Short version: every large trial of "tell students about their
options" measured zero, including one with 800,000 students. What moved
behaviour was removing ambiguity about eligibility and removing the work. So the
public surface below must be an **eligibility checker**, not a browsable
catalog — and the catalog's growth belongs in the matching, not on the screen.

---

## Where it stands

**Latest (2026-08-05, evening) — Opportunities left the report's sidebar.**

The front door had been declared the product for days while still being served
as *one of eight tabs inside the admission report's shell*. A student who came
to find what they can enter landed in a portfolio-scoring console with their
profile score at the centre — the exact inversion of the plan. That is now
fixed, structurally rather than by copy:

- **`/opportunities` is a top-level page for both states** — the guest
  eligibility checker as before, and, signed in, the full matched view inside a
  new `StudentShell` (`components/student/`): logo, two destinations
  (Opportunities · Guide), the report a link on the right. `/dashboard/opportunities`
  redirects, so old links and bookmarks survive.
- **The report's sidebar keeps the Opportunities tab only for a student who
  already has an analysis** (owner call, and the right one). For them the report
  is something they built and return to; pulling a panel out of it mid-flight
  reads as the feature being deleted. So they keep the old shape exactly, and
  the panel now opens with a loud door across to the dedicated section — where
  the questionnaires, the careers layer and the map live. A student with **no**
  analysis has no report to speak of: no tab, `/dashboard/opportunities`
  redirects to the section, and the sidebar's top link goes up to it. `/demo`
  always shows the tab — it previews the report shell with no account.
- **New `/guide` page** — the whole "where can this take me" story in one place:
  every field's spheres of work, then **where in the world that work actually
  is** (`lib/data/world.ts`, 22 hubs from Almaty and Tashkent to Zurich, Seoul
  and Toronto), then what to enter from home this year. The careers panel moved
  off the Opportunities page into it; `CareersPanel.tsx` is deleted.
- **Every hub carries its catch and a real route in** — GKS, MEXT, CSC, Türkiye
  Bursları, Italian DSU, German semester fees, the Dutch orientation year, the
  Canadian PGWP ladder. A city listed with only good news is an advert, and a
  unit test fails the build if one appears. No salary figures or rankings: those
  rot, structural facts don't.
- **The home region leads the map on purpose** (Central Asia & the Caucasus
  first, also test-enforced) — "you don't have to move" is a section of the
  guide, not an afterthought, because for our students it is often the right
  answer.
- **Signup lands on `/opportunities`**, and the landing page's closing CTA sends
  a returning student there rather than to the report.

**Earlier (2026-08-04/05) — the front door became the product. All shipped:**

- **Signups no longer meet the questionnaire.** A brand-new student lands on
  `/dashboard/opportunities`, not `/onboarding`. The full profile/analysis intake
  is now opt-in ("Update profile", "Get the full report"). Don't re-add a
  mandatory gate.
- **The default intake is two inline questions**: school year (`YearPrompt` →
  `saveGraduationYear`) then field (`FieldPrompt` → `saveFaculties`). Empty
  faculties stays a valid answer meaning "show everything".
- **Optional interest quiz** (`lib/data/interest-quiz.ts` +
  `components/opportunities/InterestQuiz.tsx`) for the student who can't answer
  "what field?" — 6 questions, fixed per-option weights, pure deterministic
  scoring, top 3 fields returned as an editable selection.
- **Careers layer** (`lib/data/careers.ts` + `CareersPanel.tsx`) — 4–5 career
  **areas** per field (what that kind of work actually is, the real job titles
  inside it, and the path in), collapsed by default. The surface reads
  interest → field → area → what to enter next.

  **We name spheres, not one profession (owner call, 2026-08-05).** The layer
  first shipped as four exact job titles per field. That is a guess about what is
  in a student's head, and we have no evidence for it; an area plus its roles is
  a claim we can stand behind *and* is far likelier to contain the thing they
  actually want. Same reasoning as "unknown facts never exclude" — widen when
  the evidence is thin instead of inventing precision. `roles.length >= 3` per
  area is enforced by a unit test so the shape can't quietly regress to one job.
- **One product, not two sites.** A signed-in student hitting the public
  `/opportunities` is redirected to their in-dashboard view; the landing header
  and CTAs recognise a session ("Dashboard", not "Log in"/"Sign up"). An animated
  "Your direction, so far" summary (`DirectionSummary.tsx`) fills in as answers
  land.
- **Calendar download fixed.** `downloadIcs` revoked the object URL synchronously
  after `click()`, which cancelled the download intermittently — the "works by
  mood" bug. The anchor is now in the DOM and teardown is deferred.
- **Six wrong deadlines corrected** against official sources (see "Dates" below).
- **Engineering:** the 3,385-line `key-dates.ts` was split (catalog →
  `competitions-data.ts`, formatters → `opportunity-format.ts`), the catalog is
  lazy-loaded out of the initial bundle (First Load JS: `/dashboard/opportunities`
  200 → 179 kB, `/opportunities` 134 → 108 kB; the career areas added ~6 kB back
  on the dashboard route, 185 kB today), the commitment cluster moved to
  `CommitRow.tsx`, and `scripts/test-engine.ts` (21 unit tests) now runs in CI.

**Earlier (2026-08-03), also shipped:**
- **Honest cost & accessibility panel.** Tapping any opportunity opens a detail
  panel (`components/opportunities/OpportunityDetail.tsx`) showing what it is,
  who runs it, who it's for, why it's worth it — and, FIRST, what it COSTS. Cost
  is a first-class field on `Competition` (`cost: CostModel`, 10 values from
  `free` to `unknown`, + `costDetail`), rendered by `opportunityCost()` and shown
  as a colour-coded `CostPill` on the card too, so "this costs money" is never
  hidden behind a click. `unknown` is the honest default — never implies free.
- **8 free industry certificates open to under-18s** (IBM SkillsBuild, AWS
  Educate, Google Skillshop, freeCodeCamp, GitHub Foundations, Cisco Skills for
  All, Microsoft Learn = `free_cert_paid`, Sololearn = `freemium`) — age AND cost
  verified against each provider, not from memory.
- **Confirmed dates 8 → 17.** Hand-verified 6 more autumn-2026 deadlines against
  official pages (Congressional App, YoungArts, Wharton, Breakthrough Junior,
  Astro Pi, Purple Comet); two were correcting plain-wrong estimates. Most
  2026-27 dates simply aren't published yet in August — those stay honest "Dates
  TBA" for the `sync-dates` cron to confirm as organisers publish through autumn.
- `alwaysOpen` distinguishes self-paced things ("open now") from unannounced
  cycles ("dates TBA"). Candidate fee/date research notes live in
  [OPPORTUNITIES_CANDIDATES.md](OPPORTUNITIES_CANDIDATES.md).

**Catalog** — 156 curated opportunities in `lib/data/competitions-data.ts` (the
array moved out of `key-dates.ts`, which now holds the matching logic and
re-exports the data). Every link
verified: `npm run test:links` reports 155/156 healthy (only `ijso` down — an SSL
failure on its official domain, left in place per the "don't delete on a same-day
outage" trap).

**Age is eligibility, so it is verified, not assumed.** The +8 free industry
certificates people share as "free and valuable" were added only after each
one's age policy was checked against the source and confirmed open to under-18s,
each with an `ageMin` gate encoded: IBM SkillsBuild (13–18), AWS Educate (13/14+),
GitHub Foundations (students 13+), Google Skillshop (no age limit), freeCodeCamp
(all ages), Microsoft Learn (13+), Cisco Networking Academy / Skills for All
(13+, mobile-first), Sololearn (13+, phone-first). The 18+/enterprise ones from
the same lists were deliberately NOT added — Salesforce Trailhead (account 18+),
MongoDB University, NVIDIA DLI, Snowflake — and Codecademy (16+) was passed over
as freeCodeCamp already covers free coding: showing a 14-year-old an 18+ course
is the exact "is this for me?" ambiguity the whole section exists to remove.

The 2026-08-02 push (three passes, +48: 100 → 148) was built around the
section's actual mission — students who are NOT in a first-tier country (London /
US / Hong Kong already drown in options; the point is Kazakhstan, Uzbekistan, the
wider CIS and Europe, where a student has to hunt). So the additions are
deliberately **global, online, and free / aided**, never US-school-bound:

- **The whole `course` type, previously empty → ~21 entries.** CS50 AI /
  Cybersecurity / Web / Python / Games, MIT 6.S191, Stanford Code in Place, Full
  Stack Open, Elements of AI, Andrew Ng's ML, The Missing Semester, MIT Linear
  Algebra & 8.01 Physics, Harvard Justice, Yale Psychology, Learning How to
  Learn, Model Thinking, MRU economics, Google Data Analytics, Duke Genetics.
  Free courses are the single most accessible thing a student far from opportunity
  can hold, so this type is now the largest — and a **"Courses" tab** was added
  to the dashboard filter.
- **Remote, paid internships / research:** Google Summer of Code, Outreachy, MLH
  Fellowship, LFX (Linux Foundation) Mentorship — work you can do from anywhere.
- **Contests across fields:** iGEM, picoCTF, Kaggle, **Zindi** (built for
  emerging markets), DrivenData, Codeforces, AtCoder, CodinGame, Hack Club,
  **FIRST Global** (one team per country by design), CERN Beamline for Schools,
  IAAC, Cubes in Space, IYPT, IM²C, the NY Academy Junior Academy, the Adroit
  Prizes and Foyle Young Poets.
- **Aided maths summers:** Ross, Mathcamp.

All dates are unconfirmed estimates (shown "Dates TBA") for the cron to confirm.
Deliberately NOT duplicated: Technovation, Conrad, Diamond, IEO, Brain Bee,
Purple Comet, PROMYS, all the major olympiads, FLL, Astro Pi and the rest were
already in the catalog. Two entries were pulled when `test:links` found their
official sites down (F1 in Schools, Marshall Society) — better absent than broken.
The remaining global-and-verifiable gaps are now thin; further growth is better
served by discovery (local/regional finds) than by more hand-curation.

An earlier pass added 12 entries a student can enter **in grades 5–9** —
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
landing pages carry no deadlines. **12 of 156 entries have a confirmed date**
plus SAT sittings — see step (3), date coverage is still the constraint on
everything in the "remove the work" direction.

**The count went DOWN on 2026-08-05, and that was the right move.** A user
reported countdowns that "were definitely wrong", so all 16 confirmed dates were
re-checked against official sources. Eight were correct (IYMC, Breakthrough
Junior, YoungArts, Wharton, Congressional App, Regeneron STS, Astro Pi, NASA
Space Apps). Six were not, and the failure mode is worth remembering — **every
one was a real date that is not a student deadline**:

| Entry | Was | Reality |
|---|---|---|
| USACO | "deadline" 9 Jan | no registration deadline exists; 2026–27 schedule unpublished → `dateConfirmed: false` |
| F=ma / USAPhO | "deadline" 12 Feb | that's the *exam* date, unpublished for 2027 → `dateConfirmed: false` |
| ISEF | 1 Feb + "finals May 12–18" | no single deadline (regional fairs); finals are May 8–14 → `dateConfirmed: false` |
| Advent of Code | "deadline" 1 Dec | 1 Dec is the **start**; nothing to submit by → `alwaysOpen` |
| AMC | 28 Oct | that's *late* registration (returning managers only) → 15 Oct |
| Math Kangaroo | 15 Dec | that's the deadline to start a school *centre* → 31 Dec (student enrolment) |

The lesson: a date on the page is not automatically *the* deadline. "Start
date", "exam date", "late deadline" and "organiser-only deadline" all look like
deadlines and all mislead a student who trusts a countdown. Failures report a typed reason
(`fetch_failed` / `no_content` / `model_error` / `declined` / `invalid_date`)
rather than a silent null.

**Link health** — the daily cron records `link_ok` / `link_detail` per
competition; the admin page lists broken links first.

---

## Verification (no API key needed)

```bash
npm run test:unit       # 21 unit tests — scoring, eligibility, quiz, careers, matching
npm run test:links      # every catalog URL; non-zero exit if any is DEAD
npm run test:scrape     # which linked page each competition resolves to
npm run diag:dates      # deterministic date-confirm ceiling over the WHOLE catalog
npm run build           # lint + type-check gate
node --import tsx scripts/test-session-checks.ts   # 60 logic checks
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

**CI runs the build, the logic checks and the unit tests on every push and pull
request** —
[.github/workflows/ci.yml](../.github/workflows/ci.yml), no secrets needed.
Link health is a separate weekly job, deliberately outside the gate: from
GitHub's runners the answers differ from what a student gets (the first run
called NYU Shanghai broken and seven others bot-walled, all fine from an
ordinary connection). Reproduce locally before touching a catalog entry.

**Never run `npm run build` while `npm run dev` is running** — they share
`.next/` and the build removes chunks the dev server still holds. The resulting
`Cannot find module './NNNN.js'` is not a code bug. Recover with `rm -rf .next`.

---

## Reality check before more features (2026-08-02)

The steps below are mostly conversion mechanics, and they are well-evidenced.
But an honest read of where the product actually is says the next move is **not
another mechanic** — it is a feedback loop. Recording this so the momentum of
"ship the next research rule" doesn't bury it:

1. **We build faster than we can learn.** `opportunity_intents` is called the
   only behavioural metric this product has — yet nothing reads it. Rule 4
   (implementation intention), rule 5 (why-matters) and rule 8 (endowed
   progress) are all shipped and all justified by "converts better", and none
   can be confirmed, because there is no admin view of intents / profile
   completion and no traffic to measure. The research doc's own lesson is
   "measure behaviour, not clicks" — and we measure neither.
2. **~180 signups is a demand question, not a conversion question.** At that
   scale, endowed progress and implementation intentions are rearranging deck
   chairs. Ten to twenty real user conversations outweigh the next five rules.
3. **Unresolved audience split.** The research pivot aims younger (grades 5–9,
   parent decides); the rest of the product — analysis, college lists, odds, 5
   country engines — serves 17-year-olds applying now. Serving both dilutes both.
4. **The date layer, the foundation of "remove the work", is ~15% ready.** The
   cron works but coverage is seasonal; 52 entries will never confirm by scrape.
   This needs a decision (curate the top ~30 by hand, or a headless renderer),
   not just "wait for autumn".
5. **No distribution anywhere in the plan.** It is entirely product. The best
   funnel with no top is zero. How the target student/parent in the CIS finds
   this is unaddressed and may be the real bottleneck behind "44% filled nothing".

**So the true next priority is instrumentation** — an admin view of the intents
funnel (planning → applied) and profile completion — which is the one build that
makes every mechanic above verifiable. Then user conversations, then the
audience and date-layer decisions. Only then more rules.

---

## The guidance product — what's built and what's left

The current thread (2026-08-05). The goal is a coherent careers-guidance path,
not a pile of features, and the ergonomic constraint is fixed: **only the two
questions are ever mandatory; everything else is optional, collapsible and
ignorable.** The surface is one page (Opportunities), layered:

| Stage | The student's question | Where it lives | Status |
|---|---|---|---|
| Who am I | "what am I into?" | interest quiz | ✅ shipped |
| Where does it lead | "who could I become?" | `careers.ts` + `/guide` | ✅ shipped (areas, not one job) |
| Where in the world | "where is that work, and can I get there?" | `world.ts` + `/guide` | ✅ shipped (22 hubs, each with its catch) |
| What do I want from it | "which of those suits me?" | `values.ts` + `ValuesRefine` | ✅ shipped (reorders areas only) |
| What do I do | "what can I enter?" | the matched list | ✅ shipped |
| Where do I stand | "what are my odds?" | the opt-in analysis | ✅ shipped |

Left, in the order they're worth doing:

1. ~~**Careers in the quiz result.**~~ **Done, 2026-08-05.** The quiz used to end
   on bare field names; each selected field now carries its career **areas**
   ("Kinds of work they open" — sphere titles only, joined by `·`), which is the
   "oh — *that's* where this goes" moment without pretending we know which job
   they want. Deliberately titles-only: the full roles-and-path list is one
   screen away in `CareersPanel`, and a wall of forty job titles at the end of a
   quiz is the overload screen we keep removing.
2. ~~**Values / strengths refine.**~~ **Done, 2026-08-05.**
   `lib/data/values.ts` + `ValuesRefine.tsx`, living inside the (collapsed)
   careers panel: three questions, fixed weights, pure scoring, six axes
   (earning well / helping people / independence / security / working with
   people / making things). Every career area carries 2–3 of those tags.

   **What it is allowed to do is deliberately narrow — it only REORDERS the
   areas inside the fields the student already chose.** It does not touch the
   fields themselves, because the fields drive which opportunities we show and
   "I want to earn well" is not evidence about what a 14-year-old should enter
   next month. It never hides an area either: unit tests pin the ranking as a
   permutation, and an unanswered (or non-matching) refine leaves the curated
   order untouched with nothing badged.

   Two honesty rules fell out of building it, both now enforced:
   - **A field with no matching area badges nothing.** Law offers no
     "independence / making things" sphere, so a student who wants those gets
     the plain list back rather than an invented match. The first version of the
     test asserted a badge always appears; the *test* was wrong, not the code.
   - **The tags are generalisations, and the UI says so** — pay and security
     vary enormously by country and employer, and most of our students are not
     in the countries these generalisations were written about.

   Answers live in `localStorage` (`compass.work-values.v1`), not the profile:
   nothing server-side reads them, so a column and a manual migration would buy
   nothing. Promote it if that ever changes.
3. **A mentor answer.** One persistent "ask" entry point for the questions a
   quiz can't take ("I like biology but I faint at blood"). Needs cost bounds and
   a clear refusal boundary before it ships.
4. **Reflection in the student's own words** — the open-ended half of "what do
   you want", complementing the structured quiz.

## Next steps, in order

1. **Keep expanding the catalog.** Now **156 entries** across 5 types
   (competition, olympiad, course, summer_program, research_program). The
   guiding filter for new entries is the mission: would a student in Kazakhstan
   or Uzbekistan, with no first-tier network, actually be able to do this? Prefer
   global + online + free/aided over anything US-school-bound. Per-field coverage
   below predates the 2026-08-02 pass — re-measure with `diag:dates`/matching:

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

3. **Confirmed dates — the binding constraint, and the most valuable thing
   left.** Only **8 of 100** entries have a sourced date for the current cycle.
   Everything else renders as "dates not yet announced", so the calendar file —
   the highest-effect feature available to us — covers three cards out of five.
   No amount of design fixes that. `/api/cron/sync-dates` rotates 8 entries a
   day and has never been confirmed to work end to end in production.

   **`npm run diag:dates` now measures the ceiling** (whole catalog, no API key
   — it runs the production fetch + two-hop link discovery and asks only whether
   a STRONG deadline signal, a deadline word next to a real date, survives).
   Measured 2026-08-02:

   | bucket | count | meaning |
   |---|---|---|
   | STRONG (word + date) | **48 / 100** | ceiling on what scraping can ever auto-confirm |
   | weak (date only) | 18 | model would have to guess which date — rejected by design |
   | weak (word only) | 9 | deadline word, no parseable date on the page |
   | none | 25 | JS-rendered or bot-walled — scraper sees nothing |
   | landing fetch failed | 0 | every landing page is reachable |

   This **splits the problem the plan had been treating as one**:

   - **42 entries are addressable in principle** — they reach a STRONG page but
     `dateConfirmed` is still false. The scraper logic is not the blocker. `~49`
     is the theoretical ceiling; see the empirical check below for why the real
     August yield is far lower. The addressable ids are printed by `diag:dates`.
   - **52 entries are structurally stuck** — no STRONG signal exists anywhere
     the scraper can read, so no amount of cron runs will ever confirm them.
     These need a *different* mechanism: hand-curated dates (the honest fallback
     we already use for the 8) or a headless-browser render for the 25 JS-only
     sites. Do **not** keep pointing the scraper at them and calling the null a
     bug — it is the correct answer for that page.

   **Empirical check — the cron was triggered by hand in prod, 2026-08-01, and
   this corrected the diagnosis.** `GET https://applycompass.app/api/cron/sync-dates`
   returned 200 in 40s, build marker `two-hop-v2`. It is NOT true that the cron
   never runs: it fired, the model answered, and the writes landed —
   **SAT synced 16 sittings** (was 8) and **launchx confirmed 2026-08-12** live.
   So the pipeline works end to end. But of the day's 8-entry batch, only launchx
   confirmed; the other seven **honestly declined**, and the reasons are the real
   constraint, not a bug:
   - *Next cycle not published yet.* telluride-tasp, clark-scholars, promys,
     garcia-center all show only past (2026) dates in early August; the model
     correctly refuses to guess the 2027 date. Most programmes publish their next
     deadline in the **autumn**, so the diagnostic's STRONG count is inflated by
     expired dates and the real yield rises as the term starts.
   - *No fixed deadline exists.* nyu-shanghai-summer, cuhk-shenzhen-summer,
     pioneer-academics are rolling/branch-campus summer programmes — a general
     admissions page with no single competition deadline to find.

   So the corrected ranked work under (3) is: **(a)** the cron already works and
   is already scheduled — **let it run through the autumn publishing season** and
   re-measure monthly rather than treating it as broken; **(b)** re-run
   `diag:dates` in Sept/Oct/Nov and hand-curate only what is *published but still
   declined*; **(c)** move the rolling/no-deadline entries (branch-campus summer
   programmes) off the "confirmable date" expectation entirely — they should read
   "rolling admissions", not "date TBA"; **(d)** decide separately whether the 25
   JS-rendered sites are worth a headless renderer or should just be curated.

4. ~~Lightweight intake.~~ **Done, in two places.** The dashboard asks for the
   school year inline when `graduation_year` is missing — eight taps, saved by
   `saveGraduationYear`, without opening the intake. Until that answer exists
   not one age or grade rule can fire, so those students were being shown the
   unfiltered catalog. And onboarding now **pays before it asks again**:
   `components/onboarding/FirstWin.tsx` appears under the first screen the
   moment a graduation year is picked — how many opportunities are already
   open, the nearest deadline, three to start with, and the line that they keep
   it whether or not they finish. Step pills mark a section done when it holds
   an answer, not when you have walked past it.

   Not done: the remaining four intake screens still ask and give nothing back.
   FirstWin is the first payout, not the whole rework.

   **Endowed-progress readiness added (research rule 8), 2026-08-02.** The
   dashboard empty state now shows a checklist of the seven profile facts,
   pre-credited for what we already know (country from signup, often the school
   year), so it opens **part-filled** rather than at zero — the documented
   counter-move to the 44%. `lib/data/readiness.ts` is a pure module (`buildReadiness`,
   covered by the logic checks); the layout derives the booleans server-side and
   passes them through `DashboardContext`; `ReadinessCard` in
   `components/dashboard/states.tsx` renders it and self-hides in demo, when the
   profile is complete, or before a summary exists. Placed on the DASHBOARD, not
   onboarding, and worded non-coercively on purpose — FirstWin deliberately
   avoids a completion bar in the intake itself, so this addresses the returning,
   already-bounced student instead.

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
   ships already — but it is **blocked on date coverage**: 8 confirmed dates in
   100 entries covers three cards out of five. See (3).

8. **Run discovery for real and review what it finds.** The whole local
   (Kazakhstan) path is untested against reality. A few cents per run, and it
   needs a working `ANTHROPIC_API_KEY` locally or a production trigger.

9. ~~One field after "I'm doing this".~~ **Built.** Every card on the shortlist
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

   **Now paired with self-generated relevance** (research rule 5). Once a student
   has committed, one optional line appears: *why does this matter to you?* — in
   their own words, framed for autonomy ("why you're in", not "why this helps
   admissions"). The utility-value literature finds the interest gain comes from
   the student writing the reason, not from our blurb telling them, and is
   largest for exactly the weak-profile students we serve. Stored in
   `opportunity_intents.why_matters` (migration **0023 — PENDING manual apply**).
   Deliberately degradation-safe: the read selects `*` and the write only touches
   the column when a student fills it in (falling back on `undefined_column`), so
   a deploy that lands before 0023 keeps the whole "I'm doing this" flow working.
   The research doc flags this one as a **hypothesis to measure, not a
   certainty** — at least one online replication found nothing — so judge it on
   `status = 'applied'`, not on how many notes get written.

10. **A parent-facing view for grades 5–9.** ~~Planned.~~ **Deprioritised for
   now (owner call, 2026-08-02).** The evidence still holds — for that age the
   parent is the decision-maker (see OPPORTUNITIES_RESEARCH.md) — but it is not
   on the near-term build list. Left here so the rationale isn't lost if we
   return to it.

---

## Owner actions outstanding

- ~~Confirm the `sync-dates` cron actually fires.~~ **Done, 2026-08-01 — it
  fires and works end to end.** Manual `GET /api/cron/sync-dates` returned 200 in
  40s (build marker `two-hop-v2`), synced **16 SAT sittings** and confirmed
  **launchx 2026-08-12** live. The "7 → ~49, just run the cron" model was wrong:
  the limiter is not a broken cron but the **autumn publishing calendar** (most
  next-cycle deadlines aren't posted in August, so the model honestly declines)
  plus a few rolling/no-deadline entries. The action is now patience + a monthly
  re-measure, not a fix — see step (3).
- **`CRON_SECRET` in Vercel** — both cron endpoints are STILL callable by anyone
  (that is how the manual trigger above worked without auth). Now that the cron
  is confirmed healthy, set the secret to close the endpoint; the code enforces
  it the moment the variable exists, and Vercel's scheduled run sends the header
  automatically.
- **`ANTHROPIC_API_KEY` in `.env.local`** — the local key is invalid, so local
  discovery/analysis scripts (and any local `sync-dates` run) fail. Production's
  key is healthy and unaffected — which is why the prod cron confirmed dates
  live (above) while `test:discover` still fails locally.
- ~~Apply migration `0023_intent_why_matters.sql`.~~ **Done** — verified applied
  on 2026-08-05.
- ~~**Migrations current.**~~ **Audited against the live database 2026-08-05, and
  one was missing.** Everything from 0011 through 0023 was applied — but
  **`0010_graduation_year` never had been**, so `saveGraduationYear` had been
  failing silently for months: students were re-asked their school year every
  visit and nothing downstream of `graduation_year` (age gates, the timeline)
  could work for them. Applied 2026-08-05. This is exactly the drift the manual
  process invites; re-run the audit query below periodically rather than
  trusting any note in this file:

  ```sql
  with checks(migration, applied) as (
    select '0010 graduation_year', exists(select 1 from information_schema.columns
      where table_name='student_profiles' and column_name='graduation_year')
    union all select '0011 competition_deadlines', to_regclass('public.competition_deadlines') is not null
    union all select '0015 date_confirmed', exists(select 1 from information_schema.columns
      where table_name='competition_deadlines' and column_name='date_confirmed')
    union all select '0018 school_years', exists(select 1 from information_schema.columns
      where table_name='student_profiles' and column_name='school_years')
    union all select '0020 competition_candidates', to_regclass('public.competition_candidates') is not null
    union all select '0021 link_ok', exists(select 1 from information_schema.columns
      where table_name='competition_deadlines' and column_name='link_ok')
    union all select '0022 opportunity_intents', to_regclass('public.opportunity_intents') is not null
    union all select '0023 why_matters', exists(select 1 from information_schema.columns
      where table_name='opportunity_intents' and column_name='why_matters')
  )
  select migration, case when applied then 'applied' else 'MISSING' end as status
  from checks order by migration;
  ```

  Adopting the Supabase CLI (`supabase link` + `migration repair` to baseline the
  existing 22, then `db push`) would remove this class of bug entirely. Scoped
  and deferred by owner call on 2026-08-05 — it needs the owner's login.
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
- **A date on the page is not *the* deadline.** Six of sixteen "confirmed" dates
  were a start date, an exam date, a late-registration deadline or an
  organiser-only deadline. See the Dates section — the countdown is the most
  trust-destroying thing we render, so an entry only earns `dateConfirmed` when
  the date is the one a *student* must hit.
- **A missing migration looks like a code bug.** `graduation_year` was absent
  from prod for months; the app degraded quietly (as designed) so nothing
  surfaced except students being re-asked their year. Check the column exists
  before debugging the code.
- **Don't import `key-dates` at runtime from a client component.** It builds a
  map over the whole catalog at module load, so the ~128 kB dataset lands in that
  route's bundle. Use `opportunity-format.ts` for formatters and dynamic-import
  the matching engine. Type-only imports are free.
- **A revoked object URL cancels the download.** `URL.revokeObjectURL` called
  synchronously after `a.click()` made the .ics download work "sometimes" — the
  hardest kind of bug report to act on. Defer teardown, and keep the anchor in
  the DOM.
