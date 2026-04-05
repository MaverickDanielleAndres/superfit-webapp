-- Description: Add scheduled broadcast queue for coach portal
-- Author: Copilot
-- Date: 2026-04-05

create table if not exists public.coach_broadcast_schedules (
  id uuid primary key default gen_random_uuid(),
  coach_id uuid not null references public.profiles(id) on delete cascade,
  target_key text not null check (target_key in ('all_active', 'onboarding', 'weight_loss', 'muscle_gain')),
  audience_label text not null,
  message text not null,
  media_url text,
  scheduled_for timestamptz not null,
  status text not null default 'scheduled' check (status in ('scheduled', 'sent', 'cancelled', 'failed')),
  sent_at timestamptz,
  delivered_count integer not null default 0,
  read_count integer not null default 0,
  last_error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists coach_broadcast_schedules_coach_status_time_idx
  on public.coach_broadcast_schedules (coach_id, status, scheduled_for);

create index if not exists coach_broadcast_schedules_status_time_idx
  on public.coach_broadcast_schedules (status, scheduled_for);

drop trigger if exists coach_broadcast_schedules_updated_at on public.coach_broadcast_schedules;
create trigger coach_broadcast_schedules_updated_at
  before update on public.coach_broadcast_schedules
  for each row
  execute function public.update_updated_at_column();

alter table public.coach_broadcast_schedules enable row level security;

drop policy if exists "Coach/admin read own scheduled broadcasts" on public.coach_broadcast_schedules;
create policy "Coach/admin read own scheduled broadcasts"
  on public.coach_broadcast_schedules
  for select
  using (coach_id = auth.uid() or public.is_admin(auth.uid()));

drop policy if exists "Coach/admin insert scheduled broadcasts" on public.coach_broadcast_schedules;
create policy "Coach/admin insert scheduled broadcasts"
  on public.coach_broadcast_schedules
  for insert
  with check (coach_id = auth.uid() or public.is_admin(auth.uid()));

drop policy if exists "Coach/admin update scheduled broadcasts" on public.coach_broadcast_schedules;
create policy "Coach/admin update scheduled broadcasts"
  on public.coach_broadcast_schedules
  for update
  using (coach_id = auth.uid() or public.is_admin(auth.uid()))
  with check (coach_id = auth.uid() or public.is_admin(auth.uid()));

drop policy if exists "Coach/admin delete scheduled broadcasts" on public.coach_broadcast_schedules;
create policy "Coach/admin delete scheduled broadcasts"
  on public.coach_broadcast_schedules
  for delete
  using (coach_id = auth.uid() or public.is_admin(auth.uid()));
