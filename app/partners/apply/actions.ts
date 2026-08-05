"use server";

// The public "list us as a partner" application.
//
// An application is just a `partners` row with status='pending': the same
// record that later becomes the live organisation, so approving it is a status
// change rather than a copy between tables, and nothing about the organisation
// has to be retyped by an admin.
//
// The applicant must be signed in. That is not friction for its own sake — the
// account IS the partner account, so applying while signed in is what lets an
// approval be a single click instead of an invite-and-attach flow. It also
// means we always know who to hold responsible for what gets posted.

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireSession } from "@/lib/auth/session";
import { createAdminClient } from "@/lib/supabase/admin";
import { getPartnerForUser } from "@/lib/partners/queries";
import { slugify } from "@/lib/data/partners";
import { normalizeCountry } from "@/lib/data/geo";

export type ApplyResult = { ok: true; id: string } | { ok: false; error: string };

const applySchema = z.object({
  name: z.string().trim().min(2).max(120),
  website: z.string().trim().max(200),
  country: z.string().trim().max(60),
  city: z.string().trim().max(60),
  contactEmail: z.string().trim().email().max(120),
  about: z.string().trim().min(20).max(600),
  note: z.string().trim().max(600),
});

export type ApplyInput = z.infer<typeof applySchema>;

export async function applyAsPartner(input: ApplyInput): Promise<ApplyResult> {
  const session = await requireSession("/partners/apply");

  // One organisation per account. A second application from the same account
  // would orphan the first, and the row is the application.
  const existing = await getPartnerForUser(session.id);
  if (existing) {
    return {
      ok: false,
      error:
        existing.status === "pending"
          ? "You already have an application under review."
          : "This account is already linked to a partner organisation.",
    };
  }

  const parsed = applySchema.safeParse(input);
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    return { ok: false, error: issue?.message ?? "Check the form and try again." };
  }
  const data = parsed.data;

  if (data.website && !/^https?:\/\//i.test(data.website)) {
    return { ok: false, error: "The website needs to start with https://" };
  }

  const admin = createAdminClient();
  const id = await uniqueSlug(data.name);

  const { error } = await admin.from("partners").insert({
    id,
    name: data.name,
    user_id: session.id,
    website: data.website || null,
    // Free text in, ISO-2 out — the same normalizer the student intake uses, so
    // "Астана, Казахстан" and "KZ" land on the same code that gates local
    // opportunities. Unrecognised → null, and an admin sets it at review.
    country: normalizeCountry(data.country),
    city: data.city || null,
    contact_email: data.contactEmail,
    about: data.about,
    applied_note: data.note,
    status: "pending",
  });

  if (error) {
    console.error("[partners] application failed:", error);
    return { ok: false, error: "Could not send that application. Try again in a moment." };
  }

  revalidatePath("/admin/partners");
  revalidatePath("/partner");
  return { ok: true, id };
}

async function uniqueSlug(name: string): Promise<string> {
  const admin = createAdminClient();
  const base = slugify(name) || "partner";
  for (let n = 1; n < 50; n++) {
    const candidate = n === 1 ? base : `${base}-${n}`;
    const { data } = await admin
      .from("partners")
      .select("id")
      .eq("id", candidate)
      .maybeSingle();
    if (!data) return candidate;
  }
  return `${base}-${Date.now().toString(36)}`;
}
