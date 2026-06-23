"use client";

import { StepProps } from "../types";
import { useT } from "@/lib/i18n/client";
import { DESTINATIONS, type DestinationCode } from "@/lib/data/destinations";

function Check() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path
        d="M3 8.5l3 3 7-7"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function StepDestinations({ data, updateField }: StepProps) {
  const t = useT();
  const selected = data.destinations;

  const toggle = (code: DestinationCode) => {
    updateField(
      "destinations",
      selected.includes(code)
        ? selected.filter((c) => c !== code)
        : [...selected, code]
    );
  };

  return (
    <fieldset className="grid grid-cols-2 gap-3 border-none p-0 m-0">
      <legend className="sr-only">{t("ob.destinations") || "Destinations"}</legend>
      {DESTINATIONS.map((d) => {
        const on = selected.includes(d.code);
        const disabled = !d.available;
        return (
          <button
            key={d.code}
            type="button"
            disabled={disabled}
            aria-pressed={on}
            onClick={() => toggle(d.code)}
            className={`relative flex flex-col items-start gap-2 rounded-2xl border p-4 text-left transition-colors focus-visible:focus-ring min-h-[44px] ${
              disabled
                ? "cursor-not-allowed border-line bg-card opacity-50"
                : on
                  ? "border-accent bg-accent-soft"
                  : "border-line bg-card hover:border-ink/30"
            }`}
          >
            <span className="text-sm font-medium text-ink">
              {t(d.labelKey)}
            </span>
            {disabled ? (
              <span className="absolute right-3 top-3 rounded-full bg-line px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-ink-faint">
                {t("dest.soon")}
              </span>
            ) : (
              on && (
                <span className="absolute right-3 top-3 text-accent">
                  <Check />
                </span>
              )
            )}
          </button>
        );
      })}
    </fieldset>
  );
}
