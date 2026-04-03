import { z } from 'zod'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { dataResponse, problemResponse } from '@/lib/api/problem'

const MarkAllSchema = z.object({
  action: z.enum(['mark_all_read', 'mark_all_seen']),
})

export async function GET(request: Request) {
  const requestId = crypto.randomUUID()
  const supabase = await createServerSupabaseClient()
  const db = supabaseAdmin

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

  const params = new URL(request.url).searchParams
  const unreadOnly = params.get('unreadOnly') === 'true'
  const limitParam = Number.parseInt(params.get('limit') || '30', 10)
  const limit = Number.isFinite(limitParam) ? Math.max(1, Math.min(limitParam, 100)) : 30

  let query = (db as any)
    .from('notifications')
    .select('id,type,title,body,action_url,payload,actor_id,created_at,read_at,seen_at')
    .eq('recipient_id', user.id)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (unreadOnly) {
    query = query.is('read_at', null)
  }

  const { data, error } = await query
  if (error) {
    return problemResponse({
      status: 500,
      code: 'NOTIFICATIONS_FETCH_FAILED',
      title: 'Notifications Fetch Failed',
      detail: error.message,
      requestId,
    })
  }

  const actorIds = Array.from(new Set((data || []).map((item: any) => String(item.actor_id || '')).filter(Boolean)))
  const actorById = new Map<string, { full_name?: string | null; avatar_url?: string | null; email?: string | null }>()

  if (actorIds.length) {
    const { data: actors } = await (db as any)
      .from('profiles')
      .select('id,full_name,avatar_url,email')
      .in('id', actorIds)

    for (const actor of actors || []) {
      actorById.set(String(actor.id || ''), {
        full_name: actor.full_name || null,
        avatar_url: actor.avatar_url || null,
        email: actor.email || null,
      })
    }
  }

  const notifications = (data || []).map((row: any) => {
    const actorId = String(row.actor_id || '')
    const actor = actorById.get(actorId)

    return {
      id: String(row.id || ''),
      type: String(row.type || 'system'),
      title: String(row.title || ''),
      body: String(row.body || ''),
      actionUrl: row.action_url ? String(row.action_url) : null,
      payload: row.payload || {},
      createdAt: String(row.created_at || new Date().toISOString()),
      readAt: row.read_at ? String(row.read_at) : null,
      seenAt: row.seen_at ? String(row.seen_at) : null,
      actor: actorId
        ? {
            id: actorId,
            name: String(actor?.full_name || actor?.email?.split('@')[0] || 'User'),
            avatar: String(actor?.avatar_url || `https://api.dicebear.com/7.x/notionists/svg?seed=${actorId}`),
          }
        : null,
    }
  })

  const unreadCount = notifications.reduce((count: number, item: any) => count + (item.readAt ? 0 : 1), 0)

  return dataResponse({
    requestId,
    data: {
      notifications,
      unreadCount,
    },
  })
}

export async function PATCH(request: Request) {
  const requestId = crypto.randomUUID()
  const supabase = await createServerSupabaseClient()
  const db = supabaseAdmin

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

  const parsed = MarkAllSchema.safeParse(body)
  if (!parsed.success) {
    return problemResponse({
      status: 422,
      code: 'VALIDATION_ERROR',
      title: 'Validation Error',
      detail: 'Invalid notifications update payload.',
      requestId,
      retriable: false,
      errors: parsed.error.flatten(),
    })
  }

  const nowIso = new Date().toISOString()
  const patch =
    parsed.data.action === 'mark_all_read'
      ? { read_at: nowIso, seen_at: nowIso }
      : { seen_at: nowIso }

  const { error } = await (db as any)
    .from('notifications')
    .update(patch)
    .eq('recipient_id', user.id)
    .is(parsed.data.action === 'mark_all_read' ? 'read_at' : 'seen_at', null)

  if (error) {
    return problemResponse({
      status: 500,
      code: 'NOTIFICATIONS_UPDATE_FAILED',
      title: 'Notifications Update Failed',
      detail: error.message,
      requestId,
    })
  }

  return dataResponse({
    requestId,
    data: {
      updated: true,
      action: parsed.data.action,
    },
  })
}
