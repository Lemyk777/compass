"use client";

import { useState, type ReactNode } from "react";
import { motion, AnimatePresence, type Variants } from "framer-motion";
import { Container } from "@/components/ui/Container";
import { MotionSafe } from "@/components/ui/MotionSafe";
import Link from "@/components/ui/Link";
import { ButtonLink } from "@/components/ui/Button";
import { CONTACT_EMAIL } from "@/lib/site";
import { cn } from "@/lib/utils";

export interface AboutStats {
  total: number;
  free: number;
  alwaysOpen: number;
  areas: number;
  majors: number;
  countries: number;
  cities: number;
  homeRoutes: number;
}

export interface AboutClientProps {
  stats?: Partial<AboutStats> | null;
}

const DEFAULT_STATS: AboutStats = {
  total: 0,
  free: 0,
  alwaysOpen: 0,
  areas: 0,
  majors: 0,
  countries: 0,
  cities: 0,
  homeRoutes: 0,
};

function sanitizeStat(val: unknown, fallback = 0): number {
  return typeof val === "number" && Number.isFinite(val) ? val : fallback;
}

// ── Animation Variants ────────────────────────────────────────────────────────
const FADE_UP: Variants = {
  hidden: { opacity: 0, y: 24 },
  show: {
    opacity: 1,
    y: 0,
    transition: { type: "spring", stiffness: 100, damping: 20 },
  },
};

const STAGGER: Variants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.12,
      delayChildren: 0.05,
    },
  },
};

const SCALE_IN: Variants = {
  hidden: { opacity: 0, scale: 0.96 },
  show: {
    opacity: 1,
    scale: 1,
    transition: { type: "spring", stiffness: 120, damping: 20 },
  },
};

// ── Inline Accessible SVGs ───────────────────────────────────────────────────
function CompassIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <circle cx="12" cy="12" r="10" />
      <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" fill="currentColor" fillOpacity="0.2" />
    </svg>
  );
}

function CheckShieldIcon({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  );
}

function ScalesOffIcon({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <path d="m16 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z" />
      <path d="m2 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z" />
      <path d="M7 21h10" />
      <path d="M12 3v18" />
      <path d="M3 7h2c2 0 5-1 7-2 2 1 5 2 7 2h2" />
      <line x1="3" y1="3" x2="21" y2="21" stroke="currentColor" strokeWidth="1.75" />
    </svg>
  );
}

function EyeOpenIcon({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function BrainOffIcon({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <path d="M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96.44 2.5 2.5 0 0 1-2.96-3.08 3 3 0 0 1-.34-5.58 2.5 2.5 0 0 1 1.32-4.24 2.5 2.5 0 0 1 4.44-5.04Z" />
      <path d="M14.5 2A2.5 2.5 0 0 0 12 4.5v15a2.5 2.5 0 0 0 4.96.44 2.5 2.5 0 0 0 2.96-3.08 3 3 0 0 0 .34-5.58 2.5 2.5 0 0 0-1.32-4.24 2.5 2.5 0 0 0-4.44-5.04Z" />
      <line x1="2" y1="2" x2="22" y2="22" stroke="currentColor" strokeWidth="1.75" />
    </svg>
  );
}

function SparkleIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <path d="m12 3-1.9 5.8a2 2 0 0 1-1.3 1.3L3 12l5.8 1.9a2 2 0 0 1 1.3 1.3L12 21l1.9-5.8a2 2 0 0 1 1.3-1.3L21 12l-5.8-1.9a2 2 0 0 1-1.3-1.3Z" />
    </svg>
  );
}

function ArrowUpRight({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <path d="M7 7h10v10" />
      <path d="M7 17 17 7" />
    </svg>
  );
}

function MailIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <rect width="20" height="16" x="2" y="4" rx="2" />
      <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
    </svg>
  );
}

// ── Reusable Glass Card ───────────────────────────────────────────────────────
function GlassCard({
  children,
  className = "",
  glow = false,
}: {
  children: ReactNode;
  className?: string;
  glow?: boolean;
}) {
  return (
    <div
      className={cn(
        "group relative overflow-hidden rounded-[2rem] border border-white/[0.08] bg-white/[0.03] p-6 sm:p-8 md:p-10 backdrop-blur-xl transition-all duration-300 hover:border-white/[0.18] hover:bg-white/[0.05] hover:shadow-[0_12px_40px_rgba(0,0,0,0.5)]",
        glow && "before:absolute before:-top-40 before:-right-40 before:h-80 before:w-80 before:rounded-full before:bg-accent/15 before:blur-3xl before:pointer-events-none",
        className
      )}
    >
      <div className="relative z-10">{children}</div>
    </div>
  );
}

// ── Timeline Milestone Data ──────────────────────────────────────────────────
interface Milestone {
  year: string;
  quarter: string;
  title: string;
  tagline: string;
  lead: string;
  details: string[];
}

const MILESTONES: Milestone[] = [
  {
    year: "2024",
    quarter: "Grade 11 · Autumn",
    title: "The Wall of Expired Deadlines",
    tagline: "When searching for opportunities felt like wading through junk.",
    lead: "At NIS Shymkent, we set out to find international olympiads, research programs, and pre-college summer grants. What we found instead was a broken internet.",
    details: [
      "Catalog websites that claimed to be 'free' charged $80 to submit or $120 for an completion certificate.",
      "Deadlines displayed were copied from 2021 and had expired three years earlier.",
      "90% of lists were authored for US college graduates, leaving Central Asian high schoolers completely invisible.",
    ],
  },
  {
    year: "2025",
    quarter: "Grade 11 · Spring",
    title: "The Spreadsheet That Broke the Rules",
    tagline: "From manual calling lists to automated headless verification.",
    lead: "We stopped reading aggregator sites. Kirill called competition coordinators directly across Kazakhstan and Europe, while Alibek wrote scrapers that verified official domain certificates.",
    details: [
      "Built automated link checkers that crawl organizer websites directly on every build.",
      "Rule zero: if an organizer hadn't announced the current cycle's date, we said 'Not announced yet' rather than guessing.",
      "Shared the spreadsheet with classmates at NIS; within 72 hours, it had spread to schools across Almaty, Astana, and Tashkent.",
    ],
  },
  {
    year: "2026",
    quarter: "Class of 2026 · Graduation",
    title: "The Compass Manifesto",
    tagline: "Free, open, zero ad-trackers, zero compromise.",
    lead: "As we graduate from the Nazarbayev Intellectual School of Physics and Mathematics, Compass is our permanent contribution to high school students everywhere.",
    details: [
      "Strict server-side verification: zero paid rankings, zero sponsored search results.",
      "Private by design: your plans, saved items, and notes live in your browser, never on an ad broker's server.",
      "Equal reverence for domestic and global paths: highlighting local university programs with zero debt alongside funded global master's routes.",
    ],
  },
];

export function AboutClient({ stats }: AboutClientProps = {}) {
  const total = sanitizeStat(stats?.total, DEFAULT_STATS.total);
  const free = sanitizeStat(stats?.free, DEFAULT_STATS.free);
  const alwaysOpen = sanitizeStat(stats?.alwaysOpen, DEFAULT_STATS.alwaysOpen);
  const areas = sanitizeStat(stats?.areas, DEFAULT_STATS.areas);
  const majors = sanitizeStat(stats?.majors, DEFAULT_STATS.majors);
  const countries = sanitizeStat(stats?.countries, DEFAULT_STATS.countries);
  const cities = sanitizeStat(stats?.cities, DEFAULT_STATS.cities);
  const homeRoutes = sanitizeStat(stats?.homeRoutes, DEFAULT_STATS.homeRoutes);

  // Interactive founder tabs state
  const [activeFounder, setActiveFounder] = useState<"both" | "alibek" | "kirill">("both");
  // Interactive milestone state
  const [activeMilestone, setActiveMilestone] = useState<number>(0);

  return (
    <MotionSafe>
      <div className="relative w-full overflow-hidden bg-[#0B111C] text-slate-100 selection:bg-accent/30 selection:text-white">
        {/* Deep ambient aurora illumination */}
        <div className="pointer-events-none absolute -top-40 left-1/2 -translate-x-1/2 h-[650px] w-full max-w-7xl opacity-40 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-accent/25 via-[#1a2b4b]/20 to-transparent blur-3xl" />
        <div className="pointer-events-none absolute top-[35%] -left-48 h-[500px] w-[500px] rounded-full bg-cyan-500/10 blur-[120px]" />
        <div className="pointer-events-none absolute top-[65%] -right-48 h-[600px] w-[600px] rounded-full bg-indigo-500/10 blur-[140px]" />

        <Container size="reading" className="relative z-10 py-12 sm:py-20 md:py-28 space-y-24 sm:space-y-32 md:space-y-40">
          
          {/* ── ACT 1: HERO MANIFESTO & LIVE VERIFIED METRICS ──────────────── */}
          <motion.section
            variants={STAGGER}
            initial="hidden"
            animate="show"
            className="flex flex-col items-start gap-8 md:gap-12"
          >
            {/* Origin Pill Badge */}
            <motion.div variants={FADE_UP} className="inline-flex items-center gap-2.5 rounded-full border border-accent/30 bg-accent/10 px-4 py-2 backdrop-blur-md">
              <span className="flex h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)] animate-pulse" />
              <span className="text-xs font-semibold tracking-wider text-accent-ink uppercase">
                NIS Shymkent · Class of 2026
              </span>
            </motion.div>

            {/* Apple-style Display Headline */}
            <div className="space-y-6 max-w-4xl">
              <motion.h1
                variants={FADE_UP}
                className="font-display text-4xl sm:text-6xl md:text-7xl font-medium tracking-tight leading-[1.08] text-white"
              >
                We built this for fun, <br />
                <span className="bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
                  because we needed it ourselves.
                </span>
              </motion.h1>

              <motion.p
                variants={FADE_UP}
                className="text-lg sm:text-xl text-slate-300 leading-relaxed max-w-[65ch] text-pretty"
              >
                We are Alibek Ussipbayev and Kirill Kim. In our final year at the Nazarbayev Intellectual School of Physics and Mathematics in Shymkent, Kazakhstan, we realized every guide for high school students was either stale, paywalled, or written for someone else. Compass is the tool we wished had existed on day one.
              </motion.p>
            </div>

            {/* Live Metrics Glass Shelf */}
            <motion.div
              variants={FADE_UP}
              className="grid w-full grid-cols-2 gap-4 sm:grid-cols-4 sm:gap-6 pt-4"
            >
              <div className="group rounded-2xl border border-white/[0.08] bg-white/[0.03] p-5 backdrop-blur-lg transition-all hover:border-accent/40 hover:bg-white/[0.06]">
                <div className="text-3xl sm:text-4xl font-semibold tracking-tight text-white">
                  {total}
                </div>
                <div className="mt-1 text-sm text-slate-400">
                  Verified entries (<span className="text-emerald-400 font-medium">{free}</span> free)
                </div>
              </div>

              <div className="group rounded-2xl border border-white/[0.08] bg-white/[0.03] p-5 backdrop-blur-lg transition-all hover:border-accent/40 hover:bg-white/[0.06]">
                <div className="text-3xl sm:text-4xl font-semibold tracking-tight text-white">
                  {areas}
                </div>
                <div className="mt-1 text-sm text-slate-400">
                  Career areas & <span className="text-slate-200 font-medium">{majors}</span> majors
                </div>
              </div>

              <div className="group rounded-2xl border border-white/[0.08] bg-white/[0.03] p-5 backdrop-blur-lg transition-all hover:border-accent/40 hover:bg-white/[0.06]">
                <div className="text-3xl sm:text-4xl font-semibold tracking-tight text-white">
                  {countries}
                </div>
                <div className="mt-1 text-sm text-slate-400">
                  Study destinations & <span className="text-slate-200 font-medium">{cities}</span> hubs
                </div>
              </div>

              <div className="group rounded-2xl border border-white/[0.08] bg-white/[0.03] p-5 backdrop-blur-lg transition-all hover:border-accent/40 hover:bg-white/[0.06]">
                <div className="text-3xl sm:text-4xl font-semibold tracking-tight text-white">
                  {homeRoutes}
                </div>
                <div className="mt-1 text-sm text-slate-400">
                  Pathways from home (zero visa)
                </div>
              </div>
            </motion.div>
          </motion.section>


          {/* ── ACT 2: INTERACTIVE FOUNDERS' STORY ───────────────────────── */}
          <section className="space-y-12">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
              <div className="space-y-3">
                <div className="inline-flex items-center gap-2 text-xs font-semibold tracking-widest text-accent-ink uppercase">
                  <SparkleIcon className="w-3.5 h-3.5 text-accent-ink" />
                  Origin Story
                </div>
                <h2 className="font-display text-3xl sm:text-4xl md:text-5xl font-medium tracking-tight text-white">
                  Two students. One stubborn rule.
                </h2>
                <p className="text-base sm:text-lg text-slate-400 max-w-[65ch]">
                  Explore the journey from the perspectives of both founders who built Compass side-by-side.
                </p>
              </div>

              {/* Segmented Persona Pill Switcher */}
              <div
                role="tablist"
                aria-label="Founder perspectives"
                className="flex items-center gap-1 rounded-full border border-white/[0.1] bg-white/[0.04] p-1 backdrop-blur-xl self-start md:self-auto shrink-0"
              >
                {(
                  [
                    { id: "both", label: "Unified Journey" },
                    { id: "alibek", label: "Alibek Ussipbayev" },
                    { id: "kirill", label: "Kirill Kim" },
                  ] as const
                ).map((tab) => {
                  const isActive = activeFounder === tab.id;
                  return (
                    <button
                      key={tab.id}
                      type="button"
                      role="tab"
                      aria-selected={isActive}
                      onClick={() => setActiveFounder(tab.id)}
                      className={cn(
                        "relative rounded-full px-4 py-2 text-xs sm:text-sm font-medium transition-colors min-h-[44px] flex items-center justify-center focus-visible:focus-ring",
                        isActive
                          ? "text-white"
                          : "text-slate-400 hover:text-slate-200"
                      )}
                    >
                      {isActive && (
                        <motion.div
                          layoutId="activeFounderTab"
                          className="absolute inset-0 rounded-full bg-accent/25 border border-accent/40 shadow-sm"
                          transition={{ type: "spring", stiffness: 300, damping: 30 }}
                        />
                      )}
                      <span className="relative z-10">{tab.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Dynamic Founder Spotlight Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Alibek Card */}
              <motion.div
                variants={SCALE_IN}
                initial="hidden"
                animate="show"
                className={cn(
                  "group relative overflow-hidden rounded-[2rem] border p-6 sm:p-8 backdrop-blur-xl transition-all duration-300",
                  activeFounder === "alibek" || activeFounder === "both"
                    ? "border-accent/40 bg-white/[0.04] shadow-[0_8px_32px_rgba(0,0,0,0.35)]"
                    : "border-white/[0.06] bg-white/[0.01] opacity-50"
                )}
              >
                <div className="flex items-center gap-4 mb-6">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-accent/40 bg-accent/15 text-lg font-bold text-white shadow-inner">
                    AU
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-white">Alibek Ussipbayev</h3>
                    <p className="text-sm text-accent-ink font-medium">Co-Founder & Systems Architect</p>
                    <p className="text-xs text-slate-400">NIS PhM Shymkent · Class of 2026</p>
                  </div>
                </div>
                <blockquote className="space-y-3 text-slate-300 leading-relaxed text-pretty">
                  <p className="italic text-base sm:text-lg text-slate-200">
                    &ldquo;If an algorithm has to guess when a deadline is, that algorithm belongs in the trash. We wrote scrapers to read real websites and break the build when a link rots.&rdquo;
                  </p>
                  <p className="text-sm text-slate-400 pt-2">
                    Focused on architecture, privacy-first local storage, and ensuring zero telemetry tracks a student’s private career planning.
                  </p>
                </blockquote>
              </motion.div>

              {/* Kirill Card */}
              <motion.div
                variants={SCALE_IN}
                initial="hidden"
                animate="show"
                className={cn(
                  "group relative overflow-hidden rounded-[2rem] border p-6 sm:p-8 backdrop-blur-xl transition-all duration-300",
                  activeFounder === "kirill" || activeFounder === "both"
                    ? "border-accent/40 bg-white/[0.04] shadow-[0_8px_32px_rgba(0,0,0,0.35)]"
                    : "border-white/[0.06] bg-white/[0.01] opacity-50"
                )}
              >
                <div className="flex items-center gap-4 mb-6">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-emerald-500/40 bg-emerald-500/15 text-lg font-bold text-white shadow-inner">
                    KK
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-white">Kirill Kim</h3>
                    <p className="text-sm text-emerald-400 font-medium">Co-Founder & Data Lead</p>
                    <p className="text-xs text-slate-400">NIS PhM Shymkent · Class of 2026</p>
                  </div>
                </div>
                <blockquote className="space-y-3 text-slate-300 leading-relaxed text-pretty">
                  <p className="italic text-base sm:text-lg text-slate-200">
                    &ldquo;We spent weekends calling competition committees to confirm if high schoolers from Central Asia were genuinely eligible. If the rules were vague, we marked it unverified.&rdquo;
                  </p>
                  <p className="text-sm text-slate-400 pt-2">
                    Focused on manual verification of rulebooks, cost integrity, and eradicating bait-and-switch programs with hidden certificate fees.
                  </p>
                </blockquote>
              </motion.div>
            </div>

            {/* School Credential Authenticity Banner */}
            <GlassCard glow className="border-accent/20 bg-gradient-to-r from-accent/[0.08] via-white/[0.03] to-transparent">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
                <div className="space-y-2 max-w-2xl">
                  <div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-accent-ink">
                    <CompassIcon className="w-4 h-4 text-accent" />
                    School-Grounded Perspective
                  </div>
                  <h3 className="text-xl sm:text-2xl font-semibold text-white">
                    Built by high schoolers, for high schoolers.
                  </h3>
                  <p className="text-sm sm:text-base text-slate-300 leading-relaxed text-pretty">
                    &ldquo;We are still at school. That is not a credential, but it does mean we were the people this was built for before we were the people making it.&rdquo;
                  </p>
                </div>
                <div className="rounded-xl border border-white/[0.1] bg-white/[0.05] px-5 py-3 text-center shrink-0">
                  <div className="text-xs text-slate-400 uppercase tracking-wider">Campus</div>
                  <div className="text-sm font-semibold text-white mt-0.5">NIS PhM Shymkent</div>
                  <div className="text-xs text-accent-ink">Graduating June 2026</div>
                </div>
              </div>
            </GlassCard>

            {/* Interactive Timeline: The 3 Epochs */}
            <div className="space-y-6 pt-6">
              <div className="text-xs font-semibold tracking-widest text-slate-400 uppercase">
                Interactive Milestones
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {MILESTONES.map((m, idx) => {
                  const isSelected = activeMilestone === idx;
                  return (
                    <button
                      key={m.year}
                      type="button"
                      aria-pressed={isSelected}
                      onClick={() => setActiveMilestone(idx)}
                      className={cn(
                        "flex flex-col text-left rounded-2xl border p-4 sm:p-5 transition-all min-h-[44px] focus-visible:focus-ring",
                        isSelected
                          ? "border-accent/50 bg-accent/10 shadow-lg"
                          : "border-white/[0.08] bg-white/[0.02] hover:border-white/[0.15] hover:bg-white/[0.04]"
                      )}
                    >
                      <div className="flex items-center justify-between w-full text-xs mb-2">
                        <span className={cn("font-bold", isSelected ? "text-accent-ink" : "text-slate-400")}>
                          {m.year}
                        </span>
                        <span className="text-slate-500">{m.quarter}</span>
                      </div>
                      <div className="font-medium text-white text-base leading-snug">
                        {m.title}
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Milestone Detail Card */}
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeMilestone}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                >
                  <GlassCard className="border-white/[0.12] bg-white/[0.04]">
                    <div className="space-y-4">
                      <div className="flex items-center gap-3">
                        <span className="rounded-full bg-accent/20 px-3 py-1 text-xs font-semibold text-accent-ink">
                          {MILESTONES[activeMilestone].quarter}
                        </span>
                        <h4 className="text-xl sm:text-2xl font-semibold text-white">
                          {MILESTONES[activeMilestone].title}
                        </h4>
                      </div>
                      <p className="text-base sm:text-lg text-slate-300 font-medium leading-relaxed">
                        {MILESTONES[activeMilestone].tagline}
                      </p>
                      <p className="text-sm sm:text-base text-slate-400 leading-relaxed max-w-[65ch]">
                        {MILESTONES[activeMilestone].lead}
                      </p>
                      <ul className="space-y-2.5 pt-2 border-t border-white/[0.08]">
                        {MILESTONES[activeMilestone].details.map((bullet, i) => (
                          <li key={i} className="flex items-start gap-3 text-sm text-slate-300">
                            <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
                            <span>{bullet}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </GlassCard>
                </motion.div>
              </AnimatePresence>
            </div>
          </section>


          {/* ── ACT 3: THE 4 NON-NEGOTIABLES ("WHAT WE REFUSE TO DO") ─────── */}
          <section className="space-y-10">
            <div className="space-y-3">
              <div className="inline-flex items-center gap-2 text-xs font-semibold tracking-widest text-accent-ink uppercase">
                <CheckShieldIcon className="w-4 h-4 text-accent-ink" />
                Core Philosophy
              </div>
              <h2 className="font-display text-3xl sm:text-4xl md:text-5xl font-medium tracking-tight text-white">
                What we refuse to do.
              </h2>
              <p className="text-base sm:text-lg text-slate-400 max-w-[65ch]">
                The internet is flooded with predatory guidance tools. Here are the four compromises we will never make.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {/* 1. We Don't Rank */}
              <GlassCard className="space-y-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-red-500/20 bg-red-500/10 text-red-400">
                  <ScalesOffIcon className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-semibold text-white">We never rank universities</h3>
                <p className="text-sm sm:text-base text-slate-400 leading-relaxed text-pretty">
                  League table rankings rot in twelve months and flatten a multidimensional human life into a single scalar. We map criteria, costs, and faculty strengths—not arbitrary prestige numbers.
                </p>
              </GlassCard>

              {/* 2. Free Means End-to-End */}
              <GlassCard className="space-y-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-emerald-500/20 bg-emerald-500/10 text-emerald-400">
                  <CheckShieldIcon className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-semibold text-white">Free means end-to-end</h3>
                <p className="text-sm sm:text-base text-slate-400 leading-relaxed text-pretty">
                  &ldquo;Free to learn, $99 for the certificate&rdquo; has its own explicit tag. Compass itself is completely free with no paid tiers, and we never disguise fees behind fine print.
                </p>
              </GlassCard>

              {/* 3. No Silent Filtering */}
              <GlassCard className="space-y-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-cyan-500/20 bg-cyan-500/10 text-cyan-400">
                  <EyeOpenIcon className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-semibold text-white">No silent filtering</h3>
                <p className="text-sm sm:text-base text-slate-400 leading-relaxed text-pretty">
                  If we do not know your GPA or test scores, you still see every opportunity with an honest eligibility note—we never quietly erase opportunities behind closed algorithms.
                </p>
              </GlassCard>

              {/* 4. No Personality Horoscopes */}
              <GlassCard className="space-y-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-amber-500/20 bg-amber-500/10 text-amber-400">
                  <BrainOffIcon className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-semibold text-white">No personality horoscopes</h3>
                <p className="text-sm sm:text-base text-slate-400 leading-relaxed text-pretty">
                  We observe your concrete interests and deliberate choices. We will never hand you a four-letter personality type, because we cannot make that claim with scientific honesty.
                </p>
              </GlassCard>
            </div>
          </section>


          {/* ── ACT 4: THE 3 CORE PILLARS (SERVER DATA SHOWCASE) ──────────── */}
          <section className="space-y-10">
            <div className="space-y-3">
              <div className="inline-flex items-center gap-2 text-xs font-semibold tracking-widest text-accent-ink uppercase">
                <CompassIcon className="w-4 h-4 text-accent-ink" />
                System Architecture
              </div>
              <h2 className="font-display text-3xl sm:text-4xl md:text-5xl font-medium tracking-tight text-white">
                What is on the site.
              </h2>
              <p className="text-base sm:text-lg text-slate-400 max-w-[65ch]">
                Three interconnected engines built to turn ambiguity into a concrete, executable plan.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Opportunities Engine */}
              <GlassCard className="flex flex-col justify-between space-y-6">
                <div className="space-y-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent/15 text-accent-ink font-bold text-sm">
                    01
                  </div>
                  <h3 className="text-xl font-semibold text-white">The Opportunities Engine</h3>
                  <p className="text-sm sm:text-base text-slate-300 leading-relaxed text-pretty">
                    <span className="font-semibold text-white">{total}</span> verified entries, of which{" "}
                    <span className="font-semibold text-emerald-400">{free}</span> cost nothing.{" "}
                    <span className="font-semibold text-white">{alwaysOpen}</span> are open whenever you are ready—self-paced courses, journals, and open challenges.
                  </p>
                </div>
                <Link
                  href="/opportunities"
                  className="inline-flex min-h-[44px] items-center gap-1.5 rounded-lg text-sm font-medium text-accent-ink hover:text-white transition-colors focus-visible:focus-ring"
                >
                  Browse opportunities <ArrowUpRight className="w-4 h-4" />
                </Link>
              </GlassCard>

              {/* Academic Guide */}
              <GlassCard className="flex flex-col justify-between space-y-6">
                <div className="space-y-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent/15 text-accent-ink font-bold text-sm">
                    02
                  </div>
                  <h3 className="text-xl font-semibold text-white">The Academic Guide</h3>
                  <p className="text-sm sm:text-base text-slate-300 leading-relaxed text-pretty">
                    Bridges <span className="font-semibold text-white">{areas}</span> career areas with{" "}
                    <span className="font-semibold text-white">{majors}</span> academic disciplines across{" "}
                    <span className="font-semibold text-white">{countries}</span> countries and{" "}
                    <span className="font-semibold text-white">{cities}</span> university hubs worldwide.
                  </p>
                </div>
                <Link
                  href="/guide"
                  className="inline-flex min-h-[44px] items-center gap-1.5 rounded-lg text-sm font-medium text-accent-ink hover:text-white transition-colors focus-visible:focus-ring"
                >
                  Explore the guide <ArrowUpRight className="w-4 h-4" />
                </Link>
              </GlassCard>

              {/* The Private Plan */}
              <GlassCard className="flex flex-col justify-between space-y-6">
                <div className="space-y-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent/15 text-accent-ink font-bold text-sm">
                    03
                  </div>
                  <h3 className="text-xl font-semibold text-white">The Private Plan</h3>
                  <p className="text-sm sm:text-base text-slate-300 leading-relaxed text-pretty">
                    An agenda, a personal Kanban board, and interactive mind maps for structuring decisions. Everything is stored locally on your device—strictly private to you.
                  </p>
                </div>
                <Link
                  href="/planner"
                  className="inline-flex min-h-[44px] items-center gap-1.5 rounded-lg text-sm font-medium text-accent-ink hover:text-white transition-colors focus-visible:focus-ring"
                >
                  Open planner <ArrowUpRight className="w-4 h-4" />
                </Link>
              </GlassCard>
            </div>
          </section>


          {/* ── ACT 5: HOW WE CHECK DATES (VERIFICATION ENGINE) ───────────── */}
          <section className="space-y-10">
            <div className="space-y-3">
              <div className="inline-flex items-center gap-2 text-xs font-semibold tracking-widest text-accent-ink uppercase">
                <CheckShieldIcon className="w-4 h-4 text-accent-ink" />
                Integrity Engine
              </div>
              <h2 className="font-display text-3xl sm:text-4xl md:text-5xl font-medium tracking-tight text-white">
                How we check a date.
              </h2>
              <p className="text-base sm:text-lg text-slate-400 max-w-[65ch]">
                A countdown on Compass only appears when we have verified that date against the organizer&rsquo;s official portal for the current cycle.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
              <div className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-6 backdrop-blur-lg space-y-3">
                <div className="text-xs font-mono text-accent-ink">STEP 01</div>
                <h3 className="text-lg font-semibold text-white">Primary Source Only</h3>
                <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                  We never scrape secondary aggregators. Every single link points directly to the institution or competition committee.
                </p>
              </div>

              <div className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-6 backdrop-blur-lg space-y-3">
                <div className="text-xs font-mono text-accent-ink">STEP 02</div>
                <h3 className="text-lg font-semibold text-white">Current Cycle Proof</h3>
                <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                  If 2026 dates have not been posted, we state &ldquo;Dates not announced yet&rdquo;. We would rather look empty than mislead you.
                </p>
              </div>

              <div className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-6 backdrop-blur-lg space-y-3">
                <div className="text-xs font-mono text-accent-ink">STEP 03</div>
                <h3 className="text-lg font-semibold text-white">Automated CI Watchdog</h3>
                <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                  Every link on Compass is automatically tested on a recurring schedule. A dead link or redirect loop immediately breaks our build.
                </p>
              </div>

              <div className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-6 backdrop-blur-lg space-y-3">
                <div className="text-xs font-mono text-accent-ink">STEP 04</div>
                <h3 className="text-lg font-semibold text-white">Verified Partner Badges</h3>
                <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                  When a university or hub posts directly, a verification tick confirms identity—it is never an endorsement or paid ranking.
                </p>
              </div>
            </div>
          </section>


          {/* ── ACT 6: STAYING IS AN ANSWER ──────────────────────────────── */}
          <section>
            <GlassCard glow className="border-accent/30 bg-gradient-to-br from-accent/15 via-white/[0.03] to-transparent p-8 sm:p-12 md:p-16">
              <div className="max-w-3xl space-y-6">
                <div className="inline-flex items-center gap-2 rounded-full bg-accent/20 px-3.5 py-1 text-xs font-semibold text-accent-ink uppercase tracking-wider">
                  Regional Route Philosophy
                </div>
                <h2 className="font-display text-3xl sm:text-4xl md:text-5xl font-medium tracking-tight text-white leading-tight">
                  Staying is an answer.
                </h2>
                <div className="space-y-4 text-base sm:text-lg text-slate-300 leading-relaxed max-w-[65ch] text-pretty">
                  <p>
                    Leaving is not the default here. Compass maps{" "}
                    <span className="font-semibold text-white">{homeRoutes}</span> pathways that require no foreign visa, no relocation, and no foreign exchange risk.
                  </p>
                  <p>
                    The mistake is treating staying as a concession. The students who thrive from Central Asia often choose an exceptional local undergraduate degree deliberately—graduating debt-free with proven research before stepping into a fully funded master&rsquo;s abroad.
                  </p>
                </div>
                <div className="pt-2">
                  <Link
                    href="/guide/from-home"
                    className="inline-flex min-h-[44px] items-center gap-2 rounded-lg font-medium text-accent-ink hover:text-white underline underline-offset-8 transition-colors focus-visible:focus-ring"
                  >
                    View opportunities available from home <ArrowUpRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            </GlassCard>
          </section>


          {/* ── ACT 7: DIRECT FOUNDER LINE & STRATEGIC CALL TO ACTION ──────── */}
          <section className="space-y-12">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Say Hello Card */}
              <GlassCard className="space-y-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent/15 text-accent-ink">
                  <MailIcon className="w-5 h-5" />
                </div>
                <h3 className="text-xl font-semibold text-white">Direct line to Alibek & Kirill</h3>
                <p className="text-sm sm:text-base text-slate-300 leading-relaxed text-pretty">
                  Found a dead link? A date that moved? An eligibility rule that was misunderstood? That is the single most valuable message you can send us.
                </p>
                <div className="pt-2">
                  <a
                    href={`mailto:${CONTACT_EMAIL}`}
                    className="inline-flex min-h-[44px] items-center gap-2 rounded-lg text-sm font-semibold text-accent-ink hover:text-white underline underline-offset-4 transition-colors focus-visible:focus-ring"
                  >
                    {CONTACT_EMAIL} <ArrowUpRight className="w-4 h-4" />
                  </a>
                </div>
              </GlassCard>

              {/* Privacy Guarantee Card */}
              <GlassCard className="space-y-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-400">
                  <CheckShieldIcon className="w-5 h-5" />
                </div>
                <h3 className="text-xl font-semibold text-white">Zero Surveillance Guarantee</h3>
                <p className="text-sm sm:text-base text-slate-300 leading-relaxed text-pretty">
                  We strip referral codes and query tokens before logging page visits. We do not sell user lists or profile high school students for advertising brokers.
                </p>
                <div className="pt-2">
                  <Link
                    href="/privacy"
                    className="inline-flex min-h-[44px] items-center gap-2 rounded-lg text-sm font-medium text-slate-400 hover:text-white transition-colors focus-visible:focus-ring"
                  >
                    Read our full privacy statement <ArrowUpRight className="w-4 h-4" />
                  </Link>
                </div>
              </GlassCard>
            </div>

            {/* Strategic Pivot Banner / Assessment Funnel CTA */}
            <div className="relative overflow-hidden rounded-[2.5rem] border border-accent/40 bg-gradient-to-b from-[#141F36] to-[#0D1525] p-8 sm:p-12 md:p-16 text-center backdrop-blur-2xl shadow-2xl">
              <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-accent/20 via-transparent to-transparent blur-2xl" />
              <div className="relative z-10 max-w-2xl mx-auto space-y-6">
                <div className="inline-flex items-center gap-2 rounded-full border border-accent/40 bg-accent/15 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-accent-ink">
                  <SparkleIcon className="w-3.5 h-3.5 text-accent-ink" />
                  Next Step
                </div>
                <h2 className="font-display text-3xl sm:text-4xl md:text-5xl font-medium tracking-tight text-white leading-tight">
                  Not sure what to do with your future?
                </h2>
                <p className="text-base sm:text-lg text-slate-300 leading-relaxed text-pretty">
                  You don&rsquo;t need to have it all figured out today. Start with a five-minute conversational assessment designed to cut through the noise.
                </p>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
                  <ButtonLink
                    href="/assessment"
                    variant="primary"
                    size="lg"
                    className="w-full sm:w-auto shadow-[0_0_30px_rgba(110,155,255,0.4)] hover:shadow-[0_0_40px_rgba(110,155,255,0.6)]"
                  >
                    Start the Assessment
                  </ButtonLink>
                  <ButtonLink
                    href="/opportunities"
                    variant="ghost"
                    size="lg"
                    className="w-full sm:w-auto text-slate-300 hover:text-white hover:bg-white/[0.06] border border-white/[0.1]"
                  >
                    Browse all opportunities
                  </ButtonLink>
                </div>
              </div>
            </div>
          </section>

        </Container>
      </div>
    </MotionSafe>
  );
}
