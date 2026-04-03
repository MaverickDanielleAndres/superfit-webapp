-- Description: Seed auth users for client, coach, and admin
-- Author: Copilot
-- Date: 2026-04-03

-- This migration creates email/password users directly in auth schema
-- for local/dev testing and ensures corresponding profile roles exist.

do $$
declare
  v_client_email text := 'client@superfit.com';
  v_client_password text := 'client123';
  v_client_name text := 'Client User';

  v_coach_email text := 'coach@superfit.com';
  v_coach_password text := 'coach123';
  v_coach_name text := 'Coach User';

  v_admin_email text := 'admin@superfit.com';
  v_admin_password text := 'admin123';
  v_admin_name text := 'Admin User';

  v_client_id uuid;
  v_coach_id uuid;
  v_admin_id uuid;

  v_now timestamptz := now();
begin
  -- CLIENT
  select id into v_client_id
  from auth.users
  where lower(email) = lower(v_client_email)
  limit 1;

  if v_client_id is null then
    v_client_id := gen_random_uuid();

    insert into auth.users (
      id,
      instance_id,
      aud,
      role,
      email,
      encrypted_password,
      email_confirmed_at,
      confirmation_token,
      email_change,
      email_change_token_new,
      recovery_token,
      raw_app_meta_data,
      raw_user_meta_data,
      created_at,
      updated_at
    )
    values (
      v_client_id,
      '00000000-0000-0000-0000-000000000000'::uuid,
      'authenticated',
      'authenticated',
      v_client_email,
      crypt(v_client_password, gen_salt('bf')),
      v_now,
      '',
      '',
      '',
      '',
      '{"provider":"email","providers":["email"]}'::jsonb,
      jsonb_build_object('full_name', v_client_name),
      v_now,
      v_now
    );
  end if;

  if not exists (
    select 1
    from auth.identities
    where user_id = v_client_id
      and provider = 'email'
  ) then
    insert into auth.identities (
      id,
      user_id,
      identity_data,
      provider,
      provider_id,
      last_sign_in_at,
      created_at,
      updated_at
    )
    values (
      gen_random_uuid(),
      v_client_id,
      jsonb_build_object('sub', v_client_id::text, 'email', v_client_email),
      'email',
      v_client_email,
      v_now,
      v_now,
      v_now
    );
  end if;

  -- COACH
  select id into v_coach_id
  from auth.users
  where lower(email) = lower(v_coach_email)
  limit 1;

  if v_coach_id is null then
    v_coach_id := gen_random_uuid();

    insert into auth.users (
      id,
      instance_id,
      aud,
      role,
      email,
      encrypted_password,
      email_confirmed_at,
      confirmation_token,
      email_change,
      email_change_token_new,
      recovery_token,
      raw_app_meta_data,
      raw_user_meta_data,
      created_at,
      updated_at
    )
    values (
      v_coach_id,
      '00000000-0000-0000-0000-000000000000'::uuid,
      'authenticated',
      'authenticated',
      v_coach_email,
      crypt(v_coach_password, gen_salt('bf')),
      v_now,
      '',
      '',
      '',
      '',
      '{"provider":"email","providers":["email"]}'::jsonb,
      jsonb_build_object('full_name', v_coach_name),
      v_now,
      v_now
    );
  end if;

  if not exists (
    select 1
    from auth.identities
    where user_id = v_coach_id
      and provider = 'email'
  ) then
    insert into auth.identities (
      id,
      user_id,
      identity_data,
      provider,
      provider_id,
      last_sign_in_at,
      created_at,
      updated_at
    )
    values (
      gen_random_uuid(),
      v_coach_id,
      jsonb_build_object('sub', v_coach_id::text, 'email', v_coach_email),
      'email',
      v_coach_email,
      v_now,
      v_now,
      v_now
    );
  end if;

  -- ADMIN
  select id into v_admin_id
  from auth.users
  where lower(email) = lower(v_admin_email)
  limit 1;

  if v_admin_id is null then
    v_admin_id := gen_random_uuid();

    insert into auth.users (
      id,
      instance_id,
      aud,
      role,
      email,
      encrypted_password,
      email_confirmed_at,
      confirmation_token,
      email_change,
      email_change_token_new,
      recovery_token,
      raw_app_meta_data,
      raw_user_meta_data,
      created_at,
      updated_at
    )
    values (
      v_admin_id,
      '00000000-0000-0000-0000-000000000000'::uuid,
      'authenticated',
      'authenticated',
      v_admin_email,
      crypt(v_admin_password, gen_salt('bf')),
      v_now,
      '',
      '',
      '',
      '',
      '{"provider":"email","providers":["email"]}'::jsonb,
      jsonb_build_object('full_name', v_admin_name),
      v_now,
      v_now
    );
  end if;

  if not exists (
    select 1
    from auth.identities
    where user_id = v_admin_id
      and provider = 'email'
  ) then
    insert into auth.identities (
      id,
      user_id,
      identity_data,
      provider,
      provider_id,
      last_sign_in_at,
      created_at,
      updated_at
    )
    values (
      gen_random_uuid(),
      v_admin_id,
      jsonb_build_object('sub', v_admin_id::text, 'email', v_admin_email),
      'email',
      v_admin_email,
      v_now,
      v_now,
      v_now
    );
  end if;

  -- Ensure matching application profiles with expected roles.
  insert into public.profiles (
    id,
    email,
    full_name,
    role,
    account_status,
    is_premium,
    onboarding_complete,
    exercise_preferences,
    goal,
    session_duration
  )
  values
    (
      v_client_id,
      v_client_email,
      v_client_name,
      'user',
      'active',
      false,
      true,
      array['cardio', 'strength']::text[],
      'weight_loss',
      45
    ),
    (
      v_coach_id,
      v_coach_email,
      v_coach_name,
      'coach',
      'active',
      true,
      true,
      array['strength', 'hypertrophy']::text[],
      'Help clients build consistency and strength',
      30
    ),
    (
      v_admin_id,
      v_admin_email,
      v_admin_name,
      'admin',
      'active',
      true,
      true,
      array[]::text[],
      'platform',
      30
    )
  on conflict (id) do update
    set email = excluded.email,
        full_name = excluded.full_name,
        role = excluded.role,
        account_status = excluded.account_status,
        is_premium = excluded.is_premium,
        onboarding_complete = excluded.onboarding_complete,
        exercise_preferences = coalesce(public.profiles.exercise_preferences, excluded.exercise_preferences),
        goal = coalesce(public.profiles.goal, excluded.goal),
        session_duration = coalesce(public.profiles.session_duration, excluded.session_duration);
end $$;
