import type { Metadata } from "next";
import { requireSession } from "@/lib/auth/session";
import { loadPlanner } from "@/lib/planner/load";
import { PlannerBoard } from "@/components/planner/PlannerBoard";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Your board — Compass",
  robots: { index: false, follow: false },
};

export default async function PlannerBoardPage() {
  const session = await requireSession("/planner/board");
  const data = await loadPlanner(session);

  return (
    <div className="space-y-5">
      <PlannerBoard
        columns={data.columns}
        droppedCount={data.droppedCount}
        suggestions={data.suggestions}
      />
    </div>
  );
}
