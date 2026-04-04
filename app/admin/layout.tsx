'use client'

import React, { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/store/useAuthStore'
import { Loader2, Menu } from 'lucide-react'
import { AdminSidebar } from './AdminSidebar'
import { useUIStore } from '@/store/useUIStore'

export default function AdminLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const { isAuthenticated, user, isLoading, initializeAuth } = useAuthStore()
    const { isMobileNavOpen, toggleMobileNav, closeMobileNav } = useUIStore()
    const router = useRouter()

    useEffect(() => {
        void initializeAuth()
    }, [initializeAuth])

    useEffect(() => {
        if (!isLoading) {
            if (!isAuthenticated) {
                router.replace('/')
            } else if (user?.role !== 'admin') {
                // Not an admin
                router.replace('/dashboard')
            }
        }
    }, [isAuthenticated, user, isLoading, router])

    if (isLoading || !isAuthenticated || user?.role !== 'admin') {
        return (
            <div className="flex items-center justify-center min-h-screen bg-(--bg-base)">
                <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-(--bg-base) flex overflow-x-hidden">
            <AdminSidebar isMobileOpen={isMobileNavOpen} onCloseMobile={closeMobileNav} />
            <div className="flex-1 flex flex-col min-w-0 lg:pl-[240px]">
                <header className="sticky top-0 z-30 h-[64px] px-3 sm:px-4 md:px-5 border-b border-(--border-subtle) bg-(--bg-base) flex items-center gap-3 lg:hidden">
                    <button
                        type="button"
                        onClick={toggleMobileNav}
                        aria-label="Open admin navigation"
                        className="w-[38px] h-[38px] rounded-full flex items-center justify-center text-(--text-secondary) hover:text-(--text-primary) hover:bg-[var(--bg-elevated)] transition-colors"
                    >
                        <Menu className="w-[20px] h-[20px]" />
                    </button>
                    <span className="font-display font-semibold text-[16px] sm:text-[18px] text-(--text-primary)">Admin Panel</span>
                </header>

                <main className="flex-1 p-4 sm:p-5 md:p-6 lg:p-[24px] lg:px-[28px] lg:pb-[24px] overflow-x-hidden">
                    {children}
                </main>
            </div>
        </div>
    )
}
