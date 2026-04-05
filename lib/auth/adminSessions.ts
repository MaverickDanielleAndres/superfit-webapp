import { supabaseAdmin } from '@/lib/supabase/admin'

export async function revokeAllUserSessions(userId: string): Promise<void> {
  if (!userId) return

  try {
    await (supabaseAdmin.auth.admin as any).signOut(userId, 'global')
  } catch {
    // Session revocation best-effort: route guards still block access if this fails.
  }
}