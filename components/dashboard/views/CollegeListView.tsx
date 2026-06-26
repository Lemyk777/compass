"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { Analysis } from "@/lib/ai/schema";
import { UNIVERSITIES } from "@/lib/data/universities";
import { LIMITS } from "@/lib/limits";
import { Button } from "@/components/ui/Button";
import { useDashboard } from "@/components/dashboard/DashboardContext";
import { NoAnalysisYet, PageHeader } from "@/components/dashboard/states";

const SORTED = [...UNIVERSITIES].sort((a, b) => a.acceptance_rate - b.acceptance_rate);

export function CollegeListView() {
  const router = useRouter();
  const { analysis, setAnalysis, setCountry, basePath, demo } = useDashboard();
  const [selected, setSelected] = useState<string[]>([]);
  const [query, setQuery] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const atCap = selected.length >= LIMITS.targetSchools;
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return SORTED;
    return SORTED.filter((u) => u.name.toLowerCase().includes(q));
  }, [query]);

  // The college list extends an existing profile — if there's no analysis yet,
  // the student hasn't completed onboarding.
  if (!analysis) return <NoAnalysisYet />;

  const toggle = (name: string) => {
    setSelected((cur) =>
      cur.includes(name)
        ? cur.filter((n) => n !== name)
        : atCap
          ? cur
          : [...cur, name]
    );
  };

  async function submit() {
    if (selected.length === 0) return;
    setBusy(true);
    setError(null);
    try {
      // The college list is US-specific — land the user on the US odds tab so
      // the schools they just picked are shown (not whatever country tab they
      // happened to be viewing before).
      setCountry("US");
      if (demo) {
        await new Promise((r) => setTimeout(r, 2600));
        router.push(`${basePath}/odds`);
        return;
      }
      const { saveCollegeList } = await import("@/app/dashboard/actions");
      const saved = await saveCollegeList(selected);
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
  }

  return (
    <div className="space-y-6 pb-28">
      <PageHeader
        title="Build your college list"
        hint="Pick the US universities you're aiming for. We'll score your admission odds at each, using your profile and real admitted-student data."
      />

      <div className="sticky top-0 z-10 -mx-4 bg-surface/90 px-4 py-3 backdrop-blur sm:-mx-8 sm:px-8">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative min-w-0 flex-1">
            <svg className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-faint" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="7" />
              <path d="m21 21-4.3-4.3" />
            </svg>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search universities…"
              className="h-11 w-full rounded-xl border border-line bg-card pl-10 pr-3.5 text-[0.95rem] text-ink placeholder:text-ink-faint focus-visible:focus-ring"
            />
          </div>
          <span className="shrink-0 text-sm font-medium text-ink-soft">
            {selected.length} / {LIMITS.targetSchools} selected
          </span>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {filtered.map((u) => {
          const on = selected.includes(u.name);
          const dis = !on && atCap;
          return (
            <button
              key={u.id}
              type="button"
              aria-pressed={on}
              disabled={dis}
              onClick={() => toggle(u.name)}
              className={`flex flex-col rounded-2xl border p-4 text-left transition-colors focus-visible:focus-ring ${
                on
                  ? "border-accent bg-accent-soft"
                  : dis
                    ? "cursor-not-allowed border-line bg-card opacity-50"
                    : "border-line bg-card hover:border-ink/20"
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <h3 className="text-[0.95rem] font-semibold leading-tight text-ink">{u.name}</h3>
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
                <span>Admit ~{Math.round(u.acceptance_rate * 100)}%</span>
                <span>SAT {u.sat_p25}–{u.sat_p75}</span>
              </div>
              <p className="mt-2 line-clamp-2 text-xs text-ink-faint">{u.notes_international}</p>
            </button>
          );
        })}
      </div>

      {/* Sticky action bar */}
      <div className="fixed inset-x-0 bottom-0 z-20 border-t border-line bg-card/95 backdrop-blur lg:left-64">
        <div className="mx-auto flex max-w-[1500px] items-center justify-between gap-4 px-4 py-3 sm:px-8">
          <div className="min-w-0">
            {error ? (
              <p className="truncate text-sm text-reach">{error}</p>
            ) : (
              <p className="truncate text-sm text-ink-soft">
                {selected.length === 0
                  ? "Select at least one university to continue."
                  : `${selected.length} ${selected.length === 1 ? "school" : "schools"} selected`}
              </p>
            )}
          </div>
          <Button size="md" disabled={selected.length === 0 || busy} onClick={submit}>
            See my admission odds
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12h14M13 6l6 6-6 6" />
            </svg>
          </Button>
        </div>
      </div>

      {busy && <AnalyzingOverlay />}
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
