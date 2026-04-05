import { z } from 'zod'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { dataResponse, problemResponse } from '@/lib/api/problem'

type SupabaseServerClient = Awaited<ReturnType<typeof createServerSupabaseClient>>

const UpdateSettingsSchema = z.object({
  fullName: z.string().min(1).max(160),
  email: z.string().email(),
  avatarUrl: z.string().url().nullable().optional(),
  measurementSystem: z.enum(['metric', 'imperial']).optional(),
  timezone: z.string().min(1).max(120).optional().nullable(),
  profileVisibility: z.enum(['public', 'friends_only', 'private']).optional(),
  shareWorkouts: z.boolean().optional(),
  shareWeightData: z.boolean().optional(),
  weekStart: z.enum(['monday', 'sunday']).optional(),
  integrations: z.record(z.string(), z.unknown()).optional(),
  twoFactorEnabled: z.boolean().optional(),
  currentPassword: z.string().min(6).optional().or(z.literal('')),
  newPassword: z.string().min(8).max(128).optional().or(z.literal('')),
})

export async function GET() {
  const requestId = crypto.randomUUID()
  const supabase = await createServerSupabaseClient()
  const db = supabaseAdmin as unknown as SupabaseServerClient

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return problemResponse({
      status: 401,
      code: 'UNAUTHORIZED',
      title: 'Unauthorized',
      detail: 'Authentication required.',
      requestId,
      retriable: false,
    })
  }

  const { data: profile, error } = await db
    .from('profiles')
    .select('full_name,email,avatar_url,measurement_system,timezone')
    .eq('id', user.id)
    .maybeSingle()

  if (error) {
    return problemResponse({
      status: 500,
      code: 'COACH_SETTINGS_FETCH_FAILED',
      title: 'Settings Fetch Failed',
      detail: error.message,
      requestId,
    })
  }

  const { data: profileSettings, error: profileSettingsError } = await db
    .from('profile_settings' as never)
    .select('profile_visibility,share_workouts,share_weight_data,week_start,integrations,two_factor_enabled')
    .eq('user_id' as never, user.id)
    .maybeSingle()

  const settingsRecord = toRecord(profileSettings)

  if (profileSettingsError) {
    return problemResponse({
      status: 500,
      code: 'COACH_SETTINGS_FETCH_FAILED',
      title: 'Settings Fetch Failed',
      detail: profileSettingsError.message,
      requestId,
    })
  }

  return dataResponse({
    requestId,
    data: {
      fullName: String(profile?.full_name || user.user_metadata?.full_name || ''),
      email: String(profile?.email || user.email || ''),
      avatarUrl: profile?.avatar_url ? String(profile.avatar_url) : '',
      measurementSystem: String(profile?.measurement_system || 'metric'),
      timezone: String(profile?.timezone || 'UTC'),
      profileVisibility: String(settingsRecord.profile_visibility || 'public'),
      shareWorkouts: Boolean(settingsRecord.share_workouts ?? true),
      shareWeightData: Boolean(settingsRecord.share_weight_data ?? false),
      weekStart: String(settingsRecord.week_start || 'monday'),
      integrations: settingsRecord.integrations && typeof settingsRecord.integrations === 'object' ? settingsRecord.integrations : {},
      twoFactorEnabled: Boolean(settingsRecord.two_factor_enabled ?? false),
    },
  })
}

export async function PATCH(request: Request) {
  const requestId = crypto.randomUUID()
  const supabase = await createServerSupabaseClient()
  const db = supabaseAdmin as unknown as SupabaseServerClient

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return problemResponse({
      status: 401,
      code: 'UNAUTHORIZED',
      title: 'Unauthorized',
      detail: 'Authentication required.',
      requestId,
      retriable: false,
    })
  }

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

  const payload = parsed.data
  const hasPasswordChange = !!payload.newPassword && payload.newPassword.length > 0

  if (hasPasswordChange && (!payload.currentPassword || payload.currentPassword.length < 6)) {
    return problemResponse({
      status: 422,
      code: 'VALIDATION_ERROR',
      title: 'Validation Error',
      detail: 'Current password is required to set a new password.',
      requestId,
      retriable: false,
    })
  }

  const { error } = await db
    .from('profiles')
    .update({
      full_name: payload.fullName.trim(),
      email: payload.email.trim(),
      avatar_url: payload.avatarUrl?.trim() || null,
      measurement_system: payload.measurementSystem || 'metric',
      timezone: payload.timezone?.trim() || 'UTC',
    })
    .eq('id', user.id)

  if (error) {
    return problemResponse({
      status: 500,
      code: 'COACH_SETTINGS_UPDATE_FAILED',
      title: 'Settings Update Failed',
      detail: error.message,
      requestId,
    })
  }

  const { error: profileSettingsError } = await upsertProfileSettings(db, user.id, {
    profile_visibility: payload.profileVisibility || 'public',
    share_workouts: payload.shareWorkouts ?? true,
    share_weight_data: payload.shareWeightData ?? false,
    week_start: payload.weekStart || 'monday',
    integrations: payload.integrations || {},
    two_factor_enabled: payload.twoFactorEnabled ?? false,
  })

  if (profileSettingsError) {
    return problemResponse({
      status: 500,
      code: 'COACH_SETTINGS_UPDATE_FAILED',
      title: 'Settings Update Failed',
      detail: profileSettingsError.message,
      requestId,
    })
  }

  if (payload.email.trim() !== (user.email || '').trim()) {
    const { error: emailError } = await supabase.auth.updateUser({ email: payload.email.trim() })
    if (emailError) {
      return problemResponse({
        status: 500,
        code: 'COACH_SETTINGS_EMAIL_UPDATE_FAILED',
        title: 'Email Update Failed',
        detail: emailError.message,
        requestId,
      })
    }
  }

  if (hasPasswordChange) {
    const { error: passwordError } = await supabase.auth.updateUser({ password: payload.newPassword })
    if (passwordError) {
      return problemResponse({
        status: 500,
        code: 'COACH_SETTINGS_PASSWORD_UPDATE_FAILED',
        title: 'Password Update Failed',
        detail: passwordError.message,
        requestId,
      })
    }
  }

  return dataResponse({
    requestId,
    data: {
      saved: true,
      passwordUpdated: hasPasswordChange,
      fullName: payload.fullName.trim(),
      email: payload.email.trim(),
      avatarUrl: payload.avatarUrl?.trim() || '',
      measurementSystem: payload.measurementSystem || 'metric',
      timezone: payload.timezone?.trim() || 'UTC',
      profileVisibility: payload.profileVisibility || 'public',
      shareWorkouts: payload.shareWorkouts ?? true,
      shareWeightData: payload.shareWeightData ?? false,
      weekStart: payload.weekStart || 'monday',
      integrations: payload.integrations || {},
      twoFactorEnabled: payload.twoFactorEnabled ?? false,
    },
  })
}

function toRecord(value: unknown): Record<string, unknown> {
  if (typeof value === 'object' && value !== null) {
    return value as Record<string, unknown>
  }

  return {}
}

async function upsertProfileSettings(
  db: SupabaseServerClient,
  userId: string,
  payload: {
    profile_visibility: string
    share_workouts: boolean
    share_weight_data: boolean
    week_start: string
    integrations: Record<string, unknown>
    two_factor_enabled: boolean
  },
): Promise<{ error: { message: string } | null }> {
  const dynamicDb = db as unknown as {
    from: (table: string) => {
      upsert: (
        values: Record<string, unknown>,
        options: { onConflict: string },
      ) => Promise<{ error: { message: string } | null }>
    }
  }

  return dynamicDb
    .from('profile_settings')
    .upsert(
      {
        user_id: userId,
        ...payload,
      },
      { onConflict: 'user_id' },
    )
}
