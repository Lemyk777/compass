"use client";

import { useState, useMemo } from "react";
import { StepProps } from "../types";
import { useT } from "@/lib/i18n/client";
import { LIMITS } from "@/lib/limits";
import { UNIVERSITY_NAMES } from "@/lib/data/universities";
import { Input, Field } from "@/components/ui/Input";

function Toggle({
  checked,
  onChange,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={`relative h-6 w-11 rounded-full transition-colors focus-visible:focus-ring ${
        checked ? "bg-accent" : "bg-gray-400"
      }`}
    >
      <span
        className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${
          checked ? "left-0.5 translate-x-5" : "left-0.5"
        }`}
      />
    </button>
  );
}

export default function StepUSTargets({ data, updateField }: StepProps) {
  const t = useT();
  const [query, setQuery] = useState("");
  const selected = data.target_schools;

  const suggestions = useMemo(() => {
    const q = query.trim().toLowerCase();
    return UNIVERSITY_NAMES.filter(
      (n) => !selected.includes(n) && (q === "" || n.toLowerCase().includes(q))
    ).slice(0, 6);
  }, [query, selected]);

  const addSchool = (name: string) => {
    if (!selected.includes(name) && selected.length < LIMITS.targetSchools) {
      updateField("target_schools", [...selected, name]);
    }
    setQuery("");
  };

  return (
    <div className="space-y-4">
      {selected.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {selected.map((s) => (
            <span
              key={s}
              className="inline-flex items-center gap-1.5 rounded-full bg-ink px-3 py-1.5 text-sm text-white"
            >
              {s}
              <button
                type="button"
                onClick={() =>
                  updateField(
                    "target_schools",
                    selected.filter((x) => x !== s)
                  )
                }
                aria-label={`Remove ${s}`}
                className="text-white/70 hover:text-white focus-visible:focus-ring min-h-[30px] min-w-[20px]"
              >
                ×
              </button>
            </span>
          ))}
        </div>
      )}

      <Field label={t("ob.searchSchools")} htmlFor="school-search">
        <Input
          id="school-search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t("ob.searchPh")}
        />
      </Field>

      {(query !== "" || selected.length === 0) && (
        <div className="overflow-hidden rounded-xl border border-line bg-card">
          {suggestions.length === 0 ? (
            <p className="px-4 py-3 text-sm text-ink-soft">
              {t("ob.noMatches")}
            </p>
          ) : (
            suggestions.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => addSchool(s)}
                className="block w-full border-b border-line px-4 py-2.5 text-left text-sm text-ink last:border-0 hover:bg-accent-soft focus-visible:focus-ring min-h-[44px]"
              >
                {s}
              </button>
            ))
          )}
        </div>
      )}

      <label className="flex items-center justify-between rounded-xl border border-line bg-card px-4 py-3 min-h-[44px]">
        <span className="text-sm text-ink">{t("ob.needAid")}</span>
        <Toggle checked={data.needs_aid} onChange={(v) => updateField("needs_aid", v)} />
      </label>
    </div>
  );
}
