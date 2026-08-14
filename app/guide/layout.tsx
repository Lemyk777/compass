import { BrandLink } from "@/components/ui/BrandLink";
import { Shell } from "@/components/ui/Shell";
import { ButtonLink } from "@/components/ui/Button";
import { StudentShell } from "@/components/student/StudentShell";
import { SKIP_TARGET, SkipLink } from "@/components/ui/SkipLink";
import { GuideTabs } from "@/components/guide/GuideTabs";
import { NavTrail } from "@/components/guide/NavTrail";
import { guideSession } from "@/lib/guide/student-fields";

// The frame for the whole guide — every step, every city, every destination.
//
// It exists because the section stopped being one page. The shell choice
// (signed-in gets StudentShell, a guest gets a header with a way in) used to be
// copy-pasted into the two guide routes; with seven it would have been
// copy-pasted seven times and drifted by the third.
//
// Public by design: a family deciding between Germany and Korea should be able
// to read all of this without an account, which is the point of the guide.

export const dynamic = "force-dynamic";

export default async function GuideLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Shared with the page below through `cache()` — the layout picking a shell
  // and the page labelling its filter are one auth read, not two.
  const session = await guideSession();

  const inner = (
    <div className="space-y-7">
      {/* Renders nothing. It sits at the layout because only the layout outlives
          a navigation, and remembering which page a student came from is what
          lets a sub-page's Close return them to their place in the list rather
          than to the top of it. */}
      <NavTrail />
      <div>
        <p className="text-xs font-medium uppercase tracking-[0.12em] text-ink-faint">
          The guide
        </p>
        <div className="mt-2">
          <GuideTabs />
        </div>
      </div>
      {children}
    </div>
  );

  if (session) {
    return (
      <StudentShell isAdmin={session.role === "admin"}>{inner}</StudentShell>
    );
  }

  // `<main>` wraps the CONTENT and nothing else. It used to wrap the header too,
  // which put the banner and the whole guide nav inside the main landmark — so a
  // screen-reader user jumping to "main" landed on the logo and the sign-in
  // button, and the one navigation shortcut that exists for skipping chrome
  // delivered them straight back into it.
  return (
    <div className="min-h-dvh bg-surface text-ink">
      <SkipLink />
      <header className="border-b border-line/70">
        <Shell className="flex items-center justify-between gap-3 py-5">
          <BrandLink />
          <div className="flex items-center gap-2">
            <ButtonLink href="/opportunities" variant="subtle" size="sm">
              What can I enter?
            </ButtonLink>
            <ButtonLink href="/auth/login" variant="subtle" size="sm">
              Sign in
            </ButtonLink>
          </div>
        </Shell>
      </header>

      <Shell as="main" id={SKIP_TARGET} tabIndex={-1} className="py-8">
        {inner}
      </Shell>
    </div>
  );
}
