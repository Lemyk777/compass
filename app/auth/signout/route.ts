import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient();
    await supabase.auth.signOut();
  } catch (e) {
    // Never let sign-out hard-fail; clearing the session is best-effort.
    console.error("signOut failed", e);
  }
  return NextResponse.redirect(new URL("/", request.nextUrl.origin), {
    status: 303,
  });
}
