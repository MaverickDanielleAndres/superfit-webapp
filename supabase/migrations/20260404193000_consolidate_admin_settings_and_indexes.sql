-- Description: Consolidate admin settings defaults and performance indexes for admin operations
-- Author: Copilot
-- Date: 2026-04-04

begin;

insert into public.platform_settings (setting_key, setting_value)
values
  ('platform_name', '{"value": "SuperFit"}'::jsonb),
  ('support_email', '{"value": "support@superfit.app"}'::jsonb),
  ('security_enforce_2fa_admin', '{"enabled": true}'::jsonb),
  ('security_max_login_attempts', '{"value": 5}'::jsonb),
  ('security_session_timeout_minutes', '{"value": 60}'::jsonb),
  ('security_lockout_minutes', '{"value": 15}'::jsonb),
  ('billing_payout_schedule', '{"value": "weekly"}'::jsonb),
  ('billing_auto_approve_payouts', '{"enabled": false}'::jsonb),
  ('billing_allow_refunds', '{"enabled": true}'::jsonb),
  ('billing_refund_window_days', '{"value": 14}'::jsonb),
  ('billing_minimum_payout_cents', '{"value": 5000}'::jsonb),
  ('database_enable_read_replicas', '{"enabled": false}'::jsonb),
  ('database_analytics_retention_days', '{"value": 365}'::jsonb),
  ('database_soft_delete_retention_days', '{"value": 30}'::jsonb),
  ('database_maintenance_window_utc', '{"value": "Sun 02:00-03:00 UTC"}'::jsonb),
  ('notifications_email_on_application', '{"enabled": true}'::jsonb),
  ('notifications_email_on_report', '{"enabled": true}'::jsonb),
  ('notifications_email_on_payout', '{"enabled": true}'::jsonb),
  ('notifications_in_app_broadcasts', '{"enabled": true}'::jsonb)
on conflict (setting_key) do nothing;

create index if not exists profiles_role_account_status_created_idx
  on public.profiles(role, account_status, created_at desc);

create index if not exists payment_transactions_status_created_idx
  on public.payment_transactions(status, created_at desc);

create index if not exists payment_transactions_status_coach_created_idx
  on public.payment_transactions(status, coach_id, created_at desc);

create index if not exists coach_client_links_coach_status_idx
  on public.coach_client_links(coach_id, status);

create index if not exists admin_moderation_reports_target_user_status_created_idx
  on public.admin_moderation_reports(target_user_id, status, created_at desc);

commit;
