import type { FacultyValue } from "@/lib/data/faculties";

// WHAT YOU ACTUALLY APPLY TO.
//
// The guide could say what kinds of work exist, which countries host them and
// which cities inside those countries — and never once named the thing a
// student fills in on a form. A field of study is eight buckets; an area of work
// is a sphere; the MAJOR is the row on the application, and it was missing from
// the chain entirely. "What major do you want to study?" was an 80-character
// free-text box asked of people who came to us precisely because they cannot
// answer it.
//
// FOUR RULES, and three of the fields exist because nobody writes them down:
//
// 1. **`alsoCalled` is mandatory wherever the name is not self-evident.** One
//    subject is taught under three names across the countries we profile, and a
//    student who does not know that cannot tell they are looking at the same
//    door twice.
// 2. **`firstYear` says what the first year is REALLY made of** — not "you will
//    study the foundations". The first year is where people leave, and the
//    reason they leave is almost never the reason the prospectus implies.
// 3. **`schoolSubjects` is the only thing on the page that can be started
//    today.** Everything else here is about a decision years away; this is an
//    action available this afternoon.
// 4. **`catch` and `notForYou` are mandatory**, the same rule cities, countries
//    and areas of work are already held to. A layer with no catch is a brochure,
//    and a unit test enforces both halves.
//
// No prices, no salaries, no rankings, no URLs — same reasons as `world.ts` and
// `careers.ts`. Figures rot within a year; shape does not. Prose, and server-only
// in practice: import labels through a thin module if a client ever needs them,
// the way `career-titles.ts` serves the interest quiz.

export type Major = {
  /** The URL slug, and the second half of a `major:` plan pick ref. */
  id: string;
  name: string;
  /**
   * The other names this same subject is taught under. Mandatory wherever the
   * name is not self-evident — a student who does not know that "informatics"
   * and "computer science" are one door cannot see that they already found it.
   */
  alsoCalled: string[];
  /** One sentence, no jargon. What the subject IS, not what it leads to. */
  whatItActuallyIs: string;
  /**
   * What the first year is actually made of, and what makes people leave in it.
   * The single most useful paragraph on the page, and the one no prospectus
   * contains.
   */
  firstYear: string;
  /** The honest cost. Mandatory. Not "it is hard" — the specific thing. */
  catch: string;
  /** Who this suits, addressed to the reader, specific enough to recognise. */
  suitsYou: string;
  /** Who should look elsewhere, and ideally where. Mandatory. */
  notForYou: string;
  /**
   * School subjects that actually matter for admission and for surviving year
   * one. The only actionable thing on the page.
   */
  schoolSubjects: string[];
  /**
   * An honest hard exclusion, or null. "Without strong mathematics this door is
   * shut" is kinder said now than discovered in year one.
   */
  hardGate: string | null;
  /** Areas of work this opens, by `areaSlug`. Every one must resolve. */
  leadsTo: string[];
  /** The fields this sits under — the join to countries, cities and the catalog. */
  fields: FacultyValue[];
};

export const MAJORS: Major[] = [
  {
    id: "computer-science",
    name: "Computer science",
    alsoCalled: [
      "Informatics",
      "Computing",
      "CS",
      "Applied mathematics and informatics",
    ],
    whatItActuallyIs:
      "The study of what can be computed and how — algorithms, data, languages and machines — rather than training in any particular programming tool.",
    firstYear:
      "Discrete mathematics, proofs and one or two programming languages taught from the ground up, and it is the mathematics rather than the programming that thins the year out. Most people arrive able to write code and discover that the course is not about writing code; the ones who leave usually leave because nobody warned them that a term of induction proofs and asymptotic analysis comes before anything that looks like an app.",
    catch:
      "The gap between the degree and the job is wider than in almost any other subject: a graduate who has never built anything outside coursework competes badly against one who has, and the course does not require you to build anything outside coursework. The work of becoming employable happens in your own time, alongside the degree, and nobody makes you do it.",
    suitsYou:
      "You are willing to be a beginner at mathematics again for a year, and you already build things nobody asked you to build. You would rather understand why a method works than collect a list of tools that currently work.",
    notForYou:
      "You want to make software and have no appetite for the theory underneath it. Software engineering and information systems degrees reach the same jobs with far less proof-writing, and in several of the countries we profile they are the more direct route into a first role.",
    schoolSubjects: ["Mathematics", "Physics or informatics", "English"],
    hardGate:
      "Strong mathematics is not optional here. Every country we profile screens on it, and the first year assumes it.",
    leadsTo: [
      "building-software-and-products",
      "data-and-ai",
      "security-and-systems",
    ],
    fields: ["computer_science"],
  },
  {
    id: "civil-engineering",
    name: "Civil engineering",
    alsoCalled: ["Structural engineering", "Construction engineering"],
    whatItActuallyIs:
      "Designing and building the things a place is made of — bridges, water systems, roads, foundations — and proving they will stand up before anyone builds them.",
    firstYear:
      "Statics, materials and a great deal of drawing, taught alongside the mathematics that supports them. The surprise is how much of the year is spent on things that do not move: understanding how a load travels through a structure standing still is the whole foundation, and it is far less immediately satisfying than the buildings that attracted people to the subject.",
    catch:
      "The profession is licensed almost everywhere, and a licence earned in one country frequently does not travel. That makes this one of the few subjects where the country you study in largely decides the country you can practise in — a constraint most students meet years too late to act on.",
    suitsYou:
      "You want the thing you worked on to exist physically and outlast you, and you can accept that a career is measured in projects that take years rather than in releases that take weeks.",
    notForYou:
      "You expect to move country freely after graduating. Licensing rarely transfers, and if mobility matters more to you than the built environment does, software, data or general mechanical work will not fence you in the same way.",
    schoolSubjects: ["Mathematics", "Physics"],
    hardGate: null,
    leadsTo: ["building-and-infrastructure", "machines-and-manufacturing"],
    fields: ["engineering"],
  },
  {
    id: "mechanical-engineering",
    name: "Mechanical engineering",
    alsoCalled: [
      "Mechanical and manufacturing engineering",
      "Mechanical and aerospace engineering",
    ],
    whatItActuallyIs:
      "Designing physical things that move or carry load — engines, machines, vehicles, the equipment inside a factory — and proving on paper that they will work before anyone builds them.",
    firstYear:
      "Statics, dynamics and thermodynamics taught through problem sets that take hours each, alongside a technical-drawing course that feels beneath a subject people chose for engines and robots. The students who leave are usually the ones who wanted to build something immediately and instead spent two semesters proving that a motionless beam does not move, before being trusted near anything that does.",
    catch:
      "The design work most students imagine — inventing new machines — is a small fraction of the actual jobs; most mechanical engineers spend careers making an existing product a little lighter, cheaper or more reliable, and manufacturing employers cluster around industrial regions rather than capital cities, which narrows where the work actually is.",
    suitsYou:
      "You get real satisfaction from making something that already works slightly better rather than inventing something new every year, and an industrial town rather than a capital city sounds like a fine place to build a career.",
    notForYou:
      "You want to see the effect of your work within weeks rather than years, or you specifically want to be based in a capital city — software or product design change on a much faster cycle and are not tied to wherever the factories are.",
    schoolSubjects: ["Mathematics", "Physics"],
    hardGate: null,
    leadsTo: ["machines-and-manufacturing", "aerospace-and-space"],
    fields: ["engineering"],
  },
  {
    id: "electrical-engineering",
    name: "Electrical engineering",
    alsoCalled: [
      "Electrical and electronic engineering",
      "Electronics engineering",
      "Power engineering",
    ],
    whatItActuallyIs:
      "Working with electricity itself — circuits, signals, power systems and the chips everything else runs on — the discipline underneath every device that plugs in or carries a battery.",
    firstYear:
      "Circuit theory and electromagnetism taught mathematically, well before you are let near a real board, so the first year reads closer to applied physics than to the soldering and building most people expected. What actually thins the class out is discovering that the mathematics does not stop after year one the way it does on some other engineering routes — it runs through the whole degree, and people who tolerated it rather than liked it tend to leave first.",
    catch:
      "The feedback loop is slow and expensive next to software: a mistake in a circuit means a redesign and a wait for new hardware to arrive, not a same-day fix. The most advanced work — chip design especially — is also concentrated in a small number of places in the world, so reaching it can mean relocating rather than choosing where to live.",
    suitsYou:
      "You are genuinely at ease with mathematics that never really lets up after year one, you enjoy reasoning about a system through instruments rather than by looking straight at it, and slow, expensive iteration does not wear you down the way it might in software.",
    notForYou:
      "You want to see a change working the same day you make it. Every mistake here costs a hardware redesign and a wait, which is the opposite of software's iteration speed — building software or working in data gives you a feedback loop this field cannot structurally offer.",
    schoolSubjects: ["Mathematics", "Physics"],
    hardGate:
      "This is the most continuously mathematical of the engineering degrees: circuit and field theory lean on calculus every term, not only the first one, and there is no later specialisation that lets you leave the mathematics behind.",
    leadsTo: ["electronics-energy-and-hardware", "building-software-and-products"],
    fields: ["engineering"],
  },
  {
    id: "chemical-engineering",
    name: "Chemical engineering",
    alsoCalled: ["Chemical and process engineering", "Process engineering"],
    whatItActuallyIs:
      "Designing the industrial-scale processes that turn raw materials into fuel, medicine, plastic and almost everything else manufactured in bulk — chemistry, built at the scale of a factory rather than a beaker.",
    firstYear:
      "Chemistry, thermodynamics and fluid mechanics taught together, and the shock for most students is how much of it is mathematics applied to chemistry rather than chemistry itself — mass and energy balances, reactor equations, problem sets closer to physics homework than a lab notebook. Students who chose this for the laboratory side and find they dislike the constant calculation are the ones who tend to leave first.",
    catch:
      "Much of the industry is process-heavy and safety-critical, which makes it move slowly and conservatively by design, and the largest employers cluster around specific industries — energy, chemicals, pharmaceuticals — so a career here can end up geographically tied to wherever those plants actually are.",
    suitsYou:
      "You like chemistry but are just as comfortable doing sustained mathematics with it, and spending a career inside one or two industrial sectors, rather than moving between very different employers, sounds acceptable rather than confining.",
    notForYou:
      "You want the hands-on laboratory side of chemistry without the constant calculation, or you want the freedom to work in almost any industry or city. A straight chemistry degree keeps the lab work without the process mathematics, and it travels to far more kinds of employer.",
    schoolSubjects: ["Chemistry", "Mathematics", "Physics"],
    hardGate:
      "Without genuine strength in both chemistry and mathematics together this major does not work — one alone is not enough, because every course fuses them from the first term.",
    leadsTo: ["applied-science-and-industry", "environment-and-climate"],
    fields: ["engineering"],
  },
  {
    id: "software-engineering",
    name: "Software engineering",
    alsoCalled: ["Software development", "Applied computer science"],
    whatItActuallyIs:
      "Building and maintaining working software as part of a team, on a deadline, to a specification someone else can still change halfway through — the discipline around writing code, not only the writing of it.",
    firstYear:
      "Group projects, version control and a language chosen for its industry use rather than its elegance, plus enough software-engineering theory — testing, requirements, project process — that it can feel like a detour from actual coding. The students who leave are usually the ones who wanted computer science's proofs or a purely hands-on bootcamp and got neither: this sits deliberately between the two, and that middle ground disappoints anyone who wanted an extreme.",
    catch:
      "It is computer science with the theory sanded down, which is exactly its strength and its risk: an employer who wants deep algorithmic knowledge will still prefer a computer science graduate, and this degree's practical framing dates faster than computer science's mathematical core does, so you retrain more often over a career.",
    suitsYou:
      "You want to build real, deployed things in a team from year one rather than prove theorems about them, and you would rather learn one process well — version control, code review, testing — than sample every corner of theoretical computer science.",
    notForYou:
      "You want the deepest possible grounding in algorithms and theory, or you plan a research higher degree afterward. Computer science gives you that foundation directly, and this degree will feel like it skipped a step you actually needed.",
    schoolSubjects: ["Mathematics", "Informatics or computing", "English"],
    hardGate: null,
    leadsTo: ["building-software-and-products", "games-and-interactive"],
    fields: ["computer_science"],
  },
  {
    id: "data-science",
    name: "Data science",
    alsoCalled: [
      "Data analytics",
      "Statistics and data science",
      "Business analytics",
    ],
    whatItActuallyIs:
      "Turning large, messy datasets into numbers an organisation can actually decide something from — statistics and programming plus enough domain sense to know when a result is nonsense.",
    firstYear:
      "Probability, statistics and programming taught in parallel, usually well before you are handed a dataset that resembles the incomplete, inconsistent kind you were promised. The people who leave are almost always the ones who came for the modelling and found instead that the first year is mostly proving why a method works — closer to a mathematics degree than the job postings suggested.",
    catch:
      "The job most people picture — building clever models — is a small fraction of the actual work, which is finding data, discovering it lies, and cleaning it into something a model can use. The specific tools you learn now will also be replaced more than once before you retire, so the statistics underneath them is the one part that keeps its value.",
    suitsYou:
      "You care more about whether a number is actually true than whether the method that produced it is fashionable, and you have the patience to spend most of a project on data that is incomplete or simply wrong before you get to model anything at all.",
    notForYou:
      "You pictured mostly building models and would resent spending most projects cleaning data instead. A straight computer science or statistics degree, with the applied side learned on the job afterward, suits that expectation better than a degree built around this compromise from day one.",
    schoolSubjects: ["Mathematics", "Statistics or informatics", "English"],
    hardGate:
      "Without genuine comfort in statistics and probability this major will not click — every course after the first term assumes it, and there is no track here that lets you avoid it.",
    leadsTo: ["data-and-ai", "money-and-markets"],
    fields: ["computer_science", "business_economics"],
  },
  {
    id: "cybersecurity",
    name: "Cybersecurity",
    alsoCalled: [
      "Information security",
      "Cyber operations",
      "Information assurance",
    ],
    whatItActuallyIs:
      "Learning how computer systems actually fail and get broken into, so you can be the person who finds the hole before someone with worse intentions does.",
    firstYear:
      "Networking and operating-systems fundamentals first, because you cannot secure a system you do not understand, and this is where the year is genuinely slow: weeks of protocols and permissions before anything resembles the offensive side that drew people to the subject. Students who leave are usually the ones who expected to spend the year attacking things and instead spent it learning how ordinary systems are supposed to behave.",
    catch:
      "Most real work is defensive, procedural and thankless — configuration, patching, log review — and the visible, offensive side people picture from films is a smaller slice of the field than it looks from outside. The incident-driven parts of the job also run on the attacker's schedule, not yours.",
    suitsYou:
      "You find it satisfying to establish exactly how a system failed rather than only that it did, you can sit with unglamorous configuration work for long stretches, and you would rather be the person quietly keeping something safe than the one publicly building it.",
    notForYou:
      "You are drawn only to the offensive, film-style hacking half and have little patience for defensive hygiene work. That half exists here but is a minority of the jobs — a general computer science or software engineering degree with a later security specialisation keeps more doors open than committing this early.",
    schoolSubjects: ["Mathematics", "Informatics or computing", "English"],
    hardGate: null,
    leadsTo: ["security-and-systems", "building-software-and-products"],
    fields: ["computer_science"],
  },
  {
    id: "business-management",
    name: "Business management",
    alsoCalled: ["Business administration", "Management studies"],
    whatItActuallyIs:
      "A broad, generalist degree in how organisations actually run — people, operations, money and strategy together — built for working across a business rather than mastering one function of it.",
    firstYear:
      "An introduction to accounting, economics, marketing and organisational behaviour side by side, none of them in much depth, which is exactly the shape of the degree and exactly what disappoints some students. The ones who leave are usually the ones who wanted to go deep into one subject — finance, or psychology, or economics — and found a survey course in each instead of mastery of any one.",
    catch:
      "Breadth is the whole design and also the risk: a specialist employer will often prefer someone with a focused finance, economics or engineering degree over a generalist one, so the degree carries weight only alongside proof from outside the classroom — an internship, a small venture, a real leadership role — that the transcript alone cannot supply.",
    suitsYou:
      "You are drawn to how a whole organisation fits together rather than to one function inside it, and you are willing to build evidence of your ability outside the classroom, because the degree by itself will not carry the argument for you.",
    notForYou:
      "You already know you want to go deep in one area — money, people, strategy, the numbers — rather than see all of them broadly. A focused finance, economics or psychology degree gets you there faster and reads as more deliberate to a specialist employer.",
    schoolSubjects: ["Mathematics", "Economics or business studies", "English"],
    hardGate: null,
    leadsTo: ["starting-and-running-a-business", "strategy-and-consulting"],
    fields: ["business_economics"],
  },
  {
    id: "economics",
    name: "Economics",
    alsoCalled: ["Economic theory", "Political economy"],
    whatItActuallyIs:
      "The study of how people, firms and governments respond to limited resources and to each other's decisions — a mathematical social science, closer in method to applied maths than to business.",
    firstYear:
      "Microeconomics and macroeconomics built up from graphs into algebra and then calculus, fast, on the assumption you can keep pace — and for a subject many arrive at expecting current-affairs discussion, the actual first year reads closer to a mathematics course with an economic vocabulary attached. Students who leave are usually the ones who came for the ideas and were not ready for how quantitative the method turns out to be.",
    catch:
      "The influence of the work is slow and indirect: a correct piece of analysis can sit unused for years, because the decision it informs belongs to politics rather than to evidence. The most competitive, well-regarded roles — central banks, international institutions — are also genuinely hard to reach and generally expect a further degree past the bachelor's.",
    suitsYou:
      "You would rather understand why people and markets behave the way they do than simply hold an opinion about it, you are comfortable with the subject being taught mathematically almost from day one, and you can accept being right without seeing anything change for years.",
    notForYou:
      "You want to see the practical effect of your work quickly, or you are choosing this expecting current-affairs debate rather than mathematics. A business or policy-focused degree gives you a faster feedback loop, and this one is more quantitative from the first term than most people expect.",
    schoolSubjects: ["Mathematics", "Economics", "English"],
    hardGate:
      "Modern economics is quantitative from the first term; without real comfort in algebra and statistics the degree becomes a struggle to translate rather than to understand.",
    leadsTo: ["economics-and-policy", "money-and-markets"],
    fields: ["business_economics"],
  },
  {
    id: "finance",
    name: "Finance",
    alsoCalled: ["Finance and accounting", "Financial economics"],
    whatItActuallyIs:
      "The study of how money is valued, moved and risked — pricing a company, managing a portfolio, deciding what a future payment is actually worth today.",
    firstYear:
      "Accounting fundamentals and the mathematics of valuation and interest, taught through problem sets you either get exactly right or clearly wrong — there is little partial credit in a discipline built on numbers matching. Students who leave are usually the ones who wanted the analytical, decision-making side and did not expect how much of the early degree is precise, repetitive calculation before any real judgement is asked of you.",
    catch:
      "Entry-level hours in the most sought-after corners of the industry are genuinely long — evenings and weekends as the norm rather than the exception — and the field is cyclical, among the first to cut junior hiring when markets turn, while routine analysis is steadily being automated out of the entry-level job altogether.",
    suitsYou:
      "You are precise rather than approximate by nature, comfortable defending a numerical assumption under pressure, and willing to trade a demanding few early years for the analytical work this degree eventually leads to.",
    notForYou:
      "You want predictable hours early in your career, or steady demand regardless of the economic cycle. This sector cuts junior roles first in a downturn and treats long entry-level hours as standard — economics or business management reach adjacent work with a gentler entry.",
    schoolSubjects: ["Mathematics", "Economics or business studies", "English"],
    hardGate:
      "Without fast, accurate, comfortable mathematics this major is a permanent uphill climb — the entry-level work is measured on exactly that, before any strategic judgement is ever asked of you.",
    leadsTo: ["money-and-markets", "strategy-and-consulting"],
    fields: ["business_economics"],
  },
  {
    id: "marketing",
    name: "Marketing",
    alsoCalled: ["Marketing and communications", "Marketing management"],
    whatItActuallyIs:
      "Studying how people actually decide to notice, trust and choose something — research, psychology and communication applied to putting a product or an idea in front of the right person.",
    firstYear:
      "Consumer behaviour and research methods before anything creative — surveys, statistics on why people bought or did not, and a great deal of writing, which surprises students who arrived expecting to design campaigns from week one. The ones who leave are usually the ones who wanted the creative, visual side and discovered how much of the degree is research method and written analysis instead.",
    catch:
      "You are measured constantly and publicly by numbers that are often outside your control — a platform changes its rules overnight and the results move without you having done anything wrong — and marketing is typically the function cut first when an organisation tightens its spending.",
    suitsYou:
      "You can treat a disappointing result as information rather than as a verdict on you personally, you write constantly without minding it, and you would rather understand one audience deeply than chase the next clever idea.",
    notForYou:
      "You are drawn only to the visual, creative side and have little interest in research, statistics or writing. A design degree gets you closer to that specific work, since this degree spends more of its time on method and analysis than on the creative output itself.",
    schoolSubjects: ["Mathematics", "Economics or business studies", "English"],
    hardGate: null,
    leadsTo: ["marketing-and-growth", "words-and-media"],
    fields: ["business_economics"],
  },
  // ── Twelve so far, across engineering, computer_science and
  // business_economics. Waves A1b (sciences & medicine), A1c (humanities &
  // law) and A1d (arts, plus the reverse-edge test) add the rest, to at least
  // 44 total — spread so every one of the eight faculties has majors and every
  // area of work in careers.ts is reachable from at least one major.
  //
  // Add new entries above this comment, in the same style:
  //   * `firstYear` > 120 characters, and it must name what makes people leave.
  //   * `catch` > 100, `suitsYou` > 100, `notForYou` > 140 characters, and
  //     `notForYou` must name where to go instead.
  //   * `catch` and `notForYou` must stay DISTINCT across the whole registry —
  //     at scale, one pasted sentence is exactly the kind of thing nobody
  //     notices without a test.
  //   * No prices, salaries, rankings, superlatives or URLs, anywhere.
  //   * Every `leadsTo` slug must resolve against `areaSlug` in careers.ts.
  //     `npm run test:unit` names the ones that don't.
];

/** One major by id. Undefined for anything unknown. */
export function majorById(id: string): Major | undefined {
  return MAJORS.find((m) => m.id === id);
}

/**
 * Majors under the chosen fields. **Empty in ⇒ all of them**, the same rule
 * `hubsForFaculties` follows and the same rule the catalog follows: an unstated
 * fact widens the list, it never empties it.
 */
export function majorsForFaculties(faculties: FacultyValue[]): Major[] {
  if (faculties.length === 0) return MAJORS;
  return MAJORS.filter((m) => m.fields.some((f) => faculties.includes(f)));
}

/**
 * The same list grouped by field, in the order the fields were given, empties
 * dropped. Grouping is how the list page stays readable at fifty entries.
 */
export function majorsByField(
  faculties: FacultyValue[],
): { faculty: FacultyValue; majors: Major[] }[] {
  const source = faculties.length > 0 ? faculties : uniqueFields();
  return source
    .map((faculty) => ({
      faculty,
      majors: MAJORS.filter((m) => m.fields.includes(faculty)),
    }))
    .filter((g) => g.majors.length > 0);
}

/** Every field that at least one major sits under, in registry order. */
function uniqueFields(): FacultyValue[] {
  const seen: FacultyValue[] = [];
  for (const m of MAJORS) {
    for (const f of m.fields) if (!seen.includes(f)) seen.push(f);
  }
  return seen;
}

/**
 * The majors that open one area of work — the reverse edge, and the reason the
 * chain is walkable in both directions. A student who knows what they want to
 * DO can find what to study; a student who was handed a subject can find out
 * what it leads to.
 */
export function majorsForArea(slug: string): Major[] {
  return MAJORS.filter((m) => m.leadsTo.includes(slug));
}
