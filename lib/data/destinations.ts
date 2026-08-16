// Destination-country registry — the single source of truth for which countries
// a student can apply to. The intake, the analysis routing, and the result view
// all read from here. Adding a country later (once it has a dataset + an
// analysis path) is a one-line change in DESTINATIONS plus its data file.

// Availability is a TYPE here, not only a runtime flag, and that is the whole
// point of the shape below.
//
// The comment above has promised since the file was written that adding a
// country is a one-line change. It was not true: four other places hand-wrote
// `"US" | "IT" | "HK" | "AE" | "KR"` — the college-list builder, the rankings
// board, the map markers and a parameter in dashboard/actions — with nothing
// relating any of them to this registry. Flipping CN or CA on would have grown
// the runtime array and left all four silently short, with no type error
// anywhere, because no relationship had ever been declared.
//
// Now `AvailableDestinationCode` is derived from the live list, every one of
// those places imports it, and promoting a country really is one line: move the
// code from PLANNED to AVAILABLE and the compiler names each place that has to
// answer for it.
export const AVAILABLE_DESTINATION_CODES = [
  "US",
  "IT",
  "HK",
  "AE",
  "KR",
] as const;

/** Profiled but not yet live: no dataset and no analysis path. */
export const PLANNED_DESTINATION_CODES = ["CN", "CA"] as const;

/** A country a student can actually be analysed for today. */
export type AvailableDestinationCode =
  (typeof AVAILABLE_DESTINATION_CODES)[number];

export type DestinationCode =
  | AvailableDestinationCode
  | (typeof PLANNED_DESTINATION_CODES)[number];

export type Destination = {
  code: DestinationCode;
  /** i18n key for the country name (see lib/i18n/dictionary.ts → "dest.*"). */
  labelKey: string;
  /** Emoji flag shown on the destination card. */
  flag: string;
  /** Whether we have data + an analysis path for this country yet. */
  available: boolean;
};

const FLAG: Record<DestinationCode, string> = {
  US: "🇺🇸",
  IT: "🇮🇹",
  HK: "🇭🇰",
  AE: "🇦🇪",
  KR: "🇰🇷",
  CN: "🇨🇳",
  CA: "🇨🇦",
};

export const ALL_DESTINATION_CODES: DestinationCode[] = [
  ...AVAILABLE_DESTINATION_CODES,
  ...PLANNED_DESTINATION_CODES,
];

// Order is the display order on the destination step. Available ones first —
// which is now a property of how the list is built, not a hand-kept ordering.
export const DESTINATIONS: Destination[] = ALL_DESTINATION_CODES.map((code) => ({
  code,
  labelKey: `dest.${code}`,
  flag: FLAG[code],
  available: (AVAILABLE_DESTINATION_CODES as readonly string[]).includes(code),
}));

