-- Description: Seed baseline app data for local/dev environments
-- Author: Copilot
-- Date: 2026-04-03

-- Note: This seed migration is intended for development environments.
-- It enriches existing auth users/profiles and adds sample relational data
-- for dashboards in coach/admin/user portals.

do $$
declare
  v_admin_id uuid;
  v_coach_id uuid;
  v_user_a uuid;
  v_user_b uuid;
  v_user_c uuid;
  v_program_id uuid;
  v_form_id uuid;
  v_thread_id uuid;
  v_post_id uuid;
begin
  -- Ensure every auth user has a profile row.
  insert into public.profiles (id, email, full_name, role, onboarding_complete, account_status, is_premium)
  select
    u.id,
    coalesce(u.email, ''),
    coalesce(nullif(u.raw_user_meta_data ->> 'full_name', ''), split_part(coalesce(u.email, ''), '@', 1), 'User'),
    'user',
    false,
    'active',
    false
  from auth.users u
  left join public.profiles p on p.id = u.id
  where p.id is null;

  select id into v_admin_id
  from public.profiles
  where role = 'admin' and account_status = 'active'
  order by created_at asc
  limit 1;

  select id into v_coach_id
  from public.profiles
  where role = 'coach' and account_status = 'active'
  order by created_at asc
  limit 1;

  select id into v_user_a
  from public.profiles
  where role = 'user'
    and account_status = 'active'
    and id not in (
      coalesce(v_admin_id, '00000000-0000-0000-0000-000000000000'::uuid),
      coalesce(v_coach_id, '00000000-0000-0000-0000-000000000000'::uuid)
    )
  order by created_at asc
  limit 1 offset 0;

  select id into v_user_b
  from public.profiles
  where role = 'user'
    and account_status = 'active'
    and id not in (
      coalesce(v_admin_id, '00000000-0000-0000-0000-000000000000'::uuid),
      coalesce(v_coach_id, '00000000-0000-0000-0000-000000000000'::uuid)
    )
  order by created_at asc
  limit 1 offset 1;

  select id into v_user_c
  from public.profiles
  where role = 'user'
    and account_status = 'active'
    and id not in (
      coalesce(v_admin_id, '00000000-0000-0000-0000-000000000000'::uuid),
      coalesce(v_coach_id, '00000000-0000-0000-0000-000000000000'::uuid)
    )
  order by created_at asc
  limit 1 offset 2;

  if v_admin_id is not null then
    update public.profiles
    set full_name = coalesce(full_name, 'Platform Admin'),
        account_status = 'active'
    where id = v_admin_id;
  end if;

  if v_coach_id is not null then
    update public.profiles
    set full_name = coalesce(full_name, 'Coach Taylor'),
        account_status = 'active',
        is_premium = true,
        onboarding_complete = true,
        goal = coalesce(goal, 'Help clients build consistency and strength'),
        exercise_preferences = coalesce(exercise_preferences, array['strength', 'hypertrophy']::text[]),
        session_duration = coalesce(session_duration, 30)
    where id = v_coach_id;
  end if;

  if v_user_a is not null then
    update public.profiles
    set full_name = coalesce(full_name, 'Avery Stone'),
        account_status = 'active',
        onboarding_complete = true,
        is_premium = true,
        goal = coalesce(goal, 'weight_loss'),
        activity_level = coalesce(activity_level, 'moderate'),
        current_weight_kg = coalesce(current_weight_kg, 82),
        goal_weight_kg = coalesce(goal_weight_kg, 75),
        water_target_ml = coalesce(water_target_ml, 3000)
    where id = v_user_a;
  end if;

  if v_user_b is not null then
    update public.profiles
    set full_name = coalesce(full_name, 'Jordan Miles'),
        account_status = 'active',
        onboarding_complete = true,
        goal = coalesce(goal, 'muscle_gain'),
        activity_level = coalesce(activity_level, 'very_active'),
        current_weight_kg = coalesce(current_weight_kg, 70),
        goal_weight_kg = coalesce(goal_weight_kg, 77),
        water_target_ml = coalesce(water_target_ml, 3400)
    where id = v_user_b;
  end if;

  if v_user_c is not null then
    update public.profiles
    set full_name = coalesce(full_name, 'Casey Reed'),
        account_status = 'active',
        onboarding_complete = false,
        goal = coalesce(goal, 'maintenance'),
        activity_level = coalesce(activity_level, 'light')
    where id = v_user_c;
  end if;

  if v_user_a is not null then
    insert into public.goals (
      user_id,
      title,
      category,
      target_value,
      current_value,
      start_value,
      unit,
      deadline,
      projected_complete,
      ahead,
      completed
    )
    select
      v_user_a,
      'Lose 7kg in 12 weeks',
      'weight',
      75,
      82,
      84,
      'kg',
      (now() + interval '12 weeks')::date,
      (now() + interval '10 weeks')::date,
      true,
      false
    where not exists (
      select 1 from public.goals g where g.user_id = v_user_a and g.title = 'Lose 7kg in 12 weeks'
    );

    insert into public.hydration_logs (user_id, logged_at, amount_ml, drink_type, label, hydration_factor, caffeine_mg)
    select v_user_a, now() - interval '6 hours', 500, 'water', 'Morning Water', 1, 0
    where not exists (
      select 1 from public.hydration_logs h
      where h.user_id = v_user_a
        and h.label = 'Morning Water'
        and h.logged_at::date = now()::date
    );

    insert into public.hydration_logs (user_id, logged_at, amount_ml, drink_type, label, hydration_factor, caffeine_mg)
    select v_user_a, now() - interval '4 hours', 250, 'coffee', 'Americano', 0.5, 95
    where not exists (
      select 1 from public.hydration_logs h
      where h.user_id = v_user_a
        and h.label = 'Americano'
        and h.logged_at::date = now()::date
    );

    insert into public.nutrition_entries (user_id, logged_at, meal_slot, quantity, food_item_id, food_item, notes)
    select
      v_user_a,
      now() - interval '5 hours',
      'breakfast',
      1,
      'oats-banana-whey',
      '{"name":"Protein Oats","calories":520,"protein":35,"carbs":62,"fat":14}'::jsonb,
      'High-protein breakfast'
    where not exists (
      select 1 from public.nutrition_entries n
      where n.user_id = v_user_a
        and n.food_item_id = 'oats-banana-whey'
        and n.logged_at::date = now()::date
    );

    insert into public.workout_sessions (
      user_id,
      name,
      date,
      start_time,
      end_time,
      duration,
      exercises,
      total_volume,
      calories,
      notes,
      is_completed,
      routine_id,
      is_template
    )
    select
      v_user_a,
      'Upper Body Strength',
      (now() - interval '1 day')::date,
      now() - interval '1 day' - interval '70 minutes',
      now() - interval '1 day',
      70,
      '[{"name":"Bench Press","sets":4,"reps":8,"weight":70},{"name":"Rows","sets":4,"reps":10,"weight":55}]'::jsonb,
      5040,
      460,
      'Felt strong on pressing.',
      true,
      'upper-strength-1',
      false
    where not exists (
      select 1 from public.workout_sessions w
      where w.user_id = v_user_a
        and w.name = 'Upper Body Strength'
        and w.date = (now() - interval '1 day')::date
    );
  end if;

  if v_coach_id is not null and v_user_a is not null then
    insert into public.coach_client_links (
      coach_id,
      client_id,
      status,
      goal_name,
      compliance,
      weight_trend,
      last_active_at,
      notes
    )
    values (
      v_coach_id,
      v_user_a,
      'active',
      'Weight Loss Phase 1',
      82,
      '[84, 83.4, 82.9, 82.1]'::jsonb,
      now() - interval '2 hours',
      'Responds well to accountability nudges.'
    )
    on conflict (coach_id, client_id) do update
      set status = excluded.status,
          goal_name = excluded.goal_name,
          compliance = excluded.compliance,
          weight_trend = excluded.weight_trend,
          last_active_at = excluded.last_active_at;
  end if;

  if v_coach_id is not null and v_user_b is not null then
    insert into public.coach_client_links (
      coach_id,
      client_id,
      status,
      goal_name,
      compliance,
      weight_trend,
      last_active_at,
      notes
    )
    values (
      v_coach_id,
      v_user_b,
      'active',
      'Lean Mass Build',
      74,
      '[69.5, 70.0, 70.4, 70.8]'::jsonb,
      now() - interval '1 day',
      'Needs extra recovery reminders.'
    )
    on conflict (coach_id, client_id) do update
      set status = excluded.status,
          goal_name = excluded.goal_name,
          compliance = excluded.compliance,
          weight_trend = excluded.weight_trend,
          last_active_at = excluded.last_active_at;
  end if;

  if v_coach_id is not null then
    insert into public.coach_programs (coach_id, name, difficulty, length_label, cover_url, builder_days, is_archived)
    select
      v_coach_id,
      'Foundations Strength 4-Week',
      'Intermediate',
      '4 Weeks',
      '/program-covers/default.jpg',
      '[{"id":"day-1","name":"Upper","exercises":["Bench Press","Rows","Incline DB Press"]},{"id":"day-2","name":"Lower","exercises":["Back Squat","RDL","Walking Lunges"]}]'::jsonb,
      false
    where not exists (
      select 1 from public.coach_programs p
      where p.coach_id = v_coach_id and p.name = 'Foundations Strength 4-Week'
    );

    select id into v_program_id
    from public.coach_programs
    where coach_id = v_coach_id and name = 'Foundations Strength 4-Week'
    order by created_at asc
    limit 1;
  end if;

  if v_program_id is not null and v_user_a is not null then
    insert into public.coach_program_assignments (program_id, coach_id, client_id, status, progress_pct, assigned_at, started_at)
    values (v_program_id, v_coach_id, v_user_a, 'active', 45, now() - interval '10 days', now() - interval '9 days')
    on conflict (program_id, client_id) do update
      set progress_pct = excluded.progress_pct,
          status = excluded.status;
  end if;

  if v_program_id is not null and v_user_b is not null then
    insert into public.coach_program_assignments (program_id, coach_id, client_id, status, progress_pct, assigned_at, started_at)
    values (v_program_id, v_coach_id, v_user_b, 'active', 28, now() - interval '6 days', now() - interval '5 days')
    on conflict (program_id, client_id) do update
      set progress_pct = excluded.progress_pct,
          status = excluded.status;
  end if;

  if v_coach_id is not null then
    insert into public.coach_forms (coach_id, name, status, form_schema)
    select
      v_coach_id,
      'Weekly Check-In',
      'active',
      '{"questions":[{"id":"energy","label":"How is your energy this week?","type":"scale"},{"id":"sleep","label":"How many hours did you sleep on average?","type":"number"}]}'::jsonb
    where not exists (
      select 1 from public.coach_forms f
      where f.coach_id = v_coach_id and f.name = 'Weekly Check-In'
    );

    select id into v_form_id
    from public.coach_forms
    where coach_id = v_coach_id and name = 'Weekly Check-In'
    order by created_at asc
    limit 1;
  end if;

  if v_form_id is not null and v_user_a is not null then
    insert into public.coach_form_assignments (form_id, coach_id, client_id, assigned_at, deadline)
    values (v_form_id, v_coach_id, v_user_a, now() - interval '3 days', now() + interval '4 days')
    on conflict (form_id, coach_id, client_id) do update
      set deadline = excluded.deadline;

    insert into public.coach_form_submissions (form_id, coach_id, client_id, response, review_status, coach_notes, submitted_at)
    select
      v_form_id,
      v_coach_id,
      v_user_a,
      '{"energy":4,"sleep":7.2,"notes":"Workouts felt solid and recovery is improving."}'::jsonb,
      'reviewed',
      'Good consistency. Keep protein intake stable.',
      now() - interval '1 day'
    where not exists (
      select 1 from public.coach_form_submissions s
      where s.form_id = v_form_id
        and s.client_id = v_user_a
        and s.submitted_at::date = (now() - interval '1 day')::date
    );
  end if;

  if v_coach_id is not null then
    insert into public.coach_schedule_events (
      coach_id,
      client_id,
      title,
      event_type,
      status,
      start_at,
      end_at,
      notes
    )
    select
      v_coach_id,
      v_user_a,
      'Weekly 1:1 Check-In',
      '1-on-1',
      'scheduled',
      now() + interval '1 day',
      now() + interval '1 day' + interval '30 minutes',
      'Review progress, sleep, and adherence.'
    where not exists (
      select 1 from public.coach_schedule_events e
      where e.coach_id = v_coach_id
        and e.title = 'Weekly 1:1 Check-In'
        and e.start_at::date = (now() + interval '1 day')::date
    );

    insert into public.coach_broadcast_logs (coach_id, audience_label, message, delivered_count, read_count, created_at)
    select
      v_coach_id,
      'All Active Clients',
      'Reminder: prioritize sleep and hydration before tomorrow''s session.',
      2,
      1,
      now() - interval '8 hours'
    where not exists (
      select 1 from public.coach_broadcast_logs b
      where b.coach_id = v_coach_id
        and b.audience_label = 'All Active Clients'
        and b.message = 'Reminder: prioritize sleep and hydration before tomorrow''s session.'
    );
  end if;

  if v_coach_id is not null then
    insert into public.community_posts (user_id, content, post_type, media_urls, created_at)
    select
      v_coach_id,
      '[Subscribers] # Weekly Progress Check-In\nShare one win and one challenge from this week.',
      'text',
      '{}'::text[],
      now() - interval '2 days'
    where not exists (
      select 1 from public.community_posts p
      where p.user_id = v_coach_id
        and p.content like '[Subscribers] # Weekly Progress Check-In%'
    );

    select id into v_post_id
    from public.community_posts
    where user_id = v_coach_id
      and content like '[Subscribers] # Weekly Progress Check-In%'
    order by created_at asc
    limit 1;
  end if;

  if v_post_id is not null and v_user_a is not null then
    insert into public.community_post_likes (post_id, user_id)
    values (v_post_id, v_user_a)
    on conflict (post_id, user_id) do nothing;
  end if;

  if v_post_id is not null and v_user_b is not null then
    insert into public.community_post_likes (post_id, user_id)
    values (v_post_id, v_user_b)
    on conflict (post_id, user_id) do nothing;
  end if;

  if v_coach_id is not null and v_user_a is not null then
    select t.id into v_thread_id
    from public.message_threads t
    join public.message_thread_participants p1 on p1.thread_id = t.id and p1.user_id = v_coach_id
    join public.message_thread_participants p2 on p2.thread_id = t.id and p2.user_id = v_user_a
    where t.is_group = false
    order by t.created_at asc
    limit 1;

    if v_thread_id is null then
      insert into public.message_threads (created_by, is_group, group_name, group_avatar)
      values (v_coach_id, false, null, null)
      returning id into v_thread_id;

      insert into public.message_thread_participants (thread_id, user_id)
      values (v_thread_id, v_coach_id), (v_thread_id, v_user_a)
      on conflict (thread_id, user_id) do nothing;
    end if;

    insert into public.messages (thread_id, sender_id, text, status, attachments)
    select
      v_thread_id,
      v_coach_id,
      'Great effort this week. Keep your steps above 8k/day.',
      'delivered',
      '[]'::jsonb
    where not exists (
      select 1 from public.messages m
      where m.thread_id = v_thread_id
        and m.sender_id = v_coach_id
        and m.text = 'Great effort this week. Keep your steps above 8k/day.'
    );
  end if;

  if v_user_c is not null then
    insert into public.admin_coach_applications (
      applicant_id,
      full_name,
      email,
      specialties,
      experience_years,
      certificate_url,
      status,
      submitted_at
    )
    select
      v_user_c,
      coalesce((select full_name from public.profiles where id = v_user_c), 'Casey Reed'),
      coalesce((select email from public.profiles where id = v_user_c), 'casey@example.com'),
      array['fat-loss', 'nutrition']::text[],
      3,
      'https://example.com/certifications/casey-reed.pdf',
      'pending',
      now() - interval '3 days'
    where not exists (
      select 1 from public.admin_coach_applications a
      where a.applicant_id = v_user_c
    );
  end if;

  if v_user_a is not null and v_coach_id is not null then
    insert into public.payment_transactions (user_id, coach_id, amount_cents, currency, status, external_ref, created_at)
    select
      v_user_a,
      v_coach_id,
      8900,
      'usd',
      'succeeded',
      'pay_seed_001',
      now() - interval '14 days'
    where not exists (
      select 1 from public.payment_transactions t where t.external_ref = 'pay_seed_001'
    );

    insert into public.payment_transactions (user_id, coach_id, amount_cents, currency, status, external_ref, created_at)
    select
      v_user_a,
      v_coach_id,
      8900,
      'usd',
      'pending',
      'pay_seed_002',
      now() - interval '1 day'
    where not exists (
      select 1 from public.payment_transactions t where t.external_ref = 'pay_seed_002'
    );
  end if;

  if v_user_b is not null and v_coach_id is not null then
    insert into public.payment_transactions (user_id, coach_id, amount_cents, currency, status, external_ref, created_at)
    select
      v_user_b,
      v_coach_id,
      10900,
      'usd',
      'succeeded',
      'pay_seed_003',
      now() - interval '5 days'
    where not exists (
      select 1 from public.payment_transactions t where t.external_ref = 'pay_seed_003'
    );
  end if;

  if v_user_c is not null and v_post_id is not null then
    insert into public.admin_moderation_reports (
      reporter_id,
      target_user_id,
      target_post_id,
      content_type,
      reason,
      status,
      notes,
      created_at,
      reviewed_by
    )
    select
      v_user_c,
      v_coach_id,
      v_post_id,
      'post',
      'Promotional claim needs verification',
      'pending',
      'Auto-seeded report for admin moderation workflow.',
      now() - interval '12 hours',
      v_admin_id
    where not exists (
      select 1 from public.admin_moderation_reports r
      where r.target_post_id = v_post_id
        and r.reason = 'Promotional claim needs verification'
    );
  end if;

  if v_admin_id is not null then
    insert into public.platform_settings (setting_key, setting_value, updated_by)
    values
      ('maintenance_mode', '{"enabled": false}'::jsonb, v_admin_id),
      ('platform_fee_percent', '{"value": 10}'::jsonb, v_admin_id),
      ('auto_approve_coaches', '{"enabled": true}'::jsonb, v_admin_id)
    on conflict (setting_key) do update
      set setting_value = excluded.setting_value,
          updated_by = excluded.updated_by;
  end if;
end $$;
