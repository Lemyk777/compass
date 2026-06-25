import { requireSession } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { DashboardProvider } from "@/components/dashboard/DashboardContext";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { analysisSchema, sanitizeAnalysis, type Analysis } from "@/lib/ai/schema";

export const dynamic = "force-dynamic";

// Persistent dashboard frame. Fetches the analysis once here; the sidebar and
// every section page (overview, standing, odds, …) read it from the shared
// context, so navigating between pages never refetches or loses state.
export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await requireSession("/dashboard");
  const supabase = createClient();

  const [{ data: latest }, { data: sp }] = await Promise.all([
    supabase
      .from("analyses")
      .select("output")
      .eq("user_id", session.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    // Select * so a DB missing newer columns still returns the row (see the
    // note that used to live in app/dashboard/page.tsx).
    supabase
      .from("student_profiles")
      .select("*")
      .eq("user_id", session.id)
      .maybeSingle(),
  ]);

  let analysis: Analysis | null = null;
  if (latest?.output) {
    const parsed = analysisSchema.safeParse(latest.output);
    if (parsed.success) analysis = sanitizeAnalysis(parsed.data);
  }

  const hasProfile = Boolean(
    sp?.curriculum &&
      ((sp.target_schools && sp.target_schools.length > 0) ||
        (sp.italy_programs && sp.italy_programs.length > 0) ||
        (sp.hk_programs && sp.hk_programs.length > 0))
  );

  return (
    <DashboardProvider
      initialAnalysis={analysis}
      name={session.full_name}
      hasProfile={hasProfile}
      isAdmin={session.role === "admin"}
      basePath="/dashboard"
      canAnalyze
    >
      <DashboardShell>{children}</DashboardShell>
    </DashboardProvider>
  );
}
