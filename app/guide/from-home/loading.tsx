import { GuideSkeleton } from "@/components/guide/Skeleton";

// No dynamic child under this step, so the file can sit here directly — see the
// note in app/guide/(index)/loading.tsx.
export default function GuideFromHomeLoading() {
  return <GuideSkeleton />;
}
