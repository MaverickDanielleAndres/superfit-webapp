import { createClient } from '@/lib/supabase/client'

export function isSupabaseAuthEnabled() {
  return (
    process.env.NEXT_PUBLIC_ENABLE_SUPABASE_AUTH === 'true' &&
    !!process.env.NEXT_PUBLIC_SUPABASE_URL &&
    !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  )
}

export async function signInWithSupabase(email: string, password: string) {
  const supabase = createClient()
  return supabase.auth.signInWithPassword({ email, password })
}

export async function signUpWithSupabase(email: string, password: string, fullName: string) {
  const supabase = createClient()
  return supabase.auth.signUp({
    email,
    password,
    options: {
      data: { full_name: fullName }
    }
  })
}

export async function signUpWithSupabaseMetadata(
  email: string,
  password: string,
  fullName: string,
  metadata: Record<string, unknown>,
) {
  const supabase = createClient()
  return supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName,
        ...metadata,
      },
    },
  })
}

export async function signOutWithSupabase() {
  const supabase = createClient()
  return supabase.auth.signOut()
}

export async function fetchProfileRole(userId: string) {
  const supabase = createClient()
  return supabase
    .from('profiles')
    .select('full_name,avatar_url,role,onboarding_complete')
    .eq('id', userId)
    .maybeSingle()
}
