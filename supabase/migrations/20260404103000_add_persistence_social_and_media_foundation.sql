-- Description: Add settings persistence, calculator drafts, follows, exercise logs, and nutrition media metadata
-- Author: Copilot
-- Date: 2026-04-04

-- ============================================================
-- Profiles parity fields for settings
-- ============================================================

alter table public.profiles
  add column if not exists measurement_system text not null default 'metric' check (measurement_system in ('metric', 'imperial')),
  add column if not exists timezone text;

-- ============================================================
-- Profile settings table (non-auth settings)
-- ============================================================

create table if not exists public.profile_settings (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  profile_visibility text not null default 'public' check (profile_visibility in ('public', 'friends_only', 'private')),
  share_workouts boolean not null default true,
  share_weight_data boolean not null default false,
  week_start text not null default 'monday' check (week_start in ('monday', 'sunday')),
  integrations jsonb not null default '{}'::jsonb,
  two_factor_enabled boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists profile_settings_updated_at on public.profile_settings;
create trigger profile_settings_updated_at
  before update on public.profile_settings
  for each row
  execute function public.update_updated_at_column();

alter table public.profile_settings enable row level security;

drop policy if exists "Users can read own profile settings" on public.profile_settings;
create policy "Users can read own profile settings"
  on public.profile_settings
  for select
  using (auth.uid() = user_id);

drop policy if exists "Users can insert own profile settings" on public.profile_settings;
create policy "Users can insert own profile settings"
  on public.profile_settings
  for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users can update own profile settings" on public.profile_settings;
create policy "Users can update own profile settings"
  on public.profile_settings
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Users can delete own profile settings" on public.profile_settings;
create policy "Users can delete own profile settings"
  on public.profile_settings
  for delete
  using (auth.uid() = user_id);

-- ============================================================
-- Calculator response persistence
-- ============================================================

create table if not exists public.user_calculator_responses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  calculator_type text not null check (calculator_type in ('bmi', 'protein', 'creatine', 'deficit', 'water')),
  wizard_step integer not null default 1 check (wizard_step >= 0),
  responses jsonb not null default '{}'::jsonb,
  result jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, calculator_type)
);

create index if not exists user_calculator_responses_user_updated_idx
  on public.user_calculator_responses (user_id, updated_at desc);

drop trigger if exists user_calculator_responses_updated_at on public.user_calculator_responses;
create trigger user_calculator_responses_updated_at
  before update on public.user_calculator_responses
  for each row
  execute function public.update_updated_at_column();

alter table public.user_calculator_responses enable row level security;

drop policy if exists "Users can read own calculator responses" on public.user_calculator_responses;
create policy "Users can read own calculator responses"
  on public.user_calculator_responses
  for select
  using (auth.uid() = user_id);

drop policy if exists "Users can insert own calculator responses" on public.user_calculator_responses;
create policy "Users can insert own calculator responses"
  on public.user_calculator_responses
  for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users can update own calculator responses" on public.user_calculator_responses;
create policy "Users can update own calculator responses"
  on public.user_calculator_responses
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Users can delete own calculator responses" on public.user_calculator_responses;
create policy "Users can delete own calculator responses"
  on public.user_calculator_responses
  for delete
  using (auth.uid() = user_id);

-- ============================================================
-- Following graph (one-way follow)
-- ============================================================

create table if not exists public.user_follows (
  follower_id uuid not null references public.profiles(id) on delete cascade,
  followee_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (follower_id, followee_id),
  check (follower_id <> followee_id)
);

create index if not exists user_follows_followee_created_idx
  on public.user_follows (followee_id, created_at desc);

alter table public.user_follows enable row level security;

drop policy if exists "Authenticated users can read follows" on public.user_follows;
create policy "Authenticated users can read follows"
  on public.user_follows
  for select
  using (auth.uid() is not null);

drop policy if exists "Users can insert own follows" on public.user_follows;
create policy "Users can insert own follows"
  on public.user_follows
  for insert
  with check (auth.uid() = follower_id);

drop policy if exists "Users can delete own follows" on public.user_follows;
create policy "Users can delete own follows"
  on public.user_follows
  for delete
  using (auth.uid() = follower_id);

-- ============================================================
-- Exercise logs for analytics and cross-page linking
-- ============================================================

create table if not exists public.exercise_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  workout_session_id uuid not null references public.workout_sessions(id) on delete cascade,
  exercise_id text,
  exercise_name text not null,
  set_number integer not null check (set_number > 0),
  weight numeric,
  reps integer,
  rpe numeric,
  completed boolean not null default false,
  logged_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create index if not exists exercise_logs_user_logged_idx
  on public.exercise_logs (user_id, logged_at desc);

create index if not exists exercise_logs_user_exercise_logged_idx
  on public.exercise_logs (user_id, exercise_name, logged_at desc);

create index if not exists exercise_logs_session_idx
  on public.exercise_logs (workout_session_id);

alter table public.exercise_logs enable row level security;

drop policy if exists "Users can read own exercise logs" on public.exercise_logs;
create policy "Users can read own exercise logs"
  on public.exercise_logs
  for select
  using (auth.uid() = user_id);

drop policy if exists "Users can insert own exercise logs" on public.exercise_logs;
create policy "Users can insert own exercise logs"
  on public.exercise_logs
  for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users can update own exercise logs" on public.exercise_logs;
create policy "Users can update own exercise logs"
  on public.exercise_logs
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Users can delete own exercise logs" on public.exercise_logs;
create policy "Users can delete own exercise logs"
  on public.exercise_logs
  for delete
  using (auth.uid() = user_id);

-- ============================================================
-- Nutrition media metadata and AI scan logs
-- ============================================================

alter table public.nutrition_entries
  add column if not exists image_url text,
  add column if not exists image_source text check (image_source in ('manual_upload', 'ai_scan', 'food_api')),
  add column if not exists is_ai_generated boolean not null default false,
  add column if not exists scan_metadata jsonb;

create table if not exists public.nutrition_scan_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  nutrition_entry_id uuid references public.nutrition_entries(id) on delete set null,
  image_path text,
  image_url text,
  source_type text not null default 'upload' check (source_type in ('upload', 'camera')),
  vision_hints text[] not null default '{}'::text[],
  confidence_score numeric,
  provider text,
  response_payload jsonb,
  created_at timestamptz not null default now()
);

create index if not exists nutrition_scan_logs_user_created_idx
  on public.nutrition_scan_logs (user_id, created_at desc);

create index if not exists nutrition_scan_logs_entry_idx
  on public.nutrition_scan_logs (nutrition_entry_id);

alter table public.nutrition_scan_logs enable row level security;

drop policy if exists "Users can read own nutrition scan logs" on public.nutrition_scan_logs;
create policy "Users can read own nutrition scan logs"
  on public.nutrition_scan_logs
  for select
  using (auth.uid() = user_id);

drop policy if exists "Users can insert own nutrition scan logs" on public.nutrition_scan_logs;
create policy "Users can insert own nutrition scan logs"
  on public.nutrition_scan_logs
  for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users can update own nutrition scan logs" on public.nutrition_scan_logs;
create policy "Users can update own nutrition scan logs"
  on public.nutrition_scan_logs
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Users can delete own nutrition scan logs" on public.nutrition_scan_logs;
create policy "Users can delete own nutrition scan logs"
  on public.nutrition_scan_logs
  for delete
  using (auth.uid() = user_id);

-- ============================================================
-- Storage bucket for nutrition images
-- ============================================================

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'nutrition-images',
  'nutrition-images',
  true,
  5242880,
  array['image/png', 'image/jpeg', 'image/jpg', 'image/webp']
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Public read nutrition images" on storage.objects;
create policy "Public read nutrition images"
  on storage.objects
  for select
  using (bucket_id = 'nutrition-images');

drop policy if exists "Users upload own nutrition images" on storage.objects;
create policy "Users upload own nutrition images"
  on storage.objects
  for insert
  with check (
    bucket_id = 'nutrition-images'
    and auth.uid()::text = split_part(name, '/', 1)
  );

drop policy if exists "Users update own nutrition images" on storage.objects;
create policy "Users update own nutrition images"
  on storage.objects
  for update
  using (
    bucket_id = 'nutrition-images'
    and auth.uid()::text = split_part(name, '/', 1)
  )
  with check (
    bucket_id = 'nutrition-images'
    and auth.uid()::text = split_part(name, '/', 1)
  );

drop policy if exists "Users delete own nutrition images" on storage.objects;
create policy "Users delete own nutrition images"
  on storage.objects
  for delete
  using (
    bucket_id = 'nutrition-images'
    and auth.uid()::text = split_part(name, '/', 1)
  );