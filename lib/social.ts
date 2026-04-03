export async function hasAcceptedFriendship(db: any, userA: string, userB: string): Promise<boolean> {
  if (!userA || !userB) return false
  if (userA === userB) return true

  const { data: direct } = await db
    .from('user_friendships')
    .select('id')
    .eq('requester_id', userA)
    .eq('addressee_id', userB)
    .eq('status', 'accepted')
    .maybeSingle()

  if (direct?.id) return true

  const { data: reverse } = await db
    .from('user_friendships')
    .select('id')
    .eq('requester_id', userB)
    .eq('addressee_id', userA)
    .eq('status', 'accepted')
    .maybeSingle()

  return !!reverse?.id
}

export async function hasActiveCoachClientLink(db: any, userA: string, userB: string): Promise<boolean> {
  if (!userA || !userB) return false
  if (userA === userB) return true

  const { data: direct } = await db
    .from('coach_client_links')
    .select('id')
    .eq('coach_id', userA)
    .eq('client_id', userB)
    .eq('status', 'active')
    .maybeSingle()

  if (direct?.id) return true

  const { data: reverse } = await db
    .from('coach_client_links')
    .select('id')
    .eq('coach_id', userB)
    .eq('client_id', userA)
    .eq('status', 'active')
    .maybeSingle()

  return !!reverse?.id
}

export async function canUsersDirectMessage(db: any, userA: string, userB: string): Promise<boolean> {
  if (!userA || !userB) return false
  if (userA === userB) return true

  const [friendship, coachClient] = await Promise.all([
    hasAcceptedFriendship(db, userA, userB),
    hasActiveCoachClientLink(db, userA, userB),
  ])

  return friendship || coachClient
}
