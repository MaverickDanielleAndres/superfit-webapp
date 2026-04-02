'use client'

import React, { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/store/useAuthStore'
import { useUIStore } from '@/store/useUIStore'
import { Loader2 } from 'lucide-react'
import { CoachSidebar } from './CoachSidebar'
import { cn } from '@/lib/utils'

export default function CoachLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const { isAuthenticated, user, isLoading } = useAuthStore()
    const { isSidebarCollapsed } = useUIStore()
    const router = useRouter()

    useEffect(() => {
        if (!isLoading) {
            if (!isAuthenticated) {
                router.replace('/auth')
            } else if (user?.role !== 'coach') {
                // Not a coach, redirect to user dashboard
                router.replace('/')
            }
        }
    }, [isAuthenticated, user, isLoading, router])

    if (isLoading || !isAuthenticated || user?.role !== 'coach') {
        return (
            <div className="flex items-center justify-center min-h-screen bg-(--bg-base)">
                <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-(--bg-base) flex">
            <CoachSidebar />
            <div className={cn(
                "flex-1 flex flex-col min-w-0 transition-all duration-250 ease-[cubic-bezier(0.16,1,0.3,1)]",
                isSidebarCollapsed ? "pl-[64px]" : "pl-[240px]"
            )}>
                <main className="flex-1 w-full max-w-[1400px] mx-auto p-[24px] md:px-[28px]">
                    {children}
                </main>
            </div>
        </div>
    )
}
