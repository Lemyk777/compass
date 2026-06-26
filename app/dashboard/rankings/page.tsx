import { requireSession } from "@/lib/auth/session";
import { createAdminClient } from "@/lib/supabase/admin";
import { analysisSchema } from "@/lib/ai/schema";
import { facultyLabelKey } from "@/lib/data/faculties";
import { getT } from "@/lib/i18n/server";
import { RankingsView } from "@/components/dashboard/views/RankingsView";
import { orderFactors, type LeaderboardRow } from "@/lib/data/leaderboard";

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
    rows.push({
      userId,
      name,
      major,
      overall: Math.round(an.overall_score),
      // Carry the student's full factor set (3–7), country-agnostic. The view
      // renders whatever's here — no fixed columns. Scores shown as whole
      // numbers on the 0–10 rubric scale, like the Your-standing scorecard.
      factors: orderFactors(
        an.factors.map((f) => ({
          key: f.key,
          label: f.label,
          score: Math.round(f.score),
        }))
      ),
    });
  }
  rows.sort((a, b) => b.overall - a.overall);

  return <RankingsView rows={rows} currentUserId={session.id} />;
}
