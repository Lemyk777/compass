// The old "Timeline" and "Action plan" views are merged into one runway-aware
// Roadmap. This route is kept as an alias so existing links keep working.
import { RoadmapView } from "@/components/dashboard/views/RoadmapView";

export const dynamic = "force-dynamic";

export default function Page() {
  return <RoadmapView />;
}
