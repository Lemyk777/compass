"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Logo } from "@/components/ui/Logo";
import { Button } from "@/components/ui/Button";
import { Input, Field } from "@/components/ui/Input";
import { CURRICULA, emptyProfile, type StudentProfileInput } from "@/lib/types";
import { UNIVERSITY_NAMES } from "@/lib/data/universities";
import { saveProfile } from "@/app/onboarding/actions";

const STEPS = ["You", "Grades", "Tests", "Activities", "Schools", "Review"];

export function Onboarding({
  initial,
  hasAnalysis,
}: {
  initial?: StudentProfileInput | null;
  hasAnalysis?: boolean;
}) {
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
        if (!data.country.trim()) return "Tell us your country.";
        if (!data.citizenship.trim()) return "Add your citizenship.";
        if (!data.intended_major.trim()) return "What do you want to study?";
        return null;
      case 1:
        if (!data.curriculum) return "Pick your curriculum.";
        if (!data.grades.raw.trim()) return "Add your grades.";
        return null;
      case 4:
        if (data.target_schools.length === 0)
          return "Add at least one target school.";
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
        <span data-num className="text-sm text-ink-faint">
          Step {step + 1} of {STEPS.length}
        </span>
      </header>

      {/* Progress */}
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
          {TITLES[step].title}
        </h1>
        <p className="mb-6 mt-1 text-sm text-ink-soft">{TITLES[step].sub}</p>

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
            Back
          </Button>
        )}
        {!last ? (
          <Button size="lg" className="flex-1" onClick={next}>
            Continue
          </Button>
        ) : (
          <Button size="lg" className="flex-1" onClick={submit} disabled={saving}>
            {saving ? "Saving…" : hasAnalysis ? "Save & re-analyze" : "See my standing"}
          </Button>
        )}
      </div>
    </main>
  );
}

const TITLES = [
  { title: "About you", sub: "Where you're from and what you want to study." },
  { title: "Your grades", sub: "We adapt to your curriculum — no conversions needed." },
  { title: "Test scores", sub: "Optional. Add what you have; skip the rest." },
  { title: "Activities", sub: "Your strongest few. Depth beats a long list." },
  { title: "Target schools", sub: "Pick the US schools you're aiming at." },
  { title: "Review", sub: "Check it over, then see where you stand." },
];

type StepProps = {
  data: StudentProfileInput;
  set: <K extends keyof StudentProfileInput>(
    key: K,
    value: StudentProfileInput[K]
  ) => void;
};

function StepYou({ data, set }: StepProps) {
  return (
    <div className="space-y-4">
      <Field label="Country you live in" htmlFor="country">
        <Input
          id="country"
          value={data.country}
          onChange={(e) => set("country", e.target.value)}
          placeholder="e.g. Kazakhstan"
        />
      </Field>
      <Field label="Citizenship" htmlFor="citizenship">
        <Input
          id="citizenship"
          value={data.citizenship}
          onChange={(e) => set("citizenship", e.target.value)}
          placeholder="e.g. Kazakhstan"
        />
      </Field>
      <Field label="Intended major" htmlFor="major">
        <Input
          id="major"
          value={data.intended_major}
          onChange={(e) => set("intended_major", e.target.value)}
          placeholder="e.g. Finance / Business"
        />
      </Field>
    </div>
  );
}

function StepGrades({ data, set }: StepProps) {
  return (
    <div className="space-y-4">
      <Field label="Curriculum">
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
              {c.label}
              {data.curriculum === c.value && <Check />}
            </button>
          ))}
        </div>
      </Field>

      <Field
        label="Your grades"
        htmlFor="grades"
        hint={gradeHint(data.curriculum)}
      >
        <textarea
          id="grades"
          value={data.grades.raw}
          onChange={(e) =>
            set("grades", { ...data.grades, raw: e.target.value })
          }
          rows={3}
          placeholder={gradePlaceholder(data.curriculum)}
          className="w-full rounded-xl border border-line bg-card px-3.5 py-2.5 text-[0.95rem] text-ink placeholder:text-ink-faint focus-visible:focus-ring"
        />
      </Field>

      {data.curriculum === "IB" && (
        <Field label="Predicted/actual IB total (optional)" htmlFor="ib">
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
        <Field label="GPA (optional)" htmlFor="gpa">
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
        <Field label="Average % (optional)" htmlFor="pct">
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
      <Field label="Subject tests / APs (optional)" htmlFor="subj">
        <Input
          id="subj"
          value={t.subjects ?? ""}
          onChange={(e) => upd("subjects", e.target.value || undefined)}
          placeholder="e.g. AP Calculus BC 5, AP Econ 5"
        />
      </Field>
    </div>
  );
}

function StepActivities({ data, set }: StepProps) {
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
              Activity {i + 1}
            </span>
            {acts.length > 1 && (
              <button
                type="button"
                onClick={() => remove(i)}
                className="rounded px-1 text-xs text-ink-faint hover:text-reach focus-visible:focus-ring"
              >
                Remove
              </button>
            )}
          </div>
          <Input
            value={a.title}
            onChange={(e) => update(i, { title: e.target.value })}
            placeholder="e.g. Co-founded an AI startup"
            className="mb-2"
          />
          <textarea
            value={a.detail ?? ""}
            onChange={(e) => update(i, { detail: e.target.value })}
            rows={2}
            placeholder="Impact, scale, your role, recognition…"
            className="w-full rounded-xl border border-line bg-card px-3.5 py-2.5 text-sm text-ink placeholder:text-ink-faint focus-visible:focus-ring"
          />
        </div>
      ))}
      <Button variant="subtle" onClick={add} className="w-full">
        + Add another
      </Button>
    </div>
  );
}

function StepSchools({ data, set }: StepProps) {
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

      <Field label="Search US universities" htmlFor="school-search">
        <Input
          id="school-search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Start typing a school name…"
        />
      </Field>

      {(query !== "" || selected.length === 0) && (
        <div className="overflow-hidden rounded-xl border border-line bg-card">
          {suggestions.length === 0 ? (
            <p className="px-4 py-3 text-sm text-ink-faint">
              No matches. You can still type your list later.
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
        <span className="text-sm text-ink">I&apos;ll need financial aid</span>
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
  const rows: { label: string; value: string; step: number }[] = [
    { label: "Country", value: data.country || "—", step: 0 },
    { label: "Citizenship", value: data.citizenship || "—", step: 0 },
    { label: "Major", value: data.intended_major || "—", step: 0 },
    {
      label: "Curriculum",
      value:
        CURRICULA.find((c) => c.value === data.curriculum)?.label || "—",
      step: 1,
    },
    { label: "Grades", value: data.grades.raw || "—", step: 1 },
    { label: "Tests", value: testSummary(data) || "—", step: 2 },
    {
      label: "Activities",
      value: `${data.activities.filter((a) => a.title.trim()).length} added`,
      step: 3,
    },
    {
      label: "Target schools",
      value: data.target_schools.join(", ") || "—",
      step: 4,
    },
    { label: "Needs aid", value: data.needs_aid ? "Yes" : "No", step: 4 },
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
            Edit
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

function gradeHint(c: StudentProfileInput["curriculum"]) {
  switch (c) {
    case "IB":
      return "Subjects with HL/SL and predicted or final scores.";
    case "A-Level":
      return "Subjects with grades; note if predicted.";
    case "US-GPA":
      return "Weighted/unweighted, plus AP/honors load.";
    case "national":
      return "Your average and the grading scale.";
    default:
      return "Describe your grades however your system works.";
  }
}

function gradePlaceholder(c: StudentProfileInput["curriculum"]) {
  switch (c) {
    case "IB":
      return "e.g. HL Math 7, HL Econ 6, HL English 6, predicted 41/45";
    case "A-Level":
      return "e.g. A*A*A in Math, Economics, Business (predicted)";
    case "US-GPA":
      return "e.g. 3.95 UW / 4.5 W, 8 APs";
    case "national":
      return "e.g. 95% average (national curriculum, out of 100)";
    default:
      return "Describe your grades…";
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
