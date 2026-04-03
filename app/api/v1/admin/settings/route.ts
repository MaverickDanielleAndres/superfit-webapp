import { z } from 'zod'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { dataResponse, problemResponse } from '@/lib/api/problem'

const UpdateSettingsSchema = z.object({
  maintenanceMode: z.boolean(),
  platformFeePercent: z.number().min(0).max(100),
  autoApproveCoaches: z.boolean(),
})

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

  const { data: profile, error } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .maybeSingle()

  if (error || !profile || String(profile.role || '').toLowerCase() !== 'admin') {
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

  return dataResponse({
    requestId,
    data: {
      maintenanceMode: Boolean(map.get('maintenance_mode')?.enabled),
      platformFeePercent: Number(map.get('platform_fee_percent')?.value || 10),
      autoApproveCoaches: Boolean(map.get('auto_approve_coaches')?.enabled ?? true),
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
