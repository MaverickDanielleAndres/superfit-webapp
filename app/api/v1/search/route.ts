import { createServerSupabaseClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { dataResponse, problemResponse } from '@/lib/api/problem'

interface SearchResultItem {
  id: string
  kind: 'route' | 'user' | 'exercise'
  title: string
  subtitle: string
  href: string
}

const ROUTES: Array<{ href: string; title: string; keywords: string[]; subtitle: string }> = [
  { href: '/', title: 'Dashboard', subtitle: 'Overview and daily stats', keywords: ['dashboard', 'home', 'summary', 'overview'] },
  { href: '/workout', title: 'Workout', subtitle: 'Train and log sessions', keywords: ['workout', 'train', 'session', 'gym'] },
  { href: '/exercises', title: 'Exercises', subtitle: 'Exercise library', keywords: ['exercise', 'movement', 'library'] },
  { href: '/diary', title: 'Diary', subtitle: 'Nutrition diary', keywords: ['diary', 'nutrition', 'food', 'calories'] },
  { href: '/community', title: 'Community', subtitle: 'Feed and social activity', keywords: ['community', 'feed', 'posts', 'social'] },
  { href: '/messages', title: 'Messages', subtitle: 'Direct conversations', keywords: ['messages', 'chat', 'dm', 'conversation'] },
  { href: '/coaching', title: 'Coaching', subtitle: 'Coach marketplace and tools', keywords: ['coaching', 'coach', 'program'] },
  { href: '/settings', title: 'Settings', subtitle: 'Profile and preferences', keywords: ['settings', 'profile', 'preferences'] },
  { href: '/analytics', title: 'Analytics', subtitle: 'Progress analytics', keywords: ['analytics', 'charts', 'metrics'] },
  { href: '/meal-planner', title: 'Meal Planner', subtitle: 'Plan meals and groceries', keywords: ['meal', 'planner', 'recipes', 'grocery'] },
  { href: '/progress', title: 'Progress', subtitle: 'Photos and measurements', keywords: ['progress', 'weight', 'measurements', 'photos'] },
]

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
  const query = String(params.get('q') || '').trim().toLowerCase()

  if (query.length < 2) {
    return dataResponse({
      requestId,
      data: {
        results: [] as SearchResultItem[],
      },
    })
  }

  const routeResults: SearchResultItem[] = ROUTES
    .filter((route) => {
      const haystack = [route.title, route.subtitle, ...route.keywords].join(' ').toLowerCase()
      return haystack.includes(query)
    })
    .slice(0, 8)
    .map((route) => ({
      id: `route-${route.href}`,
      kind: 'route',
      title: route.title,
      subtitle: route.subtitle,
      href: route.href,
    }))

  const userRowsPromise = (db as any)
    .from('profiles')
    .select('id,full_name,email,role')
    .or(`full_name.ilike.%${query}%,email.ilike.%${query}%`)
    .limit(6)

  const exerciseRowsPromise = (db as any)
    .from('workout_sessions')
    .select('id,name')
    .ilike('name', `%${query}%`)
    .limit(6)

  const [{ data: userRows }, { data: exerciseRows }] = await Promise.all([userRowsPromise, exerciseRowsPromise])

  const userResults: SearchResultItem[] = (userRows || []).map((row: any) => ({
    id: `user-${String(row.id || '')}`,
    kind: 'user',
    title: String(row.full_name || row.email?.split('@')[0] || 'User'),
    subtitle: `${String(row.role || 'user')} profile`,
    href: '/community',
  }))

  const workoutResults: SearchResultItem[] = (exerciseRows || []).map((row: any) => ({
    id: `exercise-${String(row.id || '')}`,
    kind: 'exercise',
    title: String(row.name || 'Workout session'),
    subtitle: 'Workout history match',
    href: '/workout',
  }))

  const results = [...routeResults, ...userResults, ...workoutResults].slice(0, 12)

  return dataResponse({
    requestId,
    data: {
      results,
    },
  })
}
