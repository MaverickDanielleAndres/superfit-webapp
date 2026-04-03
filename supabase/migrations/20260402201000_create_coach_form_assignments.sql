-- Description: Create coach form assignments table for coach -> client form distribution
-- Author: Copilot
-- Date: 2026-04-02

create table if not exists public.coach_form_assignments (
  id uuid primary key default gen_random_uuid(),
  form_id uuid not null references public.coach_forms(id) on delete cascade,
  coach_id uuid not null references public.profiles(id) on delete cascade,
  client_id uuid not null references public.profiles(id) on delete cascade,
  assigned_at timestamptz not null default now(),
  deadline timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  unique (form_id, coach_id, client_id)
);

create index if not exists coach_form_assignments_form_idx on public.coach_form_assignments(form_id);
create index if not exists coach_form_assignments_coach_idx on public.coach_form_assignments(coach_id);
create index if not exists coach_form_assignments_client_idx on public.coach_form_assignments(client_id);

alter table public.coach_form_assignments enable row level security;

drop policy if exists "Coach/admin read own assignments" on public.coach_form_assignments;
create policy "Coach/admin read own assignments"
  on public.coach_form_assignments
  for select
  using (coach_id = auth.uid() or public.is_admin(auth.uid()));

drop policy if exists "Client reads own assigned forms" on public.coach_form_assignments;
create policy "Client reads own assigned forms"
  on public.coach_form_assignments
  for select
  using (client_id = auth.uid());

drop policy if exists "Coach/admin insert assignments" on public.coach_form_assignments;
create policy "Coach/admin insert assignments"
  on public.coach_form_assignments
  for insert
  with check (coach_id = auth.uid() or public.is_admin(auth.uid()));

drop policy if exists "Coach/admin update assignments" on public.coach_form_assignments;
create policy "Coach/admin update assignments"
  on public.coach_form_assignments
  for update
  using (coach_id = auth.uid() or public.is_admin(auth.uid()))
  with check (coach_id = auth.uid() or public.is_admin(auth.uid()));

drop policy if exists "Coach/admin delete assignments" on public.coach_form_assignments;
create policy "Coach/admin delete assignments"
  on public.coach_form_assignments
  for delete
  using (coach_id = auth.uid() or public.is_admin(auth.uid()));
