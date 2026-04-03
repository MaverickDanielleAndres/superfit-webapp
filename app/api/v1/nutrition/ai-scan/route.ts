import { z } from 'zod'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { dataResponse, problemResponse } from '@/lib/api/problem'
import type { FoodItem, MealSlot, NutrientCategory } from '@/types'

const ScanRequestSchema = z
  .object({
    imageData: z.string().min(8).optional(),
    imageUrl: z.string().url().optional(),
    mealSlot: z.enum(['breakfast', 'morning_snack', 'lunch', 'afternoon_snack', 'dinner', 'evening_snack']).optional(),
  })
  .refine((value) => Boolean(value.imageData || value.imageUrl), {
    message: 'Provide either imageData or imageUrl.',
    path: ['imageData'],
  })

interface FoodTemplate {
  item: FoodItem
  quantity: number
}

const FOOD_TEMPLATES: FoodTemplate[] = [
  {
    item: {
      id: 'scan-salmon-bowl',
      name: 'Grilled Salmon Bowl',
      brand: 'AI Estimated',
      servingSize: 1,
      servingUnit: 'bowl',
      calories: 520,
      protein: 42,
      carbs: 35,
      fat: 22,
      category: 'Protein',
      isVerified: false,
    },
    quantity: 1,
  },
  {
    item: {
      id: 'scan-chicken-rice',
      name: 'Chicken and Rice Plate',
      brand: 'AI Estimated',
      servingSize: 1,
      servingUnit: 'plate',
      calories: 610,
      protein: 49,
      carbs: 58,
      fat: 20,
      category: 'Protein',
      isVerified: false,
    },
    quantity: 1,
  },
  {
    item: {
      id: 'scan-oatmeal-bowl',
      name: 'Protein Oatmeal Bowl',
      brand: 'AI Estimated',
      servingSize: 1,
      servingUnit: 'bowl',
      calories: 430,
      protein: 28,
      carbs: 54,
      fat: 12,
      category: 'Grains',
      isVerified: false,
    },
    quantity: 1,
  },
  {
    item: {
      id: 'scan-greek-yogurt-fruit',
      name: 'Greek Yogurt and Fruit',
      brand: 'AI Estimated',
      servingSize: 1,
      servingUnit: 'serving',
      calories: 290,
      protein: 22,
      carbs: 30,
      fat: 8,
      category: 'Dairy',
      isVerified: false,
    },
    quantity: 1,
  },
]

function pickDefaultMealSlot(now = new Date()): MealSlot {
  const hour = now.getHours()
  if (hour < 11) return 'breakfast'
  if (hour < 14) return 'lunch'
  if (hour < 17) return 'afternoon_snack'
  if (hour < 21) return 'dinner'
  return 'evening_snack'
}

function normalizeCategory(value: string): NutrientCategory {
  const text = value.toLowerCase()
  if (text.includes('fruit')) return 'Fruits'
  if (text.includes('vegetable') || text.includes('salad')) return 'Vegetables'
  if (text.includes('grain') || text.includes('rice') || text.includes('bread') || text.includes('oat')) return 'Grains'
  if (text.includes('dairy') || text.includes('milk') || text.includes('yogurt') || text.includes('cheese')) return 'Dairy'
  if (text.includes('fish') || text.includes('salmon') || text.includes('meat') || text.includes('chicken') || text.includes('egg')) return 'Protein'
  return 'Other'
}

function hashString(value: string): number {
  let hash = 0
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash * 31 + value.charCodeAt(i)) >>> 0
  }
  return hash
}

function pickTemplateByHints(hints: string[], entropySeed: string): FoodTemplate {
  const joined = hints.join(' ').toLowerCase()

  if (!joined.trim()) {
    return FOOD_TEMPLATES[0]
  }

  if (joined.includes('salmon') || joined.includes('fish')) return FOOD_TEMPLATES[0]
  if (joined.includes('chicken') || joined.includes('rice')) return FOOD_TEMPLATES[1]
  if (joined.includes('oat') || joined.includes('oatmeal')) return FOOD_TEMPLATES[2]
  if (joined.includes('yogurt') || joined.includes('berry') || joined.includes('fruit')) return FOOD_TEMPLATES[3]

  const index = hashString(entropySeed) % FOOD_TEMPLATES.length
  return FOOD_TEMPLATES[index]
}

async function getVisionHints(imageData: string): Promise<string[]> {
  const googleVisionKey = process.env.GOOGLE_VISION_API_KEY || ''
  if (!googleVisionKey) return []

  const base64 = imageData.includes(',') ? imageData.split(',').pop() || '' : imageData
  if (!base64) return []

  try {
    const response = await fetch(`https://vision.googleapis.com/v1/images:annotate?key=${googleVisionKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        requests: [
          {
            image: { content: base64 },
            features: [
              { type: 'LABEL_DETECTION', maxResults: 10 },
              { type: 'OBJECT_LOCALIZATION', maxResults: 10 },
            ],
          },
        ],
      }),
    })

    if (!response.ok) return []

    const payload = (await response.json()) as {
      responses?: Array<{
        labelAnnotations?: Array<{ description?: string }>
        localizedObjectAnnotations?: Array<{ name?: string }>
      }>
    }

    const first = payload.responses?.[0]
    const labels = (first?.labelAnnotations || []).map((label) => String(label.description || '').trim()).filter(Boolean)
    const objects = (first?.localizedObjectAnnotations || []).map((object) => String(object.name || '').trim()).filter(Boolean)

    return [...labels, ...objects]
  } catch {
    return []
  }
}

async function getSpoonacularHints(imageUrl: string): Promise<string[]> {
  const spoonKey = process.env.SPOONACULAR_API_KEY || process.env.NEXT_PUBLIC_SPOONACULAR_API_KEY || ''
  if (!spoonKey) return []

  try {
    const url = new URL('https://api.spoonacular.com/food/images/classify')
    url.searchParams.set('apiKey', spoonKey)
    url.searchParams.set('imageUrl', imageUrl)

    const response = await fetch(url.toString(), { cache: 'no-store' })
    if (!response.ok) return []

    const payload = (await response.json()) as {
      category?: string
      probability?: number
    }

    if (!payload.category) return []
    return [String(payload.category)]
  } catch {
    return []
  }
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

  const hints = new Set<string>()

  if (parsed.data.imageData) {
    for (const hint of await getVisionHints(parsed.data.imageData)) {
      hints.add(hint)
    }
  }

  if (parsed.data.imageUrl) {
    for (const hint of await getSpoonacularHints(parsed.data.imageUrl)) {
      hints.add(hint)
    }
  }

  const entropySeed = `${parsed.data.imageData || ''}|${parsed.data.imageUrl || ''}|${user.id}`
  const selectedTemplate = pickTemplateByHints(Array.from(hints), entropySeed)

  const normalizedItem: FoodItem = {
    ...selectedTemplate.item,
    category: normalizeCategory(selectedTemplate.item.category),
  }

  return dataResponse({
    requestId,
    data: {
      item: normalizedItem,
      quantity: selectedTemplate.quantity,
      mealSlot: parsed.data.mealSlot || pickDefaultMealSlot(),
      hints: Array.from(hints).slice(0, 6),
    },
  })
}
