-- Description: Ensure realtime publication includes notifications, messaging, and follow/feed activity tables
-- Author: Copilot
-- Date: 2026-04-05

do $$
declare
  tbl text;
  realtime_tables text[] := array[
    'notifications',
    'messages',
    'message_thread_participants',
    'message_reactions',
    'user_follows',
    'community_posts',
    'community_post_likes'
  ];
begin
  if not exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    create publication supabase_realtime;
  end if;

  foreach tbl in array realtime_tables
  loop
    if exists (
      select 1
      from pg_tables
      where schemaname = 'public'
        and tablename = tbl
    ) and not exists (
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
