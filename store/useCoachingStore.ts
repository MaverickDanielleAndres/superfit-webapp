import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type PostType = 'text' | 'image' | 'video' | 'workout' | 'meal_plan' | 'pdf' | 'challenge'

export interface CoachFeedPost {
    id: string
    coachId: string
    coachName: string
    coachAvatar?: string
    createdAt: string
    type: PostType
    content: string
    mediaUrl?: string
    workoutId?: string
    mealPlanId?: string
    documentUrl?: string
    documentName?: string
    challengeId?: string
    likes: number
    isLiked: boolean
    isSaved: boolean
    comments: CoachComment[]
}

export interface CoachComment {
    id: string
    authorId: string
    authorName: string
    authorAvatar?: string
    text: string
    createdAt: string
}

export interface FormCheckSubmission {
    id: string
    exerciseName: string
    notes: string
    videoUrl: string
    status: 'pending' | 'reviewed'
    createdAt: string
    coachFeedback?: string
    coachResponseVideoUrl?: string
    reviewedAt?: string
    reviewedBy?: string
}

export interface WeeklyCheckIn {
    id: string
    title: string
    status: 'pending' | 'submitted'
    createdAt: string
    submittedAt?: string
    questions: any[]
}

export interface AssignedProgram {
    id: string
    name: string
    week: number
    totalWeeks: number
    progressPercentage: number
}

interface SharingPermissions {
    weight: boolean
    nutrition: boolean
    progressPhotos: boolean
}

export interface CoachProfile {
    id: string
    name: string
    avatar?: string
    bio: string
    rating: number
    reviewCount: number
    tags: string[]
    pricing: {
        basic: number
        premium: number
        elite: number
    }
}

interface CoachingState {
    activeCoachId: string | null
    coaches: CoachProfile[]
    feedPosts: CoachFeedPost[]
    formCheckSubmissions: FormCheckSubmission[]
    pendingCheckIns: WeeklyCheckIn[]
    assignedPrograms: AssignedProgram[]
    sharingPermissions: SharingPermissions
    savedPosts: string[]
    
    // Actions
    subscribeToCoach: (coachId: string) => void
    unsubscribeFromCoach: () => void
    likePost: (postId: string) => void
    savePost: (postId: string) => void
    addComment: (postId: string, comment: string, user: any) => void
    submitFormCheck: (data: any) => void
    submitCheckIn: (checkInId: string, answers: any) => void
    updateSharingPermissions: (permissions: Partial<SharingPermissions>) => void
    loadInitialData: () => void
}

const mockCoaches: CoachProfile[] = [
    {
        id: 'c1',
        name: 'Alex Rivera',
        bio: 'Strength & Conditioning Specialist',
        rating: 4.9,
        reviewCount: 128,
        tags: ['Strength', 'Hypertrophy', 'Powerlifting'],
        pricing: { basic: 49, premium: 99, elite: 199 }
    },
    {
        id: 'c2',
        name: 'Sarah Chen',
        bio: 'Holistic Nutrition & Wellness Coach',
        rating: 4.8,
        reviewCount: 95,
        tags: ['Nutrition', 'Weight Loss', 'Flexibility'],
        pricing: { basic: 39, premium: 89, elite: 149 }
    }
]

const mockFeedPosts: CoachFeedPost[] = [
    {
        id: 'p1',
        coachId: 'c1',
        coachName: 'Alex Rivera',
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
        type: 'text',
        content: 'Stay hydrated! Aim for at least 3 liters of water today.',
        likes: 12,
        isLiked: false,
        isSaved: false,
        comments: []
    },
    {
        id: 'p2',
        coachId: 'c1',
        coachName: 'Alex Rivera',
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
        type: 'video',
        content: 'Check out this deadlift tutorial.',
        mediaUrl: 'https://vimeo.com/824804225',
        likes: 45,
        isLiked: true,
        isSaved: false,
        comments: [
            { id: 'c1', authorId: 'u1', authorName: 'John Doe', text: 'Great tips!', createdAt: new Date().toISOString() }
        ]
    },
    {
        id: 'p3',
        coachId: 'c1',
        coachName: 'Alex Rivera',
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(),
        type: 'workout',
        content: 'Leg Day Annihilation',
        workoutId: 'w1',
        likes: 89,
        isLiked: false,
        isSaved: true,
        comments: []
    },
    {
        id: 'p4',
        coachId: 'c1',
        coachName: 'Alex Rivera',
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 72).toISOString(),
        type: 'meal_plan',
        content: 'I updated your meal plan for the new hypertrophy block. High protein, slight surplus.',
        mealPlanId: 'mp1',
        likes: 15,
        isLiked: true,
        isSaved: true,
        comments: []
    },
    {
        id: 'p5',
        coachId: 'c1',
        coachName: 'Alex Rivera',
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 96).toISOString(),
        type: 'pdf',
        content: 'Here is the Supplement Guide PDF we discussed on our call.',
        documentUrl: '/mock.pdf',
        documentName: 'Supplement Protocol - Phase 2',
        likes: 30,
        isLiked: false,
        isSaved: true,
        comments: []
    }
]

export const useCoachingStore = create<CoachingState>()(
    persist(
        (set, get) => ({
            activeCoachId: 'c1', // Pre-assign for demo
            coaches: mockCoaches,
            feedPosts: mockFeedPosts,
            formCheckSubmissions: [
                {
                    id: 'fc1',
                    exerciseName: 'Squat',
                    notes: 'Is my depth okay?',
                    videoUrl: 'mock.mp4',
                    status: 'reviewed',
                    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 72).toISOString(),
                    coachFeedback: 'Depth looks great! Try to keep your chest up a bit more on the way up.',
                    reviewedAt: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(),
                    reviewedBy: 'Alex Rivera'
                }
            ],
            pendingCheckIns: [
                {
                    id: 'chk1',
                    title: 'End of Week Check-in',
                    status: 'pending',
                    createdAt: new Date().toISOString(),
                    questions: []
                }
            ],
            assignedPrograms: [
                {
                    id: 'prg1',
                    name: 'Hypertrophy Phase 1',
                    week: 2,
                    totalWeeks: 8,
                    progressPercentage: 25
                }
            ],
            sharingPermissions: {
                weight: true,
                nutrition: true,
                progressPhotos: false
            },
            savedPosts: ['p3'],

            subscribeToCoach: (coachId) => set({ activeCoachId: coachId }),
            unsubscribeFromCoach: () => set({ activeCoachId: null }),
            
            likePost: (postId) => set((state) => ({
                feedPosts: state.feedPosts.map(p => {
                    if (p.id === postId) {
                        return { ...p, isLiked: !p.isLiked, likes: p.isLiked ? p.likes - 1 : p.likes + 1 }
                    }
                    return p
                })
            })),
            
            savePost: (postId) => set((state) => {
                const isSaved = state.savedPosts.includes(postId)
                return {
                    savedPosts: isSaved ? state.savedPosts.filter(id => id !== postId) : [...state.savedPosts, postId],
                    feedPosts: state.feedPosts.map(p => p.id === postId ? { ...p, isSaved: !isSaved } : p)
                }
            }),

            addComment: (postId, text, user) => set((state) => ({
                feedPosts: state.feedPosts.map(p => {
                    if (p.id === postId) {
                        return {
                            ...p,
                            comments: [...p.comments, {
                                id: Date.now().toString(),
                                authorId: user?.id || 'u1',
                                authorName: user?.name || 'User',
                                authorAvatar: user?.avatar,
                                text,
                                createdAt: new Date().toISOString()
                            }]
                        }
                    }
                    return p
                })
            })),

            submitFormCheck: (data) => set((state) => ({
                formCheckSubmissions: [{
                    id: Date.now().toString(),
                    status: 'pending',
                    createdAt: new Date().toISOString(),
                    ...data
                }, ...state.formCheckSubmissions]
            })),

            submitCheckIn: (checkInId, answers) => set((state) => ({
                pendingCheckIns: state.pendingCheckIns.map(chk => 
                    chk.id === checkInId ? { ...chk, status: 'submitted', submittedAt: new Date().toISOString() } : chk
                )
            })),

            updateSharingPermissions: (perms) => set((state) => ({
                sharingPermissions: { ...state.sharingPermissions, ...perms }
            })),

            loadInitialData: () => set({ coaches: mockCoaches, feedPosts: mockFeedPosts })
        }),
        {
            name: 'superfit-coaching-storage'
        }
    )
)
