import { Suspense } from "react";
import { Overview } from "@/components/dashboard/views/Overview";

export const dynamic = "force-dynamic";

export default function DashboardPage() {
  // Overview reads ?analyze=1 via useSearchParams, so wrap in Suspense.
  return (
    <Suspense>
      <Overview />
    </Suspense>
  );
}
