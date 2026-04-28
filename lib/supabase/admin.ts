import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/types/supabase'

let supabaseAdminClient: ReturnType<typeof createClient<Database>> | null = null

function getSupabaseAdminClient() {
  if (supabaseAdminClient) {
    return supabaseAdminClient
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim()
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim()

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error(
      'Supabase admin environment variables are missing. Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.'
    )
  }

  try {
    new URL(supabaseUrl)
  } catch {
    throw new Error('NEXT_PUBLIC_SUPABASE_URL is not a valid URL.')
  }

  supabaseAdminClient = createClient<Database>(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

  return supabaseAdminClient
}

export const supabaseAdmin = new Proxy({} as ReturnType<typeof createClient<Database>>, {
  get(_, property, receiver) {
    const client = getSupabaseAdminClient()
    const value = Reflect.get(client, property, receiver)

    return typeof value === 'function' ? value.bind(client) : value
  },
})
