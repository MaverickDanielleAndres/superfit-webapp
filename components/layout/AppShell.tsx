'use client'

import React from 'react'
import { Sidebar } from './Sidebar'
import { TopBar } from './TopBar'
import { useUIStore } from '@/store/useUIStore'
import { useAuthStore } from '@/store/useAuthStore'
import { useMessageStore } from '@/store/useMessageStore'
import { cn } from '@/lib/utils'

interface AppShellProps {
    children: React.ReactNode
}

export function AppShell({ children }: AppShellProps) {
    const { isSidebarCollapsed } = useUIStore()
    const { user } = useAuthStore()
    const { initialize } = useMessageStore()

    React.useEffect(() => {
        if (!user?.id) return
        void initialize()
    }, [initialize, user?.id])

    return (
        <div className="min-h-screen bg-(--bg-base) flex">
            <Sidebar />
            {/* 
        Sidebar width is handled via CSS transition. Default expanded is 240px. 
        We use padding-left to push the content over 
      */}
            <div className={cn(
                "flex-1 flex flex-col min-w-0 transition-all duration-250 ease-[cubic-bezier(0.16,1,0.3,1)]",
                isSidebarCollapsed ? "pl-[64px]" : "pl-[240px]"
            )}>
                <TopBar />
                {/* Main Content Area */}
                <main className="flex-1 p-[24px] md:px-[28px] md:pb-[24px]">
                    {children}
                </main>
            </div>
        </div>
    )
}
