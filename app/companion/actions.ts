"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { isBeatReaction, isKnownBeat } from "@/lib/data/beats";
import type { SaveResult } from "@/app/dashboard/actions";

// The one write the companion makes.
//
// Every bound is enforced HERE and not only in the component: a server action is
// a public HTTP endpoint and the form is a convenience. Both validators come
// from the registry itself, so a string that is not a beat cannot reach the
// table under any circumstances — which is also why they live in `beats.ts` and
// not in this file, since a `"use server"` module cannot be imported by a test.
//
// NOTE the module rule: everything exported from a "use server" file must be an
// async function. A non-function export crashes the PRODUCTION build only, as
// an opaque "Server Components render" digest that looks like anything but what
// it is.

export async function recordReaction(input: {
  beatId: string;
  reaction: string;
}): Promise<SaveResult> {
  if (!isKnownBeat(input.beatId)) return { ok: false, error: "Unknown item." };
  if (!isBeatReaction(input.reaction)) {
    return { ok: false, error: "Unknown answer." };
  }

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Please log in again." };

  // Reacting to the same beat twice is a correction, not a second fact — the
  // unique (user_id, beat_id) in 0031 is what makes this idempotent.
  const { error } = await supabase.from("beat_reactions").upsert(
    {
      user_id: user.id,
      beat_id: input.beatId,
      reaction: input.reaction,
    },
    { onConflict: "user_id,beat_id" },
  );

  if (error) {
    // Name the migration. An opaque failure sends the reader looking for a code
    // bug that is not there — that is the profiles.full_name incident, and the
    // pinned checkbox already does this for 0027.
    const missingTable = error.code === "42P01";
    return {
      ok: false,
      error: missingTable
        ? "Migration 0031_beat_reactions.sql has not been applied yet."
        : "Could not save that. Try again.",
    };
  }

  // The companion is in the layout, so the whole tree re-reads the thread — the
  // station, the observation and the move all change together, which is the
  // point: a student who just answered must see the answer land.
  try {
    revalidatePath("/", "layout");
  } catch {
    // ignore cache revalidation errors
  }
  return { ok: true };
}
