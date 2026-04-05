import { createServerSupabaseClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { dataResponse, problemResponse } from '@/lib/api/problem'

type SupabaseServerClient = Awaited<ReturnType<typeof createServerSupabaseClient>>

interface ProfileCandidateRow {
  id: string | null
  full_name: string | null
  email: string | null
  goal: string | null
}

interface LinkedClientRow {
  client_id: string | null
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

export async function GET(request: Request) {
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
  const params = new URL(request.url).searchParams
  const search = String(params.get('search') || '').trim()
  const limit = Math.min(Math.max(Number(params.get('limit') || 40), 10), 80)

  const { data: rawLinkedRows, error: linkedError } = await db
    .from('coach_client_links')
    .select('client_id')
    .eq('coach_id', user.id)

  if (linkedError) {
    return problemResponse({
      status: 500,
      code: 'COACH_CLIENTS_AVAILABLE_FETCH_FAILED',
      title: 'Available Clients Fetch Failed',
      detail: linkedError.message,
      requestId,
    })
  }

  const linkedRows = Array.isArray(rawLinkedRows) ? (rawLinkedRows as LinkedClientRow[]) : []
  const linkedIds = new Set(linkedRows.map((row) => String(row.client_id || '')).filter(Boolean))

  let profilesQuery = db
    .from('profiles')
    .select('id,full_name,email,goal')
    .in('role', [...COACH_CLIENT_CANDIDATE_ROLES])
    .eq('account_status', 'active')
    .order('created_at', { ascending: false })
    .limit(limit * 2)

  if (search.length > 0) {
    const safeSearch = search.replaceAll(',', ' ').trim()
    profilesQuery = profilesQuery.or(`full_name.ilike.%${safeSearch}%,email.ilike.%${safeSearch}%`)
  }

  const { data: rawProfiles, error: profilesError } = await profilesQuery

  if (profilesError) {
    return problemResponse({
      status: 500,
      code: 'COACH_CLIENTS_AVAILABLE_FETCH_FAILED',
      title: 'Available Clients Fetch Failed',
      detail: profilesError.message,
      requestId,
    })
  }

  const profileRows = Array.isArray(rawProfiles) ? (rawProfiles as ProfileCandidateRow[]) : []
  const unlinkedCandidates = profileRows
    .filter((profile) => {
      const candidateId = String(profile.id || '')
      if (!candidateId) return false
      return !linkedIds.has(candidateId)
    })
    .slice(0, limit)

  const connectionByCandidateId = await getCoachConnectionMap(db, user.id)

  const candidates = await Promise.all(
    unlinkedCandidates.map(async (profile) => {
      const candidateId = String(profile.id || '')
      const connectionType = connectionByCandidateId.get(candidateId) || 'none'
      const hasConnection = connectionType !== 'none'
      const hasInteraction = await hasCoachClientInteraction(db, user.id, candidateId)
      const hasValidInteraction = hasInteraction || hasConnection

      return {
        id: candidateId,
        name: String(profile.full_name || profile.email?.split('@')[0] || 'Client'),
        email: String(profile.email || ''),
        goal: String(profile.goal || 'General Fitness'),
        hasConnection,
        connectionType,
        hasValidInteraction,
        eligibilityStatus: hasValidInteraction ? 'eligible' : 'needs_override',
      }
    }),
  )

  candidates.sort((a, b) => {
    if (a.eligibilityStatus !== b.eligibilityStatus) {
      return a.eligibilityStatus === 'eligible' ? -1 : 1
    }

    if (a.hasConnection !== b.hasConnection) {
      return a.hasConnection ? -1 : 1
    }

    return a.name.localeCompare(b.name)
  })

  return dataResponse({
    requestId,
    data: {
      candidates,
      total: candidates.length,
      search,
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
