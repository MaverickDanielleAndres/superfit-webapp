create table if not exists public.workout_sessions (
    id text primary key default gen_random_uuid()::text,
    created_at timestamptz not null default now(),
    user_id uuid not null references public.profiles(id) on delete cascade,
    name text not null,
    date date not null,
    start_time timestamptz not null,
    end_time timestamptz,
    duration integer,
    exercises jsonb not null default '[]'::jsonb,
    total_volume numeric not null default 0,
    calories integer,
    notes text,
    is_completed boolean not null default false,
    routine_id text,
    is_template boolean not null default false
);

alter table public.workout_sessions
    add column if not exists date date,
    add column if not exists start_time timestamptz,
    add column if not exists end_time timestamptz,
    add column if not exists duration integer,
    add column if not exists exercises jsonb not null default '[]'::jsonb,
    add column if not exists total_volume numeric not null default 0,
    add column if not exists calories integer,
    add column if not exists is_completed boolean not null default false,
    add column if not exists routine_id text,
    add column if not exists is_template boolean not null default false;

do $$
begin
    if exists (
            select 1
            from information_schema.columns
            where table_schema = 'public' and table_name = 'workout_sessions' and column_name = 'started_at'
    ) then
        execute $sql$
            update public.workout_sessions
            set
                    date = coalesce(date, started_at::date),
                    start_time = coalesce(start_time, started_at),
                    end_time = coalesce(end_time, ended_at),
                    duration = coalesce(duration, duration_seconds),
                    is_completed = coalesce(is_completed, ended_at is not null),
                    routine_id = coalesce(routine_id, template_id::text)
            where
                    date is null
                    or start_time is null
                    or end_time is null
                    or duration is null
                    or routine_id is null
        $sql$;
    end if;
end $$;

create index if not exists idx_workout_sessions_user_id on public.workout_sessions(user_id);
create index if not exists idx_workout_sessions_start_time on public.workout_sessions(start_time desc);
create index if not exists idx_workout_sessions_user_start_time on public.workout_sessions(user_id, start_time desc);

alter table public.workout_sessions enable row level security;

drop policy if exists "Users can read own workout sessions" on public.workout_sessions;
create policy "Users can read own workout sessions"
on public.workout_sessions
for select
using (auth.uid() = user_id);

drop policy if exists "Users can insert own workout sessions" on public.workout_sessions;
create policy "Users can insert own workout sessions"
on public.workout_sessions
for insert
with check (auth.uid() = user_id);

drop policy if exists "Users can update own workout sessions" on public.workout_sessions;
create policy "Users can update own workout sessions"
on public.workout_sessions
for update
using (auth.uid() = user_id);

drop policy if exists "Users can delete own workout sessions" on public.workout_sessions;
create policy "Users can delete own workout sessions"
on public.workout_sessions
for delete
using (auth.uid() = user_id);
