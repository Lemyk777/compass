"use server";

// Admin review of partner organisations.
//
// This is the ONLY place trust is granted, and it is granted once per
// organisation rather than once per post:
//
//   approve  → the account can publish, instantly, from now on
//   verify   → the tick. It claims exactly one thing: we confirmed this
//              account belongs to that organisation. Check it against
//              something the organisation controls (an email on their domain,
//              a link to Compass from their own site, a message from the
//              account listed on it) — never against how well-known they are.
//   suspend  → the account keeps its data, and everything it posted vanishes
//              from every student surface on the next read.
//
// Approving also sets profiles.role = 'partner', which is a privilege change,
// so it happens here with the service role and nowhere else. `role` is not
// client-writable (migration 0008).

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth/session";
import { createAdminClient } from "@/lib/supabase/admin";
import { getPartnerForUser } from "@/lib/partners/queries";
import { normalizeCountry } from "@/lib/data/geo";

export type AdminPartnerResult = { ok: true } | { ok: false; error: string };

function revalidateAll(id: string): void {
  revalidatePath("/admin/partners");
  revalidatePath("/partner");
  revalidatePath("/partners");
  revalidatePath(`/partners/${id}`);
  revalidatePath("/opportunities");
  revalidatePath("/dashboard/opportunities");
}

/** Approve the application: the organisation is listed and can post. */
export async function approvePartner(id: string, note = ""): Promise<AdminPartnerResult> {
  await requireRole("admin", "/admin/partners");
  const admin = createAdminClient();

  const { data: row, error: readErr } = await admin
    .from("partners")
    .select("id, user_id")
    .eq("id", id)
    .maybeSingle();
  if (readErr || !row) return { ok: false, error: "No such partner." };

  const { error } = await admin
    .from("partners")
    .update({
      status: "active",
      review_note: note,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);
  if (error) return { ok: false, error: "Could not approve that application." };

  // The role is what routes them to the console and off the student product.
  if (row.user_id) await setRole(row.user_id as string, "partner");

  revalidateAll(id);
  return { ok: true };
}

/**
 * Set or clear the verification tick. Separate from approval on purpose: an
 * organisation can be listed and posting while we are still confirming that
 * the person holding the account really speaks for it. An unverified partner
 * renders its name with no tick — never a lesser tick.
 */
export async function setPartnerVerified(
  id: string,
  verified: boolean
): Promise<AdminPartnerResult> {
  const session = await requireRole("admin", "/admin/partners");
  const admin = createAdminClient();

  const { error } = await admin
    .from("partners")
    .update({
      verified_at: verified ? new Date().toISOString() : null,
      verified_by: verified ? session.id : null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);
  if (error) return { ok: false, error: "Could not change verification." };

  revalidateAll(id);
  return { ok: true };
}

/** Decline an application. The account goes back to being a normal student. */
export async function rejectPartner(id: string, note = ""): Promise<AdminPartnerResult> {
  await requireRole("admin", "/admin/partners");
  const admin = createAdminClient();

  const { data: row } = await admin
    .from("partners")
    .select("user_id")
    .eq("id", id)
    .maybeSingle();

  const { error } = await admin
    .from("partners")
    .update({
      status: "rejected",
      verified_at: null,
      review_note: note,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);
  if (error) return { ok: false, error: "Could not reject that application." };

  if (row?.user_id) await setRole(row.user_id as string, "student");

  revalidateAll(id);
  return { ok: true };
}

/**
 * The kill switch. Everything this organisation posted stops being served —
 * not by editing each row, but because a post whose partner is not active is
 * dropped in lib/partners/live.ts. Reversible: reactivating brings the same
 * posts back.
 */
export async function suspendPartner(id: string, note = ""): Promise<AdminPartnerResult> {
  await requireRole("admin", "/admin/partners");
  const admin = createAdminClient();

  const { error } = await admin
    .from("partners")
    .update({
      status: "suspended",
      review_note: note,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);
  if (error) return { ok: false, error: "Could not suspend that partner." };

  revalidateAll(id);
  return { ok: true };
}

export async function reactivatePartner(id: string): Promise<AdminPartnerResult> {
  await requireRole("admin", "/admin/partners");
  const admin = createAdminClient();

  const { data: row } = await admin
    .from("partners")
    .select("user_id")
    .eq("id", id)
    .maybeSingle();

  const { error } = await admin
    .from("partners")
    .update({ status: "active", updated_at: new Date().toISOString() })
    .eq("id", id);
  if (error) return { ok: false, error: "Could not reactivate that partner." };

  if (row?.user_id) await setRole(row.user_id as string, "partner");

  revalidateAll(id);
  return { ok: true };
}

/**
 * Fix up the things an applicant cannot set themselves: the display name the
 * tick vouches for, the country that gates their local posts, and the logo.
 */
export async function adminUpdatePartner(
  id: string,
  input: { name: string; country: string; city: string; logoUrl: string }
): Promise<AdminPartnerResult> {
  await requireRole("admin", "/admin/partners");
  const admin = createAdminClient();

  const name = input.name.trim().slice(0, 120);
  if (name.length < 2) return { ok: false, error: "The name is too short." };
  const logoUrl = input.logoUrl.trim().slice(0, 300);
  if (logoUrl && !/^(https:\/\/|\/)/.test(logoUrl)) {
    return { ok: false, error: "The logo needs to be an https:// link or a /public path." };
  }

  const { error } = await admin
    .from("partners")
    .update({
      name,
      country: normalizeCountry(input.country),
      city: input.city.trim().slice(0, 60) || null,
      logo_url: logoUrl || null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);
  if (error) return { ok: false, error: "Could not save that." };

  revalidateAll(id);
  return { ok: true };
}

/** Take down (or restore) a single partner post without touching the account. */
export async function adminSetPostPublished(
  postId: string,
  published: boolean
): Promise<AdminPartnerResult> {
  await requireRole("admin", "/admin/partners");
  const admin = createAdminClient();

  const { error } = await admin
    .from("competition_deadlines")
    .update({ published, updated_at: new Date().toISOString() })
    .eq("id", postId);
  if (error) return { ok: false, error: "Could not change that post." };

  revalidatePath("/admin/partners");
  revalidatePath("/opportunities");
  revalidatePath("/dashboard/opportunities");
  return { ok: true };
}

/**
 * Link an existing account to a partner row by email — the escape hatch for an
 * organisation whose application came from the wrong address, or one an admin
 * created directly.
 */
export async function attachPartnerAccount(
  id: string,
  email: string
): Promise<AdminPartnerResult> {
  await requireRole("admin", "/admin/partners");
  const admin = createAdminClient();

  const wanted = email.trim().toLowerCase();
  if (!wanted) return { ok: false, error: "Enter the account's email." };

  // No admin "get user by email" in the JS SDK — page through the list. Fine
  // at our scale, and this runs once per partner, by hand.
  let userId: string | null = null;
  for (let page = 1; page <= 20 && !userId; page++) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 200 });
    if (error) break;
    const users = data?.users ?? [];
    userId = users.find((u) => (u.email ?? "").toLowerCase() === wanted)?.id ?? null;
    if (users.length < 200) break;
  }
  if (!userId) return { ok: false, error: "No account with that email has signed up yet." };

  const existing = await getPartnerForUser(userId);
  if (existing && existing.id !== id) {
    return { ok: false, error: `That account already posts as ${existing.name}.` };
  }

  const { error } = await admin
    .from("partners")
    .update({ user_id: userId, updated_at: new Date().toISOString() })
    .eq("id", id);
  if (error) return { ok: false, error: "Could not link that account." };

  revalidateAll(id);
  return { ok: true };
}

async function setRole(userId: string, role: "partner" | "student"): Promise<void> {
  try {
    const admin = createAdminClient();
    await admin.from("profiles").update({ role }).eq("id", userId);
  } catch (e) {
    console.error("[partners] role change failed:", e);
  }
}
