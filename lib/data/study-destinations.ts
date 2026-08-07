import type { FacultyValue } from "@/lib/data/faculties";

// The deep layer of the guide: full profiles of the destinations students
// actually argue about вЂ” the US, the UK, Hong Kong, Singapore, Germany, Italy,
// the Netherlands, Canada, Korea, the UAE, Switzerland.
//
// The hub cards in world.ts answer "where does this kind of work sit?" in three
// lines. This file answers the question underneath it: what is this place
// actually like to go to, what does it cost, what do they weigh when they read
// your application, what happens after you graduate, and who should NOT go.
//
// Rules, inherited from the rest of the product and enforced by unit tests:
//
//  1. **Never a brochure.** Every profile carries at least as many honest
//     trade-offs as strengths. A destination page that only sells is the thing
//     agencies already do to these students.
//  2. **No prices, no rankings.** Tuition figures and league tables rot within
//     a year and we cannot keep them true; structural facts (how aid works, how
//     the visa ladder works, what admissions weighs) stay true for years. Where
//     money is unavoidable it is described in shape, not in numbers.
//  3. **`notForYou` is mandatory.** Naming who a place is wrong for is the most
//     useful sentence on the page and the one nobody else writes.
//
// POLICY DRIFT вЂ” the one real maintenance risk. Post-study work rules (the UK
// Graduate Route, US OPT/H-1B, the Dutch orientation year, Canadian PGWP) are
// set by politics and change. Everything here is written as "current rule, check
// it" rather than as a promise, and the UI repeats that. Re-verify annually.
// Last hand-checked: 2026-08-06.

export type StudyDestination = {
  id: string;
  /** Country or city-state, as a student would name it. */
  name: string;
  /** Where it is, for someone who doesn't have the map memorised. */
  where: string;
  /** The one-line summary of why anyone considers it. */
  oneLine: string;
  /** What this place gives that the others on the list do not. */
  unique: string;
  /** Strongest fields here. */
  fields: FacultyValue[];
  /** Hub ids in lib/data/world.ts that sit in this destination. */
  hubs: string[];
  /** Real advantages, concrete enough to act on. */
  strengths: string[];
  /** The honest costs of choosing it. At least as many as strengths. */
  tradeoffs: string[];
  /** How paying for it actually works вЂ” shape, not numbers. */
  money: string;
  /** What admissions here actually weighs. */
  admissions: string;
  /** Staying on after you graduate. Policy-dependent, so phrased as of today. */
  afterStudy: string;
  /** Who this fits. */
  suitsYou: string;
  /** Who should look elsewhere вЂ” mandatory, and the most useful line here. */
  notForYou: string;
  /**
   * When things actually happen in a cycle, and what has to be done a year
   * ahead. Timing is the most common way a strong applicant loses a place вЂ”
   * not merit вЂ” and it is the one failure a guide can genuinely prevent.
   */
  applicationCycle: string;
  /** How an application is actually READ here вЂ” what carries weight, and what does not. */
  howTheyRead: string;
  /**
   * What studying there is like once you arrive: teaching style, contact hours,
   * how you are assessed, how much independence is assumed. Students choose
   * countries on admissions and then live inside the teaching culture for years.
   */
  studyingThere: string;
  /** What applicants from this region specifically get wrong about this place. */
  commonMistake: string;
  /** True where Compass already computes admission odds for this destination. */
  modelled: boolean;
  /**
   * The organisation or government that actually sets the rules on this page.
   *
   * The guide claimed to be "checked against the organiser or the government
   * that sets the rule" and then linked to none of them, while the catalog next
   * door has shipped an "Official page ↗" on every row for months. A link is
   * the only way to prove the claim, and it gives a reader a second layer
   * without the page carrying it.
   *
   * Rules: official bodies only — a ministry, a recognition database, a national
   * application portal, a scholarship programme. Never an agency, a ranking
   * site or a blog, because the point is the primary source. Checked with
   * `npm run test:guide-links`.
   */
  sources: { label: string; url: string }[];
};

// The home region leads, and that is the same decision the world map made: for
// a large share of our readers the honest answer is a strong degree at home and
// a funded master's abroad afterwards, and a guide that lists eighteen ways to
// leave and none to stay is not being neutral вЂ” it is recommending.
export const STUDY_DESTINATIONS: StudyDestination[] = [
  {
    id: "kazakhstan",
    name: "Kazakhstan",
    where: "Central Asia вЂ” Almaty, Astana, and the system most readers of this guide are already inside",
    oneLine:
      "The option a guide like this usually refuses to write about: staying, paying a fraction of the cost, and leaving later with a degree already in hand.",
    unique:
      "The only place on this list where you already have the language, the documents, the residence and your family вЂ” so both the money and the risk drop far enough that a second, larger step later can be taken from strength rather than from desperation.",
    fields: [
      "engineering",
      "computer_science",
      "business_economics",
      "natural_sciences",
      "medicine_health",
      "law",
      "humanities_social",
    ],
    hubs: ["almaty", "astana"],
    strengths: [
      "State grants cover tuition in full for a large share of places, awarded on one national examination rather than on essays, activities or the money to prepare for either.",
      "Law, medicine and public administration are national qualifications вЂ” studying them here is not a compromise, it is the shorter route to actually practising here.",
      "Several universities teach in English and run joint or dual degrees with foreign partners, so an international credential does not always require leaving.",
      "The cost of a wrong turn is small: changing direction after a year costs a year, not a family's savings and a visa.",
      "Bolashak funds postgraduate study abroad for citizens, so a strong local degree is a documented route out later rather than a closed door.",
    ],
    tradeoffs: [
      "Research funding and laboratory equipment are thin outside a few institutions, and it shows most in the natural sciences.",
      "The graduate market is concentrated in Almaty and Astana; outside them the ladder is short and the ceiling arrives early.",
      "Teaching in many faculties still rests on memorisation and the final examination, so independent research skills have to be built on your own initiative.",
      "A domestic bachelor's is read cautiously by foreign employers and admissions offices, so the second step usually needs a strong test score or a master's abroad to translate it.",
      "Integrity in admissions and assessment has improved but is not uniform, and the variation between institutions is wider than any published list will tell you.",
      "English-taught programmes range from genuinely international to nominal, and the label alone does not tell you which one you are looking at.",
    ],
    money:
      "The cheapest serious option in this guide by a wide margin: state grants cover tuition for a substantial share of places, university and employer scholarships fill part of the rest, and you live at home or in subsidised accommodation instead of paying Western European rent. The cost that actually bites is not fees but time вЂ” four years on a weak programme is the most expensive thing on this page.",
    admissions:
      "The national testing system decides most of it: one examination after school, scored against subject combinations that map to specific programmes, with the state grant competition run on the same score. Choosing the subject combination is effectively choosing your field, and that choice is made months before the examination itself.",
    afterStudy:
      "You are already a citizen: no permit, no clock, no lottery. The question is not whether you may stay but whether the ladder you are standing on is worth staying on, and that is decided by employer and city rather than by immigration policy.",
    suitsYou:
      "You want to keep your options open without spending your family's savings on a first attempt, or your target profession вЂ” law, medicine, the public service вЂ” is licensed nationally and practised here.",
    notForYou:
      "You want research at the front of a field, or a career in a market that will not read a Kazakhstani degree. In both cases the honest answer is a strong local bachelor's plus a funded master's abroad вЂ” not four years here hoping the degree converts on its own.",
    applicationCycle:
      "The whole year turns on one summer: the national test is taken after school ends, the grant competition is decided on those scores within weeks, and university applications follow immediately. The subject combination for the test is declared months earlier, and that is the decision that actually locks your field вЂ” long before anyone discusses universities. If you are aiming at a local place and a foreign one at the same time, the calendars overlap badly: foreign applications close in the autumn and winter of the same final year, so both have to be prepared in parallel from the spring before.",
    howTheyRead:
      "Numerically, and almost only numerically. The test score against published thresholds decides grants and places, with quotas layered on top; essays, portfolios and interviews barely feature outside creative and a few international programmes. There is no equivalent of the American reading of a person, and that cuts both ways вЂ” a weak year cannot be explained away, but a student with no network and no polished self-presentation is not punished for lacking either.",
    studyingThere:
      "Structured, lecture-led and examination-heavy, with fixed programmes and comparatively little choice of courses inside a degree. Attendance is tracked, a cohort moves through the whole degree together, and the relationship with a supervisor matters more than any course catalogue. Independent research exists where a faculty has active researchers and does not where it has none вЂ” so the individual department, not the university's name, is the thing to investigate before choosing.",
    commonMistake:
      "Treating staying as failure. The students who do best here choose the local degree deliberately, spend the money they did not put into tuition on tests, certificates and English, and leave for a funded master's with a real record behind them. The ones who suffer enrol at home as a fallback, disengage for four years, and arrive at the same decision at twenty-two with nothing added.",
    sources: [
      { label: "Bolashak — the state scholarship for study abroad", url: "https://bolashak.gov.kz/en/" },
      { label: "National Testing Centre — the UNT and the grant competition", url: "https://testcenter.kz/en/" },
    ],
    modelled: false,
  },
  {
    id: "uzbekistan",
    name: "Uzbekistan",
    where: "Central Asia вЂ” Tashkent, and the region's fastest-growing set of foreign branch campuses",
    oneLine:
      "The region's fastest-changing system: foreign universities have opened campuses here, so a British or Korean degree can now be taken without leaving.",
    unique:
      "Branch campuses award the parent university's own degree in Tashkent at a fraction of the cost of going to it, and they have multiplied here faster than anywhere else in the region.",
    fields: [
      "business_economics",
      "computer_science",
      "engineering",
      "medicine_health",
      "humanities_social",
    ],
    hubs: ["tashkent"],
    strengths: [
      "Branch campuses of foreign universities award the parent institution's degree in Tashkent вЂ” the cheapest way anywhere to hold a foreign credential.",
      "The state has funded a rapid expansion of places, and English-taught programmes are now normal rather than exceptional.",
      "Living at home while taking an international programme removes the two largest costs of studying abroad at once.",
      "The technology and services market is growing fast, and the shortage of experienced people means real responsibility arrives early.",
    ],
    tradeoffs: [
      "Quality between branch campuses varies widely, and the parent university's reputation does not automatically travel to its franchise.",
      "Research capacity is limited, so a research career still means leaving at master's level.",
      "Graduate salaries are low, and the gap between them and remote work for foreign clients is large enough to distort career choices.",
      "The institutions are young, so the alumni network вЂ” the thing a degree quietly buys вЂ” barely exists yet.",
      "Regulation changes often, and programme rules can shift between the year you apply and the year you graduate.",
    ],
    money:
      "Tuition at the branch campuses is a fraction of the parent institution's own fees, state grants cover a share of places at national universities, and living at home removes the accommodation cost that dominates every foreign option. The honest risk is buying a name rather than a programme, so the individual campus's staffing and accreditation matter far more than the brand on the certificate.",
    admissions:
      "National testing decides places and grants at state universities. The branch campuses run their own admission вЂ” school results plus an English qualification and often an interview вЂ” which makes them the more forgiving route for a student whose examination score does not match their ability.",
    afterStudy:
      "You are a citizen, so there is no permit question at all. The real decision is between a local employer, remote work for foreign clients that pays several times local rates, and a master's abroad вЂ” and that decision is easier with a foreign-badged degree already in hand.",
    suitsYou:
      "You want a foreign degree without the cost or the visa risk of leaving, or you want to build a record cheaply now and go abroad for the master's instead.",
    notForYou:
      "You want laboratory research, a deep alumni network, or a degree read without questions in Western Europe вЂ” a branch campus certificate still prompts them.",
    applicationCycle:
      "State university admission runs on the summer national test and is settled within weeks of it, so the subject choices made months earlier are the real decision point. The branch campuses keep their own calendars: applications typically open in the spring, English tests and interviews run through early summer, and a second round in August fills what is left вЂ” which makes them a genuine fallback rather than a parallel gamble. If a master's abroad is the plan, the language test belongs in the second year of the bachelor's, not the last.",
    howTheyRead:
      "At the state universities, the test score against published thresholds and nothing else. At the branch campuses, school results and an English qualification carry most of the weight, with the interview used to confirm the language rather than to assess character; portfolios matter only in design. There is no essay culture and no assessment of activities, so the only levers a student can pull are grades and English вЂ” which is at least a clear and honest target.",
    studyingThere:
      "The branch campuses run the parent university's curriculum with local staff and visiting faculty: seminar teaching, continuous assessment and coursework in English, a genuinely different experience from the lecture-and-final-examination pattern at the national universities next door. Class sizes are small because the institutions are new. The weakness is depth of staff вЂ” a strong programme and a thin one can sit inside the same building.",
    commonMistake:
      "Choosing the campus by the name over the door rather than by who teaches inside it. Two branch campuses of equally famous universities can differ enormously in staffing, accreditation and what the degree actually permits afterwards. Ask which body awards the degree, who teaches the final year, and where last year's graduates went вЂ” in writing.",
    sources: [
      { label: "Ministry of Higher Education, Science and Innovation", url: "https://edu.uz/en/" },
    ],
    modelled: false,
  },
  {
    id: "georgia",
    name: "Georgia",
    where: "The Caucasus вЂ” Tbilisi, and a system built around English-taught medicine",
    oneLine:
      "The most accessible route in this region into an English-taught medical degree, at a cost no European medical school comes close to.",
    unique:
      "Medicine taught entirely in English, admitting on school results rather than on a national examination no foreigner can sit, and priced far below any European or American equivalent.",
    fields: [
      "medicine_health",
      "business_economics",
      "computer_science",
      "humanities_social",
    ],
    hubs: ["tbilisi"],
    strengths: [
      "English-taught medicine admits on school results and an English certificate, with no national entrance examination for international applicants.",
      "Entry and residence are unusually simple for citizens of this region, and the cost of living is among the lowest here.",
      "Tuition for a full degree can total less than a single year in Western Europe.",
      "The country is small enough that a student network reaches real employers quickly, and the technology and outsourcing scene is growing.",
    ],
    tradeoffs: [
      "A medical degree is only the first step: practising anywhere else means passing that country's own licensing examinations, and the pass rate depends on how hard you worked, not on the certificate.",
      "Quality between medical schools varies sharply, and the agencies that recruit for them push the weakest hardest.",
      "Clinical exposure can be thin, and it is the part of a medical education that cannot be made up afterwards.",
      "Outside medicine and technology the graduate market is small and salaries are low.",
      "Georgian is needed for daily life and for patient contact, and it is unrelated to any language you are likely to already have.",
    ],
    money:
      "Tuition for English-taught medicine sits far below any European or American equivalent and living costs are low, which is the entire proposition; there are no meaningful need-based scholarships, so a family pays, but the total for a whole degree can come to less than one year elsewhere. Budget for the licensing examinations afterwards вЂ” they are the real second cost and students routinely forget them.",
    admissions:
      "School results and an English qualification, with an interview at some institutions. There is no national entrance examination for international applicants and no essay culture, which is exactly what makes it reachable for a student whose record is solid but unpolished.",
    afterStudy:
      "A residence permit tied to study and a straightforward route to staying while you work вЂ” but after a medical degree the real question is where you sit your licensing examinations, because that decides where you can practise, not where you studied.",
    suitsYou:
      "You want to study medicine in English at a cost your family can carry, and you are prepared to sit the licensing examinations of the country you eventually want to practise in.",
    notForYou:
      "You want a research career, a strong domestic market outside medicine, or a degree that opens doors on its name вЂ” this one opens them on what you do with it afterwards.",
    applicationCycle:
      "Simpler and later than anywhere else here: most English-taught programmes accept applications through the spring and summer, with intakes in September and often a second in February, and decisions arriving in weeks rather than months. That makes Georgia a genuine fallback for a student whose first plan collapses in the spring. It also removes the deadline discipline that protects you elsewhere, so the risk moves from missing a date to choosing badly in a hurry.",
    howTheyRead:
      "School results carry most of the weight, an English certificate confirms you can follow the teaching, and an interview is used at some institutions to check both. Activities, essays and letters are not assessed, and there is no national examination for international applicants. The process is transparent and filters much less than others do вЂ” which means the burden of judging whether a programme is any good falls on you rather than on an admissions office.",
    studyingThere:
      "Lecture-heavy in the early years with assessment concentrated in examinations, moving into hospital placements later; the quality of those placements is the single largest difference between institutions and the thing to ask about before enrolling. Cohorts are heavily international, so your classmates are mostly other foreigners rather than Georgians, and the social experience reflects that. Independent study is expected but not always structured for you.",
    commonMistake:
      "Choosing through an agency that is paid by the university it recommends. The differences between medical schools here are large and invisible from a brochure вЂ” clinical hours, licensing pass rates, where graduates actually ended up вЂ” and those three questions, asked directly and in writing, are worth more than every ranking or promise an agent will show you.",
    sources: [
      { label: "Ministry of Education and Science of Georgia", url: "https://mes.gov.ge/?lang=eng" },
      { label: "National Center for Educational Quality Enhancement", url: "https://eqe.ge/en" },
    ],
    modelled: false,
  },
  {
    id: "united-states",
    name: "United States",
    where: "North America вЂ” Boston, New York, the Bay Area and 50 states of variation",
    oneLine:
      "The deepest research funding and the widest aid on earth, wrapped in the highest sticker price and the least predictable visa.",
    unique:
      "A handful of universities here meet the FULL demonstrated financial need of international students вЂ” the only place in the world where a student from a low-income family in Central Asia can attend a top university for close to nothing. It coexists with the most expensive higher education on the planet.",
    fields: [
      "computer_science",
      "engineering",
      "natural_sciences",
      "medicine_health",
      "business_economics",
      "humanities_social",
    ],
    hubs: ["boston", "bay-area", "new-york", "seattle"],
    strengths: [
      "Holistic admissions: your essays, your activities and who you are count, not only exam scores вЂ” the one system where a strong record outside class can outweigh a mediocre one inside it.",
      "You apply undecided and choose a major later; switching from biology to computer science in second year is normal, not a restart.",
      "Undergraduate research is real here вЂ” you can be in a lab as a first-year, which is rare almost everywhere else.",
      "The largest concentration of well-funded universities, and PhD study is normally a paid position rather than a fee.",
      "Campus life is a full ecosystem: clubs, societies, sport, career fairs and alumni networks that keep working for decades.",
    ],
    tradeoffs: [
      "Sticker prices are the highest anywhere, and most universities are need-AWARE for internationals: asking for aid can lower your chance of admission.",
      "The work visa after graduation is a lottery вЂ” H-1B is drawn by chance, so staying long-term is genuinely uncertain no matter how good you are.",
      "Healthcare is not free and student insurance is a real annual cost most European destinations don't have.",
      "At the famous names even a flawless record loses far more often than it wins — build the list so that losing there costs you nothing, because most applicants do.",
      "Guns, distances and car dependence are daily realities outside the big coastal cities, and they surprise people.",
      "The application itself costs money: tests, score reports and per-university fees add up before anyone has accepted you.",
    ],
    money:
      "Two completely different games. At the aid-rich private universities, family income drives the price and it can end near zero; at public universities and most private ones, internationals pay close to full and aid is thin. Never judge a US university by its published price until you have read its own aid policy for international students.",
    admissions:
      "Grades and rigour first, then tests where required, then the parts nobody else asks for: essays in your own voice, a handful of activities with real depth, and teacher letters. Compass models this pathway вЂ” the factor scores and per-school ranges you see in the report are built for it.",
    afterStudy:
      "F-1 study, then OPT: 12 months of work authorisation, extended by 24 more for STEM degrees. After that an employer must sponsor you into the H-1B lottery. Since September 2025 a new H-1B petition for someone OUTSIDE the country carries a six-figure government fee; a graduate already here who changes status from F-1 is exempt from it, but it has made employers warier of sponsoring at all, and it is being litigated. Checked August 2026 — the most politically volatile rule in this guide.",
    suitsYou:
      "You have a strong record beyond exams, you want to keep your options open for two more years, and either your family income is low enough for real aid or high enough to absorb the cost.",
    notForYou:
      "You need certainty. If a predictable path from degree to work permit to residence matters more than prestige, Canada, Germany or the Netherlands will treat you better.",
    applicationCycle:
      "The longest lead time of any country here. Tests and the first drafts of essays belong in the spring and summer before you apply; applications close in the autumn and winter of your final school year, with early rounds in early November and regular rounds in early January. Aid documents have their own, earlier deadlines, and missing them can cost you the aid rather than the place. Decisions arrive in March and you commit by early May.",
    howTheyRead:
      "Holistically, and the word is meant literally: grades and rigour first, then tests where required, then essays, activities and teacher letters read as evidence of a person. Depth beats breadth вЂ” two activities pursued for years say more than ten joined once. Essays are read for voice and self-awareness rather than achievement, and they are the one part nobody else can write for you.",
    studyingThere:
      "Broad first, narrow later: you take courses outside your subject for a year or two and declare a major afterwards, which is why changing direction is normal rather than a restart. Assessment is continuous вЂ” problem sets, papers, midterms вЂ” so the workload is steady rather than concentrated in finals. Class participation is graded in many courses, which surprises students from systems where listening is the norm.",
    commonMistake:
      "Building a list of famous names and assuming that asking for aid is neutral. Most US universities are need-AWARE for internationals, so requesting aid can affect the decision вЂ” which makes the small group of need-blind, full-need universities a completely different category. A list with no genuinely likely options in it is how strong applicants end up with nothing.",
    sources: [
      { label: "Common Application — the shared application portal", url: "https://www.commonapp.org/" },
      { label: "USCIS — Optional Practical Training (OPT)", url: "https://www.uscis.gov/working-in-the-united-states/students-and-exchange-visitors/optional-practical-training-opt-for-f-1-students" },
      { label: "EducationUSA — the State Department's advising network", url: "https://educationusa.state.gov/" },
    ],
    modelled: true,
  },
  {
    id: "united-kingdom",
    name: "United Kingdom",
    where: "Europe вЂ” London, and strong universities spread across the country",
    oneLine:
      "The fastest route to a respected degree: three focused years, one subject, decided almost entirely on academics.",
    unique:
      "You specialise from day one and finish a bachelor's in three years вЂ” a year of tuition and a year of living costs cheaper than most of the world, and a year earlier into work.",
    fields: [
      "law",
      "business_economics",
      "humanities_social",
      "arts_design",
      "computer_science",
      "medicine_health",
    ],
    hubs: ["london", "manchester"],
    strengths: [
      "Three-year bachelor's degrees (four in Scotland) вЂ” less total cost, and you start earning sooner.",
      "One application through UCAS covers five universities: far less admin and fewer fees than applying across the US.",
      "Admissions are transparent: published grade requirements you can aim at, rather than a black box.",
      "English-language degrees recognised everywhere, and the largest legal and financial centre in Europe attached to them.",
      "Strong art, design, drama and music schools with genuinely international intakes.",
    ],
    tradeoffs: [
      "You choose your subject at application and changing later usually means starting again вЂ” the opposite of the American flexibility.",
      "Undergraduate scholarships for internationals are scarce; the money is at master's level (Chevening and university awards).",
      "London costs are brutal, and student housing is the single biggest shock in most budgets.",
      "Post-study work rules have changed repeatedly in the last decade and can change again before you graduate.",
      "Contact hours are low by Central Asian standards вЂ” a humanities student may have a handful of taught hours a week and is expected to run their own reading.",
      "Medicine and veterinary places for internationals are extremely limited and quota-capped.",
    ],
    money:
      "Tuition for internationals is high and rises by subject (lab and clinical courses cost far more). Undergraduate aid is limited, so most families are self-funding; the honest cheaper comparison for the same language of instruction is the Netherlands or Ireland.",
    admissions:
      "Almost purely academic: predicted and achieved grades against a published offer, plus a personal statement about the subject itself вЂ” not about your personality. Some courses add an admissions test or an interview.",
    afterStudy:
      "The Graduate Route lets you stay and work without a job offer, but the length depends on WHEN you apply rather than on when you started. Applications made from 1 January 2027 are granted 18 months instead of two years; a PhD still carries three. If you are at school now, 18 months is your number. Checked against UKCISA in August 2026, and this rule has been narrowed before.",
    suitsYou:
      "You already know your subject, your grades are strong and predictable, and you want the shortest respectable path from school to a degree to a job.",
    notForYou:
      "You're undecided between fields, or you need a scholarship to make it possible at undergraduate level. Both are better served elsewhere.",
    applicationCycle:
      "One UCAS application covering up to five courses, submitted in the autumn вЂ” with an earlier deadline in mid-October for medicine, veterinary science, dentistry, and for Oxford and Cambridge. Admissions tests and interviews for the most selective courses fall between then and Christmas. Offers are usually conditional on final exam results, which arrive in the summer and decide whether the place holds.",
    howTheyRead:
      "Academically, and narrowly on purpose. You apply to a SUBJECT rather than to a university, so the personal statement should be almost entirely about why that subject вЂ” reading you have done, ideas you have chased. Predicted grades and the reference carry real weight. Extracurricular breadth matters far less than in the US, and padding the statement with unrelated activities actively weakens it.",
    studyingThere:
      "Specialised from the first week and finished in three years. Contact hours are low and independence is assumed вЂ” the reading list is the course, and nobody chases you through it. Assessment often concentrates into final examinations or a dissertation, which rewards students who can pace themselves over months without weekly deadlines forcing it.",
    commonMistake:
      "Treating the personal statement like a US essay about personal growth. It is an academic argument for your fitness for one subject, and admissions tutors say so explicitly. The second mistake is choosing five wildly different courses вЂ” the same statement goes to all of them.",
    sources: [
      { label: "UCAS — the single undergraduate application portal", url: "https://www.ucas.com/" },
      { label: "GOV.UK — the Graduate visa rule in full", url: "https://www.gov.uk/graduate-visa" },
    ],
    modelled: false,
  },
  {
    id: "hong-kong",
    name: "Hong Kong",
    where: "Asia вЂ” a city-state on China's south coast",
    oneLine:
      "English-taught, globally ranked universities inside Asia's financial capital, with scholarships that actually reach international students.",
    unique:
      "The rare place where the teaching language is English, the location is Asia, and named scholarships for non-local students are a normal part of admission rather than a rumour.",
    fields: [
      "business_economics",
      "computer_science",
      "engineering",
      "law",
      "medicine_health",
      "natural_sciences",
    ],
    hubs: ["hong-kong"],
    strengths: [
      "Degrees taught in English at universities that sit among Asia's strongest, with four-year bachelor's structures closer to the US than the UK.",
      "Entrance scholarships for international students are published and substantial вЂ” some cover tuition entirely.",
      "A genuine finance, logistics and legal centre: internships in the city are real, not simulated.",
      "Compact and extremely well connected вЂ” no car, fast transport, and the rest of Asia within a short flight.",
      "A springboard into mainland China without needing Mandarin from day one.",
    ],
    tradeoffs: [
      "Housing is among the most expensive and smallest in the world; university dorms are limited and not guaranteed for all years.",
      "The political environment has shifted since 2020 вЂ” some multinationals moved regional offices to Singapore, and academic freedom is a live debate.",
      "Cantonese runs daily life outside campus, which limits part-time work and slows integration.",
      "Places for non-local students are capped by policy, so competition for international seats is fiercer than the headline admit rates suggest.",
      "Summers are hot and humid to a degree people underestimate, and typhoon season is a normal disruption.",
    ],
    money:
      "Tuition for non-locals is well below the US and UK, and the scholarship layer can take it lower still. Living costs вЂ” housing above all вЂ” are the real expense, and they are high.",
    admissions:
      "Grades-first: your curriculum results, English proficiency and, where required, subject tests. Achievements and competitions matter more than personal essays. Compass models Hong Kong admissions, including which programmes weigh what.",
    afterStudy:
      "The IANG arrangement currently lets non-local graduates stay to work without a job offer in hand вЂ” one of the more generous post-study rules in Asia. Verify the current term before relying on it.",
    suitsYou:
      "You want an English-taught degree in Asia, your academic record is strong, and a scholarship is what makes the difference between going and not going.",
    notForYou:
      "You want space, quiet or cheap housing вЂ” or you want a political environment that is settled and predictable for the next decade.",
    applicationCycle:
      "Applications for international students generally run through the autumn and winter for entry the following September, with the strongest scholarship consideration going to those who apply in the earlier rounds. Scholarship interviews follow. Verify each university's own dates directly вЂ” they differ from one another and move between cycles.",
    howTheyRead:
      "Grades first, and openly so: examination results and test scores carry decisive weight, and the process is far more transparent and less holistic than the American one. Essays and interviews matter chiefly for scholarship decisions rather than for admission itself. If your record is strong on paper, the odds here are more predictable than almost anywhere else on this list.",
    studyingThere:
      "English-medium teaching in a system that combines British structure with Asian intensity. Expect large first-year cohorts, continuous assessment alongside heavy finals, and classmates who are academically formidable. Campuses are compact and residential life is a real part of the experience, which helps enormously when you arrive alone.",
    commonMistake:
      "Assuming that because the universities teach in English, daily life runs in it too. Cantonese shapes everything outside campus, and students who never learn any of it describe living beside the city rather than in it.",
    sources: [
      { label: "Study in Hong Kong — Education Bureau", url: "https://www.studyinhongkong.edu.hk/" },
    ],
    modelled: true,
  },
  {
    id: "singapore",
    name: "Singapore",
    where: "Southeast Asia вЂ” a city-state at the tip of the Malay Peninsula",
    oneLine:
      "Asia's most orderly place to study: English-speaking, safe, research-heavy вЂ” and it expects something back.",
    unique:
      "Scholarships here often come with a bond: the state or university funds you and you work in Singapore for a set number of years afterwards. That is a real job pipeline, and a real obligation, and it exists almost nowhere else.",
    fields: [
      "business_economics",
      "computer_science",
      "engineering",
      "natural_sciences",
      "medicine_health",
    ],
    hubs: ["singapore"],
    strengths: [
      "Everything runs in English, and the universities are research-funded at a level that shows in labs and facilities.",
      "Deliberately built biotech, fintech and logistics clusters вЂ” internships connect to actual industry, not to a campus office.",
      "Among the safest cities anywhere, with public transport that removes the need for a car.",
      "Regional hub: most of Asia is a short flight away, which matters for internships and conferences.",
      "Graduate employment rates are published and taken seriously by the universities themselves.",
    ],
    tradeoffs: [
      "Bonded scholarships tie you to the country for years after graduation вЂ” leaving early means repaying, with penalties.",
      "Cost of living is high, and permanent housing is effectively closed to non-residents.",
      "The academic culture is intense and grade-driven; it suits some students and grinds down others.",
      "Social and legal rules are stricter than most students expect, and enforcement is consistent.",
      "The domestic market is small: after the bond, many careers require moving again anyway.",
    ],
    money:
      "Tuition sits between Europe and the US, with substantial subsidies available вЂ” usually attached to a bond. Read the bond terms before the brochure: that clause is the actual price.",
    admissions:
      "Strictly academic, with high published thresholds and, for some programmes, interviews or aptitude tests. Consistent excellence over years matters more than a single spike.",
    afterStudy:
      "Employment passes are tied to salary thresholds and employer sponsorship; bonded graduates have a job route built in. Long-term residence is possible but selective.",
    suitsYou:
      "You want Asia, in English, with a clear route into a job вЂ” and you are willing to trade a few post-graduation years for someone else paying for the degree.",
    notForYou:
      "You want to keep every option open after graduating. A bond is a commitment made at 18 that binds you at 22.",
    applicationCycle:
      "Applications open in the autumn and close in late winter or early spring for an August start, with scholarship applications submitted alongside or immediately after. Admission and scholarship decisions arrive in the spring, and the bond terms attached to funding come with them вЂ” read those before you accept, not after.",
    howTheyRead:
      "Academic results dominate, with a clear preference for demonstrated strength in the subject you are applying to. Interviews are used for scholarships and for the more selective programmes. The process is efficient and evidence-driven; there is little room for a compelling story to compensate for weaker grades.",
    studyingThere:
      "Rigorous and fast-paced, with continuous assessment and a great deal of group work, all in English. Universities are well resourced and campuses are self-contained. The academic pressure is genuinely high and is discussed openly by students there.",
    commonMistake:
      "Signing a bonded scholarship without understanding what the bond means. It commits you to working in Singapore for a set number of years afterwards, which is a reasonable trade only if you have thought about where you actually want to be at twenty-five.",
    sources: [
      { label: "Ministry of Education, Singapore", url: "https://www.moe.gov.sg/" },
    ],
    modelled: false,
  },
  {
    id: "germany",
    name: "Germany",
    where: "Central Europe вЂ” Berlin, Munich, and a dense network of public universities",
    oneLine:
      "The cheapest serious degree in the developed world: public universities charge no tuition, including for international students.",
    unique:
      "No tuition at public universities вЂ” only a semester contribution of a few hundred euros that usually includes a regional transport pass. Nowhere else offers that at this scale and quality.",
    fields: [
      "engineering",
      "computer_science",
      "natural_sciences",
      "business_economics",
      "arts_design",
    ],
    hubs: ["berlin", "munich"],
    strengths: [
      "No tuition fees at public universities, for internationals too вЂ” the single biggest cost difference on this whole list.",
      "Engineering and applied sciences are the national strength, tied directly to industry through mandatory internships and dual programmes.",
      "An 18-month residence permit to look for work after graduating, and a clear path from there to permanent residence.",
      "A large English-taught master's offering, and a growing set of English bachelor's programmes.",
      "Strong worker protections and a real separation between work and life once you are employed.",
    ],
    tradeoffs: [
      "German is needed for most bachelor's degrees, for daily life, and for most jobs outside tech вЂ” B2 is a realistic requirement, not a nice-to-have.",
      "A Central Asian school certificate does not usually give direct access on its own: the routes past that are a Studienkolleg foundation year with its assessment examination, or one to two completed years at a university at home.",
      "Bureaucracy is heavy, slow and paper-based, and it is conducted in German.",
      "A blocked account with a year of living costs must be funded before the visa is issued вЂ” the money barrier moved, it did not disappear.",
      "Student housing is scarce in every big city; arriving without a room secured is a genuine crisis, not an inconvenience.",
      "Universities are impersonal by design: little hand-holding, large lectures, and you are expected to organise yourself.",
    ],
    money:
      "Tuition is essentially free; the real costs are living expenses and the blocked account that proves you can cover them. Over a full degree it is the cheapest quality option in Western Europe by a wide margin.",
    admissions:
      "Certificate-based and rule-driven, not holistic: your school qualification is checked against a recognition table, and admission follows grades and, for popular subjects, a numerus clausus. Essays and activities carry almost no weight.",
    afterStudy:
      "An 18-month permit to seek qualified work after graduation, then an EU Blue Card path and permanent residence after a few years of employment. One of the most predictable ladders in Europe.",
    suitsYou:
      "You are ready to learn German, you want engineering or the sciences, and the cost of the degree is the thing standing between you and studying abroad.",
    notForYou:
      "You want to be taught in English at bachelor's level, or you need a warm, guided, small-campus environment. Neither is what this system does.",
    applicationCycle:
      "Two intakes, winter and summer, with the winter one dominant — applications for it usually fall around mid-July and go through uni-assist for many international applicants, which adds weeks of processing you have to plan for. Before any of that comes the recognition question, and it is the one to settle first because it changes the whole timeline. anabin, the state recognition database, lists what each country's school certificate is worth in Germany, and for Central Asian certificates the usual answer is that it does not give direct access on its own. There are two ways past that and they cost different amounts of time: a Studienkolleg foundation year ending in the Feststellungsprüfung — where the stream you enter, technical or medical or economics, decides which degrees you may then apply for, so it is a choice of field and not a formality — or one to two completed years at a university at home in a related subject, which is often accepted as direct access and which students overlook entirely. Check your own certificate before you choose a university, not after. The blocked account for the visa also takes weeks to open.",
    howTheyRead:
      "By the numbers, and refreshingly transparently. Your school grades, subject match and language certificate decide it; many courses admit anyone meeting the published threshold, and selective ones apply a numerical cut-off. There is no essay to agonise over and no interview for most programmes вЂ” so the preparation that matters is documents and German, not self-presentation.",
    studyingThere:
      "Independent to a degree that surprises people: few contact hours, little chasing, and often a single examination at the end of the semester deciding the grade. Dropout rates reflect that вЂ” the freedom is real and so is the requirement to organise yourself. Universities of applied sciences are more structured and more practical, and are often the better fit for students who want employment rather than research.",
    commonMistake:
      "Underestimating German because the master's programmes are in English. Bachelor's teaching is mostly in German, the authorities operate in German, and the job market outside tech expects it вЂ” students who postpone the language usually find their options narrowing exactly when they graduate.",
    sources: [
      { label: "anabin — the official database that says what your school certificate is worth", url: "https://anabin.kmk.org/anabin.html" },
      { label: "uni-assist — where most international applications are filed", url: "https://www.uni-assist.de/en/" },
    ],
    modelled: false,
  },
  {
    id: "italy",
    name: "Italy",
    where: "Southern Europe вЂ” Milan, Turin, Bologna, Rome and dozens of ancient universities",
    oneLine:
      "The cheapest realistic route into Western Europe for a family without money вЂ” tuition scales to income, and regional scholarships pay you to study.",
    unique:
      "Fees are calculated from family income (the ISEE assessment), and DSU regional scholarships cover tuition, a living grant, housing and meals for students below an income threshold вЂ” a package that exists nowhere else in Europe at this scale.",
    fields: [
      "arts_design",
      "engineering",
      "business_economics",
      "medicine_health",
      "humanities_social",
    ],
    hubs: ["milan", "rome"],
    strengths: [
      "Income-scaled tuition plus DSU scholarships: for a modest-income family this can be the cheapest option on the entire list, cheaper than staying home.",
      "Medicine taught in English, entered through the IMAT exam вЂ” one of the few honest routes into European medicine for an international student.",
      "Design, architecture and fashion at Politecnico and the Milan schools, sitting inside the industry itself.",
      "EU degree, EU mobility afterwards, and a 12-month post-study residence permit to find work.",
      "Cost of living outside Milan is genuinely low by Western European standards.",
    ],
    tradeoffs: [
      "Italian is essential for daily life and for most jobs; English-taught degrees do not change that once you step off campus.",
      "Bureaucracy is slow and document-heavy вЂ” the permesso di soggiorno process is a rite of passage, not an anecdote.",
      "Graduate salaries and the domestic job market are weak compared to Germany or the Netherlands; many graduates leave to work.",
      "DSU scholarships are administered per region with different rules, deadlines and reliability вЂ” the paperwork is the actual hurdle.",
      "University structures are old-fashioned: large lectures, oral exams, little pastoral support.",
      "Housing in Milan is expensive and competitive, closer to a northern European capital than to the rest of Italy.",
    ],
    money:
      "Tuition depends on assessed family income, and can fall to nothing. Add a DSU grant and the state effectively pays you to study. The catch is entirely in the paperwork: certified, translated income documents, on time, per region.",
    admissions:
      "Programme-specific: TOLC entrance tests for many degrees, IMAT for English-taught medicine, portfolio for design. Grades matter, personal essays barely exist. Compass evaluates Italian programmes deterministically, including the DSU and financial-fit picture.",
    afterStudy:
      "A 12-month permit to look for work after graduating, and EU-wide mobility with the degree. Working in Italy itself is the harder half вЂ” the language and the market both bite.",
    suitsYou:
      "Money is the binding constraint, you are willing to learn Italian, and you want design, architecture, engineering or medicine.",
    notForYou:
      "You need high graduate earnings immediately, or you cannot handle administrative uncertainty. Both will make you miserable here.",
    applicationCycle:
      "The DSU scholarship application is the one with the unforgiving deadline, and it is usually separate from and earlier than the university's own вЂ” typically in the summer, months before term. It requires certified documents about your family's income, legalised and translated, which takes weeks to assemble from abroad. Selective programmes such as Politecnico's design courses run their own admission tests earlier in the year.",
    howTheyRead:
      "Academic record and, for selective programmes, an entrance test or portfolio. The distinctive part is not admission but the parallel financial assessment: fees at public universities scale to your family's assessed income, and the DSU grant is awarded on that basis with a merit condition to keep it. Two processes, two deadlines, and the money one is the one people miss.",
    studyingThere:
      "Traditional and examination-centred, with oral examinations still common вЂ” you sit in front of a professor and defend your understanding aloud, which is unfamiliar and genuinely hard the first time. Attendance rules vary and independence is assumed. The design and architecture studios at Politecnico are the exception: intense, studio-based and project-led.",
    commonMistake:
      "Missing the DSU deadline, or arriving with documents that were never legalised properly. Almost every student who loses this opportunity loses it on paperwork rather than on grades вЂ” start the document chain the moment you decide Italy is on your list.",
    sources: [
      { label: "Universitaly — the official application portal", url: "https://www.universitaly.it/" },
      { label: "Studiare in Italia — the ministry's portal for foreign students", url: "https://www.studiare-in-italia.it/studentistranieri/" },
    ],
    modelled: true,
  },
  {
    id: "netherlands",
    name: "Netherlands",
    where: "Northwestern Europe вЂ” Amsterdam, Delft, Eindhoven, Rotterdam",
    oneLine:
      "The easiest English-speaking landing in continental Europe: hundreds of English bachelor's degrees and a country that already runs in English.",
    unique:
      "The largest offering of English-taught BACHELOR'S degrees in continental Europe, in a country where you can live, work and deal with officials in English from day one.",
    fields: [
      "engineering",
      "computer_science",
      "business_economics",
      "natural_sciences",
      "arts_design",
      "law",
    ],
    hubs: ["eindhoven", "amsterdam"],
    strengths: [
      "English-taught bachelor's degrees are normal here, not a rare exception, and Dutch society operates in English alongside Dutch.",
      "International and European law taught in English is a Dutch speciality вЂ” one of the few places a school-leaver can enter law abroad without first learning the local language.",
      "Problem-based, project-heavy teaching with small groups вЂ” closer to work than to lecture halls.",
      "The Eindhoven region is the centre of Europe's semiconductor and precision-engineering industry, with paid internships attached.",
      "An 'orientation year' permit lets graduates stay and look for work with full labour-market access.",
      "Flat, cycling-first cities with an unusually high quality of daily life for students.",
    ],
    tradeoffs: [
      "The student housing shortage is severe and openly acknowledged вЂ” some universities warn applicants not to come without a room.",
      "Non-EU tuition is real money: far below the US and UK, but nothing like Germany's free public universities.",
      "Popular programmes use numerus fixus selection with early deadlines вЂ” miss January and you wait a year.",
      "Political pressure to reduce English-taught programmes is ongoing; the offering may narrow.",
      "Dutch directness reads as rudeness to many newcomers, and integrating socially takes longer than expected.",
      "A law degree is tied to the jurisdiction that granted it: an international-law degree from here does NOT let you practise back home without requalifying, and that surprises people years too late.",
    ],
    money:
      "Tuition for non-EU students is mid-range for Europe and predictable. Housing is the volatile part of the budget, and in Amsterdam it can exceed tuition.",
    admissions:
      "Rule-based and transparent: subject prerequisites, grades, English proficiency, and for selective programmes a motivation letter and a small assessment. Deadlines are strict and early.",
    afterStudy:
      "The orientation year gives graduates twelve months to find work with unrestricted access, and the highly-skilled migrant route afterwards is employer-driven and fast by European standards.",
    suitsYou:
      "You want Europe in English, you are organised enough to hit early deadlines, and engineering, tech or business is your direction.",
    notForYou:
      "You cannot arrange housing early or absorb its cost, or you need a low-tuition option вЂ” Germany does that better.",
    applicationCycle:
      "Applications run through Studielink, with a hard national deadline in the spring for most programmes and a much earlier January deadline for selective ones. Capped programmes вЂ” including many popular English-taught ones вЂ” run their own selection round with additional tests or assignments. Housing should be arranged the day you are admitted, not after.",
    howTheyRead:
      "Transparently and criteria-led: published entry requirements, subject prerequisites, and for capped programmes a selection procedure whose weighting is usually stated in advance. Motivation letters matter for selective courses. There is little space for holistic compensation, which is good news if your record is solid and bad news if you hoped to be read generously.",
    studyingThere:
      "Small-group, project-based and interactive; Dutch teaching culture expects you to speak, disagree and work in teams from the start, and grades often depend substantially on group work. Feedback is direct to the point of bluntness. Contact hours are moderate and self-study is assumed, but you are far less alone in it than in the German system.",
    commonMistake:
      "Treating housing as a detail. The shortage is severe enough that universities warn applicants explicitly, and students have arrived to find nothing available вЂ” this is the single most common way a Dutch plan goes wrong.",
    sources: [
      { label: "Studielink — the national application system", url: "https://www.studielink.nl/" },
      { label: "Nuffic — official information for international students", url: "https://www.nuffic.nl/en" },
    ],
    modelled: false,
  },
  {
    id: "canada",
    name: "Canada",
    where: "North America вЂ” Toronto, Waterloo, Vancouver, Montreal",
    oneLine:
      "North America with a visible path to staying: study, then work, then permanent residence, on published rules.",
    unique:
      "The most predictable immigration ladder among the big destinations: a post-graduation work permit is granted on completing an eligible programme, not won in a lottery.",
    fields: [
      "computer_science",
      "engineering",
      "business_economics",
      "medicine_health",
      "natural_sciences",
    ],
    hubs: ["toronto", "vancouver", "montreal"],
    strengths: [
      "The post-graduation work permit follows automatically from an eligible degree вЂ” no employer sponsorship, no lottery.",
      "Co-op programmes (Waterloo above all) alternate study with paid work terms, so you graduate with real experience and savings.",
      "Public healthcare coverage for students in most provinces, which removes a cost the US imposes.",
      "Genuinely multicultural cities with established Central Asian and post-Soviet communities.",
      "US-adjacent tech and finance industries with none of the visa roulette.",
    ],
    tradeoffs: [
      "International tuition is high вЂ” several times what domestic students pay, and rising.",
      "Immigration targets and study-permit caps have tightened recently; the ladder is predictable but the rungs move.",
      "Housing costs in Toronto and Vancouver are among the worst in the developed world.",
      "Winters are long and dark, and this ends more student experiences than anyone admits.",
      "Outside a few universities, research funding is thinner than in the US.",
    ],
    money:
      "Tuition is well below the US private sticker but well above Europe, with modest scholarships. Co-op earnings are a real, plannable part of the budget rather than pocket money.",
    admissions:
      "Grades-driven with published cut-offs, plus supplementary applications for competitive programmes like Waterloo's engineering and computer science. Less essay-heavy than the US.",
    afterStudy:
      "A post-graduation work permit of up to three years, then Express Entry, where a Canadian degree and Canadian work experience both score points toward permanent residence.",
    suitsYou:
      "You intend to build a life abroad, not just get a degree, and you want the rules written down in advance.",
    notForYou:
      "You want the cheapest degree, or the highest research prestige. Germany wins the first, the US the second.",
    applicationCycle:
      "Applications run through the autumn and winter for a September start, with deadlines varying by province and university вЂ” Ontario runs a central system, others do not. Study permit processing after an offer takes weeks to months and is the step most often underestimated; apply for it the moment you accept. Scholarship deadlines are frequently earlier than admission deadlines.",
    howTheyRead:
      "Primarily on grades and subject prerequisites, with some universities adding supplementary applications or essays for competitive programmes. More predictable than the US and less purely numerical than Germany. English test scores are firm requirements rather than guidelines.",
    studyingThere:
      "North American in structure вЂ” broad first year, continuous assessment, participation counted вЂ” with a strong culture of co-op programmes that alternate study terms with paid work terms. Those work terms are the real asset: they build local experience, which is precisely what the immigration route later rewards.",
    commonMistake:
      "Assuming the immigration ladder is automatic. The post-graduation work permit depends on the type and length of the programme you studied вЂ” some colleges and short courses do not qualify вЂ” so check that the specific programme leads where you think it does before enrolling.",
    sources: [
      { label: "Government of Canada — study permits", url: "https://www.canada.ca/en/immigration-refugees-citizenship/services/study-canada.html" },
      { label: "EduCanada — official programme and scholarship search", url: "https://www.educanada.ca/" },
    ],
    modelled: false,
  },
  {
    id: "south-korea",
    name: "South Korea",
    where: "East Asia вЂ” Seoul and the industrial belt around it",
    oneLine:
      "A full government scholarship that pays for a language year, tuition and living costs вЂ” aimed squarely at students from countries like ours.",
    unique:
      "The Global Korea Scholarship covers a Korean-language year, full tuition, a monthly stipend, flights and insurance. Complete funding of this kind, open to Central Asian applicants, is close to unique.",
    fields: [
      "engineering",
      "computer_science",
      "arts_design",
      "business_economics",
      "natural_sciences",
    ],
    hubs: ["seoul", "daejeon"],
    strengths: [
      "GKS is a genuinely complete package, including the language year that makes the rest possible.",
      "Electronics, automotive, battery and shipbuilding R&D at world scale, with universities plugged into it.",
      "Games, animation and entertainment industries that export globally and hire from local schools.",
      "Fast, cheap public transport, near-universal connectivity, and low street crime.",
      "Living costs outside central Seoul are moderate by developed-country standards.",
    ],
    tradeoffs: [
      "Korean is required for most degrees and nearly all jobs; the language year is necessary, not decorative.",
      "Working hours and hierarchy in Korean companies are demanding, and foreign employees feel it.",
      "Hiring is heavily seasonal and credential-bound, and social integration is slow for foreigners.",
      "Academic pressure is extreme and starts long before university вЂ” you are entering an environment built on it.",
      "Long-term residence routes exist but are narrower than Canada's or Germany's.",
    ],
    money:
      "With GKS, essentially covered. Without it, tuition is moderate and universities offer partial scholarships, but living in Seoul is not cheap.",
    admissions:
      "Grades, language proficiency (TOPIK for Korean-taught programmes, English tests otherwise) and, for GKS, a competitive national selection through the Korean embassy вЂ” apply through the embassy track, and start a year early.",
    afterStudy:
      "Graduates can move to a job-seeking visa and then to work sponsorship. Language level is the practical gate, more than the paperwork. Compass models Korean admissions, including the language requirement.",
    suitsYou:
      "You want a fully funded degree, you are genuinely willing to learn a hard language, and engineering, tech or the creative industries are your direction.",
    notForYou:
      "You are not prepared to study Korean seriously. Without it this becomes an expensive, isolating four years.",
    applicationCycle:
      "Two intakes, March and September, with the March one dominant. The Global Korea Scholarship runs on its own timetable and can be applied for through either the Korean embassy or a university, each with different quotas and dates, usually opening in the winter for a start later that year. Applications for self-funded students fall in the autumn and spring respectively.",
    howTheyRead:
      "Documents and academic record, with language certificates carrying real weight вЂ” TOPIK for Korean-taught programmes, English tests for English-taught ones. For the scholarship, a study plan and personal statement matter, as does the coherence of your reason for choosing Korea specifically. Recommendation letters are taken seriously.",
    studyingThere:
      "Structured, attendance-conscious and hierarchical, with strong bonds inside your year group and department. Group work and after-class socialising are woven into academic life more than Western students expect. Scholarship students spend a full year on language first, which is demanding and is also what makes the rest work.",
    commonMistake:
      "Planning to study in English and stay to work without Korean. English-taught degrees exist, but the graduate job market largely does not run in English вЂ” students who skip the language often find themselves qualified and locally unemployable.",
    sources: [
      { label: "Study in Korea — the GKS government scholarship", url: "https://www.studyinkorea.go.kr/" },
    ],
    modelled: true,
  },
  {
    id: "uae",
    name: "United Arab Emirates",
    where: "The Gulf вЂ” Dubai and Abu Dhabi, three hours from Central Asia",
    oneLine:
      "Western universities' campuses and a tax-free job market, close to home вЂ” with residence tied to your employer.",
    unique:
      "NYU Abu Dhabi admits internationally and meets full financial need, and it sits three hours from Almaty. A US-style liberal-arts education at that price, in this region, exists nowhere else.",
    fields: [
      "business_economics",
      "engineering",
      "computer_science",
      "medicine_health",
    ],
    hubs: ["dubai"],
    strengths: [
      "Branch campuses of established Western universities award the same degree as the home institution.",
      "NYUAD's need-based aid can cover essentially the whole cost for admitted international students.",
      "No income tax, and a fast-growing corporate and startup market that hires in English.",
      "Three hours from home: visits, family and flights are affordable in a way that the US and Canada never are.",
      "Large Russian-speaking and Central Asian communities already established.",
    ],
    tradeoffs: [
      "Residence is tied to your employer вЂ” losing the job starts a countdown to leaving the country.",
      "Living costs, especially housing and schooling, are high and rising.",
      "There is no route to citizenship and only a narrow one to long-term residence: this is a place to work, not usually to settle permanently.",
      "Summer heat makes months of the year genuinely difficult, and outdoor life stops.",
      "Social and legal norms differ sharply from Europe; the rules are enforced and worth reading before you go.",
      "Outside a few institutions, research depth is thin вЂ” a PhD ambition is better served elsewhere.",
    ],
    money:
      "Branch-campus tuition matches Western prices, with the striking exception of aid-rich NYUAD. Salaries are untaxed, which changes the arithmetic once you are working.",
    admissions:
      "Branch campuses apply their home institution's standards; NYUAD is highly selective and US-style. Local universities are grades-and-tests driven. Compass models UAE admissions, including the medicine track.",
    afterStudy:
      "Work visas are employer-sponsored, with newer long-term 'golden' residence for high earners and some graduates. Predictable while employed, precarious when not.",
    suitsYou:
      "You want a Western degree without leaving the region, or you are aiming at NYUAD's aid, or you want to start earning quickly in a tax-free market.",
    notForYou:
      "You want to emigrate permanently or build an academic research career. The residence model and the research depth both point elsewhere.",
    applicationCycle:
      "The branch campuses run on the calendar of their home institutions вЂ” NYU Abu Dhabi's deadlines mirror the American cycle, with early and regular rounds in the autumn and winter and a candidate weekend for shortlisted applicants. Local universities have their own, generally later, timelines. Financial aid at NYUAD is assessed alongside admission rather than afterwards.",
    howTheyRead:
      "At NYU Abu Dhabi, holistically and extremely selectively вЂ” it is among the most competitive undergraduate admissions anywhere, reading essays, activities and interviews closely, with need-based aid that can cover the full cost. Local and other branch campuses are more conventional, weighting grades and test scores.",
    studyingThere:
      "American-style liberal arts at the branch campuses: broad first years, small seminars, continuous assessment, and an unusually international student body in which nobody is the majority. Campuses are new, well resourced and largely self-contained, and the surrounding city is comfortable but does not integrate you the way a university town would.",
    commonMistake:
      "Treating NYU Abu Dhabi as a safety option because it is nearby and in the region. Its selectivity makes it a reach for almost everyone, and the aid that makes it generous is exactly what makes it competitive.",
    sources: [
      { label: "Ministry of Education — higher education in the UAE", url: "https://www.mohesr.gov.ae/en/" },
    ],
    modelled: true,
  },
  {
    id: "switzerland",
    name: "Switzerland",
    where: "Central Europe вЂ” Zurich, Lausanne, Geneva",
    oneLine:
      "World-class research at low tuition, gated by the hardest admission and the highest cost of living in Europe.",
    unique:
      "ETH Zurich and EPFL charge among the lowest tuition of any top-tier research university on earth вЂ” the wall here is entrance and living costs, not fees.",
    fields: ["computer_science", "engineering", "natural_sciences", "business_economics"],
    hubs: ["zurich", "geneva"],
    strengths: [
      "Tuition at the federal institutes is a fraction of what comparable universities charge internationals.",
      "Research funding per student is exceptional, and PhD positions are salaried jobs with real wages.",
      "Deep tech, pharmaceuticals and quantitative finance all hire locally at very high salaries.",
      "Central location in Europe with infrastructure that simply works.",
      "Graduate salaries are the highest in Europe by a distance.",
    ],
    tradeoffs: [
      "Cost of living is the highest in Europe вЂ” rent alone can exceed a full year's tuition elsewhere.",
      "Bachelor's teaching is often in German or French; the English offering is mostly at master's level.",
      "First-year attrition at the federal institutes is deliberately high: getting in is not staying in.",
      "Non-EU work permits are quota-limited, so staying after graduation is competitive even with an offer.",
      "Housing near the universities is scarce and expensive enough to determine where you can study.",
    ],
    money:
      "Low tuition, extreme living costs. Budget for the city, not for the university вЂ” that inversion catches families out.",
    admissions:
      "Direct admission for internationals is restrictive; many applicants need a recognised qualification plus an entrance examination. Master's entry is easier for a strong bachelor's graduate.",
    afterStudy:
      "Six months to look for work after graduation, then an employer-sponsored permit subject to quotas for non-EU nationals.",
    suitsYou:
      "You are academically exceptional, you can cover living costs, and research or deep tech is genuinely what you want.",
    notForYou:
      "Your budget is tight, or you need an English-taught bachelor's. Both make this the wrong door.",
    applicationCycle:
      "Bachelor's applications generally close in the spring for an autumn start, with recognition of your school certificate the gating question вЂ” ETH in particular requires either a recognised qualification or its own entrance examination, which is demanding and must be prepared for well in advance. Doctoral positions are advertised as jobs throughout the year and are applied for directly to a research group.",
    howTheyRead:
      "Academic record against a published standard, plus the entrance examination where your qualification is not recognised. It is a system with little interest in personal narrative and considerable interest in whether you can handle the mathematics. Doctoral hiring is different again: a supervisor is choosing a colleague, so research fit and prior work decide it.",
    studyingThere:
      "Demanding and fast, with first-year examinations that a substantial proportion of students do not pass вЂ” that attrition is a known feature of the system rather than a personal failure. Teaching is rigorous and theoretical, and support exists but must be sought. Doctoral study, by contrast, is a salaried job with a supervisor and colleagues.",
    commonMistake:
      "Focusing on the low tuition and not on the cost of living. Fees here are among the lowest in Western Europe and existence is among the most expensive in the world вЂ” which is why the funded doctoral route, not the undergraduate one, is the realistic door for most students from this region.",
    sources: [
      { label: "swissuniversities — the rectors' conference", url: "https://www.swissuniversities.ch/en" },
    ],
    modelled: false,
  },
  {
    id: "poland",
    name: "Poland",
    where: "Central Europe вЂ” Warsaw, KrakГіw and a large network of public universities",
    oneLine:
      "The best ratio of cost to opportunity in the European Union for a student from this region: an EU degree, a familiar culture and a short trip home.",
    unique:
      "An EU degree at Central European prices, in the country where a student from the CIS finds the largest existing community from home and the smallest cultural distance to cross.",
    fields: [
      "computer_science",
      "engineering",
      "business_economics",
      "medicine_health",
      "humanities_social",
    ],
    hubs: ["warsaw", "krakow"],
    strengths: [
      "The degree is an EU degree and travels to the rest of the union afterwards вЂ” that portability is the asset you are actually buying.",
      "English-taught programmes are widespread in computing, business and medicine, and their tuition is moderate rather than punishing.",
      "Living costs sit well below Western Europe while the technology sector pays respectably by regional standards.",
      "Climate, food, culture and a language closer to your own shorten the adjustment for both the student and the family at home.",
      "The trip home is short and cheap, which matters far more across four years than students admit when they choose.",
    ],
    tradeoffs: [
      "Salaries sit below Western Europe's, so people who intend to stay in the EU long-term often move west after a few years anyway.",
      "Polish makes a large difference outside IT and international companies; English alone confines you to a narrow slice of the market.",
      "Rents in Warsaw and KrakГіw have risen sharply and student accommodation is not guaranteed.",
      "The research ecosystem is thinner than Germany's or the Netherlands', which matters if a doctorate is the goal.",
      "Residence-card bureaucracy is slow, and appointment backlogs can leave a student waiting months for a document they need.",
      "Quality between institutions varies widely, and some English-taught programmes exist mainly to sell places to international students.",
    ],
    money:
      "Tuition is moderate rather than free вЂ” this is not the German model вЂ” but living costs are far below Western Europe and scholarships exist for strong applicants, so the total for a full degree lands closer to Central Asian than to Dutch levels. Students may work without a separate permit, which makes part-time earnings a real part of the budget rather than a token.",
    admissions:
      "School results against published thresholds, an English certificate for English-taught programmes, and subject entrance examinations for medicine and some technical fields. The process is documentary rather than holistic: a strong transcript and the right certificates do almost all of the work.",
    afterStudy:
      "A residence permit for graduates to look for work, and a straightforward route from employment into longer-term residence; as an EU country, time here also counts towards long-term EU status. Current rules, and worth re-checking in your own graduation year.",
    suitsYou:
      "You want an EU degree and a European career start without Western European costs, and being a few hours from home is a feature rather than a compromise.",
    notForYou:
      "You want the highest salaries in Europe, a deep research ecosystem, or a fully English-speaking life. Poland gives none of the three, and the Netherlands or Germany serve each of them better.",
    applicationCycle:
      "Later and calmer than the Anglophone systems: most public universities open applications in late spring and close them in July, with a second round in August for programmes that have not filled, and medicine running earlier on its own entrance examinations. Decisions come within weeks rather than months. The part that has to start in the spring is the document chain вЂ” legalised school certificates, sworn translations, and recognition of your school-leaving qualification вЂ” because it is slower than the application itself.",
    howTheyRead:
      "Documents rather than a person: your school-leaving results converted onto the Polish scale, an English certificate, and for medicine and some engineering programmes an entrance examination in the relevant subjects. Essays, activities and letters play no part. That transparency is an advantage for a student with strong grades and no polish, and a disadvantage for one whose record needs explaining вЂ” because there is nowhere in the process to explain it.",
    studyingThere:
      "Structured, lecture-and-seminar based, with assessment concentrated in end-of-semester examinations and a heavy taught load in the early years вЂ” much closer to what a student from this region already knows than the independent-study model of the UK or the Netherlands. Attendance is generally required, cohorts move through together, and the relationship with the department is formal. English-taught groups are largely international, so meeting Polish students takes deliberate effort.",
    commonMistake:
      "Assuming an EU degree is one thing. Poland has excellent public universities and a tail of institutions that recruit internationally on price, and from outside they look alike. The questions that separate them are who accredits the programme, how many teaching staff are permanent, and where last year's English-track graduates went. Cheap tuition at a weak institution is the most expensive route in this guide.",
    sources: [
      { label: "NAWA — the national agency for academic exchange", url: "https://nawa.gov.pl/en/" },
    ],
    modelled: false,
  },
  {
    id: "turkiye",
    name: "TГјrkiye",
    where: "Between Europe and Asia вЂ” Istanbul, Ankara, and a scholarship programme aimed at this region",
    oneLine:
      "A fully funded degree at a strong technical university, in a language family half of our readers already know, an hour and a half from home.",
    unique:
      "TГјrkiye BurslarД± is one of the few scholarships anywhere that covers tuition, accommodation, health insurance, a monthly stipend and a year of language teaching at once вЂ” and Central Asia and the Caucasus are among its priority regions.",
    fields: [
      "engineering",
      "computer_science",
      "medicine_health",
      "business_economics",
      "humanities_social",
    ],
    hubs: ["istanbul", "ankara"],
    strengths: [
      "The state scholarship is genuinely comprehensive вЂ” tuition, accommodation, insurance, a stipend and a language year in one package.",
      "The strongest technical universities teach in English and are competitive by any international standard.",
      "Turkish is closely related to Kazakh, Kyrgyz, Uzbek and Azerbaijani, so the language year starts from a real head start rather than from zero.",
      "Flights home are short and frequent, and the cultural distance is small for students from the region.",
      "Living costs are low relative to Europe, so a stipend covers a life rather than a corner of one.",
    ],
    tradeoffs: [
      "Currency instability makes any plan funded from outside the country hard to hold to, and prices move faster than budgets.",
      "The scholarship is competitive, and the fallback вЂ” paying at a private university вЂ” is much weaker value for the money.",
      "University governance and academic freedom have been politically contested, and some faculties feel that far more than others.",
      "A Turkish degree is read well across this region and much less automatically in Western Europe or North America.",
      "Outside the strongest institutions quality drops steeply, and the scholarship does not always let you choose where you are placed.",
      "Turkish is essential for daily life and most employment, so an English-taught degree postpones the language requirement rather than removing it.",
    ],
    money:
      "Two very different routes. The state scholarship covers essentially everything, and it is the reason this destination belongs on the list at all. Self-funded study at a private university costs real money for a much less certain outcome, while public university fees for self-funded international students stay low by any European comparison вЂ” and living costs are low enough that a stipend is genuinely livable.",
    admissions:
      "The scholarship is a single national application with academic records, a statement and interviews, and it places you into universities and programmes you ranked inside that application. Separately, universities admit international students on school results and their own examination, with the technical universities by far the most demanding.",
    afterStudy:
      "A student residence permit through the degree, and afterwards a work permit that an employer must sponsor; graduates of Turkish universities can apply for a short job-search permit. For most scholarship holders the stronger route is the regional market, or a master's elsewhere with a funded degree already behind them.",
    suitsYou:
      "You need the cost of a degree to be close to zero, you want a technical education taught in English, and a language close to your own is an advantage rather than an obstacle.",
    notForYou:
      "You want a credential that opens doors in Western Europe or North America without further steps, or you cannot plan inside an economy where prices move faster than budgets.",
    applicationCycle:
      "The scholarship dominates the calendar: applications open in winter and close in early spring of your final school year, results arrive in summer, and placement into a university and a city follows вЂ” so the whole decision is made before most other countries have opened. University-run admission for self-funded students runs later, through spring and summer, with its own examination dates. Document legalisation and translation should be started before the scholarship application, not after it.",
    howTheyRead:
      "The scholarship reads the academic record first, then the statement of purpose and the interview, and it weighs the fit between your stated field and the country's own priorities more than a Western admissions office would. University admission outside it is largely documentary: transcripts, an examination score, English certification. Neither route assesses activities in the American sense вЂ” but the interview is a real filter, and it is where most strong applications are lost.",
    studyingThere:
      "The strong technical universities teach in English on large campuses with an American-influenced credit system and a preparatory language year for those who need it, a structure that is unusually familiar to anyone who has looked at US universities. Elsewhere teaching is more lecture-driven and in Turkish. Campus life carries much of the experience, and student communities from Central Asia are large and long established, which softens the arrival considerably.",
    commonMistake:
      "Treating the scholarship as a lottery ticket and the placement as a detail. The application asks you to rank universities and programmes, and that ranking shapes the next four years far more than the award itself does вЂ” a funded place on a weak programme is not the win it feels like on results day. Research the specific departments before you rank them, not after.",
    sources: [
      { label: "Türkiye Bursları — the state scholarship", url: "https://turkiyeburslari.gov.tr/en" },
      { label: "YÖK — the Council of Higher Education", url: "https://www.yok.gov.tr/en" },
    ],
    modelled: false,
  },
  {
    id: "china",
    name: "China",
    where: "East Asia вЂ” Beijing, Shanghai, Shenzhen, and a scholarship system aimed squarely at this region",
    oneLine:
      "The largest funded-study offer directed at Central Asia anywhere, inside the research and manufacturing system most likely to shape the next twenty years.",
    unique:
      "Government, provincial and university scholarships routinely cover tuition, campus accommodation and a monthly stipend for students from this region вЂ” a fully funded degree at a serious research university, with the language included.",
    fields: [
      "engineering",
      "computer_science",
      "natural_sciences",
      "business_economics",
      "medicine_health",
    ],
    hubs: ["beijing", "shanghai", "shenzhen"],
    strengths: [
      "Scholarships are broad and explicitly open to applicants from Central Asia; a full award covers tuition, accommodation and a stipend.",
      "Research funding and laboratory equipment are at a level only the United States matches, and in several engineering fields the work is ahead.",
      "English-taught programmes exist across engineering, business and medicine, usually with a year of Mandarin attached to them.",
      "The manufacturing ecosystem around the southern cities has no equivalent anywhere вЂ” a hardware idea can be prototyped in days rather than months.",
      "Trade and investment ties with Central Asia mean a Chinese degree plus the language is directly employable back home.",
    ],
    tradeoffs: [
      "The internet is restricted, and study, research and contact with home all have to be organised around that fact.",
      "Political sensitivity is a daily constraint in some subjects, and the humanities and social sciences feel it most.",
      "A degree taught in English without the language converts poorly вЂ” into local work, and into how the qualification is read afterwards.",
      "Residence permits, health checks and annual renewals are heavy and unforgiving of missed paperwork.",
      "Academic culture is competitive and hierarchical, and the relationship with a supervisor decides a great deal that is written down nowhere.",
      "Recognition of Chinese degrees in Western job markets is improving but uneven, and varies by institution far more than by country.",
    ],
    money:
      "Funded is the normal case rather than the exception: national, provincial and university scholarships cover tuition and campus accommodation and add a monthly stipend, and applicants from this region are specifically targeted. Unfunded tuition is moderate by Western standards. The costs that actually hurt are administrative and personal вЂ” permits, insurance, flights, and the distance from home.",
    admissions:
      "School results, a language certificate in English or Chinese depending on the programme, two academic references, a study plan and, for scholarships, an interview. Strong applicants apply to several universities at once, because each runs its own admission alongside the national scholarship competition.",
    afterStudy:
      "Graduates of Chinese universities can apply for permits to work or start a business, and the rules have loosened for those with a Chinese degree and the language. Staying long-term is possible but not the usual outcome вЂ” for most students the value is the degree, the language and the network in a market that trades heavily with home.",
    suitsYou:
      "You want a fully funded technical or scientific degree, you will learn Mandarin properly, and you see China as a career direction вЂ” regional trade, engineering, research вЂ” rather than as a stepping stone to the West.",
    notForYou:
      "You need an open internet for your work, you want to move to Western Europe or North America straight after graduating, or you are unwilling to learn the language. An English-only degree here is the weakest version of this option.",
    applicationCycle:
      "Earlier than students expect: the government scholarship and the university-run awards close between January and April for a September intake, with results arriving through the summer. Admission without a scholarship runs later. Physical documents, notarised translations, references and a medical examination are all part of the file, and assembling them takes weeks вЂ” starting in the autumn before is the difference between applying and nearly applying.",
    howTheyRead:
      "Documentary and academic: transcripts, the language certificate, the study plan and references carry the decision, and the study plan matters more than applicants assume because it is read as evidence that you know what the department actually does. Scholarship interviews test motivation and fit with the university's priorities. There is no assessment of activities and no personal essay in the American sense вЂ” the file is the applicant.",
    studyingThere:
      "Structured and intensive, with large cohorts, formal relationships with staff and assessment concentrated in examinations; independence is expected inside a supervisor's direction rather than instead of it. International students are often taught in separate English-track groups, which is comfortable and slows integration вЂ” the students who get the most out of China are the ones who leave that group deliberately. Campus accommodation is normal and campuses are self-contained.",
    commonMistake:
      "Taking an English-taught programme and treating the Mandarin as optional. The value here is the combination of qualification, language and network; without the language it collapses into a certificate that is harder to explain at home than a local degree. The second mistake is applying in spring вЂ” by then the scholarship rounds have already closed.",
    sources: [
      { label: "Campus China — the CSC government scholarship", url: "https://www.campuschina.org/" },
    ],
    modelled: false,
  },
  {
    id: "japan",
    name: "Japan",
    where: "East Asia вЂ” Tokyo, Osaka and Kyoto, where national universities charge everyone the same fees",
    oneLine:
      "Far cheaper than its reputation, with government scholarships that cover everything вЂ” and a job market that does not open without the language.",
    unique:
      "National universities charge international students exactly what they charge Japanese students, and the MEXT government scholarship removes even that while adding travel and a monthly allowance.",
    fields: [
      "engineering",
      "natural_sciences",
      "computer_science",
      "arts_design",
      "business_economics",
    ],
    hubs: ["tokyo", "osaka-kyoto"],
    strengths: [
      "National university fees are set nationally and are identical for international students вЂ” there is no separate international price at all.",
      "The government scholarship covers tuition, flights and a monthly allowance, and it takes undergraduates as well as researchers.",
      "Research groups in materials, robotics, electronics and the basic sciences are world-class and take students seriously.",
      "It is safe, orderly and superbly connected, and student life is manageable without a car or a large budget.",
      "An ageing population means the country now actively wants skilled foreign graduates, which was not true a decade ago.",
    ],
    tradeoffs: [
      "Business-level Japanese is the real entry requirement for work, and English-track degrees postpone that problem rather than solving it.",
      "Graduate hiring runs on a rigid annual calendar that begins more than a year before graduation; missing it means waiting a year.",
      "Workplace culture expects long hours and deference, and international graduates leave over that more often than over the work itself.",
      "Undergraduate entrance examinations at national universities are demanding and conducted in Japanese.",
      "Being foreign stays visible in a way it does not in Canada or the Netherlands, socially and especially in housing.",
      "Moving in is expensive вЂ” deposits, key money and guarantor requirements front-load the cost of the first year.",
    ],
    money:
      "Cheaper than almost anyone expects: national university fees are identical for international and domestic students, private universities cost more but not Western amounts, and the government scholarship removes fees entirely while paying an allowance. The genuine costs are the move-in expenses and Tokyo rent вЂ” Osaka and Kyoto are materially cheaper for the same quality of teaching.",
    admissions:
      "For undergraduate places, an examination for international students plus the university's own test and often an interview, largely in Japanese. For research and scholarship routes, a supervisor's acceptance matters more than anything else вЂ” you find the laboratory first and apply through it.",
    afterStudy:
      "A designated-activities status lets graduates stay to look for work, and routes for skilled graduates have widened as the workforce shrinks. It is one of the more predictable systems here вЂ” provided you have the language, which is the condition attached to everything in Japan.",
    suitsYou:
      "You want funded research or engineering at a high level, you will commit to Japanese seriously, and you value order and safety over a fast, informal career start.",
    notForYou:
      "You want an English-speaking career, a flexible hiring calendar, or a quick route into a job market. Japan rewards patience and the language and punishes the absence of either.",
    applicationCycle:
      "Two calendars, and choosing the wrong one costs a year. The government scholarship is applied for through the embassy in spring for entry the following spring or autumn, with examinations and interviews over the summer вЂ” close to eighteen months of lead time. University-run admission for research students runs on a supervisor's acceptance and can be faster, but it demands contact with the laboratory months ahead. The academic year starts in April, though September intakes for English-track programmes are increasingly common.",
    howTheyRead:
      "For research routes the supervisor's judgement is the decision: a research proposal that matches what the laboratory actually does, plus transcripts and references, outweighs everything else, and a generic unsolicited email is simply ignored. For undergraduate entry, examination scores dominate. Neither route assesses activities or personal essays as the American system does, and both reward precision, preparation and a well-argued plan.",
    studyingThere:
      "Undergraduate teaching is lecture-heavy with club activities carrying much of student life; graduate study is laboratory-centred, and your group functions as workplace, social circle and hierarchy at once. Attendance and process matter, deadlines are firm, and the relationship with your supervisor shapes everything from your topic to your reference letter. English-track programmes are real but small, and the wider campus operates in Japanese.",
    commonMistake:
      "Applying to a university instead of to a laboratory. Research admission runs through supervisors, so the effective application is a specific, informed message to a specific researcher months before any deadline; sent generically it is ignored, and students conclude the country is closed when they only used the wrong door. The second mistake is assuming an English track removes the language requirement for working here. It does not.",
    sources: [
      { label: "Study in Japan — the MEXT gateway", url: "https://www.studyinjapan.go.jp/en/" },
    ],
    modelled: false,
  },
  {
    id: "india",
    name: "India",
    where: "South Asia вЂ” Bangalore, Hyderabad, and a technology sector that hires globally",
    oneLine:
      "English-language technology and pharmaceutical education at the lowest cost on this list, inside the industry that supplies much of the world's software work.",
    unique:
      "Higher education and professional work both run in English, so a student from this region can study and then work here without learning a new language at all вЂ” which is true of nowhere else in Asia.",
    fields: [
      "computer_science",
      "engineering",
      "medicine_health",
      "business_economics",
    ],
    hubs: ["bangalore", "hyderabad"],
    strengths: [
      "Teaching, work and business all run in English, so there is no language year and no hidden language cost.",
      "Tuition at private universities and the cost of living are the lowest of any destination here вЂ” a full degree costs less than one year in Europe.",
      "The technology and pharmaceutical industries are enormous and recruit on campus, so internships are genuinely reachable.",
      "The sheer volume of engineering graduates has produced a deep and competitive teaching culture in mathematics and computing.",
      "Student visas for applicants from this region are routine, and flights are short and inexpensive.",
    ],
    tradeoffs: [
      "The strongest public institutes admit through examinations almost no foreign applicant prepares for, so the realistic route is a private university.",
      "Quality between private universities varies enormously, and their international marketing is aggressive and unreliable.",
      "Local graduate salaries are low, so the value is the experience and the employer's name rather than the earnings.",
      "Campus placement culture rewards test-taking over depth, and it shapes what is taught in the final years.",
      "Infrastructure, air quality and heat are real daily costs, particularly for anyone from a cold, dry climate.",
      "Staying on to work needs an employment visa above a salary threshold, so the study-to-work ladder is weaker than Canada's or Germany's.",
    ],
    money:
      "The cheapest serious option outside staying at home: private university tuition is modest by international standards, living costs are low, and a whole degree lands below a single year almost anywhere in Europe. Scholarships for international students exist but are small. The trade sits on the other side вЂ” starting salaries are low, so the return comes from where the degree takes you next rather than from what it pays here.",
    admissions:
      "Private universities and international programmes admit on school results plus their own entrance test in mathematics and science. The famous public institutes run national examinations with preparation cultures years long, and are not a realistic target for most applicants from outside the country.",
    afterStudy:
      "An employment visa requires a job offer above a salary threshold that most graduate roles do not meet, so staying on is harder than studying here. The usual routes onward are a global employer's office elsewhere, a master's abroad on the strength of the degree, or coming home with skills the local market is short of.",
    suitsYou:
      "You want technology, engineering or pharmaceutical education in English at the lowest possible cost, and you are aiming at a global employer or a master's abroad afterwards.",
    notForYou:
      "You want to settle in the country you study in, you need Western campus infrastructure, or you cannot verify a private university's quality from a distance вЂ” that verification is the whole risk here.",
    applicationCycle:
      "Applications to private universities open in winter and run through spring for a July or August start, with entrance tests held in several rounds вЂ” so a place is usually settled within weeks and there is a genuine second chance later in the cycle. The public institutes run a single national examination in spring with results and counselling over the summer, on a schedule that assumes years of preparation. Visa processing is quick, but document attestation should be started early.",
    howTheyRead:
      "Entrance test scores and school results, in that order, with mathematics and science weighted heaviest for engineering and computing; interviews appear at some private universities and design programmes ask for a portfolio. There is no essay culture and activities are not assessed. The system rewards examination performance in a narrow band of subjects, which is transparent and unforgiving in equal measure вЂ” there is nowhere to explain a weak year.",
    studyingThere:
      "Large classes, a heavy fixed timetable, continuous internal assessment and semester examinations, with attendance enforced more strictly than most students expect. Campus placement dominates the final year and shapes the two before it: preparation for company tests runs alongside the degree and is treated as equally important. Hostel accommodation on campus is the norm, and student life is lived largely inside it.",
    commonMistake:
      "Assuming a private university's advertising reflects its teaching. The gap between the strongest private institutions and the weakest is wider here than in any other country in this guide, and both advertise identically abroad. The questions worth asking are which companies recruited on campus last year, how many students were actually placed, and who accredits the programme.",
    sources: [
      { label: "Study in India — the government portal", url: "https://www.studyinindia.gov.in/" },
    ],
    modelled: false,
  },
];

/** One destination profile by id. */
export function destinationById(id: string): StudyDestination | undefined {
  return STUDY_DESTINATIONS.find((d) => d.id === id);
}

/**
 * The country profile a city sits in, if we have one.
 *
 * Usually we do not: 9 of the 22 hubs are in countries with no profile, and
 * four of those are the home region. So every caller has to handle `undefined`
 * as an ordinary case, not an error вЂ” a city without a full country write-up is
 * still a real place a student can work in, and Almaty is the proof.
 */
export function destinationForHub(hubId: string): StudyDestination | undefined {
  return STUDY_DESTINATIONS.find((d) => d.hubs.includes(hubId));
}

/** Profiles matching any of the chosen fields; empty in в‡’ all of them. */
export function destinationsForFaculties(
  faculties: FacultyValue[],
): StudyDestination[] {
  if (faculties.length === 0) return STUDY_DESTINATIONS;
  return STUDY_DESTINATIONS.filter((d) =>
    d.fields.some((f) => faculties.includes(f)),
  );
}
