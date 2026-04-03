/**
 * useCommunityStore.ts
 * Manages the community social feed, challenges, and leaderboard state (Twitter Parity).
 */
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { CommunityPost, Challenge } from '@/types'
import { createClient } from '@/lib/supabase/client'
import { isSupabaseAuthEnabled } from '@/lib/supabase/auth'

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
                const supabase = createClient()
                const { data: authData, error: authError } = await supabase.auth.getUser()
                const userId = authData.user?.id

                if (authError || !userId) {
                    set({ isLoading: false, error: authError?.message || 'User not authenticated.' })
                    return
                }

                try {
                    const posts = await fetchCommunityFeed(userId)
                    set({ posts, isLoading: false, error: null })
                } catch (error) {
                    const message = error instanceof Error ? error.message : 'Unable to load community feed.'
                    set({ isLoading: false, error: message })
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
                    const supabase = createClient()
                    const payload = {
                        user_id: post.userId,
                        content: post.content,
                        post_type: post.type,
                        media_urls: post.mediaUrls || [],
                        poll: post.poll || null,
                        workout_ref: post.workoutRef || null,
                        meal_ref: post.mealRef || null,
                        pr_ref: post.prRef || null,
                    }

                    const { data, error } = await (supabase as any)
                        .from('community_posts')
                        .insert(payload)
                        .select('id, created_at')
                        .single()

                    if (error) {
                        set({ error: error.message })
                        return
                    }

                    if (data?.id) {
                        set((state) => ({
                            posts: state.posts.map((existingPost) =>
                                existingPost.id === tempId
                                    ? {
                                        ...existingPost,
                                        id: data.id as string,
                                        postedAt: (data.created_at as string) || existingPost.postedAt,
                                    }
                                    : existingPost
                            )
                        }))
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
                    const supabase = createClient()

                    if (shouldLike) {
                        const { error } = await (supabase as any)
                            .from('community_post_likes')
                            .insert({ post_id: postId, user_id: userId })
                        if (error) set({ error: error.message })
                        return
                    }

                    const { error } = await (supabase as any)
                        .from('community_post_likes')
                        .delete()
                        .eq('post_id', postId)
                        .eq('user_id', userId)

                    if (error) set({ error: error.message })
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
                        const supabase = createClient()
                        const payload = {
                            user_id: userId,
                            content: originalPost.content,
                            post_type: originalPost.type,
                            media_urls: originalPost.mediaUrls || [],
                            poll: originalPost.poll || null,
                            workout_ref: originalPost.workoutRef || null,
                            meal_ref: originalPost.mealRef || null,
                            pr_ref: originalPost.prRef || null,
                            repost_of_id: postId,
                        }

                        const { error } = await (supabase as any)
                            .from('community_posts')
                            .insert(payload)

                        if (error) set({ error: error.message })
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
                    const supabase = createClient()
                    const payload = {
                        user_id: comment.authorId,
                        parent_id: postId,
                        content: comment.content,
                        post_type: 'text',
                    }

                    const { error } = await (supabase as any)
                        .from('community_posts')
                        .insert(payload)

                    if (error) set({ error: error.message })
                })()
            },

            deletePost: (postId) => {
                const previous = get().posts
                set((state) => ({
                    posts: state.posts.filter((post) => post.id !== postId)
                }))

                if (!isSupabaseAuthEnabled() || !isUuid(postId)) return

                void (async () => {
                    const supabase = createClient()
                    const { data: authData } = await supabase.auth.getUser()
                    const userId = authData.user?.id
                    if (!userId) return

                    const { error } = await (supabase as any)
                        .from('community_posts')
                        .update({ deleted_at: new Date().toISOString() })
                        .eq('id', postId)
                        .eq('user_id', userId)

                    if (error) {
                        set({ posts: previous, error: error.message })
                    }
                })()
            },
        }),
        { name: 'superfit-community-storage-v3' }
    )
)

async function fetchCommunityFeed(currentUserId: string): Promise<CommunityPost[]> {
    const supabase = createClient()

    const { data: postsData, error: postsError } = await (supabase as any)
        .from('community_posts')
        .select('id,user_id,content,post_type,media_urls,poll,workout_ref,meal_ref,pr_ref,created_at,parent_id,repost_of_id,profile:profiles(full_name,avatar_url,role,email)')
        .is('deleted_at', null)
        .is('parent_id', null)
        .is('repost_of_id', null)
        .order('created_at', { ascending: false })
        .limit(100)

    if (postsError) throw new Error(postsError.message)

    const posts = Array.isArray(postsData) ? postsData : []
    const postIds = posts.map((row) => row.id as string).filter(Boolean)

    const likesByPost = new Map<string, number>()
    const likedByMe = new Set<string>()
    const commentsByPost = new Map<string, number>()
    const repostsByPost = new Map<string, number>()

    if (postIds.length) {
        const { data: likesData, error: likesError } = await (supabase as any)
            .from('community_post_likes')
            .select('post_id,user_id')
            .in('post_id', postIds)

        if (likesError) throw new Error(likesError.message)

        for (const like of likesData || []) {
            const postId = like.post_id as string
            likesByPost.set(postId, (likesByPost.get(postId) || 0) + 1)
            if ((like.user_id as string) === currentUserId) likedByMe.add(postId)
        }

        const { data: commentsData, error: commentsError } = await (supabase as any)
            .from('community_posts')
            .select('id,parent_id')
            .is('deleted_at', null)
            .in('parent_id', postIds)

        if (commentsError) throw new Error(commentsError.message)

        for (const comment of commentsData || []) {
            const parentId = comment.parent_id as string
            commentsByPost.set(parentId, (commentsByPost.get(parentId) || 0) + 1)
        }

        const { data: repostData, error: repostError } = await (supabase as any)
            .from('community_posts')
            .select('id,repost_of_id')
            .is('deleted_at', null)
            .in('repost_of_id', postIds)

        if (repostError) throw new Error(repostError.message)

        for (const repost of repostData || []) {
            const sourceId = repost.repost_of_id as string
            repostsByPost.set(sourceId, (repostsByPost.get(sourceId) || 0) + 1)
        }
    }

    return posts.map((row) => {
        const profile = (row.profile || {}) as { full_name?: string | null; avatar_url?: string | null; role?: string | null; email?: string | null }
        const postId = row.id as string
        const userId = row.user_id as string

        const emailHandle = profile.email ? String(profile.email).split('@')[0] : userId.slice(0, 8)
        const userName = profile.full_name || 'SuperFit User'

        return {
            id: postId,
            userId,
            userName,
            userHandle: `@${emailHandle}`,
            userAvatar: profile.avatar_url || `https://api.dicebear.com/7.x/notionists/svg?seed=${userId}`,
            isCoach: profile.role === 'coach',
            type: normalizePostType(row.post_type),
            content: String(row.content || ''),
            mediaUrls: Array.isArray(row.media_urls) ? row.media_urls.map((value: unknown) => String(value)) : undefined,
            poll: (row.poll as CommunityPost['poll']) || undefined,
            workoutRef: (row.workout_ref as CommunityPost['workoutRef']) || undefined,
            mealRef: (row.meal_ref as CommunityPost['mealRef']) || undefined,
            prRef: (row.pr_ref as CommunityPost['prRef']) || undefined,
            likes: likesByPost.get(postId) || 0,
            comments: commentsByPost.get(postId) || 0,
            reposts: repostsByPost.get(postId) || 0,
            views: 0,
            isLiked: likedByMe.has(postId),
            postedAt: String(row.created_at),
        } satisfies CommunityPost
    })
}

function normalizePostType(type: unknown): CommunityPost['type'] {
    if (type === 'workout' || type === 'meal' || type === 'progress' || type === 'text' || type === 'pr' || type === 'challenge') {
        return type
    }
    return 'text'
}

function isUuid(value: string): boolean {
    return UUID_REGEX.test(value)
}
