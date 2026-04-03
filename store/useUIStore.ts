import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface UIState {
    isSidebarCollapsed: boolean
    isMobileNavOpen: boolean
    toggleSidebar: () => void
    setSidebarCollapsed: (collapsed: boolean) => void
    toggleMobileNav: () => void
    openMobileNav: () => void
    closeMobileNav: () => void
}

export const useUIStore = create<UIState>()(
    persist(
        (set) => ({
            isSidebarCollapsed: false,
            isMobileNavOpen: false,
            toggleSidebar: () => set((state) => ({ isSidebarCollapsed: !state.isSidebarCollapsed })),
            setSidebarCollapsed: (collapsed) => set({ isSidebarCollapsed: collapsed }),
            toggleMobileNav: () => set((state) => ({ isMobileNavOpen: !state.isMobileNavOpen })),
            openMobileNav: () => set({ isMobileNavOpen: true }),
            closeMobileNav: () => set({ isMobileNavOpen: false }),
        }),
        {
            name: 'superfit-ui-storage',
        }
    )
)
