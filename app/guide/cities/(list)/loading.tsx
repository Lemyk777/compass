import { GuideSkeleton } from "@/components/guide/Skeleton";

// Scoped to the list, not to `/guide/cities/[hub]` below it — see the note in
// app/guide/(index)/loading.tsx.
export default function GuideCitiesLoading() {
  return <GuideSkeleton />;
}
