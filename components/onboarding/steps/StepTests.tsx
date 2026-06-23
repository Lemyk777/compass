"use client";

import { StepProps } from "../types";
import { useT } from "@/lib/i18n/client";
import { LIMITS } from "@/lib/limits";
import { Input, Field } from "@/components/ui/Input";

function numOrUndef(v: string): number | undefined {
  if (v.trim() === "") return undefined;
  const n = Number(v);
  return Number.isFinite(n) ? n : undefined;
}

export default function StepTests({ data, updateField }: StepProps) {
  const tr = useT();
  const t = data.tests;

  const upd = (k: keyof typeof t, v: number | string | undefined) =>
    updateField("tests", { ...t, [k]: v });

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <Field label="SAT" htmlFor="sat" hint="400–1600">
          <Input
            id="sat"
            type="number"
            inputMode="numeric"
            value={t.SAT ?? ""}
            onChange={(e) => upd("SAT", numOrUndef(e.target.value))}
            placeholder="e.g. 1520"
          />
        </Field>
        <Field label="ACT" htmlFor="act" hint="1–36">
          <Input
            id="act"
            type="number"
            inputMode="numeric"
            value={t.ACT ?? ""}
            onChange={(e) => upd("ACT", numOrUndef(e.target.value))}
            placeholder="e.g. 34"
          />
        </Field>
        <Field label="IELTS" htmlFor="ielts" hint="0–9">
          <Input
            id="ielts"
            type="number"
            inputMode="decimal"
            step="0.5"
            value={t.IELTS ?? ""}
            onChange={(e) => upd("IELTS", numOrUndef(e.target.value))}
            placeholder="e.g. 8.0"
          />
        </Field>
        <Field label="TOEFL" htmlFor="toefl" hint="0–120">
          <Input
            id="toefl"
            type="number"
            inputMode="numeric"
            value={t.TOEFL ?? ""}
            onChange={(e) => upd("TOEFL", numOrUndef(e.target.value))}
            placeholder="e.g. 110"
          />
        </Field>
      </div>
      <Field label={tr("ob.subjects")} htmlFor="subj">
        <Input
          id="subj"
          value={t.subjects ?? ""}
          maxLength={LIMITS.subjects}
          onChange={(e) => upd("subjects", e.target.value || undefined)}
          placeholder={tr("ob.subjectsPh")}
        />
      </Field>
    </div>
  );
}
