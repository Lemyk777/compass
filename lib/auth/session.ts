import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type Role = "student" | "ambassador" | "admin";

export type SessionProfile = {
  id: string;
  email: string | null;
  role: Role;
  full_name: string | null;
  country: string | null;
  referred_by: string | null;
};

/** Returns the current user + profile, or null if signed out. */
export async function getSession(): Promise<SessionProfile | null> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, full_name, country, referred_by")
    .eq("id", user.id)
    .maybeSingle();

  return {
    id: user.id,
    email: user.email ?? null,
    role: (profile?.role as Role) ?? "student",
    full_name: profile?.full_name ?? null,
    country: profile?.country ?? null,
    referred_by: profile?.referred_by ?? null,
  };
}

/** Redirects to login if signed out; otherwise returns the session. */
export async function requireSession(next = "/dashboard"): Promise<SessionProfile> {
  const session = await getSession();
  if (!session) {
    redirect(`/auth/login?next=${encodeURIComponent(next)}`);
  }
  return session;
}
