import { GuideSkeleton } from "@/components/guide/Skeleton";

// Scoped to the list, not to `/guide/places/[place]` below it — see the note in
// app/guide/(index)/loading.tsx.
export default function GuidePlacesLoading() {
  return <GuideSkeleton />;
}
