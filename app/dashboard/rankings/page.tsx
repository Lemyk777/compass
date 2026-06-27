import { requireSession } from "@/lib/auth/session";
import { createAdminClient } from "@/lib/supabase/admin";
import { analysisSchema } from "@/lib/ai/schema";
import { facultyLabelKey } from "@/lib/data/faculties";
import { getT } from "@/lib/i18n/server";
import { RankingsView } from "@/components/dashboard/views/RankingsView";
import {
  orderFactors,
  italyFactors,
  hkFactors,
  type CountryCode,
  type LeaderboardRow,
} from "@/lib/data/leaderboard";
import { countryOverall } from "@/lib/data/country-scorecard";

export const dynamic = "force-dynamic";

// A readable display name from the auth email when a student didn't set one.
function nameFromEmail(email?: string | null): string | null {
  if (!email) return null;
  const local = email.split("@")[0];
  if (!local) return null;
  return local
    .replace(/[._-]+/g, " ")
    .split(" ")
    .filter(Boolean)
    .map((w) => w[0].toUpperCase() + w.slice(1))
    .join(" ");
}

export default async function RankingsPage() {
  const session = await requireSession("/dashboard/rankings");
  const t = getT();

  // Leaderboard spans every user, so it must bypass RLS — read with the
  // service role on the server and pass only the display fields to the client.
  const admin = createAdminClient();
  const [{ data: analyses }, { data: profiles }, { data: sps }, usersRes] =
    await Promise.all([
      admin.from("analyses").select("user_id, output, created_at").order("created_at", { ascending: false }),
      admin.from("profiles").select("id, full_name"),
      admin.from("student_profiles").select("user_id, faculties, intended_major"),
      admin.auth.admin.listUsers({ perPage: 1000 }),
    ]);

  const nameById = new Map((profiles ?? []).map((p) => [p.id, p.full_name as string | null]));
  const emailById = new Map((usersRes?.data?.users ?? []).map((u) => [u.id, u.email]));
  const spById = new Map((sps ?? []).map((s) => [s.user_id as string, s]));

  // Latest analysis per user (already ordered newest-first).
  const seen = new Set<string>();
  const rows: LeaderboardRow[] = [];
  for (const a of analyses ?? []) {
    const userId = a.user_id as string;
    if (seen.has(userId)) continue;
    const parsed = analysisSchema.safeParse(a.output);
    if (!parsed.success) continue;
    seen.add(userId);
    const an = parsed.data;
    const sp = spById.get(userId);
    const facultyKey = sp?.faculties?.[0] ? facultyLabelKey(sp.faculties[0]) : undefined;
    const major =
      (sp?.intended_major as string | undefined)?.trim() ||
      (facultyKey ? t(facultyKey) : "—");
    const name =
      nameById.get(userId)?.trim() ||
      nameFromEmail(emailById.get(userId)) ||
      "Student";
    // Destination cohorts, derived from the analysis content: US school
    // likelihoods, Italy programs, and HK programs are each only present when
    // the student targeted that country. Drives the per-country mini-sections.
    const countries: CountryCode[] = [];
    if (an.schools.length > 0) countries.push("US");
    if (an.italy_programs?.length) countries.push("IT");
    if (an.hk_programs?.length) countries.push("HK");
    // Default (US) breakdown: the student's profile factors on the 0–10 rubric
    // scale, like the Your-standing scorecard.
    const profileFactors = orderFactors(
      an.factors.map((f) => ({
        key: f.key,
        label: f.label,
        score: Math.round(f.score),
      }))
    );
    // Each board ranks by and shows that COUNTRY'S OWN overall + a country-
    // native breakdown. The overall is the same country-weighted score the
    // dashboard scorecard shows (countryOverall) — score-based for Italy, grades-
    // first for HK — so a student's Italy rank can differ from their US rank.
    // Italy's breakdown is derived from its program analyses; HK re-weights the
    // profile factors the grades-first way HK admissions actually reads them.
    const factorsByCountry: LeaderboardRow["factorsByCountry"] = {};
    const overallByCountry: LeaderboardRow["overallByCountry"] = {};
    if (an.italy_programs?.length) {
      factorsByCountry.IT = orderFactors(
        italyFactors(an.italy_programs, an.italy_financial_fit_score)
      );
      overallByCountry.IT = countryOverall(
        "IT",
        an.factors,
        an.italy_financial_fit_score
      );
    }
    if (an.hk_programs?.length) {
      factorsByCountry.HK = orderFactors(hkFactors(profileFactors));
      overallByCountry.HK = countryOverall("HK", an.factors);
    }
    rows.push({
      userId,
      name,
      major,
      overall: Math.round(an.overall_score),
      countries,
      factors: profileFactors,
      factorsByCountry: Object.keys(factorsByCountry).length
        ? factorsByCountry
        : undefined,
      overallByCountry: Object.keys(overallByCountry).length
        ? overallByCountry
        : undefined,
    });
  }
  rows.sort((a, b) => b.overall - a.overall);

  return <RankingsView rows={rows} currentUserId={session.id} />;
}
