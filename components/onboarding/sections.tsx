"use client";

import { useOnboardingContext } from "./context/OnboardingContext";
import {
  TextField,
  NumberField,
  SelectField,
  MultiSelectField,
  OptionGrid,
  FieldShell,
  Label,
} from "./fields";
import { COUNTRIES } from "@/lib/data/countries";
import { FACULTIES } from "@/lib/data/faculties";
import { CURRICULA, emptyActivity, emptyHonor, HONOR_LEVELS } from "@/lib/types";
import { DESTINATIONS, AVAILABLE_DESTINATION_CODES } from "@/lib/data/destinations";
import { Flag } from "@/components/ui/Flag";
import { LIMITS } from "@/lib/limits";
import { useT } from "@/lib/i18n/client";

// ── 1. General ────────────────────────────────────────────────────────────────
export function GeneralSection() {
  const t = useT();
  const { data, updateField, updateFields } = useOnboardingContext();

  // Compact card labels: "United States" truncates in the 2-column grid, so the
  // long names get a short form here (the full name still shows everywhere else).
  const SHORT_DEST_LABEL: Partial<Record<(typeof AVAILABLE_DESTINATION_CODES)[number], string>> = {
    US: "USA",
    KR: "Korea",
  };
  const destOptions = AVAILABLE_DESTINATION_CODES.map((code) => {
    const d = DESTINATIONS.find((x) => x.code === code)!;
    return {
      value: code,
      label: SHORT_DEST_LABEL[code] ?? t(d.labelKey),
      icon: <Flag code={code} size={16} />,
    };
  });

  // Graduation-year choices: this year through +6 (covers roughly grades 7–12),
  // so the timeline can target the student's actual application cycle.
  const thisYear = new Date().getFullYear();
  const gradYearOptions = Array.from({ length: 7 }, (_, i) => {
    const y = String(thisYear + i);
    return { value: y, label: y };
  });

  // School systems differ in length (11 grades in Kazakhstan/Russia, 12 in the
  // US, 13 in Italy/Germany), so "grade 10" means a different distance from
  // graduation depending on the system — this asks for the total.
  const schoolYearsOptions = [10, 11, 12, 13].map((y) => ({
    value: String(y),
    label: `${y} grades`,
  }));

  return (
    <div className="grid gap-x-10 gap-y-6 sm:grid-cols-2">
      <SelectField
        id="citizenship"
        label="Citizenship"
        value={data.citizenship}
        onChange={(v) => updateFields({ citizenship: v, country: v })}
        placeholder="Select your citizenship"
        options={COUNTRIES.map((c) => ({ value: c, label: c }))}
      />

      <SelectField
        id="graduation_year"
        label="High-school graduation year"
        value={data.graduation_year ? String(data.graduation_year) : ""}
        onChange={(v) => updateField("graduation_year", v ? Number(v) : undefined)}
        placeholder="Select your graduation year"
        options={gradYearOptions}
        hint="When you'll finish school — we use it to time your SAT and deadlines."
      />

      <SelectField
        id="school_years"
        label="How many grades does your school system have?"
        value={data.school_years ? String(data.school_years) : ""}
        onChange={(v) => updateField("school_years", v ? Number(v) : undefined)}
        placeholder="Select the total number of grades"
        options={schoolYearsOptions}
        hint="E.g. 11 grades in Kazakhstan, 12 in the US, 13 in Italy — so we read your current grade correctly."
      />
      <OptionGrid
        label="Where do you want to study?"
        values={data.destinations}
        onChange={(v) => updateField("destinations", v as typeof data.destinations)}
        options={destOptions}
      />

      <MultiSelectField
        label="What major do you want to study?"
        placeholder="Select your fields"
        max={LIMITS.faculties}
        values={data.faculties}
        onChange={(v) => updateField("faculties", v as typeof data.faculties)}
        options={FACULTIES.map((f) => ({ value: f.value, label: t(f.labelKey) }))}
        hint={`Pick up to ${LIMITS.faculties}.`}
      />
    </div>
  );
}

// ── 2. Academics ──────────────────────────────────────────────────────────────
function composeGradesRaw(opts: {
  curriculum: string;
  gpa?: number;
  sat?: number;
  subjects?: string;
}): string {
  const parts: string[] = [];
  const cur = CURRICULA.find((c) => c.value === opts.curriculum)?.label;
  if (cur) parts.push(cur);
  if (opts.gpa != null) parts.push(`GPA ${opts.gpa}/4`);
  if (opts.sat != null) parts.push(`SAT ${opts.sat}`);
  if (opts.subjects) parts.push(opts.subjects);
  return parts.join(" · ");
}

export function AcademicsSection() {
  const { data, updateFields } = useOnboardingContext();

  // Keep grades.raw (required by the save schema) in sync with the structured
  // academic fields so the redesigned intake never produces an empty grades.raw.
  const syncGrades = (patch: {
    gpa?: number | undefined;
    sat?: number | undefined;
    ielts?: number | undefined;
    curriculum?: string;
    subjects?: string;
  }) => {
    const curriculum = patch.curriculum ?? data.curriculum;
    const gpa = "gpa" in patch ? patch.gpa : data.grades.gpa;
    const sat = "sat" in patch ? patch.sat : data.tests.SAT;
    const ielts = "ielts" in patch ? patch.ielts : data.tests.IELTS;
    const subjects = "subjects" in patch ? patch.subjects : data.tests.subjects;
    updateFields({
      curriculum: (curriculum as typeof data.curriculum) ?? "",
      grades: {
        ...data.grades,
        gpa,
        gpa_scale: gpa != null ? 4 : data.grades.gpa_scale,
        raw: composeGradesRaw({ curriculum, gpa, sat, subjects }),
      },
      tests: { ...data.tests, SAT: sat, IELTS: ielts, subjects },
    });
  };

  return (
    <div className="grid gap-x-10 gap-y-6 sm:grid-cols-2">
      <SelectField
        id="curriculum"
        label="Curriculum"
        value={data.curriculum}
        onChange={(v) => syncGrades({ curriculum: v })}
        placeholder="Select your curriculum"
        options={CURRICULA.map((c) => ({ value: c.value, label: c.label }))}
      />
      <NumberField
        id="gpa"
        label="GPA (out of 4)"
        value={data.grades.gpa}
        onChange={(v) => syncGrades({ gpa: v })}
        placeholder="e.g. 3.8"
        min={0}
        max={4}
        step={0.01}
      />
      <NumberField
        id="sat"
        label="SAT score"
        value={data.tests.SAT}
        onChange={(v) => syncGrades({ sat: v })}
        placeholder="e.g. 1520"
        min={400}
        max={1600}
        step={10}
      />
      <NumberField
        id="ielts"
        label="IELTS score"
        value={data.tests.IELTS}
        onChange={(v) => syncGrades({ ielts: v })}
        placeholder="e.g. 7.5"
        min={0}
        max={9}
        step={0.5}
      />
      <div className="sm:col-span-2">
        <TextField
          id="subjects"
          label="Subject tests"
          value={data.tests.subjects ?? ""}
          onChange={(v) => syncGrades({ subjects: v })}
          placeholder="e.g. AP Calculus BC 5, Physics C 5"
          maxLength={LIMITS.subjects}
          hint="Optional — list any subject / AP / SAT-subject results."
        />
      </div>
    </div>
  );
}

// ── 3. Activities ─────────────────────────────────────────────────────────────
export function ActivitiesSection() {
  const { data, updateField } = useOnboardingContext();
  const activities = data.activities.length ? data.activities : [emptyActivity()];

  const set = (i: number, patch: Partial<(typeof activities)[number]>) =>
    updateField(
      "activities",
      activities.map((a, idx) => (idx === i ? { ...a, ...patch } : a))
    );
  const add = () => updateField("activities", [...activities, emptyActivity()]);
  const remove = (i: number) =>
    updateField(
      "activities",
      activities.filter((_, idx) => idx !== i)
    );

  return (
    <div className="space-y-4">
      {activities.map((a, i) => (
        <div key={i} className="rounded-2xl border border-line bg-card p-5">
          <div className="mb-3 flex items-center justify-between">
            <span className="text-sm font-semibold text-ink">Activity {i + 1}</span>
            {activities.length > 1 && (
              <button
                type="button"
                onClick={() => remove(i)}
                className="text-sm text-ink-faint hover:text-reach"
              >
                Remove
              </button>
            )}
          </div>
          <div className="space-y-4">
            <div>
              <div className="flex items-baseline justify-between">
                <Label htmlFor={`pos-${i}`}>Position / role</Label>
                <span className="text-xs text-ink-faint">
                  {(a.position ?? "").length}/{LIMITS.activityPosition}
                </span>
              </div>
              <input
                id={`pos-${i}`}
                className="h-12 w-full rounded-xl border border-line bg-card px-4 text-[0.95rem] text-ink placeholder:text-ink-faint focus-visible:focus-ring hover:border-ink/20"
                value={a.position ?? ""}
                maxLength={LIMITS.activityPosition}
                placeholder="e.g. Co-founder, Team captain"
                onChange={(e) => set(i, { position: e.target.value })}
              />
            </div>
            <div>
              <div className="flex items-baseline justify-between">
                <Label htmlFor={`desc-${i}`}>Description</Label>
                <span className="text-xs text-ink-faint">
                  {(a.description ?? "").length}/{LIMITS.activityDescription}
                </span>
              </div>
              <textarea
                id={`desc-${i}`}
                className="min-h-[88px] w-full rounded-xl border border-line bg-card px-4 py-3 text-[0.95rem] text-ink placeholder:text-ink-faint focus-visible:focus-ring hover:border-ink/20"
                value={a.description ?? ""}
                maxLength={LIMITS.activityDescription}
                placeholder="What did you do, and what was the impact?"
                onChange={(e) => set(i, { description: e.target.value })}
              />
            </div>
          </div>
        </div>
      ))}
      {activities.length < LIMITS.activities && (
        <button
          type="button"
          onClick={add}
          className="flex h-12 w-full items-center justify-center gap-2 rounded-xl border border-dashed border-line text-sm font-medium text-ink-soft transition-colors hover:border-ink/30 hover:text-ink"
        >
          <span className="text-lg leading-none">+</span> Add activity
        </button>
      )}
    </div>
  );
}

// ── 4. Awards ─────────────────────────────────────────────────────────────────
export function AwardsSection() {
  const { data, updateField } = useOnboardingContext();
  const honors = data.honors;

  const set = (i: number, patch: Partial<(typeof honors)[number]>) =>
    updateField(
      "honors",
      honors.map((h, idx) => (idx === i ? { ...h, ...patch } : h))
    );
  const add = () => updateField("honors", [...honors, emptyHonor()]);
  const remove = (i: number) =>
    updateField(
      "honors",
      honors.filter((_, idx) => idx !== i)
    );
  const toggleLevel = (i: number, level: string) => {
    const cur = honors[i].levels ?? [];
    set(i, {
      levels: cur.includes(level) ? cur.filter((l) => l !== level) : [...cur, level],
    });
  };

  return (
    <div className="space-y-4">
      {honors.length === 0 && (
        <p className="text-sm text-ink-soft">
          Add any awards, honors, or recognitions — or skip if you have none yet.
        </p>
      )}
      {honors.map((h, i) => (
        <div key={i} className="rounded-2xl border border-line bg-card p-5">
          <div className="mb-3 flex items-center justify-between">
            <span className="text-sm font-semibold text-ink">Award {i + 1}</span>
            <button
              type="button"
              onClick={() => remove(i)}
              className="text-sm text-ink-faint hover:text-reach"
            >
              Remove
            </button>
          </div>
          <div className="space-y-4">
            <div>
              <div className="flex items-baseline justify-between">
                <Label htmlFor={`award-${i}`}>Title</Label>
                <span className="text-xs text-ink-faint">
                  {(h.title ?? "").length}/{LIMITS.honorTitle}
                </span>
              </div>
              <input
                id={`award-${i}`}
                className="h-12 w-full rounded-xl border border-line bg-card px-4 text-[0.95rem] text-ink placeholder:text-ink-faint focus-visible:focus-ring hover:border-ink/20"
                value={h.title ?? ""}
                maxLength={LIMITS.honorTitle}
                placeholder="e.g. National Olympiad — Gold Medal"
                onChange={(e) => set(i, { title: e.target.value })}
              />
            </div>
            <FieldShell label="Level of recognition">
              <div className="flex flex-wrap gap-2">
                {HONOR_LEVELS.map((level) => {
                  const on = (h.levels ?? []).includes(level);
                  return (
                    <button
                      key={level}
                      type="button"
                      aria-pressed={on}
                      onClick={() => toggleLevel(i, level)}
                      className={`rounded-full border px-3.5 py-2 text-sm transition-colors focus-visible:focus-ring ${
                        on
                          ? "border-accent bg-accent-soft text-accent-ink"
                          : "border-line bg-card text-ink-soft hover:border-ink/30"
                      }`}
                    >
                      {level}
                    </button>
                  );
                })}
              </div>
            </FieldShell>
          </div>
        </div>
      ))}
      {honors.length < LIMITS.honors && (
        <button
          type="button"
          onClick={add}
          className="flex h-12 w-full items-center justify-center gap-2 rounded-xl border border-dashed border-line text-sm font-medium text-ink-soft transition-colors hover:border-ink/30 hover:text-ink"
        >
          <span className="text-lg leading-none">+</span> Add award
        </button>
      )}
    </div>
  );
}

// ── 5. Budget ─────────────────────────────────────────────────────────────────
export function BudgetSection() {
  const { data, updateFields } = useOnboardingContext();
  return (
    <div className="max-w-md space-y-6">
      <NumberField
        id="budget"
        label="How much can your family pay per year? (USD)"
        value={data.budget_annual_usd}
        onChange={(v) =>
          updateFields({
            budget_annual_usd: v,
            // Mirror onto the existing aid signals the analysis already reads.
            needs_aid: v != null ? v < 30000 : data.needs_aid,
          })
        }
        placeholder="e.g. 25000"
        min={0}
        max={1000000}
        step={1000}
        hint="A rough yearly figure is fine — it helps us factor in affordability and aid."
      />
    </div>
  );
}
