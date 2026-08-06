import { cache } from "react";
import { getSession, type SessionProfile } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import type { FacultyValue } from "@/lib/data/faculties";
import { parseFieldsParam } from "@/lib/data/guide-fields";

// Server half of the guide's field filter (the pure half is
// lib/data/guide-fields.ts, which the client islands import).
//
// Everything a guide route needs about the reader is resolved here, once. That
// "once" is the point: the layout wants the session to pick a shell, the page
// wants it to label the filter, and the filter's default wants the student's
// fields — and each of those was its own `getSession()`, so a single page view
// cost three `auth.getUser()` round trips and three `profiles` reads before it
// drew anything. `cache()` collapses them to one per request; lib/dashboard/
// load.ts does the same for the report.

/** The reader, read once per request however many callers ask. */
export const guideSession = cache(
  async (): Promise<SessionProfile | null> => getSession(),
);

/**
 * The signed-in student's chosen fields, or `[]` for a guest. This is only ever
 * a DEFAULT: the guide never saves anything back to the profile, so a student
 * widening the guide is not editing their intake.
 */
export const studentFields = cache(async (): Promise<FacultyValue[]> => {
  const session = await guideSession();
  if (!session) return [];

  const supabase = createClient();
  const { data } = await supabase
    .from("student_profiles")
    .select("faculties")
    .eq("user_id", session.id)
    .maybeSingle();

  return Array.isArray(data?.faculties)
    ? (data!.faculties as FacultyValue[])
    : [];
});

export type GuideView = {
  signedIn: boolean;
  /**
   * What this request is actually looking at: the URL if it says anything, the
   * student's own fields if it does not. `[]` means "everything" — the guide's
   * version of the rule that runs through the whole product: an unknown or
   * empty answer widens, never empties.
   */
  fields: FacultyValue[];
  /**
   * What the links on this page should carry, which is NOT the resolved list:
   * when the URL said nothing we leave it saying nothing, so the student's own
   * fields keep being the default instead of being frozen into every href.
   */
  stated: FacultyValue[] | null;
  /** The chip control's fallback when the URL is silent. */
  defaults: FacultyValue[];
};

/** Everything a guide list page needs about the reader, in one await. */
export async function guideView(searchParams: {
  [key: string]: string | string[] | undefined;
}): Promise<GuideView> {
  const stated = parseFieldsParam(searchParams.f);
  const [session, defaults] = await Promise.all([
    guideSession(),
    studentFields(),
  ]);
  return {
    signedIn: Boolean(session),
    fields: stated ?? defaults,
    stated,
    defaults,
  };
}

/**
 * The stated filter alone — all a detail page needs, since it renders one
 * subject and only has to keep the filter alive in its links. Pure: no session,
 * no query.
 */
export function statedGuideFields(searchParams: {
  [key: string]: string | string[] | undefined;
}): FacultyValue[] | null {
  return parseFieldsParam(searchParams.f);
}
