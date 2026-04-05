'use client'

import React from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
    LayoutDashboard,
    Users,
    CalendarDays,
    FileVideo,
    Bell,
    LifeBuoy,
    MessageCircle,
    FormInput,
    Store,
    Activity,
    Settings,
    ChevronLeft,
    LogOut
} from 'lucide-react'
import { useAuthStore } from '@/store/useAuthStore'
import { useUIStore } from '@/store/useUIStore'
import { disableCoachUserAppMode } from '@/lib/navigation/portalMode'

interface NavItemProps {
    icon: React.ElementType
    label: string
    href: string
    isActive: boolean
    isCollapsed: boolean
    badge?: number
    onClick?: (e: React.MouseEvent) => void
    onMouseEnter?: () => void
}

const NavItem = ({ icon: Icon, label, href, isActive, isCollapsed, badge, onClick, onMouseEnter }: NavItemProps) => (
    <div className="relative group/navitem w-full">
        <Link
            href={href}
            prefetch={false}
            onClick={onClick}
            onMouseEnter={onMouseEnter}
            onFocus={onMouseEnter}
            className={cn(
                'flex items-center h-[44px] px-3 mx-2 my-0.5 rounded-[10px] gap-2.5 transition-all duration-120 cursor-pointer relative',
                isActive
                    ? 'bg-(--sidebar-active-bg) text-(--sidebar-active-text) font-semibold'
                    : 'bg-transparent text-(--sidebar-inactive) hover:bg-[var(--bg-elevated)] hover:text-(--sidebar-inactive)',
                isCollapsed ? 'justify-center mx-1 px-0 w-[calc(100%-8px)]' : ''
            )}
        >
            <Icon className={cn('w-[18px] h-[18px] shrink-0', isActive ? 'text-(--sidebar-icon-active)' : 'currentColor')} />
            {!isCollapsed && <span className="text-[14px] leading-none mb-[1px] flex-1 select-none">{label}</span>}
            {badge !== undefined && badge > 0 && (
                <span className={cn(
                    'flex items-center justify-center w-[18px] h-[18px] rounded-full bg-emerald-500 text-white font-bold text-[10px]',
                    isCollapsed ? 'absolute top-1 right-1' : 'ml-auto'
                )}>
                    {badge > 9 ? '9+' : badge}
                </span>
            )}
        </Link>
        {isCollapsed && (
            <div className="hidden lg:block fixed left-[72px] mt-[-34px] px-2.5 py-1.5 bg-(--bg-elevated) border border-(--border-default) rounded-md text-[13px] font-medium text-(--text-primary) shadow-lg opacity-0 pointer-events-none group-hover/navitem:opacity-100 transition-opacity whitespace-nowrap z-50">
                {label}
            </div>
        )}
    </div>
)

export function CoachSidebar() {
    const {
        isSidebarCollapsed: isCollapsed,
        toggleSidebar,
        setSidebarCollapsed,
        isMobileNavOpen,
        closeMobileNav,
    } = useUIStore()
    const pathname = usePathname()
    const router = useRouter()
    const { user, logout } = useAuthStore()
    const prefetchedRoutesRef = React.useRef<Set<string>>(new Set())
    const asideRef = React.useRef<HTMLElement | null>(null)

    const prefetchOnIntent = React.useCallback((href: string) => {
        if (prefetchedRoutesRef.current.has(href)) return
        prefetchedRoutesRef.current.add(href)
        void router.prefetch(href)
    }, [router])

    const handleLogout = (e: React.MouseEvent) => {
        e.stopPropagation()
        closeMobileNav()
        disableCoachUserAppMode()
        logout()
        router.push('/')
    }

    const handleLinkClick = () => {
        if (isMobileNavOpen) {
            closeMobileNav()
            return
        }

        if (window.innerWidth >= 1024 && isCollapsed) {
            setSidebarCollapsed(false)
            return
        }

        if (window.innerWidth >= 1024) {
            setSidebarCollapsed(true)
        }
    }

    const handleSidebarSurfaceClick = (event: React.MouseEvent<HTMLElement>) => {
        if (isMobileNavOpen || !isCollapsed || window.innerWidth < 1024) return

        const target = event.target as HTMLElement
        if (target.closest('a,button,input,textarea,select,[role="button"]')) return

        setSidebarCollapsed(false)
    }

    React.useEffect(() => {
        closeMobileNav()
    }, [pathname, closeMobileNav])

    React.useEffect(() => {
        if (!isMobileNavOpen) return

        const handleEscape = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                closeMobileNav()
            }
        }

        document.body.style.overflow = 'hidden'
        window.addEventListener('keydown', handleEscape)

        return () => {
            document.body.style.overflow = ''
            window.removeEventListener('keydown', handleEscape)
        }
    }, [isMobileNavOpen, closeMobileNav])

    React.useEffect(() => {
        if (isMobileNavOpen || isCollapsed) return

        const handlePointerDown = (event: MouseEvent) => {
            if (window.innerWidth < 1024) return

            if (asideRef.current && !asideRef.current.contains(event.target as Node)) {
                setSidebarCollapsed(true)
            }
        }

        document.addEventListener('mousedown', handlePointerDown)
        return () => {
            document.removeEventListener('mousedown', handlePointerDown)
        }
    }, [isCollapsed, isMobileNavOpen, setSidebarCollapsed])

    // MAIN
    const mainItems = [
        { icon: LayoutDashboard, label: 'Dashboard', href: '/coach' },
        { icon: Users, label: 'Clients', href: '/coach/clients' },
        { icon: CalendarDays, label: 'Programs', href: '/coach/programs' },
        { icon: FileVideo, label: 'Content', href: '/coach/content' },
        { icon: CalendarDays, label: 'Schedule', href: '/coach/schedule' },
    ]

    // TOOLS
    const toolItems = [
        { icon: MessageCircle, label: 'Messages', href: '/coach/messages' },
        { icon: LifeBuoy, label: 'Support', href: '/coach/support' },
        { icon: Bell, label: 'Notifications', href: '/coach/notifications' },
        { icon: MessageCircle, label: 'Broadcast', href: '/coach/broadcast' },
        { icon: FormInput, label: 'Forms', href: '/coach/forms' },
        { icon: Store, label: 'Marketplace', href: '/coach/marketplace' },
        { icon: Activity, label: 'Analytics', href: '/coach/analytics' },
    ]

    // ACCOUNT
    const accountItems = [
        { icon: Settings, label: 'Settings', href: '/coach/settings' },
    ]

    return (
        <>
            <button
                type="button"
                aria-label="Close coach navigation"
                onClick={closeMobileNav}
                className={cn(
                    'fixed inset-0 z-40 bg-black/45 transition-opacity lg:hidden',
                    isMobileNavOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
                )}
            />

            <aside
                ref={asideRef}
                onClick={handleSidebarSurfaceClick}
                className={cn(
                    'fixed top-0 left-0 h-screen z-50 bg-(--sidebar-bg) border-r border-(--sidebar-border) overflow-y-auto flex flex-col',
                    'transition-[width,transform] duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]',
                    '[&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]',
                    'w-[280px] sm:w-[320px] lg:w-[240px]',
                    isCollapsed ? 'lg:w-[64px]' : '',
                    isMobileNavOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
                )}
            >
            {/* 1. Logo Header */}
            <div className="h-[72px] px-4 flex items-center gap-[10px] shrink-0">
                <div className="w-[32px] h-[32px] shrink-0 rounded-[10px] bg-slate-800 flex items-center justify-center shadow-sm">
                    <span className="font-display font-bold text-[14px] text-white">CO</span>
                </div>
                {!isCollapsed && (
                    <span className="font-display font-black text-[20px] tracking-tight text-(--text-primary)">
                        SF Coach
                    </span>
                )}
            </div>

            {/* 2. User Block */}
            <div className="px-4 py-3 flex items-center gap-[10px] shrink-0 overflow-hidden">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                    src={user?.avatar || "https://api.dicebear.com/7.x/notionists/svg?seed=CO"}
                    alt="Avatar"
                    className="w-[34px] h-[34px] rounded-full object-cover shrink-0 border border-(--border-subtle)"
                />
                {!isCollapsed && (
                    <div className="flex flex-col flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                            <span className="font-body font-semibold text-[14px] text-(--text-primary) leading-none truncate">
                                {user?.name || "Coach"}
                            </span>
                            <span className="h-[18px] shrink-0 px-2 rounded-full bg-slate-800/10 text-slate-800 font-display font-bold text-[10px] uppercase flex items-center justify-center">
                                COACH
                            </span>
                        </div>
                        <span className="font-body font-normal text-[12px] text-(--text-tertiary) mt-[2px] truncate">
                            @{user?.email?.split('@')[0] || "coach"}
                        </span>
                    </div>
                )}
            </div>

            {/* Separator */}
            <div className="h-[1px] bg-(--border-subtle) mx-4 my-2 shrink-0" />

            {/* Navigation Lists */}
            <nav className="flex-1 flex flex-col pt-1 pb-4 gap-[2px]">
                
                {/* MAIN */}
                {!isCollapsed && (
                    <div className="mt-2 mx-4 mb-2 flex justify-between items-center shrink-0">
                        <span className="font-display font-semibold text-[11px] uppercase tracking-wider text-(--text-tertiary)">Main</span>
                    </div>
                )}
                {mainItems.map((item) => {
                    const isActive = pathname === item.href || (item.href !== '/coach' && pathname.startsWith(item.href))
                    return (
                    <NavItem
                        key={item.label}
                        {...item}
                        isActive={isActive}
                        isCollapsed={isCollapsed}
                        onClick={handleLinkClick}
                        onMouseEnter={() => prefetchOnIntent(item.href)}
                    />
                )})}

                {/* TOOLS */}
                {!isCollapsed && (
                    <div className="mt-4 mx-4 mb-2 flex justify-between items-center shrink-0">
                        <span className="font-display font-semibold text-[11px] uppercase tracking-wider text-(--text-tertiary)">Tools</span>
                    </div>
                )}
                {toolItems.map((item) => {
                    const isActive = pathname.startsWith(item.href)
                    return (
                    <NavItem
                        key={item.label}
                        {...item}
                        isActive={isActive}
                        isCollapsed={isCollapsed}
                        onClick={handleLinkClick}
                        onMouseEnter={() => prefetchOnIntent(item.href)}
                    />
                )})}

                {/* ACCOUNT */}
                {!isCollapsed && (
                    <div className="mt-4 mx-4 mb-2 flex justify-between items-center shrink-0">
                        <span className="font-display font-semibold text-[11px] uppercase tracking-wider text-(--text-tertiary)">Account</span>
                    </div>
                )}
                {accountItems.map((item) => {
                    const isActive = pathname.startsWith(item.href)
                    return (
                    <NavItem
                        key={item.label}
                        {...item}
                        isActive={isActive}
                        isCollapsed={isCollapsed}
                        onClick={handleLinkClick}
                        onMouseEnter={() => prefetchOnIntent(item.href)}
                    />
                )})}

                {/* Separator before logout */}
                <div className="mt-auto pt-4 relative">
                    <div className="h-[1px] bg-(--border-subtle) mx-4 my-4" />

                    <div className="relative group/navitem w-full">
                        <button
                            onClick={handleLogout}
                            className={cn(
                                'flex items-center h-[44px] px-3 mx-2 my-0.5 rounded-[10px] gap-2.5 transition-all w-[calc(100%-16px)] text-(--text-secondary) hover:bg-red-500/10 hover:text-red-500 cursor-pointer',
                                isCollapsed ? 'justify-center mx-1 px-0 w-[calc(100%-8px)]' : ''
                            )}
                        >
                            <LogOut className="w-[18px] h-[18px] shrink-0" />
                            {!isCollapsed && <span className="text-[14px]">Log Out</span>}
                        </button>
                        {isCollapsed && (
                            <div className="hidden lg:block fixed left-[72px] mt-[-34px] px-2.5 py-1.5 bg-(--bg-elevated) border border-(--border-default) rounded-md text-[13px] font-medium text-(--text-primary) shadow-lg opacity-0 pointer-events-none group-hover/navitem:opacity-100 transition-opacity whitespace-nowrap z-50">
                                Log Out
                            </div>
                        )}
                    </div>
                </div>
            </nav>

            {/* Collapse Toggle */}
            <button
                onClick={(e) => {
                    e.stopPropagation()
                    toggleSidebar()
                }}
                className="hidden lg:flex fixed bottom-[24px] z-50 items-center justify-center w-[24px] h-[24px] rounded-full bg-(--bg-elevated) border border-(--border-default) text-(--text-secondary) hover:text-(--text-primary) hover:scale-110 shadow-sm transition-all duration-300 cursor-pointer"
                style={{
                    left: isCollapsed ? '52px' : '228px',
                    transform: isCollapsed ? 'rotate(180deg)' : 'none',
                }}
            >
                <ChevronLeft className="w-[14px] h-[14px]" />
            </button>
            </aside>
        </>
    )
}
