"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Logo } from "@/components/ui/Logo";
import { Button, ButtonLink } from "@/components/ui/Button";
import { Input, Field } from "@/components/ui/Input";
import { LanguageToggle } from "@/components/ui/LanguageToggle";
import { CURRICULA, emptyProfile, type StudentProfileInput } from "@/lib/types";
import { LIMITS } from "@/lib/limits";
import { UNIVERSITY_NAMES } from "@/lib/data/universities";
import { saveProfile } from "@/app/onboarding/actions";
import { useT } from "@/lib/i18n/client";

const STEPS = ["You", "Grades", "Tests", "Activities", "Schools", "Review"];

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
  const [step, setStep] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const set = <K extends keyof StudentProfileInput>(
    key: K,
    value: StudentProfileInput[K]
  ) => setData((d) => ({ ...d, [key]: value }));

  const last = step === STEPS.length - 1;

  function validateStep(): string | null {
    switch (step) {
      case 0:
        if (!data.country.trim()) return t("ob.errCountry");
        if (!data.citizenship.trim()) return t("ob.errCitizenship");
        if (!data.intended_major.trim()) return t("ob.errMajor");
        return null;
      case 1:
        if (!data.curriculum) return t("ob.errCurriculum");
        if (!data.grades.raw.trim()) return t("ob.errGrades");
        return null;
      case 4:
        if (data.target_schools.length === 0) return t("ob.errSchools");
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
    setStep((s) => Math.min(s + 1, STEPS.length - 1));
  }

  function back() {
    setError(null);
    setStep((s) => Math.max(s - 1, 0));
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
          {t("ob.step")} {step + 1} {t("ob.of")} {STEPS.length}
        </span>
      </div>
      <div className="mb-6 flex gap-1.5" aria-hidden="true">
        {STEPS.map((_, i) => (
          <div
            key={i}
            className={`h-1.5 flex-1 rounded-full transition-colors ${
              i <= step ? "bg-accent" : "bg-line"
            }`}
          />
        ))}
      </div>

      <div className="flex-1 animate-fade-up" key={step}>
        <h1 className="text-2xl font-semibold tracking-tight text-ink">
          {t(TITLES[step].title)}
        </h1>
        <p className="mb-6 mt-1 text-sm text-ink-soft">{t(TITLES[step].sub)}</p>

        {step === 0 && <StepYou data={data} set={set} />}
        {step === 1 && <StepGrades data={data} set={set} />}
        {step === 2 && <StepTests data={data} set={set} />}
        {step === 3 && <StepActivities data={data} set={set} />}
        {step === 4 && <StepSchools data={data} set={set} />}
        {step === 5 && <StepReview data={data} goTo={setStep} />}
      </div>

      {error && (
        <p role="alert" className="mt-4 rounded-lg bg-reach-soft px-3 py-2 text-sm text-reach">
          {error}
        </p>
      )}

      <div className="sticky bottom-0 mt-6 flex gap-3 bg-surface py-4">
        {step > 0 && (
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

const TITLES = [
  { title: "ob.t0", sub: "ob.s0" },
  { title: "ob.t1", sub: "ob.s1" },
  { title: "ob.t2", sub: "ob.s2" },
  { title: "ob.t3", sub: "ob.s3" },
  { title: "ob.t4", sub: "ob.s4" },
  { title: "ob.t5", sub: "ob.s5" },
];

type StepProps = {
  data: StudentProfileInput;
  set: <K extends keyof StudentProfileInput>(
    key: K,
    value: StudentProfileInput[K]
  ) => void;
};

function StepYou({ data, set }: StepProps) {
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
      <Field label={t("ob.major")} htmlFor="major">
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

function StepActivities({ data, set }: StepProps) {
  const t = useT();
  const acts = data.activities;
  const update = (i: number, patch: Partial<(typeof acts)[number]>) =>
    set(
      "activities",
      acts.map((a, idx) => (idx === i ? { ...a, ...patch } : a))
    );
  const add = () => set("activities", [...acts, { title: "", detail: "" }]);
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
          className="rounded-xl border border-line bg-card p-3.5 shadow-card"
        >
          <div className="mb-2 flex items-center justify-between">
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
          <Input
            value={a.title}
            maxLength={LIMITS.activityTitle}
            onChange={(e) => update(i, { title: e.target.value })}
            placeholder={t("ob.activityTitlePh")}
            className="mb-2"
          />
          <textarea
            value={a.detail ?? ""}
            maxLength={LIMITS.activityDetail}
            onChange={(e) => update(i, { detail: e.target.value })}
            rows={2}
            placeholder={t("ob.activityDetailPh")}
            className="w-full rounded-xl border border-line bg-card px-3.5 py-2.5 text-sm text-ink placeholder:text-ink-faint focus-visible:focus-ring"
          />
        </div>
      ))}
      {acts.length < LIMITS.activities && (
        <Button variant="subtle" onClick={add} className="w-full">
          {t("ob.addAnother")}
        </Button>
      )}
    </div>
  );
}

function StepSchools({ data, set }: StepProps) {
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
    if (!selected.includes(name) && selected.length < 12)
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

      <label className="mt-2 flex items-center justify-between rounded-xl border border-line bg-card px-4 py-3">
        <span className="text-sm text-ink">{t("ob.needAid")}</span>
        <Toggle
          checked={data.needs_aid}
          onChange={(v) => set("needs_aid", v)}
        />
      </label>
    </div>
  );
}

function StepReview({
  data,
  goTo,
}: {
  data: StudentProfileInput;
  goTo: (n: number) => void;
}) {
  const t = useT();
  const rows: { label: string; value: string; step: number }[] = [
    { label: t("ob.rCountry"), value: data.country || "—", step: 0 },
    { label: t("ob.rCitizenship"), value: data.citizenship || "—", step: 0 },
    { label: t("ob.rMajor"), value: data.intended_major || "—", step: 0 },
    {
      label: t("ob.rCurriculum"),
      value: data.curriculum ? t(`curr.${data.curriculum}`) : "—",
      step: 1,
    },
    { label: t("ob.rGrades"), value: data.grades.raw || "—", step: 1 },
    { label: t("ob.rTests"), value: testSummary(data) || "—", step: 2 },
    {
      label: t("ob.rActivities"),
      value: `${data.activities.filter((a) => a.title.trim()).length} ${t("ob.added")}`,
      step: 3,
    },
    {
      label: t("ob.rSchools"),
      value: data.target_schools.join(", ") || "—",
      step: 4,
    },
    {
      label: t("ob.rAid"),
      value: data.needs_aid ? t("ob.yes") : t("ob.no"),
      step: 4,
    },
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
            onClick={() => goTo(r.step)}
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
