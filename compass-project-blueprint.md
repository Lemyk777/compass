# Project Blueprint — AI Admissions Guidance Platform

> Working name: **Compass** (placeholder — rename freely). The name should signal *direction/guidance*, not prediction, because guidance is the real value and the part you can actually deliver well.

---

## 1. What this is (and what it deliberately is NOT)

**It is:** an AI guidance tool for internationally-minded students — especially in markets where good college counseling barely exists — that takes a student's academic profile and tells them *where they realistically stand* and *what to do next* to strengthen their application to **American universities**.

> **Scope (for now): US universities only.** The entire analysis is tuned for the US holistic admissions system. This is a feature, not a limitation — going deep on one system beats spreading thin across many, and it sharply simplifies the intake, the data you need, and the AI logic. Other destinations (UK, Canada, Europe) can be added later once the US experience is genuinely good.

**It is NOT:** a single overconfident number ("you have a 37% chance at Harvard") presented as fact. Admission at selective US schools is holistic and high-variance, so any *likelihood* is an estimate — shown as a **range with a confidence level**, never a falsely precise point. But the tool absolutely *is* heavily quantified: the part it scores with confidence is the **profile itself** (leadership, academics, testing, etc.), where numbers are honest and genuinely useful. The output is a rich, data-driven report — scores, charts, likelihood ranges, benchmarks, and ranked school recommendations — plus the reasoning and action plan behind every number.

The honesty rule that shapes everything: **profile-factor scores are stated confidently** (they describe the student); **admission likelihoods are ranges with confidence levels** (they predict an uncertain outcome). That distinction is what lets you show lots of numbers *and* stay trustworthy.

**Distribution:** YYGS ambassador network → underserved countries (Africa, Arab world, Southeast Asia, Central Asia) where incumbents like CollegeVine are absent.

**Goal:** 3,000–10,000 users across 10–15+ countries. Not for profit; downside strictly capped at coffee-money levels.

---

## 2. The system at a glance

Three roles, one shared backend:

| Role | What they do | What they see |
|------|--------------|---------------|
| **Student** | Enter profile → get analysis → act on it | Profile intake + results dashboard |
| **Ambassador** | Recruit students in their country | Referral link, live impact stats, leaderboard, assets |
| **Founder (you)** | Run everything, watch costs, manage ambassadors | Admin dashboard, metrics, cost caps, content control |

Everything connects through one database and one AI analysis engine. A student who signs up via an ambassador's link is permanently attributed to that ambassador — that attribution is the spine of the whole growth model.

---

## 3. Student side (the core product)

### 3.1 Journey

1. **Land** on a clear, fast, mobile-first page. One sentence of value: *"Find out where you really stand for top US universities — and exactly what to fix. Built for international students."*
2. **Try before signup (optional but powerful):** let them get a teaser result with minimal input, then ask for an account to unlock the full plan. Lowers friction massively.
3. **Profile intake** (see 3.2).
4. **AI analysis** runs (a few seconds).
5. **Results dashboard** (see 3.3) — saved to their account so they can return, update, and re-run as their profile improves.
6. **Share** their result card (drives organic growth + gives ambassadors something concrete to show).

### 3.2 Profile intake — what you collect

The international focus lives here. Most tools assume a US student; yours must not.

- **Country & curriculum** — this is the first question and it reshapes the rest. (A-Level, IB, national curriculum, US GPA, etc.)
- **Academics** — grades *in their own system*, with the tool normalizing them internally. Never force a 4.0 GPA on an A-Level student.
- **Standardized tests** — SAT/ACT, IELTS/TOEFL, and subject results (AP/IB/A-Level subjects + grades/predicted grades).
- **Extracurriculars / awards / leadership / projects** — free text + structured tags.
- **Target US universities + intended major** — pick from a curated list of American schools.
- **(Destination is fixed: US universities only, for now.)** No country selector needed — the whole engine is tuned for US holistic admissions, which keeps the intake shorter and the logic sharper.
- **Citizenship + financial-aid need** (optional) — flags need-aware vs need-blind realities at US schools, which matter enormously for international applicants.

Design rule: **progressive disclosure.** Don't show a 40-field form. Ask in short steps with progress, mobile-thumb-friendly.

### 3.3 The output — a rich, visual, data-driven report

The result is **not just text**. It's an interactive report that combines scored metrics, charts, numbers, and reasoning. Core components:

- **Profile Scorecard (the centerpiece):** every dimension scored out of 10 and visualized — e.g. *Academics 8/10 · Test scores 9/10 · Course rigor 7/10 · Leadership 7/10 · Extracurricular depth 6/10 · Awards & recognition 5/10 · Narrative / fit 6/10.* Shown as a **radar (spider) chart** for overall shape at a glance, plus a **horizontal bar** per factor with a one-line note explaining each score.
- **Overall competitiveness score:** a single headline number (e.g. **73/100**) summarizing profile strength, displayed as a gauge, with the factor breakdown sitting behind it.
- **Per-school admission likelihood:** for each target school, a likelihood **range with a confidence level** — e.g. *"Princeton: 8–15%, lower confidence"*, *"Boston University: 55–70%, higher confidence"* — shown as a labeled **gauge or bar** and color-coded **Reach / Target / Likely**. Ranges (not single numbers) keep it honest while still giving students the percentages they want.
- **School comparison chart:** all of the student's target schools on one **sorted bar chart** of likelihood, so they instantly see whether their list is balanced or all reaches.
- **Benchmark vs typical admits:** where Common Data Set figures allow, show how the student's stats sit against a school's mid-range admitted profile (e.g. SAT 25th–75th percentile band) as a **position marker on a scale** — concrete and motivating.
- **Gap analysis with quantified impact (the headline feature):** "The 3 highest-impact moves," each tagged with an estimated effect and realism given time left — e.g. *"SAT 1480 → 1550: +6 competitiveness, lifts 2 schools from Reach to Target."*
- **Ranked university recommendations:** a suggested, balanced list (reach / target / safety) with a **fit score** per school, *including good-fit American schools the student hadn't considered* — this is where you add the most value.
- **Action timeline:** prioritized steps for the next 1 / 3 / 6 months.
- **Narrative summary:** a plain-language paragraph tying the numbers together; essay-angle suggestions later.

**How the visuals are produced:** the AI returns **numbers as structured data** (scores, ranges, percentiles, fit scores) — it does *not* draw anything. The frontend turns those numbers into the radar chart, bars, gauges, and comparison charts. Keeping visualization in the UI (not the model) is cheaper, faster, and visually consistent.

### 3.4 Design principles (student side)

- **Mobile-first.** Most of your target markets are mobile-primary. Design for a phone, then scale up.
- **Localized.** Language options and curriculum-aware logic. Start English + 2–3 priority languages based on where your strongest ambassadors are.
- **Honest about uncertainty.** This is your trust moat versus the overconfident incumbents. Show confidence levels; never imply certainty.
- **Clean and calm.** These students are anxious. The UI should reduce stress, not amplify it. Generous whitespace, plain language, no dark-pattern urgency.

---

## 4. Ambassador side

### 4.1 Onboarding

Invited at YYGS (or referred by an existing ambassador). They get an ambassador account, a unique **referral link/code**, and immediate access to their dashboard. Over-recruit deliberately — expect most to go quiet, so sign up 4–5x more than the number of "active" ambassadors you need.

### 4.2 Ambassador dashboard

- **Personal referral link + QR code** (one tap to copy/share).
- **Live impact stats:** "X students from your country joined this week / total." This is the single most important retention feature — visible proof their effort works.
- **Leaderboard:** ranking across ambassadors and countries. Competitive people + a public ranking = sustained effort.
- **Tier progress bar:** 10 signups → certificate · 50 → founder recommendation letter · 100 → "Country Lead" title + a call with you. Milestones convert one-time enthusiasm into repeated action.
- **Asset library:** ready-made graphics, a two-line pitch, story templates — in their language and the format that works locally (Instagram story here, WhatsApp/Telegram forward there). Zero "write it yourself" friction.
- **Recognition:** badges, "ambassador of the month," a public team page with photo + country.

### 4.3 Attribution mechanics

Each signup carries the referrer's code (stored at registration). All student counts, leaderboard positions, and tier unlocks derive from this. Keep it dead simple: code in the URL → stored on the new user row → aggregated per ambassador.

---

## 5. Founder / admin side (you)

A private dashboard only you (and trusted leads later) can access.

- **Growth metrics:** total users, by country, signups over time, **active vs one-time** (don't fool yourself with vanity numbers — track who comes back and acts).
- **Ambassador management:** performance table, leaderboard control, approve/promote ambassadors, issue certificates and recommendation letters.
- **Cost monitoring — your one real financial risk:** live API spend, cost per analysis, and **hard alerts/caps**. Set a billing limit on the API key so an unexpected spike or abuse can never run up a large bill.
- **Content management:** the university database (acceptance data, international notes), the AI prompt/rubric, and the asset library — all editable without redeploying code.
- **Quality monitoring:** spot-check AI outputs for sanity; collect user feedback ("was this helpful?") to catch when the model gives bad advice.
- **Abuse controls:** per-user rate limits so no one can hammer the analysis endpoint.

---

## 6. Technical architecture

Chosen for: solo founder, near-zero cost at low scale, fast to ship before YYGS.

```
┌─────────────────────────────────────────────────┐
│  Frontend (Next.js + Tailwind, mobile-first)      │
│  Student app · Ambassador dashboard · Admin       │
└───────────────┬───────────────────────────────────┘
                │  (serverless API routes)
┌───────────────▼───────────────────────────────────┐
│  Backend logic (Next.js API / edge functions)      │
│  Auth · profile · referral attribution · analysis  │
└───────┬───────────────────────────────┬────────────┘
        │                               │
┌───────▼─────────┐           ┌──────────▼───────────┐
│  Supabase        │           │  Claude API          │
│  Postgres + Auth │           │  Haiku 4.5 +         │
│  + file storage  │           │  prompt caching       │
└──────────────────┘           └──────────────────────┘
```

**Stack:**

- **Frontend:** Next.js (React) + Tailwind CSS, with **Recharts** (or Chart.js) for the radar chart, factor bars, likelihood gauges, and comparison charts. Mobile-first. Deploys free on Vercel; good SEO for the landing page.
- **Backend:** Next.js serverless API routes (or edge functions). No server to manage; scales to zero when idle = near-zero cost.
- **Database + Auth + Storage:** Supabase (managed Postgres). Generous free tier, built-in email + Google OAuth, row-level security, and file storage for assets — one service covers most of your needs.
- **AI:** Claude API. Use **Haiku 4.5** ($1 / $5 per million tokens) for the live analysis — fast and cheap — with **prompt caching** on the static parts (system prompt, scoring rubric, university data) so only the variable profile text is billed at full rate. Optionally offer a higher-quality "deep analysis" on **Sonnet 4.6** later if you ever want a premium tier.
- **Transactional email:** Resend (free tier) for welcome emails and ambassador milestone notifications.
- **Analytics:** Plausible or PostHog (free tiers) for usage; keep personal data out of URLs.
- **Domain:** ~$12/year. Everything else starts free.

### 6.1 The AI analysis pipeline (the heart)

```
Student profile (JSON)
   │
   ▼
[1] Normalize academics across curricula  (map A-Level/IB/national → comparable scale)
   │
   ▼
[2] Retrieve relevant university data      (from your DB, cached)
   │
   ▼
[3] Claude (Haiku 4.5) generates STRUCTURED analysis
     • cached prefix: system prompt + rubric + university data  (≈90% cheaper)
     • variable input: this student's profile
     • output: strict JSON → factor scores (0–10), overall score (0–100),
       per-school likelihood RANGES + confidence, benchmark percentiles,
       quantified gap analysis, ranked recommendations with fit scores, actions
   │
   ▼
[4] Frontend renders JSON → charts (radar, bars, gauges) + text; saves to account
```

Force **JSON-only output** from the model (no prose, no markdown) so the frontend can render it reliably into UI components. Validate/parse defensively and have a fallback if parsing fails.

### 6.2 Cost model (why your downside is tiny)

A single analysis is roughly a few thousand input tokens (most of it the *cached*, cheap prefix) plus ~1–2k output tokens. On Haiku 4.5 that's on the order of **~1 cent per analysis**, and less with caching doing its job. At 10,000 users running ~3 analyses each (~30,000 runs), you're looking at roughly **$100–300 total**, before caching savings push it lower.

Your only way to "lose a lot of money" is an uncapped bill. Mitigate with: a hard spending cap on the API key, per-user rate limits, aggressive caching, and the live cost monitor in your admin dashboard. Do that and the worst case is bounded.

### 6.3 Core data model (simplified)

- **users** — id, email, role (student/ambassador/admin), country, `referred_by` (ambassador code), created_at
- **profiles** — user_id, curriculum, grades, tests, ECs, targets, destination, (optional) aid_need
- **analyses** — id, user_id, input snapshot, output JSON (factor scores, overall score, per-school likelihood ranges, benchmarks, ranked recommendations), created_at
- **ambassadors** — user_id, code, tier, country, totals (signups), status
- **universities** — id, name, country, acceptance data, international notes
- **events** — lightweight log for signups/shares (powers leaderboard + admin metrics)

---

## 7. MVP scope — what to build before YYGS (~5 weeks)

You do **not** need the finished product for YYGS. You need something **demoable and shareable** that makes people proud to attach their name to it. Build in this order and stop when you run out of time — earlier items matter most:

**Must-have (the demo):**
1. Landing page + value prop (mobile-first).
2. Auth (email + Google) via Supabase.
3. Profile intake (curriculum-aware).
4. AI analysis → results dashboard with the **visual scorecard** (radar + factor bars), per-school likelihood ranges, gap analysis, and ranked recommendations.
5. Referral link + signup attribution.
6. A basic ambassador stats view (even just "your signup count").
7. Hard API cost cap + rate limiting.

**Defer to after YYGS:**
- Full leaderboard polish and automated tier unlocks (do these *manually* at first — a spreadsheet works week one).
- Multi-language UI (start English; localize once you know which countries are live).
- Admin dashboard niceties (you can read the database directly early on).
- Essay-angle features, premium Sonnet tier.

**The YYGS move:** show up with the must-have build working on a phone, let people *try it on their own profile* in 60 seconds, and recruit ambassadors into *shaping* it. Co-ownership is the strongest retention glue you have.

---

## 8. Open decisions to lock before writing more code

1. ~~Destination scope~~ — **Decided: US universities only** for now. Don't add other countries until the US experience is genuinely strong; depth in one admissions system is your advantage.
2. **Curated school list:** which ~50–150 US universities you cover at launch, and where you source their data (Common Data Set figures, published acceptance rates, mid-range admitted stats for benchmarks).
3. **The scoring rubric:** the exact factors and weights behind the 0–10 scores and the 0–100 overall — this *is* your product's intelligence and should be deliberate, not whatever the model improvises. Lock it before building the AI prompt.
4. **The name and one-line promise** — both should signal *guidance + insight*, not a single prediction.
