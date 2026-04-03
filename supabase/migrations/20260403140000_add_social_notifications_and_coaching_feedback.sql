-- Description: Add friendships, notifications, coaching reviews/tags, and global premium unlock
-- Author: Copilot
-- Date: 2026-04-03

-- ============================================================
-- Friendships
-- ============================================================

create table if not exists public.user_friendships (
  id uuid primary key default gen_random_uuid(),
  requester_id uuid not null references public.profiles(id) on delete cascade,
  addressee_id uuid not null references public.profiles(id) on delete cascade,
  status text not null default 'pending' check (status in ('pending', 'accepted', 'blocked', 'declined', 'cancelled')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  responded_at timestamptz,
  unique (requester_id, addressee_id),
  check (requester_id <> addressee_id)
);

create index if not exists user_friendships_requester_idx
  on public.user_friendships (requester_id, status, updated_at desc);

create index if not exists user_friendships_addressee_idx
  on public.user_friendships (addressee_id, status, updated_at desc);

create index if not exists user_friendships_status_idx
  on public.user_friendships (status, updated_at desc);

-- ============================================================
-- Notifications
-- ============================================================

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  recipient_id uuid not null references public.profiles(id) on delete cascade,
  actor_id uuid references public.profiles(id) on delete set null,
  type text not null,
  title text not null,
  body text not null,
  action_url text,
  payload jsonb not null default '{}'::jsonb,
  delivered_at timestamptz,
  read_at timestamptz,
  seen_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists notifications_recipient_created_idx
  on public.notifications (recipient_id, created_at desc);

create index if not exists notifications_unread_idx
  on public.notifications (recipient_id, read_at, created_at desc);

-- ============================================================
-- Coaching reviews and tags
-- ============================================================

create table if not exists public.coach_reviews (
  id uuid primary key default gen_random_uuid(),
  coach_id uuid not null references public.profiles(id) on delete cascade,
  reviewer_id uuid not null references public.profiles(id) on delete cascade,
  rating smallint not null check (rating between 1 and 5),
  title text,
  comment text,
  is_public boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (coach_id, reviewer_id)
);

create index if not exists coach_reviews_coach_idx
  on public.coach_reviews (coach_id, created_at desc);

create index if not exists coach_reviews_reviewer_idx
  on public.coach_reviews (reviewer_id, created_at desc);

create table if not exists public.coach_review_replies (
  id uuid primary key default gen_random_uuid(),
  review_id uuid not null references public.coach_reviews(id) on delete cascade,
  coach_id uuid not null references public.profiles(id) on delete cascade,
  body text not null,
  created_at timestamptz not null default now(),
  unique (review_id)
);

create index if not exists coach_review_replies_review_idx
  on public.coach_review_replies (review_id);

create table if not exists public.coach_content_tags (
  id uuid primary key default gen_random_uuid(),
  coach_id uuid not null references public.profiles(id) on delete cascade,
  label text not null,
  slug text not null,
  created_at timestamptz not null default now(),
  unique (coach_id, slug)
);

create index if not exists coach_content_tags_coach_idx
  on public.coach_content_tags (coach_id, created_at desc);

create table if not exists public.coach_content_tag_links (
  tag_id uuid not null references public.coach_content_tags(id) on delete cascade,
  post_id uuid not null references public.community_posts(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (tag_id, post_id)
);

create index if not exists coach_content_tag_links_post_idx
  on public.coach_content_tag_links (post_id);

-- ============================================================
-- Updated-at triggers
-- ============================================================

drop trigger if exists user_friendships_updated_at on public.user_friendships;
create trigger user_friendships_updated_at
  before update on public.user_friendships
  for each row
  execute function public.update_updated_at_column();

drop trigger if exists coach_reviews_updated_at on public.coach_reviews;
create trigger coach_reviews_updated_at
  before update on public.coach_reviews
  for each row
  execute function public.update_updated_at_column();

-- ============================================================
-- RLS
-- ============================================================

alter table public.user_friendships enable row level security;
alter table public.notifications enable row level security;
alter table public.coach_reviews enable row level security;
alter table public.coach_review_replies enable row level security;
alter table public.coach_content_tags enable row level security;
alter table public.coach_content_tag_links enable row level security;

-- user_friendships policies

drop policy if exists "Users read own friendships" on public.user_friendships;
create policy "Users read own friendships"
  on public.user_friendships
  for select
  using (requester_id = auth.uid() or addressee_id = auth.uid());

drop policy if exists "Users create own friendship requests" on public.user_friendships;
create policy "Users create own friendship requests"
  on public.user_friendships
  for insert
  with check (requester_id = auth.uid());

drop policy if exists "Users update own friendship rows" on public.user_friendships;
create policy "Users update own friendship rows"
  on public.user_friendships
  for update
  using (requester_id = auth.uid() or addressee_id = auth.uid())
  with check (requester_id = auth.uid() or addressee_id = auth.uid());

drop policy if exists "Users delete own friendship rows" on public.user_friendships;
create policy "Users delete own friendship rows"
  on public.user_friendships
  for delete
  using (requester_id = auth.uid() or addressee_id = auth.uid());

-- notifications policies

drop policy if exists "Recipients read own notifications" on public.notifications;
create policy "Recipients read own notifications"
  on public.notifications
  for select
  using (recipient_id = auth.uid());

drop policy if exists "Users update own notifications" on public.notifications;
create policy "Users update own notifications"
  on public.notifications
  for update
  using (recipient_id = auth.uid())
  with check (recipient_id = auth.uid());

drop policy if exists "System inserts notifications" on public.notifications;
create policy "System inserts notifications"
  on public.notifications
  for insert
  with check (recipient_id is not null);

-- coach_reviews policies

drop policy if exists "Anyone reads public coach reviews" on public.coach_reviews;
create policy "Anyone reads public coach reviews"
  on public.coach_reviews
  for select
  using (is_public = true or reviewer_id = auth.uid() or coach_id = auth.uid());

drop policy if exists "Users create own coach review" on public.coach_reviews;
create policy "Users create own coach review"
  on public.coach_reviews
  for insert
  with check (reviewer_id = auth.uid());

drop policy if exists "Users update own coach review" on public.coach_reviews;
create policy "Users update own coach review"
  on public.coach_reviews
  for update
  using (reviewer_id = auth.uid())
  with check (reviewer_id = auth.uid());

drop policy if exists "Users delete own coach review" on public.coach_reviews;
create policy "Users delete own coach review"
  on public.coach_reviews
  for delete
  using (reviewer_id = auth.uid());

-- coach_review_replies policies

drop policy if exists "Anyone reads coach review replies" on public.coach_review_replies;
create policy "Anyone reads coach review replies"
  on public.coach_review_replies
  for select
  using (true);

drop policy if exists "Coach writes own review replies" on public.coach_review_replies;
create policy "Coach writes own review replies"
  on public.coach_review_replies
  for insert
  with check (coach_id = auth.uid());

drop policy if exists "Coach updates own review replies" on public.coach_review_replies;
create policy "Coach updates own review replies"
  on public.coach_review_replies
  for update
  using (coach_id = auth.uid())
  with check (coach_id = auth.uid());

drop policy if exists "Coach deletes own review replies" on public.coach_review_replies;
create policy "Coach deletes own review replies"
  on public.coach_review_replies
  for delete
  using (coach_id = auth.uid());

-- coach_content_tags policies

drop policy if exists "Anyone reads coach tags" on public.coach_content_tags;
create policy "Anyone reads coach tags"
  on public.coach_content_tags
  for select
  using (true);

drop policy if exists "Coach manages own tags" on public.coach_content_tags;
create policy "Coach manages own tags"
  on public.coach_content_tags
  for all
  using (coach_id = auth.uid())
  with check (coach_id = auth.uid());

-- coach_content_tag_links policies

drop policy if exists "Anyone reads coach tag links" on public.coach_content_tag_links;
create policy "Anyone reads coach tag links"
  on public.coach_content_tag_links
  for select
  using (true);

drop policy if exists "Coach manages own tag links" on public.coach_content_tag_links;
create policy "Coach manages own tag links"
  on public.coach_content_tag_links
  for all
  using (
    exists (
      select 1
      from public.coach_content_tags t
      where t.id = coach_content_tag_links.tag_id
        and t.coach_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1
      from public.coach_content_tags t
      where t.id = coach_content_tag_links.tag_id
        and t.coach_id = auth.uid()
    )
  );

-- ============================================================
-- Global premium unlock for user + coach roles
-- ============================================================

update public.profiles
set is_premium = true,
    updated_at = now()
where role in ('user', 'coach')
  and coalesce(is_premium, false) = false;
