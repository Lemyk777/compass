import type { FacultyValue } from "@/lib/data/faculties";

// The missing middle of the guidance product: a field is not a goal. This maps
// each of the eight faculties to a few real careers with, first, what the job
// ACTUALLY is day to day, and then the honest path into it. Curated and
// deterministic (like the opportunities catalog) — no model call, no hype. Kept
// short on purpose: three to four per field, so "where could this lead?" is a
// readable answer, not another list to wade through.
//
// `what` is one plain sentence a 13-year-old understands. `path` names the
// study route and, where it helps, that the accessible thing to do NOW is the
// kind of opportunity already on this page — so the throughline reads
// interest → field → career → what to enter next.

export type Career = {
  title: string;
  /** What the job actually is, day to day. */
  what: string;
  /** How you get there — what to study, and the accessible first step. */
  path: string;
};

export const CAREERS_BY_FACULTY: Record<FacultyValue, Career[]> = {
  engineering: [
    {
      title: "Mechanical engineer",
      what: "Designs and tests physical things that move — engines, robots, machines, products.",
      path: "An engineering degree. Start now by building and fixing things: robotics, a design contest, CAD.",
    },
    {
      title: "Civil / structural engineer",
      what: "Makes sure buildings, bridges and infrastructure are safe and stand up.",
      path: "A civil engineering degree, built on physics and maths. Bridge-building and structures contests are a real first taste.",
    },
    {
      title: "Electrical engineer",
      what: "Designs the circuits and power systems behind electronics, devices and the grid.",
      path: "An electrical engineering degree. Electronics kits and hardware projects are the accessible start.",
    },
    {
      title: "Aerospace engineer",
      what: "Designs and tests aircraft, rockets and spacecraft.",
      path: "An aerospace or mechanical degree. Rocketry, CanSat and space-design challenges are the entry point.",
    },
  ],
  computer_science: [
    {
      title: "Software engineer",
      what: "Builds the apps, websites and systems people use every day.",
      path: "A CS degree or self-taught — either works if you ship projects. The one thing that matters: write a lot of code.",
    },
    {
      title: "Data scientist / ML engineer",
      what: "Finds patterns in data and builds the models behind predictions and AI.",
      path: "CS, statistics or maths. Data and ML contests (Kaggle, Zindi) are how you prove it early.",
    },
    {
      title: "Cybersecurity specialist",
      what: "Defends systems from attacks — and breaks into them legally to find the holes first.",
      path: "CS or a security track. Capture-the-flag contests like picoCTF are the accessible way in.",
    },
    {
      title: "Game developer",
      what: "Designs and programs games — the code, the systems, the feel.",
      path: "CS plus game jams. Making one small finished game beats a long unfinished one.",
    },
  ],
  business_economics: [
    {
      title: "Founder / entrepreneur",
      what: "Starts a company and runs it — the product, the money, the team.",
      path: "Any degree, or none — you learn by doing it. Sell something small now; a startup or pitch contest is a real start.",
    },
    {
      title: "Financial analyst / investor",
      what: "Decides where money should go by analysing companies and markets.",
      path: "Finance or economics. Investment and trading competitions (like Wharton's) are the accessible proving ground.",
    },
    {
      title: "Management consultant",
      what: "Helps companies solve hard problems and make big decisions.",
      path: "Business, economics or a strong analytical degree. Case competitions mirror the actual work.",
    },
    {
      title: "Economist",
      what: "Studies how money, markets and policy shape society, and advises on them.",
      path: "An economics degree. Economics olympiads and essay contests are the entry point.",
    },
  ],
  natural_sciences: [
    {
      title: "Research scientist",
      what: "Runs experiments to discover how the world works — in physics, chemistry or biology.",
      path: "A science degree, then usually a PhD. Real research programs and science fairs (ISEF) start it early.",
    },
    {
      title: "Environmental / climate scientist",
      what: "Studies ecosystems and the climate to understand and protect them.",
      path: "Environmental or earth science. Field projects and climate challenges are the accessible first step.",
    },
    {
      title: "Physicist / astronomer",
      what: "Studies matter, energy and the universe — from particles to galaxies.",
      path: "A physics degree. Physics olympiads and astronomy challenges are how you test the fit.",
    },
    {
      title: "Biotechnologist",
      what: "Uses living systems to make medicines, food and materials.",
      path: "Biology or biotechnology. Competitions like iGEM are a genuine early taste.",
    },
  ],
  humanities_social: [
    {
      title: "Psychologist",
      what: "Studies why people think and behave as they do — and helps them.",
      path: "A psychology degree. Reading widely and psychology essay contests are the accessible start.",
    },
    {
      title: "Journalist / writer",
      what: "Investigates and tells stories that inform the public.",
      path: "Journalism or any degree plus a lot of writing. The school paper and writing contests are the real entry.",
    },
    {
      title: "Policy analyst / diplomat",
      what: "Shapes or advises on public policy and how countries deal with each other.",
      path: "Politics or international relations. Model UN and debate are the accessible proving ground.",
    },
    {
      title: "Historian / academic",
      what: "Researches the past (or a field of ideas) and teaches it.",
      path: "A humanities degree, then a PhD to research. History and essay competitions start it.",
    },
  ],
  medicine_health: [
    {
      title: "Doctor / physician",
      what: "Diagnoses and treats patients — the long, direct path in medicine.",
      path: "Medical school (a long road). Biology, and any real volunteering or clinical exposure, is the honest start.",
    },
    {
      title: "Nurse",
      what: "Cares for patients hands-on, every day — often the person who actually helps most.",
      path: "A nursing degree. Volunteering in care settings is the accessible first step.",
    },
    {
      title: "Public health specialist",
      what: "Stops disease at the level of whole populations — vaccines, prevention, policy.",
      path: "A public health or biology track. Science fairs and health-focused projects start it.",
    },
    {
      title: "Biomedical researcher",
      what: "Studies diseases in the lab and helps develop new treatments.",
      path: "Biomedical science, then research. Research programs and ISEF are the early proving ground.",
    },
  ],
  law: [
    {
      title: "Lawyer",
      what: "Advises clients and argues their case under the law — in business, rights, or crime.",
      path: "A law degree. Debate and Model UN build the exact skills and are the accessible start.",
    },
    {
      title: "Human-rights / policy advocate",
      what: "Uses the law to change rules and defend people's rights.",
      path: "Law or politics. Model UN, mock trial and policy writing are the entry point.",
    },
    {
      title: "Corporate / IP lawyer",
      what: "Handles contracts, companies and patents — the law behind business and invention.",
      path: "Law, often with a business or science interest. Debate and negotiation contests start it.",
    },
    {
      title: "Judge",
      what: "Decides cases in court — reached after years of practising law first.",
      path: "Law plus years of experience. It starts the same place: debate, mock trial, careful argument.",
    },
  ],
  arts_design: [
    {
      title: "UX / graphic designer",
      what: "Designs how products look and how people actually use them — apps, brands, interfaces.",
      path: "A design degree, or a strong self-taught portfolio. Building real projects is what counts.",
    },
    {
      title: "Architect",
      what: "Designs buildings — where art meets engineering and how people live in a space.",
      path: "An architecture degree. Design and drawing contests are the accessible first taste.",
    },
    {
      title: "Filmmaker / animator",
      what: "Tells stories with moving images — directing, editing, animating.",
      path: "Film or animation, or just making things. Short-film and animation contests are the real start.",
    },
    {
      title: "Product / industrial designer",
      what: "Designs the physical objects people use, from a chair to a phone.",
      path: "Industrial design. Design challenges and a maker portfolio are the entry point.",
    },
  ],
};

/** Careers for a set of chosen fields, grouped by field (in the given order). */
export function careersForFaculties(
  faculties: FacultyValue[],
): { faculty: FacultyValue; careers: Career[] }[] {
  return faculties
    .filter((f) => CAREERS_BY_FACULTY[f]?.length)
    .map((f) => ({ faculty: f, careers: CAREERS_BY_FACULTY[f] }));
}
