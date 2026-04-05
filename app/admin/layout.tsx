'use client'

import React, { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/store/useAuthStore'
import { useAdminPortalStore } from '@/store/useAdminPortalStore'
import { Loader2 } from 'lucide-react'
import { AdminSidebar } from './AdminSidebar'
import { useUIStore } from '@/store/useUIStore'
import { AdminTopBar } from './AdminTopBar'

export default function AdminLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const { isAuthenticated, user, isLoading, initializeAuth } = useAuthStore()
    const { startRealtime, stopRealtime } = useAdminPortalStore()
    const { isMobileNavOpen, toggleMobileNav, closeMobileNav } = useUIStore()
    const router = useRouter()

    useEffect(() => {
        void initializeAuth()
    }, [initializeAuth])

    useEffect(() => {
        if (!user?.id || user.role !== 'admin') return

        startRealtime(user.id)

        return () => {
            stopRealtime()
        }
    }, [startRealtime, stopRealtime, user?.id, user?.role])

    useEffect(() => {
        if (!isLoading) {
            if (!isAuthenticated) {
                router.replace('/')
            } else if (user?.accountStatus === 'suspended' || user?.accountStatus === 'inactive') {
                router.replace('/suspended')
            } else if (user?.role !== 'admin') {
                // Not an admin
                router.replace('/dashboard')
            }
        }
    }, [isAuthenticated, user, isLoading, router])

    if (
        isLoading ||
        !isAuthenticated ||
        user?.role !== 'admin' ||
        user?.accountStatus === 'suspended' ||
        user?.accountStatus === 'inactive'
    ) {
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
                <AdminTopBar onToggleMobileNav={toggleMobileNav} />

                <main className="flex-1 p-4 sm:p-5 md:p-6 lg:p-[24px] lg:px-[28px] lg:pb-[24px] overflow-x-hidden">
                    {children}
                </main>
            </div>
        </div>
    )
}
