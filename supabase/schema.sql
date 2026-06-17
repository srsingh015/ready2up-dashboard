-- ============================================================
-- Ready2UP Dashboard — Supabase schema
-- Run this ONCE in: Supabase Dashboard → SQL Editor → New query → paste → Run
-- ============================================================

-- A single key/value store per user. Each saved item (trackers, checklists,
-- Kaira check-ins, partnerships, pinned nav, etc.) is one row, scoped to the
-- logged-in user. JSONB value holds whatever the app stores.
create table if not exists public.user_state (
  user_id    uuid not null references auth.users (id) on delete cascade,
  key        text not null,
  value      jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  primary key (user_id, key)
);

-- Keep updated_at fresh on every write
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

-- ============================================================
-- Row Level Security: each user can ONLY read/write their own rows.
-- This is what makes the data private even though it lives in the cloud.
-- ============================================================
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

-- ============================================================
-- OPTIONAL: shared data between you + Kaira (so you both see the SAME
-- partnerships, trackers, etc., not separate copies).
-- If you want SHARED data, use this table instead of per-user rows for
-- the shared keys. For now we keep it simple (per-user). Ask to enable sharing.
-- ============================================================
