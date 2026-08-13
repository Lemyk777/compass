import type { Metadata } from "next";
import { requireSession } from "@/lib/auth/session";
import { loadPlanner } from "@/lib/planner/load";
import { PlannerAgenda } from "@/components/planner/PlannerAgenda";

export const dynamic = "force-dynamic";

// Behind a login, so nothing is said to a crawler about it beyond the
// robots.txt rule — and no canonical, because there is no public document here.
export const metadata: Metadata = {
  title: "What's next — Compass",
  robots: { index: false, follow: false },
};

export default async function PlannerPage() {
  const session = await requireSession("/planner");
  const data = await loadPlanner(session);

  return (
    <div className="space-y-5">
      <PlannerAgenda
        months={data.months}
        overdue={data.overdue}
        undated={data.undated}
        suggestions={data.suggestions}
        todayISO={data.todayISO}
      />
    </div>
  );
}
