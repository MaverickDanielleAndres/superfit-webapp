interface AuditLogInput {
  userId: string
  action: string
  resource: string
  resourceId?: string | null
  metadata?: Record<string, unknown> | null
  ipAddress?: string | null
  userAgent?: string | null
}

export async function createAuditLog(db: any, input: AuditLogInput): Promise<void> {
  try {
    await db.from('audit_logs').insert({
      user_id: input.userId,
      action: input.action,
      resource: input.resource,
      resource_id: input.resourceId || null,
      metadata: input.metadata || null,
      ip_address: input.ipAddress || null,
      user_agent: input.userAgent || null,
    })
  } catch {
    // Audit logging must never block the primary mutation path.
  }
}