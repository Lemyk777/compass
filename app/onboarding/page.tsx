import { requireSession } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { Onboarding } from "@/components/onboarding/Onboarding";
import {
  emptyProfile,
  normalizeActivities,
  normalizeHonors,
  normalizeDestinations,
  normalizeFaculties,
  type StudentProfileInput,
} from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function OnboardingPage() {
  const session = await requireSession("/onboarding");
  const supabase = createClient();

  const [{ data: sp }, { count }, { data: prof, error: profErr }] =
    await Promise.all([
      supabase
        .from("student_profiles")
        .select("*")
        .eq("user_id", session.id)
        .maybeSingle(),
      supabase
        .from("analyses")
        .select("id", { count: "exact", head: true })
        .eq("user_id", session.id),
      // Attribution columns may not exist before migration 0006 — capture the
      // error and degrade gracefully (no survey) instead of crashing the page.
      supabase
        .from("profiles")
        .select("heard_from, heard_from_code")
        .eq("id", session.id)
        .maybeSingle(),
    ]);

  const heardFrom = (prof?.heard_from as string | null) ?? "";
  const heardFromCode = (prof?.heard_from_code as string | null) ?? "";
  // Show the "how did you hear about us?" step only to signups with no referral
  // attribution who haven't answered yet (and only once the columns exist).
  const showSurvey = !profErr && !session.referred_by && !heardFrom;

  let initial: StudentProfileInput | null = null;
  if (sp) {
    const base = emptyProfile();
    initial = {
      country: session.country ?? "",
      citizenship: sp.citizenship ?? "",
      // Country-first: derive from new columns, falling back to legacy rows.
      destinations: normalizeDestinations(sp.destinations, sp.include_italy),
      faculties: normalizeFaculties(sp.faculties),
      intended_major: sp.intended_major ?? "",
      graduation_year: (sp.graduation_year as number | null) ?? undefined,
      curriculum: sp.curriculum ?? "",
      grades: sp.grades ?? base.grades,
      tests: sp.tests ?? {},
      activities: normalizeActivities(sp.activities),
      honors: normalizeHonors(sp.honors),
      target_schools: sp.target_schools ?? [],
      needs_aid: sp.needs_aid ?? false,
      italy_programs: sp.italy_programs ?? [],
      italy_family_income: sp.italy_family_income ?? undefined,
      hk_programs: sp.hk_programs ?? [],
      hk_grade_status: sp.hk_grade_status ?? undefined,
      uae_programs: sp.uae_programs ?? [],
      uae_grade_status: sp.uae_grade_status ?? undefined,
      heard_from: heardFrom,
      heard_from_code: heardFromCode,
    };
  } else if (session.country) {
    initial = { ...emptyProfile(), country: session.country };
  }

  return (
    <Onboarding
      initial={initial}
      hasAnalysis={(count ?? 0) > 0}
      showSurvey={showSurvey}
      // Only first-timers (no saved profile) get localStorage draft-restore;
      // a returning editor must read their persisted profile, not a stale draft.
      hasSavedProfile={!!sp}
    />
  );
}
