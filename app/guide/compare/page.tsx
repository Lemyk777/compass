import type { Metadata } from "next";
import Link from "@/components/ui/Link";
import { FACULTY_LABEL } from "@/lib/data/faculties";
import { fieldsSuffix, withFields } from "@/lib/data/guide-fields";
import {
  STUDY_DESTINATIONS,
  destinationById,
  type StudyDestination,
} from "@/lib/data/study-destinations";
import { statedGuideFields } from "@/lib/guide/student-fields";

// Two countries, side by side, on the same axes.
//
// The country pages have carried a panel headed "Compare it with" since they
// were written, and it never compared anything: it was a row of chips that
// navigated to the other country's page, replacing what you were reading. The
// label promised the one thing the guide is for — "nobody chooses a country in
// isolation" — and the control did the opposite, throwing away the side you had
// just read. This page is the promise, delivered.
//
// Deliberately at /guide/compare and not /guide/places/compare: a static
// segment next to `[place]` is a name that can never again be a country id,
// which is the exact trap the profiles were moved out of the section root to
// escape.
//
// Same data, same order, same honesty rules as a single profile — including
// that the trade-offs column sits level with the strengths column, so a
// comparison cannot be read as a recommendation.

export const metadata: Metadata = {
  title: "Compare two destinations — Compass",
  description:
    "Two countries side by side on the same axes: what each gives you, what it costs, what admissions weighs, what happens after you graduate, and who each is wrong for.",
};

export default function GuideComparePage({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  const stated = statedGuideFields(searchParams);
  const one = (v: string | string[] | undefined) =>
    Array.isArray(v) ? v[0] : v;

  const a = destinationById(one(searchParams.a) ?? "");
  const b = destinationById(one(searchParams.b) ?? "");

  const compareHref = (aId?: string, bId?: string) => {
    const q = new URLSearchParams();
    if (aId) q.set("a", aId);
    if (bId) q.set("b", bId);
    return `/guide/compare?${q.toString()}${fieldsSuffix(stated)}`;
  };

  return (
    <div className="space-y-6">
      <header>
        <nav aria-label="Breadcrumb" className="text-sm">
          <ol className="flex flex-wrap items-center gap-1.5 text-ink-faint">
            <li>
              <Link
                href="/guide"
                className="underline-offset-2 transition-colors hover:text-ink hover:underline focus-visible:focus-ring"
              >
                The guide
              </Link>
            </li>
            <li aria-hidden>/</li>
            <li>
              <Link
                href={withFields("/guide/places", stated)}
                className="underline-offset-2 transition-colors hover:text-ink hover:underline focus-visible:focus-ring"
              >
                Countries
              </Link>
            </li>
          </ol>
        </nav>
        <h1 className="mt-3 text-balance text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
          {a && b ? `${a.name} or ${b.name}?` : "Compare two countries"}
        </h1>
        <p className="mt-3 max-w-2xl text-pretty text-base leading-relaxed text-ink-soft">
          The same questions asked of both, in the same order, with what each one
          costs you level with what it gives you. Neither column is a
          recommendation — the last row is the one to read twice.
        </p>
      </header>

      {/* Pickers. Both sides are always changeable: arriving here from a country
          page fixes side A, and being unable to swap it would just be the old
          "go somewhere else" chip row again. */}
      <div className="grid gap-3 sm:grid-cols-2">
        <Picker
          label="First"
          selected={a}
          hrefFor={(id) => compareHref(id, b?.id)}
        />
        <Picker
          label="Second"
          selected={b}
          hrefFor={(id) => compareHref(a?.id, id)}
        />
      </div>

      {a && b && a.id === b.id && (
        <p className="rounded-2xl border border-reach/40 bg-reach-soft/25 p-4 text-sm text-ink-soft">
          That is the same country twice. Pick a different one on either side.
        </p>
      )}

      {a && b && a.id !== b.id ? (
        <>
          {/* The names once, at the top of the columns, on the screens wide
              enough to keep two columns. Narrower than that, each answer labels
              itself — see `Side`. */}
          <div
            aria-hidden
            className="hidden gap-3 px-5 sm:grid sm:grid-cols-2"
          >
            <p className="text-base font-semibold text-ink">{a.name}</p>
            <p className="text-base font-semibold text-ink">{b.name}</p>
          </div>

          <Row label="In one line" aName={a.name} bName={b.name} a={a.oneLine} b={b.oneLine} />
          <Row
            label="What only this place gives you"
            aName={a.name}
            bName={b.name}
            a={a.unique}
            b={b.unique}
          />
          <ListRow
            label="What is genuinely good"
            tone="good"
            aName={a.name}
            bName={b.name}
            a={a.strengths}
            b={b.strengths}
          />
          <ListRow
            label="What it actually costs you"
            tone="bad"
            aName={a.name}
            bName={b.name}
            a={a.tradeoffs}
            b={b.tradeoffs}
          />
          <Row
            label="Money — how paying for it works"
            aName={a.name}
            bName={b.name}
            a={a.money}
            b={b.money}
          />
          <Row
            label="Getting in — what they weigh"
            aName={a.name}
            bName={b.name}
            a={a.admissions}
            b={b.admissions}
          />
          <Row
            label="After you graduate"
            aName={a.name}
            bName={b.name}
            a={a.afterStudy}
            b={b.afterStudy}
            footnote="Post-study work rules are set by politics and change. Check the rule for your own graduation year before you plan around it."
          />
          <ListRow
            label="Strongest fields here"
            aName={a.name}
            bName={b.name}
            a={a.fields.map((f) => FACULTY_LABEL[f])}
            b={b.fields.map((f) => FACULTY_LABEL[f])}
            inline
          />
          <Row
            label="This suits you if…"
            aName={a.name}
            bName={b.name}
            a={a.suitsYou}
            b={b.suitsYou}
            tone="good"
          />
          <Row
            label="Look elsewhere if…"
            aName={a.name}
            bName={b.name}
            a={a.notForYou}
            b={b.notForYou}
            tone="bad"
          />

          <div className="grid gap-3 sm:grid-cols-2">
            {[a, b].map((d) => (
              <Link
                key={d.id}
                href={withFields(`/guide/places/${d.id}`, stated)}
                className="flex items-center justify-between gap-3 rounded-2xl border border-line bg-card p-5 transition-[transform,box-shadow,border-color] duration-200 ease-out hover:-translate-y-0.5 hover:border-accent hover:shadow-card focus-visible:focus-ring motion-reduce:transform-none motion-reduce:transition-none"
              >
                <span className="text-sm font-semibold text-ink">
                  Everything about {d.name}
                </span>
                <span aria-hidden className="shrink-0 text-ink-faint">
                  &rarr;
                </span>
              </Link>
            ))}
          </div>
        </>
      ) : (
        <p className="rounded-2xl border border-line bg-card p-5 text-sm leading-relaxed text-ink-soft">
          Pick a country on each side and they will be laid out against each
          other, question by question.
        </p>
      )}
    </div>
  );
}

/** One side's country chooser. Links, not a select: every pairing has a URL. */
function Picker({
  label,
  selected,
  hrefFor,
}: {
  label: string;
  selected?: StudyDestination;
  hrefFor: (id: string) => string;
}) {
  return (
    <section className="rounded-2xl border border-line bg-card p-4">
      <h2 className="text-xs font-semibold uppercase tracking-wide text-ink-faint">
        {label}
      </h2>
      <p className="mt-1 text-sm font-semibold text-ink">
        {selected ? selected.name : "Not chosen yet"}
      </p>
      <ul className="mt-2.5 flex flex-wrap gap-1.5">
        {STUDY_DESTINATIONS.map((d) => {
          const on = selected?.id === d.id;
          return (
            <li key={d.id}>
              <Link
                href={hrefFor(d.id)}
                aria-current={on ? "true" : undefined}
                className={`inline-flex h-11 items-center rounded-full border px-3.5 text-sm font-medium transition-[background-color,border-color,color,transform] duration-200 ease-out active:scale-[0.96] active:duration-75 focus-visible:focus-ring motion-reduce:transform-none motion-reduce:transition-none ${
                  on
                    ? "border-accent bg-accent-soft text-accent-ink"
                    : "border-line bg-surface text-ink-soft hover:border-ink/30 hover:text-ink"
                }`}
              >
                {d.name}
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

/**
 * The country name above each answer, shown only where the two halves are
 * stacked. Below `sm` the grid becomes one column, and a stacked comparison
 * with unlabelled halves is not a comparison — it is two paragraphs and a guess
 * about which country you are reading.
 */
function Side({ name }: { name: string }) {
  return (
    <span className="mb-1 block text-xs font-semibold text-ink sm:hidden">
      {name}
    </span>
  );
}

// One question, both answers.
function Row({
  label,
  aName,
  bName,
  a,
  b,
  tone = "plain",
  footnote,
}: {
  label: string;
  aName: string;
  bName: string;
  a: string;
  b: string;
  tone?: "plain" | "good" | "bad";
  footnote?: string;
}) {
  const cls =
    tone === "good"
      ? "border-accent/40 bg-accent-soft/25"
      : tone === "bad"
        ? "border-reach/40 bg-reach-soft/25"
        : "border-line bg-card";
  return (
    <section className={`rounded-2xl border p-4 sm:p-5 ${cls}`}>
      <h2 className="text-[11px] font-semibold uppercase tracking-wide text-ink-faint">
        {label}
      </h2>
      <div className="mt-2 grid gap-3 sm:grid-cols-2">
        <div>
          <Side name={aName} />
          <p className="max-w-[58ch] text-sm leading-relaxed text-ink-soft">{a}</p>
        </div>
        <div>
          <Side name={bName} />
          <p className="max-w-[58ch] text-sm leading-relaxed text-ink-soft">{b}</p>
        </div>
      </div>
      {footnote && (
        <p className="mt-2 text-xs leading-relaxed text-ink-faint">{footnote}</p>
      )}
    </section>
  );
}

function ListRow({
  label,
  aName,
  bName,
  a,
  b,
  tone = "plain",
  inline = false,
}: {
  label: string;
  aName: string;
  bName: string;
  a: string[];
  b: string[];
  tone?: "plain" | "good" | "bad";
  inline?: boolean;
}) {
  const dot =
    tone === "good" ? "bg-accent" : tone === "bad" ? "bg-reach" : "bg-ink-faint";
  const column = (items: string[]) =>
    inline ? (
      <ul className="flex flex-wrap gap-1.5">
        {items.map((item) => (
          <li
            key={item}
            className="rounded-lg border border-line bg-surface px-2.5 py-1 text-xs font-medium text-ink-soft"
          >
            {item}
          </li>
        ))}
      </ul>
    ) : (
      <ul className="max-w-[58ch] space-y-2">
        {items.map((item) => (
          <li
            key={item}
            className="flex gap-2.5 text-sm leading-relaxed text-ink-soft"
          >
            <span
              className={`mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full ${dot}`}
              aria-hidden
            />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    );

  return (
    <section className="rounded-2xl border border-line bg-card p-4 sm:p-5">
      <h2 className="text-[11px] font-semibold uppercase tracking-wide text-ink-faint">
        {label}
      </h2>
      <div className="mt-2 grid gap-3 sm:grid-cols-2">
        <div>
          <Side name={aName} />
          {column(a)}
        </div>
        <div>
          <Side name={bName} />
          {column(b)}
        </div>
      </div>
    </section>
  );
}
