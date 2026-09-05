"use client";

import { useState, useMemo } from "react";
import {
  motion,
  AnimatePresence,
  useReducedMotion,
  useMotionValue,
  useSpring,
  useTransform,
  type Variants,
} from "framer-motion";
import { cn } from "@/lib/utils";

// ── 60fps Composite-Only Animation Variants ──────────────────────────────────
const SPRING_TRANSITION = { type: "spring" as const, stiffness: 120, damping: 20 };

const FADE_UP_VARIANTS: Variants = {
  hidden: { opacity: 0, y: 24 },
  show: {
    opacity: 1,
    y: 0,
    transition: SPRING_TRANSITION,
  },
};

const STAGGER_CONTAINER: Variants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.05,
    },
  },
};

// ── High-Performance 3D Perspective Tilt Hook ────────────────────────────────
function useBespokeTilt() {
  const shouldReduceMotion = useReducedMotion();
  const x = useMotionValue(0.5);
  const y = useMotionValue(0.5);

  const rotateX = useSpring(useTransform(y, [0, 1], [3.5, -3.5]), {
    stiffness: 180,
    damping: 24,
  });
  const rotateY = useSpring(useTransform(x, [0, 1], [-3.5, 3.5]), {
    stiffness: 180,
    damping: 24,
  });

  const onMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (shouldReduceMotion) return;
    const rect = e.currentTarget.getBoundingClientRect();
    x.set((e.clientX - rect.left) / rect.width);
    y.set((e.clientY - rect.top) / rect.height);
  };

  const onMouseLeave = () => {
    x.set(0.5);
    y.set(0.5);
  };

  return {
    style: shouldReduceMotion
      ? {}
      : { rotateX, rotateY, transformPerspective: 1000 },
    onMouseMove,
    onMouseLeave,
  };
}

// ── Bespoke Inline Accessible SVGs ───────────────────────────────────────────
function SparkleIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
    </svg>
  );
}

function CompassIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="10" />
      <polygon
        points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"
        fill="currentColor"
        fillOpacity="0.2"
      />
    </svg>
  );
}

function CodeNodeMonogram({ className = "w-7 h-7" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 32 32"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <rect x="3" y="3" width="26" height="26" rx="8" strokeOpacity="0.4" />
      <path d="M11 12l-4 4 4 4" strokeWidth="2" />
      <path d="M21 12l4 4-4 4" strokeWidth="2" />
      <line x1="18" y1="10" x2="14" y2="22" strokeWidth="1.75" strokeDasharray="1 3" />
      <circle cx="16" cy="16" r="2.5" fill="currentColor" />
    </svg>
  );
}

function AuditShieldMonogram({ className = "w-7 h-7" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 32 32"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path
        d="M16 3L6 7v8c0 7.5 4.5 13.5 10 14 5.5-.5 10-6.5 10-14V7l-10-4z"
        strokeOpacity="0.4"
      />
      <path d="m11 16 3.5 3.5L21 12" strokeWidth="2" />
      <circle cx="16" cy="16" r="8" strokeOpacity="0.3" strokeDasharray="2 3" />
    </svg>
  );
}

function TerminalIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <polyline points="4 17 10 11 4 5" />
      <line x1="12" y1="19" x2="20" y2="19" />
    </svg>
  );
}

function PhoneCallIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
    </svg>
  );
}

function CheckIcon({ className = "w-3.5 h-3.5" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

function ArrowRightIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <line x1="5" y1="12" x2="19" y2="12" />
      <polyline points="12 5 19 12 12 19" />
    </svg>
  );
}

// ── Types ────────────────────────────────────────────────────────────────────
type PerspectiveTab = "unified" | "alibek" | "kirill";

interface MilestoneData {
  id: string;
  year: string;
  epochNumber: string;
  quarter: string;
  title: string;
  tagline: string;
  lead: string;
  fieldNotes: string[];
}

// ── Component Definition ─────────────────────────────────────────────────────
export function OriginStory() {
  const [activeTab, setActiveTab] = useState<PerspectiveTab>("unified");
  const [activeEpoch, setActiveEpoch] = useState<number>(0);

  const alibekTilt = useBespokeTilt();
  const kirillTilt = useBespokeTilt();

  // Memoized Static Chronicles
  const milestones: MilestoneData[] = useMemo(
    () => [
      {
        id: "epoch-2024",
        year: "2024",
        epochNumber: "01",
        quarter: "Grade 11 · Autumn",
        title: "The Wall of Expired Deadlines",
        tagline: "When searching for opportunities felt like wading through digital landfill.",
        lead: "At NIS Shymkent, we set out to find international science olympiads, research grants, and pre-college summer programs. What we found instead was an ecosystem of predatory blogs charging $80 for submissions, copying 2021 deadlines, and treating Central Asian students as completely invisible.",
        fieldNotes: [
          "Catalog sites claiming to be 'free' demanded $80 to submit or $120 to download the completion certificate required for scholarship packets.",
          "Stale deadlines copied from 2021 that had expired three years earlier were presented as live competitions.",
          "Over 90% of indexed lists were authored for US college graduates, leaving Central Asian high schoolers completely ignored.",
        ],
      },
      {
        id: "epoch-2025",
        year: "2025",
        epochNumber: "02",
        quarter: "Grade 11 · Spring",
        title: "The Spreadsheet That Broke the Rules",
        tagline: "From midnight phone calls to automated headless verification.",
        lead: "We abandoned aggregator portals entirely. Kirill called competition secretariats directly across Kazakhstan and Europe, while Alibek wrote Python scrapers to inspect official domain certificates. We compiled the verified findings into an unlisted spreadsheet that spread to 12 schools in 72 hours.",
        fieldNotes: [
          "Automated link-verification engines crawl organizer servers directly on every build to detect rotten links.",
          "Rule zero: if an organizer had not yet posted current cycle dates, we wrote 'Dates not announced yet' rather than guessing.",
          "Shared with NIS classmates; within 72 hours, it was in active use across 12 high schools in Almaty, Astana, and Tashkent.",
        ],
      },
      {
        id: "epoch-2026",
        year: "2026",
        epochNumber: "03",
        quarter: "Class of 2026 · Graduation",
        title: "The Compass Manifesto",
        tagline: "Free, open, zero ad-trackers, zero compromise.",
        lead: "As we graduate from the Nazarbayev Intellectual School in June 2026, Compass is our permanent gift to high school students everywhere. No investors to pay back, no ads, and equal reverence for studying at home debt-free and pursuing funded routes abroad.",
        fieldNotes: [
          "Strict server-side verification: zero paid rankings, zero sponsored search results, and zero vanity promotions.",
          "Private by design: all saved career plans and roadmaps live in your browser's localStorage, never in an ad broker's database.",
          "Equal reverence for domestic and global paths: highlighting zero-debt local university programs alongside funded global master's routes.",
        ],
      },
    ],
    []
  );

  const tabs = useMemo(
    () => [
      { id: "unified" as const, label: "Unified Chronicle", sub: "Collaborative Origin" },
      { id: "alibek" as const, label: "Alibek · The Code Desk", sub: "Scrapers & Privacy" },
      { id: "kirill" as const, label: "Kirill · The Audit Desk", sub: "Phone Logs & Auditing" },
    ],
    []
  );

  return (
    <section className="space-y-14 sm:space-y-20">
      {/* ── AMBIENT BACKDROP LIGHTING ────────────────────────────────────────── */}
      <div className="pointer-events-none relative">
        <div className="absolute -top-16 left-1/4 h-72 w-72 rounded-full bg-cyan-500/10 blur-[100px]" />
        <div className="absolute -top-16 right-1/4 h-72 w-72 rounded-full bg-emerald-500/10 blur-[100px]" />
      </div>

      {/* ── PHASE 1: EDITORIAL OVERTURE & PERSPECTIVE SWITCHER ─────────────── */}
      <motion.div
        variants={STAGGER_CONTAINER}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, amount: 0.15 }}
        className="flex flex-col lg:flex-row lg:items-end justify-between gap-8 pb-4 border-b border-white/[0.07]"
      >
        <div className="space-y-4 max-w-3xl">
          <motion.div
            variants={FADE_UP_VARIANTS}
            className="inline-flex items-center gap-2 text-xs font-mono font-semibold tracking-widest text-accent-ink uppercase"
          >
            <SparkleIcon className="w-3.5 h-3.5 text-accent-ink" />
            Origin Chronicle · NIS PhM Shymkent
          </motion.div>
          <motion.h2
            variants={FADE_UP_VARIANTS}
            className="font-display text-3xl sm:text-4xl md:text-5xl font-normal tracking-tight text-white leading-[1.18]"
          >
            Two high schoolers. Zero corporate pitch. <br />
            <span className="bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
              One stubborn rule.
            </span>
          </motion.h2>
          <motion.p
            variants={FADE_UP_VARIANTS}
            className="text-base sm:text-lg text-slate-300 leading-relaxed max-w-[65ch] text-pretty"
          >
            In the spring of eleventh grade in Shymkent, Kazakhstan, we watched classmates pay $80 to
            submit applications to contests that had expired three years earlier. We did not incorporate,
            we raised zero funding, and we carry no corporate titles. We just refused to let predatory
            paywalls dictate where students from our region could go.
          </motion.p>
        </div>

        {/* ── 3-Tab Segmented Perspective Switcher ── */}
        <motion.div variants={FADE_UP_VARIANTS} className="w-full sm:w-auto shrink-0 self-start lg:self-auto max-w-full">
          <div className="w-full sm:w-auto overflow-x-auto pb-1 -mb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            <div
              role="tablist"
              aria-label="Origin perspectives"
              className="inline-flex p-1.5 rounded-2xl border border-white/[0.1] bg-white/[0.03] backdrop-blur-xl shadow-[inset_0_1px_0_0_rgba(255,255,255,0.08)]"
            >
              {tabs.map((tab) => {
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    role="tab"
                    aria-selected={isActive}
                    onClick={() => setActiveTab(tab.id)}
                    className={cn(
                      "relative rounded-xl px-3.5 sm:px-4 py-2 text-left transition-colors min-h-[44px] flex flex-col justify-center focus-visible:focus-ring",
                      isActive ? "text-white" : "text-slate-400 hover:text-slate-200"
                    )}
                  >
                    {isActive && (
                      <motion.div
                        layoutId="originPerspectivePill"
                        className="absolute inset-0 rounded-xl bg-white/[0.08] border border-white/[0.16] shadow-[0_4px_20px_rgba(0,0,0,0.4),inset_0_1px_0_0_rgba(255,255,255,0.15)]"
                        transition={{ type: "spring", stiffness: 350, damping: 30 }}
                      />
                    )}
                    <span className="relative z-10 text-xs sm:text-sm font-medium tracking-tight whitespace-nowrap">
                      {tab.label}
                    </span>
                    <span className="relative z-10 text-xs font-mono text-slate-400 hidden sm:block">
                      {tab.sub}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </motion.div>
      </motion.div>

      {/* ── PHASE 2: ASYMMETRICAL EDITORIAL DUAL CHRONICLE ──────────────────── */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -16 }}
          transition={{ duration: 0.28, ease: "easeInOut" }}
          className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch"
        >
          {/* ── ALIBEK USSIPBAYEV CARD ── */}
          {(activeTab === "unified" || activeTab === "alibek") && (
            <motion.div
              style={alibekTilt.style}
              onMouseMove={alibekTilt.onMouseMove}
              onMouseLeave={alibekTilt.onMouseLeave}
              className={cn(
                "group relative flex flex-col justify-between overflow-hidden rounded-[2rem] border border-white/[0.08] bg-gradient-to-b from-white/[0.06] via-white/[0.025] to-white/[0.01] p-6 sm:p-8 md:p-10 backdrop-blur-xl shadow-[inset_0_1px_0_0_rgba(255,255,255,0.14),0_20px_50px_-15px_rgba(0,0,0,0.6)] transition-all duration-300 hover:border-cyan-500/40 hover:shadow-[inset_0_1px_0_0_rgba(255,255,255,0.22),0_24px_50px_-12px_rgba(6,182,212,0.18)]",
                activeTab === "alibek" ? "lg:col-span-12" : "lg:col-span-6"
              )}
            >
              {/* Corner Specular Rim */}
              <div className="pointer-events-none absolute -top-20 -right-20 h-52 w-52 rounded-full bg-cyan-500/15 blur-2xl" />

              <div className="relative z-10 space-y-6">
                {/* Header Metadata & Monogram */}
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-1.5">
                    <div className="inline-flex items-center gap-2 text-xs font-mono font-medium tracking-wider uppercase text-cyan-400 bg-cyan-500/10 px-2.5 py-1 rounded-md border border-cyan-500/20">
                      <TerminalIcon className="w-3 h-3 text-cyan-400" />
                      Algorithmic Honesty & Local Privacy
                    </div>
                    <h3 className="text-2xl sm:text-3xl font-semibold text-white tracking-tight pt-1">
                      Alibek Ussipbayev
                    </h3>
                    <p className="text-xs font-mono text-slate-400 flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                      NIS PhM Shymkent · Class of 2026
                    </p>
                  </div>

                  {/* Bespoke Geometric Monogram */}
                  <div className="shrink-0 flex h-14 w-14 items-center justify-center rounded-2xl border border-cyan-500/30 bg-cyan-500/10 text-cyan-300 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.2)]">
                    <CodeNodeMonogram className="w-7 h-7" />
                  </div>
                </div>

                {/* Serif Pull-Quote */}
                <blockquote className="border-l-2 border-cyan-500/50 pl-4 py-1">
                  <p className="font-display italic text-lg sm:text-xl font-normal text-slate-100 leading-snug">
                    &ldquo;If an algorithm has to guess when a deadline is, that algorithm belongs in the
                    trash. We wrote scrapers to ping the university’s actual servers and break our build
                    the instant a link rots.&rdquo;
                  </p>
                </blockquote>

                {/* Field Journal Prose */}
                <div className="space-y-3 text-sm sm:text-base text-slate-300 font-normal leading-relaxed text-pretty max-w-[65ch]">
                  <p>
                    The biggest lie in student guidance is the recommendation black box. Most platforms
                    quietly harvest GPAs, sell contact lists to private test-prep mills, and use algorithms
                    that push whatever university bought a sponsored slot.
                  </p>
                  <p>
                    In Compass, every plan lives exclusively in your browser’s localStorage. No telemetry
                    tracks your ambitions. If an organizer moves an application date or a link rots, our
                    automated GitHub watchdog fails our deployment before any student can be misled.
                  </p>
                </div>
              </div>

              {/* Technical Spec Tags Footer */}
              <div className="relative z-10 pt-6 mt-6 border-t border-white/[0.08] flex flex-wrap items-center gap-2">
                {[
                  "LOCAL-FIRST STORAGE",
                  "ZERO TELEMETRY",
                  "HEADLESS LINK WATCHDOG",
                  "OFFICIAL DOMAIN CERTS",
                ].map((spec) => (
                  <span
                    key={spec}
                    className="text-xs font-mono tracking-wider uppercase px-2 py-0.5 rounded bg-white/[0.04] text-cyan-200/80 border border-white/[0.06]"
                  >
                    {spec}
                  </span>
                ))}
              </div>
            </motion.div>
          )}

          {/* ── KIRILL KIM CARD ── */}
          {(activeTab === "unified" || activeTab === "kirill") && (
            <motion.div
              style={kirillTilt.style}
              onMouseMove={kirillTilt.onMouseMove}
              onMouseLeave={kirillTilt.onMouseLeave}
              className={cn(
                "group relative flex flex-col justify-between overflow-hidden rounded-[2rem] border border-white/[0.08] bg-gradient-to-b from-white/[0.06] via-white/[0.025] to-white/[0.01] p-6 sm:p-8 md:p-10 backdrop-blur-xl shadow-[inset_0_1px_0_0_rgba(255,255,255,0.14),0_20px_50px_-15px_rgba(0,0,0,0.6)] transition-all duration-300 hover:border-emerald-500/40 hover:shadow-[inset_0_1px_0_0_rgba(255,255,255,0.22),0_24px_50px_-12px_rgba(16,185,129,0.18)]",
                activeTab === "kirill" ? "lg:col-span-12" : "lg:col-span-6"
              )}
            >
              {/* Corner Specular Rim */}
              <div className="pointer-events-none absolute -top-20 -right-20 h-52 w-52 rounded-full bg-emerald-500/15 blur-2xl" />

              <div className="relative z-10 space-y-6">
                {/* Header Metadata & Monogram */}
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-1.5">
                    <div className="inline-flex items-center gap-2 text-xs font-mono font-medium tracking-wider uppercase text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-md border border-emerald-500/20">
                      <PhoneCallIcon className="w-3 h-3 text-emerald-400" />
                      Ground-Truth Auditing & Fee Eradication
                    </div>
                    <h3 className="text-2xl sm:text-3xl font-semibold text-white tracking-tight pt-1">
                      Kirill Kim
                    </h3>
                    <p className="text-xs font-mono text-slate-400 flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                      NIS PhM Shymkent · Class of 2026
                    </p>
                  </div>

                  {/* Bespoke Geometric Monogram */}
                  <div className="shrink-0 flex h-14 w-14 items-center justify-center rounded-2xl border border-emerald-500/30 bg-emerald-500/10 text-emerald-300 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.2)]">
                    <AuditShieldMonogram className="w-7 h-7" />
                  </div>
                </div>

                {/* Serif Pull-Quote */}
                <blockquote className="border-l-2 border-emerald-500/50 pl-4 py-1">
                  <p className="font-display italic text-lg sm:text-xl font-normal text-slate-100 leading-snug">
                    &ldquo;We spent weekends calling competition committees from Almaty to Geneva to
                    confirm whether high schoolers from Kazakhstan were genuinely eligible. If the
                    organizers gave vague answers, we marked it unverified.&rdquo;
                  </p>
                </blockquote>

                {/* Field Journal Prose */}
                <div className="space-y-3 text-sm sm:text-base text-slate-300 font-normal leading-relaxed text-pretty max-w-[65ch]">
                  <p>
                    We lost count of how many &apos;free&apos; international olympiads turned out to be traps:
                    free to register, but $120 to download the completion certificate required for
                    scholarship applications.
                  </p>
                  <p>
                    We called coordinators directly, cross-referenced eligibility clauses in fine print,
                    and established rule zero: if an opportunity hides its real cost or hasn&apos;t announced
                    its current cycle dates, we refuse to pretend otherwise.
                  </p>
                </div>
              </div>

              {/* Audit Spec Tags Footer */}
              <div className="relative z-10 pt-6 mt-6 border-t border-white/[0.08] flex flex-wrap items-center gap-2">
                {[
                  "100% DIRECT COMMITTEE CALLS",
                  "ZERO HIDDEN FEES",
                  "CENTRAL ASIAN ELIGIBILITY PROOF",
                  "RULE ZERO AUDITING",
                ].map((spec) => (
                  <span
                    key={spec}
                    className="text-xs font-mono tracking-wider uppercase px-2 py-0.5 rounded bg-white/[0.04] text-emerald-200/80 border border-white/[0.06]"
                  >
                    {spec}
                  </span>
                ))}
              </div>
            </motion.div>
          )}
        </motion.div>
      </AnimatePresence>

      {/* ── SYNERGY WORKFLOW BRIDGE (Unified View Exclusive) ──────────────── */}
      {activeTab === "unified" && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="relative overflow-hidden rounded-2xl border border-white/[0.08] bg-white/[0.02] p-5 sm:p-6 backdrop-blur-md"
        >
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-xs font-mono">
            <div className="flex items-center gap-2.5 text-emerald-400">
              <span className="flex h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>KIRILL: Ground-Truth Committee Phone Audits</span>
            </div>
            <div className="hidden md:flex items-center gap-2 text-slate-500">
              <span className="h-px w-8 bg-gradient-to-r from-emerald-500/40 to-cyan-500/40" />
              <ArrowRightIcon className="w-3.5 h-3.5 text-accent-ink" />
              <span className="h-px w-8 bg-gradient-to-r from-cyan-500/40 to-cyan-500/80" />
            </div>
            <div className="flex items-center gap-2.5 text-cyan-400">
              <span className="flex h-2 w-2 rounded-full bg-cyan-400 animate-pulse" />
              <span>ALIBEK: Automated CI Watchdog & Local-First Engine</span>
            </div>
          </div>
        </motion.div>
      )}

      {/* ── PHASE 3: THE 3-EPOCH SCROLLYTELLING CHRONICLE ───────────────────── */}
      <div className="space-y-6 pt-4">
        <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2">
          <div className="space-y-1">
            <div className="text-xs font-mono font-semibold tracking-widest text-accent-ink uppercase">
              Chronological Epochs
            </div>
            <h3 className="font-display text-2xl sm:text-3xl font-medium text-white tracking-tight">
              The Journey Through NIS PhM Shymkent
            </h3>
          </div>
          <div className="text-xs font-mono text-slate-400">
            Epoch {milestones[activeEpoch].epochNumber} of 03 · {milestones[activeEpoch].year}
          </div>
        </div>

        {/* Stepper Navigation Rail */}
        <div
          role="tablist"
          aria-label="Chronological epochs"
          className="grid grid-cols-1 md:grid-cols-3 gap-3.5"
        >
          {milestones.map((m, idx) => {
            const isSelected = activeEpoch === idx;
            return (
              <button
                key={m.id}
                id={`epoch-tab-${idx}`}
                type="button"
                role="tab"
                aria-selected={isSelected}
                aria-controls="epoch-panel"
                onClick={() => setActiveEpoch(idx)}
                className={cn(
                  "group relative flex flex-col text-left rounded-2xl border p-4 sm:p-5 transition-all min-h-[44px] focus-visible:focus-ring",
                  isSelected
                    ? "border-accent/50 bg-gradient-to-b from-accent/15 via-white/[0.04] to-transparent shadow-[0_8px_30px_rgba(0,0,0,0.4),inset_0_1px_0_0_rgba(255,255,255,0.15)]"
                    : "border-white/[0.08] bg-white/[0.02] hover:border-white/[0.15] hover:bg-white/[0.04]"
                )}
              >
                <div className="flex items-center justify-between w-full text-xs mb-2.5">
                  <div className="flex items-center gap-2">
                    <span
                      className={cn(
                        "font-mono text-xs font-bold px-2 py-0.5 rounded",
                        isSelected
                          ? "bg-accent/25 text-white border border-accent/40"
                          : "bg-white/[0.04] text-slate-400 border border-white/[0.06]"
                      )}
                    >
                      {m.year}
                    </span>
                    <span className="text-xs font-mono text-slate-400">{m.quarter}</span>
                  </div>
                  <span className="font-mono text-xs text-slate-400">Epoch {m.epochNumber}</span>
                </div>
                <div className="font-medium text-white text-base sm:text-lg leading-snug group-hover:text-slate-100 transition-colors">
                  {m.title}
                </div>
              </button>
            );
          })}
        </div>

        {/* Epoch Detail Plaque */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeEpoch}
            role="tabpanel"
            id="epoch-panel"
            aria-labelledby={`epoch-tab-${activeEpoch}`}
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -14 }}
            transition={{ duration: 0.24, ease: "easeOut" }}
            className="relative overflow-hidden rounded-[2rem] border border-white/[0.12] bg-gradient-to-b from-white/[0.05] via-white/[0.02] to-transparent p-6 sm:p-8 md:p-10 backdrop-blur-xl shadow-[inset_0_1px_0_0_rgba(255,255,255,0.12),0_16px_40px_rgba(0,0,0,0.5)]"
          >
            <div className="space-y-5">
              <div className="flex flex-wrap items-center gap-3">
                <span className="rounded-full bg-accent/20 px-3 py-1 text-xs font-mono font-semibold text-accent-ink border border-accent/30">
                  {milestones[activeEpoch].quarter}
                </span>
                <h4 className="text-xl sm:text-2xl font-semibold text-white tracking-tight">
                  {milestones[activeEpoch].title}
                </h4>
              </div>

              <p className="font-display italic text-lg sm:text-xl text-slate-200 leading-snug">
                {milestones[activeEpoch].tagline}
              </p>

              <p className="text-sm sm:text-base text-slate-300 leading-relaxed max-w-[65ch] text-pretty">
                {milestones[activeEpoch].lead}
              </p>

              {/* Verified Field Notes List */}
              <div className="pt-4 border-t border-white/[0.08] space-y-2.5">
                <div className="text-xs font-mono tracking-wider text-slate-400 uppercase">
                  Verified Field Notes
                </div>
                <ul className="space-y-2.5">
                  {milestones[activeEpoch].fieldNotes.map((note, i) => (
                    <li key={i} className="flex items-start gap-3 text-sm text-slate-200">
                      <span className="mt-1 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-accent/20 text-accent-ink border border-accent/30">
                        <CheckIcon className="w-2.5 h-2.5" />
                      </span>
                      <span className="leading-relaxed max-w-[65ch]">{note}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* ── PHASE 4: AUTHENTIC ARCHIVAL SCHOOL CREDENTIAL PLAQUE ─────────────── */}
      <motion.div
        variants={FADE_UP_VARIANTS}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, amount: 0.2 }}
        className="relative overflow-hidden rounded-[2rem] border border-white/[0.1] bg-gradient-to-b from-white/[0.04] via-white/[0.02] to-white/[0.01] p-6 sm:p-8 md:p-10 backdrop-blur-xl shadow-[inset_0_1px_0_0_rgba(255,255,255,0.12),0_16px_40px_rgba(0,0,0,0.5)]"
      >
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-8">
          <div className="space-y-3 max-w-2xl">
            <div className="inline-flex items-center gap-2 text-xs font-mono font-semibold uppercase tracking-wider text-accent-ink">
              <CompassIcon className="w-4 h-4 text-accent" />
              School-Grounded Perspective · Shymkent, Kazakhstan
            </div>
            <p className="font-display italic text-lg sm:text-xl text-slate-100 leading-snug">
              &ldquo;We are still in school uniform. That is not a corporate credential, but it is our
              greatest asset: we were the students drowning in bad information before we became the
              people making Compass to fix it.&rdquo;
            </p>
          </div>

          <div className="rounded-2xl border border-white/[0.12] bg-white/[0.04] p-5 text-center shrink-0 self-stretch lg:self-auto flex flex-col justify-center shadow-inner">
            <div className="text-xs font-mono text-slate-400 uppercase tracking-widest">
              Campus Coordinates
            </div>
            <div className="text-base font-semibold text-white mt-1">NIS PhM Shymkent</div>
            <div className="text-xs font-mono text-accent-ink mt-0.5">42.3417° N, 69.5901° E</div>
            <div className="text-xs font-mono text-emerald-400 mt-2 font-medium flex items-center justify-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              Graduating June 2026
            </div>
          </div>
        </div>
      </motion.div>
    </section>
  );
}
