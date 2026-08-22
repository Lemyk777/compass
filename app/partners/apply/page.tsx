import type { Metadata } from "next";
import { SKIP_TARGET, SkipLink } from "@/components/ui/SkipLink";
import { redirect } from "next/navigation";
import Link from "@/components/ui/Link";
import { BrandLink } from "@/components/ui/BrandLink";
import { ButtonLink } from "@/components/ui/Button";
import { getSession } from "@/lib/auth/session";
import { getPartnerForUser } from "@/lib/partners/queries";
import { ApplyForm } from "@/components/partners/ApplyForm";
import { pageMeta } from "@/lib/seo";
import { REPLY_WINDOW } from "@/lib/site";

export const dynamic = "force-dynamic";

export const metadata: Metadata = pageMeta({
  title: "Post your competitions on Compass",
  description:
    "Organisations running competitions, olympiads and programmes for school students can post them on Compass under their own name.",
  path: "/partners/apply",
});

export default async function PartnerApplyPage() {
  const session = await getSession();
  // Already an organisation on this account — the console is the useful page.
  if (session) {
    const existing = await getPartnerForUser(session.id);
    if (existing) redirect("/partner");
  }

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
            Who&rsquo;s already here
          </ButtonLink>
        </div>
      </header>

      <main id={SKIP_TARGET} tabIndex={-1}>
        <div className="mx-auto max-w-2xl px-5 py-14 sm:px-6">
          <h1 className="text-balance text-[2rem] font-semibold leading-[1.1] tracking-tight text-ink">
            Post your own competitions, under your own name
          </h1>
          <p className="mt-4 text-pretty text-base leading-relaxed text-ink-soft">
            You write it, you publish it, and it appears immediately with your
            logo on it. It reaches the students whose school year and subjects
            actually fit, not everyone and not nobody. There is nothing to
            pay, and you can take anything down yourself.
          </p>

          <ul className="mt-6 space-y-2 text-[0.95rem] leading-relaxed text-ink-soft">
            <Point>
              Your deadline shows students a live countdown, because the date
              comes from you rather than from a page we read.
            </Point>
            <Point>
              Once we&rsquo;ve confirmed the account belongs to your
              organisation, everything you post carries a verification mark. We
              reply within {REPLY_WINDOW}.
            </Point>
            <Point>
              You get a public page listing everything you have open, a link
              you can send to your own audience.
            </Point>
          </ul>

          <div className="mt-10">
            {session ? (
              <ApplyForm defaultEmail={session.email ?? ""} />
            ) : (
              <div className="rounded-2xl border border-line bg-card p-6 shadow-card">
                <p className="text-base font-semibold text-ink">
                  Sign in first. The account you use becomes the account you
                  post from.
                </p>
                <p className="mt-2 text-sm leading-relaxed text-ink-soft">
                  Use an address at your organisation&rsquo;s own domain if you
                  have one. It is the quickest way for us to confirm the account
                  is really yours, which is what the verification mark is about.
                </p>
                <div className="mt-5 flex flex-wrap gap-3">
                  <ButtonLink
                    href="/auth/signup?next=/partners/apply"
                    variant="primary"
                    size="md"
                  >
                    Create an account
                  </ButtonLink>
                  <ButtonLink
                    href="/auth/login?next=/partners/apply"
                    variant="tonal"
                    size="md"
                  >
                    Sign in
                  </ButtonLink>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

function Point({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex items-start gap-2.5">
      <span
        aria-hidden
        className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-accent"
      />
      <span>{children}</span>
    </li>
  );
}
