import { StudentNav } from "@/components/student/StudentNav";
import { Shell } from "@/components/ui/Shell";
import { SKIP_TARGET, SkipLink } from "@/components/ui/SkipLink";

// The frame for the student's own section of the site: Opportunities and the
// Guide. Deliberately NOT the report's sidebar shell — a rail of eight analysis
// tabs told every arriving student that this is a portfolio-scoring console,
// which is exactly backwards now. One narrow column, two destinations, and the
// report one click away.
export function StudentShell({
  children,
  isAdmin = false,
  hasReport = false,
}: {
  children: React.ReactNode;
  isAdmin?: boolean;
  hasReport?: boolean;
}) {
  return (
    <div className="min-h-dvh bg-surface text-ink">
      <SkipLink />
      <StudentNav isAdmin={isAdmin} hasReport={hasReport} />
      {/* `tabIndex={-1}` is what makes the skip link move focus and not merely
          scroll — see the note in SkipLink. */}
      <Shell as="main" id={SKIP_TARGET} tabIndex={-1} className="py-6 sm:py-8">
        {children}
      </Shell>
    </div>
  );
}
