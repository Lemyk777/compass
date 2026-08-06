"use client";

import { useEffect, useState } from "react";
import Link from "@/components/ui/Link";
import {
  careerAreaTitles,
  careerAreasForFaculties,
  type CareerArea,
} from "@/lib/data/careers";
import { FACULTIES, FACULTY_LABEL, type FacultyValue } from "@/lib/data/faculties";
import { ValuesRefine } from "@/components/opportunities/ValuesRefine";
import { GuideSheet, SheetBlock } from "@/components/guide/GuideSheet";
import {
  rankAreasByValues,
  scoreValues,
  VALUE_LABEL,
  type ValuesAnswers,
} from "@/lib/data/values";
import { hubsByRegion, REGION_LABEL, type Hub } from "@/lib/data/world";
import {
  STUDY_DESTINATIONS,
  destinationsForFaculties,
} from "@/lib/data/study-destinations";

// The guide: one page for the whole question a catalog can't answer — what is
// out there, where it is, and how someone standing here reaches it.
//
// **Cards, then depth on demand.** The first version put every sphere and every
// city fully expanded on one scroll, which meant finding anything required
// reading everything — a wall of text is not a guide, it is a document. Each
// subject is now a small card carrying the one line you need to decide whether
// to open it, and the full detail lives in a sheet you open deliberately.
//
// The order is a zoom, and it matters: kinds of work → the cities that work sits
// in → the destinations in full → what you can do from home without moving. The
// destination section is intentionally left as plain cards linking to their own
// pages; those profiles are long enough to deserve a page, not a sheet.
//
// Everything is deterministic and curated (careers.ts + world.ts +
// study-destinations.ts). No model call, and no place gets an appeal without its
// catch.

const VALUES_KEY = "compass.work-values.v1";

const SECTIONS = [
  { id: "work", label: "Kinds of work" },
  { id: "cities", label: "Cities" },
  { id: "destinations", label: "Destinations" },
  { id: "from-home", label: "From home" },
];

export function GuideView({
  initialFaculties,
  signedIn,
}: {
  initialFaculties: FacultyValue[];
  signedIn: boolean;
}) {
  const [selected, setSelected] = useState<FacultyValue[]>(initialFaculties);
  const [values, setValues] = useState<ValuesAnswers>({});
  // Exactly one sheet is open at a time — a subject, not a stack. Kept as ONE
  // piece of state rather than two booleans: two independent flags could both be
  // set, and GuideSheet gives its title a fixed id, so two open sheets would put
  // duplicate ids in the DOM and point aria-labelledby at the wrong one.
  const [open, setOpen] = useState<
    { kind: "area"; area: CareerArea } | { kind: "hub"; hub: Hub } | null
  >(null);

  // Shared with the answers given anywhere else in the product — same key, so a
  // student never answers these twice.
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(VALUES_KEY);
      if (raw) setValues(JSON.parse(raw) as ValuesAnswers);
    } catch {
      // Blocked or corrupt store just means no refine. Never a crash.
    }
  }, []);

  function persistValues(next: ValuesAnswers) {
    setValues(next);
    try {
      if (Object.keys(next).length === 0) {
        window.localStorage.removeItem(VALUES_KEY);
      } else {
        window.localStorage.setItem(VALUES_KEY, JSON.stringify(next));
      }
    } catch {
      // Applies for this visit; just won't be remembered.
    }
  }

  const toggle = (f: FacultyValue) =>
    setSelected((s) => (s.includes(f) ? s.filter((x) => x !== f) : [...s, f]));

  const scores = scoreValues(values);
  const groups = careerAreasForFaculties(selected).map((g) => ({
    faculty: g.faculty,
    rows: rankAreasByValues(g.areas, scores),
  }));
  const regions = hubsByRegion(selected);
  const destinations = destinationsForFaculties(selected);
  const showingAll = selected.length === 0;
  const cityCount = regions.reduce((n, r) => n + r.hubs.length, 0);

  return (
    <div className="space-y-8">
      <header>
        <p className="text-xs font-medium uppercase tracking-[0.12em] text-ink-faint">
          The guide
        </p>
        <h1 className="mt-1.5 text-balance text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
          Where this can take you
        </h1>
        <p className="mt-3 max-w-2xl text-pretty text-base leading-relaxed text-ink-soft">
          A field is not a goal, and a job title is not a life. Four steps: what
          kinds of work a field opens, the cities that work sits in, the big
          destinations in full — and what you can enter from home this year
          without moving anywhere.
        </p>
      </header>

      {/* Section nav. The page is long by nature; this makes it navigable
          instead of something you fall through. */}
      <nav
        aria-label="Sections"
        className="sticky top-16 z-20 -mx-4 overflow-x-auto border-y border-line bg-surface/90 px-4 py-2 backdrop-blur sm:-mx-6 sm:px-6"
      >
        <ul className="flex gap-2">
          {SECTIONS.map((s) => (
            <li key={s.id}>
              <a
                href={`#${s.id}`}
                className="inline-flex h-9 items-center whitespace-nowrap rounded-full border border-line bg-card px-3.5 text-sm font-medium text-ink-soft transition-colors hover:border-accent hover:text-ink focus-visible:focus-ring"
              >
                {s.label}
              </a>
            </li>
          ))}
        </ul>
      </nav>

      {/* ── Your fields ─────────────────────────────────────────────────── */}
      <section>
        <h2 className="text-lg font-semibold text-ink">
          {signedIn ? "Your fields" : "Start with a field"}
        </h2>
        <p className="mt-1 text-sm text-ink-soft">
          {showingAll
            ? "Showing everything. Pick one or two to narrow the whole page."
            : "Tap to add or drop a field — nothing here is saved to your profile."}
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          {FACULTIES.map((f) => {
            const on = selected.includes(f.value);
            return (
              <button
                key={f.value}
                type="button"
                aria-pressed={on}
                onClick={() => toggle(f.value)}
                className={`h-10 rounded-full border px-4 text-sm font-medium transition-colors focus-visible:focus-ring ${
                  on
                    ? "border-accent bg-accent-soft text-accent-ink"
                    : "border-line bg-card text-ink-soft hover:border-ink/30 hover:text-ink"
                }`}
              >
                {FACULTY_LABEL[f.value]}
              </button>
            );
          })}
        </div>
      </section>

      {/* ── 1. Kinds of work ────────────────────────────────────────────── */}
      <section id="work" className="scroll-mt-28 space-y-4">
        <SectionHead
          step={1}
          title="Kinds of work"
          hint="Areas, not one prescribed job. Open any card for the actual job titles inside it and the path in."
        />

        <ValuesRefine
          answers={values}
          onAnswer={(questionId, optionId) =>
            persistValues({ ...values, [questionId]: optionId })
          }
          onClear={() => persistValues({})}
        />

        {showingAll ? (
          <ul className="grid gap-2.5 sm:grid-cols-2">
            {FACULTIES.map((f) => (
              <li key={f.value}>
                <Card
                  title={FACULTY_LABEL[f.value]}
                  line={careerAreaTitles(f.value).join(" · ")}
                  cta="Open this field"
                  onClick={() => toggle(f.value)}
                />
              </li>
            ))}
          </ul>
        ) : (
          groups.map((g) => (
            <div key={g.faculty} className="space-y-2.5">
              <p className="text-xs font-semibold uppercase tracking-[0.1em] text-ink-faint">
                {FACULTY_LABEL[g.faculty]}
              </p>
              <ul className="grid gap-2.5 sm:grid-cols-2">
                {g.rows.map((r) => (
                  <li key={r.area.title}>
                    <Card
                      title={r.area.title}
                      line={r.area.what}
                      badge={r.fits ? "Closest to what you said" : undefined}
                      cta={`${r.area.roles.length} jobs inside`}
                      onClick={() => setOpen({ kind: "area", area: r.area })}
                    />
                  </li>
                ))}
              </ul>
            </div>
          ))
        )}
      </section>

      {/* ── 2. Cities ───────────────────────────────────────────────────── */}
      <section id="cities" className="scroll-mt-28 space-y-4">
        <SectionHead
          step={2}
          title="The cities that work sits in"
          hint={`${cityCount} places, home region first. Open one for its catch and the real way in — a city with only good news listed would be an advert.`}
        />
        {regions.map((g) => (
          <div key={g.region} className="space-y-2.5">
            <p className="text-xs font-semibold uppercase tracking-[0.1em] text-ink-faint">
              {REGION_LABEL[g.region]}
            </p>
            <ul className="grid gap-2.5 sm:grid-cols-2">
              {g.hubs.map((h) => (
                <li key={h.id}>
                  <Card
                    title={h.city}
                    sub={h.country}
                    line={h.what}
                    cta="The catch & the way in"
                    onClick={() => setOpen({ kind: "hub", hub: h })}
                  />
                </li>
              ))}
            </ul>
          </div>
        ))}
      </section>

      {/* ── 3. Destinations — left as it is, on purpose ─────────────────── */}
      <section id="destinations" className="scroll-mt-28 space-y-3">
        <SectionHead
          step={3}
          title="The big destinations, in full"
          hint="The places students actually argue about. Each opens a full page: what only it gives you, what it genuinely costs, what admissions weighs, what happens after you graduate — and who should go somewhere else instead."
        />
        <ul className="grid gap-2.5 sm:grid-cols-2">
          {destinations.map((d) => (
            <li key={d.id}>
              <Link
                href={`/guide/${d.id}`}
                className="block h-full rounded-2xl border border-line bg-card p-4 transition-colors hover:border-accent focus-visible:focus-ring"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-sm font-semibold text-ink">
                    {d.name}
                  </span>
                  {d.modelled && (
                    <span className="rounded-full bg-accent-soft px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-accent-ink">
                      Odds modelled
                    </span>
                  )}
                </div>
                <p className="mt-1 text-sm leading-relaxed text-ink-soft">
                  {d.oneLine}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      {/* ── 4. From home ────────────────────────────────────────────────── */}
      <section
        id="from-home"
        className="scroll-mt-28 rounded-2xl border border-line bg-card p-5 sm:p-6"
      >
        <SectionHead step={4} title="You don’t have to move" />
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-ink-soft">
          Several of these spheres pay from anywhere, and the entry points are
          open to you right now, from home: Google Summer of Code, Outreachy and
          LFX pay students to work on real open-source projects; Kaggle and Zindi
          are judged on results, not on where you live; and free university
          courses from Harvard, MIT and Stanford cost nothing but your time.
          Leaving is one route. It is not the only one, and it is not always the
          best one.
        </p>
        <div className="mt-4">
          <Link
            href="/opportunities"
            className="inline-flex h-11 items-center rounded-xl bg-ink px-5 text-sm font-medium text-white transition-colors hover:bg-ink/90 focus-visible:focus-ring"
          >
            See what you can enter this year &rarr;
          </Link>
        </div>
      </section>

      {open?.kind === "area" && (
        <GuideSheet
          title={open.area.title}
          subtitle={open.area.what}
          onClose={() => setOpen(null)}
        >
          <div className="space-y-3">
            <SheetBlock label="The jobs inside this area">
              <ul className="mt-1 flex flex-wrap gap-1.5">
                {open.area.roles.map((role) => (
                  <li
                    key={role}
                    className="rounded-lg border border-line bg-card px-2 py-1 text-xs text-ink-soft"
                  >
                    {role}
                  </li>
                ))}
              </ul>
              <p className="mt-2 text-xs text-ink-faint">
                A list, not a recommendation — you narrow it, we don&rsquo;t.
              </p>
            </SheetBlock>
            <SheetBlock label="The path in" tone="good">
              {open.area.path}
            </SheetBlock>
            <SheetBlock label="What this kind of work usually offers">
              {open.area.values.map((v) => VALUE_LABEL[v]).join(" · ")}
              <span className="mt-1 block text-xs text-ink-faint">
                A generalisation about the sphere, not a promise about a salary.
              </span>
            </SheetBlock>
          </div>
        </GuideSheet>
      )}

      {open?.kind === "hub" && (
        <GuideSheet
          title={open.hub.city}
          subtitle={open.hub.country}
          onClose={() => setOpen(null)}
        >
          <div className="space-y-3">
            <p className="text-sm leading-relaxed text-ink-soft">
              {open.hub.what}
            </p>
            <SheetBlock label="The catch" tone="warn">
              {open.hub.catch}
            </SheetBlock>
            <SheetBlock label="The way in" tone="good">
              {open.hub.route}
            </SheetBlock>
            <SheetBlock label="The work that clusters here">
              {open.hub.fields.map((f) => FACULTY_LABEL[f]).join(" · ")}
            </SheetBlock>
            {/* If this city sits in a destination we profile, that page is the
                next question the student will have. */}
            {STUDY_DESTINATIONS.filter((d) => d.hubs.includes(open.hub.id)).map(
              (d) => (
                <Link
                  key={d.id}
                  href={`/guide/${d.id}`}
                  className="flex items-center justify-between gap-3 rounded-xl border border-accent/40 bg-accent-soft/25 p-3.5 transition-colors hover:border-accent focus-visible:focus-ring"
                >
                  <span className="text-sm font-medium text-ink">
                    Everything about {d.name}
                  </span>
                  <span className="text-ink-faint" aria-hidden>
                    &rarr;
                  </span>
                </Link>
              ),
            )}
          </div>
        </GuideSheet>
      )}
    </div>
  );
}

function SectionHead({
  step,
  title,
  hint,
}: {
  step: number;
  title: string;
  hint?: string;
}) {
  return (
    <div>
      <div className="flex items-center gap-2.5">
        <span
          data-num
          className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-ink text-xs font-semibold text-white"
        >
          {step}
        </span>
        <h2 className="text-lg font-semibold text-ink">{title}</h2>
      </div>
      {hint && (
        <p className="mt-1.5 max-w-2xl text-sm leading-relaxed text-ink-soft">
          {hint}
        </p>
      )}
    </div>
  );
}

/** A small card that says, visibly, that opening it gives you more. */
function Card({
  title,
  sub,
  line,
  badge,
  cta,
  onClick,
}: {
  title: string;
  sub?: string;
  line: string;
  badge?: string;
  cta: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`group flex h-full w-full flex-col rounded-2xl border p-4 text-left transition-colors focus-visible:focus-ring ${
        badge
          ? "border-accent/50 bg-accent-soft/25 hover:border-accent"
          : "border-line bg-card hover:border-accent"
      }`}
    >
      <span className="flex items-start justify-between gap-2">
        <span className="min-w-0">
          <span className="text-sm font-semibold text-ink">{title}</span>
          {sub && (
            <span className="ml-1.5 text-sm font-normal text-ink-faint">
              {sub}
            </span>
          )}
        </span>
        <ExpandGlyph />
      </span>
      {badge && (
        <span className="mt-1.5 inline-flex w-fit rounded-full bg-accent-soft px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-accent-ink">
          {badge}
        </span>
      )}
      <span className="mt-1 line-clamp-2 text-sm leading-relaxed text-ink-soft">
        {line}
      </span>
      <span className="mt-2.5 text-xs font-medium text-accent">{cta} &rarr;</span>
    </button>
  );
}

function ExpandGlyph() {
  return (
    <svg
      className="h-4 w-4 shrink-0 text-ink-faint transition-colors group-hover:text-accent"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M9 21H5a2 2 0 0 1-2-2v-4M15 3h4a2 2 0 0 1 2 2v4" />
      <path d="M21 3l-7 7M3 21l7-7" />
    </svg>
  );
}
