export interface CreateNotificationInput {
  recipientId: string
  actorId?: string | null
  type: string
  title: string
  body: string
  actionUrl?: string | null
  payload?: Record<string, unknown>
}

export async function createNotification(db: any, input: CreateNotificationInput): Promise<void> {
  const payload = {
    recipient_id: input.recipientId,
    actor_id: input.actorId || null,
    type: input.type,
    title: input.title,
    body: input.body,
    action_url: input.actionUrl || null,
    payload: input.payload || {},
    delivered_at: new Date().toISOString(),
  }

  await db.from('notifications').insert(payload)
}

export async function createNotifications(db: any, inputs: CreateNotificationInput[]): Promise<void> {
  if (!inputs.length) return

  const now = new Date().toISOString()
  const payload = inputs.map((input) => ({
    recipient_id: input.recipientId,
    actor_id: input.actorId || null,
    type: input.type,
    title: input.title,
    body: input.body,
    action_url: input.actionUrl || null,
    payload: input.payload || {},
    delivered_at: now,
  }))

  await db.from('notifications').insert(payload)
}
