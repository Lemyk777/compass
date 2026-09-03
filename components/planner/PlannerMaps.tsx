import type { PlanPick } from "@/lib/data/plan-picks";
import type { Roadmap } from "@/lib/data/roadmap";
import { Link } from "@/components/ui/Link";
import { InteractiveRoadmap } from "@/components/roadmap/InteractiveRoadmap";

export function PlannerMaps({
  roadmap,
  picks,
}: {
  roadmap: Roadmap | null;
  picks: PlanPick[];
}) {
  if (!roadmap || roadmap.phases.length === 0) {
    return (
      <div className="rounded-3xl border border-dashed border-line/80 bg-card/60 p-8 text-center shadow-card">
        <p className="text-base font-bold text-ink">No strategic roadmap generated yet</p>
        <p className="mt-1 text-sm text-ink-soft max-w-md mx-auto leading-relaxed">
          Explore career tracks and select your target destinations to generate a personalized strategic milestone timeline.
        </p>
        <div className="mt-5">
          <Link
            href="/guide"
            className="inline-flex min-h-11 items-center rounded-xl bg-accent px-5 text-sm font-semibold text-on-fill shadow-sm hover:opacity-90 transition-opacity focus-visible:focus-ring"
          >
            Explore Guide
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <InteractiveRoadmap roadmap={roadmap} showExtraSections={true} />
    </div>
  );
}
