# Migrations

Numbered SQL, **applied by hand** in the Supabase SQL editor. There is no
migration runner and no state table, so nothing here runs by itself and nothing
records what has already run.

That has two consequences worth internalising.

## 1. Adding a file is not applying it

Say so explicitly when you add one — in the commit body and in the PR. Until
someone pastes it into the SQL editor, production does not have it.

Code must therefore **degrade, not crash**, on a database that lacks the
migration: catch the "missing table/column" codes (`42P01`, `PGRST205`,
`42703`, `PGRST204`) and return a message that names the migration. See
`saveOpportunityIntent` in `app/dashboard/actions.ts` for the shape.

## 2. Never trust a note about what is applied

Notes go stale within days — this repo carried a "0021 still PENDING" line for a
week after it was applied. Ask the database:

```sql
select table_name from information_schema.tables where table_name = 'your_table';
```

```sql
select column_name from information_schema.columns
where table_name = 'your_table' and column_name = 'your_column';
```

## Writing one

- **Idempotent.** `create table if not exists`, `add column if not exists`,
  `drop policy if exists` before `create policy`. It must survive being run
  twice.
- **RLS on, own-rows-only policies**, following the pattern in `0001_init.sql`.
- **Column-level grants.** Table privileges were locked down in `0008`, and a
  missing grant surfaces as a bare `42501 permission denied for column` that
  reads like anything but a permissions problem. This has cost a debugging
  session once already (`profiles.full_name`, fixed by `0012`).
- **A header comment saying why**, not what. The SQL already says what.

## A note on Supabase's warning

The editor flags any script containing `drop` as "potentially destructive",
including `drop policy if exists` on a table being created three lines above.
Read what is actually being dropped before deciding.
