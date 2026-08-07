import type { FacultyValue } from "@/lib/data/faculties";

// Just the names of the areas of work in each field — nothing else.
//
// This exists for one reason: `careers.ts` is the deep layer, and it is long
// prose. The interest quiz is a CLIENT component and only ever needs the list of
// sphere names to show as a one-line preview of a result, so importing the
// registry there would ship every paragraph of every area to the browser to
// render eight short lines. Same rule as the opportunities catalog and the
// areas list: the data stays on the server, the label travels.
//
// Duplicated from CAREER_AREAS_BY_FACULTY on purpose, and a unit test asserts
// the two agree exactly — add an area and the test fails until its title is
// here too.

export const CAREER_AREA_TITLES: Record<FacultyValue, string[]> = {
  engineering: [
    "Machines & manufacturing",
    "Building & infrastructure",
    "Electronics, energy & hardware",
    "Aerospace & space",
  ],
  computer_science: [
    "Building software & products",
    "Data & AI",
    "Security & systems",
    "Games & interactive",
  ],
  business_economics: [
    "Starting & running a business",
    "Money & markets",
    "Strategy & consulting",
    "Marketing & growth",
    "Economics & policy",
  ],
  natural_sciences: [
    "Research & discovery",
    "Environment & climate",
    "Space & the universe",
    "Applied science & industry",
  ],
  humanities_social: [
    "People & the mind",
    "Words & media",
    "Politics, policy & the world",
    "Teaching & research",
  ],
  medicine_health: [
    "Treating patients",
    "Health of whole populations",
    "Research & new treatments",
    "Health technology & data",
  ],
  law: [
    "Practising law",
    "Rights & advocacy",
    "Business, tech & IP law",
    "Courts & public service",
  ],
  arts_design: [
    "Digital & product design",
    "Space & the built environment",
    "Film, animation & sound",
    "Making objects & craft",
  ],
};

/**
 * The sphere names for a field — the one-line "where this leads" preview used on
 * the quiz result, where a full careers panel would be too much.
 */
export function careerAreaTitles(faculty: FacultyValue): string[] {
  return CAREER_AREA_TITLES[faculty] ?? [];
}
