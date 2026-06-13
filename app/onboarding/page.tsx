import { requireSession } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { Onboarding } from "@/components/onboarding/Onboarding";
import { emptyProfile, type StudentProfileInput } from "@/lib/types";

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
      activities:
        Array.isArray(sp.activities) && sp.activities.length
          ? sp.activities
          : base.activities,
      target_schools: sp.target_schools ?? [],
      intended_major: sp.intended_major ?? "",
      citizenship: sp.citizenship ?? "",
      needs_aid: sp.needs_aid ?? false,
    };
  } else if (session.country) {
    initial = { ...emptyProfile(), country: session.country };
  }

  return <Onboarding initial={initial} hasAnalysis={(count ?? 0) > 0} />;
}
