-- Description: Extend profiles with admin-manageable account state
-- Author: Copilot
-- Date: 2026-04-02

alter table public.profiles
  add column if not exists account_status text not null default 'active',
  add column if not exists is_premium boolean not null default false;

update public.profiles
set account_status = 'active'
where account_status is null;

alter table public.profiles
  drop constraint if exists profiles_account_status_check;

alter table public.profiles
  add constraint profiles_account_status_check
  check (account_status in ('active', 'suspended', 'inactive'));
