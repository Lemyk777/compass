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

// The region taxonomy moved to `lib/data/regions.ts` — a leaf module a client
// component can import without dragging this registry behind it. Re-exported
// here so every existing `from "@/lib/data/world"` keeps resolving.
import {
  REGION_LABEL,
  REGION_ORDER,
  type RegionKey,
} from "@/lib/data/regions";
export { REGION_LABEL, REGION_ORDER, type RegionKey };

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
    what: "Kazakhstan's business and startup centre. Most international companies put their local office here, and the country's strongest universities and creative scene are here too.",
    catch: "Pay and funding sit well below Western Europe, and English-language work is concentrated in a handful of firms.",
    route: "You are already inside it. Local universities, then either remote work for foreign clients or a master's abroad. Both are normal paths from here.",
    dayHere:
      "A city against the mountains, which shapes everything: you can be on a ski slope or a hiking trail within an hour of leaving the office. Cafés function as the working and meeting culture, the centre is walkable and green, and the metro is small but useful. Winter smog in the bowl the city sits in is a genuine seasonal complaint, and earthquake risk is a background fact everyone lives with.",
    money:
      "The cheapest serious option on this whole list for a Central Asian student, because you are already here: no visa, no international tuition, no relocation. Rent in the centre is the main cost and rises faster than local wages. The decisive move for income isn't changing employer locally but earning in a foreign currency remotely, which is why so much of the tech scene here works that way.",
    language:
      "Russian and Kazakh will carry your daily life entirely, and Russian remains the working language of most offices. English matters for the international firms and for any remote client work, and it is usually the single skill that most changes what you can earn here.",
    whoThrives:
      "Suits you if you want to build a career without leaving your family and language, and are willing to reach international clients from here. Look elsewhere if you want to work at the frontier of a deep-tech field. The local ceiling on research funding and specialised roles is real.",
  },
  {
    id: "astana",
    city: "Astana",
    country: "Kazakhstan",
    region: "central_asia",
    fields: ["engineering", "computer_science", "law", "business_economics"],
    what: "Government, state companies and Astana Hub, the tech park where most of the country's startup programmes and grants are run.",
    catch: "Heavily state and corporate; if you want a creative or product-led industry, Almaty is the livelier half of the country.",
    route: "Nazarbayev University, Astana Hub's programmes, and the competitions local organisations post. Some of them land in your Opportunities list directly.",
    dayHere:
      "A planned, spacious, deliberately modern capital: wide avenues, new buildings, and a great deal of it built within living memory. The winter is the defining fact of life here and is severe by any standard; the city is organised around getting between heated buildings. Social life is smaller and more institutional than Almaty's, and much of it runs through work and university.",
    money:
      "Public-sector and state-corporate salaries are predictable and come with real benefits, which makes budgeting easier than in a startup economy. Housing is newer and easier to find than in Almaty. Heating and winter clothing are a genuine annual cost people from milder places underestimate.",
    language:
      "Kazakh has growing official weight here and Russian remains widely used in daily work; state and legal roles increasingly expect Kazakh. English is needed at Nazarbayev University, where teaching is in English, and in the international parts of the Hub.",
    whoThrives:
      "Suits you if you want proximity to government, state industry and the national startup programmes, or a place at an English-taught university without leaving the country. Look elsewhere if you want creative industries or a dense product scene. That's Almaty.",
  },
  {
    id: "tbilisi",
    city: "Tbilisi",
    country: "Georgia",
    region: "central_asia",
    fields: ["computer_science", "arts_design", "business_economics"],
    what: "A visa-easy base that filled with remote workers and small studios, a growing design, film and software scene for its size.",
    catch: "The local market is small: almost everyone here earns from clients somewhere else.",
    route: "Remote-first. This is a place people move to while working for elsewhere, not a place with a big local job ladder.",
    dayHere:
      "A small, walkable, hilly old city with a strong café and food culture and an unusually large foreign community for its size. Getting in is administratively easy for many nationalities, which is much of why people are here. Winters are mild, the pace is relaxed, and the creative scene is disproportionately active for the population.",
    money:
      "Cheap by European standards and expensive by regional ones, and rents in the central districts rose sharply as remote workers arrived. Almost nobody here is optimising a local salary: the economics only work if your income comes from outside, and that is the honest framing of the place.",
    language:
      "Georgian for daily life, though Russian and English both function widely in the city and in the expatriate economy. You can live here for a long time in English, which is unusual for the region. It's also why integration is easy to postpone indefinitely.",
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
    route: "German public universities charge no tuition (only a semester fee of a few hundred euros), including for non-EU students. It is the cheapest serious degree in Western Europe. A residence permit for job-hunting follows graduation.",
    dayHere:
      "Flat, spread out, and organised around excellent public transport and cycling; the semester ticket that comes with enrolment usually covers your travel. Life is comparatively unhurried and shops genuinely close on Sundays. Bureaucracy is real and paper-based: registration, insurance, bank account, permit. Doing it in the right order is a rite of passage everyone complains about.",
    money:
      "Tuition isn't your problem here; rent is. Berlin's housing market is the single hardest part of arriving, and non-EU students must show a blocked account with a year's living costs before the visa is issued. Plan that lump sum early, because it's the real financial gate. Health insurance is mandatory and is a fixed monthly cost, not an optional one.",
    language:
      "Tech and startup work genuinely runs in English, and you can be hired without German. Everything else needs German: the authorities, the doctor, the landlord, most non-tech employers, and most friendships outside the international bubble. B2 is the honest level at which the city opens up.",
    whoThrives:
      "Suits you if you want a serious degree without tuition debt and are willing to learn German properly over a few years. Look elsewhere if you need high salaries quickly, or can't tolerate administrative friction.",
  },
  {
    id: "munich",
    city: "Munich",
    country: "Germany",
    region: "europe",
    fields: ["engineering", "computer_science", "natural_sciences", "business_economics"],
    what: "Germany's engineering heartland: cars, aerospace, industrial software and two of the country's strongest technical universities in one city.",
    catch: "The most expensive city in Germany to live in, and German is expected in far more of the work than in Berlin.",
    route: "The same no-tuition public system as the rest of Germany, and the technical universities run a wide set of English-taught master's degrees; bachelor's teaching is mostly in German.",
    dayHere:
      "Orderly, prosperous and close to the Alps. Mountains and lakes are an hour out, and people organise their weekends around them. It's quieter and more traditional than Berlin: things close, rules are followed, and the social door opens slowly but stays open. Transport works and cycling is normal, so you won't need a car.",
    money:
      "Tuition isn't the problem here; rent is, and Munich's is the highest in the country, so applying for student halls and shared flats months ahead is the difference between arriving and scrambling. The blocked account showing a year of living costs is still the visa gate, and it bites harder here because the city sits above the national assumption behind that figure. Health insurance is mandatory and fixed.",
    language:
      "Engineering master's programmes and international corporate teams run in English, but Munich's employers expect German sooner than Berlin's and internships almost always do. Assume B2 to work here, and more of daily life needs it than in the capital.",
    whoThrives:
      "Suits you if you want engineering or applied science next to the companies that employ it, and will learn German properly. Look elsewhere if your budget is tight. Berlin or a smaller university city gives you the same free tuition at a fraction of the rent.",
  },
  {
    id: "warsaw",
    city: "Warsaw",
    country: "Poland",
    region: "europe",
    fields: ["computer_science", "business_economics", "engineering"],
    what: "The nearest big EU tech market to Central Asia, with a huge software and shared-services sector, and an existing community of students from the CIS.",
    catch: "Polish makes a real difference outside IT, and local pay sits under Western Europe.",
    route: "English-taught computer science and business degrees at moderate tuition, and an EU degree that travels onward.",
    dayHere:
      "The most familiar-feeling European capital for someone from the CIS: similar climate, similar city rhythm, a large existing community from the region, and shops and food that won't feel foreign. Public transport is good and the city is noticeably safe. It's also the shortest and cheapest trip home of any EU option here.",
    money:
      "The best cost-to-opportunity ratio in the EU on this list: tuition is moderate rather than free, but living costs are well below Western Europe while salaries in IT are respectable. Rent has been climbing. A Polish degree is an EU degree, which is the asset you are really buying. It travels to the rest of the union afterwards.",
    language:
      "IT and international companies work in English, and English-taught degrees are widely available. Polish makes a large difference for everything outside those sectors and for daily life beyond the student bubble; it is closer to what you may already know than German is, which shortens the climb.",
    whoThrives:
      "Suits you if you want an EU degree and career start without Western European costs, and value being close to home. Look elsewhere if you want the highest salaries in Europe or a large deep-research ecosystem.",
  },
  {
    id: "krakow",
    city: "Kraków",
    country: "Poland",
    region: "europe",
    fields: ["computer_science", "business_economics", "humanities_social"],
    what: "Poland's second technology centre and its cultural capital: a dense student city where global companies run engineering and shared-services offices.",
    catch: "A smaller market than Warsaw, so the ceiling arrives sooner, and Polish matters more here outside the international offices.",
    route: "English-taught computer science, business and humanities degrees at moderate tuition, in a city built around students, and an EU degree at the end of it.",
    dayHere:
      "Small enough to cross on foot, medieval in the middle and full of students for most of the year, which makes arriving alone much easier than in a capital. Rents and prices sit below Warsaw's, the trip home is short, and the winters and the food will feel familiar to anyone from the region. Winter air quality is the standing local complaint.",
    money:
      "Costs are lower than Warsaw's on every line: rent, food, transport. Tuition in English-taught programmes at public universities stays moderate, and scholarships exist for strong applicants. Technology salaries are respectable by Polish standards and below Western European ones, which is the trade the whole city represents. The EU degree is the asset you are actually buying.",
    language:
      "The technology and services offices work in English and English-taught degrees are easy to find, but Kraków is less international than Warsaw, so Polish opens far more of the city, the part-time work and the friendships. It's a shorter climb from Russian than German is.",
    whoThrives:
      "Suits you if you want an EU degree in a student city rather than a business capital, close to home and at a manageable cost. Look elsewhere if you want the country's largest job market, which is Warsaw, or a deep research ecosystem.",
  },
  {
    id: "milan",
    city: "Milan",
    country: "Italy",
    region: "europe",
    fields: ["arts_design", "business_economics", "engineering"],
    what: "The design and fashion capital of Europe, and Italy's financial centre. Politecnico di Milano is one of the strongest design and architecture schools anywhere.",
    catch: "Breaking into design is competitive and the first steps are often badly paid. Daily life runs in Italian.",
    route: "Italy's public tuition scales to family income and DSU regional scholarships cover fees plus a living grant. For a student from a modest income this is the cheapest realistic route into Western Europe. Compass already models Italian admissions.",
    dayHere:
      "Milan is the least stereotypically Italian city in Italy: it works, it is businesslike, and it is grey and foggy in winter rather than sunlit. Public transport is excellent and the rest of Europe is a short train ride away. The design and fashion calendar dominates the year, and the city fills and empties around it.",
    money:
      "The tuition mechanism is the point and it is genuinely unusual: fees at public universities scale to assessed family income, and the DSU regional scholarship can cover fees plus a living grant. The paperwork to prove your family's income is demanding and must be done correctly and early. The students who miss out usually miss on documents, not on merit. Milan itself is Italy's most expensive city for rent.",
    language:
      "A growing number of degrees, especially at Politecnico and in business, are taught in English. Daily life, internships and most employment run in Italian, and design studios in particular expect it. Assume you'll need it to convert study into work.",
    whoThrives:
      "Suits you if your family income is modest and you want Western Europe at a cost the DSU system makes possible, especially in design, architecture or engineering. Look elsewhere if you can't commit to learning Italian, or need to earn quickly after graduating.",
  },
  {
    id: "rome",
    city: "Rome",
    country: "Italy",
    region: "europe",
    fields: ["humanities_social", "medicine_health", "law", "arts_design"],
    what: "Italy's capital and its largest university city, where heritage, medicine, law and the UN's food agencies sit in the same place.",
    catch: "Administration is slower than in the north, the private job market is thinner than Milan's, and nearly everything outside the international organisations runs in Italian.",
    route: "Public tuition scales to family income and the regional DSU scholarship can cover fees and a living grant. It is the same mechanism that makes Italy the cheapest realistic route into Western Europe.",
    dayHere:
      "Beautiful, loud and unhurried, with a pace that charms people for a year and frustrates them by the third. Public transport is the weak point, so where you live decides your day. Rents sit below Milan's, winters are mild, and student life is spread across the city rather than gathered on a campus.",
    money:
      "The income-scaled tuition and the regional DSU grant are the reason to be here, and both are decided on documents about your family's income that have to be legalised correctly and submitted early. The students who lose out lose on paperwork rather than on merit. Living costs are lower than Milan's, and student work is far easier to find in hospitality than in an office.",
    language:
      "A growing number of master's degrees are taught in English, especially in the sciences and international studies, but Rome runs in Italian: the administration, the hospital placements, the courts and most employers. Assume you need it to convert a degree here into work here.",
    whoThrives:
      "Suits you if you want humanities, medicine or law in Europe at a cost the Italian system makes possible, and you'll learn Italian. Look elsewhere if you want a fast technical career start, since Milan is the working city, or you can't tolerate slow administration.",
  },
  {
    id: "zurich",
    city: "Zurich",
    country: "Switzerland",
    region: "europe",
    fields: ["computer_science", "natural_sciences", "engineering", "business_economics"],
    what: "ETH plus the deep-tech and quantitative finance built around it, and the largest concentration of research money and technical employers in the German-speaking world.",
    catch: "The wall is admission and cost of living, not tuition: Switzerland is the most expensive country in Europe to exist in, and daily life runs in a German most textbooks don't teach you.",
    route: "Tuition at ETH is low even for internationals. A PhD position is a salaried job, which is why doctoral study is the common way in.",
    dayHere:
      "Orderly to a degree that is either restful or stifling depending on temperament: transport runs exactly on time, the lake and the mountains are genuinely at hand, and the rules about noise, recycling and neighbourliness are taken seriously. It's quiet, extremely safe, and socially reserved. Foreigners consistently report that making local friends takes years rather than months.",
    money:
      "The inversion that surprises everyone: tuition at ETH is low even for internationals, while simply existing in Switzerland is the most expensive on this list. Rent, food, insurance and transport all cost multiples of neighbouring countries. This is why the doctoral route dominates. A phD position is a salaried job, and salary is what makes the country affordable.",
    language:
      "Research and graduate teaching run in English. Daily life runs in German, and specifically in Swiss German, which is spoken rather than written and which standard German lessons won't prepare you for. You can complete a doctorate in English; you can't integrate socially in it.",
    whoThrives:
      "Suits you if you are academically strong, aiming at research or deep tech, and want the option of leaving academia without leaving the city. Zurich has the employers for that; Lausanne doesn't. Look elsewhere if you need to arrive as an undergraduate on a tight budget: the cost of living, not the fees, is what excludes people.",
  },
  {
    id: "lausanne",
    city: "Lausanne",
    country: "Switzerland",
    region: "europe",
    fields: ["computer_science", "engineering", "natural_sciences"],
    what: "EPFL on Lake Geneva: robotics, life sciences and computer science on one campus, in an environment that runs in English further down than Zurich's does.",
    catch: "The same Swiss cost wall, and a much smaller job market: outside the campus and a handful of research-led companies, leaving academia here usually means leaving the city.",
    route: "Tuition at EPFL is low even for internationals, and a doctoral position is a salaried job. Master's programmes are widely taught in English, which makes it an easier first step than Zurich for someone with no German.",
    dayHere:
      "Small, steep and built down to the lake, with the Alps across the water. You can be in a vineyard or on a train to the mountains within half an hour. The campus dominates the city's rhythm in a way it doesn't in Zurich, so student life is more concentrated and easier to enter. It's French-speaking, noticeably more relaxed than the German-speaking side, and small enough that you'll recognise people.",
    money:
      "The same inversion as the rest of Switzerland: fees are low and living isn't. Rent is below Zurich's but not by enough to change the calculation, and health insurance is compulsory and privately bought, which catches arrivals out because it is a real monthly cost nobody warns you about. A funded doctorate is what turns this from unaffordable into comfortable.",
    language:
      "EPFL works in English at master's and doctoral level, and much of the campus does day to day. The city outside it is French, and so is the administration: residence permits, insurance, tax. Enough French to handle an office counter is the practical threshold.",
    whoThrives:
      "Suits you if EPFL specifically is the target, or if French-speaking Europe is where you want to live and study in English while you learn the language. Look elsewhere if you want a large non-academic job market in the same city, which is Zurich, or if you want a big city at all.",
  },
  {
    id: "geneva",
    city: "Geneva",
    country: "Switzerland",
    region: "europe",
    fields: ["humanities_social", "law", "medicine_health", "business_economics"],
    what: "The world's densest concentration of international organisations: the UN, the WHO, the Red Cross, the trade and health bodies. With the universities and NGOs that feed them.",
    catch: "Entry to that world runs through unpaid or barely-paid internships in the most expensive city on this map, which quietly selects for students whose families can fund it.",
    route: "Public university tuition is modest by Swiss standards and the master's degrees in international affairs, law and global health are the recognised door; French carries daily life.",
    dayHere:
      "Small, orderly and expensive, wrapped around a lake with the Alps behind it. Everything works and everything closes early, and Sunday is genuinely quiet. The population is unusually international, which makes it easy to arrive and slow to feel local; France is a tram ride away and many people live on that side for the rent.",
    money:
      "Tuition at the public university is low relative to the country's wealth, and the real cost is existing here: rent, food and insurance are the heaviest in this guide, and permit rules limit how much a non-EU student can work. The internships that lead into the organisations often pay little or nothing, so plan the funding for that stage before you plan the degree.",
    language:
      "The organisations and the research groups work in English, and master's degrees are commonly taught in it. Administration, housing, healthcare and daily life run in French, and most Swiss employers outside the international bubble expect it. This is a bilingual life, not an English-speaking one.",
    whoThrives:
      "Suits you if international law, diplomacy or global health is the goal and you can fund an expensive, low-paid start. Look elsewhere if money is the binding constraint, or if you want a technical career. Zurich and Lausanne are where that work actually is.",
  },
  {
    id: "amsterdam",
    city: "Amsterdam",
    country: "Netherlands",
    region: "europe",
    fields: ["business_economics", "computer_science", "arts_design", "humanities_social"],
    what: "The Dutch business and technology centre, where English-taught degrees and English-speaking workplaces are the norm rather than the exception.",
    catch: "A housing shortage severe enough to be the main reason students struggle here, and non-EU tuition well above Germany's.",
    route: "The widest set of English-taught bachelor's degrees in continental Europe, and an 'orientation year' permit that lets you stay and look for work after graduating.",
    dayHere:
      "Flat, wet, cycled everywhere, and organised around getting things done directly. Dutch bluntness is a real adjustment, and mostly a kind one. The city is small, international and walkable, with the rest of Europe a short train away. The catch is housing: finding a room is the hardest part of the first year, and scams aimed at arriving students are common.",
    money:
      "Non-EU tuition is real money rather than a formality, and the system is at least transparent about it: you pay the institutional rate and scholarships are limited and competitive. Living costs are driven by rent, the tightest market in this guide. Part-time work is allowed with a permit and the wage floor is decent, which makes a student job worth having rather than symbolic.",
    language:
      "As far as a degree and a technology job go, this is the most English-functional country on the map. You won't be held back in either. Where it stops is the paperwork: the tax office, the municipality, your health insurer and the water board write to you in Dutch only, and every long-term route through immigration expects Dutch eventually. Plan on learning it if you intend to stay, and not if you don't.",
    whoThrives:
      "Suits you if you want an English-taught European degree with a real route into work afterwards and can fund the tuition. Look elsewhere if cost is the binding constraint, or if you can't handle the risk of arriving without a room.",
  },
  {
    id: "eindhoven",
    city: "Eindhoven",
    country: "Netherlands",
    region: "europe",
    fields: ["engineering", "computer_science", "business_economics"],
    what: "The Brainport region, the heart of Europe's semiconductor and precision-engineering supply chain, with the equipment makers, chip designers and their suppliers inside half an hour of each other.",
    catch: "A one-industry town: if you leave hardware, the local market thins out fast, and it is far quieter socially than Amsterdam.",
    route: "English-taught engineering degrees at TU Eindhoven, paid internships with the industry attached, and an 'orientation year' permit to stay and look for work after graduating.",
    dayHere:
      "Life runs on a bicycle, in flat terrain, in wind and rain. That isn't a joke about the weather but a daily reality. Eindhoven is small, modern and organised around its technology employers rather than around tourism: quieter evenings, shorter commutes, and a campus that sits inside the industry instead of beside it. Dutch directness is real and takes adjusting to; people say what they think and consider it respectful.",
    money:
      "Non-EU tuition is substantial and is the main cost, unlike Germany. But housing is markedly easier and cheaper here than in Amsterdam, which is the single biggest practical argument for the south. Paid internships in the semiconductor industry are a normal part of an engineering degree rather than a prize.",
    language:
      "English carries the degree and the technology workplaces completely. The industry here is international by necessity. Dutch matters less than in Amsterdam for work and more for social life, because the city is smaller and its non-industry side runs in Dutch.",
    whoThrives:
      "Suits you if you are aiming at hardware, chips or precision engineering specifically and want to study inside that industry. Look elsewhere if you want a big international city, a broad choice of employers, or a non-engineering direction. Amsterdam does all three better.",
  },
  {
    id: "london",
    city: "London",
    country: "United Kingdom",
    region: "europe",
    fields: ["business_economics", "law", "arts_design", "computer_science", "humanities_social"],
    what: "Europe's biggest finance and legal centre, with a creative and media industry to match.",
    catch: "The most expensive city on this list by a distance, and post-study visa rules move with politics. Check the current rule, not last year's.",
    route: "Scholarships are the realistic door: Chevening for master's study, and a few universities with substantial need-based aid for undergraduates.",
    dayHere:
      "Enormous, and it is a collection of neighbourhoods rather than one city. Where you live changes your life more than in any other place on this list. Public transport is excellent and correspondingly expensive; commutes of an hour each way are normal and are the price of affordable rent. Grey, wet winters, and an international population so large that being foreign is unremarkable.",
    money:
      "The most expensive city here by a distance, and rent is the reason. It eats a share of junior salaries that people from elsewhere find hard to believe. Undergraduate international tuition is high and, unlike the US, most universities don't offer large need-based aid, which is why scholarships rather than aid are the realistic door. Three-year degrees do genuinely reduce the total.",
    language:
      "English throughout, which removes the largest single barrier of most European options. What replaces it is cost, and a competitive graduate job market where accent and networks matter more than anyone admits.",
    whoThrives:
      "Suits you if you are aiming at finance, law, media or the creative industries and have a funded route in. Look elsewhere if you are paying your own way from a modest income. Continental Europe delivers a comparable degree for a fraction of the outlay.",
  },

  // ── Middle East & Türkiye ─────────────────────────────────────────────────
  {
    id: "manchester",
    city: "Manchester",
    country: "United Kingdom",
    region: "europe",
    fields: ["engineering", "computer_science", "medicine_health", "business_economics", "humanities_social"],
    what: "The largest UK student city outside London: a big research university, a growing technology and media cluster, and living costs a long way below the capital's.",
    catch: "Graduate hiring still concentrates in London, and the UK's post-study work window is narrowing rather than widening.",
    route: "One UCAS application covers five UK universities at once, and admission is decided almost entirely on academic grades and the personal statement.",
    dayHere:
      "Rainy, direct and unpretentious, with a student population large enough that the city is built around it. Rent, food and transport all cost noticeably less than London, and the north of England and Wales are close for weekends. The trade is scale: fewer employers, fewer direct flights and a smaller professional network than the capital's.",
    money:
      "International tuition is the same order as the rest of the UK: high, and the real cost of the decision. But living costs are among the lowest of any big British city, which changes the total more than students expect. Scholarships exist and are competitive rather than need-based. Work during term is capped by the hours limit on the student visa, so it supplements a budget and can't build one.",
    language:
      "English throughout, which is the country's whole practical advantage, though the local accent is a genuine adjustment for the first weeks even for confident speakers. Academic writing is marked hard, and the standard expected in essays is usually above what students arrive with.",
    whoThrives:
      "Suits you if you want a UK degree and a real student city without London's cost. Look elsewhere if you need the capital's employer density, or if you are counting on a long post-study work window. That rule has already been narrowed, and narrows again for applications from January 2027.",
  },
  {
    id: "dubai",
    city: "Dubai",
    country: "UAE",
    region: "middle_east",
    fields: ["business_economics", "computer_science", "engineering", "medicine_health"],
    what: "A fast-growing corporate and startup market three hours from Central Asia, with branch campuses of Western universities on the ground and the region's densest concentration of private employers.",
    catch: "Income is untaxed but living costs are high, and residence is tied to your employer. Losing the job means losing the visa, on a short clock.",
    route: "Branch campuses admit internationally and teach in English, and the free-zone company structures make it one of the easier places to be employed as a foreigner. Compass models UAE admissions already.",
    dayHere:
      "Life is organised around air conditioning and the car; the summer months are genuinely severe and much of daily life moves indoors. The population is overwhelmingly foreign, so being an expatriate is the norm rather than the exception. The flip side is that communities are transient and friends leave. Central Asia is a short flight away, which matters more than people expect.",
    money:
      "Income is untaxed, which is the headline, and the honest counterweights are that rent and schooling are expensive and usually paid in large advance instalments, and that your legal residence is tied to your employer. Losing the job means losing the right to stay. So the savings that make this attractive should be built deliberately and early.",
    language:
      "Business, universities and most workplaces run in English, and you can live here entirely in it. Arabic is valuable for government-facing work and for genuine integration, but it isn't a barrier to entry the way German or Korean is.",
    whoThrives:
      "Suits you if you want to save quickly, stay near home, and work in a corporate or startup environment in English. Look elsewhere if you want a permanent home with a path to citizenship, a deep research culture, or a fully funded undergraduate place. For that last one the door is Abu Dhabi, not here.",
  },
  {
    id: "abu-dhabi",
    city: "Abu Dhabi",
    country: "UAE",
    region: "middle_east",
    fields: ["engineering", "natural_sciences", "business_economics", "medicine_health"],
    what: "The capital, and the country's research and energy centre: government bodies, sovereign funds and the two universities that admit internationally with real money behind them.",
    catch: "Quieter, more spread out and more conservative than Dubai, with a much smaller private job market: outside the state-linked sector and the universities, the openings are in Dubai and people commute or move.",
    route: "New York University Abu Dhabi admits internationally with need-based aid that can cover the full cost, which makes it one of the most generous undergraduate doors anywhere; Khalifa University funds science and engineering students directly. Compass models UAE admissions already.",
    dayHere:
      "Flatter, calmer and more residential than Dubai, built around wide roads and the car rather than around a skyline. The summer is as severe and the indoor life is the same, but the pace is slower and the population less transient, because so much of it works for institutions rather than for companies that come and go. The island layout means distances are real and a car is close to necessary.",
    money:
      "The same untaxed income and the same employer-tied residence as Dubai, with rents that sit somewhat below it and a shorter list of ways to spend money. The difference that matters for a student is the funding: aid at NYU Abu Dhabi is need-based rather than merit-priced, so the cost of the degree is assessed against what your family can actually pay. That is a fundamentally different proposition from a discount.",
    language:
      "The universities and the professional world run in English. Arabic carries more weight here than in Dubai because so much of the work is government-facing, and it is the difference between a job in the sector and a job adjacent to it.",
    whoThrives:
      "Suits you if you want a funded undergraduate degree in English near home, or research and engineering tied to energy, space and the state sector. Look elsewhere if you want a large private job market, startup density or nightlife. That's Dubai, an hour and a half up the road.",
  },
  {
    id: "istanbul",
    city: "Istanbul",
    country: "Türkiye",
    region: "middle_east",
    fields: ["business_economics", "engineering", "arts_design", "humanities_social"],
    what: "The bridge market between Europe and Asia, with large manufacturing, textile and design industries and a serious film and music scene.",
    catch: "Currency instability makes long-term planning harder, and Turkish is needed for most work.",
    route: "Türkiye Bursları is a full government scholarship: tuition, accommodation, stipend and a language year. Central Asian students are a core audience for it.",
    dayHere:
      "Vast, layered and loud in the best sense: a city of fifteen-plus million spread across two continents, with commutes to match. Food, hospitality and social life are exceptional and cheap by European standards. Earthquake risk is a serious and openly discussed fact of living here, and it is worth understanding what it means for where you live.",
    money:
      "Costs are low against Europe, and that is real. The complication is currency: inflation has repeatedly outrun wages, so a salary that looked adequate can erode within a year, and long-term planning is harder than the headline cost suggests. Scholarship students are insulated from much of this, which is part of why the scholarship route dominates.",
    language:
      "Turkish is needed for most work and for daily life, and Türkiye Bursları includes a full year of language study precisely because of that. Some English-taught programmes exist at the strong universities. For a Central Asian student the Turkic language family makes this a shorter climb than most.",
    whoThrives:
      "Suits you if the Türkiye Bursları scholarship is realistic for you. It's one of the few genuinely complete packages open to students from this region. Look elsewhere if you need currency stability or a Western credential for onward migration.",
  },

  // ── Asia-Pacific ──────────────────────────────────────────────────────────
  {
    id: "ankara",
    city: "Ankara",
    country: "Türkiye",
    region: "middle_east",
    fields: ["engineering", "computer_science", "natural_sciences", "humanities_social"],
    what: "Türkiye's capital and the home of its strongest technical universities, its defence and aerospace industry and its entire public sector.",
    catch: "A government town rather than a commercial one: quieter, more bureaucratic, and with a currency whose instability makes planning genuinely hard.",
    route: "Türkiye Bursları covers tuition, a stipend, accommodation and a language year and is open to students from Central Asia and the Caucasus; the strongest universities also teach in English.",
    dayHere:
      "Planned, dry and high on a plateau, with real winters and a far more sober rhythm than Istanbul's. The big campuses are self-contained towns, so student life happens on them rather than around the city. Transport is straightforward and Istanbul is a short flight or a night bus away when you need noise.",
    money:
      "Living costs are low by European comparison and the state scholarship removes tuition entirely for those it takes, which is what makes this route realistic for a family with no savings. The complication is the currency: prices move quickly, so anything funded from outside the country has to be planned against inflation rather than against an exchange rate you saw last year.",
    language:
      "The best-known technical universities teach in English and run a preparatory year for students who need it, and the state scholarship includes a year of Turkish. Daily life, internships and most employment run in Turkish, a shorter climb from Kazakh or Uzbek than any European language on this map.",
    whoThrives:
      "Suits you if you want a funded, English-taught technical degree close to home in a language family you already half know. Look elsewhere if you want a large private job market, which Istanbul has and Ankara doesn't, or a stable currency to plan against.",
  },
  {
    id: "seoul",
    city: "Seoul",
    country: "South Korea",
    region: "asia_pacific",
    fields: ["engineering", "computer_science", "arts_design", "business_economics"],
    what: "Electronics, automotive and battery R&D at Samsung/SK/Hyundai scale, plus games and entertainment industries that export worldwide.",
    catch: "Korean is expected for most roles, and working hours are long by European standards.",
    route: "The Global Korea Scholarship covers tuition, a stipend and a full year of language study. It is one of the few complete rides open to students from the CIS. Compass models Korean admissions.",
    dayHere:
      "Dense, fast, and extraordinarily well served: transport, delivery and internet all work at a standard that recalibrates expectations. It's very safe and open late. The social side is more demanding. Work and university culture are hierarchical, age determines how you address people, and after-hours socialising with colleagues is closer to obligatory than optional.",
    money:
      "Living costs are moderate for a major Asian capital, with housing deposits the awkward part: the traditional rental system asks for large lump sums up front, and student housing is the usual way around it. The Global Korea Scholarship removes tuition and adds a stipend, which for students from this region is what makes the country accessible at all.",
    language:
      "Korean is expected for most employment, and the scholarship's full language year exists because of that. English-taught degree programmes are available at the larger universities, but treating English as sufficient for the career afterwards is the mistake people make here.",
    whoThrives:
      "Suits you if you want engineering or technology at industrial scale and will genuinely commit to learning Korean. Look elsewhere if long hours and steep workplace hierarchy would wear you down. That is a documented and widely discussed part of the culture, not a rumour.",
  },
  {
    id: "daejeon",
    city: "Daejeon",
    country: "South Korea",
    region: "asia_pacific",
    fields: ["engineering", "computer_science", "natural_sciences"],
    what: "Korea's research city: KAIST and the Daedeok cluster of government institutes and corporate laboratories in one place, an hour from Seoul.",
    catch: "Small, quiet and built around laboratories rather than city life. Korean is needed for almost everything outside the campus.",
    route: "The research universities and institutes admit international graduate students with funding attached, and the GKS government scholarship covers a language year, tuition and a monthly allowance.",
    dayHere:
      "A planned city that is calm and cheap by Korean standards and organised around research campuses; the fast train puts Seoul within an hour, which is how most people spend their weekends. Laboratory culture is intense and the hours are long. That is the norm here rather than a warning about one place. Outside the campuses the city is ordinary and the international community is small.",
    money:
      "Costs sit well below Seoul's, and the routes in are usually funded rather than paid for: graduate places at the research institutes normally carry a stipend, and the government scholarship covers tuition, accommodation support and a monthly allowance. Undergraduate study without a scholarship is a different and far more expensive proposition, and worth checking before assuming Korea is cheap.",
    language:
      "Research groups publish and often work in English, and the government scholarship includes a year of Korean before the degree starts. Everything outside the laboratory runs in Korean: housing, healthcare, part-time work, the social side. Staying on to work here makes it non-negotiable.",
    whoThrives:
      "Suits you if you want funded research in engineering or the sciences and are content for your life to be the laboratory for a few years. Look elsewhere if you want a city, a broad job market or a career outside research. Seoul is the honest answer to all three.",
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
      "Orderly, quiet in public, and impeccably run: trains to the second, and a level of everyday reliability that is hard to describe until you live in it. Apartments are small and commutes are long and crowded. It's a place where the rules are largely unwritten, and foreigners often find that politeness and distance aren't the same thing as inclusion.",
    money:
      "Tokyo is expensive but less so than commonly assumed, and the MEXT scholarship covers tuition with a monthly stipend. Housing is small rather than costly, and health insurance is affordable and mandatory. Renting privately as a foreigner can require a guarantor, which is an administrative hurdle worth knowing about before arrival.",
    language:
      "Japanese is required for most employment, and functional Japanese is the difference between visiting and living. English-taught degrees are growing at the larger universities, and research groups often operate in English. The job market largely doesn't.",
    whoThrives:
      "Suits you if you want precision engineering, materials or animation at world level and will learn Japanese. Look elsewhere if you need to change employers freely. The hiring system is unusually rigid about when and how you apply, especially for graduates.",
  },
  {
    id: "osaka",
    city: "Osaka",
    country: "Japan",
    region: "asia_pacific",
    fields: ["engineering", "natural_sciences", "computer_science", "business_economics"],
    what: "Japan's industrial second city: heavy engineering, electronics, materials and pharmaceuticals, with the manufacturers that actually hire for them headquartered in the region.",
    catch: "Less international than Tokyo, so Japanese is needed sooner, and the graduate hiring calendar is rigid in a way that catches foreigners out.",
    route: "MEXT government scholarships cover tuition, travel and a monthly allowance for research and undergraduate students alike, and national universities charge internationals the same fees as Japanese students.",
    dayHere:
      "The informal, food-obsessed counterweight to Tokyo: louder, blunter and easier to talk to strangers in. People who have lived in both consistently say that is the real difference. Rents are meaningfully below Tokyo's, the transport is superb and no car is needed. Being visibly foreign registers more here than in the capital, in both the warm and the awkward senses.",
    money:
      "National university fees are set nationally and are identical for international students, which makes Japan much cheaper to study in than its reputation suggests; the government scholarship removes them entirely and adds a monthly allowance. Living costs are dominated by rent and by the deposits and guarantor requirements that make moving in expensive at the start rather than each month.",
    language:
      "Research groups will use English on paper and Japanese in the room, and the hiring system expects business-level Japanese from anyone joining a Japanese company. English-track degrees are growing, but treat them as a way in rather than as a way to avoid learning the language.",
    whoThrives:
      "Suits you if you want engineering or applied science next to the companies that manufacture it, and will commit to the language. Look elsewhere if you want an English-speaking career or the density of international employers. That is Tokyo, and even there it is smaller than people expect.",
  },
  {
    id: "kyoto",
    city: "Kyoto",
    country: "Japan",
    region: "asia_pacific",
    fields: ["natural_sciences", "engineering", "humanities_social", "arts_design"],
    what: "A research city rather than an industrial one: one of Asia's strongest universities, a basic-science culture that has produced a long line of Nobel laureates, and the country's traditional crafts and design still practised commercially.",
    catch: "Small, conservative and short on employers: this is a place to do research and then leave for work, and the tourism load on the centre has made housing and daily movement noticeably harder than it was.",
    route: "The same MEXT scholarships and the same national fee schedule as the rest of Japan, and Kyoto University runs English-taught graduate programmes that don't require Japanese to enter. The laboratory around you will still be working in it, though.",
    dayHere:
      "Low-rise, walkable and cyclable, hemmed in by mountains on three sides, with the temples and the river doing more for daily life than any listing suggests. It's stricter than Osaka about how things are done and slower to accept outsiders, and the tourist crowds in the central districts are a genuine daily irritation rather than a postcard. Winters are colder and summers more humid than the coast.",
    money:
      "Identical national fees to everywhere else in the Japanese system, and living costs below Tokyo but above what the city's size suggests, because tourism has pushed rents in the centre. The guarantor and deposit requirements are the same start-up cost as elsewhere in Japan, and student housing is the usual way around them.",
    language:
      "Graduate research can be entered in English and increasingly conducted in it, but the seminar, the corridor and the administration are Japanese. For the crafts and design side the language isn't optional at all. Those are apprenticeship cultures, and they run entirely in Japanese.",
    whoThrives:
      "Suits you if you want basic research, an academic path, or one of the traditional design disciplines, and you want a small city you can cross on a bicycle. Look elsewhere if you want to work in industry after graduating. The jobs are in Osaka half an hour away, or in Tokyo.",
  },
  {
    id: "singapore",
    city: "Singapore",
    country: "Singapore",
    region: "asia_pacific",
    fields: ["business_economics", "computer_science", "medicine_health", "natural_sciences"],
    what: "Asia's finance hub and a deliberately built biotech and research cluster, and it all runs in English.",
    catch: "Expensive, and scholarships often carry a bond: several years working locally after you graduate.",
    route: "NUS and NTU offer scholarships to international students; read the bond terms before signing anything.",
    dayHere:
      "Small, hot and humid year-round, extremely safe, and organised to a degree that makes daily logistics effortless. Everything is close, public transport is excellent, and the rest of Southeast Asia is a short flight away. The trade is that it can feel constrained. It is a city-state, and people describe running out of new places after a couple of years.",
    money:
      "Expensive, with housing the dominant cost, and private car ownership effectively priced out of reach by design. Salaries are high and taxes are low, so saving is realistic. The scholarship terms are the thing to read carefully: several carry a bond obliging you to work locally for a number of years afterwards, which is a genuine commitment rather than a formality.",
    language:
      "English is an official working language and everything runs in it: university, employment, government. This makes it the lowest-friction move on the map for someone with strong English, with no language year required.",
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
      "Vertical, fast and startlingly efficient. The transport system is among the best anywhere, and you are never far from either a skyscraper or a hiking trail. Apartments are genuinely small, smaller than newcomers picture. Humid subtropical summers with typhoon season, and a city that mixes Cantonese daily life with international business at close quarters.",
    money:
      "Among the most expensive housing markets in the world, and that single line dominates the budget; university accommodation, where you can get it, is the difference between viable and not. Tuition for internationals is moderate compared with the US or UK, and the universities run real scholarship schemes. Those two facts are what make it work financially.",
    language:
      "Universities teach in English and business runs in English, so study and professional life are accessible without Chinese. Cantonese is the language of daily life; Mandarin is increasingly useful. You can function in English and will feel the limit of it socially.",
    whoThrives:
      "Suits you if you want a top-ranked English-taught degree inside Asia with scholarship support, aiming at finance, law or technology. Look elsewhere if you need space and low costs, or if you want long-term political predictability. The landscape of which employers base themselves here has changed.",
  },
  {
    id: "shenzhen",
    city: "Shenzhen",
    country: "China",
    region: "asia_pacific",
    fields: ["engineering", "computer_science", "business_economics"],
    what: "The hardware capital of the world. A prototype that takes months elsewhere takes days here, because every supplier, component market and small factory you need sits in the same city.",
    catch: "Mandarin, and a different software and internet environment than you are used to building on.",
    route: "The Chinese Government Scholarship (CSC) covers tuition and a stipend, and many programmes are taught in English.",
    dayHere:
      "Daily life runs almost entirely through domestic apps: payments, transport, food, messaging. Setting those up with a foreign phone number and bank account is the first real task on arrival. Once working, the convenience is remarkable. The city is young by any standard, built in living memory and organised around making things: fast, informal, and far less historic than the rest of the country. Expect a different software environment than you are used to building on.",
    money:
      "Living costs are moderate and the CSC scholarship covers tuition plus a stipend, which makes this one of the more financially accessible serious options. Hardware prototyping here is cheaper and faster than anywhere on earth. For an engineer that is the real economic argument for being here rather than the salary.",
    language:
      "Mandarin is the language of work and life, and scholarship programmes typically include language study. English-taught degrees exist and are growing, but the industrial ecosystem operates in Chinese: the suppliers, the factories, the markets. That is the part you came for.",
    whoThrives:
      "Suits you if you are a hardware or manufacturing engineer who wants to be inside the world's supply chain, and will learn Mandarin. Look elsewhere if you need an internet environment continuous with the one you already build on, or a credential aimed primarily at Western employers.",
  },
  {
    id: "beijing",
    city: "Beijing",
    country: "China",
    region: "asia_pacific",
    fields: ["engineering", "computer_science", "natural_sciences", "humanities_social", "business_economics"],
    what: "China's political, academic and research capital: its two strongest universities, the state research institutes, and the head offices that deal with them.",
    catch: "The most regulated environment on this map: internet restrictions, permit renewals and political sensitivity are daily facts rather than footnotes.",
    route: "The Chinese Government Scholarship and university scholarships cover tuition, campus accommodation and a stipend, and applicants from Central Asia are a priority group.",
    dayHere:
      "Enormous, flat and organised in rings, with an excellent metro and distances that still eat an hour of your day. Winters are cold and dry, air quality has improved but still has bad weeks, and the student districts are intense. Payments, transport, food and social life all run through apps that need a local phone number and bank account. Set that up in the first week, or the city stays closed.",
    money:
      "Scholarships are the normal route rather than the exception, and a full one covers tuition, campus accommodation and a monthly stipend a careful student can live on. Unfunded tuition is moderate by Western standards. The real cost is administrative: residence permits, health checks and annual renewals all take time, documents and patience.",
    language:
      "Degrees taught in English exist across engineering and business, and scholarships often include a preparatory year of Chinese. Daily life, internships and any local employment run in Mandarin, and the language is the point of coming for many students. A degree here without it converts poorly into anything afterwards.",
    whoThrives:
      "Suits you if you want a funded degree inside a major research system and see China as a direction rather than a detour. Look elsewhere if your work needs an open internet, or if you can't commit to Mandarin.",
  },
  {
    id: "shanghai",
    city: "Shanghai",
    country: "China",
    region: "asia_pacific",
    fields: ["business_economics", "computer_science", "engineering", "arts_design"],
    what: "China's financial and commercial centre, with the country's most international universities and the largest concentration of foreign companies in it.",
    catch: "The most expensive city in the country, and the gap between the international bubble and the city outside it is wide.",
    route: "Strong scholarship coverage at the major universities, several joint programmes run with Western institutions, and a campus-to-internship path into multinational offices.",
    dayHere:
      "Dense, fast and the easiest Chinese city to arrive in without the language, with a long history of foreigners and the infrastructure that comes with it. The metro is vast, food is the daily pleasure and the summers are humid and heavy. Rents are the highest in the country and shared flats stay normal well into your twenties.",
    money:
      "Tuition is moderate and scholarships are widely available at the main universities, so the cost of the decision is living in the city rather than studying in it. Rent takes the largest share and rises the closer you sit to the centre; internships in multinational offices pay enough to matter. Budget for the deposit and agency fees on arrival, which are heavier than the monthly rent implies.",
    language:
      "The most navigable Chinese city in English: degrees, offices and services all accommodate it. But Mandarin still decides how far you get with an employer, a landlord or a lease. The joint programmes with foreign universities teach in English throughout, which is why they are the usual first step.",
    whoThrives:
      "Suits you if you want business, finance or technology in Asia's largest market and the softest landing into China. Look elsewhere if cost matters more than exposure, or if your work needs an open internet and a Western regulatory environment.",
  },

  // ── North America ─────────────────────────────────────────────────────────
  {
    id: "boston",
    city: "Boston",
    country: "United States",
    region: "north_america",
    fields: ["medicine_health", "natural_sciences", "computer_science", "engineering"],
    what: "The densest concentration of universities, teaching hospitals and biotech companies on earth. If you want research, this is the deep end.",
    catch: "US tuition is the highest in the world, and the work visa after graduation is decided partly by lottery.",
    route: "A handful of universities meet the full demonstrated need of international students, which can make them cheaper than a mid-tier public university. Research programmes and science fairs are the early proving ground.",
    dayHere:
      "Compact and walkable by American standards, with a real winter and an unusual student density. A large share of the population is here to study, which shapes the culture and the calendar. Public transport exists and is adequate rather than excellent. Academic and hospital institutions dominate the city's identity and its employment.",
    money:
      "The published price isn't the price, and understanding that is the single most valuable thing on this page: a small number of universities meet the full demonstrated financial need of international students, which can make them cheaper than a mid-tier public university elsewhere. Rent is high. Health insurance is a mandatory and substantial annual cost that European students routinely forget to budget for.",
    language:
      "English throughout, with no language requirement beyond the entrance tests. What is required instead is the ability to write and argue in an academic register, which is a specific skill the admissions essays are testing.",
    whoThrives:
      "Suits you if you are aiming at research, medicine or biotech and your family income is low enough that need-based aid genuinely applies. Look elsewhere if you need certainty about staying afterwards. The work visa is decided partly by lottery.",
  },
  {
    id: "bay-area",
    city: "San Francisco Bay Area",
    country: "United States",
    region: "north_america",
    fields: ["computer_science", "business_economics", "engineering"],
    what: "The centre of the software industry and of startup funding. The concentration of people who have built things at scale is the actual product here.",
    catch: "Costs are extreme, and the H-1B work visa is a lottery you can lose repeatedly.",
    route: "For most people from outside, the path is a US degree first, or contributing remotely to open source and startups until someone sponsors you.",
    dayHere:
      "Sprawling and car-dependent outside San Francisco itself, with a mild climate and a professional culture that talks about work more than anywhere else on this list. The concentration of people who have built things at scale is the actual product, and it shows in how easily conversations turn into introductions. Visible inequality on the streets is stark and startling to newcomers.",
    money:
      "Salaries are the highest in the world for software work and the cost of housing consumes an extraordinary share of them; people routinely share accommodation years into their careers. The honest arithmetic is that saving here is possible but far less automatic than the headline numbers suggest. Equity, not salary, is what has historically made the difference.",
    language:
      "English only, and specifically a fluent, confident, informal register: much of how opportunity moves here is through conversation and referral rather than formal application, which puts a premium on being comfortable talking to strangers.",
    whoThrives:
      "Suits you if you want to be at the centre of the software industry and can tolerate expense and visa uncertainty for it. Look elsewhere if you need a predictable immigration ladder. Canada offers one; this doesn't.",
  },
  {
    id: "new-york",
    city: "New York",
    country: "United States",
    region: "north_america",
    fields: ["business_economics", "arts_design", "law", "humanities_social"],
    what: "Finance, media, publishing and the art market in one place. The density is the reason people put up with the price.",
    catch: "Same as Boston: cost and visa uncertainty, plus rent that eats junior salaries.",
    route: "Need-based aid at the universities that offer it to internationals; portfolio and writing competitions are how you start being seen from far away.",
    dayHere:
      "The one American city that works without a car, which changes everything about daily life: the subway runs constantly, you walk a great deal, and neighbourhoods are distinct enough to feel like separate towns. It's loud, fast and culturally saturated. The density of galleries, theatres, publishers and newsrooms is the reason people accept the price.",
    money:
      "Rent is the defining problem and it eats junior salaries in finance, media and the arts alike; sharing an apartment well into your twenties is normal rather than a failure. Everything social costs money, which is easy to underestimate when the social life is the reason you came. Need-based aid at the universities that offer it is what makes studying here possible at all.",
    language:
      "English, and in the creative and media industries a specific fluency in writing and pitching. This is a city where being able to explain your work compellingly in two minutes has direct economic value.",
    whoThrives:
      "Suits you if you are aiming at finance, law, media, publishing or the art market and want to be where those industries actually are. Look elsewhere if you are cost-sensitive or want a quiet, spacious life. This is the opposite of both.",
  },
  {
    id: "seattle",
    city: "Seattle",
    country: "United States",
    region: "north_america",
    fields: ["computer_science", "engineering", "business_economics"],
    what: "The densest concentration of large software employers outside the Bay Area, with cloud computing and its whole supply chain built around two of them.",
    catch: "A one-industry city: outside software and the roles next to it the market thins fast, and the work visa is still a lottery.",
    route: "The state university is strong and much cheaper than the private route, and internships at the large employers are the normal path into a first job.",
    dayHere:
      "Green, wet and dark for a long stretch of winter, wrapped in mountains and water that make the summers exceptional. It's socially quieter than the East Coast and the reputation for being hard to make friends in is earned. The city is still built for cars despite improving transit, and rents are high without being San Francisco's.",
    money:
      "Software salaries are among the highest anywhere and the state takes no income tax, which raises what you keep. But that calculation only begins after a work visa, which is drawn by chance rather than earned in a queue. As a student you are paying American tuition, and the state university's international rate sits far below the private one; that difference is usually the whole decision.",
    language:
      "English, and the load is in explaining your reasoning under pressure in technical interviews rather than in vocabulary. Written communication is weighted unusually heavily inside the big employers here. Decisions are argued in documents, and promotion cases are literally written ones.",
    whoThrives:
      "Suits you if software is the plan and you want the shortest distance between a degree and the companies that hire for it. Look elsewhere if you want breadth of industries or a predictable immigration path. Toronto and Berlin both beat it on the second.",
  },
  {
    id: "toronto",
    city: "Toronto",
    country: "Canada",
    region: "north_america",
    fields: ["computer_science", "business_economics", "medicine_health", "engineering"],
    what: "Canada's largest job market by a distance: banking and insurance, a substantial technology sector, and the hospital and research network that comes with the country's biggest city.",
    catch: "International tuition is substantial, housing has become genuinely difficult, and the winters aren't a joke.",
    route: "The most predictable immigration ladder in North America: study permit, then a post-graduation work permit, then permanent residence, a route the US doesn't offer.",
    dayHere:
      "Genuinely multicultural in a way that makes being foreign unremarkable. A large share of the population was born elsewhere, and the city is organised around that fact. It's big, flat and transit-served, though the transit is stretched and commutes are long. The winter is long and cold, and that is worth taking seriously rather than laughing off.",
    money:
      "International tuition is substantial and housing here is the single hardest cost in this guide's North American entries, which together make Toronto less of a bargain than its reputation suggests. Work during study is permitted, and the thing actually worth planning around is that the immigration route rewards Canadian work experience, so a job that counts matters more than a job that pays slightly better.",
    language:
      "English, with French an asset nationally and a requirement in parts of the public sector. No language barrier to study or work, which combined with the immigration ladder is much of the appeal.",
    whoThrives:
      "Suits you if a predictable path from study permit to permanent residence matters more than prestige or salary, and you want the deepest job market in the country. Look elsewhere if you can't fund substantial international tuition, or if software specifically is the plan and you would rather have paid work terms built into the degree. That's Waterloo, an hour and a half west.",
  },
  {
    id: "waterloo",
    city: "Waterloo",
    country: "Canada",
    region: "north_america",
    fields: ["computer_science", "engineering", "business_economics"],
    what: "A university town organised around one idea: co-op, where paid work terms alternate with study terms, so a software or engineering degree here ends with about two years of real employment already on the record.",
    catch: "It's a small town, not a city. If you want urban life you commute, or you leave. The co-op cycle is also relentless: you are applying and interviewing for the next placement while doing the current term.",
    route: "The same Canadian ladder as Toronto: study permit, post-graduation work permit, permanent residence. But with the work experience the ladder rewards built into the degree instead of chased after it.",
    dayHere:
      "Small, quiet and campus-shaped: most of what happens socially happens through the university and through the companies that recruit out of it, which makes it unusually easy to arrive into and unusually narrow if you want anything else. The winter is the same long Ontario winter as Toronto's, with less to do indoors. Toronto is reachable for a day but not for an evening.",
    money:
      "International tuition is substantial in the same way as the rest of Ontario, and the structural counterweight is real: co-op terms are paid employment, so a meaningful share of the cost is earned back during the degree rather than borrowed against it. Housing is cheaper than Toronto's, though the student market tightens hard around the start of each work-term cycle.",
    language:
      "English throughout. The co-op interview process is the thing to prepare for rather than any language test. It starts early, runs on a fixed cycle, and rewards people who can talk about theirown projects clearly.",
    whoThrives:
      "Suits you if software or engineering is the plan and you want the shortest distance between a degree and the companies that hire for it, with Canadian work experience accumulating from year one. Look elsewhere if you want a city, a broad choice of industries, or a research-first undergraduate experience.",
  },
  {
    id: "vancouver",
    city: "Vancouver",
    country: "Canada",
    region: "north_america",
    fields: ["computer_science", "engineering", "natural_sciences", "arts_design"],
    what: "Canada's Pacific technology and film centre, close enough to Seattle that American companies staff engineering offices here when they can't get visas.",
    catch: "Housing costs the most relative to local wages of anywhere in North America, and the job market is smaller than Toronto's.",
    route: "A study permit allows work during term, and the post-graduation work permit gives you time to convert a degree into experience. It is the clearest study-to-residence ladder in this guide.",
    dayHere:
      "Mild, rainy and green, with mountains and ocean inside the city limits and outdoor life built into the week. It's the most physically beautiful place on this map and the hardest to afford, and both facts shape every decision people make here. Transit is good, the city is small enough to cross, and the long-established Asian communities make arriving from abroad easier than most places.",
    money:
      "International tuition is real but sits below American private rates, and the honest problem is housing: rent takes an outsized share of any student budget here and is the most common reason students end up commuting from far out. Work during study is permitted and worth planning for, and the post-graduation permit is what turns the cost into an investment rather than an expense.",
    language:
      "English throughout, with French useful for federal jobs and largely irrelevant on this coast. Language test scores are counted formally in the immigration points system, so a strong result is worth real money later. Treat it as part of the plan rather than an afterthought.",
    whoThrives:
      "Suits you if the goal is a technology or engineering career in North America with a defined route to staying, and you can absorb the housing cost. Look elsewhere if your budget is tight, since Montreal costs a fraction, or if you want the deepest job market, which is Toronto's.",
  },
  {
    id: "montreal",
    city: "Montreal",
    country: "Canada",
    region: "north_america",
    fields: ["computer_science", "engineering", "arts_design", "humanities_social"],
    what: "The cheapest big city in North America for a student, with two strong English-language universities, a serious artificial-intelligence research community, and a games and animation industry.",
    catch: "French is a real requirement for staying, and Quebec runs its own immigration selection and its own tuition schedule, separate from the rest of Canada.",
    route: "Tuition at the English-language universities sits below the Canadian average for internationals, and Quebec's own selection programme is a separate route to residence from the federal one.",
    dayHere:
      "Bilingual, cheap by North American standards and genuinely enjoyable. The festival calendar and the food carry the year. Winters are long and hard in a way that has to be planned for rather than endured. The city is walkable and well served by its metro, apartments are large for the money, and student life is spread through neighbourhoods instead of gathered onto a campus.",
    money:
      "The lowest total cost of any North American option here: tuition at the English-language universities is below the national average for international students and rents are far under Toronto's or Vancouver's. Work during study is permitted, and the province runs its own scholarships and its own selection programme, which together add routes that don't exist elsewhere in Canada.",
    language:
      "You can study and socialise in English and the two big universities are fully English-speaking, but Quebec's immigration route asks for French and employers outside the research and technology bubble expect it. Treat French as the price of staying rather than the price of arriving.",
    whoThrives:
      "Suits you if you want North America at the lowest cost and will learn French to stay. Look elsewhere if you need an English-only path to permanent residence, or the largest corporate job market. That's Toronto.",
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
