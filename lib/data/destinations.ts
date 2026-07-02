// Destination-country registry — the single source of truth for which countries
// a student can apply to. The intake, the analysis routing, and the result view
// all read from here. Adding a country later (once it has a dataset + an
// analysis path) is a one-line change in DESTINATIONS plus its data file.

export type DestinationCode = "US" | "IT" | "HK" | "AE" | "KR" | "CN" | "CA";

export type Destination = {
  code: DestinationCode;
  /** i18n key for the country name (see lib/i18n/dictionary.ts → "dest.*"). */
  labelKey: string;
  /** Emoji flag shown on the destination card. */
  flag: string;
  /** Whether we have data + an analysis path for this country yet. */
  available: boolean;
};

// Order is the display order on the destination step. Available ones first.
export const DESTINATIONS: Destination[] = [
  { code: "US", labelKey: "dest.US", flag: "🇺🇸", available: true },
  { code: "IT", labelKey: "dest.IT", flag: "🇮🇹", available: true },
  { code: "HK", labelKey: "dest.HK", flag: "🇭🇰", available: true },
  { code: "AE", labelKey: "dest.AE", flag: "🇦🇪", available: true },
  { code: "KR", labelKey: "dest.KR", flag: "🇰🇷", available: true },
  { code: "CN", labelKey: "dest.CN", flag: "🇨🇳", available: false },
  { code: "CA", labelKey: "dest.CA", flag: "🇨🇦", available: false },
];

export const ALL_DESTINATION_CODES: DestinationCode[] = DESTINATIONS.map(
  (d) => d.code
);

export const AVAILABLE_DESTINATION_CODES: DestinationCode[] = DESTINATIONS.filter(
  (d) => d.available
).map((d) => d.code);

/** Human label key for a code (falls back to the raw code). */
export function destinationLabelKey(code: string): string | undefined {
  return DESTINATIONS.find((d) => d.code === code)?.labelKey;
}
