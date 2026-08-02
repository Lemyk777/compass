"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
} from "react";
import { useTransitionRouter } from "@/components/ui/ViewTransitions";
import type { Analysis } from "@/lib/ai/schema";
import { AVAILABLE_DESTINATION_CODES, type DestinationCode } from "@/lib/data/destinations";
import { analysisHasCountry } from "@/lib/data/country-content";
import type { SatSitting, Competition } from "@/lib/data/key-dates";
import { indexIntents, type OpportunityIntent } from "@/lib/data/intents";
import type { Readiness } from "@/lib/data/readiness";
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
  // Endowed-progress checklist of how complete the profile is (research rule 8).
  // Null in demo/preview, where there is no real profile to be part-way through.
  readiness: Readiness | null;
  // Live dates from Supabase — when present, override hardcoded SAT/competition data.
  liveDates: LiveDates;
  // Opportunities the student has committed to, by id, plus the setter the
  // Opportunities view uses to reflect a commitment immediately.
  intents: IntentMap;
  setIntent: (id: string, intent: OpportunityIntent | null) => void;
};

export type ProfileMeta = {
  graduationYear?: number;
  faculties: string[];
  satScore?: number;
  // Normalized ISO-2 home country ("KZ") — gates LOCAL opportunities. Null /
  // absent (demo, unrecognized free-text country) → only global ones show.
  homeCountry?: string | null;
};

export type LiveDates = {
  satSittings: SatSitting[];
  competitions: Competition[];
};

/**
 * What the student has committed to entering, keyed by opportunity id. Loaded
 * once in the dashboard layout; the Opportunities view mutates it optimistically
 * so a commitment reads back instantly rather than after a round-trip.
 */
export type IntentMap = Record<string, OpportunityIntent>;

const Ctx = createContext<DashboardCtx | null>(null);

export function useDashboard(): DashboardCtx {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useDashboard must be used within DashboardProvider");
  return ctx;
}

// Which country tabs to show. A country gets a tab if the student CHOSE it as a
// destination (so every selected country shows — even before its college list is
// built) OR the analysis already has content for it. The content half matters
// because `destinations` is sourced from the server layout and goes stale after
// a client-side mutation (e.g. building a US college list adds "US" in the DB +
// the fresh analysis, but the prop only refreshes on a full reload) — without it
// the just-added US odds wouldn't appear on the results page. Restricted to the
// destinations we actually analyze (US/IT/HK) and emitted in canonical order.
function tabsFor(
  analysis: Analysis | null,
  destinations: DestinationCode[]
): DestinationCode[] {
  if (!analysis) return [];
  return AVAILABLE_DESTINATION_CODES.filter(
    (c) => destinations.includes(c) || analysisHasCountry(analysis, c)
  );
}

export function DashboardProvider({
  initialAnalysis,
  name,
  hasProfile,
  isAdmin = false,
  basePath,
  canAnalyze,
  demo = false,
  destinations = [],
  profileMeta = { faculties: [] },
  readiness = null,
  liveDates = { satSittings: [], competitions: [] },
  intents: initialIntents = [],
  children,
}: {
  initialAnalysis: Analysis | null;
  name: string | null;
  hasProfile: boolean;
  isAdmin?: boolean;
  basePath: string;
  canAnalyze: boolean;
  demo?: boolean;
  // The student's chosen destination countries — drives the country tabs so
  // every selected country shows. Optional: demo/legacy fall back to content.
  destinations?: DestinationCode[];
  profileMeta?: ProfileMeta;
  readiness?: Readiness | null;
  liveDates?: LiveDates;
  /** Existing commitments, loaded server-side. Absent in demo/preview. */
  intents?: OpportunityIntent[];
  children: React.ReactNode;
}) {
  const t = useT();
  const router = useTransitionRouter();

  const [analysis, setAnalysis] = useState<Analysis | null>(initialAnalysis);

  const [intents, setIntents] = useState<IntentMap>(() =>
    indexIntents(initialIntents)
  );
  const setIntent = useCallback((id: string, intent: OpportunityIntent | null) => {
    setIntents((prev) => {
      const next = { ...prev };
      if (intent) next[id] = intent;
      else delete next[id];
      return next;
    });
  }, []);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const running = useRef(false);

  const tabs = useMemo(() => tabsFor(analysis, destinations), [analysis, destinations]);
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
      readiness,
      liveDates,
      intents,
      setIntent,
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
      readiness,
      liveDates,
      intents,
      setIntent,
    ]
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
