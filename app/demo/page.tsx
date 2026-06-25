import { Suspense } from "react";
import { Overview } from "@/components/dashboard/views/Overview";

export default function DemoPage() {
  return (
    <Suspense>
      <Overview />
    </Suspense>
  );
}
