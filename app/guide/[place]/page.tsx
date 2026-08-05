import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "@/components/ui/Link";
import { Logo } from "@/components/ui/Logo";
import { ButtonLink } from "@/components/ui/Button";
import { StudentShell } from "@/components/student/StudentShell";
import { getSession } from "@/lib/auth/session";
import { FACULTY_LABEL } from "@/lib/data/faculties";
import { HUBS } from "@/lib/data/world";
import {
  STUDY_DESTINATIONS,
  destinationById,
  type StudyDestination,
} from "@/lib/data/study-destinations";

// One destination, in full: what it uniquely gives, what it costs you, what
// admissions weighs, what happens after you graduate, and who should not come.
//
// Public — a family deciding between the US and Germany should be able to read
// this without an account, which is the whole point of the guide.

export const dynamic = "force-dynamic";

export function generateStaticParams() {
  return STUDY_DESTINATIONS.map((d) => ({ place: d.id }));
}

export async function generateMetadata({
  params,
}: {
  params: { place: string };
}): Promise<Metadata> {
  const d = destinationById(params.place);
  if (!d) return { title: "Not found — Compass" };
  return {
    title: `Studying in ${d.name} — the honest picture | Compass`,
    description: d.oneLine,
  };
}

export default async function DestinationPage({
  params,
}: {
  params: { place: string };
}) {
  const destination = destinationById(params.place);
  if (!destination) notFound();

  const session = await getSession();
  const body = <DestinationBody destination={destination} />;

  if (session) {
    return (
      <StudentShell isAdmin={session.role === "admin"}>{body}</StudentShell>
    );
  }

  return (
    <main className="min-h-dvh bg-surface text-ink">
      <header className="border-b border-line/70">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-4 py-5 sm:px-6">
          <Logo className="shrink-0 text-ink" />
          <div className="flex items-center gap-2">
            <ButtonLink href="/opportunities" variant="subtle" size="sm">
              What can I enter?
            </ButtonLink>
            <ButtonLink href="/auth/login" variant="subtle" size="sm">
              Sign in
            </ButtonLink>
          </div>
        </div>
      </header>
      <div className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6">{body}</div>
    </main>
  );
}

function DestinationBody({ destination: d }: { destination: StudyDestination }) {
  const hubs = HUBS.filter((h) => d.hubs.includes(h.id));
  const others = STUDY_DESTINATIONS.filter((x) => x.id !== d.id);

  return (
    <div className="space-y-8">
      <div>
        <Link
          href="/guide"
          className="text-sm font-medium text-ink-soft underline-offset-2 hover:text-ink hover:underline focus-visible:focus-ring"
        >
          &larr; All of the guide
        </Link>
        <h1 className="mt-3 text-balance text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
          {d.name}
        </h1>
        <p className="mt-1 text-sm text-ink-faint">{d.where}</p>
        <p className="mt-3 max-w-2xl text-pretty text-base leading-relaxed text-ink-soft">
          {d.oneLine}
        </p>
        {d.modelled && (
          <p className="mt-3 inline-flex items-center rounded-full bg-accent-soft px-3 py-1 text-xs font-medium text-accent-ink">
            Compass calculates your admission odds for this destination
          </p>
        )}
      </div>

      <section className="rounded-2xl border border-ivy/25 bg-ivy-soft/40 p-5 sm:p-6">
        <h2 className="text-sm font-semibold uppercase tracking-[0.1em] text-ivy-ink/80">
          What only this place gives you
        </h2>
        <p className="mt-2 text-base leading-relaxed text-ink">{d.unique}</p>
      </section>

      {/* Strengths and trade-offs side by side, deliberately equal in weight.
          A page that lists five upsides and one caveat is a brochure. */}
      <section className="grid gap-4 sm:grid-cols-2">
        <Column title="What is genuinely good" items={d.strengths} tone="good" />
        <Column title="What it actually costs you" items={d.tradeoffs} tone="bad" />
      </section>

      <section className="space-y-3">
        <Block title="Money — how paying for it works">{d.money}</Block>
        <Block title="Getting in — what they weigh">{d.admissions}</Block>
        <Block title="After you graduate">
          {d.afterStudy}
          <span className="mt-1.5 block text-xs text-ink-faint">
            Post-study work rules are set by politics and change. Check the rule
            for your own graduation year before you plan around it.
          </span>
        </Block>
      </section>

      <section className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border border-accent/40 bg-accent-soft/25 p-5">
          <h2 className="text-sm font-semibold text-ink">
            This suits you if&hellip;
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-ink-soft">
            {d.suitsYou}
          </p>
        </div>
        <div className="rounded-2xl border border-reach/40 bg-reach-soft/25 p-5">
          <h2 className="text-sm font-semibold text-ink">
            Look elsewhere if&hellip;
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-ink-soft">
            {d.notForYou}
          </p>
        </div>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-ink">Strongest fields here</h2>
        <ul className="mt-2 flex flex-wrap gap-1.5">
          {d.fields.map((f) => (
            <li
              key={f}
              className="rounded-lg border border-line bg-card px-2.5 py-1 text-xs font-medium text-ink-soft"
            >
              {FACULTY_LABEL[f]}
            </li>
          ))}
        </ul>
      </section>

      {hubs.length > 0 && (
        <section>
          <h2 className="text-lg font-semibold text-ink">
            The cities, and the work that sits in them
          </h2>
          <ul className="mt-3 space-y-2.5">
            {hubs.map((h) => (
              <li key={h.id} className="rounded-2xl border border-line bg-card p-4">
                <p className="text-sm font-semibold text-ink">
                  {h.city}{" "}
                  <span className="font-normal text-ink-faint">{h.country}</span>
                </p>
                <p className="mt-1 text-sm leading-relaxed text-ink-soft">
                  {h.what}
                </p>
                <p className="mt-2 text-xs leading-relaxed text-ink-faint">
                  <span className="font-medium text-ink-soft">The catch:</span>{" "}
                  {h.catch}
                </p>
                <p className="mt-1 text-xs leading-relaxed text-ink-faint">
                  <span className="font-medium text-ink-soft">The way in:</span>{" "}
                  {h.route}
                </p>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="rounded-2xl border border-line bg-card p-5 sm:p-6">
        <h2 className="text-lg font-semibold text-ink">Compare it with</h2>
        <p className="mt-1 text-sm text-ink-soft">
          Nobody chooses a country in isolation. These are the ones students
          weigh against it.
        </p>
        <ul className="mt-3 flex flex-wrap gap-2">
          {others.map((o) => (
            <li key={o.id}>
              <Link
                href={`/guide/${o.id}`}
                className="inline-flex h-9 items-center rounded-full border border-line bg-surface px-3.5 text-sm font-medium text-ink-soft transition-colors hover:border-accent hover:text-ink focus-visible:focus-ring"
              >
                {o.name}
              </Link>
            </li>
          ))}
        </ul>
        <div className="mt-5">
          <Link
            href="/opportunities"
            className="inline-flex h-11 items-center rounded-xl bg-ink px-5 text-sm font-medium text-white transition-colors hover:bg-ink/90 focus-visible:focus-ring"
          >
            What you can enter from home this year &rarr;
          </Link>
        </div>
      </section>
    </div>
  );
}

function Column({
  title,
  items,
  tone,
}: {
  title: string;
  items: string[];
  tone: "good" | "bad";
}) {
  return (
    <div
      className={`rounded-2xl border p-5 ${
        tone === "good"
          ? "border-line bg-card"
          : "border-line bg-surface/60"
      }`}
    >
      <h2 className="text-sm font-semibold text-ink">{title}</h2>
      <ul className="mt-3 space-y-2.5">
        {items.map((item) => (
          <li
            key={item}
            className="flex gap-2.5 text-sm leading-relaxed text-ink-soft"
          >
            <span
              className={`mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full ${
                tone === "good" ? "bg-accent" : "bg-reach"
              }`}
              aria-hidden
            />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function Block({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-line bg-card p-5">
      <h2 className="text-sm font-semibold text-ink">{title}</h2>
      <p className="mt-2 text-sm leading-relaxed text-ink-soft">{children}</p>
    </div>
  );
}
