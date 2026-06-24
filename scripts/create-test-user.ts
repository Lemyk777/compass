// One-off: create (or reset) a pre-confirmed test account so you can log in on
// localhost without the email-confirmation step.
//
//   npm run create:test-user
//
// Override defaults with env vars, e.g.:
//   TEST_EMAIL=foo@bar.com TEST_PASSWORD=secret123 TEST_ROLE=admin npm run create:test-user
//
// Roles: "student" lands on /onboarding (the questionnaire), "admin" → /admin,
// "ambassador" → /ambassador.

import { createClient, type User } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !key) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local");
  process.exit(1);
}

const EMAIL = process.env.TEST_EMAIL ?? "test@compass.dev";
const PASSWORD = process.env.TEST_PASSWORD ?? "compass1234";
const ROLE = process.env.TEST_ROLE ?? "student";
const NAME = process.env.TEST_NAME ?? "Test User";

const admin = createClient(url, key, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function findUserByEmail(email: string): Promise<User | null> {
  for (let page = 1; page <= 20; page++) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 200 });
    if (error) throw error;
    const match = data.users.find((u) => u.email?.toLowerCase() === email.toLowerCase());
    if (match) return match;
    if (data.users.length < 200) break;
  }
  return null;
}

async function main() {
  let user = await findUserByEmail(EMAIL);

  if (user) {
    const { error } = await admin.auth.admin.updateUserById(user.id, {
      password: PASSWORD,
      email_confirm: true,
    });
    if (error) throw error;
    console.log(`↻ Reset existing user ${EMAIL} (password + email confirmed)`);
  } else {
    const { data, error } = await admin.auth.admin.createUser({
      email: EMAIL,
      password: PASSWORD,
      email_confirm: true,
      user_metadata: { full_name: NAME },
    });
    if (error) throw error;
    user = data.user;
    console.log(`✓ Created user ${EMAIL}`);
  }

  const { error: pErr } = await admin
    .from("profiles")
    .upsert({ id: user.id, role: ROLE, full_name: NAME }, { onConflict: "id" });
  if (pErr) console.error("⚠ profiles upsert failed:", pErr.message);
  else console.log(`✓ profiles.role = ${ROLE}`);

  console.log("\n=== TEST ACCOUNT READY ===");
  console.log("Open:     http://localhost:3000/auth/login");
  console.log("Email:    " + EMAIL);
  console.log("Password: " + PASSWORD);
  console.log(
    "Role:     " +
      ROLE +
      (ROLE === "student" ? "  → lands on /onboarding (the questionnaire)" : ""),
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
