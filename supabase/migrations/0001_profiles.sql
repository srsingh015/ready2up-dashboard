-- Migration: 0001_profiles.sql
-- Feature: server-side-access-control (Task 1.1)
-- Purpose: Establish the server-side role source of truth.
--   * public.profiles          -- one row per auth user, carrying their role
--   * RLS + self-read policy    -- a user may read only their own profile row
--   * public.app_current_role() -- SECURITY DEFINER helper used by every
--                                  content/state RLS policy to resolve the
--                                  caller's role without recursive RLS.
-- Requirements: 3.1, 3.2, 3.3
--
-- NOTE: Apply this against Supabase (local `supabase db push` / `supabase start`
-- or the SQL editor). It is written to be idempotent so it can be re-applied.

-- ---------------------------------------------------------------------------
-- profiles table: the authoritative Role_Attribute store (Req 3.2)
-- ---------------------------------------------------------------------------
create table if not exists public.profiles (
  -- Primary key is the auth user id; cascade-delete cleans up on user removal.
  id         uuid primary key references auth.users(id) on delete cascade,
  -- Exactly two allowed roles, enforced by CHECK (Req 3.1).
  role       text not null check (role in ('owner', 'employee')),
  updated_at timestamptz not null default now()
);

-- Enable Row-Level Security so no row is readable unless a policy allows it.
alter table public.profiles enable row level security;

-- ---------------------------------------------------------------------------
-- Self-read policy: a user can read ONLY their own profile row (Req 3.3).
-- No INSERT/UPDATE/DELETE policy is defined for end users; profile rows are
-- seeded/managed server-side (see 0004_assign_roles.sql), so clients cannot
-- alter their own role.
-- ---------------------------------------------------------------------------
drop policy if exists profiles_self_read on public.profiles;
create policy profiles_self_read on public.profiles
  for select
  using (id = auth.uid());

-- ---------------------------------------------------------------------------
-- app_current_role(): resolve the caller's role from their profile row.
-- SECURITY DEFINER so RLS policies can read profiles without triggering
-- recursive RLS evaluation. Returns NULL when the caller has no profile row
-- or no session, which the content/state policies treat as "denied" (Req 3.4,
-- 3.6). STABLE because it does not modify data and returns the same value
-- within a single statement.
-- ---------------------------------------------------------------------------
create or replace function public.app_current_role()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select role from public.profiles where id = auth.uid()
$$;
