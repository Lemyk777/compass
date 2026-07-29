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

/** Free-text country/citizenship → ISO-2 code, or null when unrecognized. */
export function normalizeCountry(raw: string | null | undefined): CountryCode | null {
  if (!raw) return null;
  const key = raw.trim().toLowerCase().replace(/\s+/g, " ");
  if (COUNTRY_ALIASES[key]) return COUNTRY_ALIASES[key];
  // A bare valid-looking ISO-2 the table doesn't know ("US", "DE") is accepted
  // as-is — region matching is exact-code, so this stays safe.
  if (/^[a-z]{2}$/.test(key)) return key.toUpperCase();
  return null;
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

/** Display label for a region badge: "Kazakhstan" / raw code fallback. */
export function regionLabel(code: string): string {
  return LOCAL_TARGETS[code]?.name ?? code;
}
