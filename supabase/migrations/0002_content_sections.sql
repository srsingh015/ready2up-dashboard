-- Migration: 0002_content_sections.sql
-- Feature: server-side-access-control (Task 1.2)
-- Purpose: Store plan content as the server-side source of truth and enforce
--   role-based read authorization entirely in the database via RLS.
--     * public.content_sections    -- one row per (key, min_role)
--     * RLS + SELECT policy         -- owner reads all; employee reads only
--                                      employee rows; no session / unknown
--                                      role reads nothing.
-- Requirements: 4.1, 4.3, 5.1, 5.2, 5.5, 5.6, 3.4, 3.6
--
-- NOTE: Depends on 0001_profiles.sql (public.app_current_role()). Idempotent.

-- ---------------------------------------------------------------------------
-- content_sections table (Req 4.1, 4.3)
--   key       -- logical section id, e.g. 'roadmap', 'months', 'principles'
--   min_role  -- the role classification governing this row's visibility
--   data      -- the section payload rendered by the SPA
-- The composite primary key (key, min_role) lets a section exist as both a
-- redacted employee variant (min_role='employee') and a full owner variant
-- (min_role='owner') without collision.
-- ---------------------------------------------------------------------------
create table if not exists public.content_sections (
  key        text not null,
  min_role   text not null check (min_role in ('owner', 'employee')),
  data       jsonb not null,
  updated_at timestamptz not null default now(),
  primary key (key, min_role)
);

-- Enable RLS: with no permissive policy, every SELECT returns zero rows, which
-- is exactly the desired default for unauthenticated / unknown-role callers
-- (Req 5.6, 3.6).
alter table public.content_sections enable row level security;

-- ---------------------------------------------------------------------------
-- SELECT policy: role-gated read access (Req 5.1, 5.2, 5.5).
--
-- A row is visible to the caller only when ALL of the following hold:
--   1. There is a valid session               -> auth.uid() is not null
--   2. The caller has a recognized role        -> app_current_role() in (owner, employee)
--   3. Either the row is employee-visible OR    -> min_role = 'employee'
--      the caller is the owner                     OR app_current_role() = 'owner'
--
-- Outcomes:
--   * authenticated OWNER    -> conditions 1,2 hold; clause (3) is always true
--                               because app_current_role() = 'owner' -> ALL rows.
--   * authenticated EMPLOYEE -> conditions 1,2 hold; clause (3) is true only
--                               for min_role='employee' rows -> employee rows only,
--                               every owner row excluded (Req 5.1, 5.3).
--   * NO session             -> condition 1 fails -> zero rows (Req 3.6, 5.6).
--   * unknown / missing role -> app_current_role() is NULL, condition 2 fails
--                               -> zero rows (Req 3.4, 5.6).
--
-- The decision is made server-side before any row is transmitted; min_role is
-- never selected by the client, so it never leaves the DB (Req 5.5).
-- ---------------------------------------------------------------------------
drop policy if exists content_sections_role_read on public.content_sections;
create policy content_sections_role_read on public.content_sections
  for select
  using (
    auth.uid() is not null
    and public.app_current_role() in ('owner', 'employee')
    and (
      min_role = 'employee'
      or public.app_current_role() = 'owner'
    )
  );
