-- Description: Fix recursive RLS policy evaluation on message_thread_participants
-- Author: Copilot
-- Date: 2026-04-05

create or replace function public.user_participates_in_thread(
  p_thread_id uuid,
  p_user_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.message_thread_participants p
    where p.thread_id = p_thread_id
      and p.user_id = p_user_id
  );
$$;

revoke all on function public.user_participates_in_thread(uuid, uuid) from public;
grant execute on function public.user_participates_in_thread(uuid, uuid) to authenticated;
grant execute on function public.user_participates_in_thread(uuid, uuid) to anon;

drop policy if exists "Users read participants for their threads" on public.message_thread_participants;
create policy "Users read participants for their threads"
  on public.message_thread_participants
  for select
  using (
    user_id = auth.uid()
    or public.user_participates_in_thread(thread_id, auth.uid())
    or public.is_admin(auth.uid())
  );

drop policy if exists "Users add participants to own threads" on public.message_thread_participants;
create policy "Users add participants to own threads"
  on public.message_thread_participants
  for insert
  with check (
    auth.uid() = user_id
    or public.user_participates_in_thread(thread_id, auth.uid())
    or public.is_admin(auth.uid())
  );
