import { z } from 'zod'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { dataResponse, problemResponse } from '@/lib/api/problem'

type SupabaseServerClient = Awaited<ReturnType<typeof createServerSupabaseClient>>

interface BroadcastLogRow {
  id: string | null
  audience_label: string | null
  message: string | null
  delivered_count: number | null
  read_count: number | null
  created_at: string | null
}

interface ScheduledBroadcastRow {
  id: string | null
  audience_label: string | null
  message: string | null
  delivered_count: number | null
  read_count: number | null
  status: string | null
  scheduled_for: string | null
  sent_at: string | null
  created_at: string | null
}

const BroadcastHistoryLogSchema = z.object({
  target: z.string().min(1).max(120),
  message: z.string().min(1).max(1000),
  delivered: z.number().int().min(0),
  read: z.number().int().min(0),
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

  const db = supabase as SupabaseServerClient

  const { data, error } = await db
    .from('coach_broadcast_logs')
    .select('id,audience_label,message,delivered_count,read_count,created_at')
    .eq('coach_id', user.id)
    .order('created_at', { ascending: false })
    .limit(50)

  if (error) {
    return problemResponse({
      status: 500,
      code: 'COACH_BROADCAST_HISTORY_FETCH_FAILED',
      title: 'Broadcast History Fetch Failed',
      detail: error.message,
      requestId,
    })
  }

  const logs = Array.isArray(data) ? (data as BroadcastLogRow[]) : []
  const reconciledLogs = await Promise.all(logs.map((row) => reconcileBroadcastLogCounts(db, user.id, row)))

  const dynamicDb = db as unknown as {
    from: (table: string) => {
      select: (columns: string) => {
        eq: (column: string, value: string) => {
          order: (column: string, options: { ascending: boolean }) => {
            limit: (value: number) => Promise<{ data: ScheduledBroadcastRow[] | null; error: { message: string } | null }>
          }
        }
      }
    }
  }

  const schedulesResult = await dynamicDb
    .from('coach_broadcast_schedules')
    .select('id,audience_label,message,delivered_count,read_count,status,scheduled_for,sent_at,created_at')
    .eq('coach_id', user.id)
    .order('created_at', { ascending: false })
    .limit(50)

  const schedules = Array.isArray(schedulesResult.data) ? schedulesResult.data : []

  const mergedBroadcasts = [
    ...reconciledLogs.map((row) => ({
      id: String(row.id || ''),
      audience_label: row.audience_label,
      message: row.message,
      delivered_count: Number(row.delivered_count || 0),
      read_count: Number(row.read_count || 0),
      created_at: row.created_at,
      status: 'sent',
      schedule_id: null as string | null,
      scheduled_for: null as string | null,
    })),
    ...schedules.map((row) => ({
      id: `schedule-${String(row.id || '')}`,
      audience_label: row.audience_label,
      message: row.message,
      delivered_count: Number(row.delivered_count || 0),
      read_count: Number(row.read_count || 0),
      created_at: row.sent_at || row.scheduled_for || row.created_at,
      status: String(row.status || 'scheduled'),
      schedule_id: String(row.id || ''),
      scheduled_for: row.scheduled_for,
    })),
  ]
    .filter((row) => !!row.id)
    .sort((a, b) => {
      const left = new Date(String(a.created_at || '')).getTime() || 0
      const right = new Date(String(b.created_at || '')).getTime() || 0
      return right - left
    })
    .slice(0, 80)

  return dataResponse({
    requestId,
    data: {
      broadcasts: mergedBroadcasts,
    },
  })
}

export async function POST(request: Request) {
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

  const parsed = BroadcastHistoryLogSchema.safeParse(body)
  if (!parsed.success) {
    return problemResponse({
      status: 422,
      code: 'VALIDATION_ERROR',
      title: 'Validation Error',
      detail: 'Invalid broadcast history payload.',
      requestId,
      retriable: false,
      errors: parsed.error.flatten(),
    })
  }

  const db = supabase as SupabaseServerClient

  const { error } = await db
    .from('coach_broadcast_logs')
    .insert({
      coach_id: user.id,
      audience_label: parsed.data.target,
      message: parsed.data.message,
      delivered_count: parsed.data.delivered,
      read_count: parsed.data.read,
    })

  if (error) {
    return problemResponse({
      status: 500,
      code: 'COACH_BROADCAST_HISTORY_LOG_FAILED',
      title: 'Broadcast History Log Failed',
      detail: error.message,
      requestId,
    })
  }

  return dataResponse({
    requestId,
    status: 201,
    data: {
      logged: true,
    },
  })
}

async function reconcileBroadcastLogCounts(
  db: SupabaseServerClient,
  coachId: string,
  log: BroadcastLogRow,
): Promise<BroadcastLogRow> {
  const logId = String(log.id || '')
  if (!logId) return log

  const attachmentFilter = JSON.stringify([{ broadcastLogId: logId }])

  const deliveredResult = await db
    .from('messages')
    .select('id', { count: 'exact', head: true })
    .eq('sender_id', coachId)
    .filter('attachments', 'cs', attachmentFilter)

  const readResult = await db
    .from('messages')
    .select('id', { count: 'exact', head: true })
    .eq('sender_id', coachId)
    .eq('status', 'read')
    .filter('attachments', 'cs', attachmentFilter)

  const deliveredCount = Number(deliveredResult.count || 0)
  const readCount = Number(readResult.count || 0)
  const nextDelivered = deliveredResult.error ? Number(log.delivered_count || 0) : deliveredCount
  const nextRead = readResult.error ? Number(log.read_count || 0) : readCount

  if (nextDelivered !== Number(log.delivered_count || 0) || nextRead !== Number(log.read_count || 0)) {
    await db
      .from('coach_broadcast_logs')
      .update({
        delivered_count: nextDelivered,
        read_count: nextRead,
      })
      .eq('id', logId)
      .eq('coach_id', coachId)
  }

  return {
    ...log,
    delivered_count: nextDelivered,
    read_count: nextRead,
  }
}
