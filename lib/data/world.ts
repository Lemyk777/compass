import type { FacultyValue } from "@/lib/data/faculties";

// Where the work actually is, on the map.
//
// A field leads to spheres (lib/data/careers.ts); spheres cluster in PLACES, and
// nobody tells a student in Almaty or Tashkent which places, or what the honest
// catch is once you get there. That gap is what this file fills.
//
// Three rules, because this is the part of the product most able to mislead:
//
//  1. **Every hub carries its catch.** A city with no downside listed is an
//     advert. Cost, language, visa and market size go next to the appeal, not
//     under it.
//  2. **Every hub carries a route in.** "Zurich is great for deep tech" is
//     useless to a 15-year-old in Shymkent. Naming the actual door — GKS, MEXT,
//     DSU, Türkiye Bursları, a post-study work permit — is the whole point.
//  3. **Moving is not the only answer, and it is named as such.** Several of
//     these spheres pay from anywhere, and the catalog already carries remote
//     routes. A guide that only says "leave" is a bad guide for our students.
//
// Curated and deterministic, like the opportunities catalog — no model call.
// These are durable structural facts (where an industry sits, which scholarship
// exists), not figures that rot: no salary numbers, no rankings, no counts.
// Scholarship names still need a yearly sanity check.

export type RegionKey =
  | "central_asia"
  | "europe"
  | "asia_pacific"
  | "middle_east"
  | "north_america";

export const REGION_LABEL: Record<RegionKey, string> = {
  central_asia: "Central Asia & the Caucasus",
  europe: "Europe",
  asia_pacific: "Asia-Pacific",
  middle_east: "Middle East & Türkiye",
  north_america: "North America",
};

/** Curated display order — home region first, deliberately. */
export const REGION_ORDER: RegionKey[] = [
  "central_asia",
  "europe",
  "middle_east",
  "asia_pacific",
  "north_america",
];

export type Hub = {
  id: string;
  city: string;
  country: string;
  region: RegionKey;
  /** Which spheres genuinely cluster here. */
  fields: FacultyValue[];
  /** Why this place, for those fields. */
  what: string;
  /** The honest downside — cost, language, visa, market size. */
  catch: string;
  /** The actual door in, for a student who is not from there. */
  route: string;
};

export const HUBS: Hub[] = [
  // ── Central Asia & the Caucasus — the home region, first on purpose ────────
  {
    id: "almaty",
    city: "Almaty",
    country: "Kazakhstan",
    region: "central_asia",
    fields: ["business_economics", "computer_science", "natural_sciences", "arts_design"],
    what: "Kazakhstan's business and startup centre — most international companies put their local office here, and the country's strongest universities and creative scene are here too.",
    catch: "Pay and funding sit well below Western Europe, and English-language work is concentrated in a handful of firms.",
    route: "You are already inside it. Local universities, then either remote work for foreign clients or a master's abroad — both are normal paths from here.",
  },
  {
    id: "astana",
    city: "Astana",
    country: "Kazakhstan",
    region: "central_asia",
    fields: ["engineering", "computer_science", "law", "business_economics"],
    what: "Government, state companies and Astana Hub — the tech park where most of the country's startup programmes and grants are run.",
    catch: "Heavily state and corporate; if you want a creative or product-led industry, Almaty is the livelier half of the country.",
    route: "Nazarbayev University, Astana Hub's programmes, and the competitions local organisations post — some of them land in your Opportunities list directly.",
  },
  {
    id: "tashkent",
    city: "Tashkent",
    country: "Uzbekistan",
    region: "central_asia",
    fields: ["computer_science", "business_economics", "medicine_health"],
    what: "The fastest-growing market in Central Asia, with IT Park giving tax breaks to software companies and a large outsourcing sector.",
    catch: "Wages lag the region's leaders and English is still uncommon outside the IT sector.",
    route: "IT Park's own courses and residency, then remote contracts — the sector was built on serving clients abroad.",
  },
  {
    id: "tbilisi",
    city: "Tbilisi",
    country: "Georgia",
    region: "central_asia",
    fields: ["computer_science", "arts_design", "business_economics"],
    what: "A visa-easy base that filled with remote workers and small studios — a growing design, film and software scene for its size.",
    catch: "The local market is small: almost everyone here earns from clients somewhere else.",
    route: "Remote-first. This is a place people move to while working for elsewhere, not a place with a big local job ladder.",
  },

  // ── Europe ────────────────────────────────────────────────────────────────
  {
    id: "berlin",
    city: "Berlin",
    country: "Germany",
    region: "europe",
    fields: ["computer_science", "arts_design", "business_economics", "engineering"],
    what: "Europe's largest startup scene outside London, where English-only tech jobs are normal, alongside a deep art, music and film culture.",
    catch: "Outside tech you need German. Housing is genuinely hard to find, and salaries are well below American ones.",
    route: "German public universities charge no tuition (only a semester fee of a few hundred euros), including for non-EU students — the cheapest serious degree in Western Europe. A residence permit for job-hunting follows graduation.",
  },
  {
    id: "warsaw",
    city: "Warsaw",
    country: "Poland",
    region: "europe",
    fields: ["computer_science", "business_economics", "engineering"],
    what: "The nearest big EU tech market to Central Asia, with a huge software and shared-services sector — and an existing community of students from the CIS.",
    catch: "Polish makes a real difference outside IT, and local pay sits under Western Europe.",
    route: "English-taught computer science and business degrees at moderate tuition, and an EU degree that travels onward.",
  },
  {
    id: "milan",
    city: "Milan",
    country: "Italy",
    region: "europe",
    fields: ["arts_design", "business_economics", "engineering"],
    what: "The design and fashion capital of Europe and Italy's financial centre — Politecnico di Milano is one of the strongest design and architecture schools anywhere.",
    catch: "Breaking into design is competitive and the first steps are often badly paid. Daily life runs in Italian.",
    route: "Italy's public tuition scales to family income and DSU regional scholarships cover fees plus a living grant — for a student from a modest income this is the cheapest realistic route into Western Europe. Compass already models Italian admissions.",
  },
  {
    id: "zurich",
    city: "Zurich & Lausanne",
    country: "Switzerland",
    region: "europe",
    fields: ["computer_science", "natural_sciences", "engineering"],
    what: "ETH and EPFL, plus the deep-tech and quantitative finance built around them — research here is funded at a level almost nowhere else matches.",
    catch: "The wall is admission and cost of living, not tuition: Switzerland is the most expensive country in Europe to exist in.",
    route: "Tuition at ETH/EPFL is low even for internationals. A PhD position is a salaried job, which is why doctoral study is the common way in.",
  },
  {
    id: "eindhoven",
    city: "Amsterdam & Eindhoven",
    country: "Netherlands",
    region: "europe",
    fields: ["engineering", "computer_science", "business_economics"],
    what: "English is used everywhere, and the Eindhoven region is the heart of Europe's semiconductor and precision-engineering supply chain.",
    catch: "Non-EU tuition is real money, and the student housing shortage is severe enough to plan around.",
    route: "English-taught bachelor's degrees are standard here, and a graduate can stay on an 'orientation year' permit to look for work.",
  },
  {
    id: "london",
    city: "London",
    country: "United Kingdom",
    region: "europe",
    fields: ["business_economics", "law", "arts_design", "computer_science", "humanities_social"],
    what: "Europe's biggest finance and legal centre, with a creative and media industry to match.",
    catch: "The most expensive city on this list by a distance, and post-study visa rules move with politics — check the current rule, not last year's.",
    route: "Scholarships are the realistic door: Chevening for master's study, and a few universities with substantial need-based aid for undergraduates.",
  },

  // ── Middle East & Türkiye ─────────────────────────────────────────────────
  {
    id: "dubai",
    city: "Dubai & Abu Dhabi",
    country: "UAE",
    region: "middle_east",
    fields: ["business_economics", "engineering", "computer_science", "medicine_health"],
    what: "A fast-growing corporate and startup market three hours from Central Asia, with branch campuses of Western universities on the ground.",
    catch: "Income is untaxed but living costs are high, and residence is tied to your employer — losing the job means losing the visa.",
    route: "NYU Abu Dhabi admits internationally with need-based aid that can cover the full cost, which makes it one of the most generous doors anywhere. Compass models UAE admissions already.",
  },
  {
    id: "istanbul",
    city: "Istanbul",
    country: "Türkiye",
    region: "middle_east",
    fields: ["business_economics", "engineering", "arts_design", "humanities_social"],
    what: "The bridge market between Europe and Asia, with large manufacturing, textile and design industries and a serious film and music scene.",
    catch: "Currency instability makes long-term planning harder, and Turkish is needed for most work.",
    route: "Türkiye Bursları is a full government scholarship — tuition, accommodation, stipend and a language year — and Central Asian students are a core audience for it.",
  },

  // ── Asia-Pacific ──────────────────────────────────────────────────────────
  {
    id: "seoul",
    city: "Seoul",
    country: "South Korea",
    region: "asia_pacific",
    fields: ["engineering", "computer_science", "arts_design", "business_economics"],
    what: "Electronics, automotive and battery R&D at Samsung/SK/Hyundai scale, plus games and entertainment industries that export worldwide.",
    catch: "Korean is expected for most roles, and working hours are long by European standards.",
    route: "The Global Korea Scholarship covers tuition, a stipend and a full year of language study — one of the few complete rides open to students from the CIS. Compass models Korean admissions.",
  },
  {
    id: "tokyo",
    city: "Tokyo",
    country: "Japan",
    region: "asia_pacific",
    fields: ["engineering", "computer_science", "arts_design", "natural_sciences"],
    what: "Robotics, precision manufacturing and materials research, and the world's animation and games industry.",
    catch: "Japanese is required for most jobs, and the hiring system is unusually rigid about when you apply.",
    route: "The MEXT government scholarship, plus a growing set of English-taught degrees at the larger universities.",
  },
  {
    id: "singapore",
    city: "Singapore",
    country: "Singapore",
    region: "asia_pacific",
    fields: ["business_economics", "computer_science", "medicine_health", "natural_sciences"],
    what: "Asia's finance hub and a deliberately built biotech and research cluster — and it all runs in English.",
    catch: "Expensive, and scholarships often carry a bond: several years working locally after you graduate.",
    route: "NUS and NTU offer scholarships to international students; read the bond terms before signing anything.",
  },
  {
    id: "hong-kong",
    city: "Hong Kong",
    country: "Hong Kong SAR",
    region: "asia_pacific",
    fields: ["business_economics", "law", "computer_science", "medicine_health"],
    what: "A finance and legal centre where the universities teach in English and rank among Asia's strongest.",
    catch: "Living costs are high and housing is small; the political picture has changed which employers set up here.",
    route: "HKU, HKUST and CUHK all run scholarship schemes for international undergraduates. Compass models Hong Kong admissions.",
  },
  {
    id: "shenzhen",
    city: "Shenzhen & Shanghai",
    country: "China",
    region: "asia_pacific",
    fields: ["engineering", "computer_science", "business_economics"],
    what: "Shenzhen is the hardware capital of the world — a prototype that takes months elsewhere takes days there; Shanghai holds the finance and corporate side.",
    catch: "Mandarin, and a different software and internet environment than you are used to building on.",
    route: "The Chinese Government Scholarship (CSC) covers tuition and a stipend, and many programmes are taught in English.",
  },
  {
    id: "bangalore",
    city: "Bengaluru",
    country: "India",
    region: "asia_pacific",
    fields: ["computer_science", "business_economics", "engineering"],
    what: "The largest software and startup cluster in South Asia, and the place a huge share of the world's engineering work is actually done.",
    catch: "Competition is enormous and local pay is low against Western scales — for a student from Central Asia this is a market to work WITH, not usually one to move to.",
    route: "Open-source and remote collaboration is the honest route here: the ecosystem is reachable from your desk.",
  },

  // ── North America ─────────────────────────────────────────────────────────
  {
    id: "boston",
    city: "Boston",
    country: "United States",
    region: "north_america",
    fields: ["medicine_health", "natural_sciences", "computer_science", "engineering"],
    what: "The densest concentration of universities, teaching hospitals and biotech companies on earth — if you want research, this is the deep end.",
    catch: "US tuition is the highest in the world, and the work visa after graduation is decided partly by lottery.",
    route: "A handful of universities meet the full demonstrated need of international students, which can make them cheaper than a mid-tier public university. Research programmes and science fairs are the early proving ground.",
  },
  {
    id: "bay-area",
    city: "San Francisco Bay Area",
    country: "United States",
    region: "north_america",
    fields: ["computer_science", "business_economics", "engineering"],
    what: "The centre of the software industry and of startup funding — the concentration of people who have built things at scale is the actual product here.",
    catch: "Costs are extreme, and the H-1B work visa is a lottery you can lose repeatedly.",
    route: "For most people from outside, the path is a US degree first, or contributing remotely to open source and startups until someone sponsors you.",
  },
  {
    id: "new-york",
    city: "New York",
    country: "United States",
    region: "north_america",
    fields: ["business_economics", "arts_design", "law", "humanities_social"],
    what: "Finance, media, publishing and the art market in one place — the density is the reason people put up with the price.",
    catch: "Same as Boston: cost and visa uncertainty, plus rent that eats junior salaries.",
    route: "Need-based aid at the universities that offer it to internationals; portfolio and writing competitions are how you start being seen from far away.",
  },
  {
    id: "toronto",
    city: "Toronto & Waterloo",
    country: "Canada",
    region: "north_america",
    fields: ["computer_science", "business_economics", "medicine_health", "engineering"],
    what: "A large tech and finance sector with a university pipeline (Waterloo) built around paid co-op work terms.",
    catch: "International tuition is substantial, and the winters are not a joke.",
    route: "The most predictable immigration ladder in North America: study permit, then a post-graduation work permit, then permanent residence — a route the US does not offer.",
  },
];

/** Hubs where at least one of the chosen fields clusters. Empty in ⇒ all hubs. */
export function hubsForFaculties(faculties: FacultyValue[]): Hub[] {
  if (faculties.length === 0) return HUBS;
  return HUBS.filter((h) => h.fields.some((f) => faculties.includes(f)));
}

/** The same list grouped for display, in curated region order, empties dropped. */
export function hubsByRegion(
  faculties: FacultyValue[],
): { region: RegionKey; hubs: Hub[] }[] {
  const matched = hubsForFaculties(faculties);
  return REGION_ORDER.map((region) => ({
    region,
    hubs: matched.filter((h) => h.region === region),
  })).filter((g) => g.hubs.length > 0);
}

/**
 * Grouped by COUNTRY, still in curated region order (so the home region leads).
 *
 * This is how the cities step is displayed, because a city is inside a country
 * and the guide used to present the two as siblings — it offered Berlin and
 * then, a step later, zoomed out to Germany. Grouping by country makes the
 * containment visible even for the countries we have no full profile of.
 */
export function hubsByCountry(
  faculties: FacultyValue[],
): { country: string; region: RegionKey; hubs: Hub[] }[] {
  const matched = hubsForFaculties(faculties);
  const groups: { country: string; region: RegionKey; hubs: Hub[] }[] = [];
  for (const region of REGION_ORDER) {
    // Curated order within a region is the order of HUBS itself, so the first
    // time a country appears is where its group goes.
    for (const hub of matched.filter((h) => h.region === region)) {
      const existing = groups.find(
        (g) => g.country === hub.country && g.region === region,
      );
      if (existing) existing.hubs.push(hub);
      else groups.push({ country: hub.country, region, hubs: [hub] });
    }
  }
  return groups;
}
