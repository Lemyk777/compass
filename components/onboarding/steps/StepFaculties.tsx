"use client";

import { StepProps } from "../types";
import { useT } from "@/lib/i18n/client";
import { FACULTIES, type FacultyValue } from "@/lib/data/faculties";
import { LIMITS } from "@/lib/limits";
import { Input, Field } from "@/components/ui/Input";

export default function StepFaculties({ data, updateField }: StepProps) {
  const t = useT();
  const selected = data.faculties;
  const atCap = selected.length >= LIMITS.faculties;

  const toggle = (v: FacultyValue) => {
    if (selected.includes(v)) {
      updateField("faculties", selected.filter((x) => x !== v));
    } else if (!atCap) {
      updateField("faculties", [...selected, v]);
    }
  };

  return (
    <div className="space-y-5">
      <fieldset className="border-none p-0 m-0 block">
        <legend className="sr-only">{t("ob.faculties") || "Faculties"}</legend>
        <div className="flex flex-wrap gap-2">
          {FACULTIES.map((f) => {
            const on = selected.includes(f.value);
            const dis = !on && atCap;
            return (
              <button
                key={f.value}
                type="button"
                aria-pressed={on}
                disabled={dis}
                onClick={() => toggle(f.value)}
                className={`rounded-full border px-3.5 py-2 text-sm transition-colors focus-visible:focus-ring min-h-[44px] ${
                  on
                    ? "border-accent bg-accent-soft text-accent-ink"
                    : dis
                      ? "cursor-not-allowed border-line bg-card text-ink-faint opacity-50"
                      : "border-line bg-card text-ink-soft hover:border-ink/30"
                }`}
              >
                {t(f.labelKey)}
              </button>
            );
          })}
        </div>
        <p className="mt-2 text-xs text-ink-faint">{t("ob.facCap")}</p>
      </fieldset>

      <Field label={t("ob.major")} htmlFor="major" hint={t("ob.majorHint")}>
        <Input
          id="major"
          value={data.intended_major}
          maxLength={LIMITS.shortText}
          onChange={(e) => updateField("intended_major", e.target.value)}
          placeholder={t("ob.majorPh")}
        />
      </Field>
    </div>
  );
}
