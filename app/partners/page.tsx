import type { Metadata } from "next";
import { SKIP_TARGET, SkipLink } from "@/components/ui/SkipLink";
import Link from "@/components/ui/Link";
import { Logo } from "@/components/ui/Logo";
import { ButtonLink } from "@/components/ui/Button";
import { listActivePartners, partnerPostCounts } from "@/lib/partners/queries";
import { partnerPath } from "@/lib/data/partners";
import { PartnerLogo, VerifiedTick } from "@/components/partners/PartnerBadge";
import { regionLabel } from "@/lib/data/geo";
import { pageMeta } from "@/lib/seo";

export const dynamic = "force-dynamic";

export const metadata: Metadata = pageMeta({
  title: "Partner organisations — Compass",
  description:
    "The organisations that post their competitions, olympiads and programmes on Compass under their own name.",
  path: "/partners",
});

// The public list of organisations posting with us.
//
// It exists for two audiences at once: a student deciding whether a listing is
// real (the answer is a named organisation with a verification mark, not "some
// website"), and the next organisation deciding whether to join — which is far
// easier to say yes to when the hubs they respect are already on the page.

export default async function PartnersIndexPage() {
  const [partners, counts] = await Promise.all([
    listActivePartners(),
    partnerPostCounts(),
  ]);

  return (
    <div className="min-h-dvh bg-surface text-ink">
      {/* Banner outside the main landmark, and the skip link ahead of both. */}
      <SkipLink />
      <header className="border-b border-line/70">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-3 px-5 py-5 sm:px-6">
          <Link href="/" className="shrink-0 focus-visible:focus-ring">
            <Logo className="text-ink" />
          </Link>
          <div className="flex items-center gap-2">
            <ButtonLink href="/opportunities" variant="ghost" size="sm">
              What can I enter?
            </ButtonLink>
            {/* The reason an organisation is on this page. It was only at the
                very bottom, under an empty list — which is the one place a
                first-time visitor does not read. */}
            <ButtonLink href="/partners/apply" variant="primary" size="sm">
              Apply to be listed
            </ButtonLink>
          </div>
        </div>
      </header>

      <main id={SKIP_TARGET} tabIndex={-1}>
        <div className="mx-auto max-w-3xl px-5 py-14 sm:px-6">
          <h1 className="text-balance text-[2rem] font-semibold leading-[1.1] tracking-tight text-ink sm:text-[2.5rem]">
            Posted by the people who run them
          </h1>
          <p className="mt-4 max-w-xl text-pretty text-base leading-relaxed text-ink-soft">
            These organisations post their own competitions and programmes here.
            When you see the mark next to a name, it means we confirmed the
            account belongs to that organisation and they posted it themselves —
            the dates come from the people setting them.
          </p>

          {partners.length === 0 ? (
            <div className="mt-10 rounded-2xl border border-line bg-card p-6 shadow-card">
              <p className="text-base font-semibold text-ink">
                No organisations listed yet.
              </p>
              <p className="mt-2 text-sm leading-relaxed text-ink-soft">
                Everything on Compass today is catalogued and date-checked by
                us. If you run something students should know about, put it here
                yourself.
              </p>
            </div>
          ) : (
            <ul className="mt-10 space-y-3">
              {partners.map((p) => {
                const count = counts.get(p.id)?.live ?? 0;
                return (
                  <li key={p.id}>
                    <Link
                      href={partnerPath(p.id)}
                      className="flex gap-4 rounded-2xl border border-line bg-card p-5 shadow-card transition-shadow hover:shadow-lift focus-visible:focus-ring"
                    >
                      <PartnerLogo partner={p} size="lg" />
                      <span className="min-w-0 flex-1">
                        <span className="flex flex-wrap items-center gap-1.5">
                          <span className="text-base font-semibold text-ink">
                            {p.name}
                          </span>
                          {p.verifiedAt && <VerifiedTick size="md" />}
                        </span>
                        <span className="mt-0.5 block text-xs text-ink-faint">
                          {[p.city, p.country ? regionLabel(p.country) : null]
                            .filter(Boolean)
                            .join(" · ")}
                          {count > 0 && (
                            <>
                              {(p.city || p.country) && " · "}
                              <span data-num>{count}</span> open now
                            </>
                          )}
                        </span>
                        {p.about && (
                          <span className="mt-2 block text-pretty text-sm leading-relaxed text-ink-soft">
                            {p.about}
                          </span>
                        )}
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}

          <section className="mt-14 border-t border-line pt-10">
            <h2 className="text-xl font-semibold tracking-tight text-ink">
              Do you run something students should know about?
            </h2>
            <p className="mt-3 max-w-xl text-pretty text-base leading-relaxed text-ink-soft">
              Post it yourself, under your own name and logo. It reaches the
              students whose year and subjects actually fit it, with a real
              countdown to your deadline. It costs nothing, and you keep control
              of what it says.
            </p>
            <div className="mt-5">
              <ButtonLink href="/partners/apply" variant="primary" size="md">
                Apply to be listed
              </ButtonLink>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
