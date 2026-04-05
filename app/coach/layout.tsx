'use client'

import React, { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/store/useAuthStore'
import { useUIStore } from '@/store/useUIStore'
import { Loader2 } from 'lucide-react'
import { CoachSidebar } from './CoachSidebar'
import { cn } from '@/lib/utils'
import { CoachPortalDataProvider } from '@/lib/hooks/useCoachPortalData'
import { TopBar } from '@/components/layout/TopBar'

export default function CoachLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const { isAuthenticated, user, isLoading, initializeAuth } = useAuthStore()
    const { isSidebarCollapsed } = useUIStore()
    const router = useRouter()

    useEffect(() => {
        void initializeAuth()
    }, [initializeAuth])

    useEffect(() => {
        if (!isLoading) {
            if (!isAuthenticated) {
                router.replace('/')
            } else if (user?.accountStatus === 'suspended' || user?.accountStatus === 'inactive') {
                router.replace('/suspended')
            } else if (user?.accountStatus === 'pending_review') {
                router.replace('/under-review')
            } else if (user?.role !== 'coach') {
                // Not a coach, redirect to user dashboard
                router.replace('/dashboard')
            }
        }
    }, [isAuthenticated, user, isLoading, router])

    if (
        isLoading ||
        !isAuthenticated ||
        user?.role !== 'coach' ||
        user?.accountStatus === 'suspended' ||
        user?.accountStatus === 'inactive' ||
        user?.accountStatus === 'pending_review'
    ) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-(--bg-base)">
                <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
            </div>
        )
    }

    return (
        <CoachPortalDataProvider>
            <div className="min-h-screen bg-(--bg-base) flex overflow-x-hidden">
                <CoachSidebar />
                <div className={cn(
                    "flex-1 flex flex-col min-w-0 transition-all duration-250 ease-[cubic-bezier(0.16,1,0.3,1)]",
                    isSidebarCollapsed ? "lg:pl-[64px]" : "lg:pl-[240px]"
                )}>
                    <TopBar scope="coach" />

                    <main className="flex-1 w-full max-w-[1400px] mx-auto p-4 sm:p-5 md:p-6 lg:p-[24px] lg:px-[28px] overflow-x-hidden">
                        {children}
                    </main>
                </div>
            </div>
        </CoachPortalDataProvider>
    )
}
