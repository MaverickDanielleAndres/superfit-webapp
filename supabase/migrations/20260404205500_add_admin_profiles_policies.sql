-- Description: Allow admins to read/update profiles for admin user management and realtime visibility
-- Author: Copilot
-- Date: 2026-04-04

drop policy if exists "Admins read all profiles" on public.profiles;
create policy "Admins read all profiles"
  on public.profiles
  for select
  using (public.is_admin(auth.uid()));

drop policy if exists "Admins update profiles" on public.profiles;
create policy "Admins update profiles"
  on public.profiles
  for update
  using (public.is_admin(auth.uid()))
  with check (public.is_admin(auth.uid()));
