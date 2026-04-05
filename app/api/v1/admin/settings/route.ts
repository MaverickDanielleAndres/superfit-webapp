import { z } from 'zod'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { dataResponse, problemResponse } from '@/lib/api/problem'

const UpdateSettingsSchema = z.object({
  maintenanceMode: z.boolean(),
  platformFeePercent: z.number().finite().min(0).max(100),
  autoApproveCoaches: z.boolean(),
  platformName: z.string().min(1).max(100),
  supportEmail: z.string().email(),

  enforceAdmin2fa: z.boolean(),
  maxLoginAttempts: z.number().finite().int().min(1).max(20),
  sessionTimeoutMinutes: z.number().finite().int().min(5).max(720),
  lockoutMinutes: z.number().finite().int().min(1).max(240),

  payoutSchedule: z.enum(['weekly', 'biweekly', 'monthly']),
  autoApprovePayouts: z.boolean(),
  allowRefunds: z.boolean(),
  refundWindowDays: z.number().finite().int().min(0).max(90),
  minimumPayoutCents: z.number().finite().int().min(0).max(1_000_000),

  enableReadReplicas: z.boolean(),
  analyticsRetentionDays: z.number().finite().int().min(7).max(3650),
  softDeleteRetentionDays: z.number().finite().int().min(1).max(365),
  maintenanceWindowUtc: z.string().min(3).max(120),

  emailOnApplication: z.boolean(),
  emailOnReport: z.boolean(),
  emailOnPayout: z.boolean(),
  inAppBroadcasts: z.boolean(),
}).strict()

async function requireAdmin() {
  const requestId = crypto.randomUUID()
  const supabase = await createServerSupabaseClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return {
      requestId,
      supabase,
      user: null,
      errorResponse: problemResponse({
        status: 401,
        code: 'UNAUTHORIZED',
        title: 'Unauthorized',
        detail: 'Authentication required.',
        requestId,
        retriable: false,
      }),
    }
  }

  const roleClaim =
    (user.user_metadata?.role as string | undefined) ||
    (user.app_metadata?.role as string | undefined)

  let isAdmin = String(roleClaim || '').toLowerCase() === 'admin'

  if (!isAdmin) {
    const roleResult = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .maybeSingle()

    isAdmin = !roleResult.error && Boolean(roleResult.data) && String(roleResult.data?.role || '').toLowerCase() === 'admin'
  }

  if (!isAdmin) {
    return {
      requestId,
      supabase,
      user,
      errorResponse: problemResponse({
        status: 403,
        code: 'FORBIDDEN',
        title: 'Forbidden',
        detail: 'Admin access required.',
        requestId,
        retriable: false,
      }),
    }
  }

  return { requestId, supabase, user, errorResponse: null as Response | null }
}

export async function GET() {
  const auth = await requireAdmin()
  if (auth.errorResponse) return auth.errorResponse

  const { requestId, supabase } = auth

  const { data, error } = await (supabase as any)
    .from('platform_settings')
    .select('setting_key,setting_value')

  if (error) {
    return problemResponse({
      status: 500,
      code: 'ADMIN_SETTINGS_FETCH_FAILED',
      title: 'Settings Fetch Failed',
      detail: error.message,
      requestId,
    })
  }

  const map = new Map<string, any>()
  for (const row of data || []) {
    map.set(String(row.setting_key), row.setting_value || {})
  }

  const boolSetting = (key: string, fallback: boolean) => {
    const value = map.get(key)
    return Boolean(value?.enabled ?? fallback)
  }

  const numberSetting = (key: string, fallback: number) => {
    const value = map.get(key)
    return Number(value?.value ?? fallback)
  }

  const stringSetting = (key: string, fallback: string) => {
    const value = map.get(key)
    return String(value?.value ?? fallback)
  }

  const maintenanceMode = boolSetting('maintenance_mode', false)
  const platformFeePercent = numberSetting('platform_fee_percent', 10)
  const autoApproveCoaches = boolSetting('auto_approve_coaches', true)
  const platformName = stringSetting('platform_name', 'SuperFit')
  const supportEmail = stringSetting('support_email', 'support@superfit.app')

  const enforceAdmin2fa = boolSetting('security_enforce_2fa_admin', true)
  const maxLoginAttempts = numberSetting('security_max_login_attempts', 5)
  const sessionTimeoutMinutes = numberSetting('security_session_timeout_minutes', 60)
  const lockoutMinutes = numberSetting('security_lockout_minutes', 15)

  const payoutSchedule = stringSetting('billing_payout_schedule', 'weekly') as 'weekly' | 'biweekly' | 'monthly'
  const autoApprovePayouts = boolSetting('billing_auto_approve_payouts', false)
  const allowRefunds = boolSetting('billing_allow_refunds', true)
  const refundWindowDays = numberSetting('billing_refund_window_days', 14)
  const minimumPayoutCents = numberSetting('billing_minimum_payout_cents', 5000)

  const enableReadReplicas = boolSetting('database_enable_read_replicas', false)
  const analyticsRetentionDays = numberSetting('database_analytics_retention_days', 365)
  const softDeleteRetentionDays = numberSetting('database_soft_delete_retention_days', 30)
  const maintenanceWindowUtc = stringSetting('database_maintenance_window_utc', 'Sun 02:00-03:00 UTC')

  const emailOnApplication = boolSetting('notifications_email_on_application', true)
  const emailOnReport = boolSetting('notifications_email_on_report', true)
  const emailOnPayout = boolSetting('notifications_email_on_payout', true)
  const inAppBroadcasts = boolSetting('notifications_in_app_broadcasts', true)

  return dataResponse({
    requestId,
    data: {
      maintenanceMode,
      platformFeePercent,
      autoApproveCoaches,
      platformName,
      supportEmail,
      enforceAdmin2fa,
      maxLoginAttempts,
      sessionTimeoutMinutes,
      lockoutMinutes,
      payoutSchedule,
      autoApprovePayouts,
      allowRefunds,
      refundWindowDays,
      minimumPayoutCents,
      enableReadReplicas,
      analyticsRetentionDays,
      softDeleteRetentionDays,
      maintenanceWindowUtc,
      emailOnApplication,
      emailOnReport,
      emailOnPayout,
      inAppBroadcasts,
    },
  })
}

export async function PATCH(request: Request) {
  const auth = await requireAdmin()
  if (auth.errorResponse) return auth.errorResponse

  const { requestId, supabase, user } = auth

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return problemResponse({
      status: 400,
      code: 'INVALID_JSON',
      title: 'Invalid JSON',
      detail: 'Request body must be valid JSON.',
      requestId,
      retriable: false,
    })
  }

  const parsed = UpdateSettingsSchema.safeParse(body)
  if (!parsed.success) {
    return problemResponse({
      status: 422,
      code: 'VALIDATION_ERROR',
      title: 'Validation Error',
      detail: 'Invalid settings payload.',
      requestId,
      retriable: false,
      errors: parsed.error.flatten(),
    })
  }

  const rows = [
    { setting_key: 'maintenance_mode', setting_value: { enabled: parsed.data.maintenanceMode }, updated_by: user!.id },
    { setting_key: 'platform_fee_percent', setting_value: { value: parsed.data.platformFeePercent }, updated_by: user!.id },
    { setting_key: 'auto_approve_coaches', setting_value: { enabled: parsed.data.autoApproveCoaches }, updated_by: user!.id },
    { setting_key: 'platform_name', setting_value: { value: parsed.data.platformName }, updated_by: user!.id },
    { setting_key: 'support_email', setting_value: { value: parsed.data.supportEmail }, updated_by: user!.id },

    { setting_key: 'security_enforce_2fa_admin', setting_value: { enabled: parsed.data.enforceAdmin2fa }, updated_by: user!.id },
    { setting_key: 'security_max_login_attempts', setting_value: { value: parsed.data.maxLoginAttempts }, updated_by: user!.id },
    { setting_key: 'security_session_timeout_minutes', setting_value: { value: parsed.data.sessionTimeoutMinutes }, updated_by: user!.id },
    { setting_key: 'security_lockout_minutes', setting_value: { value: parsed.data.lockoutMinutes }, updated_by: user!.id },

    { setting_key: 'billing_payout_schedule', setting_value: { value: parsed.data.payoutSchedule }, updated_by: user!.id },
    { setting_key: 'billing_auto_approve_payouts', setting_value: { enabled: parsed.data.autoApprovePayouts }, updated_by: user!.id },
    { setting_key: 'billing_allow_refunds', setting_value: { enabled: parsed.data.allowRefunds }, updated_by: user!.id },
    { setting_key: 'billing_refund_window_days', setting_value: { value: parsed.data.refundWindowDays }, updated_by: user!.id },
    { setting_key: 'billing_minimum_payout_cents', setting_value: { value: parsed.data.minimumPayoutCents }, updated_by: user!.id },

    { setting_key: 'database_enable_read_replicas', setting_value: { enabled: parsed.data.enableReadReplicas }, updated_by: user!.id },
    { setting_key: 'database_analytics_retention_days', setting_value: { value: parsed.data.analyticsRetentionDays }, updated_by: user!.id },
    { setting_key: 'database_soft_delete_retention_days', setting_value: { value: parsed.data.softDeleteRetentionDays }, updated_by: user!.id },
    { setting_key: 'database_maintenance_window_utc', setting_value: { value: parsed.data.maintenanceWindowUtc }, updated_by: user!.id },

    { setting_key: 'notifications_email_on_application', setting_value: { enabled: parsed.data.emailOnApplication }, updated_by: user!.id },
    { setting_key: 'notifications_email_on_report', setting_value: { enabled: parsed.data.emailOnReport }, updated_by: user!.id },
    { setting_key: 'notifications_email_on_payout', setting_value: { enabled: parsed.data.emailOnPayout }, updated_by: user!.id },
    { setting_key: 'notifications_in_app_broadcasts', setting_value: { enabled: parsed.data.inAppBroadcasts }, updated_by: user!.id },
  ]

  const { error } = await (supabase as any)
    .from('platform_settings')
    .upsert(rows, { onConflict: 'setting_key' })

  if (error) {
    return problemResponse({
      status: 500,
      code: 'ADMIN_SETTINGS_UPDATE_FAILED',
      title: 'Settings Update Failed',
      detail: error.message,
      requestId,
    })
  }

  return dataResponse({
    requestId,
    data: {
      updated: true,
      ...parsed.data,
    },
  })
}
