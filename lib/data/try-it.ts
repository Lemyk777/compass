// TRYING THE WORK — a few hours of the actual job, before choosing a degree.
//
// This is the founder's own request ("if a student is weighing investment
// banking, give them the J.P. Morgan simulation"), and it is the best-evidenced
// item on the whole backlog: job simulations appear by name in the career
// self-efficacy literature, employers fund them to recruit, and they are free.
// Release 3 added `simulation` as a catalog kind and stopped there, so the
// answer to "what is this work actually like" sat in a list of 173 rows instead
// of on the page about that work.
//
// THREE RULES, and each of them is a way the obvious version rots or lies:
//
// 1. **No URLs. Ever.** The catalog owns links, because `npm run test:links` is
//    what keeps them alive and it only knows about the catalog — and the
//    individual company pages are behind connection-level bot protection the
//    gate demonstrably cannot pass (release 3 tried, five for five). So they are
//    NAMED here and LINKED through the catalog row that does pass. A test fails
//    this file on any `http`.
//
// 2. **We describe the TASK, never the product title.** "J.P. Morgan built one
//    where you work through a client's numbers and put the pitch together" stays
//    true when a simulation is renamed, re-cut or refreshed; "J.P. Morgan
//    Investment Banking Virtual Experience" does not. The employer is the stable
//    half — companies get renamed far less often than their course listings —
//    and the employer is also the thing a student types into the platform's own
//    search. Same reasoning as the guide refusing prices and rankings: shape
//    survives a year, labels do not.
//
// 3. **An area with nothing honest to offer gets nothing.** There is no
//    employer simulation for treating patients, and inventing a near-miss would
//    be worse than silence — the reader would spend an evening on it and learn
//    the wrong thing about a career. Absence over a wrong claim, the same rule
//    that keeps a countdown off an unconfirmed date. Roughly half the areas have
//    no entry here and that is the honest state of the world, not a gap to fill.
//
// **Re-verify yearly**, the same class of claim as `englishTaught`: what the
// platform hosts genuinely changes. Last walked 2026-08-14.

/** Every entry currently lives on one platform, so it is said once. */
export const TRY_IT_PLATFORM = "Forage";

/**
 * The catalog row that owns the link. This file has no URLs; the card sends the
 * student to the row, and the row is what `test:links` keeps alive.
 */
export const TRY_IT_OPPORTUNITY_ID = "forage-all";

export type JobSimulation = {
  /**
   * Who built it. The stable half of the claim, and the thing a student types
   * into the platform's search.
   */
  employer: string;
  /**
   * What you actually do, in concrete nouns — our words, not a product title,
   * so a rename does not make this false. Written like `dayToDay`: the Tuesday,
   * not the job description.
   */
  what: string;
  /**
   * The platform's own rough estimate, kept coarse on purpose. A precise figure
   * would be a promise about someone else's product.
   */
  hours: string;
  /** The areas of work this is a try at, by `areaSlug`. */
  areas: string[];
};

export const JOB_SIMULATIONS: JobSimulation[] = [
  {
    employer: "J.P. Morgan",
    what: "Work a deal from the bank's side: read a client's numbers, build a simple valuation, and assemble the pitch that would be put in front of them.",
    hours: "about 4 hours",
    areas: ["money-and-markets"],
  },
  {
    employer: "J.P. Morgan",
    what: "Set up a repository, wire a live data feed into a dashboard, and fix what breaks — the ordinary week of an engineer inside a bank rather than a coding puzzle.",
    hours: "about 4 hours",
    areas: ["building-software-and-products"],
  },
  {
    employer: "BCG",
    what: "Take a client problem apart the way a consultant is expected to: work out what question is actually being asked, size it, and write the one slide that answers it.",
    hours: "about 5 hours",
    areas: ["strategy-and-consulting"],
  },
  {
    employer: "BCG",
    what: "Clean a messy client dataset, build a model that predicts something the business cares about, and — the part everyone underestimates — explain it to people who will not read the code.",
    hours: "about 5 hours",
    areas: ["data-and-ai"],
  },
  {
    employer: "Deloitte",
    what: "Read a spreadsheet a client actually sent, find the thing in it that is wrong, and turn it into a chart somebody can make a decision from.",
    hours: "about 2 hours",
    areas: ["data-and-ai", "strategy-and-consulting"],
  },
  {
    employer: "Tata Consultancy Services",
    what: "Turn a business question into a set of charts, then defend the choices — which cut of the data, which chart, what you left out.",
    hours: "about 3 hours",
    areas: ["data-and-ai"],
  },
  {
    employer: "Quantium",
    what: "Work through a retail chain's transaction data end to end: find the customer segments in it, then test whether a trial actually changed anything.",
    hours: "about 4 hours",
    areas: ["data-and-ai"],
  },
  {
    employer: "Lyft",
    what: "Build and test the back-end pieces a ride app runs on, against the sort of half-specified ticket a real team hands you.",
    hours: "about 3 hours",
    areas: ["building-software-and-products"],
  },
  {
    employer: "Walmart",
    what: "Design the data structures and the shape of a system before writing much of it — the part of engineering that decides whether the rest is bearable.",
    hours: "about 4 hours",
    areas: ["building-software-and-products"],
  },
  {
    employer: "Electronic Arts",
    what: "Propose a feature for a live game, sketch how it would be built, and write the class design — game engineering as a product argument, which is what it mostly is.",
    hours: "about 4 hours",
    areas: ["games-and-interactive", "building-software-and-products"],
  },
  {
    employer: "Mastercard",
    what: "Work a phishing report from the inside: find what was hit, decide what to shut down, and write the note that goes to people who are not technical.",
    hours: "about 3 hours",
    areas: ["security-and-systems"],
  },
  {
    employer: "AIG",
    what: "Take a vulnerability report apart, work out what an attacker could actually reach, and rank what gets fixed first when you cannot fix everything.",
    hours: "about 3 hours",
    areas: ["security-and-systems"],
  },
  {
    employer: "PwC",
    what: "Build the dashboard a client asked for, discover the question they meant was a different one, and rebuild it — which is most of what analytics work is.",
    hours: "about 3 hours",
    areas: ["data-and-ai", "strategy-and-consulting"],
  },
  {
    employer: "Accenture",
    what: "Sit between the client and the engineers on a delivery project: turn what was asked for into something buildable, and say what will not fit in the time.",
    hours: "about 4 hours",
    areas: ["strategy-and-consulting", "building-software-and-products"],
  },
];

/**
 * The simulations that are a try at one area of work.
 *
 * Registry order, never sorted — there is no ranking here and no "best one to
 * start with". Capped at three: this sits inside a page that already answers
 * five questions, and a fourth card would turn the one actionable part of it
 * back into a list.
 */
export function simulationsForArea(slug: string): JobSimulation[] {
  return JOB_SIMULATIONS.filter((s) => s.areas.includes(slug)).slice(0, 3);
}

