"use client";

import { useState, useMemo } from "react";
import { StepProps } from "../types";
import { useT } from "@/lib/i18n/client";
import {
  ITALIAN_PROGRAMS,
  type ItalianProgram,
} from "@/lib/data/italian-universities";
import {
  italianFieldsForFaculties,
} from "@/lib/data/faculties";
import { Input, Field } from "@/components/ui/Input";

function numOrUndef(v: string): number | undefined {
  if (v.trim() === "") return undefined;
  const n = Number(v);
  return Number.isFinite(n) ? n : undefined;
}

export default function StepItalyTargets({ data, updateField }: StepProps) {
  const t = useT();
  const [italyQuery, setItalyQuery] = useState("");
  
  const selectedItaly = useMemo(
    () => data.italy_programs ?? [],
    [data.italy_programs]
  );
  
  const facultyKey = data.faculties.join(",");

  const italySuggestions = useMemo((): ItalianProgram[] => {
    const q = italyQuery.trim().toLowerCase();
    const fields = italianFieldsForFaculties(facultyKey ? facultyKey.split(",") : []);
    return ITALIAN_PROGRAMS.filter((p) => {
      if (selectedItaly.includes(p.id)) return false;
      if (q !== "") {
        return (
          p.university.toLowerCase().includes(q) ||
          p.program_name.toLowerCase().includes(q) ||
          p.city.toLowerCase().includes(q)
        );
      }
      return fields.length === 0 || fields.includes(p.field);
    }).slice(0, 6);
  }, [italyQuery, selectedItaly, facultyKey]);

  const addItalyProgram = (id: string) => {
    if (!selectedItaly.includes(id) && selectedItaly.length < 8) {
      updateField("italy_programs", [...selectedItaly, id]);
    }
    setItalyQuery("");
  };

  const removeItalyProgram = (id: string) => {
    updateField("italy_programs", selectedItaly.filter((x) => x !== id));
  };

  const italyProgramById = (id: string) =>
    ITALIAN_PROGRAMS.find((p) => p.id === id);

  return (
    <div className="space-y-4">
      <p className="text-xs text-ink-soft">{t("ob.italyProgramsHint")}</p>

      {selectedItaly.length > 0 && (
        <div className="space-y-2">
          {selectedItaly.map((id) => {
            const prog = italyProgramById(id);
            if (!prog) return null;
            return (
              <div
                key={id}
                className="flex items-start justify-between gap-3 rounded-xl border border-line bg-card px-4 py-3 min-h-[44px]"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-ink">
                    {prog.university}
                  </p>
                  <p className="truncate text-xs text-ink-soft">
                    {prog.program_name} · {prog.city} ·{" "}
                    {prog.level.toUpperCase()}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => removeItalyProgram(id)}
                  aria-label={`Remove ${prog.program_name}`}
                  className="shrink-0 rounded px-3 py-2 text-xs font-medium text-ink-soft hover:text-reach focus-visible:focus-ring min-h-[44px]"
                >
                  {t("ob.remove")}
                </button>
              </div>
            );
          })}
        </div>
      )}

      {selectedItaly.length < 8 && (
        <>
          <Field label={t("ob.italyPrograms")} htmlFor="italy-search">
            <Input
              id="italy-search"
              value={italyQuery}
              onChange={(e) => setItalyQuery(e.target.value)}
              placeholder={t("ob.italyProgramsPh")}
            />
          </Field>

          {(italyQuery !== "" || selectedItaly.length === 0) && (
            <div className="overflow-hidden rounded-xl border border-line bg-card">
              {italySuggestions.length === 0 ? (
                <p className="px-4 py-3 text-sm text-ink-soft">
                  {italyQuery === ""
                    ? t("ob.italyNoFieldMatches")
                    : t("ob.italyNoMatches")}
                </p>
              ) : (
                italySuggestions.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => addItalyProgram(p.id)}
                    className="block w-full border-b border-line px-4 py-2.5 text-left last:border-0 hover:bg-accent-soft focus-visible:focus-ring min-h-[44px]"
                  >
                    <p className="text-sm text-ink">{p.university}</p>
                    <p className="text-xs text-ink-soft">
                      {p.program_name} · {p.city} · {p.level.toUpperCase()} ·{" "}
                      {p.language}
                    </p>
                  </button>
                ))
              )}
            </div>
          )}
        </>
      )}

      <Field
        label={t("ob.italyIncome")}
        htmlFor="italy-income"
        hint={t("ob.italyIncomeHint")}
      >
        <div className="flex gap-2">
          <div className="relative flex-1">
            <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-sm text-ink-soft">
              €
            </span>
            <Input
              id="italy-income"
              type="number"
              inputMode="numeric"
              min={0}
              max={10_000_000}
              value={data.italy_family_income ?? ""}
              onChange={(e) =>
                updateField("italy_family_income", numOrUndef(e.target.value))
              }
              placeholder={t("ob.italyIncomePh")}
              className="pl-8"
            />
          </div>
          <button
            type="button"
            onClick={() => updateField("italy_family_income", undefined)}
            className="rounded-xl border border-line bg-card px-3 text-sm text-ink-soft transition-colors hover:border-ink/30 hover:text-ink focus-visible:focus-ring min-h-[44px]"
          >
            {t("ob.italyIncomeSkip")}
          </button>
        </div>
      </Field>
    </div>
  );
}
