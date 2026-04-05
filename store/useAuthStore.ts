/**
 * useAuthStore.ts
 * Manages authentication state with Supabase auth.
 * Provides login, signup, logout, and profile/onboarding flows.
 */
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { getMockUser } from '@/lib/mockData'
import { calculateBMR, calculateProteinTarget, calculateTDEE, calculateWaterGoal } from '@/lib/calculations'
import { createClient } from '@/lib/supabase/client'
import { ActivityLevel, DietaryPreference, ExercisePreference, FitnessGoal, Sex, UserProfile } from '@/types'
import type { Database } from '@/types/supabase'
import {
    isSupabaseAuthEnabled,
    signInWithSupabase,
    signOutWithSupabase,
    signUpWithSupabaseMetadata
} from '@/lib/supabase/auth'
import type { RealtimeChannel } from '@supabase/supabase-js'

interface AuthState {
    isAuthenticated: boolean
    isLoading: boolean
    error: string | null
    user: UserProfile | null

    initializeAuth: () => Promise<void>
    login: (email: string, password: string) => Promise<boolean>
    signup: (name: string, email: string, password: string, role?: 'user' | 'coach') => Promise<boolean>
    completeOnboarding: (data: OnboardingInput) => Promise<boolean>
    recalculateTargets: () => Promise<void>
    logout: () => void
    clearError: () => void
    updateProfile: (partial: Partial<UserProfile>) => void
}

type ProfileRow = Database['public']['Tables']['profiles']['Row']

interface OnboardingInput {
    name: string
    age: number
    sex: Sex
    height: number
    currentWeight: number
    goalWeight: number
    goal: FitnessGoal
    activityLevel: ActivityLevel
    weeklyWorkouts: number
    dietaryPreference: DietaryPreference
    exercisePreferences: ExercisePreference[]
}

let profileBroadcastChannel: BroadcastChannel | null = null
let profileBroadcastBound = false
let profileRealtimeChannel: RealtimeChannel | null = null
let profileRealtimeUserId: string | null = null
let authInitializeInFlight: Promise<void> | null = null
let authLastInitializedAt = 0

const AUTH_INIT_CACHE_MS = 60_000

function bindProfileBroadcast(set: (partial: Partial<AuthState>) => void, get: () => AuthState) {
    if (typeof window === 'undefined') return
    if (profileBroadcastBound) return

    if (typeof window.BroadcastChannel === 'undefined') return

    profileBroadcastChannel = new window.BroadcastChannel('superfit-profile-sync')
    profileBroadcastChannel.onmessage = (event: MessageEvent) => {
        const incoming = event.data as Partial<UserProfile> | null
        if (!incoming) return

        const current = get().user
        if (!current) return

        set({ user: { ...current, ...incoming } })
    }
    profileBroadcastBound = true
}

async function syncProfileFromServer(userId: string, set: (partial: Partial<AuthState>) => void) {
    if (!isSupabaseAuthEnabled()) return
    if (!userId) return

    const supabase = createClient()
    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (!user?.id || user.id !== userId) return

    const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle()

    const mapped = mapUserProfile(user.id, user.email || '', profile || null, user.user_metadata)
    set({ user: mapped })
}

function bindProfileRealtime(userId: string, set: (partial: Partial<AuthState>) => void) {
    if (!isSupabaseAuthEnabled()) return
    if (!userId) return
    if (profileRealtimeChannel && profileRealtimeUserId === userId) return

    if (profileRealtimeChannel) {
        profileRealtimeChannel.unsubscribe()
        profileRealtimeChannel = null
        profileRealtimeUserId = null
    }

    const supabase = createClient()
    const refresh = () => {
        void syncProfileFromServer(userId, set)
    }

    profileRealtimeChannel = supabase
        .channel(`profile-live-${userId}`)
        .on(
            'postgres_changes',
            {
                event: '*',
                schema: 'public',
                table: 'profiles',
                filter: `id=eq.${userId}`,
            },
            refresh,
        )
        .subscribe()

    profileRealtimeUserId = userId
}

export const useAuthStore = create<AuthState>()(
    persist(
        (set, get) => ({
            isAuthenticated: false,
            isLoading: true,
            error: null,
            user: null,

            initializeAuth: async () => {
                if (!isSupabaseAuthEnabled()) {
                    set({ isLoading: false })
                    return
                }

                const currentState = get()
                const now = Date.now()

                if (
                    currentState.isAuthenticated &&
                    currentState.user?.id &&
                    now - authLastInitializedAt < AUTH_INIT_CACHE_MS
                ) {
                    if (profileRealtimeUserId !== currentState.user.id) {
                        bindProfileRealtime(currentState.user.id, set)
                    }
                    set({ isLoading: false, error: null })
                    return
                }

                if (authInitializeInFlight) {
                    await authInitializeInFlight
                    return
                }

                bindProfileBroadcast(set, get)

                authInitializeInFlight = (async () => {
                    set({ isLoading: true, error: null })

                    const supabase = createClient()
                    const {
                        data: { user },
                        error,
                    } = await supabase.auth.getUser()

                    if (error || !user) {
                        set({ isAuthenticated: false, user: null, isLoading: false, error: error?.message || null })
                        authLastInitializedAt = Date.now()
                        return
                    }

                    const { data: profile } = await supabase
                        .from('profiles')
                        .select('*')
                        .eq('id', user.id)
                        .maybeSingle()

                    const mapped = mapUserProfile(user.id, user.email || '', profile || null, user.user_metadata)

                    set({ isAuthenticated: true, user: mapped, isLoading: false, error: null })
                    authLastInitializedAt = Date.now()
                    bindProfileRealtime(user.id, set)
                })()

                try {
                    await authInitializeInFlight
                } finally {
                    authInitializeInFlight = null
                }
            },

            login: async (email, password) => {
                set({ isLoading: true, error: null })

                if (!isSupabaseAuthEnabled()) {
                    set({
                        isLoading: false,
                        error: 'Authentication is not configured. Enable Supabase auth to sign in.',
                    })
                    return false
                }

                const { data, error } = await signInWithSupabase(email, password)

                if (error || !data.user) {
                    set({ isLoading: false, error: error?.message || 'Unable to authenticate user.' })
                    return false
                }

                const supabase = createClient()
                const { data: profile } = await supabase
                    .from('profiles')
                    .select('*')
                    .eq('id', data.user.id)
                    .maybeSingle()

                const userProfile = mapUserProfile(data.user.id, data.user.email || email, profile || null, data.user.user_metadata)

                set({ user: userProfile, isAuthenticated: true, isLoading: false, error: null })
                authLastInitializedAt = Date.now()
                return true
            },

            signup: async (name, email, password, role = 'user') => {
                set({ isLoading: true, error: null })

                if (!isSupabaseAuthEnabled()) {
                    set({
                        isLoading: false,
                        error: 'Authentication is not configured. Enable Supabase auth to create an account.',
                    })
                    return false
                }

                const initialAccountStatus = role === 'coach' ? 'pending_review' : 'active'
                const { data, error } = await signUpWithSupabaseMetadata(email, password, name, {
                    role,
                    account_status: initialAccountStatus,
                })

                if (error) {
                    set({ isLoading: false, error: error.message })
                    return false
                }

                const userId = data.user?.id || Math.random().toString(36).slice(2)
                const newUser = mapUserProfile(userId, email, {
                    ...mockProfileShape(),
                    id: userId,
                    email,
                    full_name: name,
                    onboarding_complete: false,
                    role,
                }, data.user?.user_metadata)

                if (data.user?.id) {
                    const supabase = createClient()
                    await supabase.from('profiles').upsert(
                        {
                            id: data.user.id,
                            email,
                            full_name: name,
                            role,
                            account_status: initialAccountStatus,
                            onboarding_complete: false,
                        },
                        { onConflict: 'id' }
                    )
                }

                set({
                    user: newUser,
                    isAuthenticated: true,
                    isLoading: false,
                    error: null
                })
                authLastInitializedAt = Date.now()
                return true
            },

            completeOnboarding: async (data) => {
                const currentUser = get().user
                if (!currentUser) {
                    set({ error: 'Unable to complete onboarding without an authenticated user.' })
                    return false
                }

                const targets = computeTargets(data.currentWeight, data.height, data.age, data.sex, data.goal, data.activityLevel)
                const nextUser: UserProfile = {
                    ...currentUser,
                    name: data.name,
                    age: data.age,
                    sex: data.sex,
                    height: data.height,
                    currentWeight: data.currentWeight,
                    goalWeight: data.goalWeight,
                    goal: data.goal,
                    activityLevel: data.activityLevel,
                    weeklyWorkouts: data.weeklyWorkouts,
                    dietaryPreference: data.dietaryPreference,
                    exercisePreferences: data.exercisePreferences,
                    onboardingComplete: true,
                    ...targets,
                }

                set({ user: nextUser, error: null })

                if (!isSupabaseAuthEnabled()) {
                    return true
                }

                const supabase = createClient()
                const payload: Database['public']['Tables']['profiles']['Update'] = {
                    full_name: data.name,
                    age: data.age,
                    sex: data.sex,
                    height_cm: data.height,
                    current_weight_kg: data.currentWeight,
                    goal_weight_kg: data.goalWeight,
                    goal: data.goal,
                    activity_level: data.activityLevel,
                    weekly_workouts: data.weeklyWorkouts,
                    dietary_preference: data.dietaryPreference,
                    exercise_preferences: data.exercisePreferences,
                    bmr: Math.round(targets.bmr),
                    tdee: Math.round(targets.tdee),
                    daily_calorie_target: targets.dailyCalorieTarget,
                    protein_target: targets.proteinTarget,
                    carb_target: targets.carbTarget,
                    fat_target: targets.fatTarget,
                    fiber_target: targets.fiberTarget,
                    water_target_ml: targets.waterTargetMl,
                    onboarding_complete: true,
                }

                const { error } = await supabase.from('profiles').update(payload).eq('id', currentUser.id)
                if (error) {
                    set({ error: error.message })
                    return false
                }

                return true
            },

            recalculateTargets: async () => {
                const currentUser = get().user
                if (!currentUser) return

                const targets = computeTargets(
                    currentUser.currentWeight,
                    currentUser.height,
                    currentUser.age,
                    currentUser.sex,
                    currentUser.goal,
                    currentUser.activityLevel
                )

                get().updateProfile({
                    ...targets,
                })
            },

            logout: () => {
                if (isSupabaseAuthEnabled()) {
                    void signOutWithSupabase()
                }
                set({ user: null, isAuthenticated: false, error: null })
                authLastInitializedAt = 0
            },

            clearError: () => set({ error: null }),

            updateProfile: (partial) => {
                const currentUser = get().user
                if (!currentUser) return

                const next = { ...currentUser, ...partial }
                set({ user: next })

                if (profileBroadcastChannel) {
                    profileBroadcastChannel.postMessage(partial)
                }

                if (!isSupabaseAuthEnabled()) return

                const supabase = createClient()
                const payload: Database['public']['Tables']['profiles']['Update'] = {
                    full_name: partial.name,
                    email: partial.email,
                    avatar_url: partial.avatar,
                    age: partial.age,
                    sex: partial.sex,
                    height_cm: partial.height,
                    current_weight_kg: partial.currentWeight,
                    goal_weight_kg: partial.goalWeight,
                    goal: partial.goal,
                    activity_level: partial.activityLevel,
                    weekly_workouts: partial.weeklyWorkouts,
                    session_duration: partial.sessionDuration,
                    dietary_preference: partial.dietaryPreference,
                    exercise_preferences: partial.exercisePreferences,
                    measurement_system: partial.measurementSystem,
                    timezone: partial.timezone,
                    bmr: partial.bmr,
                    tdee: partial.tdee,
                    daily_calorie_target: partial.dailyCalorieTarget,
                    protein_target: partial.proteinTarget,
                    carb_target: partial.carbTarget,
                    fat_target: partial.fatTarget,
                    fiber_target: partial.fiberTarget,
                    water_target_ml: partial.waterTargetMl,
                    onboarding_complete: partial.onboardingComplete,
                }

                void supabase.from('profiles').update(payload).eq('id', currentUser.id)
            }
        }),
        {
            name: 'superfit-auth-storage',
            // Persist only durable auth identity fields; keep transient UI/loading state in-memory.
            partialize: (state) => ({
                isAuthenticated: state.isAuthenticated,
                user: state.user,
            }),
        }
    )
)

function computeTargets(
    weight: number,
    height: number,
    age: number,
    sex: Sex,
    goal: FitnessGoal,
    activityLevel: ActivityLevel
) {
    const bmr = calculateBMR(weight, height, age, sex)
    const tdee = calculateTDEE(bmr, activityLevel)
    const deficitSurplus = goal === 'weight_loss' ? -500 : goal === 'muscle_gain' ? 300 : 0
    const dailyCalorieTarget = Math.max(1200, Math.round(tdee + deficitSurplus))
    const proteinTarget = Math.round(calculateProteinTarget(weight, goal, activityLevel))
    const fatTarget = Math.round((dailyCalorieTarget * 0.28) / 9)
    const carbTarget = Math.round((dailyCalorieTarget - (proteinTarget * 4) - (fatTarget * 9)) / 4)
    const fiberTarget = sex === 'male' ? 38 : 25
    const waterTargetMl = calculateWaterGoal(weight, activityLevel)

    return {
        bmr,
        tdee,
        dailyCalorieTarget,
        proteinTarget,
        carbTarget,
        fatTarget,
        fiberTarget,
        waterTargetMl,
    }
}

function mapUserProfile(
    userId: string,
    email: string,
    profile: ProfileRow | null,
    userMetadata?: Record<string, unknown>
): UserProfile {
    const base = getMockUser()
    const role = (profile?.role as UserProfile['role'] | undefined) || (userMetadata?.role as UserProfile['role'] | undefined) || 'user'

    return {
        ...base,
        id: userId,
        email,
        name: profile?.full_name || (userMetadata?.full_name as string | undefined) || email.split('@')[0],
        avatar: profile?.avatar_url || base.avatar,
        role,
        accountStatus: (profile?.account_status as UserProfile['accountStatus']) || 'active',
        isCoach: role === 'coach',
        isPro: Boolean(profile?.is_premium ?? base.isPro),
        onboardingComplete: profile?.onboarding_complete ?? base.onboardingComplete,
        age: profile?.age ?? base.age,
        sex: (profile?.sex as Sex | null) ?? base.sex,
        height: Number(profile?.height_cm ?? base.height),
        currentWeight: Number(profile?.current_weight_kg ?? base.currentWeight),
        goalWeight: Number(profile?.goal_weight_kg ?? base.goalWeight),
        goal: (profile?.goal as FitnessGoal | null) ?? base.goal,
        activityLevel: (profile?.activity_level as ActivityLevel | null) ?? base.activityLevel,
        weeklyWorkouts: profile?.weekly_workouts ?? base.weeklyWorkouts,
        sessionDuration: profile?.session_duration ?? base.sessionDuration,
        dietaryPreference: (profile?.dietary_preference as DietaryPreference | null) ?? base.dietaryPreference,
        exercisePreferences: (profile?.exercise_preferences as ExercisePreference[] | null) ?? base.exercisePreferences,
        measurementSystem: profile?.measurement_system ?? base.measurementSystem,
        timezone: profile?.timezone ?? base.timezone,
        bmr: Number(profile?.bmr ?? base.bmr),
        tdee: Number(profile?.tdee ?? base.tdee),
        dailyCalorieTarget: profile?.daily_calorie_target ?? base.dailyCalorieTarget,
        proteinTarget: profile?.protein_target ?? base.proteinTarget,
        carbTarget: profile?.carb_target ?? base.carbTarget,
        fatTarget: profile?.fat_target ?? base.fatTarget,
        fiberTarget: profile?.fiber_target ?? base.fiberTarget,
        waterTargetMl: profile?.water_target_ml ?? base.waterTargetMl,
        joinDate: profile?.created_at ?? base.joinDate,
    }
}

function mockProfileShape(): ProfileRow {
    const now = new Date().toISOString()
    return {
        id: '',
        created_at: now,
        updated_at: now,
        email: '',
        full_name: null,
        username: null,
        avatar_url: null,
        role: 'user',
        account_status: 'active',
        is_premium: false,
        onboarding_complete: false,
        onboarding_completed: false,
        date_of_birth: null,
        biological_sex: null,
        fitness_goal: null,
        age: null,
        sex: null,
        height_cm: null,
        current_weight_kg: null,
        weight_kg: null,
        goal_weight_kg: null,
        goal: null,
        activity_level: null,
        weekly_workouts: null,
        session_duration: null,
        dietary_preference: null,
        exercise_preferences: null,
        measurement_system: 'metric',
        timezone: null,
        bmr: null,
        tdee: null,
        daily_calorie_target: null,
        protein_target: null,
        carb_target: null,
        fat_target: null,
        fiber_target: null,
        water_target_ml: null,
    }
}
