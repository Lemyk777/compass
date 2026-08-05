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
import {
  rankAreasByValues,
  scoreValues,
  type ValuesAnswers,
} from "@/lib/data/values";
import { hubsByRegion, REGION_LABEL, type Hub } from "@/lib/data/world";
import { destinationsForFaculties } from "@/lib/data/study-destinations";

// The guide: one page for the whole question a catalog can't answer — what is
// out there, where it is, and how someone standing here reaches it.
//
// The throughline is interest → field → sphere of work → the places that work
// lives → what you can enter from home this year. The last step deliberately
// points back at Opportunities: a guide that ends in inspiration and no action
// is the intervention the research says measures zero.
//
// Everything here is deterministic and curated (careers.ts + world.ts). No model
// call, and no city gets an appeal without its catch.

const VALUES_KEY = "compass.work-values.v1";

export function GuideView({
  initialFaculties,
  signedIn,
}: {
  initialFaculties: FacultyValue[];
  signedIn: boolean;
}) {
  const [selected, setSelected] = useState<FacultyValue[]>(initialFaculties);
  const [values, setValues] = useState<ValuesAnswers>({});

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

  return (
    <div className="space-y-10">
      <header>
        <p className="text-xs font-medium uppercase tracking-[0.12em] text-ink-faint">
          The guide
        </p>
        <h1 className="mt-1.5 text-balance text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
          Where this can take you
        </h1>
        <p className="mt-3 max-w-2xl text-pretty text-base leading-relaxed text-ink-soft">
          A field is not a goal, and a job title is not a life. This page goes
          the whole way: what kinds of work a field opens, where in the world
          that work actually sits, what each of those places really costs you —
          and what you can enter from home this year to move toward it.
        </p>
      </header>

      {/* ── Pick the fields ─────────────────────────────────────────────── */}
      <section>
        <h2 className="text-lg font-semibold text-ink">
          {signedIn ? "Your fields" : "Start with a field"}
        </h2>
        <p className="mt-1 text-sm text-ink-soft">
          {showingAll
            ? "Showing everything. Pick one or two to narrow it down."
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

      {/* Nothing chosen yet: the whole taxonomy at a glance, one line per field.
          Rendering all 33 areas in full here would be the wall of cards we keep
          removing — titles only, and tapping a field opens it properly. */}
      {showingAll && (
        <section className="space-y-2">
          <h2 className="text-lg font-semibold text-ink">
            Every field, and what it opens
          </h2>
          <ul className="space-y-2">
            {FACULTIES.map((f) => (
              <li key={f.value}>
                <button
                  type="button"
                  onClick={() => toggle(f.value)}
                  className="w-full rounded-xl border border-line bg-card p-3.5 text-left transition-colors hover:border-accent focus-visible:focus-ring"
                >
                  <span className="block text-sm font-semibold text-ink">
                    {FACULTY_LABEL[f.value]}
                  </span>
                  <span className="mt-0.5 block text-xs leading-relaxed text-ink-soft">
                    {careerAreaTitles(f.value).join(" · ")}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* The optional questions sit OUTSIDE the field-dependent block on
          purpose: they used to render only once a field was chosen, which meant
          anyone browsing the whole guide never saw they existed. They are
          answerable at any time; the reordering they drive simply starts
          applying as soon as there is something to reorder. */}
      <section className="space-y-2">
        <h2 className="text-lg font-semibold text-ink">
          What do you want out of work?
        </h2>
        <p className="max-w-2xl text-sm leading-relaxed text-ink-soft">
          Three optional questions. They never change which opportunities you
          see — they only put the kinds of work closest to your answers first.
        </p>
        <ValuesRefine
          answers={values}
          onAnswer={(questionId, optionId) =>
            persistValues({ ...values, [questionId]: optionId })
          }
          onClear={() => persistValues({})}
        />
      </section>

      {/* ── Kinds of work ───────────────────────────────────────────────── */}
      {groups.length > 0 && (
        <section className="space-y-4">
          <div>
            <h2 className="text-lg font-semibold text-ink">Kinds of work</h2>
            <p className="mt-1 max-w-2xl text-sm leading-relaxed text-ink-soft">
              Areas, not one prescribed job — nobody can see which of these you
              are reaching for, and most people move between them anyway.
            </p>
          </div>

          {groups.map((g) => (
            <div key={g.faculty} className="space-y-2.5">
              <p className="text-xs font-semibold uppercase tracking-[0.1em] text-ink-faint">
                {FACULTY_LABEL[g.faculty]}
              </p>
              <ul className="grid gap-2.5 sm:grid-cols-2">
                {g.rows.map((r) => (
                  <AreaCard key={r.area.title} area={r.area} fits={r.fits} />
                ))}
              </ul>
            </div>
          ))}
        </section>
      )}

      {/* ── The big destinations, in full ───────────────────────────────── */}
      <section className="space-y-3">
        <div>
          <h2 className="text-lg font-semibold text-ink">
            The big destinations, in full
          </h2>
          <p className="mt-1 max-w-2xl text-sm leading-relaxed text-ink-soft">
            The places students actually argue about. Each one opens a full
            page: what only it gives you, what it genuinely costs, what
            admissions weighs, what happens after you graduate — and who should
            go somewhere else instead.
          </p>
        </div>
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

      {/* ── The map ─────────────────────────────────────────────────────── */}
      <section className="space-y-4">
        <div>
          <h2 className="text-lg font-semibold text-ink">
            Where this work is, on the map
          </h2>
          <p className="mt-1 max-w-2xl text-sm leading-relaxed text-ink-soft">
            Every place here comes with its catch and its door in. A city with
            only good news listed would be an advert, and the door matters more
            than the appeal: knowing Zurich funds deep tech is useless without
            knowing how someone from Shymkent gets there.
          </p>
        </div>

        {regions.map((g) => (
          <div key={g.region} className="space-y-2.5">
            <p className="text-xs font-semibold uppercase tracking-[0.1em] text-ink-faint">
              {REGION_LABEL[g.region]}
            </p>
            <ul className="space-y-2.5">
              {g.hubs.map((h) => (
                <HubCard key={h.id} hub={h} />
              ))}
            </ul>
          </div>
        ))}
      </section>

      {/* ── And the honest alternative ──────────────────────────────────── */}
      <section className="rounded-2xl border border-line bg-card p-5 sm:p-6">
        <h2 className="text-lg font-semibold text-ink">
          You don&rsquo;t have to move
        </h2>
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
    </div>
  );
}

function AreaCard({ area, fits }: { area: CareerArea; fits: boolean }) {
  return (
    <li
      className={`rounded-2xl border p-4 ${
        fits ? "border-accent/50 bg-accent-soft/25" : "border-line bg-card"
      }`}
    >
      <div className="flex flex-wrap items-center gap-2">
        <p className="text-sm font-semibold text-ink">{area.title}</p>
        {fits && (
          <span className="rounded-full bg-accent-soft px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-accent-ink">
            Closest to what you said
          </span>
        )}
      </div>
      <p className="mt-1 text-sm leading-relaxed text-ink-soft">{area.what}</p>
      <ul className="mt-2.5 flex flex-wrap gap-1.5">
        {area.roles.map((role) => (
          <li
            key={role}
            className="rounded-lg border border-line bg-surface/60 px-2 py-1 text-xs text-ink-soft"
          >
            {role}
          </li>
        ))}
      </ul>
      <p className="mt-2.5 text-xs leading-relaxed text-ink-faint">
        <span className="font-medium text-ink-soft">Path:</span> {area.path}
      </p>
    </li>
  );
}

function HubCard({ hub }: { hub: Hub }) {
  return (
    <li className="rounded-2xl border border-line bg-card p-4 sm:p-5">
      <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
        <h3 className="text-base font-semibold text-ink">{hub.city}</h3>
        <span className="text-sm text-ink-faint">{hub.country}</span>
      </div>
      <p className="mt-1.5 text-sm leading-relaxed text-ink-soft">{hub.what}</p>

      <div className="mt-3 grid gap-2.5 sm:grid-cols-2">
        <p className="rounded-xl border border-line bg-surface/60 p-3 text-xs leading-relaxed text-ink-soft">
          <span className="block font-semibold uppercase tracking-wide text-ink-faint">
            The catch
          </span>
          <span className="mt-1 block">{hub.catch}</span>
        </p>
        <p className="rounded-xl border border-accent/30 bg-accent-soft/20 p-3 text-xs leading-relaxed text-ink-soft">
          <span className="block font-semibold uppercase tracking-wide text-accent-ink">
            The way in
          </span>
          <span className="mt-1 block">{hub.route}</span>
        </p>
      </div>

      <ul className="mt-3 flex flex-wrap gap-1.5">
        {hub.fields.map((f) => (
          <li
            key={f}
            className="rounded-lg bg-surface px-2 py-1 text-[11px] font-medium text-ink-faint"
          >
            {FACULTY_LABEL[f]}
          </li>
        ))}
      </ul>
    </li>
  );
}
