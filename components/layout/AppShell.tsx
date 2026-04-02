'use client'

import React, { useEffect } from 'react'
import { Sidebar } from './Sidebar'
import { TopBar } from './TopBar'
import { useUserStore } from '@/store/useUserStore'
import { useUIStore } from '@/store/useUIStore'
import { cn } from '@/lib/utils'

interface AppShellProps {
    children: React.ReactNode
}

export function AppShell({ children }: AppShellProps) {
    const { initializeMockUser } = useUserStore()
    const { isSidebarCollapsed } = useUIStore()

    useEffect(() => {
        // Initialize mock user data on mount
        initializeMockUser()
    }, [initializeMockUser])

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
