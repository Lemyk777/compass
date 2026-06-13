# Compass — Setup & Run Guide

Everything is built (M0–M6). This guide covers the credentials and one-time
setup needed to run it for real. Until you add keys, the app builds and the
**`/demo`** route renders the full results dashboard with sample data so you can
see the design.

## 1. Prerequisites

- Node 20+ (developed on Node 24)
- A Supabase project (free tier)
- An Anthropic API key

## 2. Install

```bash
npm install
```

## 3. Supabase

1. Create a project at supabase.com.
2. **Run the migration:** open the SQL editor and paste
   [`supabase/migrations/0001_init.sql`](supabase/migrations/0001_init.sql). This
   creates all tables, RLS policies, and the `signup_count_for_code` helper.
3. **Auth providers** (Authentication → Providers):
   - Enable **Email**.
   - Enable **Google**: create an OAuth client in Google Cloud Console, set the
     authorized redirect URI to
     `https://<your-project-ref>.supabase.co/auth/v1/callback`, and paste the
     client ID/secret into Supabase.
4. **Redirect URLs** (Authentication → URL Configuration): add
   `http://localhost:3000/auth/callback` and your production
   `https://<your-domain>/auth/callback`.
5. Copy your keys (Settings → API) into `.env.local`.

## 4. Environment variables

Copy `.env.example` to `.env.local` and fill in:

```
NEXT_PUBLIC_SUPABASE_URL=        # Supabase project URL
NEXT_PUBLIC_SUPABASE_ANON_KEY=   # anon/public key
SUPABASE_SERVICE_ROLE_KEY=       # service_role key (server-only)
ANTHROPIC_API_KEY=               # server-only
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

> **FOUNDER:** set a hard spend limit in the Anthropic console — code rate-limits
> per user (5/hour) and caps `max_tokens`, but the billing cap can only be set there.

## 5. Run

```bash
npm run dev          # http://localhost:3000
```

## 6. Acceptance test (§12)

With `ANTHROPIC_API_KEY` set in `.env.local`:

```bash
npm run test:analyze
```

This runs the sample Kazakhstani A-Level student through the real analysis
engine and checks the §12 pass criteria (7 factors, Penn/Princeton low-confidence
single/low-double-digit ranges, higher ranges for BU/Michigan, benchmarks,
specific gap analysis, a recommendation outside the target list).

## 7. Roles (manual for v1)

Roles are set directly in the DB for now (leaderboard/auto-tiers are out of scope).

**Make a user an admin** (founder metrics at `/admin`):

```sql
update profiles set role = 'admin' where id = '<auth-user-uuid>';
```

**Create an ambassador** (referral hub at `/ambassador`):

```sql
update profiles set role = 'ambassador' where id = '<auth-user-uuid>';
insert into ambassadors (user_id, code, country, status)
values ('<auth-user-uuid>', 'ALMATY25', 'Kazakhstan', 'active');
```

Find a user's UUID in Authentication → Users. Test referral attribution by
visiting `/?ref=ALMATY25` (in a fresh browser) and signing up — the count on
`/ambassador` should increment.

## 8. Optional: seed the universities table

The dataset lives in code (`lib/data/universities.ts`) and is embedded in the AI
prompt, so the app works without seeding the DB `universities` table. Seed it only
if you later read it from the DB.

## 9. Deploy (Vercel)

1. Push to GitHub and import the repo in Vercel.
2. Add all five env vars in the Vercel project settings; set
   `NEXT_PUBLIC_SITE_URL` to your production URL.
3. Add the production `/auth/callback` URL to Supabase redirect URLs.
4. Deploy.

## Notes

- `claude-haiku-4-5` is called server-only with prompt caching on the static
  system block (rubric + university data). The browser never sees the key.
- All charts render with Recharts from the validated analysis JSON — the model
  returns data, never drawings.
- RLS ensures students can only read their own profile and analyses.
