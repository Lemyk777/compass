"use client";

import { motion, type Variants } from "framer-motion";
import { Container } from "@/components/ui/Container";
import Link from "@/components/ui/Link";
import { ReactNode } from "react";
import { CONTACT_EMAIL } from "@/lib/site";

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
  return typeof val === "number" && Number.isFinite(val) && val >= 0
    ? Math.floor(val)
    : fallback;
}

const FADE_UP: Variants = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 100, damping: 20 } },
};

const STAGGER: Variants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

function BentoCard({
  title,
  children,
  className = "",
}: {
  title: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <motion.div
      variants={FADE_UP}
      className={`group relative flex flex-col justify-between overflow-hidden rounded-[2rem] border border-line bg-card p-6 sm:p-8 md:p-10 transition-all hover:shadow-card hover:border-line/80 ${className}`}
    >
      <div className="z-10 flex flex-col gap-5">
        <h2 className="font-display text-2xl font-semibold tracking-tight text-ink md:text-3xl">
          {title}
        </h2>
        <div className="space-y-4 text-base leading-relaxed text-ink-soft md:text-lg">
          {children}
        </div>
      </div>
      <div className="absolute inset-0 z-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
    </motion.div>
  );
}

function P({ children }: { children: ReactNode }) {
  return <p className="text-pretty">{children}</p>;
}

function Num({ children }: { children: ReactNode }) {
  return <span className="font-semibold text-ink">{children}</span>;
}

export function AboutClient({ stats }: AboutClientProps = {}) {
  const total = sanitizeStat(stats?.total, DEFAULT_STATS.total);
  const free = sanitizeStat(stats?.free, DEFAULT_STATS.free);
  const alwaysOpen = sanitizeStat(stats?.alwaysOpen, DEFAULT_STATS.alwaysOpen);
  const areas = sanitizeStat(stats?.areas, DEFAULT_STATS.areas);
  const majors = sanitizeStat(stats?.majors, DEFAULT_STATS.majors);
  const countries = sanitizeStat(stats?.countries, DEFAULT_STATS.countries);
  const cities = sanitizeStat(stats?.cities, DEFAULT_STATS.cities);
  const homeRoutes = sanitizeStat(stats?.homeRoutes, DEFAULT_STATS.homeRoutes);

  return (
    <Container size="dashboard" className="py-14 sm:py-24">
      <motion.div
        variants={STAGGER}
        initial="hidden"
        animate="show"
        className="flex flex-col gap-6 md:gap-8"
      >
        {/* HERO: The Founding Story */}
        <motion.div
          variants={FADE_UP}
          className="relative overflow-hidden rounded-[2.5rem] bg-ink px-6 py-16 text-surface sm:px-12 sm:py-24 md:px-20 lg:py-32"
        >
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-accent/20 via-transparent to-transparent opacity-50" />
          <div className="relative z-10 max-w-4xl space-y-8">
            <h1 className="font-display text-4xl font-medium leading-[1.05] tracking-tight sm:text-5xl md:text-6xl lg:text-7xl">
              We built this for fun,<br className="hidden sm:block" />
              because we needed it ourselves.
            </h1>
            <div className="max-w-2xl space-y-6 text-lg leading-relaxed text-surface/80 sm:text-xl">
              <p>
                We are Alibek Ussipbayev and Kirill Kim. We are in our final year at the Nazarbayev Intellectual School of Physics and Mathematics in Shymkent, Kazakhstan.
              </p>
              <p>
                At the start, we didn&rsquo;t know what to enter, or how, or what we wanted out of any of it. Later the questions got bigger and no easier. Which country? Which faculty? What is open to someone our age, and what is the catch?
              </p>
              <p>
                Everything on this site is an answer we needed ourselves and had to find the slow way. We are still at school, which is not a credential, but it does mean we were the people this is for before we were the people making it.
              </p>
            </div>
          </div>
        </motion.div>

        {/* BENTO GRID: Core Information */}
        <div className="grid grid-cols-1 gap-6 md:gap-8 lg:grid-cols-3">
          
          <BentoCard title="Why this exists" className="lg:col-span-2">
            <P>
              Most lists of opportunities for students turn out to be written for university students, or for one country&rsquo;s nationals, and you find that out after reading the rules. The dates are from last year. A course listed as free charges for the certificate at the end.
            </P>
            <P>
              Those are not small annoyances. A student who plans around a guessed deadline and misses the real one has lost a year, and nobody tells them why. The whole product is built around not doing that to anyone.
            </P>
          </BentoCard>

          <BentoCard title="What it costs">
            <P>
              Compass is free, all of it, including the admission report. There is no paid tier and nothing is held back behind one.
            </P>
            <P>
              Some of the opportunities themselves cost money, which is why every entry carries a cost label. Where we have not verified what something costs, the card points to the official page.
            </P>
          </BentoCard>

          <BentoCard title="What is on the site" className="lg:col-span-3">
            <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
              <div className="space-y-3">
                <h3 className="font-semibold text-ink text-xl">Opportunities</h3>
                <p className="text-base text-ink-soft">
                  <Num>{total}</Num> entries, of which <Num>{free}</Num> cost nothing. Answer what year you are in, and the list narrows to what is open to you.
                </p>
              </div>
              <div className="space-y-3">
                <h3 className="font-semibold text-ink text-xl">The Guide</h3>
                <p className="text-base text-ink-soft">
                  Walks from <Num>{areas}</Num> career areas, to <Num>{majors}</Num> subjects, <Num>{countries}</Num> countries, and <Num>{cities}</Num> cities.
                </p>
              </div>
              <div className="space-y-3">
                <h3 className="font-semibold text-ink text-xl">The Plan</h3>
                <p className="text-base text-ink-soft">
                  An agenda, a board, and mind maps for thinking a decision through. This part is strictly private to you.
                </p>
              </div>
            </div>
          </BentoCard>

          <BentoCard title="How we check dates" className="lg:col-span-2">
            <P>
              A countdown appears only when we have checked that date against the organiser&rsquo;s own page for the current cycle. Where we have not, the card says the dates are not announced yet.
            </P>
            <P>
              <Num>{alwaysOpen}</Num> of the <Num>{total}</Num> entries are open whenever you are ready: self-paced courses, journals, communities. We would rather look emptier than send someone to a form that closed in March. Every link is tested on a schedule, and a broken one fails the build.
            </P>
          </BentoCard>

          <BentoCard title="Staying is an answer">
            <P>
              Leaving is not the default here. There are <Num>{homeRoutes}</Num> routes that need no visa and no move at all.
            </P>
            <P>
              The mistake is treating staying as a failure. The students who do well from here choose the local degree deliberately and leave later for a funded master&rsquo;s with a real record behind them.
            </P>
          </BentoCard>

          <BentoCard title="What we will not do" className="lg:col-span-3 bg-ink text-surface border-none group-hover:shadow-none relative">
            <div className="absolute inset-0 bg-ivy/10 rounded-[2rem]" />
            <div className="relative z-10 grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-4">
              <div className="space-y-2">
                <h3 className="font-semibold text-surface">We don&apos;t rank</h3>
                <p className="text-sm text-surface/70 leading-relaxed">Positions rot within a year and they flatten a decision that is not one-dimensional.</p>
              </div>
              <div className="space-y-2">
                <h3 className="font-semibold text-surface">Free means end-to-end</h3>
                <p className="text-sm text-surface/70 leading-relaxed">&ldquo;Free to learn, pay for the certificate&rdquo; has its own label. We don&apos;t hide costs under one word.</p>
              </div>
              <div className="space-y-2">
                <h3 className="font-semibold text-surface">No silent filtering</h3>
                <p className="text-sm text-surface/70 leading-relaxed">If we don&apos;t know your grades, you still see the opportunity with a note, instead of quietly hiding it.</p>
              </div>
              <div className="space-y-2">
                <h3 className="font-semibold text-surface">No personality types</h3>
                <p className="text-sm text-surface/70 leading-relaxed">We notice your choices, but we will not hand you a personality type because we cannot support that claim.</p>
              </div>
            </div>
          </BentoCard>

          <BentoCard title="Organisations posting here">
            <P>
              A hub, a university, or an olympiad can post its own competitions. A deadline they set is confirmed, because it is their own date.
            </P>
            <P>
              The verification tick means we confirmed the account belongs to them. It is not a quality rating. <Link href="/partners/apply" className="font-medium text-accent-ink underline underline-offset-4 hover:text-ink">Apply here</Link>.
            </P>
          </BentoCard>

          <BentoCard title="Privacy & Contact" className="lg:col-span-2">
            <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
              <div className="space-y-4">
                <h3 className="font-semibold text-ink text-xl">What we record</h3>
                <p className="text-base text-ink-soft text-pretty">
                  We count page views to know if this is being read. We strip query strings so referral codes and tokens never enter analytics. What you save is yours, and you can ask for it to be deleted.
                </p>
              </div>
              <div className="space-y-4">
                <h3 className="font-semibold text-ink text-xl">Say Hello</h3>
                <p className="text-base text-ink-soft text-pretty">
                  Write to <a href={`mailto:${CONTACT_EMAIL}`} className="font-medium text-accent-ink underline underline-offset-4 hover:text-ink">{CONTACT_EMAIL}</a>. If something on the site is wrong, a dead link, a date that has moved, that is the most useful message you can send us.
                </p>
              </div>
            </div>
          </BentoCard>
        </div>
      </motion.div>
    </Container>
  );
}
