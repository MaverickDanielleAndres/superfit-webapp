-- Description: Add lifecycle audit fields for admin-driven suspension and soft delete flows
-- Author: Copilot
-- Date: 2026-04-05

alter table if exists public.profiles
  add column if not exists suspended_at timestamptz,
  add column if not exists suspended_by uuid references public.profiles(id) on delete set null,
  add column if not exists suspension_reason text,
  add column if not exists deleted_at timestamptz,
  add column if not exists deleted_by uuid references public.profiles(id) on delete set null,
  add column if not exists deletion_reason text;

create index if not exists profiles_deleted_at_idx
  on public.profiles(deleted_at);

create index if not exists profiles_account_status_deleted_idx
  on public.profiles(account_status, deleted_at);
