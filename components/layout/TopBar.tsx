'use client'

import React, { useEffect, useState } from 'react'
import { Search, MessageCircle, Bell, Settings2, Moon, Sun, X } from 'lucide-react'
import { useTheme } from 'next-themes'
import { useAuthStore } from '@/store/useAuthStore'
import { useMessageStore } from '@/store/useMessageStore'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'

export function TopBar() {
    const { theme, setTheme } = useTheme()
    const [mounted, setMounted] = useState(false)
    const [greeting, setGreeting] = useState('Good morning')
    const [isSearchOpen, setIsSearchOpen] = useState(false)
    const [isNotifOpen, setIsNotifOpen] = useState(false)
    const [searchQuery, setSearchQuery] = useState('')
    const { user } = useAuthStore()
    const { getTotalUnread } = useMessageStore()
    const totalUnread = getTotalUnread()
    const router = useRouter()

    useEffect(() => {
        setMounted(true)
        const hour = new Date().getHours()
        if (hour < 12) setGreeting('Good morning')
        else if (hour < 17) setGreeting('Good afternoon')
        else setGreeting('Good evening')
    }, [])

    const notifications = [
        { id: 1, text: "David liked your post", time: "2m ago", read: false },
        { id: 2, text: "You hit your hydration goal!", time: "1h ago", read: false },
        { id: 3, text: "New community challenge available", time: "1d ago", read: true },
    ]
    const unreadNotifs = notifications.filter(n => !n.read).length

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault()
        if (searchQuery.trim()) {
            setIsSearchOpen(false)
            setSearchQuery('')
            // Mock search navigation
            alert(`Searching for: ${searchQuery}`)
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
                                        <button className="font-body text-[12px] text-(--accent) font-semibold hover:underline">Mark all read</button>
                                    </div>
                                    <div className="max-h-[300px] overflow-y-auto flex flex-col">
                                        {notifications.map(n => (
                                            <div key={n.id} className={`p-4 border-b border-(--border-subtle) last:border-0 hover:bg-[var(--bg-elevated)] cursor-pointer transition-colors ${!n.read ? 'bg-emerald-500/5' : ''}`}>
                                                <div className="flex justify-between items-start mb-1">
                                                    <span className={`font-body text-[14px] leading-tight ${!n.read ? 'font-semibold text-(--text-primary)' : 'text-(--text-secondary)'}`}>{n.text}</span>
                                                    {!n.read && <div className="w-2 h-2 rounded-full bg-(--accent) mt-1 shrink-0" />}
                                                </div>
                                                <span className="font-body text-[12px] text-(--text-tertiary)">{n.time}</span>
                                            </div>
                                        ))}
                                    </div>
                                    <div className="p-3 text-center border-t border-(--border-subtle) bg-[var(--bg-elevated)]">
                                        <button className="font-body text-[13px] text-(--text-secondary) hover:text-(--text-primary) font-semibold">View All Notifications</button>
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
                {mounted && (
                    <button
                        onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                        className="w-[40px] h-[40px] rounded-full flex items-center justify-center text-(--text-secondary) hover:text-(--text-primary) hover:bg-[var(--bg-elevated)] transition-colors cursor-pointer"
                    >
                        {theme === 'dark' ? <Sun className="w-[20px] h-[20px]" /> : <Moon className="w-[20px] h-[20px]" />}
                    </button>
                )}
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
                                {['Workouts', 'Community', 'Diet Plan'].map(term => (
                                    <button
                                        key={term}
                                        type="button"
                                        onClick={() => { setSearchQuery(term); document.activeElement?.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true })); }}
                                        className="px-3 py-1 rounded-full bg-(--bg-surface) border border-(--border-subtle) text-[12px] font-body text-(--text-secondary) hover:text-(--text-primary) hover:border-(--text-tertiary) transition-colors"
                                    >
                                        {term}
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

