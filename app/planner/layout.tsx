import { getSession } from "@/lib/auth/session";
import { StudentShell } from "@/components/student/StudentShell";
import { loadStudentContext } from "@/lib/dashboard/load";
import { PlannerTabs } from "@/components/planner/PlannerTabs";

// The frame for the planner — the student's third section, beside Opportunities
// and the Guide.
//
// Private, unlike the guide: a plan is the student's own, so there is no
// signed-out shell to choose between. The session read is shared with the page
// below through `cache()`, so picking the shell and building the view are one
// set of queries.
//
// It asks with `getSession`, NOT `requireSession`, and that is deliberate. A
// layout does not receive the pathname, so its redirect could only ever name
// one destination — and it runs BEFORE the page's. Requiring here sent someone
// following a link to /planner/board to `?next=/planner`, so signing in landed
// them on the agenda rather than the board they had asked for. Each page
// requires its own path instead, and this renders nothing when there is no
// session because the page below is about to redirect anyway.
export const dynamic = "force-dynamic";

export default async function PlannerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();
  if (!session) return <>{children}</>;

  const ctx = await loadStudentContext(session);

  return (
    <StudentShell
      isAdmin={session.role === "admin"}
      hasReport={Boolean(ctx.analysis)}
    >
      <div className="space-y-7">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.12em] text-ink-faint">
            Your plan
          </p>
          <div className="mt-2">
            <PlannerTabs />
          </div>
        </div>
        {children}
      </div>
    </StudentShell>
  );
}
