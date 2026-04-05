import { createServerSupabaseClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { dataResponse, problemResponse } from '@/lib/api/problem'

interface CoachProfileRow {
  id: string
  full_name: string | null
  email: string | null
  avatar_url: string | null
  goal: string | null
  exercise_preferences: unknown
  account_status: string | null
  session_duration: number | null
}

interface ProfileSettingsRow {
  user_id: string
  profile_visibility: string | null
}

interface ReviewRow {
  coach_id: string | null
  rating: number | null
  is_public: boolean | null
}

interface LinkRow {
  coach_id: string | null
  status: string | null
}

function toMonthlyPrice(clientCap: number): number {
  // Price scales with a coach's roster cap while staying in a sensible range.
  return Math.max(39, Math.min(249, Math.round(clientCap * 2.2)))
}

export async function GET() {
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

  const { data: coaches, error: coachError } = await (db as any)
    .from('profiles')
    .select('id,full_name,email,avatar_url,goal,exercise_preferences,account_status,session_duration')
    .eq('role', 'coach')

  if (coachError) {
    return problemResponse({
      status: 500,
      code: 'COACH_DISCOVERY_FETCH_FAILED',
      title: 'Coach Discovery Fetch Failed',
      detail: coachError.message,
      requestId,
    })
  }

  const coachRows = Array.isArray(coaches) ? (coaches as CoachProfileRow[]) : []
  const coachIds = coachRows.map((row) => String(row.id || '')).filter(Boolean)

  const [{ data: settingsRows, error: settingsError }, { data: reviewRows, error: reviewError }, { data: linkRows, error: linkError }] = await Promise.all([
    coachIds.length
      ? (db as any)
          .from('profile_settings')
          .select('user_id,profile_visibility')
          .in('user_id', coachIds)
      : Promise.resolve({ data: [], error: null }),
    coachIds.length
      ? (db as any)
          .from('coach_reviews')
          .select('coach_id,rating,is_public')
          .in('coach_id', coachIds)
          .eq('is_public', true)
      : Promise.resolve({ data: [], error: null }),
    coachIds.length
      ? (db as any)
          .from('coach_client_links')
          .select('coach_id,status')
          .in('coach_id', coachIds)
          .eq('status', 'active')
      : Promise.resolve({ data: [], error: null }),
  ])

  if (settingsError || reviewError || linkError) {
    return problemResponse({
      status: 500,
      code: 'COACH_DISCOVERY_FETCH_FAILED',
      title: 'Coach Discovery Fetch Failed',
      detail: settingsError?.message || reviewError?.message || linkError?.message || 'Unable to fetch discovery data.',
      requestId,
    })
  }

  const visibilityByCoach = new Map<string, string>()
  for (const row of (Array.isArray(settingsRows) ? (settingsRows as ProfileSettingsRow[]) : [])) {
    const userId = String(row.user_id || '')
    if (!userId) continue
    visibilityByCoach.set(userId, String(row.profile_visibility || 'public'))
  }

  const ratingsByCoach = new Map<string, number[]>()
  for (const row of (Array.isArray(reviewRows) ? (reviewRows as ReviewRow[]) : [])) {
    const coachId = String(row.coach_id || '')
    if (!coachId) continue
    const rating = Number(row.rating || 0)
    if (!Number.isFinite(rating) || rating <= 0) continue

    const existing = ratingsByCoach.get(coachId) || []
    existing.push(rating)
    ratingsByCoach.set(coachId, existing)
  }

  const activeClientCountByCoach = new Map<string, number>()
  for (const row of (Array.isArray(linkRows) ? (linkRows as LinkRow[]) : [])) {
    const coachId = String(row.coach_id || '')
    if (!coachId) continue
    activeClientCountByCoach.set(coachId, (activeClientCountByCoach.get(coachId) || 0) + 1)
  }

  const discovered = coachRows
    .filter((coach) => {
      const accountStatus = String(coach.account_status || 'active').toLowerCase()
      if (accountStatus !== 'active') return false

      const visibility = String(visibilityByCoach.get(String(coach.id)) || 'public').toLowerCase()
      return visibility !== 'private'
    })
    .map((coach) => {
      const coachId = String(coach.id)
      const ratingValues = ratingsByCoach.get(coachId) || []
      const reviewCount = ratingValues.length
      const avgRating = reviewCount
        ? Number((ratingValues.reduce((sum, value) => sum + value, 0) / reviewCount).toFixed(2))
        : 0

      const tags = Array.isArray(coach.exercise_preferences)
        ? coach.exercise_preferences.map((entry: unknown) => String(entry)).filter(Boolean)
        : []

      const clientCap = Number(coach.session_duration || 30)
      const activeClientCount = activeClientCountByCoach.get(coachId) || 0

      return {
        id: coachId,
        name: String(coach.full_name || coach.email?.split('@')[0] || 'Coach'),
        avatar: String(coach.avatar_url || `https://api.dicebear.com/7.x/notionists/svg?seed=${coachId}`),
        bio: String(coach.goal || 'Personalized coaching for strength, body composition, and consistency.'),
        tags,
        rating: avgRating,
        reviewCount,
        monthlyPrice: toMonthlyPrice(clientCap),
        clientCap,
        activeClientCount,
        isAvailable: activeClientCount < clientCap,
      }
    })
    .sort((a, b) => {
      if (b.rating !== a.rating) return b.rating - a.rating
      if (b.reviewCount !== a.reviewCount) return b.reviewCount - a.reviewCount
      return a.monthlyPrice - b.monthlyPrice
    })

  return dataResponse({
    requestId,
    data: {
      coaches: discovered,
    },
  })
}
