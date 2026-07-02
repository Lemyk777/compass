import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { analyzeProfile, AnalyzeError } from "@/lib/ai/analyze";
import {
  emptyProfile,
  normalizeActivities,
  normalizeHonors,
  normalizeDestinations,
  normalizeFaculties,
  type StudentProfileInput,
} from "@/lib/types";

// FOUNDER: set a hard spend limit in the Anthropic console — code can rate-limit
// per user (below) and cap max_tokens, but the billing cap can only be set there.

// Streaming analysis can take a while on rich profiles; give it headroom so a
// large request finishes instead of being killed mid-flight (which returned a
// non-JSON "took too long" error the client couldn't parse). 300s is the Vercel
// Pro/Enterprise max; on Hobby this is automatically clamped to that plan's 60s
// ceiling (harmless) — but on Hobby a slow generation + a retry can still pass
// 60s, so the durable fix on Hobby is upgrading the plan or an async job.
export const maxDuration = 300;

const MAX_PER_DAY = 2; // cost safety: max analyses / day / user (admins exempt)

export async function POST(_req: NextRequest) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Please log in." }, { status: 401 });
  }

  // Load the student's profile (RLS: own row only).
  const { data: sp } = await supabase
    .from("student_profiles")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle();
  const { data: prof } = await supabase
    .from("profiles")
    .select("country, referred_by, role")
    .eq("id", user.id)
    .maybeSingle();

  const destinations = normalizeDestinations(sp?.destinations, sp?.include_italy);

  // Target schools/programs are NO LONGER required to analyze. The standing
  // (factors, scorecard, gaps, timeline, summary) is produced from the student's
  // own data; per-school admission odds simply stay empty until the student adds
  // a college list. We only need a curriculum and at least one destination.
  if (!sp || !sp.curriculum || destinations.length === 0) {
    return NextResponse.json(
      { error: "Complete your profile first." },
      { status: 400 }
    );
  }

  const admin = createAdminClient();

  // Rate limit: cap analyses per rolling 24h per user. Admins (founder/staff)
  // are exempt so they can re-run freely while testing. Role is read from the
  // user's own profile row (RLS: own row only), so it can't be spoofed.
  if (prof?.role !== "admin") {
    const sinceIso = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const { count } = await admin
      .from("analyses")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id)
      .gte("created_at", sinceIso);
    if ((count ?? 0) >= MAX_PER_DAY) {
      return NextResponse.json(
        {
          error: `You've reached the limit of ${MAX_PER_DAY} analyses per day. Please try again tomorrow.`,
        },
        { status: 429 }
      );
    }
  }

  const profile: StudentProfileInput = {
    ...emptyProfile(),
    country: prof?.country ?? "",
    citizenship: sp.citizenship ?? "",
    destinations,
    faculties: normalizeFaculties(sp.faculties),
    intended_major: sp.intended_major ?? "",
    graduation_year: (sp.graduation_year as number | null) ?? undefined,
    school_years: (sp.school_years as number | null) ?? undefined,
    curriculum: sp.curriculum,
    grades: sp.grades ?? { raw: "" },
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
    kr_programs: sp.kr_programs ?? [],
    kr_grade_status: sp.kr_grade_status ?? undefined,
    kr_topik_level: (sp.kr_topik_level as number | null) ?? undefined,
  };

  try {
    const { analysis, usage } = await analyzeProfile(profile);

    // Persist the run (service role: reliable insert + event log).
    const { data: inserted, error: insErr } = await admin
      .from("analyses")
      .insert({
        user_id: user.id,
        input_snapshot: profile,
        output: analysis,
      })
      .select("id")
      .single();
    if (insErr) {
      console.error("Failed to store analysis", insErr);
    }

    // Best-effort: record token usage for the admin cost dashboard. Decoupled
    // from the insert above so a missing `usage` column (migration 0007 not yet
    // applied) can never block storing the analysis itself.
    if (inserted?.id) {
      const { error: usageErr } = await admin
        .from("analyses")
        .update({ usage })
        .eq("id", inserted.id);
      if (usageErr) console.error("Failed to store analysis usage", usageErr);
    }

    await admin.from("events").insert({
      user_id: user.id,
      type: "analysis_run",
      ref_code: prof?.referred_by ?? null,
    });

    return NextResponse.json({ id: inserted?.id ?? null, analysis, usage });
  } catch (e) {
    const message =
      e instanceof AnalyzeError
        ? e.message
        : "Something went wrong running your analysis.";
    console.error("analyze error", e);
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
