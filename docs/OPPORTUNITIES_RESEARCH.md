# Opportunities as a standalone product — what the evidence says

Research memo for the decision to grow Opportunities into a product in its own
right, aimed at a younger cohort (roughly grades 5–9). Compiled 2026-07-31.

Everything below is from randomized trials, meta-analyses or field experiments.
Where the evidence is weak or contested, it says so — the point of this document
is to stop us building the confident-sounding thing that has already been
measured and found to do nothing.

---

## The finding that should decide the shape of the product

**Telling students about opportunities does not change what students do.** This
has been tested repeatedly, at scale, with money and care behind it, and it
keeps returning zero:

| Study | What was tried | Result |
|---|---|---|
| Bird, Castleman et al. — FAFSA nudge campaigns | Texts, emails and physical mail to **800,000+** students, multiple framings, channels and timings | **No effect** on aid receipt or enrollment. No subgroup, no framing variant, not even adding one-to-one advising |
| Hoxby & Turner (ECO) → College Board scale-up | Personalized college information, ~$6/student | Worked in the research trial; **did not reproduce** when the College Board ran it nationally |
| Bettinger, Long, Oreopoulos & Sanbonmatsu — H&R Block FAFSA | Arm A: personalized aid-eligibility **information only**. Arm B: information **+ a person filling the form in with you** | Arm A: **no significant effect** on submission. Arm B: submissions up sharply, **+25–30%** college enrollment for high-school seniors |

Against that, the interventions that *did* move behaviour share a signature:

| Study | What was different | Result |
|---|---|---|
| Dynarski et al. — HAIL (U. Michigan) | Personally addressed, **unambiguous guarantee** ("four years free"), **no extra forms to fill** | Application rate **26% → 68%**; enrollment 12% → 27% |
| Castleman & Murphy — GI Bill transfer | Same one-time email, sent to people for whom the benefit was clear vs ambiguous | **Nothing** where the benefit was ambiguous; **+11–22%** where it was unambiguous. Hence the title: *Nudges Don't Work When the Benefits Are Ambiguous* |

**Read together:** what works is not information. It is **removing ambiguity
about whether this is for me**, and **removing the work**. A better-designed
list of 96 opportunities is still a list. It is the arm that measured zero.

This is the strategic point of the whole memo, and it happens to be very good
news for us: Compass already computes eligibility deterministically. The asset
is not the catalog — **the asset is the sentence "you, specifically, can enter
this one, now."** Almost nobody else can say that, because almost everyone else
ships a list.

---

## Nine design rules that follow, in order of expected payoff

### 1. Ship an eligibility verdict, not a catalog
*Evidence: HAIL; Castleman & Murphy.*

The default screen should answer one question — **what can I enter right now?**
— and show only those. Everything gated ("eligible from grade 9") is, in the
language of that literature, ambiguity, and ambiguity is where nudges die. For a
12-year-old today, most of our 96 entries are ambiguity.

Our current UI does the opposite: it shows the whole catalog and *badges* the
ineligible ones. Keep those, but behind a deliberate "later" view.

### 2. Show three to five, not ninety-six
*Evidence: Chernev et al. (2015), meta-analysis of 99 observations, N = 7,202.*

Choice overload is not universal — it is moderated by four things, and our young
cohort maxes out on the two that matter most: **preference uncertainty** (they
do not yet know what they like) and **decision-task difficulty**. A catalog that
grows is a *supply* achievement; exposing that growth to the user is a
*conversion* liability. Growth belongs in the matching, not on the screen.

### 3. Do the work for them, don't describe it
*Evidence: Bettinger et al. — information-only arm ≈ 0, assistance arm +25–30%.*

The unit of value per opportunity is not "Details ↗". It is: deadline already in
their calendar, the required materials listed as a checklist, a first draft
started, the reminder scheduled. This is the single largest effect size in the
whole college-access literature and it is a build, not a copy change.

### 4. Ask for a when-and-where the moment they say yes
*Evidence: Gollwitzer & Sheeran (2006) meta-analysis — d = 0.65, 94 tests, 8,000+ participants.*

Implementation intentions ("when X, I will do Y") are the cheapest well-evidenced
mechanic in existence. After a student taps "I'm doing this", one field:
*when will you start, and where?* Medium-to-large effect on actually following
through, across domains. One control, one afternoon of work.

### 5. Let them write one line on why it matters to them
*Evidence: Hulleman & Harackiewicz — utility-value interventions; meta-analysis of randomized field experiments shows gains in interest and learning, largest for low performers. Caveat: at least one online-course replication found nothing.*

Self-generated relevance beats told relevance. Our blurbs currently tell students
why something matters. The research says the student writing it themselves is
what moves interest — especially for exactly the weak-profile students we serve.
Cheap to add; treat as a hypothesis to measure, not a certainty.

### 6. Write for status and autonomy, not for their future CV
*Evidence: Bryan & Yeager, PNAS — 8th graders, n = 536, double-blind RCT.*

Framing healthy eating as *compliance with adult advice* did nothing; framing it
as autonomy from manipulation by adults, offering status and respect, changed
real behaviour. Adolescents respond to being treated as competent agents, not as
children being improved.

Practical translation for our copy: **"a real competition, judged by real
judges, that ten-year-olds have won"** beats **"builds your extracurricular
profile for university admissions"** for the 11–15 cohort. Our existing tone
sells admissions outcomes — correct for a 17-year-old, wrong for a 12-year-old.

### 7. Do not build points, badges or leaderboards
*Evidence: gamification meta-analysis (Springer, 2024) — gains run through autonomy and relatedness, minimal effect on competence; rewards perceived as **controlling** reduce intrinsic motivation.*

The gamification instinct is the wrong instinct here. Rewards that feel imposed
undermine exactly the autonomy that rule 6 depends on. Note also: I searched for
evidence on **streaks** specifically and found vendor blogs and agency case
studies, not experiments. The confident numbers circulating about streaks
("−35% churn") trace to marketing content, not peer review. Treat streaks as
unproven.

### 8. Start the progress bar part-filled
*Evidence: Nunes & Drèze — endowed progress; a head start on a loyalty card nearly doubled completion at identical real effort.*

We already know a signing-up student's grade and country. A readiness checklist
that opens at 2/10 rather than 0/8 is free, and it converts. This is the
counter-move to the 44% who signed up and filled in nothing.

### 9. Time re-engagement to a temporal landmark
*Evidence: Dai, Milkman & Riis — "fresh start effect"; aspirational behaviour spikes after new weeks, months, semesters and birthdays (e.g. +47% gym attendance at semester start).*

The plan's re-engagement email (step 6) should not be sent when it is ready. It
should be sent on **1 September**, at the new year, at term start, or on the
student's birthday. Same email, materially different response — and it costs
nothing to wait for the date.

---

## The younger cohort has a second user: the parent

For 11–15 year olds the parent is the decision-maker, the payer and the
transport. This is not a soft claim:

- HAIL mailed **parents** alongside students as part of the treatment that
  produced the 26% → 68% jump.
- A randomized 8th-grade **parent-panel** intervention changed how parents
  responded to their child's academic difficulty — and **raised the students'
  grades**, mediated by that change in parental response.
- A parent-targeted **utility-value** intervention (German 8th-grade classrooms,
  randomized) was built specifically to help parents support career orientation.

**Implication:** for the young cohort, a parent-facing artifact — "here is what
your child can enter this year, with dates" — is plausibly higher leverage than
anything we build on the student side, and we have never tried it.

---

## What this means for the plan, concretely

Reordering `OPPORTUNITIES_PLAN.md` in light of the above:

1. **Public page (step 5) must be an eligibility checker, not a catalog.**
   Two questions — what grade are you in, what do you like — then *"here are 5
   things you can enter now, the nearest closes in 23 days."* That single screen
   is simultaneously the lightweight intake (step 4), the SEO asset, and the
   only version of this the evidence supports. Building it as a browsable
   catalog with filters is building the arm that measured zero.

2. **Then the work-removal layer** (rule 3): calendar file, materials checklist,
   reminder. Highest effect size available to us.

3. **Then the one-field implementation intention** (rule 4). Cheapest real win.

4. **Re-engagement email (step 6) waits for 1 September** (rule 9).

5. **Do not build gamification** (rule 7). Spend that time on rules 3 and 4.

6. **Prototype one parent-facing view** for the grades 5–9 audience.

---

## Honest limits of this evidence

- **Almost all of it is US college access**, mostly low-income US students,
  mostly about financial aid and enrollment. Our users are 11–18-year-olds in
  Kazakhstan and the CIS choosing extracurriculars. The mechanisms (ambiguity,
  hassle, choice overload, implementation intentions) are general; the effect
  sizes will not transfer intact.
- **Effects shrink at scale, reliably.** Two separate lines of work here (ECO,
  the FAFSA nudges) produced strong trial results and then near-zero at scale.
  Plan for small effects and measure them; do not plan a growth curve on a
  published effect size.
- **Measure behaviour, not clicks.** The literature's central lesson is that
  engagement metrics moved while behaviour did not. The metric that matters is
  *did the student actually enter something* — for us, realistically, "marked as
  applied" plus a check-in on the deadline date. Clicks on "Details ↗" are the
  metric that made everyone think nudges worked.

---

## Sources

- [Bird, Castleman et al. — Nudging at scale: experimental evidence from FAFSA completion campaigns](https://www.nber.org/system/files/working_papers/w26158/w26158.pdf)
- [Castleman — Why aren't text-message interventions working at scale?](https://behavioralscientist.org/why-arent-text-message-interventions-designed-to-boost-college-success-working-at-scale/)
- [Page, Sacerdote, Goldrick-Rab & Castleman — Financial aid nudges: a national experiment](https://journals.sagepub.com/doi/abs/10.3102/01623737221111403)
- [Bettinger, Long, Oreopoulos & Sanbonmatsu — The role of application assistance and information in college decisions (H&R Block FAFSA experiment)](https://www.nber.org/papers/w15361)
- [Dynarski et al. — The power of certainty (HAIL)](https://www.nber.org/system/files/working_papers/w29864/revisions/w29864.rev0.pdf)
- [Castleman & Murphy — Nudges don't work when the benefits are ambiguous](https://edworkingpapers.com/ai19-109)
- [Hoxby & Turner — Expanding college opportunities for high-achieving, low-income students](https://eml.berkeley.edu/~saez/course131/Hoxby-Turner13.pdf)
- [Chalkbeat — the College Board scale-up of that idea did not work](https://www.chalkbeat.org/posts/us/2019/05/31/college-board-realizing-your-college-potential-study-undermatching-hoxby-turner-david-coleman/)
- [Chernev, Böckenholt & Goodman — Choice overload: a conceptual review and meta-analysis](https://chernev.com/wp-content/uploads/2017/02/ChoiceOverload_JCP_2015.pdf)
- [Gollwitzer & Sheeran — Implementation intentions and goal achievement: a meta-analysis](https://cancercontrol.cancer.gov/sites/default/files/2020-06/goal_intent_attain.pdf)
- [Hulleman & Harackiewicz — Enhancing interest and performance with a utility-value intervention](https://eric.ed.gov/?id=EJ910428)
- [Bryan & Yeager et al. — Harnessing adolescent values to motivate healthier eating (PNAS)](https://www.pnas.org/doi/10.1073/pnas.1604586113)
- [Gamification, intrinsic motivation, autonomy and relatedness — meta-analysis and systematic review](https://link.springer.com/article/10.1007/s11423-023-10337-7)
- [Nunes & Drèze — The endowed progress effect](https://academic.oup.com/jcr/article-abstract/32/4/504/1787425)
- [Dai, Milkman & Riis — The fresh start effect](https://faculty.wharton.upenn.edu/wp-content/uploads/2014/06/Dai_Fresh_Start_2014_Mgmt_Sci.pdf)
- [A brief randomized controlled intervention targeting parents improves grades during middle school](https://pubmed.ncbi.nlm.nih.gov/28249230/)
- [Helping parents support adolescents' career orientation: a parent-based utility-value intervention](https://link.springer.com/article/10.1007/s42010-018-0024-x)
