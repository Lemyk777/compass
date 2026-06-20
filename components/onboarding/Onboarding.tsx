"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Logo } from "@/components/ui/Logo";
import { Button, ButtonLink } from "@/components/ui/Button";
import { Input, Field } from "@/components/ui/Input";
import { LanguageToggle } from "@/components/ui/LanguageToggle";
import {
  CURRICULA,
  ACTIVITY_TYPES,
  GRADE_LEVELS,
  ACTIVITY_TIMING,
  HONOR_LEVELS,
  emptyProfile,
  emptyActivity,
  emptyHonor,
  type Honor,
  type StudentProfileInput,
} from "@/lib/types";
import { LIMITS } from "@/lib/limits";
import { UNIVERSITY_NAMES } from "@/lib/data/universities";
import {
  ITALIAN_PROGRAMS,
  type ItalianProgram,
} from "@/lib/data/italian-universities";
import {
  DESTINATIONS,
  destinationLabelKey,
  type DestinationCode,
} from "@/lib/data/destinations";
import {
  FACULTIES,
  facultyLabelKey,
  italianFieldsForFaculties,
  type FacultyValue,
} from "@/lib/data/faculties";
import { saveProfile } from "@/app/onboarding/actions";
import { useT } from "@/lib/i18n/client";

// The intake is country-first: the chosen destinations decide which target
// steps appear, so the sequence is computed per profile rather than fixed.
type StepKey =
  | "origin"
  | "destinations"
  | "faculties"
  | "grades"
  | "tests"
  | "activities"
  | "honors"
  | "us"
  | "it"
  | "review";

const STEP_META: Record<StepKey, { title: string; sub: string }> = {
  origin: { title: "ob.tOrigin", sub: "ob.sOrigin" },
  destinations: { title: "ob.tDest", sub: "ob.sDest" },
  faculties: { title: "ob.tFac", sub: "ob.sFac" },
  grades: { title: "ob.t1", sub: "ob.s1" },
  tests: { title: "ob.t2", sub: "ob.s2" },
  activities: { title: "ob.t3", sub: "ob.s3" },
  honors: { title: "ob.tHonors", sub: "ob.sHonors" },
  us: { title: "ob.tUS", sub: "ob.sUS" },
  it: { title: "ob.tIT", sub: "ob.sIT" },
  review: { title: "ob.t5", sub: "ob.s5" },
};

function buildSteps(destinations: DestinationCode[]): StepKey[] {
  const wantsUS = destinations.includes("US");
  const wantsIT = destinations.includes("IT");
  return [
    "origin",
    "destinations",
    "faculties",
    "grades",
    "tests",
    "activities",
    "honors",
    ...(wantsUS ? (["us"] as StepKey[]) : []),
    ...(wantsIT ? (["it"] as StepKey[]) : []),
    "review",
  ];
}

export function Onboarding({
  initial,
  hasAnalysis,
}: {
  initial?: StudentProfileInput | null;
  hasAnalysis?: boolean;
}) {
  const t = useT();
  const router = useRouter();
  const [data, setData] = useState<StudentProfileInput>(
    initial ?? emptyProfile()
  );
  const [stepIndex, setStepIndex] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const set = <K extends keyof StudentProfileInput>(
    key: K,
    value: StudentProfileInput[K]
  ) => setData((d) => ({ ...d, [key]: value }));

  const steps = useMemo(() => buildSteps(data.destinations), [data.destinations]);
  const clampedIndex = Math.min(stepIndex, steps.length - 1);
  const stepKey = steps[clampedIndex];
  const last = clampedIndex === steps.length - 1;

  const goToKey = (key: StepKey) => {
    const i = steps.indexOf(key);
    if (i !== -1) setStepIndex(i);
  };

  function validateStep(): string | null {
    switch (stepKey) {
      case "origin":
        if (!data.country.trim()) return t("ob.errCountry");
        if (!data.citizenship.trim()) return t("ob.errCitizenship");
        return null;
      case "destinations":
        if (data.destinations.length === 0) return t("ob.errDest");
        return null;
      case "faculties":
        if (data.faculties.length === 0) return t("ob.errFac");
        return null;
      case "grades":
        if (!data.curriculum) return t("ob.errCurriculum");
        if (!data.grades.raw.trim()) return t("ob.errGrades");
        return null;
      case "us":
        if (data.target_schools.length === 0) return t("ob.errSchools");
        return null;
      case "it":
        if ((data.italy_programs ?? []).length === 0)
          return t("ob.errItalyPrograms");
        return null;
      default:
        return null;
    }
  }

  function next() {
    const err = validateStep();
    if (err) {
      setError(err);
      return;
    }
    setError(null);
    setStepIndex(() => Math.min(clampedIndex + 1, steps.length - 1));
  }

  function back() {
    setError(null);
    setStepIndex(() => Math.max(clampedIndex - 1, 0));
  }

  async function submit() {
    setSaving(true);
    setError(null);
    const res = await saveProfile(data);
    if (!res.ok) {
      setError(res.error);
      setSaving(false);
      return;
    }
    router.push("/dashboard?analyze=1");
  }

  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col px-5 pb-8">
      <header className="flex items-center justify-between py-5">
        <Logo className="text-ink" />
        <div className="flex items-center gap-1.5">
          <LanguageToggle />
          <ButtonLink href="/ambassador" variant="ghost" size="sm">
            {t("common.areYouAmbassador")}
          </ButtonLink>
        </div>
      </header>

      {/* Progress */}
      <div className="mb-1.5 flex justify-end">
        <span data-num className="text-xs text-ink-faint">
          {t("ob.step")} {clampedIndex + 1} {t("ob.of")} {steps.length}
        </span>
      </div>
      <div className="mb-6 flex gap-1.5" aria-hidden="true">
        {steps.map((_, i) => (
          <div
            key={i}
            className={`h-1.5 flex-1 rounded-full transition-colors ${
              i <= clampedIndex ? "bg-accent" : "bg-line"
            }`}
          />
        ))}
      </div>

      <div className="flex-1 relative overflow-x-hidden">
        <AnimatePresence mode="wait">
          <motion.div
            key={clampedIndex}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
          >
            <h1 className="text-2xl font-semibold tracking-tight text-ink">
              {t(STEP_META[stepKey].title)}
            </h1>
            <p className="mb-6 mt-1 text-sm text-ink-soft">
              {t(STEP_META[stepKey].sub)}
            </p>

            {stepKey === "origin" && <StepOrigin data={data} set={set} />}
            {stepKey === "destinations" && <StepDestinations data={data} set={set} />}
            {stepKey === "faculties" && <StepFaculties data={data} set={set} />}
            {stepKey === "grades" && <StepGrades data={data} set={set} />}
            {stepKey === "tests" && <StepTests data={data} set={set} />}
            {stepKey === "activities" && <StepActivities data={data} set={set} />}
            {stepKey === "honors" && <StepHonors data={data} set={set} />}
            {stepKey === "us" && <StepUSTargets data={data} set={set} />}
            {stepKey === "it" && <StepItalyTargets data={data} set={set} />}
            {stepKey === "review" && <StepReview data={data} goToKey={goToKey} />}
          </motion.div>
        </AnimatePresence>
      </div>

      {error && (
        <p role="alert" className="mt-4 rounded-lg bg-reach-soft px-3 py-2 text-sm text-reach">
          {error}
        </p>
      )}

      <div className="sticky bottom-0 mt-6 flex gap-3 bg-surface py-4">
        {clampedIndex > 0 && (
          <Button variant="subtle" size="lg" onClick={back} disabled={saving}>
            {t("common.back")}
          </Button>
        )}
        {!last ? (
          <Button size="lg" className="flex-1" onClick={next}>
            {t("common.continue")}
          </Button>
        ) : (
          <Button size="lg" className="flex-1" onClick={submit} disabled={saving}>
            {saving
              ? t("ob.saving")
              : hasAnalysis
                ? t("ob.saveReanalyze")
                : t("ob.seeStanding")}
          </Button>
        )}
      </div>
    </main>
  );
}

type StepProps = {
  data: StudentProfileInput;
  set: <K extends keyof StudentProfileInput>(
    key: K,
    value: StudentProfileInput[K]
  ) => void;
};

// ── Step 1: Origin ──────────────────────────────────────────────────────────
function StepOrigin({ data, set }: StepProps) {
  const t = useT();
  return (
    <div className="space-y-4">
      <Field label={t("ob.country")} htmlFor="country">
        <Input
          id="country"
          value={data.country}
          maxLength={LIMITS.shortText}
          onChange={(e) => set("country", e.target.value)}
          placeholder={t("ob.countryPh")}
        />
      </Field>
      <Field label={t("ob.citizenship")} htmlFor="citizenship">
        <Input
          id="citizenship"
          value={data.citizenship}
          maxLength={LIMITS.shortText}
          onChange={(e) => set("citizenship", e.target.value)}
          placeholder={t("ob.countryPh")}
        />
      </Field>
    </div>
  );
}

// ── Step 2: Destinations ────────────────────────────────────────────────────
function StepDestinations({ data, set }: StepProps) {
  const t = useT();
  const selected = data.destinations;
  const toggle = (code: DestinationCode) =>
    set(
      "destinations",
      selected.includes(code)
        ? selected.filter((c) => c !== code)
        : [...selected, code]
    );

  return (
    <div className="grid grid-cols-2 gap-3">
      {DESTINATIONS.map((d) => {
        const on = selected.includes(d.code);
        const disabled = !d.available;
        return (
          <button
            key={d.code}
            type="button"
            disabled={disabled}
            aria-pressed={on}
            onClick={() => toggle(d.code)}
            className={`relative flex flex-col items-start gap-2 rounded-2xl border p-4 text-left transition-colors focus-visible:focus-ring ${
              disabled
                ? "cursor-not-allowed border-line bg-card opacity-50"
                : on
                  ? "border-accent bg-accent-soft"
                  : "border-line bg-card hover:border-ink/30"
            }`}
          >

            <span className="text-sm font-medium text-ink">
              {t(d.labelKey)}
            </span>
            {disabled ? (
              <span className="absolute right-3 top-3 rounded-full bg-line px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-ink-faint">
                {t("dest.soon")}
              </span>
            ) : (
              on && (
                <span className="absolute right-3 top-3 text-accent">
                  <Check />
                </span>
              )
            )}
          </button>
        );
      })}
    </div>
  );
}

// ── Step 3: Faculties ───────────────────────────────────────────────────────
function StepFaculties({ data, set }: StepProps) {
  const t = useT();
  const selected = data.faculties;
  const atCap = selected.length >= LIMITS.faculties;
  const toggle = (v: FacultyValue) => {
    if (selected.includes(v)) {
      set("faculties", selected.filter((x) => x !== v));
    } else if (!atCap) {
      set("faculties", [...selected, v]);
    }
  };

  return (
    <div className="space-y-5">
      <div>
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
                className={`rounded-full border px-3.5 py-2 text-sm transition-colors focus-visible:focus-ring ${
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
      </div>

      <Field label={t("ob.major")} htmlFor="major" hint={t("ob.majorHint")}>
        <Input
          id="major"
          value={data.intended_major}
          maxLength={LIMITS.shortText}
          onChange={(e) => set("intended_major", e.target.value)}
          placeholder={t("ob.majorPh")}
        />
      </Field>
    </div>
  );
}

function StepGrades({ data, set }: StepProps) {
  const t = useT();
  return (
    <div className="space-y-4">
      <Field label={t("ob.curriculum")}>
        <div className="grid grid-cols-1 gap-2">
          {CURRICULA.map((c) => (
            <button
              key={c.value}
              type="button"
              onClick={() => set("curriculum", c.value)}
              className={`flex items-center justify-between rounded-xl border px-4 py-3 text-left text-sm transition-colors focus-visible:focus-ring ${
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
      </Field>

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
            set("grades", { ...data.grades, raw: e.target.value })
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
              set("grades", {
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
              set("grades", { ...data.grades, gpa: numOrUndef(e.target.value) })
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
              set("grades", {
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

function StepTests({ data, set }: StepProps) {
  const tr = useT();
  const t = data.tests;
  const upd = (k: keyof typeof t, v: number | string | undefined) =>
    set("tests", { ...t, [k]: v });
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

const selectClass =
  "h-11 w-full rounded-xl border border-line bg-card px-3 text-[0.95rem] text-ink focus-visible:focus-ring";
const textareaClass =
  "w-full rounded-xl border border-line bg-card px-3.5 py-2.5 text-sm text-ink placeholder:text-ink-faint focus-visible:focus-ring";

function toggleIn(arr: string[] | undefined, v: string): string[] {
  const cur = arr ?? [];
  return cur.includes(v) ? cur.filter((x) => x !== v) : [...cur, v];
}

function MiniLabel({ children }: { children: string }) {
  return (
    <span className="mb-1 block text-xs font-medium text-ink-faint">
      {children}
    </span>
  );
}

function ChipGroup({
  options,
  selected,
  onToggle,
}: {
  options: readonly string[];
  selected: string[];
  onToggle: (v: string) => void;
}) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {options.map((o) => {
        const on = selected.includes(o);
        return (
          <button
            key={o}
            type="button"
            aria-pressed={on}
            onClick={() => onToggle(o)}
            className={`rounded-full border px-2.5 py-1 text-xs transition-colors focus-visible:focus-ring ${
              on
                ? "border-accent bg-accent-soft text-accent-ink"
                : "border-line bg-card text-ink-soft hover:border-ink/30"
            }`}
          >
            {o}
          </button>
        );
      })}
    </div>
  );
}

function StepActivities({ data, set }: StepProps) {
  const t = useT();
  const acts = data.activities;
  const update = (i: number, patch: Partial<(typeof acts)[number]>) =>
    set(
      "activities",
      acts.map((a, idx) => (idx === i ? { ...a, ...patch } : a))
    );
  const add = () => set("activities", [...acts, emptyActivity()]);
  const remove = (i: number) =>
    set(
      "activities",
      acts.filter((_, idx) => idx !== i)
    );

  return (
    <div className="space-y-4">
      {acts.map((a, i) => (
        <div
          key={i}
          className="space-y-3 rounded-xl border border-line bg-card p-3.5 shadow-card"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-ink-faint">
              {t("ob.activity")} {i + 1}
            </span>
            {acts.length > 1 && (
              <button
                type="button"
                onClick={() => remove(i)}
                className="rounded px-1 text-xs text-ink-faint hover:text-reach focus-visible:focus-ring"
              >
                {t("ob.remove")}
              </button>
            )}
          </div>

          <div>
            <MiniLabel>{t("ob.activityType")}</MiniLabel>
            <select
              value={a.type ?? ""}
              onChange={(e) => update(i, { type: e.target.value })}
              className={selectClass}
            >
              <option value="">{t("ob.activityTypePh")}</option>
              {ACTIVITY_TYPES.map((ty) => (
                <option key={ty} value={ty}>
                  {ty}
                </option>
              ))}
            </select>
          </div>

          <div>
            <MiniLabel>{t("ob.position")}</MiniLabel>
            <Input
              value={a.position}
              maxLength={LIMITS.activityPosition}
              onChange={(e) => update(i, { position: e.target.value })}
              placeholder={t("ob.positionPh")}
            />
          </div>

          <div>
            <MiniLabel>{t("ob.organization")}</MiniLabel>
            <Input
              value={a.organization ?? ""}
              maxLength={LIMITS.activityOrganization}
              onChange={(e) => update(i, { organization: e.target.value })}
              placeholder={t("ob.organizationPh")}
            />
          </div>

          <div>
            <MiniLabel>{t("ob.activityDesc")}</MiniLabel>
            <textarea
              value={a.description ?? ""}
              maxLength={LIMITS.activityDescription}
              onChange={(e) => update(i, { description: e.target.value })}
              rows={2}
              placeholder={t("ob.activityDescPh")}
              className={textareaClass}
            />
          </div>

          <div>
            <MiniLabel>{t("ob.gradeLevels")}</MiniLabel>
            <ChipGroup
              options={GRADE_LEVELS}
              selected={a.grades ?? []}
              onToggle={(v) => update(i, { grades: toggleIn(a.grades, v) })}
            />
          </div>

          <div>
            <MiniLabel>{t("ob.timing")}</MiniLabel>
            <ChipGroup
              options={ACTIVITY_TIMING}
              selected={a.timing ?? []}
              onToggle={(v) => update(i, { timing: toggleIn(a.timing, v) })}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <MiniLabel>{t("ob.hoursWeek")}</MiniLabel>
              <Input
                type="number"
                inputMode="numeric"
                min={0}
                max={LIMITS.hoursPerWeek}
                value={a.hours_per_week ?? ""}
                onChange={(e) =>
                  update(i, { hours_per_week: numOrUndef(e.target.value) })
                }
                placeholder="e.g. 5"
              />
            </div>
            <div>
              <MiniLabel>{t("ob.weeksYear")}</MiniLabel>
              <Input
                type="number"
                inputMode="numeric"
                min={0}
                max={LIMITS.weeksPerYear}
                value={a.weeks_per_year ?? ""}
                onChange={(e) =>
                  update(i, { weeks_per_year: numOrUndef(e.target.value) })
                }
                placeholder="e.g. 30"
              />
            </div>
          </div>

          <label className="flex items-center justify-between">
            <span className="text-sm text-ink">{t("ob.continueCollege")}</span>
            <Toggle
              checked={a.continue_in_college ?? false}
              onChange={(v) => update(i, { continue_in_college: v })}
            />
          </label>
        </div>
      ))}
      {acts.length < LIMITS.activities && (
        <Button variant="subtle" onClick={add} className="w-full">
          {t("ob.addActivity")}
        </Button>
      )}
    </div>
  );
}

function StepHonors({ data, set }: StepProps) {
  const t = useT();
  const honors = data.honors ?? [];
  const update = (i: number, patch: Partial<Honor>) =>
    set(
      "honors",
      honors.map((h, idx) => (idx === i ? { ...h, ...patch } : h))
    );
  const add = () => set("honors", [...honors, emptyHonor()]);
  const remove = (i: number) =>
    set(
      "honors",
      honors.filter((_, idx) => idx !== i)
    );

  return (
    <div className="space-y-4">
      {honors.length === 0 && (
        <p className="rounded-xl border border-dashed border-line bg-card px-4 py-6 text-center text-sm text-ink-faint">
          {t("ob.honorsEmpty")}
        </p>
      )}
      {honors.map((h, i) => (
        <div
          key={i}
          className="space-y-3 rounded-xl border border-line bg-card p-3.5 shadow-card"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-ink-faint">
              {t("ob.honor")} {i + 1}
            </span>
            <button
              type="button"
              onClick={() => remove(i)}
              className="rounded px-1 text-xs text-ink-faint hover:text-reach focus-visible:focus-ring"
            >
              {t("ob.remove")}
            </button>
          </div>

          <div>
            <MiniLabel>{t("ob.honorTitle")}</MiniLabel>
            <Input
              value={h.title}
              maxLength={LIMITS.honorTitle}
              onChange={(e) => update(i, { title: e.target.value })}
              placeholder={t("ob.honorTitlePh")}
            />
          </div>

          <div>
            <MiniLabel>{t("ob.gradeLevels")}</MiniLabel>
            <ChipGroup
              options={GRADE_LEVELS}
              selected={h.grades ?? []}
              onToggle={(v) => update(i, { grades: toggleIn(h.grades, v) })}
            />
          </div>

          <div>
            <MiniLabel>{t("ob.honorLevels")}</MiniLabel>
            <ChipGroup
              options={HONOR_LEVELS}
              selected={h.levels ?? []}
              onToggle={(v) => update(i, { levels: toggleIn(h.levels, v) })}
            />
          </div>
        </div>
      ))}
      {honors.length < LIMITS.honors && (
        <Button variant="subtle" onClick={add} className="w-full">
          {t("ob.addHonor")}
        </Button>
      )}
    </div>
  );
}

// ── Target step: US universities ────────────────────────────────────────────
function StepUSTargets({ data, set }: StepProps) {
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
    if (!selected.includes(name) && selected.length < LIMITS.targetSchools)
      set("target_schools", [...selected, name]);
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
                  set(
                    "target_schools",
                    selected.filter((x) => x !== s)
                  )
                }
                aria-label={`Remove ${s}`}
                className="text-white/70 hover:text-white focus-visible:focus-ring"
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
            <p className="px-4 py-3 text-sm text-ink-faint">
              {t("ob.noMatches")}
            </p>
          ) : (
            suggestions.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => addSchool(s)}
                className="block w-full border-b border-line px-4 py-2.5 text-left text-sm text-ink last:border-0 hover:bg-accent-soft focus-visible:focus-ring"
              >
                {s}
              </button>
            ))
          )}
        </div>
      )}

      <label className="flex items-center justify-between rounded-xl border border-line bg-card px-4 py-3">
        <span className="text-sm text-ink">{t("ob.needAid")}</span>
        <Toggle checked={data.needs_aid} onChange={(v) => set("needs_aid", v)} />
      </label>
    </div>
  );
}

// ── Target step: Italian programs (pre-filtered by chosen faculties) ─────────
function StepItalyTargets({ data, set }: StepProps) {
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
      // No query: pre-filter to the fields implied by the chosen faculties.
      return fields.length === 0 || fields.includes(p.field);
    }).slice(0, 6);
  }, [italyQuery, selectedItaly, facultyKey]);

  const addItalyProgram = (id: string) => {
    if (!selectedItaly.includes(id) && selectedItaly.length < 8)
      set("italy_programs", [...selectedItaly, id]);
    setItalyQuery("");
  };

  const removeItalyProgram = (id: string) =>
    set("italy_programs", selectedItaly.filter((x) => x !== id));

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
                className="flex items-start justify-between gap-3 rounded-xl border border-line bg-card px-4 py-3"
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
                  className="shrink-0 rounded px-1 text-xs text-ink-faint hover:text-reach focus-visible:focus-ring"
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
                <p className="px-4 py-3 text-sm text-ink-faint">
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
                    className="block w-full border-b border-line px-4 py-2.5 text-left last:border-0 hover:bg-accent-soft focus-visible:focus-ring"
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
            <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-sm text-ink-faint">
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
                set("italy_family_income", numOrUndef(e.target.value))
              }
              placeholder={t("ob.italyIncomePh")}
              className="pl-8"
            />
          </div>
          <button
            type="button"
            onClick={() => set("italy_family_income", undefined)}
            className="rounded-xl border border-line bg-card px-3 text-sm text-ink-soft transition-colors hover:border-ink/30 hover:text-ink focus-visible:focus-ring"
          >
            {t("ob.italyIncomeSkip")}
          </button>
        </div>
      </Field>
    </div>
  );
}

function StepReview({
  data,
  goToKey,
}: {
  data: StudentProfileInput;
  goToKey: (key: StepKey) => void;
}) {
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

  const rows: { label: string; value: string; step: StepKey }[] = [
    { label: t("ob.rCountry"), value: data.country || "—", step: "origin" },
    {
      label: t("ob.rCitizenship"),
      value: data.citizenship || "—",
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
  ];

  return (
    <div className="divide-y divide-line rounded-xl border border-line bg-card">
      {rows.map((r) => (
        <div key={r.label} className="flex items-start gap-3 px-4 py-3">
          <span className="w-28 shrink-0 text-xs font-medium text-ink-faint">
            {r.label}
          </span>
          <span className="flex-1 text-sm text-ink">{r.value}</span>
          <button
            type="button"
            onClick={() => goToKey(r.step)}
            className="rounded text-xs font-medium text-accent hover:underline focus-visible:focus-ring"
          >
            {t("ob.edit")}
          </button>
        </div>
      ))}
    </div>
  );
}

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
        checked ? "bg-accent" : "bg-line"
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
