"use client";

import { StepProps } from "../types";
import { useT } from "@/lib/i18n/client";
import { CURRICULA, type StudentProfileInput } from "@/lib/types";
import { LIMITS } from "@/lib/limits";
import { Input, Field } from "@/components/ui/Input";

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

function numOrUndef(v: string): number | undefined {
  if (v.trim() === "") return undefined;
  const n = Number(v);
  return Number.isFinite(n) ? n : undefined;
}

function gradeHintKey(c: StudentProfileInput["curriculum"]) {
  switch (c) {
    case "IB":
      return "ob.hintIB";
    case "A-Level":
      return "ob.hintAlevel";
    case "US-GPA":
      return "ob.hintGpa";
    case "national":
      return "ob.hintNational";
    default:
      return "ob.hintOther";
  }
}

function gradePlaceholderKey(c: StudentProfileInput["curriculum"]) {
  switch (c) {
    case "IB":
      return "ob.phIB";
    case "A-Level":
      return "ob.phAlevel";
    case "US-GPA":
      return "ob.phGpa";
    case "national":
      return "ob.phNational";
    default:
      return "ob.phOther";
  }
}

export default function StepGrades({ data, updateField }: StepProps) {
  const t = useT();

  return (
    <div className="space-y-4">
      <fieldset className="border-none p-0 m-0 block">
        <legend className="mb-1.5 block text-sm font-medium text-ink">
          {t("ob.curriculum")}
        </legend>
        <div className="grid grid-cols-1 gap-2">
          {CURRICULA.map((c) => (
            <button
              key={c.value}
              type="button"
              onClick={() => updateField("curriculum", c.value)}
              className={`flex items-center justify-between rounded-xl border px-4 py-3 text-left text-sm transition-colors focus-visible:focus-ring min-h-[44px] ${
                data.curriculum === c.value
                  ? "border-accent bg-accent-soft text-accent-ink"
                  : "border-line bg-card text-ink hover:border-ink/30"
              }`}
            >
              {t(`curr.${c.value}`)}
              {data.curriculum === c.value && <Check />}
            </button>
          ))}
        </div>
      </fieldset>

      <Field
        label={t("ob.grades")}
        htmlFor="grades"
        hint={t(gradeHintKey(data.curriculum))}
      >
        <textarea
          id="grades"
          value={data.grades.raw}
          maxLength={LIMITS.grades}
          onChange={(e) =>
            updateField("grades", { ...data.grades, raw: e.target.value })
          }
          rows={3}
          placeholder={t(gradePlaceholderKey(data.curriculum))}
          className="w-full rounded-xl border border-line bg-card px-3.5 py-2.5 text-[0.95rem] text-ink placeholder:text-ink-faint focus-visible:focus-ring"
        />
      </Field>

      {data.curriculum === "IB" && (
        <Field label={t("ob.ibTotal")} htmlFor="ib">
          <Input
            id="ib"
            type="number"
            inputMode="numeric"
            min={0}
            max={45}
            value={data.grades.ib_total ?? ""}
            onChange={(e) =>
              updateField("grades", {
                ...data.grades,
                ib_total: numOrUndef(e.target.value),
              })
            }
            placeholder="out of 45"
          />
        </Field>
      )}
      {data.curriculum === "US-GPA" && (
        <Field label={t("ob.gpa")} htmlFor="gpa">
          <Input
            id="gpa"
            type="number"
            inputMode="decimal"
            step="0.01"
            min={0}
            max={4}
            value={data.grades.gpa ?? ""}
            onChange={(e) =>
              updateField("grades", { ...data.grades, gpa: numOrUndef(e.target.value) })
            }
            placeholder="out of 4.0"
          />
        </Field>
      )}
      {data.curriculum === "national" && (
        <Field label={t("ob.percent")} htmlFor="pct">
          <Input
            id="pct"
            type="number"
            inputMode="numeric"
            min={0}
            max={100}
            value={data.grades.national_percent ?? ""}
            onChange={(e) =>
              updateField("grades", {
                ...data.grades,
                national_percent: numOrUndef(e.target.value),
              })
            }
            placeholder="0–100"
          />
        </Field>
      )}
    </div>
  );
}
