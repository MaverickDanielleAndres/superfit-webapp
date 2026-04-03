alter table public.profiles
    add column if not exists email text,
    add column if not exists role text,
    add column if not exists onboarding_complete boolean default false,
    add column if not exists age integer,
    add column if not exists sex text,
    add column if not exists height_cm numeric,
    add column if not exists current_weight_kg numeric,
    add column if not exists goal_weight_kg numeric,
    add column if not exists goal text,
    add column if not exists activity_level text,
    add column if not exists weekly_workouts integer,
    add column if not exists session_duration integer,
    add column if not exists dietary_preference text,
    add column if not exists exercise_preferences text[],
    add column if not exists measurement_system text,
    add column if not exists timezone text,
    add column if not exists bmr numeric,
    add column if not exists tdee numeric,
    add column if not exists daily_calorie_target integer,
    add column if not exists protein_target integer,
    add column if not exists carb_target integer,
    add column if not exists fat_target integer,
    add column if not exists fiber_target integer,
    add column if not exists water_target_ml integer;

alter table public.profiles
    alter column exercise_preferences set default '{}'::text[];

update public.profiles
set timezone = coalesce(timezone, 'UTC')
where timezone is null;

do $$
begin
    if exists (
        select 1 from information_schema.columns
        where table_schema = 'public' and table_name = 'profiles' and column_name = 'onboarding_completed'
    ) then
        execute '
            update public.profiles
            set onboarding_complete = coalesce(onboarding_complete, onboarding_completed, false)
            where onboarding_complete is null
        ';
    end if;
end $$;

do $$
begin
    if exists (
        select 1 from information_schema.columns
        where table_schema = 'public' and table_name = 'profiles' and column_name = 'weight_kg'
    ) then
        execute '
            update public.profiles
            set current_weight_kg = coalesce(current_weight_kg, weight_kg)
            where current_weight_kg is null
        ';
    end if;
end $$;

do $$
begin
    if exists (select 1 from pg_type where typname = 'activity_level') then
        execute 'alter type activity_level add value if not exists ''light''';
        execute 'alter type activity_level add value if not exists ''moderate''';
    end if;
exception
    when duplicate_object then null;
end $$;
