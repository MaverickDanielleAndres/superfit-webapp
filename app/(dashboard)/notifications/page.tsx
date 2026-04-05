'use client'

import { useEffect } from 'react'
import { motion } from 'framer-motion'
import { Bell, CheckCheck } from 'lucide-react'
import { usePathname, useRouter } from 'next/navigation'
import { useNotificationStore } from '@/store/useNotificationStore'
import { useAuthStore } from '@/store/useAuthStore'
import { isSupabaseAuthEnabled } from '@/lib/supabase/auth'

function formatTime(value: string): string {
  const date = new Date(value)
  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

export default function NotificationsPage() {
  const router = useRouter()
  const pathname = usePathname()
  const { user } = useAuthStore()
  const { notifications, unreadCount, initialize, markAllRead, markRead, startRealtime, stopRealtime } = useNotificationStore()
  const isCoachSurface = pathname.startsWith('/coach')

  useEffect(() => {
    void initialize()
  }, [initialize])

  useEffect(() => {
    if (!user?.id || !isSupabaseAuthEnabled()) return

    startRealtime(user.id)
    return () => {
      stopRealtime()
    }
  }, [startRealtime, stopRealtime, user?.id])

  const resolveActionUrl = (actionUrl: string | null): string | null => {
    if (!actionUrl) return null
    if (!isCoachSurface) return actionUrl
    if (actionUrl.startsWith('/coach/')) return actionUrl
    if (actionUrl.startsWith('/messages')) return `/coach${actionUrl}`
    if (actionUrl.startsWith('/notifications')) return `/coach${actionUrl}`
    if (actionUrl === '/coaching') return '/coach/clients'
    if (actionUrl.startsWith('/coaching?')) return `/coach/clients${actionUrl.slice('/coaching'.length)}`
    return actionUrl
  }

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="max-w-4xl mx-auto pb-20">
      <div className="flex items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="font-display font-bold text-[30px] text-(--text-primary)">Notifications</h1>
          <p className="font-body text-[14px] text-(--text-secondary)">
            {unreadCount > 0 ? `${unreadCount} unread` : 'All caught up'}
          </p>
        </div>

        <button
          onClick={() => {
            void markAllRead()
          }}
          className="h-[40px] px-4 rounded-[12px] bg-(--bg-surface) border border-(--border-subtle) text-(--text-primary) font-body text-[13px] font-bold hover:bg-[var(--bg-elevated)] transition-colors"
        >
          <span className="inline-flex items-center gap-2">
            <CheckCheck className="w-[16px] h-[16px]" />
            Mark All Read
          </span>
        </button>
      </div>

      <div className="bg-(--bg-surface) border border-(--border-subtle) rounded-[20px] overflow-hidden">
        {notifications.length === 0 ? (
          <div className="p-10 text-center">
            <Bell className="w-[28px] h-[28px] mx-auto text-(--text-tertiary)" />
            <p className="mt-3 font-body text-[14px] text-(--text-secondary)">No notifications yet.</p>
          </div>
        ) : (
          notifications.map((item) => (
            <button
              key={item.id}
              onClick={() => {
                void markRead(item.id)
                const actionUrl = resolveActionUrl(item.actionUrl)
                if (actionUrl) {
                  router.push(actionUrl)
                }
              }}
              className={`w-full text-left p-4 border-b border-(--border-subtle) last:border-b-0 hover:bg-[var(--bg-elevated)] transition-colors ${
                item.readAt ? '' : 'bg-emerald-500/5'
              }`}
            >
              <div className="flex items-start gap-3">
                <img
                  src={item.actor?.avatar || `https://api.dicebear.com/7.x/notionists/svg?seed=${item.id}`}
                  alt={item.actor?.name || 'Notification'}
                  className="w-[36px] h-[36px] rounded-full object-cover border border-(--border-subtle)"
                />
                <div className="flex-1 min-w-0">
                  <p className="font-body font-semibold text-[14px] text-(--text-primary)">{item.title}</p>
                  <p className="font-body text-[13px] text-(--text-secondary) mt-1">{item.body}</p>
                  <p className="font-body text-[12px] text-(--text-tertiary) mt-2">{formatTime(item.createdAt)}</p>
                </div>
                {!item.readAt && <span className="w-2 h-2 rounded-full bg-emerald-500 mt-1" />}
              </div>
            </button>
          ))
        )}
      </div>
    </motion.div>
  )
}
