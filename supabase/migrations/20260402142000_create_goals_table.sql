-- Description: Create goals table and policies for user goal tracking
-- Author: Copilot
-- Date: 2026-04-02

create table if not exists public.goals (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  category text,
  target_value numeric,
  current_value numeric not null default 0,
  start_value numeric not null default 0,
  unit text,
  deadline date,
  projected_complete date,
  ahead boolean not null default true,
  completed boolean not null default false,
  completed_at timestamptz
);

create index if not exists idx_goals_user_id on public.goals(user_id);
create index if not exists idx_goals_user_completed on public.goals(user_id, completed);

alter table public.goals enable row level security;

drop policy if exists "Users manage own goals" on public.goals;
create policy "Users manage own goals"
  on public.goals
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop trigger if exists goals_updated_at on public.goals;
create trigger goals_updated_at
  before update on public.goals
  for each row
  execute function public.update_updated_at_column();
