import { createServerSupabaseClient } from '@/lib/supabase/server'
import { dataResponse, problemResponse } from '@/lib/api/problem'

interface RecipeSearchItem {
  id: string
  name: string
  cals: number
  protein: number
  carbs: number
  fat: number
  image: string
  badges: string[]
}

function inferBadges(protein: number, carbs: number): string[] {
  const badges: string[] = []
  if (protein >= 25) badges.push('High Protein')
  if (carbs <= 20) badges.push('Lower Carb')
  if (!badges.length) badges.push('Balanced')
  return badges
}

function fallbackRecipes(query: string): RecipeSearchItem[] {
  const all: RecipeSearchItem[] = [
    {
      id: 'fallback-grilled-chicken-rice',
      name: 'Grilled Chicken and Rice Bowl',
      cals: 560,
      protein: 42,
      carbs: 54,
      fat: 16,
      image: 'https://images.unsplash.com/photo-1598514982205-f36b96d1e8d4?w=600&fit=crop',
      badges: ['High Protein'],
    },
    {
      id: 'fallback-avocado-toast',
      name: 'Avocado Toast with Eggs',
      cals: 390,
      protein: 19,
      carbs: 30,
      fat: 21,
      image: 'https://images.unsplash.com/photo-1541519227354-08fa5d50c44d?w=600&fit=crop',
      badges: ['Balanced'],
    },
    {
      id: 'fallback-protein-smoothie',
      name: 'Protein Berry Smoothie',
      cals: 310,
      protein: 29,
      carbs: 28,
      fat: 8,
      image: 'https://images.unsplash.com/photo-1556881286-fc6915169721?w=600&fit=crop',
      badges: ['Quick', 'High Protein'],
    },
    {
      id: 'fallback-beef-stir-fry',
      name: 'Lean Beef Stir Fry',
      cals: 620,
      protein: 41,
      carbs: 52,
      fat: 27,
      image: 'https://images.unsplash.com/photo-1512058564366-18510be2db19?w=600&fit=crop',
      badges: ['High Protein'],
    },
  ]

  const normalized = query.toLowerCase()
  if (!normalized) return all
  return all.filter((recipe) => recipe.name.toLowerCase().includes(normalized))
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
  const query = (params.get('query') || params.get('q') || '').trim()
  const limit = Math.min(Number(params.get('limit') || 12), 20)

  const spoonKey = process.env.SPOONACULAR_API_KEY || process.env.NEXT_PUBLIC_SPOONACULAR_API_KEY || ''
  let recipes: RecipeSearchItem[] = []
  let source = 'fallback'

  if (spoonKey) {
    try {
      const spoonUrl = new URL('https://api.spoonacular.com/recipes/complexSearch')
      spoonUrl.searchParams.set('apiKey', spoonKey)
      spoonUrl.searchParams.set('number', String(limit))
      spoonUrl.searchParams.set('addRecipeNutrition', 'true')
      spoonUrl.searchParams.set('query', query || 'healthy')

      const spoonResponse = await fetch(spoonUrl.toString(), { cache: 'no-store' })
      if (spoonResponse.ok) {
        const spoonPayload = (await spoonResponse.json()) as {
          results?: Array<{
            id?: number
            title?: string
            image?: string
            nutrition?: { nutrients?: Array<{ name?: string; amount?: number }> }
          }>
        }

        recipes = (spoonPayload.results || []).map((recipe) => {
          const nutrients = recipe.nutrition?.nutrients || []
          const findNutrient = (name: string) => Number(nutrients.find((n) => String(n.name || '').toLowerCase() === name)?.amount || 0)

          const protein = Number(findNutrient('protein').toFixed(1))
          const carbs = Number(findNutrient('carbohydrates').toFixed(1))
          const fat = Number(findNutrient('fat').toFixed(1))
          const cals = Number(findNutrient('calories').toFixed(0))

          return {
            id: `spoon-${recipe.id || Math.random().toString(36).slice(2)}`,
            name: String(recipe.title || 'Recipe'),
            cals,
            protein,
            carbs,
            fat,
            image: String(recipe.image || 'https://images.unsplash.com/photo-1547592180-85f173990554?w=600&fit=crop'),
            badges: inferBadges(protein, carbs),
          }
        })

        if (recipes.length) {
          source = 'spoonacular'
        }
      }
    } catch {
      // Fall through to secondary provider.
    }
  }

  if (!recipes.length) {
    try {
      const mealDbUrl = new URL('https://www.themealdb.com/api/json/v1/1/search.php')
      mealDbUrl.searchParams.set('s', query)

      const mealDbResponse = await fetch(mealDbUrl.toString(), { cache: 'no-store' })
      if (mealDbResponse.ok) {
        const mealDbPayload = (await mealDbResponse.json()) as {
          meals?: Array<{
            idMeal?: string
            strMeal?: string
            strMealThumb?: string
          }>
        }

        recipes = (mealDbPayload.meals || []).slice(0, limit).map((recipe) => ({
          id: `mealdb-${recipe.idMeal || Math.random().toString(36).slice(2)}`,
          name: String(recipe.strMeal || 'Recipe'),
          cals: 420,
          protein: 24,
          carbs: 34,
          fat: 18,
          image: String(recipe.strMealThumb || 'https://images.unsplash.com/photo-1547592180-85f173990554?w=600&fit=crop'),
          badges: ['Balanced'],
        }))

        if (recipes.length) {
          source = 'mealdb'
        }
      }
    } catch {
      // Continue to deterministic fallback.
    }
  }

  if (!recipes.length) {
    recipes = fallbackRecipes(query).slice(0, limit)
    source = 'fallback'
  }

  return dataResponse({
    requestId,
    data: {
      recipes,
      source,
    },
  })
}
