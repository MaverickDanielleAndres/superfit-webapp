import { z } from 'zod'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { dataResponse, problemResponse } from '@/lib/api/problem'
import type { MealSlot } from '@/types'
import { detectFoodsFromImageBase64 } from '@/lib/services/geminiVision'
import { calculateMacrosFromGrams, normalizeFoodName, resolveFoodByName } from '@/lib/services/usda'

const MIN_SCAN_INTERVAL_MS = 2_000
const MAX_IMAGE_BYTES = 2 * 1024 * 1024

const ScanRequestSchema = z
  .object({
    imageData: z.string().min(8),
    mealSlot: z.enum(['breakfast', 'morning_snack', 'lunch', 'afternoon_snack', 'dinner', 'evening_snack']).optional(),
    sourceType: z.enum(['upload', 'camera']).optional(),
  })
  .strict()

const lastScanTimestampByUser = new Map<string, number>()

function pickDefaultMealSlot(now = new Date()): MealSlot {
  const hour = now.getHours()
  if (hour < 11) return 'breakfast'
  if (hour < 14) return 'lunch'
  if (hour < 17) return 'afternoon_snack'
  if (hour < 21) return 'dinner'
  return 'evening_snack'
}

function extractBase64(input: string): string {
  if (input.includes(',')) {
    return input.split(',').pop()?.trim() || ''
  }
  return input.trim()
}

function getBase64SizeBytes(base64: string): number {
  const normalized = base64.replace(/\s/g, '')
  const padding = normalized.endsWith('==') ? 2 : normalized.endsWith('=') ? 1 : 0
  return Math.floor((normalized.length * 3) / 4) - padding
}

function averageConfidenceScore(confidence: Array<'high' | 'medium' | 'low'>): number {
  if (!confidence.length) return 0.5

  const sum = confidence.reduce((accumulator, level) => {
    if (level === 'high') return accumulator + 0.9
    if (level === 'medium') return accumulator + 0.75
    return accumulator + 0.6
  }, 0)

  return Number((sum / confidence.length).toFixed(2))
}

function elapsedMs(start: number): number {
  return Number((performance.now() - start).toFixed(2))
}

export async function POST(request: Request) {
  const startedAt = performance.now()
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

  const lastScanAt = lastScanTimestampByUser.get(user.id) || 0
  const elapsed = Date.now() - lastScanAt
  if (elapsed < MIN_SCAN_INTERVAL_MS) {
    return problemResponse({
      status: 429,
      code: 'RATE_LIMITED',
      title: 'Too Many Requests',
      detail: 'Please wait at least 2 seconds before starting another scan.',
      requestId,
      retriable: true,
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

  const parsed = ScanRequestSchema.safeParse(body)
  if (!parsed.success) {
    return problemResponse({
      status: 422,
      code: 'VALIDATION_ERROR',
      title: 'Validation Error',
      detail: 'Invalid AI scan payload.',
      requestId,
      retriable: false,
      errors: parsed.error.flatten(),
    })
  }

  const base64 = extractBase64(parsed.data.imageData)
  if (!base64.length) {
    return problemResponse({
      status: 422,
      code: 'VALIDATION_ERROR',
      title: 'Validation Error',
      detail: 'Image data is required.',
      requestId,
      retriable: false,
    })
  }

  if (getBase64SizeBytes(base64) > MAX_IMAGE_BYTES) {
    return problemResponse({
      status: 413,
      code: 'PAYLOAD_TOO_LARGE',
      title: 'Image Too Large',
      detail: 'Image must be 2MB or less.',
      requestId,
      retriable: false,
    })
  }

  lastScanTimestampByUser.set(user.id, Date.now())

  const detectStartedAt = performance.now()
  let detected
  try {
    detected = await detectFoodsFromImageBase64(base64)
  } catch (error) {
    return problemResponse({
      status: 502,
      code: 'AI_SCAN_FAILED',
      title: 'Scan Failed',
      detail: error instanceof Error ? error.message : 'Unable to analyze image right now.',
      requestId,
      retriable: true,
    })
  }
  const detectMs = elapsedMs(detectStartedAt)

  if (!detected.is_food) {
    return dataResponse({
      requestId,
      data: {
        isFood: false,
        message: 'No food detected',
        foods: [],
        telemetry: {
          detectMs,
          resolveMs: 0,
          totalMs: elapsedMs(startedAt),
        },
      },
    })
  }

  const resolveStartedAt = performance.now()
  const uniqueFoodNames = Array.from(new Set(detected.foods.map((entry) => normalizeFoodName(entry.name))))
  const resolvedByName = new Map<string, Awaited<ReturnType<typeof resolveFoodByName>>>()

  await Promise.all(
    uniqueFoodNames.map(async (normalizedName) => {
      resolvedByName.set(normalizedName, await resolveFoodByName(normalizedName))
    }),
  )

  const foods = await Promise.all(
    detected.foods.map(async (entry) => {
      const resolved = resolvedByName.get(normalizeFoodName(entry.name)) || null
      if (!resolved) return null

      const grams = Number(entry.estimated_grams)
      const computed = calculateMacrosFromGrams(grams, resolved.nutrientsPer100g)

      return {
        name: resolved.name,
        estimatedGrams: grams,
        portionDescription: entry.portion_description,
        confidence: entry.confidence,
        source: resolved.source,
        item: {
          id: resolved.id,
          name: resolved.name,
          brand: resolved.brand,
          servingSize: 100,
          servingUnit: 'g',
          calories: resolved.nutrientsPer100g.calories,
          protein: resolved.nutrientsPer100g.protein,
          carbs: resolved.nutrientsPer100g.carbs,
          fat: resolved.nutrientsPer100g.fat,
          fiber: resolved.nutrientsPer100g.fiber,
          category: resolved.category,
          isVerified: resolved.isVerified,
        },
        macros: computed,
      }
    }),
  )
  const resolveMs = elapsedMs(resolveStartedAt)
  const totalMs = elapsedMs(startedAt)

  const resolvedFoods = foods.filter((food): food is NonNullable<typeof food> => Boolean(food))
  if (!resolvedFoods.length) {
    return dataResponse({
      requestId,
      data: {
        isFood: false,
        message: 'No food detected',
        foods: [],
        telemetry: {
          detectMs,
          resolveMs,
          totalMs,
        },
      },
    })
  }

  const dynamicSupabase = supabase as unknown as {
    from: (table: string) => {
      insert: (values: unknown) => {
        select: (columns: string) => {
          single: () => Promise<{ data: { id?: string } | null }>
        }
      }
    }
  }

  const { data: scanLog } = await dynamicSupabase
    .from('nutrition_scan_logs')
    .insert({
      user_id: user.id,
      source_type: parsed.data.sourceType || 'upload',
      provider: 'gemini+usda',
      confidence_score: averageConfidenceScore(resolvedFoods.map((item) => item.confidence)),
      response_payload: {
        detectedFoods: detected.foods,
        resolvedFoods,
        telemetry: {
          detectMs,
          resolveMs,
          totalMs,
        },
      },
    })
    .select('id')
    .single()

  return dataResponse({
    requestId,
    data: {
      isFood: true,
      foods: resolvedFoods,
      mealSlot: parsed.data.mealSlot || pickDefaultMealSlot(),
      scanLogId: (scanLog as { id?: string } | null)?.id || null,
      sourceType: parsed.data.sourceType || 'upload',
      telemetry: {
        detectMs,
        resolveMs,
        totalMs,
      },
    },
  })
}
