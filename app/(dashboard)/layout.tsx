'use client'

import { AppShell } from '@/components/layout/AppShell'
import { useAuthStore } from '@/store/useAuthStore'
import { useEffect } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'
import { isAdminUserAppModeEnabled, isCoachUserAppModeEnabled } from '@/lib/navigation/portalMode'

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const { isAuthenticated, user, isLoading, initializeAuth } = useAuthStore()
    const router = useRouter()
    const pathname = usePathname()

    const canUseSharedMessages = pathname === '/messages' || pathname.startsWith('/messages/')
    const canCoachAccessUserApp = Boolean(user?.role === 'coach' && isCoachUserAppModeEnabled())
    const canAdminAccessUserApp = Boolean(user?.role === 'admin' && isAdminUserAppModeEnabled())
    const shouldRedirectCoach = Boolean(user?.role === 'coach' && !canUseSharedMessages && !canCoachAccessUserApp)
    const shouldRedirectAdmin = Boolean(user?.role === 'admin' && !canUseSharedMessages && !canAdminAccessUserApp)

    useEffect(() => {
        void initializeAuth()
    }, [initializeAuth])

    useEffect(() => {
        if (!isLoading) {
            if (!isAuthenticated || !user) {
                router.replace('/')
            } else if (user.accountStatus === 'suspended' || user.accountStatus === 'inactive') {
                router.replace('/suspended')
            } else if (user.role === 'coach' && user.accountStatus === 'pending_review') {
                router.replace('/under-review')
            } else if (shouldRedirectCoach) {
                router.replace('/coach')
            } else if (shouldRedirectAdmin) {
                router.replace('/admin')
            } else if (!user.onboardingComplete) {
                router.replace('/onboarding')
            }
        }
    }, [canUseSharedMessages, isAuthenticated, user, isLoading, router, shouldRedirectCoach, shouldRedirectAdmin])

    if (
        !isAuthenticated ||
        !user ||
        user.accountStatus === 'suspended' ||
        user.accountStatus === 'inactive' ||
        (user.role === 'coach' && user.accountStatus === 'pending_review') ||
        shouldRedirectAdmin ||
        shouldRedirectCoach
    ) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-(--bg-base)">
                <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
            </div>
        )
    }

    return <AppShell>{children}</AppShell>
}
