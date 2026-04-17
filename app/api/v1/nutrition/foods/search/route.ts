import { createServerSupabaseClient } from '@/lib/supabase/server'
import { dataResponse, problemResponse } from '@/lib/api/problem'
import { searchFoodItems } from '@/lib/services/usda'

const DEFAULT_LIMIT = 12

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

  const params = new URL(request.url).searchParams
  const query = (params.get('q') || '').trim()
  const limit = Math.min(Number(params.get('limit') || DEFAULT_LIMIT), 20)

  if (query.length < 2) {
    return problemResponse({
      status: 422,
      code: 'VALIDATION_ERROR',
      title: 'Validation Error',
      detail: 'Query must be at least 2 characters.',
      requestId,
      retriable: false,
    })
  }

  const { foods, source } = await searchFoodItems(query, limit)

  return dataResponse({
    requestId,
    data: {
      foods: foods.slice(0, limit),
      source,
    },
  })
}
