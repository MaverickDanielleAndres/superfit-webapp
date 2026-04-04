'use client'

import React from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
    LayoutDashboard,
    Users,
    ShieldAlert,
    CreditCard,
    Settings,
    Database,
    LogOut,
    ArrowLeft
} from 'lucide-react'
import { useAuthStore } from '@/store/useAuthStore'

interface AdminSidebarProps {
    isMobileOpen: boolean
    onCloseMobile: () => void
}

export function AdminSidebar({ isMobileOpen, onCloseMobile }: AdminSidebarProps) {
    const pathname = usePathname()
    const router = useRouter()
    const { logout } = useAuthStore()

    const handleLogout = () => {
        onCloseMobile()
        logout()
        router.push('/')
    }

    React.useEffect(() => {
        onCloseMobile()
    }, [pathname, onCloseMobile])

    React.useEffect(() => {
        if (!isMobileOpen) return

        const handleEscape = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                onCloseMobile()
            }
        }

        document.body.style.overflow = 'hidden'
        window.addEventListener('keydown', handleEscape)

        return () => {
            document.body.style.overflow = ''
            window.removeEventListener('keydown', handleEscape)
        }
    }, [isMobileOpen, onCloseMobile])

    const navItems = [
        { icon: LayoutDashboard, label: 'Dashboard', href: '/admin' },
        { icon: Users, label: 'Users', href: '/admin/users' },
        { icon: Users, label: 'Coaches', href: '/admin/coaches' },
        { icon: ShieldAlert, label: 'Applications', href: '/admin/applications' },
        { icon: CreditCard, label: 'Payments', href: '/admin/payments' },
        { icon: Database, label: 'Content', href: '/admin/content' },
        { icon: Settings, label: 'Settings', href: '/admin/settings' },
    ]

    return (
        <>
            <button
                type="button"
                aria-label="Close admin navigation"
                onClick={onCloseMobile}
                className={cn(
                    'fixed inset-0 z-40 bg-black/45 transition-opacity lg:hidden',
                    isMobileOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
                )}
            />

            <aside
                className={cn(
                    'fixed top-0 left-0 h-screen z-50 bg-(--sidebar-bg) border-r border-(--sidebar-border) overflow-y-auto flex flex-col',
                    'transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]',
                    'w-[280px] sm:w-[320px] lg:w-[240px]',
                    isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
                )}
            >
            <div className="h-[72px] px-4 flex items-center gap-[10px] shrink-0">
                <div className="w-[32px] h-[32px] shrink-0 rounded-[10px] bg-red-600 flex items-center justify-center shadow-sm">
                    <span className="font-display font-bold text-[14px] text-white">AD</span>
                </div>
                <span className="font-display font-black text-[20px] tracking-tight text-(--text-primary)">
                    Admin Panel
                </span>
            </div>

            <div className="mt-3 mx-4 mb-2">
                <span className="font-display font-semibold text-[11px] uppercase tracking-wider text-(--text-tertiary)">Menu</span>
            </div>

            <nav className="flex-1 flex flex-col pt-1 pb-4 gap-[2px]">
                {navItems.map((item) => {
                    const isActive = pathname === item.href
                    return (
                        <Link
                            key={item.label}
                            href={item.href}
                            onClick={onCloseMobile}
                            className={cn(
                                'flex items-center h-[44px] px-3 mx-2 my-0.5 rounded-[10px] gap-2.5 transition-all duration-120 cursor-pointer',
                                isActive
                                    ? 'bg-red-600/10 text-red-600 font-semibold'
                                    : 'bg-transparent text-(--sidebar-inactive) hover:bg-[var(--bg-elevated)] hover:text-(--sidebar-inactive)'
                            )}
                        >
                            <item.icon className={cn('w-[18px] h-[18px] shrink-0', isActive ? 'text-red-600' : 'currentColor')} />
                            <span className="text-[14px] leading-none mb-[1px]">{item.label}</span>
                        </Link>
                    )
                })}

                <div className="mt-auto pt-4 border-t border-(--border-subtle) mx-4 flex flex-col gap-2">
                    <Link
                        href="/dashboard"
                        onClick={onCloseMobile}
                        className="flex items-center h-[44px] px-3 rounded-[10px] gap-2.5 text-(--text-secondary) hover:bg-(--bg-elevated) hover:text-(--text-primary) transition-all"
                    >
                        <ArrowLeft className="w-[18px] h-[18px] shrink-0" />
                        <span className="text-[14px]">Return to User App</span>
                    </Link>
                    <button
                        onClick={handleLogout}
                        className="flex items-center h-[44px] px-3 rounded-[10px] gap-2.5 text-(--text-secondary) hover:bg-red-500/10 hover:text-red-500 transition-all cursor-pointer w-full"
                    >
                        <LogOut className="w-[18px] h-[18px] shrink-0" />
                        <span className="text-[14px]">Log Out</span>
                    </button>
                </div>
            </nav>
            </aside>
        </>
    )
}
