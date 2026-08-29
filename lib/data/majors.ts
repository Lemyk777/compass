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
      "The study of what can be computed, and how: algorithms, data, languages and machines. It isn't training in any particular programming tool.",
    firstYear:
      "Discrete mathematics, proofs, and one or two programming languages taught from the ground up. It's the mathematics, not the programming, that thins the year out. Most people arrive already able to write code, then find the course isn't about writing code. The ones who leave usually leave for one reason. Nobody warned them that a term of induction proofs and asymptotic analysis comes before anything that looks like an app.",
    catch:
      "The gap between the degree and the job is wider here than in almost any other subject. A graduate who never built anything outside coursework competes badly against one who did. The course doesn't require you to build anything outside coursework. So the work of becoming employable happens in your own time, alongside the degree, and nobody makes you do it.",
    suitsYou:
      "You are willing to be a beginner at mathematics again for a year. You already build things nobody asked you to build. You would rather understand why a method works than collect a list of tools that happen to work today.",
    notForYou:
      "You want to make software and have no appetite for the theory underneath it. Software engineering and information systems degrees reach the same jobs with far less proof-writing. In several of the countries we profile, they are also the more direct route into a first role.",
    schoolSubjects: ["Mathematics", "Physics or informatics", "English"],
    hardGate:
      "Strong mathematics isn't optional here. Every country we profile screens on it, and the first year assumes it.",
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
      "Designing and building the things a place is made of: bridges, water systems, roads, foundations. The work is proving they will stand up before anyone builds them.",
    firstYear:
      "Statics, materials and a great deal of drawing, taught alongside the mathematics that supports them. The surprise is how much of the year goes on things that don't move. Understanding how a load travels through a structure standing still is the whole foundation. It's also far less satisfying than the buildings that drew people to the subject.",
    catch:
      "The profession is licensed almost everywhere, and a licence earned in one country often doesn't transfer. So the country you study in largely decides the country you can practise in. Few other subjects tie those two choices together this tightly, and most students meet the constraint years too late to act on it.",
    suitsYou:
      "You want the thing you worked on to exist physically and outlast you. You can accept a career measured in projects that take years, not releases that take weeks.",
    notForYou:
      "You expect to move country freely after graduating. Licensing rarely travels with you. If mobility matters more to you than the built environment does, software, data or general mechanical work won't tie you to one country the same way.",
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
      "Designing physical things that move or carry load: engines, machines, vehicles, the equipment inside a factory. The proof that they work comes on paper, before anyone builds them.",
    firstYear:
      "Statics, dynamics and thermodynamics, taught through problem sets that take hours each. Alongside them runs a technical-drawing course that feels beneath a subject people chose for engines and robots. The students who leave usually wanted to build something immediately. Instead they spent two semesters proving that a motionless beam doesn't move, before being trusted near anything that does.",
    catch:
      "The design work most students imagine, inventing new machines, is a small fraction of the actual jobs. Most mechanical engineers spend a career making an existing product a little lighter, cheaper or more reliable. Manufacturing employers also cluster around industrial regions rather than capital cities, which narrows where the work actually is.",
    suitsYou:
      "You get real satisfaction from making something that already works a little better, rather than inventing something new every year. An industrial town, rather than a capital city, sounds like a fine place to build a career.",
    notForYou:
      "You want to see the effect of your work within weeks rather than years. Or you specifically want to live in a capital city. Software and product design move on a much faster cycle, and they aren't tied to wherever the factories happen to be.",
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
      "Working with electricity itself: circuits, signals, power systems and the chips everything else runs on. It's the discipline underneath every device that plugs in or carries a battery.",
    firstYear:
      "Circuit theory and electromagnetism, taught mathematically, well before you are let near a real board. The first year reads closer to applied physics than to the soldering and building most people expected. What actually thins the class out comes later: the mathematics doesn't stop after year one, the way it does on some other engineering routes. It runs through the whole degree, and people who tolerated it rather than liked it tend to leave first.",
    catch:
      "The feedback loop is slow and expensive next to software. A mistake in a circuit means a redesign and a wait for new hardware to arrive, not a same-day fix. The most advanced work, chip design especially, sits in a small number of places in the world. Reaching it can mean relocating rather than choosing where to live.",
    suitsYou:
      "You are genuinely at ease with mathematics that never lets up after year one. You enjoy reasoning about a system through instruments rather than by looking straight at it. Slow, expensive iteration doesn't wear you down the way it might in software.",
    notForYou:
      "You want to see a change working the same day you make it. Every mistake here costs a hardware redesign and a wait. That's the opposite of software's iteration speed. Building software or working in data gives you a feedback loop this field can't structurally offer.",
    schoolSubjects: ["Mathematics", "Physics"],
    hardGate:
      "This is the most continuously mathematical of the engineering degrees. Circuit and field theory lean on calculus every term, not only the first. No later specialisation lets you leave the mathematics behind.",
    leadsTo: ["electronics-energy-and-hardware", "building-software-and-products"],
    fields: ["engineering"],
  },
  {
    id: "chemical-engineering",
    name: "Chemical engineering",
    alsoCalled: ["Chemical and process engineering", "Process engineering"],
    whatItActuallyIs:
      "Designing the industrial-scale processes that turn raw materials into fuel, medicine, plastic and almost everything else made in bulk. It's chemistry built at the scale of a factory rather than a beaker.",
    firstYear:
      "Chemistry, thermodynamics and fluid mechanics, taught together. The shock for most students is how much of it is mathematics applied to chemistry rather than chemistry itself. Mass and energy balances, reactor equations, problem sets closer to physics homework than a lab notebook. Students who chose this for the laboratory side, and dislike the constant calculation, tend to leave first.",
    catch:
      "Much of the industry is process-heavy and safety-critical, so it moves slowly and conservatively by design. The largest employers cluster around a few industries: energy, chemicals, pharmaceuticals. A career here can end up tied to wherever those plants actually are.",
    suitsYou:
      "You like chemistry, and you are just as comfortable doing sustained mathematics with it. Spending a career inside one or two industrial sectors sounds acceptable to you rather than confining.",
    notForYou:
      "You want the hands-on laboratory side of chemistry without the constant calculation. Or you want the freedom to work in almost any industry or city. A straight chemistry degree keeps the lab work without the process mathematics, and it travels to far more kinds of employer.",
    schoolSubjects: ["Chemistry", "Mathematics", "Physics"],
    hardGate:
      "Without genuine strength in both chemistry and mathematics together, this major doesn't work. One alone isn't enough: every course fuses them from the first term.",
    leadsTo: ["applied-science-and-industry", "environment-and-climate"],
    fields: ["engineering"],
  },
  {
    id: "software-engineering",
    name: "Software engineering",
    alsoCalled: ["Software development", "Applied computer science"],
    whatItActuallyIs:
      "Building and maintaining working software as part of a team, on a deadline, to a specification someone else can still change halfway through. It's the discipline around writing code, not only the writing of it.",
    firstYear:
      "Group projects, version control, and a language chosen for its industry use rather than its elegance. Alongside that comes enough software-engineering theory, testing and requirements and project process, that it can feel like a detour from actual coding. The students who leave usually wanted computer science's proofs or a purely hands-on bootcamp, and got neither. This sits deliberately between the two, and that middle ground disappoints anyone who wanted an extreme.",
    catch:
      "It's computer science with the theory sanded down, which is exactly its strength and its risk. An employer who wants deep algorithmic knowledge will still prefer a computer science graduate. This degree's practical framing also dates faster than computer science's mathematical core, so you retrain more often over a career.",
    suitsYou:
      "You want to build real, deployed things in a team from year one, not prove theorems about them. You would rather learn one process well, version control and code review and testing, than sample every corner of theoretical computer science.",
    notForYou:
      "You want the deepest possible grounding in algorithms and theory. Or you plan a research degree afterward. Computer science gives you that foundation directly, and this degree will feel like it skipped a step you actually needed.",
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
      "Turning large, messy datasets into numbers an organisation can actually decide something from. Statistics and programming, plus enough domain sense to know when a result is nonsense.",
    firstYear:
      "Probability, statistics and programming taught in parallel. The messy, incomplete datasets you were promised arrive much later than you expect. The people who leave almost always came for the modelling. What they found was a first year spent proving why a method works, closer to a mathematics degree than the job postings suggested.",
    catch:
      "The job most people picture, building clever models, is a small fraction of the actual work. The rest is finding data, discovering it lies, and cleaning it into something a model can use. The specific tools you learn now will be replaced more than once before you retire. The statistics underneath them is the one part that keeps its value.",
    suitsYou:
      "You care more about whether a number is actually true than whether the method that produced it is fashionable. You have the patience to spend most of a project on data that is incomplete or simply wrong, before you model anything at all.",
    notForYou:
      "You pictured building models, and would resent spending most projects cleaning data instead. A straight computer science or statistics degree suits that expectation better, with the applied side learned on the job afterward. This degree is built around the compromise from day one.",
    schoolSubjects: ["Mathematics", "Statistics or informatics", "English"],
    hardGate:
      "Without genuine comfort in statistics and probability, this major won't click. Every course after the first term assumes it, and no track here lets you avoid it.",
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
      "Learning how computer systems actually fail and get broken into. The point is to be the person who finds the hole first, before someone with worse intentions does.",
    firstYear:
      "Networking and operating-systems fundamentals come first, because you can't secure a system you don't understand. This is where the year is genuinely slow. Weeks of protocols and permissions arrive before anything resembling the offensive side that drew people to the subject. Students who leave usually expected to spend the year attacking things, and spent it learning how ordinary systems are supposed to behave instead.",
    catch:
      "Most real work is defensive, procedural and thankless: configuration, patching, log review. The visible, offensive side people picture from films is a much smaller slice of the field than it looks from outside. The incident-driven parts of the job also run on the attacker's schedule, not yours.",
    suitsYou:
      "You find it satisfying to establish exactly how a system failed, not only that it did. You can sit with unglamorous configuration work for long stretches. You would rather be the person quietly keeping something safe than the one publicly building it.",
    notForYou:
      "You are drawn only to the offensive, film-style hacking half, with little patience for defensive hygiene work. That half exists here, but it is a minority of the jobs. A general computer science or software engineering degree, with a security specialisation later, keeps more doors open than committing this early.",
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
      "A broad, generalist degree in how organisations actually run: people, operations, money and strategy together. It's built for working across a business rather than mastering one function of it.",
    firstYear:
      "Accounting, economics, marketing and organisational behaviour introduced side by side, none of them in much depth. That's exactly the shape of the degree, and exactly what disappoints some students. The ones who leave usually wanted to go deep into one subject, finance or psychology or economics. They found a survey course in each instead of mastery of any one.",
    catch:
      "Breadth is the whole design, and also the risk. A specialist employer will often prefer a focused finance, economics or engineering degree over a generalist one. So this degree carries weight only alongside proof from outside the classroom: an internship, a small venture, a real leadership role. The transcript alone can't supply that.",
    suitsYou:
      "You are drawn to how a whole organisation fits together, rather than to one function inside it. You are willing to build evidence of your ability outside the classroom, because the degree by itself won't carry the argument for you.",
    notForYou:
      "You already know you want to go deep in one area, money or people or strategy, rather than see all of them broadly. A focused finance, economics or psychology degree gets you there faster. It also reads as more deliberate to a specialist employer.",
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
      "The study of how people, firms and governments respond to limited resources, and to each other's decisions. It's a mathematical social science, closer in method to applied maths than to business.",
    firstYear:
      "Microeconomics and macroeconomics built up from graphs into algebra and then calculus, fast, on the assumption you can keep pace. Many people arrive expecting current-affairs discussion. The actual first year reads closer to a mathematics course with an economic vocabulary attached. Students who leave usually came for the ideas, and were not ready for how quantitative the method turns out to be.",
    catch:
      "The influence of the work is slow and indirect. A correct piece of analysis can sit unused for years, because the decision it informs belongs to politics rather than to evidence. The most competitive roles, central banks and international institutions, are genuinely hard to reach. They generally expect a further degree past the bachelor's.",
    suitsYou:
      "You would rather understand why people and markets behave as they do than simply hold an opinion about it. You are comfortable with the subject being taught mathematically almost from day one. You can accept being right without seeing anything change for years.",
    notForYou:
      "You want to see the practical effect of your work quickly. Or you are choosing this expecting current-affairs debate rather than mathematics. A business or policy-focused degree gives you a faster feedback loop. This one is more quantitative from the first term than most people expect.",
    schoolSubjects: ["Mathematics", "Economics", "English"],
    hardGate:
      "Modern economics is quantitative from the first term. Without real comfort in algebra and statistics, the degree becomes a struggle to translate rather than to understand.",
    leadsTo: ["economics-and-policy", "money-and-markets"],
    fields: ["business_economics"],
  },
  {
    id: "finance",
    name: "Finance",
    alsoCalled: ["Finance and accounting", "Financial economics"],
    whatItActuallyIs:
      "The study of how money is valued, moved and risked. Pricing a company, managing a portfolio, deciding what a future payment is actually worth today.",
    firstYear:
      "Accounting fundamentals and the mathematics of valuation and interest, taught through problem sets you either get exactly right or clearly wrong. There is little partial credit in a discipline built on numbers matching. Students who leave usually wanted the analytical, decision-making side. They didn't expect how much of the early degree is precise, repetitive calculation before any real judgement is asked of you.",
    catch:
      "Entry-level hours in the most sought-after corners of the industry are genuinely long, with evenings and weekends the norm rather than the exception. The field is also cyclical, among the first to cut junior hiring when markets turn. Meanwhile routine analysis is steadily being automated out of the entry-level job altogether.",
    suitsYou:
      "You are precise rather than approximate by nature, and comfortable defending a numerical assumption under pressure. You are willing to trade a demanding few early years for the analytical work this degree eventually leads to.",
    notForYou:
      "You want predictable hours early in your career, or steady demand regardless of the economic cycle. This sector cuts junior roles first in a downturn, and treats long entry-level hours as standard. Economics or business management reach adjacent work with a gentler entry.",
    schoolSubjects: ["Mathematics", "Economics or business studies", "English"],
    hardGate:
      "Without fast, accurate, comfortable mathematics, this major is a permanent uphill climb. The entry-level work is measured on exactly that, long before any strategic judgement is asked of you.",
    leadsTo: ["money-and-markets", "strategy-and-consulting"],
    fields: ["business_economics"],
  },
  {
    id: "marketing",
    name: "Marketing",
    alsoCalled: ["Marketing and communications", "Marketing management"],
    whatItActuallyIs:
      "Studying how people actually decide to notice, trust and choose something. Research, psychology and communication, applied to putting a product or an idea in front of the right person.",
    firstYear:
      "Consumer behaviour and research methods come before anything creative. Surveys, statistics on why people bought or didn't, and a great deal of writing. That surprises students who arrived expecting to design campaigns from week one. The ones who leave usually wanted the creative, visual side, and found research method and written analysis instead.",
    catch:
      "You are measured constantly and publicly by numbers that are often outside your control. A platform changes its rules overnight and the results move, without you having done anything wrong. Marketing is also typically the first function cut when an organisation tightens its spending.",
    suitsYou:
      "You can treat a disappointing result as information, not as a verdict on you personally. You write constantly without minding it. You would rather understand one audience deeply than chase the next clever idea.",
    notForYou:
      "You are drawn only to the visual, creative side, with little interest in research, statistics or writing. A design degree gets you closer to that specific work. This one spends more of its time on method and analysis than on the creative output itself.",
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
      "The systematic study of living things, from the molecules inside a single cell up to whole ecosystems. It's also the study of the evidence used to prove a claim about any of them.",
    firstYear:
      "The volume of material, not its difficulty, is the actual shock. Taxonomy, biochemistry, cell processes and physiology all arrive in the same term, each in its own vocabulary, well before any of them connect into one picture. A statistics and genetics strand runs alongside, in a second and more mathematical register. It catches out people who chose biology specifically to leave equations behind. That unexpected mathematics, more than the sheer memorising, is what thins the class by the end of the year.",
    catch:
      "A bachelor's alone opens comparatively few of the specifically 'biologist' roles advertised. Most research and specialist laboratory jobs expect a master's or a PhD on top. So the degree works as a foundation rather than a finished qualification. That extra stage costs years most applicants haven't budgeted for.",
    suitsYou:
      "You would rather learn the actual mechanism behind a living process than accept the summary version. Treating a master's as the real starting point of a career, rather than a costly extra, doesn't put you off.",
    notForYou:
      "You expect a bachelor's alone to open specialist biology jobs directly. Most research and technical roles expect a master's or PhD on top of it. If you want a degree that stands alone at the end of four years, engineering or computer science reach paid, specific work faster.",
    schoolSubjects: ["Biology", "Chemistry", "Mathematics or statistics"],
    hardGate:
      "Most programmes assume chemistry alongside biology at school. Biology on its own, with no chemistry at all, is a weak application almost everywhere we cover.",
    leadsTo: ["research-and-discovery", "environment-and-climate", "research-and-new-treatments"],
    fields: ["natural_sciences"],
  },
  {
    id: "chemistry",
    name: "Chemistry",
    alsoCalled: ["Chemical Sciences"],
    whatItActuallyIs:
      "The study of matter itself: what substances are made of, and how they react. The goal is to predict and control that reaction, not only observe it.",
    firstYear:
      "Three chemistries run in parallel from week one: organic, inorganic and physical. Each has its own logic and its own problem sets. The physical strand is closer to applied mathematics than most applicants expect from a subject they associate with a lab coat. Laboratory sessions are graded on technique as strictly as exams are graded on answers, so a result that looks right but was reached the wrong way still loses marks. People who came only for the bench work, and treat the mathematical strand as a footnote, find the year genuinely difficult. The ones prepared to take all three chemistries equally seriously get through it.",
    catch:
      "Laboratory sessions carry real chemical hazard, and a rigid safety culture that some students find stifling after school science. The specific analytical instruments you spend years learning to operate are steadily replaced across a career. What an employer wants you to already know keeps changing after you graduate.",
    suitsYou:
      "You like precise, repeatable practical work as much as the theory that explains it. You are comfortable knowing the instruments and techniques you train on now won't be the ones you use in ten years.",
    notForYou:
      "You want mostly outdoor or field-based science rather than a bench and a fume hood. Environmental science and geology spend far more of their time outside a laboratory. They answer that instinct far more directly than this degree does.",
    schoolSubjects: ["Chemistry", "Mathematics", "Physics"],
    hardGate:
      "Mathematics matters here more than most applicants expect, particularly for the physical strand. But chemistry itself is what every programme treats as the non-negotiable foundation. Weak school chemistry is the harder gap to arrive with.",
    leadsTo: ["applied-science-and-industry", "research-and-discovery", "research-and-new-treatments"],
    fields: ["natural_sciences"],
  },
  {
    id: "physics",
    name: "Physics",
    alsoCalled: ["Physical Sciences"],
    whatItActuallyIs:
      "Working out the rules that govern matter and energy at every scale, from subatomic particles to galaxies. Then expressing those rules in mathematics precise enough to predict what happens next.",
    firstYear:
      "Almost everyone who enjoyed physics at school is surprised by the first term. Most of it goes on setting the subject's familiar results aside and rebuilding them from mathematical first principles. The language is far more formal than school ever used. Practical sessions exist, but they are a small fraction of the timetable next to problem sheets. It's that rebuilding from scratch, reproving things you already believed, that some people never quite forgive the course for.",
    catch:
      "Undergraduate physics trains people for research roles that don't exist in anything like the numbers graduates are produced in. So most physics graduates end up in finance, data or engineering. That work values the mathematics, and never uses most of the physics itself again.",
    suitsYou:
      "You want to understand a system from first principles, not borrow a result someone else derived. You are genuinely at ease knowing the mathematics you love may end up applied somewhere other than physics itself.",
    notForYou:
      "You need to see your work matter to somebody immediately. Physics trains you thoroughly, then routes most graduates into finance, data or engineering instead of physics itself. Mathematics and data science name that destination honestly from the start, rather than arriving at it by accident.",
    schoolSubjects: ["Physics", "Mathematics"],
    hardGate:
      "Mathematics isn't a supporting subject here. It's half the degree. Without genuine comfort in calculus by the start of term one, physics stops feeling like physics and becomes an ongoing mathematics catch-up.",
    leadsTo: ["space-and-the-universe", "research-and-discovery", "electronics-energy-and-hardware"],
    fields: ["natural_sciences"],
  },
  {
    id: "mathematics",
    name: "Mathematics",
    alsoCalled: ["Mathematical Sciences", "Pure and Applied Mathematics"],
    whatItActuallyIs:
      "The study of structure, quantity and proof for their own sake. Not applying known formulas, but establishing which statements are actually true, and why.",
    firstYear:
      "This isn't school mathematics done faster. It's a change of subject. Proof, not calculation, becomes the skill being assessed. A student who was reliably fast and accurate at school can find themselves stuck on a two-line argument that involves no arithmetic at all. For many that is the first time in their life. That experience, arriving after years of being good at the subject, is closer to the real content of the first year than any topic on the syllabus.",
    catch:
      "The degree gives almost no direct professional identity of its own. Nobody is hired as 'a mathematician' the way they are hired as an engineer. So every graduate has to translate proof-based training into a field that will actually employ them. That translation is left entirely to you.",
    suitsYou:
      "You find a two-line proof more satisfying than a page of correct calculation. Not yet knowing which career the degree points toward worries you far less than it would worry most people.",
    notForYou:
      "You want your degree to point at one obvious job on the far side of it. Mathematics gives you almost no professional identity of its own, and leaves the translation into a career entirely to you. Computer science and engineering apply the same reasoning inside a named destination instead.",
    schoolSubjects: ["Mathematics", "Further mathematics where offered"],
    hardGate:
      "No track through this degree avoids proof-based reasoning. Suppose you are fast and accurate at calculation, but have never had to construct a rigorous argument. Expect the hardest adjustment of any subject on this list.",
    leadsTo: ["data-and-ai", "research-and-discovery", "money-and-markets"],
    fields: ["natural_sciences"],
  },
  {
    id: "environmental-science",
    name: "Environmental science",
    alsoCalled: ["Environmental Studies", "Earth and Environmental Science"],
    whatItActuallyIs:
      "Studying how the natural world actually functions: air, water, soil and the life inside them. Closely enough to measure what is changing, and why.",
    firstYear:
      "Weeks of fieldwork alternate with weeks spent entirely at a desk. In the field it is soil samples, water tests and species counts, taken in whatever weather turns up. At the desk it is turning that data into statistics and a written report to a strict format. Most applicants picture the first kind of week and not the second. The class quietly thins once the desk work turns out to be at least as large a share of the mark, and graded just as rigorously.",
    catch:
      "Fieldwork is genuinely seasonal and physically demanding: early starts, bad weather, remote sites. A persistent share of the paid work also sits inside monitoring and compliance for the same industries the subject is popularly imagined to challenge. Some graduates find that sits uneasily with why they chose it.",
    suitsYou:
      "You are equally content collecting a water sample in bad weather and writing up afterward what it does and doesn't prove. You can stay professionally neutral even when your own data says something inconvenient.",
    notForYou:
      "You pictured this as advocacy or campaigning work. Most paid roles sit inside consultancy for the construction, mining or energy industries this subject is popularly imagined to oppose. Politics, policy and the world is the more direct route to campaigning itself.",
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
      "Reading the physical history and structure of the earth from what rock, sediment and landscape actually show. You use that to explain, predict or find what lies beneath the surface.",
    firstYear:
      "A residential field course is compulsory and formally assessed, unlike almost anything at school. That means a week or two camped near an outcrop with a hammer, a hand lens and a notebook, in whatever weather the location provides. It works as the subject's real entrance exam. Mapping exercises and structural mathematics follow in the lecture halls. Both are far easier to sit through once you know the trips themselves don't put you off.",
    catch:
      "Compulsory residential field courses run on the department's calendar, not yours, sometimes for weeks at a time and sometimes abroad. The largest employers of the discipline remain mining, oil and gas. Many applicants haven't pictured themselves working inside those industries.",
    suitsYou:
      "You want a science that gets you physically outdoors, reading a real landscape rather than a screen. Weeks away on a field course sound like the appealing part of the degree, not the cost of it.",
    notForYou:
      "You want to work close to home in a capital city. The largest employers, mining and oil and gas exploration, operate wherever the resource actually is, which is rarely a capital. Civil engineering keeps more of earth science's physical, structural interest while staying closer to cities.",
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
      "Training to diagnose and treat illness in real patients, under supervision from the first clinical placement onward. The course is built around a licence to practise, rather than around a subject in the ordinary sense.",
    firstYear:
      "The course exists to produce a licensed clinician, not to explore a subject. So almost nothing in the first year is optional. Anatomy, physiology and biochemistry are set, sequenced and compulsory, at a pace and volume closer to professional training than to a normal undergraduate timetable. You get far less choice in what you study than friends on almost any other course. What surprises people, despite that intensity, is how little contact with an actual patient the first year contains. The clinical exposure most applicants pictured on the way in arrives later, once the science underneath it is judged solid enough to build on.",
    catch:
      "The training doesn't end at graduation. A further supervised, examined stretch of years follows before independent practice, in every country we profile. International students should also expect that a qualification earned in one country rarely transfers cleanly to another without further exams.",
    suitsYou:
      "You can make a decision on incomplete information, and live with having made it. You can deliver news someone doesn't want to hear without flinching from it. A decade of training, with exams continuing past graduation, is a timeline you've actually looked at rather than assumed away.",
    notForYou:
      "You are choosing this without having checked how your target country's licensing actually works. Or you assumed a degree from one country transfers cleanly into practising in another. It rarely does. Verify the exact ladder for your target country before committing a decade. And if hands-on care without that licensing weight is what draws you, nursing reaches patients directly in far less time.",
    schoolSubjects: ["Biology", "Chemistry", "Mathematics or physics"],
    hardGate:
      "Biology and chemistry at the highest level your school offers are close to a universal floor across every country we profile. Without both, this door is shut almost everywhere. What actually varies by country is the extra requirement on top: an admissions test, an interview, or a prior degree.",
    leadsTo: ["treating-patients", "research-and-new-treatments", "health-of-whole-populations"],
    fields: ["medicine_health"],
  },
  {
    id: "nursing",
    name: "Nursing",
    alsoCalled: ["Nursing Science", "Registered Nursing"],
    whatItActuallyIs:
      "Training to deliver and coordinate the hands-on clinical care that keeps a patient safe and recovering hour by hour. It's a distinct profession from medicine, not an assistant version of it.",
    firstYear:
      "Clinical placement hours begin within the first term at most schools, not after years of classroom preparation. So you are responsible, under close supervision, for real patients while still learning the theory that explains what you are doing. The course has two halves, lecture-based science and supervised ward work, and they are assessed on entirely different criteria. It's usually the ward half, not the academic half, that decides in the first year whether someone stays.",
    catch:
      "Clinical placements run on a hospital's rota, not a term timetable. Nights, weekends and long shifts on your feet start well before graduation. The emotional weight of the work, including patients who don't recover, is a routine feature of training rather than an occasional one.",
    suitsYou:
      "You would rather be the person providing continuous, hands-on care than the one making an occasional diagnosis. Long, physically demanding shifts don't wear you down the way they wear down most people.",
    notForYou:
      "You pictured diagnosing and directing treatment rather than delivering and coordinating it day to day. That's medicine's role, not nursing's. The two are licensed, trained and paid quite differently everywhere we profile, so look at medicine directly if that is the work you are picturing.",
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
      "The science of how drugs act in the body, how they are made and combined safely, and how to advise on and control their use. It's the discipline standing between a chemical compound and a patient who takes it correctly.",
    firstYear:
      "You will spend far more of the first year in an organic-chemistry lecture theatre than anywhere near a pharmacy counter. That's the reverse of what most applicants picture when they choose the subject. Pharmacology and pharmaceutics build directly on that chemistry rather than replacing it later. So a shaky foundation doesn't stay someone else's problem. It compounds into the second year rather than fading out of the course.",
    catch:
      "A growing share of routine dispensing is automated or protocol-driven. That's steadily narrowing the entry-level, community-facing side of the job that draws many applicants in the first place. Clinical and hospital roles generally require further specialisation on top of the base qualification.",
    suitsYou:
      "You like the exactness of chemistry: a dose, a compound, an interaction that is either right or wrong. You would rather be the last careful check between a prescription and a patient than the person who wrote it.",
    notForYou:
      "You want direct, ongoing contact with a patient over time, rather than a single careful check at the point a medicine is handed over. Nursing and medicine both give you a continuing relationship with a patient. Pharmacy, built around discrete transactions, generally doesn't.",
    schoolSubjects: ["Chemistry", "Biology", "Mathematics"],
    hardGate:
      "Chemistry through to the end of school is non-negotiable in every system we cover. Pharmacy is built on it from week one, in a way biology alone can't substitute for.",
    leadsTo: ["treating-patients", "research-and-new-treatments", "applied-science-and-industry"],
    fields: ["medicine_health"],
  },
  {
    id: "dentistry",
    name: "Dentistry",
    alsoCalled: ["Dental Surgery", "Oral Health Science"],
    whatItActuallyIs:
      "Training to diagnose and treat conditions of the teeth, gums and jaw. It combines the clinical judgement medicine requires with a manual and surgical skill medicine doesn't.",
    firstYear:
      "A preclinical simulation lab arrives within the first few weeks, well before any theory course has finished explaining why the procedure works. You practise on a model tooth under magnification, marked for precision on a scale most students have never been evaluated against. It's deliberately the first real test of the course. The anatomy and biochemistry taught alongside it matter, but steady manual control under a microscope is the skill that first year is actually screening for.",
    catch:
      "Small, repetitive hand movements performed under magnification for hours are the physical core of the daily job, not an occasional task. The equipment involved also means most graduates end up practising inside one fixed clinic, rather than in a more mobile clinical role.",
    suitsYou:
      "You have genuinely steady hands, and patience for fine, repetitive physical work. You would rather see a problem you can fix directly and completely in one sitting than manage something chronic over years.",
    notForYou:
      "You aren't certain you can tolerate close, repetitive manual work for hours at a time. Most admissions systems test exactly that before offering a place, honestly and early. Medicine keeps the clinical reasoning without demanding the same manual precision, if that is the part that draws you.",
    schoolSubjects: ["Biology", "Chemistry", "Mathematics or physics"],
    hardGate:
      "Biology and chemistry sit at the same close-to-universal floor medicine sets. On top of them, most systems specifically test manual dexterity or spatial ability before offering a place. That's a screen unlike anything else on this list.",
    leadsTo: ["treating-patients"],
    fields: ["medicine_health"],
  },
  {
    id: "public-health",
    name: "Public health",
    alsoCalled: ["Population Health", "Community Health Science"],
    whatItActuallyIs:
      "Studying disease and wellbeing at the level of a whole population rather than one patient at a time. You use data to work out what actually keeps large numbers of people well.",
    firstYear:
      "From outside it reads like medicine practised at a distance. The first year corrects that within weeks. Epidemiology, biostatistics and health economics dominate the timetable, and a semester can pass with barely a mention of a single named patient. The numbers arrive faster than the medicine does. That speed, rather than any one hard topic, is what unsettles students who came in expecting a softer, more social version of clinical training.",
    catch:
      "The clearest wins in this field are invisible by design, because an epidemic that never happens produces no headline. Prevention funding is often the first budget line cut once the absence of a crisis makes it look unnecessary. Career stability here depends more on politics than on performance.",
    suitsYou:
      "You would rather prevent a thousand ordinary cases than treat one dramatic one. You can stay motivated by a success nobody else notices, because by definition the disease that never happened makes no headline.",
    notForYou:
      "You want to be at a patient's bedside, not behind a dataset describing thousands of people you'll never meet individually. Medicine and nursing give you that contact directly. This field trades it away deliberately, in exchange for scale.",
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
      "The laboratory science behind medicine: disease mechanisms, diagnostics and treatments studied at the bench. It carries no clinical training and no licence to treat a patient directly.",
    firstYear:
      "At many universities it shares lecture theatres with the medical degree for anatomy and biochemistry. The year's real shape is defined by what that overlap leaves out. No clinical placement, no patient contact, and a much heavier laboratory and data-analysis load sitting where medicine would put a ward round. Students expecting a lighter version of medicine are working from the wrong comparison. This is a full, separate laboratory science with its own depth, not medicine minus the clinic.",
    catch:
      "The degree looks like a direct route into hospital diagnostic work. In several of the countries we profile, that specific role is a separately regulated profession with its own accreditation on top of this qualification. It isn't an automatic destination for anyone who completes the degree.",
    suitsYou:
      "You want the science underneath medicine: disease mechanisms, diagnostics, how a treatment actually works. You want it without committing to a clinical licence and years of patient-facing training to reach it.",
    notForYou:
      "You want to treat patients directly, not study the mechanisms behind their treatment from a bench. This degree doesn't carry a clinical licence anywhere we profile. Medicine and nursing lead there directly, and this one doesn't convert into them later without starting a fresh clinical degree.",
    schoolSubjects: ["Biology", "Chemistry", "Mathematics"],
    hardGate:
      "Biology and chemistry together, not either alone, are assumed from the first term. This sits close enough to the medical curriculum that programmes often borrow its entry requirements almost unchanged.",
    leadsTo: ["research-and-new-treatments", "health-technology-and-data", "research-and-discovery"],
    fields: ["medicine_health", "natural_sciences"],
  },
  {
    id: "history",
    name: "History",
    alsoCalled: ["Historical Studies"],
    whatItActuallyIs:
      "The disciplined reconstruction of the past from incomplete, biased and often contradictory evidence. You build and defend an argument about what happened and why, rather than memorise a settled account of it.",
    firstYear:
      "Dates and names aren't the subject. They're its raw material. The actual work is turning a handful of ambiguous, self-interested documents into an argument nobody else in the room has made, in a graded essay every week or two. Most applicants arrive expecting a narrative they can learn. Instead they are handed a stack of conflicting sources and told to argue a position from them. The ones who leave usually wanted the story, not the argument about what the story even is.",
    catch:
      "A history degree trains argument from evidence better than it trains anyone for a specific job. Almost nobody graduates directly into 'a historian' role, outside a small number of archive, museum and academic posts. The translation into paid work is left to you, the same way it is after philosophy or pure mathematics. It takes real, separate effort during the degree rather than after it.",
    suitsYou:
      "You would rather build a case from documents that disagree with each other than accept a single tidy account. You can rewrite the same argument five times as new evidence complicates it, without losing patience with the process.",
    notForYou:
      "You want a straight line from your subject to your first job. Or you dislike weekly written argument more than you expected. A vocational route, communications or education or law, gives you a nearer destination. This degree's actual skill, argument from contested evidence, transfers there anyway.",
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
      "A two-page argument can take a genuine week to read properly. That pace is what catches most people out. Not the ideas, which are usually stated at school level, but the expectation that you dismantle every sentence of a text before you are allowed an opinion about it. Formal logic sits alongside the reading, in a second and more mathematical register. Students who chose philosophy specifically to avoid mathematics didn't expect it at all.",
    catch:
      "The degree gives you a method: question the premise, test the argument, follow the logic wherever it leads. But almost no employer is hiring for 'philosopher'. Like history or pure mathematics, it depends on you pairing it with a second, more visibly employable skill or a further qualification. The degree itself won't do that pairing for you.",
    suitsYou:
      "You get real satisfaction from finding the hidden assumption in an argument that otherwise sounds airtight. You can sit with a two-page text for a week without needing to move on to the next one.",
    notForYou:
      "You want your reading to move quickly. Or you want a subject that names your future job directly. Formal logic and painstakingly slow close reading sit at the centre of this degree from week one. Psychology and political science answer similar curiosity about people and ideas, while pointing at a more visible destination.",
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
      "The scientific study of mind and behaviour. You test why people think, feel and act as they do using data and controlled method, rather than intuition or personal experience.",
    firstYear:
      "Why did that person do that? Every applicant arrives already able to ask it. The first year's answer is statistics, not case studies, with a full research-methods course sitting alongside developmental, social and cognitive psychology from week one. Intuition about behaviour is treated as unreliable evidence, to be tested rather than trusted. That realisation thins the class out faster than any single hard topic does.",
    catch:
      "The licensed, patient-facing side of the field is long and competitive to reach. In most countries an undergraduate degree alone doesn't let you practise as a psychologist. The postgraduate clinical places are few, and a strong first degree is only the entry ticket to that competition rather than the qualification itself.",
    suitsYou:
      "You accept that a hunch about why someone behaved a certain way needs testing before it counts as knowledge. You can write up a study methodically even when the result disappoints you. You can carry other people's difficulties through a working day without taking them home unprocessed.",
    notForYou:
      "You want to be doing licensed clinical work soon. Or you want to skip the statistics and go straight to helping people. In most countries a bachelor's alone doesn't license you, research methods sit at the centre of the training throughout, and the postgraduate clinical places are genuinely few relative to demand.",
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
      "The systematic study of how societies are organised: class, family, institutions, inequality. It looks for the evidence showing why a pattern exists, rather than simply describing that it does.",
    firstYear:
      "Explanations that feel obvious are the first target. Poverty is laziness, crime is bad choices, a riot is simply criminality. A full term goes into showing, with data, why each one collapses under actual evidence. Surveys, interview transcripts and a small research project of your own arrive early, well before the grand theory that gives the subject its reputation for abstraction. It's that theory reading, dense and contested and translated from German or French originals, that some students never quite get comfortable with.",
    catch:
      "The subject trains you to see structure behind individual choices. That's intellectually valuable and commercially vague. Very few employers advertise for 'a sociologist', so the degree's actual audience has to be chosen and pursued deliberately: policy, research, the third sector, journalism. You won't arrive at any of them automatically.",
    suitsYou:
      "You are more interested in why a pattern holds across thousands of people than in any one person's story. You can hold two competing theoretical explanations for the same fact at once, without needing to resolve them immediately.",
    notForYou:
      "You want individual case work, not population-level patterns. Or you find dense theoretical writing more frustrating than illuminating. Psychology reaches the individual level this degree deliberately steps back from. A more applied social-policy or social-work route reaches paid work more directly than a general sociology degree does.",
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
      "The comparative study of human cultures, past and present, understood on their own terms first: what people believe, build and practise. Explaining or generalising across them comes afterwards.",
    firstYear:
      "You don't study people from a lecture theatre for very long. A short observation exercise arrives in the first term. You sit somewhere public and write down, without judging it, everything a stranger does for an hour. That's the method the whole discipline is built on, and it is far harder to do without imposing your own assumptions than it sounds. A parallel strand on human evolution and biology surprises students who signed up expecting only culture. It's usually that unexpected science, not the fieldwork, that some people leave over.",
    catch:
      "The discipline's core method is living inside a community for an extended period to understand it from the inside. That's difficult to do properly as an undergraduate, and belongs mostly to postgraduate research. So a bachelor's gives you the theory and the method in miniature, rather than the fieldwork the subject is known for. 'Anthropologist' is also rarely a job title outside academia and a few specialist agencies.",
    suitsYou:
      "You would rather understand why a practice makes sense from inside a community than judge it from outside. Long, patient, unglamorous observation genuinely interests you more than reaching a quick conclusion does.",
    notForYou:
      "You want the extended fieldwork the subject is known for to start in year one. Or you are uncomfortable with a compulsory strand on human biology and evolution alongside the cultural material. The real fieldwork mostly waits for postgraduate study, and sociology gives you social patterns without that biological strand attached.",
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
      "The systematic study of power: how governments form, how decisions actually get made inside them, and why some political systems hold together while others fail. All of it tested against evidence rather than argued from conviction.",
    firstYear:
      "Arguing well turns out to matter less than measuring well. The first term is survey design, statistical method and comparing institutions across countries side by side. It isn't the debate-team argument some students arrive expecting to have every week. Comparative politics forces you to describe a system you find objectionable in the same neutral terms as one you admire. That discipline, describing before judging, is what strongly opinionated students find hardest to accept.",
    catch:
      "A political-science degree trains analysis of power, not the exercise of it. Very few graduates walk straight into elected office or a diplomatic post. Most of the actual jobs are research, policy and administrative roles that support decisions rather than make them. Reaching the visible, headline version of 'politics' usually takes a further degree plus years of unglamorous groundwork.",
    suitsYou:
      "You can describe a political system you find objectionable in the same neutral terms as one you admire. You would rather understand why a decision was actually made than argue that a different one should have been.",
    notForYou:
      "You want to argue your own convictions for a living. Or you are picturing yourself in elected office soon. Most graduates end up in research, policy and administrative roles supporting decisions rather than making them. A law or communications degree reaches advocacy and public argument more directly than this one does.",
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
      "The study of how states, international organisations and companies deal with each other across borders: trade, conflict, treaties and diplomacy. Plus the theories used to explain why they cooperate, or fail to.",
    firstYear:
      "Model UN prepared you to argue a country's position. The actual degree spends its first months making you defend competing theories about why states behave as they do at all. That's a more abstract register than the debate itself, and some strong debaters find it surprisingly dry. International law and international economics both arrive early as compulsory strands. Realising how much of the subject is law and economics, rather than history and diplomacy, is what changes some people's minds about it.",
    catch:
      "In nearly every country we cover, diplomatic services are closed or heavily restricted for non-citizens. That quietly removes the most obviously named career from the table for a large share of international students, before they have even applied. The field's other destinations are real: international organisations, NGOs, trade and compliance work. They're also far more competitive to enter, and usually expect a further degree.",
    suitsYou:
      "You can hold several countries' conflicting interests in your head at once, without collapsing them into a single right answer. A career built on relationship and reputation over many years, rather than one visible early win, sounds acceptable rather than frustrating.",
    notForYou:
      "You are an international student specifically aiming at your host country's diplomatic service. That service is closed or heavily restricted to non-citizens almost everywhere we cover. Political science stays closer to domestic institutions if that is the real interest. Rights-focused legal work reaches cross-border issues through a more concrete route than general international relations does.",
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
      "The scientific study of how language itself works: sound, structure, meaning and change. It treats language as a system to be analysed formally, which isn't the same as learning to speak one fluently.",
    firstYear:
      "Being fluent in three languages turns out to help less than expected. The first year is phonetics, syntax trees and formal semantic analysis, often applied to a language you don't speak at all. The subject studies the machinery underneath language rather than practising any particular one. Building a syntax tree correctly is closer to a mathematical proof than to an essay. It's that unexpected formality, not the vocabulary, that some multilingual applicants find hardest.",
    catch:
      "Speaking several languages well is neither the subject nor a substitute for it. A strong multilingual applicant can still struggle if they expected advanced language practice. 'Linguist' is also rarely a job title, outside a small number of speech-therapy, language-technology and language-documentation roles. Most graduates translate the analytical skill into an adjacent field rather than practising linguistics by name.",
    suitsYou:
      "You find the structure underneath a sentence as interesting as its meaning. Building a formal tree diagram that correctly predicts which sentences are possible in a language satisfies you more than simply being able to speak it.",
    notForYou:
      "You chose this expecting advanced practice in speaking several languages fluently. That's language learning, a different and valuable skill from analysing how language works as a system, and a modern-languages degree teaches fluency far more directly than linguistics does.",
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
      "Studying how information, persuasion and stories actually reach and change an audience. Reporting, media theory and practical production together, rather than only the theory of media or only the craft of writing.",
    firstYear:
      "A six-hundred-word deadline arrives within the first fortnight, on a story you have to report yourself rather than summarise from a textbook. Being marked on real, checkable work from week one is closer to an apprenticeship than most humanities subjects attempt. Media theory and media law run alongside the practical work. The ones who leave usually wanted only the theory or only the practice, and resent having to do both at once.",
    catch:
      "The economics of the industry this degree points toward have been difficult for two decades. Staff journalism jobs are fewer than they were, and freelance and early content roles pay little and pay slowly. The degree itself is broad, so it competes for entry-level attention against narrower marketing, design or straight journalism qualifications.",
    suitsYou:
      "You would rather find out what is actually true and report it accurately than write beautifully about something unverified. You can accept public, sometimes harsh feedback on published work without it stopping you from filing the next piece.",
    notForYou:
      "You want financial stability early in your career. Or you only enjoy the theory side, and dislike being edited in public. Staff roles are fewer than they were, and freelance pay is low and slow. A narrower journalism or marketing qualification reads as more deliberate to an entry-level employer than this broader degree does.",
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
      "Training to teach: how people actually learn, how to plan a lesson that reaches a room of different abilities at once, and the classroom practice that turns subject knowledge into something someone else understands.",
    firstYear:
      "You are assessed twice for the same lesson. Once on whether the content you taught was correct. Then separately, by a supervisor watching from the back of the room, on whether anyone actually learned it. That second mark is the harder one, and it surprises students who assumed strong subject knowledge would carry them. Placement teaching begins early, often within the first year, well before the theory that explains classroom management has been covered. So you are managing a real room before you feel ready to.",
    catch:
      "The workload is heavier than the stable, respected reputation of the profession suggests. Planning, marking and pastoral care routinely extend well past the hours actually in front of a class. Pay, in most of the countries we cover, is modest relative to that responsibility, and to other degrees taking a similar number of years.",
    suitsYou:
      "You get real satisfaction from watching a specific person go from not understanding something to understanding it. Standing in front of a room and holding thirty different levels of attention at once doesn't drain you the way it drains most people.",
    notForYou:
      "You want a lighter workload than the classroom actually carries. Or you are choosing this because teaching sounds stable, rather than because you want to be in the room. Planning, marking and pastoral care routinely extend the job well past the hours in front of a class. A subject degree without the teaching placement keeps the content without that daily weight.",
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
      "The systematic study of legal rules, and how they are argued, interpreted and applied. Across most of the countries we cover it is a first degree straight from school. In the United States and Canada it is a graduate degree, taken after an unrelated bachelor's.",
    firstYear:
      "Several hundred pages of judgments a week is a normal reading load from the first fortnight. The shock is less the volume than what you are asked to do with it. Not learn the rule a case decided, but reconstruct the reasoning that produced it. Then argue the opposite side just as convincingly in the next seminar. Students who wanted to learn 'the rules', and spent the term arguing against ones they had just learned, tend to leave first.",
    catch:
      "Qualification is national and rarely portable. A law degree earned in one country generally doesn't let you practise in another without substantial further exams and supervised training. So 'where do I actually want to practise' is worth answering honestly before choosing where to study, not after. Commercial practice also runs on closely measured billable hours, and the profession reports high rates of stress and a long-hours culture. Weigh that before you commit, not once you are in it.",
    suitsYou:
      "You prepare obsessively rather than improvising. You can argue a position you personally disagree with as convincingly as one you believe. Mapping a multi-year qualification ladder before committing to it doesn't put you off the way it puts off most applicants.",
    notForYou:
      "You assumed you can enter a law degree straight from school wherever you apply. In the United States and Canada it is a graduate degree, not a first one. Political science, philosophy, history or economics are the usual undergraduate routes there. This page mainly describes the direct route that exists almost everywhere else we cover.",
    schoolSubjects: ["English", "History", "A second language where useful"],
    hardGate:
      "Whether you can even choose this as a first degree depends entirely on where you apply. Most of the countries we cover let a school-leaver enter directly. In the United States and Canada it is graduate-entry, reached only after another bachelor's degree and a separate admissions test. Check which shape applies to your target country before building a plan around this page.",
    leadsTo: ["practising-law", "business-tech-and-ip-law", "courts-and-public-service"],
    fields: ["law"],
  },
  {
    id: "criminology",
    name: "Criminology",
    alsoCalled: ["Criminal Justice"],
    whatItActuallyIs:
      "The study of crime, punishment and the justice system as social phenomena. Why crime happens, how criminal-justice systems actually respond, and whether those responses work. It runs on social-science evidence rather than a law degree's focus on rules and procedure.",
    firstYear:
      "The true-crime instinct, what makes someone do it, gets roughly one seminar. Then the degree moves on to what the evidence says about who reoffends, which interventions measurably reduce it, and how thin the data is behind most confident public claims about crime. Statistics and research-methods training sit at the centre of the course from early on. Applicants who came for case studies and true-crime narrative, and spent the term reading regression tables instead, tend to leave.",
    catch:
      "This degree studies the justice system. It doesn't, by itself, license you to work inside it as a lawyer. The front-line roles it is often associated with, police officer and prosecutor and forensic investigator, either need a separate professional qualification on top or are closed to international applicants in the country where you studied. Check that before assuming the degree leads there directly.",
    suitsYou:
      "You want the evidence behind confident public claims about crime and punishment, rather than the claims themselves. You can find a policy detail, such as sentencing guidelines or reoffending statistics, as engaging as the human stories that first drew your interest.",
    notForYou:
      "You want to become a police officer or a lawyer directly. Or you were drawn mainly by true-crime storytelling rather than by policy and statistics. Both those front-line and legal routes generally need a separate qualification on top of this degree. A straight law degree is the more direct route into legal practice.",
    schoolSubjects: ["English", "Mathematics or statistics", "History or social studies"],
    hardGate: null,
    leadsTo: ["courts-and-public-service", "rights-and-advocacy", "teaching-and-research"],
    fields: ["law", "humanities_social"],
  },
  {
    id: "graphic-design",
    name: "Graphic design",
    alsoCalled: ["Communication design", "Visual communication design"],
    whatItActuallyIs:
      "Solving problems with images, type and layout, so a stranger understands, trusts or is moved by something in the few seconds they give it. It's structured visual argument, not decoration.",
    firstYear:
      "The portfolio that got you admitted was entirely your own choice of subject, medium and pace. The first studio brief hands you somebody else's problem, with constraints you didn't set and a deadline that doesn't move. That switch is the actual first lesson, and it usually arrives inside the first fortnight. The students who leave are almost always the ones who wanted to keep making their own work.",
    catch:
      "Admission and the early years turn on a portfolio far more than on your transcript. That's a real door for a student with weak grades, and a genuine wall for a student with strong grades and nothing made. Once working, a great deal of the paid output is a client's brand or product, not your own taste. Not everyone who loved making personal work adjusts to that.",
    suitsYou:
      "You would rather solve somebody else's visual problem well than pursue your own aesthetic uninterrupted. You can explain in words why a layout works, instead of only feeling that it does. Being edited by a client repeatedly doesn't wear down your interest in doing the next brief properly.",
    notForYou:
      "You want your own taste to survive untouched into paid work. Or you assumed a design career runs mostly on personal projects. Commercial work here is edited by clients and constrained by budgets far more than personal portfolios suggest. Fine art keeps the personal authorship this field trades away for paid, briefed work.",
    schoolSubjects: [
      "Art",
      "A self-built portfolio started well before your final year",
      "English",
    ],
    hardGate:
      "Almost every programme reviews a portfolio before it reads a transcript, and a strong academic record with nothing made to show for it is a weaker application here than average grades with several finished, considered pieces.",
    leadsTo: ["digital-and-product-design", "making-objects-and-craft"],
    fields: ["arts_design"],
  },
  {
    id: "industrial-design",
    name: "Industrial design",
    alsoCalled: ["Product design", "Industrial and product design"],
    whatItActuallyIs:
      "Designing physical objects that will be manufactured in quantity: how they look, how they are held or used, and how they can actually be produced at a cost that makes sense.",
    firstYear:
      "Sketching a hundred concepts in a week turns out to be the easy part. The actual test is the tenth one, built by hand at real size out of card, foam or 3D-printed plastic. You hold it, and it fails to do the one thing it was meant to do. Model-making and materials workshops eat far more of the timetable than drawing does. The students who leave usually pictured a drawing-based subject and found a fabrication-based one.",
    catch:
      "A prototype that fails costs time and material. A production run that fails costs a great deal more. So the freedom to follow a personal idea is bounded tightly by what a factory can build at a sane cost. Much of the entry-level work is refining an existing product's manufacturability, rather than inventing a new one.",
    suitsYou:
      "You are as interested in how a thing would be manufactured fifty at a time as in how it looks. A prototype that breaks on the bench reads to you as information, not as a failure worth abandoning the idea over.",
    notForYou:
      "You want the object to stay exactly as you first imagined it. Manufacturing cost and tooling reshape almost every design before it is made. That's a hard adjustment if you've never priced anything before. Architecture keeps a similar hands-on design process at a larger, slower scale, if that appeals more.",
    schoolSubjects: [
      "Art or design technology",
      "Physics",
      "A portfolio that shows made objects, not only drawings",
    ],
    hardGate:
      "A portfolio comes before the transcript almost everywhere, and unlike a pure art portfolio it is expected to show some evidence you can reason about how a thing is actually made. Sketches alone, with nothing built, read as incomplete here.",
    leadsTo: ["making-objects-and-craft", "machines-and-manufacturing"],
    fields: ["arts_design"],
  },
  {
    id: "architecture",
    name: "Architecture",
    alsoCalled: [],
    whatItActuallyIs:
      "Designing buildings and the spaces around them. Then carrying that design all the way through structure, regulation and budget into something that can actually be built and inhabited.",
    firstYear:
      "A term's work goes up on a wall. A panel of tutors, some of whom you've never met before that morning, discuss it out loud for twenty minutes. They refer to 'the design' rather than to you. That impersonal, structured format is deliberately how studio critique works from the first project onward. Long studio hours arrive immediately rather than building up gradually. The students who leave usually didn't expect the workload before any of the professional or creative reward shows up.",
    catch:
      "This is the longest qualification route among the creative subjects. A degree, then supervised practice, then professional examinations, commonly close to seven years before the title is legally yours. Pay through those years runs well behind the training's length. Long studio hours during the degree are well documented, and they continue into some practices afterward.",
    suitsYou:
      "You can produce something good inside constraints that were fixed before you arrived: a budget, a site, a planning rule. A multi-year ladder of supervised practice and examinations between you and the title reads as a plan, not as a discouragement.",
    notForYou:
      "You want design freedom early, and a short route to a paid, finished career. The qualification ladder is the longest of the creative subjects, and the studio hours during it are heavy. Industrial design keeps a comparable hands-on design process, with a shorter and less regulated route to paid work.",
    schoolSubjects: [
      "Mathematics",
      "Physics",
      "A portfolio of drawing and made models, not photographs of buildings you admire",
    ],
    hardGate:
      "A portfolio is universal, but unlike a fine-art portfolio it is read for spatial and technical reasoning as much as for drawing, and most systems we cover also expect solid mathematics and physics behind it. This isn't a route into the built environment for a purely artistic application.",
    leadsTo: ["space-and-the-built-environment", "building-and-infrastructure"],
    fields: ["arts_design"],
  },
  {
    id: "film-production",
    name: "Film production",
    alsoCalled: [
      "Film studies",
      "Film and television production",
      "Media production",
    ],
    whatItActuallyIs:
      "Making moving-image work as a crew, not as a solo art form. Writing, shooting, editing and organising a production so a story actually gets finished, and finished on time.",
    firstYear:
      "Nobody hands a first-year student a camera and a script. Early productions cast you into crew positions on someone else's project: holding a boom, logging footage, running continuity. It's often a full term or more before you direct anything of your own. That doesn't match the prospectus photographs of students behind cameras. A parallel course in production management and budgeting surprises people who signed up purely for the creative side. It's usually that unglamorous, procedural half that thins the class out.",
    catch:
      "Work in the industry is project by project. You are hired for a production and then it ends, so income is irregular, and unpaid or barely-paid early work is common while you build a reputation. The industry also clusters in a small number of expensive cities. Far more people want to direct than the market will ever pay to let direct.",
    suitsYou:
      "You can be genuinely useful in somebody else's crew role for a long stretch before directing anything of your own. Irregular, project-based income is something your circumstances can absorb for a few years, rather than something you are hoping to survive.",
    notForYou:
      "You pictured directing from early on, or you need steady income soon. Almost everyone starts in a crew role on someone else's production, and work is project by project with real gaps between paid jobs. Animation offers a more solitary, less crew-dependent route into moving-image work, if that suits you better.",
    schoolSubjects: [
      "A finished short film or edited video you made yourself, however small",
      "English",
      "Media studies where offered",
    ],
    hardGate: null,
    leadsTo: ["film-animation-and-sound", "words-and-media"],
    fields: ["arts_design"],
  },
  {
    id: "animation",
    name: "Animation",
    alsoCalled: ["Animation and visual effects", "Character animation"],
    whatItActuallyIs:
      "Creating the illusion of movement and life in drawn, modelled or digital figures, frame by frame or pose by pose, for film, games and advertising.",
    firstYear:
      "A first-term exercise is measured in seconds. A bouncing ball, a simple walk cycle, four seconds of motion. It can consume two full weeks of timing and retiming before it reads as believable rather than mechanical. The animation software sits on top of a second, unofficial curriculum in traditional drawing and observation of real movement. Enormous effort for a result you could watch in one breath: that pace is what the people who leave didn't expect.",
    catch:
      "The finished-seconds-per-week pace doesn't speed up much with experience. It's simply what the craft costs. Much of the paid work is servicing someone else's established characters and style guide rather than inventing your own. Studios also staff up around productions and release schedules, so project-based hiring and real gaps between contracts are normal rather than exceptional.",
    suitsYou:
      "You get real satisfaction from four finished seconds that took two weeks. You can match somebody else's established style faithfully, rather than always pushing your own. Repetitive, incremental refinement genuinely interests you more than it exhausts you.",
    notForYou:
      "You want fast-turnaround creative output, or full authorship over the characters you work on. A finished, believable second of animation is expensive in time no matter how skilled you get. Most paid work matches an established style guide rather than inventing new characters. Graphic design gives you a faster creative cycle, if that pace matters more to you.",
    schoolSubjects: [
      "Art, with regular life drawing if it is offered",
      "A sketchbook kept consistently, not only for assessment",
      "Physics or design technology",
    ],
    hardGate:
      "Most programmes screen on a drawing-based portfolio at entry, not on any prior animation or software experience. Traditional life-drawing and observation of real movement is the actual prerequisite being tested, and it takes longer to build than software skill does.",
    leadsTo: ["film-animation-and-sound", "games-and-interactive"],
    fields: ["arts_design"],
  },
  {
    id: "music",
    name: "Music",
    alsoCalled: ["Music performance", "Composition", "Musicology"],
    whatItActuallyIs:
      "The formal study of music: performance, composition and the theory underneath both. It sits at a level well past playing an instrument for enjoyment.",
    firstYear:
      "An audition got you in the door already playing at a level most of your school never heard. The first term promptly sits you back in a classroom for ear training, harmony and sight-singing, marked to a precision most performers have never been tested against. None of it has much to do with your instrument. You were the strongest player anyone at your school had met, and now you are an average first-year among people at the same level. That gap thins the class out more than any single hard topic does.",
    catch:
      "This degree doesn't, by itself, describe a full performance career. Our own closest destination for music is sound and composition work for film, games and media, not the concert or recording career many applicants picture. That performance track runs on a separate, audition-driven ladder, outside anything a general university application measures. Paid work is also markedly uneven, with far less correlation to raw ability than applicants expect.",
    suitsYou:
      "Being evaluated on precision, on pitch and rhythm and harmony rather than on feeling alone, doesn't put you off. You can accept being merely average in a room where everyone else was also the strongest player at their own school, long before you get to call yourself exceptional again.",
    notForYou:
      "You are counting on this degree alone to build a performance career. Or you dislike being tested on theory and ear training rather than only your instrument. A conservatoire audition track, judged on playing rather than academic study, is the real route to a performance career. This page doesn't size that route up honestly enough to plan against.",
    schoolSubjects: [
      "Sustained instrumental or vocal training well before you apply, not started in your final year",
      "Music theory where it is taught",
      "Mathematics",
    ],
    hardGate:
      "A live or recorded audition to a set standard is close to a universal requirement for performance-track programmes. Unlike a portfolio, it can't be built up in the months before you apply. Years of instrumental training beforehand is the actual, non-negotiable prerequisite.",
    leadsTo: ["film-animation-and-sound"],
    fields: ["arts_design"],
  },
  {
    id: "fine-art",
    name: "Fine art",
    alsoCalled: ["Studio art", "Fine arts", "Painting and sculpture"],
    whatItActuallyIs:
      "Making original visual work in painting, sculpture, print, photography or moving image. It develops from your own ideas rather than a client's brief, and you defend it in your own words.",
    firstYear:
      "Arriving with a portfolio built almost entirely in one medium, usually drawing or painting, is normal. The foundation year is designed to take that medium away from you for weeks at a time. Sculpture, print, photography and moving image in rotation, whether or not you are any good at them yet. Group critique of unfinished, sometimes bad work happens in public from early on. The students who leave could usually take critique of a finished piece, but not of something still obviously failing.",
    catch:
      "There is no brief telling you what to make. That's exactly the freedom that draws people in, and exactly what a share of students find they wanted less than they thought. An open question is harder to answer well than a constrained one. Paid work afterward is heavily uneven, and often has little to do with gallery sales. Teaching, curating, technical and commercial work support far more graduates than selling original pieces does.",
    suitsYou:
      "You can defend an idea that isn't finished and might not work, in front of a room, without the safety of a brief someone else wrote. Having your specialism taken away for a term at a time, to work in media you aren't good at yet, sounds like the appealing part rather than the cost.",
    notForYou:
      "You want a brief, a client and a defined problem to solve, rather than an open question you set yourself. Graphic design gives you exactly that structure while keeping the visual craft. A curatorial or teaching-focused route is also a more common paid destination from this degree than most applicants expect.",
    schoolSubjects: [
      "Art, across more than one medium if possible",
      "A sustained personal portfolio, not only classwork",
      "English, for writing about your own work",
    ],
    hardGate:
      "The portfolio isn't a formality here. Most programmes weight it above the transcript outright, and a strong academic record with no real personal body of work behind it is routinely turned down in favour of an applicant with weaker grades and a genuine one.",
    leadsTo: ["making-objects-and-craft", "teaching-and-research"],
    fields: ["arts_design"],
  },
  {
    id: "fashion-design",
    name: "Fashion design",
    alsoCalled: ["Fashion", "Apparel design"],
    whatItActuallyIs:
      "Designing clothing and accessories from concept through to a physical, wearable garment. Pattern, fabric and construction matter as much as the sketch.",
    firstYear:
      "Before a single original design is critiqued, most programmes spend real weeks on pattern-cutting and construction. You copy an existing garment exactly, by hand, to a tolerance measured in millimetres. A design that can't actually be constructed isn't a finished design yet. Sewing, draping and fitting are graded on technical precision as strictly as any science practical. The students who leave usually wanted to sketch and style, not spend a term proving they can construct someone else's garment.",
    catch:
      "Sampling and small production runs cost real money to get wrong, so creative freedom is bounded by cost the same way it is in industrial design. A large share of the field is also freelance or self-employed. Finding clients, managing a seasonal calendar and chasing payment are permanent, unglamorous parts of the job. Manufacturing itself is concentrated in specific regions, rarely wherever you happen to live.",
    suitsYou:
      "You find pattern-cutting and construction as satisfying as the sketch that came before them. Working out what a small production run would actually cost engages you, rather than deflating the design.",
    notForYou:
      "You want to sketch and style without the construction and cost side. Or you expect steady employment rather than freelance and seasonal work. Illustration and styling-focused work stay closer to the visual side alone. Much of this field runs on freelance income and a seasonal calendar rather than a steady wage.",
    schoolSubjects: [
      "Art or design technology",
      "A portfolio that includes something you actually sewed or constructed, not only drawings",
      "Mathematics, for pattern proportions and costing",
    ],
    hardGate:
      "A portfolio and, at many schools, a hands-on construction or sewing test sit ahead of the transcript. Strong design ideas with no evidence you can actually make a garment is a common, avoidable rejection reason here.",
    leadsTo: ["making-objects-and-craft", "starting-and-running-a-business"],
    fields: ["arts_design"],
  },
  // ── Forty-four total, across all eight faculties: engineering,
  // computer_science, business_economics, natural_sciences, medicine_health,
  // humanities_social, law and arts_design. Every area of work in careers.ts
  // is reachable from at least one major here — the reverse-edge test below
  // pins it, so a career area added later needs a matching major, and a
  // major added later needs a `leadsTo` that actually resolves.
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
