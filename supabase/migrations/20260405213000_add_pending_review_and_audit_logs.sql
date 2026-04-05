-- Description: Add pending review account state and audit log infrastructure
-- Author: Copilot
-- Date: 2026-04-05

begin;

alter table public.profiles
  drop constraint if exists profiles_account_status_check;

alter table public.profiles
  add constraint profiles_account_status_check
  check (account_status in ('active', 'suspended', 'inactive', 'pending_review'));

create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete set null,
  action text not null,
  resource text not null,
  resource_id text,
  metadata jsonb,
  ip_address inet,
  user_agent text,
  created_at timestamptz not null default now()
);

create index if not exists audit_logs_user_created_idx
  on public.audit_logs(user_id, created_at desc);

create index if not exists audit_logs_resource_action_created_idx
  on public.audit_logs(resource, action, created_at desc);

alter table public.audit_logs enable row level security;

drop policy if exists "Admin read audit logs" on public.audit_logs;
create policy "Admin read audit logs"
  on public.audit_logs
  for select
  using (public.is_admin(auth.uid()));

drop policy if exists "Service inserts audit logs" on public.audit_logs;
create policy "Service inserts audit logs"
  on public.audit_logs
  for insert
  with check (coalesce((current_setting('request.jwt.claim.role', true))::text, '') = 'service_role');

commit;