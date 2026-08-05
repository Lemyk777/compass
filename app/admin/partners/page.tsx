import type { Metadata } from "next";
import { requireRole } from "@/lib/auth/session";
import { listAllPartners, listAllPartnerPosts } from "@/lib/partners/queries";
import { AppHeader } from "@/components/ui/AppHeader";
import { Card } from "@/components/report/Section";
import { PartnerAdmin } from "@/components/admin/PartnerAdmin";
import { getT } from "@/lib/i18n/server";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Partners — Compass admin",
};

// Where partner organisations are approved, verified and — when it comes to
// it — switched off.
//
// This page carries more weight than the discovery queue next door, because
// partners publish without one: approving an organisation here is the decision
// that everything it posts from now on reaches students unreviewed. The copy
// says so rather than hiding it behind a button labelled "approve".

export default async function AdminPartnersPage() {
  await requireRole("admin", "/admin/partners");
  const t = getT();

  const [partners, postsByPartner] = await Promise.all([
    listAllPartners(),
    listAllPartnerPosts(),
  ]);

  const pending = partners.filter((p) => p.status === "pending");
  const active = partners.filter((p) => p.status === "active");
  const inactive = partners.filter(
    (p) => p.status === "suspended" || p.status === "rejected",
  );
  const verified = active.filter((p) => p.verifiedAt).length;
  const livePosts = [...postsByPartner.values()]
    .flat()
    .filter((p) => p.published).length;

  return (
    <main className="min-h-dvh bg-surface">
      <AppHeader
        admin
        links={[
          { href: "/admin", label: t("admin.metrics") },
          { href: "/admin/opportunities", label: t("admin.opps") },
          { href: "/dashboard", label: t("common.dashboard") },
        ]}
      />

      <div className="mx-auto max-w-3xl px-5 py-6">
        <h1 className="text-2xl font-semibold tracking-tight text-ink">Partners</h1>
        <p className="mb-6 max-w-xl text-sm leading-relaxed text-ink-soft">
          Organisations that post opportunities under their own name. Approving
          one means everything it posts from then on goes live immediately,
          without passing through the queue — so the check that matters is
          whether this account really speaks for that organisation.
        </p>

        <div className="grid grid-cols-3 gap-3">
          <Stat label="Awaiting review" value={pending.length} />
          <Stat label="Listed" value={active.length} />
          <Stat label="Verified" value={verified} />
        </div>
        <p className="mt-2 text-xs text-ink-faint">
          <span data-num>{livePosts}</span> partner-posted opportunities are live
          on students&rsquo; lists.
        </p>

        <Section title="Awaiting review" count={pending.length}>
          {pending.length === 0 ? (
            <Card>
              <p className="text-sm text-ink-soft">No applications waiting.</p>
            </Card>
          ) : (
            pending.map((p) => (
              <PartnerAdmin key={p.id} partner={p} posts={postsByPartner.get(p.id) ?? []} />
            ))
          )}
        </Section>

        {active.length > 0 && (
          <Section title="Listed" count={active.length}>
            {active.map((p) => (
              <PartnerAdmin key={p.id} partner={p} posts={postsByPartner.get(p.id) ?? []} />
            ))}
          </Section>
        )}

        {inactive.length > 0 && (
          <Section title="Suspended and rejected" count={inactive.length}>
            {inactive.map((p) => (
              <PartnerAdmin key={p.id} partner={p} posts={postsByPartner.get(p.id) ?? []} />
            ))}
          </Section>
        )}
      </div>
    </main>
  );
}

function Section({
  title,
  count,
  children,
}: {
  title: string;
  count: number;
  children: React.ReactNode;
}) {
  return (
    <section className="mt-8">
      <h2 className="mb-3 flex items-baseline gap-2 text-lg font-semibold text-ink">
        {title}
        <span data-num className="text-sm font-normal text-ink-faint">
          ({count})
        </span>
      </h2>
      <div className="space-y-4">{children}</div>
    </section>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl border border-line bg-card p-4 shadow-card">
      <div data-num className="font-display text-3xl font-semibold text-ink">
        {value}
      </div>
      <div className="mt-0.5 text-xs text-ink-soft">{label}</div>
    </div>
  );
}
