// Infinite scrolling rows of US universities + applicant-country flags.
// Pure CSS animation (see globals.css); honors prefers-reduced-motion globally.

const SCHOOLS = [
  "Harvard",
  "MIT",
  "Stanford",
  "Yale",
  "Princeton",
  "Columbia",
  "UPenn",
  "Brown",
  "Cornell",
  "Dartmouth",
  "Duke",
  "UChicago",
  "Northwestern",
  "Johns Hopkins",
  "UC Berkeley",
  "UCLA",
  "Michigan",
  "NYU",
  "Boston University",
  "USC",
  "Carnegie Mellon",
  "Georgia Tech",
];

// The "applying from everywhere" vibe.
const FLAGS = [
  "🇰🇿", "🇮🇳", "🇳🇬", "🇧🇷", "🇻🇳", "🇪🇬", "🇮🇩", "🇵🇰", "🇹🇷", "🇰🇷",
  "🇨🇳", "🇲🇽", "🇵🇭", "🇧🇩", "🇰🇪", "🇨🇴", "🇹🇭", "🇺🇿", "🇲🇾", "🇬🇭",
];

export function UniversityMarquee() {
  const schools = [...SCHOOLS, ...SCHOOLS];
  return (
    <div className="space-y-3">
      <div className="marquee-row marquee-mask overflow-hidden">
        <div className="marquee-track gap-3 pr-3">
          {schools.map((s, i) => (
            <span
              key={i}
              className="inline-flex shrink-0 items-center gap-2 rounded-full border border-line bg-card px-4 py-2 text-sm font-medium text-ink-soft shadow-card"
            >
              <span aria-hidden="true">🇺🇸</span>
              {s}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

/** A compact flag ribbon — the international-applicant vibe. */
export function FlagRibbon() {
  const flags = [...FLAGS, ...FLAGS];
  return (
    <div className="marquee-row marquee-mask overflow-hidden">
      <div className="marquee-track-rev gap-2 pr-2">
        {flags.map((f, i) => (
          <span
            key={i}
            aria-hidden="true"
            className="inline-flex shrink-0 items-center justify-center rounded-xl border border-line bg-card px-2.5 py-1.5 text-lg shadow-card"
          >
            {f}
          </span>
        ))}
      </div>
    </div>
  );
}
