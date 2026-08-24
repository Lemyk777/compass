import type { Metadata } from "next";
import { fitDescription, fitTitle } from "@/lib/seo";
import { SKIP_TARGET, SkipLink } from "@/components/ui/SkipLink";
import { notFound } from "next/navigation";
import Link from "@/components/ui/Link";
import { BrandLink } from "@/components/ui/BrandLink";
import { ButtonLink } from "@/components/ui/Button";
import { getActivePartner, partnerOpportunities } from "@/lib/partners/queries";
import { OpportunityCard } from "@/components/opportunities/OpportunityCard";
import {
  PartnerLogo,
  VerifiedExplainer,
  VerifiedTick,
} from "@/components/partners/PartnerBadge";
import { regionLabel } from "@/lib/data/geo";

export const dynamic = "force-dynamic";

// An organisation's public page: who they are, and everything they currently
// have open. This is the link they post to their own audience, so it shows
// their whole list unfiltered — the year/subject matching belongs on a
// student's own list, not on a page someone opened because they follow this
// organisation already.

export async function generateMetadata({
  params,
}: {
  params: { id: string };
}): Promise<Metadata> {
  const partner = await getActivePartner(params.id);
  if (!partner) return { title: "Partner — Compass" };
  return {
    title: fitTitle(partner.name, "what they have open"),
    // This route does not go through `pageMeta` (it is a database row, not a
    // registry page, and is deliberately absent from the sitemap), so it has to
    // apply the budget itself. `partner.about` is written by the partner and
    // has no length the form enforces.
    description: fitDescription(
      partner.about ||
        `Competitions and programmes posted by ${partner.name} on Compass.`,
    ),
  };
}

export default async function PartnerProfilePage({
  params,
}: {
  params: { id: string };
}) {
  const partner = await getActivePartner(params.id);
  if (!partner) notFound();

  const items = await partnerOpportunities(partner.id);
  const open = items.filter((o) => !o.dateConfirmed || o.daysToDeadline >= 0);

  return (
    <div className="min-h-dvh bg-surface text-ink">
      {/* Banner outside the main landmark, and the skip link ahead of both. */}
      <SkipLink />
      <header className="border-b border-line/70">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-3 px-5 py-5 sm:px-6">
          <Link href="/" className="shrink-0 focus-visible:focus-ring">
            <BrandLink transition={false} />
          </Link>
          <ButtonLink href="/partners" variant="subtle" size="sm">
            All partners
          </ButtonLink>
        </div>
      </header>

      <main id={SKIP_TARGET} tabIndex={-1}>
        <div className="mx-auto max-w-3xl px-5 py-12 sm:px-6">
          <div className="flex flex-wrap items-start gap-5">
            <PartnerLogo partner={partner} size="lg" />
            <div className="min-w-0 flex-1">
              <h1 className="flex flex-wrap items-center gap-2 text-balance text-[1.75rem] font-semibold leading-tight tracking-tight text-ink sm:text-[2rem]">
                {partner.name}
                {partner.verifiedAt && <VerifiedTick size="md" />}
              </h1>
              <p className="mt-1 text-sm text-ink-faint">
                {[
                  partner.city,
                  partner.country ? regionLabel(partner.country) : null,
                ]
                  .filter(Boolean)
                  .join(" · ") || "Posting on Compass"}
              </p>
            </div>
          </div>

          {partner.about && (
            <p className="mt-5 max-w-xl text-pretty text-base leading-relaxed text-ink-soft">
              {partner.about}
            </p>
          )}

          <div className="mt-5 flex flex-wrap items-center gap-3">
            {partner.website && (
              <a
                href={partner.website}
                target="_blank"
                rel="noreferrer"
                className="inline-flex h-11 items-center rounded-xl border border-line bg-card px-4 text-sm font-medium text-ink-soft transition-colors hover:border-ink/25 hover:text-ink focus-visible:focus-ring"
              >
                Their website ↗
              </a>
            )}
          </div>

          {partner.verifiedAt && (
            <div className="mt-6 rounded-xl border border-line bg-card p-4">
              <VerifiedExplainer />
            </div>
          )}

          <section className="mt-12">
            <h2 className="text-lg font-semibold tracking-tight text-ink">
              Open now{" "}
              <span data-num className="text-sm font-normal text-ink-faint">
                ({open.length})
              </span>
            </h2>

            {open.length === 0 ? (
              <p className="mt-3 rounded-2xl border border-line bg-card p-6 text-sm leading-relaxed text-ink-soft shadow-card">
                Nothing open from {partner.name} at the moment. When they post
                something it lands here, and on the list of every student it
                suits.
              </p>
            ) : (
              <ul className="mt-4 space-y-4">
                {open.map((o) => (
                  <li key={o.id}>
                    <OpportunityCard o={o} />
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="mt-14 border-t border-line pt-8">
            <p className="text-pretty text-base leading-relaxed text-ink-soft">
              Compass keeps track of thousands of competitions, olympiads and
              programmes, and tells a student which ones they can actually enter
              at their age.{" "}
              <Link
                href="/opportunities"
                className="font-semibold text-ink underline decoration-line underline-offset-2 hover:decoration-ink"
              >
                See what you can enter
              </Link>
              .
            </p>
          </section>
        </div>
      </main>
    </div>
  );
}
