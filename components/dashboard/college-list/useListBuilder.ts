"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { Analysis } from "@/lib/ai/schema";
import type { DestinationCode } from "@/lib/data/destinations";
import { useDashboard } from "@/components/dashboard/DashboardContext";

export type SaveResult = { ok: true } | { ok: false; error: string };

// The countries with an interactive college-list builder.
export type BuilderCountry = "US" | "IT" | "HK" | "AE" | "KR";

/**
 * Selection + search state shared by every builder: a capped multi-select over a
 * pre-sorted list, filtered by a (stable) search predicate. `idOf` is the value
 * stored in `selected` (a school name for US, a program id elsewhere).
 */
export function useListSelection<T>(
  items: T[],
  cap: number,
  idOf: (item: T) => string,
  search: (item: T, q: string) => boolean,
) {
  const [selected, setSelected] = useState<string[]>([]);
  const [query, setQuery] = useState("");

  const atCap = selected.length >= cap;
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return q ? items.filter((item) => search(item, q)) : items;
  }, [query, items, search]);

  const toggle = (id: string) =>
    setSelected((cur) =>
      cur.includes(id)
        ? cur.filter((n) => n !== id)
        : atCap
          ? cur
          : [...cur, id],
    );

  return {
    selected,
    setSelected,
    query,
    setQuery,
    atCap,
    filtered,
    toggle,
    idOf,
  };
}

export type ListSelection<T> = ReturnType<typeof useListSelection<T>>;

/**
 * Default the program list to the student's chosen fields of study (from
 * onboarding), so a CS applicant sees CS programs first instead of every program.
 * `fieldOf` reads a program's field; `fieldsForFaculties` maps the student's
 * faculties onto that country's field vocabulary. Falls back to the full list
 * (and reports `canFilter: false`) when the student picked no faculties or none
 * of them match a program in this country — so we never hide everything.
 */
export function useFieldFilter<T>(
  items: T[],
  fieldOf: (item: T) => string,
  faculties: string[],
  fieldsForFaculties: (faculties: string[]) => string[],
) {
  const key = faculties.join("|");
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const wanted = useMemo(() => new Set(fieldsForFaculties(faculties)), [key]);
  const matches = useMemo(
    () => items.filter((i) => wanted.has(fieldOf(i))),
    [items, wanted, fieldOf],
  );

  const canFilter = wanted.size > 0 && matches.length > 0;
  const [showAll, setShowAll] = useState(false);
  const active = canFilter && !showAll;

  return {
    list: active ? matches : items,
    canFilter,
    active,
    setShowAll,
    matchCount: matches.length,
    totalCount: items.length,
  };
}

/**
 * Save this country's list, run one re-analysis, then land on its odds tab so the
 * targets the student just picked are shown. Shared by all builders.
 */
export function useListSubmit(targetCountry: BuilderCountry) {
  const router = useRouter();
  const { setAnalysis, setCountry, basePath, demo } = useDashboard();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (save: () => Promise<SaveResult>) => {
    setBusy(true);
    setError(null);
    try {
      setCountry(targetCountry as DestinationCode);
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
          data?.error || "We couldn't run your analysis. Please try again.",
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
