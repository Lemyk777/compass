import { requireSession } from "@/lib/auth/session";
import { DashboardProvider } from "@/components/dashboard/DashboardContext";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { loadStudentContext } from "@/lib/dashboard/load";

export const dynamic = "force-dynamic";

// The REPORT frame. Once this was the whole product; now it is the opt-in
// analysis half, reached from Opportunities rather than containing it. Fetches
// everything once here (see lib/dashboard/load.ts — the same loader feeds the
// standalone Opportunities section) so navigating between report pages never
// refetches or loses state.
export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await requireSession("/dashboard");
  const ctx = await loadStudentContext(session);

  return (
    <DashboardProvider
      initialAnalysis={ctx.analysis}
      name={session.full_name}
      hasProfile={ctx.hasProfile}
      isAdmin={session.role === "admin"}
      basePath="/dashboard"
      canAnalyze
      destinations={ctx.destinations}
      profileMeta={ctx.profileMeta}
      readiness={ctx.readiness}
      liveDates={ctx.liveDates}
      intents={ctx.intents}
    >
      <DashboardShell>{children}</DashboardShell>
    </DashboardProvider>
  );
}
