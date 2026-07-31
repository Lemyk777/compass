# Opportunities — status & next steps

Working notes for the Opportunities feature (catalog, discovery, matching).
Last updated: 2026-07-29.

The long-term intent is that this becomes a product in its own right, not just
a dashboard section — a student should get value from it before, or instead of,
running an admission analysis.

---

## Where it stands

**Catalog** — 86 curated opportunities in `lib/data/key-dates.ts`
(19 olympiads · 34 competitions · 13 summer programmes · 7 research
programmes + publishing). Every link verified: `npm run test:links` reports
86/86 healthy.

**Matching** (`buildExtracurriculars` + `lib/data/eligibility.ts`) filters by
region → faculty → date → eligibility gate → tier-vs-strength fit.
Key rules, all covered by checks:

- Unknown facts never exclude. No country or no graduation year ⇒ the student
  still sees the whole catalog.
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
npm run test:links      # every catalog URL; non-zero exit if any is broken
npm run test:scrape     # which linked page each competition resolves to
npm run build           # lint + type-check gate
node --import tsx scripts/test-session-checks.ts   # 36 logic checks
```

`npm run test:discover -- KZ` exercises live discovery but needs a valid
`ANTHROPIC_API_KEY` in `.env.local`.

---

## Next steps, in order

1. **Expand the catalog further.** Deliberately deferred until matching was
   fixed so new entries land in the correct system. Thinnest fields by
   field-specific count: law (10), arts & design (12), medicine (16).
   Add entries the same way: verify the URL first, then run the integrity
   checks — they have caught five duplicate ids so far.

2. **Fix country normalization.** Real profiles contain
   `Shymkent/Kazakhstan`, `taraz`, `Kazahstan`, which `normalizeCountry`
   (`lib/data/geo.ts`) does not recognise, so those students lose local
   opportunities. Needs substring matching plus a city→country hint list.

3. **Run discovery for real and review what it finds.** The whole local
   (Kazakhstan) path is untested against reality. Costs a few cents per run.

4. **Lightweight intake.** 80 of 180 profiles (44%) signed up and filled
   nothing at all — the overlap with "never analyzed" is exactly 100%. Asking
   only for fields + graduation year would personalise Opportunities without
   the full seven-step onboarding they abandoned.

5. **Public catalog page.** All 86 opportunities with field/level filters, no
   login. The entry point if this is to stand alone as a product, and an SEO
   asset.

6. **Re-engagement email** to the 44% who never returned — only after (4),
   otherwise they arrive at the same wall. Needs custom SMTP (Resend/Postmark):
   Supabase's built-in mailer is transactional-only and has already hit its
   rate limit. Must include an unsubscribe link. **Sending is the founder's
   call, not an automated step.**

---

## Owner actions outstanding

- **`CRON_SECRET` in Vercel** — both cron endpoints are currently callable by
  anyone. The code enforces the secret as soon as the variable exists.
- **`ANTHROPIC_API_KEY` in `.env.local`** — the local key is invalid, so local
  discovery/analysis scripts fail. Production's key is healthy and unaffected.
- Migrations 0020 and 0021 are **applied**; nothing pending.

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
