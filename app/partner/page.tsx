import type { Metadata } from "next";
import { SKIP_TARGET, SkipLink } from "@/components/ui/SkipLink";
import { redirect } from "next/navigation";
import { requireSession } from "@/lib/auth/session";
import { getPartnerForUser, listPartnerPosts } from "@/lib/partners/queries";
import { AppHeader } from "@/components/ui/AppHeader";
import { Card } from "@/components/report/Section";
import { ButtonLink } from "@/components/ui/Button";
import { PartnerConsole } from "@/components/partners/PartnerConsole";
import { PartnerLogo, VerifiedTick } from "@/components/partners/PartnerBadge";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Partner console — Compass",
};

// The organisation's own workspace. Reached by role, but gated on the partner
// ROW rather than the role: an applicant whose account is still `student` needs
// to land here and be told where their application stands, and a suspended
// partner needs to be told that plainly rather than shown a broken form.

export default async function PartnerPage() {
  const session = await requireSession("/partner");
  const partner = await getPartnerForUser(session.id);

  // No organisation on this account at all — the only useful thing we can do is
  // point at the application.
  if (!partner) redirect("/partners/apply");

  if (partner.status === "pending" || partner.status === "rejected") {
    return (
      <div className="min-h-dvh bg-surface">
        <SkipLink />
        <AppHeader links={[{ href: "/dashboard", label: "Dashboard" }]} />
        <main id={SKIP_TARGET} tabIndex={-1}>
          <div className="mx-auto max-w-2xl px-5 py-10">
            <h1 className="text-2xl font-semibold tracking-tight text-ink">
              {partner.name}
            </h1>
            <Card className="mt-5">
              {partner.status === "pending" ? (
                <>
                  <p className="text-base font-semibold text-ink">
                    Your application is with us.
                  </p>
                  <p className="mt-2 text-sm leading-relaxed text-ink-soft">
                    We check one thing before listing an organisation: that this
                    account really belongs to it. Usually that means an email
                    from your own domain, or a link to Compass from a page you
                    control. We&rsquo;ll write to{" "}
                    <span className="font-medium text-ink">
                      {partner.contactEmail ?? session.email}
                    </span>
                    .
                  </p>
                </>
              ) : (
                <>
                  <p className="text-base font-semibold text-ink">
                    We didn&rsquo;t list this one.
                  </p>
                  <p className="mt-2 text-sm leading-relaxed text-ink-soft">
                    {partner.reviewNote ||
                      "If you think that's wrong, write to us and we'll look again."}
                  </p>
                </>
              )}
            </Card>
            <div className="mt-5">
              <ButtonLink href="/opportunities" variant="tonal" size="md">
                See what students see
              </ButtonLink>
            </div>
          </div>
        </main>
      </div>
    );
  }

  const posts = await listPartnerPosts(partner.id);
  const live = posts.filter((p) => p.published).length;

  return (
    <div className="min-h-dvh bg-surface">
      <SkipLink />
      <AppHeader
        links={[
          { href: `/partners/${partner.id}`, label: "Your public page" },
          { href: "/opportunities", label: "Student view" },
        ]}
      />
      <main id={SKIP_TARGET} tabIndex={-1}>
        <div className="mx-auto max-w-5xl px-5 py-8">
          <header className="flex flex-wrap items-start gap-4">
            <PartnerLogo partner={partner} size="lg" />
            <div className="min-w-0 flex-1">
              <h1 className="flex flex-wrap items-center gap-2 text-2xl font-semibold tracking-tight text-ink">
                {partner.name}
                {partner.verifiedAt && <VerifiedTick size="md" />}
              </h1>
              <p className="mt-1 text-sm text-ink-soft">
                {partner.verifiedAt
                  ? "Verified. Every opportunity you post carries your name and the tick."
                  : "Listed. Your name is on everything you post; the tick appears once we've confirmed the account."}
                {" · "}
                <span data-num>{live}</span> live
                {posts.length !== live && (
                  <>
                    {" · "}
                    <span data-num>{posts.length - live}</span> taken down
                  </>
                )}
              </p>
            </div>
          </header>

          {partner.status === "suspended" && (
            <div className="mt-6 rounded-2xl border border-reach/40 bg-reach-soft/50 p-5">
              <p className="text-base font-semibold text-ink">
                This account is suspended.
              </p>
              <p className="mt-2 text-sm leading-relaxed text-ink-soft">
                {partner.reviewNote ||
                  "Nothing you posted is visible to students right now, and new posts are paused. Write to us and we'll sort it out."}
              </p>
            </div>
          )}

          <div className="mt-8">
            <PartnerConsole
              partner={partner}
              posts={posts}
              canPost={partner.status === "active"}
            />
          </div>
        </div>
      </main>
    </div>
  );
}
