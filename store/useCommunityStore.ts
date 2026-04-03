/**
 * useCommunityStore.ts
 * Manages the community social feed, challenges, and leaderboard state (Twitter Parity).
 */
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { CommunityPost, Challenge } from '@/types'
import { isSupabaseAuthEnabled } from '@/lib/supabase/auth'
import { requestApi } from '@/lib/api/client'

export interface CommunityComment {
    id: string
    authorId: string
    authorName: string
    authorHandle: string
    authorAvatar: string
    content: string
    likes: number
    isLiked?: boolean
    timestamp: string
}

interface CommunityState {
    posts: CommunityPost[]
    challenges: Challenge[]
    isLoading: boolean
    error: string | null

    fetchPosts: () => Promise<void>
    addPost: (post: Omit<CommunityPost, 'id' | 'likes' | 'comments' | 'reposts' | 'views'>) => void
    likePost: (postId: string, userId: string) => void
    repostPost: (postId: string, userId: string, userName: string, userHandle: string) => void
    addComment: (postId: string, comment: Omit<CommunityComment, 'id' | 'likes' | 'isLiked'>) => void
    deletePost: (postId: string) => void
}

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

const MOCK_POSTS: CommunityPost[] = [
    {
        id: 'post_1',
        userId: 'user_2',
        userName: 'Sarah Jenkins',
        userHandle: '@sarahj_lifts',
        userAvatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&fit=crop',
        isCoach: false,
        isVerified: true,
        type: 'progress',
        content: 'Hit a new PR on squats today! 120kg for 3 reps. The new hypertrophy program is really paying off. 💪🔥',
        mediaUrls: ['https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=600&h=400&fit=crop&q=80'],
        likes: 124,
        comments: 12,
        reposts: 5,
        views: 3402,
        postedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    },
    {
        id: 'post_2',
        userId: 'user_3',
        userName: 'Mike Chen',
        userHandle: '@mike_runs',
        userAvatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&fit=crop',
        isCoach: false,
        type: 'text',
        content: 'Finished my first half marathon prep week. The SuperFit endurance plan was brutal but exactly what I needed. Looking forward to the long run on Sunday.',
        likes: 45,
        comments: 3,
        reposts: 0,
        views: 890,
        postedAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
    },
    {
        id: 'post_3',
        userId: 'coach_1',
        userName: 'Coach Marcus',
        userHandle: '@marcus_strength',
        userAvatar: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=100&fit=crop',
        isCoach: true,
        isVerified: true,
        type: 'text',
        content: 'What is your biggest struggle when it comes to hitting your daily protein target?',
        poll: {
            question: 'What is your biggest struggle when it comes to hitting your daily protein target?',
            options: [
                { id: 'opt_1', text: 'Too expensive', votes: 120 },
                { id: 'opt_2', text: 'Tired of shakes', votes: 340 },
                { id: 'opt_3', text: 'Hard to track', votes: 85 },
                { id: 'opt_4', text: 'Vegan/Vegetarian limitations', votes: 210 },
            ],
            totalVotes: 755
        },
        likes: 512,
        comments: 89,
        reposts: 42,
        views: 12500,
        postedAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
    }
]

export const useCommunityStore = create<CommunityState>()(
    persist(
        (set, get) => ({
            posts: MOCK_POSTS,
            challenges: [],
            isLoading: false,
            error: null,

            fetchPosts: async () => {
                if (!isSupabaseAuthEnabled()) return

                set({ isLoading: true, error: null })
                try {
                    const response = await requestApi<{ posts: CommunityPost[] }>('/api/v1/community/posts')
                    set({ posts: response.data.posts, isLoading: false, error: null })
                } catch (error) {
                    set({ isLoading: false, error: getErrorMessage(error) })
                }
            },

            addPost: (post) => {
                const tempId = `post_${Date.now()}`
                set((state) => ({
                    posts: [{
                        ...post,
                        id: tempId,
                        likes: 0,
                        comments: 0,
                        reposts: 0,
                        views: 0,
                    }, ...state.posts]
                }))

                if (!isSupabaseAuthEnabled() || !isUuid(post.userId)) return

                void (async () => {
                    try {
                        const response = await requestApi<{ post: CommunityPost }>('/api/v1/community/posts', {
                            method: 'POST',
                            body: JSON.stringify({
                                content: post.content,
                                type: post.type,
                                mediaUrls: post.mediaUrls || [],
                                poll: post.poll || null,
                                workoutRef: post.workoutRef || null,
                                mealRef: post.mealRef || null,
                                prRef: post.prRef || null,
                            }),
                        })

                        const persistedPost = response.data.post
                        set((state) => ({
                            posts: state.posts.map((existingPost) =>
                                existingPost.id === tempId
                                    ? { ...existingPost, ...persistedPost }
                                    : existingPost
                            )
                        }))
                    } catch (error) {
                        set({ error: getErrorMessage(error) })
                    }
                })()
            },

            likePost: (postId, userId) => {
                let shouldLike = false

                set((state) => ({
                    posts: state.posts.map((post) => {
                        if (post.id !== postId) return post
                        shouldLike = !post.isLiked
                        return {
                            ...post,
                            isLiked: !post.isLiked,
                            likes: post.isLiked ? Math.max(0, post.likes - 1) : post.likes + 1,
                        }
                    })
                }))

                if (!isSupabaseAuthEnabled() || !isUuid(postId) || !isUuid(userId)) return

                void (async () => {
                    try {
                        if (shouldLike) {
                            await requestApi<{ liked: boolean; postId: string }>(`/api/v1/community/posts/${postId}/like`, {
                                method: 'POST',
                            })
                            return
                        }

                        await requestApi<{ liked: boolean; postId: string }>(`/api/v1/community/posts/${postId}/like`, {
                            method: 'DELETE',
                        })
                    } catch (error) {
                        set({ error: getErrorMessage(error) })
                    }
                })()
            },

            repostPost: (postId, userId, userName, userHandle) => set((state) => {
                const postIndex = state.posts.findIndex((post) => post.id === postId)
                if (postIndex === -1) return state

                const originalPost = state.posts[postIndex]
                const updatedPosts = [...state.posts]
                updatedPosts[postIndex] = { ...originalPost, isReposted: true, reposts: originalPost.reposts + 1 }

                if (isSupabaseAuthEnabled() && isUuid(postId) && isUuid(userId)) {
                    void (async () => {
                        try {
                            await requestApi<{ repostId: string; postId: string }>(`/api/v1/community/posts/${postId}/repost`, {
                                method: 'POST',
                            })
                        } catch (error) {
                            set({ error: getErrorMessage(error) })
                        }
                    })()
                }

                const repost: CommunityPost = {
                    ...originalPost,
                    id: `repost_${Date.now()}`,
                    repostedFrom: { userId, userName, userHandle },
                    postedAt: new Date().toISOString()
                }

                return { posts: [repost, ...updatedPosts] }
            }),

            addComment: (postId, comment) => {
                set((state) => ({
                    posts: state.posts.map((post) => {
                        if (post.id !== postId) return post
                        return {
                            ...post,
                            comments: post.comments + 1
                        }
                    })
                }))

                if (!isSupabaseAuthEnabled() || !isUuid(postId) || !isUuid(comment.authorId)) return

                void (async () => {
                    try {
                        await requestApi<{ comment: { id: string }; postId: string }>(`/api/v1/community/posts/${postId}/comments`, {
                            method: 'POST',
                            body: JSON.stringify({
                                content: comment.content,
                            }),
                        })
                    } catch (error) {
                        set({ error: getErrorMessage(error) })
                    }
                })()
            },

            deletePost: (postId) => {
                const previous = get().posts
                set((state) => ({
                    posts: state.posts.filter((post) => post.id !== postId)
                }))

                if (!isSupabaseAuthEnabled() || !isUuid(postId)) return

                void (async () => {
                    try {
                        await requestApi<{ deleted: boolean; id: string }>(`/api/v1/community/posts/${postId}`, {
                            method: 'DELETE',
                        })
                    } catch (error) {
                        set({ posts: previous, error: getErrorMessage(error) })
                    }
                })()
            },
        }),
        { name: 'superfit-community-storage-v3' }
    )
)

function isUuid(value: string): boolean {
    return UUID_REGEX.test(value)
}

function getErrorMessage(error: unknown): string {
    if (error instanceof Error) return error.message
    return 'An unexpected error occurred'
}
