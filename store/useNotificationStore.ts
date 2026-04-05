import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { requestApi } from '@/lib/api/client'
import { isSupabaseAuthEnabled } from '@/lib/supabase/auth'
import { createClient } from '@/lib/supabase/client'
import type { RealtimeChannel } from '@supabase/supabase-js'

export interface AppNotification {
  id: string
  type: string
  title: string
  body: string
  actionUrl: string | null
  payload: Record<string, unknown>
  createdAt: string
  readAt: string | null
  seenAt: string | null
  actor: {
    id: string
    name: string
    avatar: string
  } | null
}

interface NotificationState {
  notifications: AppNotification[]
  unreadCount: number
  isLoading: boolean
  error: string | null

  initialize: (options?: { force?: boolean }) => Promise<void>
  markAllRead: () => Promise<void>
  markAllSeen: () => Promise<void>
  markRead: (id: string) => Promise<void>
  startRealtime: (userId: string) => void
  stopRealtime: () => void
}

let notificationsChannel: RealtimeChannel | null = null
let notificationsChannelUserId: string | null = null
let notificationsSubscribers = 0
let notificationsRefreshTimer: ReturnType<typeof setTimeout> | null = null
let notificationsInitializeInFlight: Promise<void> | null = null
let notificationsLastInitializedAt = 0

const NOTIFICATIONS_INIT_CACHE_MS = 20_000

export const useNotificationStore = create<NotificationState>()(
  persist(
    (set, get) => ({
      notifications: [],
      unreadCount: 0,
      isLoading: false,
      error: null,

      initialize: async (options) => {
        if (!isSupabaseAuthEnabled()) {
          set({ notifications: [], unreadCount: 0, isLoading: false, error: null })
          return
        }

        const state = get()
        const now = Date.now()
        if (
          !options?.force &&
          state.notifications.length > 0 &&
          now - notificationsLastInitializedAt < NOTIFICATIONS_INIT_CACHE_MS
        ) {
          return
        }

        if (notificationsInitializeInFlight) {
          await notificationsInitializeInFlight
          return
        }

        notificationsInitializeInFlight = (async () => {
          set({ isLoading: true, error: null })

          try {
            const response = await requestApi<{ notifications: AppNotification[]; unreadCount: number }>('/api/v1/notifications?limit=30')
            set({
              notifications: response.data.notifications,
              unreadCount: response.data.unreadCount,
              isLoading: false,
              error: null,
            })
            notificationsLastInitializedAt = Date.now()
          } catch (error) {
            set({
              isLoading: false,
              error: getErrorMessage(error),
            })
            notificationsLastInitializedAt = Date.now()
          }
        })()

        try {
          await notificationsInitializeInFlight
        } finally {
          notificationsInitializeInFlight = null
        }
      },

      markAllRead: async () => {
        if (!isSupabaseAuthEnabled()) return

        const prev = get().notifications
        set({
          notifications: prev.map((notification) => ({
            ...notification,
            readAt: notification.readAt || new Date().toISOString(),
            seenAt: notification.seenAt || new Date().toISOString(),
          })),
          unreadCount: 0,
        })

        try {
          await requestApi<{ updated: boolean; action: string }>('/api/v1/notifications', {
            method: 'PATCH',
            body: JSON.stringify({ action: 'mark_all_read' }),
          })
        } catch (error) {
          set({
            notifications: prev,
            unreadCount: prev.reduce((count, notification) => count + (notification.readAt ? 0 : 1), 0),
            error: getErrorMessage(error),
          })
        }
      },

      markAllSeen: async () => {
        if (!isSupabaseAuthEnabled()) return

        const prev = get().notifications
        set({
          notifications: prev.map((notification) => ({
            ...notification,
            seenAt: notification.seenAt || new Date().toISOString(),
          })),
        })

        try {
          await requestApi<{ updated: boolean; action: string }>('/api/v1/notifications', {
            method: 'PATCH',
            body: JSON.stringify({ action: 'mark_all_seen' }),
          })
        } catch (error) {
          set({ notifications: prev, error: getErrorMessage(error) })
        }
      },

      markRead: async (id: string) => {
        if (!isSupabaseAuthEnabled()) return

        const prev = get().notifications
        set({
          notifications: prev.map((notification) =>
            notification.id === id
              ? {
                  ...notification,
                  readAt: notification.readAt || new Date().toISOString(),
                  seenAt: notification.seenAt || new Date().toISOString(),
                }
              : notification,
          ),
        })

        set({ unreadCount: get().notifications.reduce((count, notification) => count + (notification.readAt ? 0 : 1), 0) })

        try {
          await requestApi<{ id: string; readAt: string | null; seenAt: string | null }>(`/api/v1/notifications/${id}`, {
            method: 'PATCH',
            body: JSON.stringify({ action: 'read' }),
          })
        } catch (error) {
          set({
            notifications: prev,
            unreadCount: prev.reduce((count, notification) => count + (notification.readAt ? 0 : 1), 0),
            error: getErrorMessage(error),
          })
        }
      },

      startRealtime: (userId: string) => {
        if (!isSupabaseAuthEnabled()) return
        if (!userId) return

        notificationsSubscribers += 1

        if (notificationsChannel && notificationsChannelUserId === userId) {
          return
        }

        if (notificationsChannel) {
          notificationsChannel.unsubscribe()
          notificationsChannel = null
          notificationsChannelUserId = null
        }

        const supabase = createClient()
        const refresh = () => {
          if (notificationsRefreshTimer) {
            clearTimeout(notificationsRefreshTimer)
          }

          notificationsRefreshTimer = setTimeout(() => {
            void get().initialize({ force: true })
          }, 180)
        }

        notificationsChannel = supabase
          .channel(`notifications-live-${userId}`)
          .on(
            'postgres_changes',
            {
              event: '*',
              schema: 'public',
              table: 'notifications',
              filter: `recipient_id=eq.${userId}`,
            },
            refresh,
          )
          .on(
            'postgres_changes',
            {
              event: '*',
              schema: 'public',
              table: 'user_friendships',
              filter: `requester_id=eq.${userId}`,
            },
            refresh,
          )
          .on(
            'postgres_changes',
            {
              event: '*',
              schema: 'public',
              table: 'user_friendships',
              filter: `addressee_id=eq.${userId}`,
            },
            refresh,
          )
          .on(
            'postgres_changes',
            {
              event: '*',
              schema: 'public',
              table: 'user_follows',
              filter: `follower_id=eq.${userId}`,
            },
            refresh,
          )
          .on(
            'postgres_changes',
            {
              event: '*',
              schema: 'public',
              table: 'user_follows',
              filter: `followee_id=eq.${userId}`,
            },
            refresh,
          )
          .on(
            'postgres_changes',
            {
              event: '*',
              schema: 'public',
              table: 'coach_client_links',
              filter: `coach_id=eq.${userId}`,
            },
            refresh,
          )
          .on(
            'postgres_changes',
            {
              event: '*',
              schema: 'public',
              table: 'coach_client_links',
              filter: `client_id=eq.${userId}`,
            },
            refresh,
          )
          .subscribe()

        notificationsChannelUserId = userId
      },

      stopRealtime: () => {
        notificationsSubscribers = Math.max(0, notificationsSubscribers - 1)
        if (notificationsSubscribers > 0) return

        if (notificationsRefreshTimer) {
          clearTimeout(notificationsRefreshTimer)
          notificationsRefreshTimer = null
        }

        if (notificationsChannel) {
          notificationsChannel.unsubscribe()
          notificationsChannel = null
          notificationsChannelUserId = null
        }
      },
    }),
    {
      name: 'superfit-notifications-storage-v1',
      partialize: (state) => ({
        notifications: state.notifications,
        unreadCount: state.unreadCount,
      }),
    },
  ),
)

function getErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message) return error.message
  return 'Notification request failed.'
}
