-- Migration: 0004_assign_roles.sql
-- Feature: server-side-access-control (Task 1.4)
-- Purpose: Seed profile rows assigning roles to the two existing accounts:
--     dragosaurabh@gmail.com  -> 'owner'
--     ready2up.in@gmail.com   -> 'employee'
-- Requirements: 3.2, 3.3, 16.1
--
-- Idempotent: resolves each user id from auth.users by email and upserts the
-- profile. Safe to re-run — an existing profile row has its role refreshed to
-- the intended value (on conflict do update). If an account does not yet exist
-- in auth.users, the corresponding subselect yields no row and nothing is
-- inserted for it (no error) — create the account, then re-run this migration.
--
-- Depends on 0001_profiles.sql (public.profiles).

-- Owner: dragosaurabh@gmail.com -> 'owner'
insert into public.profiles (id, role)
select id, 'owner'
from auth.users
where email = 'dragosaurabh@gmail.com'
on conflict (id) do update
  set role       = excluded.role,
      updated_at = now();

-- Employee: ready2up.in@gmail.com -> 'employee'
insert into public.profiles (id, role)
select id, 'employee'
from auth.users
where email = 'ready2up.in@gmail.com'
on conflict (id) do update
  set role       = excluded.role,
      updated_at = now();
