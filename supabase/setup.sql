-- ============================================================================
-- Ready2UP Dashboard — COMPLETE Supabase setup (server-side access control)
-- ----------------------------------------------------------------------------
-- HOW TO RUN:
--   Supabase Dashboard → SQL Editor → New query → paste ALL of this → Run.
-- Safe to run more than once (idempotent). Order inside the file matters, so
-- run it top-to-bottom as a single query.
--
-- What this creates:
--   1) user_state       — per-user private key/value store (trackers, etc.)
--   2) profiles         — the role (owner/employee) for each account
--   3) app_current_role()— helper used by the content security rule
--   4) content_sections — the plan content, gated by role via RLS
--   5) role assignment  — tags your two existing accounts owner / employee
-- ============================================================================


-- ============================================================================
-- 1) user_state — each user can ONLY read/write their OWN rows (per-user).
--    You + Kaira share the OWNER login, so you both see the SAME rows.
-- ============================================================================
create table if not exists public.user_state (
  user_id    uuid not null references auth.users (id) on delete cascade,
  key        text not null,
  value      jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  primary key (user_id, key)
);

-- Keep updated_at fresh on every write.
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_user_state_touch on public.user_state;
create trigger trg_user_state_touch
  before update on public.user_state
  for each row execute function public.touch_updated_at();

alter table public.user_state enable row level security;

drop policy if exists "own rows - select" on public.user_state;
create policy "own rows - select" on public.user_state
  for select using (auth.uid() = user_id);

drop policy if exists "own rows - insert" on public.user_state;
create policy "own rows - insert" on public.user_state
  for insert with check (auth.uid() = user_id);

drop policy if exists "own rows - update" on public.user_state;
create policy "own rows - update" on public.user_state
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "own rows - delete" on public.user_state;
create policy "own rows - delete" on public.user_state
  for delete using (auth.uid() = user_id);


-- ============================================================================
-- 2) profiles — the authoritative role for each account (owner | employee).
--    Only two roles are allowed. Users can read their own profile but CANNOT
--    change their role (no insert/update policy for end users).
-- ============================================================================
create table if not exists public.profiles (
  id         uuid primary key references auth.users(id) on delete cascade,
  role       text not null check (role in ('owner', 'employee')),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

drop policy if exists profiles_self_read on public.profiles;
create policy profiles_self_read on public.profiles
  for select
  using (id = auth.uid());


-- ============================================================================
-- 3) app_current_role() — resolves the caller's role from their profile row.
--    SECURITY DEFINER so the content rule can read profiles without recursive
--    RLS. Returns NULL when there is no session / no profile → treated as
--    "denied" by the content rule below.
-- ============================================================================
create or replace function public.app_current_role()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select role from public.profiles where id = auth.uid()
$$;


-- ============================================================================
-- 4) content_sections — the plan content, one row per (key, min_role).
--    A section can exist as a full owner row AND a redacted employee row.
--    RLS: owner reads everything; employee reads only employee rows; no
--    session / unknown role reads NOTHING.
-- ============================================================================
create table if not exists public.content_sections (
  key        text not null,
  min_role   text not null check (min_role in ('owner', 'employee')),
  data       jsonb not null,
  updated_at timestamptz not null default now(),
  primary key (key, min_role)
);

alter table public.content_sections enable row level security;

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


-- ============================================================================
-- 5) Assign roles to your two existing accounts (idempotent).
--    Resolves each account by email. If an account doesn't exist yet, that
--    line simply inserts nothing (no error) — create it, then re-run.
-- ============================================================================
insert into public.profiles (id, role)
select id, 'owner'
from auth.users
where email = 'dragosaurabh@gmail.com'
on conflict (id) do update
  set role = excluded.role, updated_at = now();

insert into public.profiles (id, role)
select id, 'employee'
from auth.users
where email = 'ready2up.in@gmail.com'
on conflict (id) do update
  set role = excluded.role, updated_at = now();


-- ============================================================================
-- Done. Quick check (optional): see the assigned roles.
--   select p.role, u.email
--   from public.profiles p join auth.users u on u.id = p.id
--   order by p.role;
-- ============================================================================
