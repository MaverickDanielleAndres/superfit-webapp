import type { FoodItem, NutrientCategory } from '@/types'

export interface MacroNutrients {
  calories: number
  protein: number
  carbs: number
  fat: number
  fiber: number
}

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

export interface UsdaResolvedFood {
  id: string
  name: string
  brand?: string
  servingSize: number
  servingUnit: string
  category: NutrientCategory
  nutrientsPer100g: MacroNutrients
  isVerified: boolean
  source: 'usda' | 'cache'
}

const USDA_SEARCH_URL = 'https://api.nal.usda.gov/fdc/v1/foods/search'
const USDA_CACHE_TTL_MS = 10 * 60 * 1000

const usdaSearchCache = new Map<string, { expiresAt: number; value: UsdaResolvedFood[] }>()
const resolvedFoodCache = new Map<string, { expiresAt: number; value: UsdaResolvedFood | null }>()

const LOCAL_FALLBACKS: Array<UsdaResolvedFood & { aliases: string[] }> = [
  {
    id: 'cache-chicken-breast',
    name: 'Chicken breast, cooked',
    aliases: ['chicken', 'chicken breast', 'grilled chicken'],
    servingSize: 100,
    servingUnit: 'g',
    category: 'Protein',
    nutrientsPer100g: { calories: 165, protein: 31, carbs: 0, fat: 3.6, fiber: 0 },
    isVerified: true,
    source: 'cache',
  },
  {
    id: 'cache-white-rice',
    name: 'White rice, cooked',
    aliases: ['rice', 'white rice', 'steamed rice'],
    servingSize: 100,
    servingUnit: 'g',
    category: 'Grains',
    nutrientsPer100g: { calories: 130, protein: 2.7, carbs: 28.2, fat: 0.3, fiber: 0.4 },
    isVerified: true,
    source: 'cache',
  },
  {
    id: 'cache-salmon',
    name: 'Salmon, cooked',
    aliases: ['salmon', 'grilled salmon', 'baked salmon'],
    servingSize: 100,
    servingUnit: 'g',
    category: 'Protein',
    nutrientsPer100g: { calories: 208, protein: 20.4, carbs: 0, fat: 13.4, fiber: 0 },
    isVerified: true,
    source: 'cache',
  },
  {
    id: 'cache-oatmeal',
    name: 'Oatmeal, cooked',
    aliases: ['oatmeal', 'oats', 'porridge'],
    servingSize: 100,
    servingUnit: 'g',
    category: 'Grains',
    nutrientsPer100g: { calories: 71, protein: 2.5, carbs: 12, fat: 1.5, fiber: 1.7 },
    isVerified: true,
    source: 'cache',
  },
  {
    id: 'cache-egg',
    name: 'Egg, whole, cooked',
    aliases: ['egg', 'boiled egg', 'scrambled egg', 'eggs'],
    servingSize: 100,
    servingUnit: 'g',
    category: 'Protein',
    nutrientsPer100g: { calories: 155, protein: 13, carbs: 1.1, fat: 11, fiber: 0 },
    isVerified: true,
    source: 'cache',
  },
  {
    id: 'cache-greek-yogurt',
    name: 'Greek yogurt, plain',
    aliases: ['greek yogurt', 'yogurt', 'plain yogurt'],
    servingSize: 100,
    servingUnit: 'g',
    category: 'Dairy',
    nutrientsPer100g: { calories: 59, protein: 10.3, carbs: 3.6, fat: 0.4, fiber: 0 },
    isVerified: true,
    source: 'cache',
  },
]

function normalizeCategory(value: string): NutrientCategory {
  const text = value.toLowerCase()
  if (text.includes('fruit')) return 'Fruits'
  if (text.includes('vegetable') || text.includes('salad')) return 'Vegetables'
  if (text.includes('grain') || text.includes('rice') || text.includes('bread') || text.includes('oat')) return 'Grains'
  if (text.includes('dairy') || text.includes('milk') || text.includes('cheese') || text.includes('yogurt')) return 'Dairy'
  if (text.includes('protein') || text.includes('meat') || text.includes('egg') || text.includes('fish') || text.includes('chicken')) return 'Protein'
  if (text.includes('nut') || text.includes('seed')) return 'Nuts'
  if (text.includes('fat') || text.includes('oil')) return 'Fats'
  if (text.includes('drink') || text.includes('beverage')) return 'Beverages'
  return 'Other'
}

function extractNutrientsPer100g(nutrients: UsdaNutrient[]): MacroNutrients {
  let calories = 0
  let protein = 0
  let carbs = 0
  let fat = 0
  let fiber = 0

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
    } else if (name.includes('fiber')) {
      fiber = value
    }
  }

  return {
    calories: Number(calories.toFixed(2)),
    protein: Number(protein.toFixed(2)),
    carbs: Number(carbs.toFixed(2)),
    fat: Number(fat.toFixed(2)),
    fiber: Number(fiber.toFixed(2)),
  }
}

export function normalizeFoodName(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function getLocalFallback(name: string): UsdaResolvedFood | null {
  const normalized = normalizeFoodName(name)

  for (const item of LOCAL_FALLBACKS) {
    const direct = normalizeFoodName(item.name) === normalized
    const alias = item.aliases.some((entry) => normalizeFoodName(entry) === normalized)
    const includes = item.aliases.some((entry) => normalized.includes(normalizeFoodName(entry)))
    if (direct || alias || includes) {
      return {
        id: item.id,
        name: item.name,
        brand: item.brand,
        servingSize: item.servingSize,
        servingUnit: item.servingUnit,
        category: item.category,
        nutrientsPer100g: item.nutrientsPer100g,
        isVerified: item.isVerified,
        source: 'cache',
      }
    }
  }

  return null
}

async function searchUsda(query: string, limit: number): Promise<UsdaResolvedFood[]> {
  const normalizedQuery = normalizeFoodName(query)
  const cacheKey = `${normalizedQuery}::${limit}`
  const cached = usdaSearchCache.get(cacheKey)
  if (cached && cached.expiresAt > Date.now()) {
    return cached.value
  }

  const apiKey = process.env.USDA_API_KEY || ''
  if (!apiKey) return []

  const url = new URL(USDA_SEARCH_URL)
  url.searchParams.set('api_key', apiKey)
  url.searchParams.set('query', query)
  url.searchParams.set('pageSize', String(limit))

  const response = await fetch(url.toString(), { cache: 'no-store' })
  if (!response.ok) return []

  const payload = (await response.json()) as { foods?: UsdaFood[] }
  const results: UsdaResolvedFood[] = []

  for (const row of payload.foods || []) {
    const nutrients = extractNutrientsPer100g(Array.isArray(row.foodNutrients) ? row.foodNutrients : [])
    if (nutrients.calories <= 0) continue

    results.push({
      id: `usda-${String(row.fdcId || normalizeFoodName(String(row.description || 'food'))).replace(/\s+/g, '-')}`,
      name: String(row.description || 'USDA Food'),
      brand: row.brandName ? String(row.brandName) : undefined,
      servingSize: Number(row.servingSize || 100) || 100,
      servingUnit: String(row.servingSizeUnit || 'g'),
      category: normalizeCategory(String(row.foodCategory || row.description || 'other')),
      nutrientsPer100g: nutrients,
      isVerified: true,
      source: 'usda',
    })
  }

  usdaSearchCache.set(cacheKey, {
    expiresAt: Date.now() + USDA_CACHE_TTL_MS,
    value: results,
  })

  return results
}

export async function resolveFoodByName(name: string): Promise<UsdaResolvedFood | null> {
  const trimmed = name.trim()
  if (!trimmed.length) return null

  const normalizedTarget = normalizeFoodName(trimmed)
  const cached = resolvedFoodCache.get(normalizedTarget)
  if (cached && cached.expiresAt > Date.now()) {
    return cached.value
  }

  const usdaResults = await searchUsda(trimmed, 5)
  if (usdaResults.length) {
    const exact = usdaResults.find((entry) => normalizeFoodName(entry.name) === normalizedTarget)
    const resolved = exact || usdaResults[0]
    resolvedFoodCache.set(normalizedTarget, {
      expiresAt: Date.now() + USDA_CACHE_TTL_MS,
      value: resolved,
    })
    return resolved
  }

  const fallback = getLocalFallback(trimmed)
  resolvedFoodCache.set(normalizedTarget, {
    expiresAt: Date.now() + USDA_CACHE_TTL_MS,
    value: fallback,
  })
  return fallback
}

export async function searchFoodItems(query: string, limit = 12): Promise<{ foods: FoodItem[]; source: 'usda' | 'cache' }> {
  const safeLimit = Math.max(1, Math.min(limit, 20))
  const usdaResults = await searchUsda(query, safeLimit)

  if (usdaResults.length) {
    return {
      foods: usdaResults.slice(0, safeLimit).map(toFoodItem),
      source: 'usda',
    }
  }

  const localMatches = LOCAL_FALLBACKS.filter((entry) => {
    const normalizedQuery = normalizeFoodName(query)
    const inName = normalizeFoodName(entry.name).includes(normalizedQuery)
    const inAlias = entry.aliases.some((alias) => normalizeFoodName(alias).includes(normalizedQuery))
    return inName || inAlias
  })

  return {
    foods: localMatches.slice(0, safeLimit).map((entry) =>
      toFoodItem({
        id: entry.id,
        name: entry.name,
        brand: entry.brand,
        servingSize: entry.servingSize,
        servingUnit: entry.servingUnit,
        category: entry.category,
        nutrientsPer100g: entry.nutrientsPer100g,
        isVerified: true,
        source: 'cache',
      }),
    ),
    source: 'cache',
  }
}

export function calculateMacrosFromGrams(grams: number, nutrientsPer100g: MacroNutrients): MacroNutrients {
  const safeGrams = Math.max(0, Number.isFinite(grams) ? grams : 0)
  const ratio = safeGrams / 100

  return {
    calories: Number((ratio * nutrientsPer100g.calories).toFixed(2)),
    protein: Number((ratio * nutrientsPer100g.protein).toFixed(2)),
    carbs: Number((ratio * nutrientsPer100g.carbs).toFixed(2)),
    fat: Number((ratio * nutrientsPer100g.fat).toFixed(2)),
    fiber: Number((ratio * nutrientsPer100g.fiber).toFixed(2)),
  }
}

function toFoodItem(entry: UsdaResolvedFood): FoodItem {
  return {
    id: entry.id,
    name: entry.name,
    brand: entry.brand,
    servingSize: 100,
    servingUnit: 'g',
    calories: entry.nutrientsPer100g.calories,
    protein: entry.nutrientsPer100g.protein,
    carbs: entry.nutrientsPer100g.carbs,
    fat: entry.nutrientsPer100g.fat,
    fiber: entry.nutrientsPer100g.fiber,
    category: entry.category,
    isVerified: entry.isVerified,
  }
}