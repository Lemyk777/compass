import { GuideSkeleton } from "@/components/guide/Skeleton";

// Scoped to the list, not to `/guide/work/[area]` below it — see the note in
// app/guide/(index)/loading.tsx for what a section-wide boundary cost.
export default function GuideWorkLoading() {
  return <GuideSkeleton />;
}
