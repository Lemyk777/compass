import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "@/components/ui/Link";
import { SKIP_TARGET } from "@/components/ui/SkipLink";
import { Shell } from "@/components/ui/Shell";
import { StudentShell } from "@/components/student/StudentShell";
import { ShareLink } from "@/components/opportunities/ShareLink";
import { resolveCompetitions, type Competition } from "@/lib/data/key-dates";
import { formatDate, opportunityCost } from "@/lib/data/opportunity-format";
import { FACULTY_LABEL } from "@/lib/data/faculties";
import { fetchLivePool } from "@/lib/partners/queries";
import { getSession } from "@/lib/auth/session";
import { pageMeta } from "@/lib/seo";
import { JsonLd } from "@/components/seo/JsonLd";
import { breadcrumbSchema } from "@/lib/schema";

// One opportunity, at its own address.
//
// It did not have one. The detail was a modal, which meant the single most
// natural thing a student does with this product — find a contest and send it
// to a friend — was impossible: a modal has no URL, so there was nothing to
// send. The guide learned this already and turned its sheets into pages; this
// is the same fix on the other half of the site.
//
// The address is what makes the sharing honest, too. A student who sends the
// organiser's own link sends a page that does not say who can enter, what it
// costs, or when it closes — those four facts are the product. This page
// carries them, and its Open Graph tags mean the link unfurls into a card
// showing them rather than into the site-wide banner.

export const dynamic = "force-dynamic";

async function findOpportunity(id: string): Promise<Competition | undefined> {
  // The same resolution the list uses, so a partner's post gets a page like
  // any other row rather than being a second, invisible catalog.
  const live = await fetchLivePool();
  return resolveCompetitions(live).find((c) => c.id === id);
}

/** The four facts, as one sentence — this is what a pasted link shows. */
function previewLine(c: Competition): string {
  const cost = opportunityCost(c);
  const when = c.deadline
    ? c.dateConfirmed
      ? `Closes ${formatDate(c.deadline)}`
      : "Dates to be confirmed"
    : "Open now, no deadline";
  const who = c.eligibility ?? "Open to school students";
  return `${who} · ${cost.short} · ${when}. ${c.blurb}`;
}

export async function generateMetadata({
  params,
}: {
  params: { id: string };
}): Promise<Metadata> {
  const o = await findOpportunity(params.id);
  if (!o)
    return pageMeta({
      title: "Not found — Compass",
      description: "",
      path: `/opportunities/${params.id}`,
    });
  return pageMeta({
    title: `${o.name} — who can enter, what it costs, when it closes | Compass`,
    description: previewLine(o),
    path: `/opportunities/${o.id}`,
    type: "article",
  });
}

export default async function OpportunityPage({
  params,
}: {
  params: { id: string };
}) {
  const [o, session] = await Promise.all([
    findOpportunity(params.id),
    getSession(),
  ]);
  // A real 404 for an id that does not exist — never a 200 carrying a
  // "not found" page, which is the one status a crawler must not see for an
  // address that isn't there.
  if (!o) notFound();

  const cost = opportunityCost(o);
  const facts: { label: string; body: string; tone?: "warn" }[] = [
    {
      label: "Who can enter",
      body:
        o.eligibility ??
        "The organiser does not state an age or grade rule. Check the official page before you plan around it.",
    },
    { label: "What it costs", body: cost.detail },
    {
      label: "When it closes",
      body: o.deadline
        ? o.dateConfirmed
          ? `${formatDate(o.deadline)}${o.window ? ` · ${o.window}` : ""}`
          : `We could not confirm this year's date against the organiser's own page, so we are not showing a countdown for it.${o.window ? ` Last published: ${o.window}.` : ""}`
        : "No deadline. This one is open whenever you are ready to start.",
      tone: o.deadline && !o.dateConfirmed ? "warn" : undefined,
    },
  ];

  return (
    <StudentShell isAdmin={session?.role === "admin"}>
      <Shell>
        <main id={SKIP_TARGET} className="space-y-6 py-6">
          {/* The same two steps the visible trail below shows, in the form a
              search result can render. These are the pages students send each
              other, so they are also the pages most likely to be someone's
              first arrival from a search — and `o.name` here can be a partner's
              own wording, which is why `serializeJsonLd` escapes rather than
              trusts it. */}
          <JsonLd
            data={breadcrumbSchema([
              { name: "Everything you can enter", path: "/opportunities" },
              { name: o.name, path: `/opportunities/${o.id}` },
            ])}
          />
          <nav aria-label="Breadcrumb" className="text-sm">
            <Link
              href="/opportunities"
              className="inline-flex min-h-11 items-center gap-1.5 text-ink-faint underline-offset-2 transition-colors hover:text-ink hover:underline focus-visible:focus-ring"
            >
              <span aria-hidden>&larr;</span> Everything you can enter
            </Link>
          </nav>

          <header>
            <h1 className="text-balance text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
              {o.name}
            </h1>
            <p className="mt-3 max-w-[54ch] text-pretty text-base leading-relaxed text-ink-soft">
              {o.blurb}
            </p>
            {/* `fields: "all"` is a real value and means every subject — the
                catalog's own "unknown facts never exclude" shape. Listing eight
                chips for it would be noise, so it says so in one. */}
            <ul className="mt-3 flex flex-wrap gap-1.5">
              {o.fields === "all" ? (
                <li className="rounded-full bg-accent-soft px-2.5 py-1 text-xs font-medium text-accent-ink">
                  Any subject
                </li>
              ) : (
                o.fields.map((f) => (
                  <li
                    key={f}
                    className="rounded-full bg-accent-soft px-2.5 py-1 text-xs font-medium text-accent-ink"
                  >
                    {FACULTY_LABEL[f]}
                  </li>
                ))
              )}
            </ul>
          </header>

          {/* The three facts a student decides on, level with each other. Only
              an unconfirmed date is tinted — it is the one that makes a claim
              the reader has to act differently about. */}
          <dl className="grid gap-3 sm:grid-cols-3">
            {facts.map((f) => (
              <div
                key={f.label}
                className={`rounded-2xl border p-4 sm:p-5 ${
                  f.tone === "warn"
                    ? "border-reach/30 bg-reach-soft/40"
                    : "border-line bg-card"
                }`}
              >
                <dt className="text-[12px] font-semibold uppercase tracking-wide text-ink-faint">
                  {f.label}
                </dt>
                <dd className="mt-1.5 text-sm leading-relaxed text-ink-soft">
                  {f.body}
                </dd>
              </div>
            ))}
          </dl>

          <div className="flex flex-wrap items-center gap-2.5">
            <a
              href={o.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-11 items-center rounded-xl bg-accent px-5 text-sm font-medium text-on-fill transition-[background-color,transform,box-shadow] duration-200 ease-out hover:-translate-y-0.5 hover:shadow-lift active:translate-y-0 active:duration-75 focus-visible:focus-ring motion-reduce:transform-none motion-reduce:transition-none"
            >
              Open the official page
            </a>
            <ShareLink path={`/opportunities/${o.id}`} />
          </div>

          <p className="max-w-[54ch] text-sm leading-relaxed text-ink-faint">
            Sending this to someone sends the four facts above, not just a name.
            They will see who can enter and what it costs before they decide.
          </p>
        </main>
      </Shell>
    </StudentShell>
  );
}
