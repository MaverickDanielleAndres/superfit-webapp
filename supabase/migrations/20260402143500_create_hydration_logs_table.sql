-- Description: Create hydration logs table and policies
-- Author: Copilot
-- Date: 2026-04-02

create table if not exists public.hydration_logs (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  logged_at timestamptz not null default now(),
  amount_ml int not null,
  drink_type text not null default 'water',
  label text,
  hydration_factor numeric not null default 1,
  caffeine_mg int not null default 0
);

create index if not exists idx_hydration_logs_user_logged_at on public.hydration_logs(user_id, logged_at desc);

alter table public.hydration_logs enable row level security;

drop policy if exists "Users manage own hydration logs" on public.hydration_logs;
create policy "Users manage own hydration logs"
  on public.hydration_logs
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
