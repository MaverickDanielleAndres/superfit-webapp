import { z } from 'zod'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { dataResponse, problemResponse } from '@/lib/api/problem'

const UpdateSettingsSchema = z.object({
  fullName: z.string().min(1).max(160),
  email: z.string().email(),
  avatarUrl: z.string().url().nullable().optional(),
})

export async function GET() {
  const requestId = crypto.randomUUID()
  const supabase = await createServerSupabaseClient()

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

  const { data: profile, error } = await (supabase as any)
    .from('profiles')
    .select('full_name,email,avatar_url')
    .eq('id', user.id)
    .single()

  if (error) {
    return problemResponse({
      status: 500,
      code: 'COACH_SETTINGS_FETCH_FAILED',
      title: 'Settings Fetch Failed',
      detail: error.message,
      requestId,
    })
  }

  return dataResponse({
    requestId,
    data: {
      fullName: String(profile?.full_name || user.user_metadata?.full_name || ''),
      email: String(profile?.email || user.email || ''),
      avatarUrl: profile?.avatar_url ? String(profile.avatar_url) : '',
    },
  })
}

export async function PATCH(request: Request) {
  const requestId = crypto.randomUUID()
  const supabase = await createServerSupabaseClient()

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

  const { error } = await (supabase as any)
    .from('profiles')
    .update({
      full_name: parsed.data.fullName.trim(),
      email: parsed.data.email.trim(),
      avatar_url: parsed.data.avatarUrl?.trim() || null,
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

  return dataResponse({
    requestId,
    data: {
      saved: true,
      fullName: parsed.data.fullName.trim(),
      email: parsed.data.email.trim(),
      avatarUrl: parsed.data.avatarUrl?.trim() || '',
    },
  })
}
