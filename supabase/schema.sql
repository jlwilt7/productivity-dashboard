-- =============================================================================
-- Productivity Dashboard - Supabase Schema
-- Run this in the Supabase SQL editor for your project.
-- Re-running is safe; objects are created only if they do not already exist.
-- =============================================================================

create extension if not exists "uuid-ossp";

-- -----------------------------------------------------------------------------
-- Tables
-- -----------------------------------------------------------------------------

create table if not exists public.goals (
  id            uuid primary key default uuid_generate_v4(),
  user_id       uuid not null references auth.users (id) on delete cascade,
  name          text not null,
  frequency     text not null check (frequency in ('daily','weekly','monthly')),
  type          text not null check (type in ('checkbox','numeric','duration')),
  target_value  integer,
  category      text,
  position      integer not null default 0,
  is_archived   boolean not null default false,
  created_at    timestamptz not null default now()
);

create index if not exists goals_user_id_idx      on public.goals (user_id);
create index if not exists goals_user_position_idx on public.goals (user_id, position);

create table if not exists public.goal_entries (
  id          uuid primary key default uuid_generate_v4(),
  user_id     uuid not null references auth.users (id) on delete cascade,
  goal_id     uuid not null references public.goals (id) on delete cascade,
  date        date not null,
  value       integer not null default 0,
  status      text not null check (status in ('red','yellow','green')),
  created_at  timestamptz not null default now(),
  constraint goal_entries_goal_date_unique unique (goal_id, date)
);

create index if not exists goal_entries_user_date_idx on public.goal_entries (user_id, date);
create index if not exists goal_entries_goal_idx      on public.goal_entries (goal_id);

create table if not exists public.dashboard_layouts (
  id           uuid primary key default uuid_generate_v4(),
  user_id      uuid not null references auth.users (id) on delete cascade,
  layout_json  jsonb not null default '{}'::jsonb,
  created_at   timestamptz not null default now(),
  constraint dashboard_layouts_user_unique unique (user_id)
);

create table if not exists public.reflections (
  id          uuid primary key default uuid_generate_v4(),
  user_id     uuid not null references auth.users (id) on delete cascade,
  type        text not null check (type in ('weekly','monthly')),
  content     text not null default '',
  date        date not null,
  created_at  timestamptz not null default now(),
  constraint reflections_user_type_date_unique unique (user_id, type, date)
);

create index if not exists reflections_user_date_idx on public.reflections (user_id, date);

-- -----------------------------------------------------------------------------
-- Row Level Security
-- -----------------------------------------------------------------------------

alter table public.goals             enable row level security;
alter table public.goal_entries      enable row level security;
alter table public.dashboard_layouts enable row level security;
alter table public.reflections       enable row level security;

-- goals ----------------------------------------------------------------------
drop policy if exists "goals_select_own" on public.goals;
create policy "goals_select_own" on public.goals
  for select using (auth.uid() = user_id);

drop policy if exists "goals_insert_own" on public.goals;
create policy "goals_insert_own" on public.goals
  for insert with check (auth.uid() = user_id);

drop policy if exists "goals_update_own" on public.goals;
create policy "goals_update_own" on public.goals
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "goals_delete_own" on public.goals;
create policy "goals_delete_own" on public.goals
  for delete using (auth.uid() = user_id);

-- goal_entries ---------------------------------------------------------------
drop policy if exists "goal_entries_select_own" on public.goal_entries;
create policy "goal_entries_select_own" on public.goal_entries
  for select using (auth.uid() = user_id);

drop policy if exists "goal_entries_insert_own" on public.goal_entries;
create policy "goal_entries_insert_own" on public.goal_entries
  for insert with check (auth.uid() = user_id);

drop policy if exists "goal_entries_update_own" on public.goal_entries;
create policy "goal_entries_update_own" on public.goal_entries
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "goal_entries_delete_own" on public.goal_entries;
create policy "goal_entries_delete_own" on public.goal_entries
  for delete using (auth.uid() = user_id);

-- dashboard_layouts ----------------------------------------------------------
drop policy if exists "dashboard_layouts_select_own" on public.dashboard_layouts;
create policy "dashboard_layouts_select_own" on public.dashboard_layouts
  for select using (auth.uid() = user_id);

drop policy if exists "dashboard_layouts_insert_own" on public.dashboard_layouts;
create policy "dashboard_layouts_insert_own" on public.dashboard_layouts
  for insert with check (auth.uid() = user_id);

drop policy if exists "dashboard_layouts_update_own" on public.dashboard_layouts;
create policy "dashboard_layouts_update_own" on public.dashboard_layouts
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "dashboard_layouts_delete_own" on public.dashboard_layouts;
create policy "dashboard_layouts_delete_own" on public.dashboard_layouts
  for delete using (auth.uid() = user_id);

-- reflections ----------------------------------------------------------------
drop policy if exists "reflections_select_own" on public.reflections;
create policy "reflections_select_own" on public.reflections
  for select using (auth.uid() = user_id);

drop policy if exists "reflections_insert_own" on public.reflections;
create policy "reflections_insert_own" on public.reflections
  for insert with check (auth.uid() = user_id);

drop policy if exists "reflections_update_own" on public.reflections;
create policy "reflections_update_own" on public.reflections
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "reflections_delete_own" on public.reflections;
create policy "reflections_delete_own" on public.reflections
  for delete using (auth.uid() = user_id);
