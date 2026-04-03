-- Description: Ensure seeded auth credentials are valid for client/coach/admin
-- Author: Copilot
-- Date: 2026-04-03

-- Why this exists:
-- If users already existed before seed ran, old passwords may remain and cause
-- "incorrect credentials" during sign-in. This migration force-syncs passwords,
-- identities, and profile roles for the seeded role accounts.

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
  -- ------------------------------------------------------------
  -- CLIENT
  -- ------------------------------------------------------------
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
  else
    update auth.users
    set email = v_client_email,
        encrypted_password = crypt(v_client_password, gen_salt('bf')),
        email_confirmed_at = coalesce(email_confirmed_at, v_now),
        raw_app_meta_data = '{"provider":"email","providers":["email"]}'::jsonb,
        raw_user_meta_data = coalesce(raw_user_meta_data, '{}'::jsonb) || jsonb_build_object('full_name', v_client_name),
        updated_at = v_now
    where id = v_client_id;
  end if;

  if exists (
    select 1 from auth.identities where user_id = v_client_id and provider = 'email'
  ) then
    update auth.identities
    set provider_id = v_client_email,
        identity_data = jsonb_build_object('sub', v_client_id::text, 'email', v_client_email),
        last_sign_in_at = coalesce(last_sign_in_at, v_now),
        updated_at = v_now
    where user_id = v_client_id
      and provider = 'email';
  else
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
  values (
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

  -- ------------------------------------------------------------
  -- COACH
  -- ------------------------------------------------------------
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
  else
    update auth.users
    set email = v_coach_email,
        encrypted_password = crypt(v_coach_password, gen_salt('bf')),
        email_confirmed_at = coalesce(email_confirmed_at, v_now),
        raw_app_meta_data = '{"provider":"email","providers":["email"]}'::jsonb,
        raw_user_meta_data = coalesce(raw_user_meta_data, '{}'::jsonb) || jsonb_build_object('full_name', v_coach_name),
        updated_at = v_now
    where id = v_coach_id;
  end if;

  if exists (
    select 1 from auth.identities where user_id = v_coach_id and provider = 'email'
  ) then
    update auth.identities
    set provider_id = v_coach_email,
        identity_data = jsonb_build_object('sub', v_coach_id::text, 'email', v_coach_email),
        last_sign_in_at = coalesce(last_sign_in_at, v_now),
        updated_at = v_now
    where user_id = v_coach_id
      and provider = 'email';
  else
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
  values (
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

  -- ------------------------------------------------------------
  -- ADMIN
  -- ------------------------------------------------------------
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
  else
    update auth.users
    set email = v_admin_email,
        encrypted_password = crypt(v_admin_password, gen_salt('bf')),
        email_confirmed_at = coalesce(email_confirmed_at, v_now),
        raw_app_meta_data = '{"provider":"email","providers":["email"]}'::jsonb,
        raw_user_meta_data = coalesce(raw_user_meta_data, '{}'::jsonb) || jsonb_build_object('full_name', v_admin_name),
        updated_at = v_now
    where id = v_admin_id;
  end if;

  if exists (
    select 1 from auth.identities where user_id = v_admin_id and provider = 'email'
  ) then
    update auth.identities
    set provider_id = v_admin_email,
        identity_data = jsonb_build_object('sub', v_admin_id::text, 'email', v_admin_email),
        last_sign_in_at = coalesce(last_sign_in_at, v_now),
        updated_at = v_now
    where user_id = v_admin_id
      and provider = 'email';
  else
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
  values (
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
