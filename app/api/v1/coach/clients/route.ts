import { z } from 'zod'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { createNotification } from '@/lib/notifications'
import { dataResponse, problemResponse } from '@/lib/api/problem'

type SupabaseServerClient = Awaited<ReturnType<typeof createServerSupabaseClient>>

const AddClientSchema = z.discriminatedUnion('mode', [
  z.object({
    mode: z.literal('next-available'),
  }),
  z.object({
    mode: z.literal('manual'),
    clientId: z.string().uuid(),
    overrideReason: z.string().min(10).max(240).optional(),
  }),
])

interface LinkedClientRow {
  id: string | null
  client_id: string | null
  status: string | null
  goal_name: string | null
  compliance: number | null
  weight_trend: unknown
  last_active_at: string | null
}

interface ProfileGoalRow {
  id: string | null
  goal: string | null
  full_name?: string | null
  email?: string | null
}

interface CoachProfileCapRow {
  session_duration: number | null
}

interface FriendshipEdgeRow {
  requester_id: string | null
  addressee_id: string | null
}

interface FollowEdgeRow {
  follower_id: string | null
  followee_id: string | null
}

const COACH_CLIENT_CANDIDATE_ROLES = ['user', 'client'] as const

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

  const db = supabaseAdmin as unknown as SupabaseServerClient

  const { data: rawLinks, error } = await db
    .from('coach_client_links')
    .select('id,client_id,status,goal_name,compliance,weight_trend,last_active_at')
    .eq('coach_id', user.id)
    .order('last_active_at', { ascending: false })

  if (error) {
    return problemResponse({
      status: 500,
      code: 'COACH_CLIENTS_FETCH_FAILED',
      title: 'Clients Fetch Failed',
      detail: error.message,
      requestId,
    })
  }

  const links = Array.isArray(rawLinks) ? (rawLinks as LinkedClientRow[]) : []
  const clientIds = links
    .map((link) => String(link.client_id || ''))
    .filter(Boolean)

  const profileById = new Map<string, { full_name: string | null; email: string | null }>()
  if (clientIds.length) {
    const { data: rawProfiles } = await db
      .from('profiles')
      .select('id,full_name,email')
      .in('id', clientIds)

    const profiles = Array.isArray(rawProfiles) ? (rawProfiles as ProfileGoalRow[]) : []
    for (const profile of profiles) {
      const profileId = String(profile.id || '')
      if (!profileId) continue

      profileById.set(profileId, {
        full_name: profile.full_name ? String(profile.full_name) : null,
        email: profile.email ? String(profile.email) : null,
      })
    }
  }

  const clients = links.map((link) => {
    const profile = profileById.get(String(link.client_id || ''))

    return {
      id: String(link.id || ''),
      client_id: String(link.client_id || ''),
      status: String(link.status || 'active'),
      goal_name: String(link.goal_name || 'General Fitness'),
      compliance: Number(link.compliance || 0),
      weight_trend: Array.isArray(link.weight_trend) ? link.weight_trend : [],
      last_active_at: String(link.last_active_at || new Date().toISOString()),
      client: {
        full_name: profile?.full_name || null,
        email: profile?.email || null,
      },
    }
  })

  return dataResponse({
    requestId,
    data: {
      clients,
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

  let body: unknown = { mode: 'next-available' }
  try {
    body = await request.json()
  } catch {
    // Allow empty body and default mode.
  }

  const parsed = AddClientSchema.safeParse(body)
  if (!parsed.success) {
    return problemResponse({
      status: 422,
      code: 'VALIDATION_ERROR',
      title: 'Validation Error',
      detail: 'Invalid add-client payload.',
      requestId,
      retriable: false,
      errors: parsed.error.flatten(),
    })
  }

  const db = supabaseAdmin as unknown as SupabaseServerClient

  const [{ data: rawLinkedRows, error: linkedError }, { data: rawCoachProfile, error: coachProfileError }] = await Promise.all([
    db
      .from('coach_client_links')
      .select('client_id,status')
      .eq('coach_id', user.id),
    db
      .from('profiles')
      .select('session_duration')
      .eq('id', user.id)
      .maybeSingle(),
  ])

  if (linkedError) {
    return problemResponse({
      status: 500,
      code: 'COACH_CLIENT_ADD_FAILED',
      title: 'Client Add Failed',
      detail: linkedError.message,
      requestId,
    })
  }

  if (coachProfileError) {
    return problemResponse({
      status: 500,
      code: 'COACH_CLIENT_ADD_FAILED',
      title: 'Client Add Failed',
      detail: coachProfileError.message,
      requestId,
    })
  }

  const linkedRows = Array.isArray(rawLinkedRows) ? (rawLinkedRows as LinkedClientRow[]) : []
  const coachProfile = (rawCoachProfile || null) as CoachProfileCapRow | null
  const linkedIds = new Set(linkedRows.map((row) => String(row.client_id || '')))
  const clientCap = Math.max(1, Number(coachProfile?.session_duration || 30))
  const activeClients = linkedRows.filter(
    (row) => String(row.status || 'active').toLowerCase() !== 'inactive',
  ).length

  if (activeClients >= clientCap) {
    return dataResponse({
      requestId,
      data: {
        added: false,
        reason: 'CLIENT_CAP_REACHED',
        activeClients,
        clientCap,
      },
    })
  }

  let nextClient: ProfileGoalRow | null = null
  let isManualOverride = false
  let manualOverrideReason: string | null = null
  const connectionByCandidateId = await getCoachConnectionMap(db, user.id)

  if (parsed.data.mode === 'manual') {
    const { data: rawManualProfile, error: manualProfileError } = await db
      .from('profiles')
      .select('id,goal')
      .eq('id', parsed.data.clientId)
      .in('role', [...COACH_CLIENT_CANDIDATE_ROLES])
      .eq('account_status', 'active')
      .maybeSingle()

    if (manualProfileError) {
      return problemResponse({
        status: 500,
        code: 'COACH_CLIENT_ADD_FAILED',
        title: 'Client Add Failed',
        detail: manualProfileError.message,
        requestId,
      })
    }

    const manualProfile = (rawManualProfile || null) as ProfileGoalRow | null
    if (!manualProfile?.id) {
      return dataResponse({
        requestId,
        data: {
          added: false,
          reason: 'CLIENT_NOT_FOUND_OR_INACTIVE',
        },
      })
    }

    if (linkedIds.has(String(manualProfile.id))) {
      return dataResponse({
        requestId,
        data: {
          added: false,
          reason: 'ALREADY_LINKED',
        },
      })
    }

    const hasInteraction = await hasCoachClientInteraction(db, user.id, String(manualProfile.id))
    const hasConnection = connectionByCandidateId.has(String(manualProfile.id))
    if (!hasInteraction && !hasConnection && !parsed.data.overrideReason) {
      return dataResponse({
        requestId,
        data: {
          added: false,
          reason: 'NO_CLIENT_WITH_VALID_INTERACTION',
        },
      })
    }

    nextClient = manualProfile
    isManualOverride = !hasInteraction && !hasConnection
    manualOverrideReason = parsed.data.overrideReason || null
  } else {
    const { data: rawProfiles, error: profilesError } = await db
      .from('profiles')
      .select('id,goal')
      .in('role', [...COACH_CLIENT_CANDIDATE_ROLES])
      .eq('account_status', 'active')
      .order('created_at', { ascending: true })
      .limit(100)

    if (profilesError) {
      return problemResponse({
        status: 500,
        code: 'COACH_CLIENT_ADD_FAILED',
        title: 'Client Add Failed',
        detail: profilesError.message,
        requestId,
      })
    }

    const profiles = Array.isArray(rawProfiles) ? (rawProfiles as ProfileGoalRow[]) : []
    const candidates = profiles.filter((profile) => {
      const candidateId = String(profile.id || '')
      return Boolean(candidateId) && !linkedIds.has(candidateId)
    })
    if (!candidates.length) {
      return dataResponse({
        requestId,
        data: {
          added: false,
          reason: 'NO_AVAILABLE_CLIENTS',
        },
      })
    }

    // Prefer social connections first for fast and predictable assignment.
    const connectedCandidate = candidates.find((candidate) => {
      const candidateId = String(candidate.id || '')
      return Boolean(candidateId) && connectionByCandidateId.has(candidateId)
    })

    if (connectedCandidate) {
      nextClient = connectedCandidate
    } else {
      // Fallback to the first candidate with valid prior interaction.
      for (const candidate of candidates) {
        const candidateId = String(candidate.id || '')
        if (!candidateId) continue

        const hasInteraction = await hasCoachClientInteraction(db, user.id, candidateId)
        if (hasInteraction) {
          nextClient = candidate
          break
        }
      }
    }

    if (!nextClient?.id) {
      return dataResponse({
        requestId,
        data: {
          added: false,
          reason: 'NO_CLIENT_WITH_VALID_INTERACTION',
        },
      })
    }

  }

  const nextClientId = String(nextClient?.id || '')
  if (!nextClientId) {
    return problemResponse({
      status: 500,
      code: 'COACH_CLIENT_ADD_FAILED',
      title: 'Client Add Failed',
      detail: 'Unable to resolve a valid client id for assignment.',
      requestId,
    })
  }

  const { error: insertError } = await db
    .from('coach_client_links')
    .insert({
      coach_id: user.id,
      client_id: nextClientId,
      status: 'active',
      goal_name: String(nextClient.goal || 'General Fitness'),
      compliance: 0,
      weight_trend: [],
      last_active_at: new Date().toISOString(),
      notes:
        isManualOverride && manualOverrideReason
          ? `Manual override: ${manualOverrideReason}`
          : null,
    })

  if (insertError) {
    return problemResponse({
      status: 500,
      code: 'COACH_CLIENT_ADD_FAILED',
      title: 'Client Add Failed',
      detail: insertError.message,
      requestId,
    })
  }

  await createNotification(db as any, {
    recipientId: nextClientId,
    actorId: user.id,
    type: 'coach_client_added',
    title: 'You were added to a coach roster',
    body: 'A coach added you to their active client roster.',
    actionUrl: '/coaching',
    payload: {
      coachId: user.id,
    },
  })

  return dataResponse({
    requestId,
    status: 201,
    data: {
      added: true,
      clientId: nextClientId,
      mode: parsed.data.mode,
      manualOverride: isManualOverride,
    },
  })
}

async function getCoachConnectionMap(
  db: SupabaseServerClient,
  coachId: string,
): Promise<Map<string, 'friend' | 'follow' | 'friend_follow'>> {
  const [friendshipsResult, followsResult] = await Promise.all([
    db
      .from('user_friendships')
      .select('requester_id,addressee_id')
      .eq('status', 'accepted')
      .or(`requester_id.eq.${coachId},addressee_id.eq.${coachId}`),
    db
      .from('user_follows')
      .select('follower_id,followee_id')
      .or(`follower_id.eq.${coachId},followee_id.eq.${coachId}`),
  ])

  const friendships = Array.isArray(friendshipsResult.data)
    ? (friendshipsResult.data as FriendshipEdgeRow[])
    : []
  const follows = Array.isArray(followsResult.data)
    ? (followsResult.data as FollowEdgeRow[])
    : []

  const connectionMap = new Map<string, 'friend' | 'follow' | 'friend_follow'>()

  for (const edge of friendships) {
    const requesterId = String(edge.requester_id || '')
    const addresseeId = String(edge.addressee_id || '')
    const counterpartId = requesterId === coachId ? addresseeId : addresseeId === coachId ? requesterId : ''

    if (!counterpartId) continue

    const existing = connectionMap.get(counterpartId)
    if (existing === 'follow') {
      connectionMap.set(counterpartId, 'friend_follow')
      continue
    }

    connectionMap.set(counterpartId, 'friend')
  }

  for (const edge of follows) {
    const followerId = String(edge.follower_id || '')
    const followeeId = String(edge.followee_id || '')
    const counterpartId = followerId === coachId ? followeeId : followeeId === coachId ? followerId : ''

    if (!counterpartId) continue

    const existing = connectionMap.get(counterpartId)
    if (existing === 'friend') {
      connectionMap.set(counterpartId, 'friend_follow')
      continue
    }

    if (existing !== 'friend_follow') {
      connectionMap.set(counterpartId, 'follow')
    }
  }

  return connectionMap
}

async function hasCoachClientInteraction(
  db: SupabaseServerClient,
  coachId: string,
  clientId: string,
): Promise<boolean> {
  const dynamicDb = db as unknown as {
    rpc: (
      fn: string,
      params: Record<string, unknown>,
    ) => Promise<{ data: unknown; error: { message: string } | null }>
  }

  const { data, error } = await dynamicDb.rpc('coach_has_client_interaction', {
    p_coach_id: coachId,
    p_client_id: clientId,
  })

  if (error) {
    return false
  }

  return Boolean(data)
}
