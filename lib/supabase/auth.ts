import { createClient } from '@/lib/supabase/client'

function normalizeSupabaseAuthError(error: unknown) {
  if (error instanceof Error) {
    if (/failed to fetch|fetch failed|networkerror|load failed/i.test(error.message)) {
      return new Error(
        'Unable to reach Supabase authentication service. Verify NEXT_PUBLIC_SUPABASE_URL and your network/DNS connectivity.'
      )
    }
    return error
  }

  return new Error('Unexpected authentication error.')
}

export function isSupabaseAuthEnabled() {
  return (
    process.env.NEXT_PUBLIC_ENABLE_SUPABASE_AUTH === 'true' &&
    !!process.env.NEXT_PUBLIC_SUPABASE_URL &&
    !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  )
}

export async function signInWithSupabase(email: string, password: string) {
  const supabase = createClient()
  try {
    return await supabase.auth.signInWithPassword({ email, password })
  } catch (error) {
    throw normalizeSupabaseAuthError(error)
  }
}

export async function signUpWithSupabase(email: string, password: string, fullName: string) {
  const supabase = createClient()
  try {
    return await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName }
      }
    })
  } catch (error) {
    throw normalizeSupabaseAuthError(error)
  }
}

export async function signUpWithSupabaseMetadata(
  email: string,
  password: string,
  fullName: string,
  metadata: Record<string, unknown>,
) {
  const supabase = createClient()
  try {
    return await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          ...metadata,
        },
      },
    })
  } catch (error) {
    throw normalizeSupabaseAuthError(error)
  }
}

export async function signOutWithSupabase() {
  const supabase = createClient()
  try {
    return await supabase.auth.signOut()
  } catch (error) {
    throw normalizeSupabaseAuthError(error)
  }
}

export async function fetchProfileRole(userId: string) {
  const supabase = createClient()
  return supabase
    .from('profiles')
    .select('full_name,avatar_url,role,onboarding_complete')
    .eq('id', userId)
    .maybeSingle()
}
