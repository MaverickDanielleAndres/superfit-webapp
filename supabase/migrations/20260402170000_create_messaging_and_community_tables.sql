-- Description: Add messaging and community persistence tables
-- Author: Copilot
-- Date: 2026-04-02

-- ============================================================
-- Messaging tables
-- ============================================================

create table if not exists public.message_threads (
  id uuid primary key default gen_random_uuid(),
  created_by uuid references public.profiles(id) on delete set null,
  is_group boolean not null default false,
  group_name text,
  group_avatar text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists message_threads_created_by_idx
  on public.message_threads (created_by);

create table if not exists public.message_thread_participants (
  thread_id uuid not null references public.message_threads(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  joined_at timestamptz not null default now(),
  last_read_at timestamptz not null default now(),
  primary key (thread_id, user_id)
);

create index if not exists message_thread_participants_user_id_idx
  on public.message_thread_participants (user_id);

create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  thread_id uuid not null references public.message_threads(id) on delete cascade,
  sender_id uuid not null references public.profiles(id) on delete cascade,
  text text not null default '',
  attachments jsonb not null default '[]'::jsonb,
  reply_to_id uuid references public.messages(id) on delete set null,
  status text not null default 'sent' check (status in ('sent', 'delivered', 'read')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists messages_thread_id_created_at_idx
  on public.messages (thread_id, created_at desc);

create index if not exists messages_sender_id_idx
  on public.messages (sender_id);

create table if not exists public.message_reactions (
  message_id uuid not null references public.messages(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  emoji text not null,
  created_at timestamptz not null default now(),
  primary key (message_id, user_id, emoji)
);

create index if not exists message_reactions_message_id_idx
  on public.message_reactions (message_id);

-- ============================================================
-- Community tables
-- ============================================================

create table if not exists public.community_posts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  content text not null,
  post_type text not null default 'text',
  media_urls text[] not null default '{}'::text[],
  poll jsonb,
  workout_ref jsonb,
  meal_ref jsonb,
  pr_ref jsonb,
  parent_id uuid references public.community_posts(id) on delete cascade,
  repost_of_id uuid references public.community_posts(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create index if not exists community_posts_user_id_idx
  on public.community_posts (user_id);

create index if not exists community_posts_created_at_idx
  on public.community_posts (created_at desc);

create index if not exists community_posts_parent_id_idx
  on public.community_posts (parent_id);

create index if not exists community_posts_repost_of_id_idx
  on public.community_posts (repost_of_id);

create table if not exists public.community_post_likes (
  post_id uuid not null references public.community_posts(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (post_id, user_id)
);

create index if not exists community_post_likes_user_id_idx
  on public.community_post_likes (user_id);

-- ============================================================
-- Updated-at triggers
-- ============================================================

drop trigger if exists message_threads_updated_at on public.message_threads;
create trigger message_threads_updated_at
  before update on public.message_threads
  for each row
  execute function public.update_updated_at_column();

drop trigger if exists messages_updated_at on public.messages;
create trigger messages_updated_at
  before update on public.messages
  for each row
  execute function public.update_updated_at_column();

drop trigger if exists community_posts_updated_at on public.community_posts;
create trigger community_posts_updated_at
  before update on public.community_posts
  for each row
  execute function public.update_updated_at_column();

-- ============================================================
-- Row Level Security
-- ============================================================

alter table public.message_threads enable row level security;
alter table public.message_thread_participants enable row level security;
alter table public.messages enable row level security;
alter table public.message_reactions enable row level security;
alter table public.community_posts enable row level security;
alter table public.community_post_likes enable row level security;

-- message_threads policies

drop policy if exists "Users read own threads" on public.message_threads;
create policy "Users read own threads"
  on public.message_threads
  for select
  using (
    exists (
      select 1
      from public.message_thread_participants p
      where p.thread_id = message_threads.id
        and p.user_id = auth.uid()
    )
  );

drop policy if exists "Users create threads" on public.message_threads;
create policy "Users create threads"
  on public.message_threads
  for insert
  with check (created_by = auth.uid());

drop policy if exists "Thread participants can update thread metadata" on public.message_threads;
create policy "Thread participants can update thread metadata"
  on public.message_threads
  for update
  using (
    exists (
      select 1
      from public.message_thread_participants p
      where p.thread_id = message_threads.id
        and p.user_id = auth.uid()
    )
  );

-- message_thread_participants policies

drop policy if exists "Users read participants for their threads" on public.message_thread_participants;
create policy "Users read participants for their threads"
  on public.message_thread_participants
  for select
  using (
    user_id = auth.uid()
    or exists (
      select 1
      from public.message_thread_participants p
      where p.thread_id = message_thread_participants.thread_id
        and p.user_id = auth.uid()
    )
  );

drop policy if exists "Users add participants to own threads" on public.message_thread_participants;
create policy "Users add participants to own threads"
  on public.message_thread_participants
  for insert
  with check (
    auth.uid() = user_id
    or exists (
      select 1
      from public.message_thread_participants p
      where p.thread_id = message_thread_participants.thread_id
        and p.user_id = auth.uid()
    )
  );

drop policy if exists "Users update own participant state" on public.message_thread_participants;
create policy "Users update own participant state"
  on public.message_thread_participants
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- messages policies

drop policy if exists "Users read messages in own threads" on public.messages;
create policy "Users read messages in own threads"
  on public.messages
  for select
  using (
    exists (
      select 1
      from public.message_thread_participants p
      where p.thread_id = messages.thread_id
        and p.user_id = auth.uid()
    )
  );

drop policy if exists "Users send messages in own threads" on public.messages;
create policy "Users send messages in own threads"
  on public.messages
  for insert
  with check (
    sender_id = auth.uid()
    and exists (
      select 1
      from public.message_thread_participants p
      where p.thread_id = messages.thread_id
        and p.user_id = auth.uid()
    )
  );

drop policy if exists "Users update own messages" on public.messages;
create policy "Users update own messages"
  on public.messages
  for update
  using (sender_id = auth.uid())
  with check (sender_id = auth.uid());

drop policy if exists "Users delete own messages" on public.messages;
create policy "Users delete own messages"
  on public.messages
  for delete
  using (sender_id = auth.uid());

-- message_reactions policies

drop policy if exists "Users read reactions in own threads" on public.message_reactions;
create policy "Users read reactions in own threads"
  on public.message_reactions
  for select
  using (
    exists (
      select 1
      from public.messages m
      join public.message_thread_participants p on p.thread_id = m.thread_id
      where m.id = message_reactions.message_id
        and p.user_id = auth.uid()
    )
  );

drop policy if exists "Users add own reactions" on public.message_reactions;
create policy "Users add own reactions"
  on public.message_reactions
  for insert
  with check (
    user_id = auth.uid()
    and exists (
      select 1
      from public.messages m
      join public.message_thread_participants p on p.thread_id = m.thread_id
      where m.id = message_reactions.message_id
        and p.user_id = auth.uid()
    )
  );

drop policy if exists "Users remove own reactions" on public.message_reactions;
create policy "Users remove own reactions"
  on public.message_reactions
  for delete
  using (user_id = auth.uid());

-- community_posts policies

drop policy if exists "Anyone can read community posts" on public.community_posts;
create policy "Anyone can read community posts"
  on public.community_posts
  for select
  using (deleted_at is null);

drop policy if exists "Users create own community posts" on public.community_posts;
create policy "Users create own community posts"
  on public.community_posts
  for insert
  with check (user_id = auth.uid());

drop policy if exists "Users update own community posts" on public.community_posts;
create policy "Users update own community posts"
  on public.community_posts
  for update
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

drop policy if exists "Users delete own community posts" on public.community_posts;
create policy "Users delete own community posts"
  on public.community_posts
  for delete
  using (user_id = auth.uid());

-- community_post_likes policies

drop policy if exists "Anyone can read community likes" on public.community_post_likes;
create policy "Anyone can read community likes"
  on public.community_post_likes
  for select
  using (true);

drop policy if exists "Users add own community likes" on public.community_post_likes;
create policy "Users add own community likes"
  on public.community_post_likes
  for insert
  with check (user_id = auth.uid());

drop policy if exists "Users remove own community likes" on public.community_post_likes;
create policy "Users remove own community likes"
  on public.community_post_likes
  for delete
  using (user_id = auth.uid());
