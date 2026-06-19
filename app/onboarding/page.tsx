import { requireSession } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { Onboarding } from "@/components/onboarding/Onboarding";
import {
  emptyProfile,
  normalizeActivities,
  normalizeHonors,
  type StudentProfileInput,
} from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function OnboardingPage() {
  const session = await requireSession("/onboarding");
  const supabase = createClient();

  const [{ data: sp }, { count }] = await Promise.all([
    supabase
      .from("student_profiles")
      .select("*")
      .eq("user_id", session.id)
      .maybeSingle(),
    supabase
      .from("analyses")
      .select("id", { count: "exact", head: true })
      .eq("user_id", session.id),
  ]);

  let initial: StudentProfileInput | null = null;
  if (sp) {
    const base = emptyProfile();
    initial = {
      country: session.country ?? "",
      curriculum: sp.curriculum ?? "",
      grades: sp.grades ?? base.grades,
      tests: sp.tests ?? {},
      activities: normalizeActivities(sp.activities),
      honors: normalizeHonors(sp.honors),
      target_schools: sp.target_schools ?? [],
      intended_major: sp.intended_major ?? "",
      citizenship: sp.citizenship ?? "",
      needs_aid: sp.needs_aid ?? false,
      // Italy module (gracefully defaults for pre-migration rows)
      include_italy: sp.include_italy ?? false,
      italy_programs: sp.italy_programs ?? [],
      italy_family_income: sp.italy_family_income ?? undefined,
    };
  } else if (session.country) {
    initial = { ...emptyProfile(), country: session.country };
  }

  return <Onboarding initial={initial} hasAnalysis={(count ?? 0) > 0} />;
}
