"use client";

import { useSearchParams } from "next/navigation";
import { DashboardProvider } from "@/components/dashboard/DashboardContext";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { SAMPLE_ANALYSIS } from "@/lib/ai/sample";

// Demo wrapper. `?locked=1` strips the school/program data so the locked
// Admission-odds / Application-costs states (the no-college-list flow) can be
// previewed without auth; otherwise the full sample dashboard is shown.
export function DemoDashboard({ children }: { children: React.ReactNode }) {
  const locked = useSearchParams().get("locked") === "1";
  const analysis = locked
    ? {
        ...SAMPLE_ANALYSIS,
        schools: [],
        recommended_schools: [],
        benchmarks: [],
        italy_programs: [],
        hk_programs: [],
      }
    : SAMPLE_ANALYSIS;

  return (
    <DashboardProvider
      initialAnalysis={analysis}
      name="Aizhan"
      hasProfile
      basePath="/demo"
      canAnalyze={false}
      demo
      profileMeta={{
        graduationYear: new Date().getFullYear() + 1,
        faculties: ["computer_science", "business_economics"],
        satScore: 1480,
      }}
    >
      <DashboardShell>{children}</DashboardShell>
    </DashboardProvider>
  );
}
