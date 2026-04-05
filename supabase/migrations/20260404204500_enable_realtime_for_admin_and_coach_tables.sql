-- Description: Ensure admin/coach realtime subscription tables are part of supabase_realtime publication
-- Author: Copilot
-- Date: 2026-04-04

do $$
declare
  tbl text;
  realtime_tables text[] := array[
    'profiles',
    'platform_settings',
    'admin_coach_applications',
    'payment_transactions',
    'admin_moderation_reports',
    'coach_client_links',
    'coach_programs',
    'coach_program_assignments',
    'coach_forms',
    'coach_form_assignments',
    'coach_schedule_events',
    'coach_broadcast_logs'
  ];
begin
  if not exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    create publication supabase_realtime;
  end if;

  foreach tbl in array realtime_tables
  loop
    if not exists (
      select 1
      from pg_publication_tables
      where pubname = 'supabase_realtime'
        and schemaname = 'public'
        and tablename = tbl
    ) then
      execute format('alter publication supabase_realtime add table public.%I', tbl);
    end if;
  end loop;
end $$;
