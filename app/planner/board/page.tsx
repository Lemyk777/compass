import type { Metadata } from "next";
import { requireSession } from "@/lib/auth/session";
import { loadPlanner } from "@/lib/planner/load";
import { plannerSection } from "@/lib/data/planner-sections";
import { PlannerBoard } from "@/components/planner/PlannerBoard";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Your board — Compass",
  robots: { index: false, follow: false },
};

export default async function PlannerBoardPage() {
  const session = await requireSession("/planner/board");
  const data = await loadPlanner(session);
  const section = plannerSection("board");

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-ink">
          {section.title}
        </h1>
        <p className="mt-1 max-w-[60ch] text-sm leading-relaxed text-ink-soft">
          {section.blurb}
        </p>
      </div>
      <PlannerBoard
        columns={data.columns}
        droppedCount={data.droppedCount}
        suggestions={data.suggestions}
      />
    </div>
  );
}
