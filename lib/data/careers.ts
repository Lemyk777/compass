import type { FacultyValue } from "@/lib/data/faculties";
import type { ValueAxis } from "@/lib/data/values";

// The missing middle of the guidance product: a field is not a goal. This maps
// each of the eight faculties to a few career AREAS — spheres of work — and,
// inside each, the actual job titles people hold there.
//
// Deliberately NOT one exact profession per field. We cannot see inside a
// student's head, and naming a single job ("you're a mechanical engineer") is a
// guess we have no evidence for; naming the sphere plus the roles in it is a
// claim we can stand behind and is far likelier to contain the thing they
// actually want. The student narrows from the area — we don't narrow for them.
//
// Curated and deterministic (like the opportunities catalog) — no model call, no
// hype. `what` is one plain sentence a 13-year-old understands. `roles` are real
// titles, not invented ones. `path` names the study route and, where it helps,
// that the accessible thing to do NOW is the kind of opportunity already on this
// page — so the throughline reads interest → field → area → what to enter next.
//
// `values` tags what people who do this kind of work usually get out of it (see
// lib/data/values.ts). They are generalisations about a sphere, NOT promises
// about a salary or a job for life — pay and security vary hugely by country,
// and most of our students are not in the countries these generalisations were
// written about. They are used only to reorder the areas within a field.

// DEPTH — added because the one-sentence version was a label, not guidance. A
// student who reads "Data & AI — finding patterns in data" knows no more than
// they did from the words themselves: not what a Tuesday looks like, not what
// the work costs, not whether the thing they imagine is the thing it is. The
// fields below are the answers to the questions a fifteen-year-old actually
// asks next, and every one of them is written to the same rules as the rest of
// the guide: structural facts that stay true for years, no salary figures, no
// rankings, and nothing sold.
//
// `catch` is MANDATORY and is the rule this layer was missing. Every city in
// world.ts states its downside; areas of work did not, which made this the one
// place in the product that could read like a brochure. A kind of work with no
// honest cost listed is an advert, and a unit test now enforces it here too.
//
// `suitsYou`/`notForYou` are the second half of that repair, and they fix a
// different hole: the guide's stated page shape is answer → map → parts, and
// this was the only subject layer whose pages opened with the map. A country
// carries the pair, a city carries `whoThrives` with both halves inside it, and
// an area of work carried neither — so the one part of the page written TO the
// reader did not exist here at all. Both are mandatory and both are tested.

export type CareerArea = {
  /** The sphere of work, not a single job. */
  title: string;
  /** What people in this area actually do, day to day. */
  what: string;
  /** Real job titles inside the sphere — the list, not a verdict. */
  roles: string[];
  /** How you get there — what to study, and the accessible first step. */
  path: string;
  /** What this kind of work usually offers — a generalisation, not a promise. */
  values: ValueAxis[];
  /**
   * A real working week, in concrete nouns — what you touch, who you argue
   * with, where the hours go. The single most useful thing we can say, because
   * most students are picturing the job title and not the Tuesday.
   */
  dayToDay: string;
  /**
   * The honest cost of this kind of work. Mandatory. Not "it's hard work" —
   * the specific thing people in it actually complain about, and the thing that
   * makes people leave.
   */
  catch: string;
  /**
   * Who this work actually suits — addressed to the reader, in the second
   * person, and specific enough that someone can recognise themselves out of it
   * as easily as into it.
   *
   * The guide's rule is that every subject page opens by answering the reader
   * before describing the subject: a country states `suitsYou`/`notForYou`, a
   * city states `whoThrives`, and areas of work stated neither — so this was the
   * one layer whose pages opened with a table of contents instead of an answer.
   * Rendered by `ForYou` at the top of `/guide/work/[area]`.
   */
  suitsYou: string;
  /**
   * Who should look somewhere else, and ideally where. Mandatory, and it is the
   * half that does the work — the same rule `catch` exists for. A page that only
   * names who would love this is an advert with a byline, and a unit test
   * enforces both halves here exactly as it does for cities and from-home
   * routes.
   */
  notForYou: string;
  /** What students reliably get wrong about this area before they are in it. */
  misconception: string;
  /** The route in, in three stages a student can locate themselves on. */
  stages: {
    /** What is worth doing while still at school. */
    school: string;
    /** What you study, and what that study is actually like. */
    study: string;
    /** How the first years in the work actually begin — the unglamorous truth. */
    first: string;
  };
  /**
   * The cheapest honest test of fit, doable this month, from anywhere, for
   * nothing. Liking the idea of a job and liking the work are different facts,
   * and this is how a student finds out which one they have.
   */
  tryItNow: string;
  /**
   * Neighbouring areas — titles from this same registry — for the student who
   * is close but not quite. A unit test checks every one of them resolves.
   */
  adjacent: string[];
};

export const CAREER_AREAS_BY_FACULTY: Record<FacultyValue, CareerArea[]> = {
  engineering: [
    {
      title: "Machines & manufacturing",
      what: "Designing physical things that move — and the factories that make them.",
      roles: [
        "Mechanical engineer",
        "Robotics engineer",
        "Mechatronics engineer",
        "Automotive engineer",
        "Manufacturing engineer",
      ],
      path: "An engineering degree. Start now by building and fixing things: robotics, a design contest, CAD.",
      values: ["creating", "stability"],
      dayToDay:
        "Most of the week is CAD models, tolerance and load calculations, and arguing with a supplier about why the part that arrived is not the part you drew. Then a prototype fails on the bench and you spend two days finding out whether it was the design, the material or the way it was assembled. Engineers here live between a screen and a workshop, and the people who enjoy it are the ones who like the workshop half.",
      catch:
        "It is slower than software by an order of magnitude: a change you make this month may not be in a physical product for a year, and a mistake caught late costs real metal. Manufacturing work also follows factories, which means the good jobs are in industrial towns rather than capital cities, and pay in this sector is steady rather than spectacular.",
      suitsYou:
        "You like the workshop half as much as the screen half, and you would rather make an existing thing lighter, cheaper and possible to build at scale than start something new every quarter. Living near the factory rather than in a capital city sounds fine to you.",
      notForYou:
        "You need to see your work in front of people quickly. A change you make this month may not reach a physical product for a year — if that pace would frustrate you, building software or product design gives the same appetite for making things a feedback loop measured in days.",
      misconception:
        "That it is mostly designing exciting new machines. In practice most mechanical work is incremental — making an existing thing cheaper, lighter, quieter or possible to build at scale — and being good at that is what a career is made of.",
      stages: {
        school:
          "Physics and maths seriously, plus anything that puts a tool in your hand: robotics club, fixing bikes or electronics, learning one CAD package (Fusion 360 and FreeCAD are free for students).",
        study:
          "A mechanical, mechatronics or manufacturing engineering degree — four years heavy on mechanics, thermodynamics, materials and drawing. Expect long lab reports and group design projects; most programmes require an industrial internship, and that internship is usually where your first job comes from.",
        first:
          "You start as a junior design or production engineer on one small subsystem — a bracket, a jig, a test rig — not on the whole machine. The first two years are mostly learning how your industry's standards, suppliers and tolerances actually work; the interesting design responsibility arrives after that.",
      },
      tryItNow:
        "Model something real in free CAD — a part from a broken appliance, measured with calipers — and try to make it printable or machinable. The gap between the drawing and the thing that actually fits is exactly what this job is.",
      adjacent: ["Electronics, energy & hardware", "Aerospace & space", "Making objects & craft"],
    },
    {
      title: "Building & infrastructure",
      what: "Making sure buildings, bridges, roads and water systems are safe and stand up.",
      roles: [
        "Civil engineer",
        "Structural engineer",
        "Transport planner",
        "Water & environmental engineer",
        "Construction manager",
      ],
      path: "A civil engineering degree, built on physics and maths. Bridge-building and structures contests are a real first taste.",
      values: ["creating", "stability", "impact"],
      dayToDay:
        "Drawings, codes and site visits. You size beams and foundations against a national design standard, check someone else's calculations, answer questions from the contractor about what the drawing meant, and write the report that lets the work be signed off. A large share of the job is coordination — the structure, the pipes, the electrics and the architect all want the same space.",
      catch:
        "The responsibility is legal and personal: your signature says the thing will stand up, and that weight never quite leaves. The work is also bound to the local rulebook, so moving country often means re-qualifying, and site-based roles mean travel, mud and early mornings rather than a desk.",
      suitsYou:
        "You are steadied rather than frightened by carrying responsibility, you like coordinating people around a physical problem, and you can find real satisfaction in ordinary roads, drainage and water rather than in landmark bridges.",
      notForYou:
        "You expect to move country freely with your qualification. This one is bound to a national rulebook and a licence, so relocating usually means re-qualifying — and if mud, site visits and early mornings are not for you, the desk half of this field is smaller than it looks from outside.",
      misconception:
        "That it is about designing landmark bridges. Almost all of it is ordinary buildings, roads, drainage and water — the invisible infrastructure a country runs on — and the skill being paid for is judgement about safety and cost, not visual imagination.",
      stages: {
        school:
          "Physics and maths, and a habit of looking at how things around you are actually held up. Bridge-building competitions and any construction-adjacent summer work teach more than reading does.",
        study:
          "A civil or structural engineering degree: statics, materials, soil mechanics, hydraulics, and a great deal of drawing. Many countries then require a period of supervised practice before you can sign off work independently — check that ladder for the country you intend to work in, because it is what turns the degree into a licence.",
        first:
          "Junior engineer in a design office or on site, doing calculation checks, drawing revisions and quantity take-offs under someone senior. Expect a few years before you are trusted with a design of your own; the licence, not the degree, is the milestone that changes your work.",
      },
      tryItNow:
        "Build the strongest bridge you can from spaghetti or paper, load it until it breaks, then work out from the wreckage which member failed and why. That loop — predict, test, explain the failure — is the whole discipline in miniature.",
      adjacent: ["Machines & manufacturing", "Space & the built environment", "Environment & climate"],
    },
    {
      title: "Electronics, energy & hardware",
      what: "The circuits, chips and power systems behind devices and the grid.",
      roles: [
        "Electrical engineer",
        "Electronics / embedded engineer",
        "Power & grid engineer",
        "Renewable-energy engineer",
        "Semiconductor engineer",
      ],
      path: "An electrical engineering degree. Electronics kits and hardware projects are the accessible start.",
      values: ["creating", "money", "stability"],
      dayToDay:
        "Schematics and board layout, then a bench: oscilloscope, power supply, and a board that does almost what you intended. Embedded work means writing C for a chip with very little memory and debugging problems that could be your code, the board, or the physics. Power and grid work is more calculation and regulation, and far more about protection and failure modes than about generation.",
      catch:
        "The feedback loop runs through hardware, so every mistake costs a board revision and weeks of waiting. Semiconductor and chip work in particular is concentrated in a handful of places in the world, so the best jobs in it usually require moving — and the field carries more physics and maths than students expect right through the career, not just the degree.",
      suitsYou:
        "You enjoy reasoning about a system you cannot see directly, and your instinct when something misbehaves is to reach for an instrument before reaching for the code. You are comfortable that the physics and the maths do not stop after the degree.",
      notForYou:
        "You want fast iteration. Every mistake here costs a board revision and weeks of waiting — and the strongest chip and semiconductor work sits in a handful of places in the world, so if you cannot or will not move to one of them, that ceiling is real rather than theoretical.",
      misconception:
        "That it is 'the electricity version of programming'. The constraints are physical — heat, noise, interference, current limits — and most of the skill is in reasoning about a system you cannot fully see, using instruments to infer what is happening inside it.",
      stages: {
        school:
          "Physics, maths, and an actual soldering iron. An Arduino or ESP32 and a handful of sensors will teach you more in a month than a year of reading; get one thing blinking, then make it measure something real.",
        study:
          "An electrical, electronics or embedded systems degree — circuits, signals, electromagnetics, control, plus low-level programming. It is one of the more mathematically demanding engineering routes, and the lab work is where the learning actually happens.",
        first:
          "A junior role testing, characterising or supporting an existing product rather than designing a new one. Expect to spend your first year learning the company's test equipment and process; design ownership comes once you have proved you can find a fault nobody else could.",
      },
      tryItNow:
        "Build something that senses the real world and reacts — a plant-moisture alarm, a room thermometer that logs to a file. When it behaves oddly, resist rewriting the code and instead measure the signal; that instinct is the job.",
      adjacent: ["Machines & manufacturing", "Building software & products", "Space & the universe"],
    },
    {
      title: "Aerospace & space",
      what: "Designing and testing aircraft, rockets, satellites and spacecraft.",
      roles: [
        "Aerospace engineer",
        "Avionics engineer",
        "Propulsion engineer",
        "Satellite / systems engineer",
        "Flight-test engineer",
      ],
      path: "An aerospace or mechanical degree. Rocketry, CanSat and space-design challenges are the entry point.",
      values: ["creating", "impact"],
      dayToDay:
        "Simulation, analysis and documentation, in that proportion. You model a structure or a flow, run the case, argue about whether the model is trustworthy, and write it up so that a reviewer two levels above you can be convinced. Test campaigns are intense and rare; the months between them are calculation and paperwork, because in this industry the paperwork is what makes a thing allowed to fly.",
      catch:
        "It is the most security-restricted field on this list: a great many aerospace and defence jobs require citizenship or a security clearance in the country where the work is, which closes them to international students regardless of ability. Programmes also move slowly and are cancelled by politics, so you can spend years on something that never flies.",
      suitsYou:
        "You are patient enough to spend months on analysis and documentation between rare test campaigns, and you find aviation as genuinely interesting as space — because that is where the large majority of the work actually is.",
      notForYou:
        "Your passport will not clear the security requirements where you want to work. Check that before you choose a degree, not after: a great many aerospace and defence roles require citizenship or a clearance in the country of the work, and no amount of ability opens them.",
      misconception:
        "That the industry is astronauts and launches. It is overwhelmingly analysis, certification and incremental improvement of aircraft and satellites — and the large majority of aerospace employment is aviation, not space.",
      stages: {
        school:
          "Physics and maths at the highest level you can take. Model rocketry, CanSat and drone building are the real entry point, and they show up in applications precisely because they are hands-on.",
        study:
          "Aerospace, or mechanical with an aerospace specialisation — aerodynamics, propulsion, structures, control and a lot of simulation. Check the citizenship rules of the countries you might work in BEFORE choosing where to study; it is the one constraint here that ability cannot overcome.",
        first:
          "A junior analyst or test engineer inside one narrow subsystem, working to a standard you did not write. The field rewards patience: seniority here is measured in programmes seen through, and those take years each.",
      },
      tryItNow:
        "Fly a rocket you designed, or run a free flight simulator and try to fly a precise approach. Then read an official accident investigation report end to end — the way that document reasons from evidence to cause is exactly how this industry thinks.",
      adjacent: ["Machines & manufacturing", "Electronics, energy & hardware", "Space & the universe"],
    },
  ],
  computer_science: [
    {
      title: "Building software & products",
      what: "Making the apps, websites and systems people use every day.",
      roles: [
        "Software engineer",
        "Frontend / backend developer",
        "Mobile developer",
        "DevOps / platform engineer",
        "QA engineer",
        "Product manager",
      ],
      path: "A CS degree or self-taught — either works if you ship projects. The one thing that matters: write a lot of code.",
      values: ["money", "creating", "freedom"],
      dayToDay:
        "Less typing than people imagine. A working day is reading existing code to understand why it does what it does, a couple of hours of actual writing, reviewing colleagues' changes, and meetings deciding what is worth building at all. A large share of the job is maintaining and changing software that already exists and that someone else wrote, often years ago.",
      catch:
        "The knowledge decays: tools and frameworks you are expert in today are legacy in six years, so you are signing up to keep learning for the whole career. The work is also sedentary and screen-bound, remote roles can be isolating, and entry-level hiring is now genuinely competitive — 'learn to code and get hired' was true a decade ago and is a weaker promise today.",
      suitsYou:
        "You are willing to keep learning for the whole career rather than for the degree, you would rather understand why someone else's code does what it does than write everything from scratch, and you can explain a trade-off to a person who disagrees with you.",
      notForYou:
        "You want a body of knowledge that stays true, or you are choosing this because you were told it guarantees a job. The tools decay every few years, and entry-level hiring is genuinely competitive now — that promise was much stronger a decade ago than it is today.",
      misconception:
        "That it is a solitary job for people who like machines more than people. Past the first year or two, the constraint on your work is almost always communication — explaining a trade-off, disagreeing well in a review, understanding what the person asking actually needs.",
      stages: {
        school:
          "Write code weekly, on things you personally want to exist. One finished, used, deployed small project teaches more than ten tutorials, and it is also the only evidence anyone can look at.",
        study:
          "A CS degree gives you the durable half — algorithms, systems, networks, how a computer actually works — which is the part that does not go stale. Self-teaching genuinely works in this field, but it puts the burden of that foundation on you, and visa routes to work abroad usually assume a degree.",
        first:
          "You join a team and spend months reading its codebase before you meaningfully change it. First tasks are small bug fixes and tests, deliberately: they are how you learn the system and how the team learns to trust you.",
      },
      tryItNow:
        "Build one small thing you will actually use, put it online, and give the link to someone. The distance between 'it works on my machine' and 'a stranger used it' is where the profession lives.",
      adjacent: ["Data & AI", "Games & interactive", "Digital & product design"],
    },
    {
      title: "Data & AI",
      what: "Finding patterns in data and building the models behind predictions and AI.",
      roles: [
        "Data analyst",
        "Data scientist",
        "Machine-learning engineer",
        "Data engineer",
        "AI researcher",
      ],
      path: "CS, statistics or maths. Data and ML contests (Kaggle, Zindi) are how you prove it early.",
      values: ["money", "creating"],
      dayToDay:
        "Most of the week is not modelling. It is finding the data, discovering it is inconsistent, deciding what a row actually means, and building the pipeline that keeps it arriving. Then a model, then the harder part: convincing a colleague who does not trust statistics that the number is real, and finding out whether it changed any decision at all.",
      catch:
        "The proportion is the catch — practitioners routinely describe most of the job as data cleaning and plumbing rather than the modelling that attracted them. Analysis work can also be quietly ignored: you produce a correct answer, and the organisation does what it was going to do anyway. And this is the area where the tooling is being rewritten fastest, so today's specific skills have the shortest half-life on this list.",
      suitsYou:
        "You are curious about what a number actually means, patient with data that arrives inconsistent, and as interested in whether an answer changed a decision as in whether the model was clever.",
      notForYou:
        "You are here for the modelling. Most of the week is finding, cleaning and plumbing data, and a correct answer can be politely ignored by the organisation that asked for it — if that would grind you down, building software keeps more of the making and less of the persuading.",
      misconception:
        "That it is mainly about choosing clever algorithms. In practice the wins come from better data and a sharper question; a simple model on good data beats a sophisticated one on bad data almost every time.",
      stages: {
        school:
          "Maths, especially statistics and probability — that is the part that transfers to everything. Learn Python and pull a real dataset about something you care about, then answer one honest question with it.",
        study:
          "CS, statistics, maths or an applied science with heavy data work. Statistics is the durable core; the frameworks are learnable in weeks, but knowing whether a result means anything is a degree's worth of training.",
        first:
          "Usually analyst before scientist: dashboards, reports, and answering other people's questions. That is not a detour — it is how you learn what the organisation's data actually represents, without which no model of it is trustworthy.",
      },
      tryItNow:
        "Enter a beginner Kaggle or Zindi competition and submit something bad deliberately, just to complete the loop once. Then improve it twice and notice which change helped — that is the whole feedback mechanism of the field.",
      adjacent: ["Building software & products", "Health technology & data", "Economics & policy"],
    },
    {
      title: "Security & systems",
      what: "Defending systems from attacks — and breaking into them legally to find the holes first.",
      roles: [
        "Cybersecurity analyst",
        "Penetration tester",
        "Security engineer",
        "Cloud / network engineer",
        "Digital-forensics analyst",
      ],
      path: "CS or a security track. Capture-the-flag contests like picoCTF are the accessible way in.",
      values: ["money", "stability"],
      dayToDay:
        "Defensive work is monitoring, triage and patching: alerts arrive, most are noise, and the skill is deciding fast which one is not. Offensive work is scoped and legal — you are hired to attack a specific system in a specific window, and the deliverable is a written report that explains the hole clearly enough to be fixed. Both halves involve far more writing than students expect.",
      catch:
        "Security runs on someone else's schedule: incidents do not respect evenings, and on-call rotations are normal. It is also structurally adversarial and mostly thankless — you are measured by things that did not happen, and the day you are visible is the day something went wrong. Burnout in this corner of the industry is a well-documented problem, not a rumour.",
      suitsYou:
        "You stay calm in front of an alert queue, you write clearly enough that someone else can act on it, and you can accept being measured by things that did not happen. Curiosity about how systems break, rather than a wish to break them, is the right motive here.",
      notForYou:
        "You need your evenings. Incidents do not respect them, on-call rotations are normal, and burnout in this corner of the industry is documented rather than rumoured — and if you pictured film-style hacking, most real work is configuration, permissions, patching and logging.",
      misconception:
        "That it is hacking, in the film sense. Most real security work is unglamorous hygiene — configuration, permissions, patching, logging — and the majority of breaches exploit ordinary human and process failures rather than exotic technical ones.",
      stages: {
        school:
          "Learn how systems work before learning to break them: networking basics, Linux, a scripting language. picoCTF and similar capture-the-flag events are free, legal and genuinely representative.",
        study:
          "CS, or a dedicated cybersecurity programme. Certifications carry unusual weight in this field compared with others, and many employers value demonstrable lab work and CTF results as much as coursework.",
        first:
          "Often a security operations centre: shifts, alert queues and rapid triage. It is demanding and repetitive, and it is also the fastest way to learn what real attacks look like as opposed to textbook ones.",
      },
      tryItNow:
        "Do the beginner track of a free CTF, and when you solve a challenge write up how — clearly enough for someone else to follow. The write-up is the actual professional artefact, and being good at it is rarer than being good at the puzzle.",
      adjacent: ["Building software & products", "Data & AI", "Courts & public service"],
    },
    {
      title: "Games & interactive",
      what: "Building games and interactive worlds — the code, the systems, the feel.",
      roles: [
        "Game developer",
        "Game designer",
        "Graphics / engine programmer",
        "Technical artist",
        "VR / AR developer",
      ],
      path: "CS plus game jams. Making one small finished game beats a long unfinished one.",
      values: ["creating", "freedom"],
      dayToDay:
        "Building systems and then tuning them by feel: an enemy is not 'done' when it works, but when it feels right, which is decided by playing the same thirty seconds a hundred times. Days are engine work, performance budgets, tooling for the artists and designers, and a great deal of iteration on things players will never consciously notice.",
      catch:
        "This is the hardest bargain on the list, and it should be stated plainly: games pay less than equivalent software work, job security is weaker because studios staff up and lay off around project cycles, and long crunch periods before release remain common in parts of the industry. People do it because they love the medium — that is a real reason, but go in knowing the price.",
      suitsYou:
        "You love the medium enough to pay a price for it, you finish what you start, and you can play the same thirty seconds a hundred times to judge whether it feels right rather than whether it works.",
      notForYou:
        "You need steady income, or games are how you rest. Studios staff up and lay off around project cycles, the pay sits below equivalent software work, and many people find that building games for a living removes playing them as recovery.",
      misconception:
        "That working in games means playing games. Playing your own build for the two-hundredth time to judge a jump arc is a different activity, and many people find it removes games as their form of rest.",
      stages: {
        school:
          "Make small finished games. A jam game completed in a weekend is worth more than an ambitious project abandoned at 30%, because finishing is the skill studios cannot teach you.",
        study:
          "CS with graphics and maths — linear algebra especially — or a dedicated games programme. Be sceptical of courses that teach one engine and little computer science: engines change, and the underlying craft is what transfers.",
        first:
          "Junior roles are narrow: UI, tools, one gameplay system, or QA as a genuine route in. A portfolio of finished small games is the hiring currency, more than a transcript.",
      },
      tryItNow:
        "Enter a game jam with a strict theme and a 48-hour limit and finish something, however small. What you learn about scoping under a deadline is the single most transferable lesson in this area.",
      adjacent: ["Building software & products", "Film, animation & sound", "Digital & product design"],
    },
  ],
  business_economics: [
    {
      title: "Starting & running a business",
      what: "Building a company and keeping it running — the product, the money, the team.",
      roles: [
        "Founder",
        "Operations manager",
        "Product manager",
        "Business-development lead",
        "Small-business owner",
      ],
      path: "Any degree, or none — you learn by doing it. Sell something small now; a startup or pitch contest is a real start.",
      values: ["freedom", "money", "creating"],
      dayToDay:
        "Whatever is most broken that day. Talking to customers, chasing an unpaid invoice, hiring, firing, fixing the thing the supplier got wrong, and doing the unglamorous administrative work nobody else will. The founder's actual job is deciding what not to do, and then selling — to customers, to staff, sometimes to investors — for far more hours than the product work you imagined.",
      catch:
        "Most new businesses do not survive their first years, and the failure is not usually dramatic — it is running out of money slowly while working harder than anyone around you. The income is irregular in a way that is hard to plan a life around, and the responsibility for other people's wages does not switch off at weekends.",
      suitsYou:
        "You would rather decide what not to do than be told what to do, you can sell without embarrassment, and irregular income is something your circumstances can genuinely absorb for a few years rather than something you are hoping to survive.",
      notForYou:
        "You need a predictable salary, or you are waiting for the right idea to arrive. Most new businesses run out of money slowly while the founder works harder than everyone around them — and joining a small company early teaches the same lessons on someone else's money.",
      misconception:
        "That it starts with an idea. Ideas are cheap and nearly always wrong at first; the businesses that work are the ones that found a real, repeatedly painful problem someone will pay to remove, and then survived long enough to fix it properly.",
      stages: {
        school:
          "Sell something small and real — repairs, tutoring, a service for local businesses — and keep the accounts honestly. Earning the first money from a stranger teaches more than any competition.",
        study:
          "Any degree, or none. What a business or economics degree gives you is the shared language of finance and the network; what it cannot give you is customers. Many strong founders study something else entirely and start on the side.",
        first:
          "Two routes, and both are respectable: start something tiny yourself, or join a small company early and watch how the whole machine works from close up. The second is the lower-risk way to learn the same lessons on someone else's money.",
      },
      tryItNow:
        "Find one person with a problem you could solve this month and try to charge them for it — even a very small amount. Their answer is worth more than any business plan you could write.",
      adjacent: ["Marketing & growth", "Strategy & consulting", "Money & markets"],
    },
    {
      title: "Money & markets",
      what: "Deciding where money should go, and keeping the numbers honest.",
      roles: [
        "Financial analyst",
        "Investment banker",
        "Asset / portfolio manager",
        "Accountant / auditor",
        "Actuary",
        "Risk analyst",
      ],
      path: "Finance or economics. Investment and trading competitions (like Wharton's) are the accessible proving ground.",
      values: ["money", "stability"],
      dayToDay:
        "Spreadsheets, and the arguments behind them. You build a model of a company or a portfolio, stress it against assumptions you have to defend, and write the memo that recommends something. Accounting and audit work is closer to disciplined verification: tracing what actually happened against what was reported, and documenting it so it holds up to review.",
      catch:
        "The hours in the entry-level investment roles are genuinely punishing — long nights and weekends are the normal expectation, not the exception, and that is the trade being made for the pay. It is also cyclical: this is one of the first sectors to cut staff in a downturn, and much of the routine analytical work is being automated.",
      suitsYou:
        "You are disciplined rather than bold, you like defending an assumption in detail, and the long entry-level hours are a trade you are making with your eyes open rather than one you will find out about in your first month.",
      notForYou:
        "You want to predict markets, or you want protected time outside work. Nights and weekends are the normal expectation in entry-level investment roles, this is one of the first sectors to cut staff in a downturn, and much of the routine analysis is being automated.",
      misconception:
        "That it is about predicting markets. Most of the work is valuation, risk and process — being careful and consistent about what a thing is worth and what could go wrong — and the people who last are the disciplined ones rather than the bold ones.",
      stages: {
        school:
          "Maths, and get genuinely fast in a spreadsheet. Investment and trading competitions give you the vocabulary early; running a small paper portfolio and writing down WHY you bought each thing teaches judgement.",
        study:
          "Finance, economics or accounting — though this sector also hires maths, physics and engineering graduates for quantitative roles. Professional qualifications (CFA, ACCA and their national equivalents) matter here more than in most fields.",
        first:
          "Junior analyst work: building and checking models, gathering data, preparing decks. Expect the first years to be about accuracy and stamina rather than insight; judgement is what you are being trained toward, not hired for.",
      },
      tryItNow:
        "Pick one company you can research, build a simple valuation of it in a spreadsheet, and write a one-page argument for or against owning it. Then have someone attack the assumptions — that conversation is the job.",
      adjacent: ["Economics & policy", "Strategy & consulting", "Starting & running a business"],
    },
    {
      title: "Strategy & consulting",
      what: "Helping organisations solve hard problems and make big decisions.",
      roles: [
        "Management consultant",
        "Business analyst",
        "Strategy analyst",
        "Supply-chain / operations analyst",
      ],
      path: "Business, economics or a strong analytical degree. Case competitions mirror the actual work.",
      values: ["money", "people"],
      dayToDay:
        "Interviews, analysis and slides. You are dropped into an industry you knew nothing about a fortnight ago, interview the people who do know it, build the analysis that structures the problem, and present a recommendation to people far more senior than you. The craft being trained is structured thinking under time pressure — and the ability to say something clear when the data is incomplete.",
      catch:
        "Travel and hours, and a peculiar kind of distance: you recommend, others decide, and you often leave before finding out whether it worked. It is also famously an 'up or out' career structure in the large firms, which is bracing rather than secure, and the constant novelty means you rarely become deeply expert in anything.",
      suitsYou:
        "You think fast and structure well, you are comfortable saying something clear while the data is still incomplete, and constant novelty appeals to you more than becoming deeply expert in one industry.",
      notForYou:
        "You want to see your recommendation through. You advise, others decide, and you often leave before finding out whether it worked — and if heavy travel and an up-or-out structure read as draining rather than bracing, this is the wrong shape of career for you.",
      misconception:
        "That consultants are hired because they know the answer. They are usually hired for capacity, an outside view, or political cover for a decision already half-made — understanding that is what separates people who are effective in the job from people who are frustrated by it.",
      stages: {
        school:
          "Debate, case competitions and any position where you had to persuade a room. Learn to structure an argument in three points and defend it — that is the entire selection criterion later.",
        study:
          "Business, economics, engineering, law — the large firms recruit broadly from strong analytical degrees. What they screen for is the case interview, which is a learnable skill you should start practising a year before you apply.",
        first:
          "Analyst on one workstream of a larger project: research, models, and the slides that carry them. Feedback is fast and blunt, which is the main reason people find the first two years steep and valuable.",
      },
      tryItNow:
        "Take a real local business, spend an hour working out how it actually makes money, and write three slides on the one change you would make. Force yourself to defend it against the strongest objection you can think of.",
      adjacent: ["Money & markets", "Starting & running a business", "Economics & policy"],
    },
    {
      title: "Marketing & growth",
      what: "Getting people to find, understand and choose a product.",
      roles: [
        "Brand manager",
        "Digital-marketing specialist",
        "Growth / performance marketer",
        "Market researcher",
        "PR specialist",
      ],
      path: "Marketing, business or communications — or a portfolio of things you actually grew. Running a real page, shop or campaign counts.",
      values: ["creating", "people", "freedom"],
      dayToDay:
        "Running experiments and reading the results. You write the message, choose where it appears, set a budget, and then look at what actually happened — which is usually less than you hoped. Performance work is very numerical; brand work is much more about judgement, research and consistency over years. Both involve a lot of writing.",
      catch:
        "You are measured constantly and publicly, and the numbers are often outside your control — a market shifts, a platform changes its rules overnight, and the results move without you doing anything wrong. It is also the function that gets cut first when a company tightens, and the channels you specialise in keep being replaced.",
      suitsYou:
        "You like running experiments and reading the honest result, you write a great deal without minding it, and you can stay relentlessly consistent about one specific customer for years rather than reaching for the next clever idea.",
      notForYou:
        "You want your results to reflect your effort. A platform changes its rules overnight and the numbers move without you having done anything wrong — and this is usually the first function cut when a company tightens, which is a structural fact rather than bad luck.",
      misconception:
        "That it is about being creative and clever. The largest part of doing it well is unglamorous: understanding a specific customer properly, then being relentlessly consistent — most campaigns fail on a wrong audience, not on a weak idea.",
      stages: {
        school:
          "Run something real with an audience — a page, a small shop, an event, a school campaign — and pay attention to what made the numbers move. That record is the portfolio.",
        study:
          "Marketing, business or communications; also fine from psychology, design or journalism. Employers here weigh demonstrable results and a portfolio unusually heavily against the transcript.",
        first:
          "Executing rather than deciding: scheduling, copy, reports, campaign admin. The judgement about strategy arrives once you have watched enough campaigns succeed and fail to have an instinct worth paying for.",
      },
      tryItNow:
        "Take something you want people to do — attend, buy, sign up — write two different messages for it, show each to a different group, and count. That is the whole discipline compressed into a week.",
      adjacent: ["Starting & running a business", "Words & media", "Digital & product design"],
    },
    {
      title: "Economics & policy",
      what: "Studying how money, markets and policy shape a country, and advising on them.",
      roles: [
        "Economist",
        "Economic / policy analyst",
        "Central-bank or ministry analyst",
        "Development economist",
      ],
      path: "An economics degree. Economics olympiads and essay contests are the entry point.",
      values: ["impact", "stability"],
      dayToDay:
        "Data, models and memos. You assemble the evidence on a question — what a tax change would do, how a region's labour market is shifting — build or run a model of it, and write it up for people who will decide something. In a ministry or central bank, a large part of the work is the careful, heavily reviewed writing that turns analysis into advice.",
      catch:
        "Influence is slow and indirect: you can be right and see nothing change for years, because the decision belongs to politics rather than to evidence. Public-sector pay is modest compared with the private roles the same degree opens, and the good jobs in international institutions are extremely competitive.",
      suitsYou:
        "You are genuinely quantitative, you write carefully and can bear having that writing heavily reviewed, and you can be right for years without seeing anything change — because the decision belongs to politics rather than to your evidence.",
      notForYou:
        "You want your earnings to match what the same degree opens in the private sector, or you want to see the effect of your work. Public-sector pay is modest for the training, and the international-institution roles are extremely competitive to reach.",
      misconception:
        "That economics is about money. Most of it is about how people and systems respond to incentives and constraints — which is why economists end up working on health, education, transport and climate as much as on markets.",
      stages: {
        school:
          "Maths matters more than most applicants expect — modern economics is heavily quantitative. Economics olympiads and essay competitions are the accessible proving ground, and reading a central bank's own published reports shows you what the writing actually looks like.",
        study:
          "An economics degree, ideally with real statistics and econometrics. For research and central-bank work a master's is close to standard, and the mathematical bar for good graduate programmes is high.",
        first:
          "Junior analyst in a ministry, bank, regulator or think tank: cleaning data, replicating existing analysis, drafting sections of longer reports. Credibility here is built by being reliably correct in small things.",
      },
      tryItNow:
        "Take one policy argument you hear often locally, find the actual published data behind it, and write 800 words on whether the data supports it. The discomfort of that exercise is the profession.",
      adjacent: ["Money & markets", "Politics, policy & the world", "Data & AI"],
    },
  ],
  natural_sciences: [
    {
      title: "Research & discovery",
      what: "Running experiments to find out how the world works — physics, chemistry, biology.",
      roles: [
        "Research scientist",
        "Physicist",
        "Chemist",
        "Biologist",
        "University researcher / lecturer",
      ],
      path: "A science degree, then usually a PhD. Real research programs and science fairs (ISEF) start it early.",
      values: ["freedom", "impact"],
      dayToDay:
        "Long stretches of careful repetition punctuated by rare, genuine surprise. You plan an experiment, run it, find the equipment or the sample was the problem, run it again, and record everything. The other half of the job is writing — papers, grant applications, reviews — because in research, work that is not written up and funded does not continue.",
      catch:
        "The academic career structure is the honest problem: far more people are trained as researchers than there are permanent research posts, so many spend years on short fixed-term contracts, often moving country each time, before finding out whether a stable position exists for them. Pay during those years is modest, and a great deal of the job is chasing funding rather than doing science.",
      suitsYou:
        "You find it satisfying to establish carefully that something is not the case, you write well and often, and you can accept several years of fixed-term contracts — frequently in a different country each time — before knowing whether a permanent post exists for you.",
      notForYou:
        "You need a settled life in a chosen city by your late twenties. Far more people are trained as researchers than there are permanent posts — and if chasing funding rather than doing science would feel like a betrayal, industry research asks much less of you on that front.",
      misconception:
        "That it is about discovery. It is mostly about elimination — establishing carefully that something is not the case — and a successful career is built from many small, solid, unexciting results rather than one breakthrough.",
      stages: {
        school:
          "Depth in one science plus real maths. Science fairs and any genuine lab placement matter, because they show whether you like the daily reality of experiments rather than the idea of them.",
        study:
          "A science degree, then in most cases a PhD — which is an apprenticeship in research, typically paid a stipend, lasting several years. Choose the supervisor and group at least as carefully as the university; that relationship shapes the entire experience.",
        first:
          "Postdoctoral research: fixed-term, usually abroad, working on someone else's grant while trying to build your own record. This is the stage where people decide whether to continue in academia or take their training to industry, and both are ordinary outcomes.",
      },
      tryItNow:
        "Do one small experiment properly — a real question, a control, repeats, and an honest write-up of what went wrong. Then read a paper in the field and see how much of it is method and caveat rather than result.",
      adjacent: ["Applied science & industry", "Space & the universe", "Research & new treatments"],
    },
    {
      title: "Environment & climate",
      what: "Studying ecosystems, the climate and the earth — to understand and protect them.",
      roles: [
        "Environmental scientist",
        "Climate / atmospheric scientist",
        "Ecologist",
        "Geologist",
        "Sustainability analyst",
      ],
      path: "Environmental or earth science. Field projects and climate challenges are the accessible first step.",
      values: ["impact", "people"],
      dayToDay:
        "A mix that varies by role: fieldwork collecting samples or measurements, lab or model work turning them into numbers, and a great deal of reporting against regulations. Consultancy work — the largest employer in practice — means environmental impact assessments, monitoring and compliance documents for construction, mining and energy projects.",
      catch:
        "Much of the paid work sits inside the industries the field is often imagined to oppose, and the job is frequently to document and mitigate harm rather than to prevent it. Progress is slow and politically contingent, fieldwork can be physically hard and seasonal, and the salaries are generally lower than in adjacent technical fields.",
      suitsYou:
        "You can be scrupulously neutral about what your data does and does not show, including when the answer is inconvenient, and you are willing to do the measuring and the reporting that is what makes you trusted.",
      notForYou:
        "You came to fight for the environment. Most of the paid work sits inside the industries this field is imagined to oppose, and the job is often to document and mitigate harm rather than to prevent it — policy, advocacy and campaigning suit that motive far better.",
      misconception:
        "That it is activism with a degree. Professionally it is measurement and evidence — and being trusted depends on being scrupulously neutral about what your data does and does not show, including when the answer is inconvenient.",
      stages: {
        school:
          "Chemistry, biology, geography and statistics. Join any real monitoring or restoration project locally; the ability to say you have collected field data properly is worth more than enthusiasm.",
        study:
          "Environmental science, ecology, earth science or geography, with as much data and GIS work as you can take. The quantitative half is what separates people who advise from people who assist.",
        first:
          "Junior consultant or field technician: surveys, sampling, and writing sections of assessment reports to a template. Professional accreditation in the country you work in tends to be the milestone that raises your responsibility.",
      },
      tryItNow:
        "Measure something in your own area over several weeks — air quality, water, plant or bird counts — with a consistent method, and write up what you found and what you cannot conclude. That last part is the science.",
      adjacent: ["Research & discovery", "Building & infrastructure", "Health of whole populations"],
    },
    {
      title: "Space & the universe",
      what: "Studying matter, energy and everything beyond the atmosphere — from particles to galaxies.",
      roles: [
        "Astronomer",
        "Astrophysicist",
        "Planetary scientist",
        "Instrument / observatory specialist",
        "Space-mission analyst",
      ],
      path: "A physics degree. Physics olympiads and astronomy challenges are how you test the fit.",
      values: ["freedom", "creating"],
      dayToDay:
        "Programming and statistics, far more than telescopes. Modern astronomy is largely computational: you work with archived survey data, write code to process it, and spend weeks establishing that a signal is not an artefact of your instrument or your method. Observing time is scarce, competitive, and increasingly done remotely rather than at an eyepiece.",
      catch:
        "It is one of the narrowest job markets on this list — permanent positions are few relative to the number of people trained, and the path to one runs through several fixed-term postdoctoral posts in different countries. Most physics and astronomy graduates ultimately build careers outside the field, which is a good outcome but not the one they pictured.",
      suitsYou:
        "You enjoy the mathematics for its own sake and not only the subject matter, and you are content that the sky arrives as files to be processed rather than through an eyepiece on a cold night.",
      notForYou:
        "You want this specific field or nothing. Permanent positions are few relative to the number of people trained, the route to one runs through several fixed-term posts in different countries, and most graduates build their careers elsewhere — a good outcome, but not the pictured one.",
      misconception:
        "That you spend nights looking through a telescope. You spend days in front of code, and the sky arrives as files. The romance of the subject is real, but it lives in the questions, not in the working conditions.",
      stages: {
        school:
          "Physics and maths as far as you can push them, and learn to program early — Python is the field's working language. Physics olympiads test exactly the kind of problem-solving the degree demands.",
        study:
          "A physics degree, then a PhD for research work. The mathematical load is heavy and front-loaded; people who enjoy the maths for its own sake tend to thrive, and people who only love the subject matter tend to struggle in the middle years.",
        first:
          "A PhD position, then postdoctoral work abroad. Alongside that, be aware that the skills — large-scale data analysis, simulation, statistics — transfer directly into data and quantitative work, and many people move that way by choice.",
      },
      tryItNow:
        "Take real public survey data from an observatory archive and try to reproduce a known result with your own code. Discovering how much processing sits between the sky and a published graph is the honest preview.",
      adjacent: ["Research & discovery", "Aerospace & space", "Data & AI"],
    },
    {
      title: "Applied science & industry",
      what: "Turning science into real products — medicines, materials, food, evidence.",
      roles: [
        "Biotechnologist",
        "Materials scientist",
        "Pharmaceutical / QC scientist",
        "Food scientist",
        "Forensic scientist",
        "Agronomist",
      ],
      path: "Biology, chemistry or biotechnology. Competitions like iGEM are a genuine early taste.",
      values: ["creating", "stability", "money"],
      dayToDay:
        "Bench work inside a process. You run assays, formulate or test materials, and document every step to a standard that an inspector could audit years later. In regulated industries — pharmaceuticals, food, forensics — the documentation is not overhead, it is the product: work that is not recorded correctly did not happen.",
      catch:
        "The discipline that makes it employable also makes it repetitive: much of the day is following a validated procedure exactly, not improvising, and creative latitude arrives slowly and at senior levels. Lab work also carries real chemical and biological hazards, and shift patterns are common in production environments.",
      suitsYou:
        "You are precise and neat by habit, a properly kept record satisfies rather than bores you, and you would rather work on something that actually reaches people than choose the question yourself.",
      notForYou:
        "You want creative latitude early. Much of the day is following a validated procedure exactly rather than improvising, that latitude arrives slowly and at senior levels, and shift patterns and real chemical or biological hazards are part of the working environment.",
      misconception:
        "That industry science is a lesser version of academic science. It is a different job: the question is set by a product and a deadline rather than by curiosity, and the reward is that things you work on actually reach people — with the trade that you rarely choose the question.",
      stages: {
        school:
          "Chemistry and biology with genuinely careful lab technique — being precise and neat is a graded skill here, not a personality trait. Competitions like iGEM show what applied biology actually involves.",
        study:
          "Biology, chemistry, biotechnology, food or materials science. Choose programmes with substantial lab hours and, if possible, a placement year; employers in this area hire on demonstrated bench competence.",
        first:
          "Laboratory analyst or associate: running established methods, quality control, and learning the regulatory framework of your industry. Progression comes from method development and from understanding the rules well enough to change them safely.",
      },
      tryItNow:
        "Run any careful, repeatable experiment at home — fermentation, crystal growth, a titration with kitchen chemicals — and keep a proper lab notebook with dates, quantities and deviations. Whether that record-keeping bores or satisfies you is genuinely diagnostic.",
      adjacent: ["Research & discovery", "Research & new treatments", "Machines & manufacturing"],
    },
  ],
  humanities_social: [
    {
      title: "People & the mind",
      what: "Understanding why people think and behave as they do — and helping them.",
      roles: [
        "Psychologist",
        "Counsellor / therapist",
        "UX researcher",
        "Social worker",
        "HR / organisational specialist",
      ],
      path: "A psychology or social-science degree. Reading widely and psychology essay contests are the accessible start.",
      values: ["people", "impact"],
      dayToDay:
        "Clinical work is sessions, notes and supervision — an hour with a person, then the writing that records and protects it, then your own supervision to keep your judgement sound. Research and UX work is study design, recruiting participants, running interviews, and coding what people said into something a team can act on. All of it involves far more structured writing than students expect.",
      catch:
        "The clinical routes are long and licensed: in most countries an undergraduate psychology degree alone does not let you practise, and the postgraduate places are few and highly competitive. The work itself carries the weight of other people's distress, which is real and cumulative — burnout and vicarious trauma are occupational hazards the profession takes seriously.",
      suitsYou:
        "You accept that intuition about behaviour is unreliable and want to learn how to test it instead, you write structured notes willingly, and you can carry other people's distress through a working week without taking it home permanently.",
      notForYou:
        "You want to be practising soon, or you want to help people without the statistics. In most countries an undergraduate psychology degree alone does not license you, the postgraduate places are few and highly competitive, and research methods sit at the centre of the training.",
      misconception:
        "That psychology is mostly about understanding people intuitively. It is an empirical science with statistics at its centre, and a large part of training is learning why intuition about behaviour is unreliable and how to test it instead.",
      stages: {
        school:
          "Biology and maths, especially statistics, alongside reading. Any volunteering that puts you around people in difficulty tells you honestly whether the emotional side of this work suits you.",
        study:
          "A psychology or social science degree with real research methods. Then, for clinical practice, a specific postgraduate qualification and supervised hours — look up that ladder for your country early, because it determines everything about the timeline.",
        first:
          "Assistant psychologist, research assistant, support worker or junior UX researcher — supervised roles with limited autonomy. The licence, not the degree, is what changes what you are allowed to do.",
      },
      tryItNow:
        "Run five careful interviews with people about a decision they made, ask 'why' three times deeper than feels comfortable, and write up the pattern without imposing your own. That discipline is the shared core of therapy, research and UX.",
      adjacent: ["Digital & product design", "Teaching & research", "Health of whole populations"],
    },
    {
      title: "Words & media",
      what: "Investigating and telling the stories that inform people.",
      roles: [
        "Journalist",
        "Editor",
        "Writer / author",
        "Content strategist",
        "Translator",
        "Documentary researcher",
      ],
      path: "Journalism or any degree plus a lot of writing. The school paper and writing contests are the real entry.",
      values: ["creating", "freedom"],
      dayToDay:
        "Reporting is mostly contact and verification: calling people who do not want to talk to you, checking a claim against a document, and then writing fast to a length and a deadline. Editing is shaping other people's work and killing your own favourite sentences. Content and communications roles are steadier and more planned, but the underlying skill is identical — finding out what is true and saying it clearly.",
      catch:
        "The economics are hard and have been for two decades: staff jobs are fewer, freelance rates are low and payment is slow, and much of the entry-level work is unstable. In many countries journalism also carries real personal risk — legal, political or physical — and that is worth weighing honestly rather than romantically.",
      suitsYou:
        "You would rather find out what is true than write beautifully about it, you are willing to keep calling people who do not want to talk to you, and you can build a reputation piece by piece rather than through one opportunity.",
      notForYou:
        "You need financial stability early, or you are here for the writing itself. Staff jobs are fewer, freelance rates are low and paid slowly, and in many countries this work carries real legal, political or physical risk that deserves a sober rather than a romantic reading.",
      misconception:
        "That it is about writing well. Writing is the last ten per cent; the job is reporting — knowing who to ask, getting them to answer, and being able to prove what you print. Beautiful prose over thin reporting is the failure mode of every beginner.",
      stages: {
        school:
          "Write constantly and publish somewhere with an actual audience — a school paper, a blog, a local outlet. Learn to interview: it is a skill, and most people are bad at it because they talk.",
        study:
          "Journalism, or any subject plus serious writing — many of the best reporters bring expertise in economics, science or law to a beat. Clips matter more than the degree, so build them throughout.",
        first:
          "Freelancing, local outlets, junior desk or production roles. Expect to earn little early and to build a reputation piece by piece; specialising in a subject nobody else on the desk understands is the fastest route out of the entry level.",
      },
      tryItNow:
        "Report one small local story properly: three sources, a document, and 600 words that would survive someone disputing them. Publish it somewhere. That single artefact tells you more than a year of thinking about it.",
      adjacent: ["Politics, policy & the world", "Marketing & growth", "Film, animation & sound"],
    },
    {
      title: "Politics, policy & the world",
      what: "Shaping public policy and how countries and organisations deal with each other.",
      roles: [
        "Policy analyst",
        "Diplomat",
        "International-organisation officer",
        "NGO programme manager",
        "Public-affairs adviser",
      ],
      path: "Politics or international relations. Model UN and debate are the accessible proving ground.",
      values: ["impact", "people"],
      dayToDay:
        "Reading, briefing and meetings. You digest a large amount of material on a narrow question, write a short note that a busy person can act on, and spend the rest of the time coordinating between organisations that each want something slightly different. Diplomatic and NGO work adds long stretches of relationship-building whose value only shows up years later.",
      catch:
        "Progress is glacial and rarely attributable to you: the good outcome, when it comes, belongs to a committee. Entry is heavily credential- and network-driven, unpaid or low-paid internships are common gatekeepers, and diplomatic services are usually closed to non-citizens — which makes this one of the harder areas to enter as an international student.",
      suitsYou:
        "You are good at drafting and compromise, you can find the version of a position that enough parties will live with, and you do not need the good outcome to be attributable to you when it finally arrives.",
      notForYou:
        "You need to win arguments — or you are an international student aiming at a diplomatic service, which is usually closed to non-citizens. Entry here also runs heavily on credentials, networks and unpaid or low-paid internships, and that gate is worth seeing early.",
      misconception:
        "That it is about arguing persuasively for what is right. Most of the job is drafting, compromise and process — finding the version of a position that enough parties can live with — and people who need to win arguments tend to be unhappy in it.",
      stages: {
        school:
          "Model UN and debate genuinely mirror the work. Learn a second language properly; in this field it is not a nice extra, it is often the qualification.",
        study:
          "Politics, international relations, law or economics. A master's is close to standard for the international institutions, and internships during study are how nearly everyone actually gets in.",
        first:
          "Research or programme assistant in an NGO, ministry, think tank or international body: note-taking, background research, event logistics. Substance follows once you are trusted with a file of your own.",
      },
      tryItNow:
        "Take a live international dispute, write the one-page brief each side would give its own minister, then write the compromise text both could sign. Doing that honestly is the actual skill.",
      adjacent: ["Rights & advocacy", "Economics & policy", "Words & media"],
    },
    {
      title: "Teaching & research",
      what: "Researching a field of ideas or the past — and passing it on.",
      roles: [
        "Historian",
        "Sociologist / anthropologist",
        "Teacher",
        "Archivist / curator",
        "University researcher",
      ],
      path: "A humanities degree, then a PhD to research. History and essay competitions start it.",
      values: ["impact", "stability", "people"],
      dayToDay:
        "Teaching is performance and preparation in roughly equal measure, plus a large administrative tail — marking, records, meetings, and the pastoral work of noticing which student is struggling. Research is archives, sources, and long solitary drafting, interrupted by the seminars where your argument gets tested by people who know the material as well as you do.",
      catch:
        "Two different problems. School teaching is stable and needed everywhere, but the workload is heavier than outsiders believe and the pay is modest for the responsibility. University research posts are the opposite: intellectually free, and structurally scarce — humanities departments have been shrinking in many countries, so the permanent academic job is a genuinely uncertain destination.",
      suitsYou:
        "You like diagnosing why one particular person has not understood, and you are steady enough to manage thirty different states of attention at once — or patient enough for long solitary drafting and the seminars that test it.",
      notForYou:
        "You want pay that matches the responsibility, or you are counting on a permanent university post. School teaching carries a heavier workload than outsiders believe, and humanities departments have been shrinking in many countries, which makes the academic destination genuinely uncertain.",
      misconception:
        "That teaching is explaining things you know. Most of the craft is diagnosing why a particular student has not understood, and managing thirty different states of attention at once — subject knowledge is the entry ticket, not the skill.",
      stages: {
        school:
          "Read outside the syllabus and write essays that argue rather than summarise. History and essay competitions are the accessible proving ground, and tutoring younger students is the honest test of whether you like teaching.",
        study:
          "A humanities or social science degree. For school teaching, a teaching qualification and supervised practice; for research, a master's and then a PhD, which in the humanities is long, solitary and usually less well funded than in the sciences.",
        first:
          "Trainee teacher with a mentor and a reduced timetable, or doctoral researcher with teaching duties attached. Both first years are exhausting in the same specific way: you are learning to do publicly something you have only done privately.",
      },
      tryItNow:
        "Teach one 20-minute lesson on something you know to people who do not, and ask them afterwards what they actually took away. The gap between what you said and what landed is the entire profession.",
      adjacent: ["Words & media", "People & the mind", "Research & discovery"],
    },
  ],
  medicine_health: [
    {
      title: "Treating patients",
      what: "Diagnosing, treating and caring for people directly — the front line of medicine.",
      roles: [
        "Doctor / physician",
        "Surgeon",
        "Nurse",
        "Paramedic",
        "Dentist",
        "Pharmacist",
        "Physiotherapist",
        "Psychiatrist",
      ],
      path: "Medical or nursing school (a long road). Biology, and any real volunteering or clinical exposure, is the honest start.",
      values: ["people", "impact", "stability"],
      dayToDay:
        "Pattern recognition under time pressure, then documentation. You see many patients in sequence, most with ordinary problems, and the skill is noticing the one presentation that does not fit. A very large share of the day is notes, referrals and handovers — the record is a legal document and writing it well is part of the clinical job, not separate from it.",
      catch:
        "It is the longest training route on this list — a decade or more from starting university to independent practice in many specialties — with shift work, nights and weekends throughout, and emotional weight that does not stay at work. International students should also check licensing early: medical qualifications transfer between countries poorly, and practising elsewhere often means further examinations and supervised years.",
      suitsYou:
        "You can decide under uncertainty, tell people things they do not want to hear, and still care attentively at the end of a long shift. A decade of training with examinations continuing past graduation is a price you have looked at clearly rather than assumed away.",
      notForYou:
        "You intend to work in a country other than the one you qualify in and have not checked what that takes. Medical qualifications transfer poorly, and practising elsewhere usually means further examinations and supervised years — verify that ladder before you commit ten of them.",
      misconception:
        "That the hard part is knowing enough. The hard parts are deciding under uncertainty with incomplete information, telling people things they do not want to hear, and continuing to care attentively at the end of a long shift.",
      stages: {
        school:
          "Biology and chemistry, at the level your target countries require — entry rules differ sharply, and some admit school-leavers directly while others require a prior degree. Get real clinical exposure: volunteering, care work, shadowing. It is both expected in applications and the honest test of whether you can be near illness daily.",
        study:
          "Medical or nursing school: several years of pre-clinical science, then clinical rotations where you learn on real wards. It is demanding continuously rather than in bursts, and the examinations continue well past graduation.",
        first:
          "Supervised junior practice — foundation or residency years, rotating through specialties, with long hours and heavy responsibility arriving faster than you feel ready for. Choosing a specialty happens here, based on what the work is actually like rather than what it sounded like.",
      },
      tryItNow:
        "Volunteer somewhere with unwell or elderly people for a few months, not a few days. Whether you find it draining or steadying after week eight is the most reliable signal you can get before committing a decade.",
      adjacent: ["Health of whole populations", "Research & new treatments", "People & the mind"],
    },
    {
      title: "Health of whole populations",
      what: "Stopping disease before it spreads — vaccines, prevention, policy.",
      roles: [
        "Public-health specialist",
        "Epidemiologist",
        "Health-policy analyst",
        "Nutritionist",
        "Global-health programme officer",
      ],
      path: "A public health or biology track. Science fairs and health-focused projects start it.",
      values: ["impact", "stability"],
      dayToDay:
        "Data and persuasion. You analyse who is getting ill and why, design or evaluate a programme meant to change it, and then spend a surprising amount of time explaining the evidence to officials, clinicians and the public. Field roles add logistics: getting vaccines, tests or staff to places with difficult roads and thin infrastructure.",
      catch:
        "Success is invisible by definition — an outbreak that does not happen produces no headline, and budgets get cut precisely when prevention is working. The work is also politically exposed: public health advice is argued about in public, and the messenger absorbs that. Career progression often depends on programme funding cycles rather than on merit.",
      suitsYou:
        "You are comfortable that success here is invisible by definition, you like statistics and persuasion more than bedside work, and you can hold a public position steadily while it is argued about in public.",
      notForYou:
        "You want to be with patients, or you need progression that depends on your merit rather than on a funding cycle. Budgets get cut precisely when prevention is working, and that is a structural feature of this field rather than a run of bad luck.",
      misconception:
        "That it is medicine at a larger scale. It is closer to statistics, economics and communication applied to health — you will spend more time with datasets and stakeholders than with patients, and many of the strongest people in it never trained clinically at all.",
      stages: {
        school:
          "Biology plus mathematics and statistics. Any project where you gather data about a community and present it honestly is a real preview of the work.",
        study:
          "Public health, epidemiology, biology or a social science with strong quantitative training. A master's in public health is the standard entry credential in most systems, often taken after a first degree in something else.",
        first:
          "Analyst or programme officer in a health ministry, NGO or international agency: surveillance data, monitoring and evaluation, report writing. Field placements early are what make later senior roles credible.",
      },
      tryItNow:
        "Take a published national health dataset for your own country, find one clear inequality in it, and write a two-page brief proposing a specific intervention and how you would know if it worked. The 'how would we know' part is the discipline.",
      adjacent: ["Treating patients", "Economics & policy", "Environment & climate"],
    },
    {
      title: "Research & new treatments",
      what: "Studying diseases in the lab and developing the treatments that reach patients.",
      roles: [
        "Biomedical researcher",
        "Pharmacologist",
        "Geneticist",
        "Clinical-trials coordinator",
        "Medical-device researcher",
      ],
      path: "Biomedical science, then research. Research programs and ISEF are the early proving ground.",
      values: ["impact", "creating"],
      dayToDay:
        "Cell culture, assays, sequencing, analysis — and waiting. Biological experiments run on their own timescale, so the week is structured around when cells or animals or samples are ready rather than around your preferences. Clinical trial roles are different again: protocols, ethics approvals, patient records and meticulous compliance.",
      catch:
        "The timelines are brutal by any other field's standards — bringing a treatment from laboratory to patients typically takes over a decade, and the overwhelming majority of candidate drugs fail somewhere along the way. You must be able to find meaning in careful work that will probably not produce the thing you hoped for, and be genuinely comfortable with animal research if your area requires it.",
      suitsYou:
        "You find the narrowing of a possibility space satisfying rather than disappointing, and you can work with real meaning on something that will most likely not turn into the thing you hoped for.",
      notForYou:
        "You want your work in front of people within a few years, or you are not genuinely comfortable with animal research where your area requires it. Laboratory to patient typically takes over a decade, and the overwhelming majority of candidates fail somewhere along the way.",
      misconception:
        "That progress comes from breakthroughs. It comes from thousands of negative results narrowing a space, and the people who sustain a career here are those who find that narrowing satisfying rather than disappointing.",
      stages: {
        school:
          "Biology and chemistry, plus statistics — modern biomedicine is data-heavy. Research placement programmes and ISEF are the accessible early proving ground and are taken seriously by admissions.",
        study:
          "Biomedical science, biochemistry, pharmacology or genetics, then usually a PhD for research independence. Choose a group whose techniques you want to learn, because your first job will largely be defined by the methods you can already run.",
        first:
          "Research assistant or doctoral researcher on one small piece of a larger question. Industry alternatives — trials coordination, regulatory affairs, medical science liaison — are well-paid, stable and often overlooked by students who assume academia is the only destination.",
      },
      tryItNow:
        "Read the full published report of one clinical trial, including the methods and the limitations. Following how a claim is actually built and hedged in this field tells you whether the rigour appeals to you.",
      adjacent: ["Research & discovery", "Applied science & industry", "Health technology & data"],
    },
    {
      title: "Health technology & data",
      what: "Building the machines, software and data work modern medicine runs on.",
      roles: [
        "Biomedical engineer",
        "Bioinformatician",
        "Health-data analyst",
        "Medical-imaging specialist",
        "Digital-health product manager",
      ],
      path: "Biomedical engineering, CS or biology with data skills. Coding plus biology projects is the accessible combination.",
      values: ["money", "creating", "stability"],
      dayToDay:
        "Engineering work with a regulator watching. You design or analyse a device, an imaging pipeline or a clinical dataset, and every design decision has to be documented as evidence for approval. Bioinformatics roles are largely programming and statistics applied to genomic or clinical data; digital health product work means sitting between clinicians who know medicine and engineers who do not.",
      catch:
        "Regulation slows everything: a change that would take a week in ordinary software can take months of validation and paperwork, and that pace frustrates people who came from tech. Clinical data is also heavily restricted for good reasons, so you often cannot look at the thing you need, and mistakes here have consequences no amount of iteration undoes.",
      suitsYou:
        "You hold both halves — the biology and the code — and you can accept a regulator watching every design decision, because mistakes here are not the kind that iterating undoes.",
      notForYou:
        "You are arriving from ordinary software and want that pace. A change that takes a week elsewhere can take months of validation and paperwork here, clinical data is restricted for good reasons, and the best technical solution frequently loses to the one that fits the existing workflow.",
      misconception:
        "That healthcare is an easy market for good technology. Adoption is slow, procurement is complicated, and hospitals rightly demand evidence — the best technical solution frequently loses to the one that fits existing clinical workflow.",
      stages: {
        school:
          "Maths, physics or biology, plus programming. The combination is the whole point: biology alone or code alone is common, and the pairing is what is scarce.",
        study:
          "Biomedical engineering, computer science with a biology minor, or biology with serious computational training. Look for programmes with clinical placements — being comfortable in a hospital is a real professional advantage here.",
        first:
          "Junior engineer, bioinformatician or analyst inside a regulated process, learning the standards of your sub-field. Domain knowledge compounds fast in this area, so early specialisation pays more than it does in general software.",
      },
      tryItNow:
        "Take an open medical dataset or a public genome and build one small honest analysis, then write down what a clinician would need before trusting it. That second list is what separates this from ordinary data work.",
      adjacent: ["Data & AI", "Research & new treatments", "Electronics, energy & hardware"],
    },
  ],
  law: [
    {
      title: "Practising law",
      what: "Advising clients and arguing their case — in business, in crime, in daily disputes.",
      roles: [
        "Lawyer / advocate",
        "Criminal defence lawyer",
        "Prosecutor",
        "In-house counsel",
        "Notary",
      ],
      path: "A law degree. Debate and Model UN build the exact skills and are the accessible start.",
      values: ["money", "people", "stability"],
      dayToDay:
        "Reading and drafting, mostly. Documents, precedent, correspondence, and the slow assembly of a case from evidence. Courtroom advocacy is a small fraction of the time even for litigators — most disputes settle — and a large part of the job is managing clients who are frightened, angry or unrealistic about what the law can do for them.",
      catch:
        "Law is the least portable qualification on this list: it is national, so a degree earned in one country frequently does not let you practise in another without substantial requalification. Billable-hour culture in commercial practice means long, closely measured days, and the profession reports high rates of stress and burnout — that is worth knowing before, not after.",
      suitsYou:
        "You prepare obsessively, you can argue the side you disagree with, and you are able to manage clients who are frightened, angry or unrealistic about what the law can actually do for them.",
      notForYou:
        "You expect to take this qualification abroad. Law is the least portable one on this list — practising in another country usually means substantial requalification — and if billable-hour culture and the profession's documented burnout rates worry you, know that before, not after.",
      misconception:
        "That it is about argument and advocacy. It is about preparation: the person who has read every document and anticipated the other side's best point wins, and courtroom performance mostly reflects work done weeks earlier.",
      stages: {
        school:
          "Read demanding text closely and argue in writing. Debate and mock trial build the exact muscles; more useful still is practising the habit of steelmanning the opposing case before writing your own.",
        study:
          "A law degree — undergraduate in most countries, postgraduate in some. Then a national qualification stage: bar examinations, professional training and supervised practice. Map that ladder for your target country before choosing where to study; it is the decision that constrains everything after.",
        first:
          "Trainee or junior associate doing research, document review and drafting under supervision. The first years are long and detail-obsessed by design — the profession is trained through repetition of careful work.",
      },
      tryItNow:
        "Take a real dispute reported in the news, find the actual rules that apply, and write both sides' strongest argument in a page each. Being able to argue the side you disagree with is the qualifying skill.",
      adjacent: ["Business, tech & IP law", "Rights & advocacy", "Courts & public service"],
    },
    {
      title: "Rights & advocacy",
      what: "Using the law to change rules and defend people who can't defend themselves.",
      roles: [
        "Human-rights lawyer",
        "NGO legal adviser",
        "Immigration / refugee lawyer",
        "Legal-aid advocate",
        "Policy campaigner",
      ],
      path: "Law or politics. Model UN, mock trial and policy writing are the entry point.",
      values: ["impact", "people"],
      dayToDay:
        "Casework and campaigns in parallel. Individual cases — an asylum claim, an eviction, a wrongful detention — involve interviewing people at the worst moment of their lives, assembling evidence, and meeting hard procedural deadlines. Strategic work is slower: choosing which case could change a rule, building a coalition, and writing submissions aimed at a court or a legislature.",
      catch:
        "You lose often, and the losses are people rather than accounts. Pay is markedly lower than commercial practice for the same qualification, organisations run on unstable grant funding, and in some countries this work carries genuine political risk. Secondary trauma is a recognised occupational hazard and needs deliberate management.",
      suitsYou:
        "You have the procedural persistence to file correctly, meet every deadline and exhaust remedies over years, and you can lose often when the losses are people rather than accounts.",
      notForYou:
        "You need income and stability from the same qualification. Pay is markedly lower than commercial practice, organisations run on unstable grant funding, and secondary trauma is a recognised occupational hazard here that has to be managed deliberately rather than endured quietly.",
      misconception:
        "That it is a career of dramatic victories. Most of it is procedural persistence — filing correctly, meeting deadlines, exhausting remedies — and the wins that matter usually arrive years after the work that caused them.",
      stages: {
        school:
          "Debate, mock trial and any volunteering with people who need help navigating a system. Learn a second language; in refugee and migration work it is often decisive.",
        study:
          "Law, or politics and then a law conversion where your country allows it. Legal clinics during study are the single most valuable thing available — real clients, supervised, while you are still learning.",
        first:
          "Legal-aid or NGO roles, often on short funded contracts, with caseloads heavier than you would like. Many people fund this by starting in commercial practice and moving across, which is a pragmatic route rather than a compromise.",
      },
      tryItNow:
        "Help one person navigate one bureaucratic process end to end — a form, an appeal, an application. The gap between what the rules say and what actually happens to someone without help is the reason this work exists.",
      adjacent: ["Practising law", "Politics, policy & the world", "Words & media"],
    },
    {
      title: "Business, tech & IP law",
      what: "The law behind companies, inventions and data — contracts, patents, privacy.",
      roles: [
        "Corporate / M&A lawyer",
        "IP / patent attorney",
        "Tech & data-privacy lawyer",
        "Compliance officer",
        "Contract manager",
      ],
      path: "Law, often with a business or science interest. Debate and negotiation contests start it.",
      values: ["money", "stability"],
      dayToDay:
        "Drafting, reviewing and negotiating documents that allocate risk. Corporate work runs in intense deal cycles — weeks of due diligence and redrafting against a closing date. Patent work is different: you need to understand an invention well enough to describe it precisely, which is why patent attorneys usually hold a science or engineering degree first. Privacy and compliance work is advisory and continuous rather than deal-shaped.",
      catch:
        "Deal work means your calendar belongs to other people's deadlines, and the pressure arrives in unpredictable bursts including nights and weekends. Much routine review is being automated, which is raising the bar for entry-level roles. And the work is adversarial only in a narrow, documentary sense — if you came for advocacy, this is not that.",
      suitsYou:
        "You are precise with language and genuinely interested in business or in how an invention works. You can see that the contract, the patent and the data policy shape what a company may do long before any dispute exists.",
      notForYou:
        "You came for advocacy. This is adversarial only in a narrow documentary sense, deal cycles hand your calendar to other people's deadlines including nights and weekends, and routine review is being automated from underneath the entry-level roles.",
      misconception:
        "That commercial law is dry compared with courtroom work. It is where a great deal of the actual power sits: the contract, the patent and the data policy shape what companies can do long before any dispute exists.",
      stages: {
        school:
          "Precision with language, plus real interest in business or science — the combination is the differentiator here. Negotiation and debate competitions map closely onto the work.",
        study:
          "A law degree, and for patent work a science or engineering degree first, followed by separate patent qualification. Commercial firms recruit early, often two years before you start, so the timeline matters.",
        first:
          "Trainee rotations through practice groups, then junior associate: due diligence, first drafts, and closing checklists. Specialisation happens fast and largely determines your market value.",
      },
      tryItNow:
        "Read the terms of service of an app you use, find the three clauses that actually matter, and rewrite one in plain language without changing its effect. That translation is a large part of the job.",
      adjacent: ["Practising law", "Starting & running a business", "Security & systems"],
    },
    {
      title: "Courts & public service",
      what: "Running the justice system itself — deciding cases, drafting the rules, settling disputes.",
      roles: [
        "Judge (after years of practice)",
        "Legal researcher",
        "Court clerk",
        "Ministry-of-justice official",
        "Arbitrator / mediator",
      ],
      path: "Law plus years of experience. It starts the same place: debate, mock trial, careful argument.",
      values: ["stability", "impact"],
      dayToDay:
        "Reading the file, hearing the parties, and writing the reasons. Judicial and court work is dominated by volume: many matters, each needing enough attention to be decided fairly, with reasoning that will be read by people who lost. Ministry and legislative drafting work is the same discipline applied earlier — writing rules precisely enough that they mean one thing.",
      catch:
        "It is the slowest entry on this list: judicial appointment typically comes after many years of practice, and in some systems it is politically appointed rather than earned on merit alone. Public-service pay is well below private practice, caseloads are heavy, and the requirement of visible impartiality constrains what you may say publicly for the rest of your career.",
      suitsYou:
        "You want to apply settled rules to messy facts fairly and at volume, and you can write reasons carefully enough that they will hold up when read by the person who lost.",
      notForYou:
        "You want to reach the work soon, or you want to keep speaking freely in public. Judicial appointment typically follows many years of practice and in some systems is political rather than earned on merit, and visible impartiality constrains you for the rest of your career.",
      misconception:
        "That judges mainly decide dramatic questions of principle. Most of the work is applying settled rules to messy facts, quickly and fairly, in ordinary cases that matter enormously to the people in them and to nobody else.",
      stages: {
        school:
          "The same start as any legal route — close reading, structured argument, mock trial. Add the habit of writing reasons for a decision, not just the decision.",
        study:
          "A law degree and national qualification. Clerking for a judge, where your system offers it, is the single most direct exposure to this work and a strong credential afterwards.",
        first:
          "Court clerk, legal researcher or junior ministry lawyer — supporting decisions rather than making them, and learning procedure from the inside. Arbitration and mediation are parallel routes that reach dispute-resolution work far sooner than the bench does.",
      },
      tryItNow:
        "Read one published judgment in full and write a page on how the reasoning moves from facts to rule to conclusion. Then write the dissent. Doing both is the intellectual habit the role requires.",
      adjacent: ["Practising law", "Rights & advocacy", "Politics, policy & the world"],
    },
  ],
  arts_design: [
    {
      title: "Digital & product design",
      what: "Designing how products look and how people actually use them — apps, brands, interfaces.",
      roles: [
        "UX / UI designer",
        "Graphic designer",
        "Brand designer",
        "Product designer",
        "Motion designer",
      ],
      path: "A design degree, or a strong self-taught portfolio. Building real projects is what counts.",
      values: ["creating", "money", "freedom"],
      dayToDay:
        "Less drawing than expected. You spend the week understanding a problem, sketching several bad solutions quickly, testing one with real users, and then negotiating what is actually buildable with engineers and stakeholders. A great deal of the job is presenting and justifying decisions — a design that cannot be explained does not ship.",
      catch:
        "Your work is edited by committee: strong ideas get diluted by constraints, deadlines and opinions from people with more authority than taste. Junior hiring is competitive because the field looks accessible, and 'design' is often expected to include research, writing and light front-end knowledge without extra recognition.",
      suitsYou:
        "You care more about what goes on the screen at all, and in what order, than about how it looks, you can defend a decision out loud to people senior to you, and you are content removing things rather than adding them.",
      notForYou:
        "You want your ideas to survive intact. Work here is edited by committee and diluted by people with more authority than taste — and 'design' is often expected to include research, writing and light front-end knowledge without any extra recognition for it.",
      misconception:
        "That it is about making things look good. Appearance is the last layer; the value is in structure — what goes on the screen at all, in what order, and what gets removed. Most of what separates a senior designer is judgement about what not to build.",
      stages: {
        school:
          "Redesign things that annoy you and write down why your version is better. Learn one modern interface tool, but spend more time on the reasoning than the pixels — the portfolio is judged on thinking.",
        study:
          "A design degree, or self-taught with a serious portfolio; this is one of the fields where the portfolio genuinely outweighs the credential. Whatever route, get real users in front of your work early.",
        first:
          "Junior designer on defined pieces of an existing product — a flow, a component, a screen — inside someone else's system. Learning to work within a design system before inventing one is the actual apprenticeship.",
      },
      tryItNow:
        "Take one app you find frustrating, watch three people use it without helping them, then redesign the single worst moment and test your version on three more. That loop is the profession.",
      adjacent: ["Building software & products", "Making objects & craft", "People & the mind"],
    },
    {
      title: "Space & the built environment",
      what: "Designing the places people live in — where art meets engineering.",
      roles: [
        "Architect",
        "Interior designer",
        "Landscape architect",
        "Urban designer",
        "Exhibition / set designer",
      ],
      path: "An architecture or interior-design degree. Design and drawing contests are the accessible first taste.",
      values: ["creating", "stability"],
      dayToDay:
        "Drawings, models and coordination. Early project stages are genuinely creative; the longer middle is technical documentation, building regulations, and resolving how the design meets structure, services and budget. Site visits mean checking that what is being built matches what was drawn, and deciding what to do when it does not.",
      catch:
        "Architecture has the longest qualification route of the creative fields — a degree plus supervised practice plus professional examinations, often around seven years before you can call yourself an architect — and the pay through those years is low relative to the training. The studio culture of long hours during study is well documented and continues into some practices.",
      suitsYou:
        "You like producing something good inside constraints that were fixed before you arrived, and you can wait: a degree, supervised practice and professional examinations stand between you and the title, and patience here is a professional requirement rather than a virtue.",
      notForYou:
        "You need creative freedom early, or earnings that match the length of the training. The long middle of every project is technical documentation, building regulations and coordination, and the studio culture of very long hours continues from the degree into some practices.",
      misconception:
        "That architects design buildings from imagination. Most of the work is negotiated: with budgets, planning rules, engineers and clients — and the skill being paid for is producing something good within constraints that were fixed before you arrived.",
      stages: {
        school:
          "Draw constantly, build physical models, and learn to see structure in buildings you pass. Maths and physics matter more than art-school stereotypes suggest, and portfolios are the core of admission.",
        study:
          "An architecture degree, then a required period of practical experience and professional examinations; interior and landscape routes are shorter. Studio is the centre of the degree — expect critique in front of peers as the normal teaching method.",
        first:
          "Architectural assistant: detail drawings, planning submissions, model-making and coordination. Design responsibility comes gradually and after qualification, so patience is a professional requirement here rather than a virtue.",
      },
      tryItNow:
        "Measure a real room properly, draw it to scale, and redesign it for a different use with a fixed budget. Working out what you must give up is the whole exercise.",
      adjacent: ["Building & infrastructure", "Making objects & craft", "Digital & product design"],
    },
    {
      title: "Film, animation & sound",
      what: "Telling stories with moving images and sound — directing, editing, animating.",
      roles: [
        "Filmmaker / director",
        "Video editor",
        "Animator",
        "3D / concept artist",
        "Sound designer",
      ],
      path: "Film or animation, or just making things. Short-film and animation contests are the real start.",
      values: ["creating", "freedom", "people"],
      dayToDay:
        "Highly specialised and highly collaborative. On a production you do one job — editing, sound, lighting, one animation department — inside a chain of people, to a schedule. Animation especially is patient, incremental work: seconds of finished footage from days of effort, with revisions coming back from a supervisor who will ask for changes you disagree with.",
      catch:
        "The employment model is project-based: you are hired for a production, then it ends. Income is irregular, unpaid or barely-paid work is common at the start, and the industry clusters in a small number of expensive cities. Competition is severe because far more people want to make films than the market will pay for.",
      suitsYou:
        "You want to become genuinely excellent at one craft inside a chain of people, and you can take revisions you disagree with from a supervisor on work measured in seconds of finished footage per day.",
      notForYou:
        "You are picturing directing, or you need regular income. Almost everyone here works in a craft department, employment ends when the production does, and the industry clusters in a few expensive cities where far more people want in than the market will pay for.",
      misconception:
        "That it is about directing. Almost everyone in this industry works in a craft department, and building a career means becoming genuinely excellent at one specific role rather than being generally artistic.",
      stages: {
        school:
          "Make short things and finish them. A phone is sufficient equipment; the scarce skill is editing, and it is the one most easily practised alone. Enter short-film and animation competitions for the deadline as much as the prize.",
        study:
          "Film or animation school, or self-taught with a reel. What school genuinely provides is equipment, collaborators and the first professional network — weigh the cost against whether you would otherwise find those.",
        first:
          "Runner, assistant or junior in one department, learning the hierarchy and the equipment. Reputation for reliability moves you up this industry faster than talent alone does.",
      },
      tryItNow:
        "Edit someone else's raw footage into two different two-minute cuts with opposite moods. Discovering how much meaning is made in the edit, not the shoot, is the fastest way to understand this craft.",
      adjacent: ["Games & interactive", "Words & media", "Digital & product design"],
    },
    {
      title: "Making objects & craft",
      what: "Designing and making the physical things people use, wear and look at.",
      roles: [
        "Industrial / product designer",
        "Fashion designer",
        "Illustrator",
        "Photographer",
        "Furniture or jewellery maker",
      ],
      path: "Industrial design, fashion or fine art. Design challenges and a maker portfolio are the entry point.",
      values: ["creating", "freedom"],
      dayToDay:
        "Sketching, prototyping and then the long tail of making an idea manufacturable: materials, tooling, cost per unit, and conversations with factories about what is actually possible. Fashion adds fittings, sampling and seasonal calendars; illustration and photography are more solitary and more commercial — briefs, revisions, licensing and invoices.",
      catch:
        "Physical products are expensive to be wrong about: a prototype costs money and a production run costs a great deal more, so creative freedom is tightly bounded by cost. Much of this area is freelance, which means finding clients and chasing payment are permanent parts of the job, and manufacturing is concentrated in specific regions rather than wherever you live.",
      suitsYou:
        "You find the manufacturing problem as interesting as the aesthetic one, and working out what a thing would cost to make fifty of engages you rather than deflating you.",
      notForYou:
        "You want creative freedom without cost pressure, or steady employment. Prototypes and production runs make being wrong expensive, much of this area is freelance — so finding clients and chasing payment are permanent parts of it — and manufacturing sits in specific regions rather than wherever you live.",
      misconception:
        "That the work is designing beautiful objects. It is designing objects that can be made repeatedly at a price, which is a manufacturing problem as much as an aesthetic one — and the constraint is usually where the interesting design decisions live.",
      stages: {
        school:
          "Make things physically and often, and photograph them properly — the portfolio is the qualification. Learn one CAD tool and, if you can reach one, a 3D printer or a workshop.",
        study:
          "Industrial design, fashion, fine art or craft. Look for programmes with real workshops and industry projects; the technical half of this field cannot be learned from a screen.",
        first:
          "Junior designer or studio assistant on parts of a product — a component, a colourway, a technical pack — or freelance work built one client at a time. Being known for delivering on time is worth as much as being known for taste.",
      },
      tryItNow:
        "Design and actually make one object you will use daily, then work out honestly what it would cost to make fifty of them. That second number is the part most people never think about.",
      adjacent: ["Digital & product design", "Space & the built environment", "Machines & manufacturing"],
    },
  ],
};

/** Career areas for a set of chosen fields, grouped by field (in the given order). */
export function careerAreasForFaculties(
  faculties: FacultyValue[],
): { faculty: FacultyValue; areas: CareerArea[] }[] {
  return faculties
    .filter((f) => CAREER_AREAS_BY_FACULTY[f]?.length)
    .map((f) => ({ faculty: f, areas: CAREER_AREAS_BY_FACULTY[f] }));
}

// Re-exported so existing server-side imports keep working. The implementation
// lives in the tiny career-titles.ts because the interest quiz is a CLIENT
// component: importing this file there would ship every paragraph of all 33
// areas to the browser to render eight short labels.
export { careerAreaTitles, CAREER_AREA_TITLES } from "@/lib/data/career-titles";

/**
 * The URL slug for an area — `/guide/work/data-and-ai`.
 *
 * Areas carry no id of their own: the title IS the identity, both to the student
 * and in this file, and a parallel id column would be one more thing to keep in
 * sync for no gain. So the slug is derived, and a unit test pins that all of
 * them stay distinct — a collision would silently serve one area's page under
 * another's name.
 */
export function areaSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/** Every area with the field it belongs to — the flat view the routes need. */
export function allCareerAreas(): { faculty: FacultyValue; area: CareerArea }[] {
  return (
    Object.entries(CAREER_AREAS_BY_FACULTY) as [FacultyValue, CareerArea[]][]
  ).flatMap(([faculty, areas]) => areas.map((area) => ({ faculty, area })));
}

/** One area by slug, with its field. Undefined for anything unknown. */
export function areaBySlug(
  slug: string,
): { faculty: FacultyValue; area: CareerArea } | undefined {
  return allCareerAreas().find(({ area }) => areaSlug(area.title) === slug);
}
