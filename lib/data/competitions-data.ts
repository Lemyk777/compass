// The Opportunities catalog — pure data, split out of key-dates.ts so the
// ~2,700-line array does not dominate diffs of the matching logic or get
// re-read on every edit to it. Types and logic stay in key-dates.ts, which
// re-exports COMPETITIONS so every existing `@/lib/data/key-dates` import is
// unchanged. Type-only import below, so there is no runtime import cycle.

import type { Competition } from "./key-dates";

export const COMPETITIONS: Competition[] = [
  // ── Pinned ────────────────────────────────────────────────────────────────
  // Empty right now, and that is a valid state rather than a gap. `pinned` is
  // the only editorial override in the ordering: it lifts a row above the
  // student's own fit and above the deadline, so ONE entry at a time lives
  // here, and a pinned row still has to pass eligibility — a card telling a
  // student they can enter something they cannot is the one failure this
  // product does not get to make, and "we pinned it" is not a reason they can
  // see.
  //
  // A pinned row is also short-lived, which is why the tests are written
  // against whatever is pinned today rather than against a named id: a test
  // naming one fails the day it expires.

  // ── Math / CS / engineering olympiads ──────────────────────────────────────
  {
    id: "amc",
    name: "AMC 10/12 (math)",
    fields: ["computer_science", "engineering", "natural_sciences"],
    deadline: "2026-10-15",
    // Oct 15 is the regular registration deadline your school has to hit; the
    // Oct 28 "late" deadline is only open to returning competition managers, so
    // for a student the honest last date is Oct 15. Contests are Nov 5 & 13.
    // Checked 2026-08-03 against maa.org/amcreg.
    window: "School registers you by Oct 15, 2026; contests Nov 5 & 13, 2026",
    level: "national",
    category: "olympiad",
    tier: "selective",
    dateConfirmed: true,
    eligibility:
      "No minimum age. AMC 10: grade ≤10 & under 17.5; AMC 12: grade ≤12 & under 19.5",
    // One card, two contests with different ceilings. The parser reads only the
    // FIRST rule it finds, so it capped this at grade 10 and hid the AMC from
    // every 11th and 12th grader — the standard US maths contest, invisible to
    // exactly the students who need it. The gate states the outer bound (AMC 12);
    // the sentence above still tells the student which contest they sit.
    gate: { gradeMax: 12 },
    url: "https://maa.org/maa-invitational-competitions/",
    blurb:
      "Score well and you move up to AIME, then USAMO. For a STEM application it is the maths result that needs no explaining.",
    cost: "varies",
    costDetail:
      "You sit it through a school, which buys student licences from the MAA. What reaches the student is usually $5-20 per sitting, and plenty of schools absorb it entirely. Ask your teacher what it costs you before assuming either way.",
  },
  {
    id: "math-kangaroo",
    name: "Math Kangaroo",
    fields: ["computer_science", "engineering", "natural_sciences"],
    deadline: "2026-12-31",
    // A student's regular enrolment closes Dec 31, 2026 (late enrolment runs to
    // Feb 1, 2027). Our earlier Dec 15 was the deadline to START a school centre,
    // not the student deadline. Contest is March 18, 2027. Checked 2026-08-03
    // against mathkangaroo.org/mks/registration.
    window: "Register by Dec 31, 2026; contest March 18, 2027",
    level: "international",
    category: "olympiad",
    tier: "accessible",
    dateConfirmed: true,
    eligibility: "Grades 1–12, no minimum age",
    url: "https://mathkangaroo.org/mks/",
    blurb:
      "A friendly entry-level maths contest, and a sensible first one to enter.",
    cost: "varies",
    costDetail:
      "A small per-student participation fee (around $20-25 in most countries), set by your national organiser; some schools cover it for you.",
  },
  {
    id: "usaco",
    name: "USACO (competitive programming)",
    fields: ["computer_science", "engineering"],
    deadline: "2026-12-11",
    // There is no registration deadline (you just log in during a contest
    // window), and the 2026–27 schedule is not published yet — the first contest
    // is normally the second Thursday of December, so this is an ESTIMATE, not a
    // confirmed date. Checked 2026-08-03: usaco.org had not posted the schedule.
    window:
      "Online contests Dec–Mar (no pre-registration); 2026–27 dates not yet published",
    level: "national",
    category: "olympiad",
    tier: "selective",
    dateConfirmed: false,
    eligibility: "Any pre-college student, no age limit",
    url: "https://usaco.org/",
    blurb:
      "Promote through Bronze→Silver→Gold→Platinum. How far you get is the proof of what you can actually code.",
    cost: "free",
    costDetail:
      "No registration fee. Contests run online and you enter directly.",
  },
  {
    id: "naclo",
    name: "NACLO (computational linguistics)",
    fields: ["computer_science", "humanities_social"],
    deadline: "2027-01-25",
    window: "Open round late January",
    level: "national",
    category: "olympiad",
    tier: "selective",
    eligibility: "High school & younger, no minimum age",
    // nacloweb.org resolves only intermittently; naclo.org is the same
    // competition and answers reliably. Verified 2026-07-29.
    url: "https://www.naclo.org/",
    blurb:
      "A logic-puzzle olympiad sitting between languages and computer science. You need no prior knowledge of either.",
    cost: "free",
    costDetail:
      "No entry fee. You sit it at a host site or at your own school.",
  },
  // ── Science olympiads ──────────────────────────────────────────────────────
  {
    id: "usabo",
    name: "USABO (biology olympiad)",
    fields: ["medicine_health", "natural_sciences"],
    deadline: "2026-11-15",
    window: "Register by mid-Nov; Open Exam in February",
    level: "national",
    category: "olympiad",
    tier: "selective",
    eligibility: "Grades 9–12 at a US school, no minimum age",
    url: "https://www.usabo-trc.org/",
    blurb:
      "The biology olympiad to enter if you are heading for medicine or the life sciences.",
    cost: "varies",
    costDetail:
      "Your school registers and pays a fee (roughly $100 per school); individual students are usually not charged. Ask your teacher to register you.",
  },
  {
    id: "usapho",
    name: "F=ma / USAPhO (physics olympiad)",
    fields: ["engineering", "natural_sciences"],
    deadline: "2027-01-30",
    // The Feb date is the EXAM date, not a registration deadline, and the 2027
    // exam date isn't published yet — registration (through your school) closes
    // in late January in prior years. Checked 2026-08-03: aapt.org had no 2027
    // date posted, so this is an estimate.
    window:
      "F=ma exam ~February 2027 (date TBA); your school registers you, ~late Jan",
    level: "national",
    category: "olympiad",
    tier: "selective",
    dateConfirmed: false,
    eligibility: "Grades 9–12 at a US school, no minimum age",
    url: "https://www.aapt.org/physicsteam/",
    blurb:
      "The US physics olympiad ladder, and a sharp result to hold if you are applying in physics or engineering.",
    cost: "varies",
    costDetail:
      "Entry is through a school, which pays a registration fee; students are usually not charged directly. Ask your physics teacher.",
  },
  {
    id: "usnco",
    name: "USNCO (chemistry olympiad)",
    fields: ["medicine_health", "natural_sciences"],
    deadline: "2027-03-01",
    window: "Local exams in March",
    level: "national",
    category: "olympiad",
    tier: "selective",
    eligibility: "Grades 9–12 at a US school · under 20",
    url: "https://www.acs.org/education/students/highschool/olympiad.html",
    blurb:
      "The US national chemistry olympiad. Strong if you are going for chemistry or medicine.",
    cost: "varies",
    costDetail:
      "Entry is through your local ACS section via a school, and any fee is set locally. Usually nothing for the student.",
  },
  {
    id: "brain-bee",
    name: "International Brain Bee (neuroscience)",
    fields: ["medicine_health", "natural_sciences"],
    deadline: "2027-01-31",
    window: "Local rounds winter, nationals spring",
    level: "international",
    category: "olympiad",
    tier: "selective",
    eligibility: "Ages 13–19",
    url: "https://thebrainbee.org/",
    blurb:
      "A neuroscience olympiad. Narrow, and worth being good at if you want to be a doctor or a researcher.",
    cost: "free",
    costDetail:
      "Local chapters run the qualifying rounds at no cost to students.",
  },
  // ── STEM research / innovation competitions ────────────────────────────────
  {
    id: "isef",
    name: "Regeneron ISEF (research)",
    fields: [
      "natural_sciences",
      "engineering",
      "medicine_health",
      "computer_science",
    ],
    deadline: "2027-02-01",
    // You qualify through a regional/affiliated fair, so there is no single ISEF
    // deadline — each regional fair sets its own, spread across autumn–winter.
    // The finals are 8–14 May 2027 in Los Angeles (checked 2026-08-03; an earlier
    // "May 12–18" was wrong). Left as an estimate, not a hard deadline.
    window:
      "Qualify via a regional fair (autumn–winter); finals May 8–14, 2027, Los Angeles",
    level: "international",
    category: "competition",
    tier: "elite",
    dateConfirmed: false,
    eligibility: "Grades 9–12 · under 20 on May 1, no minimum age",
    url: "https://www.societyforscience.org/isef/",
    blurb:
      "Your own research project, start to finish. Nothing else you can build says as much about you in STEM.",
    cost: "varies",
    costDetail:
      "ISEF itself does not charge you, but you must qualify through an affiliated regional fair and some local fairs charge a small registration fee. Travel to the finals is usually covered by your fair.",
  },
  {
    id: "regeneron-sts",
    name: "Regeneron Science Talent Search",
    fields: [
      "natural_sciences",
      "engineering",
      "medicine_health",
      "computer_science",
    ],
    deadline: "2026-11-05",
    window: "Applications due Nov 5, 2026",
    level: "national",
    category: "competition",
    tier: "elite",
    dateConfirmed: true,
    eligibility: "Final-year (grade 12) students only",
    url: "https://www.societyforscience.org/regeneron-sts/",
    blurb:
      "The US research competition final-year students aim at. You enter with a finished project, as a capstone.",
    cost: "free",
    costDetail:
      "No entry fee to apply, and finalists receive travel and awards.",
  },
  {
    id: "conrad-challenge",
    name: "Conrad Challenge (innovation)",
    fields: [
      "engineering",
      "computer_science",
      "business_economics",
      "natural_sciences",
    ],
    deadline: "2026-11-09",
    window: "Activation deadline Nov, finals April",
    level: "international",
    category: "competition",
    tier: "selective",
    eligibility: "Ages 13–18",
    // Moved to Space Center Houston; the old conradchallenge.org now fails TLS
    // outright (ERR_SSL_PROTOCOL_ERROR). Verified live 2026-07-29.
    url: "https://conrad.spacecenter.org/",
    blurb:
      "A team innovation contest. You build a real product that solves a global problem.",
    cost: "free",
    costDetail:
      "Free to enter the online rounds. Finalists invited to the summit cover their own travel, so budget for that only if you get through.",
  },
  {
    id: "technovation",
    name: "Technovation Girls",
    fields: ["computer_science", "business_economics"],
    deadline: "2027-04-20",
    window: "Submissions due late April",
    level: "international",
    category: "competition",
    tier: "accessible",
    eligibility: "Girls ages 8–18 (senior division 16–18)",
    url: "https://www.technovation.org/",
    blurb:
      "An app and startup challenge built for beginners. A good first tech project.",
    cost: "free",
    costDetail:
      "Technovation Girls charges nothing to take part, and that includes the curriculum and the mentoring.",
  },
  // ── Business / economics ───────────────────────────────────────────────────
  {
    id: "decca",
    name: "DECA (business & marketing)",
    fields: ["business_economics"],
    deadline: "2026-11-15",
    window: "Regionals winter, ICDC Apr 17–20, 2027 (Anaheim)",
    level: "international",
    category: "competition",
    tier: "selective",
    dateConfirmed: true,
    eligibility: "Grades 9–12, via a school DECA chapter",
    url: "https://www.deca.org/",
    blurb:
      "Business competition judged on cases. It tests leadership and commercial sense together.",
    cost: "varies",
    costDetail:
      "You join through a school chapter: DECA membership dues (usually a small annual fee) plus conference costs set by your chapter. Ask your advisor what the year costs.",
  },
  {
    id: "econ-challenge",
    name: "National Economics Challenge",
    fields: ["business_economics", "humanities_social"],
    deadline: "2027-02-15",
    window: "State rounds spring",
    level: "national",
    category: "competition",
    tier: "selective",
    eligibility: "Grades 9–12 (US), no minimum age",
    url: "https://www.councilforeconed.org/programs/for-students/national-economic-challenge/",
    blurb:
      "A team economics contest, and a sharp result for economics applicants.",
    cost: "varies",
    costDetail:
      "Entry is through your school and its state affiliate; students are not usually charged, but the national finals mean travel costs for the team.",
  },
  {
    id: "ieo",
    name: "International Economics Olympiad",
    fields: ["business_economics", "humanities_social"],
    deadline: "2027-04-15",
    window: "National rounds spring, finals summer",
    level: "international",
    category: "olympiad",
    tier: "elite",
    eligibility:
      "High-school students · under 20 at the finals (via national selection)",
    url: "https://ieo-official.org/",
    blurb:
      "The international economics olympiad. The furthest you can take the subject at school.",
    cost: "free",
    costDetail:
      "Free for you: entry is through your national economics olympiad, and team costs are covered by the host and your national organiser.",
  },
  {
    id: "diamond-challenge",
    name: "Diamond Challenge (entrepreneurship)",
    fields: ["business_economics"],
    deadline: "2027-01-15",
    window: "Submissions due mid-January",
    level: "international",
    category: "competition",
    tier: "accessible",
    eligibility: "Ages 14–18",
    url: "https://diamondchallenge.org/",
    blurb:
      "An entrepreneurship pitch for beginners. You turn an idea into a venture concept.",
    cost: "free",
    costDetail:
      "No registration fee to enter, and finalists are offered travel support.",
  },
  {
    id: "wharton-investment",
    name: "Wharton Global High School Investment Competition",
    fields: ["business_economics"],
    deadline: "2026-09-11",
    window: "Register by Sep 11, 2026 (5pm ET); trading Sep 28–Dec 4",
    dateConfirmed: true,
    level: "international",
    category: "competition",
    tier: "selective",
    eligibility: "Ages 14–18 (grades 9–12)",
    url: "https://globalyouth.wharton.upenn.edu/investment-competition/",
    blurb:
      "Run a real portfolio as a team. Finance and strategy under pressure.",
    cost: "free",
    costDetail: "Teams enter with a teacher advisor and pay nothing.",
  },
  // ── Humanities / law / social sciences ─────────────────────────────────────
  {
    id: "john-locke",
    name: "John Locke Essay Prize",
    fields: ["humanities_social", "law", "business_economics"],
    deadline: "2027-05-31",
    window: "Register by Mar 31; submit by end of May",
    level: "international",
    category: "competition",
    tier: "elite",
    eligibility: "Age 18 or under on the deadline (Junior Prize: under 15)",
    url: "https://www.johnlockeinstitute.com/essay-competition",
    blurb: "The essay prize for humanities, law, philosophy and economics.",
    cost: "free",
    costDetail:
      "No registration or submission fee if you enter on time. Miss the deadline and it costs: about GBP 25 for a 7-day extension, GBP 75 for 21 days. Submit on time and you pay nothing at all.",
  },
  {
    id: "nhd",
    name: "National History Day",
    // Entries can be a paper, documentary, exhibit or performance, and
    // constitutional/legal topics are common — so this counts for arts and law
    // applicants too, not only historians.
    fields: ["humanities_social", "law", "arts_design"],
    deadline: "2027-02-01",
    window: "Regional contests spring, nationals June",
    level: "national",
    category: "competition",
    tier: "selective",
    eligibility: "Grades 6–12, no minimum age",
    url: "https://www.nhd.org/",
    blurb:
      "A history project you research and then present. Judged on argument and sourcing.",
    cost: "varies",
    costDetail:
      "Entry is through your school and state or national affiliate; affiliate fees are small but vary, and reaching the national contest means travel costs.",
  },
  {
    id: "ippf",
    name: "International Public Policy Forum",
    fields: ["humanities_social", "law"],
    deadline: "2026-09-30",
    window: "Qualifying essay due fall",
    level: "international",
    category: "competition",
    tier: "selective",
    eligibility: "Grades 9–12, no minimum age",
    url: "https://www.ippfdebate.com/",
    blurb:
      "Public-policy debate, written and spoken. Sharp for law and policy applicants.",
    cost: "free",
    costDetail:
      "The qualifying rounds are online and free, and the organisers cover finalists' travel to the finals.",
  },
  {
    id: "mun",
    name: "Model UN conference",
    fields: ["humanities_social", "law", "business_economics"],
    deadline: "2026-10-01",
    window: "Conferences run year-round",
    level: "regional",
    category: "competition",
    tier: "accessible",
    eligibility: "Typically 13+, varies by conference",
    url: "https://www.nmun.org/",
    blurb:
      "Diplomacy, public speaking and knowing what is happening in the world. Easy to start.",
    cost: "one_time",
    costDetail:
      "Conference fees are typically $100-400 per delegate, plus travel and accommodation. A Model UN season is one of the pricier extracurriculars. Local and school-run conferences cost far less than the big international ones.",
  },
  {
    id: "world-scholars-cup",
    name: "World Scholar's Cup",
    fields: ["humanities_social"],
    deadline: "2027-01-15",
    window: "Regional rounds spring",
    level: "international",
    category: "competition",
    tier: "accessible",
    // "under 15" here is a DIVISION boundary, not a ceiling — the Senior
    // division is 15 and over. Phrased as a range so the parser can't read the
    // junior bracket as an age limit and hide it from every older student.
    eligibility: "No age limit. Junior and Senior divisions split at age 15",
    url: "https://www.scholarscup.org/",
    blurb:
      "A team academic tournament across subjects, and a welcoming first competition.",
    cost: "one_time",
    costDetail:
      "Paid, and it compounds: a regional round runs about $50-150 per student, then the Global Round and Tournament of Champions cost more again and come as accommodation packages, plus travel. Budget for the whole pathway, not just the first round.",
  },
  // ── Arts & design ──────────────────────────────────────────────────────────
  {
    id: "scholastic",
    name: "Scholastic Art & Writing Awards",
    fields: ["arts_design", "humanities_social"],
    deadline: "2026-12-01",
    window: "Deadlines Dec–Jan by region",
    level: "national",
    category: "competition",
    tier: "selective",
    eligibility: "Ages 13+ · grades 7–12",
    url: "https://www.artandwriting.org/",
    blurb: "The best-known US awards for creative arts and writing.",
    cost: "one_time",
    costDetail:
      "There is a per-entry fee, around $10 per work and more for a portfolio. Fee waivers are available for students who need them, so ask your teacher to request one.",
  },
  {
    id: "youngarts",
    name: "YoungArts",
    fields: ["arts_design"],
    deadline: "2026-10-06",
    window: "2027 competition: applications close Oct 6, 2026 (8pm ET)",
    dateConfirmed: true,
    level: "national",
    category: "competition",
    tier: "elite",
    eligibility: "Ages 15–18 (or grades 10–12)",
    url: "https://youngarts.org/",
    blurb:
      "A national award for emerging artists, and the arts recognition to hold before university.",
    cost: "one_time",
    costDetail:
      "There is an application fee of around $35. Fee waivers are available for students who need one, and you request it during the application.",
  },
  // ── Summer Programs ────────────────────────────────────────────────────────
  {
    id: "rsi",
    name: "Research Science Institute (RSI)",
    fields: [
      "natural_sciences",
      "engineering",
      "medicine_health",
      "computer_science",
    ],
    deadline: "2026-12-15",
    window: "Six weeks in summer (late June to early Aug)",
    level: "international",
    category: "summer_program",
    tier: "elite",
    eligibility:
      "Age 16+ by July 1 · rising seniors (year before final HS year completed)",
    url: "https://www.cee.org/programs/research-science-institute",
    blurb:
      "The hardest STEM summer research programme to get into, and it costs nothing.",
    cost: "free",
    costDetail:
      "Free once you are in: RSI charges no tuition and covers room and board for the six weeks. Two things are still on you: a $65 application fee, and travel to the US.",
  },
  {
    id: "ssp",
    name: "Summer Science Program (SSP)",
    fields: ["natural_sciences", "computer_science", "engineering"],
    deadline: "2027-02-15",
    window: "Mid-June to late July",
    level: "international",
    category: "summer_program",
    tier: "elite",
    eligibility:
      "Ages 15–18 during the program · current juniors (some sophomores)",
    url: "https://ssp.org/",
    blurb:
      "Thirty-nine days living on campus doing research in astrophysics, biochemistry or genomics.",
    cost: "paid_aid",
    costDetail:
      "The 2026 programme fee is $11,800, and it is scaled to what your family can afford. Nobody pays more than that and many pay much less. The fee is subsidised by donations, so ask what your number is rather than reading the headline.",
  },
  {
    id: "mostec",
    name: "MIT MOSTEC",
    fields: ["engineering", "computer_science", "natural_sciences"],
    deadline: "2027-02-01",
    window: "June to December",
    level: "national",
    category: "summer_program",
    tier: "selective",
    eligibility: "Rising seniors (US citizens/permanent residents)",
    url: "https://mites.mit.edu/",
    blurb:
      "An online science and engineering programme for students in their final years, from backgrounds the field usually misses.",
    cost: "free",
    costDetail:
      "Free to attend: MIT covers tuition, room, board and materials, and travel scholarships are available. Check the application page for an application fee. Several programmes of this kind charge a small one even when attendance is free.",
  },
  {
    id: "yygs",
    name: "Yale Young Global Scholars (YYGS)",
    fields: ["humanities_social", "business_economics", "natural_sciences"],
    deadline: "2027-01-10",
    window: "Two-week sessions in June and July",
    level: "international",
    category: "summer_program",
    tier: "selective",
    eligibility: "Ages 16–18 by the session start · grades 10–11",
    url: "https://globalscholars.yale.edu/",
    blurb:
      "A summer programme with an unusually international cohort. Global challenges, politics and STEM.",
    cost: "paid_aid",
    costDetail:
      "$7,000 for the two-week residential session (up from $6,500), covering instruction, housing, meals and materials. Travel is on top. Yale puts over $3m into need-based aid and says international students are eligible too, so apply for aid alongside admission rather than ruling yourself out.",
  },
  {
    id: "nyu-shanghai-summer",
    name: "NYU Shanghai Summer Program",
    fields: ["business_economics", "humanities_social", "arts_design"],
    deadline: "2027-03-15",
    window: "Summer sessions in Shanghai",
    level: "international",
    category: "summer_program",
    tier: "accessible",
    eligibility: "High-school students. Confirm age rules on the program page",
    // /academics/summer 404s; the pre-college offering is the Summer Academy.
    url: "https://shanghai.nyu.edu/academics/summer-academy",
    blurb:
      "Pre-college weeks in China's financial capital. Good for business and international relations.",
  },
  {
    id: "cuhk-shenzhen-summer",
    name: "CUHK Shenzhen Summer Camp",
    fields: ["business_economics", "computer_science", "engineering"],
    deadline: "2027-04-30",
    window: "Summer sessions in Shenzhen",
    level: "international",
    category: "summer_program",
    tier: "selective",
    eligibility: "High-school students. Confirm age rules on the program page",
    url: "https://admissions.cuhk.edu.cn/en",
    blurb:
      "A selective summer in China's tech capital, built around entrepreneurship and STEM.",
  },
  // ── Research Programs ────────────────────────────────────────────────────────
  {
    id: "pioneer-academics",
    name: "Pioneer Academics",
    fields: "all",
    deadline: "2027-02-15",
    window: "Spring through Summer cohorts",
    level: "international",
    category: "research_program",
    tier: "selective",
    eligibility:
      "Grades 9–11 (research runs before your final application year)",
    url: "https://pioneeracademics.com/",
    blurb:
      "An online research programme with university faculty that carries real college credit.",
    cost: "paid_aid",
    costDetail:
      "Tuition is around $6,000 for the full research program, with need-based financial aid available. The application itself is free.",
  },
  {
    // TASP was discontinued in 2021; the Telluride Association's current
    // high-school program is TASS. Id kept stable for the live-date overlay.
    id: "telluride-tasp",
    name: "Telluride Association Summer Seminar (TASS)",
    fields: ["humanities_social", "law"],
    deadline: "2027-01-05",
    window: "Six weeks in summer",
    level: "international",
    category: "summer_program",
    tier: "elite",
    eligibility: "Grades 10–11 (sophomores and juniors)",
    url: "https://www.tellurideassociation.org/our-programs/high-school-students/",
    blurb:
      "A free summer seminar in humanities and social sciences, run as discussion rather than lectures.",
    cost: "free",
    costDetail:
      "Free in the fullest sense: no tuition, and the Telluride Association covers room, board and usually travel too. There is no application fee.",
  },
  {
    id: "promys",
    name: "PROMYS",
    fields: ["computer_science", "engineering", "natural_sciences"],
    deadline: "2027-03-01",
    window: "Six weeks at Boston University",
    level: "international",
    category: "summer_program",
    tier: "elite",
    eligibility: "Age 14+ by the program start · grades 9–12",
    url: "https://promys.org/",
    blurb:
      "A mathematics summer programme for students who are already a long way ahead.",
    cost: "paid_aid",
    costDetail:
      "Up to $8,000 for the six weeks, less whatever aid you are awarded. Read the aid rule carefully: PROMYS is free for US families earning under $80,000, but for INTERNATIONAL students aid is decided case by case. Do not assume the free tier applies to you. Ask before you build a summer around it.",
  },
  {
    id: "launchx",
    name: "LaunchX",
    fields: ["business_economics", "engineering", "computer_science"],
    deadline: "2027-02-15",
    window: "Four weeks in summer",
    level: "international",
    category: "summer_program",
    tier: "selective",
    eligibility: "Ages 14–18 (grades 9–12)",
    url: "https://launchx.com/",
    blurb:
      "A summer programme where you build an actual startup, not a business plan.",
    cost: "paid_aid",
    costDetail:
      "Priced by format: about $1,995 for the online bootcamp up to $11,495 for the residential San Diego flagship, with most programmes landing between $4,495 and $6,495. On-site tuition covers housing and food but not your travel there. A limited number of need-based scholarships exist.",
  },
  {
    id: "garcia-center",
    name: "Garcia Center Summer Scholars",
    fields: ["natural_sciences", "engineering", "medicine_health"],
    deadline: "2027-03-01",
    window: "Seven weeks at Stony Brook University",
    level: "national",
    category: "summer_program",
    tier: "elite",
    eligibility:
      "Rising juniors/seniors, typically 16+ (lab access). Confirm on the program page",
    url: "https://www.stonybrook.edu/commcms/garcia/summer_program/",
    blurb:
      "Research in polymer engineering and materials science, with stipends for some places.",
    cost: "one_time",
    costDetail:
      "The summer research program charges a program fee running into the thousands of dollars, plus your own housing if you are not local. Check the current figure and any aid on the official page before applying.",
  },
  {
    id: "clark-scholars",
    name: "Clark Scholars Program",
    fields: "all",
    deadline: "2027-02-15",
    window: "Seven weeks at Texas Tech",
    level: "international",
    category: "research_program",
    tier: "elite",
    eligibility:
      "Age 17+ by the program start · juniors/seniors (US citizens/PR)",
    url: "https://www.depts.ttu.edu/clarkscholars/",
    blurb:
      "A funded research programme that takes twelve students a year, worldwide.",
    cost: "funded",
    costDetail:
      "Free: room and board are covered and scholars receive a stipend (around $750) for the seven weeks.",
  },
  {
    id: "sumac",
    name: "Stanford SUMaC",
    fields: ["computer_science", "engineering", "natural_sciences"],
    deadline: "2027-02-01",
    window: "Three weeks in summer",
    level: "international",
    category: "summer_program",
    tier: "elite",
    eligibility: "Grades 10–11 · age 15+ during the program",
    url: "https://sumac.spcs.stanford.edu/",
    blurb:
      "An intensive mathematics camp at Stanford for students already working well ahead.",
    cost: "paid_aid",
    costDetail:
      "Stanford charges $3,750 for the online programme and $8,950 residential, with housing, meals and field trips included. Financial aid runs up to 100% of the cost on demonstrated need, and roughly a third of participants get some. Ask, do not assume.",
  },
  {
    id: "cmu-sams",
    name: "CMU SAMS",
    fields: ["computer_science", "engineering", "natural_sciences"],
    deadline: "2027-03-01",
    window: "Six weeks at Carnegie Mellon",
    level: "national",
    category: "summer_program",
    tier: "selective",
    eligibility: "Rising seniors · age 16+ by the program start",
    url: "https://www.cmu.edu/pre-college/academic-programs/sams.html",
    blurb:
      "A funded STEM programme built around rigorous preparation and widening who gets in.",
    cost: "free",
    costDetail:
      "Free once you are in: Carnegie Mellon covers tuition, housing and meals, and scholars get a small stipend for incidentals. Still on you: a $50 application fee, and travel to Pittsburgh.",
  },
  {
    id: "horizon-academic",
    name: "Horizon Academic Research Program",
    fields: "all",
    deadline: "2027-02-20",
    window: "Spring or Summer trimesters",
    level: "international",
    category: "research_program",
    tier: "accessible",
    eligibility:
      "High-school students, typically 14+. Confirm on the program page",
    url: "https://www.horizoninspires.com/",
    blurb:
      "Guided research that ends with a paper written to college standard.",
    cost: "paid_aid",
    costDetail:
      "A paid program, typically several thousand dollars depending on the track, with need-based financial aid available. Confirm your price before you apply.",
  },
  // ── Accessible / Beginner-Friendly Competitions ──────────────────────────────
  {
    id: "bebras",
    name: "Bebras Computing Challenge",
    fields: ["computer_science"],
    deadline: "2026-11-01",
    window: "National challenge weeks, usually the second week of November",
    level: "international",
    category: "competition",
    tier: "accessible",
    eligibility: "All school ages, no minimum",
    url: "https://www.bebras.org/",
    blurb:
      "A short online challenge that introduces computational thinking. Beginner-friendly and genuinely fun.",
    cost: "varies",
    costDetail:
      "Run through schools by a national organiser. Usually free for students, but the fee is set nationally, so ask your teacher.",
  },
  // (Math Kangaroo used to be duplicated here with the same id — it lives in
  // the olympiad section above; a duplicate id breaks the by-id merge and
  // showed the same event twice.)
  // (The NYT STEM Writing Contest used to sit here as its own row, pointing at
  // the same contests hub as nyt-contests below — one programme, two cards.
  // It is one of the contests that hub lists; its fields moved there.)
  {
    id: "cyberpatriot",
    name: "CyberPatriot",
    fields: ["computer_science", "engineering"],
    deadline: "2026-10-01",
    window: "Rounds from October to March",
    level: "national",
    category: "competition",
    tier: "accessible",
    eligibility: "Grades 6–12, via a school/organization team. No minimum age",
    url: "https://www.uscyberpatriot.org/",
    blurb:
      "Team cybersecurity, designed so beginners and whole schools can enter.",
    cost: "varies",
    costDetail:
      "Teams pay a registration fee, around $165 for the middle-school division and $205 for the open division in recent seasons, so confirm the current figure. Free and discounted places exist for Title I and JROTC teams, and the cost sits with the team rather than the student.",
  },
  {
    id: "caribou-math",
    name: "Caribou Mathematics Competition",
    fields: ["natural_sciences"],
    deadline: "2026-10-15",
    window: "Multiple online contests throughout the year",
    level: "international",
    category: "competition",
    tier: "accessible",
    eligibility: "Grades K–12, no minimum age",
    url: "https://cariboutests.com/",
    blurb:
      "Online maths contests six times a year. Low-stress, and easy to get to.",
    cost: "varies",
    costDetail:
      "Registration goes through a school or supervisor and carries a small per-student fee set by the organiser; some schools cover it.",
  },
  // (NaNoWriMo YWP removed — the NaNoWriMo nonprofit shut down in 2025; we
  // don't recommend programs that no longer exist.)
  {
    id: "congressional-app",
    name: "Congressional App Challenge",
    fields: ["computer_science", "engineering", "arts_design"],
    deadline: "2026-10-26",
    window: "Submissions due Oct 26, 2026 (12pm ET); some districts vary",
    dateConfirmed: true,
    level: "national",
    category: "competition",
    tier: "accessible",
    eligibility: "Grades 6–12 (US congressional districts), no minimum age",
    url: "https://www.congressionalappchallenge.us/",
    blurb:
      "Build an app, film a pitch, submit both. A good first entry on a tech portfolio.",
    cost: "free",
    costDetail: "No entry fee for students or schools.",
  },

  // ── International olympiad finals ─────────────────────────────────────────
  // These are the world finals of each subject. You do NOT enter them
  // directly — every country sends a team chosen through its own national
  // olympiad, so the eligibility line points the student at that pathway.
  // Listed because knowing the ceiling shapes which national rounds to chase.
  // URLs verified 2026-07-29 (npm run test:links).
  {
    id: "imo",
    name: "IMO — International Mathematical Olympiad",
    fields: ["computer_science", "engineering", "natural_sciences"],
    deadline: "2027-07-10",
    window: "Finals each July; national selection runs the winter before",
    level: "international",
    category: "olympiad",
    tier: "elite",
    eligibility:
      "Under 20, pre-university. Via your country's national team selection",
    url: "https://www.imo-official.org/",
    blurb:
      "The world championship of school mathematics, and the strongest quantitative result there is.",
    cost: "free",
    costDetail:
      "Free for you: you get there through your national olympiad, and the national team's costs are covered by the host country and your national organiser.",
  },
  {
    id: "ioi",
    name: "IOI — International Olympiad in Informatics",
    fields: ["computer_science", "engineering"],
    deadline: "2027-08-01",
    window: "Finals each summer; national selection in spring",
    level: "international",
    category: "olympiad",
    tier: "elite",
    eligibility:
      "Secondary-school students. Via your country's national informatics olympiad",
    url: "https://ioinformatics.org/",
    blurb:
      "The world final for competitive programming. Nothing in CS carries further on an application.",
    cost: "free",
    costDetail:
      "Free for you: entry is through your national informatics olympiad, and team costs are covered by the host and your national organiser.",
  },
  {
    id: "icho",
    name: "IChO — International Chemistry Olympiad",
    fields: ["natural_sciences", "medicine_health"],
    deadline: "2027-07-01",
    window: "Finals each July; national rounds in spring",
    level: "international",
    category: "olympiad",
    tier: "elite",
    eligibility:
      "Under 20, pre-university. Via your country's national chemistry olympiad",
    url: "https://www.ichosc.org/",
    blurb:
      "The world final in chemistry. Decisive for chemistry, medicine and materials.",
    cost: "free",
    costDetail:
      "Free for you: entry is through your national chemistry olympiad, and team costs are covered by the host and your national organiser.",
  },
  {
    id: "ibo",
    name: "IBO — International Biology Olympiad",
    fields: ["medicine_health", "natural_sciences"],
    deadline: "2027-07-01",
    window: "Finals each July; national rounds in spring",
    level: "international",
    category: "olympiad",
    tier: "elite",
    eligibility:
      "Secondary-school students. Via your country's national biology olympiad",
    url: "https://www.ibo-info.org/",
    blurb:
      "The world final in biology, and the headline result for pre-med and the life sciences.",
    cost: "free",
    costDetail:
      "Free for you: entry is through your national biology olympiad, and team costs are covered by the host and your national organiser.",
  },
  {
    id: "ioaa",
    name: "IOAA — Astronomy & Astrophysics Olympiad",
    fields: ["natural_sciences", "engineering"],
    deadline: "2027-08-01",
    window: "Finals each August; national selection earlier in the year",
    level: "international",
    category: "olympiad",
    tier: "elite",
    eligibility: "Secondary-school students under 20, via national selection",
    url: "https://www.ioaastrophysics.org/",
    blurb:
      "The world final in astronomy and astrophysics. Rare enough that it stands out on its own.",
    cost: "free",
    costDetail:
      "Free for you: entry is through your national astronomy olympiad, and team costs are covered by the host and your national organiser.",
  },
  {
    id: "iol",
    name: "IOL — International Linguistics Olympiad",
    fields: ["humanities_social", "computer_science"],
    deadline: "2027-07-20",
    window: "Finals each July; national rounds (e.g. NACLO) in winter",
    level: "international",
    category: "olympiad",
    tier: "elite",
    eligibility:
      "Secondary-school students. Via your country's national linguistics olympiad",
    url: "https://ioling.org/",
    blurb:
      "A puzzle olympiad between languages and computation. No linguistics needed beforehand.",
    cost: "free",
    costDetail:
      "Free for you: entry is through your national linguistics olympiad, and team costs are covered by the host and your national organiser.",
  },
  {
    id: "igeo",
    name: "iGeo — International Geography Olympiad",
    fields: ["humanities_social", "natural_sciences"],
    deadline: "2027-08-01",
    window: "Finals each August; national selection in spring",
    level: "international",
    category: "olympiad",
    tier: "elite",
    eligibility:
      "Ages 16–19, not enrolled at university. Via national selection",
    url: "https://www.geoolympiad.org/",
    blurb:
      "Fieldwork, mapping and spatial analysis. Strong for geography, environment and urbanism.",
    cost: "free",
    costDetail:
      "Free for you: entry is through your national geography olympiad, and team costs are covered by the host and your national organiser.",
  },
  {
    id: "ijso",
    name: "IJSO — International Junior Science Olympiad",
    fields: ["natural_sciences", "engineering", "medicine_health"],
    deadline: "2026-12-01",
    window: "Finals in December; national selection in autumn",
    level: "international",
    category: "olympiad",
    tier: "selective",
    eligibility: "Age 15 or under on 31 December of the competition year",
    url: "https://ijsoweb.org/",
    blurb:
      "The junior science world final, and the natural first target for a strong younger student.",
    cost: "free",
    costDetail:
      "Free for you: entry is through your national junior science olympiad, and team costs are covered by the host and your national organiser.",
  },
  {
    id: "ieso",
    name: "IESO — International Earth Science Olympiad",
    fields: ["natural_sciences"],
    deadline: "2027-08-01",
    window: "Finals each August; national selection in spring",
    level: "international",
    category: "olympiad",
    tier: "selective",
    eligibility: "Secondary-school students under 19, via national selection",
    url: "https://www.ieso-info.org/",
    blurb:
      "Geology, meteorology and oceanography. A distinctive route for earth-science applicants.",
    cost: "free",
    costDetail:
      "Free for you: entry is through your national earth-science olympiad, and team costs are covered by the host and your national organiser.",
  },
  {
    id: "ipo-philosophy",
    name: "IPO — International Philosophy Olympiad",
    fields: ["humanities_social", "law"],
    deadline: "2027-05-01",
    window: "Finals in May; national selection earlier in the year",
    level: "international",
    category: "olympiad",
    tier: "selective",
    eligibility:
      "Secondary-school students. Essay written in a non-native language, via national selection",
    url: "https://www.philosophy-olympiad.org/",
    blurb:
      "Write a philosophical essay in a language that is not your own. Unusual, and people remember it.",
    cost: "free",
    costDetail:
      "Free for you: entry is through your national philosophy olympiad, and team costs are covered by the host and your national organiser.",
  },

  // ── Open international competitions (enter directly, no national team) ────
  {
    id: "breakthrough-junior",
    name: "Breakthrough Junior Challenge",
    fields: [
      "natural_sciences",
      "engineering",
      "computer_science",
      "medicine_health",
    ],
    deadline: "2026-09-15",
    window: "Submissions close Sep 15, 2026 (then peer review to Sep 30)",
    dateConfirmed: true,
    level: "international",
    category: "competition",
    tier: "selective",
    eligibility: "Ages 13–18, open worldwide",
    url: "https://breakthroughjuniorchallenge.org/",
    blurb:
      "Explain one big scientific idea in a short video. Judged worldwide, and the prize is a $250k scholarship.",
    cost: "free",
    costDetail:
      "Submitting a video costs nothing, and the prize is a $250,000 scholarship.",
  },
  {
    id: "genius-olympiad",
    name: "GENIUS Olympiad (environment)",
    fields: [
      "natural_sciences",
      "engineering",
      "arts_design",
      "humanities_social",
    ],
    deadline: "2027-03-10",
    window: "Submissions due March, finals June in New York",
    level: "international",
    category: "competition",
    tier: "selective",
    eligibility: "High-school students aged 13–18, open worldwide",
    url: "https://www.geniusolympiad.org/",
    blurb:
      "Environment work across science, art, writing and business. An unusually broad way in.",
    cost: "free_then_paid",
    costDetail:
      "Submitting a project costs nothing. The money appears only if you are selected: finalists pay event registration plus travel and stay in New York. Check those figures before you build a project around it.",
  },
  {
    id: "earth-prize",
    name: "The Earth Prize",
    fields: ["natural_sciences", "engineering", "business_economics"],
    deadline: "2027-01-31",
    window: "Submissions close end of January",
    level: "international",
    category: "competition",
    tier: "selective",
    eligibility: "Ages 13–19 worldwide, in teams of 2–5 with a mentor",
    url: "https://www.theearthprize.org/",
    blurb:
      "A team sustainability challenge with a $200k prize pool. Real projects, and a global field.",
    cost: "free",
    costDetail:
      "No entry fee. The prize money goes to the winning teams and their schools.",
  },
  {
    id: "space-apps",
    name: "NASA Space Apps Challenge",
    fields: ["computer_science", "engineering", "natural_sciences"],
    deadline: "2026-11-14",
    // Checked 2026-08-03: the 2026 edition runs 14-15 November, registration
    // opens 26 August and full challenge statements land 28 October. We had it
    // as "each October", which is the pattern of earlier years, not this cycle.
    window:
      "48-hour global hackathon, 14-15 Nov 2026; registration opens 26 Aug",
    dateConfirmed: true,
    level: "international",
    category: "competition",
    tier: "accessible",
    eligibility:
      "Open to all ages worldwide, under-18s join with guardian consent",
    url: "https://spaceappschallenge.org/",
    blurb:
      "The world's largest hackathon, run on real NASA data. An accessible first team project.",
    cost: "free",
    costDetail: "NASA and local host sites run it at no cost to participants.",
  },
  {
    id: "wro",
    name: "World Robot Olympiad",
    fields: ["engineering", "computer_science"],
    deadline: "2027-04-01",
    window: "National rounds spring, world final in November",
    level: "international",
    category: "competition",
    tier: "selective",
    eligibility:
      "Ages 8–19 by category. Enter through your country's national organiser",
    url: "https://wro-association.org/",
    blurb:
      "Build and program a robot for a themed challenge. Hands-on engineering evidence that is hard to fake.",
    cost: "varies",
    costDetail:
      "Team registration fees are set by your national organiser and vary widely by country. Ask the national WRO organiser what a team pays.",
  },
  {
    id: "first-robotics",
    name: "FIRST Robotics Competition",
    fields: ["engineering", "computer_science"],
    deadline: "2026-11-05",
    window: "Team registration autumn; build season Jan–Mar",
    level: "international",
    category: "competition",
    tier: "selective",
    eligibility:
      "Grades 9–12, as part of a registered school or community team",
    url: "https://www.firstinspires.org/",
    blurb:
      "A season-long robotics team. The classic sustained engineering commitment.",
    cost: "varies",
    costDetail:
      "Team-based and costly: a rookie team's registration and kit run into thousands of dollars, plus travel. As a student you normally join an existing school team and pay little or nothing, so ask what your team charges.",
  },
  {
    id: "iymc",
    name: "International Youth Math Challenge",
    fields: [
      "computer_science",
      "engineering",
      "natural_sciences",
      "business_economics",
    ],
    deadline: "2026-09-27",
    // Checked 2026-08-03 against the organiser's own deadlines document
    // (iymc.info/docs/IYMC_Deadlines.pdf): qualification closes 27 Sep 2026,
    // 23:59 UTC. Our previous estimate of 30 Sep would have been three days late.
    window: "Qualification round closes 27 Sep 2026; final round in winter",
    dateConfirmed: true,
    level: "international",
    category: "competition",
    tier: "accessible",
    eligibility: "Students under 25 worldwide, no national selection needed",
    url: "https://www.iymc.info/",
    blurb:
      "You enter directly from any country, which makes it a good first international maths result.",
    cost: "free_then_paid",
    costDetail:
      "The qualification round is free. A small participation fee of about EUR 25 applies only in the later rounds, and the organisers waive it for students who cannot pay. You have to ask.",
  },
  {
    id: "purple-comet",
    name: "Purple Comet! Math Meet",
    fields: ["computer_science", "engineering", "natural_sciences"],
    deadline: "2027-04-15",
    window: "Online team contest, take it any time Apr 6–15, 2027",
    dateConfirmed: true,
    level: "international",
    category: "competition",
    tier: "accessible",
    eligibility: "School teams of up to 6, open worldwide, free to enter",
    url: "https://purplecomet.org/",
    blurb:
      "A free online team maths contest, and a low-barrier way to start competing internationally.",
    cost: "free",
    costDetail: "Teams register through a supervisor at no cost.",
  },
  {
    id: "math-prize-girls",
    name: "Math Prize for Girls",
    fields: ["computer_science", "engineering", "natural_sciences"],
    deadline: "2027-06-01",
    window: "Applications spring, contest in autumn at MIT",
    level: "international",
    category: "competition",
    tier: "elite",
    eligibility:
      "Female students with under 4 years of secondary school remaining",
    url: "https://mathprize.atfoundation.org/",
    blurb:
      "The largest maths prize for young women. Selective, and widely recognised.",
    cost: "free",
    costDetail:
      "Free to enter, and the foundation covers housing and meals for participants at the contest.",
  },
  {
    id: "stockholm-water",
    name: "Stockholm Junior Water Prize",
    fields: ["natural_sciences", "engineering"],
    deadline: "2027-03-01",
    window: "National rounds spring, international final in August",
    level: "international",
    category: "competition",
    tier: "selective",
    eligibility: "Ages 15–20. Enter via your country's national round",
    url: "https://stockholmwaterfoundation.org/stockholm-junior-water-prize/",
    blurb:
      "Water and sustainability research judged internationally. A focused piece of science to be known for.",
    cost: "free",
    costDetail:
      "Free to enter, but you go in through your national competition, so check the national organiser's own rules and dates.",
  },

  // ── Business, economics & entrepreneurship ────────────────────────────────
  // (Diamond Challenge already lives in the Business section above.)
  {
    id: "blue-ocean",
    name: "Blue Ocean Entrepreneurship Competition",
    fields: ["business_economics", "computer_science"],
    deadline: "2027-02-15",
    window: "Video pitch submissions due late winter",
    level: "international",
    category: "competition",
    tier: "accessible",
    eligibility:
      "High-school students worldwide. Free to enter, video pitch only",
    url: "https://www.blueoceancompetition.org/",
    blurb:
      "No business plan needed. A short video pitch is the whole entry, which makes it a genuine first one.",
    cost: "free",
    costDetail: "Fully online, with no entry fee.",
  },

  // ── Humanities, writing & essay prizes ───────────────────────────────────
  {
    id: "nyt-contests",
    name: "New York Times Student Contests",
    fields: [
      "humanities_social",
      "arts_design",
      "natural_sciences",
      "business_economics",
      "medicine_health",
    ],
    deadline: "2026-10-01",
    window: "A different contest runs almost every month of the school year",
    level: "international",
    category: "competition",
    tier: "accessible",
    eligibility: "Ages 13–19 worldwide, free to enter",
    url: "https://www.nytimes.com/spotlight/learning-contests",
    blurb:
      "Editorial, review, podcast and STEM-writing contests run all year. Low barrier, and you can be published.",
    cost: "free",
    costDetail:
      "The student contests have no entry fee, and a Times subscription is not required to enter.",
  },
  {
    id: "immerse-essay",
    name: "Immerse Education Essay Competition",
    fields: [
      "humanities_social",
      "law",
      "business_economics",
      "natural_sciences",
    ],
    deadline: "2027-01-10",
    window:
      "Entries close in winter; scholarship awarded for the summer programme",
    level: "international",
    category: "competition",
    tier: "accessible",
    eligibility: "Ages 13–18 worldwide",
    url: "https://www.immerse.education/essay-competition/",
    blurb:
      "A short subject essay judged internationally, with a programme scholarship attached.",
    cost: "free",
    costDetail:
      "Free to enter. Note what the prize is: a scholarship towards Immerse's own summer programmes, which are otherwise expensive.",
  },
  {
    id: "bow-seat",
    name: "Bow Seat Ocean Awareness Contest",
    fields: ["arts_design", "humanities_social", "natural_sciences"],
    deadline: "2027-06-13",
    window: "Submissions open in autumn, close in June",
    level: "international",
    category: "competition",
    tier: "accessible",
    eligibility: "Ages 11–18 worldwide",
    url: "https://bowseat.org/",
    blurb:
      "Art, writing, film or music on ocean themes. A rare creative-plus-environment entry.",
    cost: "free",
    costDetail: "No entry fee for any category.",
  },

  // ── Research & summer programmes ─────────────────────────────────────────
  // (SUMaC and Pioneer Academics already live in the sections above.)
  {
    id: "harvard-summer-hs",
    name: "Harvard Summer School — high-school programs",
    fields: "all",
    deadline: "2027-01-15",
    window: "Applications open winter; sessions in summer",
    level: "international",
    category: "summer_program",
    tier: "selective",
    eligibility:
      "Students aged 16+ who have completed grade 10, open internationally",
    url: "https://summer.harvard.edu/high-school-programs/",
    blurb:
      "Earn real college credit on campus or online. It says something credible about academic rigour.",
    cost: "paid_aid",
    costDetail:
      "One of the expensive ones. The Pre-College programme is $6,100 and the Secondary School Programme runs $4,180-15,735 depending on format, plus a $75 application fee and your travel. Some need-based aid exists but it is limited, so work out what you would actually pay before investing in the application.",
  },
  {
    id: "rise-schmidt",
    name: "Rise (Schmidt Futures & Rhodes Trust)",
    fields: "all",
    deadline: "2027-01-15",
    window: "Applications close in winter",
    level: "international",
    category: "research_program",
    tier: "elite",
    eligibility: "Ages 15–17 worldwide. Fully funded, no cost to apply",
    url: "https://www.risefortheworld.org/",
    blurb:
      "Lifetime support for young people who use their talent to help others. Fully funded, cohort drawn worldwide.",
    cost: "funded",
    costDetail:
      "No application fee, and winners receive a scholarship, funding and long-term support.",
  },
  {
    id: "polygence",
    name: "Polygence research mentorship",
    fields: "all",
    deadline: "2027-03-01",
    window: "Rolling: cohorts start year-round",
    level: "international",
    category: "research_program",
    tier: "accessible",
    eligibility: "Middle- and high-school students worldwide",
    alwaysOpen: true,
    url: "https://www.polygence.org/",
    blurb:
      "A mentored project on any topic you choose. An accessible way to produce real research.",
    cost: "paid_aid",
    costDetail:
      "A paid mentorship: the standard program runs to roughly $2,000-3,000, with need-based financial aid available. Ask about the aid before you enrol, not after.",
  },
  {
    id: "lumiere",
    name: "Lumiere Research Scholar Program",
    fields: "all",
    deadline: "2027-03-01",
    window: "Rolling cohorts through the year",
    level: "international",
    category: "research_program",
    tier: "selective",
    // Was listed twice, under two ids, with two different tiers — so the same
    // program appeared in two fit groups at once. See RETIRED_IDS below.
    eligibility: "High-school students worldwide, ages ~13–18",
    alwaysOpen: true,
    url: "https://www.lumiere-education.com/",
    blurb:
      "Guided research with a PhD mentor, ending in a paper of your own. Need-based aid available.",
    cost: "paid_aid",
    costDetail:
      "A paid research program, roughly $2,000-8,000 depending on the track, with need-based financial aid. Ask what your actual price would be before committing.",
  },

  // ── Filling the thin fields ──────────────────────────────────────────────
  // A coverage audit showed law, arts & design and medicine were far behind
  // STEM — and medicine had a single accessible entry, so a beginner pre-med
  // saw almost nothing to start with. These target those gaps specifically.
  // URLs verified 2026-07-29.

  // Medicine & health  (Brain Bee already lives in the science section above.)
  {
    id: "future-problem-solving",
    name: "Future Problem Solving Program International",
    fields: [
      "medicine_health",
      "humanities_social",
      "natural_sciences",
      "business_economics",
    ],
    deadline: "2026-10-15",
    window: "Qualifying problems through the school year, finals in June",
    level: "international",
    category: "competition",
    tier: "accessible",
    eligibility:
      "Ages 9–18. Individual or team, via affiliate programs worldwide",
    url: "https://www.futureproblemsolving.org/",
    blurb:
      "Research a future scenario, often about health and society, then solve it. A gentle first entry.",
    cost: "varies",
    costDetail:
      "Run through schools with affiliate membership and per-team fees set locally. Ask your coach what it costs.",
  },

  // Law, politics & debate
  {
    id: "idea-debate",
    name: "IDEA — international debate competitions & academies",
    fields: ["law", "humanities_social", "business_economics"],
    deadline: "2027-03-01",
    window: "Tournaments and academies year-round",
    level: "international",
    category: "competition",
    tier: "accessible",
    eligibility:
      "Secondary-school debaters worldwide, entry level to world championships",
    url: "https://idebate.net/",
    blurb:
      "Structured debate at every level, and the most reliable way to build a record that points at law.",
    cost: "varies",
    costDetail:
      "Tournaments and academies carry fees that vary by event. Some are free; the residential academies are not. Scholarships are sometimes offered.",
  },
  {
    id: "eyp",
    name: "European Youth Parliament",
    fields: ["law", "humanities_social", "business_economics"],
    deadline: "2027-01-15",
    window:
      "National selection sessions through the year, internationals each term",
    level: "international",
    category: "competition",
    tier: "selective",
    eligibility:
      "Ages 16–22 in EYP member countries. Check whether your country has a national committee",
    url: "https://eyp.org/",
    blurb:
      "Draft resolutions in committee and defend them. Policy and legal reasoning under scrutiny.",
    cost: "varies",
    costDetail:
      "Run by national committees: some sessions charge a participation fee, others are free and even cover food and accommodation. Ask your national committee.",
  },
  // (National History Day already lives in the humanities section above.)

  // Arts & design
  {
    id: "sony-photo-youth",
    name: "Sony World Photography Awards — Youth",
    fields: ["arts_design"],
    deadline: "2027-01-05",
    window: "Youth entries close in early January",
    level: "international",
    category: "competition",
    tier: "accessible",
    eligibility: "Under 20, free to enter, open worldwide",
    url: "https://www.worldphoto.org/sony-world-photography-awards",
    blurb:
      "A free global photography award with its own youth category. Win and you have a published credit.",
    cost: "free",
    costDetail: "The Youth award has no entry fee.",
  },
  {
    id: "toyota-dream-car",
    name: "Toyota Dream Car Art Contest",
    fields: ["arts_design", "engineering"],
    deadline: "2027-01-31",
    window: "National rounds winter, world contest later in the year",
    level: "international",
    category: "competition",
    tier: "accessible",
    eligibility:
      "Under 16, in three age groups. Entered via your country's national round",
    url: "https://www.toyota-dreamcarart.com/",
    blurb:
      "Design the car of the future. One of the few global art contests aimed at younger students.",
    cost: "free",
    costDetail:
      "No entry fee at any stage, and national winners are flown to the world contest.",
  },
  {
    id: "evolo-skyscraper",
    name: "eVolo Skyscraper Competition",
    fields: ["arts_design", "engineering"],
    deadline: "2026-11-24",
    window: "Registration autumn, submissions due in winter",
    level: "international",
    category: "competition",
    tier: "elite",
    eligibility:
      "Open worldwide to students and professionals, individually or in teams",
    url: "https://www.evolo.us/",
    blurb:
      "The conceptual architecture prize people in the field know. A standout for design and architecture.",
    cost: "one_time",
    costDetail:
      "A registration fee applies (roughly $100-200, cheaper if you register early).",
  },
  {
    id: "destination-imagination",
    name: "Destination Imagination",
    fields: ["arts_design", "engineering", "computer_science"],
    deadline: "2026-11-30",
    window: "Team season autumn–spring, Global Finals in May",
    level: "international",
    category: "competition",
    tier: "accessible",
    eligibility:
      "School teams of up to 7, affiliate programs in many countries",
    url: "https://www.destinationimagination.org/",
    blurb:
      "Open-ended creative and engineering challenges, solved as a team across a season.",
    cost: "varies",
    costDetail:
      "Team-based: the team pays a membership fee plus tournament registration (a few hundred dollars in total, split across the team).",
  },

  // Business & economics
  {
    id: "ja-worldwide",
    name: "JA Company Programme (Junior Achievement)",
    fields: ["business_economics"],
    deadline: "2026-10-01",
    window:
      "Company year runs autumn–spring, national and European finals follow",
    level: "international",
    category: "competition",
    tier: "accessible",
    eligibility:
      "Secondary-school students, via your country's JA organisation",
    url: "https://www.jaworldwide.org/",
    blurb:
      "Run a real student company for a year. Nothing else here is as hands-on about business.",
    cost: "varies",
    costDetail:
      "Run through your school or national Junior Achievement organisation, so any fee is set locally. Usually nothing for the student.",
  },

  // ── Student publishing ───────────────────────────────────────────────────
  // Rolling, worldwide and mostly free, so a student with nothing on their
  // record yet can produce something verifiable without waiting for a contest
  // season. This is also what finally gives pre-med applicants an accessible
  // starting point instead of only olympiad-level entries.
  {
    id: "jei",
    name: "Journal of Emerging Investigators",
    fields: ["medicine_health", "natural_sciences", "engineering"],
    deadline: "2027-06-01",
    window: "Rolling submissions all year; peer review takes a few months",
    level: "international",
    category: "research_program",
    tier: "accessible",
    eligibility: "Middle- and high-school authors worldwide, free to submit",
    alwaysOpen: true,
    url: "https://emerginginvestigators.org/",
    blurb:
      "A peer-reviewed journal for school students. Turn a class project or a side project into a citation.",
    cost: "free",
    costDetail:
      "Free to submit and free to publish. JEI charges no article fee, and everything it publishes is free to read.",
  },
  {
    id: "young-scientist-journal",
    name: "Young Scientist Journal",
    fields: [
      "natural_sciences",
      "medicine_health",
      "engineering",
      "computer_science",
    ],
    deadline: "2027-06-01",
    window: "Rolling submissions all year",
    level: "international",
    category: "research_program",
    tier: "accessible",
    eligibility: "Students aged 12–20 worldwide",
    alwaysOpen: true,
    // Moved to its host institution; the old domain now redirects here. Checked
    // by hand 2026-08-22: same publication, same editor, May 2026 issue live.
    url: "https://www.vanderbilt.edu/youngscientistjournal/",
    blurb:
      "A student-run science journal. You can publish articles or reviews without access to a lab.",
    cost: "free",
    costDetail:
      "Free to submit and free to publish; the journal is student-run and charges no fee.",
  },
  {
    id: "concord-review",
    name: "The Concord Review",
    fields: ["humanities_social", "law"],
    deadline: "2027-02-01",
    window: "Quarterly submission deadlines through the year",
    level: "international",
    category: "research_program",
    tier: "selective",
    eligibility: "Secondary-school students worldwide, submission fee applies",
    url: "https://tcr.org/",
    blurb:
      "The only journal that publishes serious history essays by school students. Rare in the humanities.",
    cost: "one_time",
    costDetail:
      "Submitting an essay is not free: $70 with the electronic journal, $110 with the print edition in the US, and $150 with print internationally. Take the electronic tier. Reading the journal costs nothing, and publication itself carries no extra charge.",
  },
  {
    id: "stem-fellowship",
    name: "STEM Fellowship data science challenges",
    fields: ["computer_science", "natural_sciences", "medicine_health"],
    deadline: "2027-01-31",
    window: "Big Data Challenge runs winter–spring",
    level: "international",
    category: "competition",
    tier: "accessible",
    eligibility: "High-school and undergraduate teams, open internationally",
    url: "https://www.stemfellowship.org/",
    blurb:
      "Analyse a real dataset and write it up. Data skills, and a route to being published.",
    cost: "free",
    costDetail: "Free to enter its data-science challenges.",
  },
  {
    id: "curieux",
    name: "Curieux Academic Journal",
    fields: "all",
    deadline: "2027-03-01",
    window: "Rolling monthly submission rounds",
    level: "international",
    category: "research_program",
    tier: "accessible",
    eligibility: "Middle- and high-school authors worldwide, any subject",
    alwaysOpen: true,
    url: "https://curieuxacademicjournal.com/",
    blurb:
      "Publishes student research and essays in every field. A low-barrier first byline.",
    cost: "one_time",
    costDetail:
      "Curieux charges a publication fee for accepted articles. Check the current amount on their site before you submit, because it is not free.",
  },

  // ── The younger cohort (roughly grades 5–9) ───────────────────────────────
  // Everything above was built for applicants — the earliest entry point in the
  // catalog was effectively grade 9. A student who finds us at 12 has the most
  // to gain and the least to show, and was being handed a page of "eligible
  // from grade 9" stretch goals. These are open NOW to a middle-schooler,
  // international (no US-school gate), and mostly free or team-based.
  // URLs verified 2026-07-31.
  {
    id: "fll",
    name: "FIRST LEGO League Challenge",
    fields: ["engineering", "computer_science"],
    deadline: "2026-09-30",
    window: "Season opens in August, regional events from November",
    level: "international",
    category: "competition",
    tier: "accessible",
    eligibility:
      "Ages 9–16. School or community teams, age bands vary by country",
    url: "https://www.firstlegoleague.org/",
    blurb:
      "Build, program and present a robot with a team. The standard first robotics entry.",
    cost: "varies",
    costDetail:
      "Team-based: the team pays a registration fee plus the LEGO set (a few hundred dollars in total). Students joining a school team usually pay nothing directly.",
  },
  {
    id: "coolest-projects",
    name: "Coolest Projects",
    fields: ["computer_science", "engineering", "arts_design"],
    deadline: "2027-03-31",
    window: "Submissions open January–March each year",
    level: "international",
    category: "competition",
    tier: "accessible",
    eligibility: "Up to age 18. No minimum age, free to enter",
    url: "https://online.coolestprojects.org/",
    blurb:
      "Show any tech project you made, whether it is code, hardware or art. Nobody needs a track record to enter.",
    cost: "free",
    costDetail:
      "The Raspberry Pi Foundation runs it at no cost to participants.",
  },
  {
    id: "astro-pi",
    name: "European Astro Pi Challenge",
    fields: ["computer_science", "natural_sciences"],
    deadline: "2027-03-22",
    window: "Mission Zero: entries 14 Sep 2026 to 22 Mar 2027 (noon UTC)",
    dateConfirmed: true,
    level: "international",
    category: "competition",
    tier: "accessible",
    eligibility:
      "Age 19 or under. Mission Zero needs no experience and no hardware",
    url: "https://astro-pi.org/",
    blurb:
      "Write code that actually runs on the ISS. A first CS credit anyone can verify.",
    cost: "free",
    costDetail:
      "ESA and the Raspberry Pi Foundation cover everything, including actually running your code on the ISS.",
  },
  {
    id: "robocup-junior",
    name: "RoboCupJunior",
    fields: ["engineering", "computer_science"],
    deadline: "2027-02-28",
    window: "Regional qualifiers in spring, international final in July",
    level: "international",
    category: "competition",
    tier: "selective",
    eligibility:
      "Ages 10–19 by league. Enter through your regional or national event",
    url: "https://junior.robocup.org/",
    blurb:
      "Robot leagues in soccer, rescue and on-stage performance, with a genuine route to a world final.",
    cost: "varies",
    costDetail:
      "Fees are set by your regional or national organiser and vary by country; the robot hardware is the real cost.",
  },
  {
    id: "odyssey-of-the-mind",
    name: "Odyssey of the Mind",
    fields: [
      "engineering",
      "arts_design",
      "computer_science",
      "humanities_social",
    ],
    deadline: "2026-11-15",
    window: "Teams register in autumn, tournaments February–May",
    level: "international",
    category: "competition",
    tier: "accessible",
    eligibility:
      "School teams from primary upwards, via affiliate programs worldwide",
    url: "https://www.odysseyofthemind.com/",
    blurb:
      "Long-term creative engineering problems solved as a team. You can start as young as primary school.",
    cost: "varies",
    costDetail:
      "Team-based: a school or group buys a membership and pays regional tournament fees on top. We could not confirm the current membership price, so ask your coach what the season costs before you sign up.",
  },
  {
    id: "globe-ivss",
    name: "GLOBE International Virtual Science Symposium",
    fields: ["natural_sciences"],
    deadline: "2027-03-13",
    window: "Submissions in March, reviews and badges in spring",
    level: "international",
    category: "competition",
    tier: "accessible",
    eligibility:
      "School students of any age. Via a GLOBE-registered school or club",
    url: "https://www.globe.gov/",
    blurb:
      "Collect real environmental data and present it. A first taste of research, with no age floor.",
    cost: "free",
    costDetail:
      "GLOBE is a NASA-supported program and the symposium charges nothing to enter.",
  },
  {
    id: "tournament-of-towns",
    name: "Tournament of Towns (Турнир городов)",
    fields: ["computer_science", "engineering", "natural_sciences"],
    deadline: "2026-10-11",
    window: "Autumn round in October, spring round in February",
    level: "international",
    category: "olympiad",
    tier: "selective",
    eligibility:
      "School students, junior and senior papers. Roughly ages 12–18",
    url: "https://www.turgor.ru/",
    blurb:
      "The classic problem-solving olympiad across the CIS. There is a junior paper from year one.",
    cost: "free",
    costDetail: "Local organising centres run it at no cost to participants.",
  },
  {
    id: "izho",
    name: "IZhO — International Zhautykov Olympiad",
    fields: ["natural_sciences", "computer_science", "engineering"],
    deadline: "2026-11-30",
    window: "Held in Almaty each January",
    level: "international",
    category: "olympiad",
    tier: "elite",
    eligibility:
      "Secondary-school students. Via your country's national team selection",
    url: "https://izho.kz/",
    blurb:
      "Maths, physics and informatics, hosted in Almaty. The nearest elite stage there is.",
    cost: "free",
    costDetail:
      "Free for you: you are selected through your national olympiad, and the host covers participants during the event.",
  },
  {
    id: "nhsmun",
    name: "NHSMUN — National High School Model UN",
    fields: ["law", "humanities_social", "business_economics"],
    deadline: "2026-10-31",
    window: "Conference in New York each March",
    level: "international",
    category: "competition",
    tier: "selective",
    eligibility:
      "School delegations worldwide. No minimum age set by the conference",
    url: "https://imuna.org/nhsmun/nyc/",
    blurb:
      "The largest MUN conference, held at the UN itself. A serious first credit in law and policy.",
    cost: "one_time",
    costDetail:
      "Delegate fees run into the hundreds of dollars, plus travel and hotel in New York. Limited scholarships exist, so ask before you commit.",
  },
  // (The John Locke Institute's Junior Prize — its own under-15 category — is
  // part of the john-locke entry above, not a separate listing: it shares one
  // page and one deadline, and two rows for one link is how the same programme
  // ends up recommended twice.)
  {
    id: "wpy-young",
    name: "Wildlife Photographer of the Year — Young",
    fields: ["arts_design", "natural_sciences"],
    deadline: "2026-12-03",
    window: "Entries open in October, close in early December",
    level: "international",
    category: "competition",
    tier: "selective",
    eligibility:
      "Age 17 or under. Separate categories for 10 and under, 11–14, 15–17",
    url: "https://www.nhm.ac.uk/wpy/competition",
    blurb:
      "A world-famous photography award with a category for ten-year-olds. One image is the whole entry.",
    cost: "free",
    costDetail: "Free for the under-18 Young Wildlife Photographer categories.",
  },
  {
    id: "icaf-arts-olympiad",
    name: "ICAF Arts Olympiad",
    fields: ["arts_design"],
    deadline: "2027-03-31",
    window: "Runs through the school year, festival in Washington DC",
    level: "international",
    category: "competition",
    tier: "accessible",
    eligibility:
      "Ages 8–12. The school art program runs it, no portfolio needed",
    url: "https://icaf.org/",
    blurb:
      "The world's largest art programme for children, and one of the few things here aimed below secondary school.",
    cost: "free",
    costDetail: "Schools and students enter at no cost.",
  },
  // ── Law and arts: the two thinnest fields ─────────────────────────────────
  // A coverage pass by persona found a year-8 student choosing LAW saw 18
  // opportunities against 22 for medicine and arts. Part of that is structural
  // — law is not a school subject in most systems, so the honest school-level
  // proxies are debate, Model UN and policy writing — and part was simply gaps.
  // Content verified, not just the link: the Goi Peace essay contest was
  // dropped from this batch after its own page announced the programme ended
  // with the 2024 edition while still answering HTTP 200.
  // Verified 2026-08-01.
  {
    id: "harvard-model-congress",
    name: "Harvard Model Congress",
    fields: ["law", "humanities_social", "business_economics"],
    deadline: "2026-11-20",
    window:
      "Five conferences a year: Boston, San Francisco, Asia, Middle East, Europe",
    level: "international",
    category: "competition",
    tier: "selective",
    eligibility: "High-school students, entered as a school delegation",
    url: "https://www.harvardmodelcongress.org/",
    blurb:
      "Simulate a government in Harvard-run committees. Legislation, debate and negotiation.",
    cost: "one_time",
    costDetail:
      "A delegate fee (typically a few hundred dollars) plus travel and hotel for the conference.",
  },
  {
    id: "wimun",
    name: "WIMUN — WFUNA Global Model UN",
    fields: ["law", "humanities_social", "business_economics"],
    deadline: "2026-12-15",
    window:
      "Singapore in August, Geneva and Rome in November, New York in February",
    level: "international",
    category: "competition",
    tier: "selective",
    // WFUNA runs secondary and university editions from the same page and does
    // not state one age rule for all of them — so we say that rather than
    // inventing a bound the parser would then enforce.
    eligibility:
      "Secondary and university students. Check the level of the conference you pick",
    url: "https://wfuna.org/wimun/",
    blurb:
      "Model UN run by the UN's own association, using the real rules of procedure.",
    cost: "one_time",
    costDetail:
      "Delegate fees run into the hundreds of dollars, plus travel and accommodation at the UN host city.",
  },
  {
    id: "petchenik",
    name: "Barbara Petchenik Children's World Map Competition",
    fields: ["arts_design", "humanities_social"],
    deadline: "2027-02-28",
    window:
      "Biennial: national rounds, then the International Cartographic Conference",
    level: "international",
    category: "competition",
    tier: "accessible",
    // The youngest entry in the catalog by some distance: the first age band
    // starts below school age.
    //
    // The sentence names two numbers, and the parser grabbed the first one it
    // could read — "under 6" — capping this at age 5 and hiding it from every
    // student alive. Exactly the AMC failure again, caught by the reachability
    // check. The gate states the real ceiling.
    gate: { ageMax: 15 },
    eligibility:
      "Age 15 or under. Four age bands from under 6, via your country's national round",
    url: "https://icaci.org/petchenik/",
    blurb:
      "Draw the world as you see it. Age bands start under 6, the earliest entry point we know of.",
    cost: "free",
    costDetail:
      "Entries go through your national cartographic body at no cost.",
  },
  {
    id: "plural-plus",
    name: "PLURAL+ Youth Video Festival (UN)",
    fields: ["arts_design", "humanities_social"],
    deadline: "2027-06-01",
    window:
      "Submissions open through the spring, awards ceremony in the autumn",
    level: "international",
    category: "competition",
    tier: "accessible",
    eligibility:
      "Young people worldwide. Confirm the age range in the rules before you enter",
    url: "https://pluralplus.unaoc.org/",
    blurb:
      "Make a short film on migration, diversity or inclusion for a UN festival. Free to enter.",
    cost: "free",
    costDetail: "The UN-backed festival charges nothing to submit a video.",
  },
  {
    id: "simply-neuroscience",
    name: "Simply Neuroscience programs",
    fields: ["medicine_health", "natural_sciences"],
    deadline: "2027-03-01",
    window: "Programs, competitions and journals run year-round",
    level: "international",
    category: "competition",
    tier: "accessible",
    eligibility: "Ages 13+ worldwide, free to join",
    url: "https://www.simplyneuroscience.org/",
    blurb:
      "Student-run neuroscience clubs, contests and publishing. The softest landing into medicine here.",
    cost: "free",
    costDetail: "The student-run programs and competitions have no entry fee.",
  },

  // ── University courses (the missing type) ──────────────────────────────────
  // Free, self-paced, globally open — the highest-accessibility way for a
  // student far from a first-tier country to hold a respected name's course.
  // Deliberately the NICHE variants, not the banal intro everyone lists.
  {
    id: "cs50-ai",
    name: "CS50's Introduction to AI with Python (Harvard)",
    fields: ["computer_science"],
    deadline: "2027-06-30",
    window: "Self-paced online: enrol and start any time (free to audit)",
    level: "international",
    category: "course",
    tier: "accessible",
    eligibility:
      "Anyone worldwide. Free to audit; some prior Python (CS50-level) helps",
    alwaysOpen: true,
    url: "https://cs50.harvard.edu/ai/",
    blurb:
      "Search, knowledge, optimization, neural nets. Harvard's AI course, free and at your own pace.",
    cost: "free",
    costDetail:
      "Free to take, and CS50 issues its own free certificate from cs50.harvard.edu. The paid one is the OPTIONAL edX verified certificate, and it is not cheap: roughly $200-300 depending on the course, with Harvard listing $219 for CS50 Python. You never need it. The course, the problem sets and the free CS50 certificate cost nothing.",
  },
  {
    id: "cs50-cyber",
    name: "CS50's Introduction to Cybersecurity (Harvard)",
    fields: ["computer_science"],
    deadline: "2027-06-30",
    window: "Self-paced online: enrol and start any time (free to audit)",
    level: "international",
    category: "course",
    tier: "accessible",
    eligibility: "Anyone worldwide. No coding required; free to audit",
    alwaysOpen: true,
    url: "https://cs50.harvard.edu/cybersecurity/",
    blurb:
      "How systems get attacked and defended, explained for a general audience. Beginner cyber courses rarely carry a name like this.",
    cost: "free",
    costDetail:
      "Free to take, and CS50 issues its own free certificate from cs50.harvard.edu. The paid one is the OPTIONAL edX verified certificate, and it is not cheap: roughly $200-300 depending on the course, with Harvard listing $219 for CS50 Python. You never need it. The course, the problem sets and the free CS50 certificate cost nothing.",
  },
  {
    id: "mit-deep-learning",
    name: "MIT 6.S191: Introduction to Deep Learning",
    fields: ["computer_science", "engineering"],
    deadline: "2027-06-30",
    window: "Self-paced online: lectures and labs released free every year",
    level: "international",
    category: "course",
    tier: "accessible",
    eligibility:
      "Open to everyone worldwide, free; introductory university level",
    alwaysOpen: true,
    url: "https://introtodeeplearning.com/",
    blurb:
      "MIT's intro to deep learning: lectures, code labs and guest talks, all free online.",
    cost: "free",
    costDetail:
      "MIT publishes the lectures, slides and code labs openly every year. No paid tier, and no certificate to buy.",
  },
  {
    id: "code-in-place",
    name: "Code in Place (Stanford)",
    fields: ["computer_science"],
    deadline: "2027-04-01",
    window:
      "Applications open in spring; the free cohort runs a few weeks after",
    level: "international",
    category: "course",
    tier: "accessible",
    eligibility: "Beginners worldwide, free; apply for each cohort",
    url: "https://codeinplace.stanford.edu/",
    blurb:
      "Stanford's intro to Python (CS106A), taught free with a live human section leader. Real teaching, no fee.",
    cost: "free",
    costDetail:
      "Completely free: Stanford charges nothing for the course or the certificate. Places are limited, so you apply for each cohort.",
  },
  {
    id: "yale-financial-markets",
    name: "Financial Markets (Yale, Robert Shiller)",
    fields: ["business_economics"],
    deadline: "2027-06-30",
    window: "Self-paced on Coursera: free to audit any time",
    level: "international",
    category: "course",
    tier: "accessible",
    eligibility: "Open to everyone worldwide, free to audit on Coursera",
    alwaysOpen: true,
    url: "https://www.coursera.org/learn/financial-markets-global",
    blurb:
      "A Nobel laureate's tour of risk, insurance and markets. The economics course worth naming before university.",
    cost: "free_cert_paid",
    costDetail:
      "Free to audit, so lectures and readings cost nothing. Graded assignments and the shareable certificate are paid, with Coursera charging roughly $49-79 for this course, or it is included in a Coursera Plus subscription. Coursera financial aid covers most of that if granted. Recent reports say it now caps at around 90%, so expect a small remainder rather than nothing. Apply on the course page and allow about two weeks.",
  },

  // ── Internships / open-source (real, paid, remote, global) ─────────────────
  {
    id: "gsoc",
    name: "Google Summer of Code",
    fields: ["computer_science"],
    deadline: "2027-04-01",
    window:
      "Contributor proposals in spring; you build with a mentor over the summer",
    level: "international",
    category: "research_program",
    tier: "selective",
    gate: { ageMin: 18 },
    eligibility:
      "18+ worldwide. Open to newcomers to open source, not only students; stipend paid",
    url: "https://summerofcode.withgoogle.com/",
    blurb:
      "Get paid to write open-source software with a real project and a mentor. Remote, from anywhere.",
    cost: "funded",
    costDetail:
      "Free to take part, and Google pays a stipend: roughly $1,500-3,300 for a medium project and $3,000-6,600 for a large one, adjusted to your country's purchasing power, so the figure for Kazakhstan or Uzbekistan sits below the US headline. You are never asked for money. Anyone charging you for GSoC is a scam.",
  },
  {
    id: "outreachy",
    name: "Outreachy",
    fields: ["computer_science"],
    deadline: "2027-02-01",
    window: "Two cohorts a year: initial applications a few weeks before each",
    level: "international",
    category: "research_program",
    tier: "selective",
    gate: { ageMin: 18 },
    eligibility:
      "18+ worldwide, for people under-represented in tech. Remote, paid",
    url: "https://www.outreachy.org/",
    blurb:
      "A paid, remote, mentored open-source internship built for people the industry usually overlooks.",
    cost: "funded",
    costDetail:
      "Free, and interns are paid a stipend of about $7,000 for the three months.",
  },

  // ── Competitions & hackathons that a student anywhere can actually enter ────
  {
    id: "igem",
    name: "iGEM (synthetic biology)",
    fields: ["natural_sciences", "medicine_health"],
    deadline: "2027-05-01",
    window:
      "Teams form through the spring; the Grand Jamboree is in the autumn",
    level: "international",
    category: "competition",
    tier: "selective",
    eligibility:
      "High-school and university teams worldwide. See the High School division",
    url: "https://igem.org/",
    blurb:
      "Build something living. The world's synthetic-biology competition, with a division made for school teams.",
    cost: "one_time",
    costDetail:
      "Expensive and team-based: registration runs into thousands of dollars per team, plus lab costs and travel to the Jamboree. Teams raise sponsorship for it. This is not a solo entry you can self-fund.",
  },
  {
    id: "picoctf",
    name: "picoCTF (Carnegie Mellon)",
    fields: ["computer_science"],
    deadline: "2027-03-01",
    window: "Annual two-week CTF in spring; the practice gym is open all year",
    level: "international",
    category: "competition",
    tier: "accessible",
    eligibility: "Middle- and high-school students worldwide, free; all levels",
    url: "https://picoctf.org/",
    blurb:
      "Learn hacking by doing it. Carnegie Mellon's free capture-the-flag runs from a first puzzle to genuinely hard.",
    cost: "free",
    costDetail:
      "Carnegie Mellon runs it at no cost, including the practice gym that stays open all year.",
  },
  {
    id: "kaggle",
    name: "Kaggle Competitions",
    fields: ["computer_science"],
    deadline: "2027-06-30",
    window: "Competitions run all year: join any that is open",
    level: "international",
    category: "competition",
    tier: "selective",
    gate: { ageMin: 13 },
    eligibility: "Anyone 13+ worldwide, free; join any open competition",
    alwaysOpen: true,
    url: "https://www.kaggle.com/competitions",
    blurb:
      "Real data-science problems on public leaderboards. From anywhere in the world, it is how you prove you can do ML.",
    cost: "free",
    costDetail:
      "Free to enter, and many competitions pay prize money rather than charge it.",
  },
  {
    id: "codeforces",
    name: "Codeforces (competitive programming)",
    fields: ["computer_science"],
    deadline: "2027-06-30",
    window: "Rated rounds several times a week; no registration deadline",
    level: "international",
    category: "competition",
    tier: "accessible",
    eligibility: "Anyone worldwide, free; rounds open to all",
    alwaysOpen: true,
    url: "https://codeforces.com/",
    blurb:
      "The global home of competitive programming. Free rounds several times a week, and a rating you can grow.",
    cost: "free",
    costDetail: "Contests, editorials and the whole archive cost nothing.",
  },
  {
    id: "hack-club",
    name: "Hack Club",
    fields: ["computer_science"],
    deadline: "2027-06-30",
    window: "Clubs, online events and hackathons run all year",
    level: "international",
    category: "competition",
    tier: "accessible",
    eligibility: "Teenagers worldwide, free to join",
    url: "https://hackclub.com/",
    blurb:
      "A worldwide network of teenage makers. Start a club, join a hackathon, ship something real.",
    cost: "free",
    costDetail:
      "Hack Club is a non-profit. Clubs, events and most hardware grants cost students nothing.",
  },
  {
    id: "first-global",
    name: "FIRST Global Challenge (robotics)",
    fields: ["engineering", "computer_science"],
    deadline: "2027-05-01",
    window:
      "One team per country; the international championship is in the autumn",
    level: "international",
    category: "competition",
    tier: "selective",
    eligibility:
      "Roughly ages 14–18. One national team per country; ask your country's team",
    url: "https://first.global/",
    blurb:
      "An Olympics of robotics, one team per nation. It is built so students everywhere compete, not just rich schools.",
    cost: "varies",
    costDetail:
      "You take part through your country's national team, whose costs are carried by its organisers and sponsors rather than by you.",
  },

  // ── Physics, astronomy, space (accessible, mostly online/free) ─────────────
  {
    id: "beamline-for-schools",
    name: "CERN Beamline for Schools",
    fields: ["natural_sciences", "engineering"],
    deadline: "2027-04-15",
    window:
      "Team proposals in spring; winners run their experiment at CERN or DESY",
    level: "international",
    category: "competition",
    tier: "selective",
    eligibility:
      "Teams of high-school students worldwide (about 16+), free to enter",
    url: "https://beamlineforschools.cern/",
    blurb:
      "Propose a real particle-physics experiment; winning teams actually run it on a CERN/DESY beam.",
    cost: "free",
    costDetail:
      "Entering costs nothing, and CERN or DESY covers the winning teams' travel and stay.",
  },
  {
    id: "iaac",
    name: "International Astronomy & Astrophysics Competition",
    fields: ["natural_sciences"],
    deadline: "2027-06-01",
    window: "Qualification and final rounds over the summer; entirely online",
    level: "international",
    category: "competition",
    tier: "accessible",
    gate: { ageMax: 19 },
    eligibility:
      "Pre-university students worldwide, under 20. Online; qualification is free",
    url: "https://iaac.space/",
    blurb:
      "Solve astrophysics problems online, at your own desk. No telescope, no travel, open to everyone.",
    cost: "free_then_paid",
    costDetail:
      "The qualification and pre-final rounds are free. A small fee (about EUR 20) applies only at the final round, and it is waived on request for students who cannot pay.",
  },
  {
    id: "cubes-in-space",
    name: "Cubes in Space",
    fields: ["engineering", "natural_sciences"],
    deadline: "2027-02-01",
    window:
      "Design competitions with launches on NASA rockets and balloons; free",
    level: "international",
    category: "competition",
    tier: "accessible",
    gate: { ageMin: 11, ageMax: 18 },
    eligibility: "Ages 11–18 worldwide, free to enter",
    url: "https://www.cubesinspace.com/",
    blurb:
      "Design a tiny experiment that actually flies to near-space on a NASA rocket or balloon. Free, and aimed at young students.",
    cost: "free",
    costDetail:
      "The program covers the launch itself, so selected teams pay nothing to fly an experiment.",
  },

  // ── Immersive summer maths (competitive, but with real financial aid) ──────
  {
    id: "ross-mathematics",
    name: "Ross Mathematics Program",
    fields: ["computer_science", "engineering", "natural_sciences"],
    deadline: "2027-03-15",
    window:
      "Applications in spring; a 6-week immersion in summer; need-based aid",
    level: "international",
    category: "summer_program",
    tier: "selective",
    eligibility:
      "Pre-college students ~15+ worldwide, need-based financial aid offered",
    url: "https://rossprogram.org/",
    blurb:
      "Deep number theory from scratch, the way mathematicians actually think. People come back changed by it, and there is aid.",
    cost: "paid_aid",
    costDetail:
      "Tuition is around $6,000, with need-based financial aid available. Ask for it in the application rather than after you are admitted.",
  },
  {
    id: "mathcamp",
    name: "Canada/USA Mathcamp",
    fields: ["computer_science", "engineering", "natural_sciences"],
    deadline: "2027-03-01",
    window:
      "Applications in spring; a 5-week program in summer; need-based aid",
    level: "international",
    category: "summer_program",
    tier: "selective",
    eligibility: "Ages 13–18 worldwide, need-based financial aid offered",
    url: "https://www.mathcamp.org/",
    blurb:
      "Five weeks of mathematics you choose yourself, alongside real mathematicians. Aid for international students is need-blind.",
    cost: "paid_aid",
    costDetail:
      "$7,500 for 2026, and the final fee lands anywhere between $0 and $7,500 after need-based aid. The automatic free tier covers US and Canadian families under $100,000. From elsewhere it is case by case, so ask what you would actually pay.",
  },

  // ── More free university courses (highest-accessibility type) ──────────────
  {
    id: "cs50-web",
    name: "CS50's Web Programming with Python & JavaScript (Harvard)",
    fields: ["computer_science"],
    deadline: "2027-06-30",
    window: "Self-paced online: enrol and start any time (free to audit)",
    level: "international",
    category: "course",
    tier: "accessible",
    eligibility:
      "Anyone worldwide. Free to audit; some prior programming helps",
    alwaysOpen: true,
    url: "https://cs50.harvard.edu/web/",
    blurb:
      "Build and deploy real web apps in Django, React and SQL. The practical follow-on to CS50.",
    cost: "free",
    costDetail:
      "Free to take, and CS50 issues its own free certificate from cs50.harvard.edu. The paid one is the OPTIONAL edX verified certificate, and it is not cheap: roughly $200-300 depending on the course, with Harvard listing $219 for CS50 Python. You never need it. The course, the problem sets and the free CS50 certificate cost nothing.",
  },
  {
    id: "cs50-python",
    name: "CS50's Introduction to Programming with Python (Harvard)",
    fields: ["computer_science"],
    deadline: "2027-06-30",
    window: "Self-paced online: enrol and start any time (free to audit)",
    level: "international",
    category: "course",
    tier: "accessible",
    eligibility: "Anyone worldwide. No experience needed; free to audit",
    alwaysOpen: true,
    url: "https://cs50.harvard.edu/python/",
    blurb:
      "A gentler on-ramp than CS50 itself: pure Python from zero, taught to Harvard's standard.",
    cost: "free",
    costDetail:
      "Free to take, and CS50 issues its own free certificate from cs50.harvard.edu. The paid one is the OPTIONAL edX verified certificate, and it is not cheap: roughly $200-300 depending on the course, with Harvard listing $219 for CS50 Python. You never need it. The course, the problem sets and the free CS50 certificate cost nothing.",
  },
  {
    id: "full-stack-open",
    name: "Full Stack Open (University of Helsinki)",
    fields: ["computer_science"],
    deadline: "2027-06-30",
    window: "Self-paced online: start any time, free, certificate included",
    level: "international",
    category: "course",
    tier: "accessible",
    eligibility:
      "Anyone worldwide. Free; modern web development, certificate on completion",
    alwaysOpen: true,
    url: "https://fullstackopen.com/en/",
    blurb:
      "React, Node, GraphQL and testing, free from a real university. It is the web course companies actually rate.",
    cost: "free",
    costDetail:
      "Genuinely free end to end: the course and the certificate cost nothing, and neither do the University of Helsinki ECTS credits, which just need a free Open University enrolment. The rare one with no catch at the finish line.",
  },
  {
    id: "elements-of-ai",
    name: "Elements of AI (University of Helsinki)",
    fields: ["computer_science"],
    deadline: "2027-06-30",
    window: "Self-paced online: start any time, free, certificate included",
    level: "international",
    category: "course",
    tier: "accessible",
    eligibility: "Anyone worldwide. Free; no maths or coding required",
    alwaysOpen: true,
    url: "https://www.elementsofai.com/",
    blurb:
      "What AI actually is, explained for everyone. A whole country used this free course to reskill.",
    cost: "free",
    costDetail:
      "Free including the certificate, because the University of Helsinki funds it. Study credits are available free too.",
  },
  {
    id: "ml-andrew-ng",
    name: "Machine Learning Specialization (Andrew Ng, Stanford / DeepLearning.AI)",
    fields: ["computer_science"],
    deadline: "2027-06-30",
    window: "Self-paced on Coursera: free to audit any time",
    level: "international",
    category: "course",
    tier: "accessible",
    eligibility: "Anyone worldwide. Free to audit; the classic first ML course",
    alwaysOpen: true,
    url: "https://www.coursera.org/specializations/machine-learning-introduction",
    blurb:
      "The machine-learning course that taught a generation. Rebuilt since, and still free to audit.",
    cost: "free_cert_paid",
    costDetail:
      "Each of the three courses is free to audit. The certificate runs on a Coursera subscription of about $49 a month after a 7-day free trial, so the total depends on how fast you finish. Financial aid is available and covers most of it if granted, recently capped at around 90%, so expect a small remainder.",
  },
  {
    id: "missing-semester",
    name: "The Missing Semester of Your CS Education (MIT)",
    fields: ["computer_science"],
    deadline: "2027-06-30",
    window: "Self-paced online: videos and notes, free, any time",
    level: "international",
    category: "course",
    tier: "accessible",
    eligibility: "Anyone worldwide. Free; the tooling every CS course skips",
    alwaysOpen: true,
    url: "https://missing.csail.mit.edu/",
    blurb:
      "The shell, git, editors, debugging. These are the skills that make everything else faster, and MIT gives them away.",
    cost: "free",
    costDetail:
      "MIT publishes the videos and notes openly. Nothing to sign up for, nothing to pay, no certificate.",
  },

  // ── Do-it-anywhere CS contests & fellowships ───────────────────────────────
  {
    id: "advent-of-code",
    name: "Advent of Code",
    fields: ["computer_science"],
    deadline: "2026-12-01",
    // Dec 1 is when the new event STARTS, not a deadline — puzzles unlock daily
    // 1–25 December and there is nothing to submit "by" a date. Every past year's
    // puzzles stay open to solve any time, so this is genuinely open now rather
    // than a countdown. Showing "Deadline Dec 1" was wrong. Checked 2026-08-03.
    window:
      "New puzzles daily 1–25 December; all past years playable any time, free",
    alwaysOpen: true,
    level: "international",
    category: "competition",
    tier: "accessible",
    eligibility: "Anyone worldwide. Free; solve in any programming language",
    url: "https://adventofcode.com/",
    blurb:
      "A programming puzzle a day through December, with a huge following. The friendliest way into coding contests.",
    cost: "free",
    costDetail:
      "All 25 days of puzzles are open to everyone. Donations are optional and change nothing about the puzzles.",
  },
  {
    id: "project-euler",
    name: "Project Euler",
    fields: ["computer_science", "natural_sciences"],
    deadline: "2027-06-30",
    window: "Self-paced: hundreds of problems, solve any time, no registration",
    level: "international",
    category: "competition",
    tier: "accessible",
    eligibility: "Anyone worldwide. Free; no deadline, work at your own pace",
    alwaysOpen: true,
    url: "https://projecteuler.net/",
    blurb:
      "Maths problems you crack with code. A free, endless ladder that builds real problem-solving.",
    cost: "free",
    costDetail: "An account is all you need, and there is no paid tier.",
  },
  {
    id: "atcoder",
    name: "AtCoder (competitive programming)",
    fields: ["computer_science"],
    deadline: "2027-06-30",
    window: "Rated contests most weekends: no registration deadline",
    level: "international",
    category: "competition",
    tier: "accessible",
    eligibility: "Anyone worldwide. Free; contests have full English support",
    alwaysOpen: true,
    url: "https://atcoder.jp/",
    blurb:
      "Japan's competitive-programming judge, in English. Clean problems, and a rating you can climb.",
    cost: "free",
    costDetail:
      "Free to compete in the contests. There is an optional paid membership for extra practice material, but the rated contests are free.",
  },
  {
    id: "mlh-fellowship",
    name: "MLH Fellowship",
    fields: ["computer_science"],
    deadline: "2027-05-01",
    window: "Several batches a year; apply a few weeks before each",
    level: "international",
    category: "research_program",
    tier: "selective",
    gate: { ageMin: 18 },
    eligibility:
      "18+ worldwide. A remote, mentored software programme in small teams",
    url: "https://fellowship.mlh.com/",
    blurb:
      "Twelve weeks building real open source with a mentor and a small pod. Fully remote, from anywhere.",
    cost: "funded",
    costDetail:
      "The fellowship charges no tuition, and most tracks pay participants a stipend. Confirm what applies to the track you are applying for.",
  },

  // ── Physics, engineering, maths modelling (teams, global) ──────────────────
  {
    id: "iypt",
    name: "International Young Physicists' Tournament",
    fields: ["natural_sciences"],
    deadline: "2027-01-31",
    window:
      "National tournaments in winter/spring; the international final follows",
    level: "international",
    category: "olympiad",
    tier: "selective",
    eligibility:
      "School teams via your country's national selection. Check your organiser",
    url: "https://www.iypt.org/",
    blurb:
      "Argue open-ended physics problems the way researchers do. It is a debate tournament, not an exam.",
    cost: "free",
    costDetail:
      "Free for you: you compete through your national team, whose costs are carried by the national organiser.",
  },
  {
    id: "immc",
    name: "International Mathematical Modeling Challenge (IM²C)",
    fields: ["computer_science", "engineering", "natural_sciences"],
    deadline: "2027-03-01",
    window: "National round first (late winter), then international evaluation",
    level: "international",
    category: "competition",
    tier: "selective",
    eligibility:
      "School teams worldwide. Enter through your country's organiser",
    url: "https://immchallenge.org.au/",
    blurb:
      "Your team takes a messy real-world problem and models it over a few days. Maths that looks like the job.",
    cost: "varies",
    costDetail:
      "You enter through your school and your national organiser, so any fee is set locally. Ask your supervising teacher.",
  },
  {
    id: "junior-academy",
    name: "The Junior Academy (New York Academy of Sciences)",
    fields: ["natural_sciences", "engineering", "computer_science"],
    deadline: "2027-02-01",
    window: "Themed innovation challenges run in cycles through the year",
    level: "international",
    category: "competition",
    tier: "accessible",
    gate: { ageMin: 13, ageMax: 17 },
    eligibility:
      "Ages 13–17 worldwide. Free; team innovation challenges, entirely online",
    url: "https://www.nyas.org/programs/the-junior-academy/",
    blurb:
      "You get placed on a global team to solve a real STEM challenge online, with a mentor. Free, and selective on merit rather than money.",
    cost: "free",
    costDetail:
      "The New York Academy of Sciences funds it, so membership and mentoring cost students nothing.",
  },

  // ── Writing, economics, the humanities (global, low-cost) ──────────────────
  {
    id: "adroit-prizes",
    name: "The Adroit Prizes for Poetry & Prose",
    fields: ["humanities_social", "arts_design"],
    deadline: "2027-05-01",
    window: "Submissions open in the spring each year",
    level: "international",
    category: "competition",
    tier: "selective",
    eligibility:
      "Secondary and undergraduate students worldwide, fee waivers available",
    url: "https://theadroitjournal.org/",
    blurb:
      "A literary prize that reads student work seriously. Poetry or prose, judged by working writers.",
    cost: "one_time",
    costDetail:
      "Submitting carries a fee. Check the current amount on the prize page, because we could not confirm it. The journal waives it for students for whom it is a barrier, but you have to write and ask.",
  },
  {
    id: "foyle-young-poets",
    name: "Foyle Young Poets of the Year Award",
    fields: ["humanities_social", "arts_design"],
    deadline: "2027-07-31",
    window: "Submissions open through spring and summer; deadline in July",
    level: "international",
    category: "competition",
    tier: "accessible",
    gate: { ageMin: 11, ageMax: 17 },
    eligibility: "Ages 11–17 worldwide, free to enter",
    url: "https://foyleyoungpoets.org/",
    blurb:
      "One of the biggest youth poetry awards anywhere. Free, open worldwide, and it has started real careers.",
    cost: "free",
    costDetail: "The Poetry Society charges nothing to enter, at any age.",
  },

  // ── Free courses across fields (not just CS) — the accessible core ─────────
  {
    id: "harvard-justice",
    name: "Justice (Harvard, Michael Sandel)",
    fields: ["humanities_social"],
    deadline: "2027-06-30",
    window: "Self-paced online: watch and read any time, free",
    level: "international",
    category: "course",
    tier: "accessible",
    eligibility:
      "Anyone worldwide, free; Harvard's famous moral-philosophy course",
    alwaysOpen: true,
    url: "https://justiceharvard.org/",
    blurb:
      "How to reason about right and wrong. Harvard put it online and more people took it than anything else they have published.",
    cost: "free",
    costDetail:
      "Free to watch: the full lecture series is open on justiceharvard.org. The edX version is also free to audit, and only its certificate costs money.",
  },
  {
    id: "odin-project",
    name: "The Odin Project (full-stack web development)",
    fields: ["computer_science"],
    deadline: "2027-06-30",
    window: "Self-paced online: start any time, free and open-source",
    level: "international",
    category: "course",
    tier: "accessible",
    eligibility:
      "Anyone worldwide. Free; a complete path from zero to employable web developer",
    alwaysOpen: true,
    url: "https://www.theodinproject.com/",
    blurb:
      "A free, project-based route into web development that people genuinely get hired from. No fee, ever.",
    cost: "free",
    costDetail:
      "Free and open-source, permanently. No paid tier and no certificate to buy. You may choose to pay for optional third-party tools, but nothing in the curriculum requires it.",
  },
  {
    id: "yale-psychology",
    name: "Introduction to Psychology (Yale, Paul Bloom)",
    fields: ["humanities_social", "medicine_health"],
    deadline: "2027-06-30",
    window: "Self-paced on Coursera: free to audit any time",
    level: "international",
    category: "course",
    tier: "accessible",
    eligibility:
      "Anyone worldwide. Free to audit; Yale's introduction to the mind",
    alwaysOpen: true,
    url: "https://www.coursera.org/learn/introduction-psychology",
    blurb:
      "Yale's introduction to psychology: perception, memory, emotion, happiness. Free to audit from anywhere.",
    cost: "free_cert_paid",
    costDetail:
      "Free to audit: lectures and readings cost nothing. Graded assignments and the shareable certificate are paid (roughly $49-79, or included in a Coursera Plus subscription). Coursera financial aid covers most of that if granted (recently capped at around 90%, so budget for a small remainder). Apply on the course page.",
  },
  {
    id: "learning-how-to-learn",
    name: "Learning How to Learn (Coursera)",
    fields: "all",
    deadline: "2027-06-30",
    window: "Self-paced on Coursera: free to audit any time",
    level: "international",
    category: "course",
    tier: "accessible",
    eligibility: "Anyone worldwide. Free to audit; useful for every subject",
    alwaysOpen: true,
    url: "https://www.coursera.org/learn/learning-how-to-learn",
    blurb:
      "How your brain learns, and how to study far less painfully. More people have taken it than any other online course.",
    cost: "free_cert_paid",
    costDetail:
      "Free to audit, so the videos and readings cost nothing. The certificate is paid, roughly $49-79 or included in a Coursera Plus subscription. Coursera financial aid covers most of it if granted, recently capped at around 90%, so expect a small remainder.",
  },
  {
    id: "model-thinking",
    name: "Model Thinking (University of Michigan)",
    fields: ["business_economics", "humanities_social"],
    deadline: "2027-06-30",
    window: "Self-paced on Coursera: free to audit any time",
    level: "international",
    category: "course",
    tier: "accessible",
    eligibility:
      "Anyone worldwide. Free to audit; the mental models economists actually use",
    alwaysOpen: true,
    url: "https://www.coursera.org/learn/model-thinking",
    blurb:
      "A toolbox of models for thinking clearly about the world, covering economics, networks and decisions. Free.",
    cost: "free_cert_paid",
    costDetail:
      "Free to audit, so lectures and readings cost nothing. The certificate is paid, roughly $49-79 or included in a Coursera Plus subscription. Coursera financial aid is available on the course page and covers most of the fee if granted, not always all of it.",
  },
  {
    id: "mru-economics",
    name: "Marginal Revolution University (economics)",
    fields: ["business_economics"],
    deadline: "2027-06-30",
    window: "Self-paced online: short courses and videos, free, any time",
    level: "international",
    category: "course",
    tier: "accessible",
    eligibility:
      "Anyone worldwide. Free; clear economics from working economists",
    alwaysOpen: true,
    url: "https://mru.org/",
    blurb:
      "Economics explained in short, sharp videos by working economists. The friendliest serious economics on the web.",
    cost: "free",
    costDetail:
      "Every video and course is open, funded by the Mercatus Center. No account needed.",
  },
  {
    id: "google-data-analytics",
    name: "Google Data Analytics Certificate (Coursera)",
    fields: ["business_economics", "computer_science"],
    deadline: "2027-06-30",
    window: "Self-paced on Coursera: audit free; financial aid available",
    level: "international",
    category: "course",
    tier: "accessible",
    eligibility:
      "Anyone worldwide. Audit free, financial aid available; a job-ready credential",
    alwaysOpen: true,
    url: "https://www.coursera.org/professional-certificates/google-data-analytics",
    blurb:
      "Spreadsheets, SQL, R and dashboards, ending in a data credential employers recognise. You can earn it from anywhere.",
    cost: "free_cert_paid",
    costDetail:
      "Free to audit the material. The certificate itself is a Coursera subscription of around $49 a month after a 7-day free trial, so finishing in three months costs roughly three payments. Financial aid is available and covers most of it if granted, recently capped at around 90%, so expect a small remainder.",
  },
  {
    id: "mit-linear-algebra",
    name: "MIT 18.06 Linear Algebra (Gilbert Strang)",
    fields: ["computer_science", "engineering", "natural_sciences"],
    deadline: "2027-06-30",
    window: "Self-paced online (MIT OpenCourseWare): videos and problems, free",
    level: "international",
    category: "course",
    tier: "accessible",
    eligibility:
      "Anyone worldwide. Free; the maths behind machine learning and graphics",
    alwaysOpen: true,
    url: "https://ocw.mit.edu/courses/18-06-linear-algebra-spring-2010/",
    blurb:
      "The linear-algebra course everyone is sent to. It is the foundation under ML, engineering and computer graphics, and MIT gives it away.",
    cost: "free",
    costDetail:
      "Free forever: MIT OpenCourseWare publishes the whole course, videos, problem sets and exams, with no account and no fee. There is no certificate at all, paid or free.",
  },
  {
    id: "mit-physics-mechanics",
    name: "MIT 8.01 Classical Mechanics (OpenCourseWare)",
    fields: ["natural_sciences", "engineering"],
    deadline: "2027-06-30",
    window: "Self-paced online (MIT OpenCourseWare): videos and problems, free",
    level: "international",
    category: "course",
    tier: "accessible",
    eligibility:
      "Anyone worldwide. Free; calculus-based introductory physics from MIT",
    alwaysOpen: true,
    url: "https://ocw.mit.edu/courses/8-01sc-classical-mechanics-fall-2016/",
    blurb:
      "MIT's first-year physics, with the problem sets and exams intact. Free, and you work through it at your own pace.",
    cost: "free",
    costDetail:
      "Free forever: MIT OpenCourseWare publishes the whole course, videos, problem sets and exams, with no account and no fee. There is no certificate at all, paid or free.",
  },
  {
    id: "cs50-games",
    name: "CS50's Introduction to Game Development (Harvard)",
    fields: ["computer_science"],
    deadline: "2027-06-30",
    window: "Self-paced online: enrol and start any time (free to audit)",
    level: "international",
    category: "course",
    tier: "accessible",
    eligibility:
      "Anyone worldwide. Free to audit; some prior programming helps",
    alwaysOpen: true,
    url: "https://cs50.harvard.edu/games/",
    blurb:
      "Rebuild Mario, Zelda and Pong to learn how games really work. Harvard's game-dev course, free.",
    cost: "free",
    costDetail:
      "Free to take, and CS50 issues its own free certificate from cs50.harvard.edu. The paid one is the OPTIONAL edX verified certificate, and it is not cheap: roughly $200-300 depending on the course, with Harvard listing $219 for CS50 Python. You never need it. The course, the problem sets and the free CS50 certificate cost nothing.",
  },
  {
    id: "duke-genetics",
    name: "Introduction to Genetics and Evolution (Duke)",
    fields: ["medicine_health", "natural_sciences"],
    deadline: "2027-06-30",
    window: "Self-paced on Coursera: free to audit any time",
    level: "international",
    category: "course",
    tier: "accessible",
    eligibility:
      "Anyone worldwide. Free to audit; genetics and evolution from the ground up",
    alwaysOpen: true,
    url: "https://www.coursera.org/learn/genetics-evolution",
    blurb:
      "A proper university genetics course, free to audit. The serious biology foundation to have before medicine.",
    cost: "free_cert_paid",
    costDetail:
      "Free to audit, so lectures and readings cost nothing. The certificate is paid, roughly $49-79 or included in a Coursera Plus subscription. Coursera financial aid is available on the course page and covers most of the fee if granted, not always all of it.",
  },

  // ── Data-science contests built for emerging markets, and remote research ──
  {
    id: "zindi",
    name: "Zindi (data-science competitions)",
    fields: ["computer_science"],
    deadline: "2027-06-30",
    window: "Competitions run year-round: join any that is open",
    level: "international",
    category: "competition",
    tier: "accessible",
    eligibility:
      "Anyone worldwide. Free; challenges built around real emerging-market problems",
    alwaysOpen: true,
    url: "https://zindi.world/",
    blurb:
      "A data-science community that grew up outside Silicon Valley. Real competitions, open to everyone, nobody at the gate.",
    cost: "free",
    costDetail: "Free to enter, and several competitions carry cash prizes.",
  },
  {
    id: "driven-data",
    name: "DrivenData (machine learning for social good)",
    fields: ["computer_science"],
    deadline: "2027-06-30",
    window: "Competitions run year-round: join any that is open",
    level: "international",
    category: "competition",
    tier: "selective",
    eligibility:
      "Anyone worldwide. Free; machine-learning competitions with a real-world purpose",
    alwaysOpen: true,
    url: "https://www.drivendata.org/",
    blurb:
      "Data-science competitions where the prize is impact rather than a leaderboard place. Health, conservation, public services.",
    cost: "free",
    costDetail: "Free to enter, and the competitions carry prize money.",
  },
  {
    id: "codingame",
    name: "CodinGame",
    fields: ["computer_science"],
    deadline: "2027-06-30",
    window: "Contests and puzzles run year-round; no registration deadline",
    level: "international",
    category: "competition",
    tier: "accessible",
    eligibility:
      "Anyone worldwide. Free; learn by solving games and bot battles",
    alwaysOpen: true,
    url: "https://www.codingame.com/",
    blurb:
      "Programming puzzles and bot battles dressed up as games. The least intimidating way into competitive coding.",
    cost: "free",
    costDetail:
      "Free for you. The platform is paid for by companies recruiting on it, not by players.",
  },
  {
    id: "lfx-mentorship",
    name: "Linux Foundation LFX Mentorship",
    fields: ["computer_science"],
    deadline: "2027-05-01",
    window: "Several terms a year; apply a few weeks before each",
    level: "international",
    category: "research_program",
    tier: "selective",
    gate: { ageMin: 18 },
    eligibility:
      "18+ worldwide. Remote, mentored open-source work; most projects pay a stipend",
    url: "https://mentorship.lfx.linuxfoundation.org/",
    blurb:
      "Get paid to work on the software the internet runs on (Linux, Kubernetes and more), mentored, from anywhere.",
  },

  // ── Industry certificates that are FREE and open to school students ────────
  // The named "free + valuable" certs going round (Salesforce Trailhead, MongoDB
  // University, NVIDIA DLI, Snowflake) mostly gate at 18+ or enterprise sign-up —
  // so they are NOT here. These are the versions verified open to under-18s, with
  // an age gate encoded so we never imply a 12-year-old can start an 18+ course.
  {
    id: "ibm-skillsbuild",
    name: "IBM SkillsBuild",
    fields: ["computer_science", "business_economics"],
    deadline: "2027-06-30",
    window: "Self-paced online: start any time, free digital badges",
    level: "international",
    category: "course",
    tier: "accessible",
    gate: { ageMin: 13 },
    eligibility:
      "Ages 13+ worldwide. Free; a high-school track (13–18) in data, cyber and cloud",
    url: "https://skillsbuild.org/",
    blurb:
      "IBM's free skills platform, with a track built for 13–18s. Real digital badges in data, cybersecurity and cloud.",
    alwaysOpen: true,
    cost: "free",
    costDetail:
      "Free end to end: the courses and IBM digital badges cost nothing, with no subscription and no paid tier.",
  },
  {
    id: "aws-educate",
    name: "AWS Educate",
    fields: ["computer_science"],
    deadline: "2027-06-30",
    window: "Self-paced online: start any time, free (no credit card)",
    level: "international",
    category: "course",
    tier: "accessible",
    gate: { ageMin: 13 },
    eligibility:
      "Ages 13+ worldwide. Free, no credit card; cloud-computing courses and labs",
    url: "https://aws.amazon.com/education/awseducate/",
    blurb:
      "Learn cloud computing on real AWS, free and with no card. Built for students, badges included.",
    alwaysOpen: true,
    cost: "free",
    costDetail:
      "AWS Educate itself is free. The courses and skill badges cost nothing and it needs no credit card. The separate, professional AWS Certification exams cost $100+, but you never need those here.",
  },
  {
    id: "github-foundations",
    name: "GitHub Foundations Certification",
    fields: ["computer_science"],
    deadline: "2027-06-30",
    window:
      "Self-paced online: study any time; the exam is free for verified students",
    level: "international",
    category: "course",
    tier: "accessible",
    gate: { ageMin: 13 },
    eligibility:
      "Verified students 13+ worldwide, free exam via GitHub Education",
    url: "https://education.github.com/experiences/foundations_certificate",
    blurb:
      "A recognised Git and GitHub certification. Verify as a student and it is free to sit, from age 13.",
    alwaysOpen: true,
    cost: "free",
    costDetail:
      "Free for students verified through GitHub Education, where a voucher waives the usual ~$99 exam fee. Non-students pay about $99, so verify as a student first.",
  },
  {
    id: "google-skillshop",
    name: "Google Skillshop (marketing & analytics)",
    fields: ["business_economics"],
    deadline: "2027-06-30",
    window: "Self-paced online: start any time, free certifications",
    level: "international",
    category: "course",
    tier: "accessible",
    eligibility: "Anyone worldwide. Free; sign in with a Google account",
    url: "https://skillshop.withgoogle.com/",
    blurb:
      "Google's own free certifications in digital marketing, Ads and Analytics. A credential with a real name behind it.",
    alwaysOpen: true,
    cost: "free",
    costDetail:
      "Every Skillshop certification, Google Ads and Analytics included, has no course or exam fee. Certificates just need renewing about once a year.",
  },
  {
    id: "freecodecamp",
    name: "freeCodeCamp",
    fields: ["computer_science"],
    deadline: "2027-06-30",
    window: "Self-paced online: start any time, free certifications",
    level: "international",
    category: "course",
    tier: "accessible",
    eligibility:
      "Anyone worldwide. Free; all ages, self-paced developer certifications",
    url: "https://www.freecodecamp.org/",
    blurb:
      "Thousands of hours of coding, free, ending in certifications people put on real CVs. No age limit and no fee.",
    alwaysOpen: true,
    cost: "free",
    costDetail:
      "A donor-funded nonprofit: the whole curriculum and all 15 certifications are free, with no paid tier, no upsell, and no account even required.",
  },
  {
    id: "microsoft-learn",
    name: "Microsoft Learn",
    fields: ["computer_science"],
    deadline: "2027-06-30",
    window: "Self-paced online: start any time, free paths and student certs",
    level: "international",
    category: "course",
    tier: "accessible",
    gate: { ageMin: 13 },
    eligibility:
      "Ages 13+ worldwide. Free learning paths, badges and student fundamentals certs",
    url: "https://learn.microsoft.com/training/",
    blurb:
      "Microsoft's free training in cloud, AI and data, with fundamentals certifications students can earn from 13.",
    alwaysOpen: true,
    cost: "free_cert_paid",
    costDetail:
      "All the learning on Microsoft Learn is free. The official certification exams such as Azure Fundamentals (AZ-900) cost about $99, though Microsoft regularly gives free exam vouchers at its Virtual Training Day webinars.",
  },
  {
    id: "cisco-skills-for-all",
    name: "Cisco Networking Academy (Skills for All)",
    fields: ["computer_science"],
    deadline: "2027-06-30",
    window: "Self-paced online: start any time, free, mobile-first",
    level: "international",
    category: "course",
    tier: "accessible",
    gate: { ageMin: 13 },
    eligibility:
      "Ages 13+ worldwide. Free and mobile-first; cybersecurity, Python, networking, data",
    url: "https://www.netacad.com/",
    blurb:
      "Cisco's free courses work on a phone and end in an entry-level certificate. Cybersecurity and Python from age 13.",
    alwaysOpen: true,
    cost: "free",
    costDetail:
      "The courses, practice tests and Skills for All completion certificates are all free. Only the separate professional certification exams (like CCNA) cost money, and you never need them to learn.",
  },
  {
    id: "sololearn",
    name: "Sololearn",
    fields: ["computer_science"],
    deadline: "2027-06-30",
    window: "Self-paced on your phone: start any time, free",
    level: "international",
    category: "course",
    tier: "accessible",
    gate: { ageMin: 13 },
    eligibility:
      "Ages 13+ worldwide. Free; learn to code on a phone, 20+ languages",
    url: "https://www.sololearn.com/",
    blurb:
      "Learn to code entirely on your phone. Bite-size, free, 20+ languages, and built for exactly the situation where there is no laptop.",
    alwaysOpen: true,
    cost: "freemium",
    costDetail:
      "A real free tier, ad-supported, and course-completion certificates are free without paying. An optional Pro subscription of about $6-13 a month unlocks the full courses and unlimited practice.",
  },
  {
    id: "aops-community",
    name: "Art of Problem Solving Community",
    fields: ["natural_sciences", "computer_science"],
    deadline: "2027-06-30",
    window: "Open all year: post a question any time, free account",
    level: "international",
    category: "community",
    tier: "accessible",
    eligibility:
      "Anyone worldwide. Free account; the forums are used mostly by school students",
    url: "https://artofproblemsolving.com/community",
    blurb:
      "The maths forum most olympiad students actually grew up on — post a problem you are stuck on and someone will work through it with you.",
    alwaysOpen: true,
    cost: "freemium",
    costDetail:
      "The community, the wiki and the problem archives are free with a free account. AoPS also sells structured online courses, and those are not free. You never need them to use the forums.",
  },
  {
    id: "scratch-community",
    name: "Scratch",
    fields: ["computer_science", "arts_design"],
    deadline: "2027-06-30",
    window: "Open all year: make something and share it, free",
    level: "international",
    category: "community",
    tier: "accessible",
    eligibility:
      "All ages. Free; run by MIT, and the usual starting point for anyone under about 14",
    url: "https://scratch.mit.edu/",
    blurb:
      "MIT's block-based platform where millions of school students publish games and animations, and remix each other's. The lowest-friction first project there is.",
    alwaysOpen: true,
    cost: "free",
    costDetail:
      "Entirely free and non-commercial, run by the MIT Media Lab. No paid tier and no adverts.",
  },
  {
    id: "zooniverse",
    name: "Zooniverse",
    fields: ["natural_sciences", "humanities_social"],
    deadline: "2027-06-30",
    window: "Open all year: pick a project and start, free",
    level: "international",
    category: "community",
    tier: "accessible",
    eligibility:
      "Anyone worldwide. Free, no account needed to start classifying",
    url: "https://www.zooniverse.org/",
    blurb:
      "Real research that needs human eyes: classify galaxies, transcribe war diaries, count penguins. Contributors are credited in published papers.",
    alwaysOpen: true,
    cost: "free",
    costDetail:
      "Free, and run by a university-led collaboration rather than a company. Nothing is sold at any stage.",
  },
  {
    id: "inaturalist",
    name: "iNaturalist",
    fields: ["natural_sciences"],
    deadline: "2027-06-30",
    window: "Open all year: photograph something living, free",
    level: "international",
    category: "community",
    tier: "accessible",
    gate: { ageMin: 13 },
    eligibility:
      "Ages 13+ for an account worldwide (the Seek app has no minimum), free",
    url: "https://www.inaturalist.org/",
    blurb:
      "Photograph any wild thing near you and a community of naturalists identifies it. Verified records become real biodiversity data used by scientists.",
    alwaysOpen: true,
    cost: "free",
    costDetail:
      "A joint initiative of the California Academy of Sciences and National Geographic. No paid tier.",
  },
  {
    id: "scistarter",
    name: "SciStarter",
    fields: ["natural_sciences", "medicine_health", "engineering"],
    deadline: "2027-06-30",
    window: "Open all year: browse and join a project, free",
    level: "international",
    category: "community",
    tier: "accessible",
    eligibility:
      "Anyone worldwide. Free; a directory, so each project sets its own rules",
    url: "https://scistarter.org/",
    blurb:
      "A catalog of thousands of real citizen-science projects you can join from anywhere. The fastest way to find one that matches what you are actually curious about.",
    alwaysOpen: true,
    cost: "free",
    costDetail:
      "The directory is free. Individual projects occasionally need a kit you buy, and each project page states that, so check before committing.",
  },
  {
    id: "intaward",
    name: "The Duke of Edinburgh's International Award",
    fields: "all",
    deadline: "2027-06-30",
    window: "Open all year: join through a licensed centre near you",
    level: "international",
    category: "community",
    tier: "accessible",
    gate: { ageMin: 14, ageMax: 24 },
    eligibility:
      "Ages 14-24, in 130+ countries. Through a school, club or other licensed centre",
    url: "https://intaward.org/",
    blurb:
      "A structured, internationally recognised framework: volunteering, a skill, physical activity and an expedition. One of the few things on this list universities in the UK and Commonwealth recognise by name.",
    alwaysOpen: true,
    cost: "varies",
    costDetail:
      "The participation fee is set by each country's National Award Operator and by your centre, so it differs everywhere. Some centres charge nothing. Ask the centre before you commit.",
  },
  {
    id: "interact-rotary",
    name: "Rotary Interact",
    fields: "all",
    deadline: "2027-06-30",
    window: "Open all year: join or start a club at your school",
    level: "international",
    category: "community",
    tier: "accessible",
    gate: { ageMin: 12, ageMax: 18 },
    eligibility:
      "Ages 12-18 worldwide. Clubs are school- or community-based and sponsored by a local Rotary club",
    url: "https://www.rotary.org/en/get-involved/interact-clubs",
    blurb:
      "A service club run by students, sponsored by a local Rotary club. If your school has none, starting one is a real, documented leadership project.",
    alwaysOpen: true,
    cost: "free",
    costDetail:
      "There is no fee to Rotary for Interact membership. Individual clubs sometimes collect small dues for their own projects, so ask the sponsoring club.",
  },
  {
    id: "girls-who-code-clubs",
    name: "Girls Who Code Clubs",
    fields: ["computer_science"],
    deadline: "2027-06-30",
    window: "Open all year: join a club or start one, free",
    level: "international",
    category: "community",
    tier: "accessible",
    eligibility:
      "Girls and non-binary students in grades 3-12. Free; clubs run internationally as well as in the US",
    url: "https://girlswhocode.com/programs/clubs",
    blurb:
      "Free after-school coding clubs with a ready-made curriculum. If there is no club near you, the programme is designed so a student can start one.",
    alwaysOpen: true,
    cost: "free",
    costDetail:
      "The curriculum, the materials and the facilitator training are all provided at no cost.",
  },
  {
    id: "hacktoberfest",
    name: "Hacktoberfest",
    fields: ["computer_science"],
    deadline: "2026-10-31",
    window: "Every October: contribute to open source for a month",
    level: "international",
    category: "community",
    tier: "accessible",
    eligibility:
      "Anyone worldwide with a GitHub or GitLab account. Free; beginner pull requests are the point",
    url: "https://hacktoberfest.com/",
    blurb:
      "A month-long push to get people into open source. Maintainers deliberately label beginner-friendly issues, which makes October the easiest time of year to land a first real contribution.",
    alwaysOpen: false,
    cost: "free",
    costDetail:
      "Free to take part. Rewards have varied between years, so treat the contribution as the point and anything else as a bonus.",
  },
  {
    id: "foldit",
    name: "Foldit",
    fields: ["natural_sciences", "medicine_health"],
    deadline: "2027-06-30",
    window: "Open all year: play the puzzles, free",
    level: "international",
    category: "community",
    tier: "accessible",
    eligibility:
      "Anyone worldwide. Free; no biology background needed to start",
    url: "https://fold.it/",
    blurb:
      "A puzzle game where the puzzles are real protein-folding problems. Players have co-authored papers in Nature by beating the algorithms.",
    alwaysOpen: true,
    cost: "free",
    costDetail:
      "A research project run out of the University of Washington. Nothing is sold.",
  },
  {
    id: "math-stackexchange",
    name: "Mathematics Stack Exchange",
    fields: ["natural_sciences", "computer_science"],
    deadline: "2027-06-30",
    window: "Open all year: ask or answer any time, free",
    level: "international",
    category: "community",
    tier: "accessible",
    eligibility:
      "Anyone worldwide. Free; asking well is a skill the site will teach you quickly",
    url: "https://math.stackexchange.com/",
    blurb:
      "Where a stuck problem gets a real answer, usually within hours. Learning to write a question people want to answer is worth as much as the answer itself.",
    alwaysOpen: true,
    cost: "free",
    costDetail:
      "Free to read, ask and answer. No account is needed to read anything.",
  },
  {
    id: "nasa-citizen-science",
    name: "NASA Citizen Science",
    fields: ["natural_sciences", "engineering"],
    deadline: "2027-06-30",
    window: "Open all year: pick a project and start, free",
    level: "international",
    category: "community",
    tier: "accessible",
    eligibility:
      "Anyone worldwide. Free; most projects need nothing but a browser, and several have named volunteers as co-authors",
    url: "https://science.nasa.gov/citizen-science/",
    blurb:
      "NASA's own list of research projects open to volunteers — hunting exoplanets, tracking clouds, classifying storms. Contributors have been credited on published papers.",
    alwaysOpen: true,
    cost: "free",
    costDetail:
      "Free. Some projects suggest equipment you may already own (a phone camera, a small telescope), and each project page says so up front.",
  },
  {
    id: "wikipedia-community",
    name: "Wikipedia — editing and the community portal",
    fields: "all",
    deadline: "2027-06-30",
    window: "Open all year: make your first edit today, free",
    level: "international",
    category: "community",
    tier: "accessible",
    eligibility:
      "Anyone worldwide. Free, and no account is needed to edit most pages; every language edition has its own community",
    url: "https://en.wikipedia.org/wiki/Wikipedia:Community_portal",
    blurb:
      "Editing teaches the two things school rarely does: finding a source that actually supports a claim, and writing without taking a side. Your edit history is public and permanent.",
    alwaysOpen: true,
    cost: "free",
    costDetail:
      "Free in every direction. The Wikimedia Foundation is a nonprofit, nothing is sold, and there is no paid tier.",
  },
  {
    id: "first-contributions",
    name: "First Contributions — your first open-source pull request",
    fields: ["computer_science"],
    deadline: "2027-06-30",
    window: "Open all year: about twenty minutes, free",
    level: "international",
    category: "community",
    tier: "accessible",
    gate: { ageMin: 13 },
    eligibility:
      "Ages 13+ (GitHub's own minimum) worldwide. Free; written for people who have never used git",
    url: "https://github.com/firstcontributions/first-contributions",
    blurb:
      "A repository whose only purpose is to walk you through making a real pull request, step by step. The point is getting the first one — genuinely intimidating — out of the way.",
    alwaysOpen: true,
    cost: "free",
    costDetail:
      "Free, and a GitHub account is free too. The contribution you make here is a real one that stays on your public profile.",
  },
  {
    id: "codewars",
    name: "Codewars",
    fields: ["computer_science"],
    deadline: "2027-06-30",
    window: "Open all year: solve a kata any time, free",
    level: "international",
    category: "community",
    tier: "accessible",
    eligibility:
      "Anyone worldwide. Free account; 20+ languages, and the problems start genuinely easy",
    url: "https://www.codewars.com/",
    blurb:
      "Small programming problems where, once you solve one, you can read everyone else's solution. Seeing five better answers to something you just solved is the fastest way to improve.",
    alwaysOpen: true,
    cost: "freemium",
    costDetail:
      "The problems, the solutions and the community are free. An optional paid tier adds extra practice features, and you never need it.",
  },
  {
    id: "forage-all",
    name: "Forage — every job simulation",
    fields: "all",
    deadline: "2027-06-30",
    window: "Self-paced: browse by company or by field, free",
    level: "international",
    category: "simulation",
    tier: "accessible",
    eligibility:
      "Open worldwide and free. Each simulation states its own requirements; check the platform's minimum age in its terms",
    url: "https://www.theforage.com/simulations",
    blurb:
      "Do the real tasks of a job for an afternoon: J.P. Morgan for investment banking, BCG for consulting, Lyft for back-end engineering, and a hundred more. The employers built these to recruit, so they are honest about what the work is.",
    alwaysOpen: true,
    cost: "free",
    costDetail:
      "Free across the platform, because employers fund these to recruit. Confirm on the page before you start.",
  },
];
