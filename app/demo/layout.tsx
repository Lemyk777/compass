import { DashboardProvider } from "@/components/dashboard/DashboardContext";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { SAMPLE_ANALYSIS } from "@/lib/ai/sample";

export const metadata = { title: "Compass — Dashboard preview" };

// Public preview of the full dashboard using the §12 sample student — lets the
// design be seen without Supabase/Anthropic configured. Same shell + section
// pages as the real /dashboard, just fed sample data and read-only.
export default function DemoLayout({ children }: { children: React.ReactNode }) {
  return (
    <DashboardProvider
      initialAnalysis={SAMPLE_ANALYSIS}
      name="Aizhan"
      hasProfile
      basePath="/demo"
      canAnalyze={false}
      demo
    >
      <DashboardShell>{children}</DashboardShell>
    </DashboardProvider>
  );
}
