import { requireSession } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { DashboardProvider } from "@/components/dashboard/DashboardContext";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { analysisSchema, sanitizeAnalysis, type Analysis } from "@/lib/ai/schema";
import type { SatSitting, Competition } from "@/lib/data/key-dates";
import type { DestinationCode } from "@/lib/data/destinations";

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

  const [{ data: latest }, { data: sp }, { data: satRows }, { data: compRows }] = await Promise.all([
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
    // Live SAT dates from Supabase (populated by the cron scraper).
    // If the table doesn't exist yet (migration not applied), this returns null
    // and the Timeline falls back to hardcoded dates in key-dates.ts.
    supabase
      .from("sat_sittings")
      .select("test_date, reg_deadline")
      .order("test_date", { ascending: true }),
    supabase
      .from("competition_deadlines")
      .select("*")
      .order("deadline", { ascending: true }),
  ]);

  let analysis: Analysis | null = null;
  if (latest?.output) {
    const parsed = analysisSchema.safeParse(latest.output);
    if (parsed.success) analysis = sanitizeAnalysis(parsed.data);
  }

  // A profile is "ready to analyze" once the student has a curriculum and at
  // least one destination — target schools are NOT required anymore (admission
  // odds unlock later via the college list). Legacy rows with targets but no
  // `destinations` column still count.
  const hasProfile = Boolean(
    sp?.curriculum &&
      ((Array.isArray(sp.destinations) && sp.destinations.length > 0) ||
        sp.include_italy ||
        (sp.target_schools && sp.target_schools.length > 0) ||
        (sp.italy_programs && sp.italy_programs.length > 0) ||
        (sp.hk_programs && sp.hk_programs.length > 0))
  );

  // Build live dates from Supabase rows (empty arrays if table missing/empty).
  const liveSatSittings: SatSitting[] = (satRows ?? []).map((r: { test_date: string; reg_deadline: string }) => ({
    test: r.test_date,
    regDeadline: r.reg_deadline,
  }));

  const liveCompetitions: Competition[] = (compRows ?? []).map((r: Record<string, unknown>) => ({
    id: r.id as string,
    name: r.name as string,
    fields: r.fields as Competition["fields"],
    deadline: r.deadline as string,
    window: r.event_window as string,
    level: r.level as Competition["level"],
    url: r.url as string,
    blurb: r.blurb as string,
  }));

  return (
    <DashboardProvider
      initialAnalysis={analysis}
      name={session.full_name}
      hasProfile={hasProfile}
      isAdmin={session.role === "admin"}
      basePath="/dashboard"
      canAnalyze
      destinations={
        Array.isArray(sp?.destinations) ? (sp!.destinations as DestinationCode[]) : []
      }
      profileMeta={{
        graduationYear: (sp?.graduation_year as number | null) ?? undefined,
        faculties: Array.isArray(sp?.faculties) ? (sp!.faculties as string[]) : [],
        satScore: (sp?.tests as { SAT?: number } | null)?.SAT,
      }}
      liveDates={{
        satSittings: liveSatSittings,
        competitions: liveCompetitions,
      }}
    >
      <DashboardShell>{children}</DashboardShell>
    </DashboardProvider>
  );
}

