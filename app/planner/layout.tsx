import { getSession } from "@/lib/auth/session";
import { StudentShell } from "@/components/student/StudentShell";
import { loadStudentContext } from "@/lib/dashboard/load";

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
      <div className="space-y-6">
        {/* ONE heading for the whole section, and it lives here rather than in
            a page. The three views used to bring their own `<h1>` each, so the
            section opened with two headings before any content and the views
            disagreed about how tall their header was.
            The lens switcher is NOT here: it belongs to the window, which owns
            which lens is showing, and a switcher in a layout would have to
            reach for the URL to find out. */}
        <h1 className="text-2xl font-semibold tracking-tight text-ink">
          Your plan
        </h1>
        {children}
      </div>
    </StudentShell>
  );
}
