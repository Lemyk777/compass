"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { Analysis } from "@/lib/ai/schema";
import { UNIVERSITIES } from "@/lib/data/universities";
import { earliestDeadlineHint } from "@/lib/data/app-deadlines";
import { ITALIAN_PROGRAMS } from "@/lib/data/italian-universities";
import { HK_PROGRAMS } from "@/lib/data/hk-universities";
import { UAE_PROGRAMS } from "@/lib/data/uae-universities";
import { KOREA_PROGRAMS } from "@/lib/data/korea-universities";
import { LIMITS } from "@/lib/limits";
import { Button } from "@/components/ui/Button";
import { useDashboard } from "@/components/dashboard/DashboardContext";
import { CountryTabs, NoAnalysisYet, PageHeader } from "@/components/dashboard/states";

type SaveResult = { ok: true } | { ok: false; error: string };

// The college list is now multi-country: which builder shows follows the active
// country tab (driven by the student's chosen destinations). Each builder saves
// that country's targets, then runs one re-analysis so its odds appear.
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

// ── Shared submit flow ────────────────────────────────────────────────────────
// Save this country's list, run one re-analysis, then land on its odds tab so the
// targets the student just picked are shown.
function useListSubmit(targetCountry: "US" | "IT" | "HK" | "AE" | "KR") {
  const router = useRouter();
  const { setAnalysis, setCountry, basePath, demo } = useDashboard();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (save: () => Promise<SaveResult>) => {
    setBusy(true);
    setError(null);
    try {
      setCountry(targetCountry);
      if (demo) {
        await new Promise((r) => setTimeout(r, 2600));
        router.push(`${basePath}/odds`);
        return;
      }
      const saved = await save();
      if (!saved.ok) throw new Error(saved.error);

      const res = await fetch("/api/analyze", { method: "POST" });
      const raw = await res.text();
      let data: { analysis?: Analysis; error?: string } | null = null;
      try {
        data = raw ? JSON.parse(raw) : null;
      } catch {
        data = null;
      }
      if (!res.ok || !data?.analysis) {
        throw new Error(
          data?.error || "We couldn't run your analysis. Please try again."
        );
      }
      setAnalysis(data.analysis);
      router.push(`${basePath}/odds`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
      setBusy(false);
    }
  };

  return { busy, error, submit };
}

// ── US ────────────────────────────────────────────────────────────────────────
const US_SORTED = [...UNIVERSITIES].sort(
  (a, b) => a.acceptance_rate - b.acceptance_rate
);

function UsBuilder() {
  const [selected, setSelected] = useState<string[]>([]);
  const [query, setQuery] = useState("");
  const { busy, error, submit } = useListSubmit("US");

  const atCap = selected.length >= LIMITS.targetSchools;
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return US_SORTED;
    return US_SORTED.filter((u) => u.name.toLowerCase().includes(q));
  }, [query]);

  const toggle = (name: string) =>
    setSelected((cur) =>
      cur.includes(name)
        ? cur.filter((n) => n !== name)
        : atCap
          ? cur
          : [...cur, name]
    );

  const run = () =>
    submit(async () => {
      const { saveCollegeList } = await import("@/app/dashboard/actions");
      return saveCollegeList(selected);
    });

  return (
    <div className="space-y-6">
      <SearchBar
        query={query}
        onQuery={setQuery}
        placeholder="Search universities…"
        count={selected.length}
        cap={LIMITS.targetSchools}
      />

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {filtered.map((u) => {
          const on = selected.includes(u.name);
          return (
            <PickCard
              key={u.id}
              on={on}
              disabled={!on && atCap}
              onClick={() => toggle(u.name)}
              title={u.name}
              meta={[
                `Admit ~${Math.round(u.acceptance_rate * 100)}%`,
                `SAT ${u.sat_p25}–${u.sat_p75}`,
                ...(earliestDeadlineHint(u.id) ? [earliestDeadlineHint(u.id)!] : []),
              ]}
              note={u.notes_international}
            />
          );
        })}
      </div>

      <StickyActionBar
        error={error}
        message={
          selected.length === 0
            ? "Select at least one university to continue."
            : `${selected.length} ${selected.length === 1 ? "school" : "schools"} selected`
        }
        ctaLabel="See my admission odds"
        ctaDisabled={selected.length === 0 || busy}
        onCta={run}
      />
      {busy && <AnalyzingOverlay />}
    </div>
  );
}

// ── Italy ───────────────────────────────────────────────────────────────────
const IT_SORTED = [...ITALIAN_PROGRAMS].sort((a, b) =>
  a.university === b.university
    ? a.program_name.localeCompare(b.program_name)
    : a.university.localeCompare(b.university)
);

function ItalyBuilder() {
  const [selected, setSelected] = useState<string[]>([]);
  const [income, setIncome] = useState<string>("");
  const [query, setQuery] = useState("");
  const { busy, error, submit } = useListSubmit("IT");

  const atCap = selected.length >= LIMITS.italyPrograms;
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return IT_SORTED;
    return IT_SORTED.filter(
      (p) =>
        p.university.toLowerCase().includes(q) ||
        p.program_name.toLowerCase().includes(q) ||
        p.city.toLowerCase().includes(q)
    );
  }, [query]);

  const toggle = (id: string) =>
    setSelected((cur) =>
      cur.includes(id)
        ? cur.filter((n) => n !== id)
        : atCap
          ? cur
          : [...cur, id]
    );

  const run = () =>
    submit(async () => {
      const { saveItalyList } = await import("@/app/dashboard/actions");
      const n = Number(income);
      return saveItalyList(
        selected,
        income.trim() !== "" && Number.isFinite(n) ? n : undefined
      );
    });

  return (
    <div className="space-y-6">
      <SearchBar
        query={query}
        onQuery={setQuery}
        placeholder="Search by university, program, or city…"
        count={selected.length}
        cap={LIMITS.italyPrograms}
      />

      <div className="max-w-md">
        <label htmlFor="it-income" className="text-sm font-medium text-ink">
          Family income (annual, EUR)
        </label>
        <p className="mb-2 text-xs text-ink-soft">
          Optional — used to estimate DSU tuition reduction and scholarship fit.
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

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {filtered.map((p) => {
          const on = selected.includes(p.id);
          return (
            <PickCard
              key={p.id}
              on={on}
              disabled={!on && atCap}
              onClick={() => toggle(p.id)}
              title={p.university}
              subtitle={`${p.program_name} · ${p.city}`}
              meta={[p.level.toUpperCase(), p.language, `€${p.annual_fee_eur.toLocaleString()}/yr`]}
              note={p.notes}
            />
          );
        })}
      </div>

      <StickyActionBar
        error={error}
        message={
          selected.length === 0
            ? "Select at least one program to continue."
            : `${selected.length} ${selected.length === 1 ? "program" : "programs"} selected`
        }
        ctaLabel="See my admission odds"
        ctaDisabled={selected.length === 0 || busy}
        onCta={run}
      />
      {busy && <AnalyzingOverlay />}
    </div>
  );
}

// ── Hong Kong ────────────────────────────────────────────────────────────────
const HK_SORTED = [...HK_PROGRAMS].sort((a, b) =>
  a.university === b.university
    ? b.typical_ib - a.typical_ib
    : a.university.localeCompare(b.university)
);

function HkBuilder() {
  const [selected, setSelected] = useState<string[]>([]);
  const [gradeStatus, setGradeStatus] = useState<"predicted" | "achieved">("predicted");
  const [query, setQuery] = useState("");
  const { busy, error, submit } = useListSubmit("HK");

  const atCap = selected.length >= LIMITS.hkPrograms;
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return HK_SORTED;
    return HK_SORTED.filter(
      (p) =>
        p.university.toLowerCase().includes(q) ||
        p.program_name.toLowerCase().includes(q) ||
        p.field.toLowerCase().includes(q)
    );
  }, [query]);

  const toggle = (id: string) =>
    setSelected((cur) =>
      cur.includes(id)
        ? cur.filter((n) => n !== id)
        : atCap
          ? cur
          : [...cur, id]
    );

  const run = () =>
    submit(async () => {
      const { saveHkList } = await import("@/app/dashboard/actions");
      return saveHkList(selected, gradeStatus);
    });

  return (
    <div className="space-y-6">
      <SearchBar
        query={query}
        onQuery={setQuery}
        placeholder="Search by university, program, or field…"
        count={selected.length}
        cap={LIMITS.hkPrograms}
      />

      <div className="max-w-md">
        <span className="text-sm font-medium text-ink">Your grades are</span>
        <p className="mb-2 text-xs text-ink-soft">
          Predicted grades get a conditional-offer read; achieved grades are scored as final.
        </p>
        <div className="flex gap-2">
          {(["predicted", "achieved"] as const).map((s) => {
            const on = gradeStatus === s;
            return (
              <button
                key={s}
                type="button"
                onClick={() => setGradeStatus(s)}
                aria-pressed={on}
                className={`min-h-[44px] flex-1 rounded-xl border px-4 py-3 text-sm font-medium transition-colors focus-visible:focus-ring ${
                  on
                    ? "border-accent bg-accent-soft text-ink"
                    : "border-line bg-card text-ink-soft hover:border-ink/30"
                }`}
              >
                {s === "predicted" ? "Predicted" : "Achieved"}
              </button>
            );
          })}
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {filtered.map((p) => {
          const on = selected.includes(p.id);
          return (
            <PickCard
              key={p.id}
              on={on}
              disabled={!on && atCap}
              onClick={() => toggle(p.id)}
              title={p.university}
              subtitle={p.program_name}
              meta={[
                `Typical IB ~${p.typical_ib}`,
                p.interview_required ? "Interview" : "No interview",
              ]}
              note={p.notes}
            />
          );
        })}
      </div>

      <StickyActionBar
        error={error}
        message={
          selected.length === 0
            ? "Select at least one program to continue."
            : `${selected.length} ${selected.length === 1 ? "program" : "programs"} selected`
        }
        ctaLabel="See my admission odds"
        ctaDisabled={selected.length === 0 || busy}
        onCta={run}
      />
      {busy && <AnalyzingOverlay />}
    </div>
  );
}

// ── UAE ───────────────────────────────────────────────────────────────────────
const AE_SORTED = [...UAE_PROGRAMS].sort((a, b) =>
  a.university === b.university
    ? b.typical_sat - a.typical_sat
    : a.university.localeCompare(b.university)
);

function UaeBuilder() {
  const [selected, setSelected] = useState<string[]>([]);
  const [gradeStatus, setGradeStatus] = useState<"predicted" | "achieved">("predicted");
  const [query, setQuery] = useState("");
  const { busy, error, submit } = useListSubmit("AE");

  const atCap = selected.length >= LIMITS.uaePrograms;
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return AE_SORTED;
    return AE_SORTED.filter(
      (p) =>
        p.university.toLowerCase().includes(q) ||
        p.program_name.toLowerCase().includes(q) ||
        p.field.toLowerCase().includes(q) ||
        p.emirate.toLowerCase().includes(q)
    );
  }, [query]);

  const toggle = (id: string) =>
    setSelected((cur) =>
      cur.includes(id)
        ? cur.filter((n) => n !== id)
        : atCap
          ? cur
          : [...cur, id]
    );

  const run = () =>
    submit(async () => {
      const { saveUaeList } = await import("@/app/dashboard/actions");
      return saveUaeList(selected, gradeStatus);
    });

  return (
    <div className="space-y-6">
      <SearchBar
        query={query}
        onQuery={setQuery}
        placeholder="Search by university, program, field, or emirate…"
        count={selected.length}
        cap={LIMITS.uaePrograms}
      />

      <div className="max-w-md">
        <span className="text-sm font-medium text-ink">Your grades are</span>
        <p className="mb-2 text-xs text-ink-soft">
          Predicted grades get a conditional-offer read; achieved grades are scored as final.
        </p>
        <div className="flex gap-2">
          {(["predicted", "achieved"] as const).map((s) => {
            const on = gradeStatus === s;
            return (
              <button
                key={s}
                type="button"
                onClick={() => setGradeStatus(s)}
                aria-pressed={on}
                className={`min-h-[44px] flex-1 rounded-xl border px-4 py-3 text-sm font-medium transition-colors focus-visible:focus-ring ${
                  on
                    ? "border-accent bg-accent-soft text-ink"
                    : "border-line bg-card text-ink-soft hover:border-ink/30"
                }`}
              >
                {s === "predicted" ? "Predicted" : "Achieved"}
              </button>
            );
          })}
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {filtered.map((p) => {
          const on = selected.includes(p.id);
          return (
            <PickCard
              key={p.id}
              on={on}
              disabled={!on && atCap}
              onClick={() => toggle(p.id)}
              title={p.university}
              subtitle={`${p.program_name} · ${p.emirate}`}
              meta={[
                `Typical SAT ~${p.typical_sat}`,
                p.need_blind ? "Need-blind" : p.interview_required ? "Interview" : "No interview",
              ]}
              note={p.notes}
            />
          );
        })}
      </div>

      <StickyActionBar
        error={error}
        message={
          selected.length === 0
            ? "Select at least one program to continue."
            : `${selected.length} ${selected.length === 1 ? "program" : "programs"} selected`
        }
        ctaLabel="See my admission odds"
        ctaDisabled={selected.length === 0 || busy}
        onCta={run}
      />
      {busy && <AnalyzingOverlay />}
    </div>
  );
}

// ── South Korea ───────────────────────────────────────────────────────────────
const KR_SORTED = [...KOREA_PROGRAMS].sort((a, b) =>
  a.university === b.university
    ? b.typical_gpa_percent - a.typical_gpa_percent
    : a.university.localeCompare(b.university)
);

const TOPIK_LEVELS = [0, 1, 2, 3, 4, 5, 6] as const;

function KoreaBuilder() {
  const [selected, setSelected] = useState<string[]>([]);
  const [gradeStatus, setGradeStatus] = useState<"predicted" | "achieved">("predicted");
  const [topik, setTopik] = useState<number>(0);
  const [query, setQuery] = useState("");
  const { busy, error, submit } = useListSubmit("KR");

  const atCap = selected.length >= LIMITS.krPrograms;
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return KR_SORTED;
    return KR_SORTED.filter(
      (p) =>
        p.university.toLowerCase().includes(q) ||
        p.program_name.toLowerCase().includes(q) ||
        p.field.toLowerCase().includes(q) ||
        p.city.toLowerCase().includes(q)
    );
  }, [query]);

  const toggle = (id: string) =>
    setSelected((cur) =>
      cur.includes(id)
        ? cur.filter((n) => n !== id)
        : atCap
          ? cur
          : [...cur, id]
    );

  const run = () =>
    submit(async () => {
      const { saveKoreaList } = await import("@/app/dashboard/actions");
      return saveKoreaList(selected, gradeStatus, topik > 0 ? topik : undefined);
    });

  return (
    <div className="space-y-6">
      <SearchBar
        query={query}
        onQuery={setQuery}
        placeholder="Search by university, program, field, or city…"
        count={selected.length}
        cap={LIMITS.krPrograms}
      />

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <span className="text-sm font-medium text-ink">Your grades are</span>
          <p className="mb-2 text-xs text-ink-soft">
            Predicted grades get a conditional-offer read; achieved grades are scored as final.
          </p>
          <div className="flex gap-2">
            {(["predicted", "achieved"] as const).map((s) => {
              const on = gradeStatus === s;
              return (
                <button
                  key={s}
                  type="button"
                  onClick={() => setGradeStatus(s)}
                  aria-pressed={on}
                  className={`min-h-[44px] flex-1 rounded-xl border px-4 py-3 text-sm font-medium transition-colors focus-visible:focus-ring ${
                    on
                      ? "border-accent bg-accent-soft text-ink"
                      : "border-line bg-card text-ink-soft hover:border-ink/30"
                  }`}
                >
                  {s === "predicted" ? "Predicted" : "Achieved"}
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <span className="text-sm font-medium text-ink">Your TOPIK level</span>
          <p className="mb-2 text-xs text-ink-soft">
            Korean-taught programs require TOPIK as an eligibility document — it directly changes your read.
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

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {filtered.map((p) => {
          const on = selected.includes(p.id);
          return (
            <PickCard
              key={p.id}
              on={on}
              disabled={!on && atCap}
              onClick={() => toggle(p.id)}
              title={p.university}
              subtitle={`${p.program_name} · ${p.city}`}
              meta={[
                `Typical GPA ~${p.typical_gpa_percent}%`,
                p.topik_required != null ? `TOPIK ${p.topik_required}+` : "English-taught",
                ...(p.auto_full_scholarship ? ["Full ride for admits"] : []),
              ]}
              note={p.notes}
            />
          );
        })}
      </div>

      <StickyActionBar
        error={error}
        message={
          selected.length === 0
            ? "Select at least one program to continue."
            : `${selected.length} ${selected.length === 1 ? "program" : "programs"} selected`
        }
        ctaLabel="See my admission odds"
        ctaDisabled={selected.length === 0 || busy}
        onCta={run}
      />
      {busy && <AnalyzingOverlay />}
    </div>
  );
}

// ── Shared building blocks ────────────────────────────────────────────────────
function SearchBar({
  query,
  onQuery,
  placeholder,
  count,
  cap,
}: {
  query: string;
  onQuery: (v: string) => void;
  placeholder: string;
  count: number;
  cap: number;
}) {
  return (
    <div className="sticky top-0 z-10 -mx-4 bg-surface/90 px-4 py-3 backdrop-blur sm:-mx-8 sm:px-8">
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative min-w-0 flex-1">
          <svg className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-faint" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="7" />
            <path d="m21 21-4.3-4.3" />
          </svg>
          <input
            value={query}
            onChange={(e) => onQuery(e.target.value)}
            placeholder={placeholder}
            className="h-11 w-full rounded-xl border border-line bg-card pl-10 pr-3.5 text-[0.95rem] text-ink placeholder:text-ink-faint focus-visible:focus-ring"
          />
        </div>
        <span className="shrink-0 text-sm font-medium text-ink-soft">
          {count} / {cap} selected
        </span>
      </div>
    </div>
  );
}

function PickCard({
  on,
  disabled,
  onClick,
  title,
  subtitle,
  meta,
  note,
}: {
  on: boolean;
  disabled: boolean;
  onClick: () => void;
  title: string;
  subtitle?: string;
  meta: string[];
  note?: string;
}) {
  return (
    <button
      type="button"
      aria-pressed={on}
      disabled={disabled}
      onClick={onClick}
      className={`flex flex-col rounded-2xl border p-4 text-left transition-colors focus-visible:focus-ring ${
        on
          ? "border-accent bg-accent-soft"
          : disabled
            ? "cursor-not-allowed border-line bg-card opacity-50"
            : "border-line bg-card hover:border-ink/20"
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <h3 className="text-[0.95rem] font-semibold leading-tight text-ink">{title}</h3>
          {subtitle && <p className="mt-0.5 text-xs text-ink-soft">{subtitle}</p>}
        </div>
        <span
          className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border ${
            on ? "border-accent bg-accent text-white" : "border-line"
          }`}
        >
          {on && (
            <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12l5 5L20 7" />
            </svg>
          )}
        </span>
      </div>
      <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-ink-soft">
        {meta.map((m) => (
          <span key={m}>{m}</span>
        ))}
      </div>
      {note && <p className="mt-2 line-clamp-2 text-xs text-ink-faint">{note}</p>}
    </button>
  );
}

function StickyActionBar({
  error,
  message,
  ctaLabel,
  ctaDisabled,
  onCta,
}: {
  error: string | null;
  message: string;
  ctaLabel: string;
  ctaDisabled: boolean;
  onCta: () => void;
}) {
  return (
    <div className="fixed inset-x-0 bottom-0 z-20 border-t border-line bg-card/95 backdrop-blur lg:left-64">
      <div className="mx-auto flex max-w-[1500px] items-center justify-between gap-4 px-4 py-3 sm:px-8">
        <div className="min-w-0">
          {error ? (
            <p className="truncate text-sm text-reach">{error}</p>
          ) : (
            <p className="truncate text-sm text-ink-soft">{message}</p>
          )}
        </div>
        <Button size="md" disabled={ctaDisabled} onClick={onCta}>
          {ctaLabel}
          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M5 12h14M13 6l6 6-6 6" />
          </svg>
        </Button>
      </div>
    </div>
  );
}

function AnalyzingOverlay() {
  const MESSAGES = [
    "Reading your profile…",
    "Scoring each school against admitted data…",
    "Estimating your likelihood ranges…",
    "Benchmarking your stats…",
    "Finalizing your admission odds…",
  ];
  const [i, setI] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setI((x) => (x + 1) % MESSAGES.length), 4500);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-surface/90 px-6 text-center backdrop-blur-sm">
      <div className="h-11 w-11 animate-spin rounded-full border-2 border-line border-t-accent" />
      <h2 className="mt-6 text-lg font-semibold text-ink">Building your admission odds</h2>
      <p className="mt-1 min-h-[1.25rem] max-w-xs text-sm text-ink-soft">{MESSAGES[i]}</p>
      <p className="mt-4 text-xs text-ink-faint">This usually takes around 30 seconds.</p>
    </div>
  );
}
