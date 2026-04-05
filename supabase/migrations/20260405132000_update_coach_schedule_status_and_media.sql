-- Allow postponed schedule status and add optional event metadata for coach calendar UX.

alter table if exists public.coach_schedule_events
  add column if not exists label text,
  add column if not exists image_url text;

do $$
begin
  if exists (
    select 1
    from pg_constraint
    where conname = 'coach_schedule_events_status_check'
      and conrelid = 'public.coach_schedule_events'::regclass
  ) then
    alter table public.coach_schedule_events
      drop constraint coach_schedule_events_status_check;
  end if;
end $$;

alter table public.coach_schedule_events
  add constraint coach_schedule_events_status_check
  check (status in ('scheduled', 'postponed', 'completed', 'cancelled'));
