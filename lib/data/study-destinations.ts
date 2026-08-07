import type { FacultyValue } from "@/lib/data/faculties";

// The deep layer of the guide: full profiles of the destinations students
// actually argue about — the US, the UK, Hong Kong, Singapore, Germany, Italy,
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
// POLICY DRIFT — the one real maintenance risk. Post-study work rules (the UK
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
  /** How paying for it actually works — shape, not numbers. */
  money: string;
  /** What admissions here actually weighs. */
  admissions: string;
  /** Staying on after you graduate. Policy-dependent, so phrased as of today. */
  afterStudy: string;
  /** Who this fits. */
  suitsYou: string;
  /** Who should look elsewhere — mandatory, and the most useful line here. */
  notForYou: string;
  /** True where Compass already computes admission odds for this destination. */
  modelled: boolean;
};

export const STUDY_DESTINATIONS: StudyDestination[] = [
  {
    id: "united-states",
    name: "United States",
    where: "North America — Boston, New York, the Bay Area and 50 states of variation",
    oneLine:
      "The deepest research funding and the widest aid on earth, wrapped in the highest sticker price and the least predictable visa.",
    unique:
      "A handful of universities here meet the FULL demonstrated financial need of international students — the only place in the world where a student from a low-income family in Central Asia can attend a top university for close to nothing. It coexists with the most expensive higher education on the planet.",
    fields: [
      "computer_science",
      "engineering",
      "natural_sciences",
      "medicine_health",
      "business_economics",
      "humanities_social",
    ],
    hubs: ["boston", "bay-area", "new-york"],
    strengths: [
      "Holistic admissions: your essays, your activities and who you are count, not only exam scores — the one system where a strong record outside class can outweigh a mediocre one inside it.",
      "You apply undecided and choose a major later; switching from biology to computer science in second year is normal, not a restart.",
      "Undergraduate research is real here — you can be in a lab as a first-year, which is rare almost everywhere else.",
      "The largest concentration of well-funded universities, and PhD study is normally a paid position rather than a fee.",
      "Campus life is a full ecosystem: clubs, societies, sport, career fairs and alumni networks that keep working for decades.",
    ],
    tradeoffs: [
      "Sticker prices are the highest anywhere, and most universities are need-AWARE for internationals: asking for aid can lower your chance of admission.",
      "The work visa after graduation is a lottery — H-1B is drawn by chance, so staying long-term is genuinely uncertain no matter how good you are.",
      "Healthcare is not free and student insurance is a real annual cost most European destinations don't have.",
      "Admissions to the famous names is a coin-flip even for excellent applicants; building a list around them is how students end up with nothing.",
      "Guns, distances and car dependence are daily realities outside the big coastal cities, and they surprise people.",
      "The application itself costs money: tests, score reports and per-university fees add up before anyone has accepted you.",
    ],
    money:
      "Two completely different games. At the aid-rich private universities, family income drives the price and it can end near zero; at public universities and most private ones, internationals pay close to full and aid is thin. Never judge a US university by its published price until you have read its own aid policy for international students.",
    admissions:
      "Grades and rigour first, then tests where required, then the parts nobody else asks for: essays in your own voice, a handful of activities with real depth, and teacher letters. Compass models this pathway — the factor scores and per-school ranges you see in the report are built for it.",
    afterStudy:
      "F-1 study, then OPT — 12 months of work authorisation, extended by 24 more for STEM degrees. After that an employer must sponsor you into the H-1B lottery. Current rule, and the part most likely to change with politics.",
    suitsYou:
      "You have a strong record beyond exams, you want to keep your options open for two more years, and either your family income is low enough for real aid or high enough to absorb the cost.",
    notForYou:
      "You need certainty. If a predictable path from degree to work permit to residence matters more than prestige, Canada, Germany or the Netherlands will treat you better.",
    modelled: true,
  },
  {
    id: "united-kingdom",
    name: "United Kingdom",
    where: "Europe — London, and strong universities spread across the country",
    oneLine:
      "The fastest route to a respected degree: three focused years, one subject, decided almost entirely on academics.",
    unique:
      "You specialise from day one and finish a bachelor's in three years — a year of tuition and a year of living costs cheaper than most of the world, and a year earlier into work.",
    fields: [
      "law",
      "business_economics",
      "humanities_social",
      "arts_design",
      "computer_science",
      "medicine_health",
    ],
    hubs: ["london"],
    strengths: [
      "Three-year bachelor's degrees (four in Scotland) — less total cost, and you start earning sooner.",
      "One application through UCAS covers five universities: far less admin and fewer fees than applying across the US.",
      "Admissions are transparent: published grade requirements you can aim at, rather than a black box.",
      "English-language degrees recognised everywhere, and the largest legal and financial centre in Europe attached to them.",
      "Strong art, design, drama and music schools with genuinely international intakes.",
    ],
    tradeoffs: [
      "You choose your subject at application and changing later usually means starting again — the opposite of the American flexibility.",
      "Undergraduate scholarships for internationals are scarce; the money is at master's level (Chevening and university awards).",
      "London costs are brutal, and student housing is the single biggest shock in most budgets.",
      "Post-study work rules have changed repeatedly in the last decade and can change again before you graduate.",
      "Contact hours are low by Central Asian standards — a humanities student may have a handful of taught hours a week and is expected to run their own reading.",
      "Medicine and veterinary places for internationals are extremely limited and quota-capped.",
    ],
    money:
      "Tuition for internationals is high and rises by subject (lab and clinical courses cost far more). Undergraduate aid is limited, so most families are self-funding; the honest cheaper comparison for the same language of instruction is the Netherlands or Ireland.",
    admissions:
      "Almost purely academic: predicted and achieved grades against a published offer, plus a personal statement about the subject itself — not about your personality. Some courses add an admissions test or an interview.",
    afterStudy:
      "The Graduate Route currently allows two years of work after a bachelor's or master's (three after a PhD) without a job offer. This rule has been narrowed before — verify it for your own graduation year, not for today.",
    suitsYou:
      "You already know your subject, your grades are strong and predictable, and you want the shortest respectable path from school to a degree to a job.",
    notForYou:
      "You're undecided between fields, or you need a scholarship to make it possible at undergraduate level. Both are better served elsewhere.",
    modelled: false,
  },
  {
    id: "hong-kong",
    name: "Hong Kong",
    where: "Asia — a city-state on China's south coast",
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
      "Entrance scholarships for international students are published and substantial — some cover tuition entirely.",
      "A genuine finance, logistics and legal centre: internships in the city are real, not simulated.",
      "Compact and extremely well connected — no car, fast transport, and the rest of Asia within a short flight.",
      "A springboard into mainland China without needing Mandarin from day one.",
    ],
    tradeoffs: [
      "Housing is among the most expensive and smallest in the world; university dorms are limited and not guaranteed for all years.",
      "The political environment has shifted since 2020 — some multinationals moved regional offices to Singapore, and academic freedom is a live debate.",
      "Cantonese runs daily life outside campus, which limits part-time work and slows integration.",
      "Places for non-local students are capped by policy, so competition for international seats is fiercer than the headline admit rates suggest.",
      "Summers are hot and humid to a degree people underestimate, and typhoon season is a normal disruption.",
    ],
    money:
      "Tuition for non-locals is well below the US and UK, and the scholarship layer can take it lower still. Living costs — housing above all — are the real expense, and they are high.",
    admissions:
      "Grades-first: your curriculum results, English proficiency and, where required, subject tests. Achievements and competitions matter more than personal essays. Compass models Hong Kong admissions, including which programmes weigh what.",
    afterStudy:
      "The IANG arrangement currently lets non-local graduates stay to work without a job offer in hand — one of the more generous post-study rules in Asia. Verify the current term before relying on it.",
    suitsYou:
      "You want an English-taught degree in Asia, your academic record is strong, and a scholarship is what makes the difference between going and not going.",
    notForYou:
      "You want space, quiet or cheap housing — or you want a political environment that is settled and predictable for the next decade.",
    modelled: true,
  },
  {
    id: "singapore",
    name: "Singapore",
    where: "Southeast Asia — a city-state at the tip of the Malay Peninsula",
    oneLine:
      "Asia's most orderly place to study: English-speaking, safe, research-heavy — and it expects something back.",
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
      "Deliberately built biotech, fintech and logistics clusters — internships connect to actual industry, not to a campus office.",
      "Among the safest cities anywhere, with public transport that removes the need for a car.",
      "Regional hub: most of Asia is a short flight away, which matters for internships and conferences.",
      "Graduate employment rates are published and taken seriously by the universities themselves.",
    ],
    tradeoffs: [
      "Bonded scholarships tie you to the country for years after graduation — leaving early means repaying, with penalties.",
      "Cost of living is high, and permanent housing is effectively closed to non-residents.",
      "The academic culture is intense and grade-driven; it suits some students and grinds down others.",
      "Social and legal rules are stricter than most students expect, and enforcement is consistent.",
      "The domestic market is small: after the bond, many careers require moving again anyway.",
    ],
    money:
      "Tuition sits between Europe and the US, with substantial subsidies available — usually attached to a bond. Read the bond terms before the brochure: that clause is the actual price.",
    admissions:
      "Strictly academic, with high published thresholds and, for some programmes, interviews or aptitude tests. Consistent excellence over years matters more than a single spike.",
    afterStudy:
      "Employment passes are tied to salary thresholds and employer sponsorship; bonded graduates have a job route built in. Long-term residence is possible but selective.",
    suitsYou:
      "You want Asia, in English, with a clear route into a job — and you are willing to trade a few post-graduation years for someone else paying for the degree.",
    notForYou:
      "You want to keep every option open after graduating. A bond is a commitment made at 18 that binds you at 22.",
    modelled: false,
  },
  {
    id: "germany",
    name: "Germany",
    where: "Central Europe — Berlin, Munich, and a dense network of public universities",
    oneLine:
      "The cheapest serious degree in the developed world: public universities charge no tuition, including for international students.",
    unique:
      "No tuition at public universities — only a semester contribution of a few hundred euros that usually includes a regional transport pass. Nowhere else offers that at this scale and quality.",
    fields: [
      "engineering",
      "computer_science",
      "natural_sciences",
      "business_economics",
      "arts_design",
    ],
    hubs: ["berlin"],
    strengths: [
      "No tuition fees at public universities, for internationals too — the single biggest cost difference on this whole list.",
      "Engineering and applied sciences are the national strength, tied directly to industry through mandatory internships and dual programmes.",
      "An 18-month residence permit to look for work after graduating, and a clear path from there to permanent residence.",
      "A large English-taught master's offering, and a growing set of English bachelor's programmes.",
      "Strong worker protections and a real separation between work and life once you are employed.",
    ],
    tradeoffs: [
      "German is needed for most bachelor's degrees, for daily life, and for most jobs outside tech — B2 is a realistic requirement, not a nice-to-have.",
      "A Central Asian school certificate usually does NOT qualify you directly: most students must first pass a Studienkolleg year and its assessment exam.",
      "Bureaucracy is heavy, slow and paper-based, and it is conducted in German.",
      "A blocked account with a year of living costs must be funded before the visa is issued — the money barrier moved, it did not disappear.",
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
    modelled: false,
  },
  {
    id: "italy",
    name: "Italy",
    where: "Southern Europe — Milan, Turin, Bologna, Rome and dozens of ancient universities",
    oneLine:
      "The cheapest realistic route into Western Europe for a family without money — tuition scales to income, and regional scholarships pay you to study.",
    unique:
      "Fees are calculated from family income (the ISEE assessment), and DSU regional scholarships cover tuition, a living grant, housing and meals for students below an income threshold — a package that exists nowhere else in Europe at this scale.",
    fields: [
      "arts_design",
      "engineering",
      "business_economics",
      "medicine_health",
      "humanities_social",
    ],
    hubs: ["milan"],
    strengths: [
      "Income-scaled tuition plus DSU scholarships: for a modest-income family this can be the cheapest option on the entire list, cheaper than staying home.",
      "Medicine taught in English, entered through the IMAT exam — one of the few honest routes into European medicine for an international student.",
      "Design, architecture and fashion at Politecnico and the Milan schools, sitting inside the industry itself.",
      "EU degree, EU mobility afterwards, and a 12-month post-study residence permit to find work.",
      "Cost of living outside Milan is genuinely low by Western European standards.",
    ],
    tradeoffs: [
      "Italian is essential for daily life and for most jobs; English-taught degrees do not change that once you step off campus.",
      "Bureaucracy is slow and document-heavy — the permesso di soggiorno process is a rite of passage, not an anecdote.",
      "Graduate salaries and the domestic job market are weak compared to Germany or the Netherlands; many graduates leave to work.",
      "DSU scholarships are administered per region with different rules, deadlines and reliability — the paperwork is the actual hurdle.",
      "University structures are old-fashioned: large lectures, oral exams, little pastoral support.",
      "Housing in Milan is expensive and competitive, closer to a northern European capital than to the rest of Italy.",
    ],
    money:
      "Tuition depends on assessed family income, and can fall to nothing. Add a DSU grant and the state effectively pays you to study. The catch is entirely in the paperwork: certified, translated income documents, on time, per region.",
    admissions:
      "Programme-specific: TOLC entrance tests for many degrees, IMAT for English-taught medicine, portfolio for design. Grades matter, personal essays barely exist. Compass evaluates Italian programmes deterministically, including the DSU and financial-fit picture.",
    afterStudy:
      "A 12-month permit to look for work after graduating, and EU-wide mobility with the degree. Working in Italy itself is the harder half — the language and the market both bite.",
    suitsYou:
      "Money is the binding constraint, you are willing to learn Italian, and you want design, architecture, engineering or medicine.",
    notForYou:
      "You need high graduate earnings immediately, or you cannot handle administrative uncertainty. Both will make you miserable here.",
    modelled: true,
  },
  {
    id: "netherlands",
    name: "Netherlands",
    where: "Northwestern Europe — Amsterdam, Delft, Eindhoven, Rotterdam",
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
    hubs: ["eindhoven"],
    strengths: [
      "English-taught bachelor's degrees are normal here, not a rare exception, and Dutch society operates in English alongside Dutch.",
      "International and European law taught in English is a Dutch speciality — one of the few places a school-leaver can enter law abroad without first learning the local language.",
      "Problem-based, project-heavy teaching with small groups — closer to work than to lecture halls.",
      "The Eindhoven region is the centre of Europe's semiconductor and precision-engineering industry, with paid internships attached.",
      "An 'orientation year' permit lets graduates stay and look for work with full labour-market access.",
      "Flat, cycling-first cities with an unusually high quality of daily life for students.",
    ],
    tradeoffs: [
      "The student housing shortage is severe and openly acknowledged — some universities warn applicants not to come without a room.",
      "Non-EU tuition is real money: far below the US and UK, but nothing like Germany's free public universities.",
      "Popular programmes use numerus fixus selection with early deadlines — miss January and you wait a year.",
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
      "You cannot arrange housing early or absorb its cost, or you need a low-tuition option — Germany does that better.",
    modelled: false,
  },
  {
    id: "canada",
    name: "Canada",
    where: "North America — Toronto, Waterloo, Vancouver, Montreal",
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
    hubs: ["toronto"],
    strengths: [
      "The post-graduation work permit follows automatically from an eligible degree — no employer sponsorship, no lottery.",
      "Co-op programmes (Waterloo above all) alternate study with paid work terms, so you graduate with real experience and savings.",
      "Public healthcare coverage for students in most provinces, which removes a cost the US imposes.",
      "Genuinely multicultural cities with established Central Asian and post-Soviet communities.",
      "US-adjacent tech and finance industries with none of the visa roulette.",
    ],
    tradeoffs: [
      "International tuition is high — several times what domestic students pay, and rising.",
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
    modelled: false,
  },
  {
    id: "south-korea",
    name: "South Korea",
    where: "East Asia — Seoul and the industrial belt around it",
    oneLine:
      "A full government scholarship that pays for a language year, tuition and living costs — aimed squarely at students from countries like ours.",
    unique:
      "The Global Korea Scholarship covers a Korean-language year, full tuition, a monthly stipend, flights and insurance. Complete funding of this kind, open to Central Asian applicants, is close to unique.",
    fields: [
      "engineering",
      "computer_science",
      "arts_design",
      "business_economics",
      "natural_sciences",
    ],
    hubs: ["seoul"],
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
      "Academic pressure is extreme and starts long before university — you are entering an environment built on it.",
      "Long-term residence routes exist but are narrower than Canada's or Germany's.",
    ],
    money:
      "With GKS, essentially covered. Without it, tuition is moderate and universities offer partial scholarships, but living in Seoul is not cheap.",
    admissions:
      "Grades, language proficiency (TOPIK for Korean-taught programmes, English tests otherwise) and, for GKS, a competitive national selection through the Korean embassy — apply through the embassy track, and start a year early.",
    afterStudy:
      "Graduates can move to a job-seeking visa and then to work sponsorship. Language level is the practical gate, more than the paperwork. Compass models Korean admissions, including the language requirement.",
    suitsYou:
      "You want a fully funded degree, you are genuinely willing to learn a hard language, and engineering, tech or the creative industries are your direction.",
    notForYou:
      "You are not prepared to study Korean seriously. Without it this becomes an expensive, isolating four years.",
    modelled: true,
  },
  {
    id: "uae",
    name: "United Arab Emirates",
    where: "The Gulf — Dubai and Abu Dhabi, three hours from Central Asia",
    oneLine:
      "Western universities' campuses and a tax-free job market, close to home — with residence tied to your employer.",
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
      "Residence is tied to your employer — losing the job starts a countdown to leaving the country.",
      "Living costs, especially housing and schooling, are high and rising.",
      "There is no route to citizenship and only a narrow one to long-term residence: this is a place to work, not usually to settle permanently.",
      "Summer heat makes months of the year genuinely difficult, and outdoor life stops.",
      "Social and legal norms differ sharply from Europe; the rules are enforced and worth reading before you go.",
      "Outside a few institutions, research depth is thin — a PhD ambition is better served elsewhere.",
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
    modelled: true,
  },
  {
    id: "switzerland",
    name: "Switzerland",
    where: "Central Europe — Zurich, Lausanne, Geneva",
    oneLine:
      "World-class research at low tuition, gated by the hardest admission and the highest cost of living in Europe.",
    unique:
      "ETH Zurich and EPFL charge among the lowest tuition of any top-tier research university on earth — the wall here is entrance and living costs, not fees.",
    fields: ["computer_science", "engineering", "natural_sciences", "business_economics"],
    hubs: ["zurich"],
    strengths: [
      "Tuition at the federal institutes is a fraction of what comparable universities charge internationals.",
      "Research funding per student is exceptional, and PhD positions are salaried jobs with real wages.",
      "Deep tech, pharmaceuticals and quantitative finance all hire locally at very high salaries.",
      "Central location in Europe with infrastructure that simply works.",
      "Graduate salaries are the highest in Europe by a distance.",
    ],
    tradeoffs: [
      "Cost of living is the highest in Europe — rent alone can exceed a full year's tuition elsewhere.",
      "Bachelor's teaching is often in German or French; the English offering is mostly at master's level.",
      "First-year attrition at the federal institutes is deliberately high: getting in is not staying in.",
      "Non-EU work permits are quota-limited, so staying after graduation is competitive even with an offer.",
      "Housing near the universities is scarce and expensive enough to determine where you can study.",
    ],
    money:
      "Low tuition, extreme living costs. Budget for the city, not for the university — that inversion catches families out.",
    admissions:
      "Direct admission for internationals is restrictive; many applicants need a recognised qualification plus an entrance examination. Master's entry is easier for a strong bachelor's graduate.",
    afterStudy:
      "Six months to look for work after graduation, then an employer-sponsored permit subject to quotas for non-EU nationals.",
    suitsYou:
      "You are academically exceptional, you can cover living costs, and research or deep tech is genuinely what you want.",
    notForYou:
      "Your budget is tight, or you need an English-taught bachelor's. Both make this the wrong door.",
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
 * as an ordinary case, not an error — a city without a full country write-up is
 * still a real place a student can work in, and Almaty is the proof.
 */
export function destinationForHub(hubId: string): StudyDestination | undefined {
  return STUDY_DESTINATIONS.find((d) => d.hubs.includes(hubId));
}

/** Profiles matching any of the chosen fields; empty in ⇒ all of them. */
export function destinationsForFaculties(
  faculties: FacultyValue[],
): StudyDestination[] {
  if (faculties.length === 0) return STUDY_DESTINATIONS;
  return STUDY_DESTINATIONS.filter((d) =>
    d.fields.some((f) => faculties.includes(f)),
  );
}
