import type { FacultyValue } from "@/lib/data/faculties";

// Step 4 of the guide: the routes that do not require moving.
//
// This used to be a single paragraph at the bottom of the guide, which put the
// most actionable thing we can tell a student — you can start this month, from
// here, for nothing — in the least visible position on the page. It is a step
// now, with the same shape as every other step in the section.
//
// Same rules as lib/data/world.ts, and for the same reason: this is the part of
// the product most able to mislead.
//
//  1. **Every route carries its catch.** "Google pays students to write open
//     source" without "and it is genuinely competitive, with a written proposal
//     months in advance" is an advert, not guidance.
//  2. **Every route carries the actual first move**, small enough to do this
//     week. "Apply to GSoC" is not a first move; "pick a project and fix one
//     small bug in it" is.
//  3. **No URLs here.** The catalog owns links and `npm run test:links` checks
//     them; a second, untested link surface is how dead links get shipped.
//     These entries name the route and hand the student to Opportunities, where
//     the row and its checked URL already live.
//
// Curated and deterministic, like the rest of the guide. No model call.

export type HomeRoute = {
  id: string;
  name: string;
  /** Which fields this genuinely serves. Empty-in ⇒ all of them, as everywhere. */
  fields: FacultyValue[];
  /** What it is, in one plain sentence. */
  what: string;
  /** The honest downside — competitiveness, unpaid time, prerequisites. */
  catch: string;
  /** The smallest real first move, doable from where the student already is. */
  firstMove: string;
  /**
   * What doing this actually costs in time, week by week, and over how long.
   * "You can do this from home" is only useful next to "and it will take you a
   * term of Saturday mornings" — a student cannot plan against enthusiasm.
   */
  commitment: string;
  /**
   * What you can SHOW at the end. The whole argument of this step is that work
   * done from here is visible from anywhere, and that argument only holds if
   * the route leaves behind something a stranger can look at.
   */
  proof: string;
  /** Who this route suits, and who should pick a different one. */
  whoThrives: string;
};

export const HOME_ROUTES: HomeRoute[] = [
  {
    id: "open-source-stipends",
    name: "Paid open-source programmes",
    fields: ["computer_science", "engineering"],
    what: "Google Summer of Code, Outreachy and the LFX Mentorship pay students a stipend to spend a few months working on a real open-source project, mentored by the people who maintain it.",
    catch:
      "All three are competitive and none of them are quick: you write a project proposal weeks in advance, and the strongest applicants have already been contributing to that project before applying. Cycles run once a year, so missing the window costs you a year.",
    firstMove:
      "Pick one project you already use and read its issue tracker for anything labelled good-first-issue. Fixing one small thing, publicly, is both the practice and the thing that makes a later proposal credible.",
    commitment:
      "Realistically a term of consistent evenings before you are a credible applicant, then a full-time summer if you are accepted. The contribution habit is the slow part; the application itself is a few weeks of writing.",
    proof:
      "A public commit history with your name on it, in a project strangers use. That is the strongest single artefact on this whole list — it is verifiable, permanent, and it shows how you work rather than claiming it.",
    whoThrives:
      "Suits you if you can work alone against a vague problem and ask good questions in public. Look elsewhere if you need someone to tell you what to do next — mentors here guide, they do not supervise.",
  },
  {
    id: "data-competitions",
    name: "Data-science competitions",
    fields: ["computer_science", "natural_sciences", "business_economics"],
    what: "Kaggle and Zindi run open machine-learning contests judged purely on a score against held-out data. Nobody sees your school, your country or your age — only the number.",
    catch:
      "The leaderboard is honest but brutal, and the top of it is professionals. Treat the first several attempts as learning rather than as a result you will put on an application.",
    firstMove:
      "Enter one beginner-tier competition and submit something bad on purpose, just to get through the whole loop once. The second submission is where learning starts.",
    commitment:
      "A weekend for your first honest attempt, then a few hours a week for as long as it stays interesting. There is no deadline pressure beyond the one you choose, which is why people drift away.",
    proof:
      "A public profile with a ranking and, more usefully, the notebooks showing your reasoning. A modest placing you can explain beats a better one you cannot.",
    whoThrives:
      "Suits you if you like being scored objectively and are not discouraged by a leaderboard full of professionals. Look elsewhere if you need collaboration — this is mostly solitary work.",
  },
  {
    id: "research-and-writing",
    name: "Research and writing that publishes you",
    fields: ["natural_sciences", "humanities_social", "medicine_health", "law"],
    what: "Journals for school-age researchers, essay competitions run by universities, and open science projects accept work from anywhere and judge the work itself.",
    catch:
      "A serious piece takes months and usually needs an adult who knows the field to read a draft — a teacher is enough. Beware anything that charges a large fee to publish you; being printed is not the same as being reviewed.",
    firstMove:
      "Choose a question small enough to answer properly in ten pages, and find the person who will read your first draft before you write it.",
    commitment:
      "Months, not weeks: a serious piece takes a term or two alongside school, and the reading comes before any of the writing shows.",
    proof:
      "A finished, dated piece of work with your argument in it — published, entered somewhere, or simply readable. Length is not the point; a tight ten pages that answers one question properly is the artefact.",
    whoThrives:
      "Suits you if you can hold one question for months and take criticism on a draft without defending it. Look elsewhere if you want quick feedback — this is the slowest route here.",
  },
  {
    id: "free-university-courses",
    name: "Free university courses",
    fields: [],
    what: "Harvard, MIT and Stanford put full courses online for nothing, and several issue a certificate at the end. They cost time and nothing else.",
    catch:
      "A certificate of completion is weak evidence on its own — thousands of people have the same one, and an unfinished course is worth nothing at all. It counts when it is the visible foundation under something you then built or entered.",
    firstMove:
      "Start one course that a thing you already want to do depends on, and finish it. One finished beats four abandoned.",
    commitment:
      "Several hours a week for the length of the course, and the completion rate on open courses is famously low precisely because nothing external holds you to it. Treat the schedule as real or it will not happen.",
    proof:
      "The certificate is weak evidence on its own. What counts is the thing you built afterwards that the course made possible — finish the course, then immediately use it for something, and let that be the proof.",
    whoThrives:
      "Suits you if you need a structured foundation in a subject nobody near you teaches. Look elsewhere if you already have the foundation — building something is worth more of your hours than another course.",
  },
  {
    id: "remote-work",
    name: "Remote work for foreign clients",
    fields: ["computer_science", "arts_design", "business_economics"],
    what: "Design, software and writing are bought remotely, which means the pay for a piece of work stops being set by the town you live in.",
    catch:
      "Getting the first client is the hard part and referrals dominate; payment, tax and contracts are your problem, and rates start low until you have something public to point at. This is a route for older students, not for a 14-year-old.",
    firstMove:
      "Make the portfolio before the profile: three finished pieces someone can look at do more than any listing on a freelance site.",
    commitment:
      "The portfolio comes first and takes months; the first client can take months more. After that it is real working hours, which is why this route suits older students rather than fourteen-year-olds.",
    proof:
      "Paid work for someone who is not related to you, and pieces you are allowed to show. The first paying client is the credential — everything after it is easier.",
    whoThrives:
      "Suits you if you are self-directed about deadlines and comfortable asking to be paid. Look elsewhere if you are still at school with heavy exams ahead — the time cost is real and lands at the worst moment.",
  },
  {
    id: "local-organising",
    name: "Starting the thing that is missing locally",
    fields: [],
    what: "A club, a tutoring group, a local olympiad team, a small event. Admissions officers and employers read this as initiative, and nowhere in the world is it easier to be the founder of something than in a place that has none of it.",
    catch:
      "It only counts if it survives past the first month and someone other than you shows up. A club that exists on paper for an application is visible as exactly that.",
    firstMove:
      "Find the teacher who will give you a room and an hour a week, and run the first session for whoever turns up — even if it is two people.",
    commitment:
      "A weekly commitment for at least a term, and it only counts once it has survived the first month when the novelty wears off and attendance dips.",
    proof:
      "A thing that exists and outlasts you: members, sessions run, a result someone else can confirm. It is the most locally verifiable item on this list, and the hardest to fake.",
    whoThrives:
      "Suits you if you can keep going when only two people turn up, and want something on your record that is unmistakably yours. Look elsewhere if you want individual technical depth — this builds a different muscle.",
  },
];

/** Routes serving any of the chosen fields; empty in ⇒ all of them. */
export function homeRoutesForFaculties(faculties: FacultyValue[]): HomeRoute[] {
  if (faculties.length === 0) return HOME_ROUTES;
  return HOME_ROUTES.filter(
    (r) => r.fields.length === 0 || r.fields.some((f) => faculties.includes(f)),
  );
}
