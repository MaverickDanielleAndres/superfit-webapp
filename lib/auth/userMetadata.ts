import { supabaseAdmin } from '@/lib/supabase/admin'

export interface UserMetadataPatch {
  role?: string
  account_status?: string
  is_premium?: boolean
  full_name?: string | null
}

export async function syncAuthUserMetadata(userId: string, patch: UserMetadataPatch) {
  if (!userId) return

  try {
    const { data: userData, error: userError } = await supabaseAdmin.auth.admin.getUserById(userId)
    if (userError || !userData?.user) return

    const currentMetadata =
      userData.user.user_metadata && typeof userData.user.user_metadata === 'object'
        ? (userData.user.user_metadata as Record<string, unknown>)
        : {}

    const nextMetadata = {
      ...currentMetadata,
      ...patch,
    }

    await supabaseAdmin.auth.admin.updateUserById(userId, {
      user_metadata: nextMetadata,
    })
  } catch {
    // Best-effort metadata synchronization for middleware/auth fast-path checks.
  }
}
