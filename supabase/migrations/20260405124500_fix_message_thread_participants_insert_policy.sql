-- Description: Allow thread creators to add participants without RLS deadlock
-- Author: Copilot
-- Date: 2026-04-05

create or replace function public.user_owns_thread(
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
    from public.message_threads t
    where t.id = p_thread_id
      and t.created_by = p_user_id
  );
$$;

revoke all on function public.user_owns_thread(uuid, uuid) from public;
grant execute on function public.user_owns_thread(uuid, uuid) to authenticated;
grant execute on function public.user_owns_thread(uuid, uuid) to anon;

drop policy if exists "Users add participants to own threads" on public.message_thread_participants;
create policy "Users add participants to own threads"
  on public.message_thread_participants
  for insert
  with check (
    auth.uid() = user_id
    or public.user_participates_in_thread(thread_id, auth.uid())
    or public.user_owns_thread(thread_id, auth.uid())
    or public.is_admin(auth.uid())
  );
