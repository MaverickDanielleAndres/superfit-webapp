'use client'

import { AppShell } from '@/components/layout/AppShell'
import { useAuthStore } from '@/store/useAuthStore'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const { isAuthenticated, user, isLoading } = useAuthStore()
    const router = useRouter()

    useEffect(() => {
        if (!isLoading) {
            if (!isAuthenticated || !user) {
                router.replace('/auth')
            } else if (user.role === 'coach') {
                router.replace('/coach')
            } else if (user.role === 'admin') {
                router.replace('/admin')
            } else if (!user.onboardingComplete) {
                router.replace('/onboarding')
            }
        }
    }, [isAuthenticated, user, isLoading, router])

    if (!isAuthenticated || !user || user.role === 'coach' || user.role === 'admin') {
        return (
            <div className="flex items-center justify-center min-h-screen bg-(--bg-base)">
                <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
            </div>
        )
    }

    return <AppShell>{children}</AppShell>
}
