import { Suspense } from "react";
import { DemoDashboard } from "@/components/dashboard/DemoDashboard";

export const metadata = { title: "Compass — Dashboard preview" };

// Public preview of the full dashboard using the §12 sample student — lets the
// design be seen without Supabase/Anthropic configured. `?locked=1` previews the
// no-college-list (locked odds/costs) state. DemoDashboard reads searchParams,
// so it's wrapped in Suspense.
export default function DemoLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense>
      <DemoDashboard>{children}</DemoDashboard>
    </Suspense>
  );
}
