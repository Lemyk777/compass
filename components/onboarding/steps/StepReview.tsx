"use client";

import { StepProps, StepKey } from "../types";
import { useT } from "@/lib/i18n/client";
import { destinationLabelKey } from "@/lib/data/destinations";
import { facultyLabelKey } from "@/lib/data/faculties";
import { ITALIAN_PROGRAMS } from "@/lib/data/italian-universities";
import { HK_PROGRAMS } from "@/lib/data/hk-universities";
import type { StudentProfileInput } from "@/lib/types";

function testSummary(data: StudentProfileInput): string {
  const t = data.tests;
  const parts: string[] = [];
  if (t.SAT) parts.push(`SAT ${t.SAT}`);
  if (t.ACT) parts.push(`ACT ${t.ACT}`);
  if (t.IELTS) parts.push(`IELTS ${t.IELTS}`);
  if (t.TOEFL) parts.push(`TOEFL ${t.TOEFL}`);
  if (t.subjects) parts.push(t.subjects);
  return parts.join(" · ");
}

export default function StepReview({ data, goToKey }: StepProps) {
  const t = useT();

  const destinationSummary = data.destinations
    .map((c) => t(destinationLabelKey(c) ?? c))
    .join(", ");
  const facultySummary = data.faculties
    .map((v) => t(facultyLabelKey(v) ?? v))
    .join(", ");
  const italyProgramSummary = (data.italy_programs ?? [])
    .map((id) => {
      const p = ITALIAN_PROGRAMS.find((x) => x.id === id);
      return p ? `${p.university} (${p.level.toUpperCase()})` : id;
    })
    .join(", ");

  const wantsUS = data.destinations.includes("US");
  const wantsIT = data.destinations.includes("IT");
  const wantsHK = data.destinations.includes("HK");

  const hkProgramSummary = (data.hk_programs ?? [])
    .map((id) => {
      const p = HK_PROGRAMS.find((x) => x.id === id);
      return p ? `${p.university} (${p.program_name})` : id;
    })
    .join(", ");

  const rows: { label: string; value: string; step: StepKey }[] = [
    {
      label: t("ob.countryCitizenship"),
      value: data.citizenship || data.country || "—",
      step: "origin",
    },
    {
      label: t("ob.rDestinations"),
      value: destinationSummary || "—",
      step: "destinations",
    },
    {
      label: t("ob.rFaculties"),
      value: facultySummary || "—",
      step: "faculties",
    },
    ...(data.intended_major.trim()
      ? [
          {
            label: t("ob.rMajor"),
            value: data.intended_major,
            step: "faculties" as StepKey,
          },
        ]
      : []),
    {
      label: t("ob.rCurriculum"),
      value: data.curriculum ? t(`curr.${data.curriculum}`) : "—",
      step: "grades",
    },
    { label: t("ob.rGrades"), value: data.grades.raw || "—", step: "grades" },
    { label: t("ob.rTests"), value: testSummary(data) || "—", step: "tests" },
    {
      label: t("ob.rActivities"),
      value: `${data.activities.filter((a) => a.position.trim()).length} ${t("ob.added")}`,
      step: "activities",
    },
    {
      label: t("ob.rHonors"),
      value: `${(data.honors ?? []).filter((h) => h.title.trim()).length} ${t("ob.added")}`,
      step: "honors",
    },
    ...(wantsUS
      ? [
          {
            label: t("ob.rSchools"),
            value: data.target_schools.join(", ") || "—",
            step: "us" as StepKey,
          },
          {
            label: t("ob.rAid"),
            value: data.needs_aid ? t("ob.yes") : t("ob.no"),
            step: "us" as StepKey,
          },
        ]
      : []),
    ...(wantsIT
      ? [
          {
            label: t("ob.rItalyPrograms"),
            value: italyProgramSummary || "—",
            step: "it" as StepKey,
          },
          {
            label: t("ob.rItalyIncome"),
            value:
              data.italy_family_income != null
                ? `€${data.italy_family_income.toLocaleString()}`
                : t("ob.italyIncomeSkip"),
            step: "it" as StepKey,
          },
        ]
      : []),
    ...(wantsHK
      ? [
          {
            label: t("ob.hkPrograms"),
            value: hkProgramSummary || "—",
            step: "hk" as StepKey,
          },
          {
            label: t("ob.hkGradeStatus"),
            value:
              data.hk_grade_status === "predicted"
                ? t("ob.hkPredicted")
                : data.hk_grade_status === "achieved"
                  ? t("ob.hkAchieved")
                  : "—",
            step: "hk" as StepKey,
          },
        ]
      : []),
  ];

  return (
    <div className="divide-y divide-line rounded-xl border border-line bg-card">
      {rows.map((r) => (
        <div key={r.label} className="flex items-start gap-3 px-4 py-3">
          <span className="w-28 shrink-0 text-xs font-medium text-ink-soft">
            {r.label}
          </span>
          <span className="flex-1 text-sm text-ink">{r.value}</span>
          {goToKey && (
            <button
              type="button"
              onClick={() => goToKey(r.step)}
              className="rounded text-xs font-medium text-accent hover:underline focus-visible:focus-ring min-h-[44px] px-2 -my-3 flex items-center"
            >
              {t("ob.edit")}
            </button>
          )}
        </div>
      ))}
    </div>
  );
}
