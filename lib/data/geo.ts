// Geography helpers for LOCAL opportunities.
//
// The intake's country field is free text ("Kazakhstan", "Казахстан", "KZ"…),
// so matching a student to country-scoped opportunities needs a normalizer.
// Opportunities themselves store `region` as an ISO-2 code ("KZ") — set by the
// discovery pipeline / admin, never parsed from free text.
//
// The alias table covers our actual audience (Central Asia + CIS + common
// spellings, EN and RU). An unknown country simply normalizes to null and the
// student sees only global opportunities — never someone else's local ones.
//
// An audit of real profiles showed exact-match alone was losing students: they
// write "Shymkent/Kazakhstan", "Almaty, KZ", a bare city ("taraz"), or a
// plausible misspelling ("Kazahstan"). Each of those silently dropped the
// student's LOCAL opportunities. So matching now runs in three passes —
// exact → place tokens (country names and major cities) → spelling-tolerant
// patterns — each one narrower than a blunt substring search, which would read
// "Georgia" out of any word containing "ge".

export type CountryCode = string; // ISO-2, upper case, e.g. "KZ"

const COUNTRY_ALIASES: Record<string, CountryCode> = {
  // Kazakhstan
  kz: "KZ", kazakhstan: "KZ", "казахстан": "KZ", qazaqstan: "KZ", "қазақстан": "KZ",
  // Uzbekistan
  uz: "UZ", uzbekistan: "UZ", "узбекистан": "UZ", "oʻzbekiston": "UZ", ozbekiston: "UZ",
  // Kyrgyzstan
  kg: "KG", kyrgyzstan: "KG", "кыргызстан": "KG", "киргизия": "KG",
  // Tajikistan
  tj: "TJ", tajikistan: "TJ", "таджикистан": "TJ",
  // Turkmenistan
  tm: "TM", turkmenistan: "TM", "туркменистан": "TM",
  // Russia
  ru: "RU", russia: "RU", "россия": "RU", "russian federation": "RU",
  // Azerbaijan / Armenia / Georgia / Belarus / Ukraine / Moldova
  az: "AZ", azerbaijan: "AZ", "азербайджан": "AZ",
  am: "AM", armenia: "AM", "армения": "AM",
  ge: "GE", georgia: "GE", "грузия": "GE",
  by: "BY", belarus: "BY", "беларусь": "BY", "белоруссия": "BY",
  ua: "UA", ukraine: "UA", "украина": "UA",
  md: "MD", moldova: "MD", "молдова": "MD",
  // Occasional others in the base
  tr: "TR", turkey: "TR", "türkiye": "TR", turkiye: "TR", "турция": "TR",
  mn: "MN", mongolia: "MN", "монголия": "MN",
};

// Cities students actually type instead of (or alongside) their country. Only
// needed for the countries we run local opportunities in — a city we don't know
// simply contributes nothing.
const CITY_HINTS: Record<string, CountryCode> = {
  // Kazakhstan
  almaty: "KZ", "alma ata": "KZ", "алматы": "KZ", "алма ата": "KZ",
  astana: "KZ", "астана": "KZ", nursultan: "KZ", "nur sultan": "KZ",
  shymkent: "KZ", "шымкент": "KZ", chimkent: "KZ",
  karaganda: "KZ", karagandy: "KZ", "караганда": "KZ",
  aktobe: "KZ", "актобе": "KZ", taraz: "KZ", "тараз": "KZ",
  pavlodar: "KZ", "павлодар": "KZ", semey: "KZ", "семей": "KZ",
  oskemen: "KZ", "ust kamenogorsk": "KZ", "усть каменогорск": "KZ",
  atyrau: "KZ", "атырау": "KZ", aktau: "KZ", "актау": "KZ",
  kostanay: "KZ", "костанай": "KZ", kyzylorda: "KZ", "кызылорда": "KZ",
  // (Uralsk only — its Kazakh name "Oral" is too common an English word to
  // treat as a place name in a free-text field.)
  uralsk: "KZ", "уральск": "KZ",
  petropavlovsk: "KZ", "петропавловск": "KZ",
  temirtau: "KZ", "темиртау": "KZ", turkistan: "KZ", "туркестан": "KZ",
  kokshetau: "KZ", "кокшетау": "KZ", taldykorgan: "KZ", "талдыкорган": "KZ",
  ekibastuz: "KZ", "экибастуз": "KZ",
  // Uzbekistan
  tashkent: "UZ", "ташкент": "UZ", samarkand: "UZ", "самарканд": "UZ",
  bukhara: "UZ", "бухара": "UZ", namangan: "UZ", "наманган": "UZ",
  andijan: "UZ", "андижан": "UZ", fergana: "UZ", "фергана": "UZ",
  nukus: "UZ", "нукус": "UZ", urgench: "UZ", "ургенч": "UZ",
  // Kyrgyzstan
  bishkek: "KG", "бишкек": "KG", osh: "KG", "ош": "KG",
  "jalal abad": "KG", karakol: "KG", "каракол": "KG",
  // Tajikistan / Turkmenistan
  dushanbe: "TJ", "душанбе": "TJ", khujand: "TJ", "худжанд": "TJ",
  ashgabat: "TM", "ашхабад": "TM",
  // Russia and the rest of the CIS
  moscow: "RU", "москва": "RU", "saint petersburg": "RU", "st petersburg": "RU",
  "санкт петербург": "RU", petersburg: "RU", novosibirsk: "RU", "новосибирск": "RU",
  yekaterinburg: "RU", "екатеринбург": "RU", kazan: "RU", "казань": "RU",
  baku: "AZ", "баку": "AZ", yerevan: "AM", "ереван": "AM",
  tbilisi: "GE", "тбилиси": "GE", minsk: "BY", "минск": "BY",
  kyiv: "UA", kiev: "UA", "киев": "UA", chisinau: "MD", "кишинев": "MD",
  istanbul: "TR", "стамбул": "TR", ankara: "TR", "анкара": "TR",
  ulaanbaatar: "MN", "улан батор": "MN",
};

// Spelling-tolerant patterns, matched against a WHOLE token — never as a
// substring. Ordered: "-stan" countries first, so "turkmenistan" can't be read
// as Turkey. Each pattern is deliberately narrow enough that only a country
// name (or a near-miss of one) can satisfy it.
const COUNTRY_PATTERNS: { code: CountryCode; re: RegExp }[] = [
  { code: "KZ", re: /^(?:kaz|qaz)[a-z]*(?:stan|stn|tan)$|^каз[а-я]*стан$|^қазақстан$/ },
  { code: "UZ", re: /^(?:uzb|ozb|oʻzb)[a-z]*stan$|^узб[а-я]*стан$/ },
  { code: "KG", re: /^k[iy]rg?[a-z]*stan$|^к[иы]рг[а-я]*(?:стан|зия)$/ },
  { code: "TJ", re: /^ta[dj]?[jz]?ik[a-z]*stan$|^тадж[а-я]*стан$/ },
  { code: "TM", re: /^turkmen[a-z]*stan$|^туркмен[а-я]*стан$/ },
  { code: "BY", re: /^bel[a-z]*rus[a-z]*$|^бел[а-я]*рус[а-я]*$/ },
  { code: "RU", re: /^russ?[a-z]*$|^росси[а-я]*$/ },
  { code: "UA", re: /^ukrai?n[a-z]*$|^укра[а-я]*$/ },
  { code: "AZ", re: /^azerba[a-z]*$|^азерб[а-я]*$/ },
  { code: "AM", re: /^armen[a-z]*$|^армен[а-я]*$/ },
  { code: "GE", re: /^georg[a-z]*$|^груз[а-я]*$/ },
  { code: "MD", re: /^moldov[a-z]*$|^молдов[а-я]*$/ },
  { code: "TR", re: /^t[uü]rk[ei]?y[ea]?$|^турц[а-я]*$/ },
  { code: "MN", re: /^mongol[a-z]*$|^монгол[а-я]*$/ },
];

type PlaceHit = { code: CountryCode; kind: "country" | "city" };

function lookupPlace(key: string): PlaceHit | null {
  const country = COUNTRY_ALIASES[key];
  if (country) return { code: country, kind: "country" };
  const city = CITY_HINTS[key];
  if (city) return { code: city, kind: "city" };
  return null;
}

/** Free-text country/citizenship → ISO-2 code, or null when unrecognized. */
export function normalizeCountry(raw: string | null | undefined): CountryCode | null {
  if (!raw) return null;
  const cleaned = raw.trim().toLowerCase().replace(/\s+/g, " ");
  if (!cleaned) return null;

  // Pass 1 — the whole string is a name we know ("Kazakhstan", "russian federation").
  if (COUNTRY_ALIASES[cleaned]) return COUNTRY_ALIASES[cleaned];
  // A bare valid-looking ISO-2 the table doesn't know ("US", "DE") is accepted
  // as-is — region matching is exact-code, so this stays safe.
  if (/^[a-z]{2}$/.test(cleaned)) return cleaned.toUpperCase();

  // Pass 2 — read the string as a list of places. Split on anything that isn't
  // a letter or digit, so "Shymkent/Kazakhstan", "Almaty, KZ" and
  // "Astana - Kazakhstan" all tokenize the same way. Multi-word names are
  // matched greedily (up to three tokens) so "saint petersburg" beats
  // "petersburg".
  const tokens = cleaned.split(/[^\p{L}\p{N}]+/u).filter(Boolean);
  let country: CountryCode | null = null;
  let city: CountryCode | null = null;
  for (let i = 0; i < tokens.length; i++) {
    for (let n = Math.min(3, tokens.length - i); n >= 1; n--) {
      const hit = lookupPlace(tokens.slice(i, i + n).join(" "));
      if (!hit) continue;
      // Last one wins: people write "city, country", so when two country names
      // appear the trailing one is the country they mean.
      if (hit.kind === "country") country = hit.code;
      else city = hit.code;
      break; // longest match at this position
    }
  }
  if (country) return country;

  // Pass 3 — a misspelling of a country name ("Kazahstan", "Kirgizstan").
  for (const token of tokens) {
    const match = COUNTRY_PATTERNS.find(({ re }) => re.test(token));
    if (match) country = match.code;
  }
  if (country) return country;

  // Pass 4 — nothing but a city. Weakest signal, so it only decides when no
  // country name appeared anywhere in the string.
  return city;
}

// ── Local-discovery targets ──────────────────────────────────────────────────
// Metadata the discovery engine needs to search a country well: the English
// name, the language to search in, and the major cities worth city-level
// queries. Only countries listed here get local discovery runs; the student
// base decides which of them actually run (see /api/cron/discover).

export type LocalTarget = {
  code: CountryCode;
  name: string;
  searchLanguages: string; // human hint for the search prompt
  cities: string[];
};

export const LOCAL_TARGETS: Record<CountryCode, LocalTarget> = {
  KZ: {
    code: "KZ",
    name: "Kazakhstan",
    searchLanguages: "Russian and Kazakh (also check English)",
    cities: ["Almaty", "Astana", "Shymkent", "Karaganda"],
  },
  UZ: {
    code: "UZ",
    name: "Uzbekistan",
    searchLanguages: "Uzbek and Russian (also check English)",
    cities: ["Tashkent", "Samarkand"],
  },
  KG: {
    code: "KG",
    name: "Kyrgyzstan",
    searchLanguages: "Russian and Kyrgyz (also check English)",
    cities: ["Bishkek", "Osh"],
  },
  RU: {
    code: "RU",
    name: "Russia",
    searchLanguages: "Russian",
    cities: ["Moscow", "Saint Petersburg"],
  },
};

/**
 * Names for the countries `normalizeCountry` can produce but `LOCAL_TARGETS`
 * does not cover.
 *
 * Separate from `LOCAL_TARGETS` on purpose: that table is the DISCOVERY target
 * list — `lib/discovery/run.ts` iterates it to decide where to search — so
 * adding a country there to fix a label would start a weekly search run in a
 * place nobody asked about. This map is display only.
 *
 * It exists because a partner's country goes through `normalizeCountry`, whose
 * alias table resolves ten codes with no name here, and `regionLabel` fell
 * through to the raw code. An Azerbaijani partner posting a local opportunity
 * rendered "Local · AZ" — on the card, in the panel, and now on the public
 * detail page and its share card. A chip printing a two-letter code is a chip
 * showing a reader our database.
 */
const COUNTRY_NAMES: Record<CountryCode, string> = {
  TJ: "Tajikistan",
  TM: "Turkmenistan",
  AZ: "Azerbaijan",
  AM: "Armenia",
  GE: "Georgia",
  BY: "Belarus",
  UA: "Ukraine",
  MD: "Moldova",
  TR: "Türkiye",
  MN: "Mongolia",
};

/** Display label for a region badge: "Kazakhstan" / raw code fallback. */
export function regionLabel(code: string): string {
  return LOCAL_TARGETS[code]?.name ?? COUNTRY_NAMES[code] ?? code;
}
