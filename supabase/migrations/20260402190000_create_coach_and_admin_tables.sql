-- Description: Add coach/admin operational tables for phase completion
-- Author: Copilot
-- Date: 2026-04-02

create or replace function public.is_admin(user_id uuid)
returns boolean
language sql
stable
as $$
  select exists(
    select 1
    from public.profiles p
    where p.id = user_id
      and p.role = 'admin'
  );
$$;

-- ============================================================
-- Coach domain tables
-- ============================================================

create table if not exists public.coach_client_links (
  id uuid primary key default gen_random_uuid(),
  coach_id uuid not null references public.profiles(id) on delete cascade,
  client_id uuid not null references public.profiles(id) on delete cascade,
  status text not null default 'active' check (status in ('active', 'onboarding', 'inactive')),
  goal_name text,
  compliance int not null default 0 check (compliance between 0 and 100),
  weight_trend jsonb not null default '[]'::jsonb,
  last_active_at timestamptz not null default now(),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (coach_id, client_id)
);

create index if not exists coach_client_links_coach_idx on public.coach_client_links(coach_id);
create index if not exists coach_client_links_client_idx on public.coach_client_links(client_id);

create table if not exists public.coach_programs (
  id uuid primary key default gen_random_uuid(),
  coach_id uuid not null references public.profiles(id) on delete cascade,
  name text not null,
  difficulty text not null default 'Beginner',
  length_label text not null default '4 Weeks',
  cover_url text,
  builder_days jsonb not null default '[]'::jsonb,
  is_archived boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists coach_programs_coach_idx on public.coach_programs(coach_id);
create index if not exists coach_programs_created_idx on public.coach_programs(created_at desc);

create table if not exists public.coach_program_assignments (
  id uuid primary key default gen_random_uuid(),
  program_id uuid not null references public.coach_programs(id) on delete cascade,
  coach_id uuid not null references public.profiles(id) on delete cascade,
  client_id uuid not null references public.profiles(id) on delete cascade,
  status text not null default 'active' check (status in ('active', 'completed', 'paused')),
  progress_pct int not null default 0 check (progress_pct between 0 and 100),
  assigned_at timestamptz not null default now(),
  started_at timestamptz,
  completed_at timestamptz,
  unique (program_id, client_id)
);

create index if not exists coach_program_assignments_coach_idx on public.coach_program_assignments(coach_id);
create index if not exists coach_program_assignments_client_idx on public.coach_program_assignments(client_id);

create table if not exists public.coach_forms (
  id uuid primary key default gen_random_uuid(),
  coach_id uuid not null references public.profiles(id) on delete cascade,
  name text not null,
  status text not null default 'draft' check (status in ('draft', 'active', 'archived')),
  form_schema jsonb not null default '{"questions": []}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists coach_forms_coach_idx on public.coach_forms(coach_id);

create table if not exists public.coach_form_submissions (
  id uuid primary key default gen_random_uuid(),
  form_id uuid not null references public.coach_forms(id) on delete cascade,
  coach_id uuid not null references public.profiles(id) on delete cascade,
  client_id uuid not null references public.profiles(id) on delete cascade,
  response jsonb not null default '{}'::jsonb,
  review_status text not null default 'pending' check (review_status in ('pending', 'reviewed')),
  coach_notes text,
  submitted_at timestamptz not null default now(),
  reviewed_at timestamptz
);

create index if not exists coach_form_submissions_form_idx on public.coach_form_submissions(form_id);
create index if not exists coach_form_submissions_client_idx on public.coach_form_submissions(client_id);

create table if not exists public.coach_schedule_events (
  id uuid primary key default gen_random_uuid(),
  coach_id uuid not null references public.profiles(id) on delete cascade,
  client_id uuid references public.profiles(id) on delete set null,
  title text not null,
  event_type text not null default '1-on-1',
  status text not null default 'scheduled' check (status in ('scheduled', 'completed', 'cancelled')),
  start_at timestamptz not null,
  end_at timestamptz not null,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists coach_schedule_events_coach_idx on public.coach_schedule_events(coach_id, start_at);
create index if not exists coach_schedule_events_client_idx on public.coach_schedule_events(client_id, start_at);

create table if not exists public.coach_broadcast_logs (
  id uuid primary key default gen_random_uuid(),
  coach_id uuid not null references public.profiles(id) on delete cascade,
  audience_label text not null,
  message text not null,
  delivered_count int not null default 0,
  read_count int not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists coach_broadcast_logs_coach_idx on public.coach_broadcast_logs(coach_id, created_at desc);

-- ============================================================
-- Admin domain tables
-- ============================================================

create table if not exists public.admin_coach_applications (
  id uuid primary key default gen_random_uuid(),
  applicant_id uuid references public.profiles(id) on delete set null,
  full_name text not null,
  email text not null,
  specialties text[] not null default '{}'::text[],
  experience_years int not null default 0,
  certificate_url text,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  submitted_at timestamptz not null default now(),
  reviewed_at timestamptz,
  reviewed_by uuid references public.profiles(id) on delete set null,
  review_notes text
);

create index if not exists admin_coach_applications_status_idx on public.admin_coach_applications(status, submitted_at desc);

create table if not exists public.payment_transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete set null,
  coach_id uuid references public.profiles(id) on delete set null,
  amount_cents int not null,
  currency text not null default 'usd',
  status text not null default 'succeeded' check (status in ('succeeded', 'failed', 'refunded', 'pending')),
  external_ref text,
  created_at timestamptz not null default now()
);

create index if not exists payment_transactions_created_idx on public.payment_transactions(created_at desc);
create index if not exists payment_transactions_coach_idx on public.payment_transactions(coach_id);
create index if not exists payment_transactions_user_idx on public.payment_transactions(user_id);

create table if not exists public.admin_moderation_reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid references public.profiles(id) on delete set null,
  target_user_id uuid references public.profiles(id) on delete set null,
  target_post_id uuid references public.community_posts(id) on delete set null,
  content_type text not null default 'post',
  reason text not null,
  status text not null default 'pending' check (status in ('pending', 'dismissed', 'removed', 'warned', 'banned')),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  reviewed_by uuid references public.profiles(id) on delete set null
);

create index if not exists admin_moderation_reports_status_idx on public.admin_moderation_reports(status, created_at desc);

create table if not exists public.platform_settings (
  setting_key text primary key,
  setting_value jsonb not null,
  updated_at timestamptz not null default now(),
  updated_by uuid references public.profiles(id) on delete set null
);

insert into public.platform_settings (setting_key, setting_value)
values
  ('maintenance_mode', '{"enabled": false}'::jsonb),
  ('platform_fee_percent', '{"value": 10}'::jsonb),
  ('auto_approve_coaches', '{"enabled": true}'::jsonb)
on conflict (setting_key) do nothing;

-- ============================================================
-- Updated-at triggers
-- ============================================================

drop trigger if exists coach_client_links_updated_at on public.coach_client_links;
create trigger coach_client_links_updated_at
  before update on public.coach_client_links
  for each row
  execute function public.update_updated_at_column();

drop trigger if exists coach_programs_updated_at on public.coach_programs;
create trigger coach_programs_updated_at
  before update on public.coach_programs
  for each row
  execute function public.update_updated_at_column();

drop trigger if exists coach_forms_updated_at on public.coach_forms;
create trigger coach_forms_updated_at
  before update on public.coach_forms
  for each row
  execute function public.update_updated_at_column();

drop trigger if exists coach_schedule_events_updated_at on public.coach_schedule_events;
create trigger coach_schedule_events_updated_at
  before update on public.coach_schedule_events
  for each row
  execute function public.update_updated_at_column();

drop trigger if exists admin_moderation_reports_updated_at on public.admin_moderation_reports;
create trigger admin_moderation_reports_updated_at
  before update on public.admin_moderation_reports
  for each row
  execute function public.update_updated_at_column();

drop trigger if exists platform_settings_updated_at on public.platform_settings;
create trigger platform_settings_updated_at
  before update on public.platform_settings
  for each row
  execute function public.update_updated_at_column();

-- ============================================================
-- RLS
-- ============================================================

alter table public.coach_client_links enable row level security;
alter table public.coach_programs enable row level security;
alter table public.coach_program_assignments enable row level security;
alter table public.coach_forms enable row level security;
alter table public.coach_form_submissions enable row level security;
alter table public.coach_schedule_events enable row level security;
alter table public.coach_broadcast_logs enable row level security;
alter table public.admin_coach_applications enable row level security;
alter table public.payment_transactions enable row level security;
alter table public.admin_moderation_reports enable row level security;
alter table public.platform_settings enable row level security;

-- coach_client_links

drop policy if exists "Coach/client/admin read links" on public.coach_client_links;
create policy "Coach/client/admin read links"
  on public.coach_client_links
  for select
  using (coach_id = auth.uid() or client_id = auth.uid() or public.is_admin(auth.uid()));

drop policy if exists "Coach/admin insert links" on public.coach_client_links;
create policy "Coach/admin insert links"
  on public.coach_client_links
  for insert
  with check (coach_id = auth.uid() or public.is_admin(auth.uid()));

drop policy if exists "Coach/admin update links" on public.coach_client_links;
create policy "Coach/admin update links"
  on public.coach_client_links
  for update
  using (coach_id = auth.uid() or public.is_admin(auth.uid()))
  with check (coach_id = auth.uid() or public.is_admin(auth.uid()));

drop policy if exists "Coach/admin delete links" on public.coach_client_links;
create policy "Coach/admin delete links"
  on public.coach_client_links
  for delete
  using (coach_id = auth.uid() or public.is_admin(auth.uid()));

-- coach_programs

drop policy if exists "Coach/client/admin read programs" on public.coach_programs;
create policy "Coach/client/admin read programs"
  on public.coach_programs
  for select
  using (
    coach_id = auth.uid()
    or public.is_admin(auth.uid())
    or exists (
      select 1
      from public.coach_program_assignments a
      where a.program_id = coach_programs.id
        and a.client_id = auth.uid()
    )
  );

drop policy if exists "Coach/admin manage programs" on public.coach_programs;
create policy "Coach/admin manage programs"
  on public.coach_programs
  for all
  using (coach_id = auth.uid() or public.is_admin(auth.uid()))
  with check (coach_id = auth.uid() or public.is_admin(auth.uid()));

-- coach_program_assignments

drop policy if exists "Coach/client/admin read assignments" on public.coach_program_assignments;
create policy "Coach/client/admin read assignments"
  on public.coach_program_assignments
  for select
  using (coach_id = auth.uid() or client_id = auth.uid() or public.is_admin(auth.uid()));

drop policy if exists "Coach/admin manage assignments" on public.coach_program_assignments;
create policy "Coach/admin manage assignments"
  on public.coach_program_assignments
  for all
  using (coach_id = auth.uid() or public.is_admin(auth.uid()))
  with check (coach_id = auth.uid() or public.is_admin(auth.uid()));

-- coach_forms

drop policy if exists "Coach/client/admin read forms" on public.coach_forms;
create policy "Coach/client/admin read forms"
  on public.coach_forms
  for select
  using (
    coach_id = auth.uid()
    or public.is_admin(auth.uid())
    or exists (
      select 1
      from public.coach_client_links l
      where l.coach_id = coach_forms.coach_id
        and l.client_id = auth.uid()
    )
  );

drop policy if exists "Coach/admin manage forms" on public.coach_forms;
create policy "Coach/admin manage forms"
  on public.coach_forms
  for all
  using (coach_id = auth.uid() or public.is_admin(auth.uid()))
  with check (coach_id = auth.uid() or public.is_admin(auth.uid()));

-- coach_form_submissions

drop policy if exists "Coach/client/admin read submissions" on public.coach_form_submissions;
create policy "Coach/client/admin read submissions"
  on public.coach_form_submissions
  for select
  using (coach_id = auth.uid() or client_id = auth.uid() or public.is_admin(auth.uid()));

drop policy if exists "Client/coach/admin insert submissions" on public.coach_form_submissions;
create policy "Client/coach/admin insert submissions"
  on public.coach_form_submissions
  for insert
  with check (client_id = auth.uid() or coach_id = auth.uid() or public.is_admin(auth.uid()));

drop policy if exists "Coach/admin update submissions" on public.coach_form_submissions;
create policy "Coach/admin update submissions"
  on public.coach_form_submissions
  for update
  using (coach_id = auth.uid() or public.is_admin(auth.uid()))
  with check (coach_id = auth.uid() or public.is_admin(auth.uid()));

-- coach_schedule_events

drop policy if exists "Coach/client/admin read schedule" on public.coach_schedule_events;
create policy "Coach/client/admin read schedule"
  on public.coach_schedule_events
  for select
  using (coach_id = auth.uid() or client_id = auth.uid() or public.is_admin(auth.uid()));

drop policy if exists "Coach/admin manage schedule" on public.coach_schedule_events;
create policy "Coach/admin manage schedule"
  on public.coach_schedule_events
  for all
  using (coach_id = auth.uid() or public.is_admin(auth.uid()))
  with check (coach_id = auth.uid() or public.is_admin(auth.uid()));

-- coach_broadcast_logs

drop policy if exists "Coach/admin read broadcasts" on public.coach_broadcast_logs;
create policy "Coach/admin read broadcasts"
  on public.coach_broadcast_logs
  for select
  using (coach_id = auth.uid() or public.is_admin(auth.uid()));

drop policy if exists "Coach/admin insert broadcasts" on public.coach_broadcast_logs;
create policy "Coach/admin insert broadcasts"
  on public.coach_broadcast_logs
  for insert
  with check (coach_id = auth.uid() or public.is_admin(auth.uid()));

drop policy if exists "Coach/admin update broadcasts" on public.coach_broadcast_logs;
create policy "Coach/admin update broadcasts"
  on public.coach_broadcast_logs
  for update
  using (coach_id = auth.uid() or public.is_admin(auth.uid()))
  with check (coach_id = auth.uid() or public.is_admin(auth.uid()));

-- admin_coach_applications

drop policy if exists "Applicant/admin read applications" on public.admin_coach_applications;
create policy "Applicant/admin read applications"
  on public.admin_coach_applications
  for select
  using (applicant_id = auth.uid() or public.is_admin(auth.uid()));

drop policy if exists "Applicant/admin insert applications" on public.admin_coach_applications;
create policy "Applicant/admin insert applications"
  on public.admin_coach_applications
  for insert
  with check (applicant_id = auth.uid() or public.is_admin(auth.uid()));

drop policy if exists "Admin manage applications" on public.admin_coach_applications;
create policy "Admin manage applications"
  on public.admin_coach_applications
  for update
  using (public.is_admin(auth.uid()))
  with check (public.is_admin(auth.uid()));

-- payment_transactions

drop policy if exists "User/coach/admin read payments" on public.payment_transactions;
create policy "User/coach/admin read payments"
  on public.payment_transactions
  for select
  using (user_id = auth.uid() or coach_id = auth.uid() or public.is_admin(auth.uid()));

drop policy if exists "Admin manage payments" on public.payment_transactions;
create policy "Admin manage payments"
  on public.payment_transactions
  for all
  using (public.is_admin(auth.uid()))
  with check (public.is_admin(auth.uid()));

-- admin_moderation_reports

drop policy if exists "Reporter/admin read reports" on public.admin_moderation_reports;
create policy "Reporter/admin read reports"
  on public.admin_moderation_reports
  for select
  using (reporter_id = auth.uid() or public.is_admin(auth.uid()));

drop policy if exists "Authenticated create reports" on public.admin_moderation_reports;
create policy "Authenticated create reports"
  on public.admin_moderation_reports
  for insert
  with check (auth.uid() is not null);

drop policy if exists "Admin manage reports" on public.admin_moderation_reports;
create policy "Admin manage reports"
  on public.admin_moderation_reports
  for update
  using (public.is_admin(auth.uid()))
  with check (public.is_admin(auth.uid()));

-- platform_settings

drop policy if exists "Admin read settings" on public.platform_settings;
create policy "Admin read settings"
  on public.platform_settings
  for select
  using (public.is_admin(auth.uid()));

drop policy if exists "Admin manage settings" on public.platform_settings;
create policy "Admin manage settings"
  on public.platform_settings
  for all
  using (public.is_admin(auth.uid()))
  with check (public.is_admin(auth.uid()));
