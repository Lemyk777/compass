import { GuideSkeleton } from "@/components/guide/Skeleton";

// Scoped to the list, not to `/guide/majors/[major]` below it — see the note in
// app/guide/(index)/loading.tsx. A boundary over the subject pages would turn
// an unknown id into a 200 carrying a "not found" page, which is the one status
// a crawler must not see for an address that does not exist.
export default function GuideMajorsLoading() {
  return <GuideSkeleton />;
}
