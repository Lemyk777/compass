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
  {
    id: "biology",
    name: "Biology",
    alsoCalled: ["Biological Sciences", "Life Sciences"],
    whatItActuallyIs:
      "The systematic study of living things, from the molecules inside a single cell up to whole ecosystems, and the evidence used to prove a claim about any of them.",
    firstYear:
      "The volume of material, not its difficulty, is the actual shock: taxonomy, biochemistry, cell processes and physiology all arrive in the same term, each in its own vocabulary, well before any of them connect into one coherent picture. A statistics and genetics strand running alongside adds a second, more mathematical register that catches out people who chose biology specifically to leave equations behind, and it is that unexpected mathematics, more than the sheer memorising, that thins the class by the end of the year.",
    catch:
      "A bachelor's alone opens comparatively few of the specifically 'biologist' roles advertised — most research and specialist laboratory jobs expect a master's or a PhD on top, so the degree functions as a foundation rather than a finished qualification, and that extra stage costs years most applicants have not budgeted for.",
    suitsYou:
      "You would rather learn the actual mechanism behind a living process than accept the summary version, and treating a master's or further study as the real starting point of a career, not a costly extra, does not put you off.",
    notForYou:
      "You expect a bachelor's alone to open specialist biology jobs directly. Most research and technical roles expect a master's or PhD on top of it, so if you want a degree that stands alone at the end of four years, engineering or computer science reach paid, specific work faster.",
    schoolSubjects: ["Biology", "Chemistry", "Mathematics or statistics"],
    hardGate:
      "Most programmes assume chemistry alongside biology at school; biology on its own, with no chemistry at all, is a weak application almost everywhere we cover.",
    leadsTo: ["research-and-discovery", "environment-and-climate", "research-and-new-treatments"],
    fields: ["natural_sciences"],
  },
  {
    id: "chemistry",
    name: "Chemistry",
    alsoCalled: ["Chemical Sciences"],
    whatItActuallyIs:
      "The study of matter itself — what substances are made of, how they react, and how to predict and control that reaction rather than only observe it.",
    firstYear:
      "Three chemistries — organic, inorganic and physical — run in parallel from week one, each with its own logic and its own problem sets, and the physical strand is closer to applied mathematics than most applicants expect from a subject they associate with a lab coat. Laboratory sessions are graded on technique as strictly as exams are graded on answers, so a result that looks right but was reached the wrong way still loses marks. People who came only for the bench work, and treat the mathematical strand as a footnote, find the year genuinely difficult; the ones prepared to take all three chemistries equally seriously get through it.",
    catch:
      "Laboratory sessions carry real chemical hazard and a rigid safety culture that some students find stifling after school science, and the specific analytical instruments you spend years learning to operate are steadily replaced across a career, so what an employer wants you to already know keeps changing after you graduate.",
    suitsYou:
      "You like precise, repeatable practical work as much as the theory that explains it, and you are comfortable knowing the specific instruments and techniques you train on now will not be the ones you use in ten years.",
    notForYou:
      "You want mostly outdoor or field-based science rather than a bench and a fume hood. Environmental science or geology spend far more of their time outside a laboratory and answer that instinct far more directly than this degree does.",
    schoolSubjects: ["Chemistry", "Mathematics", "Physics"],
    hardGate:
      "Mathematics matters here more than most applicants expect, particularly for the physical strand, but it is chemistry itself that every programme treats as the non-negotiable foundation — weak school chemistry is the harder gap to arrive with.",
    leadsTo: ["applied-science-and-industry", "research-and-discovery", "research-and-new-treatments"],
    fields: ["natural_sciences"],
  },
  {
    id: "physics",
    name: "Physics",
    alsoCalled: ["Physical Sciences"],
    whatItActuallyIs:
      "Working out the rules that govern matter and energy at every scale, from subatomic particles to galaxies, and expressing those rules in mathematics precise enough to predict what happens next.",
    firstYear:
      "What surprises almost everyone who enjoyed physics at school is how much of the first term is spent setting the subject's familiar results aside and rebuilding them from mathematical first principles, in a far more formal language than school ever used. Practical sessions exist, but they are a small fraction of the timetable next to problem sheets, and it is that rebuilding from scratch — reproving things you already believed — that some people never quite forgive the course for.",
    catch:
      "Undergraduate physics trains people for research roles that do not exist in anything like the numbers graduates are produced in, so most physics graduates end up in finance, data or engineering work that values the mathematics without ever using most of the physics itself again.",
    suitsYou:
      "You want to understand a system from first principles rather than borrow a result someone else derived, and you are genuinely at ease knowing the mathematics you love may end up applied somewhere other than physics itself.",
    notForYou:
      "You need to see your work matter to somebody immediately. Physics trains you thoroughly and then routes most graduates into finance, data or engineering roles instead of physics itself — mathematics or data science name that destination honestly from the start instead of arriving at it by accident.",
    schoolSubjects: ["Physics", "Mathematics"],
    hardGate:
      "Mathematics is not a supporting subject here, it is half the degree; without genuine comfort in calculus by the start of term one, physics stops feeling like physics and becomes an ongoing mathematics catch-up.",
    leadsTo: ["space-and-the-universe", "research-and-discovery", "electronics-energy-and-hardware"],
    fields: ["natural_sciences"],
  },
  {
    id: "mathematics",
    name: "Mathematics",
    alsoCalled: ["Mathematical Sciences", "Pure and Applied Mathematics"],
    whatItActuallyIs:
      "The study of structure, quantity and proof for their own sake — not applying known formulas, but establishing which statements are actually true, and why.",
    firstYear:
      "This is not school mathematics done faster; it is a change of subject. Proof, not calculation, becomes the actual skill being assessed, so a student who was reliably fast and accurate at school can find themselves genuinely stuck on a two-line argument that involves no arithmetic at all, often for the first time in their life. That specific, disorienting experience, arriving after years of being good at the subject, is closer to the real content of the first year than any topic on the syllabus.",
    catch:
      "The degree gives almost no direct professional identity of its own — nobody is hired as 'a mathematician' the way they are hired as an engineer — so every graduate has to translate proof-based training into a field that will actually employ them, and that translation is left entirely to you.",
    suitsYou:
      "You find a two-line proof more satisfying than a page of correct calculation, and not yet knowing which career the degree points toward worries you far less than it would worry most people.",
    notForYou:
      "You want your degree to point at one obvious job on the far side of it. Mathematics gives you almost no professional identity of its own and leaves the translation into a career entirely to you — computer science or engineering apply the same reasoning inside a named destination instead.",
    schoolSubjects: ["Mathematics", "Further mathematics where offered"],
    hardGate:
      "There is no track through this degree that avoids proof-based reasoning — a student who is fast and accurate at calculation but has never had to construct a rigorous argument should expect the hardest adjustment of any subject on this list.",
    leadsTo: ["data-and-ai", "research-and-discovery", "money-and-markets"],
    fields: ["natural_sciences"],
  },
  {
    id: "environmental-science",
    name: "Environmental science",
    alsoCalled: ["Environmental Studies", "Earth and Environmental Science"],
    whatItActuallyIs:
      "Studying how the natural world actually functions — air, water, soil and the life inside them — closely enough to measure what is changing and why.",
    firstYear:
      "Weeks of fieldwork — soil samples, water tests, species counts taken in whatever weather turns up — alternate with weeks spent entirely at a desk turning that data into statistics and a written report to a strict format. Most applicants picture the first kind of week and not the second, and the class quietly thins once it becomes clear the desk work is at least as large a share of the mark, and graded just as rigorously.",
    catch:
      "Fieldwork is genuinely seasonal and physically demanding — early starts, bad weather, remote sites — and a persistent share of the paid work sits inside monitoring and compliance for the same industries the subject is popularly imagined to challenge, which some graduates find sits uneasily with why they chose it.",
    suitsYou:
      "You are equally content collecting a water sample in bad weather and writing up afterward what it does and does not prove, and you can stay professionally neutral even when your own data says something inconvenient.",
    notForYou:
      "You pictured this as advocacy or campaigning work. Most paid roles sit inside consultancy for the construction, mining or energy industries this subject is popularly imagined to oppose — politics, policy and the world is the more direct route to campaigning itself.",
    schoolSubjects: ["Biology", "Chemistry or geography", "Mathematics or statistics"],
    hardGate: null,
    leadsTo: ["environment-and-climate", "applied-science-and-industry", "health-of-whole-populations"],
    fields: ["natural_sciences"],
  },
  {
    id: "geology",
    name: "Geology",
    alsoCalled: ["Earth Science", "Geoscience", "Earth and Planetary Sciences"],
    whatItActuallyIs:
      "Reading the physical history and structure of the earth from what rock, sediment and landscape actually show, and using that to explain, predict or find what lies beneath the surface.",
    firstYear:
      "A residential field course — a week or two camped near an outcrop with a hammer, a hand lens and a notebook, in whatever weather the location provides — is compulsory and formally assessed, unlike almost anything else at school. It functions as the subject's real entrance exam: the mapping exercises and structural mathematics that follow in the lecture halls are far easier to sit through once you already know the trips themselves do not put you off.",
    catch:
      "Compulsory residential field courses run on the department's calendar, not yours, sometimes for weeks at a time and sometimes abroad, and the largest employers of the discipline remain the mining and oil and gas industries, which many applicants have not pictured themselves working inside.",
    suitsYou:
      "You want a science that gets you physically outdoors reading a real landscape rather than only a screen, and weeks away on a field course sound like the appealing part of the degree rather than the cost of it.",
    notForYou:
      "You want to work close to home in a capital city. The largest employers — mining, oil and gas exploration — operate wherever the resource actually is, rarely a capital, and civil engineering keeps more of earth science's physical, structural interest while staying closer to cities.",
    schoolSubjects: ["Chemistry or physics", "Mathematics", "Geography where offered"],
    hardGate: null,
    leadsTo: ["applied-science-and-industry", "environment-and-climate", "building-and-infrastructure"],
    fields: ["natural_sciences"],
  },
  {
    id: "medicine",
    name: "Medicine",
    alsoCalled: ["Medical Studies", "MBBS", "MBChB"],
    whatItActuallyIs:
      "Training to diagnose and treat illness in real patients, under supervision from the first clinical placement onward, on a course built around a licence to practise rather than around a subject in the ordinary sense.",
    firstYear:
      "Because the course exists to produce a licensed clinician rather than to explore a subject, almost nothing in the first year is optional: anatomy, physiology and biochemistry are set, sequenced and compulsory, at a pace and volume closer to professional training than to a typical undergraduate timetable, with far less choice in what you study than friends on almost any other course have. What actually surprises people, despite that intensity, is how little contact with an actual patient the first year contains — the clinical exposure most applicants pictured on the way in arrives later, once the science underneath it is judged solid enough to build on.",
    catch:
      "The training does not end at graduation — a further supervised, examined stretch of years follows before independent practice, in every country we profile — and international students should expect that a qualification earned here rarely transfers cleanly to another country without further exams.",
    suitsYou:
      "You can make a decision on incomplete information and live with having made it, you can deliver news someone does not want to hear without flinching from it, and a decade of training with exams continuing past graduation is a timeline you have actually looked at rather than assumed away.",
    notForYou:
      "You are choosing this without having checked how your target country's licensing actually works, or you assumed a degree from one country transfers cleanly into practising in another. It rarely does — verify the exact ladder for your target country before committing a decade, and if hands-on care without that licensing weight is really what draws you, nursing reaches patients directly in far less time.",
    schoolSubjects: ["Biology", "Chemistry", "Mathematics or physics"],
    hardGate:
      "Biology and chemistry at the highest level your school offers are close to a universal floor across every country we profile, and without both this door is shut almost everywhere — the exact extra requirement on top, whether an admissions test, an interview or a prior degree, is the part that actually varies by country.",
    leadsTo: ["treating-patients", "research-and-new-treatments", "health-of-whole-populations"],
    fields: ["medicine_health"],
  },
  {
    id: "nursing",
    name: "Nursing",
    alsoCalled: ["Nursing Science", "Registered Nursing"],
    whatItActuallyIs:
      "Training to deliver and coordinate the hands-on clinical care that keeps a patient safe and recovering hour by hour — a distinct profession from medicine, not an assistant version of it.",
    firstYear:
      "Clinical placement hours begin within the first term at most schools, not after years of classroom preparation, so you are responsible, under close supervision, for real patients while still learning the theory that explains what you are doing. The two halves of the course — lecture-based science and supervised ward work — are assessed on entirely different criteria, and it is usually the ward half, not the academic half, that decides in the first year whether someone stays.",
    catch:
      "Clinical placements run on a hospital's rota, not a term timetable, so nights, weekends and long shifts on your feet start well before graduation, and the emotional weight of the work — including patients who do not recover — is a routine feature of training, not an occasional one.",
    suitsYou:
      "You would rather be the person providing continuous, hands-on care than the one making an occasional diagnosis, and long, physically demanding shifts do not wear you down the way they wear down most people.",
    notForYou:
      "You pictured diagnosing and directing treatment rather than delivering and coordinating it day to day. That is medicine's role, not nursing's, and the two are licensed, trained and paid quite differently everywhere we profile — look at medicine directly if that is really the work you are picturing.",
    schoolSubjects: ["Biology", "English", "Mathematics"],
    hardGate: null,
    leadsTo: ["treating-patients", "health-of-whole-populations"],
    fields: ["medicine_health"],
  },
  {
    id: "pharmacy",
    name: "Pharmacy",
    alsoCalled: ["Pharmaceutical Sciences"],
    whatItActuallyIs:
      "The science of how drugs act in the body, how they are made and combined safely, and how to advise on and control their use — the discipline standing between a chemical compound and a patient who takes it correctly.",
    firstYear:
      "You will spend far more of the first year in an organic-chemistry lecture theatre than anywhere near a pharmacy counter, which is the reverse of what most applicants picture when they choose the subject. Pharmacology and pharmaceutics build directly on that chemistry rather than replacing it later, so a shaky foundation in it does not stay someone else's problem — it compounds into the second year rather than fading out of the course.",
    catch:
      "A growing share of routine dispensing is automated or protocol-driven, which is steadily narrowing the entry-level, community-facing side of the job that draws many applicants to the subject in the first place, and clinical or hospital roles generally require further specialisation on top of the base qualification.",
    suitsYou:
      "You like the exactness of chemistry — a dose, a compound, an interaction that is either right or wrong — and you would rather be the last careful check between a prescription and a patient than the person who wrote it.",
    notForYou:
      "You want direct, ongoing contact with a patient over time rather than a single careful check at the point a medicine is handed over. Nursing or medicine both give you a continuing relationship with a patient that pharmacy, built around discrete transactions, generally does not.",
    schoolSubjects: ["Chemistry", "Biology", "Mathematics"],
    hardGate:
      "Chemistry through to the end of school is non-negotiable in every system we cover; pharmacy is built on it from week one in a way biology alone cannot substitute for.",
    leadsTo: ["treating-patients", "research-and-new-treatments", "applied-science-and-industry"],
    fields: ["medicine_health"],
  },
  {
    id: "dentistry",
    name: "Dentistry",
    alsoCalled: ["Dental Surgery", "Oral Health Science"],
    whatItActuallyIs:
      "Training to diagnose and treat conditions of the teeth, gums and jaw, combining the same clinical judgement medicine requires with a specific manual and surgical skill medicine does not.",
    firstYear:
      "A preclinical simulation lab — practising procedures on a model tooth under magnification, marked for precision on a scale most students have never been evaluated against — arrives within the first few weeks, well before any theory course has finished explaining why the procedure works. It is deliberately the first real test of the course: the anatomy and biochemistry taught alongside it matter, but steady manual control under a microscope is the specific skill that first year is actually screening for.",
    catch:
      "Small, repetitive hand movements performed under magnification for hours are the physical core of the daily job, not an occasional task, and the equipment involved means the great majority of graduates end up practising inside one fixed clinic rather than in a more mobile clinical role.",
    suitsYou:
      "You have genuinely steady hands and patience for fine, repetitive physical work, and you would rather see a problem you can fix directly and completely in one sitting than manage something chronic over years.",
    notForYou:
      "You are not certain you can tolerate close, repetitive manual work for hours at a time — most admissions systems test exactly that before offering a place, honestly and early. Medicine keeps the clinical reasoning without demanding the same manual precision, if that is the part that actually draws you.",
    schoolSubjects: ["Biology", "Chemistry", "Mathematics or physics"],
    hardGate:
      "Biology and chemistry sit at the same close-to-universal floor medicine sets, and on top of them most systems specifically test manual dexterity or spatial ability before offering a place — a screen unlike anything else on this list.",
    leadsTo: ["treating-patients"],
    fields: ["medicine_health"],
  },
  {
    id: "public-health",
    name: "Public health",
    alsoCalled: ["Population Health", "Community Health Science"],
    whatItActuallyIs:
      "Studying disease and wellbeing at the level of a whole population rather than one patient at a time, using data to work out what actually keeps large numbers of people well.",
    firstYear:
      "It reads, from outside, like medicine practised at a distance, and the first year corrects that within weeks: epidemiology, biostatistics and health economics dominate the timetable, and a semester can pass with barely a mention of a single named patient. The numbers arrive faster than the medicine does, and that speed — not any one hard topic — is what unsettles the students who came in expecting a softer, more social version of clinical training.",
    catch:
      "The clearest wins in this field are invisible by design — an epidemic that never happens produces no headline — and prevention funding is often the first budget line cut once the absence of a crisis makes it look unnecessary, which makes career stability depend more on politics than on performance.",
    suitsYou:
      "You would rather prevent a thousand ordinary cases than treat one dramatic one, and you can stay motivated by a success nobody else notices, because by definition the disease that never happened makes no headline.",
    notForYou:
      "You want to be at a patient's bedside, not behind a dataset describing thousands of people you will never meet individually. Treating patients directly — medicine or nursing — gives you that contact; this field trades it away deliberately in exchange for scale.",
    schoolSubjects: ["Biology", "Mathematics or statistics", "English"],
    hardGate: null,
    leadsTo: ["health-of-whole-populations", "economics-and-policy"],
    fields: ["medicine_health"],
  },
  {
    id: "biomedical-science",
    name: "Biomedical science",
    alsoCalled: ["Biomedical Sciences", "Medical Science (pre-clinical)"],
    whatItActuallyIs:
      "The laboratory science behind medicine — studying disease mechanisms, diagnostics and treatments at the bench — without the clinical training or licence to treat a patient directly.",
    firstYear:
      "It shares lecture theatres with the medical degree for anatomy and biochemistry at many universities, and the first year's real shape is defined by what that overlap leaves out: no clinical placement, no patient contact, and a much heavier laboratory and data-analysis load sitting in the space where medicine would put a ward round instead. Students expecting a lighter version of medicine are working from the wrong comparison entirely — this is a full, separate laboratory science with its own depth, not medicine minus the clinic.",
    catch:
      "The degree looks like a direct route into hospital diagnostic work, but in several of the countries we profile that specific role is a separately regulated profession with its own accreditation on top of this qualification, not an automatic destination for anyone who completes it.",
    suitsYou:
      "You want the science underneath medicine — disease mechanisms, diagnostics, how a treatment actually works — without committing to a clinical licence and years of patient-facing training to reach it.",
    notForYou:
      "You want to treat patients directly, not study the mechanisms behind their treatment from a bench. This degree does not carry a clinical licence anywhere we profile — medicine or nursing lead to that directly, and this one does not convert into it later without starting a fresh clinical degree.",
    schoolSubjects: ["Biology", "Chemistry", "Mathematics"],
    hardGate:
      "Biology and chemistry together, not either alone, are assumed from the first term — this sits close enough to the medical curriculum that programmes often borrow its entry requirements almost unchanged.",
    leadsTo: ["research-and-new-treatments", "health-technology-and-data", "research-and-discovery"],
    fields: ["medicine_health", "natural_sciences"],
  },
  {
    id: "history",
    name: "History",
    alsoCalled: ["Historical Studies"],
    whatItActuallyIs:
      "The disciplined reconstruction of the past from incomplete, biased and often contradictory evidence — building and defending an argument about what happened and why, not memorising a settled account of it.",
    firstYear:
      "Dates and names are not the subject; they are its raw material — the actual work is turning a handful of ambiguous, self-interested documents into an argument nobody else in the room has made from them, in a graded essay every week or two. Most applicants arrive expecting a narrative they can learn and are instead handed a stack of conflicting sources and told to argue a position from them; the ones who leave are usually the ones who wanted the story, not the argument about what the story even is.",
    catch:
      "A history degree trains argument from evidence better than it trains anyone for a specific job, so almost nobody graduates directly into 'a historian' role outside a small number of archive, museum and academic posts — the translation into paid work is left to you, the same way it is for a philosophy or a mathematics degree, and it takes real, separate effort during the degree rather than after it.",
    suitsYou:
      "You would rather build a case from documents that disagree with each other than accept a single tidy account, and you can rewrite the same argument five times as new evidence complicates it without losing patience with the process.",
    notForYou:
      "You want a straight line from your subject to your first job, or you dislike weekly written argument more than you expected. A vocational route — communications, education or law — gives you a nearer destination, and this degree's actual skill, argument from contested evidence, transfers there anyway.",
    schoolSubjects: ["History", "English", "A second language where offered"],
    hardGate: null,
    leadsTo: ["teaching-and-research", "words-and-media", "politics-policy-and-the-world"],
    fields: ["humanities_social"],
  },
  {
    id: "philosophy",
    name: "Philosophy",
    alsoCalled: [],
    whatItActuallyIs:
      "The study of the most fundamental questions about knowledge, existence, morality and reasoning itself, using close argument rather than experiment or historical evidence to test an answer.",
    firstYear:
      "A two-page argument can take a genuine week to read properly, and that pace is what catches most people out — not the ideas, which are usually stated at school level, but the expectation that you dismantle every sentence of a text before you are allowed an opinion about it. Formal logic sits alongside the reading and gives the year a second, more mathematical register that some students who chose philosophy specifically to avoid mathematics did not expect at all.",
    catch:
      "The degree gives you a method — question the premise, test the argument, follow the logic wherever it leads — but almost no employer is hiring for 'philosopher', so like history or pure mathematics it depends entirely on you pairing it with a second, more visibly employable skill or a further qualification, and the degree itself will not do that pairing for you.",
    suitsYou:
      "You get real satisfaction from finding the hidden assumption in an argument that otherwise sounds airtight, and you can sit with a two-page text for a week without needing to move on to the next one.",
    notForYou:
      "You want your reading to move quickly, or you want a subject that names your future job directly. Formal logic and painstakingly slow close reading sit at the centre of this degree from week one, and psychology or political science answer similar curiosity about people and ideas while pointing at a more visible destination.",
    schoolSubjects: ["English", "History", "Mathematics"],
    hardGate: null,
    leadsTo: ["teaching-and-research", "practising-law", "words-and-media"],
    fields: ["humanities_social"],
  },
  {
    id: "psychology",
    name: "Psychology",
    alsoCalled: ["Psychological Science"],
    whatItActuallyIs:
      "The scientific study of mind and behaviour — testing why people think, feel and act as they do with data and controlled method, rather than relying on intuition or personal experience about people.",
    firstYear:
      "Why did that person do that? is a question every applicant arrives already able to ask; statistics, not case studies, is the first year's actual answer to it, with a full research-methods course sitting alongside developmental, social and cognitive psychology from week one. The realisation that intuition about behaviour is treated as unreliable evidence, to be tested rather than trusted, is what thins the class out faster than any single hard topic does.",
    catch:
      "The licensed, patient-facing side of the field is long and competitive to reach: in most countries an undergraduate degree alone does not let you practise as a psychologist, the postgraduate clinical places are few, and a strong first degree is only the entry ticket to that competition rather than the qualification itself.",
    suitsYou:
      "You accept that a hunch about why someone behaved a certain way needs testing before it counts as knowledge, you can write up a study methodically even when the result disappoints you, and you can carry other people's difficulties through a working day without taking them home unprocessed.",
    notForYou:
      "You want to be doing practising, licensed clinical work soon, or you want to skip the statistics and go straight to helping people. In most countries a bachelor's alone does not license you, research methods sit at the centre of the training throughout, and the postgraduate clinical places are genuinely few relative to demand.",
    schoolSubjects: ["Biology", "Mathematics or statistics", "English"],
    hardGate: null,
    leadsTo: ["people-and-the-mind", "health-of-whole-populations", "teaching-and-research"],
    fields: ["humanities_social"],
  },
  {
    id: "sociology",
    name: "Sociology",
    alsoCalled: [],
    whatItActuallyIs:
      "The systematic study of how societies are organised — class, family, institutions, inequality — and the evidence used to show why a pattern exists rather than simply describing that it does.",
    firstYear:
      "Explanations that feel obvious — poverty is laziness, crime is bad choices, a riot is simply criminality — are the first target, and a full term goes into showing, with data, why each one collapses under actual evidence. Surveys, interview transcripts and a small research project of your own arrive early, well before any of the grand theory that gives the subject its reputation for abstraction, and it is the theory reading — dense, contested, translated from German or French originals — that some students never quite get comfortable with.",
    catch:
      "The subject trains you to see structure behind individual choices, which is intellectually valuable and commercially vague: very few employers advertise for 'a sociologist', so the degree's actual audience — policy, research, the third sector, journalism — has to be chosen and pursued deliberately rather than arrived at automatically.",
    suitsYou:
      "You are more interested in why a pattern holds across thousands of people than in any one person's story, and you can hold two competing theoretical explanations for the same fact in your head at once without needing to resolve them immediately.",
    notForYou:
      "You want individual case work, not population-level patterns, or you find dense theoretical writing more frustrating than illuminating. Psychology reaches the individual level this degree deliberately steps back from, and a more applied social-policy or social-work route reaches paid work more directly than a general sociology degree does.",
    schoolSubjects: ["English", "History or social studies", "Mathematics or statistics"],
    hardGate: null,
    leadsTo: ["teaching-and-research", "politics-policy-and-the-world", "rights-and-advocacy"],
    fields: ["humanities_social"],
  },
  {
    id: "anthropology",
    name: "Anthropology",
    alsoCalled: ["Social Anthropology", "Cultural Anthropology"],
    whatItActuallyIs:
      "The comparative study of human cultures, past and present, understood on their own terms first — what people believe, build and practise — before any attempt to explain or generalise across them.",
    firstYear:
      "You do not study people from a lecture theatre for very long: a short observation exercise in the first term — sitting somewhere public and writing down, without judging it, everything a stranger does for an hour — is the method the whole discipline is built on, and it is far harder to do without imposing your own assumptions than it sounds. A parallel strand on human evolution and biology surprises students who signed up expecting only culture, and it is usually that unexpected science, not the fieldwork, that some people leave over.",
    catch:
      "The discipline's core method — living inside a community for an extended period to understand it from the inside — is difficult to do properly as an undergraduate and belongs mostly to postgraduate research, so a bachelor's gives you the theory and the method in miniature rather than the full fieldwork experience the subject is known for, and 'anthropologist' is rarely a job title outside academia and a small number of specialist agencies.",
    suitsYou:
      "You would rather understand why a practice makes sense from inside a community than judge it from outside, and long, patient, unglamorous observation genuinely interests you more than reaching a quick conclusion does.",
    notForYou:
      "You want the extended fieldwork the subject is known for to start in year one, or you are uncomfortable with a compulsory strand on human biology and evolution alongside the cultural material. The real fieldwork mostly waits for postgraduate study, and sociology gives you social patterns without that biological strand attached.",
    schoolSubjects: ["Biology", "History or social studies", "English"],
    hardGate: null,
    leadsTo: ["teaching-and-research", "politics-policy-and-the-world", "people-and-the-mind"],
    fields: ["humanities_social"],
  },
  {
    id: "political-science",
    name: "Political science",
    alsoCalled: ["Politics", "Government", "Political Studies"],
    whatItActuallyIs:
      "The systematic study of power — how governments form, how decisions actually get made inside them, and why some political systems hold together while others fail — tested against evidence rather than argued from conviction.",
    firstYear:
      "Arguing well turns out to matter less than measuring well: the first term is survey design, statistical method and comparing institutions across countries side by side, not the debate-team argument some students arrive expecting to have every week. Comparative politics forces you to describe a system you personally find objectionable in the same neutral terms as one you admire, and that discipline — describing before judging — is what some strongly opinionated students find hardest to accept.",
    catch:
      "A political-science degree trains analysis of power, not the exercise of it, and very few graduates walk straight into elected office or a diplomatic post — most of the actual jobs are research, policy and administrative roles that support decisions rather than make them, and reaching the visible, headline version of 'politics' usually takes a further degree plus years of unglamorous groundwork.",
    suitsYou:
      "You can describe a political system you find objectionable in the same neutral, analytical terms as one you admire, and you would rather understand why a decision was actually made than simply argue that a different one should have been.",
    notForYou:
      "You want to argue your own convictions for a living, or you are picturing yourself in elected office soon. Most graduates end up in research, policy and administrative roles supporting decisions rather than making them, and a law or communications degree reaches advocacy and public argument more directly than this one does.",
    schoolSubjects: ["History", "English", "Mathematics or statistics"],
    hardGate: null,
    leadsTo: ["politics-policy-and-the-world", "economics-and-policy", "practising-law"],
    fields: ["humanities_social"],
  },
  {
    id: "international-relations",
    name: "International relations",
    alsoCalled: ["International Studies", "International Affairs"],
    whatItActuallyIs:
      "The study of how states, international organisations and companies deal with each other across borders — trade, conflict, treaties and diplomacy — and the theories used to explain why they cooperate or fail to.",
    firstYear:
      "Model UN prepared you to argue a country's position; the actual degree spends its first months making you defend competing theories about why states behave the way they do at all, a more abstract register than the debate itself and one that some strong debaters find surprisingly dry. International law and international economics both arrive early as compulsory strands, and realising how much of the subject is law and economics, not history and diplomacy, is what changes some people's minds about it.",
    catch:
      "Diplomatic services are, in nearly every country we cover, closed or heavily restricted for non-citizens, which quietly removes the most obviously named career from the table for a large share of international students before they have even applied — the field's other destinations, such as international organisations, NGOs and trade or compliance work, are real but far more competitive to enter and usually expect a further degree.",
    suitsYou:
      "You can hold several countries' conflicting interests in your head at once without collapsing them into a single right answer, and a career built on relationship and reputation over many years, rather than on one visible early win, sounds acceptable rather than frustrating.",
    notForYou:
      "You are an international student specifically aiming at your host country's diplomatic service, which is closed or heavily restricted to non-citizens almost everywhere we cover. Political science stays closer to domestic institutions if that is really the interest, and rights-focused legal work reaches cross-border issues through a more concrete route than general international relations does.",
    schoolSubjects: ["History", "English", "A second language"],
    hardGate: null,
    leadsTo: ["politics-policy-and-the-world", "rights-and-advocacy", "words-and-media"],
    fields: ["humanities_social", "law"],
  },
  {
    id: "linguistics",
    name: "Linguistics",
    alsoCalled: ["Language Sciences"],
    whatItActuallyIs:
      "The scientific study of how language itself works — sound, structure, meaning and change — as a system that can be analysed formally, distinct from learning to speak any particular language fluently.",
    firstYear:
      "Being fluent in three languages turns out to help less than expected: the first year is phonetics, syntax trees and formal semantic analysis, often applied to a language you do not speak at all, because the subject studies the machinery underneath language rather than practising a particular one. Building a syntax tree correctly is closer to a mathematical proof than to an essay, and it is that unexpected formality, not the vocabulary, that some multilingual applicants find hardest.",
    catch:
      "Speaking several languages well is neither the subject nor a substitute for it, so a strong multilingual applicant can still struggle if they expected the degree to feel like advanced language practice; 'linguist' is also rarely a job title outside a small number of speech-therapy, language-technology and language-documentation roles, so most graduates translate the analytical skill into an adjacent field rather than practising linguistics by name.",
    suitsYou:
      "You find the structure underneath a sentence as interesting as its meaning, and building a formal tree diagram that correctly predicts which sentences are possible in a language satisfies you more than simply being able to speak it.",
    notForYou:
      "You chose this expecting advanced practice in speaking several languages fluently. That is language learning, a different and valuable skill from analysing how language works as a system, and a modern-languages degree teaches fluency far more directly than linguistics does.",
    schoolSubjects: ["English", "A second language", "Mathematics"],
    hardGate: null,
    leadsTo: ["words-and-media", "teaching-and-research", "data-and-ai"],
    fields: ["humanities_social"],
  },
  {
    id: "communications",
    name: "Communications",
    alsoCalled: ["Journalism", "Media Studies", "Communication Studies"],
    whatItActuallyIs:
      "Studying how information, persuasion and stories actually reach and change an audience — reporting, media theory and practical production together — rather than only the theory of media or only the craft of writing.",
    firstYear:
      "A six-hundred-word deadline arrives within the first fortnight, on a story you have to report yourself rather than summarise from a textbook, and that shock — being marked on real, checkable work from week one rather than on an essay about the theory of media — is closer to an apprenticeship than most humanities subjects attempt. Media theory and media law run alongside the practical work, and the ones who leave are usually the ones who wanted only the theory or only the practice and resent having to do both at once.",
    catch:
      "The economics of the industry this degree points toward have been difficult for two decades: staff journalism jobs are fewer than they were, freelance and early content roles pay little and pay slowly, and the degree itself, being broad, competes for entry-level attention against narrower marketing, design or straight journalism qualifications.",
    suitsYou:
      "You would rather find out what is actually true and report it accurately than write beautifully about something unverified, and you can accept public, sometimes harsh feedback on published work without it stopping you from filing the next piece.",
    notForYou:
      "You want financial stability early in your career, or you only enjoy the theory side and dislike being edited in public. Staff roles are fewer than they were and freelance pay is low and slow, and a narrower journalism or marketing qualification reads as more deliberate to an entry-level employer than this broader degree does.",
    schoolSubjects: ["English", "History or social studies", "A second language"],
    hardGate: null,
    leadsTo: ["words-and-media", "marketing-and-growth", "politics-policy-and-the-world"],
    fields: ["humanities_social"],
  },
  {
    id: "education",
    name: "Education",
    alsoCalled: ["Pedagogy", "Teacher Education"],
    whatItActuallyIs:
      "Training to teach — how people actually learn, how to plan a lesson that reaches a room of different abilities at once, and the classroom practice that turns subject knowledge into something someone else understands.",
    firstYear:
      "You are assessed twice for the same lesson: once on whether the content you taught was correct, and separately, by a supervisor watching from the back of the room, on whether anyone actually learned it — and it is that second, harder mark that surprises students who assumed strong subject knowledge would carry them. Placement teaching begins early, often within the first year, well before the education theory that explains classroom management has been fully covered, so you are managing a real room before you feel ready to.",
    catch:
      "The workload is heavier than the stable, respected reputation of the profession suggests — planning, marking and pastoral care routinely extend well past the hours actually in front of a class — and pay, in most of the countries we cover, is modest relative to that responsibility and to other degrees requiring a similar number of years to complete.",
    suitsYou:
      "You get real satisfaction from watching a specific person go from not understanding something to understanding it, and standing in front of a room and holding thirty different levels of attention at once does not drain you the way it drains most people.",
    notForYou:
      "You want a lighter workload than the classroom actually carries, or you are choosing this only because teaching sounds stable rather than because you want to be in the room. Planning, marking and pastoral care routinely extend the job well past the hours in front of a class, and a subject degree without the teaching placement keeps the content without that specific daily weight.",
    schoolSubjects: ["English", "The subject you intend to teach", "Mathematics"],
    hardGate: null,
    leadsTo: ["teaching-and-research", "people-and-the-mind"],
    fields: ["humanities_social"],
  },
  {
    id: "law",
    name: "Law",
    alsoCalled: ["LLB", "Juris Doctor (JD)", "Jurisprudence"],
    whatItActuallyIs:
      "The systematic study of legal rules and how they are argued, interpreted and applied — taken as a first degree straight from school across most of the countries we cover, but only as a graduate degree, after an unrelated bachelor's, in the United States and Canada.",
    firstYear:
      "Several hundred pages of judgments a week is a normal reading load from the first fortnight, and the shock is less the volume than what you are asked to do with it: not learn the rule a case decided, but reconstruct the reasoning that produced it, then argue the opposite side just as convincingly in the next seminar. Students who wanted to learn 'the rules' and instead spent the term arguing against ones they had just learned are the ones who tend to leave first.",
    catch:
      "Qualification is national and rarely portable: a law degree earned in one country generally does not let you practise in another without substantial further exams and supervised training, which makes 'where do I actually want to practise' a question worth answering honestly before choosing where to study, not after. Commercial practice also runs on closely measured billable hours, and the profession reports high rates of stress and long-hours culture that is worth weighing before you commit, not once you are in it.",
    suitsYou:
      "You prepare obsessively rather than improvising, you can argue a position you personally disagree with as convincingly as one you believe, and mapping a multi-year qualification ladder before you commit to it does not put you off the way it puts off most applicants.",
    notForYou:
      "You assumed you can enter a law degree straight from school wherever you apply. In the United States and Canada it is a graduate degree, not a first one — political science, philosophy, history or economics are the usual undergraduate routes there — and this page mainly describes the direct route that exists almost everywhere else we cover instead.",
    schoolSubjects: ["English", "History", "A second language where useful"],
    hardGate:
      "Whether you can even choose this as a first degree depends entirely on where you apply. Most of the countries we cover let a school-leaver enter directly; in the United States and Canada it is a graduate-entry degree, reached only after another bachelor's degree and a separate admissions test — check which shape applies to your target country before building a plan around this page.",
    leadsTo: ["practising-law", "business-tech-and-ip-law", "courts-and-public-service"],
    fields: ["law"],
  },
  {
    id: "criminology",
    name: "Criminology",
    alsoCalled: ["Criminal Justice"],
    whatItActuallyIs:
      "The study of crime, punishment and the justice system as social phenomena — why crime happens, how criminal-justice systems actually respond to it, and whether those responses work — using social-science evidence rather than a law degree's focus on rules and procedure.",
    firstYear:
      "The true-crime instinct — what makes someone do it — gets roughly one seminar before the degree moves on to what the evidence actually says about who reoffends, which interventions measurably reduce it, and how thin the data is behind most confident public claims about crime. Statistics and research-methods training sit at the centre of the course from early on, and applicants who came for case studies and true-crime narrative, and instead spent the term reading regression tables, are the ones who tend to leave.",
    catch:
      "This degree studies the justice system; it does not, by itself, license you to work inside it as a lawyer, and the visible, front-line roles it is often associated with — police officer, prosecutor, forensic investigator — either need a separate professional qualification on top of it or are closed to international applicants in the country where you studied, which is worth checking before assuming the degree leads there directly.",
    suitsYou:
      "You want the evidence behind confident public claims about crime and punishment rather than the claims themselves, and you can find a policy detail, such as sentencing guidelines or reoffending statistics, as engaging as the human stories that first drew your interest.",
    notForYou:
      "You want to become a police officer or a lawyer directly, or you were drawn mainly by true-crime storytelling rather than by policy and statistics. Both those front-line and legal routes generally need a separate qualification on top of this degree, and a straight law degree is the more direct route into legal practice specifically.",
    schoolSubjects: ["English", "Mathematics or statistics", "History or social studies"],
    hardGate: null,
    leadsTo: ["courts-and-public-service", "rights-and-advocacy", "teaching-and-research"],
    fields: ["law", "humanities_social"],
  },
  // ── Thirty-six so far, across engineering, computer_science,
  // business_economics, natural_sciences, medicine_health, humanities_social
  // and law. Wave A1d (arts, plus the reverse-edge test) adds the rest, to
  // at least 44 total — spread so every one of the eight faculties has
  // majors and every area of work in careers.ts is reachable from at least
  // one major.
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
