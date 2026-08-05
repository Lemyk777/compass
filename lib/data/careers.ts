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

/**
 * Just the sphere names for a field — the one-line "where this leads" preview
 * used on the quiz result, where a full careers panel would be too much.
 */
export function careerAreaTitles(faculty: FacultyValue): string[] {
  return (CAREER_AREAS_BY_FACULTY[faculty] ?? []).map((a) => a.title);
}
