"use client";

import { StepProps } from "../types";
import { useT } from "@/lib/i18n/client";

// "How did you hear about us?" — shown only to signups with no referral
// attribution. One primary source; choosing "ambassador" reveals a code field
// so the ambassador gets credited just like a referral link.
const SOURCES = [
  { value: "social", labelKey: "src.social", emoji: "📱" },
  { value: "friend", labelKey: "src.friend", emoji: "🗣️" },
  { value: "search", labelKey: "src.search", emoji: "🔎" },
  { value: "school", labelKey: "src.school", emoji: "🏫" },
  { value: "ambassador", labelKey: "src.ambassador", emoji: "⭐" },
  { value: "other", labelKey: "src.other", emoji: "✨" },
] as const;

export default function StepSource({ data, updateField, updateFields }: StepProps) {
  const t = useT();
  const selected = data.heard_from ?? "";

  const pick = (value: string) => {
    if (value === "ambassador") {
      updateField("heard_from", value);
    } else {
      // Leaving the ambassador option clears any typed code.
      updateFields({ heard_from: value, heard_from_code: "" });
    }
  };

  return (
    <div className="space-y-4">
      <fieldset className="grid grid-cols-2 gap-3 border-none p-0 m-0">
        <legend className="sr-only">{t("ob.tSource")}</legend>
        {SOURCES.map((s) => {
          const on = selected === s.value;
          return (
            <button
              key={s.value}
              type="button"
              aria-pressed={on}
              onClick={() => pick(s.value)}
              className={`flex min-h-[44px] items-center gap-2 rounded-2xl border p-4 text-left transition-colors focus-visible:focus-ring ${
                on
                  ? "border-accent bg-accent-soft"
                  : "border-line bg-card hover:border-ink/30"
              }`}
            >
              <span aria-hidden="true" className="text-lg">
                {s.emoji}
              </span>
              <span className="text-sm font-medium text-ink">{t(s.labelKey)}</span>
            </button>
          );
        })}
      </fieldset>

      {selected === "ambassador" && (
        <div className="rounded-2xl border border-line bg-card p-4">
          <label
            htmlFor="heard_from_code"
            className="block text-sm font-medium text-ink"
          >
            {t("ob.sourceCodeLabel")}
          </label>
          <input
            id="heard_from_code"
            type="text"
            inputMode="text"
            autoComplete="off"
            value={data.heard_from_code ?? ""}
            onChange={(e) =>
              updateField("heard_from_code", e.target.value.slice(0, 64))
            }
            placeholder={t("ob.sourceCodePh")}
            className="mt-2 w-full rounded-xl border border-line bg-surface px-3 py-2.5 text-sm text-ink uppercase tracking-wide placeholder:normal-case placeholder:tracking-normal placeholder:text-ink-faint focus-visible:focus-ring"
          />
          <p className="mt-2 text-xs text-ink-soft">{t("ob.sourceCodeHint")}</p>
        </div>
      )}
    </div>
  );
}
