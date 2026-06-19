import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { analyzeProfile, AnalyzeError } from "@/lib/ai/analyze";
import { emptyProfile, type StudentProfileInput } from "@/lib/types";

// FOUNDER: set a hard spend limit in the Anthropic console — code can rate-limit
// per user (below) and cap max_tokens, but the billing cap can only be set there.

// Streaming analysis can take a while on rich profiles; give it headroom so a
// large request finishes instead of being killed mid-flight (which returned a
// non-JSON error page the client couldn't parse).
export const maxDuration = 60;

const MAX_PER_HOUR = 5; // cost safety: max analyses / hour / user

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
    .select("country, referred_by")
    .eq("id", user.id)
    .maybeSingle();

  if (!sp || !sp.curriculum || !sp.target_schools?.length) {
    return NextResponse.json(
      { error: "Complete your profile first." },
      { status: 400 }
    );
  }

  const admin = createAdminClient();

  // Rate limit: count this user's analyses in the last hour.
  const sinceIso = new Date(Date.now() - 60 * 60 * 1000).toISOString();
  const { count } = await admin
    .from("analyses")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id)
    .gte("created_at", sinceIso);
  if ((count ?? 0) >= MAX_PER_HOUR) {
    return NextResponse.json(
      {
        error: `You've reached the limit of ${MAX_PER_HOUR} analyses per hour. Please try again later.`,
      },
      { status: 429 }
    );
  }

  const profile: StudentProfileInput = {
    ...emptyProfile(),
    country: prof?.country ?? "",
    curriculum: sp.curriculum,
    grades: sp.grades ?? { raw: "" },
    tests: sp.tests ?? {},
    activities: Array.isArray(sp.activities) ? sp.activities : [],
    target_schools: sp.target_schools ?? [],
    intended_major: sp.intended_major ?? "",
    citizenship: sp.citizenship ?? "",
    needs_aid: sp.needs_aid ?? false,
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
