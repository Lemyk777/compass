import { requireSession } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { DashboardClient } from "@/components/dashboard/DashboardClient";
import { analysisSchema, sanitizeAnalysis, type Analysis } from "@/lib/ai/schema";

export const dynamic = "force-dynamic";

export default async function DashboardPage({
  searchParams,
}: {
  searchParams?: { analyze?: string };
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
    supabase
      .from("student_profiles")
      .select("curriculum, target_schools, italy_programs, hk_programs")
      .eq("user_id", session.id)
      .maybeSingle(),
  ]);

  // Parse the stored analysis defensively — never crash on a bad row.
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
    <DashboardClient
      initialAnalysis={analysis}
      name={session.full_name}
      hasProfile={hasProfile}
      autoAnalyze={searchParams?.analyze === "1"}
    />
  );
}
