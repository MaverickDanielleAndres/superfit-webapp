-- Description: Foundation migration scaffold for SuperFit Supabase transition
-- Author: Copilot
-- Date: 2026-04-02

-- ============================================================
-- Extensions
-- ============================================================

create extension if not exists pgcrypto;

-- ============================================================
-- Shared trigger function
-- ============================================================

create or replace function public.update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- ============================================================
-- Profiles table (auth extension)
-- ============================================================

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  email text not null,
  full_name text,
  username text unique,
  avatar_url text,
  role text not null default 'user' check (role in ('user', 'coach', 'admin')),
  onboarding_complete boolean not null default false
);

alter table public.profiles
  add column if not exists email text,
  add column if not exists username text,
  add column if not exists role text not null default 'user',
  add column if not exists onboarding_complete boolean not null default false;

alter table public.profiles enable row level security;

drop policy if exists "Users read own profile" on public.profiles;
create policy "Users read own profile"
  on public.profiles
  for select
  using (auth.uid() = id);

drop policy if exists "Users update own profile" on public.profiles;
create policy "Users update own profile"
  on public.profiles
  for update
  using (auth.uid() = id);

drop trigger if exists profiles_updated_at on public.profiles;
create trigger profiles_updated_at
  before update on public.profiles
  for each row
  execute function public.update_updated_at_column();
