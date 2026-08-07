import { StudentNav } from "@/components/student/StudentNav";
import { Shell } from "@/components/ui/Shell";

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
      <StudentNav isAdmin={isAdmin} hasReport={hasReport} />
      <Shell as="main" className="py-6 sm:py-8">
        {children}
      </Shell>
    </div>
  );
}
