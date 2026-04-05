import { createServerSupabaseClient } from '@/lib/supabase/server'
import { dataResponse, problemResponse } from '@/lib/api/problem'
import type { FoodItem, NutrientCategory } from '@/types'

const DEFAULT_LIMIT = 12

interface UsdaNutrient {
  nutrientName?: string
  value?: number
  unitName?: string
}

interface UsdaFood {
  fdcId?: number
  description?: string
  brandName?: string
  servingSize?: number
  servingSizeUnit?: string
  foodNutrients?: UsdaNutrient[]
  foodCategory?: string
}

interface SpoonIngredient {
  id?: number
  name?: string
  image?: string
}

function buildSpoonacularImageUrl(image: string | undefined): string | undefined {
  if (!image) return undefined
  if (image.startsWith('http://') || image.startsWith('https://')) return image
  return `https://img.spoonacular.com/ingredients_250x250/${image}`
}

function normalizeCategory(value: string): NutrientCategory {
  const text = value.toLowerCase()
  if (text.includes('fruit')) return 'Fruits'
  if (text.includes('vegetable')) return 'Vegetables'
  if (text.includes('grain') || text.includes('rice') || text.includes('bread')) return 'Grains'
  if (text.includes('dairy') || text.includes('milk') || text.includes('cheese') || text.includes('yogurt')) return 'Dairy'
  if (text.includes('protein') || text.includes('meat') || text.includes('egg') || text.includes('fish')) return 'Protein'
  if (text.includes('nut') || text.includes('seed')) return 'Nuts'
  if (text.includes('oil') || text.includes('fat')) return 'Fats'
  if (text.includes('drink') || text.includes('beverage')) return 'Beverages'
  return 'Other'
}

function extractUsdaMacros(nutrients: UsdaNutrient[]) {
  let calories = 0
  let protein = 0
  let carbs = 0
  let fat = 0

  for (const nutrient of nutrients) {
    const name = String(nutrient.nutrientName || '').toLowerCase()
    const value = Number(nutrient.value || 0)
    if (!Number.isFinite(value)) continue

    if (name.includes('energy') && (name.includes('kcal') || String(nutrient.unitName || '').toLowerCase() === 'kcal')) {
      calories = value
    } else if (name === 'protein') {
      protein = value
    } else if (name.includes('carbohydrate')) {
      carbs = value
    } else if (name.includes('total lipid') || name === 'fat') {
      fat = value
    }
  }

  return { calories, protein, carbs, fat }
}

function buildFallbackFoods(query: string): FoodItem[] {
  const fallback: FoodItem[] = [
    { id: 'fallback-chicken-breast', name: 'Chicken Breast', brand: 'Generic', servingSize: 100, servingUnit: 'g', calories: 165, protein: 31, carbs: 0, fat: 3.6, category: 'Protein', isVerified: true },
    { id: 'fallback-salmon', name: 'Salmon Fillet', brand: 'Generic', servingSize: 100, servingUnit: 'g', calories: 208, protein: 20, carbs: 0, fat: 13, category: 'Protein', isVerified: true },
    { id: 'fallback-greek-yogurt', name: 'Greek Yogurt', brand: 'Generic', servingSize: 170, servingUnit: 'g', calories: 100, protein: 17, carbs: 6, fat: 0, category: 'Dairy', isVerified: true },
    { id: 'fallback-oatmeal', name: 'Oatmeal', brand: 'Generic', servingSize: 40, servingUnit: 'g', calories: 150, protein: 5, carbs: 27, fat: 3, category: 'Grains', isVerified: true },
    { id: 'fallback-rice', name: 'White Rice (Cooked)', brand: 'Generic', servingSize: 100, servingUnit: 'g', calories: 130, protein: 2.4, carbs: 28, fat: 0.3, category: 'Grains', isVerified: true },
    { id: 'fallback-eggs', name: 'Whole Egg', brand: 'Generic', servingSize: 50, servingUnit: 'g', calories: 72, protein: 6.3, carbs: 0.4, fat: 4.8, category: 'Protein', isVerified: true },
  ]

  const normalized = query.toLowerCase()
  return fallback.filter((food) => `${food.name} ${food.brand || ''}`.toLowerCase().includes(normalized))
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

  const usdaKey = process.env.USDA_API_KEY || process.env.NEXT_PUBLIC_USDA_API_KEY || ''
  const spoonKey = process.env.SPOONACULAR_API_KEY || process.env.NEXT_PUBLIC_SPOONACULAR_API_KEY || ''

  const foods: FoodItem[] = []
  const seenIds = new Set<string>()
  let source = 'fallback'

  if (usdaKey) {
    try {
      const usdaUrl = new URL('https://api.nal.usda.gov/fdc/v1/foods/search')
      usdaUrl.searchParams.set('api_key', usdaKey)
      usdaUrl.searchParams.set('query', query)
      usdaUrl.searchParams.set('pageSize', String(limit))

      const response = await fetch(usdaUrl.toString(), { cache: 'no-store' })
      if (response.ok) {
        const payload = (await response.json()) as { foods?: UsdaFood[] }

        for (const usdaFood of payload.foods || []) {
          const id = `usda-${usdaFood.fdcId || usdaFood.description || Math.random().toString(36).slice(2)}`
          if (seenIds.has(id)) continue

          const macros = extractUsdaMacros(Array.isArray(usdaFood.foodNutrients) ? usdaFood.foodNutrients : [])
          if (macros.calories <= 0) continue

          const item: FoodItem = {
            id,
            name: String(usdaFood.description || 'USDA Food'),
            brand: usdaFood.brandName ? String(usdaFood.brandName) : undefined,
            servingSize: Number(usdaFood.servingSize || 100) || 100,
            servingUnit: String(usdaFood.servingSizeUnit || 'g'),
            calories: Number(macros.calories.toFixed(1)),
            protein: Number(macros.protein.toFixed(1)),
            carbs: Number(macros.carbs.toFixed(1)),
            fat: Number(macros.fat.toFixed(1)),
            category: normalizeCategory(String(usdaFood.foodCategory || usdaFood.description || 'other')),
            isVerified: true,
          }

          foods.push(item)
          seenIds.add(id)
          if (foods.length >= limit) break
        }

        if (foods.length > 0) {
          source = 'usda'
        }
      }
    } catch {
      // Continue with secondary providers.
    }
  }

  if (foods.length < limit && spoonKey) {
    try {
      const ingredientsUrl = new URL('https://api.spoonacular.com/food/ingredients/search')
      ingredientsUrl.searchParams.set('apiKey', spoonKey)
      ingredientsUrl.searchParams.set('query', query)
      ingredientsUrl.searchParams.set('number', String(Math.min(limit, 8)))

      const ingredientsResponse = await fetch(ingredientsUrl.toString(), { cache: 'no-store' })
      if (ingredientsResponse.ok) {
        const ingredientsPayload = (await ingredientsResponse.json()) as { results?: SpoonIngredient[] }
        const ingredients = Array.isArray(ingredientsPayload.results) ? ingredientsPayload.results : []

        const detailResponses = await Promise.all(
          ingredients.map(async (ingredient) => {
            const ingredientId = Number(ingredient.id)
            if (!Number.isFinite(ingredientId)) return null

            const infoUrl = new URL(`https://api.spoonacular.com/food/ingredients/${ingredientId}/information`)
            infoUrl.searchParams.set('apiKey', spoonKey)
            infoUrl.searchParams.set('amount', '100')
            infoUrl.searchParams.set('unit', 'grams')

            const infoResponse = await fetch(infoUrl.toString(), { cache: 'no-store' })
            if (!infoResponse.ok) return null

            const info = (await infoResponse.json()) as {
              id?: number
              name?: string
              nutrition?: { nutrients?: Array<{ name?: string; amount?: number }> }
            }

            const nutrients = info.nutrition?.nutrients || []
            const getValue = (names: string[]) => {
              const item = nutrients.find((nutrient) => names.includes(String(nutrient.name || '').toLowerCase()))
              return Number(item?.amount || 0)
            }

            const spoonItem: FoodItem = {
              id: `spoon-${info.id || ingredientId}`,
              name: String(info.name || ingredient.name || 'Ingredient'),
              imageUrl: buildSpoonacularImageUrl(ingredient.image),
              servingSize: 100,
              servingUnit: 'g',
              calories: Number(getValue(['calories']).toFixed(1)),
              protein: Number(getValue(['protein']).toFixed(1)),
              carbs: Number(getValue(['carbohydrates']).toFixed(1)),
              fat: Number(getValue(['fat']).toFixed(1)),
              category: normalizeCategory(String(info.name || ingredient.name || 'other')),
              isVerified: true,
            }

            if (spoonItem.calories <= 0) return null
            return spoonItem
          }),
        )

        for (const detail of detailResponses) {
          if (!detail || seenIds.has(detail.id)) continue
          foods.push(detail)
          seenIds.add(detail.id)
          if (foods.length >= limit) break
        }

        if (foods.length > 0 && source === 'fallback') {
          source = 'spoonacular'
        }
      }
    } catch {
      // Continue with fallback.
    }
  }

  if (!foods.length) {
    const fallbackFoods = buildFallbackFoods(query).slice(0, limit)
    for (const fallback of fallbackFoods) {
      foods.push(fallback)
    }
    source = 'fallback'
  }

  return dataResponse({
    requestId,
    data: {
      foods: foods.slice(0, limit),
      source,
    },
  })
}
