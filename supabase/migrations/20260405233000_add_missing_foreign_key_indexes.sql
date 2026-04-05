-- Performance hardening: add covering indexes for frequently joined foreign keys.
-- These indexes address Supabase advisor "unindexed_foreign_keys" findings.

create index if not exists idx_admin_coach_applications_applicant_id
  on public.admin_coach_applications (applicant_id);

create index if not exists idx_admin_coach_applications_reviewed_by
  on public.admin_coach_applications (reviewed_by);

create index if not exists idx_admin_moderation_reports_reporter_id
  on public.admin_moderation_reports (reporter_id);

create index if not exists idx_admin_moderation_reports_reviewed_by
  on public.admin_moderation_reports (reviewed_by);

create index if not exists idx_admin_moderation_reports_target_post_id
  on public.admin_moderation_reports (target_post_id);

create index if not exists idx_coach_review_replies_coach_id
  on public.coach_review_replies (coach_id);

create index if not exists idx_exercises_created_by
  on public.exercises (created_by);

create index if not exists idx_food_items_created_by
  on public.food_items (created_by);

create index if not exists idx_food_log_entries_food_item_id
  on public.food_log_entries (food_item_id);

create index if not exists idx_message_reactions_user_id
  on public.message_reactions (user_id);

create index if not exists idx_messages_reply_to_id
  on public.messages (reply_to_id);

create index if not exists idx_notifications_actor_id
  on public.notifications (actor_id);

create index if not exists idx_platform_settings_updated_by
  on public.platform_settings (updated_by);

create index if not exists idx_profiles_deleted_by
  on public.profiles (deleted_by);

create index if not exists idx_profiles_suspended_by
  on public.profiles (suspended_by);

create index if not exists idx_workout_sessions_template_id
  on public.workout_sessions (template_id);

create index if not exists idx_workout_sets_exercise_id
  on public.workout_sets (exercise_id);

create index if not exists idx_workout_templates_user_id
  on public.workout_templates (user_id);
