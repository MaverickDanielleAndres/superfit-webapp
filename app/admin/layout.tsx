'use client'

import React, { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/store/useAuthStore'
import { Loader2 } from 'lucide-react'
import { AdminSidebar } from './AdminSidebar'

export default function AdminLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const { isAuthenticated, user, isLoading } = useAuthStore()
    const router = useRouter()

    useEffect(() => {
        if (!isLoading) {
            if (!isAuthenticated) {
                router.replace('/auth')
            } else if (user?.role !== 'admin') {
                // Not an admin
                router.replace('/')
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
        <div className="min-h-screen bg-(--bg-base) flex">
            <AdminSidebar />
            <div className="flex-1 flex flex-col min-w-0 pl-[240px]">
                <main className="flex-1 p-[24px] md:px-[28px] md:pb-[24px]">
                    {children}
                </main>
            </div>
        </div>
    )
}
