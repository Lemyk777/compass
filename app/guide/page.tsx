import type { Metadata } from "next";
import { Logo } from "@/components/ui/Logo";
import { ButtonLink } from "@/components/ui/Button";
import { GuideView } from "@/components/guide/GuideView";
import { StudentShell } from "@/components/student/StudentShell";
import { getSession } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import type { FacultyValue } from "@/lib/data/faculties";

// The life-path guide — the second half of the student's own section of the
// site, next to Opportunities. Public: a stranger deciding whether any of this
// is for them should be able to read the whole thing without an account.
//
// Signed in, it opens on the student's own fields; signed out, on everything.
// It reads only `faculties`, so no heavy per-student load is needed here.

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Where this can take you — Compass",
  description:
    "What each field of study actually leads to, the kinds of work inside it, and where in the world that work sits — with the honest catch and the real way in for each place.",
};

export default async function GuidePage() {
  const session = await getSession();

  let faculties: FacultyValue[] = [];
  if (session) {
    const supabase = createClient();
    const { data } = await supabase
      .from("student_profiles")
      .select("faculties")
      .eq("user_id", session.id)
      .maybeSingle();
    if (Array.isArray(data?.faculties)) {
      faculties = data!.faculties as FacultyValue[];
    }
  }

  if (session) {
    return (
      <StudentShell isAdmin={session.role === "admin"}>
        <GuideView initialFaculties={faculties} signedIn />
      </StudentShell>
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

      <div className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6">
        <GuideView initialFaculties={[]} signedIn={false} />
      </div>
    </main>
  );
}
