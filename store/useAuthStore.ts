/**
 * useAuthStore.ts
 * Manages authentication state with hardcoded accounts for MVP.
 * Provides login, signup (registration), and logout flows.
 */
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { getMockUser } from '@/lib/mockData'
import { UserProfile } from '@/types'

// Hardcoded demo accounts (MVP - no real backend)
const HARDCODED_ACCOUNTS: Array<{ email: string; password: string; name: string; role: 'user' | 'coach' | 'admin' }> = [
    { email: 'demo@superfit.com', password: 'demo123', name: 'Demo User', role: 'user' },
    { email: 'coach@superfit.com', password: 'coach123', name: 'Coach Marcus', role: 'coach' },
    { email: 'admin@superfit.com', password: 'admin123', name: 'Admin User', role: 'admin' },
]

interface AuthState {
    isAuthenticated: boolean
    isLoading: boolean
    error: string | null
    user: UserProfile | null
    registeredEmails: string[]  // Track newly registered emails

    login: (email: string, password: string) => Promise<boolean>
    signup: (name: string, email: string, password: string) => Promise<boolean>
    logout: () => void
    clearError: () => void
    updateProfile: (partial: Partial<UserProfile>) => void
}

export const useAuthStore = create<AuthState>()(
    persist(
        (set, get) => ({
            isAuthenticated: false,
            isLoading: false,
            error: null,
            user: null,
            registeredEmails: [],

            login: async (email, password) => {
                set({ isLoading: true, error: null })

                // Simulate network latency
                await new Promise(resolve => setTimeout(resolve, 800))

                // Check hardcoded accounts first
                const account = HARDCODED_ACCOUNTS.find(a => a.email === email && a.password === password)

                // Check dynamically registered accounts (same password accepted for demo)
                const { registeredEmails } = get()
                const isDynamicAccount = registeredEmails.includes(email)

                if (!account && !isDynamicAccount) {
                    set({ isLoading: false, error: 'Invalid email or password. Try demo@superfit.com / demo123' })
                    return false
                }

                // Build user profile from mock + account
                const baseUser = getMockUser()
                const userProfile: UserProfile = {
                    ...baseUser,
                    email,
                    name: account?.name || email.split('@')[0],
                    isCoach: account?.role === 'coach',
                    isPro: account?.role !== 'user' ? true : baseUser.isPro,
                    role: account?.role || 'user'
                }

                set({ user: userProfile, isAuthenticated: true, isLoading: false, error: null })
                return true
            },

            signup: async (name, email, password) => {
                set({ isLoading: true, error: null })

                await new Promise(resolve => setTimeout(resolve, 800))

                const { registeredEmails } = get()

                // Check if email already in use
                if (registeredEmails.includes(email) || HARDCODED_ACCOUNTS.find(a => a.email === email)) {
                    set({ isLoading: false, error: 'Email already in use. Please sign in instead.' })
                    return false
                }

                if (password.length < 6) {
                    set({ isLoading: false, error: 'Password must be at least 6 characters.' })
                    return false
                }

                // Register and log in
                const baseUser = getMockUser()
                const newUser: UserProfile = {
                    ...baseUser,
                    id: Math.random().toString(36).slice(2),
                    name,
                    email,
                    onboardingComplete: false,  // New users go through onboarding
                }

                set({
                    user: newUser,
                    isAuthenticated: true,
                    isLoading: false,
                    error: null,
                    registeredEmails: [...registeredEmails, email]
                })
                return true
            },

            logout: () => {
                set({ user: null, isAuthenticated: false, error: null })
            },

            clearError: () => set({ error: null }),

            updateProfile: (partial) => {
                set(state => ({
                    user: state.user ? { ...state.user, ...partial } : null
                }))
            }
        }),
        { name: 'superfit-auth-storage' }
    )
)
