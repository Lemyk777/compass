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
  /**
   * What living there is actually like — housing, transport, weather, how it
   * feels to be a foreigner in it. Three lines about the industry tell a student
   * nothing about the years they would spend in the place, and the years are
   * what they are actually deciding about.
   */
  dayHere: string;
  /**
   * The SHAPE of the money: what is expensive, what a junior wage does or does
   * not cover, what quietly eats income. Deliberately no figures — salaries and
   * rents move every year and we cannot keep numbers true, while the shape
   * ("housing is the whole problem", "income is untaxed but school fees are
   * not") stays true for years. Same rule as the destination profiles.
   */
  money: string;
  /** What you need linguistically — separately for the work and for the life. */
  language: string;
  /** Who this place actually suits, and who should look at a different one. */
  whoThrives: string;
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
    dayHere:
      "A city against the mountains, which shapes everything: you can be on a ski slope or a hiking trail within an hour of leaving the office. Cafés function as the working and meeting culture, the centre is walkable and green, and the metro is small but useful. Winter smog in the bowl the city sits in is a genuine seasonal complaint, and earthquake risk is a background fact everyone lives with.",
    money:
      "The cheapest serious option on this whole list for a Central Asian student, because you are already here — no visa, no international tuition, no relocation. Rent in the centre is the main cost and rises faster than local wages. The decisive move for income is not changing employer locally but earning in a foreign currency remotely, which is why so much of the tech scene here works that way.",
    language:
      "Russian and Kazakh will carry your daily life entirely, and Russian remains the working language of most offices. English matters for the international firms and for any remote client work, and it is usually the single skill that most changes what you can earn here.",
    whoThrives:
      "Suits you if you want to build a career without leaving your family and language, and are willing to reach international clients from here. Look elsewhere if you want to work at the frontier of a deep-tech field — the local ceiling on research funding and specialised roles is real.",
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
    dayHere:
      "A planned, spacious, deliberately modern capital — wide avenues, new buildings, and a great deal of it built within living memory. The winter is the defining fact of life here and is severe by any standard; the city is organised around getting between heated buildings. Social life is smaller and more institutional than Almaty's, and much of it runs through work and university.",
    money:
      "Public-sector and state-corporate salaries are predictable and come with real benefits, which makes budgeting easier than in a startup economy. Housing is newer and easier to find than in Almaty. Heating and winter clothing are a genuine annual cost people from milder places underestimate.",
    language:
      "Kazakh has growing official weight here and Russian remains widely used in daily work; state and legal roles increasingly expect Kazakh. English is needed at Nazarbayev University, where teaching is in English, and in the international parts of the Hub.",
    whoThrives:
      "Suits you if you want proximity to government, state industry and the national startup programmes, or a place at an English-taught university without leaving the country. Look elsewhere if you want creative industries or a dense product scene — that is Almaty.",
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
    dayHere:
      "A large, green, low-rise city with a metro, hot summers and mild winters, and food and family culture at the centre of daily life. It is changing quickly — new construction, new businesses, more foreign companies — which means opportunity and also that plans shift. Living costs are among the lowest of any city on this list.",
    money:
      "Your money goes furthest here of anywhere on the map, which is exactly why the outsourcing sector exists. The IT Park tax regime is a real structural advantage for people working through it. The gap is upward: local salary ceilings arrive sooner than in bigger markets, so the ambitious route is foreign clients rather than local promotion.",
    language:
      "Uzbek for daily life, with Russian widely understood, especially in Tashkent and in business. English is concentrated in IT and international companies and is the clearest lever on income.",
    whoThrives:
      "Suits you if you want to build a technical career from inside a fast-growing market with low costs and serve clients abroad. Look elsewhere if you need an established research ecosystem or deep specialist roles — those are thin here for now.",
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
    dayHere:
      "A small, walkable, hilly old city with a strong café and food culture and an unusually large foreign community for its size. Getting in is administratively easy for many nationalities, which is much of why people are here. Winters are mild, the pace is relaxed, and the creative scene is disproportionately active for the population.",
    money:
      "Cheap by European standards and expensive by regional ones, and rents in the central districts rose sharply as remote workers arrived. Almost nobody here is optimising a local salary: the economics only work if your income comes from outside, and that is the honest framing of the place.",
    language:
      "Georgian for daily life, though Russian and English both function widely in the city and in the expatriate economy. You can live here for a long time in English, which is unusual for the region — and is also why integration is easy to postpone indefinitely.",
    whoThrives:
      "Suits you if you already have remote income and want a low-friction, pleasant base near home. Look elsewhere if you need a local career ladder, corporate employers or a research environment.",
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
    dayHere:
      "Flat, spread out, and organised around excellent public transport and cycling; the semester ticket that comes with enrolment usually covers your travel. Life is comparatively unhurried and shops genuinely close on Sundays. Bureaucracy is real and paper-based — registration, insurance, bank account, permit — and doing it in the right order is a rite of passage everyone complains about.",
    money:
      "Tuition is not your problem here; rent is. Berlin's housing market is the single hardest part of arriving, and non-EU students must show a blocked account with a year's living costs before the visa is issued — plan that lump sum early because it is the real financial gate. Health insurance is mandatory and is a fixed monthly cost, not an optional one.",
    language:
      "Tech and startup work genuinely runs in English, and you can be hired without German. Everything else — the authorities, the doctor, the landlord, most non-tech employers and most friendships outside the international bubble — needs German, and B2 is the honest level at which the city opens up.",
    whoThrives:
      "Suits you if you want a serious degree without tuition debt and are willing to learn German properly over a few years. Look elsewhere if you need high salaries quickly, or cannot tolerate administrative friction.",
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
    dayHere:
      "The most familiar-feeling European capital for someone from the CIS: similar climate, similar city rhythm, a large existing community from the region, and shops and food that will not feel foreign. Public transport is good and the city is noticeably safe. It is also the shortest and cheapest trip home of any EU option here.",
    money:
      "The best cost-to-opportunity ratio in the EU on this list: tuition is moderate rather than free, but living costs are well below Western Europe while salaries in IT are respectable. Rent has been climbing. A Polish degree is an EU degree, which is the asset you are really buying — it travels to the rest of the union afterwards.",
    language:
      "IT and international companies work in English, and English-taught degrees are widely available. Polish makes a large difference for everything outside those sectors and for daily life beyond the student bubble; it is closer to what you may already know than German is, which shortens the climb.",
    whoThrives:
      "Suits you if you want an EU degree and career start without Western European costs, and value being close to home. Look elsewhere if you want the highest salaries in Europe or a large deep-research ecosystem.",
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
    dayHere:
      "Milan is the least stereotypically Italian city in Italy: it works, it is businesslike, and it is grey and foggy in winter rather than sunlit. Public transport is excellent and the rest of Europe is a short train ride away. The design and fashion calendar dominates the year, and the city fills and empties around it.",
    money:
      "The tuition mechanism is the point and it is genuinely unusual: fees at public universities scale to assessed family income, and the DSU regional scholarship can cover fees plus a living grant. The paperwork to prove your family's income is demanding and must be done correctly and early — the students who miss out usually miss on documents, not on merit. Milan itself is Italy's most expensive city for rent.",
    language:
      "A growing number of degrees, especially at Politecnico and in business, are taught in English. Daily life, internships and most employment run in Italian, and design studios in particular expect it — assume you will need it to convert study into work.",
    whoThrives:
      "Suits you if your family income is modest and you want Western Europe at a cost the DSU system makes possible, especially in design, architecture or engineering. Look elsewhere if you cannot commit to learning Italian, or need to earn quickly after graduating.",
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
    dayHere:
      "Orderly to a degree that is either restful or stifling depending on temperament: transport runs exactly on time, the lakes and mountains are genuinely at hand, and the rules about noise, recycling and neighbourliness are taken seriously. It is quiet, extremely safe, and socially reserved — foreigners consistently report that making local friends takes years rather than months.",
    money:
      "The inversion that surprises everyone: tuition at ETH and EPFL is low even for internationals, while simply existing in Switzerland is the most expensive on this list. Rent, food, insurance and transport all cost multiples of neighbouring countries. This is why the doctoral route dominates — a PhD position is a salaried job, and salary is what makes the country affordable.",
    language:
      "Research and graduate teaching run in English, and at EPFL much of the environment does too. Zurich's daily life is in German (with Swiss German spoken), Lausanne's in French. You can complete a doctorate in English; you cannot integrate socially in it.",
    whoThrives:
      "Suits you if you are academically strong and aiming at research or deep tech, particularly via a funded PhD. Look elsewhere if you need to arrive as an undergraduate on a tight budget — the cost of living, not the fees, is what excludes people.",
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
    dayHere:
      "Life runs on a bicycle, in flat terrain, in wind and rain — that is not a joke about the weather but a daily reality. Dutch directness is real and takes adjusting to; people say what they think and consider it respectful. Amsterdam is dense and international; Eindhoven is smaller, quieter and organised around technology employers.",
    money:
      "Non-EU tuition is substantial and is the main cost, unlike Germany. The housing shortage is severe enough that universities warn applicants directly, and arriving without accommodation arranged is a genuine risk rather than an inconvenience — start that search the day you are admitted. Part-time work is permitted within limits and is common.",
    language:
      "The most English-functional country in continental Europe: English-taught bachelor's degrees are standard, workplaces in tech and research run in English, and daily life is navigable without Dutch. Dutch still matters for long-term integration and for many non-technical employers.",
    whoThrives:
      "Suits you if you want an English-taught European degree with a clear post-study work permit and a strong engineering industry attached. Look elsewhere if tuition costs are the binding constraint — Germany is the cheaper door into the same continent.",
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
    dayHere:
      "Enormous, and it is a collection of neighbourhoods rather than one city — where you live changes your life more than in any other place on this list. Public transport is excellent and correspondingly expensive; commutes of an hour each way are normal and are the price of affordable rent. Grey, wet winters, and an international population so large that being foreign is unremarkable.",
    money:
      "The most expensive city here by a distance, and rent is the reason — it eats a share of junior salaries that people from elsewhere find hard to believe. Undergraduate international tuition is high and, unlike the US, most universities do not offer large need-based aid, which is why scholarships rather than aid are the realistic door. Three-year degrees do genuinely reduce the total.",
    language:
      "English throughout, which removes the largest single barrier of most European options. What replaces it is cost, and a competitive graduate job market where accent and networks matter more than anyone admits.",
    whoThrives:
      "Suits you if you are aiming at finance, law, media or the creative industries and have a funded route in. Look elsewhere if you are paying your own way from a modest income — continental Europe delivers a comparable degree for a fraction of the outlay.",
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
    dayHere:
      "Life is organised around air conditioning and the car; the summer months are genuinely severe and much of daily life moves indoors. The population is overwhelmingly foreign, so being an expatriate is the norm rather than the exception — and the flip side is that communities are transient and friends leave. Central Asia is a short flight away, which matters more than people expect.",
    money:
      "Income is untaxed, which is the headline, and the honest counterweights are that rent and schooling are expensive and usually paid in large advance instalments, and that your legal residence is tied to your employer. Losing the job means losing the right to stay, on a short clock — so the savings that make this attractive should be built deliberately and early.",
    language:
      "Business, universities and most workplaces run in English, and you can live here entirely in it. Arabic is valuable for government-facing work and for genuine integration, but it is not a barrier to entry the way German or Korean is.",
    whoThrives:
      "Suits you if you want to save quickly, stay near home, and work in a corporate or startup environment in English — and NYU Abu Dhabi's need-based aid makes it one of the most generous undergraduate doors anywhere. Look elsewhere if you want a permanent home with a path to citizenship, or a deep research culture.",
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
    dayHere:
      "Vast, layered and loud in the best sense — a city of fifteen-plus million spread across two continents, with commutes to match. Food, hospitality and social life are exceptional and cheap by European standards. Earthquake risk is a serious and openly discussed fact of living here, and it is worth understanding what it means for where you live.",
    money:
      "Costs are low against Europe, and that is real. The complication is currency: inflation has repeatedly outrun wages, so a salary that looked adequate can erode within a year, and long-term planning is harder than the headline cost suggests. Scholarship students are insulated from much of this, which is part of why the scholarship route dominates.",
    language:
      "Turkish is needed for most work and for daily life, and Türkiye Bursları includes a full year of language study precisely because of that. Some English-taught programmes exist at the strong universities. For a Central Asian student the Turkic language family makes this a shorter climb than most.",
    whoThrives:
      "Suits you if the Türkiye Bursları scholarship is realistic for you — it is one of the few genuinely complete packages open to students from this region. Look elsewhere if you need currency stability or a Western credential for onward migration.",
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
    dayHere:
      "Dense, fast, and extraordinarily well served: transport, delivery and internet all work at a standard that recalibrates expectations. It is very safe and open late. The social side is more demanding — work and university culture are hierarchical, age determines how you address people, and after-hours socialising with colleagues is closer to obligatory than optional.",
    money:
      "Living costs are moderate for a major Asian capital, with housing deposits the awkward part: the traditional rental system asks for large lump sums up front, and student housing is the usual way around it. The Global Korea Scholarship removes tuition and adds a stipend, which for students from this region is what makes the country accessible at all.",
    language:
      "Korean is expected for most employment, and the scholarship's full language year exists because of that. English-taught degree programmes are available at the larger universities, but treating English as sufficient for the career afterwards is the mistake people make here.",
    whoThrives:
      "Suits you if you want engineering or technology at industrial scale and will genuinely commit to learning Korean. Look elsewhere if long hours and steep workplace hierarchy would wear you down — that is a documented and widely discussed part of the culture, not a rumour.",
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
    dayHere:
      "Orderly, quiet in public, and impeccably run — trains to the second, and a level of everyday reliability that is hard to describe until you live in it. Apartments are small and commutes are long and crowded. It is a place where the rules are largely unwritten, and foreigners often find that politeness and distance are not the same thing as inclusion.",
    money:
      "Tokyo is expensive but less so than commonly assumed, and the MEXT scholarship covers tuition with a monthly stipend. Housing is small rather than costly, and health insurance is affordable and mandatory. Renting privately as a foreigner can require a guarantor, which is an administrative hurdle worth knowing about before arrival.",
    language:
      "Japanese is required for most employment, and functional Japanese is the difference between visiting and living. English-taught degrees are growing at the larger universities, and research groups often operate in English — but the job market largely does not.",
    whoThrives:
      "Suits you if you want precision engineering, materials or animation at world level and will learn Japanese. Look elsewhere if you need to change employers freely — the hiring system is unusually rigid about when and how you apply, especially for graduates.",
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
    dayHere:
      "Small, hot and humid year-round, extremely safe, and organised to a degree that makes daily logistics effortless. Everything is close, public transport is excellent, and the rest of Southeast Asia is a short flight away. The trade is that it can feel constrained — it is a city-state, and people describe running out of new places after a couple of years.",
    money:
      "Expensive, with housing the dominant cost, and private car ownership effectively priced out of reach by design. Salaries are high and taxes are low, so saving is realistic. The scholarship terms are the thing to read carefully: several carry a bond obliging you to work locally for a number of years afterwards, which is a genuine commitment rather than a formality.",
    language:
      "English is an official working language and everything runs in it — university, employment, government. This makes it the lowest-friction move on the map for someone with strong English, with no language year required.",
    whoThrives:
      "Suits you if you want a globally recognised English-taught degree in Asia and are comfortable committing to a bond in exchange for funding. Look elsewhere if you want a large country to explore or a low cost of living.",
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
    dayHere:
      "Vertical, fast and startlingly efficient — the transport system is among the best anywhere and you are never far from either a skyscraper or a hiking trail. Apartments are genuinely small, smaller than newcomers picture. Humid subtropical summers with typhoon season, and a city that mixes Cantonese daily life with international business at close quarters.",
    money:
      "Among the most expensive housing markets in the world, and that single line dominates the budget; university accommodation, where you can get it, is the difference between viable and not. Tuition for internationals is moderate compared with the US or UK, and the universities run real scholarship schemes — those two facts are what make it work financially.",
    language:
      "Universities teach in English and business runs in English, so study and professional life are accessible without Chinese. Cantonese is the language of daily life; Mandarin is increasingly useful. You can function in English and will feel the limit of it socially.",
    whoThrives:
      "Suits you if you want a top-ranked English-taught degree inside Asia with scholarship support, aiming at finance, law or technology. Look elsewhere if you need space and low costs, or if you want long-term political predictability — the landscape of which employers base themselves here has changed.",
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
    dayHere:
      "Daily life runs almost entirely through domestic apps — payments, transport, food, messaging — and setting those up with a foreign phone number and bank account is the first real task on arrival. Once working, the convenience is remarkable. Shenzhen is young, fast and built for manufacturing; Shanghai is the cosmopolitan, corporate half. Expect a different software environment than you are used to building on.",
    money:
      "Living costs are moderate and the CSC scholarship covers tuition plus a stipend, which makes this one of the more financially accessible serious options. Hardware prototyping in Shenzhen is cheaper and faster than anywhere on earth — for an engineer that is the real economic argument for being there rather than the salary.",
    language:
      "Mandarin is the language of work and life, and scholarship programmes typically include language study. English-taught degrees exist and are growing, but the industrial ecosystem — the suppliers, the factories, the markets — operates in Chinese, and that is the part you came for.",
    whoThrives:
      "Suits you if you are a hardware or manufacturing engineer who wants to be inside the world's supply chain, and will learn Mandarin. Look elsewhere if you need an internet environment continuous with the one you already build on, or a credential aimed primarily at Western employers.",
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
    dayHere:
      "A mild climate by Indian standards and a young, technical population — the density of engineers is the city's defining feature. Traffic and infrastructure strain are the standing complaints, and commute times shape where people choose to live and work. The startup and open-source community is unusually open to newcomers, including remote ones.",
    money:
      "Costs are low and salaries are low against Western scales, so this is not a market to move to for income — the value here is the ecosystem, not the pay packet. That is why the honest route we give is collaboration rather than relocation: you can join the community, and much of it, from your own desk.",
    language:
      "The technology industry runs in English throughout, so professional participation needs nothing else. Kannada and Hindi shape daily life locally, but for the remote collaboration route that this hub is really about, English is sufficient.",
    whoThrives:
      "Suits you if you want to plug into a huge open-source and product community and learn from its pace — mostly remotely. Look elsewhere if you are choosing a place to physically move for salary or immigration; this hub is on the map as a market to work WITH.",
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
    dayHere:
      "Compact and walkable by American standards, with a real winter and an unusual student density — a large share of the population is here to study, which shapes the culture and the calendar. Public transport exists and is adequate rather than excellent. Academic and hospital institutions dominate the city's identity and its employment.",
    money:
      "The published price is not the price, and understanding that is the single most valuable thing on this page: a small number of universities meet the full demonstrated financial need of international students, which can make them cheaper than a mid-tier public university elsewhere. Rent is high. Health insurance is a mandatory and substantial annual cost that European students routinely forget to budget for.",
    language:
      "English throughout, with no language requirement beyond the entrance tests. What is required instead is the ability to write and argue in an academic register, which is a specific skill the admissions essays are testing.",
    whoThrives:
      "Suits you if you are aiming at research, medicine or biotech and your family income is low enough that need-based aid genuinely applies. Look elsewhere if you need certainty about staying afterwards — the work visa is decided partly by lottery.",
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
    dayHere:
      "Sprawling and car-dependent outside San Francisco itself, with a mild climate and a professional culture that talks about work more than anywhere else on this list. The concentration of people who have built things at scale is the actual product, and it shows in how easily conversations turn into introductions. Visible inequality on the streets is stark and startling to newcomers.",
    money:
      "Salaries are the highest in the world for software work and the cost of housing consumes an extraordinary share of them; people routinely share accommodation years into their careers. The honest arithmetic is that saving here is possible but far less automatic than the headline numbers suggest, and equity — not salary — is what has historically made the difference.",
    language:
      "English only, and specifically a fluent, confident, informal register: much of how opportunity moves here is through conversation and referral rather than formal application, which puts a premium on being comfortable talking to strangers.",
    whoThrives:
      "Suits you if you want to be at the centre of the software industry and can tolerate expense and visa uncertainty for it. Look elsewhere if you need a predictable immigration ladder — Canada offers one and this does not.",
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
    dayHere:
      "The one American city that works without a car, which changes everything about daily life: the subway runs constantly, you walk a great deal, and neighbourhoods are distinct enough to feel like separate towns. It is loud, fast and culturally saturated — the density of galleries, theatres, publishers and newsrooms is the reason people accept the price.",
    money:
      "Rent is the defining problem and it eats junior salaries in finance, media and the arts alike; sharing an apartment well into your twenties is normal rather than a failure. Everything social costs money, which is easy to underestimate when the social life is the reason you came. Need-based aid at the universities that offer it is what makes studying here possible at all.",
    language:
      "English, and in the creative and media industries a specific fluency in writing and pitching. This is a city where being able to explain your work compellingly in two minutes has direct economic value.",
    whoThrives:
      "Suits you if you are aiming at finance, law, media, publishing or the art market and want to be where those industries actually are. Look elsewhere if you are cost-sensitive or want a quiet, spacious life — this is the opposite of both.",
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
    dayHere:
      "Genuinely multicultural in a way that makes being foreign unremarkable — a large share of the population was born elsewhere, and the city is organised around that fact. Toronto is big and transit-served; Waterloo is a smaller university town an hour and a half away. The winter is long and cold, and that is worth taking seriously rather than laughing off.",
    money:
      "International tuition is substantial and housing in Toronto has become genuinely difficult, which together make this less of a bargain than its reputation suggests. The counterweight is structural: Waterloo's co-op model puts paid work terms inside the degree, so you earn and gain local experience while studying — and local experience is what the immigration route actually rewards.",
    language:
      "English, with French an asset nationally and a requirement in parts of the public sector. No language barrier to study or work, which combined with the immigration ladder is much of the appeal.",
    whoThrives:
      "Suits you if a predictable path from study permit to permanent residence matters more to you than prestige or salary — that ladder is the most reliable in North America and the US does not offer an equivalent. Look elsewhere if you cannot fund substantial international tuition, or want the highest technology salaries.",
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
