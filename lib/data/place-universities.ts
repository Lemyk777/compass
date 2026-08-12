import type { FacultyValue } from "@/lib/data/faculties";

// Who is actually named for a subject in a given place.
//
// This is the layer the guide was missing: a country profile explained how
// admissions, money and post-study work behave, and then never said a single
// institution's name — so a student who had decided on Germany still had nothing
// to search for on Monday morning.
//
// **It is deliberately NOT a ranking, and the distinction is the whole design.**
// `scripts/test-engine.ts` fails the build on `top \d+`, `rank(ed|ing) #N`,
// prices and salaries anywhere in the guide's data, because a position in a
// league table is stale within a year, differs between the four tables that
// publish one, and answers a question a seventeen-year-old should not be asking
// first. What does not rot is *association*: which places a subject is actually
// studied and taught at, in which city. That is what this file records.
//
// Rules, all test-enforced:
//
//  1. **No numbers, no positions, no superlatives.** Not "the best", not "top",
//     not "#1". If a sentence needs a rank to be interesting, delete it.
//  2. **`knownFor` uses the product's own faculty taxonomy**, not free text, so
//     it can be filtered and stays consistent with the rest of the guide.
//  3. **`hub` is a real hub id from world.ts, or null.** Null means "we do not
//     profile this city" and the UI must then render the city as plain text
//     rather than as a link — naming a city we cannot open was a real bug once
//     (backlog #21). Where a hub is set, its destination must be this one.
//  4. **Every destination we profile names at least three**, or the section
//     reads as a shortlist someone curated for a reason they won't state.
//
// POLICY DRIFT — `englishTaught` is the one field here that rots, for exactly
// the reason the Netherlands profile documents: a country can tighten or loosen
// English-taught provision within a single cycle, and a claim can be stale in
// both directions at once. It is therefore a coarse three-way shape, never a
// promise about a specific programme, and the UI says "check it on their own
// page". Everything else here — a name, a city, what a place is studied for —
// is structural and holds for years. Last hand-checked: 2026-08-11.

export type EnglishTaught =
  /** Degrees taught in English are an established, normal route here. */
  | "widely"
  /** Some programmes, more often at master's level than bachelor's. */
  | "some"
  /** Teaching is mainly in the local language; English options are limited. */
  | "local";

export type NamedUniversity = {
  name: string;
  /** The city as a student would say it. */
  city: string;
  /** Hub id in world.ts, or null when we do not profile that city. */
  hub: string | null;
  /** What this place is actually studied for here. Never a ranking. */
  knownFor: FacultyValue[];
  englishTaught: EnglishTaught;
};

/**
 * Keyed by `StudyDestination.id`. The home region leads, the same way the
 * destination list and the world map do.
 */
export const PLACE_UNIVERSITIES: Record<string, NamedUniversity[]> = {
  kazakhstan: [
    {
      name: "Nazarbayev University",
      city: "Astana",
      hub: "astana",
      knownFor: ["engineering", "computer_science", "natural_sciences", "medicine_health"],
      englishTaught: "widely",
    },
    {
      name: "Al-Farabi Kazakh National University",
      city: "Almaty",
      hub: "almaty",
      knownFor: ["natural_sciences", "humanities_social", "law", "medicine_health"],
      englishTaught: "some",
    },
    {
      name: "Kazakh-British Technical University",
      city: "Almaty",
      hub: "almaty",
      knownFor: ["engineering", "computer_science", "business_economics"],
      englishTaught: "some",
    },
    {
      name: "Satbayev University",
      city: "Almaty",
      hub: "almaty",
      knownFor: ["engineering", "natural_sciences"],
      englishTaught: "some",
    },
    {
      name: "KIMEP University",
      city: "Almaty",
      hub: "almaty",
      knownFor: ["business_economics", "law", "humanities_social"],
      englishTaught: "widely",
    },
  ],

  georgia: [
    {
      name: "Ivane Javakhishvili Tbilisi State University",
      city: "Tbilisi",
      hub: "tbilisi",
      knownFor: ["humanities_social", "law", "natural_sciences"],
      englishTaught: "some",
    },
    {
      name: "Tbilisi State Medical University",
      city: "Tbilisi",
      hub: "tbilisi",
      knownFor: ["medicine_health"],
      englishTaught: "widely",
    },
    {
      name: "Free University of Tbilisi",
      city: "Tbilisi",
      hub: "tbilisi",
      knownFor: ["business_economics", "law", "humanities_social"],
      englishTaught: "some",
    },
    {
      name: "Georgian Technical University",
      city: "Tbilisi",
      hub: "tbilisi",
      knownFor: ["engineering", "computer_science"],
      englishTaught: "some",
    },
  ],

  "united-states": [
    {
      name: "Massachusetts Institute of Technology",
      city: "Cambridge, Massachusetts",
      hub: "boston",
      knownFor: ["engineering", "computer_science", "natural_sciences"],
      englishTaught: "widely",
    },
    {
      name: "Harvard University",
      city: "Cambridge, Massachusetts",
      hub: "boston",
      knownFor: ["law", "medicine_health", "humanities_social", "business_economics"],
      englishTaught: "widely",
    },
    {
      name: "Stanford University",
      city: "Stanford, California",
      hub: "bay-area",
      knownFor: ["computer_science", "engineering", "business_economics"],
      englishTaught: "widely",
    },
    {
      name: "University of California, Berkeley",
      city: "Berkeley, California",
      hub: "bay-area",
      knownFor: ["computer_science", "engineering", "natural_sciences"],
      englishTaught: "widely",
    },
    {
      name: "Columbia University",
      city: "New York",
      hub: "new-york",
      knownFor: ["law", "business_economics", "humanities_social", "medicine_health"],
      englishTaught: "widely",
    },
    {
      name: "University of Washington",
      city: "Seattle",
      hub: "seattle",
      knownFor: ["computer_science", "medicine_health", "engineering"],
      englishTaught: "widely",
    },
  ],

  "united-kingdom": [
    {
      name: "Imperial College London",
      city: "London",
      hub: "london",
      knownFor: ["engineering", "computer_science", "medicine_health", "natural_sciences"],
      englishTaught: "widely",
    },
    {
      name: "London School of Economics and Political Science",
      city: "London",
      hub: "london",
      knownFor: ["business_economics", "law", "humanities_social"],
      englishTaught: "widely",
    },
    {
      name: "University College London",
      city: "London",
      hub: "london",
      knownFor: ["humanities_social", "medicine_health", "engineering", "arts_design"],
      englishTaught: "widely",
    },
    {
      name: "University of Manchester",
      city: "Manchester",
      hub: "manchester",
      knownFor: ["engineering", "natural_sciences", "computer_science", "business_economics"],
      englishTaught: "widely",
    },
    {
      name: "University of Oxford",
      city: "Oxford",
      hub: null,
      knownFor: ["humanities_social", "law", "natural_sciences", "medicine_health"],
      englishTaught: "widely",
    },
    {
      name: "University of Cambridge",
      city: "Cambridge",
      hub: null,
      knownFor: ["natural_sciences", "engineering", "humanities_social", "medicine_health"],
      englishTaught: "widely",
    },
  ],

  "hong-kong": [
    {
      name: "The University of Hong Kong",
      city: "Hong Kong",
      hub: "hong-kong",
      knownFor: ["medicine_health", "law", "business_economics", "humanities_social"],
      englishTaught: "widely",
    },
    {
      name: "The Hong Kong University of Science and Technology",
      city: "Hong Kong",
      hub: "hong-kong",
      knownFor: ["engineering", "computer_science", "business_economics"],
      englishTaught: "widely",
    },
    {
      name: "The Chinese University of Hong Kong",
      city: "Hong Kong",
      hub: "hong-kong",
      knownFor: ["medicine_health", "humanities_social", "business_economics", "natural_sciences"],
      englishTaught: "widely",
    },
    {
      name: "City University of Hong Kong",
      city: "Hong Kong",
      hub: "hong-kong",
      knownFor: ["engineering", "computer_science", "arts_design"],
      englishTaught: "widely",
    },
  ],

  singapore: [
    {
      name: "National University of Singapore",
      city: "Singapore",
      hub: "singapore",
      knownFor: ["engineering", "computer_science", "business_economics", "law", "medicine_health"],
      englishTaught: "widely",
    },
    {
      name: "Nanyang Technological University",
      city: "Singapore",
      hub: "singapore",
      knownFor: ["engineering", "computer_science", "business_economics", "natural_sciences"],
      englishTaught: "widely",
    },
    {
      name: "Singapore Management University",
      city: "Singapore",
      hub: "singapore",
      knownFor: ["business_economics", "law", "computer_science"],
      englishTaught: "widely",
    },
  ],

  germany: [
    {
      name: "Technical University of Munich",
      city: "Munich",
      hub: "munich",
      knownFor: ["engineering", "computer_science", "natural_sciences"],
      englishTaught: "some",
    },
    {
      name: "Ludwig Maximilian University of Munich",
      city: "Munich",
      hub: "munich",
      knownFor: ["natural_sciences", "humanities_social", "medicine_health", "law"],
      englishTaught: "some",
    },
    {
      name: "Humboldt University of Berlin",
      city: "Berlin",
      hub: "berlin",
      knownFor: ["humanities_social", "law", "natural_sciences"],
      englishTaught: "some",
    },
    {
      name: "Technical University of Berlin",
      city: "Berlin",
      hub: "berlin",
      knownFor: ["engineering", "computer_science"],
      englishTaught: "some",
    },
    {
      name: "RWTH Aachen University",
      city: "Aachen",
      hub: null,
      knownFor: ["engineering", "natural_sciences", "computer_science"],
      englishTaught: "some",
    },
  ],

  italy: [
    {
      name: "Politecnico di Milano",
      city: "Milan",
      hub: "milan",
      knownFor: ["engineering", "arts_design", "computer_science"],
      englishTaught: "widely",
    },
    {
      name: "Bocconi University",
      city: "Milan",
      hub: "milan",
      knownFor: ["business_economics", "law"],
      englishTaught: "widely",
    },
    {
      name: "Sapienza University of Rome",
      city: "Rome",
      hub: "rome",
      knownFor: ["humanities_social", "natural_sciences", "medicine_health", "engineering"],
      englishTaught: "some",
    },
    {
      name: "University of Bologna",
      city: "Bologna",
      hub: null,
      knownFor: ["law", "humanities_social", "medicine_health"],
      englishTaught: "some",
    },
  ],

  netherlands: [
    {
      name: "Eindhoven University of Technology",
      city: "Eindhoven",
      hub: "eindhoven",
      knownFor: ["engineering", "computer_science"],
      englishTaught: "widely",
    },
    {
      name: "University of Amsterdam",
      city: "Amsterdam",
      hub: "amsterdam",
      knownFor: ["humanities_social", "natural_sciences", "business_economics", "law"],
      englishTaught: "widely",
    },
    {
      name: "Vrije Universiteit Amsterdam",
      city: "Amsterdam",
      hub: "amsterdam",
      knownFor: ["humanities_social", "natural_sciences", "medicine_health"],
      englishTaught: "widely",
    },
    {
      name: "Delft University of Technology",
      city: "Delft",
      hub: null,
      knownFor: ["engineering", "computer_science", "arts_design"],
      englishTaught: "widely",
    },
  ],

  canada: [
    {
      name: "University of Toronto",
      city: "Toronto",
      hub: "toronto",
      knownFor: ["medicine_health", "computer_science", "humanities_social", "law"],
      englishTaught: "widely",
    },
    {
      name: "University of Waterloo",
      city: "Waterloo",
      hub: "waterloo",
      knownFor: ["computer_science", "engineering"],
      englishTaught: "widely",
    },
    {
      name: "University of British Columbia",
      city: "Vancouver",
      hub: "vancouver",
      knownFor: ["natural_sciences", "engineering", "business_economics", "arts_design"],
      englishTaught: "widely",
    },
    {
      name: "McGill University",
      city: "Montreal",
      hub: "montreal",
      knownFor: ["medicine_health", "law", "humanities_social", "natural_sciences"],
      englishTaught: "widely",
    },
  ],

  "south-korea": [
    {
      name: "Seoul National University",
      city: "Seoul",
      hub: "seoul",
      knownFor: ["engineering", "natural_sciences", "humanities_social", "law", "medicine_health"],
      englishTaught: "some",
    },
    {
      name: "KAIST",
      city: "Daejeon",
      hub: "daejeon",
      knownFor: ["engineering", "computer_science", "natural_sciences"],
      englishTaught: "widely",
    },
    {
      name: "Korea University",
      city: "Seoul",
      hub: "seoul",
      knownFor: ["business_economics", "law", "humanities_social"],
      englishTaught: "some",
    },
    {
      name: "Yonsei University",
      city: "Seoul",
      hub: "seoul",
      knownFor: ["business_economics", "medicine_health", "humanities_social"],
      englishTaught: "some",
    },
  ],

  uae: [
    {
      name: "Khalifa University",
      city: "Abu Dhabi",
      hub: "abu-dhabi",
      knownFor: ["engineering", "computer_science", "natural_sciences"],
      englishTaught: "widely",
    },
    {
      name: "New York University Abu Dhabi",
      city: "Abu Dhabi",
      hub: "abu-dhabi",
      knownFor: ["humanities_social", "natural_sciences", "engineering", "business_economics"],
      englishTaught: "widely",
    },
    // Dubai's own entries are branch campuses, and that is the honest thing to
    // say about them: they teach a foreign university's degree on the ground
    // here, in English, which is exactly why they exist and exactly what a
    // student is choosing. Splitting Dubai from Abu Dhabi left this city with
    // nothing named, because the research universities are in the capital.
    {
      name: "Heriot-Watt University Dubai",
      city: "Dubai",
      hub: "dubai",
      knownFor: ["engineering", "business_economics", "computer_science"],
      englishTaught: "widely",
    },
    {
      name: "University of Wollongong in Dubai",
      city: "Dubai",
      hub: "dubai",
      knownFor: ["business_economics", "computer_science", "engineering"],
      englishTaught: "widely",
    },
    {
      name: "American University in Dubai",
      city: "Dubai",
      hub: "dubai",
      knownFor: ["business_economics", "engineering", "arts_design"],
      englishTaught: "widely",
    },
    {
      name: "American University of Sharjah",
      city: "Sharjah",
      hub: null,
      knownFor: ["engineering", "business_economics", "arts_design"],
      englishTaught: "widely",
    },
    {
      name: "United Arab Emirates University",
      city: "Al Ain",
      hub: null,
      knownFor: ["business_economics", "natural_sciences", "medicine_health", "law"],
      englishTaught: "widely",
    },
  ],

  switzerland: [
    {
      name: "ETH Zurich",
      city: "Zurich",
      hub: "zurich",
      knownFor: ["engineering", "natural_sciences", "computer_science"],
      englishTaught: "some",
    },
    {
      name: "EPFL",
      city: "Lausanne",
      hub: "lausanne",
      knownFor: ["engineering", "computer_science", "natural_sciences"],
      englishTaught: "some",
    },
    {
      name: "University of Geneva",
      city: "Geneva",
      hub: "geneva",
      knownFor: ["humanities_social", "law", "natural_sciences", "medicine_health"],
      englishTaught: "some",
    },
    {
      name: "University of St. Gallen",
      city: "St. Gallen",
      hub: null,
      knownFor: ["business_economics", "law"],
      englishTaught: "some",
    },
  ],

  poland: [
    {
      name: "University of Warsaw",
      city: "Warsaw",
      hub: "warsaw",
      knownFor: ["humanities_social", "law", "natural_sciences", "computer_science"],
      englishTaught: "some",
    },
    {
      name: "Warsaw University of Technology",
      city: "Warsaw",
      hub: "warsaw",
      knownFor: ["engineering", "computer_science"],
      englishTaught: "some",
    },
    {
      name: "Jagiellonian University",
      city: "Kraków",
      hub: "krakow",
      knownFor: ["humanities_social", "medicine_health", "law", "natural_sciences"],
      englishTaught: "some",
    },
    {
      name: "AGH University of Krakow",
      city: "Kraków",
      hub: "krakow",
      knownFor: ["engineering", "computer_science", "natural_sciences"],
      englishTaught: "some",
    },
  ],

  turkiye: [
    {
      name: "Boğaziçi University",
      city: "Istanbul",
      hub: "istanbul",
      knownFor: ["engineering", "computer_science", "business_economics", "humanities_social"],
      englishTaught: "widely",
    },
    {
      name: "Middle East Technical University",
      city: "Ankara",
      hub: "ankara",
      knownFor: ["engineering", "computer_science", "natural_sciences"],
      englishTaught: "widely",
    },
    {
      name: "Istanbul Technical University",
      city: "Istanbul",
      hub: "istanbul",
      knownFor: ["engineering", "arts_design", "computer_science"],
      englishTaught: "some",
    },
    {
      name: "Koç University",
      city: "Istanbul",
      hub: "istanbul",
      knownFor: ["business_economics", "law", "medicine_health", "humanities_social"],
      englishTaught: "widely",
    },
    {
      name: "Bilkent University",
      city: "Ankara",
      hub: "ankara",
      knownFor: ["engineering", "business_economics", "humanities_social", "arts_design"],
      englishTaught: "widely",
    },
  ],

  china: [
    {
      name: "Tsinghua University",
      city: "Beijing",
      hub: "beijing",
      knownFor: ["engineering", "computer_science", "business_economics", "arts_design"],
      englishTaught: "some",
    },
    {
      name: "Peking University",
      city: "Beijing",
      hub: "beijing",
      knownFor: ["natural_sciences", "humanities_social", "law", "medicine_health"],
      englishTaught: "some",
    },
    {
      name: "Fudan University",
      city: "Shanghai",
      hub: "shanghai",
      knownFor: ["medicine_health", "humanities_social", "business_economics"],
      englishTaught: "some",
    },
    {
      name: "Shanghai Jiao Tong University",
      city: "Shanghai",
      hub: "shanghai",
      knownFor: ["engineering", "medicine_health", "computer_science"],
      englishTaught: "some",
    },
    {
      name: "Southern University of Science and Technology",
      city: "Shenzhen",
      hub: "shenzhen",
      knownFor: ["natural_sciences", "engineering", "computer_science"],
      englishTaught: "some",
    },
  ],

  japan: [
    {
      name: "The University of Tokyo",
      city: "Tokyo",
      hub: "tokyo",
      knownFor: ["engineering", "natural_sciences", "law", "humanities_social", "medicine_health"],
      englishTaught: "some",
    },
    {
      name: "Kyoto University",
      city: "Kyoto",
      hub: "kyoto",
      knownFor: ["natural_sciences", "engineering", "humanities_social"],
      englishTaught: "some",
    },
    {
      name: "Osaka University",
      city: "Osaka",
      hub: "osaka",
      knownFor: ["engineering", "medicine_health", "natural_sciences"],
      englishTaught: "some",
    },
    {
      name: "Waseda University",
      city: "Tokyo",
      hub: "tokyo",
      knownFor: ["humanities_social", "business_economics", "law"],
      englishTaught: "widely",
    },
    {
      name: "Keio University",
      city: "Tokyo",
      hub: "tokyo",
      knownFor: ["business_economics", "medicine_health", "law"],
      englishTaught: "some",
    },
  ],
};

/** Everyone named for a destination, in the curated order. */
export function universitiesForPlace(destinationId: string): NamedUniversity[] {
  return PLACE_UNIVERSITIES[destinationId] ?? [];
}

/**
 * Everyone named in one city. Derived from the same registry rather than being
 * a second list, so a city page and its country page can never disagree.
 */
export function universitiesForHub(hubId: string): NamedUniversity[] {
  return Object.values(PLACE_UNIVERSITIES)
    .flat()
    .filter((u) => u.hub === hubId);
}

export const ENGLISH_TAUGHT_LABEL: Record<EnglishTaught, string> = {
  widely: "Degrees taught in English",
  some: "Some English-taught programmes",
  local: "Mainly the local language",
};
