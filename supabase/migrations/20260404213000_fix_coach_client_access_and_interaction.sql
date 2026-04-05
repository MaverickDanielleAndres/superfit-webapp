-- Description: Fix coach-client profile access and add interaction eligibility helpers
-- Author: Copilot
-- Date: 2026-04-04

-- Allow coaches/clients with an active link to read each other's profile basics.
drop policy if exists "Coaches read linked profiles" on public.profiles;
create policy "Coaches read linked profiles"
  on public.profiles
  for select
  using (
    auth.uid() = id
    or public.is_admin(auth.uid())
    or exists (
      select 1
      from public.coach_client_links ccl
      where ccl.status = 'active'
        and (
          (ccl.coach_id = auth.uid() and ccl.client_id = profiles.id)
          or (ccl.client_id = auth.uid() and ccl.coach_id = profiles.id)
        )
    )
  );

-- Fast paths for add-client eligibility checks and summary queries.
create index if not exists coach_program_assignments_coach_client_idx
  on public.coach_program_assignments (coach_id, client_id);

create index if not exists coach_form_assignments_coach_client_idx
  on public.coach_form_assignments (coach_id, client_id);

create index if not exists coach_form_submissions_coach_client_idx
  on public.coach_form_submissions (coach_id, client_id);

create index if not exists coach_schedule_events_coach_client_idx
  on public.coach_schedule_events (coach_id, client_id);

create index if not exists message_thread_participants_user_thread_idx
  on public.message_thread_participants (user_id, thread_id);

-- Returns true when a coach has any valid prior interaction with a client.
create or replace function public.coach_has_client_interaction(
  p_coach_id uuid,
  p_client_id uuid
)
returns boolean
language sql
stable
as $$
  select
    p_coach_id is not null
    and p_client_id is not null
    and p_coach_id <> p_client_id
    and (
      exists (
        select 1
        from public.message_thread_participants coach_participant
        join public.message_thread_participants client_participant
          on client_participant.thread_id = coach_participant.thread_id
        where coach_participant.user_id = p_coach_id
          and client_participant.user_id = p_client_id
      )
      or exists (
        select 1
        from public.coach_program_assignments cpa
        where cpa.coach_id = p_coach_id
          and cpa.client_id = p_client_id
      )
      or exists (
        select 1
        from public.coach_form_assignments cfa
        where cfa.coach_id = p_coach_id
          and cfa.client_id = p_client_id
      )
      or exists (
        select 1
        from public.coach_form_submissions cfs
        where cfs.coach_id = p_coach_id
          and cfs.client_id = p_client_id
      )
      or exists (
        select 1
        from public.coach_schedule_events cse
        where cse.coach_id = p_coach_id
          and cse.client_id = p_client_id
      )
    );
$$;
