"use client";

import { useState } from "react";
import { UNIVERSITIES, type University } from "@/lib/data/universities";
import { earliestDeadlineHint } from "@/lib/data/app-deadlines";
import { branchCampusFor } from "@/lib/data/branch-campuses";
import { Flag } from "@/components/ui/Flag";
import { ITALIAN_PROGRAMS } from "@/lib/data/italian-universities";
import { HK_PROGRAMS } from "@/lib/data/hk-universities";
import { UAE_PROGRAMS } from "@/lib/data/uae-universities";
import { KOREA_PROGRAMS } from "@/lib/data/korea-universities";
import { LIMITS } from "@/lib/limits";
import {
  facultyLabel,
  italianFieldsForFaculties,
  programFieldsForFaculties,
} from "@/lib/data/faculties";
import { useDashboard } from "@/components/dashboard/DashboardContext";
import {
  CountryTabs,
  NoAnalysisYet,
  PageHeader,
} from "@/components/dashboard/states";
import {
  FieldFilterNotice,
  GradeStatusField,
} from "@/components/dashboard/college-list/parts";
import { ListBuilderShell } from "@/components/dashboard/college-list/ListBuilderShell";
import {
  useFieldFilter,
  useListSelection,
  useListSubmit,
} from "@/components/dashboard/college-list/useListBuilder";

// A program's coarse field-of-study, used to default each picker to the
// student's chosen fields. Module-level so the reference stays stable.
const fieldOf = (p: { field: string }) => p.field;

// The college list is multi-country: which builder shows follows the active
// country tab (driven by the student's chosen destinations). Each builder is a
// thin config over the shared ListBuilderShell — it supplies its dataset, its
// card content, and its save action; selection/search/submit are shared.
export function CollegeListView() {
  const { analysis, country } = useDashboard();

  // The college list extends an existing profile — if there's no analysis yet,
  // the student hasn't completed onboarding.
  if (!analysis) return <NoAnalysisYet />;

  return (
    <div className="space-y-6 pb-28">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <PageHeader
          title="Build your college list"
          hint="Pick the universities and programs you're aiming for. We'll score your admission odds at each, using your profile and real admitted-student data."
        />
        <div className="mb-6">
          <CountryTabs />
        </div>
      </div>

      {country === "US" && <UsBuilder />}
      {country === "IT" && <ItalyBuilder />}
      {country === "HK" && <HkBuilder />}
      {country === "AE" && <UaeBuilder />}
      {country === "KR" && <KoreaBuilder />}
    </div>
  );
}

const lc = (s: string) => s.toLowerCase();

// Renders the "scoped to your fields" notice for a program builder, or nothing
// when the student has no matching field filter.
function FieldFilter<T>({
  ff,
  faculties,
}: {
  ff: ReturnType<typeof useFieldFilter<T>>;
  faculties: string[];
}) {
  if (!ff.canFilter) return null;
  return (
    <FieldFilterNotice
      facultyLabels={faculties.map(facultyLabel)}
      active={ff.active}
      matchCount={ff.matchCount}
      totalCount={ff.totalCount}
      onToggle={() => ff.setShowAll((v) => !v)}
    />
  );
}

// ── US ────────────────────────────────────────────────────────────────────────
const US_SORTED = [...UNIVERSITIES].sort(
  (a, b) => a.acceptance_rate - b.acceptance_rate,
);
const usSearch = (u: University, q: string) => lc(u.name).includes(q);

function UsBuilder() {
  // US selection is keyed by school NAME (that's what the analysis stores).
  const sel = useListSelection(
    US_SORTED,
    LIMITS.targetSchools,
    (u) => u.name,
    usSearch,
  );
  const { busy, error, submit } = useListSubmit("US");

  const run = () =>
    submit(async () => {
      const { saveCollegeList } = await import("@/app/dashboard/actions");
      return saveCollegeList(sel.selected);
    });

  return (
    <ListBuilderShell
      sel={sel}
      keyOf={(u) => u.id}
      placeholder="Search universities…"
      cap={LIMITS.targetSchools}
      countNoun="school"
      emptyMessage="Select at least one university to continue."
      busy={busy}
      error={error}
      onCta={run}
      card={(u) => {
        const branch = branchCampusFor(u.id);
        const deadline = earliestDeadlineHint(u.id);
        return {
          title: u.name,
          badge: branch ? (
            <span className="mt-1.5 inline-flex w-fit items-center gap-1.5 rounded-full bg-accent-soft px-2 py-0.5 text-[12px] font-semibold text-accent-ink">
              <Flag code={branch.host_code} size={10} className="shrink-0" />
              Campus in {branch.host_country.replace(/^the /, "")} · US-system
              admissions
            </span>
          ) : undefined,
          meta: [
            `Admit ~${Math.round(u.acceptance_rate * 100)}%`,
            `SAT ${u.sat_p25}–${u.sat_p75}`,
            ...(deadline ? [deadline] : []),
          ],
          note: u.notes_international,
        };
      }}
    />
  );
}

// ── Italy ───────────────────────────────────────────────────────────────────
const IT_SORTED = [...ITALIAN_PROGRAMS].sort((a, b) =>
  a.university === b.university
    ? a.program_name.localeCompare(b.program_name)
    : a.university.localeCompare(b.university),
);
const itSearch = (p: (typeof IT_SORTED)[number], q: string) =>
  lc(p.university).includes(q) ||
  lc(p.program_name).includes(q) ||
  lc(p.city).includes(q);

function ItalyBuilder() {
  const { profileMeta } = useDashboard();
  const ff = useFieldFilter(
    IT_SORTED,
    fieldOf,
    profileMeta.faculties,
    italianFieldsForFaculties,
  );
  const sel = useListSelection(
    ff.list,
    LIMITS.italyPrograms,
    (p) => p.id,
    itSearch,
  );
  const [income, setIncome] = useState<string>("");
  const { busy, error, submit } = useListSubmit("IT");

  const run = () =>
    submit(async () => {
      const { saveItalyList } = await import("@/app/dashboard/actions");
      const n = Number(income);
      return saveItalyList(
        sel.selected,
        income.trim() !== "" && Number.isFinite(n) ? n : undefined,
      );
    });

  return (
    <ListBuilderShell
      sel={sel}
      placeholder="Search by university, program, or city…"
      cap={LIMITS.italyPrograms}
      countNoun="program"
      emptyMessage="Select at least one program to continue."
      busy={busy}
      error={error}
      onCta={run}
      controls={
        <div className="space-y-6">
          <FieldFilter ff={ff} faculties={profileMeta.faculties} />
          <div className="max-w-md">
            <label htmlFor="it-income" className="text-sm font-medium text-ink">
              Family income (annual, EUR)
            </label>
            <p className="mb-2 text-xs text-ink-soft">
              Optional. It refines your DSU tuition-reduction estimate. Leave
              blank and we use your profile budget, or a typical default if you
              skipped that.
            </p>
            <div className="relative">
              <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-sm text-ink-soft">
                €
              </span>
              <input
                id="it-income"
                type="number"
                inputMode="numeric"
                min={0}
                max={10_000_000}
                value={income}
                onChange={(e) => setIncome(e.target.value)}
                placeholder="e.g. 30000"
                className="h-11 w-full rounded-xl border border-line bg-card pl-8 pr-3.5 text-[0.95rem] text-ink placeholder:text-ink-faint focus-visible:focus-ring"
              />
            </div>
          </div>
        </div>
      }
      card={(p) => ({
        title: p.university,
        subtitle: `${p.program_name} · ${p.city}`,
        meta: [
          p.level.toUpperCase(),
          p.language,
          `€${p.annual_fee_eur.toLocaleString()}/yr`,
        ],
        note: p.notes,
      })}
    />
  );
}

// ── Hong Kong ────────────────────────────────────────────────────────────────
const HK_SORTED = [...HK_PROGRAMS].sort((a, b) =>
  a.university === b.university
    ? b.typical_ib - a.typical_ib
    : a.university.localeCompare(b.university),
);
const hkSearch = (p: (typeof HK_SORTED)[number], q: string) =>
  lc(p.university).includes(q) ||
  lc(p.program_name).includes(q) ||
  lc(p.field).includes(q);

function HkBuilder() {
  const { profileMeta } = useDashboard();
  const ff = useFieldFilter(
    HK_SORTED,
    fieldOf,
    profileMeta.faculties,
    programFieldsForFaculties,
  );
  const sel = useListSelection(
    ff.list,
    LIMITS.hkPrograms,
    (p) => p.id,
    hkSearch,
  );
  const [gradeStatus, setGradeStatus] = useState<"predicted" | "achieved">(
    "predicted",
  );
  const { busy, error, submit } = useListSubmit("HK");

  const run = () =>
    submit(async () => {
      const { saveHkList } = await import("@/app/dashboard/actions");
      return saveHkList(sel.selected, gradeStatus);
    });

  return (
    <ListBuilderShell
      sel={sel}
      placeholder="Search by university, program, or field…"
      cap={LIMITS.hkPrograms}
      countNoun="program"
      emptyMessage="Select at least one program to continue."
      busy={busy}
      error={error}
      onCta={run}
      controls={
        <>
          <FieldFilter ff={ff} faculties={profileMeta.faculties} />
          <GradeStatusField
            value={gradeStatus}
            onChange={setGradeStatus}
            className="max-w-md"
          />
        </>
      }
      card={(p) => ({
        title: p.university,
        subtitle: p.program_name,
        meta: [
          `Typical IB ~${p.typical_ib}`,
          p.interview_required ? "Interview" : "No interview",
        ],
        note: p.notes,
      })}
    />
  );
}

// ── UAE ───────────────────────────────────────────────────────────────────────
const AE_SORTED = [...UAE_PROGRAMS].sort((a, b) =>
  a.university === b.university
    ? b.typical_sat - a.typical_sat
    : a.university.localeCompare(b.university),
);
const aeSearch = (p: (typeof AE_SORTED)[number], q: string) =>
  lc(p.university).includes(q) ||
  lc(p.program_name).includes(q) ||
  lc(p.field).includes(q) ||
  lc(p.emirate).includes(q);

function UaeBuilder() {
  const { profileMeta } = useDashboard();
  const ff = useFieldFilter(
    AE_SORTED,
    fieldOf,
    profileMeta.faculties,
    programFieldsForFaculties,
  );
  const sel = useListSelection(
    ff.list,
    LIMITS.uaePrograms,
    (p) => p.id,
    aeSearch,
  );
  const [gradeStatus, setGradeStatus] = useState<"predicted" | "achieved">(
    "predicted",
  );
  const { busy, error, submit } = useListSubmit("AE");

  const run = () =>
    submit(async () => {
      const { saveUaeList } = await import("@/app/dashboard/actions");
      return saveUaeList(sel.selected, gradeStatus);
    });

  return (
    <ListBuilderShell
      sel={sel}
      placeholder="Search by university, program, field, or emirate…"
      cap={LIMITS.uaePrograms}
      countNoun="program"
      emptyMessage="Select at least one program to continue."
      busy={busy}
      error={error}
      onCta={run}
      controls={
        <>
          <FieldFilter ff={ff} faculties={profileMeta.faculties} />
          <GradeStatusField
            value={gradeStatus}
            onChange={setGradeStatus}
            className="max-w-md"
          />
        </>
      }
      card={(p) => ({
        title: p.university,
        subtitle: `${p.program_name} · ${p.emirate}`,
        meta: [
          `Typical SAT ~${p.typical_sat}`,
          p.need_blind
            ? "Need-blind"
            : p.interview_required
              ? "Interview"
              : "No interview",
        ],
        note: p.notes,
      })}
    />
  );
}

// ── South Korea ───────────────────────────────────────────────────────────────
const KR_SORTED = [...KOREA_PROGRAMS].sort((a, b) =>
  a.university === b.university
    ? b.typical_gpa_percent - a.typical_gpa_percent
    : a.university.localeCompare(b.university),
);
const krSearch = (p: (typeof KR_SORTED)[number], q: string) =>
  lc(p.university).includes(q) ||
  lc(p.program_name).includes(q) ||
  lc(p.field).includes(q) ||
  lc(p.city).includes(q);

const TOPIK_LEVELS = [0, 1, 2, 3, 4, 5, 6] as const;

function KoreaBuilder() {
  const { profileMeta } = useDashboard();
  const ff = useFieldFilter(
    KR_SORTED,
    fieldOf,
    profileMeta.faculties,
    programFieldsForFaculties,
  );
  const sel = useListSelection(
    ff.list,
    LIMITS.krPrograms,
    (p) => p.id,
    krSearch,
  );
  const [gradeStatus, setGradeStatus] = useState<"predicted" | "achieved">(
    "predicted",
  );
  const [topik, setTopik] = useState<number>(0);
  const { busy, error, submit } = useListSubmit("KR");

  const run = () =>
    submit(async () => {
      const { saveKoreaList } = await import("@/app/dashboard/actions");
      return saveKoreaList(
        sel.selected,
        gradeStatus,
        topik > 0 ? topik : undefined,
      );
    });

  return (
    <ListBuilderShell
      sel={sel}
      placeholder="Search by university, program, field, or city…"
      cap={LIMITS.krPrograms}
      countNoun="program"
      emptyMessage="Select at least one program to continue."
      busy={busy}
      error={error}
      onCta={run}
      controls={
        <>
          <FieldFilter ff={ff} faculties={profileMeta.faculties} />
          <div className="grid gap-4 sm:grid-cols-2">
            <GradeStatusField value={gradeStatus} onChange={setGradeStatus} />
            <div>
              <span className="text-sm font-medium text-ink">
                Your TOPIK level
              </span>
              <p className="mb-2 text-xs text-ink-soft">
                Korean-taught programs require TOPIK as an eligibility document,
                and it directly changes your read.
              </p>
              <div className="flex flex-wrap gap-2">
                {TOPIK_LEVELS.map((lv) => {
                  const on = topik === lv;
                  return (
                    <button
                      key={lv}
                      type="button"
                      onClick={() => setTopik(lv)}
                      aria-pressed={on}
                      className={`min-h-[44px] min-w-[52px] rounded-xl border px-3 py-3 text-sm font-medium transition-colors focus-visible:focus-ring ${
                        on
                          ? "border-accent bg-accent-soft text-ink"
                          : "border-line bg-card text-ink-soft hover:border-ink/30"
                      }`}
                    >
                      {lv === 0 ? "None" : lv}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </>
      }
      card={(p) => ({
        title: p.university,
        subtitle: `${p.program_name} · ${p.city}`,
        meta: [
          `Typical GPA ~${p.typical_gpa_percent}%`,
          p.topik_required != null
            ? `TOPIK ${p.topik_required}+`
            : "English-taught",
          ...(p.auto_full_scholarship ? ["Full ride for admits"] : []),
        ],
        note: p.notes,
      })}
    />
  );
}
