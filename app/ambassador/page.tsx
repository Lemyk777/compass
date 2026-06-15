import { requireSession } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { AppHeader } from "@/components/ui/AppHeader";
import { AmbassadorClient } from "@/components/ambassador/AmbassadorClient";
import { AmbassadorPending } from "@/components/ambassador/AmbassadorPending";
import { Card } from "@/components/report/Section";

export const dynamic = "force-dynamic";

export default async function AmbassadorPage() {
  const session = await requireSession("/ambassador");
  const supabase = createClient();

  // RLS: a user can read only their own ambassadors row.
  const { data: amb } = await supabase
    .from("ambassadors")
    .select("code, country, status, signups")
    .eq("user_id", session.id)
    .maybeSingle();

  // Live signup count via SECURITY DEFINER function (doesn't expose rows).
  let liveSignups = amb?.signups ?? 0;
  if (amb?.code) {
    const { data: count } = await supabase.rpc("signup_count_for_code", {
      p_code: amb.code,
    });
    if (typeof count === "number") liveSignups = count;
  }

  return (
    <main className="min-h-dvh bg-surface">
      <AppHeader links={[{ href: "/dashboard", label: "Dashboard" }]} />
      <div className="mx-auto max-w-2xl px-5 py-6">
        {!amb ? (
          <AmbassadorPending />
        ) : (
          <div className="space-y-6">
            <div>
              <h1 className="text-2xl font-semibold tracking-tight text-ink">
                Your ambassador hub
              </h1>
              <p className="text-sm text-ink-soft">
                Share your link — every student who signs up through it counts
                toward you.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <Card className="flex flex-col justify-center text-center">
                <span data-num className="font-display text-5xl font-semibold text-accent">
                  {liveSignups}
                </span>
                <span className="mt-1 text-sm text-ink-soft">
                  {liveSignups === 1 ? "student signed up" : "students signed up"}
                </span>
              </Card>
              <Card className="flex flex-col justify-center text-center">
                <span className="font-display text-2xl font-semibold text-ink">
                  {amb.code}
                </span>
                <span className="mt-1 text-sm text-ink-soft">
                  Your code · {amb.country ?? "—"}
                </span>
                <span
                  className={`mx-auto mt-2 inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${
                    amb.status === "active"
                      ? "bg-likely-soft text-[#2C6B4D]"
                      : "bg-line text-ink-soft"
                  }`}
                >
                  {amb.status}
                </span>
              </Card>
            </div>

            <AmbassadorClient code={amb.code} />

            <p className="text-center text-xs text-ink-faint">
              Counts update as students sign up. Tier rewards are handled
              manually for now.
            </p>
          </div>
        )}
      </div>
    </main>
  );
}
