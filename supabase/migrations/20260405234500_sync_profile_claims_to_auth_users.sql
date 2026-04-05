-- Performance and access-control hardening:
-- Keep auth user metadata in sync with profile role/status flags so middleware
-- can rely on JWT claims and avoid per-request profile lookups.

create or replace function public.sync_profile_claims_to_auth_users()
returns trigger
language plpgsql
security definer
set search_path = public, auth
as $$
begin
  update auth.users
  set raw_user_meta_data =
    coalesce(raw_user_meta_data, '{}'::jsonb)
    || jsonb_build_object(
      'full_name', coalesce(new.full_name, raw_user_meta_data ->> 'full_name'),
      'role', coalesce(new.role, 'user'),
      'account_status', coalesce(new.account_status, 'active'),
      'is_premium', coalesce(new.is_premium, false)
    )
  where id = new.id;

  return new;
end;
$$;

drop trigger if exists profiles_sync_claims_to_auth_users on public.profiles;
create trigger profiles_sync_claims_to_auth_users
after insert or update of full_name, role, account_status, is_premium
on public.profiles
for each row
execute function public.sync_profile_claims_to_auth_users();

-- Backfill current users once so existing sessions can refresh with correct claims.
update auth.users u
set raw_user_meta_data =
  coalesce(u.raw_user_meta_data, '{}'::jsonb)
  || jsonb_build_object(
    'full_name', coalesce(p.full_name, u.raw_user_meta_data ->> 'full_name'),
    'role', coalesce(p.role, 'user'),
    'account_status', coalesce(p.account_status, 'active'),
    'is_premium', coalesce(p.is_premium, false)
  )
from public.profiles p
where p.id = u.id;
