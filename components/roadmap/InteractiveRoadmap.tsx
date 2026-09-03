"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import type {
  Regime,
  Roadmap,
  RoadmapAction,
  RoadmapPhase,
} from "@/lib/data/roadmap";
import { daysLeftLabel, formatDate } from "@/lib/data/opportunity-format";

const REGIME_CONFIG: Record<
  Regime,
  { label: string; tone: string; description: string; badgeTone: string }
> = {
  building: {
    label: "Foundation & Building",
    tone: "border-likely/40 bg-likely-soft/30 text-likely-ink",
    badgeTone: "bg-likely-soft text-likely-ink border-likely/30",
    description: "Ample runway. Focus on core academic spikes, broad accessible competitions, and foundational skills.",
  },
  focusing: {
    label: "Strategic Focusing",
    tone: "border-accent/40 bg-accent-soft/30 text-accent-ink",
    badgeTone: "bg-accent-soft text-accent-ink border-accent/30",
    description: "Crucial intermediate phase. Narrow your extracurricular profile to high-leverage standout achievements.",
  },
  sprinting: {
    label: "High-Urgency Sprint",
    tone: "border-target/40 bg-target-soft/30 text-target-ink",
    badgeTone: "bg-target-soft text-target-ink border-target/30",
    description: "Sub-12 month horizon. Lock standardized scores, secure letters of recommendation, and finalize tier-1 wins.",
  },
  submitting: {
    label: "Final Polish & Submission",
    tone: "border-reach/40 bg-reach-soft/30 text-reach-ink",
    badgeTone: "bg-reach-soft text-reach-ink border-reach/30",
    description: "Application window active. Polish essays, verify institutional dates, and submit early applications.",
  },
  unknown: {
    label: "Strategic Roadmap",
    tone: "border-line bg-card text-ink-soft",
    badgeTone: "bg-surface text-ink-soft border-line",
    description: "Anchor your graduation year and profile details to customize deadlines and milestone runway.",
  },
};

const URGENCY_CONFIG: Record<
  RoadmapPhase["urgency"],
  { dot: string; glow: string; label: string; badge: string }
> = {
  now: {
    dot: "bg-reach",
    glow: "ring-reach/30 shadow-[0_0_14px_rgba(224,102,79,0.4)]",
    label: "Immediate Focus",
    badge: "bg-reach-soft text-reach-ink border-reach/30",
  },
  soon: {
    dot: "bg-target",
    glow: "ring-target/30 shadow-[0_0_14px_rgba(197,126,39,0.35)]",
    label: "Approaching Window",
    badge: "bg-target-soft text-target-ink border-target/30",
  },
  later: {
    dot: "bg-likely",
    glow: "ring-likely/30 shadow-[0_0_14px_rgba(63,155,110,0.35)]",
    label: "Planned Horizon",
    badge: "bg-likely-soft text-likely-ink border-likely/30",
  },
};

type FilterCategory = "all" | "sat" | "competition" | "profile" | "note";

const STORAGE_KEY = "compass_roadmap_focused_actions";

export function InteractiveRoadmap({
  roadmap,
  today,
  showExtraSections = true,
  basePath,
}: {
  roadmap: Roadmap;
  today?: Date;
  showExtraSections?: boolean;
  basePath?: string;
}) {
  const shouldReduceMotion = useReducedMotion();
  const [activePhaseId, setActivePhaseId] = useState<string | "all">("all");
  const [selectedCategory, setSelectedCategory] = useState<FilterCategory>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedPhases, setExpandedPhases] = useState<Record<string, boolean>>(() => {
    // Default: all phases expanded
    const initial: Record<string, boolean> = {};
    roadmap.phases.forEach((p) => {
      initial[p.id] = true;
    });
    return initial;
  });

  // Track focused or marked actions with SSR-safe localStorage persistence
  const [focusedActions, setFocusedActions] = useState<Record<string, boolean>>({});

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
          setFocusedActions(parsed);
        }
      }
    } catch {
      // Storage unavailable or disabled
    }
  }, []);

  const toggleFocus = useCallback((key: string) => {
    setFocusedActions((prev) => {
      const updated = {
        ...prev,
        [key]: !prev[key],
      };
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      } catch {
        // Storage write failed
      }
      return updated;
    });
  }, []);

  const togglePhaseExpand = useCallback((phaseId: string) => {
    setExpandedPhases((prev) => ({
      ...prev,
      [phaseId]: !prev[phaseId],
    }));
  }, []);

  const expandAll = useCallback(() => {
    const updated: Record<string, boolean> = {};
    roadmap.phases.forEach((p) => {
      updated[p.id] = true;
    });
    setExpandedPhases(updated);
  }, [roadmap.phases]);

  const collapseAll = useCallback(() => {
    const updated: Record<string, boolean> = {};
    roadmap.phases.forEach((p) => {
      updated[p.id] = false;
    });
    setExpandedPhases(updated);
  }, [roadmap.phases]);

  const resetFilters = useCallback(() => {
    setSelectedCategory("all");
    setSearchQuery("");
    setActivePhaseId("all");
  }, []);

  // Compute counts and filtered items
  const allActions = useMemo(() => {
    return roadmap.phases.flatMap((p) => p.actions);
  }, [roadmap.phases]);

  const categoryCounts = useMemo(() => {
    return {
      all: allActions.length,
      sat: allActions.filter((a) => a.source === "sat").length,
      competition: allActions.filter((a) => a.source === "competition").length,
      profile: allActions.filter((a) => a.source === "profile").length,
      note: allActions.filter((a) => a.source === "note").length,
    };
  }, [allActions]);

  const focusedCount = useMemo(() => {
    return Object.values(focusedActions).filter(Boolean).length;
  }, [focusedActions]);

  const regimeInfo = REGIME_CONFIG[roadmap.regime];

  // Check if any matching actions exist across visible phases
  const totalMatchingActions = useMemo(() => {
    let count = 0;
    for (const phase of roadmap.phases) {
      if (activePhaseId !== "all" && activePhaseId !== phase.id) continue;
      for (const action of phase.actions) {
        if (selectedCategory !== "all" && action.source !== selectedCategory) continue;
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const match =
            action.text.toLowerCase().includes(q) ||
            (action.why && action.why.toLowerCase().includes(q)) ||
            (action.tag && action.tag.toLowerCase().includes(q));
          if (!match) continue;
        }
        count++;
      }
    }
    return count;
  }, [roadmap.phases, activePhaseId, selectedCategory, searchQuery]);

  return (
    <div className="space-y-6">
      {/* ── 1. Strategic HUD & Executive Header ── */}
      <div className="overflow-hidden rounded-3xl border border-line/80 bg-card p-6 shadow-card transition-all sm:p-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0 max-w-3xl">
            <div className="flex flex-wrap items-center gap-2.5">
              <span
                className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-wider shadow-sm ${regimeInfo.badgeTone}`}
              >
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-current opacity-75" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-current" />
                </span>
                {roadmap.cycleLabel || regimeInfo.label}
              </span>
              {roadmap.runwayMonths != null && (
                <span className="inline-flex items-center gap-1 rounded-full border border-line/70 bg-surface/80 px-3 py-1 text-xs font-medium text-ink-soft">
                  <ClockIcon className="h-3.5 w-3.5 text-accent" />
                  {roadmap.runwayMonths} months runway
                </span>
              )}
            </div>

            <h2 className="mt-3 text-2xl font-extrabold tracking-tight text-ink sm:text-3xl">
              {roadmap.headline}
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-ink-soft sm:text-base">
              {roadmap.subhead}
            </p>
          </div>

          {/* Operative Deadline Card */}
          {roadmap.operativeDeadlineISO && (
            <div className="w-full sm:w-auto shrink-0 rounded-2xl border border-line/70 bg-surface/70 p-4 shadow-sm backdrop-blur-sm">
              <div className="text-xs font-medium text-ink-faint uppercase tracking-wider">
                Target Milestone
              </div>
              <div className="mt-1 flex items-baseline gap-2">
                <span className="text-base font-bold text-ink">
                  {formatDate(roadmap.operativeDeadlineISO)}
                </span>
                {roadmap.runwayDays != null && (
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-xs font-bold tabular-nums shadow-sm ${
                      roadmap.runwayDays <= 14
                        ? "bg-reach-soft text-reach-ink"
                        : roadmap.runwayDays <= 30
                          ? "bg-target-soft text-target-ink"
                          : "bg-likely-soft text-likely-ink"
                    }`}
                  >
                    {daysLeftLabel(roadmap.runwayDays)}
                  </span>
                )}
              </div>
              <div className="mt-1 text-xs text-ink-soft">
                {roadmap.operativeDeadlineLabel}
              </div>
            </div>
          )}
        </div>

        {/* Strategic Journey Progress Ribbon */}
        <div className="mt-8 pt-6 border-t border-line/60">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-ink-faint">
              Strategic Journey Flow ({roadmap.phases.length} Phases)
            </span>
            <div className="flex items-center gap-3 text-xs font-medium text-ink-soft">
              <span>
                <strong className="text-ink font-bold">{focusedCount}</strong> / {allActions.length} Actions Focused
              </span>
              <span className="text-line">|</span>
              <button
                type="button"
                onClick={expandAll}
                className="text-accent-ink hover:underline focus-visible:focus-ring rounded px-1"
              >
                Expand all
              </button>
              <span className="text-line">·</span>
              <button
                type="button"
                onClick={collapseAll}
                className="text-ink-soft hover:underline focus-visible:focus-ring rounded px-1"
              >
                Collapse all
              </button>
            </div>
          </div>

          {/* Interactive Phase Stepper Track */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-4 3xl:grid-cols-6 gap-3">
            {roadmap.phases.map((phase, idx) => {
              const isSelected = activePhaseId === phase.id;
              const urgency = URGENCY_CONFIG[phase.urgency];
              return (
                <button
                  key={phase.id}
                  type="button"
                  aria-pressed={isSelected}
                  onClick={() =>
                    setActivePhaseId(activePhaseId === phase.id ? "all" : phase.id)
                  }
                  className={`group relative flex flex-col justify-between rounded-2xl border p-4 text-left transition-all duration-200 focus-visible:focus-ring touch-manipulation ${
                    isSelected
                      ? "border-accent bg-accent-soft/30 shadow-md ring-2 ring-accent/30"
                      : "border-line/70 bg-surface/60 hover:border-accent/40 hover:bg-surface hover:shadow-sm"
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span
                        className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold transition-transform group-hover:scale-110 ${
                          isSelected
                            ? "bg-accent text-on-fill shadow-sm"
                            : "bg-card border border-line text-ink"
                        }`}
                      >
                        {idx + 1}
                      </span>
                      <span className="text-xs font-bold uppercase tracking-wider text-accent-ink truncate">
                        {phase.rangeLabel}
                      </span>
                    </div>
                    <span
                      className={`h-2 w-2 rounded-full ${urgency.dot}`}
                      title={urgency.label}
                    />
                  </div>
                  <div className="mt-2.5">
                    <div className="font-bold text-sm text-ink group-hover:text-accent-ink transition-colors line-clamp-1">
                      {phase.name}
                    </div>
                    <div className="text-xs text-ink-soft mt-0.5">
                      {phase.actions.length} {phase.actions.length === 1 ? "milestone" : "milestones"}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── 2. Interactive Search & Category Filter Toolbar ── */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-line/70 bg-card p-4 shadow-sm">
        {/* Category Pills */}
        <div className="flex flex-wrap items-center gap-1.5 overflow-x-auto">
          <CategoryFilterPill
            label="All Milestones"
            count={categoryCounts.all}
            active={selectedCategory === "all"}
            onClick={() => setSelectedCategory("all")}
          />
          {categoryCounts.competition > 0 && (
            <CategoryFilterPill
              label="Competitions"
              count={categoryCounts.competition}
              active={selectedCategory === "competition"}
              onClick={() => setSelectedCategory("competition")}
              icon={<TrophyIcon className="h-3.5 w-3.5" />}
            />
          )}
          {categoryCounts.sat > 0 && (
            <CategoryFilterPill
              label="Testing / SAT"
              count={categoryCounts.sat}
              active={selectedCategory === "sat"}
              onClick={() => setSelectedCategory("sat")}
              icon={<PencilIcon className="h-3.5 w-3.5" />}
            />
          )}
          {categoryCounts.profile > 0 && (
            <CategoryFilterPill
              label="Profile & Spikes"
              count={categoryCounts.profile}
              active={selectedCategory === "profile"}
              onClick={() => setSelectedCategory("profile")}
              icon={<SparkIcon className="h-3.5 w-3.5" />}
            />
          )}
          {categoryCounts.note > 0 && (
            <CategoryFilterPill
              label="Logistics & Strategy"
              count={categoryCounts.note}
              active={selectedCategory === "note"}
              onClick={() => setSelectedCategory("note")}
              icon={<CompassIcon className="h-3.5 w-3.5" />}
            />
          )}
        </div>

        {/* Search Filter Box */}
        <div className="relative min-w-[220px] flex-1 sm:max-w-xs">
          <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-faint" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search milestones..."
            aria-label="Search milestones"
            className="w-full rounded-xl border border-line bg-surface pl-9 pr-9 py-2.5 text-xs text-ink placeholder:text-ink-faint transition-all focus:border-accent focus:bg-card focus:outline-none focus:ring-1 focus:ring-accent"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              aria-label="Clear search query"
              className="absolute right-1.5 top-1/2 -translate-y-1/2 flex min-h-[36px] min-w-[36px] items-center justify-center text-sm text-ink-faint hover:text-ink focus-visible:focus-ring rounded-lg touch-manipulation"
            >
              ×
            </button>
          )}
        </div>
      </div>

      {/* Global Empty State or Filter Reset Banner */}
      {roadmap.phases.length === 0 || allActions.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-line/80 bg-card/60 p-8 text-center shadow-card">
          <p className="text-base font-bold text-ink">No strategic milestones scheduled yet</p>
          <p className="mt-1 text-sm text-ink-soft max-w-md mx-auto leading-relaxed">
            {roadmap.subhead || "Select your target schools and destination tracks to generate an active milestone timeline."}
          </p>
        </div>
      ) : totalMatchingActions === 0 ? (
        <div className="rounded-3xl border border-dashed border-line p-8 text-center bg-card shadow-card">
          <p className="text-sm font-semibold text-ink">
            No milestones match your active filters
          </p>
          <p className="mt-1 text-xs text-ink-soft">
            Try adjusting your search terms or clearing category filters.
          </p>
          <button
            type="button"
            onClick={resetFilters}
            className="mt-4 inline-flex min-h-[44px] items-center rounded-xl bg-accent px-5 py-2.5 text-xs font-semibold text-on-fill shadow-sm hover:opacity-90 transition-opacity focus-visible:focus-ring touch-manipulation"
          >
            Reset all filters
          </button>
        </div>
      ) : null}

      {/* ── 3. Interactive Phased Timeline Track ── */}
      {totalMatchingActions > 0 && (
        <div className="relative space-y-8 pl-10 sm:pl-12">
          {/* Animated continuous vertical connecting track aligned precisely with node pins */}
          <div
            className="absolute bottom-6 left-[20px] sm:left-[24px] top-6 w-0.5 -translate-x-1/2 bg-gradient-to-b from-accent via-target to-likely/60"
            aria-hidden="true"
          />

          {roadmap.phases.map((phase, phaseIndex) => {
          if (activePhaseId !== "all" && activePhaseId !== phase.id) {
            return null;
          }

          // Filter actions inside this phase
          let filteredActions = phase.actions;
          if (selectedCategory !== "all") {
            filteredActions = filteredActions.filter(
              (a) => a.source === selectedCategory,
            );
          }
          if (searchQuery.trim()) {
            const q = searchQuery.toLowerCase();
            filteredActions = filteredActions.filter(
              (a) =>
                a.text.toLowerCase().includes(q) ||
                (a.why && a.why.toLowerCase().includes(q)) ||
                (a.tag && a.tag.toLowerCase().includes(q)),
            );
          }

          const isExpanded = expandedPhases[phase.id] ?? true;
          const urgency = URGENCY_CONFIG[phase.urgency];

          return (
            <motion.div
              key={phase.id}
              initial={shouldReduceMotion ? false : { opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={
                shouldReduceMotion
                  ? { duration: 0 }
                  : { duration: 0.3, delay: phaseIndex * 0.05 }
              }
              className="relative"
            >
              {/* Interactive Glowing Phase Node Pin centered on the track line */}
              <button
                type="button"
                onClick={() => togglePhaseExpand(phase.id)}
                aria-label={`Toggle phase ${phase.name}`}
                aria-expanded={isExpanded}
                aria-controls={`phase-body-${phase.id}`}
                className={`group absolute -left-[36px] sm:-left-[42px] top-5 z-10 flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-full border-2 bg-card transition-all duration-300 focus-visible:focus-ring touch-manipulation ${
                  phase.urgency === "now"
                    ? "border-reach ring-4 ring-reach/20 shadow-lg scale-105"
                    : "border-accent/70 hover:border-accent hover:scale-110 shadow-sm"
                }`}
              >
                {phase.urgency === "now" && (
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-reach opacity-60" />
                )}
                <span className="text-xs font-bold text-ink">
                  {phaseIndex + 1}
                </span>
              </button>

              {/* Main Phase Card Container */}
              <div className="ml-2 sm:ml-3 rounded-3xl border border-line/80 bg-card p-5 sm:p-7 shadow-card transition-all hover:border-line">
                {/* Accessible Phase Header Accordion Trigger */}
                <button
                  type="button"
                  id={`phase-trigger-${phase.id}`}
                  aria-expanded={isExpanded}
                  aria-controls={`phase-body-${phase.id}`}
                  onClick={() => togglePhaseExpand(phase.id)}
                  className="w-full text-left cursor-pointer select-none rounded-xl focus-visible:focus-ring p-1 -m-1"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs font-extrabold uppercase tracking-wider text-accent-ink">
                        {phase.rangeLabel}
                      </span>
                      <span
                        className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-semibold ${urgency.badge}`}
                      >
                        <span className={`h-1.5 w-1.5 rounded-full ${urgency.dot}`} />
                        {urgency.label}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium text-ink-faint">
                        {filteredActions.length} {filteredActions.length === 1 ? "action" : "actions"}
                      </span>
                      <ChevronDownIcon
                        className={`h-4 w-4 text-ink-soft transition-transform duration-200 ${
                          isExpanded ? "rotate-180" : ""
                        }`}
                      />
                    </div>
                  </div>

                  <h3 className="mt-2 text-xl font-bold tracking-tight text-ink sm:text-2xl">
                    {phase.name}
                  </h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-ink-soft sm:text-[0.95rem]">
                    {phase.focus}
                  </p>
                </button>

                {/* Expandable Phase Actions Container */}
                <AnimatePresence initial={false}>
                  {isExpanded && (
                    <motion.div
                      id={`phase-body-${phase.id}`}
                      role="region"
                      aria-labelledby={`phase-trigger-${phase.id}`}
                      key={`content-${phase.id}`}
                      initial={shouldReduceMotion ? false : { opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, height: 0 }}
                      transition={
                        shouldReduceMotion
                          ? { duration: 0 }
                          : { duration: 0.25, ease: "easeInOut" }
                      }
                      className="overflow-hidden"
                    >
                      <div className="mt-5 border-t border-line/60 pt-5">
                        {filteredActions.length > 0 ? (
                          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
                            {filteredActions.map((action) => {
                              // Stable unique key derived from phase and action identity
                              const actionKey = `${phase.id}-${action.source}-${action.text}`;
                              const isFocused = Boolean(focusedActions[actionKey]);

                              return (
                                <ActionMilestoneCard
                                  key={actionKey}
                                  action={action}
                                  isFocused={isFocused}
                                  onToggleFocus={() => toggleFocus(actionKey)}
                                />
                              );
                            })}
                          </div>
                        ) : (
                          <div className="rounded-2xl border border-dashed border-line p-6 text-center text-sm text-ink-soft">
                            {searchQuery || selectedCategory !== "all" ? (
                              <div className="space-y-2">
                                <p>No milestones in this phase match your active filters.</p>
                                <button
                                  type="button"
                                  onClick={resetFilters}
                                  className="text-xs font-semibold text-accent-ink hover:underline"
                                >
                                  Clear active filters
                                </button>
                              </div>
                            ) : (
                              "No actions scheduled in this phase yet."
                            )}
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          );
        })}
        </div>
      )}

      {/* ── 4. Unconfirmed Deadlines & Deferred Sections (If present) ── */}
      {showExtraSections && roadmap.unconfirmedDeadlines && roadmap.unconfirmedDeadlines.length > 0 && (
        <div className="rounded-3xl border border-line/80 bg-card p-6 shadow-card">
          <div className="flex items-center gap-2">
            <InfoCircleIcon className="h-5 w-5 text-target-ink" />
            <h3 className="text-lg font-bold tracking-tight text-ink">
              Verify These Institutional Deadlines
            </h3>
          </div>
          <p className="mt-1 text-sm text-ink-soft leading-relaxed max-w-3xl">
            Some programs use rolling admissions, specific department cutoffs, or unpublished cycles. Always verify directly on their admissions portals.
          </p>
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
            {roadmap.unconfirmedDeadlines.map((action) => {
              const unconfKey = `unconf-${action.source}-${action.text}`;
              return (
                <ActionMilestoneCard
                  key={unconfKey}
                  action={action}
                  isFocused={Boolean(focusedActions[unconfKey])}
                  onToggleFocus={() => toggleFocus(unconfKey)}
                />
              );
            })}
          </div>
        </div>
      )}

      {showExtraSections && roadmap.deferred && roadmap.deferred.length > 0 && (
        <div className="rounded-3xl border border-line/80 bg-card/70 p-6 shadow-card">
          <div className="flex items-center gap-2">
            <ClockIcon className="h-5 w-5 text-ink-soft" />
            <h3 className="text-lg font-bold tracking-tight text-ink">
              Future Runway & Beyond Current Cycle
            </h3>
          </div>
          <p className="mt-1 text-sm text-ink-soft leading-relaxed max-w-3xl">
            High-leverage spike moves that require multi-semester development. Perfect for upcoming application rounds or gap year planning.
          </p>
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
            {roadmap.deferred.map((action) => {
              const deferKey = `defer-${action.source}-${action.text}`;
              return (
                <ActionMilestoneCard
                  key={deferKey}
                  action={action}
                  isFocused={Boolean(focusedActions[deferKey])}
                  onToggleFocus={() => toggleFocus(deferKey)}
                />
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

/** Interactive Action Milestone Card with tactile focus button, category badge, and countdown */
function ActionMilestoneCard({
  action,
  isFocused,
  onToggleFocus,
}: {
  action: RoadmapAction;
  isFocused: boolean;
  onToggleFocus: () => void;
}) {
  const sourceDetails = SOURCE_THEME[action.source] || SOURCE_THEME.note;

  return (
    <div
      className={`group relative flex flex-col justify-between rounded-2xl border p-4 sm:p-5 transition-all duration-200 ${
        isFocused
          ? "border-accent/80 bg-accent-soft/20 shadow-md ring-1 ring-accent/40"
          : "border-line/70 bg-surface/70 hover:border-accent/40 hover:bg-surface hover:shadow-card hover:-translate-y-0.5"
      }`}
    >
      <div>
        {/* Card Header: Source Icon & Focus Toggle */}
        <div className="flex items-start justify-between gap-2 mb-3">
          <div className="flex items-center gap-2">
            <span
              className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border shadow-sm ${sourceDetails.container}`}
            >
              {sourceDetails.icon}
            </span>
            <span className="text-xs font-bold uppercase tracking-wider text-ink-faint">
              {sourceDetails.label}
            </span>
          </div>

          {/* Accessible Touch-Friendly Star Focus Button (min 44x44px touch target) */}
          <button
            type="button"
            onClick={onToggleFocus}
            aria-pressed={isFocused}
            aria-label={isFocused ? "Unmark priority focus" : "Mark as priority focus"}
            title={isFocused ? "Marked as priority focus" : "Click to mark as priority"}
            className={`flex min-h-[44px] min-w-[44px] items-center justify-center rounded-xl border p-2.5 transition-all active:scale-90 focus-visible:focus-ring touch-manipulation ${
              isFocused
                ? "border-accent bg-accent text-on-fill shadow-sm scale-105"
                : "border-line/60 bg-card text-ink-faint hover:border-accent hover:text-accent-ink hover:bg-surface"
            }`}
          >
            <StarIcon className={`h-4 w-4 ${isFocused ? "fill-current" : ""}`} />
          </button>
        </div>

        {/* Action Title */}
        <h4 className="text-sm font-bold leading-snug text-ink group-hover:text-accent-ink transition-colors break-words [overflow-wrap:anywhere]">
          {action.text}
        </h4>

        {/* Rationale / Context */}
        {action.why && (
          <p className="mt-2 text-xs leading-relaxed text-ink-soft break-words [overflow-wrap:anywhere]">
            {action.why}
          </p>
        )}
      </div>

      {/* Card Footer: Tag, Countdown & Action Link */}
      <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-line/40 pt-3">
        <div className="flex flex-wrap items-center gap-1.5 min-w-0">
          {action.tag && (
            <span className="inline-flex max-w-full truncate rounded-md border border-line/60 bg-card px-2 py-0.5 text-xs font-semibold text-ink-soft uppercase tracking-wide shadow-sm">
              {action.tag}
            </span>
          )}
          {action.daysLeft != null && (
            <span
              className={`rounded-md px-2 py-0.5 text-xs font-bold tabular-nums shadow-sm ${
                action.daysLeft <= 14
                  ? "bg-reach-soft text-reach-ink"
                  : action.daysLeft <= 30
                    ? "bg-target-soft text-target-ink"
                    : "bg-likely-soft text-likely-ink"
              }`}
            >
              {daysLeftLabel(action.daysLeft)}
            </span>
          )}
        </div>

        {action.url && (
          <a
            href={action.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-xs font-bold text-accent-ink hover:underline underline-offset-2 focus-visible:focus-ring rounded px-2 min-h-[44px] touch-manipulation"
          >
            Details
            <ArrowUpRightIcon className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </a>
        )}
      </div>
    </div>
  );
}

/** Quick category pill filter */
function CategoryFilterPill({
  label,
  count,
  active,
  onClick,
  icon,
}: {
  label: string;
  count: number;
  active: boolean;
  onClick: () => void;
  icon?: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`inline-flex items-center gap-1.5 rounded-xl border px-3.5 py-2 text-xs font-semibold transition-all focus-visible:focus-ring min-h-[44px] touch-manipulation ${
        active
          ? "border-accent bg-accent text-on-fill shadow-sm"
          : "border-line/70 bg-surface/70 text-ink-soft hover:border-ink/30 hover:text-ink hover:bg-card"
      }`}
    >
      {icon}
      <span>{label}</span>
      <span
        className={`rounded-full px-1.5 py-0.5 text-xs tabular-nums ${
          active ? "bg-current/15 text-on-fill font-bold" : "bg-card text-ink-faint"
        }`}
      >
        {count}
      </span>
    </button>
  );
}

/* ── Semantic Design Token-Driven Themes ── */

const SOURCE_THEME: Record<
  string,
  { label: string; container: string; icon: React.ReactNode }
> = {
  sat: {
    label: "Testing / SAT",
    container: "bg-accent-soft/60 border-accent/30 text-accent-ink",
    icon: <PencilIcon className="h-3.5 w-3.5" />,
  },
  competition: {
    label: "Competition",
    container: "bg-target-soft/60 border-target/30 text-target-ink",
    icon: <TrophyIcon className="h-3.5 w-3.5" />,
  },
  profile: {
    label: "Profile Spike",
    container: "bg-ivy-soft/60 border-ivy/30 text-ivy-ink",
    icon: <SparkIcon className="h-3.5 w-3.5" />,
  },
  note: {
    label: "Logistics",
    container: "bg-surface border-line text-ink-soft",
    icon: <CompassIcon className="h-3.5 w-3.5" />,
  },
};

function TrophyIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
      <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
      <path d="M4 22h16" />
      <path d="M10 14.66V17c0 .55-.45.98-.98 1.2A4 4 0 0 0 12 20a4 4 0 0 0 2.98-1.8c-.53-.22-.98-.65-.98-1.2v-2.34" />
      <path d="M6 4h12v7a6 6 0 0 1-12 0V4Z" />
    </svg>
  );
}

function PencilIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
      <path d="m15 5 4 4" />
    </svg>
  );
}

function SparkIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" />
    </svg>
  );
}

function CompassIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="10" />
      <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" />
    </svg>
  );
}

function ClockIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  );
}

function StarIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </svg>
  );
}

function SearchIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  );
}

function ChevronDownIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <polyline points="6 9 12 15 18 9" />
    </svg>
  );
}

function ArrowUpRightIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <line x1="7" y1="17" x2="17" y2="7" />
      <polyline points="7 7 17 7 17 17" />
    </svg>
  );
}

function InfoCircleIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="16" x2="12" y2="12" />
      <line x1="12" y1="8" x2="12.01" y2="8" />
    </svg>
  );
}
