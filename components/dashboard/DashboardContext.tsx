"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
} from "react";
import { useRouter } from "next/navigation";
import type { Analysis } from "@/lib/ai/schema";
import type { DestinationCode } from "@/lib/data/destinations";
import type { SatSitting, Competition } from "@/lib/data/key-dates";
import { useT } from "@/lib/i18n/client";

// Shared state for the whole dashboard. The layout fetches the analysis once and
// drops it in here; every section page (overview, standing, odds, …) reads from
// this same context, so the analysis and the selected country persist as the
// user navigates between the sidebar pages.
type DashboardCtx = {
  analysis: Analysis | null;
  setAnalysis: (a: Analysis | null) => void;
  name: string | null;
  hasProfile: boolean;
  loading: boolean;
  error: string | null;
  runAnalysis: () => void;
  canAnalyze: boolean;
  basePath: string;
  isAdmin: boolean;
  demo: boolean;
  tabs: DestinationCode[];
  country: DestinationCode;
  setCountry: (code: DestinationCode) => void;
  // Lightweight profile facts the date-anchored Timeline needs (not the full
  // profile). Empty defaults keep older callers working.
  profileMeta: ProfileMeta;
  // Live dates from Supabase — when present, override hardcoded SAT/competition data.
  liveDates: LiveDates;
};

export type ProfileMeta = {
  graduationYear?: number;
  faculties: string[];
  satScore?: number;
};

export type LiveDates = {
  satSittings: SatSitting[];
  competitions: Competition[];
};

const Ctx = createContext<DashboardCtx | null>(null);

export function useDashboard(): DashboardCtx {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useDashboard must be used within DashboardProvider");
  return ctx;
}

function tabsFor(analysis: Analysis | null): DestinationCode[] {
  if (!analysis) return [];
  const out: DestinationCode[] = [];
  if (analysis.schools.length > 0) out.push("US");
  if ((analysis.italy_programs?.length ?? 0) > 0) out.push("IT");
  if ((analysis.hk_programs?.length ?? 0) > 0) out.push("HK");
  return out;
}

export function DashboardProvider({
  initialAnalysis,
  name,
  hasProfile,
  isAdmin = false,
  basePath,
  canAnalyze,
  demo = false,
  profileMeta = { faculties: [] },
  liveDates = { satSittings: [], competitions: [] },
  children,
}: {
  initialAnalysis: Analysis | null;
  name: string | null;
  hasProfile: boolean;
  isAdmin?: boolean;
  basePath: string;
  canAnalyze: boolean;
  demo?: boolean;
  profileMeta?: ProfileMeta;
  liveDates?: LiveDates;
  children: React.ReactNode;
}) {
  const t = useT();
  const router = useRouter();
  const [analysis, setAnalysis] = useState<Analysis | null>(initialAnalysis);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const running = useRef(false);

  const tabs = useMemo(() => tabsFor(analysis), [analysis]);
  const [country, setCountry] = useState<DestinationCode>(tabs[0] ?? "US");
  const activeCountry = tabs.includes(country) ? country : (tabs[0] ?? "US");

  const runAnalysis = useCallback(async () => {
    if (!canAnalyze || running.current) return;
    running.current = true;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/analyze", { method: "POST" });
      // Parse defensively: a timeout/crash returns a non-JSON error page.
      const raw = await res.text();
      let data: { analysis?: Analysis; error?: string } | null = null;
      try {
        data = raw ? JSON.parse(raw) : null;
      } catch {
        data = null;
      }
      if (!res.ok) {
        const fallback =
          res.status === 504 || res.status === 408 || res.status === 524
            ? t("dash.errTimeout")
            : res.status === 429
              ? t("dash.errBusy")
              : t("dash.errGeneric");
        throw new Error(data?.error || fallback);
      }
      if (!data?.analysis) throw new Error(t("dash.errGeneric"));
      setAnalysis(data.analysis as Analysis);
      router.replace(basePath);
    } catch (e) {
      setError(e instanceof Error ? e.message : t("dash.errGeneric"));
    } finally {
      setLoading(false);
      running.current = false;
    }
  }, [canAnalyze, basePath, router, t]);

  const value = useMemo<DashboardCtx>(
    () => ({
      analysis,
      setAnalysis,
      name,
      hasProfile,
      loading,
      error,
      runAnalysis,
      canAnalyze,
      basePath,
      isAdmin,
      demo,
      tabs,
      country: activeCountry,
      setCountry,
      profileMeta,
      liveDates,
    }),
    [
      analysis,
      name,
      hasProfile,
      loading,
      error,
      runAnalysis,
      canAnalyze,
      basePath,
      isAdmin,
      demo,
      tabs,
      activeCountry,
      profileMeta,
      liveDates,
    ]
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
