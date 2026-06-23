"use client";

import { useMemo, useState } from "react";
import { StepProps } from "../types";
import { useT } from "@/lib/i18n/client";
import { HK_PROGRAMS, type HkProgram } from "@/lib/data/hk-universities";
import { Input, Field } from "@/components/ui/Input";

const MAX = 6;

export default function StepHKTargets({ data, updateField }: StepProps) {
  const t = useT();
  const [query, setQuery] = useState("");
  const selected = useMemo(() => data.hk_programs ?? [], [data.hk_programs]);
  const gradeStatus = data.hk_grade_status;

  const suggestions = useMemo((): HkProgram[] => {
    const q = query.trim().toLowerCase();
    return HK_PROGRAMS.filter((p) => {
      if (selected.includes(p.id)) return false;
      if (q !== "") {
        return (
          p.university.toLowerCase().includes(q) ||
          p.program_name.toLowerCase().includes(q) ||
          p.field.toLowerCase().includes(q)
        );
      }
      return true;
    }).slice(0, 6);
  }, [query, selected]);

  const add = (id: string) => {
    if (!selected.includes(id) && selected.length < MAX) {
      updateField("hk_programs", [...selected, id]);
    }
    setQuery("");
  };
  const remove = (id: string) =>
    updateField("hk_programs", selected.filter((x) => x !== id));
  const byId = (id: string) => HK_PROGRAMS.find((p) => p.id === id);

  return (
    <div className="space-y-4">
      <p className="text-xs text-ink-soft">{t("ob.hkProgramsHint")}</p>

      {selected.length > 0 && (
        <div className="space-y-2">
          {selected.map((id) => {
            const p = byId(id);
            if (!p) return null;
            return (
              <div
                key={id}
                className="flex items-start justify-between gap-3 rounded-xl border border-line bg-card px-4 py-3 min-h-[44px]"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-ink">{p.university}</p>
                  <p className="truncate text-xs text-ink-soft">{p.program_name}</p>
                </div>
                <button
                  type="button"
                  onClick={() => remove(id)}
                  aria-label={`Remove ${p.program_name}`}
                  className="shrink-0 rounded px-3 py-2 text-xs font-medium text-ink-soft hover:text-reach focus-visible:focus-ring min-h-[44px]"
                >
                  {t("ob.remove")}
                </button>
              </div>
            );
          })}
        </div>
      )}

      {selected.length < MAX && (
        <>
          <Field label={t("ob.hkPrograms")} htmlFor="hk-search">
            <Input
              id="hk-search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t("ob.hkProgramsPh")}
            />
          </Field>

          {(query !== "" || selected.length === 0) && (
            <div className="overflow-hidden rounded-xl border border-line bg-card">
              {suggestions.length === 0 ? (
                <p className="px-4 py-3 text-sm text-ink-soft">{t("ob.hkNoMatches")}</p>
              ) : (
                suggestions.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => add(p.id)}
                    className="block w-full border-b border-line px-4 py-2.5 text-left last:border-0 hover:bg-accent-soft focus-visible:focus-ring min-h-[44px]"
                  >
                    <p className="text-sm text-ink">{p.university}</p>
                    <p className="text-xs text-ink-soft">
                      {p.program_name}
                      {p.interview_required ? " · interview" : ""}
                    </p>
                  </button>
                ))
              )}
            </div>
          )}
        </>
      )}

      {/* Predicted vs achieved — drives the Conditional Offer logic */}
      <Field label={t("ob.hkGradeStatus")} htmlFor="hk-grade-status" hint={t("ob.hkGradeStatusHint")}>
        <div className="flex gap-2" id="hk-grade-status">
          {(["predicted", "achieved"] as const).map((s) => {
            const on = gradeStatus === s;
            return (
              <button
                key={s}
                type="button"
                onClick={() => updateField("hk_grade_status", s)}
                aria-pressed={on}
                className={`min-h-[44px] flex-1 rounded-xl border px-4 py-3 text-sm font-medium transition-colors focus-visible:focus-ring ${
                  on
                    ? "border-accent bg-accent-soft text-ink"
                    : "border-line bg-card text-ink-soft hover:border-ink/30"
                }`}
              >
                {s === "predicted" ? t("ob.hkPredicted") : t("ob.hkAchieved")}
              </button>
            );
          })}
        </div>
      </Field>
    </div>
  );
}
