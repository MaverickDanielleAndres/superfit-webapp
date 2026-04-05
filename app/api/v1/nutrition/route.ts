import { z } from 'zod'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { dataResponse, problemResponse } from '@/lib/api/problem'
import type { Database, Json } from '@/types/supabase'

const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/

const FoodItemSchema = z
  .object({
    id: z.string().min(1),
    name: z.string().min(1),
    calories: z.number().min(0),
    protein: z.number().min(0),
    carbs: z.number().min(0),
    fat: z.number().min(0),
    servingSize: z.number().min(0),
    servingUnit: z.string().min(1),
    category: z.string().min(1),
    isVerified: z.boolean(),
  })
  .passthrough()

const NutritionCreateSchema = z.object({
  foodItemId: z.string().min(1),
  foodItem: FoodItemSchema,
  quantity: z.number().positive().max(100),
  mealSlot: z.enum(['breakfast', 'morning_snack', 'lunch', 'afternoon_snack', 'dinner', 'evening_snack']),
  loggedAt: z.string().datetime().optional(),
  notes: z.string().max(500).optional(),
  imageUrl: z.string().url().optional(),
  imageSource: z.enum(['manual_upload', 'ai_scan', 'food_api']).optional(),
  isAiGenerated: z.boolean().optional(),
  scanMetadata: z.record(z.string(), z.unknown()).optional(),
})

type NutritionInsertPayload = Database['public']['Tables']['nutrition_entries']['Insert'] & {
  image_url?: string | null
  image_source?: string | null
  is_ai_generated?: boolean
  scan_metadata?: Json | null
}

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

  const date = new URL(request.url).searchParams.get('date') || new Date().toISOString().slice(0, 10)
  if (!DATE_REGEX.test(date)) {
    return problemResponse({
      status: 422,
      code: 'VALIDATION_ERROR',
      title: 'Validation Error',
      detail: 'Query param date must be in YYYY-MM-DD format.',
      requestId,
      retriable: false,
    })
  }

  const from = `${date}T00:00:00.000Z`
  const to = `${date}T23:59:59.999Z`

  const { data, error } = await supabase
    .from('nutrition_entries')
    .select('*')
    .eq('user_id', user.id)
    .gte('logged_at', from)
    .lte('logged_at', to)
    .order('logged_at', { ascending: true })

  if (error) {
    return problemResponse({
      status: 500,
      code: 'NUTRITION_FETCH_FAILED',
      title: 'Nutrition Fetch Failed',
      detail: error.message,
      requestId,
    })
  }

  return dataResponse({
    requestId,
    data: {
      date,
      entries: data ?? [],
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

  const parsed = NutritionCreateSchema.safeParse(body)
  if (!parsed.success) {
    return problemResponse({
      status: 422,
      code: 'VALIDATION_ERROR',
      title: 'Validation Error',
      detail: 'Invalid nutrition payload.',
      requestId,
      retriable: false,
      errors: parsed.error.flatten(),
    })
  }

  const payload: NutritionInsertPayload = {
    user_id: user.id,
    food_item_id: parsed.data.foodItemId,
    food_item: parsed.data.foodItem as unknown as Json,
    quantity: parsed.data.quantity,
    meal_slot: parsed.data.mealSlot,
    logged_at: parsed.data.loggedAt || new Date().toISOString(),
    notes: parsed.data.notes || null,
  }

  payload.image_url = parsed.data.imageUrl || null
  payload.image_source = parsed.data.imageSource || null
  payload.is_ai_generated = parsed.data.isAiGenerated || false
  payload.scan_metadata = (parsed.data.scanMetadata as Json | undefined) || null

  const scanLogId =
    parsed.data.scanMetadata &&
    typeof parsed.data.scanMetadata === 'object' &&
    typeof parsed.data.scanMetadata.scanLogId === 'string'
      ? parsed.data.scanMetadata.scanLogId
      : null

  const { data, error } = await supabase
    .from('nutrition_entries')
    .insert(payload)
    .select('*')
    .single()

  if (error || !data) {
    return problemResponse({
      status: 500,
      code: 'NUTRITION_CREATE_FAILED',
      title: 'Nutrition Create Failed',
      detail: error?.message || 'Unable to add nutrition entry.',
      requestId,
    })
  }

  if (scanLogId) {
    const dynamicSupabase = supabase as unknown as {
      from: (table: string) => {
        update: (values: Record<string, unknown>) => {
          eq: (column: string, value: string) => {
            eq: (column: string, value: string) => Promise<unknown>
          }
        }
      }
    }

    await dynamicSupabase
      .from('nutrition_scan_logs')
      .update({ nutrition_entry_id: data.id })
      .eq('id', scanLogId)
      .eq('user_id', user.id)
  }

  return dataResponse({
    requestId,
    status: 201,
    data: {
      entry: data,
    },
  })
}
