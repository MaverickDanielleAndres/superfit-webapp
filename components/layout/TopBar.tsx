'use client'

import React, { useEffect, useMemo, useState } from 'react'
import { Search, MessageCircle, Bell, Settings2, Moon, Sun, X } from 'lucide-react'
import { useTheme } from 'next-themes'
import { useAuthStore } from '@/store/useAuthStore'
import { useMessageStore } from '@/store/useMessageStore'
import { useNotificationStore } from '@/store/useNotificationStore'
import { requestApi } from '@/lib/api/client'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'

interface SearchResult {
    id: string
    kind: 'route' | 'user' | 'exercise'
    title: string
    subtitle: string
    href: string
}

function formatRelativeTime(iso: string): string {
    const diffMs = Date.now() - new Date(iso).getTime()
    const minute = 60_000
    const hour = 60 * minute
    const day = 24 * hour

    if (diffMs < hour) {
        const mins = Math.max(1, Math.floor(diffMs / minute))
        return `${mins}m ago`
    }

    if (diffMs < day) {
        const hours = Math.max(1, Math.floor(diffMs / hour))
        return `${hours}h ago`
    }

    const days = Math.max(1, Math.floor(diffMs / day))
    return `${days}d ago`
}

export function TopBar() {
    const { theme, setTheme } = useTheme()
    const [greeting] = useState(() => {
        const hour = new Date().getHours()
        if (hour < 12) return 'Good morning'
        if (hour < 17) return 'Good afternoon'
        return 'Good evening'
    })
    const [isSearchOpen, setIsSearchOpen] = useState(false)
    const [isNotifOpen, setIsNotifOpen] = useState(false)
    const [searchQuery, setSearchQuery] = useState('')
    const [searchResults, setSearchResults] = useState<SearchResult[]>([])
    const [isSearching, setIsSearching] = useState(false)
    const { user } = useAuthStore()
    const { getTotalUnread, initialize: initializeMessages, startRealtime: startMessagesRealtime, stopRealtime: stopMessagesRealtime } = useMessageStore()
    const {
        notifications,
        unreadCount: unreadNotifs,
        initialize,
        markAllRead,
        markAllSeen,
        markRead,
        startRealtime,
        stopRealtime,
    } = useNotificationStore()
    const totalUnread = getTotalUnread()
    const router = useRouter()

    useEffect(() => {
        if (!user?.id) return

        void initialize()
        void initializeMessages()
        startRealtime(user.id)
        startMessagesRealtime(user.id)

        return () => {
            stopRealtime()
            stopMessagesRealtime()
        }
    }, [initialize, initializeMessages, startMessagesRealtime, startRealtime, stopMessagesRealtime, stopRealtime, user?.id])

    useEffect(() => {
        if (!isNotifOpen) return
        void markAllSeen()
    }, [isNotifOpen, markAllSeen])

    useEffect(() => {
        if (!isSearchOpen) return

        const query = searchQuery.trim()
        if (query.length < 2) {
            setSearchResults([])
            setIsSearching(false)
            return
        }

        const timer = window.setTimeout(() => {
            void (async () => {
                try {
                    setIsSearching(true)
                    const response = await requestApi<{ results: SearchResult[] }>(`/api/v1/search?q=${encodeURIComponent(query)}`)
                    setSearchResults(response.data.results)
                } catch {
                    setSearchResults([])
                } finally {
                    setIsSearching(false)
                }
            })()
        }, 220)

        return () => window.clearTimeout(timer)
    }, [isSearchOpen, searchQuery])

    const displayedNotifications = useMemo(() => notifications.slice(0, 8), [notifications])

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault()
        if (searchQuery.trim() && searchResults.length > 0) {
            router.push(searchResults[0].href)
            setIsSearchOpen(false)
            setSearchQuery('')
            setSearchResults([])
            return
        }

        if (searchQuery.trim()) {
            router.push(`/exercises?search=${encodeURIComponent(searchQuery.trim())}`)
            setIsSearchOpen(false)
            setSearchQuery('')
            setSearchResults([])
        }
    }

    const openNotification = (notificationId: string, actionUrl: string | null) => {
        void markRead(notificationId)
        setIsNotifOpen(false)

        if (actionUrl) {
            router.push(actionUrl)
        }
    }

    return (
        <header className="sticky top-0 z-30 h-[64px] bg-(--bg-base) px-[28px] flex items-center justify-between border-b border-(--border-subtle)">
            {/* Left Block: Greeting */}
            <div className="flex flex-col justify-center translate-y-2">
                <span className="font-body font-medium text-[13px] text-(--text-secondary) leading-none mb-1">
                    {greeting}
                </span>
                <h2 className="font-display font-semibold text-[20px] text-(--text-primary) leading-none m-0 p-0">
                    {user?.name ? `${user.name}!` : 'Welcome Back!'}
                </h2>
            </div>

            {/* Right Block: Icons */}
            <div className="flex items-center gap-1 relative">
                <button
                    onClick={() => setIsSearchOpen(true)}
                    className="w-[40px] h-[40px] rounded-full flex items-center justify-center text-(--text-secondary) hover:text-(--text-primary) hover:bg-[var(--bg-elevated)] transition-colors cursor-pointer"
                >
                    <Search className="w-[20px] h-[20px]" />
                </button>
                <button
                    onClick={() => { router.push('/messages'); setIsNotifOpen(false); }}
                    className="relative w-[40px] h-[40px] rounded-full flex items-center justify-center text-(--text-secondary) hover:text-(--text-primary) hover:bg-[var(--bg-elevated)] transition-colors cursor-pointer"
                >
                    <MessageCircle className="w-[20px] h-[20px]" />
                    {totalUnread > 0 && (
                        <span className="absolute top-[-4px] right-[-4px] w-[18px] h-[18px] rounded-full bg-emerald-500 text-white font-body font-bold text-[10px] flex items-center justify-center border-2 border-(--bg-base)">
                            {totalUnread > 9 ? '9+' : totalUnread}
                        </span>
                    )}
                </button>

                {/* Notification Bell */}
                <div className="relative">
                    <button
                        onClick={() => setIsNotifOpen(!isNotifOpen)}
                        className="relative w-[40px] h-[40px] rounded-full flex items-center justify-center text-(--text-secondary) hover:text-(--text-primary) hover:bg-[var(--bg-elevated)] transition-colors cursor-pointer"
                    >
                        <Bell className="w-[20px] h-[20px]" />
                        {unreadNotifs > 0 && (
                            <span className="absolute top-[-4px] right-[-4px] w-[18px] h-[18px] rounded-full bg-(--accent) text-white font-body font-bold text-[10px] flex items-center justify-center border-2 border-(--bg-base)">
                                {unreadNotifs}
                            </span>
                        )}
                    </button>

                    {/* Notifications Dropdown */}
                    <AnimatePresence>
                        {isNotifOpen && (
                            <>
                                <div className="fixed inset-0 z-40" onClick={() => setIsNotifOpen(false)} />
                                <motion.div
                                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                    className="absolute right-0 top-[50px] w-[320px] bg-(--bg-surface) border border-(--border-subtle) rounded-[16px] shadow-lg z-50 overflow-hidden"
                                >
                                    <div className="p-4 border-b border-(--border-subtle) flex justify-between items-center bg-[var(--bg-elevated)]">
                                        <h3 className="font-display font-bold text-[15px] text-(--text-primary)">Notifications</h3>
                                        <button
                                            onClick={() => {
                                                void markAllRead()
                                            }}
                                            className="font-body text-[12px] text-(--accent) font-semibold hover:underline"
                                        >
                                            Mark all read
                                        </button>
                                    </div>
                                    <div className="max-h-[300px] overflow-y-auto flex flex-col">
                                        {displayedNotifications.length === 0 && (
                                            <div className="p-6 text-center font-body text-[13px] text-(--text-secondary)">
                                                You are all caught up.
                                            </div>
                                        )}
                                        {displayedNotifications.map((n) => (
                                            <button
                                                key={n.id}
                                                onClick={() => openNotification(n.id, n.actionUrl)}
                                                className={`w-full text-left p-4 border-b border-(--border-subtle) last:border-0 hover:bg-[var(--bg-elevated)] cursor-pointer transition-colors ${!n.readAt ? 'bg-emerald-500/5' : ''}`}
                                            >
                                                <div className="flex justify-between items-start mb-1">
                                                    <span className={`font-body text-[14px] leading-tight ${!n.readAt ? 'font-semibold text-(--text-primary)' : 'text-(--text-secondary)'}`}>{n.title}</span>
                                                    {!n.readAt && <div className="w-2 h-2 rounded-full bg-(--accent) mt-1 shrink-0" />}
                                                </div>
                                                <span className="font-body text-[12px] text-(--text-secondary) block mb-1">{n.body}</span>
                                                <span className="font-body text-[12px] text-(--text-tertiary)">{formatRelativeTime(n.createdAt)}</span>
                                            </button>
                                        ))}
                                    </div>
                                    <div className="p-3 text-center border-t border-(--border-subtle) bg-[var(--bg-elevated)]">
                                        <button
                                            onClick={() => {
                                                setIsNotifOpen(false)
                                                router.push('/notifications')
                                            }}
                                            className="font-body text-[13px] text-(--text-secondary) hover:text-(--text-primary) font-semibold"
                                        >
                                            View All Notifications
                                        </button>
                                    </div>
                                </motion.div>
                            </>
                        )}
                    </AnimatePresence>
                </div>

                <button
                    onClick={() => router.push('/settings')}
                    className="w-[40px] h-[40px] rounded-full flex items-center justify-center text-(--text-secondary) hover:text-(--text-primary) hover:bg-[var(--bg-elevated)] transition-colors cursor-pointer"
                >
                    <Settings2 className="w-[20px] h-[20px]" />
                </button>

                {/* Theme Toggle */}
                <button
                    onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                    className="w-[40px] h-[40px] rounded-full flex items-center justify-center text-(--text-secondary) hover:text-(--text-primary) hover:bg-[var(--bg-elevated)] transition-colors cursor-pointer"
                >
                    {theme === 'dark' ? <Sun className="w-[20px] h-[20px]" /> : <Moon className="w-[20px] h-[20px]" />}
                </button>
            </div>

            {/* Search Modal */}
            <AnimatePresence>
                {isSearchOpen && (
                    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[80px] px-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 bg-black/40 backdrop-blur-sm"
                            onClick={() => setIsSearchOpen(false)}
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: -20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: -20 }}
                            className="bg-(--bg-surface) w-full max-w-2xl rounded-[20px] shadow-2xl overflow-hidden relative z-10 border border-(--border-subtle)"
                        >
                            <form onSubmit={handleSearch} className="flex items-center px-4">
                                <Search className="w-[20px] h-[20px] text-(--text-tertiary)" />
                                <input
                                    type="text"
                                    autoFocus
                                    placeholder="Search workflows, exercises, users..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full h-[64px] bg-transparent border-none focus:outline-none px-4 font-body text-[16px] text-(--text-primary)"
                                />
                                <button type="button" onClick={() => setIsSearchOpen(false)} className="p-2 text-(--text-tertiary) hover:text-(--text-primary) rounded-full hover:bg-[var(--bg-elevated)] transition-colors">
                                    <X className="w-[20px] h-[20px]" />
                                </button>
                            </form>
                            <div className="border-t border-(--border-subtle) bg-[var(--bg-elevated)] p-4 flex gap-2">
                                <span className="text-[12px] font-body text-(--text-tertiary) uppercase tracking-wider font-semibold mr-2 flex items-center">Quick links</span>
                                {['Workouts', 'Community', 'Coaching'].map(term => (
                                    <button
                                        key={term}
                                        type="button"
                                        onClick={() => {
                                            setSearchQuery(term)
                                        }}
                                        className="px-3 py-1 rounded-full bg-(--bg-surface) border border-(--border-subtle) text-[12px] font-body text-(--text-secondary) hover:text-(--text-primary) hover:border-(--text-tertiary) transition-colors"
                                    >
                                        {term}
                                    </button>
                                ))}
                            </div>
                            <div className="max-h-[220px] overflow-y-auto border-t border-(--border-subtle)">
                                {isSearching && (
                                    <div className="p-4 font-body text-[13px] text-(--text-secondary)">Searching...</div>
                                )}
                                {!isSearching && searchQuery.trim().length >= 2 && searchResults.length === 0 && (
                                    <div className="p-4 font-body text-[13px] text-(--text-secondary)">No results found.</div>
                                )}
                                {!isSearching && searchResults.map((result) => (
                                    <button
                                        key={result.id}
                                        type="button"
                                        onClick={() => {
                                            router.push(result.href)
                                            setIsSearchOpen(false)
                                            setSearchQuery('')
                                            setSearchResults([])
                                        }}
                                        className="w-full text-left px-4 py-3 hover:bg-[var(--bg-elevated)] border-b border-(--border-subtle) last:border-b-0"
                                    >
                                        <p className="font-body text-[14px] font-semibold text-(--text-primary)">{result.title}</p>
                                        <p className="font-body text-[12px] text-(--text-secondary)">{result.subtitle}</p>
                                    </button>
                                ))}
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </header>
    )
}

